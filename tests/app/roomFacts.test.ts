import { beforeAll, describe, expect, it, vi } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import type { AnalysisOk } from '../../src/engine/types';
import { nearestNote, roomFound } from '../../src/app/findings/roomFacts';
import { i18n } from '../../src/i18n/locale.svelte';
import { makeProject } from '../fixtures/projects';

beforeAll(() => vi.stubGlobal('document', { documentElement: {} }));

describe('what we found', () => {
  it('names the nearest note: A4 is 440 Hz, G1 is about 49 Hz', () => {
    expect(nearestNote(440)).toEqual({ index: 9, octave: 4 });
    expect(nearestNote(49)).toEqual({ index: 7, octave: 1 });
    expect(nearestNote(27.5)).toEqual({ index: 9, octave: 0 });
  });

  it('says the room’s character and its deepest note in words; numbers only when asked', () => {
    i18n.locale = 'en';
    const ok = analyze(makeProject({ W: 4, L: 5 })) as AnalysisOk;
    // A 5 m long room: the first length resonance is c / (2 L) ≈ 34 Hz, close to a C♯1.
    const plain = roomFound(ok, false);
    expect(plain).toMatch(/room/);
    expect(plain).toContain('very low C♯');
    expect(plain).not.toMatch(/\d/);
    expect(roomFound(ok, true)).toMatch(/C♯1, 3\d\sHz/);
  });
});
