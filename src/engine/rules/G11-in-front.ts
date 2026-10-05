import { acousticCentre, type AnalysisContext } from '../context';
import { THRESHOLDS as T } from '../scoring/thresholds';
import type { Placement } from '../types';
import { makeFinding, type RuleDef } from './rule';

/**
 * G11 · The speakers are in front of the listener (🟠). Sources: [ITU775] (the front pair at ±30°
 * in front of the listener), [TOOLE]. A pair beside or behind the seat is not a stereo setup at
 * all: the scorer caps it at "Poor" (scoring/scorer.ts, owner decision, docs/ROADMAP_V7.md) and
 * this rule says so in words. "In front" uses the same margin as the search (THRESHOLDS
 * .minListenerAhead): the ears at least that far ahead of each speaker's acoustic centre.
 */
export function speakersInFront(ctx: AnalysisContext, placement: Placement): boolean {
  return (['left', 'right'] as const).every(
    (side) =>
      placement.listener.y - acousticCentre(placement.speakers[side], ctx.speaker).y >=
      T.minListenerAhead - 1e-9,
  );
}

export const G11: RuleDef = {
  id: 'G11',
  level: 'guideline',
  concern: 'stereo',
  scope: 'placement',
  sources: ['ITU775', 'TOOLE'],
  variants: ['notInFront'],
  evaluate(ctx, placement) {
    return speakersInFront(ctx, placement) ? [] : [makeFinding(G11, 'notInFront', 'red-flag', {})];
  },
};
