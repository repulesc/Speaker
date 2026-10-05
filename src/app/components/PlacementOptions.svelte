<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { workspace } from '../session.svelte';
  import { goalOf, setGoal, type Goal } from '../state/goal';
  import type { ListeningAreaKind } from '../../engine/types';

  /**
   * The two choices that shape the answer: what may move, and where you listen from (one chair, a
   * sofa, a desk or a bed; a desk also means sitting close). They are settings, so they live with
   * the other settings, apart from the answer (owner decision, docs/ROADMAP_V5.md).
   */
  const project = $derived(workspace.project);
  const moves = $derived<Goal>(goalOf(project));
  const setMoves = (value: Goal) => workspace.edit((p) => setGoal(p, value));
  type Place = 'chair' | ListeningAreaKind;
  const PLACES: readonly Place[] = ['chair', 'sofa', 'desk', 'bed'];
  const place = $derived.by<Place>(() => {
    const area = project.variants.find((v) => v.id === project.activeVariantId)?.listener.area;
    if (project.constraints.listeningDistance === 'near') return 'desk';
    return area && area !== 'desk' ? area : 'chair';
  });
  /** The listening place belongs to the room, not to one setup: every setup gets it. */
  function setPlace(value: Place) {
    workspace.edit((p) => {
      p.constraints.listeningDistance = value === 'desk' ? 'near' : 'room';
      for (const v of p.variants) {
        if (value === 'chair') delete v.listener.area;
        else v.listener.area = value;
      }
    });
  }
  function setReady(on: boolean) {
    workspace.edit((p) => {
      if (on) p.constraints.treatmentReady = true;
      else delete p.constraints.treatmentReady;
    });
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
    <span class="caption" id="opt-place">{i18n.t('suggest.place.label')}</span>
    <div class="seg" role="radiogroup" aria-labelledby="opt-place">
      {#each PLACES as d (d)}
        <label>
          <input
            type="radio"
            name="place"
            value={d}
            checked={place === d}
            onchange={() => setPlace(d)}
          />
          <span>{i18n.t(`suggest.place.${d}`)}</span>
        </label>
      {/each}
    </div>
  </div>
  <div class="option">
    <label class="check">
      <input
        type="checkbox"
        checked={project.constraints.treatmentReady === true}
        onchange={(e) => setReady(e.currentTarget.checked)}
      />
      <span>{i18n.t('suggest.ready.label')}</span>
    </label>
    <span class="caption">{i18n.t('suggest.ready.help')}</span>
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
  .check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    font-weight: 600;
    cursor: pointer;
  }
  .check input {
    width: 22px;
    height: 22px;
    flex: none;
  }
  .caption {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .seg {
    display: flex;
  }
</style>
