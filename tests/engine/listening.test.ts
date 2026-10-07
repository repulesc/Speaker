import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { buildContext, currentPlacement } from '../../src/engine/context';
import {
  applyChange,
  ASPECT_ANSWERS,
  ASPECTS,
  FINE,
  listeningExperiments,
  listeningMessageKeys,
  type ListeningAnswers,
} from '../../src/engine/listening';
import { measure } from '../../src/engine/listening/check';
import { RULES } from '../../src/engine/rules';
import { isValidPlacement } from '../../src/engine/scoring/search';
import type { AnalysisOk, Project } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

/** The listening check (docs/ROADMAP_V8.md §4): answers → one change at a time to try. */
function tryFor(project: Project, answers: ListeningAnswers) {
  const ctx = buildContext(project)!;
  const p = currentPlacement(ctx);
  const findings = RULES.flatMap((r) => r.evaluate(ctx, p));
  return { ctx, p, list: listeningExperiments(ctx, p, findings, answers) };
}
const ids = (list: { id: string }[]) => list.map((e) => e.id);

describe('the listening check', () => {
  it('asks for nothing when everything sounds right', () => {
    expect(tryFor(makeProject(), {}).list).toEqual([]);
    expect(
      tryFor(makeProject(), { bass: 'right', width: 'right', treble: 'right', clarity: 'clear' })
        .list,
    ).toEqual([]);
  });

  it('boomy bass with the speakers near the wall: move them out first, and the model says what it thinks', () => {
    const { list } = tryFor(makeProject({ clearance: 0.2 }), { bass: 'boomy' });
    expect(list[0]!.id).toBe('L01.out');
    expect(list[0]!.level).toBe('physics');
    expect(list[0]!.model).toMatch(/better|same|worse/);
  });

  it('speakers that cannot move get no speaker moves, only what is left', () => {
    const p = makeProject({ clearance: 0.2 });
    p.constraints.speakersFixed = true;
    const list = tryFor(p, { bass: 'boomy', width: 'narrow' }).list;
    expect(ids(list)).not.toContain('L01.out');
    expect(ids(list)).not.toContain('L05.wider');
    expect(
      list.every(
        (e) =>
          !e.change ||
          e.change.kind === 'seat' ||
          e.change.kind === 'toeIn' ||
          e.change.kind === 'seatCentre',
      ),
    ).toBe(true);
  });

  it('thin bass never moves a rear port closer than it needs', () => {
    const p = makeProject({ clearance: 0.22 }); // rear port, minimum 0.2 m
    expect(ids(tryFor(p, { bass: 'thin' }).list)).not.toContain('L02.closer');
    expect(ids(tryFor(makeProject({ clearance: 0.6 }), { bass: 'thin' }).list)).toContain(
      'L02.closer',
    );
  });

  it('a voice pulled to one side: centre the seat when it is off-centre, else balance, then the swap test', () => {
    const off = makeProject();
    off.variants[0]!.listener.ears.x += 0.15;
    const a = tryFor(off, { centre: 'left' }).list;
    expect(a[0]!.id).toBe('L04.centreSeat');
    expect(ids(tryFor(makeProject(), { centre: 'left' }).list)).toEqual([
      'L04.balance',
      'L04.swap',
    ]);
  });

  it('a narrow stage: wider apart or sit closer, but only when the angle really is narrow', () => {
    const narrow = makeProject({ halfSpacing: 0.6, listenerY: 3.6 });
    const { ctx, p, list } = tryFor(narrow, { width: 'narrow' });
    expect(measure(ctx, p).angle).toBeLessThan(58);
    expect(ids(list)).toEqual(expect.arrayContaining(['L05.wider']));
    const wide = makeProject({ halfSpacing: 1.0, listenerY: 1.8 });
    expect(ids(tryFor(wide, { width: 'narrow' }).list)).not.toContain('L05.wider');
  });

  it('two changes per aspect, for every aspect that has one, most likely to help first', () => {
    const all: ListeningAnswers = {
      bass: 'boomy',
      evenness: 'uneven',
      centre: 'vague',
      width: 'narrow',
      treble: 'bright',
      clarity: 'echoey',
    };
    const list = tryFor(makeProject({ clearance: 0.2 }), all).list;
    // Every aspect that has a fix gets one: each list sits under its own answer (V9).
    expect(new Set(list.map((e) => e.aspect)).size).toBeGreaterThanOrEqual(5);
    const per = new Map<string, number>();
    for (const e of list) per.set(e.aspect, (per.get(e.aspect) ?? 0) + 1);
    expect(Math.max(...per.values())).toBeLessThanOrEqual(2);
    expect(list.map((e) => e.priority)).toEqual(
      [...list.map((e) => e.priority)].sort((x, y) => y - x),
    );
  });

  it('every change it offers keeps the setup valid, for any answers (random rooms)', () => {
    const answer = <K extends keyof typeof ASPECT_ANSWERS>(k: K) =>
      fc.option(fc.constantFrom(...ASPECT_ANSWERS[k]), { nil: undefined });
    fc.assert(
      fc.property(
        fc.record({
          W: fc.double({ min: 2.6, max: 7, noNaN: true }),
          L: fc.double({ min: 3, max: 8, noNaN: true }),
          clearance: fc.double({ min: 0.1, max: 1, noNaN: true }),
          answers: fc.record({
            bass: answer('bass'),
            low: answer('low'),
            evenness: answer('evenness'),
            voices: answer('voices'),
            treble: answer('treble'),
            centre: answer('centre'),
            width: answer('width'),
            depth: answer('depth'),
            spot: answer('spot'),
            clarity: answer('clarity'),
          }),
        }),
        ({ W, L, clearance, answers }) => {
          const project = makeProject({
            W,
            L,
            clearance,
            halfSpacing: Math.min(1, W / 2 - 0.4),
            listenerY: Math.min(L - 0.5, 2.6),
          });
          const { ctx, p, list } = tryFor(project, answers);
          const keys = new Set(listeningMessageKeys());
          for (const e of list) {
            expect(keys.has(`listen.exp.${e.id}`)).toBe(true);
            expect(e.sources.length).toBeGreaterThan(0);
            if (e.change) {
              const moved = applyChange(ctx, p, e.change);
              expect(moved).not.toBeNull();
              expect(isValidPlacement(ctx, moved!)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 60 },
    );
  });

  it('every answer that is not fine has at least one thing to try in the reference room', () => {
    const p = makeProject({ clearance: 0.3 });
    for (const aspect of ASPECTS) {
      for (const value of ASPECT_ANSWERS[aspect]) {
        if (value === FINE[aspect]) continue;
        if (aspect === 'evenness' || aspect === 'width') continue; // covered above
        const list = tryFor(p, { [aspect]: value } as ListeningAnswers).list;
        expect(list.length, `${aspect}: ${value}`).toBeGreaterThan(0);
        expect(list.every((e) => e.aspect === aspect)).toBe(true);
      }
    }
  });
});

/** V10: the advice reads the room page (docs/ROADMAP_V10.md §3). */
describe('the listening check in context', () => {
  const busy = (p: Project, value: 'bare' | 'busy' | 'very-busy') => {
    p.variants[0]!.busyness = { value, certainty: 'estimated' };
    return p;
  };

  it('echoey in a full room: flutter echo, not cushions; in a bare room: soft things', () => {
    const full = ids(tryFor(busy(makeProject(), 'very-busy'), { clarity: 'echoey' }).list);
    expect(full).toContain('L07.flutter');
    expect(full.some((id) => id.startsWith('L07.soften'))).toBe(false);
    const bare = ids(tryFor(busy(makeProject(), 'bare'), { clarity: 'echoey' }).list);
    expect(bare).toContain('L07.soften');
    expect(bare).not.toContain('L07.flutter');
  });

  it('harsh in a full room: one hard surface near the path, never a rug', () => {
    const p = busy(makeProject({ surfaces: { floor: 'wood-floor' } }), 'busy');
    p.variants[0]!.speakers.left.toeInDeg = 0;
    p.variants[0]!.speakers.right.toeInDeg = 0;
    const all = tryFor(p, { treble: 'bright' });
    const every = ids(all.list);
    expect(every).toContain('L06.surface');
    expect(every).not.toContain('L06.soften');
  });

  it('a rug only where the floor is hard: on carpet, the walls instead', () => {
    const p = busy(makeProject({ H: 3.2, surfaces: { floor: 'carpet-heavy' } }), 'bare');
    p.surfaces.baseCertainty.floor = 'measured';
    const echo = ids(tryFor(p, { clarity: 'echoey' }).list);
    expect(echo).not.toContain('L07.soften');
    expect(echo).toContain('L07.softenWalls');
  });

  it('a ticked tone control is named directly and comes before the room', () => {
    const p = makeProject();
    p.variants[0]!.speakers.left.toeInDeg = 0;
    p.variants[0]!.speakers.right.toeInDeg = 0;
    expect(ids(tryFor(p, { treble: 'bright' }).list)).toContain('L06.trebleDown');
    p.speaker.dsp.treble = { minDb: -3, maxDb: 3, stepDb: 0.5 };
    const known = ids(tryFor(p, { treble: 'bright' }).list);
    expect(known).toContain('L06.trebleDownKnown');
    expect(known).not.toContain('L06.trebleDown');
    p.speaker.dsp.bass = { minDb: -6, maxDb: 6, stepDb: 0.5 };
    expect(ids(tryFor(makeProject({ clearance: 0.8 }), { bass: 'thin' }).list)).not.toContain(
      'L02.controlKnown',
    );
    const thin = makeProject({ clearance: 0.12 });
    thin.speaker.dsp.bass = { minDb: -6, maxDb: 6, stepDb: 0.5 };
    expect(ids(tryFor(thin, { bass: 'thin' }).list)).toContain('L02.controlKnown');
  });

  it('a wall switch the user ticked is offered for boomy bass', () => {
    const p = makeProject({ clearance: 0.8 });
    p.speaker.dsp.wallDistanceSetting = true;
    expect(ids(tryFor(p, { bass: 'boomy' }).list)).toContain('L01.wallSwitch');
  });

  it('a room open to another: the door test, and no model opinion on bass moves', () => {
    const p = makeProject({ clearance: 0.6, listenerY: 3.4 });
    p.room.outOfModel = ['open-plan-connection'];
    const list = tryFor(p, { bass: 'thin', width: 'narrow' }).list;
    expect(ids(list)).toContain('L02.door');
    for (const e of list.filter((x) => x.aspect === 'bass')) expect(e.model).toBeUndefined();
  });

  it('not a plain box: the model gives no opinion on any move', () => {
    const p = makeProject({ clearance: 0.2, halfSpacing: 0.6, listenerY: 3.6 });
    p.room.outOfModel = ['non-rectangular'];
    const list = tryFor(p, { bass: 'boomy', width: 'narrow' }).list;
    expect(list.some((e) => e.change)).toBe(true);
    for (const e of list) expect(e.model).toBeUndefined();
  });

  it('lowest notes missing with the front-wall dip in the deep bass: closer to the wall', () => {
    const list = tryFor(makeProject({ clearance: 1.2, listenerY: 3.6 }), { low: 'missing' }).list;
    const dip = list.find((e) => e.id === 'L08.dip')!;
    expect(dip).toBeDefined();
    expect(Number(dip.params.hz)).toBeGreaterThanOrEqual(35);
    expect(Number(dip.params.hz)).toBeLessThanOrEqual(100);
    expect(dip.change).toEqual({ kind: 'speakersOut', by: -0.9 });
  });

  it('muffled voices: fix the boomy bass first when it is boomy too', () => {
    const list = tryFor(makeProject(), { voices: 'muffled', bass: 'boomy' }).list;
    expect(ids(list)).toContain('L09.bassFirst');
  });

  it('a tiny sweet spot: toe-in so the aims cross just in front of you', () => {
    const p = makeProject({ listenerY: 3.4 });
    const { ctx, p: placed, list } = tryFor(p, { spot: 'small' });
    const cross = list.find((e) => e.id === 'L11.crossFront')!;
    expect(cross.change?.kind).toBe('toeIn');
    const moved = applyChange(ctx, placed, cross.change!)!;
    // The aims now meet about half a metre in front of the ears.
    const toe = (moved.speakers.left.toeInDeg * Math.PI) / 180;
    const front = moved.speakers.left.base.y + ctx.speaker.depth / 2;
    const half = (moved.speakers.right.base.x - moved.speakers.left.base.x) / 2;
    expect(moved.listener.y - (front + half / Math.tan(toe))).toBeCloseTo(0.5, 1);
  });
});

describe('the listening check: saved answers', () => {
  it('the analysis carries the changes for the saved answers', () => {
    const p = makeProject({ clearance: 0.2 });
    p.listening = { answers: { bass: 'boomy' }, at: '2026-10-06T00:00:00Z', tries: [] };
    const a = analyze(p) as AnalysisOk;
    expect(a.listening[0]!.id).toBe('L01.out');
    expect((analyze(makeProject()) as AnalysisOk).listening).toEqual([]);
  });
});
