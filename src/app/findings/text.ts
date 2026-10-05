import type { Advice, Finding } from '../../engine/types';
import { i18n } from '../../i18n/locale.svelte';
import {
  formatAngle,
  formatDb,
  formatFrequency,
  formatLength,
  formatMs,
  type LengthSystem,
} from '../../units/format';

/**
 * Turns a finding's values (SI numbers and keywords) into display strings and looks up its text
 * (`finding.<rule>.<variant>`). The engine never produces text (docs/I18N_AND_UNITS.md).
 */

const LENGTHS = new Set([
  'distance',
  'clearance',
  'minimum',
  'difference',
  'midpoint',
  'listeningDistance',
  'criticalDistance',
  'listenerY',
  'speakersY',
  'quarterWavelength',
  'thickness',
  'baseHeight',
]);
const FREQUENCIES = new Set([
  'frequency',
  'frequencyA',
  'frequencyB',
  'belowHz',
  'band',
  'lowFrequencyMinus6dB',
]);
const WALLS = new Set(['boundary']);

type Values = Record<string, number | string>;

function seconds(value: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}\u00a0s`;
}

function plain(value: number, locale: string, decimals = 0): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function word(key: string, value: string | number): string {
  const text = i18n.t(key, {});
  return text === key ? String(value) : text;
}

/** One value as display text, by its name (and the rule it belongs to, where names are reused). */
function display(
  rule: string,
  name: string,
  value: number | string,
  system: LengthSystem,
  locale: string,
): string {
  if (typeof value === 'string') {
    if (name === 'speaker') return i18n.t(`words.speaker.${value}`);
    if (name === 'closer') return i18n.t(`words.closer.${value}`);
    if (name === 'direction') return i18n.t(`words.direction.${value}`);
    if (name === 'surface') return i18n.t(`surface.${value}`);
    if (name === 'surfaceClass' || name === 'left' || name === 'right')
      return i18n.t(`surface.class.${value}`);
    if (name === 'boundaryA' || name === 'boundaryB') return i18n.t(`words.boundary.${value}`);
    if (name === 'minimumSource') return i18n.t(`words.source.${value}`);
    if (name === 'gain') return i18n.t(`words.gain.${value}`);
    if (name === 'zone') return i18n.t(`words.zone.${value}`);
    if (name === 'object') return word(`object.${value}`, value);
    if (WALLS.has(name)) return i18n.t(`words.wall.${value}`);
    return value;
  }
  if (rule === 'P02' && ['length', 'width', 'height'].includes(name))
    return formatFrequency(value, locale, true);
  if (rule === 'P07' && (name === 'low' || name === 'high'))
    return formatFrequency(value, locale, true);
  if (['t60', 'low', 'high', 'after'].includes(name)) return seconds(value, locale);
  if (FREQUENCIES.has(name)) return formatFrequency(value, locale, true);
  if (LENGTHS.has(name)) return formatLength(value, system, 'position', locale);
  switch (name) {
    case 'db':
    case 'levelDb':
      return formatDb(Math.abs(value), locale);
    case 'absorption':
      return `${plain(value, locale)}\u00a0m²`;
    case 'stepDb':
    case 'suggestDb':
      return `${value > 0 ? '+' : '−'}${formatDb(Math.abs(value), locale)}`;
    case 'angle':
      return formatAngle(Math.abs(value), locale);
    case 'delayMs':
      return formatMs(value, locale);
    case 'offsetFraction':
      return `${plain(value * 100, locale)}\u00a0%`;
    case 'ratio':
      return plain(value, locale, 1);
    case 'toeInLeft':
    case 'toeInRight':
      return plain(value, locale, 1);
    default:
      return plain(value, locale, 1);
  }
}

export function findingValues(
  ruleId: string,
  params: Values,
  system: LengthSystem,
  locale: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(params)) {
    out[name === 'minimumSource' ? 'source' : name] = display(ruleId, name, value, system, locale);
  }
  const side = params.speaker;
  if (side === 'left' || side === 'right') out.speakerFrom = i18n.t(`words.speakerFrom.${side}`);
  return out;
}

/** The sentence for a finding. */
export function findingText(f: Finding, system: LengthSystem): string {
  return i18n.t(f.messageKey, findingValues(f.ruleId, f.params, system, i18n.locale));
}

/** A word for how good a 0–1 score is (never a percentage). */
export function scoreWord(score: number): 'poor' | 'fair' | 'good' | 'veryGood' {
  if (!Number.isFinite(score) || score < 0.5) return 'poor';
  if (score < 0.7) return 'fair';
  if (score < 0.85) return 'good';
  return 'veryGood';
}

/** A score as a number for "Show the numbers": two decimals, in the reader's locale. */
export function scoreNumber(score: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, score));
}

/** The score's word, and with "Show the numbers" on, the number too ("Good · 0.74"). */
export function scoreLabel(score: number, numbers: boolean): string {
  const word = i18n.t(`results.score.${scoreWord(score)}`);
  return numbers ? i18n.t('map.withScore', { word, score: scoreNumber(score, i18n.locale) }) : word;
}

/** The sentence for a piece of advice, with its numbers (docs/RULE_CATALOGUE.md, T and D rules). */
export function adviceText(a: Advice, system: LengthSystem): string {
  return i18n.t(a.messageKey, findingValues(a.ruleId, a.params, system, i18n.locale));
}

/**
 * The same advice in plain words (owner feedback after V5.1: "not a phone book"): only distances
 * you act on, no hertz, seconds or decibels. The numbers stay one tap away (adviceText).
 */
export function advicePlainText(a: Advice, system: LengthSystem): string {
  const key = a.messageKey.replace(/^advice\./, 'advicePlain.');
  return i18n.t(key, findingValues(a.ruleId, a.params, system, i18n.locale));
}
