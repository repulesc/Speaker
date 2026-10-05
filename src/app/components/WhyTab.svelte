<script lang="ts">
  import type { LayerId } from '../../engine/types';
  import { LAYERS } from '../../engine/scoring/heatmaps';
  import { i18n } from '../../i18n/locale.svelte';
  import { ui } from '../ui.svelte';
  import BassChart from './BassChart.svelte';
  import WhyPanel from './WhyPanel.svelte';

  /**
   * Why the result is what it is (docs/ROADMAP_V5.md, V6): the reasons, then the same reasons on the
   * map, the bass at your seat, and two ways to look closer (bass notes, side view). The map's own
   * toolbar stays plain: the layers that explain a seat live here.
   */
  const REASONS = LAYERS.filter((l) => l.level !== 'combined').map((l) => l.id);
  const showing = $derived(REASONS.includes(ui.layer as LayerId) ? ui.layer : null);
  const modeOn = $derived(ui.modeFrequency !== null);

  function show(id: LayerId) {
    ui.modeFrequency = null;
    ui.layer = showing === id ? 'goals' : id;
  }
</script>

<div class="why-tab">
  <WhyPanel />

  <section aria-labelledby="on-map-title">
    <h3 id="on-map-title">{i18n.t('whyTab.onMap')}</h3>
    <p class="muted">{i18n.t('whyTab.onMapHelp')}</p>
    <div class="chips" role="group" aria-label={i18n.t('map.whyLabel')}>
      {#each REASONS as id (id)}
        <button type="button" class="chip" aria-pressed={showing === id} onclick={() => show(id)}>
          {i18n.t(`layer.${id}.name`)}
        </button>
      {/each}
    </div>
  </section>

  <section aria-labelledby="bass-title">
    <h3 id="bass-title">{i18n.t('nav.bass')}</h3>
    <BassChart />
  </section>

  <section aria-labelledby="closer-title">
    <h3 id="closer-title">{i18n.t('whyTab.closer')}</h3>
    <div class="chips">
      <button
        type="button"
        class="chip"
        aria-pressed={modeOn}
        onclick={() => (ui.modeFrequency = modeOn ? null : 60)}>{i18n.t('mode.chip')}</button
      >
      <button
        type="button"
        class="chip"
        aria-pressed={ui.sideOpen}
        onclick={() => (ui.sideOpen = !ui.sideOpen)}>{i18n.t('dock.side')}</button
      >
    </div>
  </section>
</div>

<style>
  .why-tab {
    display: grid;
    gap: 22px;
  }
  section {
    display: grid;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
  }
  .muted {
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    min-height: 36px;
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
  @media (pointer: coarse), (max-width: 1023px) {
    .chip {
      min-height: 44px;
    }
  }
</style>
