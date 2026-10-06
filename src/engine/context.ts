import { BUSYNESS_ABSORPTION_PER_M2 } from './presets/furnishing';
import type { Box } from './math/geometry';
import { DEFAULTS } from './presets/defaults';
import { roomModes } from './rules/P02-room-modes';
import { speedOfSound } from './rules/P01-speed-of-sound';
import { schroederFrequency } from './rules/P07-schroeder';
import { reverberation, type ReverbResult } from './rules/P08-reverberation';
import type {
  DriverLayout,
  EnclosureType,
  Goals,
  Known,
  Mode,
  Placement,
  PortLocation,
  Project,
  SetupVariant,
  SpeakerPlacement,
  Vec3,
} from './types';

export interface RoomGeometry {
  W: number;
  L: number;
  H: number;
  V: number;
  S: number;
}

export interface ResolvedSpeaker {
  width: number;
  height: number;
  depth: number;
  axisHeight: number;
  wooferHeight: number;
  f6: number;
  omniBelowHz: number;
  qMid: number;
  enclosure: EnclosureType;
  portLocation: PortLocation;
  driverLayout: DriverLayout;
  minRearClearance: number;
  minRearClearanceFromManufacturer: boolean;
  designedForCorner: boolean;
  hasWallSetting: boolean;
  hasTrebleControl: boolean;
  verified: boolean;
}

export interface AnalysisContext {
  project: Project;
  room: RoomGeometry;
  c: number;
  speaker: ResolvedSpeaker;
  variant: SetupVariant;
  t60: ReverbResult;
  schroeder: { value: number; low: number; high: number };
  /** Modes up to `modeLimitHz`, sorted by frequency (excludes the 0 Hz term). */
  modes: Mode[];
  modeLimitHz: number;
  /** Upper frequency for the low-frequency model and scoring. */
  bassMaxHz: number;
  goals: Goals;
}

export function valueOr<T>(known: Known<T> | undefined, fallback: T): T {
  return known && known.value !== null && known.certainty !== 'unknown' ? known.value : fallback;
}

export function resolveSpeaker(project: Project): ResolvedSpeaker {
  const p = project.speaker;
  const portLocation = valueOr(p.portLocation, 'unknown');
  const manufacturerMin =
    p.minWallDistance && p.minWallDistance.value !== null ? p.minWallDistance.value : null;
  return {
    width: valueOr(p.dimensions.w, DEFAULTS.speakerWidth),
    height: valueOr(p.dimensions.h, DEFAULTS.speakerHeight),
    depth: valueOr(p.dimensions.d, DEFAULTS.speakerDepth),
    axisHeight: valueOr(p.acousticAxisHeight, DEFAULTS.acousticAxisHeight),
    wooferHeight: valueOr(p.wooferCentreHeight, DEFAULTS.wooferCentreHeight),
    f6: valueOr(p.lowFrequencyMinus6dB, DEFAULTS.lowFrequencyMinus6dB),
    omniBelowHz: valueOr(p.directivity.omniBelowHz, DEFAULTS.omniBelowHz),
    qMid: valueOr(p.directivity.qMid, DEFAULTS.qMid),
    enclosure: valueOr(p.enclosure, 'unknown'),
    portLocation,
    driverLayout: valueOr(p.driverLayout, 'unknown'),
    minRearClearance: manufacturerMin ?? DEFAULTS.rearPortMinClearance,
    minRearClearanceFromManufacturer: manufacturerMin !== null,
    designedForCorner: p.designedForCorner ?? false,
    hasWallSetting: Boolean(p.dsp.wallDistanceSetting),
    hasTrebleControl: Boolean(p.dsp.treble),
    verified: p.provenance.verified,
  };
}

/**
 * Furnishing absorption range (m² sabins, mid bands): the "how full" estimate ("some" when not
 * given), scaled with the floor area.
 */
export function furnishingAbsorption(variant: SetupVariant, floorArea: number): [number, number] {
  const [lo, hi] = BUSYNESS_ABSORPTION_PER_M2[variant.busyness?.value ?? 'some'];
  return [lo * floorArea, hi * floorArea];
}

export function activeVariant(project: Project): SetupVariant {
  const variant =
    project.variants.find((v) => v.id === project.activeVariantId) ?? project.variants[0];
  if (!variant) throw new Error('Project has no setup variants');
  return variant;
}

/**
 * Returns null when the room size is unknown: nothing meaningful can be computed without it.
 */
export function buildContext(
  project: Project,
  overrides: { W?: number; L?: number; H?: number; t60Scale?: number } = {},
): AnalysisContext | null {
  const { width, length, height } = project.room;
  if (width.value === null || length.value === null || height.value === null) return null;
  const W = overrides.W ?? width.value;
  const L = overrides.L ?? length.value;
  const H = overrides.H ?? height.value;
  const room: RoomGeometry = { W, L, H, V: W * L * H, S: 2 * (W * L + W * H + L * H) };

  const temperature = project.room.temperatureC;
  const c =
    temperature.value === null || temperature.certainty === 'unknown'
      ? DEFAULTS.speedOfSound
      : speedOfSound(temperature.value);

  const variant = activeVariant(project);
  // The furnishing does not change when the room-size perturbations (robustness runs) do.
  const t60 = reverberation(
    room,
    project.surfaces,
    furnishingAbsorption(variant, width.value * length.value),
    overrides.t60Scale,
  );
  const schroeder = {
    value: schroederFrequency(t60.mid, room.V),
    low: schroederFrequency(t60.low, room.V),
    high: schroederFrequency(t60.high, room.V),
  };
  const bassMaxHz = Math.max(120, Math.min(1.5 * schroeder.value, 300));
  const modeLimitHz = bassMaxHz * 1.5;

  return {
    project,
    room,
    c,
    speaker: resolveSpeaker(project),
    variant,
    t60,
    schroeder,
    modes: roomModes(room, c, modeLimitHz),
    modeLimitHz,
    bassMaxHz,
    goals: project.goals,
  };
}

// ── Speaker geometry helpers ──────────────────────────────────────────────

/** High-frequency acoustic centre: tweeter / coax centre, on the front baffle. */
export function acousticCentre(p: SpeakerPlacement, s: ResolvedSpeaker): Vec3 {
  return { x: p.base.x, y: p.base.y + s.depth / 2, z: p.base.z + s.axisHeight };
}

/** Low-frequency acoustic centre: woofer centre, on the front baffle. */
export function wooferCentre(p: SpeakerPlacement, s: ResolvedSpeaker): Vec3 {
  return { x: p.base.x, y: p.base.y + s.depth / 2, z: p.base.z + s.wooferHeight };
}

/** The cabinet as a box in the room (it faces +y). */
export function cabinetBox(p: SpeakerPlacement, ctx: AnalysisContext): Box {
  const { width, depth, height } = ctx.speaker;
  return {
    min: { x: p.base.x - width / 2, y: p.base.y - depth / 2, z: p.base.z },
    max: { x: p.base.x + width / 2, y: p.base.y + depth / 2, z: p.base.z + height },
  };
}

/** Distance from the rear panel to the front wall. */
export function rearClearance(p: SpeakerPlacement, s: ResolvedSpeaker): number {
  return p.base.y - s.depth / 2;
}

export function currentPlacement(ctx: AnalysisContext): Placement {
  return { speakers: ctx.variant.speakers, listener: ctx.variant.listener.ears };
}
