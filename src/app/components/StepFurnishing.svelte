<script lang="ts">
  import type { Busyness, ObjectKind, ObjectMaterial } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import {
    activeVariant,
    addObject,
    moveObject,
    removeObject,
    resizeObject,
    roomSize,
    rotateObject,
  } from '../plan/placement';
  import { workspace } from '../session.svelte';
  import { ui } from '../ui.svelte';
  import LengthInput from './LengthInput.svelte';

  const project = $derived(workspace.project);
  const variant = $derived(activeVariant(project));
  const room = $derived(roomSize(project));
  const system = $derived(project.units);

  const kinds: ObjectKind[] = [
    'bed',
    'sofa',
    'armchair',
    'table',
    'cabinet',
    'shelf',
    'radiator',
    'other-speaker',
    'tv',
    'desk',
    'wardrobe',
    'bookcase',
    'piano',
    'rack',
    'plant',
    'fireplace',
    'lamp',
    'subwoofer',
    'custom',
  ];
  const MATERIALS: ObjectMaterial[] = ['hard', 'soft', 'absorbent'];
  const busyLevels: Busyness[] = ['bare', 'some', 'busy', 'very-busy'];
  const busyKey = { bare: 'bare', some: 'some', busy: 'busy', 'very-busy': 'veryBusy' } as const;

  /** What each kind of object does to the sound, shown as small tags. */
  const AFFECTS: Record<ObjectKind, ('room' | 'reflections' | 'view')[]> = {
    bed: ['room'],
    sofa: ['room'],
    armchair: ['room'],
    table: ['reflections', 'view'],
    cabinet: ['reflections', 'view'],
    shelf: ['room', 'view'],
    radiator: ['reflections'],
    'other-speaker': ['reflections', 'view'],
    tv: ['reflections', 'view'],
    desk: ['reflections', 'view'],
    wardrobe: ['reflections', 'view'],
    bookcase: ['room', 'view'],
    piano: ['reflections', 'view'],
    rack: ['reflections'],
    plant: ['room'],
    fireplace: ['reflections'],
    lamp: ['view'],
    subwoofer: ['reflections', 'view'],
    custom: ['room', 'reflections', 'view'],
  };

  const selectedId = $derived(ui.selection.kind === 'object' ? ui.selection.id : null);
  const selected = $derived(variant.objects.find((o) => o.id === selectedId) ?? null);
  const busyValue = $derived(variant.busyness?.value ?? null);
  const label = (o: { kind: ObjectKind; label?: string }) => o.label || i18n.t(`object.${o.kind}`);

  function add(kind: ObjectKind) {
    let id: string | null = null;
    workspace.edit((p) => void (id = addObject(p, kind)));
    if (id) ui.select({ kind: 'object', id });
  }

  function setBusy(value: Busyness | null) {
    workspace.edit((p) => {
      activeVariant(p).busyness =
        value === null ? { value: null, certainty: 'unknown' } : { value, certainty: 'estimated' };
    });
  }

  const patch = (id: string, change: (o: NonNullable<typeof selected>) => void) =>
    workspace.edit((p) => {
      const o = activeVariant(p).objects.find((x) => x.id === id);
      if (o) change(o);
    });
</script>

