import { acousticCentre } from '../context';
import { distance } from '../math/geometry';
import { makeFinding, type RuleDef } from './rule';

/**
 * G05 · Equal distances to both speakers (🟠; thresholds 🟡). Sources: [WALL49], [TOOLE].
 * |d_L − d_R|: OK ≤ 0.02 m, caution ≤ 0.10 m, red flag above.
 */
export const G05: RuleDef = {
  id: 'G05',
  level: 'guideline',
  concern: 'stereo',
  scope: 'placement',
  sources: ['WALL49', 'TOOLE'],
  variants: ['redFlag', 'caution', 'ok'],
  evaluate(ctx, placement) {
    const dL = distance(acousticCentre(placement.speakers.left, ctx.speaker), placement.listener);
    const dR = distance(acousticCentre(placement.speakers.right, ctx.speaker), placement.listener);
    const diff = Math.abs(dL - dR);
    const params = { difference: diff, closer: dL < dR ? 'left' : 'right' };
    if (diff > 0.1) return [makeFinding(G05, 'redFlag', 'red-flag', params)];
    if (diff > 0.02) return [makeFinding(G05, 'caution', 'caution', params)];
    return [makeFinding(G05, 'ok', 'ok', params)];
  },
};
