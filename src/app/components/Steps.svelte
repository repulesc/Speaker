<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { ui, type PanelStep } from '../ui.svelte';

  /**
   * The three steps (docs/ROADMAP_V8.md §2): Set up, Place, Listen. Named after what you do, numbered
   * because they follow each other, but every one is open at any time. A sideways swipe on a touch
   * screen moves between them (ResultTabs did the same in V6).
   */
  const STEPS: readonly PanelStep[] = ['setup', 'place', 'listen'];

  function onKey(e: KeyboardEvent, at: PanelStep) {
    const i = STEPS.indexOf(at);
    const next =
      e.key === 'ArrowRight'
        ? STEPS[(i + 1) % STEPS.length]
        : e.key === 'ArrowLeft'
          ? STEPS[(i + STEPS.length - 1) % STEPS.length]
          : null;
    if (!next) return;
    e.preventDefault();
    ui.tab = next;
    document.getElementById(`step-${next}`)?.focus();
  }
</script>

<div class="steps" role="tablist" aria-label={i18n.t('steps.label')}>
  {#each STEPS as s, i (s)}
    <button
      type="button"
      role="tab"
      id="step-{s}"
      aria-selected={ui.tab === s}
      aria-controls="step-panel"
      tabindex={ui.tab === s ? 0 : -1}
      onclick={() => (ui.tab = s)}
      onkeydown={(e) => onKey(e, s)}
    >
      <span class="num" aria-hidden="true">{i + 1}</span>
      <span class="label">{i18n.t(`steps.${s}`)}</span>
    </button>
  {/each}
</div>

<style>
  .steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-bottom: 1px solid var(--grid);
  }
  button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--ink-muted);
    font: inherit;
    font-size: var(--text-md);
    font-weight: 500;
    cursor: pointer;
  }
  button::after {
    content: '';
    position: absolute;
    left: 14%;
    right: 14%;
    bottom: -1px;
    height: 2px;
    border-radius: 2px;
    background: transparent;
    transition: background 0.15s ease;
  }
  button[aria-selected='true'] {
    color: var(--ink);
    font-weight: 600;
  }
  button[aria-selected='true']::after {
    background: var(--accent-fill);
  }
  button:hover:not([aria-selected='true']) {
    color: var(--ink);
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -4px;
    border-radius: 8px;
  }
  .num {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
  }
  [aria-selected='true'] .num {
    border-color: var(--accent-fill);
    background: var(--accent-fill);
    color: var(--on-accent);
  }
  @media (prefers-reduced-motion: reduce) {
    button::after {
      transition: none;
    }
  }
</style>
