import { describe, expect, it } from 'vitest';
import candidates from '../../data/speakers/candidates.json';
import { SPEAKER_KINDS } from '../../src/engine/presets/speakerKinds';
import {
  checkDraft,
  clean,
  mmIn,
  numbersIn,
  quoteIn,
  type Draft,
} from '../../src/engine/speakers/verify';
import { speakerId, validateEntry, type SpeakerEntry } from '../../src/engine/speakers/entry';
import { f6From } from '../../src/engine/speakers/bass';
import { speakerHighPass } from '../../src/engine/rules/P09-bass-response';

/** An invented spec page: the checker is tested on made-up text, never on a real product. */
const PAGE = `
Example Audio Model One — two-way bookshelf speaker
Dimensions (H x W x D): 305 x 180 x 252 mm (12.0 x 7.1 x 9.9 in)
Rear-firing bass reflex port. Aluminium dome tweeter on a waveguide.
Place at least 20 cm from the wall behind. A boundary EQ switch sets wall or free-standing placement.
Bass and treble controls on the rear panel. Tweeter centre 220 mm above the base.
Frequency response: 48 Hz – 22 kHz (-6 dB), ±3 dB 55 Hz – 20 kHz
Weight: 5,2 kg
`;

const draft = (over: Partial<Draft> = {}): Draft => ({
  brand: 'Example Audio',
  model: 'Model One',
  status: 'current',
  category: 'passive',
  kind: 'bookshelf',
  url: 'https://example.com/model-one',
  retrieved: '2026-10-07',
  source: 'spec-text',
  sizeMm: {
    value: { h: 305, w: 180, d: 252 },
    quote: 'Dimensions (H x W x D): 305 x 180 x 252 mm',
  },
  enclosure: { value: 'ported', quote: 'Rear-firing bass reflex port' },
  port: { value: 'rear', quote: 'Rear-firing bass reflex port' },
  drivers: { value: 'two-way', quote: 'two-way bookshelf speaker' },
  bass: { value: { hz: 48, db: 6 }, quote: 'Frequency response: 48 Hz – 22 kHz (-6 dB)' },
  ...over,
});

describe('reading numbers and quotes', () => {
  it('normalises spaces, dashes and case before comparing', () => {
    expect(clean('Rear –‑Firing   Port')).toBe('rear --firing port');
    expect(quoteIn('REAR-firing  bass reflex port', PAGE)).toBe(true);
    expect(quoteIn('a quote that is not there', PAGE)).toBe(false);
    expect(quoteIn('port', PAGE)).toBe(false); // too short to mean anything
  });

  it('reads decimal commas, decimal points and thousands', () => {
    expect(numbersIn('5,2 kg')).toContain(5.2);
    expect(numbersIn('12.0 in')).toContain(12);
    expect(numbersIn('1,200 mm')).toEqual(expect.arrayContaining([1200]));
    expect(numbersIn('1.200 mm')).toEqual(expect.arrayContaining([1200, 1.2]));
    expect(numbersIn('1.234,5 mm')).toContain(1234.5);
  });

  it('finds a size printed in mm, cm or inches, within rounding', () => {
    expect(mmIn(305, '305 mm')).toBe(true);
    expect(mmIn(305, '30.5 cm')).toBe(true);
    expect(mmIn(305, '12.0 in')).toBe(true);
    expect(mmIn(305, '12 in')).toBe(true);
    expect(mmIn(305, '310 mm')).toBe(false);
    expect(mmIn(305, '11 in')).toBe(false);
  });
});

