<script lang="ts" generics="T extends string | number">
  /**
   * Two to four short, exclusive choices, always visible (V9 control rule, docs/ROADMAP_V9.md §2).
   * A radio group under a caption.
   */
  interface Props {
    name: string;
    label: string;
    value: T | undefined;
    options: readonly { value: T; label: string }[];
    onchange: (value: T) => void;
  }
  let { name, label, value, options, onchange }: Props = $props();
</script>

<div class="segmented">
  <span class="field-label" id="{name}-label">{label}</span>
  <div class="seg" role="radiogroup" aria-labelledby="{name}-label">
    {#each options as o (o.value)}
      <label>
        <input
          type="radio"
          {name}
          value={o.value}
          checked={value === o.value}
          onchange={() => onchange(o.value)}
        />
        <span>{o.label}</span>
      </label>
    {/each}
  </div>
</div>

<style>
  .segmented {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .seg {
    display: flex;
    width: 100%;
  }
  .seg label {
    min-width: 0;
    padding: 4px 6px;
    text-align: center;
    white-space: normal;
    line-height: 1.2;
  }
</style>
