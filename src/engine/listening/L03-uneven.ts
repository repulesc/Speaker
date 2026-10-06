import type { ListeningRule } from './check';

/**
 * L03 · Some bass notes boom or vanish. That is the room's resonances: their pattern changes
 * within a quarter of a wavelength, tens of centimetres in the bass (P03, [KUT]), 🔴. Moving the
 * seat (or the speakers) a little and listening again is the classic way to find a smoother spot;
 * the first step goes away from the room's middle, where the strongest null sits (G01).
 */
export const L03: ListeningRule = {
  id: 'L03',
  aspect: 'evenness',
  suggest(ctx, p, _m, answers) {
    if (answers.evenness !== 'uneven') return [];
    return [
      {
        id: 'L03.seatStep',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.8,
        change: { kind: 'seat', by: p.listener.y < ctx.room.L / 2 ? -0.15 : 0.15 },
        params: { by: 0.15 },
      },
      {
        id: 'L03.speakerStep',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.55,
        change: { kind: 'speakersOut', by: 0.1 },
        params: { by: 0.1 },
      },
    ];
  },
};
