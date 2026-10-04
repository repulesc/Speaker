import { INCH } from './parse';

/**
 * Display formatting (docs/I18N_AND_UNITS.md §4.3). SI in, localised text out. A non-breaking
 * space separates number and unit so values never wrap.
 */

export type LengthSystem = 'metric' | 'imperial';
export type LengthKind = 'room' | 'position';

const NBSP = ' ';

function number(value: number, locale: string, decimals: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Rounds to the nearest 1/denominator. */
function roundTo(value: number, denominator: number): number {
  return Math.round(value * denominator) / denominator;
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

function feetInches(metres: number, step: number): string {
  const totalInches = roundTo(metres / INCH, 1 / step);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const whole = Math.floor(inches);
  const fraction = FRACTIONS[String(inches - whole)] ?? '';
  return `${feet}′${NBSP}${whole}${fraction}″`;
}

/**
 * Room dimensions: 2 decimals in metres, nearest ½ inch in imperial.
 * Positions: integer cm below 1 m, metres with 2 decimals above; nearest ¼ inch in imperial.
 * `coarse` rounds one step coarser for values derived from estimated inputs.
 */
export function formatLength(
  metres: number,
  system: LengthSystem,
  kind: LengthKind,
  locale: string,
  coarse = false,
): string {
  if (system === 'imperial')
    return feetInches(metres, kind === 'room' ? (coarse ? 1 : 0.5) : coarse ? 0.5 : 0.25);
  if (kind === 'room')
    return `${number(coarse ? roundTo(metres, 10) : metres, locale, coarse ? 1 : 2)}${NBSP}m`;
  if (metres < 1) {
    const cm = coarse ? roundTo(metres * 100, 1 / 5) : Math.round(metres * 100);
    return `${number(cm, locale, 0)}${NBSP}cm`;
  }
  return `${number(coarse ? roundTo(metres, 20) : metres, locale, 2)}${NBSP}m`;
}

/** Hz below 1000, kHz with one decimal above. `coarse` → 2 significant figures. */
export function formatFrequency(hz: number, locale: string, coarse = false): string {
  const value = coarse ? Number(hz.toPrecision(2)) : hz;
  if (value >= 1000) return `${number(value / 1000, locale, 1)}${NBSP}kHz`;
  return `${number(value, locale, 0)}${NBSP}Hz`;
}

export function formatDb(db: number, locale: string): string {
  // U+2212 minus sign for negative values.
  return `${number(db, locale, 1).replace('-', '−')}${NBSP}dB`;
}

export function formatMs(ms: number, locale: string): string {
  return `${number(ms, locale, 1)}${NBSP}ms`;
}

export function formatSecondsRange(low: number, high: number, locale: string): string {
  return `${number(low, locale, 1)}–${number(high, locale, 1)}${NBSP}s`;
}

export function formatAngle(deg: number, locale: string): string {
  return `${number(deg, locale, 0)}°`;
}

export function formatTemperature(celsius: number, system: LengthSystem, locale: string): string {
  return system === 'imperial'
    ? `${number((celsius * 9) / 5 + 32, locale, 0)}${NBSP}°F`
    : `${number(celsius, locale, 0)}${NBSP}°C`;
}

/** Default length system from the locale (I18N_AND_UNITS §4.2). */
export function defaultSystem(locale: string): LengthSystem {
  return ['en-US', 'en-LR', 'en-MM'].includes(locale) ? 'imperial' : 'metric';
}
