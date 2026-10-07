import { DEFAULTS } from '../../engine/presets/defaults';
import type { Certainty, Placement, Project, SetupVariant } from '../../engine/types';

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

const SIDES = ['left', 'right'] as const;

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
    ...variant.listener,
    ears: {
      x: round(clamp(x, 0.1, room.W - 0.1)),
      y: round(clamp(fit(to.y ?? current.y), 0.1, room.L - 0.1)),
      z: round(clamp(fit(to.z ?? current.z), 0.3, Math.min(2.0, room.H - 0.1))),
    },
    certainty: certaintyAfter(variant.listener.certainty, options),
  };
  return true;
}

/** Moves the speakers and the seat to a best-spot candidate (heights and toe-in stay as they are). */
export function applyCandidate(project: Project, placement: Placement): void {
  const variant = activeVariant(project);
  for (const side of ['left', 'right'] as const) {
    const base = placement.speakers[side].base;
    variant.speakers[side].base = {
      x: round(base.x),
      y: round(base.y),
      z: variant.speakers[side].base.z,
    };
    variant.speakers[side].certainty = 'estimated';
  }
  const ears = placement.listener;
  variant.listener = {
    ...variant.listener,
    ears: { x: round(ears.x), y: round(ears.y), z: variant.listener.ears.z },
    certainty: 'estimated',
  };
}

/** Whether the speakers or the seat are still the first guess (nothing placed by the user yet). */
export function isFirstGuess(project: Project): boolean {
  const { speakers, listener } = activeVariant(project);
  return (
    listener.certainty === 'unknown' ||
    SIDES.some((side) => (speakers[side].certainty ?? 'estimated') === 'unknown')
  );
}

/** "Looks right": the first guess becomes the user's own placement, where it stands. */
export function confirmPlacement(project: Project): void {
  const { speakers, listener } = activeVariant(project);
  for (const side of SIDES) {
    if ((speakers[side].certainty ?? 'estimated') === 'unknown')
      speakers[side].certainty = 'estimated';
  }
  if (listener.certainty === 'unknown') listener.certainty = 'estimated';
}

// ── Typed-field setters (step 4): exact values, no grid snapping ───────────

const EXACT: MoveOptions = { grid: false, keepCertainty: true };

/** Moves both speakers, each keeping its own x (one move covers both when they are mirrored). */
function moveBoth(project: Project, to: Target): boolean {
  const { speakers } = activeVariant(project);
  const sides = project.constraints.keepSymmetric ? (['left'] as const) : SIDES;
  return sides.every((side) =>
    moveSpeaker(project, side, { ...to, x: speakers[side].base.x }, EXACT),
  );
}

/** Distance from the speakers' rear panel to the front wall. */
export function setSpeakerClearance(project: Project, clearance: number): boolean {
  return moveBoth(project, { y: Math.max(0, clearance) + cabinet(project).d / 2 });
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
  return moveBoth(project, { z });
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
