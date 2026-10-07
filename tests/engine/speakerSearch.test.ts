import { describe, expect, it } from 'vitest';
import candidates from '../../data/speakers/candidates.json';
import { brandsOf, distance, findSpeakers, words } from '../../src/engine/speakers/search';

/** The candidate names: real names to search, no specs needed. */
const list = candidates.speakers;
const first = (q: string) => {
  const s = findSpeakers(list, q)[0];
  return s && `${s.brand} ${s.model}`;
};

describe('Find your speaker: the words', () => {
  it('ignores case, accents and punctuation', () => {
    expect(words('B&W 606'), 'one word').toEqual(['bw', '606']);
    expect(words('Bowers & Wilkins 606 S3')).toEqual(['bowers', 'and', 'wilkins', '606', 's3']);
    expect(words('Kali Audio LP-6')).toEqual(['kali', 'audio', 'lp', '6']);
    expect(words('Élac Débüt')).toEqual(['elac', 'debut']);
  });

  it('writes generations one way: Mk II, MkII, Mark 2, mk2, II', () => {
    for (const q of ['305P Mk II', '305p mkii', '305P Mark 2', '305p mk2', '305P Mk.2']) {
      expect(words(q)).toEqual(['305p', '2']);
    }
    expect(words('LSX II')).toEqual(['lsx', '2']);
  });

  it('counts a swap of neighbours as one slip', () => {
    expect(distance('klipsch', 'klipsch')).toBe(0);
    expect(distance('klipsch', 'kilpsch')).toBe(1);
    expect(distance('wharfdale', 'wharfedale')).toBe(1);
    expect(distance('kef', 'kfe')).toBe(1);
  });
});

describe('Find your speaker: forgiving, never wild', () => {
  it('finds a model by its usual name', () => {
    expect(first('LS50 Meta')).toBe('KEF LS50 Meta');
    expect(first('genelec 8030c')).toBe('Genelec 8030C');
    expect(first('Lumina I')).toBe('Sonus Faber Lumina I');
  });

  it('takes the words in any order', () => {
    expect(first('meta ls50 kef')).toBe('KEF LS50 Meta');
    expect(first('606 bowers')).toBe('Bowers & Wilkins 606 S3');
  });

  it('finds a name while it is still being typed', () => {
    expect(first('buch')).toMatch(/^Buchardt Audio/);
    expect(first('spek')).toBe('Dali Spektor 1');
  });

  it('forgives a slip in a longer word', () => {
    expect(first('Wharfdale Linton')).toBe('Wharfedale Linton');
    expect(first('klipsh heresy')).toBe('Klipsch Heresy');
    expect(first('Dynadio Evoke')).toBe('Dynaudio Evoke 10');
  });

  it('reads a generation however it is written', () => {
    expect(first('jbl 305p mk2')).toBe('JBL 305P MkII');
    expect(first('RP-600M mark ii')).toBe('Klipsch RP-600M II');
    expect(first('lsx 2')).toBe('KEF LSX II');
    expect(first('lumina 1')).toBe('Sonus Faber Lumina I');
  });

  it('reads a model written together or apart', () => {
    expect(first('ls 50 meta')).toBe('KEF LS50 Meta');
    expect(first('lp6')).toBe('Kali Audio LP-6');
    expect(first('kh80')).toBe('Neumann KH 80 DSP');
  });

  it('does not bend numbers: 8020 is not 8030', () => {
    const found = findSpeakers(list, 'genelec 8020').map((s) => s.model);
    expect(found).toEqual(['8020D']);
    expect(findSpeakers(list, '607')).toHaveLength(1);
  });

  it('does not bend short words', () => {
    expect(findSpeakers(list, 'kef').every((s) => s.brand === 'KEF')).toBe(true);
    expect(findSpeakers(list, 'xyz')).toEqual([]);
    expect(findSpeakers(list, '   ')).toEqual([]);
  });

  it('lists a brand’s models, the shorter names first', () => {
    const kef = findSpeakers(list, 'KEF').map((s) => s.model);
    expect(kef).toHaveLength(list.filter((s) => s.brand === 'KEF').length);
    expect(kef[0]).toBe('Q350');
  });

  it('knows other names (aka)', () => {
    const one = [{ brand: 'Bowers & Wilkins', model: '606 S3', aka: ['B&W 606'] }];
    expect(findSpeakers(one, 'b&w 606')).toHaveLength(1);
    expect(findSpeakers(one, 'bw 606')).toHaveLength(1);
  });
});

describe('Browse by brand', () => {
  it('lists each brand once, A to Z, with its number of models', () => {
    const brands = brandsOf(list);
    expect(brands.map((b) => b.brand)).toEqual(
      [...new Set(list.map((s) => s.brand))].sort((a, b) => a.localeCompare(b)),
    );
    expect(brands.find((b) => b.brand === 'KEF')!.count).toBe(
      list.filter((s) => s.brand === 'KEF').length,
    );
  });
});
