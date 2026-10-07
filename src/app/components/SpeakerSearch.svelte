<script lang="ts">
  import type { SpeakerEntry } from '../../engine/speakers/entry';
  import { brandsOf, findSpeakers } from '../../engine/speakers/search';
  import { i18n } from '../../i18n/locale.svelte';
  import { SPEAKER_LIST } from '../speakers/list';

  /**
   * "Find your speaker" (docs/SPEAKER_DATA.md): a search box with its list always in view, no
   * pop-up to lose. Empty, the list shows the brands to browse; a brand fills the box with its
   * name and lists its models. The matching forgives case, accents, word order, a word cut short
   * and a slip in a longer word (engine/speakers/search.ts). ARIA combobox with a listbox; the
   * arrow keys move, Enter picks, Escape clears (or gives up the change).
   */
  let {
    idPrefix,
    onpick,
    oncancel,
    cancelLabel = '',
  }: {
    idPrefix: string;
    onpick: (entry: SpeakerEntry) => void;
    /** Shown while changing a speaker already picked: keep it. */
    oncancel?: () => void;
    cancelLabel?: string;
  } = $props();

  let query = $state('');
  let active = $state(-1);
  let input = $state<HTMLInputElement>();

  type Option =
    { type: 'brand'; brand: string; count: number } | { type: 'model'; entry: SpeakerEntry };
  const options = $derived<Option[]>(
    query.trim()
      ? findSpeakers(SPEAKER_LIST, query).map((entry) => ({ type: 'model', entry }))
      : brandsOf(SPEAKER_LIST).map((b) => ({ type: 'brand', ...b })),
  );
  const browsing = $derived(query.trim() === '');
  const listId = $derived(`${idPrefix}-speaker-options`);
  const optionId = (i: number) => `${idPrefix}-speaker-option-${i}`;

  $effect(() => {
    void query;
    active = -1;
  });

  function choose(option: Option) {
    if (option.type === 'brand') {
      query = `${option.brand} `;
      input?.focus();
    } else {
      onpick(option.entry);
    }
  }

  function onkeydown(event: KeyboardEvent) {
    const n = options.length;
    if (event.key === 'ArrowDown' && n) {
      active = (active + 1) % n;
    } else if (event.key === 'ArrowUp' && n) {
      active = active <= 0 ? n - 1 : active - 1;
    } else if (event.key === 'Enter' && n) {
      choose(options[active < 0 ? 0 : active]!);
    } else if (event.key === 'Escape') {
      if (query) query = '';
      else oncancel?.();
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  }

  const kindOf = (e: SpeakerEntry) =>
    `${i18n.t(`speakerList.kind.${e.kind}`)} · ${i18n.t(`speakerList.category.${e.category}`)}`;
</script>

<div class="search">
  <label class="field-label" for="{idPrefix}-speaker-find">{i18n.t('speakerList.find')}</label>
  <input
    bind:this={input}
    id="{idPrefix}-speaker-find"
    class="input"
    type="search"
    role="combobox"
    autocomplete="off"
    spellcheck="false"
    aria-expanded="true"
    aria-controls={listId}
    aria-autocomplete="list"
    aria-activedescendant={active >= 0 ? optionId(active) : undefined}
    placeholder={i18n.t('speakerList.placeholder')}
    bind:value={query}
    {onkeydown}
  />
  <p class="caption" aria-live="polite">
    {#if browsing}
      {i18n.t('speakerList.brands')}
    {:else if options.length}
      {i18n.t('speakerList.found', { n: options.length })}
    {:else}
      {i18n.t('speakerList.none', { q: query.trim() })}
    {/if}
  </p>
  <ul
    id={listId}
    class="options"
    role="listbox"
    aria-label={i18n.t(browsing ? 'speakerList.brands' : 'speakerList.find')}
    hidden={!options.length}
  >
    {#each options as option, i (option.type === 'brand' ? option.brand : option.entry.id)}
      <!-- The input keeps focus and the keys (aria-activedescendant); a pointer picks with a click. -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <li
        id={optionId(i)}
        role="option"
        aria-selected={i === active}
        class:active={i === active}
        onmousedown={(e) => e.preventDefault()}
        onclick={() => choose(option)}
      >
        {#if option.type === 'brand'}
          <span class="name">{option.brand}</span>
          <span class="meta">
            {option.count === 1
              ? i18n.t('speakerList.model')
              : i18n.t('speakerList.models', { n: option.count })} ›
          </span>
        {:else}
          <span class="name">
            {option.entry.model}
            <span class="brand">{option.entry.brand}</span>
          </span>
          <span class="meta">{kindOf(option.entry)}</span>
        {/if}
      </li>
    {/each}
  </ul>
  {#if oncancel}
    <button type="button" class="card-link" onclick={oncancel}>{cancelLabel}</button>
  {/if}
</div>

<style>
  .search {
    display: grid;
    gap: 8px;
  }
  .caption {
    margin: 0;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .options {
    display: grid;
    max-height: 264px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
    border-top: 1px solid var(--grid);
  }
  .options[hidden] {
    display: none;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--grid);
    cursor: pointer;
  }
  li:hover,
  li.active {
    background: var(--fill);
  }
  li.active {
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .name {
    min-width: 0;
    font-size: var(--text-md);
    overflow-wrap: anywhere;
  }
  .brand {
    display: block;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .meta {
    flex: none;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
</style>
