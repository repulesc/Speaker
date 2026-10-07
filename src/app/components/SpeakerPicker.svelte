<script lang="ts">
  import { tick } from 'svelte';
  import type { SpeakerEntry } from '../../engine/speakers/entry';
  import { i18n } from '../../i18n/locale.svelte';
  import { workspace } from '../session.svelte';
  import { SPEAKER_LIST } from '../speakers/list';
  import { describeSpeaker, pickSpeaker } from '../state/speakerList';
  import SpeakerCard from './SpeakerCard.svelte';
  import SpeakerQuestions from './SpeakerQuestions.svelte';
  import SpeakerSearch from './SpeakerSearch.svelte';

  /**
   * Which speakers (docs/SPEAKER_DATA.md): search first, then a compact card once one is picked;
   * "Not listed? Describe it instead" swaps in the questions. While the list is empty the
   * questions are all there is. The survey asks the first three questions; Room & speakers asks
   * all four and keeps "They stand on" under the card.
   */
  type Question = 'kind' | 'size' | 'port' | 'placedOn';
  let {
    questions,
    idPrefix,
    place = false,
  }: { questions: readonly Question[]; idPrefix: string; place?: boolean } = $props();

  const hasList = SPEAKER_LIST.length > 0;
  const speaker = $derived(workspace.project.speaker);
  // A speaker already described by its answers stays described; otherwise search first.
  let describing = $state(
    !hasList || (!workspace.project.speaker.listed && !!workspace.project.speaker.choices?.kind),
  );
  let changing = $state(false);
  let root = $state<HTMLElement>();

  async function focus(selector: string) {
    await tick();
    root?.querySelector<HTMLElement>(selector)?.focus();
  }

  function pick(entry: SpeakerEntry) {
    workspace.edit((p) => pickSpeaker(p, entry));
    changing = false;
    void focus('.speaker-card h3');
  }

  function describe() {
    workspace.edit((p) => describeSpeaker(p));
    describing = true;
    changing = false;
    void focus('select');
  }

  function search() {
    describing = false;
    void focus('input[role="combobox"]');
  }

  function change() {
    changing = true;
    void focus('input[role="combobox"]');
  }

  function keep() {
    changing = false;
    void focus('.speaker-card h3');
  }
</script>

<div class="picker" bind:this={root}>
  {#if speaker.listed && !changing}
    <SpeakerCard {idPrefix} onchange={change} />
    {#if place}<SpeakerQuestions questions={['placedOn']} {idPrefix} />{/if}
  {:else if hasList && !describing}
    <SpeakerSearch
      {idPrefix}
      onpick={pick}
      oncancel={speaker.listed ? keep : undefined}
      cancelLabel={i18n.t('speakerList.cancel', { name: speaker.model })}
    />
    <button type="button" class="card-link" onclick={describe}
      >{i18n.t('speakerList.notListed')} ›</button
    >
  {:else}
    <SpeakerQuestions {questions} {idPrefix} />
    {#if hasList}
      <button type="button" class="card-link" onclick={search}
        >{i18n.t('speakerList.useList')} ›</button
      >
    {/if}
  {/if}
</div>

<style>
  .picker {
    display: grid;
    gap: 12px;
  }
</style>
