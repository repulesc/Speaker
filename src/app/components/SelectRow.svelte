<script lang="ts">
  /**
   * A choice from a list, as one row: the label on the left, the value on the right (V9 control
   * rule, docs/ROADMAP_V9.md §2: five or more choices, or long labels). Rows stack into a ruled
   * list. An empty value means "Not sure".
   */
  interface Props {
    id: string;
    label: string;
    value: string;
    options: readonly { value: string; label: string }[];
    /** The label of the empty choice; leave out when the list has no "Not sure". */
    unset?: string;
    onchange: (value: string) => void;
  }
  let { id, label, value, options, unset, onchange }: Props = $props();
</script>

<div class="select-row">
  <label for={id}>{label}</label>
  <select {id} {value} onchange={(e) => onchange(e.currentTarget.value)}>
    {#if unset !== undefined}<option value="">{unset}</option>{/if}
    {#each options as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
  </select>
</div>

<style>
  .select-row {
    display: grid;
    /* The label takes what it needs; the value keeps at least 55 % so its text is not cut. */
    grid-template-columns: minmax(0, max-content) minmax(55%, 1fr);
    align-items: center;
    gap: 12px;
    min-height: 44px;
    border-bottom: 1px solid var(--grid);
  }
  label {
    color: var(--ink);
    font-size: var(--text-md);
    overflow-wrap: anywhere;
  }
  select {
    appearance: none;
    width: 100%;
    min-width: 0;
    min-height: 40px;
    padding: 0 22px 0 0;
    border: 0;
    background: transparent
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23808780' stroke-width='1.5'/%3E%3C/svg%3E")
      no-repeat right 4px center;
    color: var(--ink-muted);
    font: inherit;
    font-size: var(--text-md);
    text-align: end;
    text-overflow: ellipsis;
    cursor: pointer;
  }
  select:hover,
  select:focus-visible {
    color: var(--ink);
  }
  select:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
  option {
    color: var(--ink);
    background: var(--surface);
  }
  @media (pointer: coarse), (max-width: 1023px) {
    select {
      min-height: 44px;
    }
  }
</style>
