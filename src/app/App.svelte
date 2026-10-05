<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { i18n } from '../i18n/locale.svelte';
  import AboutDialog from './components/AboutDialog.svelte';
  import LayerBar from './components/LayerBar.svelte';
  import Notice from './components/Notice.svelte';
  import PrintSheet from './components/PrintSheet.svelte';
  import PlanView from './components/PlanView.svelte';
  import ShareDialog from './components/ShareDialog.svelte';
  import SideView from './components/SideView.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Survey from './components/Survey.svelte';
  import { goalOf } from './state/goal';
  import { APP_NAME } from './config';
  import { downloadText } from './download';
  import { analysis, projectLabel, showNotice, workspace } from './session.svelte';
  import { ui } from './ui.svelte';
  import { roomSize } from './plan/placement';
  import { viewport } from './viewport.svelte';
  import { SIZE_LIMITS } from './state/limits';
  import {
    exportFileName,
    parseProjectJson,
    serializeProject,
    type ReadResult,
  } from './state/projectFile';
  import { decodeShare, hasShare } from './state/share';
  import { makeShareImage, shareOrSave } from './shareImage';
  import { formatLength } from '../units/format';

  let sheet = $state<'peek' | 'half' | 'full'>('half');
  let shareDialog = $state<ReturnType<typeof ShareDialog>>();
  let aboutDialog = $state<ReturnType<typeof AboutDialog>>();
  let fileInput = $state<HTMLInputElement>();

  // Recompute the analysis (in a worker, debounced) whenever anything in the project changes.
  $effect(() => {
    analysis.run($state.snapshot(workspace.project));
  });

  /** A project that already has a room opens on the results; a new one on the survey. */
  function openFirstSection() {
    const { width, length } = workspace.project.room;
    const known = width.value !== null && length.value !== null;
    // Behind the survey the home page waits (the room form would repeat the survey's fields).
    ui.step = 'results';
    ui.survey = !known;
  }

  // A new or other project (menu, import) opens the same way.
  let shownProject = workspace.project.id;
  $effect(() => {
    const id = workspace.project.id;
    if (id === shownProject) return;
    shownProject = id;
    untrack(openFirstSection);
  });

  // The map shows what the goal asks: where the speakers go (seat fixed) or where to sit.
  let shownGoal = goalOf(workspace.project);
  ui.layer = shownGoal === 'speakers' ? 'speakers' : 'goals';
  $effect(() => {
    const goal = goalOf(workspace.project);
    if (goal === shownGoal) return;
    shownGoal = goal;
    ui.layer = goal === 'speakers' ? 'speakers' : 'goals';
  });

  // A new section starts at the top of the panel, not wherever the last one was scrolled to.
  let panel = $state<HTMLElement>();
  $effect(() => {
    void ui.step;
    void ui.tab;
    void ui.roomOpen;
    if (panel) panel.scrollTop = 0;
  });

  openFirstSection(); // before the first render, so a reload never flashes the wrong panel

  function cycleSheet() {
    sheet = sheet === 'peek' ? 'half' : sheet === 'half' ? 'full' : 'peek';
  }

  // ── Import, export, share links ──────────────────────────────────────────

  function handleImport(result: ReadResult) {
    if (!result.ok) {
      showNotice(
        'error',
        i18n.t(
          `import.error.${result.reason}`,
          'detail' in result ? { detail: result.detail } : {},
        ),
      );
      return;
    }
    if (workspace.index.length >= SIZE_LIMITS.projects) {
      showNotice('error', i18n.t('import.error.tooMany'));
      return;
    }
    workspace.importProject(result.project);
    showNotice('success', i18n.t('import.success', { name: projectLabel(result.project.name) }));
  }

  async function openFromHash() {
    if (!hasShare(location.hash)) return;
    const result = await decodeShare(location.hash);
    history.replaceState(null, '', location.pathname + location.search);
    handleImport(result);
  }

  async function onFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > SIZE_LIMITS.fileBytes) return handleImport({ ok: false, reason: 'tooBig' });
    handleImport(parseProjectJson(await file.text()));
  }

  /** A clean picture of the room, its map and the answer, to post or send. */
  async function shareImage() {
    const plan = document.querySelector<HTMLElement>('section.plan');
    const size = roomSize(workspace.project);
    if (!plan || !size) return showNotice('error', i18n.t('image.needRoom'));
    const say = document.querySelector('[data-testid="say"]')?.textContent?.trim();
    const verdict = document.querySelector('[data-share="verdict"]')?.textContent?.trim();
    const fmt = (m: number) => formatLength(m, workspace.project.units, 'room', i18n.locale);
    const blob = await makeShareImage(plan, {
      title: projectLabel(workspace.project.name),
      subtitle: i18n.t('image.subtitle', { width: fmt(size.W), length: fmt(size.L) }),
      lines: [say, verdict].filter((t): t is string => Boolean(t)),
      footer: `${APP_NAME} · ${location.host}${location.pathname}`,
    });
    if (!blob) return showNotice('error', i18n.t('image.failed'));
    await shareOrSave(blob, `${projectLabel(workspace.project.name)}.png`);
  }

  function exportFile() {
    const project = $state.snapshot(workspace.project);
    downloadText(exportFileName(project, i18n.t('project.untitled')), serializeProject(project));
  }

  // ── Lifecycle and shortcuts ──────────────────────────────────────────────

  function onKeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey)) return;
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) workspace.undo();
    else if ((key === 'z' && event.shiftKey) || key === 'y') workspace.redo();
    else return;
    event.preventDefault();
  }

  onMount(() => {
    void openFromHash();
    const flush = () => workspace.flush();
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  });

  onDestroy(() => analysis.dispose());

  /** Big rooms have many more resonances to sum: say why the update takes a while (R5, M10). */
  const LARGE_ROOM_M2 = 150;
  const largeRoom = $derived.by(() => {
    const size = roomSize(workspace.project);
    return size !== null && size.W * size.L > LARGE_ROOM_M2;
  });
