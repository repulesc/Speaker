<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { analysis } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import { viewport } from '../viewport.svelte';
  import PlanView from './PlanView.svelte';
  import SideView from './SideView.svelte';
  import VariantTabs from './VariantTabs.svelte';

  const views = ['top', 'side'] as const;
</script>

<div class="drawing-root">
  <VariantTabs />

  {#if !viewport.wide}
    <div class="seg switch" role="radiogroup" aria-label={i18n.t('plan.view.label')}>
      {#each views as view (view)}
        <label>
          <input
            type="radio"
            name="view"
            value={view}
            checked={ui.view === view}
            onchange={() => (ui.view = view)}
          />
          <span>{i18n.t(`plan.view.${view}`)}</span>
        </label>
      {/each}
    </div>
  {/if}

  <div class="views">
    {#if viewport.wide || ui.view === 'top'}
      <section class="top" aria-label={i18n.t('plan.label')}><PlanView /></section>
    {/if}
    {#if viewport.wide || ui.view === 'side'}
      <section class="side" aria-label={i18n.t('plan.sideLabel')}><SideView /></section>
    {/if}
  </div>

  {#if analysis.busy}
    <p class="busy" role="status">{i18n.t('analysis.updating')}</p>
  {/if}
</div>

<style>
  .drawing-root {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .switch {
    position: absolute;
    top: 52px;
    right: 8px;
    z-index: 2;
  }
  .switch :global(label) {
    font-size: 14px;
  }
  .views {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .top {
    flex: 1 1 0;
    min-height: 0;
  }
  .side {
    flex: 0 0 34%;
    min-height: 0;
    border-top: 1px solid var(--grid);
  }
  /* A single view fills the space. */
  .views:not(:has(.top)) .side {
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
</style>
