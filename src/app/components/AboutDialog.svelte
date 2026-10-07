<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { ENGINE_VERSION } from '../../engine/version';
  import { APP_NAME } from '../config';
  import Wordmark from './Wordmark.svelte';

  /**
   * About, in our own voice (docs/ROADMAP_V10.md §6): what NODO is, what a box model can tell
   * you, what needs your ears. The mark on top, Close at the foot, the page blurred behind.
   */
  let dialog = $state<HTMLDialogElement>();

  export function show() {
    dialog?.showModal();
  }
</script>

<dialog
  bind:this={dialog}
  class="about"
  aria-labelledby="about-title"
  onclick={(e) => e.target === dialog && dialog?.close()}
>
  <div class="body">
    <div class="mark"><Wordmark height={30} /></div>
    <h2 id="about-title" class="visually-hidden">{i18n.t('about.title', { app: APP_NAME })}</h2>
    <p class="lead">{i18n.t('about.lead')}</p>
    <section>
      <h3>{i18n.t('about.knowsTitle')}</h3>
      <p>{i18n.t('about.knows', { app: APP_NAME })}</p>
    </section>
    <section>
      <h3>{i18n.t('about.earsTitle')}</h3>
      <p>{i18n.t('about.ears')}</p>
    </section>
    <p class="judge">{i18n.t('about.judge', { app: APP_NAME })}</p>
    <p class="meta">{i18n.t('about.sources')} · v{ENGINE_VERSION}</p>
    <button type="button" class="btn close" onclick={() => dialog?.close()}
      >{i18n.t('share.close')}</button
    >
  </div>
</dialog>

<style>
  .about {
    width: min(34rem, calc(100vw - 32px));
    max-width: none;
    padding: 32px 32px 24px;
    border-radius: 18px;
  }
  .about[open] {
    animation: rise 0.25s ease;
  }
  /* The page behind goes soft, as behind the first-run survey. */
  .about::backdrop {
    background: rgb(18 21 19 / 0.28);
    backdrop-filter: blur(8px);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .about[open] {
      animation: none;
    }
  }
  .body {
    display: grid;
    gap: 18px;
    text-align: center;
  }
  .mark {
    display: flex;
    justify-content: center;
    padding-bottom: 4px;
  }
  .lead {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    line-height: 1.4;
  }
  section {
    display: grid;
    gap: 6px;
    padding-top: 16px;
    border-top: 1px solid var(--grid);
  }
  h3 {
    font-family: var(--font-display);
    font-weight: 500;
    letter-spacing: 0.01em;
  }
  section p {
    color: var(--ink-muted);
    line-height: 1.55;
  }
  .judge {
    padding-top: 16px;
    border-top: 1px solid var(--grid);
    line-height: 1.55;
  }
  .meta {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .close {
    justify-self: center;
    min-width: 140px;
  }
</style>
