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
  .tabs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 var(--gutter);
    background: var(--surface);
    border-bottom: 1px solid var(--grid);
    overflow-x: auto;
  }
  .list {
    display: flex;
    gap: 2px;
  }
  .tab {
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: var(--ink-muted);
    font: inherit;
    font-size: 15px;
    white-space: nowrap;
    cursor: pointer;
  }
  .tab[aria-selected='true'] {
    border-bottom-color: var(--accent);
    color: var(--ink);
    font-weight: 600;
  }
  .actions {
    display: flex;
    align-items: center;
    flex: none;
  }
  .add {
    font-size: 15px;
    white-space: nowrap;
  }
  .rename .input {
    font-family: var(--font-sans);
    min-width: 10rem;
    margin: 2px 0;
  }
</style>
