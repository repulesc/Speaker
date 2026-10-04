import { topActions } from './actions';
import { confidence } from './confidence';
import { buildContext, currentPlacement } from './context';
import { RULES } from './rules';
import { bassCurve } from './rules/P09-bass-response';
import {
  findCandidates,
  listenerHeatmap,
  makeScorer,
  robustScores,
  speakerHeatmap,
  toCandidate,
} from './scoring/search';
import type { Analysis, EvidenceLevel, Finding, Severity } from './types';
import { ENGINE_VERSION } from './version';

const SEVERITY_ORDER: Record<Severity, number> = { 'red-flag': 0, caution: 1, info: 2, ok: 3 };
const LEVEL_ORDER: Record<EvidenceLevel, number> = {
  physics: 0,
  guideline: 1,
  heuristic: 2,
  subjective: 3,
};

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level],
  );
}

export interface AnalyzeOptions {
  /** Seed for the robustness perturbations; same seed → identical analysis. */
  seed?: number;
}

/** Full analysis of the project's active setup variant. Pure and deterministic. */
export function analyze(
  project: Parameters<typeof buildContext>[0],
  options: AnalyzeOptions = {},
): Analysis {
  const seed = options.seed ?? 1;
  const ctx = buildContext(project);
  if (!ctx) {
    return {
      status: 'needs-room-size',
      engineVersion: ENGINE_VERSION,
      confidence: confidence(project, null),
    };
  }

  const placement = currentPlacement(ctx);
  const findings = sortFindings(RULES.flatMap((rule) => rule.evaluate(ctx, placement)));

  const scorer = makeScorer(ctx);
  const [currentRobust] = robustScores(scorer, [placement], seed);
  const current = toCandidate(scorer, placement, currentRobust!);
  const candidates = findCandidates(scorer, seed);
  const best = candidates[0];

  const curve = bassCurve(ctx, placement);
  const heatmapPlacement = best ?? current;

  return {
    status: 'ok',
    engineVersion: ENGINE_VERSION,
    c: ctx.c,
    modes: ctx.modes,
    schroederHz: ctx.schroeder,
    t60: {
      bands: ctx.t60.bands,
      mid: ctx.t60.mid,
      low: ctx.t60.low,
      high: ctx.t60.high,
      method: ctx.t60.method,
    },
    bassResponse: { f: Array.from(curve.freqs), dB: Array.from(curve.db) },
    findings,
    topActions: topActions(findings, current, best),
    current,
    candidates,
    heatmap: {
      listener: listenerHeatmap(scorer, heatmapPlacement.speakers, placement.listener.z),
      speakers: speakerHeatmap(scorer, heatmapPlacement.listener),
    },
    confidence: confidence(project, ctx),
  };
}
