import { makeFinding, type RuleDef } from './rule';

/**
 * H02 · Rule of thirds (🟡 heuristic, overlay only, never scored). Folk rule (⚠ verify origin).
 * Speakers about L/3 into the room, listener about 2L/3.
 */
export const H02: RuleDef = {
  id: 'H02',
  level: 'heuristic',
  sources: [],
  variants: ['overlay'],
  evaluate(ctx) {
    const speakersY = ctx.room.L / 3;
    const listenerY = (2 * ctx.room.L) / 3;
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
