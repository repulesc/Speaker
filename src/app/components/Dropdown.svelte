<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Accessible name of the opened panel. */
    label: string;
    trigger: Snippet;
    children: Snippet<[close: () => void]>;
    align?: 'start' | 'end';
    /** Extra class on the trigger button. */
    triggerClass?: string;
  }

  let { label, trigger, children, align = 'start', triggerClass = '' }: Props = $props();

  let open = $state(false);
  let root = $state<HTMLElement>();
  let button = $state<HTMLButtonElement>();
  let panel = $state<HTMLElement>();
  let place = $state('');
  const panelId = `dd-${Math.random().toString(36).slice(2, 8)}`;

  /** Gap to the screen edges and to the trigger. */
  const MARGIN = 12;

  function close(refocus = true) {
    open = false;
    if (refocus) button?.focus();
  }

  /**
   * The panel is placed against the viewport, never off it (owner feedback v3: the confidence
   * popover opened off the left edge). Below the trigger if it fits, otherwise above; aligned to
   * the trigger's start or end, then pushed inside the screen.
   */
  function position() {
    if (!panel || !button) return;
    const b = button.getBoundingClientRect();
    const w = Math.min(panel.offsetWidth, innerWidth - 2 * MARGIN);
    const h = panel.offsetHeight;
    let left = align === 'end' ? b.right - w : b.left;
    left = Math.max(MARGIN, Math.min(left, innerWidth - w - MARGIN));
    const below = b.bottom + 6;
    const fitsBelow = below + h <= innerHeight - MARGIN;
    const top = fitsBelow ? below : Math.max(MARGIN, b.top - 6 - h);
    place = `left:${left}px; top:${top}px; max-height:${innerHeight - 2 * MARGIN}px`;
  }

  $effect(() => {
    if (open && panel) position();
  });
</script>

<svelte:window
  onclick={(e) => open && root && !e.composedPath().includes(root) && close(false)}
  onkeydown={(e) => open && e.key === 'Escape' && close()}
  onresize={() => open && position()}
/>

<div class="dropdown" bind:this={root}>
  <button
    bind:this={button}
    type="button"
    class="btn {triggerClass}"
    aria-expanded={open}
    aria-controls={open ? panelId : undefined}
    onclick={() => (open = !open)}
  >
    {@render trigger()}
  </button>
  {#if open}
    <div
      bind:this={panel}
      class="panel"
      id={panelId}
      role="group"
      aria-label={label}
      style={place || 'visibility:hidden'}
    >
      {@render children(() => close())}
    </div>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
  }
  .panel {
    position: fixed;
    z-index: 40;
    display: grid;
    gap: 12px;
    width: max-content;
    min-width: 17rem;
    max-width: min(22rem, calc(100vw - 24px));
    overflow-y: auto;
    padding: 14px;
    border-radius: 14px;
    background: var(--surface);
    box-shadow:
      var(--shadow),
      0 0 0 1px var(--grid);
  }
  .dropdown :global(.gear) {
    width: 44px;
    padding: 0;
    background: none;
    color: var(--accent);
  }
</style>
