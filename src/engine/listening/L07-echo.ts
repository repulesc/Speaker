import type { ListeningRule, Suggestion } from './check';

/**
 * L07 · The sound is smeared or echoey. Beyond the critical distance the room's reflections are
 * louder than the speakers' direct sound (P10, [KUT]), 🔴: sitting closer is the free remedy.
 * What else depends on the room page (V10, the owner's case: a cluttered room that still rings is
 * not short of cushions). In a busy or very busy room the likely cause is flutter echo: sound
 * bouncing back and forth between two bare, parallel surfaces ([KUT], [EVP]), 🔴. A single hand
 * clap finds it (a fast, ringing "zing"; the test itself is practice), and one thing on one of the
 * two surfaces breaks it. Turning the speakers a little more towards you sends less of their sound
 * to the side walls first (🟣, depends on the speaker, [TOOLE]). In a bare or partly furnished room
 * soft things on hard surfaces shorten the echo (P08, [SAB], [EVP]), 🟠, without buying panels.
 */
export const L07: ListeningRule = {
  id: 'L07',
  aspect: 'clarity',
  suggest(_ctx, _p, m, answers) {
    const c = answers.clarity;
    if (c !== 'some' && c !== 'echoey') return [];
    const { full, hardFloor } = m.setting;
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
      id: 'L07.flutter',
      level: 'physics',
      sources: ['KUT', 'EVP'],
      priority: full ? 0.8 : 0.45,
      params: {},
    });
    if (full) {
      if (m.toeIn < 25) {
        out.push({
          id: 'L07.toeIn',
          level: 'subjective',
          sources: ['TOOLE'],
          priority: 0.55,
          change: { kind: 'toeIn', by: 5 },
          params: { by: 5 },
        });
      }
    } else {
      out.push({
        id: hardFloor ? 'L07.soften' : 'L07.softenWalls',
        level: 'guideline',
        sources: ['SAB', 'EVP'],
        priority: 0.55,
        params: {},
      });
    }
    return out;
  },
};
