<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { roomSize } from '../plan/placement';
  import { analysis, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import ListenPage from './ListenPage.svelte';
  import PlacePage from './PlacePage.svelte';
  import ProjectName from './ProjectName.svelte';
  import SettingsMenu from './SettingsMenu.svelte';
  import SetupPage from './SetupPage.svelte';
  import Steps from './Steps.svelte';

  /**
   * The panel (docs/ROADMAP_V8.md §2): a masthead with the app, the project's name (edit it where
   * it is) and undo / redo, then three steps named after what you do: Set up, Place, Listen.
   */
  interface Props {
    onshare: () => void;
    onimage: () => void;
    onprint: () => void;
    onabout: () => void;
  }
  let props: Props = $props();

  const project = $derived(workspace.project);
  const room = $derived(roomSize(project));
  const roomValue = $derived(
    room
      ? [room.W, room.L, room.H]
          .map((m) => formatLength(m, project.units, 'room', i18n.locale, true))
          .join(' × ')
      : i18n.t('nav.notSet'),
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
      <SettingsMenu {...props} />
      <span class="brand" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="18" height="18">
          <rect x="2.5" y="3" width="4" height="3.4" rx="0.8" />
          <rect x="13.5" y="3" width="4" height="3.4" rx="0.8" />
          <circle cx="10" cy="15.5" r="1.9" />
          <path d="M4.5 7.6 10 13.4 15.5 7.6" />
        </svg>
        Nodo
      </span>
      <span class="save" role="status" data-state={workspace.saveState}>
        {i18n.t(`project.${workspace.saveState}`)}
      </span>
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
    <div class="project">
      <ProjectName />
      <p class="meta">{roomValue}</p>
    </div>
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
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: var(--bg);
  }
  /* The masthead: the app, the project, undo and redo. Quiet; the name carries it. */
  .mast {
    display: grid;
    gap: 14px;
    padding: 8px 20px 18px 10px;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-left: 2px;
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .brand svg {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.3;
    stroke-linejoin: round;
  }
  .brand rect,
  .brand circle {
    fill: var(--accent);
    stroke: none;
  }
  .save {
    margin-left: auto;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .save[data-state='unavailable'],
  .save[data-state='failed'] {
    color: var(--caution);
  }
  .history {
    display: flex;
    margin-right: -10px;
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
  .project {
    display: grid;
    gap: 2px;
    padding-left: 10px;
  }
  .meta {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }
  /* The steps stay in reach while the page scrolls. */
  .steps-bar {
    padding: 0 20px;
    background: var(--bg);
  }
  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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
