import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { buildContext } from '../../src/engine/context';
import { explainPoint } from '../../src/engine/explain';
import { modeField } from '../../src/engine/modeField';
import { RULES } from '../../src/engine/rules';
import { fragility, resizedRooms } from '../../src/engine/scoring/fragility';
import { LAYERS } from '../../src/engine/scoring/heatmaps';
import { makeScorer } from '../../src/engine/scoring/search';
import type { AnalysisOk, Project } from '../../src/engine/types';
import { runTask } from '../../src/engine/tasks';
import { estimated, makeProject } from '../fixtures/projects';

/** R1 engine additions: layers, the probe, fragility, rules of thumb, the room-mode explorer. */

function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

const roomR = makeProject();
const a = ok(roomR);
const cellAt = (x: number, y: number) => {
  const { x0, y0, step, nx } = a.layers;
  return Math.round((y - y0) / step) * nx + Math.round((x - x0) / step);
};

describe('seat layers', () => {
  it('every layer is a score from 0 to 1, NaN only where the seat cannot go', () => {
    const cells = a.layers.nx * a.layers.ny;
    for (const layer of LAYERS) {
      const values = a.layers.values[layer.id];
      expect(values).toHaveLength(cells);
      values.forEach((v, i) => {
        if (Number.isNaN(v)) expect(Number.isNaN(a.layers.values.goals[i]!)).toBe(true);
        else expect(v >= 0 && v <= 1).toBe(true);
      });
    }
  });

  it('the map and the probe agree at a cell', () => {
    const { x0, y0, step } = a.layers;
    const x = x0 + 20 * step;
    const y = y0 + 32 * step;
    const probe = explainPoint(roomR, { x, y })!;
    expect(a.layers.values.goals[cellAt(x, y)]).toBeCloseTo(probe.score, 9);
    expect(a.layers.values.overall[cellAt(x, y)]).toBeCloseTo(probe.overall, 9);
    const c1 = probe.breakdown.find((b) => b.componentId === 'C1')!.value;
    expect(a.layers.values.bass[cellAt(x, y)]).toBeCloseTo(c1, 9);
  });

  it('red-flag zones are marked: the room midpoint on the centreline, not 1 m from it', () => {
    expect(a.layers.redFlag[cellAt(2, 2.5)]).toBe(true);
    expect(a.layers.redFlag[cellAt(2, 3.5)]).toBe(false);
  });

  it('a mirror-symmetric setup gives mirror-symmetric layers', () => {
    const { nx, ny } = a.layers;
    for (const layer of ['bass', 'nulls', 'frontWall'] as const) {
      const values = a.layers.values[layer];
      for (let j = 0; j < ny; j += 5) {
        for (let i = 0; i < nx; i++) {
          const v = values[j * nx + i]!;
          const mirrored = values[j * nx + (nx - 1 - i)]!;
          if (Number.isNaN(v)) expect(Number.isNaN(mirrored)).toBe(true);
          else expect(v).toBeCloseTo(mirrored, 6);
        }
      }
    }
  });
});

describe('the probe', () => {
  it('needs the room size', () => {
    const p = makeProject();
    p.room.width = { value: null, certainty: 'unknown' };
    expect(explainPoint(p, { x: 2, y: 3 })).toBeNull();
  });

  it('reports only what changes with position, red flags first', () => {
    const probe = explainPoint(roomR, { x: 2, y: 2.5 })!;
    const roomLevel = new Set(RULES.filter((r) => r.scope === 'room').map((r) => r.id));
    expect(probe.findings.some((f) => roomLevel.has(f.ruleId))).toBe(false);
    expect(probe.findings[0]!.messageKey).toBe('finding.G01.redFlag');
    expect(probe.redFlag).toBe(true);
  });

  it('a seat behind the speakers is not a valid spot', () => {
    expect(explainPoint(roomR, { x: 2, y: 0.3 })!.valid).toBe(false);
  });
});

describe('fragility', () => {
  it('every candidate and the current setup carry it', () => {
    for (const c of [a.current, ...a.candidates]) {
      expect(['steady', 'sensitive', 'fragile']).toContain(c.fragility!.level);
      expect(c.fragility!.positionDrop).toBeGreaterThanOrEqual(0);
    }
  });

  it('room sizes that are only estimated make a spot more fragile, never less', () => {
    const measured = makeProject();
    const guessed = makeProject();
    for (const dim of ['width', 'length', 'height'] as const) {
      guessed.room[dim] = estimated(guessed.room[dim].value!);
    }
    const drop = (p: Project) => {
      const scorer = makeScorer(buildContext(p)!);
      return fragility(scorer, resizedRooms(scorer), a.candidates[0]!).roomDrop;
    };
    expect(drop(guessed)).toBeGreaterThanOrEqual(drop(measured));
  });
});

describe('rules of thumb against the seat map', () => {
  it('38 % and two thirds of the room length, with a verdict that matches the gap', () => {
    const [h01, h02] = a.folk;
    expect(h01!.seatY).toBeCloseTo(1.9, 9);
    expect(h02!.seatY).toBeCloseTo(10 / 3, 9);
    for (const f of a.folk) {
      if (f.verdict === 'notAllowed') continue;
      const gap = f.bestScore - f.score;
      expect(f.verdict).toBe(gap <= 0.03 ? 'asGood' : gap <= 0.1 ? 'close' : 'worse');
    }
  });
});

describe('room-mode explorer (physics)', () => {
  const rows = (f: number) => {
    const { nx, ny, y0, step, values } = modeField(roomR, f)!.grid;
    const means = Array.from(
      { length: ny },
      (_, j) => values.slice(j * nx, (j + 1) * nx).reduce((s, v) => s + v, 0) / nx,
    );
    return { quietestY: y0 + means.indexOf(Math.min(...means)) * step, values };
  };

  it('levels are relative to the loudest spot', () => {
    const { values } = rows(50);
    expect(Math.max(...values)).toBe(0);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-40);
  });

  it('at the first length mode (34.3 Hz) the quietest row is the room’s middle', () => {
    expect(Math.abs(rows(34.3).quietestY - 2.5)).toBeLessThan(0.2);
  });

  it('at the second length mode (68.6 Hz) it is a quarter from either end', () => {
    const y = rows(68.6).quietestY;
    expect(Math.min(Math.abs(y - 1.25), Math.abs(y - 3.75))).toBeLessThan(0.2);
  });

  it('names the modes near the note', () => {
    const near = modeField(roomR, 68.6)!.nearbyModes.map((m) => m.n.join(''));
    expect(near).toEqual(expect.arrayContaining(['020', '001']));
  });
});

describe('worker tasks', () => {
  it('runs an analysis, a probe or a mode map', () => {
    expect(runTask({ id: 1, project: roomR })).toHaveProperty('analysis');
    expect(
      runTask({ id: 2, project: roomR, task: { kind: 'explain', seat: { x: 2, y: 3 } } }),
    ).toHaveProperty('explanation');
    expect(
      runTask({ id: 3, project: roomR, task: { kind: 'modeField', frequency: 60 } }),
    ).toHaveProperty('modeField');
  });
});

describe('every finding says what it is about', () => {
  it('concern and scope on every rule; the concern travels with the finding', () => {
    for (const rule of RULES) {
      expect(rule.concern).toBeTruthy();
      expect(['room', 'placement']).toContain(rule.scope);
    }
    for (const f of a.findings) {
      expect(f.concern).toBe(RULES.find((r) => r.id === f.ruleId)!.concern);
    }
  });
});
