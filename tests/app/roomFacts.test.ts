import { beforeAll, describe, expect, it, vi } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import type { AnalysisOk } from '../../src/engine/types';
import { roomFound } from '../../src/app/findings/roomFacts';
import { i18n } from '../../src/i18n/locale.svelte';
import { makeProject } from '../fixtures/projects';

beforeAll(() => vi.stubGlobal('document', { documentElement: {} }));

describe('what we found', () => {
  it('says the room’s character and its lowest resonance in hertz; reverberation only when asked', () => {
    i18n.locale = 'en';
    const ok = analyze(makeProject({ W: 4, L: 5 })) as AnalysisOk;
    // A 5 m long room: the first length resonance is c / (2 L) ≈ 34 Hz.
    const plain = roomFound(ok, false);
    expect(plain).toMatch(/room/);
    expect(plain).toMatch(/lowest resonance is at 3\d\sHz/);
    expect(plain).not.toMatch(/Reverberation/);
    expect(roomFound(ok, true)).toMatch(/Reverberation \d(\.\d)? s/);
  });
});
