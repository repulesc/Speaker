import { acousticCentre, buildContext, type AnalysisContext } from '../context';
import { boxesOverlap2D, distance, pointInBox2D } from '../math/geometry';
import { seededRandom, symmetric } from '../math/random';
import { DEFAULTS } from '../presets/defaults';
import { SEAT_KINDS } from '../presets/objects';
import { cabinetBox, isObstructed, objectBox } from '../rules/G10-objects';
import type { Candidate, Grid, Placement, SpeakerPlacement, Vec3 } from '../types';
import { Scorer } from './scorer';
import { scoringSettings } from './settings';
import { THRESHOLDS as T } from './thresholds';

/** Hard constraints (docs/SCORING.md §1). Failing placements are removed, not penalised. */
export function isValidPlacement(ctx: AnalysisContext, placement: Placement): boolean {
  const { W, L } = ctx.room;
  const { listener } = placement;
  if (listener.x <= 0 || listener.x >= W || listener.y <= 0 || listener.y >= L) return false;
  for (const side of ['left', 'right'] as const) {
    const cab = cabinetBox(placement.speakers[side], ctx);
    if (cab.min.x < 0 || cab.max.x > W || cab.min.y < 0 || cab.max.y > L) return false;
    if (ctx.objects.some((o) => boxesOverlap2D(cab, objectBox(o)))) return false;
    const ac = acousticCentre(placement.speakers[side], ctx.speaker);
    if (distance(ac, listener) < T.minListeningDistance) return false;
    // The listener sits in front of the speakers (they face +y).
    if (listener.y - ac.y < T.minListenerAhead) return false;
  }
  const insideObject = ctx.objects.some(
    (o) => !SEAT_KINDS.includes(o.kind) && pointInBox2D(listener, objectBox(o)),
  );
  if (insideObject) return false;
  return isObstructed(ctx, placement.speakers, listener) === null;
}

function range(from: number, to: number, step: number): number[] {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) values.push(Math.round(v * 1000) / 1000);
  return values;
}

/** Symmetric speaker pair about `centreX`, rear panel `clearance` from the front wall. */
export function speakerPair(
  ctx: AnalysisContext,
  centreX: number,
  halfSpacing: number,
  clearance: number,
): Placement['speakers'] {
  const current = ctx.variant.speakers;
  const y = clearance + ctx.speaker.depth / 2;
  const make = (x: number, from: SpeakerPlacement): SpeakerPlacement => ({
    base: { x, y, z: from.base.z },
    toeInDeg: from.toeInDeg,
  });
  return {
    left: make(centreX - halfSpacing, current.left),
    right: make(centreX + halfSpacing, current.right),
  };
}

interface SearchSpace {
  centreX: number;
  clearance: [number, number];
  halfSpacing: [number, number];
  listenerY: [number, number];
  earZ: number;
  fixedSpeakers: Placement['speakers'] | null;
  fixedListener: Vec3 | null;
}

function searchSpace(ctx: AnalysisContext): SearchSpace {
  const { W, L } = ctx.room;
  const { constraints } = ctx.project;
  const ears = ctx.variant.listener.ears;
  const centreX = constraints.keepSymmetric ? W / 2 : ears.x;
  const minClearance = Math.max(
    0.05,
    ctx.speaker.minRearClearanceFromManufacturer ? ctx.speaker.minRearClearance : 0,
  );
  const maxClearance = Math.min(
    constraints.maxSpeakerDistanceFromWall.value ?? DEFAULTS.maxSpeakerDistanceFromWall,
    0.45 * L,
  );
  const maxHalf = Math.min(
    W / 2 - 0.25,
    Math.min(centreX, W - centreX) - ctx.speaker.width / 2 - 0.02,
  );
  return {
    centreX,
    clearance: [minClearance, Math.max(minClearance, maxClearance)],
    halfSpacing: [0.5, Math.max(0.5, maxHalf)],
    listenerY: constraints.listenerYRange ?? [0.5, L - 0.3],
    earZ: ears.z,
    fixedSpeakers: constraints.speakersFixed ? ctx.variant.speakers : null,
    fixedListener: constraints.listenerFixed ? ears : null,
  };
}

/** Search variables of one symmetric placement. */
interface Params {
  clearance: number;
  half: number;
  y: number;
}

interface Scored {
  placement: Placement;
  params: Params;
  score: number;
}

function placementFor(ctx: AnalysisContext, space: SearchSpace, p: Params): Placement {
  return {
    speakers: space.fixedSpeakers ?? speakerPair(ctx, space.centreX, p.half, p.clearance),
    listener: space.fixedListener ?? { x: space.centreX, y: p.y, z: space.earZ },
  };
}

