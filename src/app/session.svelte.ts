import { i18n } from '../i18n/locale.svelte';
import { defaultSystem } from '../units/format';
import { AnalysisRunner } from './state/analysis.svelte';
import { browserStorage } from './state/persistence';
import { Workspace } from './state/workspace.svelte';

/** The one open workspace and analysis runner for this page. */
export const workspace = new Workspace(browserStorage(), {
  system: defaultSystem(navigator.language),
});

/** The name to show for a setup variant: its own, or "Current" in the current language. */
export function variantLabel(name: string): string {
  return name.trim() || i18n.t('variant.current');
}

/** The name to show for a project: its own, or "Untitled room" in the current language. */
export function projectLabel(name: string): string {
  return name.trim() || i18n.t('project.untitled');
}

export const analysis = new AnalysisRunner();

export type StepId = 'room' | 'surfaces' | 'furnishing' | 'speakers' | 'goals' | 'results';
export const STEPS: readonly StepId[] = [
  'room',
  'surfaces',
  'furnishing',
  'speakers',
  'goals',
  'results',
];
/** Steps that Quick mode treats as optional: they only sharpen the result. */
export const OPTIONAL_IN_QUICK: readonly StepId[] = ['surfaces', 'furnishing'];

/** Transient message under the top bar (import results, errors). */
export const notice = $state<
  { kind: 'success' | 'error'; text: string } | { kind: 'none'; text: '' }
>({
  kind: 'none',
  text: '',
});

export function showNotice(kind: 'success' | 'error', text: string): void {
  Object.assign(notice, { kind, text });
}

export function clearNotice(): void {
  Object.assign(notice, { kind: 'none', text: '' });
}
