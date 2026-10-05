import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import type { AnalysisOk, Project } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

/**
 * The speaker zone (docs/DESIGN_BRIEF_V4.md): suggestions keep each speaker within a circle around
 * where it stands now, and say what the limit costs when that is worth knowing.
 */
function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

const offset = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe('speaker zone', () => {
  it('keeps every suggested speaker within the zone around where it stands', () => {
    const p = makeProject({ clearance: 0.2, halfSpacing: 0.7 });
    p.constraints.speakerZone = 0.3;
    const a = ok(p);
    const now = p.variants[0]!.speakers;
    expect(a.candidates.length).toBeGreaterThan(0);
    for (const c of a.candidates) {
      expect(offset(c.speakers.left.base, now.left.base)).toBeLessThanOrEqual(0.3 + 1e-6);
      expect(offset(c.speakers.right.base, now.right.base)).toBeLessThanOrEqual(0.3 + 1e-6);
    }
  });

  it('without a zone the speakers may go further', () => {
    const p = makeProject({ clearance: 0.2, halfSpacing: 0.7 });
    const now = p.variants[0]!.speakers;
    const far = ok(p).candidates.some((c) => offset(c.speakers.left.base, now.left.base) > 0.3);
    expect(far).toBe(true);
  });

  it('says what a tight zone costs, comparing like with like', () => {
    const p = makeProject({ clearance: 0.1, halfSpacing: 0.5 });
    p.constraints.speakerZone = 0.2;
    const cost = ok(p).candidates[0]?.zoneCost;
    expect(cost).toBeDefined();
    expect(cost!.outside - cost!.inside).toBeGreaterThanOrEqual(0.05);
    // A roomy zone around a decent setup costs nothing worth saying.
    const roomy = makeProject({ clearance: 0.3, halfSpacing: 0.6 });
    roomy.constraints.speakerZone = 0.2;
    expect(ok(roomy).candidates[0]?.zoneCost).toBeUndefined();
  });

  it('is ignored around placeholder speakers (not placed by the user yet)', () => {
    const p = makeProject({ clearance: 0.2, halfSpacing: 0.7 });
    p.constraints.speakerZone = 0.1;
    p.variants[0]!.speakers.left.certainty = 'unknown';
    p.variants[0]!.speakers.right.certainty = 'unknown';
    const now = p.variants[0]!.speakers;
    const a = ok(p);
    expect(a.candidates.some((c) => offset(c.speakers.left.base, now.left.base) > 0.1)).toBe(true);
    expect(a.candidates.every((c) => c.zoneCost === undefined)).toBe(true);
  });
});
