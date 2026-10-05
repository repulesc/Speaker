<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { fitFrame, toPx, toWorld } from '../plan/frame';
  import { arrowDelta, startDrag } from '../plan/interaction';
  import { ASSUMED_CEILING, cabinet, moveSeat, moveSpeaker } from '../plan/placement';
  import { workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';

  const project = $derived(workspace.project);

  let width = $state(0);
  let height = $state(0);
  let svg = $state<SVGSVGElement>();

  const MARGINS = { left: 56, right: 64, top: 32, bottom: 44 };
  const locale = $derived(i18n.locale);
  const system = $derived(project.units);
  const roomL = $derived(project.room.length.value);
  const roomW = $derived(project.room.width.value);
  const roomH = $derived(project.room.height.value);
  const variant = $derived(project.variants.find((v) => v.id === project.activeVariantId));
  const known = $derived(roomL !== null && roomW !== null);

  // Placeholder 5 × 2.5 m section until the room size is known.
  const L = $derived(known && roomL !== null ? roomL : 5);
  const H = $derived(roomH ?? ASSUMED_CEILING);
  const frame = $derived(fitFrame(width, height, L, H, MARGINS));
  /** Pixel x for a distance from the front wall; pixel y for a height above the floor. */
  const px = (y: number) => toPx(frame, y, 0).x;
  const py = (z: number) => toPx(frame, 0, H - z).y;
  const fmtRoom = (m: number) => formatLength(m, system, 'room', locale);
  const fmtPos = (m: number) => formatLength(m, system, 'position', locale);

  const cab = $derived(cabinet(project));
  const axisHeight = $derived(project.speaker.acousticAxisHeight.value ?? 0.2);
  const mirrored = $derived(project.constraints.keepSymmetric);
  const speakers = $derived(
    variant && known ? (mirrored ? (['left'] as const) : (['left', 'right'] as const)) : [],
  );
  const seat = $derived(variant && known ? variant.listener : null);
  const objects = $derived(variant && known ? variant.objects : []);
  const selected = $derived(ui.selection);

  const world = (clientX: number, clientY: number) => {
    const rect = svg!.getBoundingClientRect();
    const w = toWorld(frame, clientX - rect.left, clientY - rect.top);
    return { x: w.a, y: H - w.b }; // x = distance from the front wall, y = height
  };

  function drag(
    event: PointerEvent,
    origin: { x: number; y: number },
    key: string,
    apply: (y: number, z: number) => void,
  ) {
    startDrag(event, {
      origin,
      key,
      toWorld: world,
      move: (y, z) => apply(y, z),
      edit: (change, coalesce) => workspace.edit(change, { coalesce }),
    });
  }

  function onKey(event: KeyboardEvent, key: string, move: (dy: number, dz: number) => void) {
    const delta = arrowDelta(event);
    if (!delta) return;
    event.preventDefault();
    workspace.edit(() => move(delta.dx, -delta.dy), { coalesce: `key-${key}` });
  }

  const speakerLabel = (side: 'left' | 'right') =>
    i18n.t('plan.item.speakerSide', {
      name: i18n.t(
        mirrored ? 'plan.speakers' : side === 'left' ? 'plan.speakerLeft' : 'plan.speakerRight',
      ),
      front: fmtPos(variant!.speakers[side].base.y - cab.d / 2),
      height: fmtPos(variant!.speakers[side].base.z),
      hint: i18n.t('plan.item.hintSide'),
    });
</script>

<div class="side" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0 && height > 0}
    <svg bind:this={svg} {width} {height} role="group" aria-label={i18n.t('plan.sideLabel')}>
      <defs>
        <pattern
          id="hatch-side"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" class="hatch" />
        </pattern>
      </defs>
      <rect
        class="room"
        class:placeholder={!known}
        x={px(0)}
        y={py(H)}
        width={L * frame.scale}
        height={H * frame.scale}
      />
      <line
        class="floor"
        class:active={ui.step === 'surfaces' && ui.boundary === 'floor'}
        x1={px(0)}
        y1={py(0)}
        x2={px(L)}
        y2={py(0)}
      />
      <line
        class="ceiling"
        class:active={ui.step === 'surfaces' && ui.boundary === 'ceiling'}
        x1={px(0)}
        y1={py(H)}
        x2={px(L)}
        y2={py(H)}
      />
      <line class="front" x1={px(0)} y1={py(0)} x2={px(0)} y2={py(H)} />
      <text class="label" x={px(0)} y={py(H) - 10}>{i18n.t('plan.frontWall')}</text>

      {#if known}
        <g class="dim">
          <line x1={px(0)} y1={py(0) + 22} x2={px(L)} y2={py(0) + 22} />
          <line x1={px(0)} y1={py(0) + 16} x2={px(0)} y2={py(0) + 28} />
          <line x1={px(L)} y1={py(0) + 16} x2={px(L)} y2={py(0) + 28} />
          <text x={px(L / 2)} y={py(0) + 40} text-anchor="middle">{fmtRoom(L)}</text>
          {#if roomH !== null}
            <line x1={px(L) + 22} y1={py(H)} x2={px(L) + 22} y2={py(0)} />
            <line x1={px(L) + 16} y1={py(H)} x2={px(L) + 28} y2={py(H)} />
            <line x1={px(L) + 16} y1={py(0)} x2={px(L) + 28} y2={py(0)} />
            <text
              x={px(L) + 44}
              y={py(H / 2)}
              text-anchor="middle"
              transform="rotate(90 {px(L) + 44} {py(H / 2)})">{fmtRoom(roomH)}</text
            >
          {/if}
        </g>

        {#each objects as o (o.id)}
          <rect
            class="object"
            x={px(o.position.y)}
            y={py(o.position.z + o.size.z)}
            width={o.size.y * frame.scale}
            height={o.size.z * frame.scale}
          />
          {#if o.hard}
            <rect
              x={px(o.position.y)}
              y={py(o.position.z + o.size.z)}
              width={o.size.y * frame.scale}
              height={o.size.z * frame.scale}
              fill="url(#hatch-side)"
              class="no-pointer"
            />
          {/if}
        {/each}

        {#if seat && variant}
          <line
            class="sight"
            x1={px(variant.speakers.left.base.y + cab.d / 2)}
            y1={py(variant.speakers.left.base.z + axisHeight)}
            x2={px(seat.ears.y)}
            y2={py(seat.ears.z)}
          />
        {/if}

        {#each speakers as side (side)}
          {@const s = variant!.speakers[side]}
          {@const isSelected = selected.kind === 'speaker' && selected.side === side}
          <g
            class="item"
            class:selected={isSelected}
            role="button"
            tabindex="0"
            aria-label={speakerLabel(side)}
            onfocus={() => ui.select({ kind: 'speaker', side })}
            onpointerdown={(e) => {
              ui.select({ kind: 'speaker', side });
              drag(e, { x: s.base.y, y: s.base.z }, `side-speaker-${side}`, (y, z) =>
                moveSpeaker(workspace.project, side, { y, z }),
              );
            }}
            onkeydown={(e) =>
              onKey(e, `side-speaker-${side}`, (dy, dz) =>
                moveSpeaker(
                  workspace.project,
                  side,
                  { y: s.base.y + dy, z: s.base.z + dz },
                  { grid: false },
                ),
              )}
          >
            <rect
              class="body"
              class:default={(s.certainty ?? 'estimated') === 'unknown'}
              x={px(s.base.y - cab.d / 2)}
              y={py(s.base.z + cab.h)}
              width={Math.max(8, cab.d * frame.scale)}
              height={Math.max(8, cab.h * frame.scale)}
            />
            <circle
              class="tweeter"
              cx={px(s.base.y + cab.d / 2)}
              cy={py(s.base.z + axisHeight)}
              r="2.5"
            />
          </g>
        {/each}

        {#if seat}
          <g
            class="item"
            class:selected={selected.kind === 'seat'}
            role="button"
            tabindex="0"
            aria-label={i18n.t('plan.item.seatSide', {
              front: fmtPos(seat.ears.y),
              height: fmtPos(seat.ears.z),
              hint: i18n.t('plan.item.hintSide'),
            })}
            onfocus={() => ui.select({ kind: 'seat' })}
            onpointerdown={(e) => {
              ui.select({ kind: 'seat' });
              drag(e, { x: seat.ears.y, y: seat.ears.z }, 'side-seat', (y, z) =>
                moveSeat(workspace.project, { y, z }),
              );
            }}
            onkeydown={(e) =>
              onKey(e, 'side-seat', (dy, dz) =>
                moveSeat(
                  workspace.project,
                  { y: seat.ears.y + dy, z: seat.ears.z + dz },
                  { grid: false },
                ),
              )}
          >
            <circle
              class="seat"
              class:default={seat.certainty === 'unknown'}
              cx={px(seat.ears.y)}
              cy={py(seat.ears.z)}
              r="9"
            />
          </g>
          <text class="label" x={px(seat.ears.y) + 14} y={py(seat.ears.z) + 4}
            >{fmtPos(seat.ears.z)}</text
          >
        {/if}
      {/if}
    </svg>
  {/if}
</div>

<style>
  .side {
    width: 100%;
    height: 100%;
    min-height: 120px;
  }
  svg {
    display: block;
    touch-action: none;
  }
  .room {
    fill: var(--surface);
    stroke: var(--grid);
    stroke-width: 1;
  }
  .room.placeholder {
    stroke: var(--line);
    stroke-dasharray: 6 5;
    fill: transparent;
    opacity: 0.7;
  }
  .floor,
  .ceiling {
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .front {
    stroke: var(--line);
    stroke-width: 4;
    stroke-linecap: square;
  }
  .floor.active,
  .ceiling.active {
    stroke: var(--accent);
    stroke-width: 5;
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
  .object {
    fill: var(--surface);
    stroke: var(--ink-muted);
    stroke-width: 1;
  }
  .hatch {
    stroke: var(--ink-muted);
    stroke-width: 1;
    opacity: 0.45;
  }
  .no-pointer {
    pointer-events: none;
  }
  .sight {
    stroke: var(--line);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.55;
    pointer-events: none;
  }
  .item {
    cursor: grab;
    touch-action: none;
    outline: none;
  }
  .body {
    fill: var(--surface);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .body.default,
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
  .item.selected .body,
  .item:focus-visible .body,
  .item.selected .seat,
  .item:focus-visible .seat {
    stroke: var(--accent);
    stroke-width: 3;
  }
</style>