describe('checking a draft against its page', () => {
  it('accepts a correct draft and keeps only values and links, no quotes', () => {
    const r = checkDraft(draft(), PAGE);
    expect(r.rejected).toEqual([]);
    expect(r.entry?.id).toBe('example-audio-model-one');
    expect(r.entry?.sizeMm).toEqual({
      value: { h: 305, w: 180, d: 252 },
      url: 'https://example.com/model-one',
      retrieved: '2026-10-07',
      via: 'spec-text',
    });
    expect(JSON.stringify(r.entry)).not.toMatch(/quote/);
    expect(JSON.stringify(r.entry)).not.toContain('Aluminium');
    expect(r.review).toEqual([]);
  });

  it('rejects a quote that is not on the page (an invented one)', () => {
    const required = checkDraft(
      draft({ enclosure: { value: 'sealed', quote: 'Sealed, acoustic suspension cabinet' } }),
      PAGE,
    );
    expect(required.entry).toBeNull();
    expect(required.rejected).toEqual([
      { field: 'enclosure', reason: 'the quote is not in the page' },
    ]);
    // An optional fact that fails is left out; the rest of the entry stands.
    const optional = checkDraft(
      draft({ port: { value: 'front', quote: 'Front-firing bass reflex port' } }),
      PAGE,
    );
    expect(optional.entry?.port).toBeUndefined();
    expect(optional.rejected).toEqual([{ field: 'port', reason: 'the quote is not in the page' }]);
  });

  it('rejects a value the quote does not support', () => {
    const wrongPort = checkDraft(
      draft({ port: { value: 'front', quote: 'Rear-firing bass reflex port' } }),
      PAGE,
    );
    expect(wrongPort.rejected[0]?.field).toBe('port');
    expect(wrongPort.entry?.port).toBeUndefined();
    const wrongSize = checkDraft(
      draft({
        sizeMm: {
          value: { h: 350, w: 180, d: 252 },
          quote: 'Dimensions (H x W x D): 305 x 180 x 252 mm',
        },
      }),
      PAGE,
    );
    expect(wrongSize.rejected[0]).toEqual({ field: 'sizeMm', reason: 'not in the quote: h' });
    const wrongHz = checkDraft(
      draft({
        bass: { value: { hz: 38, db: 6 }, quote: 'Frequency response: 48 Hz – 22 kHz (-6 dB)' },
      }),
      PAGE,
    );
    expect(wrongHz.rejected[0]?.reason).toBe('38 is not in the quote');
  });

  it('does not take a ± tolerance band for the bass limit', () => {
    const r = checkDraft(
      draft({
        bass: { value: { hz: 55, db: 3 }, quote: '±3 dB 55 Hz – 20 kHz' },
      }),
      PAGE,
    );
    expect(r.entry).not.toBeNull();
    expect(r.review).toEqual([
      { field: 'bass', reason: '± dB is a tolerance band, not the bass limit' },
    ]);
  });

  it('refuses a dB level the quote does not name, and asks for a look when none is named', () => {
    const wrong = checkDraft(
      draft({
        bass: { value: { hz: 48, db: 3 }, quote: 'Frequency response: 48 Hz – 22 kHz (-6 dB)' },
      }),
      PAGE,
    );
    expect(wrong.rejected[0]?.reason).toBe('the quote does not say 3 dB');
    const unstated = checkDraft(
      draft({ bass: { value: { hz: 48, db: null }, quote: 'Frequency response: 48 Hz – 22 kHz' } }),
      PAGE,
    );
    expect(unstated.entry?.bass?.value).toEqual({ hz: 48, db: null });
    expect(unstated.review[0]?.reason).toBe('the quote does not say which dB level');
  });

  it('asks a person to look when the sizes are not labelled', () => {
    const page = `${PAGE}\nSize: 305 x 180 x 252 mm`;
    const r = checkDraft(
      draft({ sizeMm: { value: { h: 305, w: 180, d: 252 }, quote: 'Size: 305 x 180 x 252 mm' } }),
      page,
    );
    expect(r.entry).not.toBeNull();
    expect(r.review[0]?.field).toBe('sizeMm');
  });

  it('reads which size is which from an H x W x D header, and refuses a swap', () => {
    const swapped = checkDraft(
      draft({
        sizeMm: {
          value: { h: 180, w: 305, d: 252 },
          quote: 'Dimensions (H x W x D): 305 x 180 x 252 mm',
        },
      }),
      PAGE,
    );
    expect(swapped.entry).toBeNull();
    expect(swapped.rejected[0]?.reason).toMatch(/H x W x D order/);
    const inches = checkDraft(
      draft({ sizeMm: { value: { h: 305, w: 180, d: 252 }, quote: '(12.0 x 7.1 x 9.9 in)' } }),
      PAGE,
    );
    expect(inches.entry).not.toBeNull(); // unlabelled: a person looks
    expect(inches.review[0]?.field).toBe('sizeMm');
  });

  it('is not fooled by a missing required field or an optional one left out', () => {
    expect(checkDraft(draft({ enclosure: undefined }), PAGE).rejected).toEqual([
      { field: 'enclosure', reason: 'missing' },
    ]);
    const r = checkDraft(draft({ port: undefined, bass: undefined }), PAGE);
    expect(r.entry?.port).toBeUndefined();
    expect(r.entry?.bass).toBeUndefined();
  });

  it('rejects an unbelievable whole: a floorstander that is 30 cm tall, a sealed box with a port', () => {
    const tall = checkDraft(draft({ kind: 'floorstander' }), PAGE);
    expect(tall.entry).toBeNull();
    expect(tall.rejected.some((f) => f.field === 'entry' && /unusual/.test(f.reason))).toBe(true);
    const sealedWithPort = checkDraft(
      draft({ enclosure: { value: 'sealed', quote: 'bass reflex port, sealed' } }),
      `${PAGE}\nbass reflex port, sealed`,
    );
    expect(sealedWithPort.entry).toBeNull();
  });
});

