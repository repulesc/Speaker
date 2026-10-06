import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { buildContext, currentPlacement } from '../../src/engine/context';
import { explainPoint, explainSpeakerSpot } from '../../src/engine/explain';
import { speakerHeatmap } from '../../src/engine/scoring/heatmaps';
import { makeScorer } from '../../src/engine/scoring/search';
import { THRESHOLDS } from '../../src/engine/scoring/thresholds';
import type { AnalysisOk, Project } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

/**
 * The cases the owner tried after V6 (docs/ROADMAP_V7.md, Phase 1): the app must never call a
 * nonsense setup good, and one word must mean one number everywhere.
 */
function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

function speakersBehind(): Project {
  const p = makeProject({});
  const v = p.variants[0]!;
  v.speakers.left.base.y = v.listener.ears.y + 1;
  v.speakers.right.base.y = v.listener.ears.y + 1;
  return p;
}

describe('speakers beside or behind the seat are not a stereo setup', () => {
  it('scores Poor (below 0.5) and says so with a red flag', () => {
    const a = ok(speakersBehind());
    expect(a.current.score).toBeLessThan(0.5);
    expect(a.current.nominalScore).toBeLessThanOrEqual(THRESHOLDS.notStereoScoreCap);
    const flag = a.findings.find((f) => f.ruleId === 'G11');
    expect(flag?.severity).toBe('red-flag');
  });

  it('beside the seat is the same', () => {
    const p = makeProject({});
    const v = p.variants[0]!;
    v.speakers.left.base.y = v.listener.ears.y;
    v.speakers.right.base.y = v.listener.ears.y;
    expect(ok(p).current.score).toBeLessThan(0.5);
  });

  it('a normal setup in front is not touched', () => {
    const a = ok(makeProject({}));
    expect(a.current.score).toBeGreaterThan(THRESHOLDS.notStereoScoreCap);
    expect(a.findings.some((f) => f.ruleId === 'G11')).toBe(false);
  });

  it('on the speaker map, spots beside and behind the seat are marked "not a stereo spot"', () => {
    const p = makeProject({});
    const ctx = buildContext(p)!;
    const grid = speakerHeatmap(makeScorer(ctx), currentPlacement(ctx).listener);
    const row = Math.round((p.variants[0]!.listener.ears.y + 0.5 - grid.y0) / grid.step);
    const k = row * grid.nx; // left edge, behind the seat
    expect(grid.inert?.[k]).toBe(true);
    expect(Number.isNaN(grid.values[k]!)).toBe(true);
    // In front of the seat, near the front wall, about 0.9 m left of the middle: a real candidate.
    const col = Math.round((grid.x0 + (grid.nx - 1) * grid.step - 0.9 - grid.x0) / grid.step);
    const front = Math.round((0.5 - grid.y0) / grid.step) * grid.nx + col;
    expect(grid.inert?.[front]).toBe(false);
  });
});

describe('one word, one number', () => {
  it('the seat probe at the current seat gives the same score as "Now"', () => {
    const p = makeProject({});
    const a = ok(p);
    const ears = p.variants[0]!.listener.ears;
    const e = explainPoint(p, { x: ears.x, y: ears.y })!;
    expect(e.robust).toBeCloseTo(a.current.score, 9);
  });

  it('the speaker-map hover at the suggested spot gives the score the suggestion has', () => {
    const p = makeProject({});
    p.constraints.listenerFixed = true;
    const a = ok(p);
    const best = a.candidates[0]!;
    const spot = explainSpeakerSpot(p, {
      x: best.speakers.left.base.x,
      y: best.speakers.left.base.y,
    })!;
    expect(spot.stereo).toBe(true);
    expect(spot.robust).toBeCloseTo(best.score, 9);
  });

  it('the speaker map legend names the best spot by the score the hover gives there', () => {
    const p = makeProject({});
    const ctx = buildContext(p)!;
    const grid = speakerHeatmap(makeScorer(ctx), currentPlacement(ctx).listener);
    const scored = grid.values.flatMap((v, k) => (Number.isFinite(v) ? [k] : []));
    scored.sort((a, b) => grid.values[a]! - grid.values[b]!);
    const k = scored[Math.round(0.98 * (scored.length - 1))]!;
    const at = {
      x: grid.x0 + (k % grid.nx) * grid.step,
      y: grid.y0 + Math.floor(k / grid.nx) * grid.step,
    };
    expect(grid.best).toBeCloseTo(explainSpeakerSpot(p, at)!.robust, 9);
  });

  it('the speaker-map hover behind the seat is not a stereo spot', () => {
    const p = makeProject({});
    const ears = p.variants[0]!.listener.ears;
    const spot = explainSpeakerSpot(p, { x: ears.x - 0.8, y: ears.y + 0.5 })!;
    expect(spot.stereo).toBe(false);
  });
});
