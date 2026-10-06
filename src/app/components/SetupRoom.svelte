<script lang="ts">
  import type { Busyness, OutOfModelFeature } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { activeVariant } from '../plan/placement';
  import { workspace } from '../session.svelte';
  import { ROOM_LIMITS, USUAL_ROOM_RANGE } from '../state/limits';
  import { DEFAULT_BASE, MATERIALS, materialOf, setMaterial, type Part } from '../state/surfaces';
  import LengthField from './LengthField.svelte';
  import Segmented from './Segmented.svelte';
  import SelectRow from './SelectRow.svelte';

  /**
   * The room (docs/ROADMAP_V9.md §2): its size, what it is made of, how full it is, and whether the
   * closed-box model fits it. Each answer changes the result; nothing else is asked.
   */
  const project = $derived(workspace.project);
  const room = $derived(project.room);
  const system = $derived(project.units);
  const dims = ['width', 'length', 'height'] as const;
  const known = $derived(dims.filter((d) => room[d].value !== null));
  const measured = $derived(
    known.length > 0 && known.every((d) => room[d].certainty === 'measured'),
  );
  /** One switch instead of "how sure are you" under every number. */
  function setMeasured(on: boolean) {
    workspace.edit((p) => {
      for (const d of dims) {
        const v = p.room[d];
        if (v.value !== null) v.certainty = on ? 'measured' : 'estimated';
      }
    });
  }

  const PARTS: readonly Part[] = ['walls', 'floor', 'ceiling'];
  const assumed = (part: Part) =>
    i18n.t('setup.room.assume', {
      material: i18n.t(`surface.${DEFAULT_BASE[part === 'walls' ? 'front' : part]}`).toLowerCase(),
    });

  const BUSY: readonly Busyness[] = ['bare', 'some', 'busy', 'very-busy'];
  const busyKey = { bare: 'bare', some: 'some', busy: 'busy', 'very-busy': 'veryBusy' } as const;
  const busy = $derived(activeVariant(project).busyness?.value ?? undefined);

  /** The model assumes a closed box: say when the room is not one (it lowers how sure we are). */
  const SHAPES: readonly OutOfModelFeature[] = ['open-plan-connection', 'non-rectangular'];
  function toggleShape(feature: OutOfModelFeature, on: boolean) {
    workspace.edit((p) => {
      const rest = p.room.outOfModel.filter((f) => f !== feature);
      p.room.outOfModel = on ? [...rest, feature] : rest;
    });
  }
</script>

<section class="form-group" id="setup-room" aria-labelledby="setup-room-title">
  <h2 id="setup-room-title">{i18n.t('setup.room.title')}</h2>
  <div class="sizes">
    {#each dims as dim (dim)}
      <LengthField
        id="room-{dim}"
        label={i18n.t(`room.${dim}`)}
        kind="room"
        value={room[dim]}
        {system}
        limits={ROOM_LIMITS[dim]}
        usual={USUAL_ROOM_RANGE[dim]}
        onchange={(next) =>
          workspace.edit(
            (p) =>
              void (p.room[dim] =
                measured && next.value !== null ? { ...next, certainty: 'measured' } : next),
          )}
      />
    {/each}
  </div>
  {#if known.length > 0}
    <label class="check">
      <input
        type="checkbox"
        checked={measured}
        onchange={(e) => setMeasured(e.currentTarget.checked)}
      />
      <span>{i18n.t('setup.room.measured')}</span>
    </label>
  {/if}

  <div class="rows">
    {#each PARTS as part (part)}
      <SelectRow
        id="setup-{part}"
        label={i18n.t(`setup.room.${part}`)}
        value={materialOf(project, part) ?? ''}
        unset={assumed(part)}
        options={MATERIALS[part].map((m) => ({ value: m, label: i18n.t(`surface.${m}`) }))}
        onchange={(v) =>
          workspace.edit((p) => setMaterial(p, part, v === '' ? null : (v as never)))}
      />
    {/each}
  </div>

  <Segmented
    name="setup-busy"
    label={i18n.t('setup.room.busy')}
    value={busy}
    options={BUSY.map((b) => ({ value: b, label: i18n.t(`setup.room.busyLevel.${busyKey[b]}`) }))}
    onchange={(value) =>
      workspace.edit((p) => void (activeVariant(p).busyness = { value, certainty: 'estimated' }))}
  />

  <div class="shape">
    {#each SHAPES as feature (feature)}
      <label class="check">
        <input
          type="checkbox"
          checked={room.outOfModel.includes(feature)}
          onchange={(e) => toggleShape(feature, e.currentTarget.checked)}
        />
        <span>{i18n.t(`setup.room.shape.${feature}`)}</span>
      </label>
    {/each}
    <p class="help">{i18n.t('setup.room.shape.help')}</p>
  </div>
</section>

<style>
  .sizes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .sizes :global(label) {
    font-size: var(--text-sm);
  }
  .shape {
    display: grid;
    gap: 2px;
  }
  .shape .help {
    padding-left: 28px;
  }
</style>
