import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { setupScore } from '../../src/engine/setupScore';
import type { AnalysisOk } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

describe('setupScore', () => {
  it('gives the same score and bass curve as the full analysis', () => {
    const project = makeProject();
    const full = analyze(project) as AnalysisOk;
    const quick = setupScore(project)!;
    expect(quick.score).toBe(full.current.score);
    expect(quick.bassResponse).toEqual(full.bassResponse);
  });
});
