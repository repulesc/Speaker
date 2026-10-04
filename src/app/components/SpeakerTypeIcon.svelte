<script lang="ts">
  import type { SpeakerTypePreset } from '../../engine/presets/speakerTypes';

  /**
   * A small front view of a speaker type: cabinet, drivers, and the bass port. A port at the back
   * is drawn dashed (hidden), like on a technical drawing. Decorative: the card text says it all.
   */
  let { type }: { type: SpeakerTypePreset } = $props();

  const tall = $derived(type.h >= 0.6);
  // Cabinet in a 48 × 64 box, standing on the bottom edge.
  const box = $derived(tall ? { w: 22, h: 60 } : { w: 30, h: 44 });
  const x0 = $derived((48 - box.w) / 2);
  const y0 = $derived(64 - box.h - 2);
  const cx = 24;
  const drivers = $derived.by(() => {
    const top = y0;
    if (type.driverLayout === 'coaxial') {
      return [
        { y: top + box.h * 0.42, r: 10 },
        { y: top + box.h * 0.42, r: 3.5 },
      ];
    }
    if (tall) {
      return [
        { y: top + 8, r: 3 },
        { y: top + 19, r: 6 },
        { y: top + 33, r: 7 },
      ];
    }
    return [
      { y: top + 9, r: 3.5 },
      { y: top + box.h * 0.52, r: 8.5 },
    ];
  });
  const port = $derived(type.portLocation === 'front' || type.portLocation === 'rear');
  const portY = $derived(y0 + box.h - 7);
</script>

<svg class="icon" viewBox="0 0 48 64" width="54" height="72" aria-hidden="true" focusable="false">
  <rect class="cabinet" x={x0} y={y0} width={box.w} height={box.h} rx="3" />
  {#each drivers as d, i (i)}
    <circle class="driver" {cx} cy={d.y} r={d.r} />
  {/each}
  {#if port}
    <rect
      class="port"
      class:hidden-line={type.portLocation === 'rear'}
      x={cx - 6}
      y={portY - 2}
      width="12"
      height="4"
      rx="2"
    />
  {/if}
</svg>

<style>
  .icon {
    display: block;
    color: var(--ink);
  }
  .cabinet {
    fill: var(--fill);
    stroke: currentColor;
    stroke-width: 1.5;
  }
  .driver {
    fill: var(--surface);
    stroke: currentColor;
    stroke-width: 1.25;
  }
  .port {
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 1;
  }
  .port.hidden-line {
    fill: none;
    stroke-dasharray: 2 1.5;
    opacity: 0.8;
  }
</style>
