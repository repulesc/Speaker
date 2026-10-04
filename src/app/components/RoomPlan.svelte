<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import type { Project } from '../../engine/types';
  import { formatLength } from '../../units/format';

  let { project }: { project: Project } = $props();

  let width = $state(0);
  let height = $state(0);

  const MARGIN = { left: 64, right: 64, top: 48, bottom: 52 };
  const locale = $derived(i18n.locale);
  const system = $derived(project.units);
  const roomW = $derived(project.room.width.value);
  const roomL = $derived(project.room.length.value);
  const variant = $derived(project.variants.find((v) => v.id === project.activeVariantId));
  const known = $derived(roomW !== null && roomL !== null);

  // The drawing always shows a room; before sizes are known it is a dashed 4 × 5 m placeholder.
  const W = $derived(known && roomW !== null ? roomW : 4);
  const L = $derived(known && roomL !== null ? roomL : 5);
  const scale = $derived(
    Math.max(
      1,
      Math.min((width - MARGIN.left - MARGIN.right) / W, (height - MARGIN.top - MARGIN.bottom) / L),
    ),
  );
  const ox = $derived((width - W * scale) / 2);
  const oy = $derived(
    MARGIN.top + Math.max(0, (height - MARGIN.top - MARGIN.bottom - L * scale) / 2),
  );

  const px = (x: number) => ox + x * scale;
  const py = (y: number) => oy + y * scale;
  const fmtRoom = (m: number) => formatLength(m, system, 'room', locale);
  const fmtPos = (m: number) => formatLength(m, system, 'position', locale);

  const gridX = $derived(Array.from({ length: Math.max(0, Math.ceil(W) - 1) }, (_, i) => i + 1));
  const gridY = $derived(Array.from({ length: Math.max(0, Math.ceil(L) - 1) }, (_, i) => i + 1));

  const speakers = $derived(
    variant && known
      ? (['left', 'right'] as const).map((side) => ({
          side,
          p: variant.speakers[side],
          isDefault: (variant.speakers[side].certainty ?? 'estimated') === 'unknown',
        }))
      : [],
  );
  const seat = $derived(variant && known ? variant.listener : null);
  const sw = $derived(project.speaker.dimensions.w.value ?? 0.2);
  const sd = $derived(project.speaker.dimensions.d.value ?? 0.25);

  const summary = $derived.by(() => {
    if (!known || !variant || roomW === null || roomL === null) return i18n.t('plan.placeholder');
    const l = variant.speakers.left.base;
    const r = variant.speakers.right.base;
    const e = variant.listener.ears;
    return i18n.t('plan.summary', {
      width: fmtRoom(roomW),
      length: fmtRoom(roomL),
      spacing: fmtPos(Math.abs(r.x - l.x)),
      distance: fmtPos(Math.hypot(e.x - l.x, e.y - l.y)),
    });
  });
</script>

<div class="plan" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0 && height > 0}
    <svg {width} {height} role="img" aria-labelledby="plan-title plan-desc">
      <title id="plan-title">{i18n.t('plan.label')}</title>
      <desc id="plan-desc">{summary}</desc>

      <rect
        class="room"
        class:placeholder={!known}
        x={px(0)}
        y={py(0)}
        width={W * scale}
        height={L * scale}
      />
      {#each gridX as g (g)}
        <line class="grid" x1={px(g)} y1={py(0)} x2={px(g)} y2={py(L)} />
      {/each}
      {#each gridY as g (g)}
        <line class="grid" x1={px(0)} y1={py(g)} x2={px(W)} y2={py(g)} />
      {/each}

      <!-- Front wall: the wall the speakers face away from. -->
      <line class="front" x1={px(0)} y1={py(0)} x2={px(W)} y2={py(0)} />
      <text class="label" x={px(W / 2)} y={py(0) - 10} text-anchor="middle">
        {i18n.t('plan.frontWall')}
      </text>

      {#if known}
        <!-- Dimension lines -->
        <g class="dim">
          <line x1={px(0)} y1={py(L) + 22} x2={px(W)} y2={py(L) + 22} />
          <line x1={px(0)} y1={py(L) + 16} x2={px(0)} y2={py(L) + 28} />
          <line x1={px(W)} y1={py(L) + 16} x2={px(W)} y2={py(L) + 28} />
          <text x={px(W / 2)} y={py(L) + 42} text-anchor="middle">{fmtRoom(W)}</text>
          <line x1={px(W) + 22} y1={py(0)} x2={px(W) + 22} y2={py(L)} />
          <line x1={px(W) + 16} y1={py(0)} x2={px(W) + 28} y2={py(0)} />
          <line x1={px(W) + 16} y1={py(L)} x2={px(W) + 28} y2={py(L)} />
          <text
            x={px(W) + 44}
            y={py(L / 2)}
            text-anchor="middle"
            transform="rotate(90 {px(W) + 44} {py(L / 2)})">{fmtRoom(L)}</text
          >
        </g>

        {#if seat && speakers.length === 2}
          {@const [a, b] = speakers}
          <polyline
            class="triangle"
            points="{px(a!.p.base.x)},{py(a!.p.base.y + sd / 2)} {px(seat.ears.x)},{py(
              seat.ears.y,
            )} {px(b!.p.base.x)},{py(b!.p.base.y + sd / 2)}"
          />
        {/if}

        {#each speakers as s (s.side)}
          <rect
            class="speaker"
            class:default={s.isDefault}
            x={px(s.p.base.x - sw / 2)}
            y={py(s.p.base.y - sd / 2)}
            width={Math.max(8, sw * scale)}
            height={Math.max(8, sd * scale)}
          />
          <circle class="tweeter" cx={px(s.p.base.x)} cy={py(s.p.base.y + sd / 2)} r="2.5" />
        {/each}

        {#if seat}
          <circle
            class="seat"
            class:default={seat.certainty === 'unknown'}
            cx={px(seat.ears.x)}
            cy={py(seat.ears.y)}
            r="8"
          />
        {/if}
      {/if}
    </svg>
    {#if !known}
      <p class="placeholder-text">{i18n.t('plan.placeholder')}</p>
    {/if}
  {/if}
</div>

<style>
  .plan {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 200px;
  }
  svg {
    display: block;
  }
  .room {
    fill: var(--surface);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .room.placeholder {
    stroke-dasharray: 6 5;
    fill: transparent;
    opacity: 0.7;
  }
  .grid {
    stroke: var(--grid);
    stroke-width: 1;
  }
  .front {
    stroke: var(--line);
    stroke-width: 4;
    stroke-linecap: square;
  }
  .label,
  .dim text {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .dim line {
    stroke: var(--ink-muted);
    stroke-width: 0.75;
  }
  .triangle {
    fill: none;
    stroke: var(--line);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.55;
  }
  .speaker {
    fill: var(--surface);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .speaker.default,
  .seat.default {
    stroke-dasharray: 3 3;
  }
  .tweeter {
    fill: var(--line);
  }
  .seat {
    fill: var(--surface);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .placeholder-text {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    text-align: center;
    color: var(--ink-muted);
    font-size: 15px;
    pointer-events: none;
  }
</style>
