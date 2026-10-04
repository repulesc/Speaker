import { makeFinding, type RuleDef } from './rule';

/**
 * H06 · Treble trim versus room character (🟡). Sources: manufacturer EQ guidance, [TOOLE] (⚠ verify).
 * Only for speakers with a treble control. High-band T60 below 0.3 s → try a small lift;
 * above 0.6 s → try a small cut. Always "try, then listen".
 */
export const H06: RuleDef = {
  id: 'H06',
  level: 'heuristic',
  sources: ['manufacturer', 'TOOLE'],
  variants: ['lift', 'cut'],
  evaluate(ctx) {
    if (!ctx.speaker.hasTrebleControl) return [];
    const t = ctx.t60.treble;
    if (t < 0.3) return [makeFinding(H06, 'lift', 'info', { t60: t, suggestDb: 0.5 })];
    if (t > 0.6) return [makeFinding(H06, 'cut', 'info', { t60: t, suggestDb: -0.5 })];
    return [];
  },
};
