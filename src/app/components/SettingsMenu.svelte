<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { LOCALES } from '../../i18n/translate';
  import type { Locale } from '../../i18n/types';
  import { SUPPORT_URL } from '../config';
  import { prefs, type ThemePref } from '../prefs.svelte';
  import { projectLabel, workspace } from '../session.svelte';
  import Dropdown from './Dropdown.svelte';

  /** One place for everything that is not the room itself: language, units, look, projects, files. */
  interface Props {
    onshare: () => void;
    onimage: () => void;
    onexport: () => void;
    onimport: () => void;
    onprint: () => void;
    onabout: () => void;
  }
  let { onshare, onimage, onexport, onimport, onprint, onabout }: Props = $props();

  const themes: ThemePref[] = ['auto', 'light', 'dark'];
  const project = $derived(workspace.project);
  let renaming = $state(false);
  let nameDraft = $state('');

  function remove(close: () => void) {
    if (confirm(i18n.t('project.deleteConfirm', { name: projectLabel(project.name) }))) {
      workspace.remove(project.id);
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
      {@render segment(
        i18n.t('theme.label'),
        'theme',
        themes,
        prefs.theme,
        (o) => i18n.t(`theme.${o}`),
        (o) => (prefs.theme = o as ThemePref),
      )}

      <p class="group-title">{i18n.t('project.switcher')}</p>
      {#if renaming}
        <form
          class="rename"
          onsubmit={(e) => {
            e.preventDefault();
            workspace.rename(nameDraft);
            renaming = false;
          }}
        >
          <label for="project-name" class="visually-hidden">{i18n.t('project.renameLabel')}</label>
          <input id="project-name" class="input" bind:value={nameDraft} maxlength="200" />
          <button class="btn primary" type="submit">{i18n.t('project.rename')}</button>
        </form>
      {/if}
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
        {#if SUPPORT_URL}
          <li>
            <a class="row" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer"
              >{i18n.t('menu.support')}</a
            >
          </li>
        {/if}
      </ul>
      <ul class="list">
        <li>
          <button
            type="button"
            class="row"
            onclick={() => {
              workspace.newProject();
              close();
            }}>{i18n.t('project.new')}</button
          >
        </li>
        <li>
          <button
            type="button"
            class="row"
            onclick={() => {
              workspace.duplicate(
                `${projectLabel(project.name)} (${i18n.t('project.copySuffix')})`,
              );
              close();
            }}>{i18n.t('project.duplicate')}</button
          >
        </li>
        <li>
          <button
            type="button"
            class="row"
            onclick={() => {
              nameDraft = project.name;
              renaming = true;
            }}>{i18n.t('project.rename')}</button
          >
        </li>
        <li>
          <button type="button" class="row danger" onclick={() => remove(close)}
            >{i18n.t('project.delete')}</button
          >
        </li>
      </ul>

      <ul class="list">
        {#each [['menu.share', onshare], ['menu.image', onimage], ['menu.export', onexport], ['menu.import', onimport], ['menu.print', onprint], ['menu.about', onabout]] as const as [key, action] (key)}
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
      </ul>
    </div>
  {/snippet}
</Dropdown>

<style>
  .menu {
    display: grid;
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
  .rename {
    display: flex;
    gap: 8px;
  }
  .danger {
    color: var(--danger);
  }
</style>
