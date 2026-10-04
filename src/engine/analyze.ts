import { topActions } from './actions';
import { confidence } from './confidence';
import { buildContext, currentPlacement } from './context';
import { RULES } from './rules';
import { bassCurve } from './rules/P09-bass-response';
import { advice } from './advice';
import { folkComparison } from './folk';
import { fragility, resizedRooms } from './scoring/fragility';
import { seatLayers, speakerHeatmap } from './scoring/heatmaps';
import { findCandidates, makeScorer, robustScores, toCandidate } from './scoring/search';
import type { Analysis, Candidate, EvidenceLevel, Finding, Severity } from './types';
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
  const rooms = resizedRooms(scorer);
  const withFragility = <T extends Candidate>(c: T): T => ({
    ...c,
    fragility: fragility(scorer, rooms, c),
  });
  const [currentRobust] = robustScores(scorer, [placement], seed);
  const current = withFragility(toCandidate(scorer, placement, currentRobust!));
  const candidates = findCandidates(scorer, seed).map(withFragility);
  const best = candidates[0];

  const curve = bassCurve(ctx, placement);
  // The maps keep the speakers (seat map) or the seat (speaker map) where they are now, so the
  // map, the probe (explainPoint) and the rules of thumb all describe the same situation.
  const layers = seatLayers(scorer, placement.speakers, placement.listener.z);
  const { x0, y0, step, nx, ny } = layers;

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
    bassBand: { range: curve.range, scored: curve.scored },
    findings,
    topActions: topActions(findings, current, best),
    current,
    candidates,
    layers,
    advice: advice(ctx, placement, findings),
    folk: folkComparison(layers, ctx.room.L, placement.listener.x),
    heatmap: {
      listener: { x0, y0, step, nx, ny, values: layers.values.goals },
      speakers: speakerHeatmap(scorer, placement.listener),
    },
    confidence: confidence(project, ctx),
  };
}
