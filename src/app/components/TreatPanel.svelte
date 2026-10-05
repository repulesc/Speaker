<script lang="ts">
  import type { Advice } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { advicePlainText, adviceText } from '../findings/text';
  import { heldBack, visibleAdvice } from '../findings/visible';
  import { analysis, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';

  const result = $derived(analysis.result?.status === 'ok' ? analysis.result : null);
  const system = $derived(workspace.project.units);
  const ready = $derived(workspace.project.constraints.treatmentReady);
  const all = $derived(result?.advice.treatment ?? []);
  const treatment = $derived(visibleAdvice(all, ready));
  const held = $derived(heldBack(all, ready));
  const settings = $derived(result?.advice.settings ?? []);

  const LEVEL_ICON = { physics: '●', guideline: '◆', heuristic: '▲', subjective: '◇' } as const;
  /** Advice with a spot on the map is numbered in list order; the map shows the same numbers. */
  const marker = (a: Advice) => treatment.filter((t) => t.location).indexOf(a) + 1;
  const keyOf = (a: Advice) =>
    a.messageKey + String(a.params.speaker ?? '') + String(a.params.boundary ?? '');
</script>

{#snippet card(a: Advice, first: boolean)}
  <article class="card" class:first>
    <p class="meta">
      <span>{LEVEL_ICON[a.level]} {i18n.t(`evidence.${a.level}`)}</span>
      <span>
        {a.effort === 'invest' ? `${i18n.t('treat.invest')} · ` : ''}{i18n.t(
          `treat.effect.${a.effect}`,
        )}
      </span>
    </p>
    <p class="text">{advicePlainText(a, system)}</p>
    <details class="details">
      <summary>{i18n.t('treat.details')}</summary>
      <p>{adviceText(a, system)}</p>
    </details>
    {#if a.location}<p class="meta">{i18n.t('treat.onMap', { n: marker(a) })}</p>{/if}
  </article>
{/snippet}

<div class="treat">
  <h2>{i18n.t('treat.title')}</h2>
  <p class="muted">{i18n.t('treat.intro')}</p>

  {#if !result}
    <p class="card" role="status">{i18n.t('results.calculating')}</p>
  {:else}
    <section aria-labelledby="treat-room">
      <h3 id="treat-room">{i18n.t('treat.roomTitle')}</h3>
      {#each treatment as a, i (keyOf(a))}
        {#if i === 0}<p class="first-label">{i18n.t('treat.first')}</p>{/if}
        {@render card(a, i === 0)}
      {:else}
        <p class="card">{i18n.t('treat.none')}</p>
      {/each}
      {#if held}
        <p class="card hint" data-testid="held-back">
          {i18n.t('treat.heldBack')}
          <button
            type="button"
            class="link"
            onclick={() => {
              ui.openRoom('ready');
            }}>{i18n.t('treat.openSettings')}</button
          >
        </p>
      {/if}
    </section>

    <section aria-labelledby="treat-settings">
      <h3 id="treat-settings">{i18n.t('treat.settingsTitle')}</h3>
      {#each settings as a (keyOf(a))}
        {@render card(a, false)}
      {:else}
        <p class="card">{i18n.t('treat.noSettings')}</p>
      {/each}
    </section>
  {/if}
</div>

<style>
  .treat {
    display: grid;
    gap: 14px;
  }
  section {
    display: grid;
    gap: 8px;
  }
  .muted {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .first-label {
    margin: 0;
    color: var(--accent);
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .card {
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border: 1px solid var(--grid-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .card.first {
    border-color: var(--accent);
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .hint {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .link {
    display: block;
    min-height: 44px;
    margin-top: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .details summary {
    min-height: 32px;
    display: flex;
    align-items: center;
    color: var(--accent);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .details p {
    margin: 4px 0 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  @media (pointer: coarse), (max-width: 1023px) {
    .details summary {
      min-height: 44px;
    }
  }
  .text {
    margin: 0;
    font-size: var(--text-md);
    line-height: 1.5;
  }
</style>
