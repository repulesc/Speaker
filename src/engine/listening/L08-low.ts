import { wooferCentre } from '../context';
import { frontWallNullAtSeat } from '../rules/P04-boundary-interference';
import type { ListeningRule, Suggestion } from './check';

/**
 * L08 · The lowest notes are missing (V10). Different from "thin": only the deepest octave is gone.
 * - The front-wall dip (P04, [ALL74]), 🔴: when it lands in 35–100 Hz, it eats the weight of the
 *   bass. Close to the wall it rises out of the bass; the move goes to 0.3 m behind the rear panel.
 * - A seat at the room's middle sits in the first length resonance's null (P03, [KUT]), 🔴.
 * - Every length resonance peaks at the back wall (P03), 🔴: a seat further back gets more of the
 *   lowest notes (never right against it, G02).
 * - A room open to another lets them out: close the door, if there is one ([SAB]), 🔴.
 * - Speakers whose −6 dB point is at or above 50 Hz do not reach that octave: said honestly.
 */
export const L08: ListeningRule = {
  id: 'L08',
  aspect: 'low',
  suggest(ctx, p, m, answers) {
    if (answers.low !== 'missing') return [];
    const s = ctx.speaker;
    const out: Suggestion[] = [];
    const dip = frontWallNullAtSeat(wooferCentre(p.speakers.left, s), p.listener, ctx.c);
    const target = Math.max(0.3, s.portLocation === 'rear' ? s.minRearClearance : 0);
    const by = Math.round((m.clearance - target) * 100) / 100;
    if (dip >= 35 && dip <= 100 && by >= 0.1) {
      out.push({
        id: 'L08.dip',
        level: 'physics',
        sources: ['ALL74', 'KUT'],
        priority: 0.85,
        change: { kind: 'speakersOut', by: -by },
        params: { by, hz: Math.round(dip) },
      });
    }
    if (Math.abs(p.listener.y - ctx.room.L / 2) < 0.3) {
      out.push({
        id: 'L08.seatOffMiddle',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.8,
        change: { kind: 'seat', by: p.listener.y < ctx.room.L / 2 ? -0.25 : 0.25 },
        params: { by: 0.25 },
      });
    } else if (m.back > 1.2) {
      out.push({
        id: 'L08.seatBack',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.5,
        change: { kind: 'seat', by: 0.3 },
        params: { by: 0.3 },
      });
    }
    if (m.setting.open) {
      out.push({ id: 'L08.door', level: 'physics', sources: ['SAB'], priority: 0.7, params: {} });
    }
    if (s.f6 >= 50) {
      out.push({
        id: 'L08.small',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.6,
        params: { hz: Math.round(s.f6) },
      });
    }
    return out;
  },
};
