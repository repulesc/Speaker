import { boundaryDistances } from '../rules/P04-boundary-interference';
import { boundaryGainCategory } from '../rules/P05-boundary-gain';
import { trebleCharacter } from '../rules/H06-treble-trim';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * D07 · Tone, if you have the controls (🟡; docs/ROADMAP_V5.md). D02 and D03 speak only when the
 * speaker profile lists a bass or treble control, and most people never fill that in. This says the
 * same things without knowing the control: "if your speakers or amplifier have one". Same
 * conditions, same sources, nothing new assumed:
 * - bass: the speakers stand close to walls, so the bass is boosted (boundary gain high or very
 *   high, P05 🔴 [ALL74]); a small bass cut can even it out (🟡, manufacturer guidance);
 * - treble: the room's high band dies away fast or rings on (H06's thresholds, 🟡 [TOOLE]).
 * Never from placeholder speakers, and never from an undescribed room.
 */
export const D07: AdviceRule = {
  id: 'D07',
  level: 'heuristic',
  concern: 'speaker',
  sources: ['ALL74', 'TOOLE', 'manufacturer'],
  variants: ['bassCut', 'trebleLift', 'trebleCut'],
  advise(ctx, placement) {
    const out = [];
    const { dsp } = ctx.project.speaker;
    const placed = (['left', 'right'] as const).every(
      (side) => (placement.speakers[side].certainty ?? 'estimated') !== 'unknown',
    );
    if (!dsp.bass && placed) {
      const d = boundaryDistances(placement.speakers.left, ctx);
      const gain = boundaryGainCategory(d.front, d.side, d.floor);
      if (gain === 'high' || gain === 'very-high')
        out.push(makeAdvice(D07, 'bassCut', { priority: 0.45, effect: 'small', params: { gain } }));
    }
    const treble = dsp.treble ? null : trebleCharacter(ctx);
    if (treble) {
      const params = { t60: ctx.t60.treble, suggestDb: treble === 'lift' ? 0.5 : -0.5 };
      const variant = treble === 'lift' ? 'trebleLift' : 'trebleCut';
      out.push(makeAdvice(D07, variant, { priority: 0.35, effect: 'small', params }));
    }
    return out;
  },
};
