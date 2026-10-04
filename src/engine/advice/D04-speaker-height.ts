import { findingFor, makeAdvice, type AdviceRule } from './rule';

/**
 * D04 · Bring the tweeter to ear height (🟠, from G08). Sources: [TOOLE], [ITU1116] (⚠ verify
 * wording). Heights are not searched in v1, so when G08 cautions or red-flags, this says how high
 * the speaker's base should be for its acoustic axis to meet the ears, or to tilt it instead.
 */
/** Below this a "stand height" is no stand at all. */
const MIN_BASE = 0.05;

export const D04: AdviceRule = {
  id: 'D04',
  level: 'guideline',
  concern: 'stereo',
  sources: ['TOOLE', 'ITU1116'],
  variants: ['height', 'tilt'],
  advise(ctx, placement, findings) {
    const g08 = findingFor(findings, 'G08.redFlag') ?? findingFor(findings, 'G08.caution');
    if (!g08) return [];
    const baseHeight = placement.listener.z - ctx.speaker.axisHeight;
    const priority = g08.severity === 'red-flag' ? 0.85 : 0.5;
    const angle = g08.params.angle!;
    // The axis is above the ears even with the speaker on the floor (R3 review F9): no stand
    // height can fix that, so tilt it down or sit higher.
    if (baseHeight < MIN_BASE) {
      return [makeAdvice(D04, 'tilt', { priority, effect: 'moderate', params: { angle } })];
    }
    const params = { baseHeight, angle };
    return [makeAdvice(D04, 'height', { priority, effect: 'moderate', params })];
  },
};
