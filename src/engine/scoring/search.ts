import { acousticCentre, buildContext, type AnalysisContext } from '../context';
import { boxesOverlap2D, distance, pointInBox2D } from '../math/geometry';
import { seededRandom, symmetric } from '../math/random';
import { DEFAULTS } from '../presets/defaults';
import { SEAT_KINDS } from '../presets/objects';
import { areaPoints, areaScore } from './area';
import { MIDPOINT_RED_FLAG, midpointOffsetFraction } from '../rules/G01-room-midpoint';
import { BACK_WALL_RED_FLAG } from '../rules/G02-back-wall';
import { angleRedFlag, stereoAngleDeg } from '../rules/G04-stereo-angle';
import { speakerCorner } from '../rules/G06-corners';
import { cabinetBox, isObstructed, objectBox } from '../rules/G10-objects';
import type { Candidate, Placement, SpeakerPlacement, Vec2, Vec3 } from '../types';
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

/** The distance the user asked for: room listening (1.5 m or more) unless they chose "close". */
export function preferredDistance(ctx: AnalysisContext): number {
  return ctx.project.constraints.listeningDistance === 'near'
    ? T.minListeningDistance
    : T.roomListeningDistance;
}

/** Both speakers at least the preferred listening distance away. */
export function farEnough(ctx: AnalysisContext, placement: Placement): boolean {
  const min = preferredDistance(ctx) - 1e-9;
  return (['left', 'right'] as const).every(
    (side) =>
      distance(acousticCentre(placement.speakers[side], ctx.speaker), placement.listener) >= min,
  );
}

/**
 * Whether a seat can be scored at all: inside the room, in front of both speakers and not on top
 * of one. Furniture and a blocked line of sight do not count here: the seat map shows a score
 * there too, hatched as "advised against" (owner feedback: the map had holes behind furniture).
 */
export function seatScorable(ctx: AnalysisContext, placement: Placement): boolean {
  const { W, L } = ctx.room;
  const { listener } = placement;
  if (listener.x <= 0 || listener.x >= W || listener.y <= 0 || listener.y >= L) return false;
  return (['left', 'right'] as const).every((side) => {
    const ac = acousticCentre(placement.speakers[side], ctx.speaker);
    return listener.y - ac.y >= T.minListenerAhead && distance(ac, listener) >= T.minScoredDistance;
  });
}

/**
 * The search never proposes a spot the app would red-flag itself (docs/SCORING.md §1): the room
 * midpoint (G01), the back wall (G02), a stereo angle outside 35–90° (G04) and a corner (G06).
 * Only what the search moves is checked: the seat when it is free, the speakers when they are.
 */
export function avoidsRedFlags(
  ctx: AnalysisContext,
  placement: Placement,
  moves: { seat: boolean; speakers: boolean },
): boolean {
  const { room, speaker } = ctx;
  const { speakers, listener } = placement;
  if (moves.seat) {
    if (midpointOffsetFraction(listener.y, room.L) < MIDPOINT_RED_FLAG) return false;
    if (room.L - listener.y < BACK_WALL_RED_FLAG) return false;
  }
  if (moves.speakers && !speaker.designedForCorner) {
    for (const side of ['left', 'right'] as const) {
      if (speakerCorner(speakers[side], ctx) === 'corner') return false;
    }
  }
  const angle = stereoAngleDeg(
    acousticCentre(speakers.left, speaker),
    acousticCentre(speakers.right, speaker),
    listener,
  );
  return !angleRedFlag(angle);
}

/** `from`, `from + step`, … up to `to` (inclusive), rounded to the millimetre. */
export function steps(from: number, to: number, step: number): number[] {
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
  /** False only for the fallback search, when the user's constraints leave no red-flag-free spot. */
  avoidRedFlags: boolean;
  /** Keep the preferred listening distance; dropped when the room is too small for it. */
  keepDistance: boolean;
  /** Each speaker stays within this distance of where it stands now (the user's zone). */
  zone: { radius: number; left: Vec3; right: Vec3 } | null;
}

