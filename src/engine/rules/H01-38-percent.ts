import { makeFinding, type RuleDef } from './rule';

/**
 * H01 · The "38 % rule" (🟡 heuristic, overlay only, never scored).
 * Origin not established (⚠ verify); shown as "a popular starting point, origin unclear".
 */
export const H01: RuleDef = {
  id: 'H01',
  level: 'heuristic',
  sources: [],
  variants: ['overlay'],
  evaluate(ctx) {
    const y = 0.38 * ctx.room.L;
    return [makeFinding(H01, 'overlay', 'info', { listenerY: y }, { overlayY: [y] })];
  },
};
