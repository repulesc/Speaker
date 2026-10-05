import { describe, expect, it } from 'vitest';
import {
  DESK_HEIGHT,
  KIND_PRESETS,
  PORT_CHOICES,
  SPEAKER_KINDS,
  SPEAKER_SIZES,
  speakerValues,
} from '../../src/engine/presets/speakerKinds';
import { DEFAULTS } from '../../src/engine/presets/defaults';
import { speakerSchema } from '../../src/app/state/schema';
import { speakerFromChoices } from '../../src/app/state/defaults';
import { activeVariant, moveSpeaker, setSpeakerSpacing } from '../../src/app/plan/placement';
import {
  parseSpeakerJson,
  seatMode,
  serializeSpeaker,
  setSeatMode,
  setSeatRange,
  speakerFileName,
  dispersionOf,
  setSpeakerChoice,
} from '../../src/app/state/speaker';
import { genericSpeaker, makeProject } from '../fixtures/projects';

describe('the speaker questions (docs/ROADMAP_V7.md, Phase 2)', () => {
  it('an answer fills in typical values, keeps brand, model and identity; all are estimates', () => {
    const p = makeProject();
    p.speaker.brand = 'Acme';
    p.speaker.model = 'One';
    const id = p.speaker.id;
    setSpeakerChoice(p, 'kind', 'floorstander');
    expect(p.speaker).toMatchObject({ id, brand: 'Acme', model: 'One' });
    expect(p.speaker.choices).toEqual({ kind: 'floorstander' });
    expect(p.speaker.dimensions.h).toEqual({ value: 1.0, certainty: 'estimated' });
    expect(p.speaker.driverLayout.value).toBe('three-way');
    expect(p.speaker.portLocation.value).toBe('front');
    expect(p.speaker.provenance.verified).toBe(false);
    expect(speakerSchema(p.speaker, 'speaker')).toBeNull();
  });

  it('"Not sure" everywhere is the generic speaker, and clearing an answer goes back to it', () => {
    const p = makeProject();
    p.speaker = speakerFromChoices();
    const generic = JSON.stringify({ ...p.speaker, id: '' });
    setSpeakerChoice(p, 'port', 'sealed');
    setSpeakerChoice(p, 'port', undefined);
    expect(p.speaker.choices).toBeUndefined();
    expect(JSON.stringify({ ...p.speaker, id: '' })).toBe(generic);
  });

  it('every kind and size is a real box: sizes grow, the tweeter sits inside the cabinet', () => {
    for (const kind of SPEAKER_KINDS) {
      let previous = 0;
      for (const size of SPEAKER_SIZES) {
        for (const drivers of ['two-way', 'three-way', 'coaxial'] as const) {
          const v = speakerValues({ kind, size, drivers });
          expect(v.acousticAxisHeight).toBeGreaterThan(0);
          expect(v.acousticAxisHeight).toBeLessThan(v.h);
          expect(v.wooferCentreHeight).toBeGreaterThan(0);
          expect(v.wooferCentreHeight).toBeLessThanOrEqual(v.acousticAxisHeight);
          if (drivers === 'coaxial') expect(v.wooferCentreHeight).toBe(v.acousticAxisHeight);
        }
        const box = KIND_PRESETS[kind].sizes[size];
        expect(box.h * box.w * box.d).toBeGreaterThan(previous);
        previous = box.h * box.w * box.d;
        // Bigger boxes go at least as low.
        if (size !== 'small') {
          const smaller = KIND_PRESETS[kind].sizes[size === 'large' ? 'medium' : 'small'];
          expect(box.f6).toBeLessThanOrEqual(smaller.f6);
        }
      }
    }
  });

  it('the port sets sealed or ported and where the port is', () => {
    for (const port of PORT_CHOICES) {
      const v = speakerValues({ port });
      expect(v.enclosure).toBe(port === 'sealed' ? 'sealed' : 'ported');
      expect(v.portLocation).toBe(port === 'sealed' ? 'none' : port);
    }
  });

  it('where they stand sets the base height in every setup: floor, desk top, or tweeter at ear height', () => {
    const p = makeProject();
    p.variants.push(structuredClone({ ...p.variants[0]!, id: 'b' }));
    setSpeakerChoice(p, 'kind', 'floorstander');
    for (const v of p.variants) expect(v.speakers.left.base.z).toBe(0);
    setSpeakerChoice(p, 'placedOn', 'desk');
    for (const v of p.variants) expect(v.speakers.right.base.z).toBe(DESK_HEIGHT);
    setSpeakerChoice(p, 'kind', 'bookshelf');
    setSpeakerChoice(p, 'placedOn', 'stand');
    const z = p.variants[1]!.speakers.left.base.z;
    expect(z + p.speaker.acousticAxisHeight.value!).toBeCloseTo(DEFAULTS.earHeight, 6);
  });

  it('a bookshelf answer alone puts the speakers on a stand, not where they were', () => {
    const p = makeProject();
    for (const s of ['left', 'right'] as const) p.variants[0]!.speakers[s].base.z = 0;
    setSpeakerChoice(p, 'kind', 'bookshelf');
    expect(p.variants[0]!.speakers.left.base.z).toBeGreaterThan(0.5);
  });

  it('"made for" only records the answer: no physics changes', () => {
    const p = makeProject();
    setSpeakerChoice(p, 'kind', 'monitor');
    const before = JSON.stringify({ ...p.speaker, choices: null });
    setSpeakerChoice(p, 'madeFor', 'studio');
    expect(JSON.stringify({ ...p.speaker, choices: null })).toBe(before);
    expect(p.speaker.choices?.madeFor).toBe('studio');
  });

  it('a profile with choices round-trips through the speaker file', () => {
    const p = makeProject();
    setSpeakerChoice(p, 'kind', 'desktop');
    setSpeakerChoice(p, 'size', 'small');
    const back = parseSpeakerJson(serializeSpeaker(p.speaker));
    expect(back.ok && back.speaker.choices).toEqual({ kind: 'desktop', size: 'small' });
  });
});

