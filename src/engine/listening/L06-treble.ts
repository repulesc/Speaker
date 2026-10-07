import type { ListeningRule, Suggestion } from './check';

/**
 * L06 · The treble is harsh (or S sounds hiss), or dull. Most speakers are a little duller off
 * their axis ([TOOLE]), so less toe-in calms the treble and more brightens it; how much depends on
 * the speaker, so it is by ear (🟣). Tweeters below or above the ears dull the sound (G08,
 * [ITU1116]), 🟠. The room's part depends on the room page (V10): a bare room that rings gets soft
 * things where the sound first bounces (P08, [EVP]), 🟠, a rug only where the floor is hard; a full
 * room is not short of soft things, so the advice there is to find the one hard, shiny surface near
 * the path (a glass table, a bare desk top, a window): first reflections carry the treble (P06,
 * [TOOLE]), 🟠. A treble control the user ticked is named directly and comes first.
 */
export const L06: ListeningRule = {
  id: 'L06',
  aspect: 'treble',
  suggest(ctx, _p, m, answers, findings) {
    const t = answers.treble;
    if (t !== 'bright' && t !== 'dull') return [];
    const bright = t === 'bright';
    const { full, hardFloor, controls } = m.setting;
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
    if (bright && full) {
      out.push({
        id: 'L06.surface',
        level: 'guideline',
        sources: ['TOOLE'],
        priority: 0.5,
        params: {},
      });
    } else if (bright && ctx.t60.mid > 0.45) {
      out.push({
        id: hardFloor ? 'L06.soften' : 'L06.softenWalls',
        level: 'guideline',
        sources: ['EVP'],
        priority: 0.5,
        params: {},
      });
    }
    const known = controls.treble;
    out.push({
      id: `L06.treble${bright ? 'Down' : 'Up'}${known ? 'Known' : ''}`,
      level: 'guideline',
      sources: ['manufacturer'],
      priority: known ? 0.6 : 0.35,
      params: {},
    });
    return out;
  },
};
