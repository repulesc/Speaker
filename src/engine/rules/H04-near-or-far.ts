import { boundaryDistances, boundaryNullHz } from './P04-boundary-interference';
import { makeFinding, type RuleDef } from './rule';

/**
 * H04 · Front-wall distance: near or far, not in between (🟡 framing, physics from P04).
 * Sources: [ALL74], [TOOLE] (⚠ verify the framing). Band edges 80 Hz / 300 Hz are 🟡.
 */
export type FrontWallZone = 'near' | 'middle' | 'far';

export function frontWallZone(nullHz: number): FrontWallZone {
  if (nullHz > 300) return 'near';
  if (nullHz < 80) return 'far';
  return 'middle';
}

export const H04: RuleDef = {
  id: 'H04',
  level: 'heuristic',
  concern: 'frontWall',
  scope: 'placement',
  sources: ['ALL74', 'TOOLE'],
  variants: ['near', 'middle', 'far'],
  evaluate(ctx, placement) {
    const d = boundaryDistances(placement.speakers.left, ctx).front;
    const frequency = boundaryNullHz(d, ctx.c);
    return [makeFinding(H04, frontWallZone(frequency), 'info', { distance: d, frequency })];
  },
};
