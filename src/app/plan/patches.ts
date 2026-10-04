import type { BoundaryId, Project, SurfacePatch, SurfacePresetId } from '../../engine/types';
import { newId } from '../state/ids';
import { ASSUMED_CEILING, clamp, roomSize, snap } from './placement';

/**
 * Surface patches: rectangles (a window, a wall of CDs, a curtain, a painting) laid on a wall, the
 * floor or the ceiling. (u, v) follow the engine: front/back walls (x, height), side walls
 * (distance from the front wall, height), floor/ceiling (x, y).
 */

export const BOUNDARIES: readonly BoundaryId[] = [
  'front',
  'back',
  'left',
  'right',
  'floor',
  'ceiling',
];
export const isWall = (b: BoundaryId) => b !== 'floor' && b !== 'ceiling';

/** Size of a boundary: `span` along u, `extent` along v (metres). Null until the room size is known. */
export function boundaryExtent(
  project: Project,
  boundary: BoundaryId,
): { span: number; extent: number } | null {
  const room = roomSize(project);
  if (!room) return null;
  switch (boundary) {
    case 'front':
    case 'back':
      return { span: room.W, extent: room.H };
    case 'left':
    case 'right':
      return { span: room.L, extent: room.H };
    case 'floor':
    case 'ceiling':
      return { span: room.W, extent: room.L };
  }
}

export type PatchKind = 'window' | 'shelf' | 'curtain' | 'painting' | 'rug' | 'other';

/** Which quick-add kinds make sense on each surface. */
export const PATCH_KINDS_FOR = (boundary: BoundaryId): readonly PatchKind[] =>
  boundary === 'floor'
    ? ['rug', 'other']
    : boundary === 'ceiling'
      ? ['other']
      : ['window', 'shelf', 'curtain', 'painting', 'other'];

/** The quick-add buttons: preset material and a typical size (width × height, metres). */
export const PATCH_KINDS: Record<
  PatchKind,
  { preset: SurfacePresetId; width: number; height: number; v: number }
> = {
  window: { preset: 'glass', width: 1.2, height: 1.2, v: 0.9 },
  shelf: { preset: 'shelf-diffusive', width: 2.0, height: 1.8, v: 0.2 },
  curtain: { preset: 'curtain-heavy', width: 1.4, height: 2.2, v: 0.1 },
  painting: { preset: 'canvas-art', width: 0.9, height: 0.7, v: 1.2 },
  rug: { preset: 'carpet-heavy', width: 2.0, height: 3.0, v: 0 },
  other: { preset: 'plaster-brick', width: 1.0, height: 1.0, v: 0.5 },
};

const fit = (value: number, size: number, limit: number) =>
  clamp(snap(value), 0, Math.max(0, limit - size));

/** Adds a patch of the given kind on a boundary, centred, and returns its id (null if the room size is unknown). */
export function addPatch(project: Project, boundary: BoundaryId, kind: PatchKind): string | null {
  const extent = boundaryExtent(project, boundary);
  if (!extent) return null;
  const template = PATCH_KINDS[kind];
  const width = Math.min(template.width, extent.span);
  const walls = isWall(boundary);
  const height = Math.min(template.height, extent.extent);
  const patch: SurfacePatch = {
    id: newId(),
    boundary,
    u: fit((extent.span - width) / 2, width, extent.span),
    v: walls
      ? fit(template.v, height, extent.extent)
      : fit((extent.extent - height) / 2, height, extent.extent),
    width,
    height,
    preset: template.preset,
  };
  project.surfaces.patches.push(patch);
  return patch.id;
}

export function removePatch(project: Project, id: string): void {
  project.surfaces.patches = project.surfaces.patches.filter((p) => p.id !== id);
}

/** Moves a patch (snapped when dragging, exact when typed), keeping it inside its boundary. */
export function movePatch(
  project: Project,
  id: string,
  to: { u?: number; v?: number },
  options: { grid?: boolean } = {},
): boolean {
  const patch = project.surfaces.patches.find((p) => p.id === id);
  const extent = patch && boundaryExtent(project, patch.boundary);
  if (!patch || !extent) return false;
  const round = (v: number) => Math.round(v * 1e6) / 1e6;
  const fitTo = (value: number) => (options.grid === false ? round(value) : snap(value));
  patch.u = round(clamp(fitTo(to.u ?? patch.u), 0, extent.span - patch.width));
  patch.v = round(clamp(fitTo(to.v ?? patch.v), 0, extent.extent - patch.height));
  return true;
}

/** Resizes a patch (exact values), keeping it inside its boundary; the position moves back in if needed. */
export function resizePatch(
  project: Project,
  id: string,
  size: { width?: number; height?: number },
): boolean {
  const patch = project.surfaces.patches.find((p) => p.id === id);
  const extent = patch && boundaryExtent(project, patch.boundary);
  if (!patch || !extent) return false;
  patch.width = clamp(size.width ?? patch.width, 0.05, extent.span);
  patch.height = clamp(size.height ?? patch.height, 0.05, extent.extent);
  return movePatch(project, id, {}, { grid: false });
}

/** Choosing a base material marks it as the user's own choice; "don't know" goes back to the default. */
export function setBaseSurface(
  project: Project,
  boundary: BoundaryId,
  preset: SurfacePresetId | null,
): void {
  if (preset === null) {
    project.surfaces.base[boundary] = DEFAULT_BASE[boundary];
    project.surfaces.baseCertainty[boundary] = 'unknown';
  } else {
    project.surfaces.base[boundary] = preset;
    project.surfaces.baseCertainty[boundary] = 'estimated';
  }
}

export const DEFAULT_BASE: Record<BoundaryId, SurfacePresetId> = {
  front: 'plaster-brick',
  back: 'plaster-brick',
  left: 'plaster-brick',
  right: 'plaster-brick',
  floor: 'wood-floor',
  ceiling: 'plaster-brick',
};

export { ASSUMED_CEILING };
