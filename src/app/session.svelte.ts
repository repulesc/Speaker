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

/** What the right panel shows: the findings ("results"), or one section's form (docs/REVAMP_PLAN.md). */
export type StepId =
  'room' | 'surfaces' | 'furnishing' | 'speakers' | 'goals' | 'results' | 'treat';
/** The panel's own views (tabs); every other step is a form opened from the dock. */
export type TabId = 'results' | 'treat';
export type SectionId = Exclude<StepId, TabId>;
/** The dock, top to bottom. */
export const SECTIONS: readonly SectionId[] = [
  'room',
  'surfaces',
  'furnishing',
  'speakers',
  'goals',
];

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
