import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import type { AnalysisOk } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

describe('the speaker map', () => {
  const project = makeProject({ W: 5.2, L: 5 });
  // A seat that is not in the middle: the map must still follow the room's centre line.
  project.variants[0]!.listener.ears.x = 2.9;
  const t0 = performance.now();
  const a = analyze(project) as AnalysisOk;
  const ms = performance.now() - t0;
  const grid = a.heatmap.speakers;

  it('covers the whole length of the room and half its width', () => {
    expect(grid.y0 + (grid.ny - 1) * grid.step).toBeGreaterThan(project.room.length.value! - 0.2);
    expect(grid.x0 + (grid.nx - 1) * grid.step).toBeCloseTo(2.6 - grid.step / 2, 6); // W / 2
  });

  it('scores the spots where a stereo pair can stand, and marks the rest "not a stereo spot"', () => {
    const scored = grid.values.filter(Number.isFinite).length;
    expect(scored).toBeGreaterThan(grid.values.length * 0.3);
    // Behind the seat there is no stereo setup: no score on the good-to-poor scale (docs/ROADMAP_V7.md).
    const k = (grid.ny - 2) * grid.nx + 3;
    expect(Number.isNaN(grid.values[k]!)).toBe(true);
    expect(grid.inert![k]).toBe(true);
    grid.values.forEach((v, i) => expect(Number.isFinite(v)).toBe(!grid.inert![i]));
  });

  it('is computed in reasonable time', () => {
    expect(ms).toBeLessThan(6000);
  });
});
