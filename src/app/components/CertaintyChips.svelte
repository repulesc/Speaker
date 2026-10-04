<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import type { Certainty } from '../../engine/types';

  interface Props {
    /** Unique per field: the radio group name. */
    name: string;
    value: Certainty;
    onchange: (value: Certainty) => void;
  }

  let { name, value, onchange }: Props = $props();
  const options: Certainty[] = ['measured', 'estimated', 'unknown'];
</script>

<div class="seg" role="radiogroup" aria-label={i18n.t('field.certainty.label')}>
  {#each options as option (option)}
    <label>
      <input
        type="radio"
        {name}
        value={option}
        checked={value === option}
        onchange={() => onchange(option)}
      />
      <span>{i18n.t(`field.certainty.${option}`)}</span>
    </label>
  {/each}
</div>
