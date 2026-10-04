<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { prefs } from '../prefs.svelte';
  import { OPTIONAL_IN_QUICK, STEPS, type StepId } from '../session.svelte';

  interface Props {
    current: StepId;
    onselect: (step: StepId) => void;
  }

  let { current, onselect }: Props = $props();
</script>

<nav aria-label={i18n.t('steps.label')}>
  <ol>
    {#each STEPS as step, i (step)}
      {@const optional = prefs.mode === 'quick' && OPTIONAL_IN_QUICK.includes(step)}
      <li>
        <button
          type="button"
          class="step"
          class:active={step === current}
          aria-current={step === current ? 'step' : undefined}
          title={i18n.t(`steps.${step}`)}
          onclick={() => onselect(step)}
        >
          <span class="num" aria-hidden="true">{i + 1}</span>
          <span class="name">{i18n.t(`steps.${step}`)}</span>
          {#if optional}<span class="opt">{i18n.t('steps.optional')}</span>{/if}
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  ol {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .step {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: 8px;
    min-height: 44px;
    padding: 4px 12px 4px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--ink-muted);
    font: inherit;
    font-size: 15px;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .step:hover {
    border-color: var(--grid);
  }
  .step.active {
    border-color: var(--accent);
    color: var(--ink);
    background: var(--surface);
  }
  .num {
    grid-row: 1 / span 2;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-family: var(--font-mono);
    font-size: 13px;
  }
  .step.active .num {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--bg);
  }
  .opt {
    grid-column: 2;
    font-size: 12px;
    color: var(--ink-muted);
    line-height: 1;
  }
  /* On phones only the active step shows its name; the others are numbers.
     The names stay available to screen readers and as tooltips. */
  @media (max-width: 639px) {
    ol {
      flex-wrap: nowrap;
    }
    .step:not(.active) .name,
    .step:not(.active) .opt {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    .step:not(.active) {
      min-width: 44px;
      justify-content: center;
      padding: 4px;
    }
  }
</style>
