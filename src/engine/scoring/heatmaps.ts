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
  ANALYSIS_SEED,
  avoidsRedFlags,
  isValidPlacement,
  robustScores,
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
  const placements: Placement[] = [];
  for (const y of ys) {
    for (const x of xs) {
      const placement = { speakers, listener: { x, y, z: earZ } };
      placements.push(placement);
      const scorable = seatScorable(ctx, placement);
      // Hatched: a seat the app advises against (red-flagged), still
      // scored so the map has no holes. Distance is a preference, so it is not hatched.
      redFlag.push(
        scorable &&
          (!isValidPlacement(ctx, placement) ||
            !avoidsRedFlags(ctx, placement, { seat: true, speakers: false })),
      );
      const result = scorable ? scorer.score(placement, coupling) : null;
      for (const layer of LAYERS) {
        values[layer.id].push(result ? layerValue(layer.id, result, scorer) : NaN);
      }
    }
  }
  const best = bestRobust(scorer, values.goals, placements);
  return { x0: xs[0]!, y0: ys[0]!, step, nx: xs.length, ny: ys.length, values, redFlag, best };
}

/**
 * The cautious score of the best spot on a map: the cell at the 98th percentile (the one the
 * legend names, so one odd cell does not speak for the map), scored like the analysis scores a
 * setup. Undefined when nothing on the map is scored.
 */
function bestRobust(
  scorer: Scorer,
  values: readonly number[],
  placements: readonly Placement[],
): number | undefined {
  const scored = values.flatMap((v, k) => (Number.isFinite(v) ? [k] : []));
  if (scored.length === 0) return undefined;
  scored.sort((a, b) => values[a]! - values[b]!);
  const k = scored[Math.round(0.98 * (scored.length - 1))]!;
  return robustScores(scorer, [placements[k]!], ANALYSIS_SEED)[0]!.robust;
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
 * the room's middle or the seat), listener fixed. The UI mirrors the grid for the right half.
 *
 * Every spot is either a real candidate (scored, hatched where the search would never put a
 * speaker: a corner, a stereo angle outside 35–90°) or "not a
 * stereo spot" (`inert`, no score): beside, behind or too close to the seat, or not fitting in the
 * room. Before V7 those spots showed the bass part of the score, which read as "good here" (owner
 * feedback, docs/ROADMAP_V7.md); now the map draws them in one neutral tone.
 */
export function speakerHeatmap(scorer: Scorer, listener: Vec3): Grid {
  const ctx = scorer.ctx;
  // The same centre line the search uses: the room's middle when the pair stays symmetric (the
  // default), else the seat. The map must match where suggestions can actually go.
  const centre = ctx.project.constraints.keepSymmetric ? ctx.room.W / 2 : listener.x;
  const step = heatmapStep(ctx);
  const xs = steps(step / 2, centre - step / 2, step);
  const ys = steps(step / 2, ctx.room.L - step / 2, step);
  const redFlag: boolean[] = [];
  const inert: boolean[] = [];
  const placements: Placement[] = [];
  const values = ys.flatMap((y) =>
    xs.map((x) => {
      const clearance = y - ctx.speaker.depth / 2;
      const placement = { speakers: speakerPair(ctx, centre, centre - x, clearance), listener };
      placements.push(placement);
      const apart = clearance >= 0 && centre - x >= ctx.speaker.width / 2; // cabinets do not overlap
      if (!apart || !isValidPlacement(ctx, placement)) {
        redFlag.push(false);
        inert.push(true);
        return NaN;
      }
      redFlag.push(!avoidsRedFlags(ctx, placement, { seat: false, speakers: true }));
      inert.push(false);
      return scorer.score(placement).score;
    }),
  );
  return {
    x0: xs[0] ?? 0,
    y0: ys[0] ?? 0,
    step,
    nx: xs.length,
    ny: ys.length,
    values,
    redFlag,
    inert,
    best: bestRobust(scorer, values, placements),
  };
}
