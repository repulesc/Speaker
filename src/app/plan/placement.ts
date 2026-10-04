import { DEFAULTS } from '../../engine/presets/defaults';
import type { Certainty, ObjectKind, Project, RoomObject, SetupVariant } from '../../engine/types';
import { newId } from '../state/ids';

/**
 * Moving things in the room. All functions mutate the project they are given, so they are meant
 * to run inside `workspace.edit()`. Everything is in metres. Moves are snapped to a 5 cm grid,
 * clamped to stay inside the room, and mark the item as placed by the user (certainty
 * 'estimated'), so the default placement stops following the room size.
 */

export const GRID = 0.05;
const CENTRE_SNAP = 0.04;
/** Left and right speakers keep at least this far from the centreline when mirrored. */
const MIN_HALF_GAP = 0.1;

const round = (v: number) => Math.round(v * 1e6) / 1e6;
export const snap = (value: number, step = GRID): number => round(Math.round(value / step) * step);
export const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), Math.max(min, max));

export interface RoomSize {
  W: number;
  L: number;
  H: number;
}

/** Used to clamp heights while the ceiling height is still unknown. */
export const ASSUMED_CEILING = 2.5;

/** Width and length are needed to place anything; an unknown ceiling height falls back to a typical 2.5 m. */
export function roomSize(project: Project): RoomSize | null {
  const { width, length, height } = project.room;
  if (width.value === null || length.value === null) return null;
  return { W: width.value, L: length.value, H: height.value ?? ASSUMED_CEILING };
}

export function activeVariant(project: Project): SetupVariant {
  const variant =
    project.variants.find((v) => v.id === project.activeVariantId) ?? project.variants[0];
  if (!variant) throw new Error('Project has no setup variants');
  return variant;
}

export function cabinet(project: Project) {
  const d = project.speaker.dimensions;
  return {
    w: d.w.value ?? DEFAULTS.speakerWidth,
    h: d.h.value ?? DEFAULTS.speakerHeight,
    d: d.d.value ?? DEFAULTS.speakerDepth,
  };
}

interface Target {
  x?: number;
  y?: number;
  z?: number;
}

/** Dragging snaps to the grid; typed values are taken exactly (`grid: false`). */
interface MoveOptions {
  grid?: boolean;
  /** Typed values keep a 'measured' certainty; a drag always becomes 'estimated'. */
  keepCertainty?: boolean;
}

const certaintyAfter = (current: Certainty | undefined, options: MoveOptions): Certainty =>
  options.keepCertainty && current === 'measured' ? 'measured' : 'estimated';

const snapper = (options: MoveOptions) => (v: number) =>
  options.grid === false ? round(v) : snap(v);

/** Moves one speaker (and its mirror image when the pair is locked). Returns false if the room size is unknown. */
export function moveSpeaker(
  project: Project,
  side: 'left' | 'right',
  to: Target,
  options: MoveOptions = {},
): boolean {
  const room = roomSize(project);
  if (!room) return false;
  const variant = activeVariant(project);
  const cab = cabinet(project);
  const mirrored = project.constraints.keepSymmetric;
  const current = variant.speakers[side].base;
  const fit = snapper(options);

  let x = fit(to.x ?? current.x);
  const y = clamp(fit(to.y ?? current.y), cab.d / 2, room.L - cab.d / 2);
  const z = clamp(fit(to.z ?? current.z), 0, room.H - cab.h);
  const lo = cab.w / 2;
  const hi = room.W - cab.w / 2;
  if (mirrored) {
    // Stay on this side of the centreline.
    const half = room.W / 2 - MIN_HALF_GAP;
    x = side === 'left' ? clamp(x, lo, half) : clamp(x, room.W - half, hi);
  } else {
    x = clamp(x, lo, hi);
  }

  const apply = (s: 'left' | 'right', sx: number) => {
    const placement = variant.speakers[s];
    placement.base = { x: round(sx), y: round(y), z: round(z) };
    placement.certainty = certaintyAfter(placement.certainty, options);
  };
  apply(side, x);
  if (mirrored) apply(side === 'left' ? 'right' : 'left', room.W - x);
  return true;
}

/** Moves the seat (ear position). Snaps to the room centreline when close. */
export function moveSeat(project: Project, to: Target, options: MoveOptions = {}): boolean {
  const room = roomSize(project);
  if (!room) return false;
  const variant = activeVariant(project);
  const current = variant.listener.ears;
  const fit = snapper(options);
  // The centreline wins over the grid: check it on the raw value.
  const rawX = to.x ?? current.x;
  const x =
    options.grid !== false && Math.abs(rawX - room.W / 2) <= CENTRE_SNAP ? room.W / 2 : fit(rawX);
  variant.listener = {
    ears: {
      x: round(clamp(x, 0.1, room.W - 0.1)),
      y: round(clamp(fit(to.y ?? current.y), 0.1, room.L - 0.1)),
      z: round(clamp(fit(to.z ?? current.z), 0.3, Math.min(2.0, room.H - 0.1))),
    },
    certainty: certaintyAfter(variant.listener.certainty, options),
  };
  return true;
}

/** Moves an object by its minimum corner, keeping it inside the room. */
export function moveObject(
  project: Project,
  id: string,
  to: Target,
  options: MoveOptions = {},
): boolean {
  const room = roomSize(project);
  const object = activeVariant(project).objects.find((o) => o.id === id);
  if (!room || !object) return false;
  const fit = snapper(options);
  object.position = {
    x: round(clamp(fit(to.x ?? object.position.x), 0, room.W - object.size.x)),
    y: round(clamp(fit(to.y ?? object.position.y), 0, room.L - object.size.y)),
    z: object.position.z,
  };
  return true;
}

