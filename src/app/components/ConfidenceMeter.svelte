<script lang="ts">
  import { confidenceStep } from '../../engine/confidence';
  import type { ConfidenceReport } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import Dropdown from './Dropdown.svelte';

  let { report }: { report: ConfidenceReport | null } = $props();

  const step = $derived(report ? confidenceStep(report.overall) : 0);
  const word = $derived(step ? i18n.t(`confidence.step.${step}`) : '…');
  const hintInput = $derived(
    report?.nextBestInput ? i18n.t(`input.${report.nextBestInput.path}`) : null,
  );
</script>

<Dropdown label={i18n.t('confidence.hintTitle')} align="end" triggerClass="meter">
  {#snippet trigger()}
    <span class="visually-hidden">{i18n.t('confidence.label')}</span>
    <span class="segments" aria-hidden="true">
      {#each [1, 2, 3, 4, 5] as n (n)}
        <span class="segment" class:filled={n <= step}></span>
      {/each}
    </span>
    <span class="word">{word}</span>
  {/snippet}
  <div>
    <h2>{i18n.t('confidence.hintTitle')}</h2>
    <p>
      {#if hintInput}
        {i18n.t('confidence.hint', { input: hintInput })}
      {:else}
        {i18n.t('confidence.nothingMore')}
      {/if}
    </p>
  </div>
  {#if report && report.caps.length > 0}
    <div>
      <h3>{i18n.t('confidence.capsTitle')}</h3>
      <ul>
        {#each report.caps as cap (cap.reason)}
          <li>{i18n.t(`confidence.cap.${cap.reason}`)}</li>
        {/each}
      </ul>
    </div>
  {/if}
</Dropdown>

<style>
  :global(.btn.meter) {
    gap: 10px;
  }
  .segments {
    display: inline-flex;
    gap: 3px;
  }
  .segment {
    width: 8px;
    height: 18px;
    border: 1px solid var(--line);
    border-radius: 2px;
  }
  .segment.filled {
    background: var(--accent);
    border-color: var(--accent);
  }
  .word {
    font-size: 15px;
    max-width: 11rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* On phones the word is hidden visually but still read out. */
  @media (max-width: 639px) {
    .word {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
  h2 {
    font-size: 17px;
    margin-bottom: 4px;
  }
  h3 {
    font-size: 15px;
    margin-bottom: 4px;
  }
  p,
  li {
    font-size: 15px;
  }
  ul {
    margin: 0;
    padding-left: 20px;
  }
</style>
