<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { i18n } from '../i18n/locale.svelte';
  import AboutDialog from './components/AboutDialog.svelte';
  import Notice from './components/Notice.svelte';
  import RoomPlan from './components/RoomPlan.svelte';
  import ShareDialog from './components/ShareDialog.svelte';
  import StepNav from './components/StepNav.svelte';
  import StepPlaceholder from './components/StepPlaceholder.svelte';
  import StepRoom from './components/StepRoom.svelte';
  import Stepper from './components/Stepper.svelte';
  import TopBar from './components/TopBar.svelte';
  import Welcome from './components/Welcome.svelte';
  import { prefs } from './prefs.svelte';
  import { analysis, projectLabel, showNotice, workspace, type StepId } from './session.svelte';
  import { SIZE_LIMITS } from './state/limits';
  import {
    exportFileName,
    parseProjectJson,
    serializeProject,
    type ReadResult,
  } from './state/projectFile';
  import { decodeShare, hasShare } from './state/share';

  let step = $state<StepId>('room');
  let sheet = $state<'peek' | 'half' | 'full'>('half');
  let shareDialog = $state<ReturnType<typeof ShareDialog>>();
  let aboutDialog = $state<ReturnType<typeof AboutDialog>>();
  let fileInput = $state<HTMLInputElement>();

  // Recompute the analysis (in a worker, debounced) whenever anything in the project changes.
  $effect(() => {
    analysis.run($state.snapshot(workspace.project));
  });

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
    const url = URL.createObjectURL(
      new Blob([serializeProject(project)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName(project, i18n.t('project.untitled'));
    link.click();
    URL.revokeObjectURL(url);
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
</script>

<svelte:window onkeydown={onKeydown} onhashchange={openFromHash} />

<div class="app">
  <a class="skip visually-hidden" href="#panel">{i18n.t('app.skipToContent')}</a>
  <TopBar
    onshare={() => shareDialog?.show()}
    onexport={exportFile}
    onimport={() => fileInput?.click()}
    onabout={() => aboutDialog?.show()}
  />
  <Notice />

  <main class="workspace" data-sheet={sheet}>
    <section class="drawing" aria-label={i18n.t('plan.label')}>
      <RoomPlan project={workspace.project} />
      {#if analysis.busy}
        <p class="busy" role="status">{i18n.t('analysis.updating')}</p>
      {/if}
    </section>

    <section class="panel" id="panel" tabindex="-1">
      <button
        type="button"
        class="handle"
        aria-label={sheet === 'full' ? i18n.t('sheet.collapse') : i18n.t('sheet.expand')}
        onclick={cycleSheet}
      >
        <span aria-hidden="true"></span>
      </button>

      <div class="content">
        <Stepper current={step} onselect={(s) => (step = s)} />
        {#if !prefs.welcomed}<Welcome />{/if}

        {#if step === 'room'}
          <StepRoom />
        {:else}
          <StepPlaceholder {step} />
        {/if}

        {#if analysis.error}
          <div class="card error" role="alert">
            <p>{i18n.t('analysis.error')}</p>
          </div>
        {/if}

        <StepNav current={step} onselect={(s) => (step = s)} />

        <footer>
          <p class="save" role="status" data-state={workspace.saveState}>
            {i18n.t(`project.${workspace.saveState}`)}
          </p>
          <p class="disclaimer">{i18n.t('app.disclaimer')}</p>
        </footer>
      </div>
    </section>
  </main>
</div>

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

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
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

  .workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Drawing: faint blueprint grid behind the plan. */
  .drawing {
    position: sticky;
    top: 0;
    z-index: 1;
    height: 45dvh;
    background-color: var(--bg);
    background-image:
      linear-gradient(var(--grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid) 1px, transparent 1px);
    background-size: 24px 24px;
    background-position: -1px -1px;
    border-bottom: 1px solid var(--grid);
  }
  .busy {
    position: absolute;
    right: 12px;
    bottom: 8px;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--ink-muted);
    font-size: 13px;
  }

  .panel {
    padding: 16px var(--gutter) 32px;
    outline: none;
  }
  .content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    max-width: 40rem;
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

  /* Desktop: two panes, each scrolling on its own. */
  @media (min-width: 1024px) {
    .app {
      height: 100dvh;
      min-height: 0;
    }
    .workspace {
      flex-direction: row-reverse;
      overflow: hidden;
    }
    .drawing {
      position: relative;
      flex: 1;
      height: auto;
      border-bottom: 0;
      border-left: 1px solid var(--grid);
    }
    .panel {
      width: clamp(380px, 34vw, 440px);
      flex: none;
      overflow-y: auto;
      background: var(--bg);
    }
  }

  /* Phone: the panel is a bottom sheet. The drawing takes whatever space is left above it. */
  @media (max-width: 639px) {
    .app {
      height: 100dvh;
      min-height: 0;
    }
    .workspace {
      overflow: hidden;
    }
    .drawing {
      position: relative;
      flex: 1 1 0;
      height: auto;
      min-height: 140px;
    }
    .panel {
      flex: 0 0 var(--sheet-h, 52dvh);
      overflow-y: auto;
      padding-top: 0;
      background: var(--bg);
      border-top: 1px solid var(--line);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      box-shadow: 0 -4px 16px rgb(11 22 38 / 0.15);
      transition: flex-basis 180ms ease-out;
    }
    .workspace[data-sheet='peek'] {
      --sheet-h: 132px;
    }
    .workspace[data-sheet='half'] {
      --sheet-h: 52dvh;
    }
    /* Full: the drawing shrinks to its minimum and the sheet takes the rest. */
    .workspace[data-sheet='full'] .panel {
      flex: 1 1 auto;
    }
    .workspace[data-sheet='full'] .drawing {
      flex: 0 0 140px;
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
      background: var(--bg);
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
