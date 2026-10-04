import { placementDistance } from './scoring/search';
import type { Action, Candidate, Finding } from './types';

const MAX_ACTIONS = 3;
const MIN_MOVE_GAIN = 0.05;

/**
 * "Do this first" (docs/SCORING.md §5): red flags first, then the move to the best candidate if it
 * clearly helps, then speaker settings. At most three.
 */
export function topActions(
  findings: readonly Finding[],
  current: Candidate,
  best?: Candidate,
): Action[] {
  const actions: Action[] = findings
    .filter((f) => f.severity === 'red-flag')
    .slice(0, 2)
    .map((finding) => ({ kind: 'fix', finding }));

  if (best) {
    const gain = best.score - current.score;
    if (gain >= MIN_MOVE_GAIN && placementDistance(best, current) >= 0.05) {
      actions.push({ kind: 'move', to: best, gain });
    }
  }

  for (const finding of findings) {
    if (finding.messageKey === 'finding.G07.matchSetting' || finding.ruleId === 'H06') {
      actions.push({ kind: 'setting', finding });
    }
  }
  return actions.slice(0, MAX_ACTIONS);
}
