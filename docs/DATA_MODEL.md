# Data Model (v1)

Status: implemented in M1. **`src/engine/types.ts` is now the source of truth**; this document explains the design. The engine imports nothing from the app.

Changes made while implementing (M1):
- `Surfaces.baseCertainty`: whether each base material was chosen by the user or is a default (drives confidence).
- `SetupVariant.busyness`: the Quick-mode "busy-ness" shortcut, used when no objects are placed.
- `Constraints.speakersFixed` alongside `listenerFixed`.
- `SpeakerPlacement.certainty` (optional, default "estimated").
- `Project.speaker` holds the profile itself (no model database in v1).
- `Project.name` is empty for an untitled project; the UI shows a localised label (M2). The same holds for `SetupVariant.name` ("Current").
- **Speaker files (M3):** `{ "kind": "speaker-profile", "schemaVersion": 1, "speaker": SpeakerProfile }`, saved as `<brand model>.speaker-profile.json`. A loaded profile always gets a fresh `id`. Validated with the same schema as the project's speaker.
- **Placement certainty (M3):** `SpeakerPlacement.certainty` / `Listener.certainty` of `'unknown'` means "default position, not placed by the user": such items follow the room size. Dragging sets `'estimated'`; typed values keep `'measured'`.
- `Directivity` keeps only `omniBelowHz` and `qMid` in v1; measured polar data is deferred.
- `SurfacePatch` (u, v) are room coordinates along the boundary's axes: front/back walls (x, z); left/right walls (y, z); floor/ceiling (x, y).
- `Analysis` is a union: `status: 'needs-room-size'` (only confidence) or `status: 'ok'` (everything). `topActions` are `Action`s: fix a red flag, move to a candidate, or change a speaker setting.

## Principles

- **Canonical units:** metres, seconds, hertz, degrees (angles), °C. No imperial values are ever stored.
- **Every user-provided value carries its certainty** (`Known<T>`). This feeds the confidence meter.
- **Plain, serialisable data only:** no classes, no functions, no `Date` objects (ISO strings). Saved state = shared state = exported file.
- **Versioned:** every persisted document has `schemaVersion`. Migrations are pure functions `vN → vN+1`, each with a test.
- **Coordinates** follow the rule catalogue: origin at floor, front-left corner. `x` across width `W`, `y` along length `L` (away from the front wall), `z` up.

## Core types

```ts
/** How sure the user is about a value. */
export type Certainty = 'measured' | 'estimated' | 'unknown';

/** A user-provided value plus its certainty. `value` is null only when certainty is 'unknown'. */
export interface Known<T> {
  value: T | null;
  certainty: Certainty;
}

export type Metres = number;
export type Hertz = number;
export type Degrees = number;

export interface Vec2 { x: Metres; y: Metres }
export interface Vec3 { x: Metres; y: Metres; z: Metres }
```

## Room

```ts
export type WallId = 'front' | 'back' | 'left' | 'right';
export type BoundaryId = WallId | 'floor' | 'ceiling';

export type ConstructionType = 'solid' | 'lightweight' | 'unknown';
// 'lightweight' = drywall / stud walls → bass-model confidence reduced (RULE P02 limits).

export interface Room {
  width: Known<Metres>;   // W, x-axis
  length: Known<Metres>;  // L, y-axis
  height: Known<Metres>;  // H, z-axis
  construction: ConstructionType;
  temperatureC: Known<number>;          // default 20 °C when unknown (P01)
  /** Things the v1 model cannot represent. Each lowers confidence and is listed in "what we don't model". */
  outOfModel: OutOfModelFeature[];
}

export type OutOfModelFeature =
  | 'open-doorway'
  | 'open-plan-connection'
  | 'alcove'
  | 'slanted-ceiling'
  | 'non-rectangular';
```

## Surfaces

Each boundary is divided into **patches**: rectangles on that boundary's own 2-D plane. A wall with nothing specified is one patch with the wall's base material.

```ts
export type SurfacePresetId =
  | 'plaster-concrete' | 'plaster-brick' | 'gypsum-stud' | 'glass'
  | 'wood-floor' | 'carpet-heavy' | 'carpet-underlay' | 'curtain-heavy'
  | 'shelf-diffusive' | 'canvas-art' | 'custom';

export type SurfaceClass = 'reflective' | 'absorptive' | 'diffusive';

/** Octave bands 125, 250, 500, 1k, 2k, 4k Hz. */
export type BandValues = [number, number, number, number, number, number];

export interface SurfacePreset {
  id: SurfacePresetId;
  absorption: BandValues;      // from RULE_CATALOGUE Appendix A
  class: SurfaceClass;
  dataConfidence: 'medium' | 'low';
  source: string;              // reference key, e.g. 'EVP'
}

export interface SurfacePatch {
  id: string;
  boundary: BoundaryId;
  /** Rectangle in the boundary's local plane (u, v), metres from that boundary's lower-left as seen from inside the room. */
  u: Metres; v: Metres; width: Metres; height: Metres;
  preset: SurfacePresetId;
  customAbsorption?: BandValues;  // only when preset === 'custom'
  label?: string;                 // user text, e.g. "CD wall"
}

export interface Surfaces {
  base: Record<BoundaryId, SurfacePresetId>;
  patches: SurfacePatch[];
}
```

