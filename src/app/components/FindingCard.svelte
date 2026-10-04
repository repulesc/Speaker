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
    display: grid;
    gap: 6px;
    padding: 12px 14px;
    border: 1px solid var(--grid-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .card.red-flag {
    border-color: var(--danger);
  }
  .card.caution {
    border-color: color-mix(in srgb, var(--caution) 60%, var(--grid-strong));
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 0;
    color: var(--ink-muted);
    font-size: 12px;
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
    font-size: 14px;
    line-height: 1.5;
  }
</style>
