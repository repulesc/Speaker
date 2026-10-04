<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { prefs, type Mode } from '../prefs.svelte';

  function choose(mode: Mode) {
    prefs.mode = mode;
    prefs.welcomed = true;
  }
</script>

<section class="card" aria-labelledby="welcome-title">
  <h2 id="welcome-title">{i18n.t('welcome.title')}</h2>
  <p class="intro">{i18n.t('welcome.intro')}</p>
  <div class="choices">
    <button type="button" class="choice" onclick={() => choose('quick')}>
      <strong>{i18n.t('welcome.quick.title')}</strong>
      <span>{i18n.t('welcome.quick.body')}</span>
    </button>
    <button type="button" class="choice" onclick={() => choose('detailed')}>
      <strong>{i18n.t('welcome.detailed.title')}</strong>
      <span>{i18n.t('welcome.detailed.body')}</span>
    </button>
  </div>
</section>

<style>
  .card {
    display: grid;
    gap: 12px;
  }
  .intro {
    color: var(--ink-muted);
    font-size: 15px;
  }
  .choices {
    display: grid;
    gap: 8px;
  }
  .choice {
    display: grid;
    gap: 2px;
    padding: 12px 16px;
    border: 1px solid var(--grid);
    border-radius: var(--radius-sm);
    background: var(--bg);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .choice:hover {
    border-color: var(--accent);
  }
  .choice span {
    color: var(--ink-muted);
    font-size: 15px;
  }
</style>
