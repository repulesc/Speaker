import { rearClearance } from '../context';
import type { Finding } from '../types';
import { makeFinding, type RuleDef } from './rule';

/**
 * G07 · Bass port clearance and placement settings (🟠, speaker-specific).
 * Sources: manufacturer documentation per profile; [TOOLE] for the general behaviour.
 * Rear port closer than the manufacturer minimum (or 0.2 m default, 🟡) → caution.
 * Speakers with a wall-distance DSP setting → remind to match it to the chosen distance.
 */
export const G07: RuleDef = {
  id: 'G07',
  level: 'guideline',
  concern: 'speaker',
  scope: 'placement',
  sources: ['manufacturer', 'TOOLE'],
  variants: ['tooClose', 'ok', 'unknownPort', 'matchSetting'],
  evaluate(ctx, placement) {
    const s = ctx.speaker;
    const clearance = Math.min(
      rearClearance(placement.speakers.left, s),
      rearClearance(placement.speakers.right, s),
    );
    const findings: Finding[] = [];
    if (s.portLocation === 'rear') {
      const params = {
        clearance,
        minimum: s.minRearClearance,
        minimumSource: s.minRearClearanceFromManufacturer ? 'manufacturer' : 'default',
      };
      findings.push(
        clearance < s.minRearClearance
          ? makeFinding(G07, 'tooClose', 'caution', params)
          : makeFinding(G07, 'ok', 'ok', params),
      );
    } else if (s.portLocation === 'unknown' && s.enclosure !== 'sealed') {
      findings.push(makeFinding(G07, 'unknownPort', 'info'));
    }
    if (s.hasWallSetting) {
      findings.push(makeFinding(G07, 'matchSetting', 'info', { clearance }));
    }
    return findings;
  },
};
