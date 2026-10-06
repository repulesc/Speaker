<script lang="ts">
  import type { Certainty, GoalId } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import {
    activeVariant,
    cabinet,
    moveSeat,
    roomSize,
    setEarHeight,
    setSpeakerClearance,
    setSpeakerSpacing,
    setStandHeight,
    setToeIn,
  } from '../plan/placement';
  import { workspace } from '../session.svelte';
  import { PLACES, placeOf, setPlace } from '../state/place';
  import LengthInput from './LengthInput.svelte';
  import Segmented from './Segmented.svelte';

  /**
   * Where you listen (docs/ROADMAP_V9.md §2): the seat, how far the speakers may move, what matters
   * to you, and, folded, the exact positions for anyone who measured them (the plan is the usual
   * way to move things).
   */
  const project = $derived(workspace.project);
  const variant = $derived(activeVariant(project));
  const room = $derived(roomSize(project));
  const system = $derived(project.units);
  const cab = $derived(cabinet(project));
  const constraints = $derived(project.constraints);
  const fmt = (m: number) => formatLength(m, system, 'position', i18n.locale);

  /** How far each speaker may move from where it stands; "any" = anywhere in the room. */
  const ZONES = ['0.25', '0.5', '1', 'any'] as const;
  const zone = $derived(
    constraints.speakerZone === undefined ? 'any' : String(constraints.speakerZone),
  );
  function setZone(value: string) {
    workspace.edit((p) => {
      if (value === 'any') delete p.constraints.speakerZone;
      else p.constraints.speakerZone = Number(value);
    });
  }

  const GOALS: readonly GoalId[] = [
    'wide-stage',
    'precise-imaging',
    'flat-response',
    'deep-bass',
    'low-volume-listening',
  ];
  const wants = (id: GoalId) => (project.goals.weights[id] ?? 0) > 0;
  const conflict = $derived(wants('wide-stage') && wants('precise-imaging'));
  /** A chip on is "important"; off is "don't care" (the old middle step reads as on). */
  function toggleGoal(id: GoalId) {
    workspace.edit((p) => void (p.goals.weights[id] = wants(id) ? 0 : 2));
  }

  const measured = $derived(variant.speakers.left.certainty === 'measured');
  function setMeasured(on: boolean) {
    const certainty: Certainty = on ? 'measured' : 'estimated';
    workspace.edit((p) => {
      const v = activeVariant(p);
      v.speakers.left.certainty = certainty;
      v.speakers.right.certainty = certainty;
      v.listener.certainty = certainty;
    });
  }

  // Toe-in is a plain number of degrees.
  let toeText = $state('');
  let editingToe = $state(false);
  $effect(() => {
    const shown = String(variant.speakers.left.toeInDeg);
    if (!editingToe) toeText = shown;
  });
  function commitToe() {
    editingToe = false;
    const value = Number(toeText.replace(',', '.'));
    if (Number.isFinite(value)) workspace.edit((p) => void setToeIn(p, value));
    else toeText = String(variant.speakers.left.toeInDeg);
  }
</script>

<section class="form-group" id="setup-listen" aria-labelledby="setup-listen-title">
  <h2 id="setup-listen-title">{i18n.t('setup.listen.title')}</h2>

  <Segmented
    name="setup-place"
    label={i18n.t('setup.listen.place')}
    value={placeOf(project)}
    options={PLACES.map((d) => ({ value: d, label: i18n.t(`suggest.place.${d}`) }))}
    onchange={(d) => workspace.edit((p) => setPlace(p, d))}
  />

  {#if !constraints.speakersFixed}
    <Segmented
      name="setup-zone"
      label={i18n.t('setup.listen.zone')}
      value={zone}
      options={ZONES.map((z) => ({
        value: z,
        label: z === 'any' ? i18n.t('setup.listen.anywhere') : fmt(Number(z)),
      }))}
      onchange={setZone}
    />
  {/if}

  <div class="goals" id="setup-goals">
    <span class="field-label" id="setup-goals-label">{i18n.t('setup.listen.goals')}</span>
    <div class="chips" role="group" aria-labelledby="setup-goals-label">
      {#each GOALS as id (id)}
        <button type="button" class="chip" aria-pressed={wants(id)} onclick={() => toggleGoal(id)}
          >{i18n.t(`goals.goal.${id}.name`)}</button
        >
      {/each}
    </div>
    {#if conflict}<p class="help" role="status">{i18n.t('goals.conflict')}</p>{/if}
  </div>

  {#if room}
    <details class="fold" id="setup-exact">
      <summary>
        <span class="fold-title">{i18n.t('setup.listen.exact')}</span>
        <span class="fold-hint">{i18n.t('setup.listen.exactHint')}</span>
      </summary>
      <div class="fold-body">
        <label class="check">
          <input
            type="checkbox"
            checked={measured}
            onchange={(e) => setMeasured(e.currentTarget.checked)}
          />
          <span>{i18n.t('setup.room.measured')}</span>
        </label>
        <div class="grid">
          <LengthInput
            id="place-clearance"
            label={i18n.t('setup.listen.clearance')}
            value={variant.speakers.left.base.y - cab.d / 2}
            {system}
            limits={{ min: 0, max: room.L / 2 }}
            onchange={(v) => workspace.edit((p) => void setSpeakerClearance(p, v))}
          />
          <LengthInput
            id="place-spacing"
            label={i18n.t('setup.listen.spacing')}
            value={variant.speakers.right.base.x - variant.speakers.left.base.x}
            {system}
            limits={{ min: 0.3, max: room.W - cab.w }}
            onchange={(v) => workspace.edit((p) => void setSpeakerSpacing(p, v))}
          />
          <LengthInput
            id="place-seat"
            label={i18n.t('setup.listen.seat')}
            value={variant.listener.ears.y}
            {system}
            limits={{ min: 0.1, max: room.L - 0.1 }}
            onchange={(y) =>
              workspace.edit((p) => void moveSeat(p, { y }, { grid: false, keepCertainty: true }))}
          />
          <LengthInput
            id="place-ears"
            label={i18n.t('setup.listen.ears')}
            value={variant.listener.ears.z}
            {system}
            limits={{ min: 0.3, max: Math.min(2, room.H - 0.1) }}
            onchange={(v) => workspace.edit((p) => void setEarHeight(p, v))}
          />
          <LengthInput
            id="place-stand"
            label={i18n.t('setup.listen.stand')}
            value={variant.speakers.left.base.z}
            {system}
            limits={{ min: 0, max: Math.max(0, room.H - cab.h) }}
            onchange={(v) => workspace.edit((p) => void setStandHeight(p, v))}
          />
          <div class="toe">
            <label for="place-toe">{i18n.t('setup.listen.toeIn')}</label>
            <input
              id="place-toe"
              class="input"
              inputmode="decimal"
              bind:value={toeText}
              onfocus={() => (editingToe = true)}
              onblur={commitToe}
              onkeydown={(e) => e.key === 'Enter' && commitToe()}
            />
          </div>
        </div>
        <label class="check">
          <input
            type="checkbox"
            checked={constraints.keepSymmetric}
            onchange={(e) =>
              workspace.edit((p) => void (p.constraints.keepSymmetric = e.currentTarget.checked))}
          />
          <span>{i18n.t('setup.listen.mirror')}</span>
        </label>
      </div>
    </details>
  {/if}
</section>

<style>
  .goals {
    display: grid;
    gap: 8px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-items: end;
  }
  .grid :global(label) {
    font-size: var(--text-sm);
  }
  .toe {
    display: grid;
    gap: 4px;
  }
</style>
