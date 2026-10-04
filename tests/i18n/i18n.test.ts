import { describe, expect, it } from 'vitest';
import { detectLocale, messageKeys, MESSAGES, translate } from '../../src/i18n/translate';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('i18n', () => {
  it('English and Hungarian have identical keys', () => {
    expect(messageKeys(MESSAGES.hu)).toEqual(messageKeys(MESSAGES.en));
  });

  it('every key has the same placeholders in both languages', () => {
    for (const key of messageKeys(MESSAGES.en)) {
      expect(placeholders(translate('hu', key)), key).toEqual(placeholders(translate('en', key)));
    }
  });

  it('fills placeholders and falls back to the key', () => {
    expect(translate('en', 'units.error.ambiguousFeetInches', { feet: 11, inches: 6 })).toBe(
      'Did you mean 11′ 6″?',
    );
    expect(translate('hu', 'no.such.key')).toBe('no.such.key');
  });

  it('detects Hungarian from the browser languages', () => {
    expect(detectLocale(['hu-HU', 'en'])).toBe('hu');
    expect(detectLocale(['de-DE', 'en-US'])).toBe('en');
  });
});
