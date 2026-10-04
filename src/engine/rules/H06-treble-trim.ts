import { makeFinding, type RuleDef } from './rule';

/**
 * H06 · Treble trim versus room character (🟡). Sources: manufacturer EQ guidance, [TOOLE] (⚠ verify).
 * Only for speakers with a treble control, and only once surfaces or furnishing are described.
 * High-band T60 below 0.3 s → try a small lift;
 * above 0.6 s → try a small cut. Always "try, then listen".
 */
export const H06: RuleDef = {
  id: 'H06',
  level: 'heuristic',
  concern: 'speaker',
  scope: 'room',
  sources: ['manufacturer', 'TOOLE'],
  variants: ['lift', 'cut'],
  evaluate(ctx) {
    if (!ctx.speaker.hasTrebleControl) return [];
    // Advice needs some of the room described: never from the defaults alone (R0 audit, M11).
    const { surfaces } = ctx.project;
    const described =
      Object.values(surfaces.baseCertainty).some((c) => c !== 'unknown') ||
      surfaces.patches.length > 0 ||
      ctx.variant.objects.length > 0 ||
      (ctx.variant.busyness !== undefined && ctx.variant.busyness.certainty !== 'unknown');
    if (!described) return [];
    const t = ctx.t60.treble;
    if (t < 0.3) return [makeFinding(H06, 'lift', 'info', { t60: t, suggestDb: 0.5 })];
    if (t > 0.6) return [makeFinding(H06, 'cut', 'info', { t60: t, suggestDb: -0.5 })];
    return [];
  },
};
