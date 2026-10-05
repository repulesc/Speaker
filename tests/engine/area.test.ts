import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { buildContext } from '../../src/engine/context';
import { areaPoints, areaScore } from '../../src/engine/scoring/area';
import { makeScorer, robustScores } from '../../src/engine/scoring/search';
import type { AnalysisOk, Placement, Project } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

/**
 * The listening area (docs/ROADMAP_V5.md): a sofa, a desk or a bed is judged at a few spots, the
 * middle counting twice, with the same score as one seat.
 */
function ok(project: Project): AnalysisOk {
  const a = analyze(project);
  if (a.status !== 'ok') throw new Error('expected a full analysis');
  return a;
}

const room = { W: 4, L: 5 };
const ears = { x: 2, y: 3, z: 1.1 };

describe('listening area spots', () => {
  it('one seat is just the seat', () => {
    expect(areaPoints(ears, undefined, room)).toEqual([{ where: 'centre', at: ears }]);
  });

  it('a sofa adds the two ends, 0.6 m either side, and no front or back (too shallow)', () => {
    const spots = areaPoints(ears, 'sofa', room);
    expect(spots.map((s) => s.where)).toEqual(['centre', 'left', 'right']);
    expect(spots[1]!.at.x).toBeCloseTo(1.4, 9);
    expect(spots[2]!.at.x).toBeCloseTo(2.6, 9);
    expect(spots.every((s) => s.at.y === ears.y && s.at.z === ears.z)).toBe(true);
  });

  it('a desk and a bed are judged front and back too', () => {
    expect(areaPoints(ears, 'desk', room).map((s) => s.where)).toEqual([
      'centre',
      'left',
      'right',
      'front',
      'back',
    ]);
    const bed = areaPoints(ears, 'bed', room);
    expect(bed.find((s) => s.where === 'front')!.at.y).toBeCloseTo(2.8, 9);
    expect(bed.find((s) => s.where === 'back')!.at.y).toBeCloseTo(3.2, 9);
  });

  it('leaves out spots outside the room', () => {
    const nearWall = { x: 0.3, y: 3, z: 1.1 };
    expect(areaPoints(nearWall, 'sofa', room).map((s) => s.where)).toEqual(['centre', 'right']);
  });

  it('weighs the middle twice', () => {
    expect(
      areaScore([
        { where: 'centre', score: 0.9 },
        { where: 'left', score: 0.6 },
        { where: 'right', score: 0.6 },
      ]),
    ).toBeCloseTo((2 * 0.9 + 0.6 + 0.6) / 4, 12);
    expect(areaScore([{ where: 'centre', score: 0.7 }])).toBe(0.7);
  });
});

describe('listening area in the analysis', () => {
  const placementOf = (p: Project): Placement => ({
    speakers: p.variants[0]!.speakers,
    listener: p.variants[0]!.listener.ears,
  });

  it('without an area, the robust score is the seat alone (unchanged)', () => {
    const p = makeProject({});
    const scorer = makeScorer(buildContext(p)!);
    const [robust] = robustScores(scorer, [placementOf(p)], 1);
    expect(ok(p).current.score).toBeCloseTo(robust!.robust, 12);
    expect(ok(p).area).toBeUndefined();
  });

  it('with a sofa, the robust score weighs the ends in, and the analysis reports each spot', () => {
    const one = makeProject({});
    const sofa = makeProject({});
    sofa.variants[0]!.listener.area = 'sofa';
    const a = ok(sofa);
    expect(a.area?.kind).toBe('sofa');
    expect(a.area?.spots.map((s) => s.where)).toEqual(['centre', 'left', 'right']);
    // The middle spot is the one seat; the ends are scored the same way.
    expect(a.area!.spots[0]!.score).toBeCloseTo(ok(one).current.nominalScore, 12);
    // Off-centre seats lose the stereo image, so a whole sofa scores below its middle seat.
    expect(a.current.score).toBeLessThan(ok(one).current.score);
  });

  it('the suggestions for a sofa stay good at its ends, not only in the middle', () => {
    const sofa = makeProject({});
    sofa.variants[0]!.listener.area = 'sofa';
    sofa.constraints.listenerFixed = true;
    const one = makeProject({});
    one.constraints.listenerFixed = true;
    const ends = (p: Project, c: AnalysisOk['candidates'][number]) => {
      const scorer = makeScorer(buildContext(p)!);
      return areaPoints(c.listener, 'sofa', buildContext(p)!.room)
        .filter((s) => s.where !== 'centre')
        .map((s) => scorer.score({ speakers: c.speakers, listener: s.at }).score);
    };
    const forSofa = ends(sofa, ok(sofa).candidates[0]!);
    const forOne = ends(sofa, ok(one).candidates[0]!);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(forSofa)).toBeGreaterThanOrEqual(mean(forOne) - 1e-9);
  });
});
