<script lang="ts">
  import {
    ASPECT_ANSWERS,
    ASPECTS,
    type Aspect,
    type Experiment,
    type ListeningAnswers,
  } from '../../engine/listening';
  import type { ListeningState } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import {
    pendingTry,
    putBack,
    setAnswer,
    setNote,
    setOverall,
    setTryResult,
    tryExperiment,
  } from '../listen/check';
  import { analysis, showNotice, workspace } from '../session.svelte';
  import TreatPanel from './TreatPanel.svelte';

  /**
   * Listen (docs/ROADMAP_V8.md §4): say what you hear, then try one change at a time, the way a
   * sound engineer works by ear. The app never claims to know the speaker: each change says how
   * sure it is, and for moves what the room model thinks; the ears decide.
   */
  const project = $derived(workspace.project);
  const check = $derived(project.listening);
  const answers = $derived<ListeningAnswers>(check?.answers ?? {});
  const ok = $derived(analysis.result?.status === 'ok' ? analysis.result : null);
  const experiments = $derived(ok?.listening ?? []);
  const asked = $derived(
    Object.values(answers).some(
      (a) => a !== undefined && !['right', 'even', 'focused', 'clear'].includes(a),
    ),
  );
  const pending = $derived(pendingTry(project));
  const tried = $derived((check?.tries ?? []).slice().reverse());
  const OVERALL = [1, 2, 3, 4, 5] as const;

  /** "20 cm" for moves, "5°" for toe-in. */
  function amount(e: Pick<Experiment, 'change' | 'params'>): string {
    const by = Number(e.params.by ?? 0);
    if (e.change?.kind === 'toeIn') return `${by}°`;
    return formatLength(by, project.units, 'position', i18n.locale);
  }
  const doText = (e: Experiment) => i18n.t(`listen.exp.${e.id}`, { by: amount(e) });
  const whyText = (e: Experiment) => i18n.t(`listen.why.${e.id}`, { by: amount(e) });
  /** A tried change's sentence, from what was kept with it (the list may have moved on). */
  const triedText = (t: { experiment: string; by?: number; degrees?: boolean }) =>
    i18n.t(`listen.exp.${t.experiment}`, {
      by: t.degrees
        ? `${t.by ?? 0}°`
        : formatLength(t.by ?? 0, project.units, 'position', i18n.locale),
    });

  function answer<A extends Aspect>(aspect: A, value: ListeningAnswers[A]) {
    workspace.edit((p) => setAnswer(p, aspect, value));
  }
  function attempt(e: Experiment) {
    let done = false;
    workspace.edit((p) => void (done = tryExperiment(p, e)));
    if (!done) showNotice('error', i18n.t('listen.noLonger'));
  }
  let note = $state('');
  $effect(() => {
    note = check?.note ?? '';
  });
</script>

