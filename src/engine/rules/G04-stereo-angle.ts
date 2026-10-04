import { acousticCentre } from '../context';
import { toDeg } from '../math/geometry';
import type { Vec3 } from '../types';
import { makeFinding, type RuleDef } from './rule';

/**
 * G04 · Stereo listening angle (🟠; bands 🟡). Sources: [ITU775], [TOOLE].
 * Target 60°. OK 50–70°, info 45–50° / 70–75°, caution 35–45° / 75–90°, red flag outside 35–90°.
 */
export function stereoAngleDeg(left: Vec3, right: Vec3, listener: Vec3): number {
  const a = { x: left.x - listener.x, y: left.y - listener.y };
  const b = { x: right.x - listener.x, y: right.y - listener.y };
  const cos = (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  return toDeg(Math.acos(Math.max(-1, Math.min(1, cos))));
}

export const G04: RuleDef = {
  id: 'G04',
  level: 'guideline',
  sources: ['ITU775', 'TOOLE'],
  variants: ['redFlag', 'caution', 'info', 'ok'],
  evaluate(ctx, placement) {
    const angle = stereoAngleDeg(
      acousticCentre(placement.speakers.left, ctx.speaker),
      acousticCentre(placement.speakers.right, ctx.speaker),
      placement.listener,
    );
    const params = { angle };
    if (angle < 35 || angle > 90) return [makeFinding(G04, 'redFlag', 'red-flag', params)];
    if (angle < 45 || angle > 75) return [makeFinding(G04, 'caution', 'caution', params)];
    if (angle < 50 || angle > 70) return [makeFinding(G04, 'info', 'info', params)];
    return [makeFinding(G04, 'ok', 'ok', params)];
  },
};
