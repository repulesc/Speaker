<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { scoreWord } from '../findings/text';
  import { applyCandidate, cabinet } from '../plan/placement';
  import { analysis, showNotice, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';

  /**
   * The app's answer, first: where the speakers and the seat should go (owner feedback after R5:
   * "the whole point of the app", which was hidden half-way down a panel).
   */
  const LETTERS = ['A', 'B', 'C'];
  const project = $derived(workspace.project);
  const ok = $derived(analysis.result?.status === 'ok' ? analysis.result : null);
  const spots = $derived(ok?.candidates.slice(0, 3) ?? []);
  const shown = $derived(spots[ui.candidate ?? 0] ?? null);
  const move = $derived(ok?.topActions.some((a) => a.kind === 'move') ?? false);
  const system = $derived(project.units);
  const depth = $derived(cabinet(project).d);
  const fmt = (m: number) => formatLength(m, system, 'position', i18n.locale);

  type Moves = 'both' | 'speakers' | 'seat';
  const moves = $derived<Moves>(
    project.constraints.listenerFixed
      ? 'speakers'
      : project.constraints.speakersFixed
        ? 'seat'
        : 'both',
  );
  function setMoves(value: Moves) {
    workspace.edit((p) => {
      p.constraints.listenerFixed = value === 'speakers';
      p.constraints.speakersFixed = value === 'seat';
    });
  }
  const distance = $derived(project.constraints.listeningDistance ?? 'room');
  function setDistance(value: 'room' | 'near') {
    workspace.edit((p) => void (p.constraints.listeningDistance = value));
  }

  const seatDistance = (c: NonNullable<typeof shown>) =>
    Math.hypot(c.speakers.left.base.x - c.listener.x, c.speakers.left.base.y - c.listener.y);

  function apply() {
    if (!shown) return;
    const placement = $state.snapshot(shown);
    workspace.edit((p) => void applyCandidate(p, placement));
    ui.candidate = null;
    showNotice('success', i18n.t('suggest.applied'));
  }
</script>

<section class="suggest" aria-labelledby="suggest-title">
  <h2 id="suggest-title">{i18n.t('suggest.title')}</h2>

  <div class="options">
    <div class="seg" role="radiogroup" aria-label={i18n.t('suggest.move.label')}>
      {#each ['both', 'speakers', 'seat'] as const as m (m)}
        <label>
          <input
            type="radio"
            name="moves"
            value={m}
            checked={moves === m}
            onchange={() => setMoves(m)}
          />
          <span>{i18n.t(`suggest.move.${m}`)}</span>
        </label>
      {/each}
    </div>
    <div class="seg" role="radiogroup" aria-label={i18n.t('suggest.distance.label')}>
      {#each ['room', 'near'] as const as d (d)}
        <label>
          <input
            type="radio"
            name="distance"
            value={d}
            checked={distance === d}
            onchange={() => setDistance(d)}
          />
          <span>{i18n.t(`suggest.distance.${d}`)}</span>
        </label>
      {/each}
    </div>
  </div>

  {#if !analysis.result}
    <p class="muted" role="status">{i18n.t('results.calculating')}</p>
  {:else if !ok}
    <p class="muted">{i18n.t('results.needRoom')}</p>
  {:else if project.constraints.listenerFixed && project.constraints.speakersFixed}
    <p class="muted">{i18n.t('why.allFixed')}</p>
  {:else if !shown}
    <p class="muted">{i18n.t('suggest.nothing')}</p>
  {:else}
    <dl class="answer" data-testid="suggestion">
      <div>
        <dt>{i18n.t('suggest.speakers')}</dt>
        <dd>
          {moves === 'seat'
            ? i18n.t('suggest.stay')
            : i18n.t('suggest.speakersLine', {
                front: fmt(shown.speakers.left.base.y - depth / 2),
                spacing: fmt(shown.speakers.right.base.x - shown.speakers.left.base.x),
              })}
        </dd>
      </div>
      <div>
        <dt>{i18n.t('suggest.seat')}</dt>
        <dd>
          {moves === 'speakers'
            ? i18n.t('suggest.stay')
            : i18n.t('suggest.seatLine', {
                front: fmt(shown.listener.y),
                distance: fmt(seatDistance(shown)),
              })}
        </dd>
      </div>
    </dl>
    <p class="verdict">
      {i18n.t('suggest.verdict', {
        now: i18n.t(`results.score.${scoreWord(ok.current.score)}`),
        best: i18n.t(`results.score.${scoreWord(shown.score)}`),
      })}
      <span class="visually-hidden" data-testid="score-current"
        >{i18n.t(`results.score.${scoreWord(ok.current.score)}`)}</span
      >
      <span class="visually-hidden" data-testid="score-best"
        >{i18n.t(`results.score.${scoreWord(spots[0]!.score)}`)}</span
      >
    </p>
    {#if shown.closer}<p class="note">{i18n.t('suggest.closer')}</p>{/if}
    {#if shown.compromise}<p class="note">{i18n.t('why.compromise')}</p>{/if}
    {#if !move && ui.candidate === null}<p class="muted">{i18n.t('suggest.already')}</p>{/if}

    <div class="actions">
      <button type="button" class="btn primary" onclick={apply}>{i18n.t('suggest.apply')}</button>
      {#if spots.length > 1}
        <div class="alts" role="group" aria-label={i18n.t('suggest.others')}>
          {#each spots as c, i (i)}
            <button
              type="button"
              class="alt"
              aria-pressed={(ui.candidate ?? 0) === i}
              aria-label={i18n.t('suggest.option', {
                letter: LETTERS[i]!,
                score: i18n.t(`results.score.${scoreWord(c.score)}`),
              })}
              onclick={() => (ui.candidate = i)}>{LETTERS[i]}</button
            >
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .suggest {
    display: grid;
    gap: 14px;
    padding: 18px 16px;
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .options {
    display: grid;
    gap: 8px;
  }
  .options .seg {
    display: flex;
  }
  .answer {
    display: grid;
    gap: 10px;
    margin: 0;
  }
  .answer div {
    display: grid;
    gap: 2px;
  }
  dt {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  dd {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 500;
    line-height: 1.35;
  }
  .verdict {
    font-size: var(--text-sm);
    color: var(--ink-muted);
  }
  .muted {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .note {
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--fill);
    font-size: var(--text-sm);
  }
  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .actions .primary {
    flex: 1;
  }
  .alts {
    display: flex;
    gap: 6px;
  }
  .alt {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--fill);
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .alt[aria-pressed='true'] {
    background: var(--ink);
    color: var(--surface);
  }
</style>
