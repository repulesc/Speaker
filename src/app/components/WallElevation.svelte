<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { surfaceClass } from '../../engine/presets/surfaces';
  import { boundaryUV } from '../../engine/rules/P06-reflections';
  import type { BoundaryId } from '../../engine/types';
  import { formatLength } from '../../units/format';
  import { fitFrame, toPx, toWorld } from '../plan/frame';
  import { arrowDelta, startDrag } from '../plan/interaction';
  import { boundaryExtent, isWall, movePatch } from '../plan/patches';
  import { analysis, workspace } from '../session.svelte';

  interface Props {
    boundary: BoundaryId;
    selectedId: string | null;
  }

  let { boundary, selectedId = $bindable(null) }: Props = $props();

  const project = $derived(workspace.project);
  const dims = $derived(boundaryExtent(project, boundary));
  const span = $derived(dims?.span ?? 4);
  const extent = $derived(dims?.extent ?? 2.5);
  /** Walls are drawn as seen from inside the room, so the left wall and back wall run right-to-left. */
  const flip = $derived(boundary === 'left' || boundary === 'back');
  const walls = $derived(isWall(boundary));

  let width = $state(0);
  let svg = $state<SVGSVGElement>();
  const HEIGHT = 210;
  const MARGINS = { left: 14, right: 14, top: 24, bottom: 24 };
  const frame = $derived(fitFrame(width, HEIGHT, span, extent, MARGINS));
  const locale = $derived(i18n.locale);
  const fmt = (m: number) => formatLength(m, project.units, 'position', locale);

  const patches = $derived(project.surfaces.patches.filter((p) => p.boundary === boundary));

  /** Picture coordinates (metres from the picture's top-left) of a patch's top-left corner. */
  const picture = (u: number, v: number, w: number, h: number) => ({
    a: flip ? span - u - w : u,
    b: walls ? extent - v - h : v,
  });
  const fromPicture = (a: number, b: number, w: number, h: number) => ({
    u: flip ? span - a - w : a,
    v: walls ? extent - b - h : b,
  });
  const px = (a: number) => toPx(frame, a, 0).x;
  const py = (b: number) => toPx(frame, 0, b).y;

  const rings = $derived(
    analysis.result?.status === 'ok'
      ? analysis.result.findings
          .filter((f) => f.ruleId === 'P06' && f.location && f.params.boundary === boundary)
          .map((f) => {
            const [u, v] = boundaryUV(boundary, f.location!);
            return { key: `${f.params.speaker}`, ...picture(u, v, 0, 0) };
          })
      : [],
  );

  const ENDS: Record<BoundaryId, { left?: BoundaryId; right?: BoundaryId; top?: BoundaryId }> = {
    front: { left: 'left', right: 'right' },
    back: { left: 'right', right: 'left' },
    left: { left: 'back', right: 'front' },
    right: { left: 'front', right: 'back' },
    floor: { left: 'left', top: 'front' },
    ceiling: { left: 'left', top: 'front' },
  };
  const ends = $derived(ENDS[boundary]);

  function drag(event: PointerEvent, id: string, w: number, h: number, a: number, b: number) {
    selectedId = id;
    startDrag(event, {
      origin: { x: a, y: b },
      key: `patch-${id}`,
      toWorld: (cx, cy) => {
        const rect = svg!.getBoundingClientRect();
        const p = toWorld(frame, cx - rect.left, cy - rect.top);
        return { x: p.a, y: p.b };
      },
      move: (na, nb) => {
        const { u, v } = fromPicture(na, nb, w, h);
        movePatch(workspace.project, id, { u, v });
      },
      edit: (change, coalesce) => workspace.edit(change, { coalesce }),
    });
  }

  function onKey(event: KeyboardEvent, id: string, w: number, h: number, a: number, b: number) {
    const delta = arrowDelta(event);
    if (!delta) return;
    event.preventDefault();
    const { u, v } = fromPicture(a + delta.dx, b + delta.dy, w, h);
    workspace.edit((p) => void movePatch(p, id, { u, v }, { grid: false }), {
      coalesce: `key-patch-${id}`,
    });
  }
</script>

