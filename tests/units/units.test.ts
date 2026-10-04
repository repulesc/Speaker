import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { defaultSystem, formatDb, formatFrequency, formatLength } from '../../src/units/format';
import { parseLength } from '../../src/units/parse';

const metres = (input: string, bare: 'm' | 'cm' | 'ft' = 'm'): number => {
  const r = parseLength(input, bare);
  if (!r.ok) throw new Error(`rejected: ${r.reason}`);
  if (r.metres === null) throw new Error('empty');
  return r.metres;
};

describe('parseLength', () => {
  it.each([
    ['3.5', 3.5],
    ['3,5', 3.5],
    ['3.5 m', 3.5],
    ['3,5m', 3.5],
    ['350 cm', 3.5],
    ['350cm', 3.5],
    ['3500 mm', 3.5],
    ['3,5 méter', 3.5],
    ['350 centi', 3.5],
    ['3,500', 3.5], // comma is always a decimal separator
  ])('%s → %d m', (input, expected) => {
    expect(metres(input)).toBeCloseTo(expected, 9);
  });

  it.each([
    `11'6"`,
    '11′ 6″',
    '11 ft 6 in',
    '11ft6in',
    `11' 6`,
    '138"',
    '138 in',
    '11.5 ft',
    '11,5 láb',
  ])('%s → 3.5052 m', (input) => {
    expect(metres(input)).toBeCloseTo(3.5052, 9);
  });

  it('reads back its own formatted output (fractions, non-breaking space)', () => {
    expect(metres('11′\u00a05¾″')).toBeCloseTo(137.75 * 0.0254, 9);
    expect(metres('2′ 0½″')).toBeCloseTo(24.5 * 0.0254, 9);
  });

  it('bare numbers use the field unit', () => {
    expect(metres('62', 'cm')).toBeCloseTo(0.62, 9);
    expect(metres('11.5', 'ft')).toBeCloseTo(3.5052, 9);
  });

  it('empty means unknown, not zero', () => {
    expect(() => metres('')).toThrow('empty');
    expect(parseLength('  ', 'm')).toEqual({ ok: true, metres: null });
  });

  it.each([
    ['11 6', 'ambiguousFeetInches'],
    ['abc', 'invalid'],
    ['3 parsecs', 'invalid'],
    ['0', 'notPositive'],
    ['-2 m', 'notPositive'],
  ])('rejects %s (%s)', (input, reason) => {
    expect(parseLength(input, 'm')).toEqual({ ok: false, reason });
  });
});

describe('formatLength', () => {
  it('metric, English and Hungarian decimal separators', () => {
    expect(formatLength(4.25, 'metric', 'room', 'en')).toBe('4.25 m');
    expect(formatLength(4.25, 'metric', 'room', 'hu')).toBe('4,25 m');
    expect(formatLength(0.62, 'metric', 'position', 'en')).toBe('62 cm');
    expect(formatLength(1.24, 'metric', 'position', 'en')).toBe('1.24 m');
  });

  it('imperial: ½ inch for rooms, ¼ inch for positions', () => {
    expect(formatLength(3.5, 'imperial', 'room', 'en')).toBe('11′ 6″');
    expect(formatLength(3.5, 'imperial', 'position', 'en')).toBe('11′ 5¾″');
  });

  it('coarse rounding for estimated inputs', () => {
    expect(formatLength(0.62, 'metric', 'position', 'en', true)).toBe('60 cm');
  });

  it('round trip: parse(format(x)) is within half the display precision', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.05, max: 20, noNaN: true }), (x) => {
        for (const locale of ['en', 'hu']) {
          const metric = metres(formatLength(x, 'metric', 'position', locale));
          expect(Math.abs(metric - x)).toBeLessThanOrEqual(0.005 + 1e-9);
        }
        const imperial = metres(formatLength(x, 'imperial', 'position', 'en'));
        expect(Math.abs(imperial - x)).toBeLessThanOrEqual(0.0254 / 8 + 1e-9);
      }),
    );
  });
});

describe('other formats', () => {
  it('frequency, dB and the default system', () => {
    expect(formatFrequency(42.875, 'en')).toBe('43 Hz');
    expect(formatFrequency(1234, 'en')).toBe('1.2 kHz');
    expect(formatFrequency(178.9, 'en', true)).toBe('180 Hz');
    expect(formatDb(-3.79, 'en')).toBe('−3.8 dB');
    expect(defaultSystem('en-US')).toBe('imperial');
    expect(defaultSystem('hu-HU')).toBe('metric');
  });
});
