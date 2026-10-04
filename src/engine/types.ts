/**
 * Engine data types. Mirrors docs/DATA_MODEL.md; keep both in sync.
 * All values are SI: metres, hertz, seconds, degrees, °C.
 * Coordinates: origin at floor, front-left corner. x across the width (W),
 * y along the length (L) away from the front (speaker) wall, z up (H).
 */

export type Certainty = 'measured' | 'estimated' | 'unknown';

/** A user-provided value plus its certainty. `value` is null only when certainty is 'unknown'. */
export interface Known<T> {
  value: T | null;
  certainty: Certainty;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Room ──────────────────────────────────────────────────────────────────

export type WallId = 'front' | 'back' | 'left' | 'right';
export type BoundaryId = WallId | 'floor' | 'ceiling';
export type ConstructionType = 'solid' | 'lightweight' | 'unknown';
export type OutOfModelFeature =
  'open-doorway' | 'open-plan-connection' | 'alcove' | 'slanted-ceiling' | 'non-rectangular';

export interface Room {
  width: Known<number>;
  length: Known<number>;
  height: Known<number>;
  construction: ConstructionType;
  temperatureC: Known<number>;
  outOfModel: OutOfModelFeature[];
}

// ── Surfaces ──────────────────────────────────────────────────────────────

export type SurfacePresetId =
  | 'plaster-concrete'
  | 'plaster-brick'
  | 'gypsum-stud'
  | 'glass'
  | 'wood-floor'
  | 'carpet-heavy'
  | 'carpet-underlay'
  | 'curtain-heavy'
  | 'shelf-diffusive'
  | 'canvas-art'
  | 'custom';

export type SurfaceClass = 'reflective' | 'absorptive' | 'diffusive';

/** Octave bands 125, 250, 500, 1k, 2k, 4k Hz. */
export type BandValues = [number, number, number, number, number, number];

/**
 * A rectangle on a boundary. (u, v) are room coordinates along the boundary's axes:
 * front/back walls → (x, z); left/right walls → (y, z); floor/ceiling → (x, y).
 */
export interface SurfacePatch {
  id: string;
  boundary: BoundaryId;
  u: number;
  v: number;
  width: number;
  height: number;
  preset: SurfacePresetId;
  customAbsorption?: BandValues;
  label?: string;
}

export interface Surfaces {
  base: Record<BoundaryId, SurfacePresetId>;
  /** Base surfaces the user did not choose explicitly (defaults in use). */
  baseCertainty: Record<BoundaryId, Certainty>;
  patches: SurfacePatch[];
}

// ── Objects ───────────────────────────────────────────────────────────────

export type ObjectKind =
  | 'bed'
  | 'sofa'
  | 'armchair'
  | 'table'
  | 'cabinet'
  | 'shelf'
  | 'radiator'
  | 'other-speaker'
  | 'tv'
  | 'desk'
  | 'wardrobe'
  | 'bookcase'
  | 'piano'
  | 'rack'
  | 'plant'
  | 'fireplace'
  | 'lamp'
  | 'subwoofer'
  | 'custom';

/** What an object is made of, as far as sound goes: how much sound it takes up. */
export type ObjectMaterial = 'hard' | 'soft' | 'absorbent';

/** Axis-aligned box. `position` is the min corner; `size` is the extent along x, y, z. */
export interface RoomObject {
  id: string;
  kind: ObjectKind;
  position: Vec3;
  size: Vec3;
  /** Absorption area range (m² sabins, mid bands). Defaults by kind when absent. */
  absorptionRange?: [number, number];
  /** The user's choice of material; when set, the absorption follows from the object's surface. */
  material?: ObjectMaterial;
  hard: boolean;
  label?: string;
}

/** How full the room is: a shortcut for the furniture, as absorption per m² of floor. */
export type Busyness = 'bare' | 'some' | 'busy' | 'very-busy';

// ── Speakers ──────────────────────────────────────────────────────────────

export type EnclosureType = 'sealed' | 'ported' | 'passive-radiator' | 'open-baffle' | 'unknown';
export type PortLocation = 'front' | 'rear' | 'down' | 'side' | 'none' | 'unknown';
export type DriverLayout = 'coaxial' | 'two-way' | 'three-way' | 'full-range' | 'other' | 'unknown';

export interface SourceRef {
  kind: 'manufacturer' | 'measurement' | 'review' | 'user';
  title: string;
  url?: string;
  retrieved?: string;
}

export interface DspControls {
  treble?: { minDb: number; maxDb: number; stepDb: number };
  bass?: { minDb: number; maxDb: number; stepDb: number };
  placementModes?: string[];
  wallDistanceSetting?: boolean;
  roomCharacterSetting?: boolean;
  subOut?: boolean;
}

export interface SpeakerProfile {
  id: string;
  brand: string;
  model: string;
  /** Cabinet width (x), height (z), depth (y when facing straight into the room). */
  dimensions: { w: Known<number>; h: Known<number>; d: Known<number> };
  enclosure: Known<EnclosureType>;
  portLocation: Known<PortLocation>;
  driverLayout: Known<DriverLayout>;
  /** Height of the acoustic axis (tweeter / coax centre) above the speaker's base. */
  acousticAxisHeight: Known<number>;
  /** Height of the woofer centre above the base (LF acoustic centre). */
  wooferCentreHeight: Known<number>;
  lowFrequencyMinus6dB: Known<number>;
  directivity: {
    omniBelowHz: Known<number>;
    qMid: Known<number>;
  };
  dsp: DspControls;
  /** Manufacturer minimum distance, rear panel to wall (G07). */
  minWallDistance?: Known<number>;
  designedForCorner?: boolean;
  manufacturerNotes: { text: string; source: SourceRef }[];
  provenance: { sources: SourceRef[]; verified: boolean; lastReviewed?: string };
}

// ── Placement, listener, constraints, goals ───────────────────────────────

export interface SpeakerPlacement {
  /** Centre of the cabinet footprint on the floor plan; z = height of the cabinet's base. */
  base: Vec3;
  /** 0 = facing straight down the room; positive = turned towards the room centreline. */
  toeInDeg: number;
  /** How the position was given. Defaults to 'estimated' (dragged on the plan). */
  certainty?: Certainty;
}

export interface Listener {
  /** Midpoint between the ears. */
  ears: Vec3;
  certainty: Certainty;
}

export interface Constraints {
  /** v1: always 'front'. The UI rotates the room so the speaker wall is the front wall. */
  speakerWall: 'front';
  /** How far the rear panel may come from the front wall. */
  maxSpeakerDistanceFromWall: Known<number>;
  /** Allowed band for the listener's y position. */
  listenerYRange?: [number, number];
  listenerFixed: boolean;
  speakersFixed: boolean;
  keepSymmetric: boolean;
}

export type GoalId =
  'wide-stage' | 'precise-imaging' | 'flat-response' | 'deep-bass' | 'low-volume-listening';

export type GoalWeight = 0 | 1 | 2;

export interface Goals {
  weights: Partial<Record<GoalId, GoalWeight>>;
}

export type SymptomId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07';

export interface ListeningNote {
  id: string;
  createdAt: string;
  variantId: string;
  symptoms: SymptomId[];
  rating?: 1 | 2 | 3 | 4 | 5;
  listenedHours?: number;
  text?: string;
  experimentId?: string;
}

// ── Project ───────────────────────────────────────────────────────────────

export interface SetupVariant {
  id: string;
  name: string;
  speakers: { left: SpeakerPlacement; right: SpeakerPlacement };
  listener: Listener;
  objects: RoomObject[];
  /** How full the room is; placed objects can raise this estimate, never lower it. */
  busyness?: Known<Busyness>;
}

export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  units: 'metric' | 'imperial';
  room: Room;
  surfaces: Surfaces;
  speaker: SpeakerProfile;
  constraints: Constraints;
  goals: Goals;
  variants: SetupVariant[];
  activeVariantId: string;
  notes: ListeningNote[];
}

