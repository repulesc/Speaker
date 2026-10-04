<script lang="ts">
  import type { LayerId } from '../../engine/types';
  import { LAYERS } from '../../engine/scoring/heatmaps';
  import { i18n } from '../../i18n/locale.svelte';
  import { ui } from '../ui.svelte';
  import ModeBar from './ModeBar.svelte';
  import VariantTabs from './VariantTabs.svelte';

  /** One quiet toolbar over the room: setups, what the map shows, bass note, side view. */
  const level = (id: LayerId) => LAYERS.find((l) => l.id === id)!.level;
  const shape = (l: string) =>
    l === 'physics' ? '●' : l === 'guideline' ? '◆' : l === 'heuristic' ? '▲' : '◇';
  const active = $derived(ui.layer);
  const modeOn = $derived(ui.modeFrequency !== null);
</script>

<div class="bar">
  <VariantTabs />
  <div class="tools">
    <label class="visually-hidden" for="map-layer">{i18n.t('map.layerLabel')}</label>
    <select
      id="map-layer"
      class="select"
      value={active}
      disabled={modeOn}
      onchange={(e) => (ui.layer = e.currentTarget.value as LayerId)}
    >
      {#each LAYERS as layer (layer.id)}
        <option value={layer.id}>{i18n.t(`layer.${layer.id}.name`)}</option>
      {/each}
    </select>
    <button
      type="button"
      class="toggle"
      aria-pressed={modeOn}
      onclick={() => (ui.modeFrequency = modeOn ? null : 60)}>{i18n.t('mode.chip')}</button
    >
    <button
      type="button"
      class="toggle"
      aria-pressed={ui.sideOpen}
      onclick={() => (ui.sideOpen = !ui.sideOpen)}>{i18n.t('dock.side')}</button
    >
  </div>
</div>
{#if modeOn}
  <ModeBar />
{:else}
  <div class="info">
    <p class="what" role="status">
      {#if level(active) !== 'combined'}
        <span class="tag">{shape(level(active))} {i18n.t(`evidence.${level(active)}`)}</span>
      {/if}
      {i18n.t(`layer.${active}.what`)}
    </p>
    <div class="legend" aria-hidden="true">
      <span>{i18n.t('map.poorer')}</span>
      <span class="ramp"></span>
      <span>{i18n.t('map.better')}</span>
      <span class="dimmed">{i18n.t('map.dimmed')}</span>
    </div>
  </div>
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px 0;
  }
  .tools {
    display: flex;
    flex: none;
    align-items: center;
    gap: 6px;
  }
  .select {
    min-height: 40px;
    max-width: 14rem;
    padding: 0 30px 0 12px;
    border: 0;
    border-radius: 9px;
    background: var(--fill)
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E")
      no-repeat right 12px center;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 500;
    appearance: none;
    cursor: pointer;
  }
  .select:disabled {
    opacity: 0.5;
  }
  .toggle {
    min-height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: 9px;
    background: var(--fill);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
  }
  .toggle[aria-pressed='true'] {
    background: var(--ink);
    color: var(--surface);
  }
  .info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 16px 0;
  }
  .what {
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
    line-height: 1.4;
  }
  .tag {
    margin-right: 6px;
    color: var(--ink);
  }
  .legend {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }
  .dimmed {
    margin-left: 6px;
  }
  .ramp {
    width: 96px;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(
      90deg,
      var(--heat-0),
      var(--heat-1),
      var(--heat-2),
      var(--heat-3),
      var(--heat-4)
    );
  }
  @media (pointer: coarse), (max-width: 1023px) {
    .select,
    .toggle {
      min-height: 44px;
    }
  }
  @media (max-width: 1023px) {
    .bar {
      flex-wrap: wrap;
    }
    .legend {
      display: none;
    }
  }
  @media (max-width: 639px) {
    .info {
      display: none;
    }
    .select {
      max-width: 9rem;
    }
  }
</style>
