import { acousticCentre } from '../context';
import { toDeg } from '../math/geometry';
import { makeFinding, type RuleDef } from './rule';

/**
 * G08 · Acoustic axis at ear height (🟠; thresholds 🟡). Sources: [TOOLE], [ITU1116] (⚠ verify).
 * Vertical angle: OK ≤ 10° (coaxial ≤ 15°), caution ≤ 20°, red flag beyond.
 */
export const G08: RuleDef = {
  id: 'G08',
  level: 'guideline',
  concern: 'stereo',
  scope: 'placement',
  sources: ['TOOLE', 'ITU1116'],
  variants: ['redFlag', 'caution', 'ok'],
  evaluate(ctx, placement) {
    const ears = placement.listener;
    const angles = (['left', 'right'] as const).map((side) => {
      const a = acousticCentre(placement.speakers[side], ctx.speaker);
      const horizontal = Math.hypot(a.x - ears.x, a.y - ears.y);
      return toDeg(Math.atan2(ears.z - a.z, horizontal));
    });
    const angle = angles.reduce((worst, v) => (Math.abs(v) > Math.abs(worst) ? v : worst));
    const okLimit = ctx.speaker.driverLayout === 'coaxial' ? 15 : 10;
    const params = { angle, direction: angle > 0 ? 'above' : 'below' };
    if (Math.abs(angle) > 20) return [makeFinding(G08, 'redFlag', 'red-flag', params)];
    if (Math.abs(angle) > okLimit) return [makeFinding(G08, 'caution', 'caution', params)];
    return [makeFinding(G08, 'ok', 'ok', params)];
  },
};
