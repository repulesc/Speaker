<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { ENGINE_VERSION } from '../../engine/version';
  import { APP_NAME, SUPPORT_URL } from '../config';

  let dialog = $state<HTMLDialogElement>();

  export function show() {
    dialog?.showModal();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="about-title">
  <div class="body">
    <h2 id="about-title">{i18n.t('about.title')}: {APP_NAME}</h2>
    <p>{i18n.t('about.body')}</p>
    <p>{i18n.t('about.sources')}</p>
    {#if SUPPORT_URL}
      <p>
        <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">{i18n.t('about.support')}</a
        >
      </p>
    {/if}
    <p class="meta">v{ENGINE_VERSION}</p>
    <button type="button" class="btn" onclick={() => dialog?.close()}
      >{i18n.t('share.close')}</button
    >
  </div>
</dialog>

<style>
  .body {
    display: grid;
    gap: 12px;
    width: min(28rem, 100%);
  }
  .meta {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 13px;
  }
  .btn {
    justify-self: start;
  }
</style>
