import { findingFor, makeAdvice, type AdviceRule } from './rule';

/**
 * T04 · Bass traps in the corners (🟠; corners are pressure maxima of every mode, 🔴 P03).
 * Sources: [KUT], [EVP], [TOOLE]. Offered when the seat has a large predicted bass peak (P09
 * caution) or the room stacks its lowest modes (P11). Honest about size: absorbing below 100 Hz
 * takes large, deep traps; small foam corner pieces do little there (⚠ no number claimed).
 */
export const T04: AdviceRule = {
  id: 'T04',
  level: 'guideline',
  concern: 'bass',
  sources: ['KUT', 'EVP', 'TOOLE'],
  variants: ['corners'],
  advise(_ctx, _placement, findings) {
    const peak = findingFor(findings, 'P09.peak');
    const stacked = findingFor(findings, 'P11.coincident');
    if (peak?.severity !== 'caution' && !stacked) return [];
    const frequency =
      peak?.severity === 'caution' ? peak.params.frequency! : stacked!.params.frequencyA!;
    return [
      makeAdvice(T04, 'corners', {
        priority: 0.35,
        effect: 'small',
        effort: 'invest',
        params: { frequency },
      }),
    ];
  },
};