function searchSpace(
  ctx: AnalysisContext,
  avoidRedFlags: boolean,
  keepDistance = avoidRedFlags,
  useZone = true,
): SearchSpace {
  const { W, L } = ctx.room;
  const { constraints } = ctx.project;
  const ears = ctx.variant.listener.ears;
  const centreX = constraints.keepSymmetric ? W / 2 : ears.x;
  // A rear port always keeps its clearance: the app must not suggest what G07 cautions against
  // (owner testing after R5 found a rear-ported speaker suggested 5 cm from the wall).
  const minClearance = Math.max(
    0.05,
    ctx.speaker.minRearClearanceFromManufacturer || ctx.speaker.portLocation === 'rear'
      ? ctx.speaker.minRearClearance
      : 0,
  );
  const maxClearance = Math.min(
    constraints.maxSpeakerDistanceFromWall.value ?? DEFAULTS.maxSpeakerDistanceFromWall,
    0.45 * L,
  );
  const maxHalf = Math.min(
    W / 2 - 0.25,
    Math.min(centreX, W - centreX) - ctx.speaker.width / 2 - 0.02,
  );
  const [from, to] = constraints.listenerYRange ?? [0.5, L - 0.3];
  let clearance: [number, number] = [minClearance, Math.max(minClearance, maxClearance)];
  let halfSpacing: [number, number] = [0.5, Math.max(0.5, maxHalf)];
  const now = ctx.variant.speakers;
  const radius = constraints.speakerZone;
  // Only around positions the user gave: placeholder speakers (certainty 'unknown') are not a place
  // anyone is tied to.
  const placed = now.left.certainty !== 'unknown' || now.right.certainty !== 'unknown';
  const zone =
    useZone && radius !== undefined && placed && !constraints.speakersFixed
      ? { radius, left: now.left.base, right: now.right.base }
      : null;
  if (zone) {
    // Narrow the grid to the zone; the exact circle is checked per placement (withinZone).
    const depth = ctx.speaker.depth / 2;
    const rears = [now.left.base.y - depth, now.right.base.y - depth];
    const half = (now.right.base.x - now.left.base.x) / 2;
    clearance = [
      Math.max(clearance[0], Math.min(...rears) - zone.radius),
      Math.min(clearance[1], Math.max(...rears) + zone.radius),
    ];
    halfSpacing = [
      Math.max(halfSpacing[0], half - zone.radius),
      Math.min(halfSpacing[1], half + zone.radius),
    ];
  }
  return {
    centreX,
    clearance,
    halfSpacing,
    listenerY: [Math.min(from, to), Math.max(from, to)],
    earZ: ears.z,
    fixedSpeakers: constraints.speakersFixed ? ctx.variant.speakers : null,
    fixedListener: constraints.listenerFixed ? ears : null,
    avoidRedFlags,
    keepDistance,
    zone,
  };
}

