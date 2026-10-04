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
  const panelId = `dd-${Math.random().toString(36).slice(2, 8)}`;

  function close(refocus = true) {
    open = false;
    if (refocus) button?.focus();
  }
</script>

<svelte:window
  onclick={(e) => open && root && !e.composedPath().includes(root) && close(false)}
  onkeydown={(e) => open && e.key === 'Escape' && close()}
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
    <div class="panel card {align}" id={panelId} role="group" aria-label={label}>
      {@render children(() => close())}
    </div>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
  }
  .panel {
    position: absolute;
    top: calc(100% + 6px);
    z-index: 20;
    display: grid;
    gap: 12px;
    min-width: 15rem;
    max-width: min(22rem, calc(100vw - 32px));
    box-shadow: 0 6px 20px rgb(11 22 38 / 0.18);
  }
  .panel.start {
    left: 0;
  }
  .panel.end {
    right: 0;
  }
</style>
