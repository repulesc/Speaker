import { firstReflections, isNearSide } from '../rules/P06-reflections';
import type { Advice } from '../types';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * T01 · Side-wall first reflections (🟠; the points themselves are 🔴 P06). Sources: [TOOLE],
 * [DAV80]. Only hard, flat surfaces at the near-side reflection points get advice. Who wants
 * precise imaging: absorb or diffuse there. Who wants width: leave them. Neither or both: the
 * research is split, so it is a listening experiment. A porous panel needs about 5 cm to work
 * across the mid and treble range (🟡, ⚠ verify against [EVP]).
 */
export const T01: AdviceRule = {
  id: 'T01',
  level: 'guideline',
  concern: 'reflections',
  sources: ['TOOLE', 'DAV80'],
  variants: ['absorb', 'experiment'],
  advise(ctx, placement) {
    const precise = (ctx.goals.weights['precise-imaging'] ?? 0) > 0;
    const wide = (ctx.goals.weights['wide-stage'] ?? 0) > 0;
    if (wide && !precise) return [];
    return firstReflections(ctx, placement.speakers, placement.listener)
      .filter((r) => isNearSide(r) && r.surfaceClass === 'reflective')
      .map((r): Advice =>
        makeAdvice(T01, precise && !wide ? 'absorb' : 'experiment', {
          priority: precise && !wide ? 0.7 : 0.4,
          effort: precise && !wide ? 'invest' : 'free',
          effect: 'moderate',
          params: { speaker: r.speaker, boundary: r.boundary, thickness: 0.05 },
          location: r.point,
        }),
      );
  },
};
