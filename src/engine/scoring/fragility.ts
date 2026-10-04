import { buildContext } from '../context';
import type { Fragility, Placement, SpeakerPlacement } from '../types';
import { Scorer } from './scorer';

/**
 * "How fragile is this spot" (docs/REVAMP_PLAN.md, Foolproofing 2): the worst score drop when the
 * seat or the speakers sit 5 cm off, or a room dimension is off by its likely error (1 % when
 * measured, 5 % otherwise, as in the robustness runs). A spot that only works to the centimetre
 * should not be recommended without saying so. Bands are 🟡.
 */
const POSITION_ERROR = 0.05;
const STEADY = 0.04;
const SENSITIVE = 0.1;

/** Each room dimension a little bigger and smaller: six scorers, shared by every placement. */
export function resizedRooms(base: Scorer): Scorer[] {
  const { project, room } = base.ctx;
  const error = (dim: 'width' | 'length' | 'height') =>
    project.room[dim].certainty === 'measured' ? 0.01 : 0.05;
  const sizes = [
    { W: room.W * (1 + error('width')) },
    { W: room.W * (1 - error('width')) },
    { L: room.L * (1 + error('length')) },
    { L: room.L * (1 - error('length')) },
    { H: room.H * (1 + error('height')) },
    { H: room.H * (1 - error('height')) },
  ];
  return sizes.map((size) => new Scorer(buildContext(project, size)!, base.settings));
}

const shifted = (p: SpeakerPlacement, dx: number, dy: number): SpeakerPlacement => ({
  ...p,
  base: { ...p.base, x: p.base.x + dx, y: p.base.y + dy },
});

/**
 * The seat 5 cm forward or back, the pair 5 cm nearer or further, 5 cm wider or narrower. Sideways
 * seat moves are left out: every centred seat loses its stereo image a few centimetres off-centre
 * (the sweet spot is narrow everywhere), so they say nothing about this spot in particular.
 */
function nearby({ speakers, listener }: Placement): Placement[] {
  const e = POSITION_ERROR;
  const seat = (dy: number) => ({ speakers, listener: { ...listener, y: listener.y + dy } });
  const pair = (dy: number, wider: number) => ({
    speakers: {
      left: shifted(speakers.left, -wider / 2, dy),
      right: shifted(speakers.right, wider / 2, dy),
    },
    listener,
  });
  return [seat(e), seat(-e), pair(e, 0), pair(-e, 0), pair(0, e), pair(0, -e)];
}

export function fragility(base: Scorer, rooms: Scorer[], placement: Placement): Fragility {
  const nominal = base.score(placement).score;
  const worst = (scores: number[]) => Math.max(0, nominal - Math.min(...scores));
  const positionDrop = worst(nearby(placement).map((p) => base.score(p).score));
  const roomDrop = worst(rooms.map((scorer) => scorer.score(placement).score));
  const drop = Math.max(positionDrop, roomDrop);
  const level = drop < STEADY ? 'steady' : drop < SENSITIVE ? 'sensitive' : 'fragile';
  return { positionDrop, roomDrop, level };
}
