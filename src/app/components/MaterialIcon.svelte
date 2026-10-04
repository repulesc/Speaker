<script lang="ts">
  import type { SurfacePresetId } from '../../engine/types';

  /** Small line drawings that hint at each material (Blueprint style, no colour meaning). */
  let { preset }: { preset: SurfacePresetId } = $props();
</script>

<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
  <rect x="2.5" y="2.5" width="27" height="27" class="frame" />
  {#if preset === 'plaster-concrete'}
    <circle cx="10" cy="11" r="0.9" />
    <circle cx="21" cy="9" r="0.9" />
    <circle cx="16" cy="19" r="0.9" />
    <circle cx="24" cy="23" r="0.9" />
    <circle cx="8" cy="24" r="0.9" />
  {:else if preset === 'plaster-brick'}
    <path
      d="M2.5 10h27M2.5 18h27M2.5 26h27M10 2.5v7.5M22 2.5v7.5M16 10v8M4 10v8M28 10v8M10 18v8M22 18v8"
    />
  {:else if preset === 'gypsum-stud'}
    <path d="M9 2.5v27M16 2.5v27M23 2.5v27" stroke-dasharray="2 3" />
  {:else if preset === 'glass'}
    <path d="M9 24 22 7M16 26 26 13" />
  {:else if preset === 'wood-floor'}
    <path d="M2.5 9h27M2.5 16h27M2.5 23h27M12 2.5v6.5M22 9v7M9 16v7M20 23v6.5" />
  {:else if preset === 'carpet-heavy' || preset === 'carpet-underlay'}
    <path
      d="M7 8h2M13 8h2M19 8h2M25 8h2M4 14h2M10 14h2M16 14h2M22 14h2M7 20h2M13 20h2M19 20h2M25 20h2M4 26h2M10 26h2M16 26h2M22 26h2"
    />
    {#if preset === 'carpet-underlay'}<path d="M2.5 29.5h27" class="thick" />{/if}
  {:else if preset === 'curtain-heavy'}
    <path
      d="M2.5 6h27M8 6c1 7 1 14 0 23M14 6c1 7 1 14 0 23M20 6c1 7 1 14 0 23M26 6c1 7 1 14 0 23"
    />
  {:else if preset === 'shelf-diffusive'}
    <path d="M2.5 11h27M2.5 20h27" />
    <path
      d="M6 3v7M9 4v6M12 3v7M17 4v6M21 3v7M25 4v6M7 12v7M11 13v6M15 12v7M19 13v6M24 12v7M8 21v7M12 22v6M17 21v7M22 22v6M26 21v7"
    />
  {:else if preset === 'canvas-art'}
    <rect x="8" y="9" width="16" height="13" />
    <path d="M10 20l4-5 3 3 3-4 3 6" />
  {:else}
    <path d="M8 16h16M16 8v16" />
  {/if}
</svg>

<style>
  svg {
    flex: none;
    fill: none;
    stroke: var(--line);
    stroke-width: 1.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  svg circle {
    fill: var(--line);
    stroke: none;
  }
  .frame {
    stroke: var(--ink-muted);
  }
  .thick {
    stroke-width: 2.4;
  }
</style>
