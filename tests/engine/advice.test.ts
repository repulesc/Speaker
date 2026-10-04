import { describe, expect, it } from 'vitest';
import { advice, adviceMessageKeys } from '../../src/engine/advice';
import { analyze } from '../../src/engine/analyze';
import { buildContext, currentPlacement } from '../../src/engine/context';
import { RULES } from '../../src/engine/rules';
import type { Advice, AnalysisOk, Project } from '../../src/engine/types';
import { busyRoom } from '../fixtures/busy-room';
import { estimated, makeProject } from '../fixtures/projects';

/** Treatment advisor (T rules) and speaker settings (D rules). */

function adviceFor(project: Project): { treatment: Advice[]; settings: Advice[] } {
  const ctx = buildContext(project)!;
  const placement = currentPlacement(ctx);
  const findings = RULES.flatMap((rule) => rule.evaluate(ctx, placement));
  return advice(ctx, placement, findings);
}

const keys = (list: Advice[]) => list.map((a) => a.messageKey.replace('advice.', ''));

describe('every piece of advice', () => {
  it('has a known key, sources, a priority, and comes most useful first', () => {
    const known = new Set(adviceMessageKeys());
    expect(known.size).toBe(adviceMessageKeys().length);
    const a = analyze(busyRoom()) as AnalysisOk;
    for (const list of [a.advice.treatment, a.advice.settings]) {
      expect(list.map((x) => x.priority)).toEqual(
        [...list.map((x) => x.priority)].sort((x, y) => y - x),
      );
      for (const x of list) {
        expect(known.has(x.messageKey)).toBe(true);
        expect(x.sources.length).toBeGreaterThan(0);
        expect(x.priority > 0 && x.priority <= 1).toBe(true);
      }
    }
  });
});

describe('treatment', () => {
  it('T01: side reflections follow the goals (absorb for imaging, leave for width)', () => {
    const precise = makeProject();
    precise.goals.weights = { 'precise-imaging': 2 };
    expect(keys(adviceFor(precise).treatment)).toContain('T01.absorb');
    const wide = makeProject();
    wide.goals.weights = { 'wide-stage': 2 };
    expect(keys(adviceFor(wide).treatment).some((k) => k.startsWith('T01'))).toBe(false);
    expect(keys(adviceFor(makeProject()).treatment)).toContain('T01.experiment');
  });

  it('T02: a rug only on a hard floor', () => {
    expect(keys(adviceFor(makeProject()).treatment)).toContain('T02.rug');
    const carpeted = makeProject({ surfaces: { floor: 'carpet-heavy' } });
    expect(keys(adviceFor(carpeted).treatment)).not.toContain('T02.rug');
  });

  it('T03: the front-wall dip — move first; a panel only when the speakers cannot move', () => {
    const free = adviceFor(makeProject()).treatment.find((a) => a.ruleId === 'T03')!;
    expect(free.messageKey).toBe('advice.T03.moveFirst');
    expect(free.params.quarterWavelength).toBeCloseTo(343 / Number(free.params.frequency) / 4, 9);
    const p = makeProject();
    p.constraints.speakersFixed = true;
    expect(keys(adviceFor(p).treatment)).toContain('T03.thickPanel');
  });

  it('T05: a live room softened, with the predicted reverberation; a dead one livened', () => {
    const live = makeProject();
    live.variants[0]!.busyness = estimated('bare');
    const soften = adviceFor(live).treatment.find((a) => a.ruleId === 'T05')!;
    expect(soften.messageKey).toBe('advice.T05.soften');
    expect(Number(soften.params.after)).toBeLessThan(Number(soften.params.t60));
    const liven = adviceFor(busyRoom()).treatment.find((a) => a.ruleId === 'T05')!;
    expect(liven.messageKey).toBe('advice.T05.liven');
    expect(Number(liven.params.after)).toBeGreaterThan(Number(liven.params.t60));
  });

  it('T06: head against the back wall comes first; an absorber only if the seat is fixed', () => {
    const p = makeProject({ listenerY: 4.8 });
    expect(adviceFor(p).treatment[0]!.messageKey).toBe('advice.T06.moveFirst');
    p.constraints.listenerFixed = true;
    expect(keys(adviceFor(p).treatment)).toContain('T06.absorber');
  });
});

describe('speaker settings', () => {
  it('D01, D03, D06: the busy room’s speaker — wall setting, treble lift, stand mode', () => {
    const k = keys(adviceFor(busyRoom()).settings);
    expect(k).toEqual(expect.arrayContaining(['D01.match', 'D03.lift', 'D06.stand']));
  });

  it('D02: a bass cut of one step when boundary gain is high and there is a control', () => {
    const p = makeProject({ clearance: 0.05, halfSpacing: 1.75, standZ: 0 });
    expect(keys(adviceFor(p).settings)).not.toContain('D02.cut');
    p.speaker.dsp.bass = { minDb: -6, maxDb: 6, stepDb: 0.5 };
    const cut = adviceFor(p).settings.find((a) => a.ruleId === 'D02')!;
    expect(cut.params.stepDb).toBe(-0.5);
  });

  it('D04: speakers on the floor — the base height that puts the tweeter at ear height', () => {
    const p = makeProject({ standZ: 0 });
    const height = adviceFor(p).settings.find((a) => a.ruleId === 'D04')!;
    expect(height.params.baseHeight).toBeCloseTo(1.1 - 0.2, 9);
  });

  it('D05: a rear port too close to the wall', () => {
    expect(keys(adviceFor(makeProject({ clearance: 0.05 })).settings)).toContain('D05.moveOut');
  });

  it('D06: desk mode when the speakers stand on a desk, if the speaker offers it', () => {
    const p = makeProject();
    p.speaker.dsp.placementModes = ['stand', 'desk'];
    p.variants[0]!.objects = [
      {
        id: 'desk',
        kind: 'desk',
        position: { x: 0.5, y: 0.3, z: 0 },
        size: { x: 3, y: 0.7, z: 0.7 },
        hard: true,
      },
    ];
    expect(keys(adviceFor(p).settings)).toContain('D06.desk');
  });
});

describe('analyze() carries the advice', () => {
  it('the same advice as the rules give for the current setup', () => {
    const a = analyze(busyRoom()) as AnalysisOk;
    expect(a.advice).toEqual(adviceFor(busyRoom()));
  });
});
