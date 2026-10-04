import { makeFinding, type RuleDef } from './rule';

/**
 * H02 · Rule of thirds (🟡 heuristic, overlay only, never scored). Folk rule (⚠ verify origin).
 * Speakers about L/3 into the room, listener about 2L/3.
 */
export const H02_SEAT_FRACTION = 2 / 3;

export const H02: RuleDef = {
  id: 'H02',
  level: 'heuristic',
  concern: 'rulesOfThumb',
  scope: 'room',
  sources: [],
  variants: ['overlay'],
  evaluate(ctx) {
    const speakersY = ctx.room.L / 3;
    const listenerY = H02_SEAT_FRACTION * ctx.room.L;
    return [
      makeFinding(
        H02,
        'overlay',
        'info',
        { speakersY, listenerY },
        { overlayY: [speakersY, listenerY] },
      ),
    ];
  },
};
