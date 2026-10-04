import type { ModeField, Project } from '../../engine/types';
import { analysis } from '../session.svelte';

/** The room-mode explorer's pressure pattern for the chosen bass note (computed in the worker). */
let field = $state<ModeField | null>(null);
let ticket = 0;

export const modeExplorer = {
  get field() {
    return field;
  },
  /** `frequency` null turns the explorer off. */
  async refresh(project: Project, frequency: number | null) {
    const mine = ++ticket;
    if (frequency === null) {
      field = null;
      return;
    }
    const response = await analysis.ask(project, { kind: 'modeField', frequency });
    if (mine !== ticket) return;
    field = response && 'modeField' in response ? response.modeField : null;
  },
};
