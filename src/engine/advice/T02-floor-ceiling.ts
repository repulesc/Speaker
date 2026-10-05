import { firstReflections } from '../rules/P06-reflections';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * T02 · Floor and ceiling reflections (🟠; points 🔴 P06). Sources: [TOOLE]. A hard floor between
 * the speakers and the seat: a rug there. A hard ceiling: a panel at the reflection point. The
 * vertical reflections matter less for imaging than the side ones (Toole), so they rank lower.
 * One piece of advice per surface, at the left speaker's point (the right one mirrors it).
 */
export const T02: AdviceRule = {
  id: 'T02',
  level: 'guideline',
  concern: 'reflections',
  sources: ['TOOLE'],
  variants: ['rug', 'ceilingPanel'],
  advise(ctx, placement) {
    return firstReflections(ctx, placement.speakers, placement.listener)
      .filter((r) => r.speaker === 'left' && r.surfaceClass === 'reflective')
      .filter((r) => r.boundary === 'floor' || r.boundary === 'ceiling')
      .map((r) =>
        r.boundary === 'floor'
          ? makeAdvice(T02, 'rug', {
              priority: 0.5,
              effect: 'moderate',
              effort: 'cheap',
              location: r.point,
            })
          : makeAdvice(T02, 'ceilingPanel', {
              priority: 0.3,
              effect: 'small',
              effort: 'invest',
              location: r.point,
            }),
      );
  },
};
