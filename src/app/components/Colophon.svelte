<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { SUPPORT_URL } from '../config';

  /**
   * The foot of the map (desktop) or of the panel (phone): what the model is, in one honest line,
   * and a permanent, quiet way to support the project (docs/ROADMAP_V9.md §1).
   */
  let { place, onabout }: { place: 'canvas' | 'panel'; onabout: () => void } = $props();
</script>

<footer class="colophon {place}">
  <p class="note">
    {i18n.t('model.note')}
    <button type="button" class="link" onclick={onabout}>{i18n.t('model.more')}</button>
  </p>
  {#if SUPPORT_URL}
    <a class="support" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer"
      >{i18n.t('menu.support')}</a
    >
  {/if}
</footer>

<style>
  .colophon {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 20px;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .canvas {
    padding: 10px 20px 14px;
  }
  .panel {
    padding: 18px 20px 28px;
    border-top: 1px solid var(--grid);
  }
  /* One at a time: under the map on wide screens, at the foot of the panel otherwise. */
  @media (max-width: 1023px) {
    .canvas {
      display: none;
    }
  }
  @media (min-width: 1024px) {
    .panel {
      display: none;
    }
  }
  .note {
    margin: 0;
  }
  .link {
    margin-left: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .support {
    color: var(--ink-muted);
    text-decoration: underline;
    text-decoration-color: var(--grid-strong);
    text-underline-offset: 3px;
  }
  .support:hover {
    color: var(--accent);
  }
  @media (pointer: coarse), (max-width: 1023px) {
    .link,
    .support {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }
  }
</style>
