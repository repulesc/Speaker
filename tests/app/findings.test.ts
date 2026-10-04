import { beforeAll, describe, expect, it, vi } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { confidenceInputPaths } from '../../src/engine/confidence';
import { adviceMessageKeys } from '../../src/engine/advice';
import { buildContext } from '../../src/engine/context';
import { findingMessageKeys, RULES } from '../../src/engine/rules';
import type { Advice, Finding, Project } from '../../src/engine/types';
import { adviceText, findingText, findingValues, scoreWord } from '../../src/app/findings/text';
import { i18n } from '../../src/i18n/locale.svelte';
import { MESSAGES, messageKeys, translate } from '../../src/i18n/translate';
import { busyRoom } from '../fixtures/busy-room';
import { estimated, genericSpeaker, makeProject } from '../fixtures/projects';

/** Every finding the engine can emit has display text in both languages, with every value filled in. */

function variations(): Project[] {
  const list: Project[] = [
    makeProject(),
    busyRoom(),
    makeProject({ W: 4, L: 4, H: 4, listenerY: 2.8 }),
  ];
  list.push(makeProject({ listenerY: 4.8 }));
  list.push(makeProject({ listenerY: 2.6 }));
  list.push(makeProject({ clearance: 0.05, standZ: 0 }));
  list.push(makeProject({ listenerY: 3.2, halfSpacing: 1.7 }));
  const spaced = makeProject({ listenerY: 3.2 });
  spaced.variants[0]!.speakers.right.base.x = 3.6; // lopsided
  list.push(spaced);
  const lively = makeProject({ surfaces: { floor: 'plaster-concrete', left: 'glass' } });
  lively.variants[0]!.busyness = estimated('bare');
  list.push(lively);
  const goals = makeProject();
  goals.goals.weights = { 'precise-imaging': 2 };
  list.push(goals);
  const wide = makeProject();
  wide.goals.weights = { 'wide-stage': 2 };
  list.push(wide);
  const satellite = makeProject();
  satellite.speaker.lowFrequencyMinus6dB = estimated(250);
  list.push(satellite);
  const trims = makeProject({
    standZ: 0,
    speaker: genericSpeaker({ portLocation: estimated('unknown') }),
  });
  trims.speaker.dsp = { treble: { minDb: -3, maxDb: 3, stepDb: 0.5 } };
  trims.variants[0]!.busyness = estimated('very-busy');
  list.push(trims);
  const toed = makeProject();
  toed.variants[0]!.speakers.left.toeInDeg = 10;
  list.push(toed);
  return list;
}

// The locale setter writes <html lang>; there is no page here.
beforeAll(() => vi.stubGlobal('document', { documentElement: {} }));

const findings: Finding[] = variations().flatMap((p) => {
  const ctx = buildContext(p)!;
  const placement = { speakers: ctx.variant.speakers, listener: ctx.variant.listener.ears };
  return [
    ...RULES.flatMap((rule) => rule.evaluate(ctx, placement)),
    ...(analyze(p) as { findings: Finding[] }).findings,
  ];
});

/** Typical values for every key, so that all of them are rendered, not only the ones the samples hit. */
const SAMPLE: Record<string, Record<string, number | string>> = {
  'P02.lowestModes': { length: 34.3, width: 42.9, height: 68.6 },
  'P04.frontWall': { speaker: 'both', distance: 0.7, frequency: 122 },
  'P04.aligned': { speaker: 'left', boundaryA: 'front', boundaryB: 'floor', frequency: 111 },
  'P05.*': { belowHz: 214 },
  'P06.*': {
    speaker: 'left',
    boundary: 'left',
    delayMs: 4.2,
    levelDb: -3.8,
    surface: 'plaster-brick',
    surfaceClass: 'reflective',
  },
  'P07.transition': { frequency: 179, low: 150, high: 210 },
  'P08.*': { t60: 0.4, low: 0.3, high: 0.6, method: 'sabine' },
  'P09.peak': { frequency: 68.6, db: 9.1 },
  'P09.dip': { frequency: 90, db: -14.5 },
  'P09.notScored': { lowFrequencyMinus6dB: 250 },
  'P10.ratio': { criticalDistance: 0.9, listeningDistance: 2.4, ratio: 2.7 },
  'P11.coincident': { frequencyA: 68.6, frequencyB: 70.4, pairs: 2 },
  'P11.bonello': { band: 80 },
  'G01.*': { offsetFraction: 0.04, midpoint: 2.5 },
  'G02.*': { distance: 0.25 },
  'G03.redFlag': { difference: 0.4 },
  'G03.caution': { difference: 0.15 },
  'G03.surfaces': { left: 'reflective', right: 'absorptive' },
  'G04.*': { angle: 52 },
  'G05.*': { difference: 0.08, closer: 'left' },
  'G06.*': { speaker: 'right' },
  'G07.tooClose': { clearance: 0.1, minimum: 0.2, minimumSource: 'manufacturer' },
  'G07.ok': { clearance: 0.3, minimum: 0.2, minimumSource: 'default' },
  'G07.matchSetting': { clearance: 0.35 },
  'G08.*': { angle: -14, direction: 'below' },
  'G09.*': { boundary: 'left', surface: 'glass' },
  'G10.obstruction': { object: 'cabinet' },
  'G10.*': { speaker: 'left', object: 'other-speaker', distance: 0.2 },
  'H01.overlay': { listenerY: 1.9 },
  'H02.overlay': { speakersY: 1.67, listenerY: 3.33 },
  'H04.*': { distance: 0.6, frequency: 143 },
  'H05.experiment': { toeInLeft: 10, toeInRight: 10 },
  'H06.*': { t60: 0.25, suggestDb: 0.5 },
};

