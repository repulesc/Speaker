import type { AnalysisContext } from '../context';
import type { Advice, Finding, Placement } from '../types';
import { C01 } from './C01-desk-reflection';
import { C02 } from './C02-below-the-boom';
import { C03 } from './C03-bed';
import { D01 } from './D01-wall-setting';
import { D02 } from './D02-bass-trim';
import { D03 } from './D03-treble-trim';
import { D04 } from './D04-speaker-height';
import { D05 } from './D05-port-clearance';
import { D06 } from './D06-placement-mode';
import { D07 } from './D07-tone-if-any';
import type { AdviceRule } from './rule';
import { T01 } from './T01-side-reflections';
import { T02 } from './T02-floor-ceiling';
import { T03 } from './T03-front-wall-dip';
import { T04 } from './T04-bass-traps';
import { T05 } from './T05-room-character';
import { T06 } from './T06-behind-the-seat';

/** Treatment advisor (T) and speaker settings (D), docs/RULE_CATALOGUE.md. */
export const TREATMENT_RULES: readonly AdviceRule[] = [T01, T02, T03, T04, T05, T06];
/**
 * Speaker settings (D) and the contextual tips (C, V7): they speak only for a specific situation
 * (a desk, a bed, small speakers in a long room), never as tips for everyone.
 */
export const SETTINGS_RULES: readonly AdviceRule[] = [
  D01,
  D02,
  D03,
  D04,
  D05,
  D06,
  D07,
  C01,
  C02,
  C03,
];

function run(
  rules: readonly AdviceRule[],
  ctx: AnalysisContext,
  placement: Placement,
  findings: readonly Finding[],
): Advice[] {
  return rules
    .flatMap((rule) => rule.advise(ctx, placement, findings))
    .sort((a, b) => b.priority - a.priority);
}

/** Most useful first: the first item answers "if you can only do one thing". */
export function advice(ctx: AnalysisContext, placement: Placement, findings: readonly Finding[]) {
  return {
    treatment: run(TREATMENT_RULES, ctx, placement, findings),
    settings: run(SETTINGS_RULES, ctx, placement, findings),
  };
}

/** Every i18n key advice can use, for translation completeness checks. */
export function adviceMessageKeys(): string[] {
  return [...TREATMENT_RULES, ...SETTINGS_RULES].flatMap((r) =>
    r.variants.map((v) => `advice.${r.id}.${v}`),
  );
}
