<script lang="ts">
  import type { OutOfModelFeature } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatTemperature } from '../../units/format';
  import { ROOM_LIMITS, USUAL_ROOM_RANGE } from '../state/limits';
  import { workspace } from '../session.svelte';
  import LengthField from './LengthField.svelte';

  const room = $derived(workspace.project.room);
  const system = $derived(workspace.project.units);

  const dims = ['width', 'length', 'height'] as const;
  const constructions = ['solid', 'lightweight', 'unknown'] as const;
  const features: OutOfModelFeature[] = [
    'open-doorway',
    'open-plan-connection',
    'alcove',
    'slanted-ceiling',
    'non-rectangular',
  ];

  function toggleFeature(feature: OutOfModelFeature, on: boolean) {
    workspace.edit((p) => {
      const rest = p.room.outOfModel.filter((f) => f !== feature);
      p.room.outOfModel = on ? [...rest, feature] : rest;
    });
  }

  // Temperature is typed in the display system's unit (°C or °F) and stored in °C.
  let temperatureText = $state('');
  let editingTemperature = $state(false);
  $effect(() => {
    if (editingTemperature) return;
    const c = room.temperatureC.value;
    temperatureText =
      c === null ? '' : String(Math.round(system === 'imperial' ? (c * 9) / 5 + 32 : c));
  });

  function commitTemperature() {
    editingTemperature = false;
    const typed = Number(temperatureText.replace(',', '.'));
    if (temperatureText.trim() === '' || !Number.isFinite(typed)) {
      workspace.edit((p) => void (p.room.temperatureC = { value: null, certainty: 'unknown' }));
      return;
    }
    const celsius = system === 'imperial' ? ((typed - 32) * 5) / 9 : typed;
    const clamped = Math.min(50, Math.max(-20, celsius));
    workspace.edit((p) => void (p.room.temperatureC = { value: clamped, certainty: 'estimated' }));
  }
</script>

<div class="step">
  <div>
    <h2>{i18n.t('room.title')}</h2>
    <p class="intro">{i18n.t('room.intro')}</p>
  </div>

  {#each dims as dim (dim)}
    <LengthField
      id="room-{dim}"
      label={i18n.t(`room.${dim}`)}
      help={i18n.t(`room.${dim}Help`)}
      kind="room"
      value={room[dim]}
      {system}
      limits={ROOM_LIMITS[dim]}
      usual={USUAL_ROOM_RANGE[dim]}
      unknownNote={i18n.t('field.neededToStart')}
      onchange={(next) => workspace.edit((p) => void (p.room[dim] = next))}
    />
  {/each}

  <fieldset>
    <legend>{i18n.t('room.construction.legend')}</legend>
    <p class="help">{i18n.t('room.construction.help')}</p>
    <div class="stack">
      {#each constructions as option (option)}
        <label class="choice">
          <input
            type="radio"
            name="construction"
            value={option}
            checked={room.construction === option}
            onchange={() => workspace.edit((p) => void (p.room.construction = option))}
          />
          {i18n.t(`room.construction.${option}`)}
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend>{i18n.t('room.outOfModel.legend')}</legend>
    <p class="help">{i18n.t('room.outOfModel.help')}</p>
    <div class="stack">
      {#each features as feature (feature)}
        <label class="choice">
          <input
            type="checkbox"
            checked={room.outOfModel.includes(feature)}
            onchange={(e) => toggleFeature(feature, e.currentTarget.checked)}
          />
          {i18n.t(`room.outOfModel.${feature}`)}
        </label>
      {/each}
    </div>
  </fieldset>

  <details>
    <summary>{i18n.t('room.temperature.summary')}</summary>
    <div class="field">
      <label for="room-temperature">{i18n.t('room.temperature.label')}</label>
      <p class="help" id="room-temperature-help">{i18n.t('room.temperature.help')}</p>
      <input
        id="room-temperature"
        class="input narrow"
        type="text"
        inputmode="decimal"
        aria-describedby="room-temperature-help"
        placeholder={formatTemperature(20, system, i18n.locale)}
        bind:value={temperatureText}
        onfocus={() => (editingTemperature = true)}
        onblur={commitTemperature}
        onkeydown={(e) => e.key === 'Enter' && commitTemperature()}
      />
    </div>
  </details>
</div>

<style>
  .step {
    display: grid;
    gap: 20px;
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
    gap: 4px;
  }
  legend {
    padding: 0;
    font-weight: 600;
  }
  .stack {
    display: grid;
    gap: 2px;
    margin-top: 4px;
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
  details summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--ink-muted);
  }
  .field {
    display: grid;
    gap: 4px;
    margin-top: 8px;
  }
  .field label {
    font-weight: 600;
  }
  .narrow {
    max-width: 8rem;
  }
</style>
