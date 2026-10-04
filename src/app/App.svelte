<script lang="ts">
  import { i18n } from '../i18n/locale.svelte';
  import { LOCALES } from '../i18n/translate';
</script>

<main>
  <header>
    <h1>{i18n.t('app.title')}</h1>
    <nav aria-label={i18n.t('language.label')}>
      {#each LOCALES as locale (locale)}
        <button
          type="button"
          aria-pressed={i18n.locale === locale}
          onclick={() => (i18n.locale = locale)}>{i18n.t(`language.${locale}`)}</button
        >
      {/each}
    </nav>
  </header>
  <p class="tagline">{i18n.t('app.tagline')}</p>
  <p class="status">{i18n.t('app.status')}</p>
</main>

<style>
  main {
    max-width: 44rem;
    margin: 0 auto;
    padding: 48px 16px;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    border-bottom: 1px solid var(--grid);
    padding-bottom: 16px;
  }
  h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 600;
    color: var(--ink);
  }
  nav {
    display: flex;
    gap: 8px;
  }
  button {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--grid);
    border-radius: 6px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    border-color: var(--accent);
    color: var(--accent);
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .tagline {
    font-size: 20px;
    color: var(--ink);
  }
  .status {
    color: var(--ink-muted);
  }
</style>
