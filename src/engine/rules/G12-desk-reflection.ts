import { acousticCentre } from '../context';
import { DESK } from '../presets/listeningArea';
import { DESK_HEIGHT, placedOnOf } from '../presets/speakerKinds';
import { makeFinding, type RuleDef } from './rule';

/**
 * G12 · The reflection off the desk top (🔴 geometry), when you listen at a desk. The desk is a
 * mirror for the sound: with the image source below its top ([KUT]), the reflected path is longer
 * than the direct one by Δ = √(d² + (hₛ + hₑ)²) − √(d² + (hₑ − hₛ)²), where d is the horizontal
 * distance from the tweeter to your ears and hₛ, hₑ the tweeter and ear heights above the desk.
 * It arrives Δ/c later and, added to the direct sound, cuts the first dip at c / (2Δ). How deep
 * that dip is depends on how much sound the speaker sends downward, which we do not know: the
 * finding says where it is, not how much it matters. The reflection hits the desk only if its
 * point (d · hₛ / (hₛ + hₑ) from the speaker) lies on the desk top, between its back and front
 * edges (DESK, 🟡 typical). The bass model and the map do not include the desk.
 */
export const G12: RuleDef = {
  id: 'G12',
  level: 'physics',
  concern: 'reflections',
  scope: 'placement',
  sources: ['KUT'],
  variants: ['onDesk', 'clear'],
  evaluate(ctx, placement) {
    const atDesk =
      ctx.project.constraints.listeningDistance === 'near' || ctx.variant.listener.area === 'desk';
    if (!atDesk) return [];
    const deskTop =
      placedOnOf(ctx.project.speaker.choices ?? {}) === 'desk'
        ? placement.speakers.left.base.z
        : DESK_HEIGHT;
    const ears = placement.listener;
    const tweeter = acousticCentre(placement.speakers.left, ctx.speaker);
    const hs = tweeter.z - deskTop;
    const he = ears.z - deskTop;
    const d = Math.hypot(tweeter.x - ears.x, tweeter.y - ears.y);
    if (hs <= 0 || he <= 0 || d <= DESK.gap) return [];
    const hit = (d * hs) / (hs + he);
    const onDesk = hit >= d - DESK.gap - DESK.depth && hit <= d - DESK.gap;
    if (!onDesk) return [makeFinding(G12, 'clear', 'info', {})];
    const delta = Math.hypot(d, hs + he) - Math.hypot(d, he - hs);
    return [
      makeFinding(G12, 'onDesk', 'caution', {
        delayMs: (delta / ctx.c) * 1000,
        frequency: ctx.c / (2 * delta),
      }),
    ];
  },
};