// ── Engine output ─────────────────────────────────────────────────────────

export type EvidenceLevel = 'physics' | 'guideline' | 'heuristic' | 'subjective';

/** What a finding or piece of advice is about. The UI groups by it. */
export type Concern =
  'bass' | 'frontWall' | 'reflections' | 'stereo' | 'room' | 'speaker' | 'objects' | 'rulesOfThumb';
export type Severity = 'ok' | 'info' | 'caution' | 'red-flag';

export interface Finding {
  ruleId: string;
  level: EvidenceLevel;
  concern: Concern;
  severity: Severity;
  /** i18n key: `finding.<ruleId>.<variant>`. The engine never produces display text. */
  messageKey: string;
  /** Values in SI units; the UI formats them. */
  params: Record<string, number | string>;
  sources: readonly string[];
  /** i18n keys of the model assumptions in play. */
  assumptions: readonly string[];
  /** Geometry to highlight in the drawing. */
  location?: Vec3;
  /** Optional overlay lines (heuristics), as y positions on the plan. */
  overlayY?: number[];
}

export interface Mode {
  f: number;
  n: [number, number, number];
  type: 'axial' | 'tangential' | 'oblique';
}

export interface Placement {
  speakers: { left: SpeakerPlacement; right: SpeakerPlacement };
  listener: Vec3;
}

export interface ScoreBreakdownItem {
  componentId: ComponentId;
  value: number;
  weight: number;
}

export type ComponentId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8';

export interface Candidate extends Placement {
  /** Robust score 0..1 (docs/SCORING.md §4). */
  score: number;
  nominalScore: number;
  scoreSpread: number;
  breakdown: ScoreBreakdownItem[];
  fragility?: Fragility;
}

export interface Grid {
  x0: number;
  y0: number;
  step: number;
  nx: number;
  ny: number;
  /** Row-major (y outer, x inner). NaN = not allowed (constraint). */
  values: number[];
}

