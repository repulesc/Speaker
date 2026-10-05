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

  it('shows the whole room: stereo scores where the speakers can stand, bass only (hatched) elsewhere', () => {
    const scored = grid.values.filter(Number.isFinite).length;
    expect(scored).toBeGreaterThan(grid.values.length * 0.85);
    // Behind the seat there is no stereo setup, but the room's bass is still shown, flagged.
    const k = (grid.ny - 2) * grid.nx + 3;
    expect(Number.isFinite(grid.values[k]!)).toBe(true);
    expect(grid.redFlag![k]).toBe(true);
  });

  it('is computed in reasonable time', () => {
    expect(ms).toBeLessThan(6000);
  });
});

describe('furniture does not hide the maps', () => {
  const project = makeProject({ W: 5, L: 5 });
  project.variants[0]!.objects = [
    {
      id: 'sofa',
      kind: 'sofa',
      position: { x: 0.2, y: 0.2, z: 0 },
      size: { x: 1.2, y: 1.2, z: 0.8 },
      hard: false,
    },
  ];
  const a = analyze(project) as AnalysisOk;

  it('speaker map: spots on furniture are scored and flagged, not left blank', () => {
    const g = a.heatmap.speakers;
    const at = (x: number, y: number) =>
      Math.round((y - g.y0) / g.step) * g.nx + Math.round((x - g.x0) / g.step);
    const k = at(0.7, 0.7); // inside the sofa
    expect(Number.isFinite(g.values[k]!)).toBe(true);
    expect(g.redFlag![k]).toBe(true);
    const free = at(1.8, 0.7);
    expect(g.redFlag![free]).toBe(false);
  });

  it('seat map: cells on furniture are scored too', () => {
    const l = a.layers;
    const k = Math.round((2 - l.y0) / l.step) * l.nx + Math.round((0.7 - l.x0) / l.step);
    expect(Number.isFinite(l.values.overall[k]!)).toBe(true);
  });
});
