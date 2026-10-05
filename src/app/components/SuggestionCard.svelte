<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatFrequency, formatLength } from '../../units/format';
  import { scoreWord } from '../findings/text';
  import { applyCandidate, cabinet } from '../plan/placement';
  import { analysis, showNotice, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';

  /**
   * The app's answer, first: where the speakers and the seat should go. One title, two lines of
   * numbers, a word on the bass, one button (docs/DESIGN_BRIEF_V3.md, items 2 and 7). The two
   * choices that shape the answer sit behind "Options".
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
  let optionsOpen = $state(false);

  const seatDistance = (c: NonNullable<typeof shown>) =>
    Math.hypot(c.speakers.left.base.x - c.listener.x, c.speakers.left.base.y - c.listener.y);

  function apply() {
    if (!shown) return;
    const placement = $state.snapshot(shown);
    workspace.edit((p) => void applyCandidate(p, placement));
    ui.candidate = null;
    showNotice('success', i18n.t('suggest.applied'));
  }

  // ── Bass at the suggested spot: a word and a small curve ────────────────────
  let curve = $state<{ f: number[]; dB: number[] } | null>(null);
  let ticket = 0;
  $effect(() => {
    const c = shown ? $state.snapshot(shown) : null;
    const project = $state.snapshot(workspace.project);
    const mine = ++ticket;
    if (!c) return void (curve = null);
    void analysis
      .ask(project, {
        kind: 'explain',
        seat: { x: c.listener.x, y: c.listener.y },
        speakers: c.speakers,
      })
      .then((r) => {
        if (mine === ticket)
          curve = r && 'explanation' in r ? (r.explanation?.bassResponse ?? null) : null;
      });
  });

  /** Spread of the bass inside the judged band, and its worst point. Words only, no numbers. */
  const bass = $derived.by(() => {
    if (!curve || !ok || !ok.bassBand.scored) return null;
    const [lo, hi] = ok.bassBand.range;
    const points = curve.f
      .map((f, i) => ({ f, db: curve!.dB[i]! }))
      .filter((p) => p.f >= lo && p.f <= hi);
    if (points.length < 3) return null;
    const mean = points.reduce((s, p) => s + p.db, 0) / points.length;
    const sigma = Math.sqrt(points.reduce((s, p) => s + (p.db - mean) ** 2, 0) / points.length);
    const worst = points.reduce((w, p) => (Math.abs(p.db - mean) > Math.abs(w.db - mean) ? p : w));
    // The same bands as the bass score (C1): 2 dB is as good as it gets, 10 dB is poor.
    const word = sigma <= 3 ? 'even' : sigma <= 6 ? 'fair' : 'uneven';
    return { word, worst, points, mean };
  });

  const SPARK_W = 120;
  const SPARK_H = 28;
  const sparkPath = $derived.by(() => {
    if (!bass) return '';
    const { points } = bass;
    const fLo = Math.log(points[0]!.f);
    const fHi = Math.log(points.at(-1)!.f);
    const x = (f: number) => ((Math.log(f) - fLo) / (fHi - fLo)) * SPARK_W;
    const y = (db: number) =>
      SPARK_H / 2 - Math.max(-12, Math.min(12, db - bass.mean)) * (SPARK_H / 26);
    return points
      .map((p, i) => `${i ? 'L' : 'M'}${x(p.f).toFixed(1)} ${y(p.db).toFixed(1)}`)
      .join(' ');
  });
</script>

<section class="suggest" aria-labelledby="suggest-title">
  <h2 id="suggest-title">{i18n.t('suggest.title')}</h2>

  {#if !analysis.result}
    <p class="caption" role="status">{i18n.t('results.calculating')}</p>
  {:else if !ok}
    <p class="caption">{i18n.t('results.needRoom')}</p>
  {:else if project.constraints.listenerFixed && project.constraints.speakersFixed}
    <p class="caption">{i18n.t('why.allFixed')}</p>
  {:else if !shown}
    <p class="caption">{i18n.t('suggest.nothing')}</p>
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
      {#if bass}
        <div>
          <dt>{i18n.t('suggest.bass')}</dt>
          <dd class="bass">
            <button type="button" class="spark" onclick={() => (ui.step = 'bass')}>
              <span>
                {i18n.t(`suggest.bassWord.${bass.word}`, {
                  frequency: formatFrequency(bass.worst.f, i18n.locale, true),
                })}
              </span>
              <svg width={SPARK_W} height={SPARK_H} aria-hidden="true">
                <line x1="0" x2={SPARK_W} y1={SPARK_H / 2} y2={SPARK_H / 2} class="mid" />
                <path d={sparkPath} />
              </svg>
            </button>
          </dd>
        </div>
      {/if}
    </dl>

    <p class="caption">
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
    {#if shown.zoneCost && workspace.project.constraints.speakerZone !== undefined && scoreWord(shown.zoneCost.inside) !== scoreWord(shown.zoneCost.outside)}
      <!-- What the user's speaker zone costs (owner decision, docs/DESIGN_BRIEF_V4.md). -->
      <p class="note" data-testid="zone-cost">
        {i18n.t('suggest.zoneCost', {
          zone: fmt(workspace.project.constraints.speakerZone),
          inside: i18n.t(`results.score.${scoreWord(shown.zoneCost.inside)}`),
          outside: i18n.t(`results.score.${scoreWord(shown.zoneCost.outside)}`),
        })}
      </p>
    {/if}
    {#if !move && ui.candidate === null}<p class="caption">{i18n.t('suggest.already')}</p>{/if}

    <div class="actions">
      <button type="button" class="btn primary" onclick={apply}>{i18n.t('suggest.apply')}</button>
      {#if spots.length > 1}
        <div class="seg alts" role="radiogroup" aria-label={i18n.t('suggest.others')}>
          {#each spots as c, i (i)}
            <label>
              <input
                type="radio"
                name="option"
                checked={(ui.candidate ?? 0) === i}
                aria-label={i18n.t('suggest.option', {
                  letter: LETTERS[i]!,
                  score: i18n.t(`results.score.${scoreWord(c.score)}`),
                })}
                onchange={() => (ui.candidate = i)}
              />
              <span aria-hidden="true">{LETTERS[i]}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <div class="options">
    <button
      type="button"
      class="options-toggle"
      aria-expanded={optionsOpen}
      onclick={() => (optionsOpen = !optionsOpen)}
    >
      <span>{i18n.t('suggest.optionsTitle')}</span>
      <span class="value">
        {i18n.t(`suggest.move.${moves}`)} · {i18n.t(`suggest.distance.${distance}`)}
      </span>
      <span class="chevron" class:open={optionsOpen} aria-hidden="true">›</span>
    </button>
    {#if optionsOpen}
      <div class="option-rows">
        <div class="option">
          <span class="caption" id="opt-move">{i18n.t('suggest.move.label')}</span>
          <div class="seg" role="radiogroup" aria-labelledby="opt-move">
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
        </div>
        <div class="option">
          <span class="caption" id="opt-distance">{i18n.t('suggest.distance.label')}</span>
          <div class="seg" role="radiogroup" aria-labelledby="opt-distance">
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
      </div>
    {/if}
  </div>
</section>

<style>
  .suggest {
    display: grid;
    gap: 16px;
    padding: 20px 16px 8px;
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .answer {
    display: grid;
    gap: 12px;
    margin: 0;
  }
  .answer div {
    display: grid;
    gap: 2px;
  }
  dt,
  .caption {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  dd {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
    line-height: 1.4;
  }
  .spark {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    margin: -8px 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .spark svg {
    flex: none;
  }
  .spark path {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  .spark .mid {
    stroke: var(--grid-strong);
    stroke-dasharray: 2 3;
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
    gap: 10px;
  }
  .actions .primary {
    flex: 1;
  }
  .alts label {
    min-width: 40px;
    padding: 0 10px;
  }
  .options {
    margin: 0 -16px;
    border-top: 1px solid var(--grid);
  }
  .options-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .options-toggle .value {
    margin-inline-start: auto;
    color: var(--ink-muted);
  }
  .chevron {
    color: var(--ink-muted);
    transition: transform 150ms ease;
  }
  .chevron.open {
    transform: rotate(90deg);
  }
  .option-rows {
    display: grid;
    gap: 12px;
    padding: 4px 16px 16px;
  }
  .option {
    display: grid;
    gap: 6px;
  }
  .option .seg {
    display: flex;
  }
</style>