</script>

<svelte:window onkeydown={onKeydown} onhashchange={openFromHash} />

<!-- A rendering error must never leave a blank page (R0 audit): offer a way out instead. -->
<svelte:boundary onerror={(error) => console.error(error)}>
  <div
    class="app"
    data-sheet={sheet}
    inert={ui.survey}
    class:reveal={ui.reveal}
    class:panel-hidden={ui.panelHidden && viewport.wide}
  >
    <a class="skip visually-hidden" href="#panel">{i18n.t('app.skipToContent')}</a>
    <h1 class="visually-hidden">{APP_NAME}</h1>

    <!-- One side for everything you set and read, one side for the room (owner feedback after R5). -->
    <aside
      class="panel"
      id="panel"
      tabindex="-1"
      bind:this={panel}
      aria-label={i18n.t('panel.label')}
    >
      {#if !viewport.wide}
        <button
          type="button"
          class="handle"
          aria-label={sheet === 'full' ? i18n.t('sheet.collapse') : i18n.t('sheet.expand')}
          onclick={cycleSheet}
        >
          <span aria-hidden="true"></span>
        </button>
      {/if}
      <Sidebar
        onshare={() => shareDialog?.show()}
        onimage={shareImage}
        onexport={exportFile}
        onimport={() => fileInput?.click()}
        onprint={() => window.print()}
        onabout={() => aboutDialog?.show()}
      />
    </aside>

    <main class="canvas" aria-label={i18n.t('map.label')}>
      <Notice />
      <LayerBar />
      <div class="stage">
        {#if viewport.compact && ui.sideOpen}
          <section class="side only" aria-label={i18n.t('plan.sideLabel')}><SideView /></section>
        {:else}
          <section class="plan" aria-label={i18n.t('plan.label')}><PlanView /></section>
          {#if ui.sideOpen}
            <section class="side" aria-label={i18n.t('plan.sideLabel')}><SideView /></section>
          {/if}
        {/if}
        {#if analysis.busy && largeRoom}
          <p class="busy" role="status">
            {i18n.t(largeRoom ? 'analysis.updatingLarge' : 'analysis.updating')}
          </p>
        {/if}
      </div>
    </main>
  </div>

  {#snippet failed(error, reset)}
    <main class="crashed" role="alert">
      <h1>{i18n.t('crash.title')}</h1>
      <p>{i18n.t('crash.body')}</p>
      <details>
        <summary>{i18n.t('crash.details')}</summary>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </details>
      <div class="actions">
        <button type="button" class="btn" onclick={exportFile}>{i18n.t('crash.export')}</button>
        <button
          type="button"
          class="btn primary"
          onclick={() => {
            workspace.newProject();
            reset();
          }}>{i18n.t('crash.newProject')}</button
        >
      </div>
    </main>
  {/snippet}
</svelte:boundary>

<input
  bind:this={fileInput}
  class="visually-hidden"
  type="file"
  accept=".json,application/json"
  tabindex="-1"
  aria-hidden="true"
  onchange={onFile}
/>
{#if ui.survey}<Survey />{/if}
<ShareDialog bind:this={shareDialog} />
<AboutDialog bind:this={aboutDialog} />
<PrintSheet />

<style>
  .app {
    display: flex;
    flex-direction: column-reverse;
    height: 100dvh;
    overflow: hidden;
  }
  /* After the survey: the room and the answer fade in once. */
  .app.reveal .canvas,
  .app.reveal .panel {
    animation: reveal 0.7s ease both;
  }
  .app.reveal .panel {
    animation-delay: 0.15s;
  }
  @keyframes reveal {
    from {
      opacity: 0;
      transform: scale(0.985);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .app.reveal .canvas,
    .app.reveal .panel {
      animation: none;
    }
  }
  .crashed {
    display: grid;
    gap: 16px;
    max-width: 36rem;
    margin: 0 auto;
    padding: 48px 16px;
  }
  .crashed pre {
    white-space: pre-wrap;
    font-size: var(--text-sm);
  }
  .crashed .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .skip:focus {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 50;
    width: auto;
    height: auto;
    margin: 0;
    padding: 8px 16px;
    clip-path: none;
    background: var(--surface);
    border: 2px solid var(--accent);
    border-radius: var(--radius-sm);
  }

  /* Narrow screens: the room on top, the panel as a sheet below it. */
  .canvas {
    position: relative;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    min-height: 200px;
    min-width: 0;
    background: var(--surface);
  }
  .stage {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .plan {
    flex: 1 1 0;
    min-height: 0;
  }
  .side {
    flex: 0 0 210px;
    min-height: 0;
    border-top: 1px solid var(--grid);
  }
  .side.only {
    flex: 1 1 0;
    border-top: 0;
  }
  .busy {
    position: absolute;
    right: 16px;
    bottom: 12px;
    margin: 0;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--fill);
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .panel {
    --sheet-handle: 44px;
    flex: 0 0 var(--sheet-h, 54dvh);
    overflow-y: auto;
    outline: none;
    background: var(--bg);
    border-top: 1px solid var(--grid);
    border-radius: 14px 14px 0 0;
    box-shadow: 0 -6px 24px rgb(0 0 0 / 0.12);
    transition: flex-basis 180ms ease-out;
  }
  .app[data-sheet='peek'] {
    --sheet-h: 140px;
  }
  .app[data-sheet='full'] .panel {
    flex: 1 1 auto;
  }
  .app[data-sheet='full'] .canvas {
    flex: 0 0 200px;
  }
  .handle {
    position: sticky;
    top: 0;
    z-index: 4;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 44px;
    border: 0;
    background: var(--bg);
    cursor: pointer;
  }
  .handle span {
    width: 36px;
    height: 5px;
    border-radius: 3px;
    background: var(--grid-strong);
  }

  /* Wide screens: the panel on the left, the room filling the rest. */
  @media (min-width: 1024px) {
    .app {
      flex-direction: row;
    }
    .panel {
      --sheet-handle: 0px;
      flex: 0 0 380px;
      border-top: 0;
      border-right: 1px solid var(--grid);
      border-radius: 0;
      box-shadow: none;
    }
    .canvas {
      flex: 1 1 0;
    }
    /* The panel can be hidden for a full-width room (owner decision, docs/DESIGN_BRIEF_V4.md). */
    .app.panel-hidden .panel {
      display: none;
    }
  }
</style>