<div class="listen">
  <section class="check" aria-labelledby="listen-title">
    <h2 id="listen-title">{i18n.t('listen.title')}</h2>
    <p class="intro">{i18n.t('listen.intro')}</p>

    {#each ASPECTS as aspect (aspect)}
      <div class="aspect" role="group" aria-labelledby="aspect-{aspect}">
        <span class="label" id="aspect-{aspect}">{i18n.t(`listen.aspect.${aspect}.label`)}</span>
        <div class="options">
          {#each ASPECT_ANSWERS[aspect] as value (value)}
            <button
              type="button"
              class="option"
              class:good={['right', 'even', 'focused', 'clear'].includes(value)}
              aria-pressed={answers[aspect] === value}
              onclick={() => answer(aspect, value as never)}
              >{i18n.t(`listen.aspect.${aspect}.${value}`)}</button
            >
          {/each}
        </div>
      </div>
    {/each}

    <div class="aspect" role="group" aria-labelledby="aspect-overall">
      <span class="label" id="aspect-overall">{i18n.t('listen.overall.label')}</span>
      <div class="scale">
        {#each OVERALL as v (v)}
          <button
            type="button"
            class="dot"
            aria-pressed={check?.overall === v}
            aria-label={i18n.t(`listen.overall.${v}`)}
            title={i18n.t(`listen.overall.${v}`)}
            onclick={() => workspace.edit((p) => setOverall(p, v as ListeningState['overall']))}
            >{v}</button
          >
        {/each}
      </div>
      <div class="ends" aria-hidden="true">
        <span>{i18n.t('listen.overall.1')}</span><span>{i18n.t('listen.overall.5')}</span>
      </div>
    </div>

    <label class="note">
      <span class="label">{i18n.t('listen.note')}</span>
      <textarea
        class="input"
        rows="2"
        bind:value={note}
        onchange={() => workspace.edit((p) => setNote(p, note))}
      ></textarea>
    </label>
    <p class="local">{i18n.t('listen.local')}</p>
  </section>

  {#if pending}
    <section class="pending" aria-live="polite" data-testid="listen-pending">
      <p class="pending-title">{i18n.t('listen.how', { what: triedText(pending) })}</p>
      <div class="results">
        {#each ['better', 'same', 'worse'] as const as r (r)}
          <button
            type="button"
            class="btn"
            onclick={() => workspace.edit((p) => setTryResult(p, pending.id, r))}
            >{i18n.t(`listen.result.${r}`)}</button
          >
        {/each}
      </div>
    </section>
  {/if}

  {#if experiments.length}
    <section class="tries" aria-labelledby="try-title">
      <h2 id="try-title">{i18n.t('listen.tryTitle')}</h2>
      <p class="intro">{i18n.t('listen.tryIntro')}</p>
      <ol class="experiments">
        {#each experiments as e (e.id)}
          <li class="exp" data-testid="experiment">
            <p class="do">{doText(e)}</p>
            <p class="why">{whyText(e)}</p>
            <p class="meta">
              <span class="conf {e.level}">{i18n.t(`listen.confidence.${e.level}`)}</span>
              {#if e.model}<span class="model">{i18n.t(`listen.model.${e.model}`)}</span>{/if}
            </p>
            <button type="button" class="btn" disabled={pending !== null} onclick={() => attempt(e)}
              >{i18n.t(e.change ? 'listen.tryIt' : 'listen.tried')}</button
            >
          </li>
        {/each}
      </ol>
    </section>
  {:else if asked}
    <p class="empty">{i18n.t('listen.nothing')}</p>
  {:else if Object.keys(answers).length > 0}
    <p class="empty">{i18n.t('listen.allRight')}</p>
  {/if}

  {#if tried.length}
    <section class="history" aria-labelledby="history-title">
      <h3 id="history-title">{i18n.t('listen.history')}</h3>
      <ul>
        {#each tried as t (t.id)}
          <li>
            <span class="what">{triedText(t)}</span>
            <span class="result {t.result ?? 'open'}"
              >{t.result ? i18n.t(`listen.result.${t.result}`) : i18n.t('listen.result.open')}</span
            >
            {#if t.result === 'worse' && t.before}
              <button
                type="button"
                class="link"
                onclick={() => workspace.edit((p) => putBack(p, t.id))}
                >{i18n.t('listen.putBack')}</button
              >
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <details class="room-ideas">
    <summary>
      <span class="title">{i18n.t('listen.roomIdeas')}</span>
      <span class="hint">{i18n.t('listen.roomIdeasHint')}</span>
    </summary>
    <div class="body"><TreatPanel /></div>
  </details>
</div>

<style>
  .listen {
    display: grid;
    gap: 32px;
  }
  section {
    display: grid;
    gap: 14px;
  }
  .intro,
  .local,
  .empty {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .intro {
    margin-top: -6px;
  }
  .aspect {
    display: grid;
    gap: 6px;
  }
  .label {
    font-size: var(--text-sm);
    font-weight: 600;
  }
  /* Two-sided answers: the extremes at the ends, "just right" in the middle, nothing preselected. */
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .option {
    flex: 1 1 auto;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--grid-strong);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .option:hover {
    border-color: var(--ink-muted);
  }
  .option[aria-pressed='true'] {
    border-color: var(--accent-fill);
    background: var(--accent-fill);
    color: var(--on-accent);
    font-weight: 600;
  }
  .option.good[aria-pressed='true'] {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent-fill) 14%, var(--surface));
    color: var(--ink);
  }
  .scale {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  .dot {
    min-height: 36px;
    border: 1px solid var(--grid-strong);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 16px;
    cursor: pointer;
  }
  .dot[aria-pressed='true'] {
    border-color: var(--accent-fill);
    background: var(--accent-fill);
    color: var(--on-accent);
  }
  .ends {
    display: flex;
    justify-content: space-between;
    color: var(--ink-muted);
    font-size: var(--text-xs);
  }
  .note {
    display: grid;
    gap: 6px;
  }
  textarea {
    min-height: 64px;
    padding: 10px 12px;
    resize: vertical;
  }
  /* "How was it?": the one thing waiting for you after a try. */
  .pending {
    gap: 10px;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow:
      inset 3px 0 0 var(--accent-fill),
      var(--card-shadow);
  }
  .pending-title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    line-height: 1.35;
  }
  .results {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .experiments {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: exp;
  }
  .exp {
    position: relative;
    display: grid;
    gap: 6px;
    padding: 16px 0 16px 34px;
    border-top: 1px solid var(--grid);
    counter-increment: exp;
  }
  .exp::before {
    content: counter(exp);
    position: absolute;
    left: 0;
    top: 15px;
    width: 22px;
    height: 22px;
    border: 1px solid var(--accent);
    border-radius: 50%;
    color: var(--accent);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
    text-align: center;
  }
  .do {
    font-size: var(--text-md);
    font-weight: 600;
    line-height: 1.4;
  }
  .why {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: var(--text-xs);
  }
  .conf {
    font-weight: 600;
  }
  .conf.physics,
  .conf.guideline {
    color: var(--accent);
  }
  .conf.heuristic,
  .conf.subjective {
    color: var(--caution);
  }
  .model {
    color: var(--ink-muted);
  }
  .exp .btn {
    justify-self: start;
    min-height: 36px;
    margin-top: 4px;
  }
  .history ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .history li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    font-size: var(--text-sm);
  }
  .what {
    flex: 1 1 14rem;
  }
  .result {
    font-weight: 600;
  }
  .result.better {
    color: var(--ok);
  }
  .result.worse {
    color: var(--caution);
  }
  .result.open,
  .result.same {
    color: var(--ink-muted);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .room-ideas {
    border-top: 1px solid var(--grid);
  }
  summary {
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding-top: 14px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary .title {
    color: var(--accent);
    font-weight: 600;
  }
  summary .hint {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .room-ideas .body {
    padding-top: 16px;
  }
  @media (pointer: coarse) {
    .option,
    .dot,
    .exp .btn {
      min-height: 44px;
    }
  }
</style>
