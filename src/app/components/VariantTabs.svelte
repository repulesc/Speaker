<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { variantLabel, workspace } from '../session.svelte';

  let renaming = $state(false);
  let draft = $state('');

  const variants = $derived(workspace.project.variants);
  const activeId = $derived(workspace.project.activeVariantId);
  const active = $derived(variants.find((v) => v.id === activeId));

  function startRename() {
    draft = active?.name ?? '';
    renaming = true;
  }

  function finishRename() {
    if (renaming && active) workspace.renameVariant(active.id, draft);
    renaming = false;
  }

  function add() {
    workspace.addVariant(`${variantLabel('')} ${variants.length + 1}`);
  }

  function remove() {
    if (active && confirm(i18n.t('variant.deleteConfirm', { name: variantLabel(active.name) }))) {
      workspace.deleteVariant(active.id);
    }
  }
</script>

<div class="tabs">
  <div role="tablist" aria-label={i18n.t('variant.tabs')} class="list">
    {#each variants as v (v.id)}
      {#if renaming && v.id === activeId}
        <form
          class="rename"
          onsubmit={(e) => {
            e.preventDefault();
            finishRename();
          }}
        >
          <label class="visually-hidden" for="variant-name">{i18n.t('variant.renameLabel')}</label>
          <!-- svelte-ignore a11y_autofocus -->
          <input
            id="variant-name"
            class="input"
            bind:value={draft}
            maxlength="200"
            autofocus
            onblur={finishRename}
            onkeydown={(e) => e.key === 'Escape' && (renaming = false)}
          />
        </form>
      {:else}
        <button
          type="button"
          role="tab"
          class="tab"
          aria-selected={v.id === activeId}
          tabindex={v.id === activeId ? 0 : -1}
          onclick={() => workspace.switchVariant(v.id)}>{variantLabel(v.name)}</button
        >
      {/if}
    {/each}
  </div>
  <div class="actions">
    <button
      type="button"
      class="btn quiet"
      onclick={startRename}
      aria-label={i18n.t('variant.rename')}
      title={i18n.t('variant.rename')}>✎</button
    >
    {#if variants.length > 1}
      <button
        type="button"
        class="btn quiet"
        onclick={remove}
        aria-label={i18n.t('variant.delete')}
        title={i18n.t('variant.delete')}>✕</button
      >
    {/if}
    <button type="button" class="btn quiet add" onclick={add}>+ {i18n.t('variant.new')}</button>
  </div>
</div>

<style>
  /* Setups as a compact segmented control at the top left of the room view. */
  .tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .list {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 9px;
    background: var(--fill);
  }
  .tab {
    min-height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
  }
  .tab[aria-selected='true'] {
    background: var(--surface);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
    font-weight: 600;
  }
  .actions {
    display: flex;
    align-items: center;
    flex: none;
  }
  .actions .btn {
    min-width: 44px;
    padding: 0 10px;
    font-size: var(--text-sm);
  }
  .add {
    white-space: nowrap;
  }
  .rename .input {
    min-width: 10rem;
    margin: 2px 0;
  }
</style>
