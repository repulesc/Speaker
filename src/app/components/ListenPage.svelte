<script lang="ts">
  import ListenPanel from './ListenPanel.svelte';
  import TreatPanel from './TreatPanel.svelte';

  /** Listen (docs/ROADMAP_V8.md §4): judge the result by ear, then try one change at a time. */
</script>

<div class="listen">
  <TreatPanel />
  <ListenPanel />
</div>

<style>
  .listen {
    display: grid;
    gap: 28px;
  }
</style>
