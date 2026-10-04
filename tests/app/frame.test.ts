import { describe, expect, it } from 'vitest';
import { fitFrame, toPx, toWorld } from '../../src/app/plan/frame';

const margins = { left: 50, right: 50, top: 40, bottom: 40 };

describe('plan frame', () => {
  it('fits the room into the viewport, keeping its aspect ratio and centring it', () => {
    const f = fitFrame(900, 600, 4, 5, margins);
    expect(f.scale).toBeCloseTo((600 - 80) / 5, 6); // height is the limit
    expect(f.oy).toBe(40);
    expect(f.ox).toBeCloseTo(50 + (800 - 4 * f.scale) / 2, 6);
  });

  it('never collapses to nothing in a tiny viewport', () => {
    expect(fitFrame(10, 10, 4, 5, margins).scale).toBe(1);
  });

  it('pixel and world conversions are inverses', () => {
    const f = fitFrame(900, 600, 4, 5, margins);
    const p = toPx(f, 1.25, 3.5);
    const w = toWorld(f, p.x, p.y);
    expect(w.a).toBeCloseTo(1.25, 9);
    expect(w.b).toBeCloseTo(3.5, 9);
  });
});
