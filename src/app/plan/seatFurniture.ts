import { DESK } from '../../engine/presets/listeningArea';
import type { ListeningAreaKind, Vec3 } from '../../engine/types';

/**
 * The furniture you listen from, drawn at its typical size around the seat (owner feedback after
 * V5: the head area alone made a bed look far too small). Drawing only: the score still judges
 * where the heads are (engine/scoring/area.ts). The listener faces the speakers (towards y = 0).
 */
export type SeatKind = 'chair' | ListeningAreaKind;

/** Typical footprints (x across, y deep) in metres. */
const SIZE = {
  chair: { x: 0.8, y: 0.8 },
  sofa: { x: 2.0, y: 0.9 },
  bed: { x: 1.6, y: 2.0 },
  desk: { x: DESK.width, y: DESK.depth },
} as const;

/** How far behind the ears the furniture's back edge is, in metres (head against the backrest). */
const BEHIND = { chair: 0.25, sofa: 0.25, bed: 0.3 } as const;
/** A desk stands in front of the listener: the gap between the ears and its back edge. */
const DESK_GAP = DESK.gap;

export interface Footprint {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export function seatFurniture(kind: SeatKind, ears: Vec3): Footprint {
  if (kind === 'desk') {
    const { x: width, y: depth } = SIZE.desk;
    return { x: ears.x - width / 2, y: ears.y - DESK_GAP - depth, width, depth };
  }
  const { x: width, y: depth } = SIZE[kind];
  const behind = BEHIND[kind];
  return { x: ears.x - width / 2, y: ears.y + behind - depth, width, depth };
}
