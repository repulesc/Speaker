import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { analyze } from '../../src/engine/analyze';
import {
  acousticCentre,
  buildContext,
  currentPlacement,
  type AnalysisContext,
} from '../../src/engine/context';
import { distance } from '../../src/engine/math/geometry';
import { RULES } from '../../src/engine/rules';
import { G04 } from '../../src/engine/rules/G04-stereo-angle';
import { G10 } from '../../src/engine/rules/G10-objects';
import { frontWallNullAtSeat, P04 } from '../../src/engine/rules/P04-boundary-interference';
import { roomCharacter } from '../../src/engine/rules/P08-reverberation';
import { bassBand } from '../../src/engine/rules/P09-bass-response';
import { P11 } from '../../src/engine/rules/P11-room-proportions';
import { confidence } from '../../src/engine/confidence';
import {
  makeScorer,
  robustScores,
  searchPlacements,
  speakerPair,
} from '../../src/engine/scoring/search';
import { scoringSettings } from '../../src/engine/scoring/settings';
import type {
  AnalysisOk,
  Busyness,
  Finding,
  ObjectKind,
  Placement,
  Project,
} from '../../src/engine/types';
import { busyRoom } from '../fixtures/busy-room';
import { estimated, genericSpeaker, makeProject } from '../fixtures/projects';

/** Regression tests for the R0 audit, one block per finding in docs/REVIEW_FINDINGS.md. */

function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

function findingsAt(project: Project, placement: Placement): Finding[] {
  const ctx = buildContext(project)!;
  return RULES.flatMap((rule) => rule.evaluate(ctx, placement));
}

describe('C1 · the recommended spots never carry an avoidable red flag', () => {
  // Before R0 the best spot in each of these rooms was at the room midpoint (a G01 red flag).
  const rooms: Record<string, Project> = {
    'small room 2.5 × 3 × 2.4 m': makeProject({
      W: 2.5,
      L: 3,
      H: 2.4,
      listenerY: 2.2,
      halfSpacing: 0.6,
      clearance: 0.3,
    }),
    '4 m cube': makeProject({ W: 4, L: 4, H: 4, listenerY: 2.8 }),
    '4.3 × 5.9 × 2.7 m': makeProject({ W: 4.3, L: 5.9, H: 2.7, listenerY: 3.6, halfSpacing: 1.1 }),
  };
  for (const [name, project] of Object.entries(rooms)) {
    it(name, () => {
      const candidates = ok(project).candidates;
      expect(candidates.length).toBeGreaterThan(0);
      for (const c of candidates) {
        const flags = findingsAt(project, c).filter((f) => f.severity === 'red-flag');
        expect(flags.map((f) => f.messageKey)).toEqual([]);
      }
    });
  }

  it('falls back to the best of the rest when the user leaves no red-flag-free seat', () => {
    const p = makeProject();
    p.constraints.listenerYRange = [2.35, 2.65]; // all inside the midpoint band, 2.25–2.75 m
    const a = ok(p);
    expect(a.candidates.length).toBeGreaterThan(0);
    const keys = findingsAt(p, a.candidates[0]!).map((f) => f.messageKey);
    expect(keys).toContain('finding.G01.redFlag');
  });
});

