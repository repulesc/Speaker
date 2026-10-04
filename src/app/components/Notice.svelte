<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { clearNotice, notice } from '../session.svelte';
</script>

{#if notice.kind !== 'none'}
  <div class="notice {notice.kind}" role={notice.kind === 'error' ? 'alert' : 'status'}>
    <p>{notice.text}</p>
    <button type="button" class="btn quiet" onclick={clearNotice}>{i18n.t('import.dismiss')}</button
    >
  </div>
{/if}

<style>
  .notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 4px var(--gutter);
    border-bottom: 1px solid var(--grid);
    background: var(--surface);
  }
  .notice.success {
    border-left: 4px solid var(--ok);
  }
  .notice.error {
    border-left: 4px solid var(--danger);
  }
</style>
