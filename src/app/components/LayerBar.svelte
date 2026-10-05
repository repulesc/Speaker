<script lang="ts">
  import type { LayerId } from '../../engine/types';
  import { LAYERS } from '../../engine/scoring/heatmaps';
  import { i18n } from '../../i18n/locale.svelte';
  import { ui } from '../ui.svelte';
  import ModeBar from './ModeBar.svelte';
  import VariantTabs from './VariantTabs.svelte';
  import { viewport } from '../viewport.svelte';
  import { workspace } from '../session.svelte';
  import { goalOf, setGoal } from '../state/goal';

  /**
   * One quiet toolbar over the room: setups and which map you see. The map and "Find the best
   * place for" are one thing (owner decision, docs/ROADMAP_V5.md, V6): picking Speakers or Seat
   * here also changes what the app looks for, unless both may move, when it only changes the view.
   * The layers that explain a seat, the bass notes and the side view live in the Why tab.
   */
  const level = (id: LayerId | 'speakers') =>
    id === 'speakers' ? 'combined' : LAYERS.find((l) => l.id === id)!.level;
  const shape = (l: string) =>
    l === 'physics' ? '●' : l === 'guideline' ? '◆' : l === 'heuristic' ? '▲' : '◇';
  const active = $derived(ui.layer);
  const modeOn = $derived(ui.modeFrequency !== null);
  const goal = $derived(goalOf(workspace.project));
  const map = $derived(active === 'speakers' ? 'speakers' : 'seat');
  const REASONS = LAYERS.filter((l) => l.level !== 'combined').map((l) => l.id);
  const reason = $derived(REASONS.includes(active as LayerId));

  function pick(value: 'speakers' | 'seat') {
    ui.modeFrequency = null;
    ui.layer = value === 'speakers' ? 'speakers' : 'goals';
    if (goal !== 'both' && goal !== value) workspace.edit((p) => setGoal(p, value));
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
    {#if goal === 'both'}<span class="showing" id="map-showing">{i18n.t('map.showing')}</span>{/if}
    <div
      class="seg pick"
      role="radiogroup"
      aria-label={i18n.t('map.layerLabel')}
      aria-describedby={goal === 'both' ? 'map-showing' : undefined}
    >
      {#each ['speakers', 'seat'] as const as m (m)}
        <label>
          <input
            type="radio"
            name="map-pick"
            value={m}
            checked={map === m && !modeOn}
            onchange={() => pick(m)}
          />
          <span>{i18n.t(`map.pick.${m}`)}</span>
        </label>
      {/each}
    </div>
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
      {#if reason}
        <button type="button" class="back" onclick={() => (ui.layer = 'goals')}
          >{i18n.t('map.backToMain')}</button
        >
      {/if}
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
  .showing {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .back {
    margin-left: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
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
