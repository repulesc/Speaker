import type { Project } from '../../engine/types';
import { analysis } from '../session.svelte';

/** What the app says about one saved setup: its score and its bass curve at its own seat. */
export interface SetupView {
  score: number;
  bass: { f: number[]; dB: number[] };
}

/** Edits (a drag on the map) come many per second; score the setups once they settle. */
const SETTLE_MS = 300;

let views = $state<Record<string, SetupView>>({});
let ticket = 0;

const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

/**
 * Scores every setup of the project for comparing and for the listening log. The score is the
 * one "Your setup" shows (robust, same seed), so a setup never reads differently in two places.
 */
export const setups = {
  get views() {
    return views;
  },
  async refresh(project: Project) {
    const mine = ++ticket;
    await settle();
    if (mine !== ticket) return;
    const next: Record<string, SetupView> = {};
    await Promise.all(
      project.variants.map(async (variant) => {
        const response = await analysis.ask(
          { ...project, activeVariantId: variant.id },
          { kind: 'setupScore' },
        );
        const result = response && 'setupScore' in response ? response.setupScore : null;
        if (result) next[variant.id] = { score: result.score, bass: result.bassResponse };
      }),
    );
    if (mine === ticket) views = next;
  },
};
