<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { workspace } from '../session.svelte';
  import { encodeShare } from '../state/share';

  let dialog = $state<HTMLDialogElement>();
  let link = $state('');
  let includeNotes = $state(false);
  let copied = $state<'none' | 'ok' | 'failed'>('none');

  async function refresh() {
    const hash = await encodeShare($state.snapshot(workspace.project), { includeNotes });
    link = `${location.origin}${location.pathname}${hash}`;
  }

  export async function show() {
    copied = 'none';
    link = '';
    dialog?.showModal();
    await refresh();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      copied = 'ok';
    } catch {
      copied = 'failed';
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="share-title">
  <div class="body">
    <h2 id="share-title">{i18n.t('share.title')}</h2>
    <p class="privacy">{i18n.t('share.privacy')}</p>
    <label class="choice">
      <input
        type="checkbox"
        bind:checked={includeNotes}
        onchange={() => {
          copied = 'none';
          void refresh();
        }}
      />
      {i18n.t('share.includeNotes')}
    </label>
    <label class="link-label" for="share-link">{i18n.t('share.linkLabel')}</label>
    <input
      id="share-link"
      class="input"
      readonly
      value={link}
      onfocus={(e) => e.currentTarget.select()}
    />
    <div class="actions">
      <button type="button" class="btn primary" onclick={copy}>{i18n.t('share.copy')}</button>
      <button type="button" class="btn" onclick={() => dialog?.close()}
        >{i18n.t('share.close')}</button
      >
    </div>
    <p class="status" role="status">
      {#if copied === 'ok'}{i18n.t('share.copied')}{:else if copied === 'failed'}{i18n.t(
          'share.copyFailed',
        )}{/if}
    </p>
  </div>
</dialog>

<style>
  .body {
    display: grid;
    gap: 12px;
    width: min(28rem, 100%);
  }
  .privacy {
    color: var(--ink-muted);
    font-size: 15px;
  }
  .choice {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
  .choice input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
  }
  .link-label {
    font-weight: 600;
  }
  .input {
    font-size: 13px;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .status {
    min-height: 1.5em;
    color: var(--ok);
    font-size: 15px;
  }
</style>
