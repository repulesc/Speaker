import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { buildContext, currentPlacement } from '../../src/engine/context';
import {
  applyChange,
  ASPECT_ANSWERS,
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

  it('a voice pulled to one side: centre the seat when it is off-centre, else the swap test', () => {
    const off = makeProject();
    off.variants[0]!.listener.ears.x += 0.15;
    const a = tryFor(off, { centre: 'left' }).list;
    expect(a[0]!.id).toBe('L04.centreSeat');
    expect(ids(tryFor(makeProject(), { centre: 'left' }).list)).toEqual(['L04.swap']);
  });

  it('a narrow stage: wider apart or sit closer, but only when the angle really is narrow', () => {
    const narrow = makeProject({ halfSpacing: 0.6, listenerY: 3.6 });
    const { ctx, p, list } = tryFor(narrow, { width: 'narrow' });
    expect(measure(ctx, p).angle).toBeLessThan(58);
    expect(ids(list)).toEqual(expect.arrayContaining(['L05.wider']));
    const wide = makeProject({ halfSpacing: 1.0, listenerY: 1.8 });
    expect(ids(tryFor(wide, { width: 'narrow' }).list)).not.toContain('L05.wider');
  });

  it('at most five changes, two per aspect, most likely to help first', () => {
    const all: ListeningAnswers = {
      bass: 'boomy',
      evenness: 'uneven',
      centre: 'vague',
      width: 'narrow',
      treble: 'bright',
      clarity: 'echoey',
    };
    const list = tryFor(makeProject({ clearance: 0.2 }), all).list;
    expect(list.length).toBeLessThanOrEqual(5);
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
            evenness: answer('evenness'),
            centre: answer('centre'),
            width: answer('width'),
            treble: answer('treble'),
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

  it('the analysis carries the changes for the saved answers', () => {
    const p = makeProject({ clearance: 0.2 });
    p.listening = { answers: { bass: 'boomy' }, at: '2026-10-06T00:00:00Z', tries: [] };
    const a = analyze(p) as AnalysisOk;
    expect(a.listening[0]!.id).toBe('L01.out');
    expect((analyze(makeProject()) as AnalysisOk).listening).toEqual([]);
  });
});
