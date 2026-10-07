import type { DriverLayout, EnclosureType, PortLocation } from '../types';
import type { Bass, Category, SizeMm, Special, SpeakerEntry, Status, Via } from './entry.ts';
import { speakerId, validateEntry } from './entry.ts';
import type { SpeakerKind } from '../presets/speakerKinds';

/**
 * The quote checker (docs/SPEAKER_DATA.md). An AI (or a person) reads a spec page and proposes a
 * `Draft`: each value with the exact words it was read from. Nothing is trusted: the quote must
 * really be in the page, and the value must really be in the quote. What passes becomes an entry
 * with only the value and the link; the quote is used here and then dropped (no copied text kept).
 * A port position seen only on the maker's photos cannot be quote-checked: it is kept only when a
 * person confirmed it, and it says so (`via: 'photo-confirmed'`). Pure functions: the fetching and
 * the AI live outside the engine.
 */
export type DraftField<T> =
  { value: T; quote: string } | { value: T; seenOnPhotos: true; confirmedBy?: string };

export interface Draft {
  brand: string;
  model: string;
  status: Status;
  category: Category;
  kind: SpeakerKind;
  special?: Special;
  aka?: string[];
  /** The page every quote was read on, the day, and whether it is a spec page or a manual. */
  url: string;
  retrieved: string;
  source: Exclude<Via, 'photo-confirmed'>;
  sizeMm?: DraftField<SizeMm>;
  enclosure?: DraftField<EnclosureType>;
  drivers?: DraftField<DriverLayout>;
  bass?: DraftField<Bass>;
  port?: DraftField<PortLocation>;
  minWallMm?: DraftField<number>;
  positionSetting?: DraftField<boolean>;
  controls?: DraftField<{ bass: boolean; treble: boolean }>;
  designedForCorner?: DraftField<boolean>;
  tweeterMm?: DraftField<number>;
}

export interface Finding {
  field: string;
  reason: string;
}

export interface CheckResult {
  /** The entry, when every required field passed and the whole thing is believable. */
  entry: SpeakerEntry | null;
  /**
   * Fields (or the whole entry) that failed, with why. A failed required field means no entry; a
   * failed optional one is left out of it.
   */
  rejected: Finding[];
  /** Passed, but a person should look: something the quote does not settle. */
  review: Finding[];
}

/** Text as it is compared: one case, one kind of space, dash and quote, no soft hyphens. */
export function clean(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u00ad\u200b]/g, '')
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/×/g, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whether the quote really stands in the page (and is long enough to mean something). */
export function quoteIn(quote: string, page: string): boolean {
  const q = clean(quote);
  return q.length >= 6 && clean(page).includes(q);
}

/** Every number a text could mean, reading "1,5" and "1.5" as decimals and "1.200" as thousands. */
export function numbersIn(text: string): number[] {
  const out = new Set<number>();
  for (const m of clean(text).matchAll(/\d[\d.,]*/g)) {
    const t = m[0].replace(/[.,]+$/, '');
    if (/^\d+$/.test(t)) out.add(Number(t));
    else if (/^\d+[.,]\d+$/.test(t)) {
      out.add(Number(t.replace(',', '.')));
      if (/^\d{1,3}[.,]\d{3}$/.test(t)) out.add(Number(t.replace(/[.,]/, '')));
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) out.add(Number(t.replace(/,/g, '')));
    else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t))
      out.add(Number(t.replace(/\./g, '').replace(',', '.')));
    else if (/^\d{1,3}([ .,]\d{3})+$/.test(t)) out.add(Number(t.replace(/\D/g, '')));
  }
  return [...out];
}

/** Millimetres per printed unit and how far a rounded print may sit from the claimed value. */
const UNITS: { factor: number; tol: number }[] = [
  { factor: 1, tol: 0.6 },
  { factor: 10, tol: 1.1 },
  { factor: 25.4, tol: 2.1 },
];

