import fc from 'fast-check';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { buildContext } from '../../src/engine/context';
import { modeField } from '../../src/engine/modeField';
import { SPEAKER_TYPES } from '../../src/engine/presets/speakerTypes';
import { SURFACE_PRESETS } from '../../src/engine/presets/surfaces';
import { avoidsRedFlags, isValidPlacement, makeScorer } from '../../src/engine/scoring/search';
import type {
  AnalysisOk,
  BoundaryId,
  Busyness,
  GoalId,
  ObjectKind,
  Project,
  SurfacePresetId,
} from '../../src/engine/types';
import { adviceText, findingText } from '../../src/app/findings/text';
import { speakerFromType } from '../../src/app/state/defaults';
import { OBJECT_DEFAULTS } from '../../src/app/plan/placement';
import { i18n } from '../../src/i18n/locale.svelte';
import { estimated, makeProject } from '../fixtures/projects';

/**
 * R5 bad-advice sweep: random rooms, speakers, seats, surfaces, goals and constraints. Whatever
 * the input, nothing the app shows may be nonsense: no NaN, no empty placeholders, no negative
 * or zero sizes in advice, no best spot that breaks the app's own rules.
 */

beforeAll(() => vi.stubGlobal('document', { documentElement: {} }));

const KINDS = Object.keys(OBJECT_DEFAULTS) as ObjectKind[];
const PRESETS = Object.keys(SURFACE_PRESETS) as SurfacePresetId[];
const BOUNDARIES: BoundaryId[] = ['front', 'back', 'left', 'right', 'floor', 'ceiling'];
const BUSY: Busyness[] = ['bare', 'some', 'busy', 'very-busy'];
const GOALS: GoalId[] = [
  'wide-stage',
  'precise-imaging',
  'flat-response',
  'deep-bass',
  'low-volume-listening',
];

const unit = fc.double({ min: 0, max: 1, noNaN: true });

const projectArb = fc
  .record({
    W: fc.double({ min: 2.2, max: 9, noNaN: true }),
    L: fc.double({ min: 2.5, max: 11, noNaN: true }),
    H: fc.double({ min: 2.1, max: 4, noNaN: true }),
    clearance: unit,
    spacing: unit,
    seat: unit,
    earZ: fc.double({ min: 0.7, max: 1.5, noNaN: true }),
    standZ: fc.double({ min: 0, max: 1.1, noNaN: true }),
    type: fc.integer({ min: 0, max: SPEAKER_TYPES.length - 1 }),
    surfaces: fc.array(fc.constantFrom(...PRESETS), { minLength: 6, maxLength: 6 }),
    busy: fc.constantFrom(...BUSY),
    goals: fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 5, maxLength: 5 }),
    fixedSeat: fc.boolean(),
    fixedSpeakers: fc.boolean(),
    dsp: fc.boolean(),
    toeIn: fc.integer({ min: 0, max: 30 }),
    objects: fc.array(
      fc.record({
        kind: fc.constantFrom(...KINDS),
        x: unit,
        y: unit,
        material: fc.constantFrom(undefined, 'hard', 'soft', 'absorbent'),
      }),
      { maxLength: 4 },
    ),
  })
  .map((r): Project => {
    const speaker = speakerFromType(SPEAKER_TYPES[r.type]);
    if (r.dsp) {
      speaker.dsp = {
        treble: { minDb: -3, maxDb: 3, stepDb: 0.5 },
        bass: { minDb: -6, maxDb: 6, stepDb: 1 },
        placementModes: ['stand', 'desk'],
        wallDistanceSetting: true,
      };
    }
    const depth = speaker.dimensions.d.value!;
    const width = speaker.dimensions.w.value!;
    const clearance = 0.02 + r.clearance * Math.min(1.5, r.L / 3);
    const halfMax = r.W / 2 - width / 2 - 0.02;
    const halfMin = Math.min(0.3, halfMax);
    const p = makeProject({
      W: r.W,
      L: r.L,
      H: r.H,
      speaker,
      clearance,
      halfSpacing: halfMin + r.spacing * (halfMax - halfMin),
      listenerY: Math.min(r.L - 0.05, clearance + depth + 0.5 + r.seat * r.L),
      earZ: r.earZ,
      standZ: Math.min(r.standZ, r.H - speaker.dimensions.h.value! - 0.05),
    });
    BOUNDARIES.forEach((b, i) => (p.surfaces.base[b] = r.surfaces[i]!));
    p.variants[0]!.busyness = estimated(r.busy);
    p.goals.weights = Object.fromEntries(GOALS.map((g, i) => [g, r.goals[i]]));
    p.constraints.listenerFixed = r.fixedSeat;
    p.constraints.speakersFixed = r.fixedSpeakers;
    p.variants[0]!.speakers.left.toeInDeg = r.toeIn;
    p.variants[0]!.speakers.right.toeInDeg = r.toeIn;
    p.variants[0]!.objects = r.objects.map((o, i) => {
      const d = OBJECT_DEFAULTS[o.kind];
      const size = { x: Math.min(d.x, r.W), y: Math.min(d.y, r.L), z: Math.min(d.z, r.H) };
      return {
        id: `o${i}`,
        kind: o.kind,
        position: { x: o.x * (r.W - size.x), y: o.y * (r.L - size.y), z: 0 },
        size,
        hard: o.material ? o.material === 'hard' : d.hard,
        ...(o.material ? { material: o.material } : {}),
      };
    });
    return p;
  });

