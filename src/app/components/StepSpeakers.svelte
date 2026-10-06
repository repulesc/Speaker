<script lang="ts">
  import type { Certainty, EnclosureType, Known, SpeakerProfile } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { downloadText } from '../download';
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
  import { showNotice, workspace } from '../session.svelte';
  import { SIZE_LIMITS } from '../state/limits';
  import {
    parseSpeakerJson,
    seatMode,
    serializeSpeaker,
    setSeatMode,
    setSeatRange,
    speakerFileName,
    type SeatMode,
  } from '../state/speaker';
  import { ui } from '../ui.svelte';
  import CertaintyChips from './CertaintyChips.svelte';
  import LengthField from './LengthField.svelte';
  import LengthInput from './LengthInput.svelte';
  import SpeakerQuestions from './SpeakerQuestions.svelte';

  /** Inside a "More detail" group of Set up (V8): no title, and the questions are asked above. */
  let { embedded = false }: { embedded?: boolean } = $props();
  const project = $derived(workspace.project);
  const speaker = $derived(project.speaker);
  const variant = $derived(activeVariant(project));
  const room = $derived(roomSize(project));
  const system = $derived(project.units);
  const cab = $derived(cabinet(project));
  const constraints = $derived(project.constraints);

  const enclosures: EnclosureType[] = [
    'sealed',
    'ported',
    'passive-radiator',
    'open-baffle',
    'unknown',
  ];
  const modes: SeatMode[] = ['free', 'range', 'fixed'];
  /** Speaker zone choices in metres; null = anywhere (docs/DESIGN_BRIEF_V4.md: one number). */
  const ZONES = [0.25, 0.5, 1, null] as const;
  const fmtShort = (m: number) => formatLength(m, system, 'position', i18n.locale);

  let fileInput = $state<HTMLInputElement>();

  /** A categorical answer is the user's own ('measured'); "don't know" clears it. */
  function setKnown<K extends 'enclosure'>(key: K, value: string) {
    workspace.edit((p) => {
      const known = (
        value === 'unknown'
          ? { value: null, certainty: 'unknown' }
          : { value, certainty: 'measured' }
      ) as Known<never>;
      (p.speaker as unknown as Record<string, Known<unknown>>)[key] = known;
    });
  }

  const editSpeaker = (change: (s: SpeakerProfile) => void) =>
    workspace.edit((p) => change(p.speaker));

  function toggleDsp(key: 'treble' | 'bass', on: boolean) {
    editSpeaker((s) => {
      if (on)
        s.dsp[key] = {
          minDb: key === 'treble' ? -3 : -6,
          maxDb: key === 'treble' ? 3 : 6,
          stepDb: 0.5,
        };
      else delete s.dsp[key];
    });
  }

  function setPlacementCertainty(certainty: Certainty) {
    workspace.edit((p) => {
      const v = activeVariant(p);
      v.speakers.left.certainty = certainty;
      v.speakers.right.certainty = certainty;
      v.listener.certainty = certainty;
    });
  }

  const placementCertainty = $derived<Certainty>(variant.speakers.left.certainty ?? 'estimated');

  // Toe-in and low-frequency limit are plain numbers typed in their own units.
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

  let f6Text = $state('');
  let editingF6 = $state(false);
  $effect(() => {
    const v = speaker.lowFrequencyMinus6dB.value;
    if (!editingF6) f6Text = v === null ? '' : String(Math.round(v));
  });
  function commitF6() {
    editingF6 = false;
    const value = Number(f6Text.replace(',', '.'));
    if (f6Text.trim() === '') {
      editSpeaker((s) => void (s.lowFrequencyMinus6dB = { value: null, certainty: 'unknown' }));
    } else if (Number.isFinite(value) && value >= 10 && value <= 500) {
      editSpeaker((s) => void (s.lowFrequencyMinus6dB = { value, certainty: 'estimated' }));
    } else {
      f6Text = String(Math.round(speaker.lowFrequencyMinus6dB.value ?? 50));
    }
  }

  // ── Profile files ───────────────────────────────────────────────────────

  function saveProfile() {
    const s = $state.snapshot(speaker) as SpeakerProfile;
    downloadText(speakerFileName(s), serializeSpeaker(s));
  }

  async function loadProfile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const result =
      file.size > SIZE_LIMITS.fileBytes
        ? ({ ok: false, reason: 'tooBig' } as const)
        : parseSpeakerJson(await file.text());
    if (!result.ok) {
      showNotice(
        'error',
        i18n.t(`speakers.file.error.${result.reason}`, {
          detail: 'detail' in result ? (result.detail ?? '') : '',
        }),
      );
      return;
    }
    editSpeaker((s) => Object.assign(s, result.speaker));
    showNotice('success', i18n.t('speakers.file.loaded'));
  }

  const range = $derived<[number, number]>(constraints.listenerYRange ?? [0.5, 4.7]);
