import type { ListeningAreaKind, Vec3 } from '../../engine/types';
import { OBJECT_DEFAULTS } from './placement';

/**
 * The furniture you listen from, drawn at its typical size around the seat (owner feedback after
 * V5: the head area alone made a bed look far too small). Drawing only: the score still judges
 * where the heads are (engine/scoring/area.ts). The listener faces the speakers (towards y = 0).
 */
export type SeatKind = 'chair' | ListeningAreaKind;

/** How far behind the ears the furniture's back edge is, in metres (head against the backrest). */
const BEHIND = { chair: 0.25, sofa: 0.25, bed: 0.3 } as const;
/** A desk stands in front of the listener: the gap between the ears and its back edge. */
const DESK_GAP = 0.35;

export interface Footprint {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export function seatFurniture(kind: SeatKind, ears: Vec3): Footprint {
  if (kind === 'desk') {
    const { x: width, y: depth } = OBJECT_DEFAULTS.desk;
    return { x: ears.x - width / 2, y: ears.y - DESK_GAP - depth, width, depth };
  }
  const { x: width, y: depth } = OBJECT_DEFAULTS[kind === 'chair' ? 'armchair' : kind];
  const behind = BEHIND[kind];
  return { x: ears.x - width / 2, y: ears.y + behind - depth, width, depth };
}
