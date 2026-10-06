import type { ListeningRule, Suggestion } from './check';

/**
 * L05 · The stage is narrow, or so wide it has a hole in the middle. The width follows the angle
 * between the speakers seen from the seat; the stereo standard puts them at ±30°, 60° in all
 * ([ITU775]; G04), 🟠. Wider apart or sitting closer opens it; closer together or sitting further
 * back fills the middle. Toe-in shifts the balance a little, by ear ([TOOLE]), 🟣.
 */
export const L05: ListeningRule = {
  id: 'L05',
  aspect: 'width',
  suggest(_ctx, _p, m, answers) {
    const w = answers.width;
    if (w !== 'narrow' && w !== 'wide') return [];
    const narrow = w === 'narrow';
    const out: Suggestion[] = [];
    if (narrow ? m.angle < 58 : m.angle > 62) {
      out.push(
        {
          id: narrow ? 'L05.wider' : 'L05.narrower',
          level: 'guideline',
          sources: ['ITU775'],
          priority: 0.85,
          change: { kind: 'spacing', by: narrow ? 0.2 : -0.2 },
          params: { by: 0.2 },
        },
        {
          id: narrow ? 'L05.sitCloser' : 'L05.sitBack',
          level: 'guideline',
          sources: ['ITU775'],
          priority: 0.75,
          change: { kind: 'seat', by: narrow ? -0.25 : 0.25 },
          params: { by: 0.25 },
        },
      );
    }
    if (narrow ? m.toeIn >= 5 : m.toeIn < 25) {
      out.push({
        id: narrow ? 'L05.lessToeIn' : 'L05.moreToeIn',
        level: 'subjective',
        sources: ['TOOLE'],
        priority: 0.45,
        change: { kind: 'toeIn', by: narrow ? -5 : 5 },
        params: { by: 5 },
      });
    }
    return out;
  },
};
