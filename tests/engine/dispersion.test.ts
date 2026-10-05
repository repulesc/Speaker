import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import type { AnalysisOk, Project } from '../../src/engine/types';
import { estimated, makeProject } from '../fixtures/projects';

/**
 * Dispersion is an estimate (docs/ROADMAP_V5.md): it may change the listening-distance advice
 * (P10, critical distance) but never the score or the maps.
 */
function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

describe('dispersion', () => {
  it('leaves the score, the candidates and the maps unchanged', () => {
    const typical = makeProject({});
    const narrow = makeProject({});
    narrow.speaker.directivity.qMid = estimated(4);
    const a = ok(typical);
    const b = ok(narrow);
    expect(b.current.score).toBe(a.current.score);
    expect(b.candidates.map((c) => c.score)).toEqual(a.candidates.map((c) => c.score));
    expect(b.heatmap.speakers.values).toEqual(a.heatmap.speakers.values);
    expect(b.layers.values.overall).toEqual(a.layers.values.overall);
  });
});
