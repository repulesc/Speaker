import { flagged, type ListeningRule, type Suggestion } from './check';

/**
 * L02 · The bass is thin. Closer to the wall behind them, speakers gain bass (boundary gain,
 * [ALL74], [KUT]), 🔴; never closer than the rear port needs (G07). A seat near the middle of the
 * room's length sits in the first length resonance's null (P03, G01), 🔴. A room open to another
 * lets bass out: an opening absorbs like an open window ([SAB]'s unit of absorption), 🔴, so
 * closing its door, if it has one, is a free test (V10). Small speakers simply stop early; the app
 * says so instead of promising more. A ticked bass control is named directly and comes first.
 */
export const L02: ListeningRule = {
  id: 'L02',
  aspect: 'bass',
  suggest(ctx, p, m, answers, findings) {
    if (answers.bass !== 'thin') return [];
    const s = ctx.speaker;
    const out: Suggestion[] = [];
    const min = Math.max(0.15, s.portLocation === 'rear' ? s.minRearClearance : 0);
    const step = Math.round(Math.min(0.2, m.clearance - min) * 100) / 100;
    if (step >= 0.05) {
      out.push({
        id: 'L02.closer',
        level: 'physics',
        sources: ['ALL74', 'KUT'],
        priority: 0.9,
        change: { kind: 'speakersOut', by: -step },
        params: { by: step },
      });
    }
    const middle = Math.abs(p.listener.y - ctx.room.L / 2) < 0.3 || flagged(findings, 'G01');
    if (middle) {
      out.push({
        id: 'L02.seatOffMiddle',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.75,
        change: { kind: 'seat', by: p.listener.y < ctx.room.L / 2 ? -0.25 : 0.25 },
        params: { by: 0.25 },
      });
    }
    if (m.setting.open) {
      out.push({ id: 'L02.door', level: 'physics', sources: ['SAB'], priority: 0.7, params: {} });
    }
    if (s.f6 >= 60) {
      out.push({ id: 'L02.small', level: 'physics', sources: ['KUT'], priority: 0.3, params: {} });
    }
    out.push(
      m.setting.controls.bass
        ? {
            id: 'L02.controlKnown',
            level: 'guideline',
            sources: ['manufacturer'],
            priority: 0.5,
            params: {},
          }
        : {
            id: 'L02.control',
            level: 'guideline',
            sources: ['manufacturer'],
            priority: 0.25,
            params: {},
          },
    );
    return out;
  },
};
