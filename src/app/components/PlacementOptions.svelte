<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { workspace } from '../session.svelte';
  import { goalOf, setGoal, type Goal } from '../state/goal';

  /**
   * The two choices that shape the answer: what may move, and how far from the speakers to sit.
   * They are settings, so they live with the other settings, apart from the answer (owner decision,
   * docs/ROADMAP_V5.md).
   */
  const project = $derived(workspace.project);
  const moves = $derived<Goal>(goalOf(project));
  const setMoves = (value: Goal) => workspace.edit((p) => setGoal(p, value));
  const distance = $derived(project.constraints.listeningDistance ?? 'room');
  function setDistance(value: 'room' | 'near') {
    workspace.edit((p) => void (p.constraints.listeningDistance = value));
  }
</script>

<div class="options">
  <div class="option">
    <span class="caption" id="opt-move">{i18n.t('suggest.move.label')}</span>
    <div class="seg" role="radiogroup" aria-labelledby="opt-move">
      {#each ['both', 'speakers', 'seat'] as const as m (m)}
        <label>
          <input
            type="radio"
            name="moves"
            value={m}
            checked={moves === m}
            onchange={() => setMoves(m)}
          />
          <span>{i18n.t(`suggest.move.${m}`)}</span>
        </label>
      {/each}
    </div>
  </div>
  <div class="option">
    <span class="caption" id="opt-distance">{i18n.t('suggest.distance.label')}</span>
    <div class="seg" role="radiogroup" aria-labelledby="opt-distance">
      {#each ['room', 'near'] as const as d (d)}
        <label>
          <input
            type="radio"
            name="distance"
            value={d}
            checked={distance === d}
            onchange={() => setDistance(d)}
          />
          <span>{i18n.t(`suggest.distance.${d}`)}</span>
        </label>
      {/each}
    </div>
  </div>
</div>

<style>
  .options {
    display: grid;
    gap: 12px;
    padding: 14px 16px 16px;
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .option {
    display: grid;
    gap: 6px;
  }
  .caption {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .seg {
    display: flex;
  }
</style>
