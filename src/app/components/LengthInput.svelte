<script lang="ts">
  import { untrack } from 'svelte';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength, type LengthSystem } from '../../units/format';
  import { parseLength, type BareUnit } from '../../units/parse';

  interface Props {
    id: string;
    label: string;
    /** Current value in metres. */
    value: number;
    system: LengthSystem;
    /** Hard limits in metres: values outside are rejected with a message. */
    limits: { min: number; max: number };
    disabled?: boolean;
    onchange: (metres: number) => void;
  }

  let { id, label, value, system, limits, disabled = false, onchange }: Props = $props();

  const locale = $derived(i18n.locale);
  const format = (metres: number) => formatLength(metres, system, 'position', locale);
  const bare = $derived<BareUnit>(system === 'imperial' ? 'in' : 'm-or-cm');

  let text = $state('');
  let error = $state<string | null>(null);
  let editing = $state(false);

  // Follow the stored value (and units or language) unless the user is typing.
  $effect(() => {
    const shown = format(value);
    if (untrack(() => editing)) return;
    text = shown;
    error = null;
  });

  function commit() {
    editing = false;
    const result = parseLength(text, bare);
    if (!result.ok) {
      error = i18n.t(`units.error.${result.reason}`);
      return;
    }
    if (result.metres === null) {
      text = format(value);
      return;
    }
    if (result.metres < limits.min - 1e-9 || result.metres > limits.max + 1e-9) {
      error = i18n.t('field.outOfRange', {
        label,
        min: format(limits.min),
        max: format(limits.max),
      });
      return;
    }
    error = null;
    onchange(result.metres);
    text = format(result.metres);
  }
</script>

<div class="field">
  <label for={id}>{label}</label>
  <input
    {id}
    class="input"
    type="text"
    inputmode="decimal"
    autocomplete="off"
    spellcheck="false"
    {disabled}
    bind:value={text}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? `${id}-error` : undefined}
    onfocus={() => (editing = true)}
    onblur={commit}
    onkeydown={(e) => e.key === 'Enter' && commit()}
  />
  {#if error}<p class="error" id="{id}-error" role="alert">{error}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  label {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .error {
    color: var(--danger);
    font-size: var(--text-md);
  }
</style>
