import type { AnalysisContext } from './context';
import { surfaceDataConfidence } from './presets/surfaces';
import { firstReflections, isNearSide } from './rules/P06-reflections';
import type { Certainty, ConfidenceReport, OutputId, Project } from './types';

/**
 * Confidence model (docs/SCORING.md §6): how much to trust the results given what the user told
 * us. Not a measure of how good the room is.
 */

const FACTOR: Record<Certainty, number> = { measured: 1, estimated: 0.6, unknown: 0.2 };

/** Categorical answers (e.g. wall construction) count as fully known once given. */
const categorical = (known: boolean) => (known ? 1 : FACTOR.unknown);

interface InputSpec {
  path: string;
  factor: number;
  uses: Partial<Record<OutputId, number>>;
}

const OUTPUT_WEIGHT: Record<OutputId, number> = {
  bass: 3,
  geometry: 2,
  reflections: 2,
  roomCharacter: 1,
  speakerAdvice: 1,
};

function inputs(project: Project): InputSpec[] {
  const { room, speaker, surfaces } = project;
  const variant =
    project.variants.find((v) => v.id === project.activeVariantId) ?? project.variants[0];
  const speakerCertainty = variant?.speakers.left.certainty ?? 'estimated';
  const listenerCertainty = variant?.listener.certainty ?? 'unknown';
  const boundaries = Object.values(surfaces.baseCertainty);
  // Surface presets are estimates by nature: at best 0.6.
  const surfaceFactor =
    boundaries.reduce((sum, c) => sum + (c === 'unknown' ? FACTOR.unknown : FACTOR.estimated), 0) /
    Math.max(1, boundaries.length);
  const busyness = variant?.busyness?.certainty ?? 'unknown';
  const furnishingFactor =
    variant && (variant.objects.length > 0 || busyness !== 'unknown')
      ? FACTOR.estimated
      : FACTOR.unknown;

  return [
    {
      path: 'room.width',
      factor: FACTOR[room.width.certainty],
      uses: { bass: 3, roomCharacter: 1 },
    },
    {
      path: 'room.length',
      factor: FACTOR[room.length.certainty],
      uses: { bass: 3, roomCharacter: 1 },
    },
    {
      path: 'room.height',
      factor: FACTOR[room.height.certainty],
      uses: { bass: 3, roomCharacter: 1 },
    },
    {
      path: 'room.construction',
      factor: categorical(room.construction !== 'unknown'),
      uses: { bass: 2 },
    },
    {
      path: 'speakers.position',
      factor: FACTOR[speakerCertainty],
      uses: { bass: 2, reflections: 2, geometry: 3 },
    },
    {
      path: 'listener.position',
      factor: FACTOR[listenerCertainty],
      uses: { bass: 2, reflections: 2, geometry: 3 },
    },
    {
      path: 'surfaces',
      factor: surfaceFactor,
      uses: { bass: 1, reflections: 3, roomCharacter: 3 },
    },
    { path: 'furnishing', factor: furnishingFactor, uses: { roomCharacter: 2 } },
    {
      path: 'speaker.lowFrequencyMinus6dB',
      factor: FACTOR[speaker.lowFrequencyMinus6dB.certainty],
      uses: { bass: 1 },
    },
    {
      path: 'speaker.directivity',
      factor: FACTOR[speaker.directivity.qMid.certainty],
      uses: { reflections: 1 },
    },
    {
      path: 'speaker.portLocation',
      factor: FACTOR[speaker.portLocation.certainty],
      uses: { speakerAdvice: 3 },
    },
    {
      path: 'speaker.enclosure',
      factor: FACTOR[speaker.enclosure.certainty],
      uses: { speakerAdvice: 2 },
    },
    {
      path: 'speaker.acousticAxisHeight',
      factor: FACTOR[speaker.acousticAxisHeight.certainty],
      uses: { speakerAdvice: 1 },
    },
    {
      path: 'speaker.driverLayout',
      factor: FACTOR[speaker.driverLayout.certainty],
      uses: { speakerAdvice: 1 },
    },
  ];
}

function perOutput(specs: InputSpec[]): Record<OutputId, number> {
  const result = {} as Record<OutputId, number>;
  for (const output of Object.keys(OUTPUT_WEIGHT) as OutputId[]) {
    let weighted = 0;
    let total = 0;
    for (const spec of specs) {
      const importance = spec.uses[output] ?? 0;
      weighted += importance * spec.factor;
      total += importance;
    }
    result[output] = total ? weighted / total : 0;
  }
  return result;
}

function overallOf(outputs: Record<OutputId, number>): number {
  let sum = 0;
  let total = 0;
  for (const [id, w] of Object.entries(OUTPUT_WEIGHT) as [OutputId, number][]) {
    sum += w * outputs[id];
    total += w;
  }
  return sum / total;
}

type Cap = ConfidenceReport['caps'][number];

function capsFor(project: Project, ctx: AnalysisContext | null): Cap[] {
  const caps: Cap[] = [];
  if (project.room.outOfModel.includes('non-rectangular')) {
    caps.push({ reason: 'nonRectangular', output: 'all', cap: 0.3 });
  } else if (project.room.outOfModel.length > 0) {
    caps.push({ reason: 'outOfModel', output: 'bass', cap: 0.5 });
  }
  if (project.room.construction === 'lightweight') {
    caps.push({ reason: 'lightweightWalls', output: 'bass', cap: 0.6 });
  }
  if (ctx) {
    const v = ctx.variant;
    const near = firstReflections(ctx, v.speakers, v.listener.ears).filter(isNearSide);
    if (near.some((r) => surfaceDataConfidence(r.surface) === 'low')) {
      caps.push({ reason: 'lowConfidenceSurface', output: 'reflections', cap: 0.7 });
    }
  }
  return caps;
}

function applyCaps(outputs: Record<OutputId, number>, caps: Cap[]): Record<OutputId, number> {
  const capped = { ...outputs };
  for (const cap of caps) {
    const targets = cap.output === 'all' ? (Object.keys(capped) as OutputId[]) : [cap.output];
    for (const t of targets) capped[t] = Math.min(capped[t], cap.cap);
  }
  return capped;
}

export function confidence(project: Project, ctx: AnalysisContext | null): ConfidenceReport {
  const specs = inputs(project);
  const caps = capsFor(project, ctx);
  const outputs = applyCaps(perOutput(specs), caps);
  const overall = overallOf(outputs);

  // Next best input: the one whose improvement to "measured" raises the overall most.
  let nextBestInput: ConfidenceReport['nextBestInput'];
  for (const spec of specs) {
    if (spec.factor >= 1) continue;
    const improved = specs.map((s) => (s === spec ? { ...s, factor: 1 } : s));
    const gain = overallOf(applyCaps(perOutput(improved), caps)) - overall;
    if (gain > 0.005 && (!nextBestInput || gain > nextBestInput.gain)) {
      nextBestInput = { path: spec.path, gain };
    }
  }
  return { overall, perOutput: outputs, caps, ...(nextBestInput ? { nextBestInput } : {}) };
}

/** Five-step wording for the meter (UI_SPEC): never a percentage. */
export function confidenceStep(overall: number): 1 | 2 | 3 | 4 | 5 {
  if (overall < 0.3) return 1;
  if (overall < 0.45) return 2;
  if (overall < 0.6) return 3;
  if (overall < 0.75) return 4;
  return 5;
}
