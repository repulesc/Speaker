<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { i18n } from '../i18n/locale.svelte';
  import AboutDialog from './components/AboutDialog.svelte';
  import Notice from './components/Notice.svelte';
  import Drawing from './components/Drawing.svelte';
  import ShareDialog from './components/ShareDialog.svelte';
  import StepNav from './components/StepNav.svelte';
  import StepFurnishing from './components/StepFurnishing.svelte';
  import StepGoals from './components/StepGoals.svelte';
  import StepResults from './components/StepResults.svelte';
  import StepRoom from './components/StepRoom.svelte';
  import StepSpeakers from './components/StepSpeakers.svelte';
  import StepSurfaces from './components/StepSurfaces.svelte';
  import Stepper from './components/Stepper.svelte';
  import TopBar from './components/TopBar.svelte';
  import Welcome from './components/Welcome.svelte';
  import { downloadText } from './download';
  import { prefs } from './prefs.svelte';
  import { analysis, projectLabel, showNotice, workspace } from './session.svelte';
  import { ui } from './ui.svelte';
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
      onabout={() => aboutDialog?.show()}
    />
    <Notice />

    <main class="workspace" data-sheet={sheet}>
      <section class="drawing">
        <Drawing />
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
          <Stepper current={ui.step} onselect={(s) => (ui.step = s)} />
          {#if !prefs.welcomed}<Welcome />{/if}

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
          {:else}
            <StepResults />
          {/if}

          {#if analysis.error}
            <div class="card error" role="alert">
              <p>{i18n.t('analysis.error')}</p>
            </div>
          {/if}

          <StepNav current={ui.step} onselect={(s) => (ui.step = s)} />

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
