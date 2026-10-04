import { sortFindings } from './analyze';
import { buildContext, currentPlacement } from './context';
import { RULES } from './rules';
import { bassCurve } from './rules/P09-bass-response';
import { avoidsRedFlags, isValidPlacement, makeScorer } from './scoring/search';
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
  const curve = bassCurve(ctx, placement);
  return {
    placement,
    valid: isValidPlacement(ctx, placement),
    redFlag: !avoidsRedFlags(ctx, placement, { seat: true, speakers: true }),
    score,
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
