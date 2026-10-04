import type { Project } from '../../engine/types';
import { analysis } from '../session.svelte';

/** What the app says about one saved setup: its score and its bass curve at its own seat. */
export interface SetupView {
  score: number;
  bass: { f: number[]; dB: number[] };
}

let views = $state<Record<string, SetupView>>({});
let ticket = 0;

/** Scores every setup of the project (compare and listening views), one cheap probe each. */
export const setups = {
  get views() {
    return views;
  },
  async refresh(project: Project) {
    const mine = ++ticket;
    const next: Record<string, SetupView> = {};
    await Promise.all(
      project.variants.map(async (variant) => {
        const response = await analysis.ask(
          { ...project, activeVariantId: variant.id },
          { kind: 'explain', seat: { x: variant.listener.ears.x, y: variant.listener.ears.y } },
        );
        const explanation = response && 'explanation' in response ? response.explanation : null;
        if (explanation) {
          next[variant.id] = { score: explanation.score, bass: explanation.bassResponse };
        }
      }),
    );
    if (mine === ticket) views = next;
  },
};
