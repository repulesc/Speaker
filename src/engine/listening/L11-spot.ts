import type { ListeningRule, Suggestion } from './check';

/** How far in front of the ears the aims should cross for a wider sweet spot (m). */
const IN_FRONT = 0.5;

/**
 * L11 · Only one spot sounds right (V10).
 * - Aims crossing just in front of you: leaning towards one speaker takes you further off its axis,
 *   so its level drops as its sound arrives earlier, and the image holds (time–intensity trading;
 *   needs a speaker that is quieter off axis), 🟡 practice. The toe-in is computed from the plan.
 * - Sitting further back: a step sideways changes the two distances less (geometry, precedence
 *   [WALL49]), 🔴; the stage gets narrower.
 */
export const L11: ListeningRule = {
  id: 'L11',
  aspect: 'spot',
  suggest(ctx, p, m, answers) {
    if (answers.spot !== 'small') return [];
    const out: Suggestion[] = [];
    const front = Math.max(p.speakers.left.base.y, p.speakers.right.base.y) + ctx.speaker.depth / 2;
    const cross = p.listener.y - IN_FRONT - front;
    if (cross > 0.3) {
      const want = (Math.atan2(m.spacing / 2, cross) * 180) / Math.PI;
      const by = Math.round(want - m.toeIn);
      if (by >= 3 && want <= 35) {
        out.push({
          id: 'L11.crossFront',
          level: 'heuristic',
          sources: ['practice', 'TOOLE'],
          priority: 0.8,
          change: { kind: 'toeIn', by },
          params: { by },
        });
      }
    }
    if (m.back > 1) {
      out.push({
        id: 'L11.sitBack',
        level: 'physics',
        sources: ['WALL49'],
        priority: 0.6,
        change: { kind: 'seat', by: 0.3 },
        params: { by: 0.3 },
      });
    }
    return out;
  },
};
