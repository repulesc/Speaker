import type { DriverLayout, EnclosureType, PortLocation } from '../types';
import type { SpeakerKind } from '../presets/speakerKinds';

/**
 * The speaker list's entry format (docs/SPEAKER_DATA.md). Facts only: a number, where it came from
 * and when it was read. Never copied text, tables or pictures. Sizes stay in millimetres, as spec
 * sheets print them, so a value can be checked against its page; the app converts at its edge.
 */
export type Category = 'passive' | 'active' | 'all-in-one';
export type Status = 'current' | 'discontinued' | 'vintage';
export type Tweeter =
  'dome' | 'dome-waveguide' | 'ribbon' | 'amt' | 'horn' | 'coaxial' | 'planar' | 'other';
/** Speakers the box model does not describe well: kept in the list, flagged, not pretended. */
export type Special = 'amt' | 'planar' | 'dipole' | 'horn';
/** The level the bass limit refers to; null when the source does not say. */
export type BassBasis = 3 | 6 | 10 | null;

/** One fact with its source: the page it was read on, and the day. */
export interface Sourced<T> {
  value: T;
  url: string;
  /** ISO date (YYYY-MM-DD). */
  retrieved: string;
}

export interface SizeMm {
  w: number;
  h: number;
  d: number;
}

export interface SpeakerEntry {
  /** brand-model, lower case, a-z 0-9 and hyphens. */
  id: string;
  brand: string;
  model: string;
  status: Status;
  category: Category;
  kind: SpeakerKind;
  special?: Special;
  sizeMm: Sourced<SizeMm>;
  enclosure: Sourced<EnclosureType>;
  port: Sourced<PortLocation>;
  drivers: Sourced<DriverLayout>;
  tweeter?: Sourced<Tweeter>;
  bass?: Sourced<{ hz: number; db: BassBasis }>;
}

/** What is believable for a speaker of each kind (mm, Hz): typos fail here, not in a room. */
export const LIMITS = {
  w: [80, 700],
  d: [80, 800],
  hz: [18, 150],
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
  kinds: Record<SpeakerKind, { h: readonly [number, number]; w: readonly [number, number] }>;
};

const inside = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;

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
  if (e.enclosure.value === 'sealed' && !['none', 'unknown'].includes(e.port.value)) {
    out.push('a sealed cabinet has no port');
  }
  if (e.enclosure.value === 'ported' && e.port.value === 'none') {
    out.push('a ported cabinet has a port');
  }
  for (const f of [e.sizeMm, e.enclosure, e.port, e.drivers, e.tweeter, e.bass]) {
    if (!f) continue;
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
