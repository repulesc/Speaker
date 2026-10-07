import type { AnalysisContext } from '../context';
import { makeScorer } from '../scoring/search';
import type { Finding, Placement } from '../types';
import {
  applyChange,
  measure,
  type Aspect,
  type Experiment,
  type ListeningAnswers,
  type ListeningRule,
  type Setting,
} from './check';
import { L01 } from './L01-boomy';
import { L02 } from './L02-thin';
import { L03 } from './L03-uneven';
import { L04 } from './L04-centre';
import { L05 } from './L05-width';
import { L06 } from './L06-treble';
import { L07 } from './L07-echo';
import { L08 } from './L08-low';
import { L09 } from './L09-voices';
import { L10 } from './L10-depth';
import { L11 } from './L11-spot';

export { applyChange, ASPECT_ANSWERS, ASPECT_GROUPS, ASPECTS, FINE } from './check';
export type { Aspect, Change, Experiment, ListeningAnswers } from './check';

export const LISTENING_RULES: readonly ListeningRule[] = [
  L01,
  L02,
  L03,
  L04,
  L05,
  L06,
  L07,
  L08,
  L09,
  L10,
  L11,
];

/**
 * Two changes per aspect at most, shown under the answer they belong to (V9): one thing at a time
 * is the method, and the first two are the likeliest to help.
 */
const PER_ASPECT = 2;
/** The bass rows, which the box model gets wrong in a room open to another. */
const BASS: readonly Aspect[] = ['bass', 'low', 'evenness'];
/**
 * Whether the room model's opinion on a move is worth showing (V10): not for any move in a room
 * that is not a plain box, nor for bass moves in a room open to another.
 */
const modelHolds = (setting: Setting, aspect: Aspect) =>
  !setting.odd && !(setting.open && BASS.includes(aspect));
/** Score differences smaller than this are "about the same" for the model (its own noise). */
const SAME = 0.02;

/**
 * What to try for these answers, most likely to help first. A move that does not fit the room or
 * the user's limits is left out. For moves, the room model's view is added: it hears the room,
 * not the speaker, so it can only agree or disagree about the room's part.
 */
export function listeningExperiments(
  ctx: AnalysisContext,
  placement: Placement,
  findings: readonly Finding[],
  answers: ListeningAnswers,
): Experiment[] {
  const m = measure(ctx, placement);
  const scorer = makeScorer(ctx);
  const now = scorer.score(placement).score;
  const all: Experiment[] = [];
  for (const rule of LISTENING_RULES) {
    for (const e of rule.suggest(ctx, placement, m, answers, findings)) {
      const exp: Experiment = { ...e, ruleId: rule.id, aspect: rule.aspect };
      if (e.change) {
        const moved = applyChange(ctx, placement, e.change);
        if (!moved) continue;
        if (e.change.kind !== 'toeIn' && modelHolds(m.setting, rule.aspect)) {
          const d = scorer.score(moved).score - now;
          exp.model = d > SAME ? 'better' : d < -SAME ? 'worse' : 'same';
        }
      }
      all.push(exp);
    }
  }
  all.sort((a, b) => b.priority - a.priority);
  const count = new Map<string, number>();
  return all.filter((e) => {
    const n = count.get(e.aspect) ?? 0;
    count.set(e.aspect, n + 1);
    return n < PER_ASPECT;
  });
}

/** The aspect an experiment answers ("L01.out" → bass), from the rule that made it. */
export function aspectOf(experimentId: string): Aspect | undefined {
  return LISTENING_RULES.find((r) => experimentId.startsWith(`${r.id}.`))?.aspect;
}

/** Every i18n key the listening check can use, for the translation checks. */
export function listeningMessageKeys(): string[] {
  const ids = [
    'L01.out',
    'L01.seatForward',
    'L01.inward',
    'L01.wallSwitch',
    'L01.plug',
    'L01.control',
    'L01.controlKnown',
    'L01.onDesk',
    'L01.onStand',
    'L01.onFloor',
    'L02.closer',
    'L02.seatOffMiddle',
    'L02.door',
    'L02.small',
    'L02.control',
    'L02.controlKnown',
    'L03.seatStep',
    'L03.speakerStep',
    'L04.centreSeat',
    'L04.polarity',
    'L04.toeIn',
    'L04.height',
    'L04.balance',
    'L04.swap',
    'L05.wider',
    'L05.narrower',
    'L05.sitCloser',
    'L05.sitBack',
    'L05.lessToeIn',
    'L05.moreToeIn',
    'L06.lessToeIn',
    'L06.moreToeIn',
    'L06.height',
    'L06.soften',
    'L06.softenWalls',
    'L06.surface',
    'L06.trebleDown',
    'L06.trebleUp',
    'L06.trebleDownKnown',
    'L06.trebleUpKnown',
    'L07.sitCloser',
    'L07.flutter',
    'L07.toeIn',
    'L07.soften',
    'L07.softenWalls',
    'L08.dip',
    'L08.seatOffMiddle',
    'L08.seatBack',
    'L08.door',
    'L08.small',
    'L09.desk',
    'L09.height',
    'L09.bassFirst',
    'L09.onDesk',
    'L09.closer',
    'L10.out',
    'L10.lessToeIn',
    'L10.clear',
    'L11.crossFront',
    'L11.sitBack',
  ];
  return ids.map((id) => `listen.exp.${id}`);
}
