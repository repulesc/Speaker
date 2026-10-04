<script lang="ts">
  import type { LayerId } from '../../engine/types';
  import { LAYERS } from '../../engine/scoring/heatmaps';
  import { i18n } from '../../i18n/locale.svelte';
  import { ui } from '../ui.svelte';

  const layers = LAYERS;
  const level = (id: LayerId) => layers.find((l) => l.id === id)!.level;
  const shape = (l: string) =>
    l === 'physics' ? '●' : l === 'guideline' ? '◆' : l === 'heuristic' ? '▲' : '◇';
  const active = $derived(ui.layer);
</script>

<div class="bar">
  <div class="chips" role="radiogroup" aria-label={i18n.t('map.layerLabel')}>
    {#each layers as layer (layer.id)}
      <label class:on={active === layer.id}>
        <input
          type="radio"
          name="layer"
          value={layer.id}
          checked={active === layer.id}
          onchange={() => (ui.layer = layer.id)}
        />
        <span>{i18n.t(`layer.${layer.id}.name`)}</span>
      </label>
    {/each}
  </div>
</div>
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
  </div>
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    padding: 10px var(--gutter) 0;
  }
  .chips {
    display: flex;
    flex: 1;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }
  label {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--grid-strong);
    border-radius: 999px;
    color: var(--ink);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  label.on {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }
  label:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  input {
    position: absolute;
    opacity: 0;
    inset: 0;
    margin: 0;
    cursor: inherit;
  }
  .info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 2px var(--gutter) 0;
  }
  .what {
    margin: 0;
    color: var(--ink-muted);
    font-size: 12.5px;
    line-height: 1.4;
  }
  .tag {
    margin-right: 6px;
    padding: 1px 6px;
    border: 1px solid var(--grid-strong);
    border-radius: 6px;
    color: var(--ink);
  }
  .legend {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    color: var(--ink-muted);
    font-size: 12px;
  }
  .ramp {
    width: 110px;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      var(--heat-0),
      var(--heat-1),
      var(--heat-2),
      var(--heat-3),
      var(--heat-4)
    );
  }
  @media (min-width: 1024px) {
    label {
      min-height: 36px;
    }
  }
  @media (max-width: 1023px) {
    .legend {
      display: none;
    }
  }
  @media (max-width: 639px) {
    .info {
      display: none;
    }
  }
</style>
