import type { AnalysisContext } from '../context';
import type { EvidenceLevel, Finding, Placement, Severity, Vec3 } from '../types';

/**
 * One rule from docs/RULE_CATALOGUE.md. `variants` lists every message variant the rule can
 * emit, so the i18n files can be checked for completeness.
 */
export interface RuleDef {
  id: string;
  level: EvidenceLevel;
  sources: readonly string[];
  variants: readonly string[];
  evaluate(ctx: AnalysisContext, placement: Placement): Finding[];
}

interface FindingExtras {
  assumptions?: readonly string[];
  location?: Vec3;
  overlayY?: number[];
}

export function makeFinding(
  rule: Pick<RuleDef, 'id' | 'level' | 'sources'>,
  variant: string,
  severity: Severity,
  params: Record<string, number | string> = {},
  extras: FindingExtras = {},
): Finding {
  return {
    ruleId: rule.id,
    level: rule.level,
    severity,
    messageKey: `finding.${rule.id}.${variant}`,
    params,
    sources: rule.sources,
    assumptions: extras.assumptions ?? [],
    ...(extras.location ? { location: extras.location } : {}),
    ...(extras.overlayY ? { overlayY: extras.overlayY } : {}),
  };
}

/** Shared assumption keys (i18n: `assumption.<key>`). */
export const ASSUMPTION = {
  rigidRectangular: 'assumption.rigidRectangular',
  pointSource: 'assumption.pointSource',
  uniformDamping: 'assumption.uniformDamping',
  diffuseField: 'assumption.diffuseField',
  specular: 'assumption.specular',
  freeFieldSingleBoundary: 'assumption.freeFieldSingleBoundary',
} as const;
