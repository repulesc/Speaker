<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { SECTIONS, type SectionId } from '../session.svelte';
  import { ui } from '../ui.svelte';

  const icons: Record<SectionId | 'side', string> = {
    room: 'M3 3h16v16H3z',
    surfaces: 'M3 8l8-4 8 4-8 4zM3 12l8 4 8-4M3 16l8 4 8-4',
    furnishing: 'M3 9h16v8H3zM5 9V6h12v3',
    speakers:
      'M5 3h12v16H5zM11 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M11 7m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
    goals:
      'M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M11 11m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M11 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
    side: 'M3 3h16v16H3zM3 14h16',
  };
</script>

{#snippet icon(id: SectionId | 'side')}
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    aria-hidden="true"
  >
    <path d={icons[id]} />
  </svg>
{/snippet}

<nav class="dock" aria-label={i18n.t('dock.label')}>
  {#each SECTIONS as id (id)}
    <button
      type="button"
      class:on={ui.step === id}
      aria-pressed={ui.step === id}
      onclick={() => (ui.step = ui.step === id ? 'results' : id)}
    >
      {@render icon(id)}
      <span>{i18n.t(`dock.${id}`)}</span>
    </button>
  {/each}
  <span class="spacer"></span>
  <button
    type="button"
    class="side"
    class:on={ui.sideOpen}
    aria-pressed={ui.sideOpen}
    onclick={() => (ui.sideOpen = !ui.sideOpen)}
  >
    {@render icon('side')}
    <span>{i18n.t('dock.side')}</span>
  </button>
</nav>

<style>
  .dock {
    display: flex;
    flex-direction: row;
    gap: 6px;
    padding: 8px var(--gutter);
    overflow-x: auto;
    background: var(--panel);
    border-bottom: 1px solid var(--grid);
  }
  button {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 72px;
    min-height: 56px;
    padding: 8px 6px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    color: var(--ink-muted);
    font: inherit;
    font-size: 11.5px;
    cursor: pointer;
  }
  button:hover {
    color: var(--ink);
  }
  button.on {
    background: var(--surface-2);
    color: var(--ink);
  }
  .side {
    border: 1px dashed var(--grid-strong);
  }
  .spacer {
    flex: 1;
  }
  @media (min-width: 1024px) {
    .dock {
      flex-direction: column;
      align-items: center;
      width: 92px;
      padding: 14px 0;
      overflow: visible;
      border-bottom: 0;
      border-right: 1px solid var(--grid);
    }
    button {
      width: 72px;
      min-width: 0;
    }
  }
</style>