describe('the optional facts (tier B and C)', () => {
  it('reads a minimum wall distance, a position setting, tone controls and a tweeter height', () => {
    const r = checkDraft(
      draft({
        minWallMm: { value: 200, quote: 'Place at least 20 cm from the wall behind.' },
        positionSetting: {
          value: true,
          quote: 'A boundary EQ switch sets wall or free-standing placement.',
        },
        controls: {
          value: { bass: true, treble: true },
          quote: 'Bass and treble controls on the rear panel.',
        },
        tweeterMm: { value: 220, quote: 'Tweeter centre 220 mm above the base.' },
      }),
      PAGE,
    );
    expect(r.rejected).toEqual([]);
    expect(r.entry?.minWallMm?.value).toBe(200);
    expect(r.entry?.positionSetting?.value).toBe(true);
    expect(r.entry?.controls?.value).toEqual({ bass: true, treble: true });
    expect(r.entry?.tweeterMm?.value).toBe(220);
  });

  it('reads a port from a "reflex tube" on the rear, and "HF trim" as a treble control', () => {
    const page = `${PAGE}
The reflex tube ends in a flare on the rear of the enclosure.
An HF trim switch adjusts the high-frequency response.
High Shelf EQ > 5 kHz: -2 dB, 0 dB, +2 dB. Low Shelf EQ < 300 Hz: -2 dB, 0 dB, +2 dB.`;
    const r = checkDraft(
      draft({
        port: {
          value: 'rear',
          quote: 'The reflex tube ends in a flare on the rear of the enclosure.',
        },
        controls: {
          value: { bass: false, treble: true },
          quote: 'An HF trim switch adjusts the high-frequency response.',
        },
      }),
      page,
    );
    expect(r.rejected).toEqual([]);
    expect(r.entry?.port?.value).toBe('rear');
    expect(r.entry?.controls?.value).toEqual({ bass: false, treble: true });
    const shelves = checkDraft(
      draft({
        controls: {
          value: { bass: true, treble: true },
          quote:
            'High Shelf EQ > 5 kHz: -2 dB, 0 dB, +2 dB. Low Shelf EQ < 300 Hz: -2 dB, 0 dB, +2 dB.',
        },
      }),
      page,
    );
    expect(shelves.entry?.controls?.value).toEqual({ bass: true, treble: true });
    // A front-facing tube is not read as a rear port.
    const front = checkDraft(
      draft({ port: { value: 'rear', quote: 'Rear-firing bass reflex port' } }),
      PAGE,
    );
    expect(front.rejected).toEqual([]);
    const wrong = checkDraft(
      draft({
        port: {
          value: 'front',
          quote: 'The reflex tube ends in a flare on the rear of the enclosure.',
        },
      }),
      page,
    );
    expect(wrong.rejected.some((f) => f.field === 'port')).toBe(true);
  });

  it('a third-party listing is trusted for size, cabinet and drivers only', () => {
    const r = checkDraft(
      draft({
        source: 'listing',
        url: 'https://example.com/a-shop/model-one',
        controls: {
          value: { bass: true, treble: true },
          quote: 'Bass and treble controls on the rear panel.',
        },
        minWallMm: { value: 200, quote: 'Place at least 20 cm from the wall behind.' },
      }),
      PAGE,
    );
    expect(r.entry?.sizeMm.via).toBe('listing');
    expect(r.entry?.enclosure.via).toBe('listing');
    // The bass figure and the port in the draft are refused too: only the maker may say them.
    for (const f of ['bass', 'port', 'controls', 'minWallMm']) {
      expect(
        r.rejected.some((x) => x.field === f),
        f,
      ).toBe(true);
    }
    expect(r.entry?.bass).toBeUndefined();
    expect(r.entry?.port).toBeUndefined();
    expect(r.entry?.controls).toBeUndefined();
  });

  it('lets the owner confirm the cabinet and the port, and nothing else', () => {
    const r = checkDraft(
      draft({
        enclosure: { value: 'ported', ownerConfirmed: true },
        port: { value: 'rear', ownerConfirmed: true },
      }),
      PAGE,
    );
    expect(r.entry?.enclosure.via).toBe('owner-confirmed');
    expect(r.entry?.port?.via).toBe('owner-confirmed');
    expect(r.review.some((f) => f.field === 'port')).toBe(true);
    const bass = checkDraft(
      draft({ bass: { value: { hz: 40, db: 6 }, ownerConfirmed: true } }),
      PAGE,
    );
    expect(bass.rejected.some((f) => f.field === 'bass')).toBe(true);
    expect(bass.entry?.bass).toBeUndefined();
  });

  it('refuses a control the quote does not name, and a tweeter above the cabinet', () => {
    const r = checkDraft(
      draft({
        controls: { value: { bass: true, treble: true }, quote: 'Rear-firing bass reflex port' },
      }),
      PAGE,
    );
    expect(r.rejected[0]).toEqual({
      field: 'controls',
      reason: 'the quote does not name a treble control',
    });
    const page = `${PAGE}
Tweeter centre 400 mm above the base.`;
    const high = checkDraft(
      draft({ tweeterMm: { value: 400, quote: 'Tweeter centre 400 mm above the base.' } }),
      page,
    );
    expect(high.entry).toBeNull();
    expect(high.rejected.some((f) => /within the cabinet/.test(f.reason))).toBe(true);
  });

  it('a bass figure that depends on a setting has to say so', () => {
    const r = checkDraft(
      draft({
        bass: {
          value: { hz: 48, db: 6, dependsOnSetting: true },
          quote: 'Frequency response: 48 Hz – 22 kHz (-6 dB)',
        },
      }),
      PAGE,
    );
    expect(r.rejected[0]?.reason).toBe('the quote does not say the figure depends on a setting');
  });
});

