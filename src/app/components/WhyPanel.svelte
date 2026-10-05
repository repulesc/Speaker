<script lang="ts">
  import { confidenceStep } from '../../engine/confidence';
  import type { Concern, Finding, Severity } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { analysis, projectLabel, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import ComparePanel from './ComparePanel.svelte';
  import FindingCard from './FindingCard.svelte';

  const result = $derived(analysis.result);
  const system = $derived(workspace.project.units);
  const CONCERNS: Concern[] = [
    'bass',
    'frontWall',
    'stereo',
    'reflections',
    'objects',
    'speaker',
    'room',
    'rulesOfThumb',
  ];

  const ok = $derived(result?.status === 'ok' ? result : null);

  const bySeverity = (sev: Severity[]) =>
    ok ? ok.findings.filter((f) => sev.includes(f.severity)) : [];
  const problems = $derived(bySeverity(['red-flag', 'caution']));
  const notes = $derived(bySeverity(['info']).filter((f) => !['H01', 'H02'].includes(f.ruleId)));
  const redFlags = $derived(problems.filter((f) => f.severity === 'red-flag').length);
  const cautions = $derived(problems.length - redFlags);

  /** Findings grouped by what they are about, the most serious group first. */
  function grouped(list: Finding[]) {
    const groups = CONCERNS.map((concern) => ({
      concern,
      items: list.filter((f) => f.concern === concern),
    })).filter((g) => g.items.length > 0);
    const rank = (items: Finding[]) => (items.some((f) => f.severity === 'red-flag') ? 0 : 1);
    return groups.sort((a, b) => rank(a.items) - rank(b.items));
  }

  let showNotes = $state(false);
  const fmt = (m: number) => formatLength(m, system, 'position', i18n.locale);
  const folkText = (f: NonNullable<typeof ok>['folk'][number]) =>
    i18n.t(`folkRule.${f.verdict}`, {
      rule: i18n.t(`folkRule.${f.ruleId}`),
      seatY: fmt(f.seatY),
      bestY: fmt(f.bestY),
    }) + (f.redFlag ? i18n.t('folkRule.flag') : '');
</script>

<div class="why">
  <h2>{i18n.t('why.title')}</h2>

  {#if !result}
    {#if !analysis.error}<p class="card" role="status">{i18n.t('results.calculating')}</p>{/if}
  {:else if !ok}
    <div class="card">
      <p>{i18n.t('results.needRoom')}</p>
      <button type="button" class="btn primary" onclick={() => (ui.step = 'room')}
        >{i18n.t('dock.room')}</button
      >
    </div>
  {:else}
    <section aria-labelledby="problems-title" class="problems">
      <h3 id="problems-title">{i18n.t('why.problems')}</h3>
      <p class="muted" data-testid="finding-counts">
        {i18n.t('results.counts', { red: redFlags, caution: cautions })}
      </p>
      {#each grouped(problems) as group (group.concern)}
        <h4>{i18n.t(`concern.${group.concern}`)}</h4>
        {#each group.items as f (f.messageKey + String(f.params.speaker) + String(f.params.boundary) + String(f.params.object))}
          <FindingCard finding={f} {system} />
        {/each}
      {:else}
        <p class="card">{i18n.t('why.noProblems')}</p>
      {/each}
    </section>

    <ComparePanel />

    {#if ok.folk.length > 0}
      <section aria-labelledby="folk-title">
        <h3 id="folk-title">{i18n.t('why.folk')}</h3>
        {#each ok.folk as f (f.ruleId)}
          <article class="card">
            <p class="meta">▲ {i18n.t('evidence.heuristic')}</p>
            <p>{folkText(f)}</p>
          </article>
        {/each}
      </section>
    {/if}

    {#if notes.length > 0}
      <section aria-labelledby="notes-title">
        <h3 id="notes-title">{i18n.t('why.notes')}</h3>
        <button
          type="button"
          class="btn"
          aria-expanded={showNotes}
          onclick={() => (showNotes = !showNotes)}
        >
          {showNotes ? i18n.t('why.hideNotes') : i18n.t('why.showNotes', { count: notes.length })}
        </button>
        {#if showNotes}
          {#each grouped(notes) as group (group.concern)}
            <h4>{i18n.t(`concern.${group.concern}`)}</h4>
            {#each group.items as f (f.messageKey + String(f.params.speaker) + String(f.params.boundary))}
              <FindingCard finding={f} {system} />
            {/each}
          {/each}
        {/if}
      </section>
    {/if}

    <section class="card" aria-labelledby="conf-title">
      <h3 id="conf-title">{i18n.t('why.confidence')}</h3>
      <p>
        <strong data-testid="confidence-word"
          >{i18n.t(`confidence.step.${confidenceStep(ok.confidence.overall)}`)}</strong
        >
      </p>
      {#if ok.confidence.nextBestInput}
        <p class="muted">
          {i18n.t('why.confidenceHint', {
            next: i18n.t(`next.${ok.confidence.nextBestInput.path}`),
          })}
        </p>
      {/if}
    </section>
  {/if}

  <p class="muted disclaimer">{i18n.t('why.disclaimer')}</p>
  <p class="visually-hidden">{projectLabel(workspace.project.name)}</p>
</div>

<style>
  .why {
    display: grid;
    gap: 14px;
  }
  /* One heading style for every group on the Why and Tips tabs (V7). */
  h3 {
    font-size: var(--text-md);
    font-weight: 600;
  }
  h4 {
    margin: 6px 0 0;
    font-size: var(--text-md);
  }
  section {
    display: grid;
    gap: 8px;
  }
  .muted {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .meta {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    margin-bottom: 4px;
  }
  .disclaimer {
    margin-top: 6px;
  }
</style>
