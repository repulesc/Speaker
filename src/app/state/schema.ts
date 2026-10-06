import {
  DRIVER_CHOICES,
  PLACED_ON,
  PORT_CHOICES,
  SPEAKER_KINDS,
  SPEAKER_SIZES,
} from '../../engine/presets/speakerKinds';
import { ASPECT_ANSWERS } from '../../engine/listening/check';
import { SURFACE_PRESETS } from '../../engine/presets/surfaces';
import { ROOM_LIMITS, SIZE_LIMITS } from './limits';
import {
  arr,
  bool,
  distinctIds,
  known,
  num,
  obj,
  oneOf,
  optional,
  range,
  record,
  str,
  vec3,
  type Check,
} from './validate';

/**
 * Validator for `Project` schema version 1 (src/engine/types.ts, docs/DATA_MODEL.md). Fields that
 * older versions wrote and V9 no longer uses (furniture, wall patches, notes…) are unknown keys:
 * ignored here and removed by `tidy` (tidy.ts).
 */

const BOUNDARIES = ['front', 'back', 'left', 'right', 'floor', 'ceiling'] as const;
const PRESETS = [...Object.keys(SURFACE_PRESETS), 'custom'] as const;
const CERTAINTY = ['measured', 'estimated', 'unknown'] as const;
const GOALS = [
  'wide-stage',
  'precise-imaging',
  'flat-response',
  'deep-bass',
  'low-volume-listening',
];
const text = str(SIZE_LIMITS.text);

const placement = obj({
  base: vec3,
  toeInDeg: num(-90, 90),
  certainty: optional(oneOf(CERTAINTY)),
});

const variant = obj({
  id: str(SIZE_LIMITS.name),
  name: str(SIZE_LIMITS.name),
  speakers: obj({ left: placement, right: placement }),
  listener: obj({
    ears: vec3,
    certainty: oneOf(CERTAINTY),
    area: optional(oneOf(['sofa', 'desk', 'bed'])),
  }),
  busyness: optional(known(oneOf(['bare', 'some', 'busy', 'very-busy']))),
});

/** A tone control's range, e.g. −3…+3 dB in 0.5 dB steps. */
const trim: Check = (v, p) => {
  const error = obj({ minDb: num(-24, 0), maxDb: num(0, 24), stepDb: num(0.01, 12) })(v, p);
  if (error) return error;
  const { minDb, maxDb } = v as { minDb: number; maxDb: number };
  return minDb < maxDb ? null : `${p}: expected a range from low to high`;
};

export const speakerSchema: Check = obj({
  id: str(SIZE_LIMITS.name),
  brand: str(SIZE_LIMITS.name),
  model: str(SIZE_LIMITS.name),
  dimensions: obj({ w: known(num(0.02, 3)), h: known(num(0.02, 3)), d: known(num(0.02, 3)) }),
  enclosure: known(oneOf(['sealed', 'ported', 'passive-radiator', 'open-baffle', 'unknown'])),
  portLocation: known(oneOf(['front', 'rear', 'down', 'side', 'none', 'unknown'])),
  driverLayout: known(oneOf(['coaxial', 'two-way', 'three-way', 'full-range', 'other', 'unknown'])),
  acousticAxisHeight: known(num(0, 3)),
  wooferCentreHeight: known(num(0, 3)),
  lowFrequencyMinus6dB: known(num(10, 500)),
  directivity: obj({ omniBelowHz: known(num(20, 2000)), qMid: known(num(1, 30)) }),
  dsp: obj({
    treble: optional(trim),
    bass: optional(trim),
    placementModes: optional(arr(str(SIZE_LIMITS.name), 10)),
    wallDistanceSetting: optional(bool),
    roomCharacterSetting: optional(bool),
    subOut: optional(bool),
  }),
  minWallDistance: optional(known(num(0, 3))),
  designedForCorner: optional(bool),
  choices: optional(
    obj({
      kind: optional(oneOf(SPEAKER_KINDS)),
      size: optional(oneOf(SPEAKER_SIZES)),
      drivers: optional(oneOf(DRIVER_CHOICES)),
      port: optional(oneOf(PORT_CHOICES)),
      placedOn: optional(oneOf(PLACED_ON)),
    }),
  ),
  manufacturerNotes: arr(
    obj({
      text,
      source: obj({ kind: oneOf(['manufacturer', 'measurement', 'review', 'user']), title: text }),
    }),
    50,
  ),
  provenance: obj({ sources: arr(obj({ title: text }), 50), verified: bool }),
});

export const projectSchema: Check = obj({
  schemaVersion: oneOf([1]),
  id: str(SIZE_LIMITS.name),
  name: str(SIZE_LIMITS.name),
  createdAt: str(40),
  updatedAt: str(40),
  units: oneOf(['metric', 'imperial']),
  room: obj({
    width: known(num(ROOM_LIMITS.width.min, ROOM_LIMITS.width.max)),
    length: known(num(ROOM_LIMITS.length.min, ROOM_LIMITS.length.max)),
    height: known(num(ROOM_LIMITS.height.min, ROOM_LIMITS.height.max)),
    temperatureC: known(num(-20, 50)),
    outOfModel: arr(
      oneOf([
        'open-doorway',
        'open-plan-connection',
        'alcove',
        'slanted-ceiling',
        'non-rectangular',
      ]),
      5,
    ),
  }),
  surfaces: obj({
    base: record(oneOf(PRESETS), BOUNDARIES, { complete: true }),
    baseCertainty: record(oneOf(CERTAINTY), BOUNDARIES, { complete: true }),
  }),
  speaker: speakerSchema,
  constraints: obj({
    speakerWall: oneOf(['front']),
    maxSpeakerDistanceFromWall: known(num(0, 10)),
    listenerYRange: optional(range(num(0, 100))),
    listenerFixed: bool,
    speakersFixed: bool,
    keepSymmetric: bool,
    listeningDistance: optional(oneOf(['room', 'near'])),
    speakerZone: optional(num(0.05, 10)),
    treatmentReady: optional(bool),
  }),
  goals: obj({ weights: record(oneOf([0, 1, 2]), GOALS) }),
  variants: distinctIds(arr(variant, SIZE_LIMITS.variants, 1)),
  activeVariantId: str(SIZE_LIMITS.name),
  listening: optional(
    obj({
      answers: obj({
        bass: optional(oneOf(ASPECT_ANSWERS.bass)),
        evenness: optional(oneOf(ASPECT_ANSWERS.evenness)),
        centre: optional(oneOf(ASPECT_ANSWERS.centre)),
        width: optional(oneOf(ASPECT_ANSWERS.width)),
        treble: optional(oneOf(ASPECT_ANSWERS.treble)),
        clarity: optional(oneOf(ASPECT_ANSWERS.clarity)),
      }),
      at: str(40),
      tries: arr(
        obj({
          id: str(SIZE_LIMITS.name),
          experiment: str(SIZE_LIMITS.name),
          at: str(40),
          by: optional(num(0, 100)),
          degrees: optional(bool),
          before: optional(
            obj({ speakers: obj({ left: placement, right: placement }), listener: vec3 }),
          ),
          result: optional(oneOf(['better', 'same', 'worse'])),
        }),
        SIZE_LIMITS.tries,
      ),
    }),
  ),
});
