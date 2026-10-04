import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { analyze } from '../../src/engine/analyze';
import { buildContext } from '../../src/engine/context';
import { confidence } from '../../src/engine/confidence';
import { findingMessageKeys } from '../../src/engine/rules';
import { listenerHeatmap, makeScorer } from '../../src/engine/scoring/search';
import { scoringSettings } from '../../src/engine/scoring/settings';
import { Scorer } from '../../src/engine/scoring/scorer';
import { hypotheses } from '../../src/engine/subjective';
import type { AnalysisOk, Certainty, GoalId, Project } from '../../src/engine/types';
import { busyRoom } from '../fixtures/busy-room';
import { makeProject } from '../fixtures/projects';

function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

const roomR = ok(makeProject());
const busy = ok(busyRoom());

describe('analyze()', () => {
  it('needs the room size before anything else', () => {
    const p = makeProject();
    p.room.height = { value: null, certainty: 'unknown' };
    const a = analyze(p);
    expect(a.status).toBe('needs-room-size');
    expect(a.confidence.overall).toBeLessThan(1);
  });

  it('is deterministic', () => {
    expect(JSON.stringify(analyze(makeProject()))).toBe(JSON.stringify(roomR));
  });

  it('every finding carries a rule ID, a level, a known message key and (for non-heuristics) a source', () => {
    const keys = new Set(findingMessageKeys());
    for (const f of [...roomR.findings, ...busy.findings]) {
      expect(f.ruleId).toMatch(/^[PGH]\d\d$/);
      expect(keys.has(f.messageKey)).toBe(true);
      if (f.level !== 'heuristic') expect(f.sources.length).toBeGreaterThan(0);
    }
  });

  it('findings are sorted red flags first', () => {
    const order = { 'red-flag': 0, caution: 1, info: 2, ok: 3 };
    const ranks = busy.findings.map((f) => order[f.severity]);
    expect(ranks).toEqual([...ranks].sort((x, y) => x - y));
  });

  it('candidates are valid, distinct, ranked and never at the room midpoint', () => {
    for (const a of [roomR, busy]) {
      expect(a.candidates.length).toBeGreaterThanOrEqual(3);
      a.candidates.forEach((c, i) => {
        if (i > 0) expect(c.score).toBeLessThanOrEqual(a.candidates[i - 1]!.score);
        expect(c.listener.y).toBeGreaterThan(c.speakers.left.base.y + 0.5);
      });
      const L = a === roomR ? 5 : 4.4;
      expect(Math.abs(a.candidates[0]!.listener.y - L / 2) / L).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('the best candidate beats the deliberately poor Room R starting setup', () => {
    expect(roomR.candidates[0]!.score).toBeGreaterThan(roomR.current.score + 0.1);
    expect(roomR.topActions.some((a) => a.kind === 'move')).toBe(true);
  });

  it('Room R flags the 68.6 Hz coincidence', () => {
    const coincident = roomR.findings.filter((f) => f.messageKey === 'finding.P11.coincident');
    expect(coincident.some((f) => Math.abs(Number(f.params.frequencyA) - 68.6) < 0.1)).toBe(true);
  });

  it('busy room: rear-port wall setting reminder, passive-speaker caution, low-confidence CD wall', () => {
    const keys = busy.findings.map((f) => f.messageKey);
    expect(keys).toContain('finding.G07.matchSetting');
    expect(keys).toContain('finding.G10.passiveSpeaker');
    expect(busy.confidence.caps.map((c) => c.reason)).toContain('lowConfidenceSurface');
  });

  it('runs fast enough for a worker (generous CI margin)', () => {
    const t = performance.now();
    analyze(makeProject({ W: 6, L: 8, H: 3, listenerY: 5 }));
    expect(performance.now() - t).toBeLessThan(3000);
  });
});

describe('invariants', () => {
  it('a mirror-symmetric setup gives a mirror-symmetric seat heatmap', () => {
    const ctx = buildContext(makeProject())!;
    const scorer = makeScorer(ctx);
    const grid = listenerHeatmap(scorer, ctx.variant.speakers, 1.1);
    for (let j = 0; j < grid.ny; j += 7) {
      for (let i = 0; i < grid.nx; i++) {
        const v = grid.values[j * grid.nx + i]!;
        const mirrored = grid.values[j * grid.nx + (grid.nx - 1 - i)]!;
        if (Number.isNaN(v)) expect(Number.isNaN(mirrored)).toBe(true);
        else expect(v).toBeCloseTo(mirrored, 6);
      }
    }
  });

  it('goals never change the physics components C1–C3', () => {
    const goalIds: GoalId[] = [
      'wide-stage',
      'precise-imaging',
      'flat-response',
      'deep-bass',
      'low-volume-listening',
    ];
    const ctx = buildContext(makeProject())!;
    const placement = { speakers: ctx.variant.speakers, listener: ctx.variant.listener.ears };
    const physics = (goals: Project['goals']) =>
      new Scorer(ctx, scoringSettings(goals))
        .score(placement)
        .breakdown.filter((b) => ['C1', 'C2', 'C3'].includes(b.componentId))
        .map((b) => b.value);
    const baseline = physics({ weights: {} });
    fc.assert(
      fc.property(fc.array(fc.constantFrom(0, 1, 2), { minLength: 5, maxLength: 5 }), (levels) => {
        const weights = Object.fromEntries(goalIds.map((g, i) => [g, levels[i]]));
        expect(physics({ weights })).toEqual(baseline);
      }),
      { numRuns: 25 },
    );
  });

  it('weights always sum to 1 and stay within ×0.5–×1.5 of the defaults', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(0, 1, 2), { minLength: 4, maxLength: 4 }), (levels) => {
        const [wide, precise, flat, deep] = levels as (0 | 1 | 2)[];
        const s = scoringSettings({
          weights: {
            'wide-stage': wide,
            'precise-imaging': precise,
            'flat-response': flat,
            'deep-bass': deep,
          },
        });
        const total = Object.values(s.weights).reduce((a, b) => a + b, 0);
        expect(total).toBeCloseTo(1, 9);
        expect(s.weights.C1).toBeGreaterThanOrEqual(0.35 * 0.5);
        expect(s.weights.C1).toBeLessThanOrEqual(0.35 * 1.5);
      }),
    );
  });

  it('improving any input certainty never lowers confidence', () => {
    const levels: Certainty[] = ['unknown', 'estimated', 'measured'];
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        fc.constantFrom('width', 'length', 'height'),
        (from, dim) => {
          const p = makeProject();
          p.room[dim] = { ...p.room[dim], certainty: levels[from]! };
          const before = confidence(p, buildContext(p)).overall;
          p.room[dim] = { ...p.room[dim], certainty: levels[from + 1]! };
          expect(confidence(p, buildContext(p)).overall).toBeGreaterThanOrEqual(before);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('confidence caps apply for lightweight walls and non-rectangular rooms', () => {
    const p = makeProject();
    p.room.construction = 'lightweight';
    expect(confidence(p, buildContext(p)).perOutput.bass).toBeLessThanOrEqual(0.6);
    p.room.outOfModel = ['non-rectangular'];
    const report = confidence(p, buildContext(p));
    Object.values(report.perOutput).forEach((v) => expect(v).toBeLessThanOrEqual(0.3));
  });
});

describe('subjective rules', () => {
  it('ranks hypotheses supported by the room data first', () => {
    const p = makeProject({ listenerY: 4.8 });
    const a = ok(p);
    const result = hypotheses(['S01'], a.findings);
    expect(result[0]).toMatchObject({ id: 'backWallClose', supported: true });
  });
});

describe('message keys', () => {
  it('are unique', () => {
    const keys = findingMessageKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });
});
