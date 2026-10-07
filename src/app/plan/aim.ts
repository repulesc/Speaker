import { frontWallNullAtSeat } from '../../engine/rules/P04-boundary-interference';
import type { SpeakerPlacement, Vec3 } from '../../engine/types';

/**
 * What the map draws about the speakers' aim and the wall behind them (docs/ROADMAP_V10.md §7).
 * Pure geometry in metres, the room seen from above: x across, y away from the front wall.
 */

interface Point {
  x: number;
  y: number;
}

/** Where the two aims cross, seen from the seat: in front of you, at you, behind you, or never. */
export type Crossing = 'front' | 'at' | 'behind' | 'parallel';

/** Within this distance of the ears (along the room), the aims cross "at you" (about a head). */
const AT_YOU = 0.15;

/** The unit vector a speaker faces: into the room, turned inwards by its toe-in. */
export function aimOf(side: 'left' | 'right', toeInDeg: number): Point {
  const t = (toeInDeg * Math.PI) / 180;
  return { x: (side === 'left' ? 1 : -1) * Math.sin(t), y: Math.cos(t) };
}

/** Where two rays from a and b along u and v meet ahead of both, or null. */
function meet(a: Point, u: Point, b: Point, v: Point): Point | null {
  const det = u.x * -v.y - u.y * -v.x;
  if (Math.abs(det) < 1e-9) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const s = (dx * -v.y - dy * -v.x) / det;
  const r = (u.x * dy - u.y * dx) / det;
  return s > 0 && r > 0 ? { x: a.x + s * u.x, y: a.y + s * u.y } : null;
}

export interface Aims {
  /** Each beam, from the front of the cabinet to where it is drawn to. */
  beams: { side: 'left' | 'right'; from: Point; to: Point }[];
  cross: Point | null;
  where: Crossing;
}

/**
 * The two aims and where they cross relative to the ears. A beam ends where the aims cross, or a
 * little past the seat when they cross far behind it or not at all, and never outside the room.
 */
export function aims(
  speakers: { left: SpeakerPlacement; right: SpeakerPlacement },
  depth: number,
  ears: Point,
  room: { W: number; L: number },
): Aims {
  const front = (side: 'left' | 'right') => {
    const p = speakers[side];
    const u = aimOf(side, p.toeInDeg);
    return { side, u, from: { x: p.base.x + (u.x * depth) / 2, y: p.base.y + (u.y * depth) / 2 } };
  };
  const l = front('left');
  const r = front('right');
  const cross = meet(l.from, l.u, r.from, r.u);
  const where: Crossing = !cross
    ? 'parallel'
    : cross.y < ears.y - AT_YOU
      ? 'front'
      : cross.y > ears.y + AT_YOU
        ? 'behind'
        : 'at';
  const reach = ears.y + 0.4;
  const beams = [l, r].map(({ side, u, from }) => {
    const stop = cross && cross.y <= reach ? cross.y : reach;
    // Along the aim to the depth `stop`, cut short at the side walls and the back wall.
    let s = (Math.min(stop, room.L) - from.y) / u.y;
    if (u.x > 0) s = Math.min(s, (room.W - from.x) / u.x);
    if (u.x < 0) s = Math.min(s, -from.x / u.x);
    s = Math.max(0, s);
    return { side, from, to: { x: from.x + s * u.x, y: from.y + s * u.y } };
  });
  return { beams, cross: cross && cross.y <= room.L ? cross : null, where };
}

/** Bands for the front-wall dip (H04's edges, 🟡): below 80 Hz, 80–300 Hz, above 300 Hz. */
export type DipBand = 'deep' | 'upper' | 'above';

/**
 * The front-wall dip as heard at the seat (P04, 🔴): the woofer and its mirror image behind the
 * wall, first cancellation where the extra path is half a wavelength.
 */
export function wallDip(woofer: Vec3, ears: Vec3, c: number): { hz: number; band: DipBand } {
  const hz = frontWallNullAtSeat(woofer, ears, c);
  return { hz, band: hz < 80 ? 'deep' : hz <= 300 ? 'upper' : 'above' };
}
