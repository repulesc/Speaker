import type { ListeningRule, Suggestion } from './check';

/**
 * L06 · The treble is bright or harsh, or dull. Most speakers are a little duller off their axis
 * ([TOOLE]), so less toe-in calms the treble and more brightens it; how much depends on the
 * speaker, so it is by ear (🟣). Tweeters below or above the ears dull the sound (G08, [ITU1116]),
 * 🟠. Hard, bare surfaces brighten a room; soft ones calm it (P08, [EVP]), 🟠. A treble control is
 * the maker's own way, if the speaker or amplifier has one.
 */
export const L06: ListeningRule = {
  id: 'L06',
  aspect: 'treble',
  suggest(ctx, _p, m, answers, findings) {
    const t = answers.treble;
    if (t !== 'bright' && t !== 'dull') return [];
    const bright = t === 'bright';
    const out: Suggestion[] = [];
    if (bright ? m.toeIn >= 5 : m.toeIn < 25) {
      out.push({
        id: bright ? 'L06.lessToeIn' : 'L06.moreToeIn',
        level: 'subjective',
        sources: ['TOOLE'],
        priority: 0.7,
        change: { kind: 'toeIn', by: bright ? -5 : 5 },
        params: { by: 5 },
      });
    }
    if (
      !bright &&
      findings.some((f) => f.ruleId === 'G08' && f.severity !== 'ok' && f.severity !== 'info')
    ) {
      out.push({
        id: 'L06.height',
        level: 'guideline',
        sources: ['ITU1116', 'TOOLE'],
        priority: 0.65,
        params: {},
      });
    }
    if (bright && ctx.t60.mid > 0.45) {
      out.push({
        id: 'L06.soften',
        level: 'guideline',
        sources: ['EVP'],
        priority: 0.5,
        params: {},
      });
    }
    out.push({
      id: bright ? 'L06.trebleDown' : 'L06.trebleUp',
      level: 'guideline',
      sources: ['manufacturer'],
      priority: 0.35,
      params: {},
    });
    return out;
  },
};
