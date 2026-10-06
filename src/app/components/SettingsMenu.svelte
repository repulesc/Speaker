<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { LOCALES } from '../../i18n/translate';
  import type { Locale } from '../../i18n/types';
  import { prefs, type ThemePref } from '../prefs.svelte';
  import { projectLabel, workspace } from '../session.svelte';
  import Dropdown from './Dropdown.svelte';

  /**
   * Everything that is not the room itself: language, units, look, sharing, starting over (V9: one
   * room, no files; other rooms are listed only when a shared link added one).
   */
  interface Props {
    onshare: () => void;
    onimage: () => void;
    onprint: () => void;
    onabout: () => void;
  }
  let { onshare, onimage, onprint, onabout }: Props = $props();

  const themes: ThemePref[] = ['auto', 'light', 'dark'];
  const project = $derived(workspace.project);

  function startOver(close: () => void) {
    if (confirm(i18n.t('menu.startOverConfirm'))) {
      workspace.startOver();
      close();
    }
  }
</script>

{#snippet segment(
  label: string,
  name: string,
  options: readonly string[],
  current: string,
  text: (o: string) => string,
  pick: (o: string) => void,
)}
  <div class="pref">
    <span class="pref-label" id="pref-{name}">{label}</span>
    <div class="seg" role="radiogroup" aria-labelledby="pref-{name}">
      {#each options as o (o)}
        <label>
          <input type="radio" {name} value={o} checked={current === o} onchange={() => pick(o)} />
          <span>{text(o)}</span>
        </label>
      {/each}
    </div>
  </div>
{/snippet}

<Dropdown label={i18n.t('settings.label')} triggerClass="gear">
  {#snippet trigger()}
    <!-- Three lines: friendlier than a cog (owner feedback, docs/DESIGN_BRIEF_V4.md). -->
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
    <span class="visually-hidden">{i18n.t('settings.label')}</span>
  {/snippet}
  {#snippet children(close)}
    <div class="menu">
      {@render segment(
        i18n.t('language.label'),
        'language',
        LOCALES,
        i18n.locale,
        (o) => o.toUpperCase(),
        (o) => (i18n.locale = o as Locale),
      )}
      {@render segment(
        i18n.t('units.label'),
        'units',
        ['metric', 'imperial'],
        project.units,
        (o) => (o === 'metric' ? 'm' : 'ft'),
        (o) => workspace.edit((p) => void (p.units = o as 'metric' | 'imperial')),
      )}
      <!-- A select, not a segment: "Match device" (and the Hungarian) did not fit a segment. -->
      <div class="pref">
        <label class="pref-label" for="pref-theme">{i18n.t('theme.label')}</label>
        <select
          id="pref-theme"
          class="input"
          value={prefs.theme}
          onchange={(e) => (prefs.theme = e.currentTarget.value as ThemePref)}
        >
          {#each themes as o (o)}<option value={o}>{i18n.t(`theme.${o}`)}</option>{/each}
        </select>
      </div>
      {@render segment(
        i18n.t('numbers.label'),
        'numbers',
        ['off', 'on'],
        prefs.numbers ? 'on' : 'off',
        (o) => i18n.t(`numbers.${o}`),
        (o) => (prefs.numbers = o === 'on'),
      )}

      <ul class="list">
        {#each [['menu.share', onshare], ['menu.image', onimage], ['menu.print', onprint]] as const as [key, action] (key)}
          <li>
            <button
              type="button"
              class="row"
              onclick={() => {
                close();
                action();
              }}>{i18n.t(key)}</button
            >
          </li>
        {/each}
        <li>
          <button type="button" class="row danger" onclick={() => startOver(close)}
            >{i18n.t('menu.startOver')}</button
          >
        </li>
      </ul>

      {#if workspace.index.length > 1}
        <p class="group-title">{i18n.t('project.switcher')}</p>
        <ul class="list">
          {#each workspace.index as entry (entry.id)}
            <li>
              <button
                type="button"
                class="row"
                aria-current={entry.id === project.id ? 'true' : undefined}
                onclick={() => {
                  workspace.switchTo(entry.id);
                  close();
                }}
              >
                {projectLabel(entry.id === project.id ? project.name : entry.name)}
                {#if entry.id === project.id}<span class="value" aria-hidden="true">✓</span>{/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      <ul class="list">
        <li>
          <button
            type="button"
            class="row"
            onclick={() => {
              close();
              onabout();
            }}>{i18n.t('menu.about')}</button
          >
        </li>
      </ul>
      <!-- Earlier versions stay reachable, frozen (docs/ROADMAP_V9.md). -->
      <a class="legacy" href="./legacy/">{i18n.t('menu.legacy')}</a>
    </div>
  {/snippet}
</Dropdown>

<style>
  .menu {
    display: grid;
    /* Each block keeps its full height: a list must never be squeezed (V7: rows were clipped). */
    grid-auto-rows: max-content;
    gap: 12px;
    max-height: min(80dvh, 640px);
    overflow-y: auto;
    padding: 4px;
  }
  .pref {
    display: grid;
    gap: 6px;
  }
  .pref .seg {
    display: flex;
  }
  .pref-label {
    color: var(--ink-muted);
    font-size: var(--text-sm);
    font-weight: 500;
  }
  .group-title {
    margin: 6px 0 -4px;
  }
  .list {
    background: var(--surface-2);
  }
  .pref select {
    min-height: 40px;
  }
  .legacy {
    padding: 2px 4px;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .danger {
    color: var(--danger);
  }
</style>
