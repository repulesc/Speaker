<script lang="ts">
  import type { LayerId, PointExplanation } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength, type LengthSystem } from '../../units/format';
  import { findingText, scoreLabel } from '../findings/text';
  import { prefs } from '../prefs.svelte';

  interface Props {
    explanation: PointExplanation;
    system: LengthSystem;
    pinned: boolean;
    /** Anchor on the drawing, in pixels, and the size of the drawing (to keep the card inside). */
    x: number;
    y: number;
    bounds: { width: number; height: number };
    onmove: () => void;
    onclose: () => void;
  }

  let { explanation, system, pinned, x, y, bounds, onmove, onclose }: Props = $props();

  /** Hovering shows a small tooltip; a click pins the full card (owner decision). */
  const WIDTH = $derived(pinned ? 260 : 210);
  const left = $derived(Math.max(8, Math.min(bounds.width - WIDTH - 8, x + 18)));
  const top = $derived(Math.max(8, Math.min(bounds.height - 230, y + 18)));

  const COMPONENT_LAYER: Record<string, LayerId> = {
    C1: 'bass',
    C2: 'nulls',
    C3: 'frontWall',
    C4: 'stereo',
    C5: 'symmetry',
    C6: 'backWall',
  };

  /** What to say: the two most serious findings that depend on position, else the weakest layer. */
  const reasons = $derived(
    explanation.findings
      .filter((f) => f.severity === 'red-flag' || f.severity === 'caution')
      .slice(0, 1),
  );
  const weakest = $derived(
    explanation.breakdown
      .filter((b) => b.weight > 0 && COMPONENT_LAYER[b.componentId])
      .sort((a, b) => a.value - b.value)[0],
  );
</script>

<div
  class="probe"
  style="left:{left}px; top:{top}px; width:{WIDTH}px"
  role="region"
  aria-label={i18n.t('probe.title', {
    front: formatLength(explanation.placement.listener.y, system, 'position', i18n.locale),
  })}
  aria-live={pinned ? 'polite' : 'off'}
>
  <p class="title">
    {i18n.t('probe.title', {
      front: formatLength(explanation.placement.listener.y, system, 'position', i18n.locale),
    })}
  </p>
  {#if !explanation.valid}
    <p>{i18n.t('probe.notAllowed')}</p>
  {:else}
    <p class="score">
      {i18n.t('probe.score', { word: scoreLabel(explanation.robust, prefs.numbers) })}
    </p>
    {#if explanation.redFlag}<p class="flag">{i18n.t('probe.flagged')}</p>{/if}
    {#each reasons as f (f.messageKey + String(f.params.speaker))}
      <p>{findingText(f, system)}</p>
    {:else}
      {#if weakest && weakest.value < 0.85}
        <p>
          {i18n.t('probe.weakest', {
            layer: i18n.t(`layer.${COMPONENT_LAYER[weakest.componentId]}.name`).toLowerCase(),
          })}
        </p>
      {:else}
        <p>{i18n.t('probe.allFine')}</p>
      {/if}
    {/each}
  {/if}
  {#if pinned}
    <div class="actions">
      {#if explanation.valid}
        <button type="button" class="btn small primary" onclick={onmove}
          >{i18n.t('probe.moveHere')}</button
        >
      {/if}
      <button type="button" class="btn small" onclick={onclose}>{i18n.t('probe.close')}</button>
    </div>
  {/if}
</div>

<style>
  .probe {
    position: absolute;
    z-index: 3;
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border: 1px solid var(--grid-strong);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.45);
    font-size: 13px;
    line-height: 1.45;
    pointer-events: none;
  }
  .probe:has(.actions) {
    pointer-events: auto;
  }
  .title {
    color: var(--ink-muted);
    font-size: 12px;
  }
  .score {
    font-weight: 600;
  }
  .flag {
    color: var(--caution);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }
  .small {
    min-height: 36px;
    padding: 0 12px;
    font-size: 13px;
  }
  @media (pointer: coarse) {
    .small {
      min-height: 44px;
    }
  }
</style>
