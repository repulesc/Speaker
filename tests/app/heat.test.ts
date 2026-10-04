import { describe, expect, it } from 'vitest';
import { heatColor } from '../../src/app/map/heat';

const luma = ([r, g, b]: number[]) => 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;

describe('heat ramp', () => {
  it('runs from viridis dark purple to yellow', () => {
    expect(heatColor(0.3).map(Math.round)).toEqual([0x44, 0x01, 0x54]);
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
