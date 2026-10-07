<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { APP_NAME, SUPPORT_URL } from '../config';

  /**
   * The foot of the map (desktop) or of the panel (phone): what the model is, in one honest line,
   * and a permanent, quiet way to support the project. Under the map the line is centred on the
   * drawing's axis and the support link sits apart in the corner (docs/ROADMAP_V10.md §5).
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
      >{i18n.t('menu.support', { app: APP_NAME })}</a
    >
  {/if}
</footer>

<style>
  .colophon {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  /* Three columns, the outer two equal: the note stays on the map's centre line. */
  .canvas {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 6px 20px;
    padding: 10px 20px 14px;
  }
  .canvas .note {
    grid-column: 2;
    text-align: center;
  }
  .canvas .support {
    grid-column: 3;
    justify-self: end;
  }
  .panel {
    display: grid;
    justify-items: start;
    gap: 6px;
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
  /* Too narrow for three columns: the note centred, the support link under it on the right. */
  @media (min-width: 1024px) and (max-width: 1279px) {
    .canvas {
      grid-template-columns: minmax(0, 1fr);
    }
    .canvas .note,
    .canvas .support {
      grid-column: 1;
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
    white-space: nowrap;
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
