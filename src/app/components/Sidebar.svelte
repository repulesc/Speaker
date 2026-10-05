<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { activeVariant, roomSize } from '../plan/placement';
  import {
    analysis,
    projectLabel,
    SECTIONS,
    workspace,
    type SectionId,
    type StepId,
  } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import BassChart from './BassChart.svelte';
  import ConfidenceMeter from './ConfidenceMeter.svelte';
  import ListenPanel from './ListenPanel.svelte';
  import PlacementOptions from './PlacementOptions.svelte';
  import SettingsMenu from './SettingsMenu.svelte';
  import { countDone, setupProgress } from '../state/progress';
  import { SPEAKER_TYPES } from '../../engine/presets/speakerTypes';
  import StepFurnishing from './StepFurnishing.svelte';
  import StepGoals from './StepGoals.svelte';
  import StepRoom from './StepRoom.svelte';
  import StepSpeakers from './StepSpeakers.svelte';
  import StepSurfaces from './StepSurfaces.svelte';
  import SuggestionCard from './SuggestionCard.svelte';
  import TreatPanel from './TreatPanel.svelte';
  import WhyPanel from './WhyPanel.svelte';

  /**
   * The one place for input and answers. Home: the result first (what it is, what to try), then
   * the settings, folded (owner decision, docs/ROADMAP_V5.md: the answer and the settings are
   * kept strictly apart). Each row opens its own page with a way back, as in the settings apps.
   */
  interface Props {
    onshare: () => void;
    onimage: () => void;
    onexport: () => void;
    onimport: () => void;
    onprint: () => void;
    onabout: () => void;
  }
  let props: Props = $props();

  const HOME_CARDS =
    typeof location !== 'undefined' && new URLSearchParams(location.search).get('home') === 'cards';
  /** Simple line glyphs for the cards (24 × 24). */
  const ICONS: Partial<Record<StepId, string>> = {
    room: 'M4 5h16v14H4z',
    surfaces: 'M4 6h16M4 12h16M4 18h16',
    furnishing: 'M4 13v5M20 13v5M4 14h16M6 14v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3',
    speakers: 'M7 3h10v18H7zM12 8.5a1.2 1.2 0 1 0 0 .01M12 15a3 3 0 1 0 0 .01',
    goals: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
  };

  const project = $derived(workspace.project);
  const progress = $derived(setupProgress(project));
  const variant = $derived(activeVariant(project));
  const room = $derived(roomSize(project));
  const home = $derived(ui.step === 'results');

  const roomValue = $derived(
    room
      ? [room.W, room.L, room.H]
          .map((m) => formatLength(m, project.units, 'room', i18n.locale, true))
          .join(' × ')
      : i18n.t('nav.notSet'),
  );
  const goalCount = $derived(Object.values(project.goals.weights).filter((w) => w).length);

  /** The speaker type the speaker still matches, by its typical size (as on the Speakers page). */
  const speakerType = $derived(
    SPEAKER_TYPES.find(
      (t) =>
        Math.abs((project.speaker.dimensions.w.value ?? -1) - t.w) < 1e-6 &&
        Math.abs((project.speaker.dimensions.d.value ?? -1) - t.d) < 1e-6 &&
        project.speaker.driverLayout.value === t.driverLayout,
    ) ?? null,
  );
  const wallsValue = $derived.by(() => {
    const walls = ['front', 'back', 'left', 'right'] as const;
    const first = project.surfaces.base.front;
    const known = walls.every((b) => project.surfaces.baseCertainty[b] !== 'unknown');
    return known && walls.every((b) => project.surfaces.base[b] === first)
      ? i18n.t(`surface.${first}`)
      : '';
  });

  const values: Partial<Record<StepId, () => string>> = {
    room: () => roomValue,
    surfaces: () => wallsValue,
    speakers: () => (speakerType ? i18n.t(`speakers.type.${speakerType.id}.short`) : ''),
    furnishing: () =>
      variant.objects.length ? String(variant.objects.length) : i18n.t('nav.none'),
    goals: () => (goalCount ? String(goalCount) : i18n.t('nav.none')),
  };
  const label = (id: StepId) => i18n.t(`dock.${id}`);
</script>

