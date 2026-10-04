import type { Busyness, ObjectKind } from '../types';

/**
 * Absorption area per object, m² sabins at mid bands, as a [low, high] range.
 * Source: RULE_CATALOGUE Appendix A (low confidence estimates).
 */
export const OBJECT_ABSORPTION: Record<ObjectKind, [number, number]> = {
  bed: [1.5, 3.0],
  sofa: [1.5, 3.0],
  armchair: [0.5, 1.0],
  table: [0, 0],
  cabinet: [0, 0],
  shelf: [0.2, 0.6],
  radiator: [0, 0],
  'other-speaker': [0, 0],
  tv: [0, 0],
  desk: [0, 0],
  custom: [0, 0.5],
};

/** Objects a listener may sit on or in (not treated as an obstruction for the seat). */
export const SEAT_KINDS: readonly ObjectKind[] = ['bed', 'sofa', 'armchair'];

/** Hard by default: reflect and obstruct (G10). */
export const HARD_KINDS: readonly ObjectKind[] = [
  'table',
  'cabinet',
  'radiator',
  'other-speaker',
  'tv',
  'desk',
];

/**
 * Quick-mode "busy-ness" shortcut → total furnishing absorption range (m² sabins, mid bands).
 * Heuristic mapping (🟡), deliberately wide.
 */
export const BUSYNESS_ABSORPTION: Record<Busyness, [number, number]> = {
  bare: [0, 2],
  some: [3, 7],
  busy: [6, 12],
  'very-busy': [10, 18],
};
