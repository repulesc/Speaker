import { describe, expect, it } from 'vitest';
import { objectAbsorption, OBJECT_ABSORPTION } from '../../src/engine/presets/objects';
import type { RoomObject } from '../../src/engine/types';

const box = (extra: Partial<RoomObject> = {}): RoomObject => ({
  id: 'o',
  kind: 'custom',
  position: { x: 0, y: 0, z: 0 },
  size: { x: 1, y: 1, z: 1 },
  hard: false,
  ...extra,
});

describe('objectAbsorption', () => {
  it('uses the table for the kind when no material is chosen', () => {
    expect(objectAbsorption(box({ kind: 'bookcase' }))).toEqual(OBJECT_ABSORPTION.bookcase);
  });

  it('an explicit range wins over everything', () => {
    expect(objectAbsorption(box({ material: 'soft', absorptionRange: [1, 2] }))).toEqual([1, 2]);
  });

  it('a chosen material scales with the exposed surface (top + four sides)', () => {
    // 1 × 1 × 1 m: top 1 + sides 4 = 5 m².
    const [lo, hi] = objectAbsorption(box({ material: 'absorbent' }));
    expect(lo).toBeCloseTo(0.5 * 5);
    expect(hi).toBeCloseTo(0.8 * 5);
  });

  it('absorbent > soft > hard, and bigger objects take more', () => {
    const hiOf = (m: RoomObject['material']) => objectAbsorption(box({ material: m }))[1];
    expect(hiOf('absorbent')).toBeGreaterThan(hiOf('soft'));
    expect(hiOf('soft')).toBeGreaterThan(hiOf('hard'));
    const big = objectAbsorption(box({ material: 'soft', size: { x: 2, y: 2, z: 2 } }))[1];
    expect(big).toBeGreaterThan(hiOf('soft'));
  });
});
