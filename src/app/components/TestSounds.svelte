<script lang="ts">
  import { onDestroy } from 'svelte';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatFrequency } from '../../units/format';
  import { playSound, stopSound, type Progress, type Sound } from '../listen/sounds';

  /**
   * Test sounds (docs/ROADMAP_V10.md §7): left, right, centre, a polarity check and a bass sweep,
   * to help answer the rows below. Through your speakers, quietly; nothing is recorded.
   */
  const SOUNDS: readonly Sound[] = ['left', 'right', 'centre', 'polarity', 'sweep'];
  let playing = $state<Sound | null>(null);
  let last = $state<Sound | null>(null);
  let progress = $state<Progress>(null);

  async function play(sound: Sound) {
    if (playing === sound) return stop();
    playing = sound;
    last = sound;
    await playSound(sound, (p) => (progress = p));
    if (playing === sound) playing = null;
  }
  function stop() {
    stopSound();
    playing = null;
  }
  onDestroy(stopSound);

  const now = $derived.by(() => {
    if (!progress) return '';
    if ('phase' in progress) return i18n.t('listen.sounds.phase', { phase: progress.phase });
    return formatFrequency(progress.hz, i18n.locale);
  });
</script>

<details class="fold sounds" ontoggle={(e) => !e.currentTarget.open && stop()}>
  <summary>
    <span class="fold-title">{i18n.t('listen.sounds.title')}</span>
    <span class="fold-hint">{i18n.t('listen.sounds.hint')}</span>
  </summary>
  <div class="fold-body">
    <p class="help">{i18n.t('listen.sounds.safety')}</p>
    <div class="buttons">
      {#each SOUNDS as s (s)}
        <button type="button" class="chip" aria-pressed={playing === s} onclick={() => play(s)}
          >{i18n.t(`listen.sounds.${s}.name`)}</button
        >
      {/each}
    </div>
    {#if last}
      <p class="what" aria-live="polite">
        {#if playing && now}<span class="now">{now}</span>{/if}
        {i18n.t(`listen.sounds.${last}.listen`)}
      </p>
    {/if}
  </div>
</details>

<style>
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .what {
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .now {
    margin-right: 6px;
    color: var(--accent);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>
