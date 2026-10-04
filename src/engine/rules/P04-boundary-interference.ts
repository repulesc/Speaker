import { wooferCentre, type AnalysisContext } from '../context';
import type { Finding, SpeakerPlacement } from '../types';
import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/**
 * P04 · Speaker-boundary interference, SBIR (🔴 physics). Sources: [ALL74], [TOOLE], [EVP].
 * First cancellation for one nearby boundary at distance d: f ≈ c / (4·d).
 */
export function boundaryNullHz(distance: number, c: number): number {
  return c / (4 * distance);
}

export interface BoundaryDistances {
  front: number;
  side: number;
  floor: number;
  ceiling: number;
}

/** Distances from the woofer centre (LF acoustic centre) to the four nearby boundaries. */
export function boundaryDistances(p: SpeakerPlacement, ctx: AnalysisContext): BoundaryDistances {
  const w = wooferCentre(p, ctx.speaker);
  return {
    front: w.y,
    side: Math.min(w.x, ctx.room.W - w.x),
    floor: w.z,
    ceiling: ctx.room.H - w.z,
  };
}

/** Two boundaries closer than 1.5 m with distances within 10 % line their nulls up (deeper dip). */
export function alignedBoundaries(
  d: BoundaryDistances,
): [keyof BoundaryDistances, keyof BoundaryDistances] | null {
  const keys = (Object.keys(d) as (keyof BoundaryDistances)[]).filter((k) => d[k] < 1.5);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = d[keys[i]!];
      const b = d[keys[j]!];
      if (Math.abs(a - b) / Math.max(a, b) < 0.1) return [keys[i]!, keys[j]!];
    }
  }
  return null;
}

export const P04: RuleDef = {
  id: 'P04',
  level: 'physics',
  sources: ['ALL74', 'TOOLE', 'EVP'],
  variants: ['frontWall', 'aligned'],
  evaluate(ctx, placement) {
    const findings: Finding[] = [];
    const left = boundaryDistances(placement.speakers.left, ctx);
    const right = boundaryDistances(placement.speakers.right, ctx);
    const symmetric = Math.abs(left.front - right.front) < 0.01;
    const sides = symmetric
      ? [['both', left]]
      : [
          ['left', left],
          ['right', right],
        ];
    for (const [speaker, d] of sides as [string, BoundaryDistances][]) {
      findings.push(
        makeFinding(
          P04,
          'frontWall',
          'info',
          { speaker, distance: d.front, frequency: boundaryNullHz(d.front, ctx.c) },
          { assumptions: [ASSUMPTION.freeFieldSingleBoundary] },
        ),
      );
      const aligned = alignedBoundaries(d);
      if (aligned) {
        findings.push(
          makeFinding(
            P04,
            'aligned',
            'caution',
            {
              speaker,
              boundaryA: aligned[0],
              boundaryB: aligned[1],
              frequency: boundaryNullHz((d[aligned[0]] + d[aligned[1]]) / 2, ctx.c),
            },
            { assumptions: [ASSUMPTION.freeFieldSingleBoundary] },
          ),
        );
      }
    }
    return findings;
  },
};
