import { describe, expect, it } from 'vitest';
import { heatColor, smoothField } from '../../src/app/map/heat';

const luma = ([r, g, b]: number[]) => 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;

describe('heat ramp', () => {
  it('runs from a lifted viridis violet (not near-black) to yellow', () => {
    const poor = heatColor(0.3);
    expect(luma(poor)).toBeGreaterThan(luma([0x44, 0x01, 0x54]) + 15);
    expect(heatColor(1).map(Math.round)).toEqual([0xfd, 0xe7, 0x25]);
  });

  it('is clamped outside the range, and brighter means better (colour-blind safe)', () => {
    expect(heatColor(-1)).toEqual(heatColor(0.3));
    expect(heatColor(2)).toEqual(heatColor(1));
    let previous = -1;
    for (let score = 0.3; score <= 1.0001; score += 0.05) {
      const l = luma(heatColor(score));
      expect(l).toBeGreaterThanOrEqual(previous);
      previous = l;
    }
  });
});

describe('smooth field', () => {
  it('keeps the data: cell centres reproduce the grid values', () => {
    const values = [0.3, 0.5, 0.7, 0.9, 0.4, 0.6, 0.8, 1.0, 0.5, 0.7, 0.9, 0.6];
    const f = smoothField(4, 3, values, 8);
    expect(f.width).toBe(32);
    // The pixel pair around a cell centre averages to that cell's value (Catmull-Rom interpolates).
    const centre = (i: number, j: number) => {
      const y = j * 8 + 3;
      return (f.value[y * 32 + i * 8 + 3]! + f.value[(y + 1) * 32 + i * 8 + 4]!) / 2;
    };
    expect(centre(1, 1)).toBeCloseTo(0.6, 1);
    expect(centre(2, 0)).toBeCloseTo(0.7, 1);
  });

  it('is smooth: no jumps between neighbouring pixels inside the data', () => {
    const values = Array.from({ length: 36 }, (_, k) => 0.3 + 0.7 * ((k % 6) / 5));
    const f = smoothField(6, 6, values, 8);
    let jump = 0;
    for (let k = 1; k < f.value.length; k++) {
      if (k % f.width === 0) continue;
      jump = Math.max(jump, Math.abs(f.value[k]! - f.value[k - 1]!));
    }
    expect(jump).toBeLessThan(0.05); // one cell step is 0.14; spread over 8 pixels
  });

  it('fades out where there is no data, and marks spread softly', () => {
    const values = [NaN, NaN, 0.8, 0.8, NaN, NaN, 0.8, 0.8];
    const mark = [false, false, true, false, false, false, true, false];
    const f = smoothField(4, 2, values, 8, mark);
    expect(f.alpha[4 * 32 + 2]).toBe(0); // deep in the empty half
    expect(f.alpha[4 * 32 + 29]).toBe(1); // deep in the data
    const edge = f.alpha[4 * 32 + 15]!;
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(1);
    expect(f.marked[4 * 32 + 20]).toBeGreaterThan(0.5);
    expect(f.marked[4 * 32 + 30]).toBeLessThan(0.5);
  });
});
