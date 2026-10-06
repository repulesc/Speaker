import type { ListeningRule, Suggestion } from './check';

/**
 * L07 · The sound is smeared or echoey. Beyond the critical distance the room's reflections are
 * louder than the speakers' direct sound (P10, [KUT]), 🔴: sitting closer is the free remedy.
 * Soft things on hard surfaces shorten the echo (P08, [SAB], [EVP]), 🟠, without buying panels.
 */
export const L07: ListeningRule = {
  id: 'L07',
  aspect: 'clarity',
  suggest(_ctx, _p, m, answers) {
    const c = answers.clarity;
    if (c !== 'some' && c !== 'echoey') return [];
    const out: Suggestion[] = [];
    if (Math.min(m.dLeft, m.dRight) > 1.4) {
      out.push({
        id: 'L07.sitCloser',
        level: 'physics',
        sources: ['KUT'],
        priority: c === 'echoey' ? 0.85 : 0.6,
        change: { kind: 'seat', by: -0.3 },
        params: { by: 0.3 },
      });
    }
    out.push({
      id: 'L07.soften',
      level: 'guideline',
      sources: ['SAB', 'EVP'],
      priority: 0.55,
      params: {},
    });
    return out;
  },
};
