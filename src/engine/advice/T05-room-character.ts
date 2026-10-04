import { furnishingAbsorption } from '../context';
import { reverberation, roomCharacter } from '../rules/P08-reverberation';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * T05 · Too live or too dead (🔴 model for the predicted change, P08; the target band is 🟡).
 * Sources: [SAB], [EYR30], [EVP]. A live room: about 5 m² of extra soft absorption (a large rug
 * and heavy curtains) and the estimate it would give. A dead room: take some away. The prediction
 * is as rough as P08 itself and is shown with its method.
 */
const ADDED_ABSORPTION = 5;
/** Less than this (m² sabins) is not worth suggesting. */
const MIN_CHANGE = 1;

export const T05: AdviceRule = {
  id: 'T05',
  level: 'physics',
  concern: 'room',
  sources: ['SAB', 'EYR30', 'EVP'],
  variants: ['soften', 'liven'],
  advise(ctx) {
    const character = roomCharacter(ctx.t60.mid);
    if (character === 'balanced') return [];
    const { width, length } = ctx.project.room;
    const [lo, hi] = furnishingAbsorption(ctx.variant, width.value! * length.value!);
    const change = character === 'live' ? ADDED_ABSORPTION : -Math.min(ADDED_ABSORPTION, lo);
    // A dead room with little soft furnishing: nothing to take away, so no advice (R3 review F8).
    if (Math.abs(change) < MIN_CHANGE) return [];
    const after = reverberation(ctx.room, ctx.project.surfaces, [lo + change, hi + change]).mid;
    const params = { t60: ctx.t60.mid, after, absorption: Math.abs(change) };
    return [
      character === 'live'
        ? makeAdvice(T05, 'soften', { priority: 0.6, effect: 'moderate', params })
        : makeAdvice(T05, 'liven', { priority: 0.3, effect: 'moderate', params }),
    ];
  },
};
