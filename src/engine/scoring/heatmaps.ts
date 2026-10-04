import type { AnalysisContext } from '../context';
import type {
  ComponentId,
  EvidenceLevel,
  Grid,
  LayerId,
  Placement,
  SeatLayers,
  Vec3,
} from '../types';
import type { Scorer } from './scorer';
import {
  avoidsRedFlags,
  farEnough,
  isValidPlacement,
  seatScorable,
  speakerPair,
  steps,
} from './search';

/**
 * Heatmaps (docs/SCORING.md §5). The seat layers show one concern each, so the map can say *why* a
 * spot is good or poor; "overall" uses no goals, "goals" uses the user's.
 */
export const LAYERS: readonly {
  id: LayerId;
  level: EvidenceLevel | 'combined';
  component?: ComponentId;
}[] = [
  { id: 'overall', level: 'combined' },
  { id: 'goals', level: 'combined' },
  { id: 'bass', level: 'physics', component: 'C1' },
  { id: 'nulls', level: 'physics', component: 'C2' },
  { id: 'frontWall', level: 'physics', component: 'C3' },
  { id: 'stereo', level: 'guideline', component: 'C4' },
  { id: 'symmetry', level: 'guideline', component: 'C5' },
  { id: 'backWall', level: 'guideline', component: 'C6' },
];

/** Resolution: 10 cm for typical rooms, coarser for large ones (render cost, not accuracy). */
export function heatmapStep(ctx: AnalysisContext): number {
  const area = ctx.room.W * ctx.room.L;
  return area <= 30 ? 0.1 : area <= 60 ? 0.15 : 0.2;
}

/** Every layer for the seat moving over the floor, speakers fixed. One scoring pass for all. */
export function seatLayers(
  scorer: Scorer,
  speakers: Placement['speakers'],
  earZ: number,
): SeatLayers {
  const { ctx } = scorer;
  const step = heatmapStep(ctx);
  const xs = steps(step / 2, ctx.room.W - step / 2, step);
  const ys = steps(step / 2, ctx.room.L - step / 2, step);
  const coupling = scorer.coupling(speakers);
  const values = Object.fromEntries(LAYERS.map((l) => [l.id, [] as number[]])) as Record<
    LayerId,
    number[]
  >;
  const redFlag: boolean[] = [];
  for (const y of ys) {
    for (const x of xs) {
      const placement = { speakers, listener: { x, y, z: earZ } };
      const scorable = seatScorable(ctx, placement);
      // Hatched: a seat the app would not suggest (blocked, inside furniture, too close for the
      // chosen listening distance, or red-flagged), but still scored, so the map has no holes.
      redFlag.push(
        scorable &&
          (!isValidPlacement(ctx, placement) ||
            !avoidsRedFlags(ctx, placement, { seat: true, speakers: false }) ||
            !farEnough(ctx, placement)),
      );
      const result = scorable ? scorer.score(placement, coupling) : null;
      for (const layer of LAYERS) {
        values[layer.id].push(result ? layerValue(layer.id, result, scorer) : NaN);
      }
    }
  }
  return { x0: xs[0]!, y0: ys[0]!, step, nx: xs.length, ny: ys.length, values, redFlag };
}

function layerValue(id: LayerId, result: ReturnType<Scorer['score']>, scorer: Scorer): number {
  if (id === 'goals') return result.score;
  if (id === 'overall') {
    return result.breakdown.reduce(
      (sum, b) => sum + b.value * scorer.neutralWeights[b.componentId],
      0,
    );
  }
  const component = LAYERS.find((l) => l.id === id)!.component!;
  return result.breakdown.find((b) => b.componentId === component)!.value;
}

/** The seat score (goal weights) at every grid cell, speakers fixed. NaN where not allowed. */
export function listenerHeatmap(
  scorer: Scorer,
  speakers: Placement['speakers'],
  earZ: number,
): Grid {
  const layers = seatLayers(scorer, speakers, earZ);
  const { x0, y0, step, nx, ny } = layers;
  return { x0, y0, step, nx, ny, values: layers.values.goals };
}

/**
 * Score for the left speaker at every grid cell of the left half (right speaker mirrored about
 * the listener's x), listener fixed. The UI mirrors the grid for the right half.
 */
export function speakerHeatmap(scorer: Scorer, listener: Vec3): Grid {
  const ctx = scorer.ctx;
  const centre = listener.x;
  const step = heatmapStep(ctx);
  const xs = steps(step / 2, centre - step / 2, step);
  const ys = steps(step / 2, ctx.room.L / 2, step);
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
