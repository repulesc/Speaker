import { DEFAULTS } from './defaults';
import type { DriverLayout, EnclosureType, PortLocation } from '../types';

/**
 * The speaker questions (docs/ROADMAP_V7.md, Phase 2): a few dropdowns instead of picture cards.
 * Each answer only sets what the engine really uses (cabinet size, tweeter and woofer heights, how
 * low the bass goes, sealed or ported and where the port is, coaxial or not, the base height), so
 * nothing is asked that does not change the result. "Not sure" keeps a generic speaker.
 *
 * Every number here is a typical value for the category (🟡 estimate, not from a source, never
 * a brand or model): the speaker form marks them all as 'estimated', and the exact numbers stay
 * editable under "More details" for anyone who has the manual.
 */
export type SpeakerKind = 'bookshelf' | 'floorstander' | 'monitor' | 'desktop' | 'wall';
export type SpeakerSize = 'small' | 'medium' | 'large';
export type DriverChoice = 'two-way' | 'three-way' | 'coaxial';
export type PortChoice = 'sealed' | 'front' | 'rear' | 'down' | 'side';
export type PlacedOn = 'floor' | 'stand' | 'desk';

export interface SpeakerChoices {
  kind?: SpeakerKind;
  size?: SpeakerSize;
  drivers?: DriverChoice;
  port?: PortChoice;
  placedOn?: PlacedOn;
}

export const SPEAKER_KINDS: readonly SpeakerKind[] = [
  'bookshelf',
  'floorstander',
  'monitor',
  'desktop',
  'wall',
];
export const SPEAKER_SIZES: readonly SpeakerSize[] = ['small', 'medium', 'large'];
export const DRIVER_CHOICES: readonly DriverChoice[] = ['two-way', 'three-way', 'coaxial'];
export const PORT_CHOICES: readonly PortChoice[] = ['sealed', 'front', 'rear', 'down', 'side'];
export const PLACED_ON: readonly PlacedOn[] = ['floor', 'stand', 'desk'];

/** Cabinet width, height, depth (m) and the −6 dB bass point (Hz), per kind and size. */
type Box = { w: number; h: number; d: number; f6: number };

interface KindPreset {
  sizes: Record<SpeakerSize, Box>;
  drivers: DriverChoice;
  port: PortChoice;
  placedOn: PlacedOn;
  /** Below this frequency the speaker radiates about equally in all directions (Hz). */
  omniBelowHz: number;
  /** Typical directivity factor in the midrange (P10). */
  qMid: number;
}

/** Typical values per kind (🟡). The medium bookshelf is the generic speaker used when unsure. */
export const KIND_PRESETS: Record<SpeakerKind, KindPreset> = {
  bookshelf: {
    sizes: {
      small: { w: 0.15, h: 0.25, d: 0.2, f6: 60 },
      medium: { w: 0.17, h: 0.28, d: 0.22, f6: 50 },
      large: { w: 0.22, h: 0.38, d: 0.3, f6: 42 },
    },
    drivers: 'two-way',
    port: 'rear',
    placedOn: 'stand',
    omniBelowHz: 300,
    qMid: 2,
  },
  floorstander: {
    sizes: {
      small: { w: 0.17, h: 0.85, d: 0.25, f6: 42 },
      medium: { w: 0.2, h: 1.0, d: 0.3, f6: 35 },
      large: { w: 0.25, h: 1.15, d: 0.38, f6: 30 },
    },
    drivers: 'three-way',
    port: 'front',
    placedOn: 'floor',
    omniBelowHz: 250,
    qMid: 3,
  },
  monitor: {
    sizes: {
      small: { w: 0.15, h: 0.24, d: 0.19, f6: 55 },
      medium: { w: 0.19, h: 0.3, d: 0.25, f6: 45 },
      large: { w: 0.25, h: 0.4, d: 0.33, f6: 38 },
    },
    drivers: 'two-way',
    port: 'rear',
    placedOn: 'stand',
    omniBelowHz: 300,
    qMid: 2,
  },
  desktop: {
    sizes: {
      small: { w: 0.1, h: 0.16, d: 0.13, f6: 85 },
      medium: { w: 0.13, h: 0.21, d: 0.17, f6: 70 },
      large: { w: 0.16, h: 0.26, d: 0.21, f6: 60 },
    },
    drivers: 'two-way',
    port: 'rear',
    placedOn: 'desk',
    omniBelowHz: 400,
    qMid: 2,
  },
  wall: {
    sizes: {
      small: { w: 0.18, h: 0.28, d: 0.1, f6: 70 },
      medium: { w: 0.22, h: 0.38, d: 0.12, f6: 60 },
      large: { w: 0.26, h: 0.5, d: 0.14, f6: 50 },
    },
    drivers: 'two-way',
    port: 'front',
    placedOn: 'stand',
    omniBelowHz: 300,
    qMid: 2,
  },
};

