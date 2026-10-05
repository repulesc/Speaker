<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { roomSize } from '../plan/placement';
  import { analysis, projectLabel, SECTIONS, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import ConfidenceMeter from './ConfidenceMeter.svelte';
  import ListenPanel from './ListenPanel.svelte';
  import ResultTabs from './ResultTabs.svelte';
  import RoomSheet from './RoomSheet.svelte';
  import SettingsMenu from './SettingsMenu.svelte';
  import { countDone, setupProgress } from '../state/progress';

  /**
   * The one place for input and answers (owner decisions, docs/ROADMAP_V5.md, V6). Home: one clear
   * "Your room" button, then the result in three tabs (Result, Why, Tips). The button opens every
   * setting on one page; the answer and the settings never mix.
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

  const project = $derived(workspace.project);
  const progress = $derived(setupProgress(project));
  const room = $derived(roomSize(project));
  const home = $derived(ui.step === 'results');

  const roomValue = $derived(
    room
      ? [room.W, room.L, room.H]
          .map((m) => formatLength(m, project.units, 'room', i18n.locale, true))
          .join(' × ')
      : i18n.t('nav.notSet'),
  );
</script>

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
    {#if ui.roomOpen}
      <RoomSheet />
    {:else if home}
      <!-- The settings: one clear button, a summary of the room, how much is set. -->
      <button type="button" class="room-button" onclick={() => (ui.roomOpen = true)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" />
        </svg>
        <span class="room-text">
          <span class="room-title">{i18n.t('nav.room')}</span>
          <span class="room-sub"
            >{roomValue} · {i18n.t('nav.progress', {
              n: countDone(progress),
              total: SECTIONS.length,
            })}</span
          >
        </span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>

      <ResultTabs />

      <div class="foot">
        <ConfidenceMeter report={analysis.result?.confidence ?? null} />
      </div>
    {:else}
      <button type="button" class="back" onclick={() => (ui.step = 'results')}>
        <span aria-hidden="true">‹</span>
        {i18n.t('nav.back')}
      </button>
      <div class="page">
        {#if ui.step === 'listen'}
          <ListenPanel />
        {/if}
      </div>
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
  /* "Your room": clearly a button (owner: the old fold did not look clickable). */
  .room-button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 64px;
    padding: 10px 16px;
    border: 0;
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    text-align: start;
    cursor: pointer;
    box-shadow: var(--card-shadow);
    transition: box-shadow 0.15s ease;
  }
  .room-button:hover {
    box-shadow:
      0 0 0 1.5px var(--accent-fill),
      var(--card-shadow);
  }
  .room-button svg {
    flex: none;
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .room-text {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .room-title {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .room-sub {
    overflow: hidden;
    color: var(--ink-muted);
    font-size: var(--text-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .room-button .chevron {
    color: var(--accent);
    font-size: var(--text-xl);
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
    /* Opaque, no backdrop blur: a blur would make the menu's popover position against this bar
       instead of the screen, and on a phone it would open off screen. */
    background: var(--bg);
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
    font-size: var(--text-xl);
    line-height: 1;
    cursor: pointer;
  }
  .icon:hover:not(:disabled) {
    background: var(--fill);
  }
  /* Disabled stays legible in both themes (owner: undo and redo were hard to see in dark mode). */
  .icon:disabled {
    color: color-mix(in srgb, var(--ink-muted) 70%, var(--bg));
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
