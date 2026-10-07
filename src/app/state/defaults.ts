import { DEFAULTS } from '../../engine/presets/defaults';
import { speakerValues, type SpeakerChoices } from '../../engine/presets/speakerKinds';
import type {
  BoundaryId,
  Certainty,
  Known,
  Project,
  SetupVariant,
  SpeakerProfile,
} from '../../engine/types';
import { DEFAULT_BASE } from './surfaces';
import { newId } from './ids';

/** How far suggested speaker moves may go, by default (metres around each speaker). */
export const DEFAULT_SPEAKER_ZONE = 0.5;

const BOUNDARIES: BoundaryId[] = ['front', 'back', 'left', 'right', 'floor', 'ceiling'];

const estimated = <T>(value: T): Known<T> => ({ value, certainty: 'estimated' });
const unknownValue = <T>(): Known<T> => ({ value: null, certainty: 'unknown' });

/**
 * A speaker profile with the typical values for the answers given (all estimates); no answers is
 * the generic speaker. The answers are kept, so the speaker questions show them again.
 */
export function speakerFromChoices(choices: SpeakerChoices = {}): SpeakerProfile {
  const t = speakerValues(choices);
  return {
    id: newId(),
    brand: '',
    model: '',
    dimensions: { w: estimated(t.w), h: estimated(t.h), d: estimated(t.d) },
    enclosure: estimated(t.enclosure),
    portLocation: estimated(t.portLocation),
    driverLayout: estimated(t.driverLayout),
    acousticAxisHeight: estimated(t.acousticAxisHeight),
    wooferCentreHeight: estimated(t.wooferCentreHeight),
    lowFrequencyMinus6dB: estimated(t.lowFrequencyMinus6dB),
    directivity: { omniBelowHz: estimated(t.omniBelowHz), qMid: estimated(t.qMid) },
    dsp: {},
    ...(Object.keys(choices).length ? { choices: { ...choices } } : {}),
    manufacturerNotes: [],
    provenance: { sources: [{ kind: 'user', title: 'generic type estimate' }], verified: false },
  };
}

/**
 * The first guess (docs/ROADMAP_V10.md §2), until the user drags things where they really are:
 * the seat at 38 % of the room's length (H01, a folk rule that keeps clear of the first two length
 * resonances' nulls, P03) and the speakers and seat in an equilateral triangle (±30°, [ITU775]).
 */
export const FIRST_GUESS = {
  /** The ears' distance from the front wall, as a share of the length. */
  seatShare: 0.38,
  /** Rear panel to the front wall (m). */
  rearGap: 0.5,
  /** Each speaker's centre to its side wall, at least (m). */
  sideClearance: 0.6,
  /** The narrowest pair the guess proposes (m). */
  minSpacing: 1.0,
  /** The ears to the back wall, at least (m). */
  backClearance: 0.5,
} as const;

/**
 * Where a first-time project's speakers and seat go. The triangle is measured from the front
 * baffles (where the tweeters are). When the room cannot hold both rules, the triangle wins: the
 * spacing stays within what the width allows and the seat moves with it.
 */
export function defaultPlacement(room: { W: number; L: number }, speaker: SpeakerProfile) {
  const depth = speaker.dimensions.d.value ?? DEFAULTS.speakerDepth;
  const axis = speaker.acousticAxisHeight.value ?? DEFAULTS.acousticAxisHeight;
  const earZ = DEFAULTS.earHeight;
  const g = FIRST_GUESS;
  const y = g.rearGap + depth / 2;
  const baffle = y + depth / 2;
  const height = Math.sin(Math.PI / 3); // the triangle's height per metre of spacing
  const widest = Math.max(0.3, room.W - 2 * g.sideClearance);
  const spacing = Math.min(
    widest,
    Math.max(g.minSpacing, (g.seatShare * room.L - baffle) / height),
  );
  const listenerY = Math.max(
    baffle + 0.3,
    Math.min(baffle + spacing * height, room.L - g.backClearance),
  );
  const standZ = Math.max(0, earZ - axis);
  const speakerAt = (x: number) => ({
    base: { x, y, z: standZ },
    toeInDeg: 0,
    certainty: 'unknown' as Certainty,
  });
  return {
    left: speakerAt(room.W / 2 - spacing / 2),
    right: speakerAt(room.W / 2 + spacing / 2),
    ears: { x: room.W / 2, y: listenerY, z: earZ },
  };
}

/**
 * Re-places the speakers and seat while the user has not placed them yet (certainty 'unknown'),
 * so the drawing follows the room size as it is typed. Placed items are never touched.
 */
export function applyDefaultPlacement(project: Project): void {
  const { width, length } = project.room;
  const variant = project.variants.find((v) => v.id === project.activeVariantId);
  if (!variant || width.value === null || length.value === null) return;
  const placed = defaultPlacement({ W: width.value, L: length.value }, project.speaker);
  if ((variant.speakers.left.certainty ?? 'estimated') === 'unknown') {
    variant.speakers.left = placed.left;
    variant.speakers.right = placed.right;
  }
  if (variant.listener.certainty === 'unknown') {
    variant.listener = { ...variant.listener, ears: placed.ears, certainty: 'unknown' };
  }
}

function emptyVariant(speaker: SpeakerProfile): SetupVariant {
  // Placeholder positions for a 4 × 5 m room; replaced as soon as the room size is known.
  const placed = defaultPlacement({ W: 4, L: 5 }, speaker);
  return {
    id: newId(),
    name: '',
    speakers: { left: placed.left, right: placed.right },
    listener: { ears: placed.ears, certainty: 'unknown' },
    busyness: unknownValue(),
  };
}

/** `name` is empty for an untitled project; the UI shows a localised label instead. */
export function createDefaultProject(options: {
  name: string;
  system: 'metric' | 'imperial';
  now?: string;
}): Project {
  const now = options.now ?? new Date().toISOString();
  const speaker = speakerFromChoices();
  const variant = emptyVariant(speaker);
  return {
    schemaVersion: 1,
    id: newId(),
    name: options.name,
    createdAt: now,
    updatedAt: now,
    units: options.system,
    room: {
      width: unknownValue(),
      length: unknownValue(),
      height: unknownValue(),
      temperatureC: unknownValue(),
      outOfModel: [],
    },
    surfaces: {
      base: { ...DEFAULT_BASE },
      baseCertainty: Object.fromEntries(BOUNDARIES.map((b) => [b, 'unknown'])) as Record<
        BoundaryId,
        Certainty
      >,
    },
    speaker,
    constraints: {
      speakerWall: 'front',
      maxSpeakerDistanceFromWall: estimated(DEFAULTS.maxSpeakerDistanceFromWall),
      // Speakers only by default: most people have a fixed seat (owner, docs/DESIGN_BRIEF_V4.md).
      listenerFixed: true,
      speakersFixed: false,
      keepSymmetric: true,
      // Suggestions stay within 50 cm of where the speakers stand (once placed): most people
      // cannot move them far (owner decision, docs/DESIGN_BRIEF_V4.md).
      speakerZone: DEFAULT_SPEAKER_ZONE,
    },
    goals: { weights: {} },
    variants: [variant],
    activeVariantId: variant.id,
  };
}
