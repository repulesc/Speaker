import {
  DRIVER_CHOICES,
  MADE_FOR,
  PLACED_ON,
  PORT_CHOICES,
  SPEAKER_KINDS,
  SPEAKER_SIZES,
  SPREADS,
} from '../../engine/presets/speakerKinds';
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
  tuple,
  vec3,
  type Check,
} from './validate';

/** Validator for `Project` schema version 1 (src/engine/types.ts, docs/DATA_MODEL.md). */

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
const OBJECT_KINDS = [
  'bed',
  'sofa',
  'armchair',
  'table',
  'cabinet',
  'shelf',
  'radiator',
  'other-speaker',
  'tv',
  'desk',
  'wardrobe',
  'bookcase',
  'piano',
  'rack',
  'plant',
  'fireplace',
  'lamp',
  'subwoofer',
  'custom',
] as const;

const text = str(SIZE_LIMITS.text);
const bands: Check = tuple(num(0, 1), 6);

const placement = obj({
  base: vec3,
  toeInDeg: num(-90, 90),
  certainty: optional(oneOf(CERTAINTY)),
});

const object = obj({
  id: str(SIZE_LIMITS.name),
  kind: oneOf(OBJECT_KINDS),
  position: vec3,
  size: obj({ x: num(0, 50), y: num(0, 50), z: num(0, 50) }),
  absorptionRange: optional(range(num(0, 100))),
  material: optional(oneOf(['hard', 'soft', 'absorbent'])),
  hard: bool,
  label: optional(str(SIZE_LIMITS.name)),
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
  objects: distinctIds(arr(object, SIZE_LIMITS.objects)),
  busyness: optional(known(oneOf(['bare', 'some', 'busy', 'very-busy']))),
});

const patch = obj({
  id: str(SIZE_LIMITS.name),
  boundary: oneOf(BOUNDARIES),
  u: num(-100, 100),
  v: num(-100, 100),
  width: num(0, 100),
  height: num(0, 100),
  preset: oneOf(PRESETS),
  customAbsorption: optional(bands),
  label: optional(str(SIZE_LIMITS.name)),
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
      madeFor: optional(oneOf(MADE_FOR)),
      spread: optional(oneOf(SPREADS)),
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
    construction: oneOf(['solid', 'lightweight', 'unknown']),
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
    patches: distinctIds(arr(patch, SIZE_LIMITS.patches)),
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
  notes: distinctIds(
    arr(
      obj({
        id: str(SIZE_LIMITS.name),
        createdAt: str(40),
        variantId: str(SIZE_LIMITS.name),
        symptoms: arr(oneOf(['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07']), 7),
        rating: optional(oneOf([1, 2, 3, 4, 5])),
        listenedHours: optional(num(0, 10_000)),
        text: optional(text),
        experimentId: optional(str(SIZE_LIMITS.name)),
        setupKey: optional(str(SIZE_LIMITS.name)),
      }),
      SIZE_LIMITS.notes,
    ),
  ),
});
