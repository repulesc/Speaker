/**
 * Do the user's ears and the app's ranking agree? (docs/REVAMP_PLAN.md, "A/B listening log".)
 * Compares every pair of rated setups: the one with the higher mean rating should also be the one
 * with the higher predicted score. Differences too small to mean anything on either side are left
 * out (🟡 thresholds). The result is shown as information; it never changes the physics.
 */

export interface RatedSetup {
  id: string;
  name: string;
  /** The app's score for the setup (0..1), or null while it is being computed. */
  score: number | null;
  /** The 1 to 5 ratings the user gave this setup. */
  ratings: number[];
}

export type Agreement =
  | { verdict: 'not-enough' }
  | {
      verdict: 'agree' | 'mixed' | 'disagree';
      agree: number;
      disagree: number;
      /** The setup the user liked best, and the one the app scores best, among the rated ones. */
      ears: string;
      app: string;
    };

/** A rating gap under half a point, or a score gap under 0.02, is a tie. */
const RATING_TIE = 0.5;
const SCORE_TIE = 0.02;

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function agreement(setups: RatedSetup[]): Agreement {
  const rated = setups
    .filter((s) => s.ratings.length > 0 && s.score !== null)
    .map((s) => ({ name: s.name, score: s.score!, mean: mean(s.ratings) }));
  let agree = 0;
  let disagree = 0;
  for (let i = 0; i < rated.length; i++) {
    for (let j = i + 1; j < rated.length; j++) {
      const a = rated[i]!;
      const b = rated[j]!;
      const ears = a.mean - b.mean;
      const app = a.score - b.score;
      if (Math.abs(ears) < RATING_TIE || Math.abs(app) < SCORE_TIE) continue;
      if (Math.sign(ears) === Math.sign(app)) agree++;
      else disagree++;
    }
  }
  if (agree + disagree === 0) return { verdict: 'not-enough' };
  const best = (key: 'mean' | 'score') =>
    rated.reduce((top, s) => (s[key] > top[key] ? s : top)).name;
  return {
    verdict: disagree === 0 ? 'agree' : agree === 0 ? 'disagree' : 'mixed',
    agree,
    disagree,
    ears: best('mean'),
    app: best('score'),
  };
}
