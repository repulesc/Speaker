import { describe, expect, it } from 'vitest';
import { countDone, setupProgress } from '../../src/app/state/progress';
import { makeProject, measured } from '../fixtures/projects';

describe('setup progress', () => {
  it('starts mostly open and fills in as the user answers', () => {
    const p = makeProject();
    p.room.height = { value: null, certainty: 'unknown' };
    p.variants[0]!.speakers.left.certainty = 'unknown';
    p.surfaces.baseCertainty = {
      front: 'unknown',
      back: 'unknown',
      left: 'unknown',
      right: 'unknown',
      floor: 'unknown',
      ceiling: 'unknown',
    };
    delete p.variants[0]!.busyness;
    p.variants[0]!.objects = [];
    const before = setupProgress(p);
    expect(before.furnishing).toBe('todo');
    expect(before.room).toBe('partial'); // two of three sizes
    expect(before.surfaces).toBe('todo');
    expect(before.speakers).toBe('todo');

    p.room.height = measured(2.5);
    p.surfaces.baseCertainty.floor = 'estimated';
    p.variants[0]!.speakers.left.certainty = 'estimated';
    p.goals.weights = { 'wide-stage': 2 };
    const after = setupProgress(p);
    expect(after.room).toBe('done');
    expect(after.surfaces).toBe('partial');
    expect(after.speakers).toBe('done');
    expect(after.goals).toBe('done');
    expect(countDone(after)).toBe(3);
  });
});
