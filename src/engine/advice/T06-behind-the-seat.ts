import { findingFor, makeAdvice, type AdviceRule } from './rule';

/**
 * T06 · Absorption behind the seat (🟠; the early reflection itself is 🔴 P06). Sources:
 * [TOOLE]. With the head near the back wall (G02 caution or red flag) its reflection arrives
 * within a few milliseconds. Moving the seat forward helps most; if it cannot move, a thick
 * absorber (10 cm or more) behind the head takes the edge off.
 */
export const T06: AdviceRule = {
  id: 'T06',
  level: 'guideline',
  concern: 'reflections',
  sources: ['TOOLE'],
  variants: ['moveFirst', 'absorber'],
  advise(ctx, _placement, findings) {
    const backWall = findingFor(findings, 'G02.redFlag') ?? findingFor(findings, 'G02.caution');
    if (!backWall) return [];
    const params = { distance: backWall.params.distance!, thickness: 0.1 };
    const priority = backWall.severity === 'red-flag' ? 0.9 : 0.6;
    return [
      ctx.project.constraints.listenerFixed
        ? makeAdvice(T06, 'absorber', { priority, effect: 'moderate', effort: 'invest', params })
        : makeAdvice(T06, 'moveFirst', { priority, effect: 'large', params }),
    ];
  },
};
