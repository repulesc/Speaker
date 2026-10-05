<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import {
    ABOUT,
    comparison,
    FACES,
    faceOf,
    hideLiveWithIt,
    setFace,
    type About,
    type Face,
  } from '../listen/liveWithIt';
  import { workspace } from '../session.svelte';
  import MoodFace from './MoodFace.svelte';

  /**
   * After Apply (owner decision, docs/ROADMAP_V7.md): give it a few evenings, then three optional
   * one-tap faces. Kept on this device; the comparison with the app is a gentle sentence.
   */
  let { scoreNow }: { scoreNow: number } = $props();
  const project = $derived(workspace.project);
  const WORD: Record<Face, 'poor' | 'fair' | 'veryGood'> = { 1: 'poor', 3: 'fair', 5: 'veryGood' };
  const verdict = $derived(comparison(project, scoreNow));
  const pick = (about: About, face: Face) => workspace.edit((p) => setFace(p, about, face));
</script>

<section class="card live" aria-labelledby="live-title" data-testid="live-with-it">
  <h3 id="live-title" class="card-title">{i18n.t('live.title')}</h3>
  <p class="intro">{i18n.t('live.intro')}</p>
  {#each ABOUT as about (about)}
    {@const chosen = faceOf(project, about)}
    <div class="row">
      <span class="question" id="live-{about}">{i18n.t(`live.${about}`)}</span>
      <div class="faces" role="group" aria-labelledby="live-{about}">
        {#each FACES as face (face)}
          <button
            type="button"
            class="face-button"
            aria-pressed={chosen === face}
            aria-label={i18n.t(`live.face.${face}`)}
            title={i18n.t(`live.face.${face}`)}
            onclick={() => pick(about, face)}
          >
            <MoodFace word={WORD[face]} label="" />
          </button>
        {/each}
      </div>
    </div>
  {/each}
  {#if verdict}<p class="verdict" role="status">{i18n.t(`live.compare.${verdict}`)}</p>{/if}
  <div class="card-actions">
    <span class="local">{i18n.t('live.local')}</span>
    <button type="button" class="card-link hide" onclick={() => workspace.edit(hideLiveWithIt)}
      >{i18n.t('live.hide')}</button
    >
  </div>
</section>

<style>
  .intro {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .question {
    font-size: var(--text-md);
  }
  .faces {
    display: flex;
    gap: 2px;
  }
  .face-button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    cursor: pointer;
    opacity: 0.45;
    transition:
      opacity 0.15s ease,
      background 0.15s ease;
  }
  .face-button:hover {
    opacity: 0.8;
  }
  .face-button[aria-pressed='true'] {
    background: var(--fill);
    opacity: 1;
  }
  .verdict {
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--surface-2);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .local {
    flex: 1;
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }
  @media (prefers-reduced-motion: reduce) {
    .face-button {
      transition: none;
    }
  }
</style>
