<script lang="ts">
  /**
   * A small face for the mood of the whole setup, on the Best placement card (owner decision,
   * docs/DESIGN_BRIEF_V4.md). It follows the real score word, never more. Two looks to choose
   * from: drawn in the site's own style (default) or system emoji (`?face=emoji`).
   */
  type Word = 'poor' | 'fair' | 'good' | 'veryGood';
  let { word, label }: { word: Word; label: string } = $props();

  const style =
    typeof location !== 'undefined' && new URLSearchParams(location.search).get('face') === 'emoji'
      ? 'emoji'
      : 'drawn';
  const EMOJI: Record<Word, string> = { poor: '😕', fair: '😐', good: '🙂', veryGood: '😄' };
  /** Mouth curve: negative frowns, positive smiles. */
  const CURVE: Record<Word, number> = { poor: -2.5, fair: 0, good: 3, veryGood: 5 };
</script>

{#key word}
  <!-- Without a label it is decoration (the button around it says what it means). -->
  <span
    class="face {word}"
    role={label ? 'img' : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : 'true'}
    title={label || undefined}
  >
    {#if style === 'emoji'}
      <span class="emoji" aria-hidden="true">{EMOJI[word]}</span>
    {:else}
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <circle class="head" cx="14" cy="14" r="12.5" />
        <circle class="eye" cx="10" cy="11.5" r="1.4" />
        <circle class="eye" cx="18" cy="11.5" r="1.4" />
        <path
          class="mouth"
          d="M 9 {17.5 - CURVE[word] / 3} Q 14 {17.5 + CURVE[word]} 19 {17.5 - CURVE[word] / 3}"
        />
      </svg>
    {/if}
  </span>
{/key}

<style>
  .face {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex: none;
    animation: pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  /* A tiny celebration when the setup reaches Good or Very good: a soft glow, no confetti. */
  .face.good,
  .face.veryGood {
    border-radius: 50%;
    animation:
      pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1),
      glow 1.6s ease-out;
  }
  .emoji {
    font-size: 22px;
    line-height: 1;
  }
  .head {
    fill: color-mix(in srgb, var(--accent-fill) 10%, var(--surface));
    stroke: var(--ink-muted);
    stroke-width: 1.2;
  }
  .good .head,
  .veryGood .head {
    fill: color-mix(in srgb, var(--heat-4) 30%, var(--surface));
    stroke: color-mix(in srgb, var(--heat-3) 70%, var(--ink));
  }
  .eye {
    fill: var(--ink);
  }
  .mouth {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.6;
    stroke-linecap: round;
  }
  @keyframes pop {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @keyframes glow {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--heat-4) 60%, transparent);
    }
    100% {
      box-shadow: 0 0 0 12px transparent;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .face,
    .face.good,
    .face.veryGood {
      animation: none;
    }
  }
</style>
