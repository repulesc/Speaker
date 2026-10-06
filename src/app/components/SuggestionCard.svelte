<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatFrequency, formatLength } from '../../units/format';
  import type { Advice } from '../../engine/types';
  import { advicePlainText, adviceText, scoreNumber, scoreWord } from '../findings/text';
  import { prefs } from '../prefs.svelte';
  import { roomFound } from '../findings/roomFacts';
  import { visibleAdvice } from '../findings/visible';
  import { applyCandidate, cabinet } from '../plan/placement';
  import { analysis, showNotice, workspace } from '../session.svelte';
  import { goalOf, type Goal } from '../state/goal';
  import MoodFace from './MoodFace.svelte';
  import PlacementOptions from './PlacementOptions.svelte';
  import { ui } from '../ui.svelte';

  /**
   * The result, first and on its own (owner decision, docs/ROADMAP_V5.md): how the setup does now
   * in one line, then at most two things to try, the placement (with Apply) and up to two other
   * ideas (the room, the tone), then the ways to learn more. It only proposes; nothing here is a setting.
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

  const moves = $derived<Goal>(goalOf(project));
  const allFixed = $derived(project.constraints.listenerFixed && project.constraints.speakersFixed);

  /** The brief: how the setup does now, and what the placement would make of it. */
  const brief = $derived.by(() => {
    if (!ok) return '';
    const now = i18n.t(`results.score.${scoreWord(ok.current.score)}`);
    if (allFixed) return i18n.t('result.brief.fixed', { now });
    const best = spots[0];
    if (!best || !move) return i18n.t('result.brief.top', { now });
    const bestWord = i18n.t(`results.score.${scoreWord(best.score)}`);
    return bestWord === now
      ? i18n.t('result.brief.same', { now })
      : i18n.t('result.brief.better', { now, best: bestWord });
  });

  /** With a sofa, desk or bed: whether the whole area does as well as its middle. */
  const areaLine = $derived.by(() => {
    const area = ok?.area;
    if (!area) return '';
    const word = (score: number) => i18n.t(`results.score.${scoreWord(score)}`);
    const centre = area.spots.find((s) => s.where === 'centre')!;
    const worst = area.spots.reduce((w, s) => (s.score < w.score ? s : w), centre);
    if (word(worst.score) === word(centre.score)) return i18n.t(`result.area.even.${area.kind}`);
    // A sofa in the middle of the room is the same at both ends: say so, not "the left end".
    const ends = area.spots.filter((s) => s.where === 'left' || s.where === 'right');
    const both =
      (worst.where === 'left' || worst.where === 'right') &&
      ends.length === 2 &&
      ends.every((s) => word(s.score) === word(worst.score));
    return i18n.t('result.area.uneven', {
      centre: word(centre.score),
      where: i18n.t(`result.area.where.${both ? 'ends' : worst.where}`),
      worst: word(worst.score),
    });
  });

  /**
   * One other idea at most (owner feedback after V6: the result repeated the Tips tab): the most
   * useful change to the room, else one about tone (D02, D03, D07). The rest lives on Tips.
   */
  const TONE = new Set(['D02', 'D03', 'D07']);
  const treatment = $derived(
    visibleAdvice(ok?.advice.treatment ?? [], project.constraints.treatmentReady),
  );
  const picks = $derived.by<Advice[]>(() => {
    if (!ok) return [];
    const { settings } = ok.advice;
    const other = treatment[0] ?? settings.find((a) => !TONE.has(a.ruleId));
    const tone = settings.find((a) => TONE.has(a.ruleId));
    return [other ?? tone].filter((a): a is Advice => a !== undefined);
  });

  /**
   * The answer as one plain sentence: what to change, relative to the setup now (owner decision,
   * docs/DESIGN_BRIEF_V4.md). Moves under 2 cm are left out; the numbers below stay exact.
   */
  const SAY_MIN = 0.02;
  const sentence = $derived.by(() => {
    if (!shown) return [];
    const now = project.variants.find((v) => v.id === project.activeVariantId)!;
    const lines: string[] = [];
    const parts: string[] = [];
    if (moves !== 'seat') {
      const front = shown.speakers.left.base.y - now.speakers.left.base.y;
      const spread =
        shown.speakers.right.base.x -
        shown.speakers.left.base.x -
        (now.speakers.right.base.x - now.speakers.left.base.x);
      if (Math.abs(front) >= SAY_MIN)
        parts.push(
          i18n.t(front > 0 ? 'suggest.say.away' : 'suggest.say.toward', {
            d: fmt(Math.abs(front)),
          }),
        );
      if (Math.abs(spread) >= SAY_MIN)
        parts.push(
          i18n.t(spread > 0 ? 'suggest.say.apart' : 'suggest.say.together', {
            d: fmt(Math.abs(spread)),
          }),
        );
      if (parts.length)
        lines.push(
          i18n.t('suggest.say.speakers', { parts: parts.join(i18n.t('suggest.say.and')) }),
        );
    }
    if (moves !== 'speakers') {
      const back = shown.listener.y - now.listener.ears.y;
      if (Math.abs(back) >= SAY_MIN)
        lines.push(
          i18n.t(back > 0 ? 'suggest.say.seatBack' : 'suggest.say.seatForward', {
            d: fmt(Math.abs(back)),
          }),
        );
    }
    return lines.length && move ? lines : [i18n.t('suggest.already')];
  });

  const seatDistance = (c: NonNullable<typeof shown>) =>
    Math.hypot(c.speakers.left.base.x - c.listener.x, c.speakers.left.base.y - c.listener.y);

  function apply() {
    if (!shown) return;
    const placement = $state.snapshot(shown);
    const now = $state.snapshot(project.variants.find((v) => v.id === project.activeVariantId)!);
    ui.showChange({ speakers: now.speakers, listener: now.listener.ears });
    workspace.edit((p) => void applyCandidate(p, placement));
    ui.candidate = null;
    showNotice('success', i18n.t('suggest.applied'), { undo: true });
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

<div class="result">
  <!-- The question that shapes the answer comes first: what may move. -->
  <PlacementOptions parts={['moves']} plain />

  <section class="verdict" aria-labelledby="result-title">
    <h2 id="result-title" class="visually-hidden">{i18n.t('result.title')}</h2>
    {#if !analysis.result}
      <p class="caption" role="status">{i18n.t('results.calculating')}</p>
    {:else if !ok}
      <p class="caption">{i18n.t('results.needRoom')}</p>
    {:else}
      <div class="headline">
        <p class="brief" data-share="verdict" data-testid="brief">{brief}</p>
        <MoodFace
          word={scoreWord(ok.current.score)}
          label={i18n.t('suggest.mood', {
            word: i18n.t(`results.score.${scoreWord(ok.current.score)}`),
          })}
        />
        {#if analysis.busy}<span
            class="spinner"
            role="status"
            aria-label={i18n.t('analysis.updating')}
          ></span>{/if}
      </div>

      {#if areaLine}<p class="caption" data-testid="area">{areaLine}</p>{/if}
      {#if prefs.numbers}
        <p class="caption" data-testid="score-numbers">
          {i18n.t('result.scores', {
            now: scoreNumber(ok.current.score, i18n.locale),
            best: scoreNumber(Math.max(ok.current.score, spots[0]?.score ?? 0), i18n.locale),
          })}
        </p>
      {/if}
      <span class="visually-hidden" data-testid="score-current"
        >{i18n.t(`results.score.${scoreWord(ok.current.score)}`)}</span
      >
      {#if spots[0]}
        <span class="visually-hidden" data-testid="score-best"
          >{i18n.t(`results.score.${scoreWord(spots[0].score)}`)}</span
        >
      {/if}
    {/if}
  </section>

  {#if ok}
    {#if allFixed}
      <p class="caption">{i18n.t('why.allFixed')}</p>
    {:else}
      <section class="answer" aria-labelledby="suggest-title">
        <h3 id="suggest-title" class="overline">{i18n.t('suggest.title')}</h3>
        {#if !shown}
          <p class="caption">{i18n.t('suggest.nothing')}</p>
        {:else}
          {#if move}<p class="say" data-testid="say">{sentence.join(' ')}</p>{/if}
          <dl class="figures" data-testid="suggestion">
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
                  ? i18n.t('suggest.seatStays')
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
                  <span>
                    {prefs.numbers
                      ? i18n.t(`suggest.bassWord.${bass.word}`, {
                          frequency: formatFrequency(bass.worst.f, i18n.locale, true),
                        })
                      : i18n.t(`suggest.bassPlain.${bass.word}`)}
                  </span>
                  <svg width={SPARK_W} height={SPARK_H} aria-hidden="true">
                    <line x1="0" x2={SPARK_W} y1={SPARK_H / 2} y2={SPARK_H / 2} class="mid" />
                    <path d={sparkPath} />
                  </svg>
                </dd>
              </div>
            {/if}
          </dl>

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

          <div class="actions">
            <button type="button" class="btn primary" onclick={apply}
              >{i18n.t('suggest.apply')}</button
            >
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
      </section>
    {/if}

    <p class="found" data-testid="found">
      <span class="overline">{i18n.t('found.label')}</span>
      {roomFound(ok, prefs.numbers)}
    </p>

    {#if picks.length}
      <section class="idea-block" aria-labelledby="idea-title" data-testid="idea">
        <h3 id="idea-title" class="overline">{i18n.t('result.idea')}</h3>
        {#each picks as idea (idea.messageKey)}
          <p class="idea">
            {prefs.numbers ? adviceText(idea, system) : advicePlainText(idea, system)}
          </p>
        {/each}
        <button type="button" class="card-link" onclick={() => (ui.tab = 'listen')}
          >{i18n.t('result.moreTips')} ›</button
        >
      </section>
    {/if}
  {/if}
</div>

<style>
  .result {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .caption,
  dt {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  /* "Best placement", "What we found": one small label style for the parts of the page. */
  .overline {
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .verdict {
    display: grid;
    gap: 8px;
  }
  .headline {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 12px;
  }
  .headline :global(.face) {
    margin-top: 4px;
  }
  .headline .spinner {
    position: absolute;
    top: -14px;
    right: 6px;
  }
  /* The verdict is the page's headline, in the serif. */
  .brief {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-display);
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  /* The answer: the one block with a frame, because it holds the one main action. */
  .answer {
    display: grid;
    gap: 12px;
    padding: 18px 18px 16px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--card-shadow);
  }
  .say {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
    line-height: 1.4;
  }
  .figures {
    display: grid;
    gap: 6px;
    margin: 0;
    padding-top: 10px;
    border-top: 1px solid var(--grid);
  }
  .figures div {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    align-items: baseline;
    gap: 8px;
  }
  dd {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.4;
  }
  /* The words first; the sparkline drops under them when they need the width. */
  .bass {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
  }
  .bass span {
    flex: 1 1 8rem;
  }
  .bass svg {
    flex: none;
  }
  .bass path {
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  .bass .mid {
    stroke: var(--grid-strong);
    stroke-dasharray: 2 3;
  }
  .note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--fill);
    font-size: var(--text-sm);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 4px;
  }
  .actions .primary {
    flex: 1;
  }
  .alts label {
    min-width: 44px;
    padding: 0 10px;
  }
  .found {
    display: grid;
    gap: 4px;
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .idea-block {
    display: grid;
    gap: 6px;
  }
  .idea {
    margin: 0;
    font-size: var(--text-md);
    line-height: 1.5;
  }
  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--grid-strong);
    border-top-color: var(--accent-fill);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 2.4s;
    }
  }
</style>
