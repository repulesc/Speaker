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
import { cabinetBox } from '../rules/G10-objects';
import { avoidsRedFlags, isValidPlacement, seatScorable, speakerPair, steps } from './search';

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
      // Hatched: a seat the app advises against (blocked, inside furniture, red-flagged), still
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
  return { x0: xs[0]!, y0: ys[0]!, step, nx: xs.length, ny: ys.length, values, redFlag };
}

/** Whether both cabinets lie inside the room. */
function insideRoom(ctx: AnalysisContext, speakers: Placement['speakers']): boolean {
  return (['left', 'right'] as const).every((side) => {
    const box = cabinetBox(speakers[side], ctx);
    return box.min.x >= 0 && box.max.x <= ctx.room.W && box.min.y >= 0 && box.max.y <= ctx.room.L;
  });
}

/** The bass part of the score (C1 and C2 with their goal weights, 🔴 physics), or null. */
function physicsOnly(scorer: Scorer, placement: Placement): number | null {
  const { C1, C2 } = scorer.weights;
  if (C1 + C2 <= 0 || !insideRoom(scorer.ctx, placement.speakers)) return null;
  const { c1, c2 } = scorer.bass(scorer.coupling(placement.speakers), placement.listener);
  return (C1 * c1 + C2 * c2) / (C1 + C2);
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
  // The same centre line the search uses: the room's middle when the pair stays symmetric (the
  // default), else the seat. The map must match where suggestions can actually go.
  const centre = ctx.project.constraints.keepSymmetric ? ctx.room.W / 2 : listener.x;
  const step = heatmapStep(ctx);
  const xs = steps(step / 2, centre - step / 2, step);
  // The whole length of the room: spots the speakers cannot take (behind or beside the seat, in
  // furniture) have no score and fade out, so the map ends where the speakers' options end.
  const ys = steps(step / 2, ctx.room.L - step / 2, step);
  // Furniture does not hide the map (owner: the heatmap is visible everywhere): a spot where a
  // speaker would stand on furniture is scored and hatched as "advised against", like the seat map.
  const bare = { ...ctx, objects: [] };
  const redFlag: boolean[] = [];
  const values = ys.flatMap((y) =>
    xs.map((x) => {
      const clearance = y - ctx.speaker.depth / 2;
      const speakers = speakerPair(ctx, centre, centre - x, clearance);
      const placement = { speakers, listener };
      const apart = clearance >= 0 && centre - x >= ctx.speaker.width / 2; // cabinets do not overlap
      if (!apart) {
        redFlag.push(false);
        return NaN;
      }
      if (isValidPlacement(bare, placement)) {
        redFlag.push(!isValidPlacement(ctx, placement));
        return scorer.score(placement).score;
      }
      // Not a stereo setup (the speakers would stand beside or behind the seat, or too close to
      // it). The map still shows what the room itself does there (owner: see the whole room):
      // only the bass, which the room decides wherever the speakers stand. Hatched like every
      // spot the app advises against; the stereo rules do not apply and are left out.
      const physics = physicsOnly(scorer, placement);
      redFlag.push(physics !== null);
      return physics ?? NaN;
    }),
  );
  return { x0: xs[0] ?? 0, y0: ys[0] ?? 0, step, nx: xs.length, ny: ys.length, values, redFlag };
}