/** Both speakers within the user's zone (a circle around where each stands now). */
function withinZone(space: SearchSpace, placement: Placement): boolean {
  const { zone } = space;
  if (!zone) return true;
  const { left, right } = placement.speakers;
  const off = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y);
  return (
    off(left.base, zone.left) <= zone.radius + 1e-6 &&
    off(right.base, zone.right) <= zone.radius + 1e-6
  );
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
  const moves = { seat: !space.fixedListener, speakers: !space.fixedSpeakers };
  for (const p of params) {
    const placement = placementFor(scorer.ctx, space, p);
    if (!isValidPlacement(scorer.ctx, placement)) continue;
    if (!withinZone(space, placement)) continue;
    if (space.avoidRedFlags && !avoidsRedFlags(scorer.ctx, placement, moves)) continue;
    if (space.keepDistance && !farEnough(scorer.ctx, placement)) continue;
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
 * distinct coarse results. Sorted best first. Red-flag-free spots only, unless the user's
 * constraints leave none: then the best spots that remain, whose findings say what is wrong.
 */
export function searchPlacements(scorer: Scorer): Scored[] {
  return searchWithCompromise(scorer).found;
}

/**
 * As `searchPlacements`, and what had to give to find anything: first the preferred listening
 * distance (a small room), then the red-flag guard (the user's limits leave no clean spot).
 */
function searchWithCompromise(
  scorer: Scorer,
  useZone = true,
): {
  found: Scored[];
  compromise: boolean;
  closer: boolean;
} {
  const tries: [boolean, boolean][] = [
    [true, true],
    [true, false],
    [false, false],
  ];
  for (const [avoid, keep] of tries) {
    const found = searchWithin(scorer, searchSpace(scorer.ctx, avoid, keep, useZone));
    if (found.length > 0) return { found, compromise: !avoid, closer: !keep };
  }
  return { found: [], compromise: true, closer: true };
}

function searchWithin(scorer: Scorer, space: SearchSpace): Scored[] {
  const axis = (bounds: [number, number], fixed: boolean, current: number) =>
    fixed ? [current] : steps(bounds[0], bounds[1], COARSE_STEP);
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

interface Perturbation {
  scorer: Scorer;
  /** Plan-view position errors for the left speaker, the right speaker and the seat. */
  offsets: [Vec2, Vec2, Vec2];
}

/**
 * The perturbed inputs, drawn once per seed and applied to every placement alike (common random
 * numbers). A placement's robust score then does not depend on which other placements are scored
 * with it or in what order, and the ranking is not decided by the luck of the draw.
 */
function perturbations(base: Scorer, seed: number): Perturbation[] {
  const { project, t60 } = base.ctx;
  const { width, length, height } = project.room;
  const random = seededRandom(seed);
  const offset = (): Vec2 => ({
    x: symmetric(random) * POSITION_JITTER,
    y: symmetric(random) * POSITION_JITTER,
  });
  return Array.from({ length: PERTURBATION_RUNS }, () => {
    const ctx = buildContext(project, {
      W: width.value! * (1 + symmetric(random) * dimensionJitter(width.certainty)),
      L: length.value! * (1 + symmetric(random) * dimensionJitter(length.certainty)),
      H: height.value! * (1 + symmetric(random) * dimensionJitter(height.certainty)),
      t60Scale: (t60.low + random() * (t60.high - t60.low)) / t60.mid,
    })!;
    return { scorer: new Scorer(ctx, base.settings), offsets: [offset(), offset(), offset()] };
  });
}

const shift = (p: Vec3, by: Vec2): Vec3 => ({ x: p.x + by.x, y: p.y + by.y, z: p.z });

/**
 * Scores with perturbed room size, reverberation and positions. Deterministic for a given seed.
 * With a listening area (sofa, desk, bed), each run scores the area's spots and weighs them
 * (scoring/area.ts), so a spot that is good only for the middle seat ranks lower.
 */
/**
 * The seed the analysis uses by default (analyze.ts). Every other word shown for a spot (the map's
 * hover, its legend, the probe) uses it too, so it is the word the analysis gives after Apply.
 */
export const ANALYSIS_SEED = 1;

export function robustScores(
  baseScorer: Scorer,
  placements: Placement[],
  seed: number,
): { mean: number; spread: number; robust: number }[] {
  const runs = perturbations(baseScorer, seed);
  const { variant, room } = baseScorer.ctx;
  return placements.map(({ speakers, listener }) => {
    const spots = areaPoints(listener, variant.listener.area, room);
    const scores = runs.map(({ scorer, offsets: [left, right, seat] }) => {
      const moved = {
        left: { ...speakers.left, base: shift(speakers.left.base, left) },
        right: { ...speakers.right, base: shift(speakers.right.base, right) },
      };
      const coupling = scorer.coupling(moved);
      return areaScore(
        spots.map(({ where, at }) => ({
          where,
          score: scorer.score({ speakers: moved, listener: shift(at, seat) }, coupling).score,
        })),
      );
    });
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
  // Nothing may move: there is nothing to suggest (R5: the current setup was offered as "best").
  const { constraints } = scorer.ctx.project;
  if (constraints.speakersFixed && constraints.listenerFixed) return [];
  const { found, compromise, closer } = searchWithCompromise(scorer);
  const pool = pickDistinct(found, 0.1, 30);
  const robust = robustScores(
    scorer,
    pool.map((t) => t.placement),
    seed,
  );
  const ranked = pool
    .map((t, i) => ({ placement: t.placement, robust: robust[i]! }))
    .sort((a, b) => b.robust.robust - a.robust.robust);
  const zoneCost = speakerZoneCost(scorer, found[0]?.score ?? null);
  return pickDistinct(ranked, T.candidateSeparation, max).map((p) => ({
    ...toCandidate(scorer, p.placement, p.robust),
    ...(compromise ? { compromise: true } : {}),
    ...(closer ? { closer: true } : {}),
    ...(zoneCost ? { zoneCost } : {}),
  }));
}

/**
 * What the user's speaker zone costs: the best found inside it against the best without it, when
 * the difference is worth mentioning (owner decision: "Within 50 cm: Good. With more room: Very
 * good."). Null when there is no zone or it costs (almost) nothing.
 */
function speakerZoneCost(
  scorer: Scorer,
  inside: number | null,
): { inside: number; outside: number } | null {
  if (inside === null || !searchSpace(scorer.ctx, true).zone) return null;
  const outside = searchWithCompromise(scorer, false).found[0]?.score ?? null;
  return outside !== null && outside - inside >= T.zoneCostWorthMentioning
    ? { inside, outside }
    : null;
}

export function makeScorer(ctx: AnalysisContext): Scorer {
  return new Scorer(ctx, scoringSettings(ctx.goals));
}
