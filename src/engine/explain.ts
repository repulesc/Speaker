import { sortFindings } from './analyze';
import { buildContext, currentPlacement } from './context';
import { RULES } from './rules';
import { bassCurve } from './rules/P09-bass-response';
import { speakersInFront } from './rules/G11-in-front';
import {
  ANALYSIS_SEED,
  avoidsRedFlags,
  isValidPlacement,
  makeScorer,
  robustScores,
  speakerPair,
} from './scoring/search';
import type { Placement, PointExplanation, Project, Vec3 } from './types';

/**
 * The probe: everything the engine can say about one spot. The seat goes to `seat` (ear height
 * kept unless given); the speakers stay as they are unless `speakers` is given. Null until the
 * room size is known.
 */
export function explainPoint(
  project: Project,
  seat: Partial<Vec3> & { x: number; y: number },
  speakers?: Placement['speakers'],
): PointExplanation | null {
  const ctx = buildContext(project);
  if (!ctx) return null;
  const current = currentPlacement(ctx);
  const placement: Placement = {
    speakers: speakers ?? current.speakers,
    listener: { ...current.listener, ...seat },
  };
  const scorer = makeScorer(ctx);
  const { score, breakdown } = scorer.score(placement);
  const [robust] = robustScores(scorer, [placement], ANALYSIS_SEED);
  const curve = bassCurve(ctx, placement);
  return {
    placement,
    valid: isValidPlacement(ctx, placement),
    redFlag: !avoidsRedFlags(ctx, placement, { seat: true, speakers: true }),
    score,
    robust: robust!.robust,
    overall: breakdown.reduce((sum, b) => sum + b.value * scorer.neutralWeights[b.componentId], 0),
    breakdown,
    findings: sortFindings(
      RULES.filter((rule) => rule.scope === 'placement').flatMap((rule) =>
        rule.evaluate(ctx, placement),
      ),
    ),
    bassResponse: { f: Array.from(curve.freqs), dB: Array.from(curve.db) },
  };
}

/**
 * The speaker map under the pointer: the pair the map shows at `at` (the left speaker there, the
 * right mirrored), scored the way Apply would score it. `stereo` is false where no stereo pair can
 * stand (beside, behind or too close to the seat, or outside the room).
 */
export function explainSpeakerSpot(
  project: Project,
  at: { x: number; y: number },
): { stereo: boolean; robust: number; flagged: boolean; speakers: Placement['speakers'] } | null {
  const ctx = buildContext(project);
  if (!ctx) return null;
  const { listener } = currentPlacement(ctx);
  const centre = ctx.project.constraints.keepSymmetric ? ctx.room.W / 2 : listener.x;
  const half = Math.abs(centre - at.x);
  const clearance = at.y - ctx.speaker.depth / 2;
  const speakers = speakerPair(ctx, centre, half, clearance);
  const placement = { speakers, listener };
  const bare = { ...ctx, objects: [] };
  const stereo =
    clearance >= 0 &&
    half >= ctx.speaker.width / 2 &&
    speakersInFront(ctx, placement) &&
    isValidPlacement(bare, placement);
  const scorer = makeScorer(ctx);
  const [robust] = robustScores(scorer, [placement], ANALYSIS_SEED);
  return {
    stereo,
    robust: robust!.robust,
    flagged: stereo && !isValidPlacement(ctx, placement),
    speakers,
  };
}
