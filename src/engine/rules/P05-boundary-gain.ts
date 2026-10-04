import { ramp } from '../math/geometry';
import { boundaryDistances, boundaryNullHz } from './P04-boundary-interference';
import { makeFinding, type RuleDef } from './rule';

export type GainCategory = 'low' | 'moderate' | 'high' | 'very-high';

/**
 * P05 · Boundary bass gain (🔴 physics, qualitative). Sources: [ALL74], [TOOLE], [EVP].
 * Each nearby boundary adds low-frequency output (ideally up to +6 dB each). We only report a
 * category: each of front wall, nearest side wall and floor contributes 1 when closer than
 * 0.2 m, fading to 0 at 1.0 m. Category cut-offs are calibration choices (🟡).
 */
export function boundaryGainCategory(front: number, side: number, floor: number): GainCategory {
  const proximity = [front, side, floor].reduce((sum, d) => sum + ramp(d, 0.2, 1.0, 1, 0), 0);
  if (proximity < 0.8) return 'low';
  if (proximity < 1.5) return 'moderate';
  if (proximity < 2.2) return 'high';
  return 'very-high';
}

export const P05: RuleDef = {
  id: 'P05',
  level: 'physics',
  concern: 'bass',
  scope: 'placement',
  sources: ['ALL74', 'TOOLE', 'EVP'],
  variants: ['low', 'moderate', 'high', 'very-high'],
  evaluate(ctx, placement) {
    const d = boundaryDistances(placement.speakers.left, ctx);
    const category = boundaryGainCategory(d.front, d.side, d.floor);
    return [
      makeFinding(P05, category, 'info', {
        belowHz: boundaryNullHz(Math.min(d.front, d.side), ctx.c),
      }),
    ];
  },
};