describe('C2 · scores are always finite', () => {
  it('a speaker that leaves no bass band: bass not scored, no bass claim, finite numbers', () => {
    for (const f6 of [201, 250, 500]) {
      const p = makeProject();
      p.speaker.lowFrequencyMinus6dB = estimated(f6);
      const a = ok(p);
      for (const c of [a.current, ...a.candidates]) {
        expect(Number.isFinite(c.score)).toBe(true);
        const weight = (id: string) => c.breakdown.find((b) => b.componentId === id)!.weight;
        expect(weight('C1')).toBe(0);
        expect(weight('C2')).toBe(0);
      }
      const p09 = a.findings.filter((f) => f.ruleId === 'P09').map((f) => f.messageKey);
      expect(p09).toEqual(['finding.P09.notScored']);
      expect(a.bassResponse.dB.every(Number.isFinite)).toBe(true);
    }
  });

  it('the bass band is never empty; under half an octave it is not scored', () => {
    const band = (f6: number, schroeder: number, bassMaxHz: number) =>
      bassBand({
        speaker: { f6 },
        schroeder: { value: schroeder },
        bassMaxHz,
      } as unknown as AnalysisContext);
    expect(band(50, 180, 270)).toEqual({ range: [50, 180], scored: true });
    // A satellite in a large room: the band would have run from 130 Hz down to 120 Hz.
    const large = band(130, 70, 120);
    expect(large.scored).toBe(false);
    expect(large.range[0]).toBeCloseTo(120 / Math.SQRT2, 9);
    expect(large.range[1]).toBe(120);
  });

  it('a seat on a speaker’s front edge: the stereo angle is a red flag, not NaN', () => {
    const p = makeProject(); // left speaker at x = 1.0, front baffle at y = 0.5 + 0.25
    p.variants[0]!.listener.ears = { x: 1.0, y: 0.75, z: 1.1 };
    const ctx = buildContext(p)!;
    const placement = currentPlacement(ctx);
    expect(G04.evaluate(ctx, placement)[0]!.severity).toBe('red-flag');
    const score = makeScorer(ctx).score(placement);
    score.breakdown.forEach((b) => expect(Number.isFinite(b.value)).toBe(true));
  });

  it('property: every score is finite for any placement in the room', () => {
    const ctx = buildContext(makeProject())!;
    const scorer = makeScorer(ctx);
    const coordinate = (min: number, max: number) => fc.double({ min, max, noNaN: true });
    fc.assert(
      fc.property(
        coordinate(0.2, 3.8),
        coordinate(0.15, 2),
        coordinate(0.1, 3.9),
        coordinate(0.1, 4.9),
        (sx, sy, lx, ly) => {
          const speaker = (x: number) => ({ base: { x, y: sy, z: 0.7 }, toeInDeg: 0 });
          const result = scorer.score({
            speakers: { left: speaker(sx), right: speaker(4 - sx) },
            listener: { x: lx, y: ly, z: 1.1 },
          });
          return Number.isFinite(result.score) && result.score >= 0 && result.score <= 1;
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('H1 · cautions carry information', () => {
  it('P11: one finding at most, naming the lowest stacked pair (Room R: 68.6 Hz)', () => {
    const ctx = buildContext(makeProject())!;
    const coincident = P11.evaluate(ctx, currentPlacement(ctx)).filter(
      (f) => f.messageKey === 'finding.P11.coincident',
    );
    expect(coincident).toHaveLength(1);
    expect(Number(coincident[0]!.params.frequencyA)).toBeCloseTo(68.6, 1);
    const cube = buildContext(makeProject({ W: 4, L: 4, H: 4, listenerY: 2.8 }))!;
    const cubeKeys = P11.evaluate(cube, currentPlacement(cube)).map((f) => f.messageKey);
    expect(cubeKeys).toContain('finding.P11.coincident');
  });

  it('P11: most rooms get no coincidence caution (before R0: 99.7 % did)', () => {
    let rooms = 0;
    let flagged = 0;
    for (let W = 3; W <= 6; W += 0.5) {
      for (let L = W; L <= 8; L += 0.5) {
        for (const H of [2.4, 2.6, 2.8]) {
          const ctx = buildContext(
            makeProject({ W, L, H, listenerY: L * 0.6, halfSpacing: Math.min(1, W / 2 - 0.4) }),
          )!;
          rooms++;
          const findings = P11.evaluate(ctx, currentPlacement(ctx));
          if (findings.some((f) => f.messageKey === 'finding.P11.coincident')) flagged++;
        }
      }
    }
    expect(flagged).toBeGreaterThan(0);
    expect(flagged / rooms).toBeLessThan(0.5);
  });

  it('P09: a 6–10 dB peak or dip is information, beyond 10 dB a caution', () => {
    const projects = [
      makeProject(),
      busyRoom(),
      makeProject({ W: 3.6, L: 4.4, H: 2.7, listenerY: 2.9, halfSpacing: 0.9, clearance: 0.4 }),
    ];
    const found = projects.flatMap((p) => {
      const a = ok(p);
      return [a.current, ...a.candidates].flatMap((placement) =>
        findingsAt(p, placement).filter((f) => /^finding\.P09\.(peak|dip)$/.test(f.messageKey)),
      );
    });
    for (const f of found) {
      expect(f.severity).toBe(Math.abs(Number(f.params.db)) > 10 ? 'caution' : 'info');
    }
    expect(found.some((f) => f.severity === 'info')).toBe(true);
    expect(found.some((f) => f.severity === 'caution')).toBe(true);
  });

  it('P04: boundaries in line are a caution only above the modelled bass band', () => {
    // Room R's default setup: woofer 0.75 m from the front wall, 0.8 m up → ≈ 111 Hz, in the band.
    const roomR = buildContext(makeProject())!;
    const inBand = P04.evaluate(roomR, currentPlacement(roomR)).find(
      (f) => f.messageKey === 'finding.P04.aligned',
    )!;
    expect(inBand.severity).toBe('info');
    // A floorstander's woofer 0.4 m up and 0.4 m from the front wall → ≈ 214 Hz, above the band.
    const speaker = genericSpeaker({
      dimensions: { w: estimated(0.2), h: estimated(1.0), d: estimated(0.3) },
      wooferCentreHeight: estimated(0.4),
      acousticAxisHeight: estimated(0.9),
    });
    const ctx = buildContext(makeProject({ speaker, standZ: 0, clearance: 0.1 }))!;
    const above = P04.evaluate(ctx, currentPlacement(ctx)).find(
      (f) => f.messageKey === 'finding.P04.aligned',
    )!;
    expect(Number(above.params.frequency)).toBeGreaterThan(bassBand(ctx).range[1]);
    expect(above.severity).toBe('caution');
  });

  it('G10: one finding per object, for the nearer speaker', () => {
    const p = makeProject(); // cabinets span x 0.9–1.1 and 2.9–3.1
    p.variants[0]!.objects = [
      {
        id: 'sideboard',
        kind: 'cabinet',
        position: { x: 1.15, y: 0.4, z: 0 },
        size: { x: 1.7, y: 0.4, z: 0.5 },
        hard: true,
      },
    ];
    const ctx = buildContext(p)!;
    const keys = G10.evaluate(ctx, currentPlacement(ctx)).map((f) => f.messageKey);
    expect(keys).toEqual(['finding.G10.nearbyHard']);
  });
});

describe('H2 · placing furniture never makes the room more reverberant', () => {
  const kinds: ObjectKind[] = [
    'bed',
    'sofa',
    'armchair',
    'table',
    'shelf',
    'wardrobe',
    'bookcase',
    'plant',
    'custom',
  ];
  const levels: Busyness[] = ['bare', 'some', 'busy', 'very-busy'];

  it('the bed example: Room R with some furniture, then a bed is placed', () => {
    const p = makeProject();
    const before = buildContext(p)!.t60.mid;
    p.variants[0]!.objects.push({
      id: 'bed',
      kind: 'bed',
      position: { x: 1, y: 3, z: 0 },
      size: { x: 1.6, y: 2, z: 0.5 },
      hard: false,
    });
    expect(buildContext(p)!.t60.mid).toBeLessThanOrEqual(before);
  });

  it('property: adding any object never raises the estimate', () => {
    fc.assert(
      fc.property(fc.constantFrom(...kinds), fc.constantFrom(...levels), (kind, level) => {
        const p = makeProject();
        p.variants[0]!.busyness = estimated(level);
        const before = buildContext(p)!.t60;
        p.variants[0]!.objects.push({
          id: 'o',
          kind,
          position: { x: 0.2, y: 3.5, z: 0 },
          size: { x: 1, y: 1, z: 0.5 },
          hard: false,
        });
        const after = buildContext(p)!.t60;
        return after.mid <= before.mid && after.bass <= before.bass;
      }),
    );
  });
});

describe('H3 · typical rooms read as typical rooms', () => {
  it('default surfaces and unknown furnishing land in the domestic range', () => {
    for (const [W, L, H] of [
      [3, 4, 2.4],
      [3.6, 4.4, 2.7],
      [4, 5, 2.5],
      [4.5, 6, 2.6],
      [5, 7, 2.8],
      [6, 8, 2.7],
    ] as const) {
      const p = makeProject({ W, L, H, listenerY: L * 0.6, halfSpacing: Math.min(1, W / 2 - 0.4) });
      p.variants[0]!.busyness = { value: null, certainty: 'unknown' };
      const t60 = buildContext(p)!.t60.mid;
      expect(t60, `${W} × ${L} × ${H} m`).toBeGreaterThan(0.3);
      expect(t60, `${W} × ${L} × ${H} m`).toBeLessThan(0.75);
    }
  });

  it('more furniture, shorter reverberation: bare reads live, very busy reads dead', () => {
    const t60 = (level: Busyness) => {
      const p = makeProject();
      p.variants[0]!.busyness = estimated(level);
      return buildContext(p)!.t60.mid;
    };
    const values = (['bare', 'some', 'busy', 'very-busy'] as const).map(t60);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(roomCharacter(values[0]!)).toBe('live');
    expect(roomCharacter(values[1]!)).toBe('balanced');
    expect(roomCharacter(values[3]!)).toBe('dead');
  });
});

describe('H4 · a robust score does not depend on what else is being ranked', () => {
  it('same placement, same robust score, whatever the pool and its order', () => {
    const scorer = makeScorer(buildContext(busyRoom())!);
    const top = searchPlacements(scorer)
      .slice(0, 4)
      .map((s) => s.placement);
    const together = robustScores(scorer, top, 1);
    const reversed = robustScores(scorer, [...top].reverse(), 1).reverse();
    const alone = top.map((p) => robustScores(scorer, [p], 1)[0]!);
    together.forEach((r, i) => {
      expect(reversed[i]!.robust).toBe(r.robust);
      expect(alone[i]!.robust).toBe(r.robust);
    });
  });
});

describe('M1 · the front-wall null as heard at the seat, handed over without a cliff', () => {
  it('on the wall’s normal it is c/4d; off it, higher', () => {
    const woofer = { x: 1, y: 0.5, z: 0.8 };
    expect(frontWallNullAtSeat(woofer, { x: 1, y: 3, z: 0.8 }, 343)).toBeCloseTo(171.5, 6);
    expect(frontWallNullAtSeat(woofer, { x: 1.65, y: 1.65, z: 1.1 }, 343)).toBeGreaterThan(180);
  });

  it('C3 changes smoothly as the speakers move (before: a 0.70 jump within 2 cm)', () => {
    const ctx = buildContext(makeProject())!;
    const scorer = makeScorer(ctx);
    const seat = { x: 2, y: 1.7, z: 1.1 };
    let previous: number | null = null;
    for (let c = 0.05; c <= 0.6; c += 0.01) {
      const speakers = speakerPair(ctx, 2, 0.65, c);
      const c3 = scorer
        .score({ speakers, listener: seat })
        .breakdown.find((b) => b.componentId === 'C3')!.value;
      if (previous !== null) expect(Math.abs(c3 - previous)).toBeLessThan(0.15);
      previous = c3;
    }
  });
});

describe('M2 · a wall-distance DSP setting does not excuse a front-wall null', () => {
  it('same C3 with and without the setting', () => {
    const c3 = (wallSetting: boolean) => {
      const p = makeProject({ clearance: 0.15 });
      if (wallSetting) p.speaker.dsp.wallDistanceSetting = true;
      const ctx = buildContext(p)!;
      return makeScorer(ctx)
        .score(currentPlacement(ctx))
        .breakdown.find((b) => b.componentId === 'C3')!.value;
    };
    expect(c3(true)).toBe(c3(false));
    expect(c3(false)).toBeLessThan(1);
  });
});

describe('M4 · "flat response" keeps the physics together', () => {
  it('C3 keeps its share relative to C1', () => {
    const flat = scoringSettings({ weights: { 'flat-response': 2 } }).weights;
    const none = scoringSettings({ weights: {} }).weights;
    expect(flat.C3 / flat.C1).toBeCloseTo(none.C3 / none.C1, 9);
    expect(flat.C4 / flat.C1).toBeLessThan(none.C4 / none.C1);
  });
});

describe('L3 · a project without a busy-ness answer counts its furniture as unknown', () => {
  it('same confidence as an explicit "don’t know"', () => {
    const missing = makeProject();
    delete missing.variants[0]!.busyness;
    const unknownAnswer = makeProject();
    unknownAnswer.variants[0]!.busyness = { value: null, certainty: 'unknown' };
    expect(confidence(missing, buildContext(missing)).overall).toBe(
      confidence(unknownAnswer, buildContext(unknownAnswer)).overall,
    );
  });
});

describe('owner feedback after R5: listening distance', () => {
  const minDistance = (p: ReturnType<typeof makeProject>) => {
    const a = analyze(p) as AnalysisOk;
    const speaker = buildContext(p)!.speaker;
    return Math.min(
      ...a.candidates.flatMap((c) =>
        (['left', 'right'] as const).map((s) =>
          distance(acousticCentre(c.speakers[s], speaker), c.listener),
        ),
      ),
    );
  };

  it('room listening keeps every best spot at least 1.5 m from both speakers', () => {
    expect(minDistance(makeProject({ W: 3.6, L: 4.4, H: 2.6 }))).toBeGreaterThanOrEqual(1.5 - 1e-9);
  });

  it('"close" (desk) lets the search come nearer, never closer than 0.6 m', () => {
    const p = makeProject({ W: 3.6, L: 4.4, H: 2.6 });
    p.constraints.listeningDistance = 'near';
    expect(minDistance(p)).toBeGreaterThanOrEqual(0.6 - 1e-9);
  });

  it('a rear-ported speaker is never suggested closer to the wall than its port needs', () => {
    const p = makeProject({ W: 3.6, L: 4.4, H: 2.6, clearance: 0.05 });
    const ctx = buildContext(p)!;
    expect(ctx.speaker.portLocation).toBe('rear');
    for (const c of (analyze(p) as AnalysisOk).candidates) {
      expect(c.speakers.left.base.y - ctx.speaker.depth / 2).toBeGreaterThanOrEqual(
        ctx.speaker.minRearClearance - 1e-9,
      );
    }
  });

  it('the seat map has no holes behind or under furniture', () => {
    const p = makeProject({ W: 3.6, L: 4.4, H: 2.6, standZ: 0 });
    p.variants[0]!.objects = [
      {
        id: 'bed',
        kind: 'bed',
        position: { x: 0, y: 2.4, z: 0 },
        size: { x: 1.6, y: 2, z: 0.5 },
        hard: false,
      },
      {
        id: 't',
        kind: 'table',
        position: { x: 1.8, y: 2.0, z: 0 },
        size: { x: 1.2, y: 0.7, z: 0.75 },
        hard: true,
      },
    ];
    const a = analyze(p) as AnalysisOk;
    const { values, nx, ny, x0, y0, step, redFlag } = a.layers;
    const speakerY = buildContext(p)!.variant.speakers.left.base.y;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const y = y0 + j * step;
        // Well in front of the speakers, every cell has a score.
        if (y > speakerY + 1) expect(Number.isNaN(values.overall[j * nx + i]!)).toBe(false);
      }
    }
    // Behind the table the seat is blocked: scored, but hatched.
    const cell = Math.round((2.9 - y0) / step) * nx + Math.round((2.4 - x0) / step);
    expect(redFlag[cell]).toBe(true);
  });
});
