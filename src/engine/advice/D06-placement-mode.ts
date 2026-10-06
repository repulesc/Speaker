import { placedOnOf } from '../presets/speakerKinds';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * D06 · Desk or stand mode (🟠, manufacturer-specific). Sources: manufacturer documentation. For
 * speakers that offer placement modes: "desk" when the speakers stand on a desk, otherwise
 * "stand". Only the modes the profile lists are suggested.
 */
export const D06: AdviceRule = {
  id: 'D06',
  level: 'guideline',
  concern: 'speaker',
  sources: ['manufacturer'],
  variants: ['desk', 'stand'],
  advise(ctx) {
    const modes = ctx.project.speaker.dsp.placementModes ?? [];
    const mode = placedOnOf(ctx.project.speaker.choices ?? {}) === 'desk' ? 'desk' : 'stand';
    if (!modes.includes(mode)) return [];
    return [makeAdvice(D06, mode, { priority: 0.55, effect: 'small' })];
  },
};
