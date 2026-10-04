<script lang="ts">
  import { confidenceStep } from '../../engine/confidence';
  import type { Concern, Finding, Severity } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { scoreWord } from '../findings/text';
  import { applyCandidate, cabinet } from '../plan/placement';
  import { analysis, projectLabel, showNotice, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import ComparePanel from './ComparePanel.svelte';
  import FindingCard from './FindingCard.svelte';

  const result = $derived(analysis.result);
  const system = $derived(workspace.project.units);
  const LETTERS = ['A', 'B', 'C'];
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
  const spots = $derived(ok?.candidates.slice(0, 3) ?? []);
  const move = $derived(ok?.topActions.find((a) => a.kind === 'move'));

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
  const depth = $derived(cabinet(workspace.project).d);

  function spotDetails(i: number) {
    const c = spots[i]!;
    return i18n.t('why.spotDetails', {
      front: fmt(c.speakers.left.base.y - depth / 2),
      spacing: fmt(c.speakers.right.base.x - c.speakers.left.base.x),
      seat: fmt(c.listener.y),
    });
  }

  function tryIt(i: number) {
    const c = spots[i];
    if (!c) return;
    workspace.edit((p) => void applyCandidate(p, c));
    ui.candidate = null;
    showNotice('success', i18n.t('why.applied', { letter: LETTERS[i]! }));
  }

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
    <section class="card summary" aria-labelledby="summary-title">
      <h3 id="summary-title">{i18n.t('why.setup')}</h3>
      <p class="scores">
        <span>
          {i18n.t('results.yourSetup')}:
          <strong data-testid="score-current"
            >{i18n.t(`results.score.${scoreWord(ok.current.score)}`)}</strong
          >
        </span>
        {#if spots[0]}
          <span>
            {i18n.t('results.bestFound')}:
            <strong data-testid="score-best"
              >{i18n.t(`results.score.${scoreWord(spots[0].score)}`)}</strong
            >
          </span>
        {/if}
      </p>
      {#if ok.current.fragility}
        <p class="muted">{i18n.t(`why.fragile.${ok.current.fragility.level}`)}</p>
      {/if}
      {#if move}
        <p>{i18n.t('why.moveFirst')}</p>
        <button type="button" class="btn primary" onclick={() => tryIt(0)}
          >{i18n.t('why.tryIt', { letter: 'A' })}</button
        >
      {:else if spots[0]}
        <p>{i18n.t('why.alreadyGood')}</p>
      {/if}
    </section>

    {#if spots.length > 0}
      <section class="spots" aria-labelledby="spots-title">
        <h3 id="spots-title">{i18n.t('why.spotsTitle')}</h3>
        <ul>
          {#each spots as c, i (i)}
            <li>
              <button
                type="button"
                class="spot"
                aria-pressed={ui.candidate === i}
                onclick={() => (ui.candidate = ui.candidate === i ? null : i)}
              >
                <span class="letter" aria-hidden="true">{LETTERS[i]}</span>
                <span>
                  <strong>{i18n.t('why.spotLabel', { letter: LETTERS[i]! })}</strong> ·
                  {i18n.t(`results.score.${scoreWord(c.score)}`)}
                  {#if c.fragility}· {i18n.t(`why.fragileShort.${c.fragility.level}`)}{/if}
                </span>
              </button>
              {#if ui.candidate === i}
                <div class="detail">
                  <p>{i18n.t('why.preview', { letter: LETTERS[i]! })}</p>
                  <p class="muted">{spotDetails(i)}</p>
                  <div class="row">
                    <button type="button" class="btn primary" onclick={() => tryIt(i)}
                      >{i18n.t('why.tryIt', { letter: LETTERS[i]! })}</button
                    >
                    <button type="button" class="btn" onclick={() => (ui.candidate = null)}
                      >{i18n.t('why.stopPreview')}</button
                    >
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

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
  h3 {
    font-size: 12px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  h4 {
    margin: 6px 0 0;
    font-size: 13px;
  }
  section {
    display: grid;
    gap: 8px;
  }
  .summary {
    gap: 8px;
  }
  .scores {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 24px;
  }
  .muted {
    color: var(--ink-muted);
    font-size: 13px;
  }
  .meta {
    color: var(--ink-muted);
    font-size: 12px;
    margin-bottom: 4px;
  }
  ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .spot {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 6px 12px;
    border: 1px solid var(--grid-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }
  .spot[aria-pressed='true'] {
    border-color: var(--accent);
  }
  .letter {
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--heat-4);
    color: #0b0f14;
    font-weight: 600;
    font-size: 13px;
  }
  li:nth-child(2) .letter {
    background: var(--heat-3);
  }
  li:nth-child(3) .letter {
    background: #8fd5c9;
  }
  .detail {
    display: grid;
    gap: 8px;
    padding: 10px 12px 2px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .disclaimer {
    margin-top: 6px;
  }
</style>