/** Scores the given parameter sets, sharing the source coupling between equal speaker pairs. */
function scoreAll(scorer: Scorer, space: SearchSpace, params: Params[]): Scored[] {
  const couplings = new Map<string, Float64Array>();
  const results: Scored[] = [];
  for (const p of params) {
    const placement = placementFor(scorer.ctx, space, p);
    if (!isValidPlacement(scorer.ctx, placement)) continue;
    const key = space.fixedSpeakers ? 'fixed' : `${p.clearance.toFixed(3)}|${p.half.toFixed(3)}`;
    let coupling = couplings.get(key);
    if (!coupling) {
      coupling = scorer.coupling(placement.speakers);
      couplings.set(key, coupling);
    }
    results.push({ placement, params: p, score: scorer.score(placement, coupling).score });
  }
  return results;
}

const COARSE_STEP = 0.2;
const FINE_STEP = 0.05;
const SEEDS = 10;

/**
 * Coarse search at 20 cm over the whole space, then a 5 cm refinement (±10 cm) around the ten best
 * distinct coarse results. Sorted best first.
 */
export function searchPlacements(scorer: Scorer): Scored[] {
  const space = searchSpace(scorer.ctx);
  const axis = (bounds: [number, number], fixed: boolean, current: number) =>
    fixed ? [current] : range(bounds[0], bounds[1], COARSE_STEP);
  const ears = scorer.ctx.variant.listener.ears;
  const coarseParams = axis(space.clearance, !!space.fixedSpeakers, 0).flatMap((clearance) =>
    axis(space.halfSpacing, !!space.fixedSpeakers, 0).flatMap((half) =>
      axis(space.listenerY, !!space.fixedListener, ears.y).map((y) => ({ clearance, half, y })),
    ),
  );
  const coarse = scoreAll(scorer, space, coarseParams).sort((a, b) => b.score - a.score);

  const seeds = pickDistinct(coarse, COARSE_STEP, SEEDS);
  const offsets = [-2, -1, 0, 1, 2].map((k) => k * FINE_STEP);
  const within = (v: number, [lo, hi]: [number, number]) => v >= lo - 1e-9 && v <= hi + 1e-9;
  const fineParams = new Map<string, Params>();
  for (const seed of seeds) {
    for (const dc of space.fixedSpeakers ? [0] : offsets) {
      for (const dh of space.fixedSpeakers ? [0] : offsets) {
        for (const dy of space.fixedListener ? [0] : offsets) {
          const p = {
            clearance: seed.params.clearance + dc,
            half: seed.params.half + dh,
            y: seed.params.y + dy,
          };
          if (
            !space.fixedSpeakers &&
            (!within(p.clearance, space.clearance) || !within(p.half, space.halfSpacing))
          )
            continue;
          if (!space.fixedListener && !within(p.y, space.listenerY)) continue;
          fineParams.set(`${p.clearance.toFixed(3)}|${p.half.toFixed(3)}|${p.y.toFixed(3)}`, p);
        }
      }
    }
  }
  const fine = scoreAll(scorer, space, [...fineParams.values()]);
  const all = new Map<string, Scored>();
  for (const s of [...coarse, ...fine]) all.set(placementKey(s.placement), s);
  return [...all.values()].sort((a, b) => b.score - a.score);
}

/** Largest movement of any speaker or the listener between two placements (plan view). */
export function placementDistance(a: Placement, b: Placement): number {
  const d = (p: Vec3, q: Vec3) => Math.hypot(p.x - q.x, p.y - q.y);
  return Math.max(
    d(a.speakers.left.base, b.speakers.left.base),
    d(a.speakers.right.base, b.speakers.right.base),
    d(a.listener, b.listener),
  );
}

function placementKey(p: Placement): string {
  const r = (v: number) => v.toFixed(3);
  return [p.speakers.left.base, p.speakers.right.base, p.listener]
    .map((v) => `${r(v.x)},${r(v.y)}`)
    .join('|');
}

// ── Robustness (docs/SCORING.md §4) ───────────────────────────────────────

const PERTURBATION_RUNS = 8;
const POSITION_JITTER = 0.03;

function dimensionJitter(certainty: string): number {
  return certainty === 'measured' ? 0.01 : 0.05;
}

function jitter(p: Vec3, random: () => number): Vec3 {
  return {
    x: p.x + symmetric(random) * POSITION_JITTER,
    y: p.y + symmetric(random) * POSITION_JITTER,
    z: p.z,
  };
}

