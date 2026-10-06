<script lang="ts">
  import { tick } from 'svelte';
  import { i18n } from '../../i18n/locale.svelte';
  import { projectLabel, workspace } from '../session.svelte';

  /**
   * The project's name, edited where it is shown (owner feedback after V7: the pencil next to
   * "Your room" opened the settings instead of renaming). Click or tap the name, type, Enter.
   */
  let editing = $state(false);
  let draft = $state('');
  let input = $state<HTMLInputElement>();
  const name = $derived(workspace.project.name);

  async function start() {
    draft = name;
    editing = true;
    await tick();
    input?.select();
  }
  function commit() {
    if (!editing) return;
    editing = false;
    if (draft.trim() !== name) workspace.rename(draft.trim());
  }
</script>

{#if editing}
  <input
    bind:this={input}
    class="name editing"
    bind:value={draft}
    maxlength="200"
    aria-label={i18n.t('project.renameLabel')}
    placeholder={i18n.t('project.untitled')}
    onblur={commit}
    onkeydown={(e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') editing = false;
    }}
  />
{:else}
  <button
    type="button"
    class="name"
    class:untitled={!name}
    title={i18n.t('project.renameHint')}
    aria-label={i18n.t('project.renameButton', { name: projectLabel(name) })}
    onclick={start}
  >
    <span class="text">{projectLabel(name)}</span>
    <svg class="pen" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M3 13h2.5L12.6 5.9 10.1 3.4 3 10.5z" />
    </svg>
  </button>
{/if}

<style>
  .name {
    display: flex;
    align-items: baseline;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: var(--text-md);
    font-weight: 600;
    line-height: 1.25;
    text-align: start;
    cursor: text;
  }
  .text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .untitled .text {
    color: var(--ink-muted);
  }
  .pen {
    flex: none;
    fill: none;
    stroke: var(--ink-muted);
    stroke-width: 1.3;
    stroke-linejoin: round;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .name:hover .pen,
  .name:focus-visible .pen {
    opacity: 1;
  }
  @media (pointer: coarse) {
    .pen {
      opacity: 0.6;
    }
  }
  .editing {
    padding: 0 6px;
    margin-left: -6px;
    width: calc(100% + 6px);
    border: 1px solid var(--accent);
    background: var(--surface);
    outline: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .pen {
      transition: none;
    }
  }
</style>
