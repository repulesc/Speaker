import { findingFor, makeAdvice, type AdviceRule } from './rule';

/**
 * D04 · Bring the tweeter to ear height (🟠, from G08). Sources: [TOOLE], [ITU1116] (⚠ verify
 * wording). Heights are not searched in v1, so when G08 cautions or red-flags, this says how high
 * the speaker's base should be for its acoustic axis to meet the ears, or to tilt it instead.
 */
export const D04: AdviceRule = {
  id: 'D04',
  level: 'guideline',
  concern: 'stereo',
  sources: ['TOOLE', 'ITU1116'],
  variants: ['height'],
  advise(ctx, placement, findings) {
    const g08 = findingFor(findings, 'G08.redFlag') ?? findingFor(findings, 'G08.caution');
    if (!g08) return [];
    const baseHeight = Math.max(0, placement.listener.z - ctx.speaker.axisHeight);
    const params = { baseHeight, angle: g08.params.angle! };
    const priority = g08.severity === 'red-flag' ? 0.85 : 0.5;
    return [makeAdvice(D04, 'height', { priority, effect: 'moderate', params })];
  },
};