/** Whether some number in the quote, in mm, cm or inches, is this many millimetres. */
export function mmIn(mm: number, quote: string): boolean {
  return numbersIn(quote).some((n) => UNITS.some((u) => Math.abs(n * u.factor - mm) <= u.tol));
}

const WORDS = {
  h: 'height|high|\\bh\\b',
  w: 'width|wide|\\bw\\b',
  d: 'depth|deep|\\bd\\b',
} as const;

/** Whether a number is printed right next to its label ("height 305 mm", "305 mm high"). */
function labelled(axis: keyof SizeMm, mm: number, quote: string): boolean {
  const q = clean(quote);
  const word = WORDS[axis];
  const near = new RegExp(
    `(?:${word})[^\\d]{0,14}(\\d[\\d.,]*)|(\\d[\\d.,]*)\\s?(?:mm|cm|in|")?\\s?(?:${word})`,
    'g',
  );
  for (const m of q.matchAll(near)) {
    const n = numbersIn(m[1] ?? m[2] ?? '');
    if (n.some((v) => UNITS.some((u) => Math.abs(v * u.factor - mm) <= u.tol))) return true;
  }
  return false;
}

const AXIS: Record<string, keyof SizeMm> = {
  h: 'h',
  height: 'h',
  w: 'w',
  width: 'w',
  d: 'd',
  depth: 'd',
};
const AXIS_WORD = '(h|w|d|height|width|depth)';
const NUM = '(\\d[\\d.,]*)';
const UNIT = '(?:\\s?(?:mm|cm|in|inch|inches|"))?';

/**
 * Sizes printed as "(H x W x D) 305 x 180 x 252 mm": the order of the labels says which number is
 * which. Null when the quote has no such header; otherwise whether the numbers follow it.
 */
export function byHeader(v: SizeMm, quote: string): boolean | null {
  const q = clean(quote);
  const head = q.match(new RegExp(`${AXIS_WORD}\\s?x\\s?${AXIS_WORD}\\s?x\\s?${AXIS_WORD}`));
  if (!head) return null;
  const order = [head[1]!, head[2]!, head[3]!].map((w) => AXIS[w]!);
  if (new Set(order).size !== 3) return null;
  const rest = q.slice((head.index ?? 0) + head[0].length);
  const triple = rest.match(new RegExp(`${NUM}${UNIT}\\s?x\\s?${NUM}${UNIT}\\s?x\\s?${NUM}`));
  if (!triple) return null;
  return order.every((axis, i) => {
    const printed = numbersIn(triple[i + 1]!);
    return printed.some((n) => UNITS.some((u) => Math.abs(n * u.factor - v[axis]) <= u.tol));
  });
}

const KEYWORDS: {
  enclosure: Record<Exclude<EnclosureType, 'unknown'>, RegExp>;
  port: Record<Exclude<PortLocation, 'unknown'>, RegExp>;
  drivers: Record<Exclude<DriverLayout, 'unknown'>, RegExp>;
} = {
  enclosure: {
    sealed: /sealed|closed[- ]box|closed cabinet|acoustic suspension/,
    ported: /ported|bass[- ]reflex|reflex|\bports?\b|\bvents?\b/,
    'passive-radiator': /passive radiator|passive bass|\bdrone\b/,
    'open-baffle': /open[- ]baffle|dipole/,
  },
  port: {
    front: /front[- ]?(?:firing|facing|ported|port)|front.{0,24}\bports?\b|\bports?\b.{0,24}front/,
    rear: /rear[- ]?(?:firing|facing|ported|port)|rear.{0,24}\bports?\b|\bports?\b.{0,24}rear|back.{0,16}\bports?\b/,
    down: /down[- ]?firing|downward|bottom.{0,16}\bports?\b|\bports?\b.{0,24}(?:bottom|base)/,
    side: /side[- ]?(?:firing|facing|ported)|side.{0,16}\bports?\b|\bports?\b.{0,24}side/,
    none: /sealed|closed|no port|acoustic suspension|passive radiator/,
  },
  drivers: {
    coaxial: /coax|uni-?q|concentric|point[- ]source/,
    'two-way': /\b2[- ]way|two[- ]way|\b2 way/,
    'three-way': /\b3[- ]way|three[- ]way|\b3 way/,
    'full-range': /full[- ]?range|single[- ]driver/,
    other: /./,
  },
};