/** When unsure of the kind: a medium bookshelf speaker (the app's generic speaker). */
export const GENERIC_KIND: SpeakerKind = 'bookshelf';
const GENERIC_SIZE: SpeakerSize = 'medium';

/** A desk top, typical height (m, 🟡). */
export const DESK_HEIGHT = 0.75;

export interface SpeakerValues {
  w: number;
  h: number;
  d: number;
  enclosure: EnclosureType;
  portLocation: PortLocation;
  driverLayout: DriverLayout;
  acousticAxisHeight: number;
  wooferCentreHeight: number;
  lowFrequencyMinus6dB: number;
  omniBelowHz: number;
  qMid: number;
}

/**
 * Where the tweeter (acoustic axis) and the woofer sit, from the cabinet height (🟡): a two-way
 * box has the tweeter near the top and the woofer below; a coaxial driver has both in one place; a
 * tall floorstander has the tweeter about ear height and the bass drivers low.
 */
function driverHeights(kind: SpeakerKind, drivers: DriverChoice, h: number) {
  const tall = kind === 'floorstander';
  if (drivers === 'coaxial') {
    const at = tall ? h - 0.15 : 0.6 * h;
    return { axis: at, woofer: at };
  }
  if (tall) return { axis: h - 0.1, woofer: drivers === 'three-way' ? 0.4 * h : h - 0.3 };
  return { axis: 0.75 * h, woofer: drivers === 'three-way' ? 0.3 * h : 0.4 * h };
}

const round = (x: number) => Math.round(x * 1000) / 1000;

/** The typical speaker for a set of answers; unanswered questions take the kind's typical value. */
export function speakerValues(choices: SpeakerChoices): SpeakerValues {
  const kind = choices.kind ?? GENERIC_KIND;
  const preset = KIND_PRESETS[kind];
  const box = preset.sizes[choices.size ?? GENERIC_SIZE];
  const drivers = choices.drivers ?? preset.drivers;
  const port = choices.port ?? preset.port;
  const { axis, woofer } = driverHeights(kind, drivers, box.h);
  return {
    w: box.w,
    h: box.h,
    d: box.d,
    enclosure: port === 'sealed' ? 'sealed' : 'ported',
    portLocation: port === 'sealed' ? 'none' : port,
    driverLayout: drivers,
    acousticAxisHeight: round(axis),
    wooferCentreHeight: round(woofer),
    // A sealed box rolls off more gently but starts higher; the category value is kept (🟡).
    lowFrequencyMinus6dB: box.f6,
    omniBelowHz: preset.omniBelowHz,
    qMid: preset.qMid,
  };
}

/** Where the speakers stand when the answer is not given: the kind's usual place. */
export function placedOnOf(choices: SpeakerChoices): PlacedOn {
  return choices.placedOn ?? KIND_PRESETS[choices.kind ?? GENERIC_KIND].placedOn;
}

/**
 * The base height for a place (m): on the floor 0; on a desk the desk top; on a stand (or on the
 * wall) high enough to put the tweeter at seated ear height, the usual advice (G08).
 */
export function baseHeight(
  placedOn: PlacedOn,
  acousticAxisHeight: number,
  earZ = DEFAULTS.earHeight,
) {
  if (placedOn === 'floor') return 0;
  if (placedOn === 'desk') return DESK_HEIGHT;
  return round(Math.max(0, earZ - acousticAxisHeight));
}
