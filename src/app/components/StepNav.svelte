<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { STEPS, type StepId } from '../session.svelte';

  interface Props {
    current: StepId;
    onselect: (step: StepId) => void;
  }

  let { current, onselect }: Props = $props();
  const index = $derived(STEPS.indexOf(current));
</script>

<div class="nav">
  <button
    type="button"
    class="btn"
    disabled={index === 0}
    onclick={() => onselect(STEPS[index - 1]!)}>{i18n.t('steps.back')}</button
  >
  <button
    type="button"
    class="btn primary"
    disabled={index === STEPS.length - 1}
    onclick={() => onselect(STEPS[index + 1]!)}>{i18n.t('steps.next')}</button
  >
</div>

<style>
  .nav {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
</style>