</script>

<div class="step">
  {#if !embedded}
    <div>
      <h2>{i18n.t('speakers.title')}</h2>
      <p class="intro">{i18n.t('speakers.intro')}</p>
    </div>
  {/if}

  {#if !embedded}<SpeakerQuestions />{/if}

  {#if !room}
    <section class="group">
      <p class="help">{i18n.t('furnishing.needRoom')}</p>
      <button type="button" class="btn" onclick={() => (ui.step = 'room')}
        >{i18n.t('steps.room')}</button
      >
    </section>
  {:else}
    <section class="group" aria-labelledby="placement-title">
      <div>
        <h3 id="placement-title">{i18n.t('speakers.placement.title')}</h3>
        <p class="help">{i18n.t('speakers.placement.help')}</p>
      </div>
      <div class="questions">
        <LengthInput
          id="place-clearance"
          label={i18n.t('speakers.placement.clearance')}
          value={variant.speakers.left.base.y - cab.d / 2}
          {system}
          limits={{ min: 0, max: room.L / 2 }}
          onchange={(v) => workspace.edit((p) => void setSpeakerClearance(p, v))}
        />
        <LengthInput
          id="place-spacing"
          label={i18n.t('speakers.placement.spacing')}
          value={variant.speakers.right.base.x - variant.speakers.left.base.x}
          {system}
          limits={{ min: 0.3, max: room.W - cab.w }}
          onchange={(v) => workspace.edit((p) => void setSpeakerSpacing(p, v))}
        />
        <LengthInput
          id="place-stand"
          label={i18n.t('speakers.placement.stand')}
          value={variant.speakers.left.base.z}
          {system}
          limits={{ min: 0, max: Math.max(0, room.H - cab.h) }}
          onchange={(v) => workspace.edit((p) => void setStandHeight(p, v))}
        />
      </div>
    </section>

    <section class="group" aria-labelledby="limits-title">
      <div>
        <h3 id="limits-title">{i18n.t('speakers.limits.title')}</h3>
        <p class="help">{i18n.t('speakers.limits.help')}</p>
      </div>

      <fieldset>
        <legend>{i18n.t('speakers.limits.seat.legend')}</legend>
        <div class="stack">
          {#each modes as mode (mode)}
            <label class="choice">
              <input
                type="radio"
                name="seat-mode"
                value={mode}
                checked={seatMode(project) === mode}
                onchange={() => workspace.edit((p) => setSeatMode(p, mode))}
              />
              {i18n.t(`speakers.limits.seat.${mode}`)}
            </label>
          {/each}
        </div>
        {#if seatMode(project) === 'range'}
          <div class="grid2">
            <LengthInput
              id="seat-from"
              label={i18n.t('speakers.limits.seat.from')}
              value={range[0]}
              {system}
              limits={{ min: 0.5, max: room.L - 0.3 }}
              onchange={(v) => workspace.edit((p) => void setSeatRange(p, v, range[1]))}
            />
            <LengthInput
              id="seat-to"
              label={i18n.t('speakers.limits.seat.to')}
              value={range[1]}
              {system}
              limits={{ min: 0.5, max: room.L - 0.3 }}
              onchange={(v) => workspace.edit((p) => void setSeatRange(p, range[0], v))}
            />
          </div>
        {/if}
      </fieldset>

      {#if !constraints.speakersFixed}
        <fieldset>
          <legend>{i18n.t('speakers.limits.zone.legend')}</legend>
          <p class="help">{i18n.t('speakers.limits.zone.help')}</p>
          <div
            class="seg zone"
            role="radiogroup"
            aria-label={i18n.t('speakers.limits.zone.legend')}
          >
            {#each ZONES as zone (zone ?? 'any')}
              <label>
                <input
                  type="radio"
                  name="speaker-zone"
                  checked={constraints.speakerZone === (zone ?? undefined)}
                  onchange={() =>
                    workspace.edit((p) => {
                      if (zone === null) delete p.constraints.speakerZone;
                      else p.constraints.speakerZone = zone;
                    })}
                />
                {zone === null ? i18n.t('speakers.limits.zone.any') : fmtShort(zone)}
              </label>
            {/each}
          </div>
        </fieldset>
      {/if}

      <label class="choice">
        <input
          type="checkbox"
          checked={constraints.speakersFixed}
          onchange={(e) =>
            workspace.edit((p) => void (p.constraints.speakersFixed = e.currentTarget.checked))}
        />
        {i18n.t('speakers.limits.fixed')}
      </label>

      <div class="field">
        <label for="limit-reach">{i18n.t('speakers.limits.reach')}</label>
        <input
          id="limit-reach"
          type="range"
          min="0.1"
          max={Math.max(0.5, room.L / 2)}
          step="0.05"
          value={constraints.maxSpeakerDistanceFromWall.value ?? 1.5}
          oninput={(e) =>
            workspace.edit(
              (p) =>
                void (p.constraints.maxSpeakerDistanceFromWall = {
                  value: Number(e.currentTarget.value),
                  certainty: 'estimated',
                }),
              { coalesce: 'reach' },
            )}
        />
        <LengthInput
          id="limit-reach-value"
          label={i18n.t('speakers.limits.reachValue')}
          value={constraints.maxSpeakerDistanceFromWall.value ?? 1.5}
          {system}
          limits={{ min: 0.1, max: Math.max(0.5, room.L / 2) }}
          onchange={(v) =>
            workspace.edit(
              (p) =>
                void (p.constraints.maxSpeakerDistanceFromWall = {
                  value: v,
                  certainty: 'estimated',
                }),
            )}
        />
      </div>
    </section>
  {/if}

  <details class="more" bind:open={ui.speakerDetails}>
    <summary>
      <span class="more-title">{i18n.t('speakers.more.summary')}</span>
      <span class="more-hint">{i18n.t('speakers.more.hint')}</span>
    </summary>
    <!-- Rendered only when open: the room sheet shows every group at once, and these fields
         (Width, Height…) would otherwise share names with the room's. -->
    {#if ui.speakerDetails}
      <div class="more-body">
        {#if room}
          <section class="group" aria-labelledby="seat-title">
            <h3 id="seat-title">{i18n.t('speakers.placement.seatTitle')}</h3>
            <div class="field">
              <span class="label">{i18n.t('speakers.placement.certainty')}</span>
              <CertaintyChips
                name="placement-certainty"
                value={placementCertainty}
                onchange={setPlacementCertainty}
              />
            </div>
            <div class="grid2">
              <LengthInput
                id="place-seat"
                label={i18n.t('speakers.placement.seat')}
                value={variant.listener.ears.y}
                {system}
                limits={{ min: 0.1, max: room.L - 0.1 }}
                onchange={(y) =>
                  workspace.edit(
                    (p) => void moveSeat(p, { y }, { grid: false, keepCertainty: true }),
                  )}
              />
              <LengthInput
                id="place-ears"
                label={i18n.t('speakers.placement.ears')}
                value={variant.listener.ears.z}
                {system}
                limits={{ min: 0.3, max: Math.min(2, room.H - 0.1) }}
                onchange={(v) => workspace.edit((p) => void setEarHeight(p, v))}
              />
              <div class="field">
                <label for="place-toe">{i18n.t('speakers.placement.toeIn')}</label>
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
            <p class="help">{i18n.t('speakers.placement.toeInHelp')}</p>
            <label class="choice">
              <input
                type="checkbox"
                checked={constraints.keepSymmetric}
                onchange={(e) =>
                  workspace.edit(
                    (p) => void (p.constraints.keepSymmetric = e.currentTarget.checked),
                  )}
              />
              {i18n.t('speakers.placement.mirror')}
            </label>
          </section>
        {/if}

        <section class="group" aria-labelledby="describe-title">
          <h3 id="describe-title">{i18n.t('speakers.describe.title')}</h3>
          <div class="grid2">
            <div class="field">
              <label for="speaker-brand">{i18n.t('speakers.brand')}</label>
              <input
                id="speaker-brand"
                class="input"
                maxlength="60"
                value={speaker.brand}
                onchange={(e) => editSpeaker((s) => void (s.brand = e.currentTarget.value.trim()))}
              />
            </div>
            <div class="field">
              <label for="speaker-model">{i18n.t('speakers.model')}</label>
              <input
                id="speaker-model"
                class="input"
                maxlength="60"
                value={speaker.model}
                onchange={(e) => editSpeaker((s) => void (s.model = e.currentTarget.value.trim()))}
              />
            </div>
          </div>

          {#each [{ key: 'w', label: 'width' }, { key: 'h', label: 'height' }, { key: 'd', label: 'depth' }] as const as dim (dim.key)}
            <LengthField
              id="speaker-{dim.key}"
              label={i18n.t(`speakers.size.${dim.label}`)}
              kind="position"
              value={speaker.dimensions[dim.key]}
              {system}
              limits={{ min: 0.02, max: 3 }}
              onchange={(next) => editSpeaker((s) => void (s.dimensions[dim.key] = next))}
            />
          {/each}

          <div class="field">
            <label for="speaker-enclosure">{i18n.t('speakers.enclosure.label')}</label>
            <select
              id="speaker-enclosure"
              class="input"
              value={speaker.enclosure.value ?? 'unknown'}
              onchange={(e) => setKnown('enclosure', e.currentTarget.value)}
            >
              {#each enclosures as v (v)}<option value={v}
                  >{i18n.t(`speakers.enclosure.${v}`)}</option
                >{/each}
            </select>
          </div>

          <fieldset>
            <legend>{i18n.t('speakers.controls.legend')}</legend>
            <label class="choice"
              ><input
                type="checkbox"
                checked={Boolean(speaker.dsp.treble)}
                onchange={(e) => toggleDsp('treble', e.currentTarget.checked)}
              />{i18n.t('speakers.controls.treble')}</label
            >
            <label class="choice"
              ><input
                type="checkbox"
                checked={Boolean(speaker.dsp.bass)}
                onchange={(e) => toggleDsp('bass', e.currentTarget.checked)}
              />{i18n.t('speakers.controls.bass')}</label
            >
            <label class="choice"
              ><input
                type="checkbox"
                checked={Boolean(speaker.dsp.wallDistanceSetting)}
                onchange={(e) =>
                  editSpeaker(
                    (s) => void (s.dsp.wallDistanceSetting = e.currentTarget.checked || undefined),
                  )}
              />{i18n.t('speakers.controls.wall')}</label
            >
            <label class="choice">
              <input
                type="checkbox"
                checked={Boolean(speaker.minWallDistance)}
                onchange={(e) =>
                  editSpeaker((s) => {
                    if (e.currentTarget.checked)
                      s.minWallDistance = { value: 0.1, certainty: 'measured' };
                    else delete s.minWallDistance;
                  })}
              />{i18n.t('speakers.controls.minWall')}
            </label>
            {#if speaker.minWallDistance?.value != null}
              <LengthInput
                id="speaker-minwall"
                label={i18n.t('speakers.controls.minWallValue')}
                value={speaker.minWallDistance.value}
                {system}
                limits={{ min: 0, max: 3 }}
                onchange={(v) =>
                  editSpeaker(
                    (s) => void (s.minWallDistance = { value: v, certainty: 'measured' }),
                  )}
              />
            {/if}
          </fieldset>

          <div class="field">
            <label for="speaker-f6">{i18n.t('speakers.advanced.f6')}</label>
            <p class="help">{i18n.t('speakers.advanced.f6Help')}</p>
            <input
              id="speaker-f6"
              class="input narrow"
              inputmode="numeric"
              bind:value={f6Text}
              onfocus={() => (editingF6 = true)}
              onblur={commitF6}
              onkeydown={(e) => e.key === 'Enter' && commitF6()}
            />
          </div>

          <div class="actions">
            <button type="button" class="btn" onclick={saveProfile}
              >{i18n.t('speakers.file.save')}</button
            >
            <button type="button" class="btn" onclick={() => fileInput?.click()}
              >{i18n.t('speakers.file.load')}</button
            >
            <input
              id="speaker-file"
              bind:this={fileInput}
              class="visually-hidden"
              type="file"
              accept=".json,application/json"
              tabindex="-1"
              aria-hidden="true"
              onchange={loadProfile}
            />
          </div>
        </section>
      </div>
    {/if}
  </details>
</div>

<style>
  .step,
  .group {
    display: grid;
    gap: 16px;
  }
  .step {
    gap: 24px;
  }
  h3 {
    font-size: var(--text-md);
  }
  .intro,
  .help {
    color: var(--ink-muted);
    font-size: var(--text-md);
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    display: grid;
    gap: 4px;
  }
  legend {
    padding: 0;
    font-weight: 600;
  }
  .questions {
    display: grid;
    gap: 12px;
  }
  /* "More details": one quiet row that opens the rest. */
  .more {
    border-top: 1px solid var(--grid);
  }
  .more summary {
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding: 12px 0;
    cursor: pointer;
    list-style: none;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more-title {
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--accent);
  }
  .more-title::after {
    content: '›';
    display: inline-block;
    margin-left: 6px;
    transition: transform 0.15s ease;
  }
  .more[open] .more-title::after {
    transform: rotate(90deg);
  }
  .more-hint {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .more-body {
    display: grid;
    gap: 24px;
    padding-top: 8px;
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
  .field label,
  .label {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .input {
    font-family: var(--font-sans);
  }
  .narrow {
    max-width: 8rem;
    font-family: var(--font-mono);
  }
  .choice {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
  }
  .choice input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent);
  }
  .stack {
    display: grid;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  input[type='range'] {
    width: 100%;
    min-height: 44px;
    accent-color: var(--accent);
  }
  @media (max-width: 420px) {
    .grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .more-title::after {
      transition: none;
    }
  }
</style>
