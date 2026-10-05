import { describe, expect, it } from 'vitest';
import {
  comparison,
  faceOf,
  hideLiveWithIt,
  liveWithItShown,
  rememberBefore,
  setFace,
} from '../../src/app/listen/liveWithIt';
import { ratingsBySetup } from '../../src/app/listen/notes';
import { applyCandidate } from '../../src/app/plan/placement';
import { projectSchema } from '../../src/app/state/schema';
import { makeProject } from '../fixtures/projects';

function applied() {
  const p = makeProject();
  const v = p.variants[0]!;
  rememberBefore(p, 0.6);
  const speakers = structuredClone(v.speakers);
  speakers.left.base.y += 0.3;
  speakers.right.base.y += 0.3;
  applyCandidate(p, { speakers, listener: v.listener.ears });
  return p;
}

describe('live with it', () => {
  it('shows after Apply, until the setup moves back or it is hidden', () => {
    const p = makeProject();
    expect(liveWithItShown(p)).toBe(false);
    const q = applied();
    expect(liveWithItShown(q)).toBe(true);
    hideLiveWithIt(q);
    expect(liveWithItShown(q)).toBe(false);
    expect(projectSchema(q, 'project')).toBeNull();
  });

  it('keeps one face per question; the same face again clears it', () => {
    const p = applied();
    setFace(p, 'position', 5);
    setFace(p, 'position', 3);
    expect(faceOf(p, 'position')).toBe(3);
    expect(p.notes.filter((n) => n.about === 'position')).toHaveLength(1);
    setFace(p, 'position', 3);
    expect(faceOf(p, 'position')).toBeUndefined();
    setFace(p, 'speakers', 5);
    expect(faceOf(p, 'speakers')).toBe(5);
    expect(projectSchema(p, 'project')).toBeNull();
  });

  it('compares gently with the app: agree, disagree or the same', () => {
    const p = applied(); // the app scored the old position 0.60
    setFace(p, 'position', 5);
    expect(comparison(p, 0.7)).toBeNull(); // the one before is not rated yet
    setFace(p, 'before', 3);
    expect(comparison(p, 0.7)).toBe('agree');
    setFace(p, 'before', 5);
    expect(comparison(p, 0.7)).toBe('same');
    setFace(p, 'position', 1);
    expect(comparison(p, 0.7)).toBe('disagree');
  });

  it('a face for the speakers overall is not a rating of the position', () => {
    const p = applied();
    setFace(p, 'speakers', 1);
    expect(ratingsBySetup(p.notes, p.variants).get(p.variants[0]!.id)).toBeUndefined();
  });
});
