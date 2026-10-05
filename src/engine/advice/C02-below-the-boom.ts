import { makeAdvice, type AdviceRule } from './rule';

/**
 * C02 · Your speakers do not reach the room's deepest resonance (V7 contextual tip, 🔴 physics).
 * Below its −6 dB point a speaker's output falls by 12 dB (sealed) to 24 dB (ported) per octave,
 * the same roll-off the bass model uses (P09); a resonance half an octave or more below it is
 * barely excited ([KUT], [TOOLE]). Only when the user has told us about the speakers, so it never
 * speaks about the generic speaker.
 */
/** "Well below": the deepest resonance at most 1/1.5 of the −6 dB point (over half an octave). */
const MARGIN = 1.5;

export const C02: AdviceRule = {
  id: 'C02',
  level: 'physics',
  concern: 'bass',
  sources: ['KUT', 'TOOLE'],
  variants: ['quiet'],
  advise(ctx) {
    const speaker = ctx.project.speaker;
    const told =
      Object.keys(speaker.choices ?? {}).length > 0 ||
      speaker.lowFrequencyMinus6dB.certainty === 'measured';
    const deepest = ctx.modes[0]?.f;
    const f6 = ctx.speaker.f6;
    if (!told || deepest === undefined || f6 < MARGIN * deepest) return [];
    const params = { lowFrequencyMinus6dB: f6, frequency: deepest };
    return [makeAdvice(C02, 'quiet', { priority: 0.2, effect: 'small', params })];
  },
};
