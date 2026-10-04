import { rearClearance, type AnalysisContext } from '../context';
import type { SpeakerPlacement } from '../types';
import { makeFinding, type RuleDef } from './rule';

/**
 * G06 · Avoid corners unless the speaker is designed for it (🟠; thresholds 🟡).
 * Sources: [ALL74], [TOOLE]. Cabinet within 0.25 m of two walls → red flag; 0.5 m → caution.
 * **(R1)** Measured from the cabinet (rear panel to the front wall, side panel to the side wall),
 * where a rear port also sits. From the woofer on the front baffle, a deep cabinet pushed fully
 * into a corner could never be red-flagged (R0 audit, L10).
 */
export type CornerProximity = 'corner' | 'near-corner' | 'clear';

export function cornerProximity(frontDistance: number, sideDistance: number): CornerProximity {
  if (frontDistance < 0.25 && sideDistance < 0.25) return 'corner';
  if (frontDistance < 0.5 && sideDistance < 0.5) return 'near-corner';
  return 'clear';
}

/** How close one speaker's cabinet is to the front-wall corner on its side. */
export function speakerCorner(p: SpeakerPlacement, ctx: AnalysisContext): CornerProximity {
  const half = ctx.speaker.width / 2;
  const side = Math.min(p.base.x - half, ctx.room.W - p.base.x - half);
  return cornerProximity(rearClearance(p, ctx.speaker), side);
}

export const G06: RuleDef = {
  id: 'G06',
  level: 'guideline',
  concern: 'bass',
  scope: 'placement',
  sources: ['ALL74', 'TOOLE'],
  variants: ['redFlag', 'caution', 'ok'],
  evaluate(ctx, placement) {
    if (ctx.speaker.designedForCorner) return [];
    const worst = (['left', 'right'] as const)
      .map((side) => ({ side, proximity: speakerCorner(placement.speakers[side], ctx) }))
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
