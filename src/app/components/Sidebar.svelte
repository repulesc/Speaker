<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { analysis, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import Colophon from './Colophon.svelte';
  import ListenPage from './ListenPage.svelte';
  import MenuDrawer from './MenuDrawer.svelte';
  import PlacePage from './PlacePage.svelte';
  import SetupPage from './SetupPage.svelte';
  import Steps from './Steps.svelte';
  import Wordmark from './Wordmark.svelte';

  /**
   * The panel: a masthead with the menu, the app and undo / redo, then the three steps (V10: the
   * room's size lives in its own group, and its name shows here only once you give one).
   */
  interface Props {
    onshare: () => void;
    onimage: () => void;
    onprint: () => void;
    onabout: () => void;
  }
  let props: Props = $props();

  const name = $derived(workspace.project.name);
  const saveProblem = $derived(
    workspace.saveState === 'unavailable' || workspace.saveState === 'failed',
  );

  // A sideways swipe on a touch screen moves between the steps.
  const ORDER = ['setup', 'place', 'listen'] as const;
  let start: { x: number; y: number } | null = null;
  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    start = t ? { x: t.clientX, y: t.clientY } : null;
  }
  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < 2 * Math.abs(dy)) return;
    // Not while a slider or the map is being dragged inside the panel.
    if ((e.target as Element).closest('input, select, textarea')) return;
    const i = ORDER.indexOf(ui.tab) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < ORDER.length) ui.tab = ORDER[i]!;
  }
</script>

<div class="sidebar">
  <header class="mast">
    <div class="bar">
      <MenuDrawer {...props} />
      <span class="brand"><Wordmark height={17} /></span>
      {#if name}<span class="room-name" title={name}>{name}</span>{/if}
      <!-- Saving is silent (V9); only a failure is shown, under the bar. -->
      {#if !saveProblem}
        <span class="visually-hidden" role="status">{i18n.t(`project.${workspace.saveState}`)}</span
        >
      {/if}
      <div class="history">
        <button
          type="button"
          class="icon"
          disabled={!workspace.canUndo}
          aria-label={i18n.t('menu.undo')}
          title={i18n.t('menu.undo')}
          onclick={() => workspace.undo()}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M7.5 5 4 8.5 7.5 12" />
            <path d="M4.5 8.5h7a4 4 0 0 1 0 8H9" />
          </svg>
        </button>
        <button
          type="button"
          class="icon"
          disabled={!workspace.canRedo}
          aria-label={i18n.t('menu.redo')}
          title={i18n.t('menu.redo')}
          onclick={() => workspace.redo()}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M12.5 5 16 8.5 12.5 12" />
            <path d="M15.5 8.5h-7a4 4 0 0 0 0 8H11" />
          </svg>
        </button>
      </div>
    </div>
    {#if saveProblem}
      <p class="save-problem" role="status">{i18n.t(`project.${workspace.saveState}`)}</p>
    {/if}
  </header>

  <div class="steps-bar"><Steps /></div>

  <div
    class="body"
    id="step-panel"
    role="tabpanel"
    tabindex="-1"
    aria-labelledby="step-{ui.tab}"
    ontouchstart={onTouchStart}
    ontouchend={onTouchEnd}
  >
    {#if ui.tab === 'setup'}
      <SetupPage />
    {:else if ui.tab === 'place'}
      <PlacePage />
    {:else}
      <ListenPage />
    {/if}

    {#if analysis.error}
      <p class="error" role="alert">{i18n.t('analysis.error')}</p>
    {/if}
  </div>
  <Colophon place="panel" onabout={props.onabout} />
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: var(--bg);
  }
  /* The masthead: the menu, the app, undo and redo; nothing else until you name the room. */
  .mast {
    display: grid;
    gap: 14px;
    padding: 8px 20px 14px 10px;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
  .brand {
    display: flex;
    flex: none;
    align-items: center;
    margin-left: 8px;
  }
  /* The room's name, when it has one: quiet, after a hairline, cut short if long. */
  .room-name {
    min-width: 0;
    margin-left: 12px;
    padding-left: 12px;
    overflow: hidden;
    border-left: 1px solid var(--grid-strong);
    color: var(--ink-muted);
    font-size: var(--text-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .save-problem {
    margin: -6px 0 0 10px;
    color: var(--caution);
    font-size: var(--text-sm);
  }
  .history {
    display: flex;
    margin: 0 -10px 0 auto;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .icon svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .icon:hover:not(:disabled) {
    background: var(--fill);
  }
  .icon:disabled {
    color: var(--grid-strong);
    cursor: default;
  }
  @media (pointer: coarse) {
    .icon {
      width: 44px;
      height: 44px;
    }
  }
  /* The steps stay in reach while the page scrolls. */
  .steps-bar {
    padding: 0 20px;
    background: var(--bg);
  }
  .body {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow-wrap: break-word;
    align-content: start;
    gap: 22px;
    padding: 24px 20px 40px;
    outline: none;
  }
  .error {
    padding: 12px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--danger);
  }
</style>
