<script lang="ts">
  import type { LayerId } from '../../engine/types';
  import { LAYERS } from '../../engine/scoring/heatmaps';
  import { i18n } from '../../i18n/locale.svelte';
  import { ui } from '../ui.svelte';
  import ModeBar from './ModeBar.svelte';
  import VariantTabs from './VariantTabs.svelte';
  import { viewport } from '../viewport.svelte';
  import { workspace } from '../session.svelte';

  /**
   * One quiet toolbar over the room: setups, what the map shows, bass note, side view. The map is
   * one of two big choices, where the speakers go or where to sit; the layers that explain a seat
   * sit behind "Why?" (owner decision, docs/ROADMAP_V5.md).
   */
  const level = (id: LayerId | 'speakers') =>
    id === 'speakers' ? 'combined' : LAYERS.find((l) => l.id === id)!.level;
  const shape = (l: string) =>
    l === 'physics' ? '●' : l === 'guideline' ? '◆' : l === 'heuristic' ? '▲' : '◇';
  const active = $derived(ui.layer);
  const modeOn = $derived(ui.modeFrequency !== null);
  /** The seat map: weighted by the user's goals once there are any. */
  const seatMain = $derived<LayerId>(
    Object.values(workspace.project.goals.weights).some((w) => w) ? 'goals' : 'overall',
  );
  const map = $derived(active === 'speakers' ? 'speakers' : 'seat');
  /** The seat layers that explain one concern each. */
  const REASONS = LAYERS.filter((l) => l.level !== 'combined').map((l) => l.id);
  const reason = $derived(REASONS.includes(active as LayerId));
  let whyOpen = $state(false);
  const showWhy = $derived(map === 'seat' && (whyOpen || reason));
  function pick(value: 'speakers' | 'seat') {
    ui.layer = value === 'speakers' ? 'speakers' : seatMain;
    if (value === 'speakers') whyOpen = false;
  }
</script>

<div class="bar">
  {#if viewport.wide}
    <button
      type="button"
      class="panel-toggle"
      aria-pressed={ui.panelHidden}
      aria-label={i18n.t(ui.panelHidden ? 'map.showPanel' : 'map.hidePanel')}
      title={i18n.t(ui.panelHidden ? 'map.showPanel' : 'map.hidePanel')}
      onclick={() => (ui.panelHidden = !ui.panelHidden)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3.5"
          y="5"
          width="17"
          height="14"
          rx="3"
          stroke="currentColor"
          stroke-width="1.6"
        />
        <path d="M9.5 5v14" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </button>
  {/if}
  <VariantTabs />
  <div class="tools">
    <div
      class="seg pick"
      role="radiogroup"
      aria-label={i18n.t('map.layerLabel')}
      class:disabled={modeOn}
    >
      {#each ['speakers', 'seat'] as const as m (m)}
        <label>
          <input
            type="radio"
            name="map-pick"
            value={m}
            checked={map === m}
            disabled={modeOn}
            onchange={() => pick(m)}
          />
          <span>{i18n.t(`map.pick.${m}`)}</span>
        </label>
      {/each}
    </div>
    {#if map === 'seat'}
      <button
        type="button"
        class="toggle"
        aria-expanded={showWhy}
        aria-controls="map-reasons"
        disabled={modeOn}
        onclick={() => {
          whyOpen = !showWhy;
          if (!whyOpen && reason) ui.layer = seatMain;
        }}>{i18n.t('map.why')}</button
      >
    {/if}
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
{#if showWhy && !modeOn}
  <div class="reasons" id="map-reasons" role="group" aria-label={i18n.t('map.whyLabel')}>
    {#each REASONS as id (id)}
      <button
        type="button"
        class="chip"
        aria-pressed={active === id}
        onclick={() => (ui.layer = active === id ? seatMain : id)}
      >
        {i18n.t(`layer.${id}.name`)}
      </button>
    {/each}
  </div>
{/if}
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
  </div>
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px 0;
  }
  .panel-toggle {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 9px;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
  .panel-toggle:hover {
    background: var(--fill);
  }
  .tools {
    display: flex;
    flex: none;
    margin-left: auto;
    align-items: center;
    gap: 6px;
  }
  .pick label {
    min-width: 5.5rem;
    padding: 0 14px;
    font-weight: 600;
  }
  .pick.disabled {
    opacity: 0.5;
  }
  .toggle:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .reasons {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
    padding: 8px 16px 0;
  }
  .chip {
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid var(--grid-strong);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--surface);
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
  @media (pointer: coarse), (max-width: 1023px) {
    .chip,
    .toggle {
      min-height: 44px;
    }
  }
  @media (max-width: 1023px) {
    .bar {
      flex-wrap: wrap;
    }
  }
  @media (max-width: 639px) {
    .info {
      display: none;
    }
    .pick label {
      min-width: 0;
    }
  }
</style>