<div class="wall" bind:clientWidth={width}>
  {#if width > 0}
    <svg
      bind:this={svg}
      {width}
      height={HEIGHT}
      role="group"
      aria-label={i18n.t('surfaces.elevation', { name: i18n.t(`boundary.${boundary}`) })}
    >
      <defs>
        <pattern
          id="pat-absorptive"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" class="pat-line" />
        </pattern>
        <pattern id="pat-diffusive" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.1" class="pat-dot" />
        </pattern>
      </defs>
      <rect
        class="surface"
        x={px(0)}
        y={py(0)}
        width={span * frame.scale}
        height={extent * frame.scale}
      />

      {#if ends.top}<text class="end" x={px(span / 2)} y={py(0) - 8} text-anchor="middle"
          >{i18n.t(`boundary.short.${ends.top}`)}</text
        >{/if}
      {#if ends.left}<text class="end" x={px(0)} y={py(extent) + 16}
          >{i18n.t(`boundary.short.${ends.left}`)}</text
        >{/if}
      {#if ends.right}<text class="end" x={px(span)} y={py(extent) + 16} text-anchor="end"
          >{i18n.t(`boundary.short.${ends.right}`)}</text
        >{/if}

      {#each patches as p (p.id)}
        {@const pos = picture(p.u, p.v, p.width, p.height)}
        {@const kind = surfaceClass(p.preset, p.customAbsorption)}
        {@const isSelected = selectedId === p.id}
        <g
          class="patch"
          class:selected={isSelected}
          role="button"
          tabindex="0"
          aria-label={i18n.t('surfaces.patchLabel', {
            name: p.label || i18n.t(`surface.${p.preset}`),
            left: fmt(p.u),
            top: fmt(p.v),
            hint: i18n.t('plan.item.hint'),
          })}
          onfocus={() => (selectedId = p.id)}
          onpointerdown={(e) => drag(e, p.id, p.width, p.height, pos.a, pos.b)}
          onkeydown={(e) => onKey(e, p.id, p.width, p.height, pos.a, pos.b)}
        >
          <rect
            class="fill {kind}"
            x={px(pos.a)}
            y={py(pos.b)}
            width={p.width * frame.scale}
            height={p.height * frame.scale}
          />
          {#if kind !== 'reflective'}
            <rect
              x={px(pos.a)}
              y={py(pos.b)}
              width={p.width * frame.scale}
              height={p.height * frame.scale}
              fill="url(#pat-{kind})"
              class="no-pointer"
            />
          {/if}
          {#if p.width * frame.scale > (p.label || i18n.t(`surface.${p.preset}`)).length * 6.4 + 8 && p.height * frame.scale > 18}
            <text
              class="patch-label"
              x={px(pos.a + p.width / 2)}
              y={py(pos.b + p.height / 2) + 4}
              text-anchor="middle">{p.label || i18n.t(`surface.${p.preset}`)}</text
            >
          {/if}
        </g>
      {/each}

      {#each rings as r (r.key)}
        <circle class="ring" cx={px(r.a)} cy={py(r.b)} r="10" />
      {/each}
    </svg>
  {/if}
</div>

<style>
  .wall {
    width: 100%;
  }
  svg {
    display: block;
    touch-action: none;
  }
  .surface {
    fill: var(--surface);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .end {
    fill: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .patch {
    cursor: grab;
    outline: none;
    touch-action: none;
  }
  .fill {
    stroke: var(--ink-muted);
    stroke-width: 1;
  }
  .fill.reflective {
    fill: color-mix(in srgb, var(--accent) 14%, var(--surface));
  }
  .fill.absorptive,
  .fill.diffusive {
    fill: var(--surface);
  }
  .pat-line {
    stroke: var(--ink-muted);
    stroke-width: 1;
    opacity: 0.5;
  }
  .pat-dot {
    fill: var(--ink-muted);
    opacity: 0.6;
  }
  .no-pointer {
    pointer-events: none;
  }
  .patch-label {
    fill: var(--ink);
    font-size: 11px;
    pointer-events: none;
  }
  .patch.selected .fill,
  .patch:focus-visible .fill {
    stroke: var(--accent);
    stroke-width: 3;
  }
  .ring {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    pointer-events: none;
  }
</style>
