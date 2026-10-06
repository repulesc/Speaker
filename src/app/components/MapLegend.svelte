<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { scoreLabel } from '../findings/text';
  import { prefs } from '../prefs.svelte';
  import { workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';

  /**
   * The drawing's legend, set under the room and as wide as it (V8; owner: it sat in the corner,
   * apart from the room): how good the best area is, the colour scale, the two kinds of shading
   * and a scale bar. "Absolute scale" is for people who asked for the numbers.
   */
  interface Props {
    /**
     * The cautious score of the best spot shown (the engine's `best`), named as a word; null on
     * the single-concern layers, which only show the ramp. The same score Apply gives there.
     */
    best: number | null;
    /** Whether hatched "advised against" areas can appear. */
    hatched: boolean;
    /** What the neutral "not a spot" tone means on this map. */
    none: 'notStereo' | 'notSeat';
    /** Pixels per metre on the drawing, for the scale bar. */
    metre: number;
  }
  let { best, hatched, none, metre }: Props = $props();
  /** A round, readable ruler: 1 or 2 m, or 3 or 6 ft. */
  const imperial = $derived(workspace.project.units === 'imperial');
  const bar = $derived.by(() => {
    const unit = imperial ? 0.9144 : 1;
    const count = metre * unit >= 60 ? 1 : 2;
    return { metres: count * unit, label: imperial ? `${count * 3} ft` : `${count} m` };
  });
</script>

<div class="legend">
  <div class="line">
    {#if best !== null}
      <p class="best" data-testid="best-here">
        {i18n.t('map.bestHere', { word: scoreLabel(best, prefs.numbers) })}
      </p>
    {/if}
    <div class="scale" aria-hidden="true">
      <span>{i18n.t('map.poorer')}</span>
      <span class="ramp"></span>
      <span>{i18n.t('map.better')}</span>
    </div>
  </div>
  <div class="line">
    <span class="key"><span class="none-key" aria-hidden="true"></span>{i18n.t(`map.${none}`)}</span
    >
    {#if hatched}
      <span class="key"
        ><span class="hatch-key" aria-hidden="true"></span>{i18n.t('map.dimmed')}</span
      >
    {/if}
    <span class="key metre" aria-hidden="true">
      <span class="bar" style="width:{bar.metres * metre}px"></span>
      {bar.label}
    </span>
    {#if prefs.numbers}
      <button
        type="button"
        class="link"
        aria-pressed={ui.heatScale === 'absolute'}
        onclick={() => (ui.heatScale = ui.heatScale === 'absolute' ? 'room' : 'absolute')}
        >{i18n.t('map.absolute')}</button
      >
    {/if}
  </div>
</div>

<style>
  /* Two centred lines: what the colours mean, then the keys and the scale. */
  .legend {
    display: grid;
    justify-items: center;
    gap: 6px;
    max-width: 100%;
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px 18px;
  }
  .best {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
  }
  .scale,
  .key {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .ramp {
    width: 88px;
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
  .none-key,
  .hatch-key {
    width: 14px;
    height: 10px;
    border-radius: 2px;
  }
  .none-key {
    background: repeating-linear-gradient(
      -45deg,
      var(--heat-none) 0 3px,
      var(--heat-none-line) 3px 4.5px
    );
    box-shadow: inset 0 0 0 1px var(--heat-none-line);
  }
  .hatch-key {
    background: repeating-linear-gradient(
      -45deg,
      var(--heat-2) 0 3px,
      color-mix(in srgb, var(--heat-2) 55%, var(--surface)) 3px 4.5px
    );
  }
  /* The scale bar: a ruler of one (or two) metres, with end ticks. */
  .bar {
    height: 6px;
    border: 1.2px solid var(--ink-muted);
    border-top: 0;
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .link[aria-pressed='true'] {
    font-weight: 600;
  }
  @media (pointer: coarse) {
    .link {
      min-height: 44px;
    }
  }
  @media (max-width: 639px) {
    .legend {
      display: none;
    }
  }
</style>
