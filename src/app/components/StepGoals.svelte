<script lang="ts">
  import type { GoalId, GoalWeight } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { workspace } from '../session.svelte';

  const goals: GoalId[] = [
    'wide-stage',
    'precise-imaging',
    'flat-response',
    'deep-bass',
    'low-volume-listening',
  ];
  const levels: GoalWeight[] = [0, 1, 2];
  const levelKey = ['dontCare', 'nice', 'important'] as const;

  const weight = (id: GoalId): GoalWeight => workspace.project.goals.weights[id] ?? 0;
  const conflict = $derived(weight('wide-stage') > 0 && weight('precise-imaging') > 0);

  function set(id: GoalId, value: GoalWeight) {
    workspace.edit((p) => void (p.goals.weights[id] = value));
  }
</script>

<div class="step">
  <div>
    <h2>{i18n.t('goals.title')}</h2>
    <p class="intro">{i18n.t('goals.intro')}</p>
  </div>

  {#each goals as id (id)}
    <fieldset>
      <legend>{i18n.t(`goals.goal.${id}.name`)}</legend>
      <p class="help">{i18n.t(`goals.goal.${id}.help`)}</p>
      <div class="seg" role="radiogroup" aria-label={i18n.t(`goals.goal.${id}.name`)}>
        {#each levels as level (level)}
          <label>
            <input
              type="radio"
              name="goal-{id}"
              value={level}
              checked={weight(id) === level}
              onchange={() => set(id, level)}
            />
            <span>{i18n.t(`goals.level.${levelKey[level]}`)}</span>
          </label>
        {/each}
      </div>
    </fieldset>
  {/each}

  {#if conflict}
    <p class="card notice" role="status">{i18n.t('goals.conflict')}</p>
  {/if}
</div>

<style>
  .step {
    display: grid;
    gap: 20px;
  }
  .intro,
  .help {
    color: var(--ink-muted);
    font-size: var(--text-md);
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    display: grid;
    gap: 4px;
  }
  legend {
    padding: 0;
    font-weight: 600;
  }
  .seg {
    justify-self: start;
    max-width: 100%;
    flex-wrap: wrap;
  }
  .notice {
    border-color: var(--caution);
    font-size: var(--text-md);
  }
</style>
