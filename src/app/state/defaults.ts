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
import { DEFAULT_BASE } from '../plan/patches';
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

/** Where a first-time project's speakers and seat go until the user places them. */
export function defaultPlacement(room: { W: number; L: number }, speaker: SpeakerProfile) {
  const depth = speaker.dimensions.d.value ?? DEFAULTS.speakerDepth;
  const axis = speaker.acousticAxisHeight.value ?? DEFAULTS.acousticAxisHeight;
  const earZ = DEFAULTS.earHeight;
  const half = Math.max(0.5, Math.min(1.0, room.W / 2 - 0.6));
  const y = 0.5 + depth / 2;
  // Equilateral triangle: listening distance equals the speaker spacing.
  const listenerY = Math.min(y + 2 * half * Math.sin(Math.PI / 3), room.L - 0.4);
  const standZ = Math.max(0, earZ - axis);
  const speakerAt = (x: number) => ({
    base: { x, y, z: standZ },
    toeInDeg: 0,
    certainty: 'unknown' as Certainty,
  });
  return {
    left: speakerAt(room.W / 2 - half),
    right: speakerAt(room.W / 2 + half),
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
    objects: [],
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
      construction: 'unknown',
      temperatureC: unknownValue(),
      outOfModel: [],
    },
    surfaces: {
      base: { ...DEFAULT_BASE },
      baseCertainty: Object.fromEntries(BOUNDARIES.map((b) => [b, 'unknown'])) as Record<
        BoundaryId,
        Certainty
      >,
      patches: [],
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
    notes: [],
  };
}
