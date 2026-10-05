import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ABSOLUTE,
  fillGaps,
  heatColor,
  MIN_SPAN,
  NOT_A_SPOT,
  RAMPS,
  roomRange,
  smoothField,
} from '../../src/app/map/heat';

const luma = ([r, g, b]: number[]) => 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;

describe('heat ramp', () => {
  const hex = (c: number[]) =>
    '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

  it('runs from soft sand (poor) to deep green (best), and to a light green on dark', () => {
    expect(hex(heatColor(0.3))).toBe(RAMPS.light[0]);
    expect(hex(heatColor(1))).toBe(RAMPS.light[4]);
    expect(hex(heatColor(1, 'dark'))).toBe(RAMPS.dark[4]);
  });

  it('is clamped outside the range, and lightness alone gives the order (colour-blind safe)', () => {
    expect(heatColor(-1)).toEqual(heatColor(0.3));
    expect(heatColor(2)).toEqual(heatColor(1));
    for (const theme of ['light', 'dark'] as const) {
      // Light: better is deeper (darker); dark: better is brighter. Poor recedes into the page.
      const sign = theme === 'light' ? -1 : 1;
      let previous = -Infinity;
      for (let score = 0.3; score <= 1.0001; score += 0.05) {
        const l = sign * luma(heatColor(score, theme));
        expect(l).toBeGreaterThan(previous);
        previous = l;
      }
      const span = Math.abs(luma(heatColor(1, theme)) - luma(heatColor(0.3, theme)));
      expect(span).toBeGreaterThan(100);
    }
  });

  it('matches the --heat tokens the legend and the other charts use', () => {
    const css = readFileSync(resolve(__dirname, '../../src/app/tokens.css'), 'utf8');
    const light = css.slice(0, css.indexOf('@media'));
    const dark = css.slice(css.indexOf(":root[data-theme='dark']"));
    RAMPS.light.forEach((c, i) => expect(light).toContain(`--heat-${i}: ${c};`));
    RAMPS.dark.forEach((c, i) => expect(dark).toContain(`--heat-${i}: ${c};`));
    expect(light).toContain(`--heat-none: ${NOT_A_SPOT.light.fill};`);
    expect(dark).toContain(`--heat-none: ${NOT_A_SPOT.dark.fill};`);
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

  it('carries "not a spot" apart from the scores, so it is drawn in its own tone', () => {
    const values = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8];
    const none = [true, true, false, false, true, true, false, false];
    const f = smoothField(4, 2, values, 8, undefined, new Float32Array(8).fill(1), none);
    expect(f.inert[4 * 32 + 2]).toBeGreaterThan(0.9);
    expect(f.inert[4 * 32 + 29]).toBeLessThan(0.1);
    expect(f.marked.every((m) => m === 0)).toBe(true);
  });
});

describe('colour range and gaps', () => {
  it('stretches colours over the room’s own range, but never over a tiny one', () => {
    const wide = Array.from({ length: 101 }, (_, i) => 0.4 + 0.004 * i); // 0.40 … 0.80
    const r = roomRange(wide);
    expect(r.lo).toBeCloseTo(0.408, 2);
    expect(r.hi).toBeCloseTo(0.792, 2);
    const flat = [0.61, 0.62, 0.6, 0.63, NaN];
    const f = roomRange(flat);
    expect(f.hi - f.lo).toBeCloseTo(MIN_SPAN, 6); // near-equal seats stay soft colours
    expect(roomRange([NaN])).toEqual(ABSOLUTE);
  });

  it('fills cells without data from the nearest scored cell, with their distance', () => {
    const { filled, dist } = fillGaps(3, 3, [NaN, NaN, NaN, NaN, NaN, NaN, 0.2, 0.5, 0.9]);
    expect(dist[7]).toBe(0);
    expect(dist[4]).toBe(1);
    expect(dist[0]).toBe(2);
    expect(filled[4]).toBeCloseTo(0.5, 6);
    expect(filled[2]).toBeCloseTo(0.9, 6);
  });
});
