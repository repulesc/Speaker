import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/** Distance from the midpoint as a fraction of the room length (🟡 bands). */
export const MIDPOINT_RED_FLAG = 0.05;
const MIDPOINT_CAUTION = 0.1;

/**
 * G01 · Don't sit at the room's midpoint along its length (🟠, null itself 🔴 via P03).
 * Sources: [TOOLE], [EVP]. Red flag within 5 % of L/2, caution within 10 % (🟡 bands).
 * Across the width the listener is normally centred: an accepted trade-off, reported as info.
 */
export function midpointOffsetFraction(listenerY: number, length: number): number {
  return Math.abs(listenerY - length / 2) / length;
}

export const G01: RuleDef = {
  id: 'G01',
  level: 'guideline',
  concern: 'bass',
  scope: 'placement',
  sources: ['TOOLE', 'EVP'],
  variants: ['redFlag', 'caution', 'ok', 'widthNode'],
  evaluate(ctx, placement) {
    const offset = midpointOffsetFraction(placement.listener.y, ctx.room.L);
    const params = { offsetFraction: offset, midpoint: ctx.room.L / 2 };
    const assumptions = [ASSUMPTION.rigidRectangular];
    const lengthFinding =
      offset < MIDPOINT_RED_FLAG
        ? makeFinding(G01, 'redFlag', 'red-flag', params, { assumptions })
        : offset < MIDPOINT_CAUTION
          ? makeFinding(G01, 'caution', 'caution', params, { assumptions })
          : makeFinding(G01, 'ok', 'ok', params);
    const findings = [lengthFinding];
    if (Math.abs(placement.listener.x - ctx.room.W / 2) < 0.05 * ctx.room.W) {
      findings.push(makeFinding(G01, 'widthNode', 'info', {}, { assumptions }));
    }
    return findings;
  },
};
