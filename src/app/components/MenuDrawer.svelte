<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { LOCALES } from '../../i18n/translate';
  import type { Locale } from '../../i18n/types';
  import { prefs, type ThemePref } from '../prefs.svelte';
  import { projectLabel, workspace } from '../session.svelte';
  import Segmented from './Segmented.svelte';
  import SelectRow from './SelectRow.svelte';
  import Wordmark from './Wordmark.svelte';

  /**
   * The menu, as a drawer over the panel (docs/ROADMAP_V10.md §1): the same width, the same
   * masthead and the same parts as the panel, so it reads as part of it. This room (its name and
   * what you can do with it), the preferences, and the rest.
   */
  interface Props {
    onshare: () => void;
    onimage: () => void;
    onprint: () => void;
    onabout: () => void;
  }
  let { onshare, onimage, onprint, onabout }: Props = $props();

  let dialog = $state<HTMLDialogElement>();
  let trigger = $state<HTMLButtonElement>();
  let open = $state(false);
  const project = $derived(workspace.project);
  const THEMES: readonly ThemePref[] = ['auto', 'light', 'dark'];

  function show() {
    dialog?.showModal();
    open = true;
  }
  function close() {
    dialog?.close();
  }
  /** Runs for every way of closing (✕, Esc, the backdrop, an action). */
  function closed() {
    open = false;
    trigger?.focus();
  }
  /** An action that leaves the menu: close first, so a dialog it opens is not stacked on this one. */
  function then(action: () => void) {
    close();
    action();
  }
  function startOver() {
    if (!confirm(i18n.t('menu.startOverConfirm'))) return;
    workspace.startOver();
    close();
  }
</script>

<button
  bind:this={trigger}
  type="button"
  class="trigger"
  aria-haspopup="dialog"
  aria-expanded={open}
  aria-controls="menu-drawer"
  onclick={show}
>
  <!-- Three lines: friendlier than a cog (owner feedback, docs/DESIGN_BRIEF_V4.md). -->
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none">
    <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  </svg>
  <span class="visually-hidden">{i18n.t('menu.label')}</span>
</button>

<dialog
  bind:this={dialog}
  id="menu-drawer"
  class="drawer"
  aria-labelledby="menu-title"
  onclose={closed}
  onclick={(e) => e.target === dialog && close()}
