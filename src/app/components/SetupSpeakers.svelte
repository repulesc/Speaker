<script lang="ts">
  import { DRIVER_CHOICES, type DriverChoice } from '../../engine/presets/speakerKinds';
  import type { SpeakerProfile } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { workspace } from '../session.svelte';
  import { setSpeakerChoice } from '../state/speaker';
  import { ui } from '../ui.svelte';
  import LengthField from './LengthField.svelte';
  import LengthInput from './LengthInput.svelte';
  import SelectRow from './SelectRow.svelte';
  import { markEdited } from '../state/speakerList';
  import SpeakerPicker from './SpeakerPicker.svelte';

  /**
   * The speakers (docs/ROADMAP_V9.md §2): picked from the list, or four questions that fill in
   * typical values (SpeakerPicker), and one fold for the numbers from the manual. Everything here
   * changes the result. A value changed by hand on a listed speaker marks its card "changed by
   * you".
   */
  const project = $derived(workspace.project);
  const speaker = $derived(project.speaker);
  const system = $derived(project.units);

  const editSpeaker = (change: (s: SpeakerProfile) => void) =>
    workspace.edit((p) => {
      change(p.speaker);
      markEdited(p.speaker);
    });

  /** The driver layout: a question for a described speaker, a plain value for a listed one. */
  const drivers = $derived(
    speaker.listed
      ? (DRIVER_CHOICES as readonly string[]).includes(speaker.driverLayout.value ?? '')
        ? speaker.driverLayout.value!
        : ''
      : (speaker.choices?.drivers ?? ''),
  );
  function setDrivers(v: string) {
    if (speaker.listed) {
      if (v)
        editSpeaker(
          (s) => void (s.driverLayout = { value: v as DriverChoice, certainty: 'measured' }),
        );
    } else {
      workspace.edit((p) =>
        setSpeakerChoice(p, 'drivers', v === '' ? undefined : (v as DriverChoice)),
      );
    }
  }

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

  // The lowest note is a plain number of hertz.
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
      editSpeaker((s) => void (s.lowFrequencyMinus6dB = { value, certainty: 'measured' }));
    } else {
      f6Text = String(Math.round(speaker.lowFrequencyMinus6dB.value ?? 50));
    }
  }

  const DIMS = [
    { key: 'w', label: 'width' },
    { key: 'h', label: 'height' },
    { key: 'd', label: 'depth' },
  ] as const;
</script>

<section class="form-group" id="setup-speakers" aria-labelledby="setup-speakers-title">
  <h2 id="setup-speakers-title">{i18n.t('setup.speakers.title')}</h2>
  <SpeakerPicker questions={['kind', 'size', 'port', 'placedOn']} idPrefix="speaker" place />

  <details class="fold" bind:open={ui.speakerDetails}>
    <summary>
      <span class="fold-title"
        >{i18n.t(speaker.listed ? 'speakerList.details' : 'setup.speakers.manual')}</span
      >
      <span class="fold-hint">{i18n.t('setup.speakers.manualHint')}</span>
    </summary>
    <!-- Rendered only when open: these fields share names (Width, Height) with the room's. -->
    {#if ui.speakerDetails}
      <div class="fold-body">
        <div class="rows">
          <SelectRow
            id="speaker-drivers"
            label={i18n.t('speakers.ask.drivers.label')}
            value={drivers}
            unset={i18n.t('setup.notSure')}
            options={DRIVER_CHOICES.map((v) => ({
              value: v,
              label: i18n.t(`speakers.ask.drivers.${v}`),
            }))}
            onchange={setDrivers}
          />
        </div>
        <div class="dims">
          {#each DIMS as dim (dim.key)}
            <LengthField
              id="speaker-{dim.key}"
              label={i18n.t(`setup.speakers.${dim.label}`)}
              kind="position"
              value={speaker.dimensions[dim.key]}
              {system}
              limits={{ min: 0.02, max: 3 }}
              onchange={(next) =>
                editSpeaker(
                  (s) =>
                    void (s.dimensions[dim.key] =
                      next.value === null ? next : { ...next, certainty: 'measured' }),
                )}
            />
          {/each}
        </div>
        <div class="f6">
          <label for="speaker-f6">{i18n.t('setup.speakers.f6')}</label>
          <input
            id="speaker-f6"
            class="input"
            inputmode="numeric"
            bind:value={f6Text}
            onfocus={() => (editingF6 = true)}
            onblur={commitF6}
            onkeydown={(e) => e.key === 'Enter' && commitF6()}
          />
        </div>
        <fieldset>
          <legend>{i18n.t('setup.speakers.controls')}</legend>
          <label class="check">
            <input
              type="checkbox"
              checked={Boolean(speaker.dsp.treble)}
              onchange={(e) => toggleDsp('treble', e.currentTarget.checked)}
            />
            <span>{i18n.t('setup.speakers.treble')}</span>
          </label>
          <label class="check">
            <input
              type="checkbox"
              checked={Boolean(speaker.dsp.bass)}
              onchange={(e) => toggleDsp('bass', e.currentTarget.checked)}
            />
            <span>{i18n.t('setup.speakers.bass')}</span>
          </label>
          <label class="check">
            <input
              type="checkbox"
              checked={Boolean(speaker.dsp.wallDistanceSetting)}
              onchange={(e) =>
                editSpeaker(
                  (s) => void (s.dsp.wallDistanceSetting = e.currentTarget.checked || undefined),
                )}
            />
            <span>{i18n.t('setup.speakers.wall')}</span>
          </label>
          <label class="check">
            <input
              type="checkbox"
              checked={Boolean(speaker.minWallDistance)}
              onchange={(e) =>
                editSpeaker((s) => {
                  if (e.currentTarget.checked)
                    s.minWallDistance = { value: 0.1, certainty: 'measured' };
                  else delete s.minWallDistance;
                })}
            />
            <span>{i18n.t('setup.speakers.minWall')}</span>
          </label>
          {#if speaker.minWallDistance?.value != null}
            <div class="indent">
              <LengthInput
                id="speaker-minwall"
                label={i18n.t('setup.speakers.minWallValue')}
                value={speaker.minWallDistance.value}
                {system}
                limits={{ min: 0, max: 3 }}
                onchange={(v) =>
                  editSpeaker(
                    (s) => void (s.minWallDistance = { value: v, certainty: 'measured' }),
                  )}
              />
            </div>
          {/if}
        </fieldset>
      </div>
    {/if}
  </details>
</section>

<style>
  .dims {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .dims :global(label) {
    font-size: var(--text-sm);
  }
  .f6 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 96px;
    align-items: center;
    gap: 12px;
  }
  fieldset {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  legend {
    margin-bottom: 4px;
    padding: 0;
  }
  .indent {
    padding: 6px 0 0 28px;
  }
</style>
