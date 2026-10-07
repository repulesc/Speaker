import type { DriverLayout, EnclosureType, PortLocation } from '../types';
import type {
  BassBasis,
  Category,
  SizeMm,
  Special,
  SpeakerEntry,
  Status,
  Tweeter,
} from './entry.ts';
import { speakerId, validateEntry } from './entry.ts';
import type { SpeakerKind } from '../presets/speakerKinds';

/**
 * The quote checker (docs/SPEAKER_DATA.md). An AI (or a person) reads a spec page and proposes a
 * `Draft`: each value with the exact words it was read from. Nothing is trusted: the quote must
 * really be in the page, and the value must really be in the quote. What passes becomes an entry
 * with only the value and the link; the quote is used here and then dropped (no copied text kept).
 * Pure functions: the fetching and the AI live outside the engine.
 */
export interface DraftField<T> {
  value: T;
  quote: string;
}

export interface Draft {
  brand: string;
  model: string;
  status: Status;
  category: Category;
  kind: SpeakerKind;
  special?: Special;
  /** The page every quote was read on, and the day. */
  url: string;
  retrieved: string;
  sizeMm?: DraftField<SizeMm>;
  enclosure?: DraftField<EnclosureType>;
  port?: DraftField<PortLocation>;
  drivers?: DraftField<DriverLayout>;
  tweeter?: DraftField<Tweeter>;
  bass?: DraftField<{ hz: number; db: BassBasis }>;
}

export interface Finding {
  field: string;
  reason: string;
}

export interface CheckResult {
  /** The entry, when every required field passed and the whole thing is believable. */
  entry: SpeakerEntry | null;
  /** Fields (or the whole entry) that failed: left out, with why. */
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
  tweeter: Record<Tweeter, RegExp>;
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
  tweeter: {
    dome: /dome|silk|aluminium|aluminum|titanium|beryllium|diamond/,
    'dome-waveguide': /waveguide/,
    ribbon: /ribbon/,
    amt: /\bamt\b|air motion|heil/,
    horn: /\bhorn\b/,
    coaxial: /coax|uni-?q|concentric/,
    planar: /planar|electrostatic|magnetostatic|isodynamic/,
    other: /./,
  },
};

/** The −3 / −6 / −10 dB figure named in a quote, and whether it is a ± tolerance instead. */
function basisIn(quote: string): { db: BassBasis; tolerance: boolean } {
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
  tweeter: keyword(KEYWORDS.tweeter, 'tweeter') as Check<Tweeter>,
  bass: ((v, q) => {
    const c = clean(q);
    if (!/hz/.test(c)) return { ok: false, reason: 'the quote names no hertz' };
    if (!numbersIn(q).includes(v.hz)) return { ok: false, reason: `${v.hz} is not in the quote` };
    const found = basisIn(q);
    if (v.db !== null && found.db !== v.db) {
      return { ok: false, reason: `the quote does not say ${v.db} dB` };
    }
    if (found.tolerance)
      return { ok: true, review: '± dB is a tolerance band, not the bass limit' };
    return v.db === null
      ? { ok: true, review: 'the quote does not say which dB level' }
      : { ok: true };
  }) as Check<{ hz: number; db: BassBasis }>,
};

const REQUIRED = ['sizeMm', 'enclosure', 'port', 'drivers'] as const;
const OPTIONAL = ['tweeter', 'bass'] as const;

/** Checks every field of a draft against the page text it was read from. */
export function checkDraft(draft: Draft, page: string): CheckResult {
  const rejected: Finding[] = [];
  const review: Finding[] = [];
  const kept: Partial<Record<(typeof REQUIRED)[number] | (typeof OPTIONAL)[number], unknown>> = {};
  for (const field of [...REQUIRED, ...OPTIONAL]) {
    const f = draft[field] as DraftField<never> | undefined;
    if (!f) {
      if ((REQUIRED as readonly string[]).includes(field))
        rejected.push({ field, reason: 'missing' });
      continue;
    }
    if (!quoteIn(f.quote, page)) {
      rejected.push({ field, reason: 'the quote is not in the page' });
      continue;
    }
    const verdict = (checks[field] as Check<never>)(f.value, f.quote);
    if (!verdict.ok) rejected.push({ field, reason: verdict.reason ?? 'does not match its quote' });
    else {
      kept[field] = { value: f.value, url: draft.url, retrieved: draft.retrieved };
      if (verdict.review) review.push({ field, reason: verdict.review });
    }
  }
  if (rejected.length) return { entry: null, rejected, review };
  const entry = {
    id: speakerId(draft.brand, draft.model),
    brand: draft.brand,
    model: draft.model,
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
      rejected: problems.map((reason) => ({ field: 'entry', reason })),
      review,
    };
  }
  return { entry, rejected, review };
}
