import type { DriverLayout, EnclosureType, PortLocation } from '../types';
import type { SpeakerKind } from '../presets/speakerKinds';

/**
 * The speaker list's entry format (docs/SPEAKER_DATA.md). Facts only: a number, where it came from
 * and when it was read. Never copied text, tables or pictures. Sizes stay in millimetres, as spec
 * sheets print them, so a value can be checked against its page; the app converts at its edge.
 *
 * Three tiers, from what the room model needs most and what spec sheets print most:
 * - A, required: size, cabinet (sealed, ported …), driver layout.
 * - B, when the maker states it: bass figure with its dB level, port position, minimum wall
 *   distance, a wall or position setting, tone controls, a corner design.
 * - C, rarely published: tweeter height (estimated by the app when missing).
 * Left out on purpose: dispersion, tweeter type, weight, power, sensitivity (placement does not
 * use them).
 */
export type Category = 'passive' | 'active' | 'all-in-one';
export type Status = 'current' | 'discontinued' | 'vintage';
/** Speakers the box model does not describe well: kept in the list, flagged, not pretended. */
export type Special = 'amt' | 'planar' | 'dipole' | 'horn';
/** The level the bass figure refers to; null when the source does not say. */
export type BassBasis = 3 | 6 | 10 | null;
/**
 * How a fact was read: from the text of a spec page or a manual (checked against a quote), or
 * from the maker's photos (only ever with a person's confirmation; no picture is kept).
 */
export type Via = 'spec-text' | 'manual' | 'photo-confirmed';

/** One fact with its source: the page it was read on, the day, and how. */
export interface Sourced<T> {
  value: T;
  url: string;
  /** ISO date (YYYY-MM-DD). */
  retrieved: string;
  via: Via;
}

export interface SizeMm {
  w: number;
  h: number;
  d: number;
}

export interface Bass {
  /** As printed. */
  hz: number;
  db: BassBasis;
  /** The figure changes with a setting (a wall or room mode, a bass extension switch). */
  dependsOnSetting?: boolean;
}

export interface SpeakerEntry {
  /** brand-model, lower case, a-z 0-9 and hyphens. */
  id: string;
  brand: string;
  model: string;
  /** Other names people type for it (a nickname, the name without "Mk II"); for the search. */
  aka?: string[];
  status: Status;
  category: Category;
  kind: SpeakerKind;
  special?: Special;
  // Tier A
  sizeMm: Sourced<SizeMm>;
  enclosure: Sourced<EnclosureType>;
  drivers: Sourced<DriverLayout>;
  // Tier B
  bass?: Sourced<Bass>;
  port?: Sourced<PortLocation>;
  /** The maker's minimum distance from the wall behind (rear panel), mm. */
  minWallMm?: Sourced<number>;
  /** A wall, desk or position setting (a switch or an app setting). */
  positionSetting?: Sourced<boolean>;
  controls?: Sourced<{ bass: boolean; treble: boolean }>;
  designedForCorner?: Sourced<boolean>;
  // Tier C
  /** Tweeter (or coaxial driver) centre above the cabinet's base, mm. */
  tweeterMm?: Sourced<number>;
}

/** What is believable for a speaker of each kind (mm, Hz): typos fail here, not in a room. */
export const LIMITS = {
  w: [60, 700],
  d: [80, 800],
  hz: [18, 150],
  minWallMm: [0, 1500],
  kinds: {
    bookshelf: { h: [120, 520], w: [80, 340] },
    monitor: { h: [150, 650], w: [90, 420] },
    desktop: { h: [100, 400], w: [60, 300] },
    floorstander: { h: [600, 1500], w: [120, 450] },
    wall: { h: [150, 900], w: [80, 450] },
  },
} as const satisfies {
  w: readonly [number, number];
  d: readonly [number, number];
  hz: readonly [number, number];
  minWallMm: readonly [number, number];
  kinds: Record<SpeakerKind, { h: readonly [number, number]; w: readonly [number, number] }>;
};

const inside = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;

/** Every fact an entry holds, for checks that apply to all of them. */
export function factsOf(e: SpeakerEntry): { url: string; retrieved: string; via: Via }[] {
  const all: ({ url: string; retrieved: string; via: Via } | undefined)[] = [
    e.sizeMm,
    e.enclosure,
    e.drivers,
    e.bass,
    e.port,
    e.minWallMm,
    e.positionSetting,
    e.controls,
    e.designedForCorner,
    e.tweeterMm,
  ];
  return all.filter((f) => f !== undefined);
}

/** Problems with a finished entry, as short sentences; empty when it is believable. */
export function validateEntry(e: SpeakerEntry): string[] {
  const out: string[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) out.push(`id "${e.id}" is not a slug`);
  const { w, h, d } = e.sizeMm.value;
  const k = LIMITS.kinds[e.kind];
  if (!inside(h, k.h)) out.push(`height ${h} mm is unusual for a ${e.kind}`);
  if (!inside(w, k.w)) out.push(`width ${w} mm is unusual for a ${e.kind}`);
  if (!inside(w, LIMITS.w) || !inside(d, LIMITS.d)) out.push(`size ${w}×${h}×${d} mm is unlikely`);
  if (e.bass && !inside(e.bass.value.hz, LIMITS.hz))
    out.push(`bass limit ${e.bass.value.hz} Hz is unlikely`);
  if (e.minWallMm && !inside(e.minWallMm.value, LIMITS.minWallMm))
    out.push(`minimum wall distance ${e.minWallMm.value} mm is unlikely`);
  if (e.tweeterMm && !(e.tweeterMm.value > 0 && e.tweeterMm.value < h))
    out.push('the tweeter must sit within the cabinet');
  if (e.enclosure.value === 'sealed' && e.port && !['none', 'unknown'].includes(e.port.value)) {
    out.push('a sealed cabinet has no port');
  }
  if (e.enclosure.value === 'ported' && e.port?.value === 'none') {
    out.push('a ported cabinet has a port');
  }
  for (const f of factsOf(e)) {
    if (!/^https:\/\//.test(f.url)) out.push('a source must be an https link');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.retrieved)) out.push('a source needs the date it was read');
  }
  return out;
}

/** "KEF" + "LS50 Meta" → "kef-ls50-meta". */
export function speakerId(brand: string, model: string): string {
  return `${brand} ${model}`
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