/** Swaps an object's footprint (the v1 rotation: 0° or 90°) and keeps it inside the room. */
export function rotateObject(project: Project, id: string): boolean {
  const object = activeVariant(project).objects.find((o) => o.id === id);
  if (!object) return false;
  object.size = { x: object.size.y, y: object.size.x, z: object.size.z };
  moveObject(project, id, {}, { grid: false });
  return true;
}

// ── Typed-field setters (step 4): exact values, no grid snapping ───────────

const EXACT: MoveOptions = { grid: false, keepCertainty: true };

/** Distance from the speakers' rear panel to the front wall. */
export function setSpeakerClearance(project: Project, clearance: number): boolean {
  const left = activeVariant(project).speakers.left.base;
  return moveSpeaker(
    project,
    'left',
    { y: Math.max(0, clearance) + cabinet(project).d / 2, x: left.x },
    EXACT,
  );
}

/** Distance between the two speaker centres. Keeps the pair centred where it is. */
export function setSpeakerSpacing(project: Project, spacing: number): boolean {
  const room = roomSize(project);
  if (!room) return false;
  const { left, right } = activeVariant(project).speakers;
  const centre = project.constraints.keepSymmetric ? room.W / 2 : (left.base.x + right.base.x) / 2;
  if (project.constraints.keepSymmetric)
    return moveSpeaker(project, 'left', { x: centre - spacing / 2 }, EXACT);
  moveSpeaker(project, 'left', { x: centre - spacing / 2 }, EXACT);
  return moveSpeaker(project, 'right', { x: centre + spacing / 2 }, EXACT);
}

export function setStandHeight(project: Project, z: number): boolean {
  return moveSpeaker(project, 'left', { z }, EXACT);
}

export function setEarHeight(project: Project, z: number): boolean {
  return moveSeat(project, { z }, EXACT);
}

/** Toe-in in degrees, positive = turned towards the centreline. Applies to both speakers. */
export function setToeIn(project: Project, degrees: number): void {
  const { left, right } = activeVariant(project).speakers;
  const value = clamp(Math.round(degrees * 10) / 10, -45, 45);
  left.toeInDeg = value;
  right.toeInDeg = value;
  left.certainty = certaintyAfter(left.certainty, EXACT);
  right.certainty = certaintyAfter(right.certainty, EXACT);
}

// ── Objects ────────────────────────────────────────────────────────────────

/** Typical footprints (x width, y depth, z height) in metres for the palette. */
export const OBJECT_DEFAULTS: Record<
  RoomObject['kind'],
  { x: number; y: number; z: number; hard: boolean }
> = {
  bed: { x: 1.6, y: 2.0, z: 0.5, hard: false },
  sofa: { x: 2.0, y: 0.9, z: 0.85, hard: false },
  armchair: { x: 0.8, y: 0.8, z: 0.85, hard: false },
  table: { x: 1.2, y: 0.7, z: 0.75, hard: true },
  cabinet: { x: 1.0, y: 0.45, z: 1.2, hard: true },
  shelf: { x: 0.8, y: 0.3, z: 1.8, hard: false },
  radiator: { x: 0.8, y: 0.1, z: 0.6, hard: true },
  'other-speaker': { x: 0.25, y: 0.3, z: 0.9, hard: true },
  tv: { x: 1.2, y: 0.1, z: 0.7, hard: true },
  desk: { x: 1.4, y: 0.7, z: 0.75, hard: true },
  custom: { x: 0.6, y: 0.6, z: 0.6, hard: false },
};

/** Where a new object goes: the first free spot along the back wall, shifted aside if needed. */
export function defaultObjectPosition(project: Project, size: { x: number; y: number }) {
  const room = roomSize(project) ?? { W: 4, L: 5, H: 2.5 };
  const objects = activeVariant(project).objects;
  const y = Math.max(0, room.L - size.y);
  for (let x = 0; x + size.x <= room.W + 1e-9; x += 0.2) {
    const clash = objects.some(
      (o) =>
        x < o.position.x + o.size.x &&
        x + size.x > o.position.x &&
        y < o.position.y + o.size.y &&
        y + size.y > o.position.y,
    );
    if (!clash) return { x: round(x), y: round(y) };
  }
  return { x: round(Math.max(0, (room.W - size.x) / 2)), y: round(y) };
}

/** Adds an object of the given kind at a free spot and returns its id (null if the room size is unknown). */
export function addObject(project: Project, kind: ObjectKind): string | null {
  const room = roomSize(project);
  if (!room) return null;
  const d = OBJECT_DEFAULTS[kind];
  const size = { x: Math.min(d.x, room.W), y: Math.min(d.y, room.L), z: Math.min(d.z, room.H) };
  const { x, y } = defaultObjectPosition(project, size);
  const object: RoomObject = {
    id: newId(),
    kind,
    position: { x, y, z: 0 },
    size,
    hard: d.hard,
  };
  activeVariant(project).objects.push(object);
  return object.id;
}

export function removeObject(project: Project, id: string): void {
  const variant = activeVariant(project);
  variant.objects = variant.objects.filter((o) => o.id !== id);
}

/** Resizes an object (exact values) and keeps it inside the room. */
export function resizeObject(project: Project, id: string, size: Target): boolean {
  const room = roomSize(project);
  const object = activeVariant(project).objects.find((o) => o.id === id);
  if (!room || !object) return false;
  object.size = {
    x: clamp(size.x ?? object.size.x, 0.05, room.W),
    y: clamp(size.y ?? object.size.y, 0.05, room.L),
    z: clamp(size.z ?? object.size.z, 0.05, room.H),
  };
  return moveObject(project, id, {}, { grid: false });
}
