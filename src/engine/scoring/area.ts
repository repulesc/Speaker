import { LISTENING_AREAS } from '../presets/listeningArea';
import type { AreaSpot, ListeningAreaKind, Vec3 } from '../types';

/**
 * A listening area (sofa, desk, bed) instead of one seat (docs/ROADMAP_V5.md, docs/SCORING.md §4).
 * The area is judged at a few spots: the middle, the two ends and, for a deep enough area, the
 * front and the back. Each spot is scored like a seat; the same model, nothing new is assumed.
 */

/** Ends closer than this to the middle add nothing the ±3 cm head movement does not cover. */
const MIN_HALF_EXTENT = 0.1;
/** The middle counts twice: it is where the main listener sits. */
export const CENTRE_WEIGHT = 2;

export interface AreaPoint {
  where: AreaSpot;
  at: Vec3;
}

/** The spots to judge an area by, inside the room. Without an area: the seat alone. */
export function areaPoints(
  ears: Vec3,
  kind: ListeningAreaKind | undefined,
  room: { W: number; L: number },
): AreaPoint[] {
  const points: AreaPoint[] = [{ where: 'centre', at: ears }];
  if (!kind) return points;
  const { width, depth } = LISTENING_AREAS[kind];
  const hx = width / 2;
  const hy = depth / 2;
  const at = (dx: number, dy: number): Vec3 => ({ x: ears.x + dx, y: ears.y + dy, z: ears.z });
  if (hx >= MIN_HALF_EXTENT) {
    points.push({ where: 'left', at: at(-hx, 0) }, { where: 'right', at: at(hx, 0) });
  }
  if (hy >= MIN_HALF_EXTENT) {
    points.push({ where: 'front', at: at(0, -hy) }, { where: 'back', at: at(0, hy) });
  }
  // A spot outside the room is nobody's seat.
  return points.filter(({ at: p }) => p.x > 0 && p.x < room.W && p.y > 0 && p.y < room.L);
}

/** One score for the area: the middle weighted twice, every other spot once. */
export function areaScore(scores: readonly { where: AreaSpot; score: number }[]): number {
  let sum = 0;
  let weight = 0;
  for (const { where, score } of scores) {
    const w = where === 'centre' ? CENTRE_WEIGHT : 1;
    sum += w * score;
    weight += w;
  }
  return weight ? sum / weight : NaN;
}
