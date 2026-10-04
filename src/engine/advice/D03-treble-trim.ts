import { findingFor, makeAdvice, type AdviceRule } from './rule';

/**
 * D03 · Treble trim for the room's character (🟡; the same reasoning as H06, which it turns into a
 * setting). Sources: manufacturer guidance, [TOOLE] (⚠ verify). One step of the speaker's own
 * treble control in the direction H06 suggests, then listen.
 */
export const D03: AdviceRule = {
  id: 'D03',
  level: 'heuristic',
  concern: 'speaker',
  sources: ['manufacturer', 'TOOLE'],
  variants: ['lift', 'cut'],
  advise(ctx, _placement, findings) {
    const control = ctx.project.speaker.dsp.treble;
    const h06 = findingFor(findings, 'H06.lift') ?? findingFor(findings, 'H06.cut');
    if (!control || !h06) return [];
    const lift = h06.messageKey.endsWith('.lift');
    const params = { t60: h06.params.t60!, stepDb: lift ? control.stepDb : -control.stepDb };
    return [makeAdvice(D03, lift ? 'lift' : 'cut', { priority: 0.4, effect: 'small', params })];
  },
};
