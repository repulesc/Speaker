<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import type { TabId } from '../session.svelte';
  import { ui } from '../ui.svelte';

  const tabs: TabId[] = ['results', 'treat'];
  const label = (tab: TabId) => i18n.t(tab === 'results' ? 'tabs.why' : 'tabs.treat');

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    ui.step = ui.step === 'results' ? 'treat' : 'results';
  }
</script>

<div class="tabs" role="tablist" aria-label={i18n.t('tabs.label')} {onkeydown} tabindex="-1">
  {#each tabs as tab (tab)}
    <button
      type="button"
      role="tab"
      aria-selected={ui.step === tab}
      tabindex={ui.step === tab ? 0 : -1}
      onclick={() => (ui.step = tab)}>{label(tab)}</button
    >
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border: 1px solid var(--grid);
    border-radius: 10px;
    background: var(--surface);
  }
  button {
    flex: 1;
    min-height: 44px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink-muted);
    font: inherit;
    cursor: pointer;
  }
  button[aria-selected='true'] {
    background: var(--surface-2);
    color: var(--ink);
    font-weight: 600;
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
</style>
