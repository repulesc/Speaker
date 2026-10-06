import type { AnalysisContext } from '../context';
import { makeFinding, type RuleDef } from './rule';

/**
 * The room's treble character (🟡): 'lift' when the high band dies away fast (T60 below 0.3 s),
 * 'cut' when it rings on (above 0.6 s), else null. Never from the defaults alone: some of the room
 * must be described (R0 audit, M11). Shared with D07, which says the same without a known control.
 */
export function trebleCharacter(ctx: AnalysisContext): 'lift' | 'cut' | null {
  const { surfaces } = ctx.project;
  const described =
    Object.values(surfaces.baseCertainty).some((c) => c !== 'unknown') ||
    (ctx.variant.busyness !== undefined && ctx.variant.busyness.certainty !== 'unknown');
  if (!described) return null;
  const t = ctx.t60.treble;
  return t < 0.3 ? 'lift' : t > 0.6 ? 'cut' : null;
}

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
    const t = ctx.t60.treble;
    const character = trebleCharacter(ctx);
    if (character === 'lift') return [makeFinding(H06, 'lift', 'info', { t60: t, suggestDb: 0.5 })];
    if (character === 'cut') return [makeFinding(H06, 'cut', 'info', { t60: t, suggestDb: -0.5 })];
    return [];
  },
};
