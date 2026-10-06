import type { ListeningRule, Suggestion } from './check';

/**
 * L04 · Voices in the middle are vague, or pulled to one side. A phantom centre needs both
 * speakers at the same distance: a few centimetres move it (precedence, [WALL49]; G05), 🔴 for the
 * geometry. Turning the speakers towards you often firms it up; how much is a matter of the speaker
 * and the room, so it is "by ear" ([TOOLE]), 🟣. Ears below or above the tweeters blur it too (G08,
 * [ITU1116]). Pulled to one side with equal distances: the swap test tells room from equipment.
 */
export const L04: ListeningRule = {
  id: 'L04',
  aspect: 'centre',
  suggest(_ctx, p, m, answers, findings) {
    const c = answers.centre;
    if (c !== 'vague' && c !== 'left' && c !== 'right') return [];
    const middle = (p.speakers.left.base.x + p.speakers.right.base.x) / 2;
    const unequal = Math.abs(m.dLeft - m.dRight) > 0.03 && Math.abs(p.listener.x - middle) > 0.02;
    const out: Suggestion[] = [];
    if (unequal) {
      out.push({
        id: 'L04.centreSeat',
        level: 'physics',
        sources: ['WALL49', 'TOOLE'],
        priority: 0.95,
        change: { kind: 'seatCentre', x: middle },
        params: { by: Math.abs(p.listener.x - middle) },
      });
    }
    if (c === 'vague') {
      if (m.toeIn < 25) {
        out.push({
          id: 'L04.toeIn',
          level: 'subjective',
          sources: ['TOOLE'],
          priority: 0.6,
          change: { kind: 'toeIn', by: 5 },
          params: { by: 5 },
        });
      }
      if (
        findings.some((f) => f.ruleId === 'G08' && f.severity !== 'ok' && f.severity !== 'info')
      ) {
        out.push({
          id: 'L04.height',
          level: 'guideline',
          sources: ['ITU1116', 'TOOLE'],
          priority: 0.55,
          params: {},
        });
      }
    } else if (!unequal) {
      out.push({
        id: 'L04.swap',
        level: 'subjective',
        sources: ['TOOLE'],
        priority: 0.7,
        params: {},
      });
    }
    return out;
  },
};