describe('seat modes', () => {
  it('free → fixed → range → free', () => {
    const p = makeProject();
    expect(seatMode(p)).toBe('free');
    setSeatMode(p, 'fixed');
    expect(seatMode(p)).toBe('fixed');
    setSeatMode(p, 'range');
    expect(seatMode(p)).toBe('range');
    expect(p.constraints.listenerFixed).toBe(false);
    const [lo, hi] = p.constraints.listenerYRange!;
    expect(lo).toBeLessThan(activeVariant(p).listener.ears.y);
    expect(hi).toBeGreaterThan(activeVariant(p).listener.ears.y);
    setSeatMode(p, 'free');
    expect(p.constraints.listenerYRange).toBeUndefined();
  });

  it('a range stays ordered and inside the room', () => {
    const p = makeProject();
    setSeatRange(p, 4.9, 1.5);
    expect(p.constraints.listenerYRange).toEqual([1.5, 4.7]);
  });
});

describe('typed values keep a "measured" certainty; dragging does not', () => {
  it('spacing typed after "measured" stays measured; a drag makes it estimated', () => {
    const p = makeProject();
    for (const s of Object.values(activeVariant(p).speakers)) s.certainty = 'measured';
    setSpeakerSpacing(p, 2.2);
    expect(activeVariant(p).speakers.left.certainty).toBe('measured');
    moveSpeaker(p, 'left', { x: 0.9 });
    expect(activeVariant(p).speakers.left.certainty).toBe('estimated');
  });
});

describe('speaker profile files', () => {
  const speaker = () => ({ ...genericSpeaker(), brand: 'Acme', model: 'Studio 5' });

  it('round-trips, and a loaded profile gets a fresh identity', () => {
    const original = speaker();
    const result = parseSpeakerJson(serializeSpeaker(original));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.speaker).toEqual({ ...original, id: result.speaker.id });
      expect(result.speaker.id).not.toBe(original.id);
    }
  });

  it('is named after the speaker, with safe characters', () => {
    expect(speakerFileName(speaker())).toBe('Acme Studio 5.speaker-profile.json');
    expect(speakerFileName({ ...speaker(), brand: 'A/B', model: '' })).toBe(
      'A-B.speaker-profile.json',
    );
    expect(speakerFileName({ ...speaker(), brand: '', model: '' })).toBe(
      'speaker.speaker-profile.json',
    );
  });

  it.each([
    ['not JSON', '{', 'notJson'],
    ['a project file', '{"schemaVersion":1,"id":"x"}', 'notAProfile'],
    ['a newer version', '{"kind":"speaker-profile","schemaVersion":2}', 'newerVersion'],
  ])('rejects %s', (_, text, reason) => {
    expect(parseSpeakerJson(text)).toMatchObject({ ok: false, reason });
  });

  it.each([
    ['a treble range from high to low', { treble: { minDb: 3, maxDb: -3, stepDb: 0.5 } }],
    ['a zero step', { bass: { minDb: -6, maxDb: 6, stepDb: 0 } }],
    ['a wall setting that is not true or false', { wallDistanceSetting: 'yes' }],
  ])('rejects DSP controls with %s', (_, dsp) => {
    const bad = JSON.parse(serializeSpeaker(speaker()));
    bad.speaker.dsp = dsp;
    expect(parseSpeakerJson(JSON.stringify(bad))).toMatchObject({ ok: false, reason: 'invalid' });
  });

  it('rejects out-of-range values with the path', () => {
    const bad = JSON.parse(serializeSpeaker(speaker()));
    bad.speaker.dimensions.w = { value: 99, certainty: 'measured' };
    const result = parseSpeakerJson(JSON.stringify(bad));
    expect(result).toMatchObject({ ok: false, reason: 'invalid' });
    expect(result.ok ? '' : result.detail).toContain('speaker.dimensions.w.value');
  });
});

describe('how widely they spread sound', () => {
  it("doubles or halves the kind's estimated Q", () => {
    const p = makeProject();
    setSpeakerChoice(p, 'kind', 'floorstander');
    const q = KIND_PRESETS.floorstander.qMid;
    expect(dispersionOf(p.speaker)).toBe('typical');
    setSpeakerChoice(p, 'spread', 'narrow');
    expect(p.speaker.directivity.qMid.value).toBe(2 * q);
    expect(dispersionOf(p.speaker)).toBe('narrow');
    setSpeakerChoice(p, 'spread', 'wide');
    expect(p.speaker.directivity.qMid.value).toBe(q / 2);
    expect(dispersionOf(p.speaker)).toBe('wide');
  });

  it('is read from Q for a loaded profile without answers', () => {
    const p = makeProject();
    p.speaker = speakerFromChoices();
    p.speaker.directivity.qMid = { value: 5, certainty: 'measured' };
    expect(dispersionOf(p.speaker)).toBe('narrow');
  });
});
