<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { clearNotice, notice, workspace } from '../session.svelte';
</script>

{#if notice.kind !== 'none'}
  <div class="notice {notice.kind}" role={notice.kind === 'error' ? 'alert' : 'status'}>
    <p>{notice.text}</p>
    {#if notice.undo}
      <button
        type="button"
        class="btn quiet"
        onclick={() => {
          workspace.undo();
          clearNotice();
        }}>{i18n.t('notice.undo')}</button
      >
    {/if}
    <button type="button" class="btn quiet" onclick={clearNotice}>{i18n.t('import.dismiss')}</button
    >
  </div>
{/if}

<style>
  /* A small floating message over the room: no layout jump (owner: Apply with a quiet Undo). */
  .notice {
    position: absolute;
    top: 64px;
    left: 50%;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: min(560px, calc(100% - 32px));
    padding: 4px 6px 4px 16px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(14px);
    box-shadow: var(--shadow);
    font-size: var(--text-sm);
    transform: translateX(-50%);
    animation: drop 0.25s ease;
  }
  .notice p {
    margin: 0 8px 0 0;
  }
  .notice.success p::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 8px;
    border-radius: 50%;
    background: var(--ok);
  }
  .notice.error {
    box-shadow:
      0 0 0 1.5px var(--danger),
      var(--shadow);
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translate(-50%, -6px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .notice {
      animation: none;
    }
  }
</style>
