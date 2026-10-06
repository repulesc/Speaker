<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { analysis } from '../session.svelte';
  import ConfidenceMeter from './ConfidenceMeter.svelte';
  import SuggestionCard from './SuggestionCard.svelte';
  import WhyTab from './WhyTab.svelte';

  /**
   * Place (docs/ROADMAP_V8.md §2): the answer first; the reasons, the per-reason maps and the bass
   * fold under "The details" for whoever asks why (owner: "Why what? It's not obvious"). How sure
   * the answer is closes the page.
   */
  let open = $state(false);
</script>

<div class="place">
  <SuggestionCard />
  <details class="details" bind:open>
    <summary>
      <span class="title">{i18n.t('place.details')}</span>
      <span class="hint">{i18n.t('place.detailsHint')}</span>
    </summary>
    {#if open}<div class="body"><WhyTab /></div>{/if}
  </details>
  <ConfidenceMeter report={analysis.result?.confidence ?? null} />
</div>

<style>
  .place {
    display: grid;
    gap: 20px;
  }
  .details {
    border-top: 1px solid var(--grid);
  }
  summary {
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding: 14px 0 0;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .title {
    color: var(--accent);
    font-weight: 600;
  }
  .title::after {
    content: '›';
    display: inline-block;
    margin-left: 6px;
    transition: transform 0.15s ease;
  }
  [open] .title::after {
    transform: rotate(90deg);
  }
  .hint {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .body {
    padding-top: 18px;
  }
  @media (prefers-reduced-motion: reduce) {
    .title::after {
      transition: none;
    }
  }
</style>
