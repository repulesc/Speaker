import { acousticCentre } from '../context';
import type { Finding } from '../types';
import { firstReflections, isNearSide } from './P06-reflections';
import { makeFinding, type RuleDef } from './rule';

/**
 * G03 · Left-right symmetry (🟠; thresholds 🟡). Sources: [TOOLE], [ITU1116].
 * Side-wall distance difference: caution > 0.10 m, red flag > 0.30 m.
 * Different surface classes at the mirrored first-reflection points: caution (never red flag).
 */
export function sideDistanceDifference(leftX: number, rightX: number, width: number): number {
  return Math.abs(leftX - (width - rightX));
}

export const G03: RuleDef = {
  id: 'G03',
  level: 'guideline',
  sources: ['TOOLE', 'ITU1116'],
  variants: ['redFlag', 'caution', 'ok', 'surfaces'],
  evaluate(ctx, placement) {
    const left = acousticCentre(placement.speakers.left, ctx.speaker);
    const right = acousticCentre(placement.speakers.right, ctx.speaker);
    const diff = sideDistanceDifference(left.x, right.x, ctx.room.W);
    const findings: Finding[] = [
      diff > 0.3
        ? makeFinding(G03, 'redFlag', 'red-flag', { difference: diff })
        : diff > 0.1
          ? makeFinding(G03, 'caution', 'caution', { difference: diff })
          : makeFinding(G03, 'ok', 'ok', { difference: diff }),
    ];
    const near = firstReflections(ctx, placement.speakers, placement.listener).filter(isNearSide);
    const [l, r] = [
      near.find((x) => x.speaker === 'left'),
      near.find((x) => x.speaker === 'right'),
    ];
    if (l && r && l.surfaceClass !== r.surfaceClass) {
      findings.push(
        makeFinding(G03, 'surfaces', 'caution', { left: l.surfaceClass, right: r.surfaceClass }),
      );
    }
    return findings;
  },
};