<!-- The "Your room" group as four-up cards: one of two looks for the owner to choose from
     (`?home=cards`, docs/DESIGN_BRIEF_V4.md); rows are the default. -->
{#snippet cards(ids: readonly StepId[])}
  <ul class="cards">
    {#each ids as id (id)}
      <li>
        <button type="button" class="card" onclick={() => (ui.step = id)}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d={ICONS[id] ?? ''} />
          </svg>
          <span class="card-title">{label(id)}</span>
          <span class="value">{values[id]?.() || i18n.t('nav.notSet')}</span>
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet rows(ids: readonly StepId[])}
  <ul class="list">
    {#each ids as id (id)}
      {@const status = progress[id as SectionId]}
      <li>
        <button type="button" class="row" onclick={() => (ui.step = id)}>
          <svg
            class="mark status-{status}"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6.5" />
            {#if status === 'done'}<path d="M5 8.4l2 2 4-4.4" />{/if}
            {#if status === 'partial'}<path class="half" d="M8 1.5a6.5 6.5 0 0 1 0 13z" />{/if}
          </svg>
          <span>{label(id)}</span>
          <span class="value">{values[id]?.() ?? ''}</span>
          <span class="chevron" aria-hidden="true">›</span>
          <span class="visually-hidden">{i18n.t(`nav.status.${status}`)}</span>
        </button>
      </li>
    {/each}
  </ul>
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
      <section class="settings" aria-labelledby="nav-room">
        <h3 class="group-title">
          <button
            type="button"
            class="fold"
            id="nav-room"
            aria-expanded={ui.settingsOpen}
            aria-controls="settings-body"
            onclick={() => (ui.settingsOpen = !ui.settingsOpen)}
          >
            <span class="chevron" class:open={ui.settingsOpen} aria-hidden="true">›</span>
            {i18n.t('nav.room')}
            <span class="progress" data-testid="progress">
              <span class="bar" aria-hidden="true"
                ><span style="width:{(countDone(progress) / SECTIONS.length) * 100}%"></span></span
              >
              {i18n.t('nav.progress', { n: countDone(progress), total: SECTIONS.length })}
            </span>
          </button>
        </h3>
        {#if ui.settingsOpen}
          <div class="settings-body" id="settings-body">
            {#if HOME_CARDS}
              {@render cards(SECTIONS)}
            {:else}
              {@render rows(SECTIONS)}
            {/if}
            <h4 class="group-title">{i18n.t('nav.placement')}</h4>
            <PlacementOptions />
          </div>
        {/if}
      </section>
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
        {:else if ui.step === 'bass'}
          <h2>{i18n.t('nav.bass')}</h2>
          <BassChart />
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
  .settings,
  .settings-body {
    display: grid;
    gap: 10px;
  }
  .fold {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .fold .chevron {
    display: inline-block;
    width: 12px;
    transition: transform 150ms ease;
  }
  .fold .chevron.open {
    transform: rotate(90deg);
  }
  .progress {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    font-weight: 400;
  }
  .bar {
    width: 44px;
    height: 4px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--grid-strong);
  }
  .bar span {
    display: block;
    height: 100%;
    border-radius: 2px;
    background: var(--ok);
    transition: width 0.3s ease;
  }
  .mark {
    flex: none;
    margin-right: 10px;
    fill: none;
    stroke: var(--ink-muted);
    stroke-width: 1.4;
  }
  .mark.status-done circle {
    fill: var(--ok);
    stroke: var(--ok);
  }
  .mark.status-done path {
    stroke: #fff;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .mark .half {
    fill: var(--ok);
    stroke: none;
  }
  .mark.status-partial circle {
    stroke: var(--ok);
  }
  @media (prefers-reduced-motion: reduce) {
    .bar span {
      transition: none;
    }
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .card {
    display: grid;
    gap: 2px;
    justify-items: start;
    width: 100%;
    min-height: 96px;
    padding: 12px 14px;
    border: 0;
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .card svg {
    margin-bottom: 6px;
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .card-title {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .card .value {
    color: var(--ink-muted);
    font-size: var(--text-sm);
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
    background: color-mix(in srgb, var(--bg) 94%, transparent);
    backdrop-filter: saturate(180%) blur(16px);
    border-bottom: 1px solid var(--grid);
  }
  .title {
    flex: 1;
    min-width: 0;
  }
  .save {
    color: var(--ink-muted);
    font-size: var(--text-sm);
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
    font-size: var(--text-md);
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
    font-size: var(--text-md);
    cursor: pointer;
  }
  .back span {
    font-size: var(--text-xl);
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
