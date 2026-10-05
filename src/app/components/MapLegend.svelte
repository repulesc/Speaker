<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { scoreWord } from '../findings/text';
  import { bestShown, VIRIDIS } from '../map/heat';
  import { ui } from '../ui.svelte';

  /**
   * The map's legend, bottom-left over the room: a slim ramp from "Poorer" to "Better" and, for
   * the score layers, how good the best area really is. On the room's own colour range the
   * brightest area always glows, so the word keeps it honest (docs/DESIGN_BRIEF_V4.md).
   */
  interface Props {
    values: readonly number[];
    /** Name the best level (score layers); the single-concern layers only show the ramp. */
    named: boolean;
    /** Whether hatched "advised against" areas can appear. */
    hatched: boolean;
  }
  let { values, named, hatched }: Props = $props();

  const best = $derived(named ? bestShown(values) : null);
  const ramp = `linear-gradient(90deg, ${VIRIDIS.slice(1).join(', ')})`;
</script>

<div class="legend">
  <div class="scale" aria-hidden="true">
    <span>{i18n.t('map.poorer')}</span>
    <span class="ramp" style="background:{ramp}"></span>
    <span>{i18n.t('map.better')}</span>
  </div>
  {#if best !== null}
    <p class="best" data-testid="best-here">
      {i18n.t('map.bestHere', { word: i18n.t(`results.score.${scoreWord(best)}`) })}
    </p>
  {/if}
  <div class="extra">
    {#if hatched}<span class="hatch-key" aria-hidden="true"></span>{i18n.t('map.dimmed')}{/if}
    <button
      type="button"
      class="link"
      aria-pressed={ui.heatScale === 'absolute'}
      onclick={() => (ui.heatScale = ui.heatScale === 'absolute' ? 'room' : 'absolute')}
      >{i18n.t('map.absolute')}</button
    >
  </div>
</div>

<style>
  .legend {
    position: absolute;
    left: 16px;
    bottom: 10px;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 6px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface) 86%, transparent);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow);
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }
  .scale {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ramp {
    width: 112px;
    height: 6px;
    border-radius: 3px;
  }
  .best {
    margin: 0;
    white-space: nowrap;
    color: var(--ink);
    font-weight: 600;
  }
  .extra {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .hatch-key {
    width: 14px;
    height: 10px;
    border-radius: 2px;
    background: repeating-linear-gradient(
      -45deg,
      var(--heat-2) 0 3px,
      color-mix(in srgb, var(--heat-2) 55%, white) 3px 4.5px
    );
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
  .hatch-key + .link,
  .extra:has(.hatch-key) .link {
    margin-left: 10px;
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
