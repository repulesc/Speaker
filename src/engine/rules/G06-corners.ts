import { wooferCentre } from '../context';
import { makeFinding, type RuleDef } from './rule';

/**
 * G06 · Avoid corners unless the speaker is designed for it (🟠; thresholds 🟡).
 * Sources: [ALL74], [TOOLE]. Woofer centre within 0.25 m of two walls → red flag; 0.5 m → caution.
 */
export type CornerProximity = 'corner' | 'near-corner' | 'clear';

export function cornerProximity(frontDistance: number, sideDistance: number): CornerProximity {
  if (frontDistance < 0.25 && sideDistance < 0.25) return 'corner';
  if (frontDistance < 0.5 && sideDistance < 0.5) return 'near-corner';
  return 'clear';
}

export const G06: RuleDef = {
  id: 'G06',
  level: 'guideline',
  sources: ['ALL74', 'TOOLE'],
  variants: ['redFlag', 'caution', 'ok'],
  evaluate(ctx, placement) {
    if (ctx.speaker.designedForCorner) return [];
    const worst = (['left', 'right'] as const)
      .map((side) => {
        const w = wooferCentre(placement.speakers[side], ctx.speaker);
        return { side, proximity: cornerProximity(w.y, Math.min(w.x, ctx.room.W - w.x)) };
      })
      .sort((a, b) => rank(a.proximity) - rank(b.proximity))[0]!;
    const params = { speaker: worst.side };
    if (worst.proximity === 'corner') return [makeFinding(G06, 'redFlag', 'red-flag', params)];
    if (worst.proximity === 'near-corner') return [makeFinding(G06, 'caution', 'caution', params)];
    return [makeFinding(G06, 'ok', 'ok')];
  },
};

function rank(p: CornerProximity): number {
  return p === 'corner' ? 0 : p === 'near-corner' ? 1 : 2;
}
