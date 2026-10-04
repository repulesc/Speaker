<script lang="ts">
  import { confidenceStep } from '../../engine/confidence';
  import { i18n } from '../../i18n/locale.svelte';
  import { analysis } from '../session.svelte';
  import { ui } from '../ui.svelte';

  const result = $derived(analysis.result);

  /** Words for a 0–1 score (UI calibration). Never shown as a percentage. */
  function scoreWord(score: number): 'poor' | 'fair' | 'good' | 'veryGood' {
    // NaN fails every comparison below: never let a broken number read as "very good".
    if (!Number.isFinite(score) || score < 0.5) return 'poor';
    if (score < 0.7) return 'fair';
    if (score < 0.85) return 'good';
    return 'veryGood';
  }

  const redFlags = $derived(
    result?.status === 'ok' ? result.findings.filter((f) => f.severity === 'red-flag').length : 0,
  );
  const cautions = $derived(
    result?.status === 'ok' ? result.findings.filter((f) => f.severity === 'caution').length : 0,
  );
</script>

<div class="step">
  <h2>{i18n.t('steps.results')}</h2>

  {#if !result}
    {#if !analysis.error}
      <p class="card" role="status">{i18n.t('results.calculating')}</p>
    {/if}
  {:else if result.status === 'needs-room-size'}
    <div class="card">
      <p>{i18n.t('results.needRoom')}</p>
      <button type="button" class="btn primary" onclick={() => (ui.step = 'room')}
        >{i18n.t('steps.room')}</button
      >
    </div>
  {:else}
    {@const best = result.candidates[0]}
    <section class="card summary" aria-labelledby="summary-title">
      <h3 id="summary-title">{i18n.t('results.summary')}</h3>
      <p class="scores">
        <span>
          {i18n.t('results.yourSetup')}:
          <strong data-testid="score-current"
            >{i18n.t(`results.score.${scoreWord(result.current.score)}`)}</strong
          >
        </span>
        {#if best}
          <span>
            {i18n.t('results.bestFound')}:
            <strong data-testid="score-best"
              >{i18n.t(`results.score.${scoreWord(best.score)}`)}</strong
            >
          </span>
        {/if}
      </p>
      <p>
        {i18n.t('results.confidence')}:
        <strong data-testid="confidence-word"
          >{i18n.t(`confidence.step.${confidenceStep(result.confidence.overall)}`)}</strong
        >
      </p>
      <p data-testid="finding-counts">
        {i18n.t('results.counts', { red: redFlags, caution: cautions })}
      </p>
    </section>

    <p class="help">{i18n.t('results.more')}</p>
  {/if}
</div>

<style>
  .step {
    display: grid;
    gap: 16px;
  }
  .card {
    display: grid;
    gap: 8px;
  }
  h3 {
    font-size: 17px;
  }
  .scores {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 24px;
  }
  .help {
    color: var(--ink-muted);
    font-size: 15px;
  }
</style>
