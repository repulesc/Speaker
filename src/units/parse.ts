/**
 * Forgiving length parser (docs/I18N_AND_UNITS.md §4.4). Returns metres or a reason code
 * (i18n: `units.error.<reason>`). Pure; no locale state.
 */

export const INCH = 0.0254;
export const FOOT = 0.3048;

/**
 * Unit assumed for a bare number, from the field and the display system.
 * 'm-or-cm' is for metric positions, which are displayed as "62 cm" but "2.40 m": people type what
 * they see, so a bare number below 10 is metres ("2.4") and 10 or more is centimetres ("62").
 */
export type BareUnit = 'm' | 'cm' | 'ft' | 'in' | 'm-or-cm';

export type ParseResult =
  | { ok: true; metres: number }
  | { ok: true; metres: null } // empty input = "unknown"
  | { ok: false; reason: 'invalid' | 'notPositive' | 'ambiguousFeetInches' };

const METRIC: Record<string, number> = {
  m: 1,
  meter: 1,
  meters: 1,
  metre: 1,
  metres: 1,
  méter: 1,
  cm: 0.01,
  centi: 0.01,
  centiméter: 0.01,
  mm: 0.001,
};

const bareFactor = (unit: BareUnit, value: number): number =>
  unit === 'm-or-cm' ? (value < 10 ? 1 : 0.01) : { m: 1, cm: 0.01, ft: FOOT, in: INCH }[unit];

const FEET_WORDS = ['ft', 'feet', 'foot', "'", '′', 'láb'];
const INCH_WORDS = ['in', 'inch', 'inches', '"', '″', 'hüvelyk'];

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;
const FEET = String.raw`(?:ft|feet|foot|láb|'|′)`;
const INCHES = String.raw`(?:in|inch|inches|hüvelyk|"|″)`;

/** "11'6"", "11 ft 6 in", "11' 6", "11ft6in" */
const FEET_INCHES = new RegExp(String.raw`^${NUMBER}\s*${FEET}\s*${NUMBER}\s*${INCHES}?$`, 'iu');

const toNumber = (s: string) => Number(s.replace(',', '.'));

/** Our own formatter writes ¼ ½ ¾ and non-breaking spaces; the parser must read them back. */
function normalise(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/(\d*)\s*([¼½¾])/g, (_, whole: string, f: string) => {
      const fraction = f === '¼' ? 0.25 : f === '½' ? 0.5 : 0.75;
      return String(Number(whole || 0) + fraction);
    })
    .trim()
    .toLowerCase();
}

export function parseLength(input: string, bare: BareUnit): ParseResult {
  const text = normalise(input);
  if (text === '') return { ok: true, metres: null };

  const fi = FEET_INCHES.exec(text);
  if (fi) return positive(toNumber(fi[1]!) * FOOT + toNumber(fi[2]!) * INCH);

  if (/^\d+(?:[.,]\d+)?\s+\d+(?:[.,]\d+)?$/.test(text))
    return { ok: false, reason: 'ambiguousFeetInches' };

  const single = /^(-?\d+(?:[.,]\d+)?)\s*([^\d\s.,-][^\d]*)?$/u.exec(text);
  if (!single) return { ok: false, reason: 'invalid' };
  const value = toNumber(single[1]!);
  const unit = single[2]?.trim();

  if (!unit) return positive(value * bareFactor(bare, value));
  if (unit in METRIC) return positive(value * METRIC[unit]!);
  if (FEET_WORDS.includes(unit)) return positive(value * FOOT);
  if (INCH_WORDS.includes(unit)) return positive(value * INCH);
  return { ok: false, reason: 'invalid' };
}

function positive(metres: number): ParseResult {
  if (!Number.isFinite(metres)) return { ok: false, reason: 'invalid' };
  if (metres <= 0) return { ok: false, reason: 'notPositive' };
  return { ok: true, metres };
}
