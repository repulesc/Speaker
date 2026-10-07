<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { workspace } from '../session.svelte';

  /**
   * The speaker picked from the list, as one compact card: its name, one line of the facts that
   * move the result (kind, cabinet, bass limit), where they came from and when, and a way to
   * change it. A port seen only on the maker's photos says so quietly; a design the room model
   * does not describe well says that too.
   */
  let { idPrefix, onchange }: { idPrefix: string; onchange: () => void } = $props();

  const speaker = $derived(workspace.project.speaker);
  const listed = $derived(speaker.listed!);

  const cabinet = $derived.by(() => {
    const enclosure = speaker.enclosure.value;
    const port = speaker.portLocation.value;
    if (enclosure === 'ported') {
      return port && port !== 'none' && port !== 'unknown'
        ? i18n.t(`speakerList.port.${port}`)
        : i18n.t('speakerList.port.ported');
    }
    return enclosure && enclosure !== 'unknown' ? i18n.t(`speakerList.port.${enclosure}`) : '';
  });

  const bass = $derived.by(() => {
    const f6 = speaker.lowFrequencyMinus6dB;
    if (f6.value === null || (listed.bassFromKind && f6.certainty !== 'measured')) return '';
    const hz = Math.round(f6.value);
    return i18n.t(f6.certainty === 'measured' ? 'speakerList.f6' : 'speakerList.f6About', { hz });
  });

  const facts = $derived(
    [speaker.choices?.kind ? i18n.t(`speakerList.kind.${speaker.choices.kind}`) : '', cabinet, bass]
      .filter(Boolean)
      .join(' · '),
  );

  const date = $derived(
    new Intl.DateTimeFormat(i18n.locale === 'en' ? 'en-GB' : i18n.locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${listed.retrieved}T00:00:00Z`)),
  );
</script>

<article class="speaker-card" aria-labelledby="{idPrefix}-speaker-name">
  <div class="head">
    <h3 id="{idPrefix}-speaker-name" tabindex="-1">
      <span class="brand">{speaker.brand}</span>
      {speaker.model}
    </h3>
    <button type="button" class="card-link" onclick={onchange}
      >{i18n.t('speakerList.change')}</button
    >
  </div>
  {#if facts}<p class="facts">{facts}</p>{/if}
  <a class="source" href={listed.url} target="_blank" rel="noopener noreferrer"
    >{i18n.t(listed.edited ? 'speakerList.edited' : 'speakerList.source', { date })}</a
  >
  {#if listed.photoPort}<p class="note">{i18n.t('speakerList.photoPort')}</p>{/if}
  {#if listed.special}<p class="note">{i18n.t(`speakerList.special.${listed.special}`)}</p>{/if}
</article>

<style>
  .speaker-card {
    display: grid;
    gap: 4px;
    padding: 12px 14px;
    border-radius: var(--radius-md);
    box-shadow: 0 0 0 1px var(--grid);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h3 {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
    outline: none;
    overflow-wrap: anywhere;
  }
  .brand {
    color: var(--ink-muted);
    font-weight: 400;
  }
  .facts {
    margin: 0;
    font-size: var(--text-md);
  }
  .source,
  .note {
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .source {
    justify-self: start;
    text-decoration: underline;
    text-decoration-color: var(--grid-strong);
    text-underline-offset: 3px;
  }
  .source:hover {
    color: var(--accent);
  }
  .note {
    margin-top: 4px;
  }
  @media (pointer: coarse) {
    .source {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }
  }
</style>
