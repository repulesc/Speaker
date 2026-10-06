<script lang="ts">
  import {
    GENERIC_KIND,
    KIND_PRESETS,
    PLACED_ON,
    PORT_CHOICES,
    SPEAKER_KINDS,
    SPEAKER_SIZES,
    type SpeakerChoices,
  } from '../../engine/presets/speakerKinds';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import { workspace } from '../session.svelte';
  import { setSpeakerChoice } from '../state/speaker';
  import SelectRow from './SelectRow.svelte';

  /**
   * The speaker questions as select rows (V7 dropdowns, V9 rows): each starts at "Not sure", and
   * each answer fills in typical values for what the engine uses. Set up asks all four; the
   * first-run survey the first three.
   */
  type Question = 'kind' | 'size' | 'port' | 'placedOn';
  let {
    questions = ['kind', 'size', 'port', 'placedOn'],
    idPrefix = 'speaker',
  }: { questions?: readonly Question[]; idPrefix?: string } = $props();

  const project = $derived(workspace.project);
  const choices = $derived<SpeakerChoices>(project.speaker.choices ?? {});
  const OPTIONS: Record<Question, readonly string[]> = {
    kind: SPEAKER_KINDS,
    size: SPEAKER_SIZES,
    port: PORT_CHOICES,
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
</script>

<div class="rows">
  {#each questions as q (q)}
    <SelectRow
      id="{idPrefix}-{q}"
      label={i18n.t(`speakers.ask.${q}.label`)}
      value={choices[q] ?? ''}
      unset={i18n.t('setup.notSure')}
      options={OPTIONS[q].map((v) => ({ value: v, label: optionLabel(q, v) }))}
      onchange={(v) =>
        workspace.edit((p) => setSpeakerChoice(p, q, v === '' ? undefined : (v as never)))}
    />
  {/each}
</div>
