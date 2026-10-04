import type { Finding, SymptomId } from './types';

/**
 * 🟣 Subjective rules S01–S07 (RULE_CATALOGUE): symptom → hypotheses → experiment.
 * Subjective input never changes computed positions. Hypotheses whose physical precondition is
 * present in the findings (caution or red flag from the listed rules) rank first.
 */

interface Hypothesis {
  id: string;
  /** Rule IDs whose caution / red-flag findings support this hypothesis. */
  evidence: readonly string[];
}

const HYPOTHESES: Record<SymptomId, readonly Hypothesis[]> = {
  S01: [
    { id: 'backWallClose', evidence: ['G02'] },
    { id: 'cornerProximity', evidence: ['G06'] },
    { id: 'rearPortClose', evidence: ['G07'] },
    { id: 'predictedPeak', evidence: ['P09'] },
    { id: 'wallSettingOff', evidence: [] },
  ],
  S02: [
    { id: 'seatAtNull', evidence: ['G01', 'P09'] },
    { id: 'frontWallDip', evidence: ['P04'] },
    { id: 'noBoundaryGain', evidence: [] },
  ],
  S03: [
    { id: 'unequalDistance', evidence: ['G05'] },
    { id: 'asymmetry', evidence: ['G03'] },
    { id: 'earlyReflection', evidence: ['G09'] },
    { id: 'toeIn', evidence: [] },
    { id: 'earHeight', evidence: ['G08'] },
  ],
  S04: [
    { id: 'narrowAngle', evidence: ['G04'] },
    { id: 'absorbedSideWalls', evidence: [] },
    { id: 'tooMuchToeIn', evidence: [] },
  ],
  S05: [
    { id: 'hardReflections', evidence: ['G09'] },
    { id: 'liveRoom', evidence: ['P08', 'H06'] },
    { id: 'toeInBright', evidence: [] },
  ],
  S06: [
    { id: 'deadRoom', evidence: ['P08', 'H06'] },
    { id: 'earHeight', evidence: ['G08'] },
    { id: 'obstruction', evidence: ['G10'] },
  ],
  S07: [
    { id: 'unequalDistance', evidence: ['G05'] },
    { id: 'asymmetry', evidence: ['G03', 'G10'] },
  ],
};

export interface HypothesisResult {
  symptom: SymptomId;
  /** i18n: `hypothesis.<id>` and `experiment.<id>`. */
  id: string;
  supported: boolean;
}

function supports(finding: Finding, ruleIds: readonly string[]): boolean {
  if (!ruleIds.includes(finding.ruleId)) return false;
  if (finding.severity === 'caution' || finding.severity === 'red-flag') return true;
  // Room-character info findings support live/dead hypotheses.
  return finding.messageKey === 'finding.P08.live' || finding.messageKey === 'finding.P08.dead';
}

export function hypotheses(
  symptoms: readonly SymptomId[],
  findings: readonly Finding[],
): HypothesisResult[] {
  return symptoms.flatMap((symptom) =>
    HYPOTHESES[symptom]
      .map((h) => ({ symptom, id: h.id, supported: findings.some((f) => supports(f, h.evidence)) }))
      .sort((a, b) => Number(b.supported) - Number(a.supported)),
  );
}