## Objects (furniture, equipment)

```ts
export type ObjectKind =
  | 'bed' | 'sofa' | 'armchair' | 'table' | 'cabinet' | 'shelf'
  | 'radiator' | 'other-speaker' | 'tv' | 'desk' | 'custom';

export interface RoomObject {
  id: string;
  kind: ObjectKind;
  /** Axis-aligned box in v1 (rotation: 0 or 90 degrees only). */
  position: Vec3;  // min corner
  size: Vec3;      // width (x), depth (y), height (z)
  rotated90: boolean;
  /** Absorption area range in m² sabins at mid bands; defaults from preset by kind. */
  absorptionRange?: [number, number];
  /** Hard objects act as reflectors / obstructions (G10). Defaults by kind. */
  hard: boolean;
  label?: string;
}
```

## Speakers

```ts
export type EnclosureType = 'sealed' | 'ported' | 'passive-radiator' | 'open-baffle' | 'unknown';
export type PortLocation = 'front' | 'rear' | 'down' | 'side' | 'none' | 'unknown';
export type DriverLayout = 'coaxial' | 'two-way' | 'three-way' | 'full-range' | 'other' | 'unknown';

export interface Directivity {
  /** Frequency below which the speaker radiates roughly omnidirectionally. */
  omniBelowHz: Known<Hertz>;
  /** Directivity factor Q at mid frequencies (P10). */
  qMid: Known<number>;
  /** Optional measured horizontal data: angle → deviation (dB) per band, from a cited source. */
  horizontal?: { angleDeg: Degrees; dB: BandValues }[];
  vertical?: { angleDeg: Degrees; dB: BandValues }[];
  source?: SourceRef;
}

export interface DspControls {
  treble?: { minDb: number; maxDb: number; stepDb: number };
  bass?: { minDb: number; maxDb: number; stepDb: number };
  /** Placement compensation presets offered by the manufacturer, verbatim names. */
  placementModes?: string[];          // e.g. ['stand', 'desk']
  wallDistanceSetting?: boolean;      // e.g. "distance from wall" control
  roomCharacterSetting?: boolean;     // e.g. "room size / acoustic character"
  subOut?: boolean;
}

export interface SourceRef {
  kind: 'manufacturer' | 'measurement' | 'review' | 'user';
  title: string;
  url?: string;
  retrieved?: string;   // ISO date
}

export interface SpeakerProfile {
  id: string;                         // e.g. 'kef-lsx-ii-lt'
  brand: string;
  model: string;
  dimensions: { w: Known<Metres>; h: Known<Metres>; d: Known<Metres> };
  enclosure: Known<EnclosureType>;
  portLocation: Known<PortLocation>;
  driverLayout: Known<DriverLayout>;
  /** Height of acoustic axis (tweeter / coax centre) above the speaker's base. */
  acousticAxisHeight: Known<Metres>;
  /** Height of woofer centre above base (LF acoustic centre). Equals axis height for coaxials. */
  wooferCentreHeight: Known<Metres>;
  lowFrequencyMinus6dB: Known<Hertz>;
  sensitivityDb?: Known<number>;      // passive speakers
  amplifierWatts?: Known<number>;     // active speakers
  directivity: Directivity;
  dsp: DspControls;
  minWallDistance?: Known<Metres>;    // manufacturer minimum, rear panel to wall (G07)
  designedForCorner?: boolean;        // G06 exception
  /** Manufacturer placement claims, quoted, each with a source. Shown as 🟠 manufacturer guidance. */
  manufacturerNotes: { text: string; source: SourceRef }[];
  /** Database entries only. Every field set from a source must be traceable. */
  provenance: {
    sources: SourceRef[];
    verified: boolean;                // true only after a human checked the sources
    lastReviewed?: string;
  };
}
```

## Placement and listener

```ts
export interface SpeakerPlacement {
  /** Position of the speaker's base, centre of the footprint. */
  base: Vec3;                         // z = stand / desk height
  toeInDeg: Degrees;                  // 0 = facing straight down the room; positive = towards centre
}

export interface Listener {
  /** Ear position (midpoint between ears). */
  ears: Vec3;
  certainty: Certainty;
}

/** Practical constraints: real rooms aren't empty labs. */
export interface Constraints {
  speakerWall: WallId;                         // v1: 'front' (speakers along the wall at y = 0 side); other walls = rotate the room in UI
  maxSpeakerDistanceFromWall: Known<Metres>;   // how far into the room speakers may come
  listenerYRange?: [Metres, Metres];           // e.g. sofa can move only within this band
  listenerFixed: boolean;                      // seat cannot move at all
  keepSymmetric: boolean;                      // default true
}
```

