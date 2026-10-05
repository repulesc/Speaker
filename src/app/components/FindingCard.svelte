<script lang="ts">
  import type { Finding } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import type { LengthSystem } from '../../units/format';
  import { findingText } from '../findings/text';

  interface Props {
    finding: Finding;
    system: LengthSystem;
  }
  let { finding, system }: Props = $props();

  // Shape and word, never colour alone (docs/UI_SPEC.md).
  const SEVERITY_ICON = { 'red-flag': '■', caution: '▲', info: '○', ok: '✓' } as const;
  const LEVEL_ICON = { physics: '●', guideline: '◆', heuristic: '▲', subjective: '◇' } as const;
</script>

<article class="card {finding.severity}">
  <p class="meta">
    <span class="sev"
      >{SEVERITY_ICON[finding.severity]} {i18n.t(`severity.${finding.severity}`)}</span
    >
    <span class="level">{LEVEL_ICON[finding.level]} {i18n.t(`evidence.${finding.level}`)}</span>
  </p>
  <p class="text">{findingText(finding, system)}</p>
</article>

<style>
  .card {
    gap: 6px;
  }
  /* Severity as a quiet bar on the card's edge, not a frame. */
  .card.red-flag {
    box-shadow:
      inset 3px 0 0 var(--danger),
      var(--card-shadow);
  }
  .card.caution {
    box-shadow:
      inset 3px 0 0 var(--caution),
      var(--card-shadow);
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .red-flag .sev {
    color: var(--danger);
    font-weight: 600;
  }
  .caution .sev {
    color: var(--caution);
    font-weight: 600;
  }
  .text {
    margin: 0;
    font-size: var(--text-md);
    line-height: 1.5;
  }
</style>
