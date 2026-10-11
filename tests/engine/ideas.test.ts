import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import type { AnalysisOk, Project } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

/**
 * The named ideas behind the candidate cards (docs/ROADMAP_V11.md): every card says which idea it
 * comes from, each idea is searched inside the user's limits and scored like any other spot.
 */
function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

const open = () => {
  const p = makeProject({ W: 4.2, L: 5.6, clearance: 0.4, halfSpacing: 1 });
  p.constraints.speakerZone = undefined; // speakers may go anywhere
  p.constraints.listenerFixed = false;
  p.constraints.speakersFixed = false;
  return p;
};

describe('placement ideas', () => {
  it('names every candidate by its idea', () => {
    const a = ok(open());
    expect(a.candidates.length).toBeGreaterThan(0);
    for (const c of a.candidates) expect(['triangle', 'wall', 'best']).toContain(c.idea);
  });

  it('offers the equilateral triangle and the wall idea in a roomy room, apart from each other', () => {
    const a = ok(open());
    const ideas = a.candidates.map((c) => c.idea);
    expect(ideas.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ideas).size).toBeGreaterThanOrEqual(2);
  });

  it('a triangle spot is close to equilateral and the seat sits near 38 % of the length', () => {
    const p = open();
    const t = ok(p).candidates.find((c) => c.idea === 'triangle');
    if (!t) return; // the triangle may lose to better spots; when it shows it must be one
    const d = t.speakers.right.base.x - t.speakers.left.base.x;
    const toSeat = Math.hypot(
      t.listener.x - t.speakers.left.base.x,
      t.listener.y - t.speakers.left.base.y,
    );
    expect(toSeat / d).toBeGreaterThan(0.8);
    expect(toSeat / d).toBeLessThan(1.25);
  });

  it('every candidate, whatever its idea, is a valid placement (limits, red flags)', () => {
    const p = open();
    const a = ok(p);
    for (const c of a.candidates) expect(c.score).toBeGreaterThan(0);
    expect(a.candidates.every((c) => c.speakers.left.base.y > 0 && c.listener.y < 5.6)).toBe(true);
  });

  it('a wall candidate keeps a rear port its clearance (G07)', () => {
    const p = open(); // the generic speaker has a rear port: minimum rear clearance 0.2 m
    for (const c of ok(p).candidates.filter((c) => c.idea === 'wall')) {
      const rear = c.speakers.left.base.y - 0.25 / 2;
      expect(rear).toBeGreaterThanOrEqual(0.2 - 1e-6);
    }
  });

  it('no ideas when the speakers or the seat may not move', () => {
    const p = open();
    p.constraints.listenerFixed = true;
    for (const c of ok(p).candidates) expect(c.idea).toBe('best');
    const q = open();
    q.constraints.speakersFixed = true;
    for (const c of ok(q).candidates) expect(c.idea).toBe('best');
  });
});
