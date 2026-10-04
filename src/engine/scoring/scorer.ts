import { acousticCentre, rearClearance, wooferCentre, type AnalysisContext } from '../context';
import { distance, ramp } from '../math/geometry';
import { cornerProximity } from '../rules/G06-corners';
import { stereoAngleDeg } from '../rules/G04-stereo-angle';
import { sideDistanceDifference } from '../rules/G03-symmetry';
import { boundaryNullHz } from '../rules/P04-boundary-interference';
import { firstReflections, isNearSide } from '../rules/P06-reflections';
import {
  bassBand,
  buildBassModel,
  PER_OCTAVE,
  responseDb,
  smoothDb,
  sourceCoupling,
  speakerSources,
  type BassModel,
} from '../rules/P09-bass-response';
import type { ComponentId, Placement, ScoreBreakdownItem, SpeakerPlacement, Vec3 } from '../types';
import type { ScoringSettings } from './settings';
import { THRESHOLDS as T } from './thresholds';

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdownItem[];
}

/**
 * Scores placements for one analysis context (docs/SCORING.md §2). The bass model is built once
 * and reused; the source coupling can be reused across many listener positions.
 */
export class Scorer {
  readonly model: BassModel;
  /** The goal weights, with C1 and C2 dropped when the speaker leaves no bass band to judge. */
  readonly weights: Record<ComponentId, number>;
  private readonly range: [number, number];
  /** Index range of the model frequencies inside the scoring range. */
  private readonly kLo: number;
  private readonly kHi: number;

  constructor(
    readonly ctx: AnalysisContext,
    readonly settings: ScoringSettings,
    truncation?: number,
  ) {
    const band = bassBand(ctx);
    this.range = band.range;
    this.weights = band.scored ? settings.weights : withoutBass(settings.weights);
    // Extend by the smoothing half-window so smoothing near the edges sees real data.
    const margin = 2 ** (1 / 12);
    this.model = buildBassModel(ctx, this.range[0] / margin, this.range[1] * margin, truncation);
    const f = Array.from(this.model.freqs);
    this.kLo = f.findIndex((x) => x >= this.range[0]);
    this.kHi = f.length - 1 - [...f].reverse().findIndex((x) => x <= this.range[1]);
  }

  coupling(speakers: Placement['speakers']): Float64Array {
    return sourceCoupling(
      this.model,
      speakerSources({ speakers, listener: ORIGIN }, this.ctx),
      this.ctx,
    );
  }

  /** C1 (smoothness) and C2 (deepest dip) from the modal model. */
  bass(coupling: Float64Array, listener: Vec3): { c1: number; c2: number } {
    const smoothed = smoothDb(responseDb(this.model, coupling, listener, this.ctx), 6, PER_OCTAVE);
    const values = smoothed.slice(this.kLo, this.kHi + 1);
    let mean = 0;
    for (const v of values) mean += v;
    mean /= values.length;
    let variance = 0;
    for (const v of values) variance += (v - mean) ** 2;
    const sigma = Math.sqrt(variance / values.length);
    const sorted = values.sort(); // typed-array sort is numeric
    const median = sorted[Math.floor(sorted.length / 2)]!;
    const dip = median - sorted[0]!;
    return {
      c1: ramp(sigma, T.bassSigmaBest, T.bassSigmaWorst, 1, 0),
      c2: ramp(dip, T.dipBest, T.dipWorst, 1, 0),
    };
  }

  /** C3: front-wall interference above the scored bass band (inside it, C1 already counts it). */
  frontWall(p: SpeakerPlacement): number {
    const nullHz = boundaryNullHz(wooferCentre(p, this.ctx.speaker).y, this.ctx.c);
    if (nullHz <= this.range[1]) return 1;
    if (nullHz >= T.frontNullGoodHz) return 1;
    const nearWithCompensation =
      this.ctx.speaker.hasWallSetting && rearClearance(p, this.ctx.speaker) < T.nearWallClearance;
    if (nearWithCompensation) return 1;
    return ramp(nullHz, T.frontNullBadHz, T.frontNullGoodHz, T.frontNullBadScore, 1);
  }

