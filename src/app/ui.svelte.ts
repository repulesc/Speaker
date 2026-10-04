import type { BoundaryId } from '../engine/types';
import type { StepId } from './session.svelte';

/** What the user is currently looking at or has selected. Not saved with the project. */
export type Selection =
  | { kind: 'none' }
  | { kind: 'speaker'; side: 'left' | 'right' }
  | { kind: 'seat' }
  | { kind: 'object'; id: string };

let step = $state<StepId>('room');
let selection = $state<Selection>({ kind: 'none' });
let boundary = $state<BoundaryId>('left');
let view = $state<'top' | 'side'>('top');

export const ui = {
  get step() {
    return step;
  },
  set step(value: StepId) {
    step = value;
  },
  get selection() {
    return selection;
  },
  select(value: Selection) {
    selection = value;
  },
  /** The wall, floor or ceiling shown in the Surfaces step. */
  get boundary() {
    return boundary;
  },
  set boundary(value: BoundaryId) {
    boundary = value;
  },
  /** Which drawing is visible when only one fits (tablet, phone). */
  get view() {
    return view;
  },
  set view(value: 'top' | 'side') {
    view = value;
  },
};
