import { rearClearance } from '../context';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * D01 · Match the speaker's wall-distance setting to where it stands (🟠, manufacturer-specific;
 * extends G07). Sources: manufacturer documentation per profile. The engine knows the distance,
 * not the names of a given speaker's options (⚠ those come from its manual), so it states the
 * distance and whether it counts as close to the wall (rear panel within 0.3 m, 🟡).
 */
export const D01: AdviceRule = {
  id: 'D01',
  level: 'guideline',
  concern: 'speaker',
  sources: ['manufacturer'],
  variants: ['match'],
  advise(ctx, placement) {
    if (!ctx.speaker.hasWallSetting) return [];
    const clearance = rearClearance(placement.speakers.left, ctx.speaker);
    const zone = clearance < 0.3 ? 'near' : 'away';
    return [
      makeAdvice(D01, 'match', { priority: 0.8, effect: 'moderate', params: { clearance, zone } }),
    ];
  },
};