<div class="step">
  <div>
    <h2>{i18n.t('furnishing.title')}</h2>
    <p class="intro">{i18n.t('furnishing.intro')}</p>
  </div>

  <fieldset>
    <legend>{i18n.t('furnishing.busy.legend')}</legend>
    <p class="help">
      {variant.objects.length > 0
        ? i18n.t('furnishing.busy.combined')
        : i18n.t('furnishing.busy.help')}
    </p>
    <div class="seg" role="radiogroup" aria-label={i18n.t('furnishing.busy.legend')}>
      {#each busyLevels as level (level)}
        <label>
          <input
            type="radio"
            name="busyness"
            value={level}
            checked={busyValue === level}
            onchange={() => setBusy(level)}
          />
          <span>{i18n.t(`furnishing.busy.${busyKey[level]}`)}</span>
        </label>
      {/each}
    </div>
    <button
      type="button"
      class="btn quiet link"
      onclick={() => setBusy(null)}
      disabled={busyValue === null}>{i18n.t('field.certainty.unknown')}</button
    >
  </fieldset>

  <section aria-labelledby="objects-title">
    <h3 id="objects-title">{i18n.t('furnishing.objects.title')}</h3>
    {#if !room}
      <p class="help">{i18n.t('furnishing.needRoom')}</p>
      <button type="button" class="btn" onclick={() => (ui.step = 'room')}
        >{i18n.t('steps.room')}</button
      >
    {:else}
      <p class="help">{i18n.t('furnishing.objects.intro')}</p>
      <div class="adds">
        {#each kinds as kind (kind)}
          <button type="button" class="btn" onclick={() => add(kind)}
            >+ {i18n.t(`object.${kind}`)}</button
          >
        {/each}
      </div>

      {#if variant.objects.length === 0}
        <p class="help">{i18n.t('furnishing.objects.empty')}</p>
      {:else}
        <ul class="olist">
          {#each variant.objects as o (o.id)}
            <li>
              <button
                type="button"
                class="btn quiet"
                aria-pressed={o.id === selectedId}
                onclick={() => ui.select({ kind: 'object', id: o.id })}>{label(o)}</button
              >
            </li>
          {/each}
        </ul>
      {/if}

      {#if selected && room}
        {@const id = selected.id}
        <div class="card editor">
          <div class="tags">
            <span class="tags-label">{i18n.t('furnishing.affects')}:</span>
            {#each AFFECTS[selected.kind] as tag (tag)}
              <span class="tag">{i18n.t(`furnishing.tag.${tag}`)}</span>
            {/each}
          </div>
          <div class="field">
            <label for="object-name">{i18n.t('furnishing.name')}</label>
            <input
              id="object-name"
              class="input"
              maxlength="60"
              placeholder={i18n.t(`object.${selected.kind}`)}
              value={selected.label ?? ''}
              onchange={(e) =>
                patch(id, (o) => void (o.label = e.currentTarget.value.trim() || undefined))}
            />
          </div>
          <div class="grid2">
            <LengthInput
              id="object-x"
              label={i18n.t('furnishing.fromLeft')}
              value={selected.position.x}
              {system}
              limits={{ min: 0, max: room.W - selected.size.x }}
              onchange={(x) =>
                workspace.edit((p) => void moveObject(p, id, { x }, { grid: false }))}
            />
            <LengthInput
              id="object-y"
              label={i18n.t('furnishing.fromFront')}
              value={selected.position.y}
              {system}
              limits={{ min: 0, max: room.L - selected.size.y }}
              onchange={(y) =>
                workspace.edit((p) => void moveObject(p, id, { y }, { grid: false }))}
            />
            <LengthInput
              id="object-w"
              label={i18n.t('furnishing.width')}
              value={selected.size.x}
              {system}
              limits={{ min: 0.05, max: room.W }}
              onchange={(x) => workspace.edit((p) => void resizeObject(p, id, { x }))}
            />
            <LengthInput
              id="object-d"
              label={i18n.t('furnishing.depth')}
              value={selected.size.y}
              {system}
              limits={{ min: 0.05, max: room.L }}
              onchange={(y) => workspace.edit((p) => void resizeObject(p, id, { y }))}
            />
            <LengthInput
              id="object-h"
              label={i18n.t('furnishing.height')}
              value={selected.size.z}
              {system}
              limits={{ min: 0.05, max: room.H }}
              onchange={(z) => workspace.edit((p) => void resizeObject(p, id, { z }))}
            />
          </div>
          <div class="field">
            <label for="object-material">{i18n.t('furnishing.material.label')}</label>
            <select
              id="object-material"
              class="input"
              value={selected.material ?? (selected.hard ? 'hard' : 'soft')}
              onchange={(e) =>
                patch(id, (o) => {
                  o.material = e.currentTarget.value as ObjectMaterial;
                  o.hard = o.material === 'hard';
                })}
            >
              {#each MATERIALS as m (m)}
                <option value={m}>{i18n.t(`furnishing.material.${m}`)}</option>
              {/each}
            </select>
          </div>
          <div class="actions">
            <button
              type="button"
              class="btn"
              onclick={() => workspace.edit((p) => void rotateObject(p, id))}
              >{i18n.t('furnishing.rotate')}</button
            >
            <button
              type="button"
              class="btn"
              onclick={() => {
                workspace.edit((p) => removeObject(p, id));
                ui.select({ kind: 'none' });
              }}>{i18n.t('furnishing.remove')}</button
            >
          </div>
        </div>
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
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    display: grid;
    gap: 6px;
  }
  legend {
    padding: 0;
    font-weight: 600;
  }
  .seg {
    justify-self: start;
    max-width: 100%;
    flex-wrap: wrap;
  }
  .link {
    justify-self: start;
    min-height: 36px;
    color: var(--ink-muted);
    text-decoration: underline;
  }
  .adds,
  .olist {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .olist .btn[aria-pressed='true'] {
    border-color: var(--accent);
    color: var(--accent);
  }
  .editor {
    display: grid;
    gap: 12px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 14px;
  }
  .tags-label {
    color: var(--ink-muted);
  }
  .tag {
    padding: 2px 8px;
    border: 1px solid var(--grid);
    border-radius: 999px;
    background: var(--bg);
  }
  .grid2 {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .field {
    display: grid;
    gap: 4px;
  }
  .field label {
    font-size: 15px;
    font-weight: 600;
  }
  .input {
    font-family: var(--font-sans);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  @media (max-width: 420px) {
    .grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
