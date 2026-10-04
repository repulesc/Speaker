<script lang="ts">
  import type { Mode } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { modeExplorer } from '../state/mode.svelte';
  import { analysis } from '../session.svelte';
  import { ui } from '../ui.svelte';

  const MIN = 20;
  const MAX = 200;

  const frequency = $derived(ui.modeFrequency ?? MIN);
  const modes = $derived(analysis.result?.status === 'ok' ? analysis.result.modes : []);

  /** The three lowest standing waves: one along each room dimension. */
  const lowest = $derived(
    (
      [
        [0, 1, 0],
        [1, 0, 0],
        [0, 0, 1],
      ] as const
    )
      .map((n) => modes.find((m) => m.n.join() === n.join()))
      .filter((m): m is Mode => m !== undefined),
  );

  const kindText = (m: Mode) => {
    if (m.type === 'axial') {
      return i18n.t(m.n[1] ? 'mode.axial' : m.n[0] ? 'mode.axialW' : 'mode.axialH');
    }
    return i18n.t(`mode.${m.type}`);
  };
  const hz = (f: number) => `${Math.round(f)} Hz`;
  const near = $derived(modeExplorer.field?.nearbyModes ?? []);
</script>

<div class="mode">
  <label class="slider">
    <span>{i18n.t('mode.frequency')}</span>
    <input
      type="range"
      min={MIN}
      max={MAX}
      step="1"
      value={frequency}
      aria-valuetext={hz(frequency)}
      oninput={(e) => (ui.modeFrequency = Number(e.currentTarget.value))}
    />
    <output>{hz(frequency)}</output>
  </label>
  <div class="jumps" role="group" aria-label={i18n.t('mode.lowest')}>
    {#each lowest as m (m.n.join())}
      <button type="button" onclick={() => (ui.modeFrequency = Math.round(m.f))}>
        {i18n.t('mode.jump', { frequency: hz(m.f) })}
      </button>
    {/each}
  </div>
  <p class="near" role="status">
    {#if near.length}
      {i18n.t('mode.near', {
        modes: near.map((m) => `${hz(m.f)} (${kindText(m)})`).join(', '),
      })}
    {:else}
      {i18n.t('mode.nearNone')}
    {/if}
  </p>
  <div class="legend" aria-hidden="true">
    <span>{i18n.t('mode.poorer')}</span>
    <span class="ramp"></span>
    <span>{i18n.t('mode.better')}</span>
  </div>
</div>

<style>
  .mode {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    padding: 6px var(--gutter) 0;
    font-size: 12.5px;
    color: var(--ink-muted);
  }
  .slider {
    display: flex;
    flex: 1 1 260px;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
  .slider input {
    flex: 1;
    min-width: 120px;
    accent-color: var(--accent);
  }
  output {
    min-width: 52px;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  button {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--grid-strong);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .near {
    flex: 1 1 100%;
    margin: 0;
    line-height: 1.4;
  }
  .legend {
    display: flex;
    align-items: center;
    gap: 8px;
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
    .slider,
    button {
      min-height: 36px;
    }
  }
</style>
