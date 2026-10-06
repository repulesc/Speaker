import type { BoundaryId, Project, SurfacePresetId } from '../../engine/types';

/**
 * The room's materials (V9: one each for the walls, the floor and the ceiling; per-wall choices and
 * things on the walls were removed, docs/ROADMAP_V9.md). Choosing a material marks it as the
 * user's own; "don't know" goes back to the typical default.
 */
export const DEFAULT_BASE: Record<BoundaryId, SurfacePresetId> = {
  front: 'plaster-brick',
  back: 'plaster-brick',
  left: 'plaster-brick',
  right: 'plaster-brick',
  floor: 'wood-floor',
  ceiling: 'plaster-brick',
};

export const WALLS = ['front', 'back', 'left', 'right'] as const;

/** What the user can choose for each part of the room (the plain materials, in this order). */
export const MATERIALS = {
  walls: ['plaster-brick', 'plaster-concrete', 'gypsum-stud', 'plaster-lath', 'glass'],
  floor: ['wood-floor', 'carpet-underlay', 'carpet-heavy', 'plaster-concrete'],
  ceiling: ['plaster-brick', 'plaster-concrete', 'gypsum-stud', 'plaster-lath'],
} as const satisfies Record<string, readonly SurfacePresetId[]>;

export type Part = keyof typeof MATERIALS;

const BOUNDARIES_OF: Record<Part, readonly BoundaryId[]> = {
  walls: WALLS,
  floor: ['floor'],
  ceiling: ['ceiling'],
};

/** The chosen material of a part, or null for "don't know" (also when the walls differ). */
export function materialOf(project: Project, part: Part): SurfacePresetId | null {
  const [first, ...rest] = BOUNDARIES_OF[part];
  const { base, baseCertainty } = project.surfaces;
  if (baseCertainty[first!] === 'unknown') return null;
  return rest.every((b) => base[b] === base[first!] && baseCertainty[b] !== 'unknown')
    ? base[first!]
    : null;
}

export function setMaterial(project: Project, part: Part, preset: SurfacePresetId | null): void {
  for (const b of BOUNDARIES_OF[part]) {
    project.surfaces.base[b] = preset ?? DEFAULT_BASE[b];
    project.surfaces.baseCertainty[b] = preset ? 'estimated' : 'unknown';
  }
}