/** The −3 / −6 / −10 dB figure named in a quote, and whether it is a ± tolerance instead. */
function basisIn(quote: string): { db: Bass['db']; tolerance: boolean } {
  const q = clean(quote);
  const m = q.match(/(±|\+\/-)?\s?[-+]?\s?(3|6|10)\s?db/);
  if (!m) return { db: null, tolerance: false };
  return { db: Number(m[2]) as 3 | 6 | 10, tolerance: Boolean(m[1]) };
}

type Check<T> = (value: T, quote: string) => { ok: boolean; reason?: string; review?: string };

function keyword<K extends string>(table: Record<K, RegExp>, what: string): Check<K> {
  return (value, quote) =>
    table[value]?.test(clean(quote))
      ? { ok: true }
      : { ok: false, reason: `the quote does not say "${value}" (${what})` };
}

const checks = {
  sizeMm: ((v, q) => {
    const axes: (keyof SizeMm)[] = ['h', 'w', 'd'];
    const missing = axes.filter((a) => !mmIn(v[a], q));
    if (missing.length) return { ok: false, reason: `not in the quote: ${missing.join(', ')}` };
    if (!/mm|cm|\bin\b|inch|"/.test(clean(q)))
      return { ok: false, reason: 'the quote names no unit' };
    const header = byHeader(v, q);
    if (header === false)
      return { ok: false, reason: 'the numbers do not follow the quote’s H x W x D order' };
    if (header === true) return { ok: true };
    const unlabelled = axes.filter((a) => !labelled(a, v[a], q));
    return unlabelled.length
      ? {
          ok: true,
          review: `which number is the ${unlabelled.join(', ')} is not labelled in the quote`,
        }
      : { ok: true };
  }) as Check<SizeMm>,
  enclosure: keyword(KEYWORDS.enclosure, 'cabinet') as Check<EnclosureType>,
  port: keyword(KEYWORDS.port, 'port') as Check<PortLocation>,
  drivers: keyword(KEYWORDS.drivers, 'drivers') as Check<DriverLayout>,
  bass: ((v, q) => {
    const c = clean(q);
    if (!/hz/.test(c)) return { ok: false, reason: 'the quote names no hertz' };
    if (!numbersIn(q).includes(v.hz)) return { ok: false, reason: `${v.hz} is not in the quote` };
    const found = basisIn(q);
    if (v.db !== null && found.db !== v.db) {
      return { ok: false, reason: `the quote does not say ${v.db} dB` };
    }
    if (v.dependsOnSetting && !/setting|mode|switch|eq\b|position|wall|desk|extension/.test(c)) {
      return { ok: false, reason: 'the quote does not say the figure depends on a setting' };
    }
    if (found.tolerance)
      return { ok: true, review: '± dB is a tolerance band, not the bass limit' };
    return v.db === null
      ? { ok: true, review: 'the quote does not say which dB level' }
      : { ok: true };
  }) as Check<Bass>,
  minWallMm: ((v, q) =>
    !mmIn(v, q)
      ? { ok: false, reason: `${v} mm is not in the quote` }
      : /wall/.test(clean(q))
        ? { ok: true }
        : { ok: false, reason: 'the quote does not mention a wall' }) as Check<number>,
  positionSetting: ((v, q) =>
    v &&
    /(wall|desk|position|placement|boundary|room|corner|free[- ]?standing).{0,40}(switch|setting|mode|eq|compensation)|(switch|setting|mode|eq|compensation).{0,40}(wall|desk|position|placement|boundary|room|corner)/.test(
      clean(q),
    )
      ? { ok: true }
      : {
          ok: false,
          reason: 'the quote does not name a wall or position setting',
        }) as Check<boolean>,
  controls: ((v, q) => {
    const c = clean(q);
    const missing = (['bass', 'treble'] as const).filter(
      (k) => v[k] && !new RegExp(`${k}`).test(c),
    );
    if (!v.bass && !v.treble)
      return { ok: false, reason: 'record controls only when there are some' };
    return missing.length
      ? { ok: false, reason: `the quote does not name a ${missing.join(' or ')} control` }
      : { ok: true };
  }) as Check<{ bass: boolean; treble: boolean }>,
  designedForCorner: ((v, q) =>
    v && /corner/.test(clean(q))
      ? { ok: true }
      : { ok: false, reason: 'the quote does not mention a corner' }) as Check<boolean>,
  tweeterMm: ((v, q) =>
    mmIn(v, q) && /tweeter|treble|coax|uni-?q|high[- ]frequency|hf/.test(clean(q))
      ? { ok: true }
      : { ok: false, reason: 'the quote does not give this tweeter height' }) as Check<number>,
};

const REQUIRED = ['sizeMm', 'enclosure', 'drivers'] as const;
const OPTIONAL = [
  'bass',
  'port',
  'minWallMm',
  'positionSetting',
  'controls',
  'designedForCorner',
  'tweeterMm',
] as const;
/** Facts a person may confirm from the maker's photos (the others need words on a page). */
const FROM_PHOTOS: readonly string[] = ['port'];

/** Checks every field of a draft against the page text it was read from. */
export function checkDraft(draft: Draft, page: string): CheckResult {
  const rejected: Finding[] = [];
  const review: Finding[] = [];
  const kept: Partial<Record<(typeof REQUIRED)[number] | (typeof OPTIONAL)[number], unknown>> = {};
  const isRequired = (field: string) => (REQUIRED as readonly string[]).includes(field);
  for (const field of [...REQUIRED, ...OPTIONAL]) {
    const f = draft[field] as DraftField<never> | undefined;
    if (!f) {
      if (isRequired(field)) rejected.push({ field, reason: 'missing' });
      continue;
    }
    const source = { url: draft.url, retrieved: draft.retrieved };
    if ('seenOnPhotos' in f) {
      if (!FROM_PHOTOS.includes(field)) {
        rejected.push({ field, reason: 'this needs words on a page, not a photo' });
      } else if (!f.confirmedBy?.trim()) {
        rejected.push({ field, reason: 'seen on photos: a person has to confirm it' });
      } else {
        kept[field] = { value: f.value, ...source, via: 'photo-confirmed' };
        review.push({ field, reason: `confirmed from the maker's photos by ${f.confirmedBy}` });
      }
      continue;
    }
    if (!quoteIn(f.quote, page)) {
      rejected.push({ field, reason: 'the quote is not in the page' });
      continue;
    }
    const verdict = (checks[field] as Check<never>)(f.value, f.quote);
    if (!verdict.ok) rejected.push({ field, reason: verdict.reason ?? 'does not match its quote' });
    else {
      kept[field] = { value: f.value, ...source, via: draft.source };
      if (verdict.review) review.push({ field, reason: verdict.review });
    }
  }
  if (rejected.some((f) => isRequired(f.field))) return { entry: null, rejected, review };
  const entry = {
    id: speakerId(draft.brand, draft.model),
    brand: draft.brand,
    model: draft.model,
    ...(draft.aka?.length ? { aka: draft.aka } : {}),
    status: draft.status,
    category: draft.category,
    kind: draft.kind,
    ...(draft.special ? { special: draft.special } : {}),
    ...kept,
  } as SpeakerEntry;
  const problems = validateEntry(entry);
  if (problems.length) {
    return {
      entry: null,
      rejected: [...rejected, ...problems.map((reason) => ({ field: 'entry', reason }))],
      review,
    };
  }
  return { entry, rejected, review };
}
