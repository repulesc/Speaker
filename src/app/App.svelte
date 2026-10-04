<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { i18n } from '../i18n/locale.svelte';
  import AboutDialog from './components/AboutDialog.svelte';
  import BassChart from './components/BassChart.svelte';
  import Dock from './components/Dock.svelte';
  import LayerBar from './components/LayerBar.svelte';
  import Notice from './components/Notice.svelte';
  import PrintSheet from './components/PrintSheet.svelte';
  import PlanView from './components/PlanView.svelte';
  import ShareDialog from './components/ShareDialog.svelte';
  import SideView from './components/SideView.svelte';
  import StepFurnishing from './components/StepFurnishing.svelte';
  import PanelTabs from './components/PanelTabs.svelte';
  import StepGoals from './components/StepGoals.svelte';
  import StepRoom from './components/StepRoom.svelte';
  import StepSpeakers from './components/StepSpeakers.svelte';
  import StepSurfaces from './components/StepSurfaces.svelte';
  import TopBar from './components/TopBar.svelte';
  import ListenPanel from './components/ListenPanel.svelte';
  import TreatPanel from './components/TreatPanel.svelte';
  import VariantTabs from './components/VariantTabs.svelte';
  import WhyPanel from './components/WhyPanel.svelte';
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

  let sheet = $state<'peek' | 'half' | 'full'>('half');
  let shareDialog = $state<ReturnType<typeof ShareDialog>>();
  let aboutDialog = $state<ReturnType<typeof AboutDialog>>();
  let fileInput = $state<HTMLInputElement>();

  // Recompute the analysis (in a worker, debounced) whenever anything in the project changes.
  $effect(() => {
    analysis.run($state.snapshot(workspace.project));
  });

  /** A project that already has a room opens on the results; a new one on the room form. */
  function openFirstSection() {
    const { width, length } = workspace.project.room;
    ui.step = width.value !== null && length.value !== null ? 'results' : 'room';
  }

  // A new section starts at the top of the panel, not wherever the last one was scrolled to.
  let panel = $state<HTMLElement>();
  $effect(() => {
    void ui.step;
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
  <div class="app">
    <a class="skip visually-hidden" href="#panel">{i18n.t('app.skipToContent')}</a>
    <TopBar
      onshare={() => shareDialog?.show()}
      onexport={exportFile}
      onimport={() => fileInput?.click()}
      onprint={() => window.print()}
      onabout={() => aboutDialog?.show()}
    />
    <Notice />

    <main class="workbench" data-sheet={sheet}>
      {#if viewport.wide}<Dock />{/if}

      <section class="map" aria-label={i18n.t('map.label')}>
        <VariantTabs />
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
          {#if analysis.busy}
            <p class="busy" role="status">
              {i18n.t(largeRoom ? 'analysis.updatingLarge' : 'analysis.updating')}
            </p>
          {/if}
        </div>
        {#if viewport.wide}<BassChart />{/if}
      </section>

      <section class="panel" id="panel" tabindex="-1" bind:this={panel}>
        <button
          type="button"
          class="handle"
          aria-label={sheet === 'full' ? i18n.t('sheet.collapse') : i18n.t('sheet.expand')}
          onclick={cycleSheet}
        >
          <span aria-hidden="true"></span>
        </button>

        <div class="content">
          {#if !viewport.wide}<Dock />{/if}
          {#if ui.step === 'results' || ui.step === 'treat' || ui.step === 'listen'}
            <PanelTabs />
          {/if}
          {#if ui.step === 'results'}
            <WhyPanel />
            {#if !viewport.wide}<BassChart />{/if}
          {:else if ui.step === 'treat'}
            <TreatPanel />
          {:else if ui.step === 'listen'}
            <ListenPanel />
          {:else}
            <button type="button" class="btn back" onclick={() => (ui.step = 'results')}>
              ← {i18n.t('panel.close')}
            </button>
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
            {/if}
            <button type="button" class="btn primary" onclick={() => (ui.step = 'results')}>
              {i18n.t('panel.done')}
            </button>
          {/if}

          {#if analysis.error}
            <div class="card error" role="alert">
              <p>{i18n.t('analysis.error')}</p>
            </div>
          {/if}

          <footer>
            <p class="save" role="status" data-state={workspace.saveState}>
              {i18n.t(`project.${workspace.saveState}`)}
            </p>
          </footer>
        </div>
      </section>
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
<ShareDialog bind:this={shareDialog} />
<AboutDialog bind:this={aboutDialog} />
<PrintSheet />

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
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
    font-size: 13px;
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

  /* The workbench: dock, map and panel (docs/REVAMP_PLAN.md). Narrow screens stack them. */
  .workbench {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .map {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 62dvh;
    min-width: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--grid);
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
    background: var(--surface);
  }
  .side.only {
    flex: 1 1 0;
    border-top: 0;
  }
  .busy {
    position: absolute;
    right: 12px;
    bottom: 8px;
    margin: 0;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--ink-muted);
    font-size: 13px;
  }
  .panel {
    padding: 16px var(--gutter) 32px;
    outline: none;
    background: var(--panel);
  }
  .content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    max-width: 40rem;
  }
  .back {
    justify-self: start;
  }
  @media (max-width: 1023px) {
    /* The dock's pressed section toggles back to the results; no extra button needed. */
    .back {
      display: none;
    }
  }
  .handle {
    display: none;
  }
  footer {
    display: grid;
    gap: 4px;
    color: var(--ink-muted);
    font-size: 14px;
  }
  .save[data-state='unavailable'],
  .save[data-state='failed'] {
    color: var(--caution);
  }
  .error {
    border-color: var(--danger);
  }

  /* Desktop: dock | map | panel, the map and the panel each scrolling on their own. */
  @media (min-width: 1024px) {
    .app {
      height: 100dvh;
      min-height: 0;
    }
    .workbench {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr) clamp(360px, 30vw, 420px);
      overflow: hidden;
    }
    .map {
      position: relative;
      height: auto;
      border-bottom: 0;
    }
    .panel {
      overflow-y: auto;
      border-left: 1px solid var(--grid);
    }
  }

  /* Phone: the panel is a bottom sheet under the map; the dock is a scrolling row on top. */
  @media (max-width: 639px) {
    .app {
      height: 100dvh;
      min-height: 0;
    }
    .workbench {
      overflow: hidden;
    }
    .map {
      position: relative;
      flex: 1 1 0;
      height: auto;
      min-height: 200px;
      border-bottom: 0;
    }
    .panel {
      flex: 0 0 var(--sheet-h, 54dvh);
      overflow-y: auto;
      padding-top: 0;
      border-top: 1px solid var(--grid-strong);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      box-shadow: 0 -8px 24px rgb(0 0 0 / 0.35);
      transition: flex-basis 180ms ease-out;
    }
    .workbench[data-sheet='peek'] {
      --sheet-h: 132px;
    }
    .workbench[data-sheet='half'] {
      --sheet-h: 54dvh;
    }
    .workbench[data-sheet='full'] .panel {
      flex: 1 1 auto;
    }
    .workbench[data-sheet='full'] .map {
      flex: 0 0 200px;
    }
    .handle {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 44px;
      border: 0;
      background: var(--panel);
      cursor: pointer;
    }
    .handle span {
      width: 40px;
      height: 4px;
      border-radius: 2px;
      background: var(--ink-muted);
    }
    .content {
      padding-bottom: 24px;
    }
  }
</style>