describe('a port seen only on the maker’s photos', () => {
  it('is kept only with a person’s confirmation, and says how it was found', () => {
    const unconfirmed = checkDraft(draft({ port: { value: 'rear', seenOnPhotos: true } }), PAGE);
    expect(unconfirmed.entry?.port).toBeUndefined();
    expect(unconfirmed.rejected).toEqual([
      { field: 'port', reason: 'seen on photos: a person has to confirm it' },
    ]);
    const confirmed = checkDraft(
      draft({ port: { value: 'rear', seenOnPhotos: true, confirmedBy: 'owner' } }),
      PAGE,
    );
    expect(confirmed.entry?.port).toMatchObject({ value: 'rear', via: 'photo-confirmed' });
    expect(confirmed.review).toContainEqual({
      field: 'port',
      reason: "confirmed from the maker's photos by owner",
    });
  });

  it('is never enough for a size or a bass figure: those need words on a page', () => {
    const r = checkDraft(
      draft({
        sizeMm: { value: { h: 305, w: 180, d: 252 }, seenOnPhotos: true, confirmedBy: 'owner' },
      }),
      PAGE,
    );
    expect(r.entry).toBeNull();
    expect(r.rejected[0]).toEqual({
      field: 'sizeMm',
      reason: 'this needs words on a page, not a photo',
    });
  });
});

