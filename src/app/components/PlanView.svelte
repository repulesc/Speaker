<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { fitFrame, toPx, toWorld } from '../plan/frame';
  import { cabinet, moveObject, moveSeat, moveSpeaker } from '../plan/placement';
  import { analysis, workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import { arrowDelta, startDrag } from '../plan/interaction';

  const project = $derived(workspace.project);

  let width = $state(0);
  let height = $state(0);
  let svg = $state<SVGSVGElement>();

  const MARGINS = { left: 64, right: 64, top: 48, bottom: 52 };
  const locale = $derived(i18n.locale);
  const system = $derived(project.units);
  const roomW = $derived(project.room.width.value);
  const roomL = $derived(project.room.length.value);
  const variant = $derived(project.variants.find((v) => v.id === project.activeVariantId));
  const known = $derived(roomW !== null && roomL !== null);

  // The drawing always shows a room; before sizes are known it is a dashed 4 × 5 m placeholder.
  const W = $derived(known && roomW !== null ? roomW : 4);
  const L = $derived(known && roomL !== null ? roomL : 5);
  const frame = $derived(fitFrame(width, height, W, L, MARGINS));
  const px = (x: number) => toPx(frame, x, 0).x;
  const py = (y: number) => toPx(frame, 0, y).y;
  const fmtRoom = (m: number) => formatLength(m, system, 'room', locale);
  const fmtPos = (m: number) => formatLength(m, system, 'position', locale);

  const gridX = $derived(Array.from({ length: Math.max(0, Math.ceil(W) - 1) }, (_, i) => i + 1));
  const gridY = $derived(Array.from({ length: Math.max(0, Math.ceil(L) - 1) }, (_, i) => i + 1));

  const cab = $derived(cabinet(project));
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
  const objects = $derived(variant && known ? variant.objects : []);
  const reflectionRings = $derived(
    ui.step === 'surfaces' && analysis.result?.status === 'ok'
      ? analysis.result.findings.filter((f) => f.ruleId === 'P06' && f.location)
      : [],
  );

  const selected = $derived(ui.selection);

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

  // ── Interaction ──────────────────────────────────────────────────────────

  const world = (clientX: number, clientY: number) => {
    const rect = svg!.getBoundingClientRect();
    return toWorld(frame, clientX - rect.left, clientY - rect.top);
  };

  function drag(
    event: PointerEvent,
    origin: { x: number; y: number },
    key: string,
    apply: (x: number, y: number) => void,
  ) {
    startDrag(event, {
      origin,
      key,
      toWorld: (cx, cy) => {
        const w = world(cx, cy);
        return { x: w.a, y: w.b };
      },
      move: (x, y) => apply(x, y),
      edit: (change, coalesce) => workspace.edit(change, { coalesce }),
    });
  }

  function onKey(event: KeyboardEvent, key: string, move: (dx: number, dy: number) => void) {
    const delta = arrowDelta(event);
    if (!delta) return;
    event.preventDefault();
    workspace.edit(() => move(delta.dx, delta.dy), { coalesce: `key-${key}` });
  }

  const speakerName = (side: 'left' | 'right') =>
    i18n.t(side === 'left' ? 'plan.speakerLeft' : 'plan.speakerRight');
  const objectName = (kind: string, label?: string) => label || i18n.t(`object.${kind}`);

  function speakerLabel(side: 'left' | 'right') {
    const b = variant!.speakers[side].base;
    return i18n.t('plan.item.speaker', {
      name: speakerName(side),
      front: fmtPos(b.y - cab.d / 2),
      side: fmtPos(Math.min(b.x, W - b.x)),
      hint: i18n.t('plan.item.hint'),
    });
  }

  const seatLabel = $derived(
    seat
      ? i18n.t('plan.item.seat', {
          front: fmtPos(seat.ears.y),
          height: fmtPos(seat.ears.z),
          hint: i18n.t('plan.item.hint'),
        })
      : '',
  );
</script>

<div class="plan" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0 && height > 0}
    <svg bind:this={svg} {width} {height} role="group" aria-labelledby="plan-title plan-desc">
      <title id="plan-title">{i18n.t('plan.label')}</title>
      <desc id="plan-desc">{summary}</desc>
      <defs>
        <pattern
          id="hatch-plan"
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
        y={py(0)}
        width={W * frame.scale}
        height={L * frame.scale}
      />
      {#each gridX as g (g)}
        <line class="grid" x1={px(g)} y1={py(0)} x2={px(g)} y2={py(L)} />
      {/each}
      {#each gridY as g (g)}
        <line class="grid" x1={px(0)} y1={py(g)} x2={px(W)} y2={py(g)} />
      {/each}

      <!-- Walls: the selected one (Surfaces step) is highlighted. -->
      <line
        class="wall"
        class:active={ui.step === 'surfaces' && ui.boundary === 'left'}
        x1={px(0)}
        y1={py(0)}
        x2={px(0)}
        y2={py(L)}
      />
      <line
        class="wall"
        class:active={ui.step === 'surfaces' && ui.boundary === 'right'}
        x1={px(W)}
        y1={py(0)}
        x2={px(W)}
        y2={py(L)}
      />
      <line
        class="wall"
        class:active={ui.step === 'surfaces' && ui.boundary === 'back'}
        x1={px(0)}
        y1={py(L)}
        x2={px(W)}
        y2={py(L)}
      />
      <line
        class="front"
        class:active={ui.step === 'surfaces' && ui.boundary === 'front'}
        x1={px(0)}
        y1={py(0)}
        x2={px(W)}
        y2={py(0)}
      />
      <text class="label" x={px(W / 2)} y={py(0) - 10} text-anchor="middle"
        >{i18n.t('plan.frontWall')}</text
      >

      {#if known}
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

        {#each objects as o (o.id)}
          {@const isSelected = selected.kind === 'object' && selected.id === o.id}
          <g
            class="item object"
            class:selected={isSelected}
            role="button"
            tabindex="0"
            aria-label={i18n.t('plan.item.object', {
              name: objectName(o.kind, o.label),
              hint: i18n.t('plan.item.hint'),
            })}
            onfocus={() => ui.select({ kind: 'object', id: o.id })}
            onpointerdown={(e) => {
              ui.select({ kind: 'object', id: o.id });
              drag(
                e,
                { x: o.position.x, y: o.position.y },
                `object-${o.id}`,
                (x, y) => workspace.project && moveObject(workspace.project, o.id, { x, y }),
              );
            }}
            onkeydown={(e) =>
              onKey(e, `object-${o.id}`, (dx, dy) =>
                moveObject(
                  workspace.project,
                  o.id,
                  { x: o.position.x + dx, y: o.position.y + dy },
                  { grid: false },
                ),
              )}
          >
            <rect
              x={px(o.position.x)}
              y={py(o.position.y)}
              width={o.size.x * frame.scale}
              height={o.size.y * frame.scale}
              class="body"
            />
            {#if o.hard}
              <rect
                x={px(o.position.x)}
                y={py(o.position.y)}
                width={o.size.x * frame.scale}
                height={o.size.y * frame.scale}
                fill="url(#hatch-plan)"
                class="no-pointer"
              />
            {/if}
            {#if o.size.x * frame.scale > 56 && o.size.y * frame.scale > 20}
              <text
                class="item-label"
                x={px(o.position.x + o.size.x / 2)}
                y={py(o.position.y + o.size.y / 2) + 4}
                text-anchor="middle">{objectName(o.kind, o.label)}</text
              >
            {/if}
          </g>
        {/each}

        {#if seat && speakers.length === 2}
          {@const [a, b] = speakers}
          <polyline
            class="triangle"
            points="{px(a!.p.base.x)},{py(a!.p.base.y + cab.d / 2)} {px(seat.ears.x)},{py(
              seat.ears.y,
            )} {px(b!.p.base.x)},{py(b!.p.base.y + cab.d / 2)}"
          />
        {/if}

        {#each reflectionRings as f (f.messageKey + String(f.params.speaker) + String(f.params.boundary))}
          <circle class="ring" cx={px(f.location!.x)} cy={py(f.location!.y)} r="9" />
        {/each}

        {#each speakers as s (s.side)}
          {@const isSelected = selected.kind === 'speaker' && selected.side === s.side}
          {@const angle = (s.side === 'left' ? -1 : 1) * s.p.toeInDeg}
          {@const cx = px(s.p.base.x)}
          {@const cy = py(s.p.base.y)}
          <g
            class="item speaker"
            class:selected={isSelected}
            class:locked={project.constraints.speakersFixed}
            role="button"
            tabindex="0"
            aria-disabled={project.constraints.speakersFixed || undefined}
            aria-label={speakerLabel(s.side)}
            onfocus={() => ui.select({ kind: 'speaker', side: s.side })}
            onpointerdown={(e) => {
              ui.select({ kind: 'speaker', side: s.side });
              if (project.constraints.speakersFixed) return;
              drag(e, { x: s.p.base.x, y: s.p.base.y }, `speaker-${s.side}`, (x, y) =>
                moveSpeaker(workspace.project, s.side, { x, y }),
              );
            }}
            onkeydown={(e) =>
              !project.constraints.speakersFixed &&
              onKey(e, `speaker-${s.side}`, (dx, dy) =>
                moveSpeaker(
                  workspace.project,
                  s.side,
                  { x: s.p.base.x + dx, y: s.p.base.y + dy },
                  { grid: false },
                ),
              )}
          >
            <g transform="rotate({angle} {cx} {cy})">
              <rect
                class="body"
                class:default={s.isDefault}
                x={cx - Math.max(8, cab.w * frame.scale) / 2}
                y={cy - Math.max(8, cab.d * frame.scale) / 2}
                width={Math.max(8, cab.w * frame.scale)}
                height={Math.max(8, cab.d * frame.scale)}
              />
              <circle class="tweeter" {cx} cy={cy + Math.max(8, cab.d * frame.scale) / 2} r="2.5" />
              <line
                class="axis"
                x1={cx}
                y1={cy + Math.max(8, cab.d * frame.scale) / 2}
                x2={cx}
                y2={cy + Math.max(8, cab.d * frame.scale) / 2 + 22}
              />
            </g>
          </g>
        {/each}

        {#if seat}
          {@const isSelected = selected.kind === 'seat'}
          <g
            class="item seat-item"
            class:selected={isSelected}
            class:locked={project.constraints.listenerFixed}
            role="button"
            tabindex="0"
            aria-disabled={project.constraints.listenerFixed || undefined}
            aria-label={seatLabel}
            onfocus={() => ui.select({ kind: 'seat' })}
            onpointerdown={(e) => {
              ui.select({ kind: 'seat' });
              if (project.constraints.listenerFixed) return;
              drag(e, { x: seat.ears.x, y: seat.ears.y }, 'seat', (x, y) =>
                moveSeat(workspace.project, { x, y }),
              );
            }}
            onkeydown={(e) =>
              !project.constraints.listenerFixed &&
              onKey(e, 'seat', (dx, dy) =>
                moveSeat(
                  workspace.project,
                  { x: seat.ears.x + dx, y: seat.ears.y + dy },
                  { grid: false },
                ),
              )}
          >
            <circle
              class="seat"
              class:default={seat.certainty === 'unknown'}
              cx={px(seat.ears.x)}
              cy={py(seat.ears.y)}
              r="9"
            />
          </g>
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
    min-height: 140px;
  }
  svg {
    display: block;
    touch-action: none;
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
  .wall {
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .front {
    stroke: var(--line);
    stroke-width: 4;
    stroke-linecap: square;
  }
  .wall.active,
  .front.active {
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
  .triangle {
    fill: none;
    stroke: var(--line);
    stroke-width: 1;
    stroke-dasharray: 4 4;
    opacity: 0.55;
    pointer-events: none;
  }
  .ring {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    pointer-events: none;
  }

  /* Items: movable things. Pointer and keyboard focus both show a clear outline. */
  .item {
    cursor: grab;
    touch-action: none;
    outline: none;
  }
  .item.locked {
    cursor: default;
  }
  .item:active {
    cursor: grabbing;
  }
  .body {
    fill: var(--surface);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .object .body {
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
  .item-label {
    fill: var(--ink-muted);
    font-size: 11px;
    pointer-events: none;
  }
  .body.default,
  .seat.default {
    stroke-dasharray: 3 3;
  }
  .tweeter {
    fill: var(--line);
  }
  .axis {
    stroke: var(--line);
    stroke-width: 1;
    opacity: 0.6;
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
