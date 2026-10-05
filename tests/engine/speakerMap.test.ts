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

  it('has scores where the speakers can stand and gaps where they cannot', () => {
    const scored = grid.values.filter(Number.isFinite).length;
    expect(scored).toBeGreaterThan(grid.values.length * 0.15);
    // Behind the seat nothing is scored: the last row is empty.
    const last = grid.values.slice((grid.ny - 1) * grid.nx);
    expect(last.every((v) => Number.isNaN(v))).toBe(true);
  });

  it('is computed in reasonable time', () => {
    expect(ms).toBeLessThan(6000);
  });
});
