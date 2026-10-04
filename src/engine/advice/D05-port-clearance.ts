import { findingFor, makeAdvice, type AdviceRule } from './rule';

/**
 * D05 · Give a rear port its room (🟠, from G07). Sources: manufacturer documentation, [TOOLE].
 * Move the speakers out to the minimum; the manual says whether port plugs are supplied and when
 * to use them (⚠ the engine does not know).
 */
export const D05: AdviceRule = {
  id: 'D05',
  level: 'guideline',
  concern: 'speaker',
  sources: ['manufacturer', 'TOOLE'],
  variants: ['moveOut', 'fixed'],
  advise(ctx, _placement, findings) {
    const g07 = findingFor(findings, 'G07.tooClose');
    if (!g07) return [];
    const params = { clearance: g07.params.clearance!, minimum: g07.params.minimum! };
    // The user said the speakers cannot move (R5): point to what is left instead.
    const variant = ctx.project.constraints.speakersFixed ? 'fixed' : 'moveOut';
    return [makeAdvice(D05, variant, { priority: 0.6, effect: 'moderate', params })];
  },
};