/** Text that would make a reader stop trusting the app. */
const NONSENSE = /NaN|Infinity|undefined|null|\{|\}/;
/** A negative length or distance in any unit. */
const NEGATIVE_LENGTH = /[-−]\s?\d[\d.,\s]*( )?(m|cm|ft|in|′|″)(?![a-z])/;

const finite = (x: number) => Number.isFinite(x);

function checkTexts(a: AnalysisOk, project: Project) {
  for (const locale of ['en', 'hu'] as const) {
    i18n.locale = locale;
    for (const system of ['metric', 'imperial'] as const) {
      const texts = [
        ...a.findings.map((f) => findingText(f, system)),
        ...a.advice.treatment.map((x) => adviceText(x, system)),
        ...a.advice.settings.map((x) => adviceText(x, system)),
      ];
      for (const t of texts) {
        expect(t, `${locale}/${system}: ${t}`).not.toMatch(NONSENSE);
        expect(t, `${locale}/${system}: ${t}`).not.toMatch(NEGATIVE_LENGTH);
        expect(t.trim().length).toBeGreaterThan(10);
      }
    }
  }
  i18n.locale = 'en';
  void project;
}

function checkAdviceNumbers(a: AnalysisOk, project: Project) {
  const W = project.room.width.value!;
  const L = project.room.length.value!;
  for (const x of [...a.advice.treatment, ...a.advice.settings]) {
    for (const [key, value] of Object.entries(x.params)) {
      if (typeof value !== 'number') continue;
      expect(finite(value), `${x.messageKey}.${key}`).toBe(true);
      if (
        ['thickness', 'baseHeight', 'quarterWavelength', 'absorption', 't60', 'after'].includes(key)
      ) {
        expect(value, `${x.messageKey}.${key}`).toBeGreaterThan(0.01);
      }
      if (key === 'frequency') expect(value).toBeGreaterThan(10);
    }
    if (x.messageKey === 'advice.T05.soften') {
      expect(Number(x.params.after)).toBeLessThan(Number(x.params.t60));
    }
    if (x.messageKey === 'advice.T05.liven') {
      expect(Number(x.params.after)).toBeGreaterThan(Number(x.params.t60));
    }
    if (x.location) {
      expect(x.location.x).toBeGreaterThanOrEqual(-1e-6);
      expect(x.location.x).toBeLessThanOrEqual(W + 1e-6);
      expect(x.location.y).toBeGreaterThanOrEqual(-1e-6);
      expect(x.location.y).toBeLessThanOrEqual(L + 1e-6);
    }
  }
}

describe('R5 bad-advice sweep', () => {
  it(
    'random projects: every score, spot, number and sentence is sane',
    { timeout: 300_000 },
    () => {
      fc.assert(
        fc.property(projectArb, (project) => {
          const a = analyze(project);
          expect(a.status).toBe('ok');
          if (a.status !== 'ok') return;

          // Scores are finite and between 0 and 1.
          for (const c of [a.current, ...a.candidates]) {
            expect(c.score).toBeGreaterThanOrEqual(0);
            expect(c.score).toBeLessThanOrEqual(1);
            expect(finite(c.fragility?.positionDrop ?? 0)).toBe(true);
          }
          expect(a.bassResponse.dB.every(finite)).toBe(true);
          expect(finite(a.t60.mid) && a.t60.mid > 0).toBe(true);

          // Best spots obey the app's own rules: valid, not red-flagged.
          const ctx = buildContext(project)!;
          const moves = {
            seat: !project.constraints.listenerFixed,
            speakers: !project.constraints.speakersFixed,
          };
          if (!moves.seat && !moves.speakers) expect(a.candidates).toEqual([]);
          for (const c of a.candidates) {
            expect(isValidPlacement(ctx, c)).toBe(true);
            // Red flags from what may move are avoided, or the spot says it is a compromise.
            if (!c.compromise) expect(avoidsRedFlags(ctx, c, moves), 'red-flagged spot').toBe(true);
          }

          // "Move" is only suggested when the best spot really scores better.
          const move = a.topActions.find((t) => t.kind === 'move');
          if (move && a.candidates[0]) {
            expect(a.candidates[0].score).toBeGreaterThan(a.current.score);
          }

          // Layers: a score or NaN (not allowed), nothing else.
          for (const values of Object.values(a.layers.values)) {
            for (const v of values) if (!Number.isNaN(v)) expect(v >= 0 && v <= 1).toBe(true);
          }

          checkAdviceNumbers(a, project);
          checkTexts(a, project);
          void makeScorer;
        }),
        {
          numRuns: Number(process.env.SWEEP_RUNS ?? 60),
          seed: Number(process.env.SWEEP_SEED ?? 20261004),
        },
      );
    },
  );

  it('the bass-note explorer gives a finite pattern for any room and note', () => {
    fc.assert(
      fc.property(projectArb, fc.integer({ min: 20, max: 200 }), (project, f) => {
        const field = modeField(project, f)!;
        expect(field.grid.values.every((v) => finite(v) && v <= 0 && v >= -40)).toBe(true);
        expect(Math.max(...field.grid.values)).toBe(0);
      }),
      { numRuns: 30, seed: 7 },
    );
  });
});
