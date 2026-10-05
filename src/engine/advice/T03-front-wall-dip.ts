import { wooferCentre } from '../context';
import { frontWallNullAtSeat } from '../rules/P04-boundary-interference';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * T03 · Absorbing the front-wall dip (🔴 physics: a porous absorber works where the air moves,
 * which peaks a quarter wavelength from a wall [KUT], [EVP]). When the front-wall null at the seat
 * falls in the 80–300 Hz "middle" zone (H04), a panel behind the speakers needs to be about a
 * quarter wavelength deep to remove it: usually far too deep. So moving the speakers comes first;
 * a thick panel (10–20 cm) only makes the dip a little shallower. Said plainly.
 */
export const T03: AdviceRule = {
  id: 'T03',
  level: 'physics',
  concern: 'frontWall',
  sources: ['KUT', 'EVP', 'ALL74'],
  variants: ['moveFirst', 'thickPanel'],
  advise(ctx, placement) {
    const woofer = wooferCentre(placement.speakers.left, ctx.speaker);
    const frequency = frontWallNullAtSeat(woofer, placement.listener, ctx.c);
    if (frequency < 80 || frequency > 300) return [];
    const params = { frequency, quarterWavelength: ctx.c / frequency / 4 };
    const fixed = ctx.project.constraints.speakersFixed;
    return [
      fixed
        ? makeAdvice(T03, 'thickPanel', {
            priority: 0.3,
            effect: 'small',
            effort: 'invest',
            params,
          })
        : makeAdvice(T03, 'moveFirst', { priority: 0.35, effect: 'small', params }),
    ];
  },
};
