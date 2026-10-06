import type { Busyness } from '../types';

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
