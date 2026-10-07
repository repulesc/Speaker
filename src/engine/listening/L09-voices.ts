import { DESK } from '../presets/listeningArea';
import type { ListeningRule, Suggestion } from './check';

/**
 * L09 · Voices are muffled, boxy or recessed (V10).
 * - At a desk, the desk top reflects the voice range back at you (G12, image source), 🔴: speakers
 *   to the desk's front edge (the reflection point leaves the desk), tilted up to the ears.
 * - Tweeters below or above the ears (G08, [ITU1116], [TOOLE]), 🟠.
 * - A boomy bass covers the lower voice range (upward spread of masking, [FAS07]), 🟠: fix it first.
 * - Hollow furniture under the speakers rings along and colours the lower midrange: 🟡 practice.
 * - Far from the speakers, more of the voice arrives late from the room (P10, [KUT]), 🔴.
 */
export const L09: ListeningRule = {
  id: 'L09',
  aspect: 'voices',
  suggest(ctx, p, m, answers, findings) {
    if (answers.voices !== 'muffled') return [];
    const out: Suggestion[] = [];
    if (
      findings.some(
        (f) =>
          f.messageKey === 'finding.G12.onDesk' || (f.ruleId === 'G12' && f.severity === 'caution'),
      )
    ) {
      const edge = p.listener.y - DESK.gap - ctx.speaker.depth / 2 - 0.02;
      const by =
        Math.round((edge - Math.max(p.speakers.left.base.y, p.speakers.right.base.y)) * 100) / 100;
      out.push({
        id: 'L09.desk',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.9,
        ...(by >= 0.05 ? { change: { kind: 'speakersOut', by } as const } : {}),
        params: { by: Math.max(0, by) },
      });
    }
    if (findings.some((f) => f.ruleId === 'G08' && f.severity !== 'ok' && f.severity !== 'info')) {
      out.push({
        id: 'L09.height',
        level: 'guideline',
        sources: ['ITU1116', 'TOOLE'],
        priority: 0.75,
        params: {},
      });
    }
    if (answers.bass === 'boomy') {
      out.push({
        id: 'L09.bassFirst',
        level: 'guideline',
        sources: ['FAS07'],
        priority: 0.7,
        params: {},
      });
    }
    if (m.setting.placedOn === 'desk') {
      out.push({
        id: 'L09.onDesk',
        level: 'heuristic',
        sources: ['practice'],
        priority: 0.45,
        params: {},
      });
    }
    if (Math.min(m.dLeft, m.dRight) > 2.2) {
      out.push({
        id: 'L09.closer',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.55,
        change: { kind: 'seat', by: -0.3 },
        params: { by: 0.3 },
      });
    }
    return out;
  },
};