const sampleFor = (key: string) => {
  const exact = SAMPLE[key];
  if (exact) return exact;
  const [rule] = key.split('.');
  return SAMPLE[`${rule}.*`];
};

/** Typical values for every piece of advice. */
const ADVICE_SAMPLE: Record<string, Record<string, number | string>> = {
  'T01.*': { speaker: 'left', boundary: 'left', thickness: 0.05 },
  'T03.*': { frequency: 120, quarterWavelength: 0.71 },
  'T04.corners': { frequency: 68.6 },
  'T05.*': { t60: 0.8, after: 0.57, absorption: 5 },
  'T06.moveFirst': { distance: 0.25, thickness: 0.1 },
  'T06.absorber': { distance: 0.25, thickness: 0.1 },
  'D01.match': { clearance: 0.35, zone: 'away' },
  'D02.cut': { gain: 'high', stepDb: -0.5 },
  'D03.*': { t60: 0.2, stepDb: 0.5 },
  'D04.height': { baseHeight: 0.9, angle: 12 },
  'D05.moveOut': { clearance: 0.1, minimum: 0.2 },
};

describe('advice texts', () => {
  it('every piece of advice renders from typical values, in both languages and unit systems', () => {
    const lookup = (key: string) =>
      ADVICE_SAMPLE[key] ?? ADVICE_SAMPLE[`${key.split('.')[0]}.*`] ?? {};
    for (const locale of ['en', 'hu'] as const) {
      i18n.locale = locale;
      for (const system of ['metric', 'imperial'] as const) {
        for (const full of adviceMessageKeys()) {
          const key = full.replace('advice.', '');
          const a = {
            ruleId: key.split('.')[0],
            messageKey: full,
            params: lookup(key),
          } as unknown as Advice;
          const text = adviceText(a, system);
          expect(text, `${locale} ${full}`).not.toMatch(/\{\w+\}/);
          expect(text, `${locale} ${full}`).not.toMatch(/NaN|undefined|Infinity/);
          expect(text).not.toBe(full);
        }
      }
    }
    i18n.locale = 'en';
  });
});

describe('finding texts', () => {
  it('every key renders from typical values, in both languages and both unit systems', () => {
    for (const locale of ['en', 'hu'] as const) {
      i18n.locale = locale;
      for (const system of ['metric', 'imperial'] as const) {
        for (const full of findingMessageKeys()) {
          const key = full.replace('finding.', '');
          const [ruleId] = key.split('.');
          const params = sampleFor(key) ?? {};
          const f = { ruleId, messageKey: full, params } as unknown as Finding;
          const text = findingText(f, system);
          expect(text, `${locale} ${full}`).not.toMatch(/\{\w+\}/);
          expect(text, `${locale} ${full}`).not.toMatch(/NaN|undefined|Infinity/);
          expect(text).not.toBe(full);
        }
      }
    }
    i18n.locale = 'en';
  });

  it('every key the engine can emit has text, in both languages', () => {
    const english = new Set(messageKeys(MESSAGES.en));
    for (const key of findingMessageKeys()) {
      expect(english.has(key), key).toBe(true);
      expect(translate('hu', key), key).not.toBe(key);
    }
  });

  it('the findings of real projects render completely too', () => {
    expect(findings.length).toBeGreaterThan(50);
    for (const locale of ['en', 'hu'] as const) {
      i18n.locale = locale;
      for (const system of ['metric', 'imperial'] as const) {
        for (const f of findings) {
          const text = findingText(f, system);
          expect(text, `${locale} ${f.messageKey}`).not.toMatch(/\{\w+\}/); // every value filled in
          expect(text, `${locale} ${f.messageKey}`).not.toMatch(/NaN|undefined|Infinity/);
          expect(text).not.toBe(f.messageKey);
        }
      }
    }
    i18n.locale = 'en';
  });

  it('values are formatted for people: lengths, frequencies, decibels', () => {
    i18n.locale = 'en';
    const values = findingValues('P09', { frequency: 68.6, db: -14.5 }, 'metric', 'en');
    expect(values.frequency).toBe('69 Hz');
    expect(values.db).toBe('14.5 dB'); // the sentence says "quieter", so no sign
    const g02 = findingValues('G02', { distance: 0.25 }, 'imperial', 'en');
    expect(g02.distance).toMatch(/″/);
    expect(
      findingValues('P02', { length: 34.3, width: 42.9, height: 68.6 }, 'metric', 'en').height,
    ).toBe('69 Hz');
    expect(findingValues('P08', { t60: 0.4, low: 0.3, high: 0.6 }, 'metric', 'en').low).toBe(
      '0.3 s',
    );
  });

  it('every input the confidence hint can name has a sentence', () => {
    for (const locale of ['en', 'hu'] as const) {
      i18n.locale = locale;
      for (const path of confidenceInputPaths(makeProject())) {
        const text = i18n.t(`next.${path}`);
        expect(text, `${locale} next.${path}`).not.toBe(`next.${path}`);
      }
    }
    i18n.locale = 'en';
  });

  it('a score word is never "good" for a broken number', () => {
    expect(scoreWord(NaN)).toBe('poor');
    expect(scoreWord(0.9)).toBe('veryGood');
    expect(scoreWord(0.6)).toBe('fair');
  });
});
