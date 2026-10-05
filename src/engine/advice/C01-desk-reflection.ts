import { makeAdvice, type AdviceRule } from './rule';

/**
 * C01 · At a desk, the desk top reflects (V7 contextual tip). The reflection itself is plain
 * geometry (image source, as P06; [KUT]); that raising the speakers and aiming them at the ears
 * weakens it is the usual advice for near-field listening ([TOOLE], chapter not checked). No size
 * of the effect is claimed (🟠). Shown only when you listen at a desk.
 */
export const C01: AdviceRule = {
  id: 'C01',
  level: 'guideline',
  concern: 'reflections',
  sources: ['KUT', 'TOOLE'],
  variants: ['desk'],
  advise(ctx) {
    const desk =
      ctx.project.constraints.listeningDistance === 'near' || ctx.variant.listener.area === 'desk';
    return desk ? [makeAdvice(C01, 'desk', { priority: 0.45, effect: 'small' })] : [];
  },
};
