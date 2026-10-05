<script lang="ts">
  import { untrack } from 'svelte';
  import { SURFACE_PRESETS } from '../../engine/presets/surfaces';
  import type { BoundaryId, SurfacePresetId } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import {
    addPatch,
    BOUNDARIES,
    boundaryExtent,
    DEFAULT_BASE,
    isWall,
    movePatch,
    PATCH_KINDS_FOR,
    removePatch,
    resizePatch,
    setBaseSurface,
    type PatchKind,
  } from '../plan/patches';
  import { workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import LengthInput from './LengthInput.svelte';
  import WallElevation from './WallElevation.svelte';

  const project = $derived(workspace.project);
  const boundary = $derived(ui.boundary);
  const system = $derived(project.units);
  const dims = $derived(boundaryExtent(project, boundary));
  const materials = Object.keys(SURFACE_PRESETS) as Exclude<SurfacePresetId, 'custom'>[];
  const name = (b: BoundaryId) => i18n.t(`boundary.${b}`);

  // ── The room's own surfaces, as three short choices ───────────────────────
  const WALLS: readonly BoundaryId[] = ['front', 'back', 'left', 'right'];
  /** Most common first (owner feedback V4). Rare finishes go on a wall as "something on it". */
  const COMMON: Record<'wall' | 'floor' | 'ceiling', Exclude<SurfacePresetId, 'custom'>[]> = {
    wall: ['plaster-brick', 'plaster-concrete', 'gypsum-stud', 'plaster-lath', 'glass'],
    floor: ['wood-floor', 'carpet-underlay', 'carpet-heavy', 'plaster-concrete'],
    ceiling: ['plaster-brick', 'plaster-concrete', 'gypsum-stud', 'plaster-lath'],
  };
  const kindOf = (b: BoundaryId) =>
    b === 'floor' ? 'floor' : b === 'ceiling' ? 'ceiling' : 'wall';
  /** The list for a row, with any less common finish already chosen kept in it. */
  function choicesFor(b: BoundaryId, ids: readonly BoundaryId[]) {
    const list: SurfacePresetId[] = [...COMMON[kindOf(b)]];
    for (const id of ids) {
      const current = project.surfaces.base[id];
      if (current !== 'custom' && !list.includes(current)) list.push(current);
    }
    return list;
  }
  /** One value for a row: the shared finish, "unknown", or "mixed" when the walls differ. */
  function shared(ids: readonly BoundaryId[]): string {
    const values = ids.map((b) =>
      project.surfaces.baseCertainty[b] === 'unknown' ? 'unknown' : project.surfaces.base[b],
    );
    return values.every((v) => v === values[0]) ? values[0]! : 'mixed';
  }
  const allWallsSame = $derived(shared(WALLS) !== 'mixed');
  function setAll(ids: readonly BoundaryId[], value: string) {
    workspace.edit((p) => {
      for (const b of ids)
        setBaseSurface(p, b, value === 'unknown' ? null : (value as SurfacePresetId));
    });
  }

  let selectedId = $state<string | null>(null);
  // Changing surface clears the patch selection.
  $effect(() => {
    void ui.boundary;
    untrack(() => (selectedId = null));
  });

  const patches = $derived(project.surfaces.patches.filter((p) => p.boundary === boundary));
  const selected = $derived(patches.find((p) => p.id === selectedId) ?? null);

  function add(kind: PatchKind) {
    let id: string | null = null;
    workspace.edit((p) => void (id = addPatch(p, boundary, kind)));
    selectedId = id;
  }
  const uKey = $derived(boundary === 'left' || boundary === 'right' ? 'fromFront' : 'fromLeft');
  const vKey = $derived(isWall(boundary) ? 'height' : 'fromFront');
</script>

<div class="step">
  <div>
    <h2>{i18n.t('surfaces.title')}</h2>
    <p class="intro">{i18n.t('surfaces.intro')}</p>
  </div>

  <!-- What the room is made of: three short choices, most common first (owner feedback V4). -->
  <div class="rows">
    {#each [{ key: 'walls', ids: WALLS }, { key: 'floor', ids: ['floor'] }, { key: 'ceiling', ids: ['ceiling'] }] as const as row (row.key)}
      {@const value = shared(row.ids)}
      <div class="row-item">
        <label for="surface-{row.key}">{i18n.t(`surfaces.row.${row.key}`)}</label>
        <select
          id="surface-{row.key}"
          class="select"
          {value}
          onchange={(e) => setAll(row.ids, e.currentTarget.value)}
        >
          {#if value === 'mixed'}<option value="mixed" disabled>{i18n.t('surfaces.mixed')}</option
            >{/if}
          {#each choicesFor(row.ids[0]!, row.ids) as m (m)}
            <option value={m}>{i18n.t(`surface.${m}`)}</option>
          {/each}
          <option value="unknown"
            >{i18n.t('surfaces.dontKnowShort', {
              material: i18n.t(`surface.${DEFAULT_BASE[row.ids[0]!]}`),
            })}</option
          >
        </select>
      </div>
    {/each}
  </div>

  <details class="more" open={!allWallsSame}>
    <summary>{i18n.t('surfaces.eachWall')}</summary>
    <div class="rows">
      {#each WALLS as b (b)}
        {@const value = shared([b])}
        <div class="row-item">
          <label for="surface-{b}">{name(b)}</label>
          <select
            id="surface-{b}"
            class="select"
            {value}
            onchange={(e) => setAll([b], e.currentTarget.value)}
          >
            {#each choicesFor(b, [b]) as m (m)}
              <option value={m}>{i18n.t(`surface.${m}`)}</option>
            {/each}
            <option value="unknown"
              >{i18n.t('surfaces.dontKnowShort', {
                material: i18n.t(`surface.${DEFAULT_BASE[b]}`),
              })}</option
            >
          </select>
        </div>
      {/each}
    </div>
  </details>

  <details class="more">
    <summary>
      <span>{i18n.t('surfaces.addThings')}</span>
      <span class="more-hint">{i18n.t('surfaces.addThingsHint')}</span>
    </summary>
    <div class="seg-grid" role="radiogroup" aria-label={i18n.t('surfaces.pick')}>
      {#each BOUNDARIES as b (b)}
        <label class="tile">
          <input
            type="radio"
            name="boundary"
            value={b}
            checked={boundary === b}
            onchange={() => (ui.boundary = b)}
          />
          <span class="tile-body">
            <span class="tile-title">{name(b)}</span>
            <span class="tile-sub">{i18n.t(`surface.${project.surfaces.base[b]}`)}</span>
          </span>
        </label>
      {/each}
    </div>

    <section aria-labelledby="patch-title">
      <h3 id="patch-title">{i18n.t('surfaces.patches.title', { name: name(boundary) })}</h3>
      {#if !dims}
        <p class="help">{i18n.t('surfaces.needRoom')}</p>
        <button type="button" class="btn" onclick={() => (ui.step = 'room')}
          >{i18n.t('steps.room')}</button
        >
      {:else}
        <p class="help">{i18n.t('surfaces.patches.intro')}</p>
        <div class="adds">
          {#each PATCH_KINDS_FOR(boundary) as kind (kind)}
            <button type="button" class="btn" onclick={() => add(kind)}
              >+ {i18n.t(`surfaces.patches.kind.${kind}`)}</button
            >
          {/each}
        </div>

        <WallElevation {boundary} bind:selectedId />
        <p class="help hint">{i18n.t('surfaces.reflectionHint')}</p>

        {#if patches.length === 0}
          <p class="help">{i18n.t('surfaces.patches.empty')}</p>
        {/if}

        {#if selected}
          {@const id = selected.id}
          <div class="card editor">
            <div class="grid2">
              <div class="field">
                <label for="patch-preset">{i18n.t('surfaces.patches.material')}</label>
                <select
                  id="patch-preset"
                  class="input"
                  value={selected.preset}
                  onchange={(e) =>
                    workspace.edit((p) => {
                      const patch = p.surfaces.patches.find((x) => x.id === id);
                      if (patch) patch.preset = e.currentTarget.value as SurfacePresetId;
                    })}
                >
                  {#each materials as m (m)}
                    <option value={m}>{i18n.t(`surface.${m}`)}</option>
                  {/each}
                </select>
              </div>
              <div class="field">
                <label for="patch-label">{i18n.t('surfaces.patches.label')}</label>
                <input
                  id="patch-label"
                  class="input"
                  maxlength="60"
                  value={selected.label ?? ''}
                  onchange={(e) =>
                    workspace.edit((p) => {
                      const patch = p.surfaces.patches.find((x) => x.id === id);
                      if (patch) patch.label = e.currentTarget.value.trim() || undefined;
                    })}
                />
              </div>
            </div>
            {#if dims}
              <div class="grid2">
                <LengthInput
                  id="patch-u"
                  label={i18n.t(`surfaces.patches.u.${uKey}`)}
                  value={selected.u}
                  {system}
                  limits={{ min: 0, max: dims.span - selected.width }}
                  onchange={(u) =>
                    workspace.edit((p) => void movePatch(p, id, { u }, { grid: false }))}
                />
                <LengthInput
                  id="patch-v"
                  label={i18n.t(`surfaces.patches.v.${vKey}`)}
                  value={selected.v}
                  {system}
                  limits={{ min: 0, max: dims.extent - selected.height }}
                  onchange={(v) =>
                    workspace.edit((p) => void movePatch(p, id, { v }, { grid: false }))}
                />
                <LengthInput
                  id="patch-w"
                  label={i18n.t('surfaces.patches.width')}
                  value={selected.width}
                  {system}
                  limits={{ min: 0.05, max: dims.span }}
                  onchange={(width) => workspace.edit((p) => void resizePatch(p, id, { width }))}
                />
                <LengthInput
                  id="patch-h"
                  label={i18n.t(
                    isWall(boundary) ? 'surfaces.patches.height' : 'surfaces.patches.depth',
                  )}
                  value={selected.height}
                  {system}
                  limits={{ min: 0.05, max: dims.extent }}
                  onchange={(height) => workspace.edit((p) => void resizePatch(p, id, { height }))}
                />
              </div>
            {/if}
            <button
              type="button"
              class="btn"
              onclick={() => {
                workspace.edit((p) => removePatch(p, id));
                selectedId = null;
              }}>{i18n.t('surfaces.patches.remove')}</button
            >
          </div>
        {:else if patches.length > 0}
          <ul class="plist">
            {#each patches as p (p.id)}
              <li>
                <button type="button" class="btn quiet" onclick={() => (selectedId = p.id)}
                  >{p.label || i18n.t(`surface.${p.preset}`)}</button
                >
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </section>
  </details>
</div>

<style>
  .rows {
    display: grid;
    border-radius: var(--radius-md);
    background: var(--surface);
  }
  .row-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 4px 8px 4px 16px;
  }
  .row-item + .row-item {
    border-top: 1px solid var(--grid);
  }
  .row-item label {
    flex: 1 1 auto;
    min-width: 0;
    font-size: var(--text-md);
    overflow-wrap: anywhere;
  }
  .select {
    flex: 0 1 62%;
    min-width: 0;
    max-width: 62%;
    min-height: 40px;
    padding: 0 28px 0 10px;
    border: 0;
    border-radius: 9px;
    background: var(--fill)
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E")
      no-repeat right 10px center;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    text-overflow: ellipsis;
    appearance: none;
    cursor: pointer;
  }
  @media (pointer: coarse) {
    .select {
      min-height: 44px;
    }
  }
  .more {
    border-top: 1px solid var(--grid);
  }
  .more > summary {
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding: 12px 0;
    color: var(--accent);
    font-size: var(--text-md);
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }
  .more > summary::-webkit-details-marker {
    display: none;
  }
  .more-hint {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    font-weight: 400;
  }
  .more[open] > :not(summary) {
    margin-bottom: 16px;
  }
  .step > * {
    min-width: 0;
  }
  .step {
    display: grid;
    gap: 20px;
  }
  h3 {
    font-size: var(--text-md);
    margin-bottom: 6px;
  }
  .intro,
  .help {
    color: var(--ink-muted);
    font-size: var(--text-md);
  }
  .hint {
    margin-top: 4px;
  }
  .seg-grid {
    display: grid;
    gap: 6px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tile {
    position: relative;
    display: block;
    border: 1px solid var(--grid);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
  }
  .tile input {
    position: absolute;
    opacity: 0;
    inset: 0;
    margin: 0;
    cursor: pointer;
  }
  .tile:has(input:checked) {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  .tile:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .tile-body {
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding: 8px 10px;
  }
  .tile-title {
    display: block;
    font-size: var(--text-md);
    font-weight: 600;
    line-height: 1.25;
  }
  .tile-sub {
    display: block;
    color: var(--ink-muted);
    font-size: var(--text-sm);
    line-height: 1.3;
  }
  .adds {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .editor {
    display: grid;
    gap: 12px;
    margin-top: 10px;
  }
  .grid2 {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .field {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .field label {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .input {
    font-family: var(--font-sans);
  }
  .plist {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  @media (max-width: 420px) {
    .seg-grid,
    .grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
