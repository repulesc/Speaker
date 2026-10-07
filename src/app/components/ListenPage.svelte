<script lang="ts">
  import {
    ASPECT_ANSWERS,
    ASPECT_GROUPS,
    aspectOf,
    FINE,
    type Aspect,
    type Experiment,
    type ListeningAnswers,
  } from '../../engine/listening';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatFrequency, formatLength } from '../../units/format';
  import { pendingTry, putBack, setAnswer, setTryResult, tryExperiment } from '../listen/check';
  import { analysis, showNotice, workspace } from '../session.svelte';
  import PlacementOptions from './PlacementOptions.svelte';
  import TestSounds from './TestSounds.svelte';
  import TreatPanel from './TreatPanel.svelte';

  /**
   * 03 Listening check (docs/ROADMAP_V9.md §5, V10 §3): ten rows in four groups, test sounds to
   * help you answer, and the fixes for a complaint right under it: free moves first, then the
   * speaker's own controls, then the room, each fitted to what the room page says. Each says how
   * sure it is; the ears decide.
   */
  const project = $derived(workspace.project);
  const check = $derived(project.listening);
  const answers = $derived<ListeningAnswers>(check?.answers ?? {});
  const ok = $derived(analysis.result?.status === 'ok' ? analysis.result : null);
  const experiments = $derived(ok?.listening ?? []);
  const pending = $derived(pendingTry(project));
  const pendingAspect = $derived(pending ? aspectOf(pending.experiment) : undefined);
  const tried = $derived((check?.tries ?? []).slice().reverse());

  /** The order on screen: the "fine" answer sits where it reads naturally on each scale. */
  const ORDER: { [A in Aspect]: readonly NonNullable<ListeningAnswers[A]>[] } = {
    ...ASPECT_ANSWERS,
    centre: ['focused', 'vague', 'left', 'right'],
    clarity: ['clear', 'some', 'echoey'],
  };
  const complaint = (aspect: Aspect) => {
    const a = answers[aspect];
    return a !== undefined && a !== FINE[aspect];
  };
  const fixesFor = (aspect: Aspect) => experiments.filter((e) => e.aspect === aspect);

  /** "20 cm" for moves, "5°" for toe-in. */
  function amount(e: Pick<Experiment, 'change' | 'params'>): string {
    const by = Number(e.params.by ?? 0);
    if (e.change?.kind === 'toeIn') return `${by}°`;
    return formatLength(by, project.units, 'position', i18n.locale);
  }
  /** The numbers a sentence may use: the step, and a frequency (V10, L08). */
  const values = (e: Experiment) => ({
    by: amount(e),
    hz: e.params.hz === undefined ? '' : formatFrequency(Number(e.params.hz), i18n.locale),
  });
  const doText = (e: Experiment) => i18n.t(`listen.exp.${e.id}`, values(e));
  const whyText = (e: Experiment) => i18n.t(`listen.why.${e.id}`, values(e));
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
</script>

