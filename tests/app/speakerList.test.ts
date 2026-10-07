import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../../src/engine/presets/defaults';
import { KIND_PRESETS } from '../../src/engine/presets/speakerKinds';
import { validateEntry, type SpeakerEntry } from '../../src/engine/speakers/entry';
import { speakerSchema } from '../../src/app/state/schema';
import { setSpeakerChoice } from '../../src/app/state/speaker';
import {
  describeSpeaker,
  markEdited,
  pickSpeaker,
  speakerFromEntry,
} from '../../src/app/state/speakerList';
import { makeProject } from '../fixtures/projects';

/** The invented e2e entries: not real products, used to test the mapping. */
const dir = new URL('../fixtures/speakers/', import.meta.url);
const fixtures: Record<string, SpeakerEntry> = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const e = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SpeakerEntry;
      return [e.id, e];
    }),
);
const shelf = fixtures['example-audio-shelf-one']!;
const sealed = fixtures['example-audio-shelf-one-mk-ii']!;
const tower = fixtures['example-audio-tower-three']!;
const wireless = fixtures['example-audio-mini-wireless']!;
const panel = fixtures['sample-labs-panel-7']!;

describe('the e2e fixtures are believable entries', () => {
  it('every fixture passes the entry check', () => {
    for (const e of Object.values(fixtures)) expect(validateEntry(e), e.id).toEqual([]);
  });
});

describe('a speaker from the list (docs/SPEAKER_DATA.md)', () => {
  it('copies what the maker states, in metres, as measured', () => {
    const s = speakerFromEntry(shelf);
    expect(s.brand).toBe('Example Audio');
    expect(s.model).toBe('Shelf One');
    expect(s.dimensions.w).toEqual({ value: 0.18, certainty: 'measured' });
    expect(s.dimensions.h).toEqual({ value: 0.3, certainty: 'measured' });
    expect(s.dimensions.d).toEqual({ value: 0.25, certainty: 'measured' });
    expect(s.enclosure).toEqual({ value: 'ported', certainty: 'measured' });
    expect(s.portLocation).toEqual({ value: 'rear', certainty: 'measured' });
    expect(s.listed).toMatchObject({ id: shelf.id, url: shelf.sizeMm.url });
    expect(s.provenance.sources.every((x) => x.kind === 'manufacturer' && x.url)).toBe(true);
    expect(speakerSchema(s, 'speaker')).toBeNull();
  });

  it('moves a −3 dB bass figure to −6 dB along P09’s roll-off', () => {
    // Ported: 4th order, f6 ≈ 0.87 · f3.
    const s = speakerFromEntry(shelf);
    expect(s.lowFrequencyMinus6dB.certainty).toBe('measured');
    expect(s.lowFrequencyMinus6dB.value).toBeCloseTo(45 * 0.87, -0.5);
    expect(speakerFromEntry(tower).lowFrequencyMinus6dB.value).toBe(32);
  });

  it('a bass figure with no stated level is an estimate', () => {
    const s = speakerFromEntry(wireless);
    expect(s.lowFrequencyMinus6dB).toEqual({ value: 50, certainty: 'estimated' });
    expect(s.listed!.bassFromKind).toBeUndefined();
  });

  it('no bass figure: the kind’s typical value, marked as such', () => {
    const s = speakerFromEntry(panel);
    expect(s.lowFrequencyMinus6dB).toEqual({
      value: KIND_PRESETS.floorstander.sizes.medium.f6,
      certainty: 'estimated',
    });
    expect(s.listed!.bassFromKind).toBe(true);
    expect(s.listed!.special).toBe('planar');
  });

  it('a sealed box has no port; a ported one with no stated port is unknown', () => {
    expect(speakerFromEntry(sealed).portLocation).toEqual({ value: 'none', certainty: 'measured' });
    const { port: _port, ...noPort } = shelf;
    void _port;
    expect(speakerFromEntry(noPort).portLocation).toEqual({ value: null, certainty: 'unknown' });
  });

  it('a port seen on the maker’s photos is an estimate, and the card says so', () => {
    const s = speakerFromEntry(wireless);
    expect(s.portLocation).toEqual({ value: 'rear', certainty: 'estimated' });
    expect(s.listed!.photoPort).toBe(true);
  });

  it('estimates the driver heights unless the maker gives the tweeter’s', () => {
    const s = speakerFromEntry(shelf);
    expect(s.acousticAxisHeight).toEqual({ value: 0.225, certainty: 'estimated' });
    expect(s.wooferCentreHeight.certainty).toBe('estimated');
    expect(speakerFromEntry(tower).acousticAxisHeight).toEqual({
      value: 0.9,
      certainty: 'measured',
    });
  });

  it('takes the controls, the position setting and the wall distance from the manual', () => {
    const s = speakerFromEntry(wireless);
    expect(s.dsp.treble).toBeDefined();
    expect(s.dsp.bass).toBeDefined();
    expect(s.dsp.wallDistanceSetting).toBe(true);
    expect(s.minWallDistance).toEqual({ value: 0.1, certainty: 'measured' });
    expect(speakerFromEntry(shelf).dsp).toEqual({});
  });

  it('dates the card with the newest reading', () => {
    expect(speakerFromEntry(wireless).listed!.retrieved).toBe('2026-10-07');
  });
});

