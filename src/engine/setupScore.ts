import { buildContext, currentPlacement } from './context';
import { bassCurve } from './rules/P09-bass-response';
import { makeScorer, robustScores } from './scoring/search';
import type { Project } from './types';

/** One setup's score, the same number the full analysis shows (robust, same seed), and its bass. */
export interface SetupScore {
  score: number;
  bassResponse: { f: number[]; dB: number[] };
}

/**
 * The active setup's score without the search: for comparing setups and for the listening log
 * (docs/REVAMP_PLAN.md). Uses the robust score with the analysis's seed, so a setup reads the same
 * here as in "Your setup" (R3 review F1: the probe's nominal score did not).
 */
export function setupScore(project: Project, seed = 1): SetupScore | null {
  const ctx = buildContext(project);
  if (!ctx) return null;
  const placement = currentPlacement(ctx);
  const [robust] = robustScores(makeScorer(ctx), [placement], seed);
  const curve = bassCurve(ctx, placement);
  return {
    score: robust!.robust,
    bassResponse: { f: Array.from(curve.freqs), dB: Array.from(curve.db) },
  };
}
