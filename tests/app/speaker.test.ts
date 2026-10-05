import { describe, expect, it } from 'vitest';
import { SPEAKER_TYPES } from '../../src/engine/presets/speakerTypes';
import { activeVariant, moveSpeaker, setSpeakerSpacing } from '../../src/app/plan/placement';
import {
  applySpeakerType,
  parseSpeakerJson,
  seatMode,
  serializeSpeaker,
  setSeatMode,
  setSeatRange,
  speakerFileName,
  dispersionOf,
  portChoice,
  setDispersion,
  setPort,
  speakerTypeOf,
} from '../../src/app/state/speaker';
import { genericSpeaker, makeProject } from '../fixtures/projects';

describe('speaker types', () => {
  it('apply the type but keep brand, model and identity; everything is an estimate', () => {
    const p = makeProject();
    p.speaker.brand = 'Acme';
    p.speaker.model = 'One';
    const id = p.speaker.id;
    const type = SPEAKER_TYPES.find((t) => t.id === 'floorstander-front-port')!;
    applySpeakerType(p, type.id);
    expect(p.speaker).toMatchObject({ id, brand: 'Acme', model: 'One' });
    expect(p.speaker.portLocation).toEqual({ value: 'front', certainty: 'estimated' });
    expect(p.speaker.dimensions.h.value).toBe(type.h);
    expect(p.speaker.provenance.verified).toBe(false);
  });

  it('an unknown type id changes nothing', () => {
    const p = makeProject();
    const before = JSON.stringify(p.speaker);
    applySpeakerType(p, 'nope');
    expect(JSON.stringify(p.speaker)).toBe(before);
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

describe('the quick speaker questions (survey, docs/ROADMAP_V5.md)', () => {
  it('the port changes the enclosure and port, and keeps the type', () => {
    const p = makeProject();
    applySpeakerType(p, 'small-bookshelf-rear-port');
    setPort(p, 'sealed');
    expect(p.speaker.enclosure.value).toBe('sealed');
    expect(p.speaker.portLocation.value).toBe('none');
    expect(portChoice(p.speaker)).toBe('sealed');
    expect(speakerTypeOf(p.speaker)?.id).toBe('small-bookshelf-rear-port');
    setPort(p, 'front');
    expect(p.speaker.enclosure.value).toBe('ported');
    expect(portChoice(p.speaker)).toBe('front');
    expect(p.speaker.portLocation.certainty).toBe('estimated');
  });

  it('two floorstanders that differ only in their port are told apart by it', () => {
    const p = makeProject();
    applySpeakerType(p, 'floorstander-rear-port');
    expect(speakerTypeOf(p.speaker)?.id).toBe('floorstander-rear-port');
    setPort(p, 'front');
    expect(speakerTypeOf(p.speaker)?.id).toBe('floorstander-front-port');
  });

  it("dispersion doubles or halves the type's estimated Q, never below 1", () => {
    const p = makeProject();
    applySpeakerType(p, 'floorstander-front-port');
    const q = SPEAKER_TYPES.find((t) => t.id === 'floorstander-front-port')!.qMid;
    expect(dispersionOf(p.speaker)).toBe('typical');
    setDispersion(p, 'narrow');
    expect(p.speaker.directivity.qMid.value).toBe(2 * q);
    expect(dispersionOf(p.speaker)).toBe('narrow');
    setDispersion(p, 'wide');
    expect(p.speaker.directivity.qMid.value).toBe(Math.max(1, q / 2));
    expect(dispersionOf(p.speaker)).toBe('wide');
    setDispersion(p, 'typical');
    expect(p.speaker.directivity.qMid.value).toBe(q);
  });
});
