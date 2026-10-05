<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { scoreWord } from '../findings/text';
  import { ui } from '../ui.svelte';

  /**
   * The map's legend, bottom-left over the room: a slim ramp from "Poorer" to "Better" and, for
   * the score layers, how good the best area really is. On the room's own colour range the
   * brightest area always glows, so the word keeps it honest (docs/DESIGN_BRIEF_V4.md).
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
  }
  let { best, hatched, none }: Props = $props();
</script>

<div class="legend">
  <div class="scale" aria-hidden="true">
    <span>{i18n.t('map.poorer')}</span>
    <span class="ramp"></span>
    <span>{i18n.t('map.better')}</span>
  </div>
  {#if best !== null}
    <p class="best" data-testid="best-here">
      {i18n.t('map.bestHere', { word: i18n.t(`results.score.${scoreWord(best)}`) })}
    </p>
  {/if}
  <div class="extra">
    <span class="none-key" aria-hidden="true"></span>{i18n.t(`map.${none}`)}
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
    background: linear-gradient(
      90deg,
      var(--heat-0),
      var(--heat-1),
      var(--heat-2),
      var(--heat-3),
      var(--heat-4)
    );
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
  .none-key {
    width: 14px;
    height: 10px;
    border-radius: 2px;
    background: repeating-linear-gradient(
      -45deg,
      var(--heat-none) 0 3px,
      var(--heat-none-line) 3px 4.5px
    );
    box-shadow: inset 0 0 0 1px var(--heat-none-line);
  }
  .hatch-key {
    margin-left: 10px;
    width: 14px;
    height: 10px;
    border-radius: 2px;
    background: repeating-linear-gradient(
      -45deg,
      var(--heat-2) 0 3px,
      color-mix(in srgb, var(--heat-2) 55%, var(--surface)) 3px 4.5px
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
