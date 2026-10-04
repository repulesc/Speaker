import { pointInBox2D } from '../math/geometry';
import { objectBox } from '../rules/G10-objects';
import { makeAdvice, type AdviceRule } from './rule';

/**
 * D06 · Desk or stand mode (🟠, manufacturer-specific). Sources: manufacturer documentation. For
 * speakers that offer placement modes: "desk" when the speaker stands on a desk or table placed in
 * the room, otherwise "stand". Only the modes the profile lists are suggested.
 */
export const D06: AdviceRule = {
  id: 'D06',
  level: 'guideline',
  concern: 'speaker',
  sources: ['manufacturer'],
  variants: ['desk', 'stand'],
  advise(ctx, placement) {
    const modes = ctx.project.speaker.dsp.placementModes ?? [];
    const base = placement.speakers.left.base;
    const onFurniture = ctx.objects.some(
      (o) => (o.kind === 'desk' || o.kind === 'table') && pointInBox2D(base, objectBox(o)),
    );
    const mode = onFurniture ? 'desk' : 'stand';
    if (!modes.includes(mode)) return [];
    return [makeAdvice(D06, mode, { priority: 0.55, effect: 'small' })];
  },
};
