import { describe, expect, it } from 'vitest';
import { aimOf, aims, wallDip } from '../../src/app/plan/aim';
import type { SpeakerPlacement } from '../../src/engine/types';

const speaker = (x: number, y: number, toeInDeg: number): SpeakerPlacement => ({
  base: { x, y, z: 0.8 },
  toeInDeg,
});
const room = { W: 4, L: 5 };
const DEPTH = 0.3;

/** A pair 2 m apart at y = 0.65 (baffles at 0.8), turned in by `toe`. */
const pair = (toe: number) => ({ left: speaker(1, 0.65, toe), right: speaker(3, 0.65, toe) });

describe('the speakers’ aim on the map (docs/ROADMAP_V10.md §7)', () => {
  it('turns each speaker inwards: the left one to the right, the right one to the left', () => {
    expect(aimOf('left', 0)).toEqual({ x: 0, y: 1 });
    expect(aimOf('left', 30).x).toBeCloseTo(0.5, 9);
    expect(aimOf('right', 30).x).toBeCloseTo(-0.5, 9);
    expect(aimOf('right', 30).y).toBeCloseTo(Math.sqrt(3) / 2, 9);
  });

  it('finds where the aims cross, from the front of the cabinets', () => {
    // Baffles at y = 0.8, 1 m either side of the middle: at 45° the aims meet 1 m further in.
    const { cross } = aims(pair(45), DEPTH, { x: 2, y: 3 }, room);
    const half = Math.sin(Math.PI / 4) * (DEPTH / 2);
    expect(cross!.x).toBeCloseTo(2, 9);
    expect(cross!.y).toBeCloseTo(0.65 + Math.cos(Math.PI / 4) * (DEPTH / 2) + (1 - half), 9);
  });

  it('says whether they cross in front of you, at you or behind you', () => {
    const ears = (y: number) => ({ x: 2, y });
    // Aimed at a seat 1.73 m from the baffles: an equilateral triangle, toe-in 30°.
    const at = aims(pair(30), DEPTH, ears(0.8 + Math.sqrt(3) * 1 - 0.02), room);
    expect(at.where).toBe('at');
    expect(aims(pair(45), DEPTH, ears(3), room).where).toBe('front');
    expect(aims(pair(10), DEPTH, ears(2), room).where).toBe('behind');
    expect(aims(pair(0), DEPTH, ears(2), room).where).toBe('parallel');
    expect(aims(pair(0), DEPTH, ears(2), room).cross).toBeNull();
  });

  it('ends the beams where they cross, or a little past the seat, never outside the room', () => {
    const crossing = aims(pair(45), DEPTH, { x: 2, y: 3 }, room);
    for (const b of crossing.beams) {
      expect(b.to.x).toBeCloseTo(crossing.cross!.x, 9);
      expect(b.to.y).toBeCloseTo(crossing.cross!.y, 9);
    }
    const straight = aims(pair(0), DEPTH, { x: 2, y: 3 }, room);
    for (const b of straight.beams) expect(b.to.y).toBeCloseTo(3.4, 9);
    const short = aims(pair(0), DEPTH, { x: 2, y: 4.8 }, room);
    for (const b of short.beams) expect(b.to.y).toBeLessThanOrEqual(room.L + 1e-9);
    // Steeply turned speakers near the side walls stop at the walls.
    const wide = aims(
      { left: speaker(0.3, 0.65, 0), right: speaker(3.7, 0.65, 40) },
      DEPTH,
      { x: 2, y: 4 },
      room,
    );
    for (const b of wide.beams) {
      expect(b.to.x).toBeGreaterThanOrEqual(-1e-9);
      expect(b.to.x).toBeLessThanOrEqual(room.W + 1e-9);
    }
  });
});

describe('the front-wall dip under the seat (P04)', () => {
  const c = 343;
  it('is c / 4d on the wall’s normal, and higher off it', () => {
    const woofer = { x: 2, y: 0.8, z: 1 };
    const onNormal = wallDip(woofer, { x: 2, y: 20, z: 1 }, c);
    expect(onNormal.hz).toBeCloseTo(c / (4 * 0.8), 6);
    const off = wallDip(woofer, { x: 3.5, y: 2.5, z: 1.2 }, c);
    expect(off.hz).toBeGreaterThan(c / (4 * 0.8));
  });

  it('names the band: deep bass, upper bass, above the bass (H04’s edges)', () => {
    const seat = { x: 2, y: 3, z: 1 };
    expect(wallDip({ x: 2, y: 1.6, z: 1 }, seat, c).band).toBe('deep');
    expect(wallDip({ x: 2, y: 0.6, z: 1 }, seat, c).band).toBe('upper');
    expect(wallDip({ x: 2, y: 0.2, z: 1 }, seat, c).band).toBe('above');
  });
});