## Goals and subjective feedback

```ts
export type GoalId = 'wide-stage' | 'precise-imaging' | 'flat-response' | 'deep-bass' | 'low-volume-listening';

export interface Goals {
  /** 0 = don't care, 1 = nice to have, 2 = important. */
  weights: Partial<Record<GoalId, 0 | 1 | 2>>;
}

export type SymptomId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07';

export interface ListeningNote {
  id: string;
  createdAt: string;                  // ISO
  variantId: string;
  symptoms: SymptomId[];
  rating?: 1 | 2 | 3 | 4 | 5;
  listenedHours?: number;             // subjective notes after < 1 h are flagged as "early impression"
  text?: string;
  experimentId?: string;              // links a rating to an experiment step
}
```

## Project, variants and persisted document

```ts
export interface SetupVariant {
  id: string;
  name: string;                       // "Bed moved", "Speakers 20 cm out"
  speakers: { left: SpeakerPlacement; right: SpeakerPlacement };
  listener: Listener;
  objects: RoomObject[];              // objects can differ between variants
}

export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  units: 'metric' | 'imperial';       // display preference only
  room: Room;
  surfaces: Surfaces;
  speaker: { profileId: string | null; custom?: SpeakerProfile };
  constraints: Constraints;
  goals: Goals;
  variants: SetupVariant[];
  activeVariantId: string;
  notes: ListeningNote[];
}
```

## Engine output

```ts
export type EvidenceLevel = 'physics' | 'guideline' | 'heuristic' | 'subjective';
export type Severity = 'ok' | 'info' | 'caution' | 'red-flag';

export interface Finding {
  ruleId: string;                     // e.g. 'G01'
  level: EvidenceLevel;
  severity: Severity;
  messageKey: string;                 // i18n key; never raw text from the engine
  params: Record<string, number | string>;  // values in SI; the UI formats units
  sources: string[];                  // reference keys
  assumptions: string[];              // i18n keys of model assumptions in play
  location?: Vec3;                    // for drawing (e.g. reflection point)
}

export interface Mode { f: Hertz; n: [number, number, number]; type: 'axial' | 'tangential' | 'oblique' }

export interface Candidate {
  speakers: { left: SpeakerPlacement; right: SpeakerPlacement };
  listener: Vec3;
  score: number;                      // 0..1 robust score (SCORING.md)
  scoreSpread: number;                // uncertainty from perturbation runs
  breakdown: { componentId: string; value: number; weight: number }[];
}

export interface Analysis {
  engineVersion: string;
  c: number;
  modes: Mode[];
  schroederHz: { value: Hertz; low: Hertz; high: Hertz };
  t60: { bands: BandValues; mid: number; low: number; high: number; method: 'sabine' | 'eyring' };
  bassResponse: { f: Hertz[]; dB: number[] };   // for the current variant
  findings: Finding[];                // sorted: red-flag, caution, info; then by level
  topActions: Finding[];              // "do this first", max 3
  candidates: Candidate[];            // top distinct candidates (≤ 5)
  heatmap: { listener: Grid; speakers: Grid };
  confidence: ConfidenceReport;
}

export interface Grid { x0: Metres; y0: Metres; step: Metres; nx: number; ny: number; values: number[] }

export interface ConfidenceReport {
  overall: number;                    // 0..1
  perOutput: Record<string, number>;  // e.g. { bass: 0.7, reflections: 0.4 }
  nextBestInput?: { path: string; gain: number };  // "Tell us X to firm this up"
  caps: { reason: string; cap: number }[];         // e.g. lightweight walls, out-of-model features
}
```

## Persistence and sharing

- **Autosave:** `localStorage` key `spa:project:<id>` (JSON). List of projects at `spa:index`. All access is wrapped in try/catch; the app must work (unsaved) without storage.
- **Export / import:** the same `Project` JSON, file name `<name>.speaker.json`. Import validates with a hand-written schema guard (no dependency needed for this size), runs migrations, and rejects unknown `schemaVersion` greater than supported with a clear message.
- **Share link:** `#p=<base64url(deflate-raw(JSON))>` using the browser's native `CompressionStream`. The hash fragment is never sent to the server, so it stays private. Listening notes are **excluded** from share links by default (opt-in checkbox).
- **Speaker profiles:** user-entered, stored with the project and exportable as `<name>.speaker-profile.json`. Generic type presets live in `src/engine/presets/speakerTypes.ts`, and all their values are `estimated`. No model database in v1.