{#snippet howWasIt()}
  {#if pending}
    <div class="pending" aria-live="polite" data-testid="listen-pending">
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
    </div>
  {/if}
{/snippet}

<div class="listen">
  <section class="check" aria-labelledby="listen-title">
    <h2 id="listen-title">{i18n.t('listen.title')}</h2>
    <p class="help">{i18n.t('listen.intro')}</p>

    <TestSounds />

    <div class="matrix">
      {#each ASPECT_GROUPS as group (group.id)}
        <p class="group" id="listen-group-{group.id}">{i18n.t(`listen.group.${group.id}`)}</p>
        {#each group.aspects as aspect (aspect)}
          <div
            class="row"
            class:wide={ORDER[aspect].length > 3}
            role="group"
            aria-labelledby="aspect-{aspect}"
          >
            <span class="label" id="aspect-{aspect}">{i18n.t(`listen.aspect.${aspect}.label`)}</span
            >
            <div class="scale">
              {#each ORDER[aspect] as value (value)}
                <button
                  type="button"
                  class="option"
                  class:fine={value === FINE[aspect]}
                  aria-pressed={answers[aspect] === value}
                  title={i18n.t(`listen.aspect.${aspect}.${value}`)}
                  onclick={() => answer(aspect, value as never)}
                  >{i18n.t(`listen.short.${aspect}.${value}`)}</button
                >
              {/each}
            </div>
          </div>
          {#if pendingAspect === aspect}{@render howWasIt()}{/if}
          {#if complaint(aspect)}
            {@const fixes = fixesFor(aspect)}
            {#if fixes.length}
              <ol
                class="fixes"
                aria-label={i18n.t('listen.fixesFor', {
                  aspect: `${i18n.t(`listen.group.${group.id}`)}, ${i18n
                    .t(`listen.aspect.${aspect}.label`)
                    .toLowerCase()}`,
                })}
              >
                {#each fixes as e (e.id)}
                  <li class="fix" data-testid="experiment">
                    <p class="do">{doText(e)}</p>
                    <p class="why">{whyText(e)}</p>
                    <div class="meta">
                      <span class="conf {e.level}">{i18n.t(`listen.confidence.${e.level}`)}</span>
                      {#if e.model}<span class="model">{i18n.t(`listen.model.${e.model}`)}</span
                        >{/if}
                      <button
                        type="button"
                        class="btn quiet try"
                        disabled={pending !== null}
                        onclick={() => attempt(e)}
                        >{i18n.t(e.change ? 'listen.tryIt' : 'listen.tried')}</button
                      >
                    </div>
                  </li>
                {/each}
              </ol>
            {:else}
              <p class="help nothing">{i18n.t('listen.nothing')}</p>
            {/if}
          {/if}
        {/each}
      {/each}
    </div>
    {#if pending && pendingAspect === undefined}{@render howWasIt()}{/if}
  </section>

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

  <details class="fold room-ideas">
    <summary>
      <span class="fold-title">{i18n.t('listen.roomIdeas')}</span>
      <span class="fold-hint">{i18n.t('listen.roomIdeasHint')}</span>
    </summary>
    <div class="fold-body">
      <PlacementOptions parts={['ready']} plain />
      <TreatPanel />
    </div>
  </details>
</div>

<style>
  .listen {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
  section {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  /* The matrix: aspect on the left, a compact scale on the right; fixes open under their row. */
  .matrix {
    display: grid;
  }
  /* A group caption, then its rows between rules. */
  .group {
    padding: 14px 0 6px;
    border-bottom: 1px solid var(--grid);
    color: var(--ink-muted);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 9fr);
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--grid);
  }
  /* Four answers need the full width: the scale goes under its label. */
  .row.wide {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .label {
    font-size: var(--text-sm);
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .scale {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 9px;
    background: var(--fill);
  }
  .option {
    flex: 1 1 0;
    min-width: 0;
    min-height: 30px;
    padding: 2px;
    overflow-wrap: normal;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    line-height: 1.15;
    cursor: pointer;
  }
  .option:hover {
    background: color-mix(in srgb, var(--ink) 6%, transparent);
  }
  .option[aria-pressed='true'] {
    background: var(--accent-fill);
    color: var(--on-accent);
    font-weight: 600;
  }
  .option.fine[aria-pressed='true'] {
    background: var(--thumb);
    color: var(--thumb-ink);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.16);
  }
  .fixes {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 4px 0 8px 14px;
    border-bottom: 1px solid var(--grid);
    border-left: 2px solid var(--accent-fill);
    list-style: none;
  }
  .fix {
    display: grid;
    gap: 4px;
    padding: 10px 0;
  }
  .fix + .fix {
    border-top: 1px solid var(--grid);
  }
  .do {
    font-weight: 600;
    line-height: 1.4;
  }
  .why {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    font-size: var(--text-sm);
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
  .try {
    margin-left: auto;
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid var(--grid-strong);
  }
  .nothing {
    padding: 8px 0 10px 16px;
    border-bottom: 1px solid var(--grid);
  }
  /* "How was it?": the one thing waiting for you after a try, under the answer it belongs to. */
  .pending {
    display: grid;
    gap: 10px;
    margin: 8px 0;
    padding: 14px 16px;
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow:
      inset 3px 0 0 var(--accent-fill),
      var(--card-shadow);
  }
  .pending-title {
    font-weight: 600;
    line-height: 1.35;
  }
  .results {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
  @media (pointer: coarse), (max-width: 1023px) {
    .option,
    .try,
    .link {
      min-height: 44px;
    }
    .row {
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
    }
  }
</style>