  /** C4: stereo angle around the goal target, times equal-distance (G05). */
  geometry(placement: Placement): number {
    const s = this.ctx.speaker;
    const left = acousticCentre(placement.speakers.left, s);
    const right = acousticCentre(placement.speakers.right, s);
    const angle = stereoAngleDeg(left, right, placement.listener);
    const target = this.settings.angleTarget;
    const deviation = Math.abs(angle - target);
    const angleScore =
      deviation <= T.angleOkSpan
        ? 1 - (1 - T.angleOkScore) * (deviation / T.angleOkSpan)
        : angle < target
          ? ramp(angle, T.angleMin, target - T.angleOkSpan, 0, T.angleOkScore)
          : ramp(angle, target + T.angleOkSpan, T.angleMax, T.angleOkScore, 0);
    const diff = Math.abs(distance(left, placement.listener) - distance(right, placement.listener));
    return angleScore * ramp(diff, T.distanceDiffOk, T.distanceDiffBad, 1, 0);
  }

  /** C5 and C8 both need the near side-wall reflections. */
  surroundings(placement: Placement): { c5: number; c8: number } {
    const s = this.ctx.speaker;
    const left = acousticCentre(placement.speakers.left, s);
    const right = acousticCentre(placement.speakers.right, s);
    const sideDiff = sideDistanceDifference(left.x, right.x, this.ctx.room.W);
    const near = firstReflections(this.ctx, placement.speakers, placement.listener).filter(
      isNearSide,
    );
    const classes = near.map((r) => r.surfaceClass);
    const surfaceScore = new Set(classes).size > 1 ? T.surfaceMismatchScore : 1;
    const c5 = 0.5 * ramp(sideDiff, T.sideDiffOk, T.sideDiffBad, 1, 0) + 0.5 * surfaceScore;

    let c8 = 1;
    if (this.settings.reflectionMode === 'treat') {
      c8 = average(classes.map((c) => (c === 'reflective' ? T.reflectionMismatchScore : 1)));
    } else if (this.settings.reflectionMode === 'keep') {
      c8 = average(classes.map((c) => (c === 'absorptive' ? T.absorbedForWidthScore : 1)));
    }
    return { c5, c8 };
  }

  /** C6: listener distance from the back wall. */
  seatBoundary(listener: Vec3): number {
    return ramp(this.ctx.room.L - listener.y, T.backWallBad, T.backWallGood, 0, 1);
  }

  /** C7: corner proximity and rear-port clearance, worst speaker. */
  speakerBoundary(placement: Placement): number {
    const s = this.ctx.speaker;
    const scores = (['left', 'right'] as const).map((side) => {
      const p = placement.speakers[side];
      const w = wooferCentre(p, s);
      let corner = 1;
      if (!s.designedForCorner) {
        const proximity = cornerProximity(w.y, Math.min(w.x, this.ctx.room.W - w.x));
        const raw =
          proximity === 'corner'
            ? T.cornerScore
            : proximity === 'near-corner'
              ? T.nearCornerScore
              : 1;
        corner = 1 - (1 - raw) * this.settings.cornerPenaltyFactor;
      }
      const port =
        s.portLocation === 'rear' && rearClearance(p, s) < s.minRearClearance
          ? T.portTooCloseScore
          : 1;
      return corner * port;
    });
    return Math.min(...scores);
  }

  score(placement: Placement, coupling = this.coupling(placement.speakers)): ScoreResult {
    const { c1, c2 } = this.bass(coupling, placement.listener);
    const { c5, c8 } = this.surroundings(placement);
    const values: Record<ComponentId, number> = {
      C1: c1,
      C2: c2,
      C3: Math.min(
        this.frontWall(placement.speakers.left),
        this.frontWall(placement.speakers.right),
      ),
      C4: this.geometry(placement),
      C5: c5,
      C6: this.seatBoundary(placement.listener),
      C7: this.speakerBoundary(placement),
      C8: c8,
    };
    const breakdown = (Object.keys(values) as ComponentId[]).map((componentId) => ({
      componentId,
      // A degenerate input (e.g. the seat on a speaker) must never read as a good score.
      value: Number.isFinite(values[componentId]) ? values[componentId] : 0,
      weight: this.weights[componentId],
    }));
    const score = breakdown.reduce((sum, b) => sum + b.value * b.weight, 0);
    return { score, breakdown };
  }
}

const ORIGIN: Vec3 = { x: 0, y: 0, z: 0 };

function withoutBass(weights: Record<ComponentId, number>): Record<ComponentId, number> {
  const w = { ...weights, C1: 0, C2: 0 };
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  for (const id of Object.keys(w) as ComponentId[]) w[id] /= total;
  return w;
}

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1;
}