/** One heatmap per concern (docs/REVAMP_PLAN.md, "Layers"). */
export type LayerId =
  'overall' | 'goals' | 'bass' | 'nulls' | 'frontWall' | 'stereo' | 'symmetry' | 'backWall';

/** Seat heatmaps: the speakers stay where they are and the seat moves over the grid. */
export interface SeatLayers {
  x0: number;
  y0: number;
  step: number;
  nx: number;
  ny: number;
  /** Row-major (y outer, x inner), 0–1, NaN where the seat cannot go. */
  values: Record<LayerId, number[]>;
  /** True where the app red-flags the seat itself (room midpoint, back wall, stereo angle). */
  redFlag: boolean[];
}

export type FragilityLevel = 'steady' | 'sensitive' | 'fragile';

/** How much the score drops for small errors: positions ±5 cm, room size ±5 %. */
export interface Fragility {
  positionDrop: number;
  roomDrop: number;
  level: FragilityLevel;
}

/** A rule of thumb's seat line, compared with what the model says for this room. */
export interface FolkComparison {
  ruleId: 'H01' | 'H02';
  seatY: number;
  /** Seat score on that line (goal weights), or NaN where the seat cannot go. */
  score: number;
  bestY: number;
  bestScore: number;
  verdict: 'asGood' | 'close' | 'worse' | 'notAllowed';
  redFlag: boolean;
}

/** The sound pressure of one bass note over the floor (room-mode explorer). */
export interface ModeField {
  frequency: number;
  /** Level relative to the loudest cell (dB, ≤ 0, floored at −40), at ear height. */
  grid: Grid;
  /** Room modes within ±5 % of the frequency, the ones shaping the pattern most. */
  nearbyModes: Mode[];
}

/** Why a spot is good or poor: the probe (docs/REVAMP_PLAN.md, "Probe / why"). */
export interface PointExplanation {
  placement: Placement;
  /** Passes the hard constraints (docs/SCORING.md §1). */
  valid: boolean;
  /** The app would red-flag this spot itself. */
  redFlag: boolean;
  /** Goal-weighted score and the same without goals. */
  score: number;
  overall: number;
  breakdown: ScoreBreakdownItem[];
  /** Findings that depend on where things stand, red flags first. */
  findings: Finding[];
  /** Smoothed bass curve at this spot, normalised to its median (as `AnalysisOk.bassResponse`). */
  bassResponse: { f: number[]; dB: number[] };
}

export type EffectSize = 'small' | 'moderate' | 'large';

/**
 * One piece of treatment or speaker-settings advice (docs/RULE_CATALOGUE.md, T and D rules).
 * Like findings, display text comes from i18n: `advice.<ruleId>.<variant>`.
 */
export interface Advice {
  ruleId: string;
  level: EvidenceLevel;
  concern: Concern;
  messageKey: string;
  params: Record<string, number | string>;
  sources: readonly string[];
  /** Rough expected benefit, for ordering only (🟡). The first one is "if you can only do one thing". */
  priority: number;
  /** Direction is in the message; this is the rough size, never a promise. */
  effect: EffectSize;
  location?: Vec3;
}

export type OutputId = 'bass' | 'reflections' | 'geometry' | 'roomCharacter' | 'speakerAdvice';

export interface ConfidenceReport {
  overall: number;
  perOutput: Record<OutputId, number>;
  nextBestInput?: { path: string; gain: number };
  caps: { reason: string; output: OutputId | 'all'; cap: number }[];
}

export type Action =
  | { kind: 'fix'; finding: Finding }
  | { kind: 'move'; to: Candidate; gain: number }
  | { kind: 'setting'; finding: Finding };

interface AnalysisBase {
  engineVersion: string;
  confidence: ConfidenceReport;
}

/** Nothing can be computed until the room size is known. */
export interface AnalysisNeedsRoom extends AnalysisBase {
  status: 'needs-room-size';
}

export interface AnalysisOk extends AnalysisBase {
  status: 'ok';
  c: number;
  modes: Mode[];
  schroederHz: { value: number; low: number; high: number };
  t60: { bands: BandValues; mid: number; low: number; high: number; method: 'sabine' | 'eyring' };
  /** Smoothed relative response at the current seat, normalised to 0 dB median. */
  bassResponse: { f: number[]; dB: number[] };
  /** The frequency range the bass is judged over, and whether it is judged at all (P09). */
  bassBand: { range: [number, number]; scored: boolean };
  findings: Finding[];
  topActions: Action[];
  current: Candidate;
  candidates: Candidate[];
  /** Seat layers with the speakers where they are now. */
  layers: SeatLayers;
  /** Treatment (T rules) and speaker settings (D rules), most useful first. */
  advice: { treatment: Advice[]; settings: Advice[] };
  /** The 38 % rule and the rule of thirds against the seat map. */
  folk: FolkComparison[];
  /** Seat map (goal score, speakers as now) and speaker map (seat as now). */
  heatmap: { listener: Grid; speakers: Grid };
}

export type Analysis = AnalysisNeedsRoom | AnalysisOk;
