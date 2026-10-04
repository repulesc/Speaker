import { acousticCentre, type AnalysisContext } from '../context';
import { pointInBox2D, segmentIntersectsBox, type Box } from '../math/geometry';
import { SEAT_KINDS } from '../presets/objects';
import type { Finding, RoomObject, SpeakerPlacement } from '../types';
import { makeFinding, type RuleDef } from './rule';

/**
 * G10 · Objects close to or between the speakers and the listener (🟠; thresholds 🟡).
 * Sources: [TOOLE] (⚠ verify chapter). Obstruction → red flag. Hard object within 0.3 m of a
 * cabinet → caution. Another (passive) loudspeaker within 1 m → caution: we can't predict how much
 * it resonates along, so the advice is an experiment.
 */
export function objectBox(o: RoomObject): Box {
  return {
    min: o.position,
    max: { x: o.position.x + o.size.x, y: o.position.y + o.size.y, z: o.position.z + o.size.z },
  };
}

export function cabinetBox(p: SpeakerPlacement, ctx: AnalysisContext): Box {
  const { width, depth, height } = ctx.speaker;
  return {
    min: { x: p.base.x - width / 2, y: p.base.y - depth / 2, z: p.base.z },
    max: { x: p.base.x + width / 2, y: p.base.y + depth / 2, z: p.base.z + height },
  };
}

function cabinetDistance(box: Box, o: RoomObject): number {
  const ob = objectBox(o);
  const dx = Math.max(ob.min.x - box.max.x, 0, box.min.x - ob.max.x);
  const dy = Math.max(ob.min.y - box.max.y, 0, box.min.y - ob.max.y);
  return Math.hypot(dx, dy);
}

/** True when an object blocks the direct path from either speaker to the ears. */
export function isObstructed(
  ctx: AnalysisContext,
  speakers: { left: SpeakerPlacement; right: SpeakerPlacement },
  ears: { x: number; y: number; z: number },
): RoomObject | null {
  for (const o of ctx.objects) {
    const box = objectBox(o);
    // The seat the listener sits on is not an obstruction.
    if (SEAT_KINDS.includes(o.kind) && pointInBox2D(ears, box)) continue;
    for (const side of ['left', 'right'] as const) {
      if (segmentIntersectsBox(acousticCentre(speakers[side], ctx.speaker), ears, box)) return o;
    }
  }
  return null;
}

export const G10: RuleDef = {
  id: 'G10',
  level: 'guideline',
  sources: ['TOOLE'],
  variants: ['obstruction', 'nearbyHard', 'passiveSpeaker'],
  evaluate(ctx, placement) {
    const findings: Finding[] = [];
    const blocker = isObstructed(ctx, placement.speakers, placement.listener);
    if (blocker) {
      findings.push(
        makeFinding(G10, 'obstruction', 'red-flag', { object: blocker.label ?? blocker.kind }),
      );
    }
    for (const side of ['left', 'right'] as const) {
      const cab = cabinetBox(placement.speakers[side], ctx);
      for (const o of ctx.objects) {
        const d = cabinetDistance(cab, o);
        const object = o.label ?? o.kind;
        const location = { ...o.position };
        if (o.kind === 'other-speaker' && d < 1.0) {
          findings.push(
            makeFinding(
              G10,
              'passiveSpeaker',
              'caution',
              { speaker: side, object, distance: d },
              { location },
            ),
          );
        } else if (o.hard && d < 0.3) {
          findings.push(
            makeFinding(
              G10,
              'nearbyHard',
              'caution',
              { speaker: side, object, distance: d },
              { location },
            ),
          );
        }
      }
    }
    return findings;
  },
};
