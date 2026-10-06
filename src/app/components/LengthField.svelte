<script lang="ts">
  import { untrack } from 'svelte';
  import { i18n } from '../../i18n/locale.svelte';
  import type { Certainty, Known } from '../../engine/types';
  import { formatLength, type LengthKind, type LengthSystem } from '../../units/format';
  import { parseLength, type BareUnit } from '../../units/parse';
  import CertaintyChips from './CertaintyChips.svelte';

  interface Props {
    id: string;
    label: string;
    help?: string;
    kind: LengthKind;
    value: Known<number>;
    system: LengthSystem;
    /** Hard limits in metres: values outside are rejected with a message. */
    limits: { min: number; max: number };
    /** Soft range in metres: values outside are accepted with an "Is that right?" note. */
    usual?: { min: number; max: number };
    /** What is shown when the value is unknown (e.g. a default that will be assumed). */
    unknownNote?: string;
    /** Show the "how sure are you" chips (hidden in the first-run survey, to keep it short). */
    chips?: boolean;
    onchange: (next: Known<number>) => void;
  }

  let {
    id,
    label,
    help,
    kind,
    value,
    system,
    limits,
    usual,
    unknownNote,
    chips = true,
    onchange,
  }: Props = $props();

  const locale = $derived(i18n.locale);
  const format = (metres: number) => formatLength(metres, system, kind, locale);
  const bare = $derived<BareUnit>(
    system === 'imperial' ? (kind === 'room' ? 'ft' : 'in') : kind === 'room' ? 'm' : 'm-or-cm',
  );

  let text = $state('');
  let error = $state<string | null>(null);
  let editing = $state(false);
  /** A certainty picked before any number was typed; applied when the number arrives. */
  let chosen = $state<Certainty | null>(null);
  const shownCertainty = $derived<Certainty>(
    value.value === null && chosen && chosen !== 'unknown' ? chosen : value.certainty,
  );

  // Show the stored value, reformatted, whenever it (or the units or language) changes.
  // `editing` is read untracked: finishing an edit must not reset a rejected entry or its message.
  $effect(() => {
    const shown = value.value === null ? '' : format(value.value);
    if (untrack(() => editing)) return;
    text = shown;
    error = null;
  });

  const unusual = $derived(
    value.value !== null &&
      usual !== undefined &&
      (value.value < usual.min || value.value > usual.max),
  );

  function commit() {
    editing = false;
    const result = parseLength(text, bare);
    if (!result.ok) {
      error = i18n.t(`units.error.${result.reason}`);
      return;
    }
    if (result.metres === null) {
      error = null;
      onchange({ value: null, certainty: 'unknown' });
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
    const certainty: Certainty =
      chosen && chosen !== 'unknown'
        ? chosen
        : value.certainty === 'unknown'
          ? 'estimated'
          : value.certainty;
    chosen = null;
    onchange({ value: result.metres, certainty });
    text = format(result.metres);
  }

  function setCertainty(certainty: Certainty) {
    if (certainty === 'unknown') {
      error = null;
      chosen = null;
      onchange({ value: null, certainty });
    } else if (value.value !== null) {
      onchange({ value: value.value, certainty });
    } else {
      chosen = certainty;
    }
  }

  const describedBy = $derived(
    [help ? `${id}-help` : '', error ? `${id}-error` : '', unusual ? `${id}-note` : '']
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

<div class="field">
  <label for={id}>{label}</label>
  {#if help}<p class="help" id="{id}-help">{help}</p>{/if}
  <div class="input-row" class:solo={!chips}>
    <input
      {id}
      class="input"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      spellcheck="false"
      bind:value={text}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      onfocus={() => (editing = true)}
      onblur={commit}
      onkeydown={(e) => e.key === 'Enter' && commit()}
    />
    {#if chips}
      <CertaintyChips name="{id}-certainty" value={shownCertainty} onchange={setCertainty} />
    {/if}
  </div>
  {#if error}<p class="error" id="{id}-error" role="alert">{error}</p>{/if}
  {#if unusual && usual}
    <p class="note" id="{id}-note">
      {i18n.t('field.unusual', { min: format(usual.min), max: format(usual.max) })}
    </p>
  {/if}
  {#if value.value === null && unknownNote}<p class="note">{unknownNote}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 4px;
  }
  label {
    font-weight: 600;
  }
  .help {
    color: var(--ink-muted);
    font-size: var(--text-md);
  }
  .input-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
  }
  .input-row .input {
    flex: 0 1 11rem;
    min-width: 8rem;
  }
  /* Without the certainty chips the input takes the field's width (Set up's row of three). */
  .solo .input {
    flex: 1 1 auto;
    min-width: 0;
  }
  .error {
    color: var(--danger);
    font-size: var(--text-md);
  }
  .note {
    color: var(--caution);
    font-size: var(--text-md);
  }
</style>
