import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { acousticCentre, buildContext } from '../../src/engine/context';
import { distance } from '../../src/engine/math/geometry';
import { RULES } from '../../src/engine/rules';
import type { AnalysisOk, Candidate, Project } from '../../src/engine/types';
import { busyRoom } from '../fixtures/busy-room';
import { estimated, genericSpeaker, makeProject, measured } from '../fixtures/projects';

/**
 * Golden scenarios (docs/TEST_PLAN.md §5). Each snapshot holds the top three candidates (positions
 * rounded to 5 cm, scores to 2 decimals) and the findings that are not "ok". A changed snapshot
 * means the advice changed: review it, explain it in the commit message, then update it with
 * `npx vitest run -u`. Each scenario also checks what it is for.
 */

function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

const cm5 = (v: number) => Math.round(v * 20) / 20;
const two = (v: number) => Math.round(v * 100) / 100;

function summary(a: AnalysisOk) {
  return {
    current: two(a.current.score),
    candidates: a.candidates.slice(0, 3).map((c) => ({
      speakersX: [cm5(c.speakers.left.base.x), cm5(c.speakers.right.base.x)],
      speakersY: cm5(c.speakers.left.base.y),
      seat: [cm5(c.listener.x), cm5(c.listener.y)],
      score: two(c.score),
    })),
    findings: a.findings
      .filter((f) => f.severity !== 'ok')
      .map((f) => `${f.severity} ${f.messageKey.replace('finding.', '')}`),
  };
}

function findingKeysAt(project: Project, c: Candidate): string[] {
  const ctx = buildContext(project)!;
  return RULES.flatMap((rule) => rule.evaluate(ctx, c)).map((f) => f.messageKey);
}

describe('golden scenarios', () => {
  it('Room R, default speaker: avoids the midpoint, shows the 68.6 Hz coincidence', () => {
    const a = ok(makeProject());
    expect(summary(a)).toMatchSnapshot();
    for (const c of a.candidates) expect(Math.abs(c.listener.y - 2.5)).toBeGreaterThanOrEqual(0.25);
    const coincident = a.findings.find((f) => f.messageKey === 'finding.P11.coincident')!;
    expect(Number(coincident.params.frequencyA)).toBeCloseTo(68.6, 1);
  });

  it('4 m cube: stacked modes are a caution; confidence is that of any valid room', () => {
    const cube = makeProject({ W: 4, L: 4, H: 4, listenerY: 2.8 });
    const a = ok(cube);
    expect(summary(a)).toMatchSnapshot();
    const coincident = a.findings.find((f) => f.messageKey === 'finding.P11.coincident');
    expect(coincident?.severity).toBe('caution');
    expect(a.confidence.overall).toBeCloseTo(ok(makeProject()).confidence.overall, 9);
  });

  it('long narrow room 3 × 8 × 2.5 m: a good stereo angle is still reachable', () => {
    const p = makeProject({ W: 3, L: 8, H: 2.5, listenerY: 3.5, halfSpacing: 0.9 });
    const a = ok(p);
    expect(summary(a)).toMatchSnapshot();
    const keys = findingKeysAt(p, a.candidates[0]!);
    expect(keys.some((k) => k === 'finding.G04.ok' || k === 'finding.G04.info')).toBe(true);
  });

  it('tiny room 2.5 × 3 × 2.4 m: 1.5 m away where the room allows, otherwise marked closer', () => {
    const p = makeProject({
      W: 2.5,
      L: 3,
      H: 2.4,
      listenerY: 2.2,
      halfSpacing: 0.6,
      clearance: 0.3,
    });
    const a = ok(p);
    expect(summary(a)).toMatchSnapshot();
    expect(a.candidates.length).toBeGreaterThan(0);
    const speaker = buildContext(p)!.speaker;
    for (const c of a.candidates) {
      for (const side of ['left', 'right'] as const) {
        const d = distance(acousticCentre(c.speakers[side], speaker), c.listener);
        expect(d).toBeGreaterThanOrEqual(c.closer ? 0.6 - 1e-9 : 1.5 - 1e-9);
      }
    }
  });

  it('lightweight (plasterboard) walls: bass confidence is capped at 0.6', () => {
    const p = makeProject();
    for (const w of ['front', 'back', 'left', 'right'] as const) p.surfaces.base[w] = 'gypsum-stud';
    expect(ok(p).confidence.perOutput.bass).toBeLessThanOrEqual(0.6);
  });

  it('slanted ceiling: outside the model, so the bass confidence is capped', () => {
    const p = makeProject();
    p.room.outOfModel = ['slanted-ceiling'];
    const a = ok(p);
    expect(a.confidence.caps.map((c) => c.reason)).toContain('outOfModel');
    expect(a.confidence.perOutput.bass).toBeLessThanOrEqual(0.5);
  });

  it('seat fixed against the back wall: red flag, and the best speaker spots for that seat', () => {
    const p = makeProject({ listenerY: 4.8 });
    p.constraints.listenerFixed = true;
    const a = ok(p);
    expect(summary(a)).toMatchSnapshot();
    expect(a.findings.map((f) => f.messageKey)).toContain('finding.G02.redFlag');
    expect(a.candidates.length).toBeGreaterThan(0);
    for (const c of a.candidates) expect(c.listener.y).toBe(4.8);
  });

  it('rear port with a manufacturer minimum: caution now, minimum kept by every candidate', () => {
    const speaker = genericSpeaker({ minWallDistance: measured(0.3) });
    const p = makeProject({ speaker, clearance: 0.2 });
    const a = ok(p);
    expect(summary(a)).toMatchSnapshot();
    expect(a.findings.map((f) => f.messageKey)).toContain('finding.G07.tooClose');
    const depth = speaker.dimensions.d.value!;
    for (const c of a.candidates) {
      expect(c.speakers.left.base.y - depth / 2).toBeGreaterThanOrEqual(0.3 - 1e-9);
    }
  });

  it('the busy room: wall-setting reminder, dead room → treble lift to try', () => {
    const a = ok(busyRoom());
    expect(summary(a)).toMatchSnapshot();
    const keys = a.findings.map((f) => f.messageKey);
    expect(keys).toContain('finding.G07.matchSetting');
    expect(keys).toContain('finding.P08.dead');
    expect(keys).toContain('finding.H06.lift');
  });

  it('a satellite speaker (−6 dB at 160 Hz): bass not scored, everything else still works', () => {
    const p = makeProject();
    p.speaker.lowFrequencyMinus6dB = estimated(160);
    const a = ok(p);
    expect(summary(a)).toMatchSnapshot();
    expect(a.findings.map((f) => f.messageKey)).toContain('finding.P09.notScored');
  });
});
