import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  activeVariant,
  defaultObjectPosition,
  moveObject,
  moveSeat,
  moveSpeaker,
  rotateObject,
  setEarHeight,
  setSpeakerClearance,
  setSpeakerSpacing,
  setStandHeight,
  setToeIn,
  snap,
} from '../../src/app/plan/placement';
import { createDefaultProject } from '../../src/app/state/defaults';
import { makeProject } from '../fixtures/projects';

// Room R: W 4.0, L 5.0, H 2.5; default speaker 0.2 × 0.25 × 0.3.
const project = () => makeProject();

describe('snap', () => {
  it('rounds to the 5 cm grid without float noise', () => {
    expect(snap(1.237)).toBe(1.25);
    expect(snap(0.02)).toBe(0);
    expect(snap(0.03)).toBe(0.05);
    expect(snap(2.1)).toBe(2.1);
  });
});

describe('moveSpeaker', () => {
  it('mirrors the other speaker about the room centreline by default', () => {
    const p = project();
    moveSpeaker(p, 'left', { x: 0.8, y: 0.9 });
    const { left, right } = activeVariant(p).speakers;
    expect(left.base.x).toBeCloseTo(0.8, 6);
    expect(right.base.x).toBeCloseTo(3.2, 6);
    expect(right.base.y).toBe(left.base.y);
  });

  it('moves one speaker only when the lock is off', () => {
    const p = project();
    p.constraints.keepSymmetric = false;
    moveSpeaker(p, 'left', { x: 0.8 });
    expect(activeVariant(p).speakers.right.base.x).toBe(3);
  });

  it('keeps speakers inside the room and on their own side of the centreline', () => {
    const p = project();
    moveSpeaker(p, 'left', { x: -3, y: -3, z: -3 });
    let { left } = activeVariant(p).speakers;
    expect(left.base.x).toBeGreaterThanOrEqual(0.1); // half the 0.2 m cabinet
    expect(left.base.y).toBeGreaterThanOrEqual(0.125); // half the depth
    expect(left.base.z).toBe(0);
    moveSpeaker(p, 'left', { x: 99, z: 99 });
    ({ left } = activeVariant(p).speakers);
    expect(left.base.x).toBeLessThan(2);
    expect(left.base.z).toBeLessThanOrEqual(2.5 - 0.3);
  });

  it('marks both speakers as placed by the user', () => {
    const p = project();
    moveSpeaker(p, 'right', { x: 3.2 });
    expect(activeVariant(p).speakers.left.certainty).toBe('estimated');
    expect(activeVariant(p).speakers.right.certainty).toBe('estimated');
  });

  it('does nothing while the room size is unknown', () => {
    const p = createDefaultProject({ name: '', system: 'metric' });
    expect(moveSpeaker(p, 'left', { x: 1 })).toBe(false);
  });

  it('works without the ceiling height, which only limits heights', () => {
    const p = project();
    p.room.height = { value: null, certainty: 'unknown' };
    expect(moveSpeaker(p, 'left', { x: 0.8, z: 99 })).toBe(true);
    expect(activeVariant(p).speakers.left.base.z).toBeCloseTo(2.5 - 0.3, 6);
  });

  it('property: speakers always stay inside the room, whatever the target', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10, max: 10, noNaN: true }),
        fc.double({ min: -10, max: 10, noNaN: true }),
        (x, y) => {
          const p = project();
          moveSpeaker(p, 'left', { x, y });
          for (const s of [activeVariant(p).speakers.left, activeVariant(p).speakers.right]) {
            expect(s.base.x - 0.1).toBeGreaterThanOrEqual(-1e-9);
            expect(s.base.x + 0.1).toBeLessThanOrEqual(4 + 1e-9);
            expect(s.base.y - 0.125).toBeGreaterThanOrEqual(-1e-9);
            expect(s.base.y + 0.125).toBeLessThanOrEqual(5 + 1e-9);
          }
        },
      ),
    );
  });
});

