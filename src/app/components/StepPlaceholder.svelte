<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import type { StepId } from '../session.svelte';

  let { step }: { step: StepId } = $props();
</script>

<div class="card">
  <h2>{i18n.t(`steps.${step}`)}</h2>
  <p>{i18n.t('steps.comingSoon')}</p>
</div>

<style>
  .card {
    display: grid;
    gap: 8px;
  }
  p {
    color: var(--ink-muted);
  }
</style>
