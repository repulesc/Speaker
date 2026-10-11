import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { isConverged } from '../../src/engine/converged';
import { applyCandidate, activeVariant, moveSpeaker } from '../../src/app/plan/placement';
import { parseProjectJson, serializeProject } from '../../src/app/state/projectFile';
import type { AnalysisOk, Project } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

/** Apply, then nothing new until something moves (docs/ROADMAP_V11.md). */
const open = () => {
  const p = makeProject({ W: 4.2, L: 5.6, clearance: 0.4, halfSpacing: 1 });
  p.constraints.listenerFixed = false;
  p.constraints.speakersFixed = false;
  return p;
};
const ok = (p: Project) => analyze(p) as AnalysisOk;

describe('the converged state after Apply', () => {
  it('Apply records where things stand and the idea; nothing is suggested from there', () => {
    const p = open();
    const best = ok(p).candidates[0]!;
    expect(isConverged(p)).toBe(false);
    applyCandidate(p, best);
    expect(activeVariant(p).applied?.idea).toBe(best.idea);
    expect(isConverged(p)).toBe(true);
    const after = ok(p);
    expect(after.converged).toBe(true);
    expect(after.candidates).toEqual([]);
  });

  it('moving a speaker, the seat, or editing the room or the speaker ends it', () => {
    const fresh = () => {
      const p = open();
      applyCandidate(p, ok(p).candidates[0]!);
      return p;
    };
    const moved = fresh();
    moveSpeaker(moved, 'left', { x: activeVariant(moved).speakers.left.base.x + 0.05 });
    expect(isConverged(moved)).toBe(false);

    const seat = fresh();
    activeVariant(seat).listener.ears.y += 0.05;
    expect(isConverged(seat)).toBe(false);

    const room = fresh();
    room.room.width = { value: 4.4, certainty: 'measured' };
    expect(isConverged(room)).toBe(false);

    const speaker = fresh();
    speaker.speaker.lowFrequencyMinus6dB = { value: 40, certainty: 'measured' };
    expect(isConverged(speaker)).toBe(false);
    expect(ok(speaker).candidates.length).toBeGreaterThan(0);
  });

  it('a change under a centimetre does not end it (typed rounding)', () => {
    const p = open();
    applyCandidate(p, ok(p).candidates[0]!);
    activeVariant(p).listener.ears.y += 0.004;
    expect(isConverged(p)).toBe(true);
  });

  it('"Look again" (clearing the record) brings the suggestions back', () => {
    const p = open();
    applyCandidate(p, ok(p).candidates[0]!);
    delete activeVariant(p).applied;
    expect(isConverged(p)).toBe(false);
    expect(ok(p).candidates.length).toBeGreaterThan(0);
  });

  it('survives saving and opening the room (it travels in the file and the link)', () => {
    const p = open();
    applyCandidate(p, ok(p).candidates[0]!);
    const back = parseProjectJson(serializeProject(p));
    expect(back.ok).toBe(true);
    if (back.ok) expect(isConverged(back.project)).toBe(true);
  });
});
