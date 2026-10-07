import type { ListeningRule, Suggestion } from './check';

/**
 * L10 · The stage is flat, no depth (V10). Most depth is in the recording. What listeners report
 * helps, with no study we can cite to size it, so all of it is 🟣 by ear ("practice"):
 * more space behind the speakers, a little less toe-in, and nothing big and hard between them.
 */
export const L10: ListeningRule = {
  id: 'L10',
  aspect: 'depth',
  suggest(_ctx, _p, m, answers) {
    if (answers.depth !== 'flat') return [];
    const out: Suggestion[] = [];
    if (m.clearance < 0.8) {
      out.push({
        id: 'L10.out',
        level: 'subjective',
        sources: ['practice'],
        priority: 0.6,
        change: { kind: 'speakersOut', by: 0.2 },
        params: { by: 0.2 },
      });
    }
    if (m.toeIn >= 10) {
      out.push({
        id: 'L10.lessToeIn',
        level: 'subjective',
        sources: ['practice'],
        priority: 0.5,
        change: { kind: 'toeIn', by: -5 },
        params: { by: 5 },
      });
    }
    out.push({
      id: 'L10.clear',
      level: 'subjective',
      sources: ['practice'],
      priority: 0.45,
      params: {},
    });
    return out;
  },
};
