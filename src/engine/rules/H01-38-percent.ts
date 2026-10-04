import { makeFinding, type RuleDef } from './rule';

/**
 * H01 · The "38 % rule" (🟡 heuristic, overlay only, never scored).
 * Origin not established (⚠ verify); shown as "a popular starting point, origin unclear".
 */
/** The seat 38 % of the room length from the front wall (numerically 1 − 0.618; origin unclear). */
export const H01_SEAT_FRACTION = 0.38;

export const H01: RuleDef = {
  id: 'H01',
  level: 'heuristic',
  concern: 'rulesOfThumb',
  scope: 'room',
  sources: [],
  variants: ['overlay'],
  evaluate(ctx) {
    const y = H01_SEAT_FRACTION * ctx.room.L;
    return [makeFinding(H01, 'overlay', 'info', { listenerY: y }, { overlayY: [y] })];
  },
};
