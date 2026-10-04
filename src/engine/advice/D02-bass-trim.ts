import { boundaryDistances } from '../rules/P04-boundary-interference';
import { boundaryGainCategory } from '../rules/P05-boundary-gain';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * D02 · Bass trim against boundary gain (🟡 heuristic; the gain itself is 🔴 P05). Sources:
 * [ALL74], manufacturer guidance. Speakers close to walls get a broad bass lift; a speaker with a
 * bass control can take a little off. One step of the control at a time, then listen. No setting
 * is suggested without a control, or when the gain is low.
 */
export const D02: AdviceRule = {
  id: 'D02',
  level: 'heuristic',
  concern: 'speaker',
  sources: ['ALL74', 'manufacturer'],
  variants: ['cut'],
  advise(ctx, placement) {
    const control = ctx.project.speaker.dsp.bass;
    if (!control) return [];
    const d = boundaryDistances(placement.speakers.left, ctx);
    const gain = boundaryGainCategory(d.front, d.side, d.floor);
    if (gain !== 'high' && gain !== 'very-high') return [];
    const params = { gain, stepDb: -control.stepDb };
    return [makeAdvice(D02, 'cut', { priority: 0.5, effect: 'small', params })];
  },
};
