import { describe, expect, it } from 'vitest';
import { activeVariant, cabinet } from '../../src/app/plan/placement';
import { tapeMeasure } from '../../src/app/print/tape';
import { createDefaultProject } from '../../src/app/state/defaults';

describe('tapeMeasure', () => {
  it('measures from the walls the way a person with a tape would', () => {
    const p = createDefaultProject({ name: '', system: 'metric' });
    const v = activeVariant(p);
    const depth = cabinet(p).d;
    v.speakers.left.base = { x: 1, y: 0.5, z: 0.8 };
    v.speakers.right.base = { x: 3, y: 0.5, z: 0.8 };
    v.listener.ears = { x: 2, y: 2.5, z: 1.1 };
    const t = tapeMeasure(p, 4, { speakers: v.speakers, listener: v.listener.ears });
    expect(t.left.sideWall).toBeCloseTo(1);
    expect(t.right.sideWall).toBeCloseTo(1); // 4 − 3, from the right wall
    expect(t.left.front).toBeCloseTo(0.5 - depth / 2);
    expect(t.left.height).toBeCloseTo(0.8);
    expect(t.between).toBeCloseTo(2);
    expect(t.seat).toEqual({ front: 2.5, fromLeft: 2, ears: 1.1 });
    expect(t.toSeat.left).toBeCloseTo(Math.hypot(1, 2));
    expect(t.toSeat.right).toBeCloseTo(t.toSeat.left);
  });
});
