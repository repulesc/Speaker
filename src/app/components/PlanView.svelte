<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { scoreWord } from '../findings/text';
  import { paintField, paintHeat, paintSpeakerMap, renderScale } from '../map/heat';
  import { modeExplorer } from '../state/mode.svelte';
  import { fitFrame, toPx, toWorld } from '../plan/frame';
  import {
    cabinet,
    moveObject,
    moveSeat,
    moveSpeaker,
    setSpeakerClearance,
    setSpeakerSpacing,
  } from '../plan/placement';
  import { analysis, workspace } from '../session.svelte';
  import { preview } from '../state/preview.svelte';
  import { probe } from '../state/probe.svelte';
  import { ui } from '../ui.svelte';
  import { arrowDelta, startDrag } from '../plan/interaction';
  import { viewport } from '../viewport.svelte';
  import { ROOM_LIMITS } from '../state/limits';
  import DimLabel from './DimLabel.svelte';
  import ProbeCard from './ProbeCard.svelte';

  const project = $derived(workspace.project);

  let width = $state(0);
  let height = $state(0);
  let svg = $state<SVGSVGElement>();

  const MARGINS = $derived(
    viewport.compact
      ? { left: 16, right: 16, top: 28, bottom: 12 }
      : { left: 76, right: 84, top: 44, bottom: 56 },
  );
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

  // ── Map layers, best spots, probe ────────────────────────────────────────

  const result = $derived(analysis.result?.status === 'ok' ? analysis.result : null);

  /** Where the treatment advice points (Treat tab): numbered rings, as listed in the panel. */
  const adviceRings = $derived(
    ui.step === 'treat' && result
      ? result.advice.treatment
          .filter((a) => a.location)
          .map((a, i) => ({ n: i + 1, at: a.location! }))
      : [],
  );
  const layers = $derived(preview.layers ?? result?.layers ?? null);
  const candidates = $derived(result?.candidates.slice(0, 3) ?? []);
  const previewed = $derived(ui.candidate === null ? null : (candidates[ui.candidate] ?? null));
  /** The recommendation is always on the map: dashed speakers and a marked seat (owner feedback). */
  const shownIndex = $derived(ui.candidate ?? 0);
  const LETTERS = ['A', 'B', 'C'];

  /** The bass-note explorer replaces the score map while it is on. */
  const field = $derived(ui.modeFrequency !== null ? modeExplorer.field : null);
  const suggested = $derived(field ? null : (candidates[shownIndex] ?? null));
  /** The speaker-placement layer replaces the seat map: the seat stays, the speakers move. */
  const speakerGrid = $derived(
    !field && ui.layer === 'speakers' && result ? result.heatmap.speakers : null,
  );
  let heat = $state<HTMLCanvasElement>();
  $effect(() => {
    if (heat && layers && !field && ui.layer !== 'speakers') {
      paintHeat(heat, layers, layers.values[ui.layer], renderScale(layers.step * frame.scale));
    }
  });
  let speakerCanvas = $state<HTMLCanvasElement>();
  $effect(() => {
    if (speakerCanvas && speakerGrid) {
      paintSpeakerMap(speakerCanvas, speakerGrid, renderScale(speakerGrid.step * frame.scale));
    }
  });
  let fieldCanvas = $state<HTMLCanvasElement>();
  $effect(() => {
    if (fieldCanvas && field) {
      paintField(fieldCanvas, field.grid, renderScale(field.grid.step * frame.scale));
    }
  });

  // Keep the preview and the probe in step with the project (and with each other).
  $effect(() => {
    const snapshot = $state.snapshot(workspace.project);
    const speakers = previewed ? $state.snapshot(previewed.speakers) : null;
    void preview.refresh(snapshot, speakers);
    probe.refresh(snapshot, speakers ?? undefined);
    void modeExplorer.refresh(snapshot, ui.modeFrequency);
  });

  const showHeat = $derived(known && layers !== null);

  const probeAt = $derived(
    probe.point && probe.explanation
      ? { x: px(probe.point.x), y: py(probe.point.y), explanation: probe.explanation }
      : null,
  );

  function onFloorMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || !known || event.buttons !== 0) return;
    const w = world(event.clientX, event.clientY);
    if (w.a >= 0 && w.a <= W && w.b >= 0 && w.b <= L) probe.hover(w.a, w.b);
    else probe.leave();
  }

  function onFloorClick(event: MouseEvent) {
    if (!known || (event.target as Element).closest('.item, .pin')) return;
    const w = world(event.clientX, event.clientY);
    if (w.a >= 0 && w.a <= W && w.b >= 0 && w.b <= L) probe.pin(w.a, w.b);
    else probe.clear();
    ui.select({ kind: 'none' });
  }

  /** Shows a best spot on the map and in the panel (again: back to the current setup). */
  function choose(i: number) {
    const next = ui.candidate === i ? null : i;
    ui.step = 'results'; // leaving another section clears the preview, so set it after
    ui.candidate = next;
  }

  function moveSeatToProbe() {
    const at = probe.point;
    if (!at) return;
    workspace.edit((p) => void moveSeat(p, at, { grid: false }));
    probe.clear();
  }

  // ── Dimensions (click a number to type an exact value) ──────────────────

  const dimSide = $derived<'left' | 'right'>(selected.kind === 'speaker' ? selected.side : 'left');
  const dimSpeaker = $derived(variant ? variant.speakers[dimSide].base : null);
  const showDims = $derived(known && !viewport.compact);
  const dimName = (key: string) => i18n.t(`map.dim.${key}`);
  const exact = { grid: false, keepCertainty: true } as const;
  const setRoom = (dim: 'width' | 'length', metres: number) =>
    workspace.edit((p) => void (p.room[dim] = { value: metres, certainty: 'measured' }));

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
    {#if field}
      <canvas
        bind:this={fieldCanvas}
        class="heat"
        aria-hidden="true"
        style="left:{px(field.grid.x0 - field.grid.step / 2)}px; top:{py(
          field.grid.y0 - field.grid.step / 2,
        )}px; width:{field.grid.nx * field.grid.step * frame.scale}px; height:{field.grid.ny *
          field.grid.step *
          frame.scale}px"
      ></canvas>
    {:else if speakerGrid}
      <canvas
        bind:this={speakerCanvas}
        class="heat"
        aria-hidden="true"
        style="left:{px(0)}px; top:{py(0)}px; width:{speakerGrid.nx *
          2 *
          speakerGrid.step *
          frame.scale}px; height:{speakerGrid.ny * speakerGrid.step * frame.scale}px"
      ></canvas>
    {:else if showHeat && layers}
      <canvas
        bind:this={heat}
        class="heat"
        aria-hidden="true"
        style="left:{px(0)}px; top:{py(0)}px; width:{layers.nx *
          layers.step *
          frame.scale}px; height:{layers.ny * layers.step * frame.scale}px"
      ></canvas>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
    <svg
      bind:this={svg}
      {width}
      {height}
      role="group"
      aria-labelledby="plan-title plan-desc"
      onpointermove={onFloorMove}
      onpointerleave={() => probe.leave()}
      onclick={onFloorClick}
    >
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
        class:heat={showHeat}
        x={px(0)}
        y={py(0)}
        width={W * frame.scale}
        height={L * frame.scale}
      />
      {#if !showHeat}
        {#each gridX as g (g)}
          <line class="grid" x1={px(g)} y1={py(0)} x2={px(g)} y2={py(L)} />
        {/each}
        {#each gridY as g (g)}
          <line class="grid" x1={px(0)} y1={py(g)} x2={px(W)} y2={py(g)} />
        {/each}
      {/if}

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
        <!-- Room size: the numbers are typed over these lines (hidden on a phone: no room). -->
        <g class="dim muted" class:hidden={!showDims}>
          <line x1={px(0)} y1={py(L) + 22} x2={px(W)} y2={py(L) + 22} />
          <line x1={px(0)} y1={py(L) + 16} x2={px(0)} y2={py(L) + 28} />
          <line x1={px(W)} y1={py(L) + 16} x2={px(W)} y2={py(L) + 28} />
          <line x1={px(W) + 22} y1={py(0)} x2={px(W) + 22} y2={py(L)} />
          <line x1={px(W) + 16} y1={py(0)} x2={px(W) + 28} y2={py(0)} />
          <line x1={px(W) + 16} y1={py(L)} x2={px(W) + 28} y2={py(L)} />
        </g>
        {#if showDims && dimSpeaker && seat}
          {@const rear = dimSpeaker.y - cab.d / 2}
          {@const lineX = px(dimSpeaker.x - cab.w / 2) - 14}
          {@const sideY = py(dimSpeaker.y + cab.d / 2) + 18}
          <g class="dim">
            <!-- rear panel to the front wall -->
            <line x1={lineX} y1={py(0)} x2={lineX} y2={py(rear)} />
            <line x1={lineX - 5} y1={py(0)} x2={lineX + 5} y2={py(0)} />
            <line x1={lineX - 5} y1={py(rear)} x2={lineX + 5} y2={py(rear)} />
            <!-- speaker to its side wall -->
            <line
              x1={dimSide === 'left' ? px(0) : px(dimSpeaker.x)}
              y1={sideY}
              x2={dimSide === 'left' ? px(dimSpeaker.x) : px(W)}
              y2={sideY}
            />
            <line x1={px(0)} y1={sideY - 5} x2={px(0)} y2={sideY + 5} />
            <line x1={px(dimSpeaker.x)} y1={sideY - 5} x2={px(dimSpeaker.x)} y2={sideY + 5} />
            <line x1={px(W)} y1={sideY - 5} x2={px(W)} y2={sideY + 5} />
            <!-- between the speakers -->
            <line
              x1={px(variant!.speakers.left.base.x)}
              y1={py(0) + 30}
              x2={px(variant!.speakers.right.base.x)}
              y2={py(0) + 30}
            />
            <!-- seat to the front wall -->
            <line
              x1={px(seat.ears.x) + 22}
              y1={py(0)}
              x2={px(seat.ears.x) + 22}
              y2={py(seat.ears.y)}
            />
            <line x1={px(seat.ears.x) + 17} y1={py(0)} x2={px(seat.ears.x) + 27} y2={py(0)} />
            <line
              x1={px(seat.ears.x) + 17}
              y1={py(seat.ears.y)}
              x2={px(seat.ears.x) + 27}
              y2={py(seat.ears.y)}
            />
          </g>
        {/if}

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

        {#each adviceRings as r (r.n)}
          <g class="advice-ring" aria-hidden="true">
            <circle cx={px(r.at.x)} cy={py(r.at.y)} r="11" />
            <text x={px(r.at.x)} y={py(r.at.y) + 4} text-anchor="middle">{r.n}</text>
          </g>
        {/each}

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

        {#if suggested}
          {#each [suggested.speakers.left, suggested.speakers.right] as ghost, i (i)}
            <rect
              class="ghost"
              x={px(ghost.base.x) - (cab.w * frame.scale) / 2}
              y={py(ghost.base.y) - (cab.d * frame.scale) / 2}
              width={cab.w * frame.scale}
              height={cab.d * frame.scale}
            />
          {/each}
          <g
            class="pin"
            role="button"
            tabindex="0"
            aria-label={i18n.t('map.pin', {
              letter: LETTERS[shownIndex]!,
              score: i18n.t(`results.score.${scoreWord(suggested.score)}`),
            })}
            onclick={() => choose(shownIndex)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                choose(shownIndex);
              }
            }}
          >
            <circle cx={px(suggested.listener.x)} cy={py(suggested.listener.y)} r="13" />
            <text
              x={px(suggested.listener.x)}
              y={py(suggested.listener.y) + 4.5}
              text-anchor="middle">{LETTERS[shownIndex]}</text
            >
          </g>
        {/if}
      {/if}
    </svg>

    {#if showDims && dimSpeaker && seat && variant}
      {@const rear = dimSpeaker.y - cab.d / 2}
      {@const sideY = py(dimSpeaker.y + cab.d / 2) + 18}
      <DimLabel
        name={dimName('clearance')}
        value={rear}
        {system}
        limits={{ min: 0, max: L / 2 }}
        x={Math.max(44, px(dimSpeaker.x - cab.w / 2) - 14 - 34)}
        y={py(rear / 2)}
        onchange={(v) => workspace.edit((p) => void setSpeakerClearance(p, v))}
      />
      <DimLabel
        name={dimName('side')}
        value={dimSide === 'left' ? dimSpeaker.x : W - dimSpeaker.x}
        {system}
        limits={{ min: cab.w / 2, max: W / 2 }}
        x={dimSide === 'left' ? px(dimSpeaker.x / 2) : px((dimSpeaker.x + W) / 2)}
        y={sideY + 15}
        onchange={(v) =>
          workspace.edit(
            (p) => void moveSpeaker(p, dimSide, { x: dimSide === 'left' ? v : W - v }, exact),
          )}
      />
      <DimLabel
        name={dimName('spacing')}
        value={variant.speakers.right.base.x - variant.speakers.left.base.x}
        {system}
        limits={{ min: 0.3, max: W - cab.w }}
        x={px((variant.speakers.left.base.x + variant.speakers.right.base.x) / 2)}
        y={py(0) + 30 - 14}
        onchange={(v) => workspace.edit((p) => void setSpeakerSpacing(p, v))}
      />
      <DimLabel
        name={dimName('seat')}
        value={seat.ears.y}
        {system}
        limits={{ min: 0.1, max: L - 0.1 }}
        x={px(seat.ears.x) + 22 + 40}
        y={py(seat.ears.y / 2)}
        onchange={(y) => workspace.edit((p) => void moveSeat(p, { y }, exact))}
      />
      <DimLabel
        name={dimName('width')}
        kind="room"
        value={W}
        {system}
        limits={ROOM_LIMITS.width}
        x={px(W / 2)}
        y={py(L) + 40}
        onchange={(v) => setRoom('width', v)}
      />
      <DimLabel
        name={dimName('length')}
        kind="room"
        value={L}
        {system}
        limits={ROOM_LIMITS.length}
        x={px(W) + 22 + 44}
        y={py(L / 2)}
        onchange={(v) => setRoom('length', v)}
      />
    {/if}

    {#if field}
      <p class="hint">
        {i18n.t('mode.caption', { frequency: `${Math.round(field.frequency)} Hz` })}
      </p>
    {/if}

    {#if probeAt && !field}
      <ProbeCard
        explanation={probeAt.explanation}
        {system}
        pinned={probe.pinned}
        x={probeAt.x}
        y={probeAt.y}
        bounds={{ width, height }}
        onmove={moveSeatToProbe}
        onclose={() => probe.clear()}
      />
    {/if}
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
    position: absolute;
    inset: 0;
    display: block;
    touch-action: none;
  }
  .hint {
    position: absolute;
    top: 8px;
    left: 16px;
    width: min(220px, 20%);
    margin: 0;
    color: var(--ink-muted);
    font-size: 12px;
    line-height: 1.5;
    pointer-events: none;
  }
  .hidden {
    display: none;
  }
  .heat {
    position: absolute;
    pointer-events: none;
    opacity: 0.88;
  }
  .room {
    fill: var(--surface);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .room.heat {
    position: static;
    fill: transparent;
    opacity: 1;
  }
  .ghost {
    fill: color-mix(in srgb, var(--accent-fill) 18%, transparent);
    stroke: var(--accent-fill);
    stroke-width: 2;
    stroke-dasharray: 4 3;
    pointer-events: none;
  }
  .advice-ring {
    pointer-events: none;
  }
  .advice-ring circle {
    fill: var(--bg);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .advice-ring text {
    fill: var(--accent);
    font-size: 12px;
    font-weight: 600;
  }
  .pin {
    cursor: pointer;
    outline: none;
  }
  .pin circle {
    fill: var(--accent-fill);
    stroke: #fff;
    stroke-width: 2;
  }
  .pin text {
    fill: #fff;
    font-weight: 600;
    font-size: var(--text-sm);
    pointer-events: none;
  }
  .pin:focus-visible circle {
    stroke: var(--ink);
    stroke-width: 3;
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
  .label {
    fill: var(--ink-muted);
    font-size: 12px;
  }
  .dim line {
    stroke: var(--accent);
    stroke-width: 1;
    pointer-events: none;
  }
  .dim.muted line {
    stroke: var(--ink-muted);
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
    fill: var(--bg);
    stroke: var(--ink);
    stroke-width: 2;
  }
  /* Furniture is see-through, so the map shows what it is like to sit there too. */
  .object .body {
    fill: color-mix(in srgb, var(--surface) 30%, transparent);
    stroke: var(--ink-muted);
    stroke-width: 1.5;
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
    fill: var(--ink);
    font-size: var(--text-xs);
    font-weight: 500;
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
    fill: var(--bg);
    stroke: var(--ink);
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
