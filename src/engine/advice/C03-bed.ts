import { makeAdvice, type AdviceRule } from './rule';

/**
 * C03 · Listening in bed (V7 contextual tip). Lying or half sitting, the ears are near the pillow,
 * lower than a seated listener's; the reference axis should meet the ears ([ITU1116], as G08 and
 * D04), so lower the speakers or tilt them down (🟠). The app does not know the pillow's height, so
 * it says this in words instead of computing an angle.
 */
export const C03: AdviceRule = {
  id: 'C03',
  level: 'guideline',
  concern: 'stereo',
  sources: ['ITU1116', 'TOOLE'],
  variants: ['bed'],
  advise(ctx) {
    if (ctx.variant.listener.area !== 'bed') return [];
    return [makeAdvice(C03, 'bed', { priority: 0.55, effect: 'moderate' })];
  },
};
