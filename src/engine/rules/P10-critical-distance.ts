import { acousticCentre } from '../context';
import { distance } from '../math/geometry';
import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/**
 * P10 · Critical distance (🔴 physics, rough in small rooms). Sources: [EVP], [KUT] (constant ⚠ verify).
 * r_c ≈ 0.057 · sqrt(Q · V / T60). Context only; never a red flag.
 */
export function criticalDistance(q: number, volume: number, t60: number): number {
  return 0.057 * Math.sqrt((q * volume) / t60);
}

export const P10: RuleDef = {
  id: 'P10',
  level: 'physics',
  concern: 'room',
  scope: 'placement',
  sources: ['EVP', 'KUT'],
  variants: ['ratio'],
  evaluate(ctx, placement) {
    const rc = criticalDistance(ctx.speaker.qMid, ctx.room.V, ctx.t60.mid);
    const listening = distance(
      acousticCentre(placement.speakers.left, ctx.speaker),
      placement.listener,
    );
    return [
      makeFinding(
        P10,
        'ratio',
        'info',
        { criticalDistance: rc, listeningDistance: listening, ratio: listening / rc },
        { assumptions: [ASSUMPTION.diffuseField] },
      ),
    ];
  },
};
