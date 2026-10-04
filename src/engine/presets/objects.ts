import type { Busyness, ObjectKind, RoomObject, ObjectMaterial } from '../types';

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
  wardrobe: [0.2, 0.6],
  bookcase: [0.3, 0.9],
  piano: [0, 0.3],
  rack: [0, 0],
  plant: [0.1, 0.3],
  fireplace: [0, 0],
  lamp: [0, 0],
  subwoofer: [0, 0],
  custom: [0, 0.5],
};

/** Objects a listener may sit on or in (not treated as an obstruction for the seat). */
export const SEAT_KINDS: readonly ObjectKind[] = ['bed', 'sofa', 'armchair'];

/**
 * Absorption per m² of exposed surface (top and sides), m² sabins at mid bands, as [low, high], for
 * an object whose material the user chose. 🟡 estimates from typical coefficients: a hard body
 * takes almost nothing, upholstery or books about a quarter, thick porous material over half.
 */
export const MATERIAL_ABSORPTION_PER_M2: Record<ObjectMaterial, [number, number]> = {
  hard: [0, 0.05],
  soft: [0.15, 0.35],
  absorbent: [0.5, 0.8],
};

/** Absorption area of one object: the chosen material applied to its surface, else the kind's table. */
export function objectAbsorption(o: RoomObject): [number, number] {
  if (o.absorptionRange) return o.absorptionRange;
  if (!o.material) return OBJECT_ABSORPTION[o.kind];
  const { x, y, z } = o.size;
  const surface = x * y + 2 * (x + y) * z;
  const [lo, hi] = MATERIAL_ABSORPTION_PER_M2[o.material];
  return [lo * surface, hi * surface];
}

/** Hard by default: reflect and obstruct (G10). */
export const HARD_KINDS: readonly ObjectKind[] = [
  'table',
  'cabinet',
  'radiator',
  'other-speaker',
  'tv',
  'desk',
  'piano',
  'rack',
  'fireplace',
  'subwoofer',
];

/**
 * "Busy-ness" → furnishing absorption per m² of floor (m² sabins, mid bands), as a [low, high]
 * range. Heuristic mapping (🟡), deliberately wide. Anchored so that a 4 × 5 × 2.5 m room with the
 * default surfaces lands in the typical domestic range of 0.3–0.6 s (DEFAULTS.t60Range): about
 * 1.1 s bare, 0.56 s with some furniture, 0.37 s busy and 0.28 s very busy. Per floor area because
 * larger rooms hold more furniture (R0 audit: fixed amounts made big rooms read as "live").
 * R5: every level is 0.1 higher, to keep these anchors after the plastered-brick walls got their
 * correct (lower) absorption; in the anchor room that took away about 2 m² (REVIEW_R5 F1).
 */
export const BUSYNESS_ABSORPTION_PER_M2: Record<Busyness, [number, number]> = {
  bare: [0.1, 0.3],
  some: [0.4, 0.7],
  busy: [0.6, 1.0],
  'very-busy': [0.8, 1.3],
};
