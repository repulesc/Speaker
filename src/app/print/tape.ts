import type { Placement, Project } from '../../engine/types';
import { cabinet } from '../plan/placement';

/** What to measure with a tape for one speaker: from walls to the cabinet, all in metres. */
export interface SpeakerMeasure {
  /** From the front wall to the rear panel. */
  front: number;
  /** From the nearest side wall (the left one for the left speaker, the right one for the right) to the cabinet centre. */
  sideWall: number;
  /** From the floor to the bottom of the cabinet (stand height). */
  height: number;
  toeInDeg: number;
}

export interface TapeMeasure {
  left: SpeakerMeasure;
  right: SpeakerMeasure;
  seat: { front: number; fromLeft: number; ears: number };
  /** Cabinet centre to cabinet centre. */
  between: number;
  /** From each speaker to the seat, along the floor. */
  toSeat: { left: number; right: number };
}

/** Everything a person needs to put the speakers and the seat where the plan says. */
export function tapeMeasure(project: Project, width: number, placement: Placement): TapeMeasure {
  const depth = cabinet(project).d;
  const { left, right } = placement.speakers;
  const { listener } = placement;
  const speaker = (p: Placement['speakers']['left'], sideWall: number): SpeakerMeasure => ({
    front: p.base.y - depth / 2,
    sideWall,
    height: p.base.z,
    toeInDeg: p.toeInDeg,
  });
  const toSeat = (p: Placement['speakers']['left']) =>
    Math.hypot(p.base.x - listener.x, p.base.y - listener.y);
  return {
    left: speaker(left, left.base.x),
    right: speaker(right, width - right.base.x),
    seat: { front: listener.y, fromLeft: listener.x, ears: listener.z },
    between: Math.abs(right.base.x - left.base.x),
    toSeat: { left: toSeat(left), right: toSeat(right) },
  };
}
