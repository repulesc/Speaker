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
  variants: ['moveOut'],
  advise(_ctx, _placement, findings) {
    const g07 = findingFor(findings, 'G07.tooClose');
    if (!g07) return [];
    const params = { clearance: g07.params.clearance!, minimum: g07.params.minimum! };
    return [makeAdvice(D05, 'moveOut', { priority: 0.6, effect: 'moderate', params })];
  },
};
