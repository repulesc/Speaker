<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { activeVariant, roomSize } from '../plan/placement';
  import { analysis, projectLabel, SECTIONS, workspace, type StepId } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import ConfidenceMeter from './ConfidenceMeter.svelte';
  import ListenPanel from './ListenPanel.svelte';
  import SettingsMenu from './SettingsMenu.svelte';
  import StepFurnishing from './StepFurnishing.svelte';
  import StepGoals from './StepGoals.svelte';
  import StepRoom from './StepRoom.svelte';
  import StepSpeakers from './StepSpeakers.svelte';
  import StepSurfaces from './StepSurfaces.svelte';
  import SuggestionCard from './SuggestionCard.svelte';
  import TreatPanel from './TreatPanel.svelte';
  import WhyPanel from './WhyPanel.svelte';

  /**
   * The one place for input and answers (owner feedback after R5: settings were scattered over
   * the top, left and right). Home: the recommendation, then a list of everything; each row
   * opens its own page with a way back, as in the platform settings apps.
   */
  interface Props {
    onshare: () => void;
    onexport: () => void;
    onimport: () => void;
    onprint: () => void;
    onabout: () => void;
  }
  let props: Props = $props();

  const project = $derived(workspace.project);
  const variant = $derived(activeVariant(project));
  const room = $derived(roomSize(project));
  const ok = $derived(analysis.result?.status === 'ok' ? analysis.result : null);
  const home = $derived(ui.step === 'results');

  const roomValue = $derived(
    room
      ? [room.W, room.L, room.H]
          .map((m) => formatLength(m, project.units, 'room', i18n.locale, true))
          .join(' × ')
      : i18n.t('nav.notSet'),
  );
  const goalCount = $derived(Object.values(project.goals.weights).filter((w) => w).length);
  const problems = $derived(
    ok?.findings.filter((f) => f.severity === 'red-flag' || f.severity === 'caution').length ?? 0,
  );
  const notes = $derived(project.notes.filter((n) => n.variantId === variant.id).length);

  const values: Partial<Record<StepId, () => string>> = {
    room: () => roomValue,
    furnishing: () =>
      variant.objects.length ? String(variant.objects.length) : i18n.t('nav.none'),
    goals: () => (goalCount ? String(goalCount) : i18n.t('nav.none')),
    why: () => (ok ? String(problems) : ''),
    treat: () => (ok ? String(ok.advice.treatment.length + ok.advice.settings.length) : ''),
    listen: () => (notes ? String(notes) : ''),
  };
  const label = (id: StepId) =>
    i18n.t(id === 'why' || id === 'treat' || id === 'listen' ? `nav.${id}` : `dock.${id}`);
</script>

{#snippet rows(ids: readonly StepId[], title: string, titleId: string)}
  <section aria-labelledby={titleId}>
    <h3 class="group-title" id={titleId}>{title}</h3>
    <ul class="list">
      {#each ids as id (id)}
        <li>
          <button type="button" class="row" onclick={() => (ui.step = id)}>
            <span>{label(id)}</span>
            <span class="value">{values[id]?.() ?? ''}</span>
            <span class="chevron" aria-hidden="true">›</span>
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/snippet}

<div class="sidebar">
  <header class="head">
    <SettingsMenu {...props} />
    <div class="title">
      <p class="name" title={projectLabel(project.name)}>{projectLabel(project.name)}</p>
      <p class="save" role="status" data-state={workspace.saveState}>
        {i18n.t(`project.${workspace.saveState}`)}
      </p>
    </div>
    <div class="history">
      <button
        type="button"
        class="icon"
        disabled={!workspace.canUndo}
        aria-label={i18n.t('menu.undo')}
        onclick={() => workspace.undo()}>↶</button
      >
      <button
        type="button"
        class="icon"
        disabled={!workspace.canRedo}
        aria-label={i18n.t('menu.redo')}
        onclick={() => workspace.redo()}>↷</button
      >
    </div>
  </header>

  <div class="body">
    {#if home}
      <SuggestionCard />
      {@render rows(SECTIONS, i18n.t('nav.room'), 'nav-room')}
      {@render rows(['why', 'treat', 'listen'], i18n.t('nav.results'), 'nav-results')}
      <div class="foot">
        <ConfidenceMeter report={analysis.result?.confidence ?? null} />
      </div>
    {:else}
      <button type="button" class="back" onclick={() => (ui.step = 'results')}>
        <span aria-hidden="true">‹</span>
        {i18n.t('nav.back')}
      </button>
      <div class="page">
        {#if ui.step === 'room'}
          <StepRoom />
        {:else if ui.step === 'surfaces'}
          <StepSurfaces />
        {:else if ui.step === 'furnishing'}
          <StepFurnishing />
        {:else if ui.step === 'speakers'}
          <StepSpeakers />
        {:else if ui.step === 'goals'}
          <StepGoals />
        {:else if ui.step === 'why'}
          <WhyPanel />
        {:else if ui.step === 'treat'}
          <TreatPanel />
        {:else if ui.step === 'listen'}
          <ListenPanel />
        {/if}
      </div>
      {#if SECTIONS.includes(ui.step as (typeof SECTIONS)[number])}
        <button type="button" class="btn primary done" onclick={() => (ui.step = 'results')}>
          {i18n.t('panel.done')}
        </button>
      {/if}
    {/if}

    {#if analysis.error}
      <p class="error" role="alert">{i18n.t('analysis.error')}</p>
    {/if}
  </div>
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: var(--bg);
  }
  .head {
    position: sticky;
    top: var(--sheet-handle, 0px);
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    padding: 6px 10px;
    background: color-mix(in srgb, var(--bg) 85%, transparent);
    backdrop-filter: saturate(180%) blur(16px);
    border-bottom: 1px solid var(--grid);
  }
  .title {
    flex: 1;
    min-width: 0;
  }
  .save {
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }
  .name {
    min-width: 0;
    overflow: hidden;
    font-size: var(--text-md);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .history {
    display: flex;
  }
  .icon {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--accent);
    font-size: var(--text-lg);
    cursor: pointer;
  }
  .icon:disabled {
    color: var(--ink-muted);
    opacity: 0.4;
    cursor: default;
  }
  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: 22px;
    padding: 16px 16px 32px;
  }
  .back {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    margin: -8px 0 -12px -8px;
    padding: 0 8px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: var(--text-lg);
    cursor: pointer;
  }
  .back span {
    font-size: 26px;
    line-height: 1;
  }
  .page {
    display: grid;
    gap: 16px;
  }
  .done {
    width: 100%;
  }
  .foot {
    display: grid;
    justify-items: start;
    gap: 6px;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .save[data-state='unavailable'],
  .save[data-state='failed'] {
    color: var(--caution);
  }
  .error {
    padding: 12px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--danger);
  }
</style>
