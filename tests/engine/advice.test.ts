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

describe('effort (docs/ROADMAP_V5.md, V5.1)', () => {
  it('free or cheap things can be tried today; panels and traps are an investment', () => {
    const effortOf = (list: Advice[], key: string) =>
      list.find((a) => a.messageKey === `advice.${key}`)?.effort;
    const precise = makeProject();
    precise.goals.weights = { 'precise-imaging': 2 };
    precise.constraints.speakersFixed = true;
    precise.constraints.listenerFixed = true;
    precise.variants[0]!.listener.ears.y = 4.8;
    const t = adviceFor(precise).treatment;
    expect(effortOf(t, 'T01.absorb')).toBe('invest');
    expect(effortOf(t, 'T03.thickPanel')).toBe('invest');
    expect(effortOf(t, 'T06.absorber')).toBe('invest');
    expect(effortOf(t, 'T02.rug')).toBe('cheap');
    const plain = adviceFor(makeProject()).treatment;
    expect(effortOf(plain, 'T01.experiment')).toBe('free');
    expect(effortOf(plain, 'T03.moveFirst')).toBe('free');
    const live = makeProject();
    live.variants[0]!.busyness = estimated('bare');
    expect(effortOf(adviceFor(live).treatment, 'T05.soften')).toBe('cheap');
    expect(effortOf(adviceFor(busyRoom()).treatment, 'T05.liven')).toBe('free');
  });

  it('every piece of advice says what it takes, and settings are never an investment', () => {
    for (const p of [makeProject(), busyRoom()]) {
      const { treatment, settings } = adviceFor(p);
      for (const a of [...treatment, ...settings])
        expect(['free', 'cheap', 'invest']).toContain(a.effort);
      expect(settings.every((a) => a.effort === 'free')).toBe(true);
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
    expect(Number(liven.params.absorption)).toBeGreaterThanOrEqual(1);
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

  it('D04: the axis above the ears even on the floor — tilt, never a 0 cm stand (R3 review F9)', () => {
    const p = makeProject({ standZ: 0 });
    p.variants[0]!.listener.ears.z = 0.5;
    p.speaker.acousticAxisHeight = { value: 1.2, certainty: 'measured' };
    const d04 = adviceFor(p).settings.find((a) => a.ruleId === 'D04')!;
    expect(d04.messageKey).toBe('advice.D04.tilt');
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

describe('D07: tone, if you have the controls (docs/ROADMAP_V5.md)', () => {
  it('a bass cut when the speakers stand close to walls and no bass control is known', () => {
    const p = makeProject({ clearance: 0.05, halfSpacing: 1.75, standZ: 0 });
    const k = keys(adviceFor(p).settings);
    expect(k).toContain('D07.bassCut');
    expect(k).not.toContain('D02.cut');
    // With a known control, D02 says it with the step, and D07 stays quiet.
    p.speaker.dsp.bass = { minDb: -6, maxDb: 6, stepDb: 0.5 };
    const known = keys(adviceFor(p).settings);
    expect(known).toContain('D02.cut');
    expect(known).not.toContain('D07.bassCut');
  });

  it('nothing about bass from placeholder speakers (not placed yet)', () => {
    const p = makeProject({ clearance: 0.05, halfSpacing: 1.75, standZ: 0 });
    for (const side of ['left', 'right'] as const)
      p.variants[0]!.speakers[side].certainty = 'unknown';
    expect(keys(adviceFor(p).settings)).not.toContain('D07.bassCut');
  });

  it('a treble lift in a dead room, the same thresholds as H06, when no treble control is known', () => {
    const p = busyRoom();
    delete p.speaker.dsp.treble;
    const lift = adviceFor(p).settings.find((a) => a.messageKey === 'advice.D07.trebleLift');
    expect(lift).toBeDefined();
    expect(lift!.params.suggestDb).toBe(0.5);
    expect(lift!.params.t60 as number).toBeLessThan(0.3);
    expect(keys(adviceFor(busyRoom()).settings)).not.toContain('D07.trebleLift');
  });

  it('nothing about treble from an undescribed room', () => {
    const k = keys(adviceFor(makeProject()).settings);
    expect(k).not.toContain('D07.trebleLift');
    expect(k).not.toContain('D07.trebleCut');
  });
});

describe('analyze() carries the advice', () => {
  it('the same advice as the rules give for the current setup', () => {
    const a = analyze(busyRoom()) as AnalysisOk;
    expect(a.advice).toEqual(adviceFor(busyRoom()));
  });
});

describe('contextual tips (V7): only for their situation', () => {
  const ids = (p: Project) => adviceFor(p).settings.map((a) => a.ruleId);

  it('nobody gets them by default', () => {
    for (const id of ['C01', 'C02', 'C03']) expect(ids(makeProject())).not.toContain(id);
  });

  it('a desk gets the desk-reflection tip; a bed gets the bed tip', () => {
    const desk = makeProject();
    desk.constraints.listeningDistance = 'near';
    expect(ids(desk)).toContain('C01');
    const bed = makeProject();
    bed.variants[0]!.listener.area = 'bed';
    expect(ids(bed)).toContain('C03');
  });

  it('small speakers in a long room: the deepest resonance stays quiet; never for a generic speaker', () => {
    const p = makeProject({ W: 4, L: 7 }); // first length resonance ≈ 24.5 Hz
    p.speaker.choices = { kind: 'desktop', size: 'small' };
    p.speaker.lowFrequencyMinus6dB = estimated(85);
    expect(ids(p)).toContain('C02');
    delete p.speaker.choices;
    p.speaker.lowFrequencyMinus6dB = estimated(85);
    expect(ids(p)).not.toContain('C02');
  });
});
