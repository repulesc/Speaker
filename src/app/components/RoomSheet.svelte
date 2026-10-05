<script lang="ts">
  import { tick } from 'svelte';
  import { i18n } from '../../i18n/locale.svelte';
  import { SECTIONS, workspace, type SectionId } from '../session.svelte';
  import { setupProgress } from '../state/progress';
  import { ui } from '../ui.svelte';
  import PlacementOptions from './PlacementOptions.svelte';
  import StepFurnishing from './StepFurnishing.svelte';
  import StepGoals from './StepGoals.svelte';
  import StepRoom from './StepRoom.svelte';
  import StepSpeakers from './StepSpeakers.svelte';
  import StepSurfaces from './StepSurfaces.svelte';

  /**
   * "Your room": every setting on one scrolling page, in groups, like the platform settings apps
   * (owner decision, docs/ROADMAP_V5.md, V6). Only what matters for placing the speakers and the
   * seat: this is not a room builder. The map stays in view, so every change shows at once.
   */
  const progress = $derived(setupProgress(workspace.project));
  const label = (id: SectionId) => i18n.t(`dock.${id}`);

  let body = $state<HTMLElement>();
  /** Opened for one group (e.g. from a "Set the room size" button): scroll to it. */
  $effect(() => {
    const target = ui.roomTarget;
    void tick().then(() => {
      const group = target ? body?.querySelector<HTMLElement>(`#sheet-${target}`) : null;
      group?.scrollIntoView({ block: 'start' });
    });
  });
</script>

<div class="sheet" bind:this={body}>
  <div class="top">
    <h2>{i18n.t('nav.room')}</h2>
    <button type="button" class="btn primary done" onclick={() => (ui.roomOpen = false)}
      >{i18n.t('panel.done')}</button
    >
  </div>

  <nav class="index" aria-label={i18n.t('sheet.index')}>
    {#each SECTIONS as id (id)}
      <a href="#sheet-{id}" class="chip status-{progress[id]}">
        <svg class="mark" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" />
          {#if progress[id] === 'done'}<path d="M5 8.4l2 2 4-4.4" />{/if}
          {#if progress[id] === 'partial'}<path class="half" d="M8 1.5a6.5 6.5 0 0 1 0 13z" />{/if}
        </svg>
        {label(id)}
        <span class="visually-hidden">{i18n.t(`nav.status.${progress[id]}`)}</span>
      </a>
    {/each}
  </nav>

  <section class="group" id="sheet-room"><StepRoom /></section>
  <section class="group" id="sheet-surfaces"><StepSurfaces /></section>
  <section class="group" id="sheet-furnishing"><StepFurnishing /></section>
  <section class="group" id="sheet-speakers"><StepSpeakers /></section>
  <section class="group" id="sheet-place" aria-labelledby="sheet-place-title">
    <h2 id="sheet-place-title">{i18n.t('sheet.place')}</h2>
    <PlacementOptions parts={['place']} />
  </section>
  <section class="group" id="sheet-goals"><StepGoals /></section>
  <section class="group" id="sheet-ready" aria-labelledby="sheet-ready-title">
    <h2 id="sheet-ready-title">{i18n.t('sheet.treatment')}</h2>
    <PlacementOptions parts={['ready']} />
  </section>

  <button type="button" class="btn primary done wide" onclick={() => (ui.roomOpen = false)}
    >{i18n.t('panel.done')}</button
  >
</div>

<style>
  .sheet {
    display: grid;
    gap: 28px;
  }
  .top {
    position: sticky;
    top: 56px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: -16px -16px 0;
    padding: 12px 16px;
    background: color-mix(in srgb, var(--bg) 94%, transparent);
    backdrop-filter: saturate(180%) blur(16px);
  }
  .top h2 {
    margin: 0;
  }
  .done {
    min-width: 96px;
  }
  .wide {
    width: 100%;
  }
  .index {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: -12px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--fill);
    color: var(--ink);
    font-size: var(--text-sm);
    text-decoration: none;
  }
  .mark {
    fill: none;
    stroke: var(--ink-muted);
    stroke-width: 1.4;
  }
  .status-done .mark circle {
    fill: var(--ok);
    stroke: var(--ok);
  }
  .status-done .mark path {
    stroke: #fff;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .mark .half {
    fill: var(--ok);
    stroke: none;
  }
  .status-partial .mark circle {
    stroke: var(--ok);
  }
  .group {
    scroll-margin-top: 120px;
  }
  .group > h2 {
    margin: 0 0 12px;
  }
  @media (pointer: coarse), (max-width: 1023px) {
    .chip {
      min-height: 44px;
    }
  }
</style>
