<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatFrequency } from '../../units/format';
  import { analysis, variantLabel, workspace } from '../session.svelte';
  import { probe } from '../state/probe.svelte';
  import { setups } from '../state/setups.svelte';
  import { ui } from '../ui.svelte';

  const result = $derived(analysis.result?.status === 'ok' ? analysis.result : null);
  const LETTERS = ['A', 'B', 'C'];

  let width = $state(0);
  const HEIGHT = 150;
  const PAD = { left: 34, right: 12, top: 10, bottom: 22 };
  const DB_MIN = -15;
  const DB_MAX = 12;

  // The curve at the previewed best spot (the probe's own curve comes with its explanation).
  let spotCurve = $state<{ f: number[]; dB: number[] } | null>(null);
  let ticket = 0;
  $effect(() => {
    const c = ui.candidate === null ? null : result?.candidates[ui.candidate];
    const project = $state.snapshot(workspace.project);
    const mine = ++ticket;
    if (!c) {
      spotCurve = null;
      return;
    }
    void analysis
      .ask(project, {
        kind: 'explain',
        seat: { x: c.listener.x, y: c.listener.y },
        speakers: $state.snapshot(c.speakers),
      })
      .then((r) => {
        if (mine === ticket)
          spotCurve = r && 'explanation' in r ? (r.explanation?.bassResponse ?? null) : null;
      });
  });

  // The other setup chosen in Compare, at its own seat.
  const compared = $derived(
    ui.compareId && ui.compareId !== workspace.project.activeVariantId
      ? workspace.project.variants.find((v) => v.id === ui.compareId)
      : undefined,
  );
  const comparedCurve = $derived(compared ? (setups.views[compared.id]?.bass ?? null) : null);
  $effect(() => {
    if (compared) void setups.refresh($state.snapshot(workspace.project));
  });

  const fMin = $derived(result?.bassResponse.f[0] ?? 20);
  const fMax = $derived(result?.bassResponse.f.at(-1) ?? 300);
  const x = (f: number) =>
    PAD.left +
    ((Math.log(f) - Math.log(fMin)) / (Math.log(fMax) - Math.log(fMin))) *
      (width - PAD.left - PAD.right);
  const y = (db: number) =>
    PAD.top +
    ((DB_MAX - Math.max(DB_MIN, Math.min(DB_MAX, db))) / (DB_MAX - DB_MIN)) *
      (HEIGHT - PAD.top - PAD.bottom);

  const path = (curve: { f: number[]; dB: number[] }) =>
    curve.f
      .map((f, i) => `${i ? 'L' : 'M'}${x(f).toFixed(1)} ${y(curve.dB[i]!).toFixed(1)}`)
      .join(' ');

  const modes = $derived(
    result
      ? result.modes.filter((m) => m.type === 'axial' && m.f >= fMin && m.f <= fMax).slice(0, 6)
      : [],
  );
  const band = $derived(result?.bassBand);
  const ticks = [20, 30, 50, 80, 120, 200];

  /** Strongest and weakest frequency inside the judged range, for the text description. */
  const summary = $derived.by(() => {
    if (!result || !result.bassBand.scored) return null;
    const [lo, hi] = result.bassBand.range;
    let peak = { f: 0, db: -Infinity };
    let dip = { f: 0, db: Infinity };
    result.bassResponse.f.forEach((f, i) => {
      if (f < lo || f > hi) return;
      const db = result.bassResponse.dB[i]!;
      if (db > peak.db) peak = { f, db };
      if (db < dip.db) dip = { f, db };
    });
    return i18n.t('chart.desc', {
      from: formatFrequency(lo, i18n.locale, true),
      to: formatFrequency(hi, i18n.locale, true),
      peak: formatFrequency(peak.f, i18n.locale, true),
      dip: formatFrequency(dip.f, i18n.locale, true),
    });
  });
</script>

