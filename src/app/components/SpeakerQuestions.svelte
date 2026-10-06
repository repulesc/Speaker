<script lang="ts">
  import {
    DRIVER_CHOICES,
    KIND_PRESETS,
    GENERIC_KIND,
    MADE_FOR,
    PLACED_ON,
    PORT_CHOICES,
    SPEAKER_KINDS,
    SPEAKER_SIZES,
    SPREADS,
    type SpeakerChoices,
  } from '../../engine/presets/speakerKinds';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { workspace } from '../session.svelte';
  import { placeOf, setPlace } from '../state/place';
  import { setSpeakerChoice } from '../state/speaker';

  /**
   * The speaker questions as plain dropdowns (owner decision, docs/ROADMAP_V7.md): each starts at
   * "Not sure", and each answer fills in typical values for what the engine uses. The Speakers
   * settings ask all of them; the first-run survey only the first three.
   */
  type Question = keyof SpeakerChoices;
  let {
    questions = ['kind', 'size', 'drivers', 'port', 'madeFor', 'spread', 'placedOn'],
    idPrefix = 'speaker',
    note = true,
  }: { questions?: readonly Question[]; idPrefix?: string; note?: boolean } = $props();

  const project = $derived(workspace.project);
  const choices = $derived<SpeakerChoices>(project.speaker.choices ?? {});
  const OPTIONS: Record<Question, readonly string[]> = {
    kind: SPEAKER_KINDS,
    size: SPEAKER_SIZES,
    drivers: DRIVER_CHOICES,
    port: PORT_CHOICES,
    madeFor: MADE_FOR,
    spread: SPREADS,
    placedOn: PLACED_ON,
  };

  /** Sizes say how tall that size of this kind usually is ("Small, about 25 cm tall"). */
  function optionLabel(question: Question, value: string): string {
    const text = i18n.t(`speakers.ask.${question}.${value}`);
    if (question !== 'size') return text;
    const box = KIND_PRESETS[choices.kind ?? GENERIC_KIND].sizes[value as 'small'];
    const height = formatLength(box.h, project.units, 'position', i18n.locale);
    return i18n.t('speakers.ask.size.tall', { size: text, height });
  }

  function answer(question: Question, value: string) {
    workspace.edit((p) =>
      setSpeakerChoice(p, question, value === '' ? undefined : (value as never)),
    );
  }

  /** Monitors are made for close listening: offer the desk, never change the physics. */
  const studioHint = $derived(choices.madeFor === 'studio' && placeOf(project) !== 'desk');
</script>

<div class="questions">
  {#each questions as q (q)}
    <div class="field">
      <label for="{idPrefix}-{q}">{i18n.t(`speakers.ask.${q}.label`)}</label>
      <select
        id="{idPrefix}-{q}"
        class="input"
        value={choices[q] ?? ''}
        onchange={(e) => answer(q, e.currentTarget.value)}
      >
        <option value="">{i18n.t('speakers.ask.notSure')}</option>
        {#each OPTIONS[q] as v (v)}<option value={v}>{optionLabel(q, v)}</option>{/each}
      </select>
      {#if q === 'spread'}<p class="help">{i18n.t('speakers.ask.spread.help')}</p>{/if}
      {#if q === 'madeFor' && studioHint}
        <p class="help hint">
          {i18n.t('speakers.ask.madeFor.studioHint')}
          <button
            type="button"
            class="link"
            onclick={() => workspace.edit((p) => setPlace(p, 'desk'))}
            >{i18n.t('speakers.ask.madeFor.studioDesk')}</button
          >
        </p>
      {/if}
    </div>
  {/each}
  {#if note}<p class="help">{i18n.t('speakers.ask.note')}</p>{/if}
</div>

<style>
  .questions {
    display: grid;
    gap: 14px;
  }
  .field {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  label {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .input {
    font-family: var(--font-sans);
  }
  .help {
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  @media (pointer: coarse) {
    .link {
      min-height: 44px;
    }
  }
</style>
