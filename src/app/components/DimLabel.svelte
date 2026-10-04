<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength, type LengthKind, type LengthSystem } from '../../units/format';
  import { parseLength, type BareUnit } from '../../units/parse';

  interface Props {
    /** What the number measures, for the accessible name ("Seat to front wall"). */
    name: string;
    /** Current value in metres. */
    value: number;
    system: LengthSystem;
    kind?: LengthKind;
    /** Limits in metres: values outside are rejected with a message. */
    limits: { min: number; max: number };
    /** Centre of the label on the drawing, in pixels. */
    x: number;
    y: number;
    /** Which item the number belongs to; the plan shows speaker and seat numbers on demand. */
    group?: 'room' | 'speaker' | 'seat';
    onchange: (metres: number) => void;
  }

  let {
    name,
    value,
    system,
    kind = 'position',
    limits,
    x,
    y,
    group = 'room',
    onchange,
  }: Props = $props();

  const locale = $derived(i18n.locale);
  const format = (metres: number) => formatLength(metres, system, kind, locale);
  const bare = $derived<BareUnit>(system === 'imperial' ? 'in' : kind === 'room' ? 'm' : 'm-or-cm');

  let editing = $state(false);
  let text = $state('');
  let error = $state<string | null>(null);
  let input = $state<HTMLInputElement>();

  async function start() {
    text = format(value);
    error = null;
    editing = true;
    await tick();
    input?.select();
  }

  function commit() {
    const result = parseLength(text, bare);
    if (!result.ok) {
      error = i18n.t(`units.error.${result.reason}`);
      return;
    }
    if (result.metres === null) return cancel();
    if (result.metres < limits.min - 1e-9 || result.metres > limits.max + 1e-9) {
      error = i18n.t('field.outOfRange', {
        label: name,
        min: format(limits.min),
        max: format(limits.max),
      });
      return;
    }
    editing = false;
    error = null;
    onchange(result.metres);
  }

  function cancel() {
    editing = false;
    error = null;
  }

  // A stored value that changes elsewhere (drag, undo) closes a stale edit.
  $effect(() => {
    void value;
    if (untrack(() => editing) && !untrack(() => error)) editing = false;
  });
</script>

<div class="dim" data-group={group} style="left:{x}px; top:{y}px">
  {#if editing}
    <input
      bind:this={input}
      bind:value={text}
      class="edit"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      spellcheck="false"
      aria-label={i18n.t('map.dimEdit', { name })}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? 'dim-error' : undefined}
      onblur={() => (error ? cancel() : commit())}
      onkeydown={(e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') cancel();
      }}
    />
    {#if error}<p id="dim-error" class="error" role="alert">{error}</p>{/if}
  {:else}
    <button type="button" class="value" aria-label="{name}: {format(value)}" onclick={start}>
      {format(value)}
    </button>
  {/if}
</div>

<style>
  .dim {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 2;
  }
  .value,
  .edit {
    min-height: 22px;
    padding: 1px 8px;
    border: 0;
    border-radius: 999px;
    background: var(--surface);
    box-shadow: 0 0 0 1px var(--grid-strong);
    color: var(--ink);
    font-size: var(--text-xs);
    font-weight: 500;
    line-height: 1.6;
    white-space: nowrap;
    cursor: text;
  }
  .edit {
    width: 84px;
    color: var(--ink);
    text-align: center;
  }
  .edit[aria-invalid='true'] {
    border-color: var(--danger);
  }
  .error {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin: 4px 0 0;
    width: max-content;
    max-width: 240px;
    padding: 4px 8px;
    border: 1px solid var(--danger);
    border-radius: 8px;
    background: var(--surface);
    color: var(--danger);
    font-size: var(--text-xs);
  }
  @media (pointer: coarse) {
    .value,
    .edit {
      min-height: 44px;
      min-width: 44px;
      font-size: 13px;
    }
  }
</style>
