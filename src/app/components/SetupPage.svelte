<script lang="ts">
  import { tick } from 'svelte';
  import { i18n } from '../../i18n/locale.svelte';
  import { ui } from '../ui.svelte';
  import SetupListening from './SetupListening.svelte';
  import SetupRoom from './SetupRoom.svelte';
  import SetupSpeakers from './SetupSpeakers.svelte';

  /**
   * 01 Room & speakers (docs/ROADMAP_V9.md §2): three groups on one page, each with only what
   * changes the result. The map stays in view, so every answer shows at once.
   */

  /** Where an old section name now lives on this page. */
  const TARGET: Record<string, string> = {
    room: 'setup-room',
    surfaces: 'setup-room',
    furnishing: 'setup-room',
    speakers: 'setup-speakers',
    goals: 'setup-goals',
  };
  let page = $state<HTMLElement>();
  $effect(() => {
    const target = ui.roomTarget;
    if (!target) return;
    void tick().then(() => {
      const el = page?.querySelector<HTMLElement>(`#${TARGET[target] ?? `setup-${target}`}`);
      el?.scrollIntoView({ block: 'start' });
    });
  });
</script>

<div class="setup" bind:this={page}>
  <SetupRoom />
  <SetupSpeakers />
  <SetupListening />
  <button type="button" class="btn primary next" onclick={() => (ui.tab = 'place')}>
    {i18n.t('setup.next')}
  </button>
</div>

<style>
  .setup {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
  .next {
    width: 100%;
  }
</style>