/** Scores with perturbed room size, reverberation and positions. Deterministic for a given seed. */
export function robustScores(
  baseScorer: Scorer,
  placements: Placement[],
  seed: number,
): { mean: number; spread: number; robust: number }[] {
  const { project } = baseScorer.ctx;
  const random = seededRandom(seed);
  const t60 = baseScorer.ctx.t60;
  const runs = Array.from({ length: PERTURBATION_RUNS }, () => {
    const { width, length, height } = project.room;
    const ctx = buildContext(project, {
      W: width.value! * (1 + symmetric(random) * dimensionJitter(width.certainty)),
      L: length.value! * (1 + symmetric(random) * dimensionJitter(length.certainty)),
      H: height.value! * (1 + symmetric(random) * dimensionJitter(height.certainty)),
      t60Scale: (t60.low + random() * (t60.high - t60.low)) / t60.mid,
    })!;
    return new Scorer(ctx, baseScorer.settings);
  });
  return placements.map((placement) => {
    const scores = runs.map(
      (scorer) =>
        scorer.score({
          speakers: {
            left: {
              ...placement.speakers.left,
              base: jitter(placement.speakers.left.base, random),
            },
            right: {
              ...placement.speakers.right,
              base: jitter(placement.speakers.right.base, random),
            },
          },
          listener: jitter(placement.listener, random),
        }).score,
    );
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const spread = Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length);
    return { mean, spread, robust: mean - 0.5 * spread };
  });
}

export function toCandidate(
  scorer: Scorer,
  placement: Placement,
  robust: { robust: number; spread: number },
): Candidate {
  const nominal = scorer.score(placement);
  return {
    ...placement,
    score: robust.robust,
    nominalScore: nominal.score,
    scoreSpread: robust.spread,
    breakdown: nominal.breakdown,
  };
}

function pickDistinct<T extends { placement: Placement }>(
  sorted: T[],
  minDistance: number,
  max: number,
): T[] {
  const picked: T[] = [];
  for (const item of sorted) {
    if (picked.every((p) => placementDistance(p.placement, item.placement) >= minDistance))
      picked.push(item);
    if (picked.length === max) break;
  }
  return picked;
}

/**
 * Top distinct candidates: a diverse pool of the best search results (≥ 10 cm apart) is re-ranked by
 * robust score, then candidates are picked at least 0.2 m apart.
 */
export function findCandidates(scorer: Scorer, seed: number, max = 5): Candidate[] {
  const pool = pickDistinct(searchPlacements(scorer), 0.1, 30);
  const robust = robustScores(
    scorer,
    pool.map((t) => t.placement),
    seed,
  );
  const ranked = pool
    .map((t, i) => ({ placement: t.placement, robust: robust[i]! }))
    .sort((a, b) => b.robust.robust - a.robust.robust);
  return pickDistinct(ranked, T.candidateSeparation, max).map((p) =>
    toCandidate(scorer, p.placement, p.robust),
  );
}

// ── Heatmaps (docs/SCORING.md §5) ─────────────────────────────────────────

/** Heatmap resolution: 10 cm for typical rooms, coarser for large ones (render cost, not accuracy). */
function heatmapStep(ctx: AnalysisContext): number {
  const area = ctx.room.W * ctx.room.L;
  return area <= 30 ? 0.1 : area <= 60 ? 0.15 : 0.2;
}

/** Score for the listener at every grid cell, speakers fixed. NaN where not allowed. */
export function listenerHeatmap(
  scorer: Scorer,
  speakers: Placement['speakers'],
  earZ: number,
): Grid {
  const { W, L } = scorer.ctx.room;
  const step = heatmapStep(scorer.ctx);
  const xs = range(step / 2, W - step / 2, step);
  const ys = range(step / 2, L - step / 2, step);
  const coupling = scorer.coupling(speakers);
  const values = ys.flatMap((y) =>
    xs.map((x) => {
      const placement = { speakers, listener: { x, y, z: earZ } };
      return isValidPlacement(scorer.ctx, placement)
        ? scorer.score(placement, coupling).score
        : NaN;
    }),
  );
  return { x0: xs[0]!, y0: ys[0]!, step, nx: xs.length, ny: ys.length, values };
}

/**
 * Score for the left speaker at every grid cell of the left half (right speaker mirrored about
 * the listener's x), listener fixed. The UI mirrors the grid for the right half.
 */
export function speakerHeatmap(scorer: Scorer, listener: Vec3): Grid {
  const ctx = scorer.ctx;
  const centre = listener.x;
  const step = heatmapStep(ctx);
  const xs = range(step / 2, centre - step / 2, step);
  const ys = range(step / 2, ctx.room.L / 2, step);
  const values = ys.flatMap((y) =>
    xs.map((x) => {
      const clearance = y - ctx.speaker.depth / 2;
      if (clearance < 0) return NaN;
      const speakers = speakerPair(ctx, centre, centre - x, clearance);
      const placement = { speakers, listener };
      return isValidPlacement(ctx, placement) ? scorer.score(placement).score : NaN;
    }),
  );
  return { x0: xs[0] ?? 0, y0: ys[0] ?? 0, step, nx: xs.length, ny: ys.length, values };
}

export function makeScorer(ctx: AnalysisContext): Scorer {
  return new Scorer(ctx, scoringSettings(ctx.goals));
}