>
  <div class="inner">
    <header class="bar">
      <button type="button" class="icon" aria-label={i18n.t('menu.close')} onclick={close}>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
      <span class="brand"><Wordmark height={17} /></span>
      <h2 id="menu-title" class="visually-hidden">{i18n.t('menu.label')}</h2>
    </header>

    <section class="form-group" aria-labelledby="menu-room">
      <h2 id="menu-room">{i18n.t('menu.room')}</h2>
      <div class="name">
        <label class="field-label" for="menu-name">{i18n.t('menu.name')}</label>
        <input
          id="menu-name"
          class="input"
          maxlength="200"
          autocomplete="off"
          value={project.name}
          placeholder={i18n.t('menu.namePlaceholder')}
          onchange={(e) => workspace.rename(e.currentTarget.value.trim())}
        />
        <p class="help">{i18n.t('menu.nameHelp')}</p>
      </div>
      <ul class="rows actions">
        <li><button type="button" onclick={() => then(onshare)}>{i18n.t('menu.share')}</button></li>
        <li><button type="button" onclick={() => then(onimage)}>{i18n.t('menu.image')}</button></li>
        <li><button type="button" onclick={() => then(onprint)}>{i18n.t('menu.print')}</button></li>
        <li>
          <button type="button" class="danger" onclick={startOver}
            >{i18n.t('menu.startOver')}</button
          >
        </li>
      </ul>
    </section>

    {#if workspace.index.length > 1}
      <!-- Only when a shared link added a second room (V9: one room per device otherwise). -->
      <section class="form-group" aria-labelledby="menu-rooms">
        <h2 id="menu-rooms">{i18n.t('project.switcher')}</h2>
        <ul class="rows actions">
          {#each workspace.index as entry (entry.id)}
            {@const current = entry.id === project.id}
            <li>
              <button
                type="button"
                aria-current={current ? 'true' : undefined}
                onclick={() => {
                  workspace.switchTo(entry.id);
                  close();
                }}
              >
                {projectLabel(current ? project.name : entry.name)}
                {#if current}<span class="tick" aria-hidden="true">✓</span>{/if}
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="form-group" aria-labelledby="menu-prefs">
      <h2 id="menu-prefs">{i18n.t('menu.prefs')}</h2>
      <Segmented
        name="pref-language"
        label={i18n.t('language.label')}
        value={i18n.locale}
        options={LOCALES.map((l) => ({ value: l, label: i18n.t(`language.${l}`) }))}
        onchange={(l) => (i18n.locale = l as Locale)}
      />
      <Segmented
        name="pref-units"
        label={i18n.t('units.label')}
        value={project.units}
        options={[
          { value: 'metric', label: i18n.t('units.metric') },
          { value: 'imperial', label: i18n.t('units.imperial') },
        ]}
        onchange={(u) => workspace.edit((p) => void (p.units = u))}
      />
      <div class="rows">
        <SelectRow
          id="pref-theme"
          label={i18n.t('theme.label')}
          value={prefs.theme}
          options={THEMES.map((t) => ({ value: t, label: i18n.t(`theme.${t}`) }))}
          onchange={(t) => (prefs.theme = t as ThemePref)}
        />
      </div>
      <label class="check">
        <input
          type="checkbox"
          checked={prefs.numbers}
          onchange={(e) => (prefs.numbers = e.currentTarget.checked)}
        />
        <span>{i18n.t('numbers.label')}</span>
      </label>
    </section>

    <section class="form-group" aria-labelledby="menu-more">
      <h2 id="menu-more">{i18n.t('menu.more')}</h2>
      <ul class="rows actions">
        <li><button type="button" onclick={() => then(onabout)}>{i18n.t('menu.about')}</button></li>
        <!-- Earlier versions stay reachable, frozen (docs/ROADMAP_V9.md). -->
        <li><a href="./legacy/">{i18n.t('menu.legacy')}</a></li>
      </ul>
    </section>
  </div>
</dialog>

<style>
  .trigger,
  .icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--accent);
    cursor: pointer;
  }
  .trigger:hover,
  .icon:hover {
    background: var(--fill);
  }
  .icon svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
  }
  /* The drawer: the panel's width, its background and its masthead, over the panel. */
  .drawer {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(380px, calc(100vw - 40px));
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    border-right: 1px solid var(--grid);
    border-radius: 0;
    background: var(--bg);
    color: var(--ink);
    box-shadow: 12px 0 40px rgb(0 0 0 / 0.18);
    overscroll-behavior: contain;
  }
  .drawer[open] {
    animation: slide 0.22s ease-out;
  }
  .drawer::backdrop {
    background: rgb(18 21 19 / 0.28);
    backdrop-filter: blur(8px);
  }
  @keyframes slide {
    from {
      transform: translateX(-24px);
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawer[open] {
      animation: none;
    }
  }
  .inner {
    display: grid;
    align-content: start;
    gap: 32px;
    min-height: 100%;
    padding: 8px 20px 40px;
  }
  /* The same spot as the panel's masthead: ✕ where ☰ was, the wordmark beside it. */
  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    margin-left: -10px;
  }
  .brand {
    display: flex;
    margin-left: 8px;
  }
  .name {
    display: grid;
    gap: 6px;
  }
  /* Actions as ruled rows, like the select rows of the panel. */
  .actions {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .actions li {
    border-bottom: 1px solid var(--grid);
  }
  .actions :is(button, a) {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: start;
    text-decoration: none;
    cursor: pointer;
  }
  .actions :is(button, a):hover {
    color: var(--accent);
  }
  .actions .danger {
    color: var(--danger);
  }
  .tick {
    margin-left: auto;
    color: var(--accent);
  }
</style>
