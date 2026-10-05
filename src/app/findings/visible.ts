import type { Advice } from '../../engine/types';

/**
 * What to show (docs/ROADMAP_V5.md, V5.1): ideas anyone can try today (free or cheap) always;
 * buying and fitting treatment (panels, bass traps) only once the user says they are ready to.
 */
export function visibleAdvice(list: readonly Advice[], ready: boolean | undefined): Advice[] {
  return ready ? [...list] : list.filter((a) => a.effort !== 'invest');
}

/** How many bigger ideas are kept back, so the page can say they exist. */
export function heldBack(list: readonly Advice[], ready: boolean | undefined): number {
  return ready ? 0 : list.filter((a) => a.effort === 'invest').length;
}