describe('moveSeat', () => {
  it('snaps to the centreline when close, and stays in the room', () => {
    const p = project();
    moveSeat(p, { x: 2.03, y: 3.0 });
    expect(activeVariant(p).listener.ears.x).toBe(2);
    moveSeat(p, { x: -5, y: 50, z: 9 });
    const e = activeVariant(p).listener.ears;
    expect(e.x).toBe(0.1);
    expect(e.y).toBe(4.9);
    expect(e.z).toBeLessThanOrEqual(2);
    expect(activeVariant(p).listener.certainty).toBe('estimated');
  });
});

describe('objects', () => {
  const withBed = () => {
    const p = project();
    activeVariant(p).objects = [
      {
        id: 'bed',
        kind: 'bed',
        position: { x: 0.2, y: 3, z: 0 },
        size: { x: 1.6, y: 2, z: 0.5 },
        hard: false,
      },
    ];
    return p;
  };

  it('moves by the minimum corner and stays inside', () => {
    const p = withBed();
    moveObject(p, 'bed', { x: 9, y: 9 });
    expect(activeVariant(p).objects[0]!.position).toEqual({ x: 2.4, y: 3, z: 0 });
  });

  it('rotates by swapping the footprint, staying inside', () => {
    const p = withBed();
    moveObject(p, 'bed', { x: 2.4, y: 3 });
    rotateObject(p, 'bed');
    const o = activeVariant(p).objects[0]!;
    expect(o.size).toEqual({ x: 2, y: 1.6, z: 0.5 });
    expect(o.position.x + o.size.x).toBeLessThanOrEqual(4 + 1e-9);
  });

  it('a new object goes to a free spot along the back wall', () => {
    const p = withBed();
    const pos = defaultObjectPosition(p, { x: 0.8, y: 0.8 });
    expect(pos.y).toBeCloseTo(4.2, 6);
    const clash = pos.x < 1.8 && pos.x + 0.8 > 0.2 && pos.y < 5 && pos.y + 0.8 > 3;
    expect(clash).toBe(false);
  });
});

describe('typed-field setters', () => {
  it('clearance puts the rear panel at the given distance from the front wall', () => {
    const p = project();
    setSpeakerClearance(p, 0.4);
    expect(activeVariant(p).speakers.left.base.y).toBeCloseTo(0.4 + 0.125, 6);
    expect(activeVariant(p).speakers.right.base.y).toBeCloseTo(0.4 + 0.125, 6);
  });

  it('spacing keeps the pair centred', () => {
    const p = project();
    setSpeakerSpacing(p, 2.4);
    const { left, right } = activeVariant(p).speakers;
    expect(right.base.x - left.base.x).toBeCloseTo(2.4, 6);
    expect((left.base.x + right.base.x) / 2).toBeCloseTo(2, 6);
  });

  it('typed values are exact, only dragging snaps to the grid', () => {
    const p = project();
    setSpeakerClearance(p, 0.52);
    expect(activeVariant(p).speakers.left.base.y).toBeCloseTo(0.52 + 0.125, 6);
    moveSeat(p, { y: 3.07 }, { grid: false });
    expect(activeVariant(p).listener.ears.y).toBe(3.07);
    moveSeat(p, { y: 3.07 });
    expect(activeVariant(p).listener.ears.y).toBe(3.05);
  });

  it('stand height, ear height and toe-in', () => {
    const p = project();
    setStandHeight(p, 0.9);
    setEarHeight(p, 1.2);
    setToeIn(p, 12.34);
    const v = activeVariant(p);
    expect(v.speakers.left.base.z).toBe(0.9);
    expect(v.speakers.right.base.z).toBe(0.9);
    expect(v.listener.ears.z).toBe(1.2);
    expect(v.speakers.left.toeInDeg).toBe(12.3);
    setToeIn(p, 999);
    expect(v.speakers.right.toeInDeg).toBe(45);
  });
});
