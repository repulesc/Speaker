import type { Placement, Project, SeatLayers } from '../../engine/types';
import { analysis } from '../session.svelte';

/**
 * Previewing a best-spot candidate: the map shows where the seat could go with *that* candidate's
 * speakers. The analysis itself only carries the layers for the speakers as they are now.
 */
let layers = $state<SeatLayers | null>(null);
let ticket = 0;

export const preview = {
  get layers() {
    return layers;
  },
  /** `speakers` null = no preview: the map falls back to the analysis. */
  async refresh(project: Project, speakers: Placement['speakers'] | null) {
    const mine = ++ticket;
    if (!speakers) {
      layers = null;
      return;
    }
    const response = await analysis.ask(project, { kind: 'layers', speakers });
    if (mine !== ticket) return;
    layers = response && 'layers' in response ? response.layers : null;
  },
};
