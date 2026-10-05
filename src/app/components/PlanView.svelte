<script lang="ts">
  import type { LayerId } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { scoreWord } from '../findings/text';
  import {
    ABSOLUTE,
    paintField,
    paintHeat,
    paintSpeakerMap,
    renderScale,
    roomRange,
  } from '../map/heat';
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
  import MapLegend from './MapLegend.svelte';
  import ProbeCard from './ProbeCard.svelte';

  const project = $derived(workspace.project);

  let width = $state(0);
  let height = $state(0);
  let svg = $state<SVGSVGElement>();

  const MARGINS = $derived(
    viewport.compact
      ? { left: 16, right: 16, top: 28, bottom: 12 }
      : { left: 76, right: 84, top: 44, bottom: 104 }, // bottom: room size and the legend
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
  /**
   * Where the option's letter sits: on the suggested seat, or, when the seat stays put (speakers
   * only), between the suggested speakers, so it never hides the seat.
   */
  const pinAt = $derived.by(() => {
    if (!suggested) return null;
    if (!project.constraints.listenerFixed) return suggested.listener;
    const { left, right } = suggested.speakers;
    return { x: (left.base.x + right.base.x) / 2, y: left.base.y };
  });
  /** The speaker-placement layer replaces the seat map: the seat stays, the speakers move. */
  const speakerGrid = $derived(
    !field && ui.layer === 'speakers' && result ? result.heatmap.speakers : null,
  );
  /** The values on the map now (seat layer or speaker map), for the colours and the legend. */
  const shownValues = $derived(
    speakerGrid ? speakerGrid.values : layers && !field ? layers.values[ui.layer as LayerId] : null,
  );
  const range = $derived(
    ui.heatScale === 'absolute' || !shownValues ? ABSOLUTE : roomRange(shownValues),
  );
  /** The current setup's score word, shown on the map where it stands. */
  const seatNow = $derived.by(() => {
    if (!layers || !seat || ui.layer === 'speakers') return result?.current.score ?? 0;
    const i = Math.min(layers.nx - 1, Math.max(0, Math.floor(seat.ears.x / layers.step)));
    const j = Math.min(layers.ny - 1, Math.max(0, Math.floor(seat.ears.y / layers.step)));
    const v = layers.values[ui.layer as LayerId][j * layers.nx + i];
    return v !== undefined && Number.isFinite(v) ? v : (result?.current.score ?? 0);
  });
  const nowWord = $derived(
    result && variant && seat ? scoreWord(speakerGrid ? result.current.score : seatNow) : null,
  );
  /** Only a placement that really helps is tagged "Best" (else the brief and the map disagree). */
  const worthMoving = $derived(result?.topActions.some((a) => a.kind === 'move') ?? false);
  const nowAt = $derived.by(() => {
    if (speakerGrid && variant) {
      const { left, right } = variant.speakers;
      return {
        x: px((left.base.x + right.base.x) / 2),
        y: py(Math.min(left.base.y, right.base.y)) - (cab.d * frame.scale) / 2 - 8,
      };
    }
    return seat ? { x: px(seat.ears.x), y: py(seat.ears.y) + 28 } : { x: 0, y: 0 };
  });

  let heat = $state<HTMLCanvasElement>();
  $effect(() => {
    if (heat && layers && !field && ui.layer !== 'speakers') {
      const scale = renderScale(layers.step * frame.scale);
      paintHeat(heat, layers, layers.values[ui.layer], scale, range);
    }
  });
  let speakerCanvas = $state<HTMLCanvasElement>();
  $effect(() => {
    if (speakerCanvas && speakerGrid) {
      const scale = renderScale(speakerGrid.step * frame.scale);
      paintSpeakerMap(speakerCanvas, speakerGrid, scale, range);
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
  /** The speaker zone, drawn around speakers the user has placed, when they may move. */
  const zoneRadius = $derived.by(() => {
    const zone = project.constraints.speakerZone;
    const placed = speakers.some((sp) => !sp.isDefault);
    return zone !== undefined && placed && !project.constraints.speakersFixed && !field
      ? zone
      : null;
  });

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

  /** The speaker map's value under the pointer (the grid covers the left half; mirrored). */
  const speakerProbe = $derived.by(() => {
    const at = probe.point;
    if (!at || !speakerGrid || !seat) return null;
    const { x0, y0, step, nx, ny, values } = speakerGrid;
    const centre = project.constraints.keepSymmetric ? W / 2 : seat.ears.x;
    const x = at.x <= centre ? at.x : 2 * centre - at.x;
    const i = Math.round((x - x0) / step);
    const j = Math.round((at.y - y0) / step);
    if (i < 0 || j < 0 || i >= nx || j >= ny) return { value: null, flagged: false };
    const v = values[j * nx + i]!;
    return {
      value: Number.isFinite(v) ? v : null,
      flagged: speakerGrid.redFlag?.[j * nx + i] ?? false,
    };
  });

  function moveSpeakersToProbe() {
    const at = probe.point;
    if (!at || !seat) return;
    const side =
      at.x <= (project.constraints.keepSymmetric ? W / 2 : seat.ears.x) ? 'left' : 'right';
    const now = $state.snapshot(variant!);
    ui.showChange({ speakers: now.speakers, listener: now.listener.ears });
    workspace.edit((p) => void moveSpeaker(p, side, at, { grid: false }));
    probe.clear();
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

<div
  class="plan"
  class:show-speaker={selected.kind === 'speaker'}
  class:show-seat={selected.kind === 'seat'}
  bind:clientWidth={width}
  bind:clientHeight={height}
>
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
        style="left:{px(0)}px; top:{py(0)}px; width:{project.constraints.keepSymmetric
          ? W * frame.scale
          : speakerGrid.nx * 2 * speakerGrid.step * frame.scale}px; height:{speakerGrid.ny *
          speakerGrid.step *
          frame.scale}px; clip-path: inset(0 {Math.max(
          0,
          speakerGrid.nx * 2 * speakerGrid.step * frame.scale - W * frame.scale,
        )}px 0 0)"
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
      <rect
        class="room"
        class:placeholder={!known}
        class:heat={showHeat}
        x={px(0)}
        y={py(0)}
        width={W * frame.scale}
        height={L * frame.scale}
        rx="4"
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
          <!-- Speaker and seat distances show on hover or selection, so the plan stays calm. -->
          <g class="dim" data-group="speaker">
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
          </g>
          <g class="dim" data-group="seat">
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
              rx="4"
              class="body"
              class:hard={o.hard}
            />
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

        {#if showHeat && !speakerGrid && !field && speakers.length === 2}
          <!-- In front of the speakers' line no seat is scored: the map fades out there. -->
          {@const noteY = Math.max(speakers[0]!.p.base.y, speakers[1]!.p.base.y) + cab.d / 2 + 0.28}
          {#if noteY < L - 0.3}
            <text class="zone-note" x={px(W / 2)} y={py(noteY)} text-anchor="middle"
              >{i18n.t('map.notListening')}</text
            >
          {/if}
        {/if}

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

        {#if zoneRadius !== null}
          <!-- Where suggestions may move each speaker (the user's zone, docs/DESIGN_BRIEF_V4.md). -->
          <clipPath id="plan-room-clip">
            <rect x={px(0)} y={py(0)} width={W * frame.scale} height={L * frame.scale} />
          </clipPath>
          {#each speakers as s (s.side)}
            <circle
              class="zone"
              clip-path="url(#plan-room-clip)"
              cx={px(s.p.base.x)}
              cy={py(s.p.base.y)}
              r={zoneRadius * frame.scale}
            />
          {/each}
        {/if}

        {#each speakers as s (s.side)}
          {@const isSelected = selected.kind === 'speaker' && selected.side === s.side}
          {@const angle = (s.side === 'left' ? -1 : 1) * s.p.toeInDeg}
          {@const cx = px(s.p.base.x)}
          {@const cy = py(s.p.base.y)}
          {@const w = Math.max(10, cab.w * frame.scale)}
          {@const d = Math.max(10, cab.d * frame.scale)}
          <g
            class="item speaker"
            class:selected={isSelected}
            class:glide={ui.glide}
            style="transform: translate({cx}px, {cy}px)"
            role="button"
            tabindex="0"
            aria-label={speakerLabel(s.side)}
            onfocus={() => ui.select({ kind: 'speaker', side: s.side })}
            onpointerdown={(e) => {
              ui.select({ kind: 'speaker', side: s.side });
              drag(e, { x: s.p.base.x, y: s.p.base.y }, `speaker-${s.side}`, (x, y) =>
                moveSpeaker(workspace.project, s.side, { x, y }),
              );
            }}
            onkeydown={(e) =>
              onKey(e, `speaker-${s.side}`, (dx, dy) =>
                moveSpeaker(
                  workspace.project,
                  s.side,
                  { x: s.p.base.x + dx, y: s.p.base.y + dy },
                  { grid: false },
                ),
              )}
          >
            <!-- Top-down cabinet; the light bar is the front (baffle), the dashed line its aim. -->
            <g transform="rotate({angle})">
              <line class="axis" x1="0" y1={d / 2} x2="0" y2={d / 2 + 26} />
              <rect
                class="body cabinet"
                class:default={s.isDefault}
                x={-w / 2}
                y={-d / 2}
                width={w}
                height={d}
                rx="3"
              />
              <rect class="baffle" x={-w / 2 + 2.5} y={d / 2 - 4} width={w - 5} height="2" rx="1" />
            </g>
          </g>
        {/each}

        {#if seat}
          {@const isSelected = selected.kind === 'seat'}
          {@const sx = px(seat.ears.x)}
          {@const sy = py(seat.ears.y)}
          <g
            class="item seat-item"
            class:selected={isSelected}
            class:glide={ui.glide}
            style="transform: translate({sx}px, {sy}px)"
            role="button"
            tabindex="0"
            aria-label={seatLabel}
            onfocus={() => ui.select({ kind: 'seat' })}
            onpointerdown={(e) => {
              ui.select({ kind: 'seat' });
              drag(e, { x: seat.ears.x, y: seat.ears.y }, 'seat', (x, y) =>
                moveSeat(workspace.project, { x, y }),
              );
            }}
            onkeydown={(e) =>
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
              cx="0"
              cy="0"
              r="11"
            />
            <!-- The listener faces the front wall (the speakers). -->
            <path class="facing" d="M -4.5 2 L 0 -3 L 4.5 2" />
          </g>
        {/if}

        {#if ui.before && !field}
          <!-- Just applied: where things were, for a moment (owner decision: before/after). -->
          <g class="before" aria-hidden="true">
            {#each [ui.before.speakers.left, ui.before.speakers.right] as b, i (i)}
              <rect
                x={px(b.base.x) - (cab.w * frame.scale) / 2}
                y={py(b.base.y) - (cab.d * frame.scale) / 2}
                width={cab.w * frame.scale}
                height={cab.d * frame.scale}
                rx="3"
              />
            {/each}
            <circle cx={px(ui.before.listener.x)} cy={py(ui.before.listener.y)} r="11" />
            <text
              x={px((ui.before.speakers.left.base.x + ui.before.speakers.right.base.x) / 2)}
              y={py(ui.before.speakers.left.base.y) + 4}
              text-anchor="middle">{i18n.t('map.before')}</text
            >
          </g>
        {/if}

        {#if nowWord && !field}
          <!-- "You are here": where the current setup sits on this map, with its score word. -->
          <text class="tag" x={nowAt.x} y={nowAt.y} text-anchor="middle" data-testid="map-now"
            >{i18n.t('map.now', { word: i18n.t(`results.score.${nowWord}`) })}</text
          >
        {/if}

        {#if suggested}
          {#each [suggested.speakers.left, suggested.speakers.right] as ghost, i (i)}
            {@const own = variant?.speakers[i === 0 ? 'left' : 'right'].base}
            <!-- Already there (e.g. just applied): no copy on top of the speaker. -->
            {@const there =
              own !== undefined && Math.hypot(own.x - ghost.base.x, own.y - ghost.base.y) < 0.01}
            <rect
              class:hidden={there}
              class="ghost-halo"
              x={px(ghost.base.x) - (cab.w * frame.scale) / 2}
              y={py(ghost.base.y) - (cab.d * frame.scale) / 2}
              width={cab.w * frame.scale}
              height={cab.d * frame.scale}
              rx="3"
            />
            <rect
              class:hidden={there}
              class="ghost"
              x={px(ghost.base.x) - (cab.w * frame.scale) / 2}
              y={py(ghost.base.y) - (cab.d * frame.scale) / 2}
              width={cab.w * frame.scale}
              height={cab.d * frame.scale}
              rx="3"
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
            <circle cx={px(pinAt!.x)} cy={py(pinAt!.y)} r="13" />
            <text x={px(pinAt!.x)} y={py(pinAt!.y) + 4.5} text-anchor="middle"
              >{LETTERS[shownIndex]}</text
            >
          </g>
          {#if shownIndex === 0 && worthMoving && !(nowWord && Math.abs(nowAt.x - px(pinAt!.x)) < 80 && Math.abs(nowAt.y - (py(pinAt!.y) - 20)) < 18)}
            <!-- Left out where it would cover the "Now" label (small maps): the pin still marks it. -->
            <text class="tag" x={px(pinAt!.x)} y={py(pinAt!.y) - 20} text-anchor="middle"
              >{i18n.t('map.best')}</text
            >
          {/if}
        {/if}
      {/if}
    </svg>

    {#if showDims && dimSpeaker && seat && variant}
      {@const rear = dimSpeaker.y - cab.d / 2}
      {@const sideY = py(dimSpeaker.y + cab.d / 2) + 18}
      <DimLabel
        name={dimName('clearance')}
        group="speaker"
        value={rear}
        {system}
        limits={{ min: 0, max: L / 2 }}
        x={Math.max(44, px(dimSpeaker.x - cab.w / 2) - 14 - 34)}
        y={py(rear / 2)}
        onchange={(v) => workspace.edit((p) => void setSpeakerClearance(p, v))}
      />
      <DimLabel
        name={dimName('side')}
        group="speaker"
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
        group="speaker"
        value={variant.speakers.right.base.x - variant.speakers.left.base.x}
        {system}
        limits={{ min: 0.3, max: W - cab.w }}
        x={px((variant.speakers.left.base.x + variant.speakers.right.base.x) / 2)}
        y={py(0) + 30 - 14}
        onchange={(v) => workspace.edit((p) => void setSpeakerSpacing(p, v))}
      />
      <DimLabel
        name={dimName('seat')}
        group="seat"
        value={seat.ears.y}
        {system}
        limits={{ min: 0.1, max: L - 0.1 }}
        x={px(seat.ears.x) + 22 + 40}
        y={py(seat.ears.y / 2)}
        onchange={(y) => workspace.edit((p) => void moveSeat(p, { y }, exact))}
      />
      <DimLabel
        name={dimName('width')}
        group="room"
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
        group="room"
        kind="room"
        value={L}
        {system}
        limits={ROOM_LIMITS.length}
        x={px(W) + 22 + 44}
        y={py(L / 2)}
        onchange={(v) => setRoom('length', v)}
      />
    {/if}

    {#if shownValues && known && !field}
      <MapLegend
        values={shownValues}
        named={ui.layer === 'overall' || ui.layer === 'goals' || ui.layer === 'speakers'}
        hatched
      />
    {/if}

    {#if field}
      <p class="hint">
        {i18n.t('mode.caption', { frequency: `${Math.round(field.frequency)} Hz` })}
      </p>
    {/if}

    {#if probe.point && speakerGrid && speakerProbe}
      <!-- On the speaker map, pointing says how good the speakers would be there. -->
      {@const at = { x: px(probe.point.x), y: py(probe.point.y) }}
      <div
        class="spot"
        role="region"
        aria-label={i18n.t('probe.speakersTitle')}
        aria-live={probe.pinned ? 'polite' : 'off'}
        style="left:{Math.max(8, Math.min(width - 228, at.x + 18))}px; top:{Math.max(
          8,
          Math.min(height - 120, at.y + 18),
        )}px"
      >
        <p class="spot-score">
          {speakerProbe.value === null
            ? i18n.t('probe.speakersNot')
            : i18n.t('probe.speakersHere', {
                word: i18n.t(`results.score.${scoreWord(speakerProbe.value)}`),
              })}
        </p>
        {#if speakerProbe.flagged}<p class="spot-flag">{i18n.t('probe.speakersFlagged')}</p>{/if}
        {#if probe.pinned}
          <div class="spot-actions">
            {#if speakerProbe.value !== null}
              <button type="button" class="btn small primary" onclick={moveSpeakersToProbe}
                >{i18n.t('probe.moveSpeakers')}</button
              >
            {/if}
            <button type="button" class="btn small" onclick={() => probe.clear()}
              >{i18n.t('probe.close')}</button
            >
          </div>
        {/if}
      </div>
    {:else if probeAt && !field && !speakerGrid}
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
    font-size: var(--text-xs);
    line-height: 1.5;
    pointer-events: none;
  }
  .hidden {
    display: none;
  }
  .heat {
    position: absolute;
    pointer-events: none;
  }
  /* Heat sits under the drawing: same rounded corners and soft shadow as the empty room. */
  .heat {
    border-radius: 4px;
    box-shadow: var(--plan-shadow);
  }
  .room {
    fill: var(--surface);
    stroke: color-mix(in srgb, var(--ink) 30%, transparent);
    stroke-width: 1;
    filter: drop-shadow(var(--plan-shadow));
  }
  .room.heat {
    position: static;
    fill: transparent;
    opacity: 1;
    filter: none;
    box-shadow: none;
  }
  /* The recommended spot must read on every heat colour: a white ring under a solid accent edge. */
  .ghost-halo {
    fill: none;
    stroke: #fff;
    stroke-width: 6;
    pointer-events: none;
  }
  .ghost {
    fill: color-mix(in srgb, var(--accent-fill) 30%, transparent);
    stroke: var(--accent-fill);
    stroke-width: 2.5;
    pointer-events: none;
  }
  /* Quiet labels on the map: dark text with a light halo, readable on any colour. */
  .tag {
    fill: #1d1d1f;
    stroke: #fff;
    stroke-width: 4;
    paint-order: stroke;
    stroke-linejoin: round;
    font-size: var(--text-xs);
    font-weight: 600;
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
  /* The room outline is the wall; only the front wall (where the speakers stand) is drawn heavier. */
  .wall {
    stroke: transparent;
    stroke-width: 1;
  }
  .front {
    stroke: var(--ink-muted);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .wall.active,
  .front.active {
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .label {
    fill: var(--ink-muted);
    font-size: var(--text-xs);
  }
  .zone-note {
    fill: var(--ink-muted);
    font-size: var(--text-xs);
    letter-spacing: 0.02em;
    opacity: 0.8;
    pointer-events: none;
  }
  .dim line {
    stroke: var(--accent);
    stroke-width: 1;
    pointer-events: none;
  }
  .dim.muted line {
    stroke: var(--ink-muted);
    opacity: 0.6;
  }
  /*
   * Speaker and seat numbers appear while the item is hovered or selected (or a number is in use).
   * Hiding waits a moment, so the pointer can travel from the item to its number.
   */
  .plan :global([data-group='speaker']),
  .plan :global([data-group='seat']) {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.15s ease 0.35s,
      visibility 0s linear 0.5s;
  }
  .plan.show-speaker :global([data-group='speaker']),
  .plan:has(:global(.speaker:hover)) :global([data-group='speaker']),
  .plan :global([data-group='speaker']:hover),
  .plan :global([data-group='speaker']:focus-within),
  .plan.show-seat :global([data-group='seat']),
  .plan:has(:global(.seat-item:hover)) :global([data-group='seat']),
  .plan :global([data-group='seat']:hover),
  .plan :global([data-group='seat']:focus-within) {
    opacity: 1;
    visibility: visible;
    transition:
      opacity 0.15s ease,
      visibility 0s;
  }
  @media (prefers-reduced-motion: reduce) {
    .plan :global([data-group]) {
      transition: none !important;
    }
  }
  /* Applying a placement: the speakers and the seat glide, the old spots fade away. */
  .glide {
    transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .before {
    animation: before 3.5s ease forwards;
    pointer-events: none;
  }
  .before rect,
  .before circle {
    fill: none;
    stroke: var(--ink-muted);
    stroke-width: 1.25;
    stroke-dasharray: 3 3;
  }
  .before text {
    fill: var(--ink-muted);
    font-size: var(--text-xs);
  }
  @keyframes before {
    0%,
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .glide {
      transition: none;
    }
  }
  .spot {
    position: absolute;
    z-index: 3;
    display: grid;
    gap: 8px;
    width: 220px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow);
    font-size: var(--text-sm);
    pointer-events: none;
  }
  .spot:has(.spot-actions) {
    pointer-events: auto;
  }
  .spot-flag {
    margin: 0;
    color: var(--caution);
  }
  .spot-score {
    margin: 0;
    font-weight: 600;
  }
  .spot-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .spot .small {
    min-height: 36px;
    padding: 0 12px;
    font-size: var(--text-sm);
  }
  @media (pointer: coarse) {
    .spot .small {
      min-height: 44px;
    }
  }
  .zone {
    fill: color-mix(in srgb, var(--accent-fill) 7%, transparent);
    stroke: var(--accent-fill);
    stroke-width: 1;
    stroke-dasharray: 3 4;
    opacity: 0.8;
    pointer-events: none;
  }
  .triangle {
    fill: none;
    stroke: var(--ink-muted);
    stroke-width: 1;
    stroke-dasharray: 3 5;
    opacity: 0.4;
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
  .item:active {
    cursor: grabbing;
  }
  .body {
    fill: var(--bg);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  /* Furniture: soft, see-through, neutral, so the map shows what it is like to sit there too. */
  .object .body {
    fill: color-mix(in srgb, var(--ink) 7%, transparent);
    stroke: color-mix(in srgb, var(--ink) 28%, transparent);
    stroke-width: 1;
  }
  .object .body.hard {
    fill: color-mix(in srgb, var(--ink) 13%, transparent);
  }
  .item-label {
    fill: var(--ink);
    font-size: var(--text-xs);
    font-weight: 500;
    pointer-events: none;
  }
  .cabinet {
    fill: var(--speaker);
    stroke: var(--speaker);
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.25));
  }
  .cabinet.default {
    fill: color-mix(in srgb, var(--speaker) 45%, transparent);
  }
  .baffle {
    fill: var(--speaker-baffle);
    pointer-events: none;
  }
  .body.default,
  .seat.default {
    stroke-dasharray: 3 3;
  }
  .axis {
    stroke: var(--ink-muted);
    stroke-width: 1;
    stroke-dasharray: 2 3;
    opacity: 0.7;
  }
  .seat {
    fill: var(--surface);
    stroke: var(--ink);
    stroke-width: 1.5;
    filter: drop-shadow(0 1px 3px rgb(0 0 0 / 0.25));
  }
  .facing {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }
  .item.selected .body,
  .item:focus-visible .body,
  .item.selected .seat,
  .item:focus-visible .seat {
    stroke: var(--accent);
    stroke-width: 2.5;
  }
  .item.selected .cabinet,
  .item:focus-visible .cabinet {
    stroke: var(--accent-fill);
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
    font-size: var(--text-md);
    pointer-events: none;
  }
</style>