describe('the entry format', () => {
  const base = checkDraft(draft(), PAGE).entry as SpeakerEntry;

  it('makes ids from brand and model', () => {
    expect(speakerId('KEF', 'LS50 Meta')).toBe('kef-ls50-meta');
    expect(speakerId('Bowers & Wilkins', '606 S3')).toBe('bowers-and-wilkins-606-s3');
    expect(speakerId('Dynaudio', 'Evoke 10')).toBe('dynaudio-evoke-10');
    expect(speakerId('Genelec', '8030C')).toBe('genelec-8030c');
  });

  it('wants a link to read it on and the day it was read', () => {
    expect(validateEntry(base)).toEqual([]);
    const http = { ...base, sizeMm: { ...base.sizeMm, url: 'http://example.com' } };
    expect(validateEntry(http)).toContain('a source must be an https link');
    const undated = { ...base, bass: { ...base.bass!, retrieved: 'yesterday' } };
    expect(validateEntry(undated)).toContain('a source needs the date it was read');
  });
});

describe('the candidate list', () => {
  const { speakers } = candidates as { speakers: Candidate[] };
  interface Candidate {
    id: string;
    brand: string;
    model: string;
    batch: 'pilot' | 'vintage';
    category: string;
    kind: string;
    special?: string;
  }

  it('has a pilot of 50 and a vintage batch, every id unique and made from brand and model', () => {
    expect(speakers.filter((s) => s.batch === 'pilot')).toHaveLength(50);
    expect(speakers.filter((s) => s.batch === 'vintage').length).toBeGreaterThanOrEqual(8);
    expect(new Set(speakers.map((s) => s.id)).size).toBe(speakers.length);
    for (const s of speakers) expect(s.id).toBe(speakerId(s.brand, s.model));
  });

  it('has at least ten all-in-one systems (the owner’s favourite)', () => {
    expect(speakers.filter((s) => s.category === 'all-in-one').length).toBeGreaterThanOrEqual(10);
  });

  it('uses only known categories and kinds, and flags what the box model does not describe', () => {
    for (const s of speakers) {
      expect(['passive', 'active', 'all-in-one']).toContain(s.category);
      expect(SPEAKER_KINDS as readonly string[]).toContain(s.kind);
    }
    const special = speakers.filter((s) => s.special).map((s) => s.brand);
    expect(special).toEqual(expect.arrayContaining(['ESS', 'Quad', 'Magnepan']));
  });
});

describe('the bass figure, moved to −6 dB along P09’s own roll-off', () => {
  const level = (f: number, f6: number, sealed: boolean) =>
    20 * Math.log10(speakerHighPass(f, f6, sealed));

  it('puts a −3 or −10 dB figure exactly at that level on the curve P09 draws', () => {
    for (const sealed of [true, false]) {
      for (const db of [3, 10] as const) {
        const { f6, assumed } = f6From({ hz: 45, db }, sealed);
        expect(assumed).toBe(false);
        expect(level(45, f6, sealed)).toBeCloseTo(-db, 6);
      }
    }
  });

  it('matches the plan’s rule of thumb: ×0.76 sealed, ×0.87 ported from −3 dB', () => {
    expect(f6From({ hz: 100, db: 3 }, true).f6).toBeCloseTo(76, 0);
    expect(f6From({ hz: 100, db: 3 }, false).f6).toBeCloseTo(87, 0);
    expect(f6From({ hz: 100, db: 10 }, true).f6).toBeCloseTo(132, 0);
    expect(f6From({ hz: 100, db: 10 }, false).f6).toBeCloseTo(115, 0);
  });

  it('keeps a −6 dB figure, and takes an unstated one as −6 dB but says it assumed so', () => {
    expect(f6From({ hz: 48, db: 6 }, false)).toEqual({ f6: 48, assumed: false });
    expect(f6From({ hz: 48, db: null }, false)).toEqual({ f6: 48, assumed: true });
  });
});
