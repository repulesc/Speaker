import { describe, expect, it } from 'vitest';
import { agreement, type RatedSetup } from '../../src/app/listen/agreement';
import { addNote, ratingsBySetup, removeNote } from '../../src/app/listen/notes';
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
    expect(agreement([setup('A', 0.8, [4]), setup('B', 0.79, [2])]).verdict).toBe('not-enough');
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
  it('adds and removes notes, keeping only what was given', () => {
    const p = createDefaultProject({ name: '', system: 'metric' });
    addNote(p, { variantId: 'v', symptoms: ['S01'], rating: 4, text: '  boomy  ' });
    addNote(p, { variantId: 'v', symptoms: [] });
    expect(p.notes[0]).toMatchObject({ variantId: 'v', rating: 4, text: 'boomy' });
    expect(p.notes[1]).not.toHaveProperty('rating');
    expect(p.notes[1]).not.toHaveProperty('text');
    removeNote(p, p.notes[0]!.id);
    expect(p.notes).toHaveLength(1);
  });

  it('drops the oldest note at the limit', () => {
    const p = createDefaultProject({ name: '', system: 'metric' });
    for (let i = 0; i < SIZE_LIMITS.notes + 5; i++) {
      addNote(p, { variantId: 'v', symptoms: [], text: String(i) });
    }
    expect(p.notes).toHaveLength(SIZE_LIMITS.notes);
    expect(p.notes[0]!.text).toBe('5');
  });

  it('collects the ratings per setup', () => {
    const p = createDefaultProject({ name: '', system: 'metric' });
    addNote(p, { variantId: 'a', symptoms: [], rating: 3 });
    addNote(p, { variantId: 'a', symptoms: [], rating: 5 });
    addNote(p, { variantId: 'b', symptoms: [] });
    expect(ratingsBySetup(p.notes).get('a')).toEqual([3, 5]);
    expect(ratingsBySetup(p.notes).has('b')).toBe(false);
  });
});
