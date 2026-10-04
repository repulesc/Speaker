import type { AnalysisContext } from '../context';
import type {
  Advice,
  Concern,
  EffectSize,
  EvidenceLevel,
  Finding,
  Placement,
  Vec3,
} from '../types';

/**
 * One advice rule (docs/RULE_CATALOGUE.md, "Treatment" and "Speaker settings"). It reads the
 * findings already computed for the setup instead of recomputing them.
 */
export interface AdviceRule {
  id: string;
  level: EvidenceLevel;
  concern: Concern;
  sources: readonly string[];
  variants: readonly string[];
  advise(ctx: AnalysisContext, placement: Placement, findings: readonly Finding[]): Advice[];
}

export function makeAdvice(
  rule: Pick<AdviceRule, 'id' | 'level' | 'concern' | 'sources'>,
  variant: string,
  details: {
    priority: number;
    effect: EffectSize;
    params?: Record<string, number | string>;
    location?: Vec3;
    level?: EvidenceLevel;
  },
): Advice {
  return {
    ruleId: rule.id,
    level: details.level ?? rule.level,
    concern: rule.concern,
    messageKey: `advice.${rule.id}.${variant}`,
    params: details.params ?? {},
    sources: rule.sources,
    priority: details.priority,
    effect: details.effect,
    ...(details.location ? { location: details.location } : {}),
  };
}

/** The finding with this message key, if the setup produced it. */
export const findingFor = (findings: readonly Finding[], key: string) =>
  findings.find((f) => f.messageKey === `finding.${key}`);
