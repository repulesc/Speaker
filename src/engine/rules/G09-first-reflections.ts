import { firstReflections, isNearSide } from './P06-reflections';
import { makeFinding, type RuleDef } from './rule';

/**
 * G09 · First reflections: the two schools, goal-dependent (🟠 rule; advice 🟡). Never a red flag.
 * Sources: [TOOLE] (listener preference for lateral reflections), [DAV80] (reflection-free zone).
 */
export const G09: RuleDef = {
  id: 'G09',
  level: 'guideline',
  sources: ['TOOLE', 'DAV80'],
  variants: ['treatForImaging', 'keepForWidth', 'bothSchools'],
  evaluate(ctx, placement) {
    const wantsPrecision = (ctx.goals.weights['precise-imaging'] ?? 0) > 0;
    const wantsWidth = (ctx.goals.weights['wide-stage'] ?? 0) > 0;
    return firstReflections(ctx, placement.speakers, placement.listener)
      .filter(isNearSide)
      .filter((r) => r.surfaceClass === 'reflective')
      .map((r) => {
        const params = { boundary: r.boundary, surface: r.surface };
        const extras = { location: r.point };
        if (wantsPrecision && !wantsWidth)
          return makeFinding(G09, 'treatForImaging', 'info', params, extras);
        if (wantsWidth && !wantsPrecision)
          return makeFinding(G09, 'keepForWidth', 'info', params, extras);
        return makeFinding(G09, 'bothSchools', 'info', params, extras);
      });
  },
};
