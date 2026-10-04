<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { scoreWord } from '../findings/text';
  import { SCORE_TIE } from '../listen/agreement';
  import { variantLabel, workspace } from '../session.svelte';
  import { setups } from '../state/setups.svelte';
  import { ui } from '../ui.svelte';

  const project = $derived(workspace.project);
  const others = $derived(project.variants.filter((v) => v.id !== project.activeVariantId));
  const other = $derived(others.find((v) => v.id === ui.compareId) ?? null);
  const active = $derived(project.variants.find((v) => v.id === project.activeVariantId)!);

  $effect(() => {
    if (other) void setups.refresh($state.snapshot(workspace.project));
  });

  const mine = $derived(setups.views[active.id]?.score ?? null);
  const theirs = $derived(other ? (setups.views[other.id]?.score ?? null) : null);
  const verdict = $derived(
    mine === null || theirs === null || !other
      ? null
      : Math.abs(mine - theirs) < SCORE_TIE
        ? i18n.t('compare.same')
        : i18n.t('compare.higher', {
            name: variantLabel(mine > theirs ? active.name : other.name),
          }),
  );
</script>

{#if others.length > 0}
  <section aria-labelledby="compare-title">
    <h3 id="compare-title">{i18n.t('compare.title')}</h3>
    <div class="field">
      <label for="compare-with">{i18n.t('compare.with')}</label>
      <select
        id="compare-with"
        class="input"
        value={other?.id ?? ''}
        onchange={(e) => (ui.compareId = e.currentTarget.value || null)}
      >
        <option value="">{i18n.t('compare.none')}</option>
        {#each others as v (v.id)}
          <option value={v.id}>{variantLabel(v.name)}</option>
        {/each}
      </select>
    </div>
    {#if other}
      <ul class="card" data-testid="compare-scores">
        {#each [{ name: active.name, score: mine }, { name: other.name, score: theirs }] as row (row.name + String(row.score))}
          <li>
            <span>{variantLabel(row.name)}</span>
            <strong>
              {row.score === null ? '…' : i18n.t(`results.score.${scoreWord(row.score)}`)}
            </strong>
          </li>
        {/each}
      </ul>
      {#if verdict}<p role="status">{verdict}</p>{/if}
      <p class="muted">{i18n.t('compare.chartNote')}</p>
    {/if}
  </section>
{/if}

<style>
  section,
  .field {
    display: grid;
    gap: 8px;
  }
  p {
    margin: 0;
  }
  .muted {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .card {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 12px 14px;
    list-style: none;
    border: 1px solid var(--grid-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
</style>
