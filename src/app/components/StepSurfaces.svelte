<script lang="ts">
  import { untrack } from 'svelte';
  import { SURFACE_PRESETS, surfaceClass } from '../../engine/presets/surfaces';
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
  import MaterialIcon from './MaterialIcon.svelte';
  import WallElevation from './WallElevation.svelte';

  const project = $derived(workspace.project);
  const boundary = $derived(ui.boundary);
  const system = $derived(project.units);
  const dims = $derived(boundaryExtent(project, boundary));
  const materials = Object.keys(SURFACE_PRESETS) as Exclude<SurfacePresetId, 'custom'>[];
  const name = (b: BoundaryId) => i18n.t(`boundary.${b}`);

  let selectedId = $state<string | null>(null);
  // Changing surface clears the patch selection.
  $effect(() => {
    void ui.boundary;
    untrack(() => (selectedId = null));
  });

  const patches = $derived(project.surfaces.patches.filter((p) => p.boundary === boundary));
  const selected = $derived(patches.find((p) => p.id === selectedId) ?? null);
  const baseCertain = $derived(project.surfaces.baseCertainty[boundary] !== 'unknown');
  const currentBase = $derived(project.surfaces.base[boundary]);

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

  <section aria-labelledby="base-title">
    <h3 id="base-title">{i18n.t('surfaces.base', { name: name(boundary) })}</h3>
    <div class="materials" role="radiogroup" aria-labelledby="base-title">
      {#each materials as m (m)}
        <label class="tile material">
          <input
            type="radio"
            name="base-{boundary}"
            value={m}
            checked={baseCertain && currentBase === m}
            onchange={() => workspace.edit((p) => setBaseSurface(p, boundary, m))}
          />
          <span class="tile-body row">
            <MaterialIcon preset={m} />
            <span>
              <span class="tile-title">{i18n.t(`surface.${m}`)}</span>
              <span class="tile-sub">{i18n.t(`surface.class.${surfaceClass(m)}`)}</span>
            </span>
          </span>
        </label>
      {/each}
      <label class="tile material">
        <input
          type="radio"
          name="base-{boundary}"
          value="unknown"
          checked={!baseCertain}
          onchange={() => workspace.edit((p) => setBaseSurface(p, boundary, null))}
        />
        <span class="tile-body">
          <span class="tile-title">{i18n.t('surfaces.dontKnow')}</span>
          <span class="tile-sub"
            >{i18n.t('surfaces.dontKnowHelp', {
              material: i18n.t(`surface.${DEFAULT_BASE[boundary]}`),
            })}</span
          >
        </span>
      </label>
    </div>
  </section>

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
</div>

<style>
  .step {
    display: grid;
    gap: 20px;
  }
  h3 {
    font-size: 17px;
    margin-bottom: 6px;
  }
  .intro,
  .help {
    color: var(--ink-muted);
    font-size: 15px;
  }
  .hint {
    margin-top: 4px;
  }
  .seg-grid,
  .materials {
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
  .tile-body.row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .tile-title {
    display: block;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.25;
  }
  .tile-sub {
    display: block;
    color: var(--ink-muted);
    font-size: 13px;
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
    font-size: 15px;
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
    .materials,
    .grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