<section class="chart" aria-labelledby="chart-title">
  <header>
    <h3 id="chart-title">
      <span class="visually-hidden">{i18n.t('chart.title')}: </span>
      <span class="sub">{i18n.t('chart.sub')}</span>
    </h3>
    <ul class="legend">
      <li><i class="now"></i>{i18n.t('chart.now')}</li>
      {#if ui.candidate !== null && spotCurve}
        <li><i class="spot"></i>{i18n.t('chart.spot', { letter: LETTERS[ui.candidate]! })}</li>
      {/if}
      {#if compared && comparedCurve}
        <li>
          <i class="other"></i>{i18n.t('compare.legend', { name: variantLabel(compared.name) })}
        </li>
      {/if}
      {#if probe.explanation}
        <li><i class="probe"></i>{i18n.t('probe.title', { front: '…' }).split('·')[0]}</li>
      {/if}
    </ul>
  </header>
  <div class="plot" bind:clientWidth={width}>
    {#if !result}
      <p class="empty">{i18n.t('chart.noData')}</p>
    {:else if width > 0}
      <svg {width} height={HEIGHT} role="img" aria-label={summary ?? i18n.t('chart.title')}>
        {#each [-10, 0, 10] as db (db)}
          <line class="grid" x1={PAD.left} x2={width - PAD.right} y1={y(db)} y2={y(db)} />
          <text class="axis" x={PAD.left - 6} y={y(db) + 3.5} text-anchor="end"
            >{db > 0 ? '+' : ''}{db}</text
          >
        {/each}
        {#if band?.scored}
          <rect
            class="band"
            x={x(band.range[0])}
            y={PAD.top}
            width={x(band.range[1]) - x(band.range[0])}
            height={HEIGHT - PAD.top - PAD.bottom}
          />
        {/if}
        {#each modes as m (m.n.join(''))}
          <line class="mode" x1={x(m.f)} x2={x(m.f)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
        {/each}
        {#each ticks.filter((t) => t >= fMin && t <= fMax) as t (t)}
          <text class="axis" x={x(t)} y={HEIGHT - 6} text-anchor="middle">{t}</text>
        {/each}
        <text class="axis" x={width - PAD.right} y={HEIGHT - 6} text-anchor="end">Hz</text>
        {#if probe.explanation}
          <path class="line probe" d={path(probe.explanation.bassResponse)} />
        {/if}
        {#if comparedCurve}<path class="line other" d={path(comparedCurve)} />{/if}
        {#if spotCurve}<path class="line spot" d={path(spotCurve)} />{/if}
        <path class="line now" d={path(result.bassResponse)} />
      </svg>
    {/if}
  </div>
</section>

<style>
  .chart {
    padding: 12px 12px 6px;
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px 16px;
  }
  h3 {
    font-size: var(--text-sm);
  }
  .sub {
    font-weight: 400;
    color: var(--ink-muted);
  }
  .legend {
    display: flex;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .legend i {
    display: inline-block;
    width: 14px;
    height: 3px;
    margin-right: 6px;
    vertical-align: middle;
  }
  i.now,
  .line.now {
    background: var(--ink);
    stroke: var(--ink);
  }
  i.spot,
  .line.spot {
    background: var(--heat-4);
    stroke: var(--heat-4);
  }
  i.other,
  .line.other {
    background: var(--ink-muted);
    stroke: var(--ink-muted);
  }
  .line.other {
    stroke-dasharray: 6 4;
  }
  i.probe,
  .line.probe {
    background: var(--accent);
    stroke: var(--accent);
  }
  .plot {
    min-height: 150px;
  }
  svg {
    display: block;
  }
  .line {
    fill: none;
    stroke-width: 2;
  }
  .line.probe {
    stroke-dasharray: 5 3;
  }
  .grid {
    stroke: var(--grid);
  }
  .mode {
    stroke: var(--grid-strong);
    stroke-dasharray: 2 3;
  }
  .band {
    fill: var(--accent);
    opacity: 0.07;
  }
  .axis {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 10px;
  }
  .empty {
    padding: 48px 0;
    text-align: center;
    color: var(--ink-muted);
  }
</style>
