import type { ListeningAreaKind } from '../types';

/**
 * Where the ears can be, around the seat, for each kind of listening place (docs/ROADMAP_V5.md).
 * Width runs across the room (x), depth along it (y), in metres.
 *
 * 🟡 Typical sizes, not from a source: a three-seat sofa puts the outer listeners about 0.6 m
 * either side of the middle; at a desk the head moves about ±0.2 m sideways and ±0.15 m back and
 * forth; two people in a bed, sitting up or lying back, about ±0.4 m and ±0.2 m. One chair is a
 * single point (the ±3 cm head movement of the robustness runs, docs/SCORING.md §4).
 */
export const LISTENING_AREAS: Record<ListeningAreaKind, { width: number; depth: number }> = {
  sofa: { width: 1.2, depth: 0.15 },
  desk: { width: 0.4, depth: 0.3 },
  bed: { width: 0.8, depth: 0.4 },
};
