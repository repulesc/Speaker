<script lang="ts">
  import type { Placement } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { adviceText, findingText } from '../findings/text';
  import { visibleAdvice } from '../findings/visible';
  import { activeVariant, cabinet, roomSize } from '../plan/placement';
  import { tapeMeasure } from '../print/tape';
  import { analysis, projectLabel, variantLabel, workspace } from '../session.svelte';

  /** A tape-measure sheet for the printer: shown only when printing (docs/UI_SPEC.md §10). */
  const project = $derived(workspace.project);
  const system = $derived(project.units);
  const room = $derived(roomSize(project));
  const result = $derived(analysis.result?.status === 'ok' ? analysis.result : null);
  const variant = $derived(activeVariant(project));
  const cab = $derived(cabinet(project));

  const now = $derived<Placement>({ speakers: variant.speakers, listener: variant.listener.ears });
  const best = $derived<Placement | null>(result?.candidates[0] ?? null);
  const setups = $derived(
    [
      { title: i18n.t('print.now', { setup: variantLabel(variant.name) }), placement: now },
      ...(best ? [{ title: i18n.t('print.best'), placement: best }] : []),
    ].filter(() => room !== null),
  );

  const fmt = (m: number) => formatLength(m, system, 'position', i18n.locale);
  const problems = $derived(
    result?.findings.filter((f) => f.severity === 'red-flag' || f.severity === 'caution') ?? [],
  );
  const advice = $derived(
    visibleAdvice(result?.advice.treatment ?? [], project.constraints.treatmentReady).slice(0, 3),
  );
  const date = $derived(
    new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'long' }).format(new Date()),
  );

  // The sketch: the room from above, speakers as boxes, seat as a circle.
  const SCALE = 60;
  const sketch = (p: Placement) => ({
    boxes: [p.speakers.left, p.speakers.right].map((s) => ({
      x: (s.base.x - cab.w / 2) * SCALE,
      y: (s.base.y - cab.d / 2) * SCALE,
      w: cab.w * SCALE,
      h: cab.d * SCALE,
    })),
    seat: { x: p.listener.x * SCALE, y: p.listener.y * SCALE },
  });
</script>

{#if room}
  <article class="print-sheet" aria-hidden="true">
    <header>
      <h1>{projectLabel(project.name)}</h1>
      <p>
        {date} · {i18n.t('print.room', {
          width: fmt(room.W),
          length: fmt(room.L),
          height: fmt(room.H),
        })}
      </p>
    </header>

    {#each setups as s (s.title)}
      {@const t = tapeMeasure(project, room.W, s.placement)}
      {@const d = sketch(s.placement)}
      <section>
        <h2>{s.title}</h2>
        <div class="row">
          <svg
            viewBox="-4 -4 {room.W * SCALE + 8} {room.L * SCALE + 8}"
            width={room.W * SCALE}
            height={room.L * SCALE}
          >
            <rect x="0" y="0" width={room.W * SCALE} height={room.L * SCALE} class="room" />
            <line x1="0" y1="0" x2={room.W * SCALE} y2="0" class="front" />
            {#each d.boxes as b, i (i)}
              <rect x={b.x} y={b.y} width={b.w} height={b.h} class="box" />
            {/each}
            <circle cx={d.seat.x} cy={d.seat.y} r="6" class="seat" />
            <text x="4" y="14" class="label">{i18n.t('print.frontWall')}</text>
          </svg>
          <ul>
            {#each [['left', t.left], ['right', t.right]] as const as [side, m] (side)}
              <li>
                {i18n.t('print.speaker', {
                  side: i18n.t(`words.speaker.${side}`),
                  front: fmt(m.front),
                  sideWall: fmt(m.sideWall),
                  wall: i18n.t(`print.wall.${side}`),
                  height: fmt(m.height),
                  toeIn: m.toeInDeg,
                })}
              </li>
            {/each}
            <li>
              {i18n.t('print.seat', {
                front: fmt(t.seat.front),
                left: fmt(t.seat.fromLeft),
                ears: fmt(t.seat.ears),
              })}
            </li>
            <li>
              {i18n.t('print.between', {
                between: fmt(t.between),
                left: fmt(t.toSeat.left),
                right: fmt(t.toSeat.right),
              })}
            </li>
          </ul>
        </div>
      </section>
    {/each}

    {#if advice.length > 0}
      <section>
        <h2>{i18n.t('treat.roomTitle')}</h2>
        <ol>
          {#each advice as a (a.messageKey + String(a.params.speaker) + String(a.params.boundary))}
            <li>{adviceText(a, system)}</li>
          {/each}
        </ol>
      </section>
    {/if}

    {#if problems.length > 0}
      <section>
        <h2>{i18n.t('why.problems')}</h2>
        <ul>
          {#each problems as f (f.messageKey + String(f.params.speaker) + String(f.params.boundary) + String(f.params.object))}
            <li>{findingText(f, system)}</li>
          {/each}
        </ul>
      </section>
    {/if}

    <footer>{i18n.t('print.footer')}</footer>
  </article>
{/if}

<style>
  .print-sheet {
    display: none;
  }
  @media print {
    .print-sheet {
      display: block;
      color: #000;
      background: #fff;
      font-size: 11pt;
      line-height: 1.45;
    }
    h1 {
      font-size: 20pt;
    }
    h2 {
      margin: 14pt 0 6pt;
      font-size: 13pt;
    }
    .row {
      display: flex;
      gap: 16pt;
      align-items: flex-start;
    }
    section {
      break-inside: avoid;
    }
    .room {
      fill: none;
      stroke: #000;
      stroke-width: 1.5;
    }
    .front {
      stroke: #000;
      stroke-width: 4;
    }
    .box {
      fill: #ccc;
      stroke: #000;
    }
    .seat {
      fill: #000;
    }
    .label {
      font-size: 9px;
    }
    ul,
    ol {
      margin: 0;
      padding-left: 16pt;
    }
    li {
      margin-bottom: 4pt;
    }
    footer {
      margin-top: 16pt;
      font-size: 9pt;
    }
  }
</style>
