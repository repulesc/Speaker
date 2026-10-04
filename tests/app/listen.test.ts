import { describe, expect, it } from 'vitest';
import { agreement, type RatedSetup } from '../../src/app/listen/agreement';
import { addNote, ratingsBySetup, removeNote, setupKey } from '../../src/app/listen/notes';
import { SIZE_LIMITS } from '../../src/app/state/limits';
import { createDefaultProject } from '../../src/app/state/defaults';

const setup = (name: string, score: number | null, ratings: number[]): RatedSetup => ({
  id: name,
  name,
  score,
  ratings,
});

describe('agreement between ears and ranking', () => {
  it('needs two rated setups that differ', () => {
    expect(agreement([setup('A', 0.8, [4])]).verdict).toBe('not-enough');
    expect(agreement([setup('A', 0.8, [4]), setup('B', 0.5, [])]).verdict).toBe('not-enough');
    expect(agreement([setup('A', null, [4]), setup('B', 0.5, [2])]).verdict).toBe('not-enough');
  });

  it('ignores ties on either side', () => {
    expect(agreement([setup('A', 0.8, [4]), setup('B', 0.5, [4])]).verdict).toBe('not-enough');
    expect(agreement([setup('A', 0.8, [4]), setup('B', 0.76, [2])]).verdict).toBe('not-enough');
  });

  it('agrees when the higher-rated setup scores higher', () => {
    const r = agreement([setup('A', 0.8, [4, 5]), setup('B', 0.5, [2])]);
    expect(r).toMatchObject({ verdict: 'agree', agree: 1, disagree: 0, ears: 'A', app: 'A' });
  });

  it('disagrees, and names both favourites, when the ears prefer the lower score', () => {
    const r = agreement([setup('A', 0.8, [2]), setup('B', 0.5, [5])]);
    expect(r).toMatchObject({ verdict: 'disagree', ears: 'B', app: 'A' });
  });

  it('is mixed when some pairs agree and some do not', () => {
    const r = agreement([setup('A', 0.9, [5]), setup('B', 0.6, [3]), setup('C', 0.3, [4])]);
    expect(r.verdict).toBe('mixed');
  });
});

describe('listening notes', () => {
  const fresh = () => createDefaultProject({ name: '', system: 'metric' });

  it('adds and removes notes, keeping only what was given', () => {
    const p = fresh();
    addNote(p, { variantId: 'v', setupKey: 'k', symptoms: ['S01'], rating: 4, text: '  boomy  ' });
    addNote(p, { variantId: 'v', setupKey: 'k', symptoms: [] });
    expect(p.notes[0]).toMatchObject({ variantId: 'v', setupKey: 'k', rating: 4, text: 'boomy' });
    expect(p.notes[1]).not.toHaveProperty('rating');
    expect(p.notes[1]).not.toHaveProperty('text');
    removeNote(p, p.notes[0]!.id);
    expect(p.notes).toHaveLength(1);
  });

  it('drops the oldest note at the limit', () => {
    const p = fresh();
    for (let i = 0; i < SIZE_LIMITS.notes + 5; i++) {
      addNote(p, { variantId: 'v', setupKey: 'k', symptoms: [], text: String(i) });
    }
    expect(p.notes).toHaveLength(SIZE_LIMITS.notes);
    expect(p.notes[0]!.text).toBe('5');
  });

  it('counts a rating only while the setup is as it was when rated (R3 review F2)', () => {
    const p = fresh();
    const v = p.variants[0]!;
    addNote(p, { variantId: v.id, setupKey: setupKey(v), symptoms: [], rating: 3 });
    addNote(p, { variantId: v.id, setupKey: setupKey(v), symptoms: [], rating: 5 });
    addNote(p, { variantId: v.id, setupKey: setupKey(v), symptoms: [] });
    expect(ratingsBySetup(p.notes, p.variants).get(v.id)).toEqual([3, 5]);

    v.listener.ears.y += 0.2; // the seat moved: the ears now hear something else
    expect(ratingsBySetup(p.notes, p.variants).has(v.id)).toBe(false);
    v.listener.ears.y -= 0.2;
    expect(ratingsBySetup(p.notes, p.variants).get(v.id)).toEqual([3, 5]);
  });

  it('the setup key ignores sub-centimetre noise but sees toe-in and objects', () => {
    const p = fresh();
    const v = p.variants[0]!;
    const before = setupKey(v);
    v.speakers.left.base.x += 0.001;
    expect(setupKey(v)).toBe(before);
    v.speakers.left.toeInDeg += 5;
    expect(setupKey(v)).not.toBe(before);
  });
});