describe('picking, describing, editing', () => {
  it('a pick keeps where they stand and sets the base height from the tweeter', () => {
    const p = makeProject();
    setSpeakerChoice(p, 'placedOn', 'stand');
    pickSpeaker(p, shelf);
    expect(p.speaker.choices).toEqual({ kind: 'bookshelf', placedOn: 'stand' });
    const z = p.variants[0]!.speakers.left.base.z;
    expect(z + p.speaker.acousticAxisHeight.value!).toBeCloseTo(DEFAULTS.earHeight, 6);
  });

  it('changing where they stand keeps every value of a listed speaker', () => {
    const p = makeProject();
    pickSpeaker(p, tower);
    const before = structuredClone(p.speaker);
    setSpeakerChoice(p, 'placedOn', 'stand');
    expect({ ...p.speaker, choices: undefined }).toEqual({ ...before, choices: undefined });
    expect(p.speaker.choices!.placedOn).toBe('stand');
  });

  it('“Describe it instead” goes back to the questions, keeping the kind and the place', () => {
    const p = makeProject();
    pickSpeaker(p, tower);
    setSpeakerChoice(p, 'placedOn', 'floor');
    describeSpeaker(p);
    expect(p.speaker.listed).toBeUndefined();
    expect(p.speaker.brand).toBe('');
    expect(p.speaker.choices).toEqual({ kind: 'floorstander', placedOn: 'floor' });
    expect(p.speaker.dimensions.h.certainty).toBe('estimated');
  });

  it('a value changed by hand marks the listed speaker as changed', () => {
    const p = makeProject();
    markEdited(p.speaker);
    expect(p.speaker.listed).toBeUndefined();
    pickSpeaker(p, shelf);
    markEdited(p.speaker);
    expect(p.speaker.listed!.edited).toBe(true);
  });
});

describe('the shipped list (data/speakers/entries)', () => {
  const shipped = new URL('../../data/speakers/entries/', import.meta.url);
  const files = readdirSync(shipped).filter((f) => f.endsWith('.json'));
  const entries = files.map(
    (f) => JSON.parse(readFileSync(new URL(f, shipped), 'utf8')) as SpeakerEntry,
  );

  it('every entry is believable, sourced and named after its file', () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const [i, e] of entries.entries()) {
      expect(validateEntry(e), e.id).toEqual([]);
      expect(files[i], e.id).toBe(`${e.id}.json`);
    }
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it('every entry becomes a valid project speaker', () => {
    for (const e of entries) expect(speakerSchema(speakerFromEntry(e), 'speaker'), e.id).toBeNull();
  });
});
