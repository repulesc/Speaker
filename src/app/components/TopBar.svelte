<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { LOCALES } from '../../i18n/translate';
  import type { Locale } from '../../i18n/types';
  import { APP_NAME } from '../config';
  import { prefs, type ThemePref } from '../prefs.svelte';
  import { viewport } from '../viewport.svelte';
  import { analysis, projectLabel, workspace } from '../session.svelte';
  import ConfidenceMeter from './ConfidenceMeter.svelte';
  import Dropdown from './Dropdown.svelte';

  interface Props {
    onshare: () => void;
    onexport: () => void;
    onimport: () => void;
    onabout: () => void;
  }

  let { onshare, onexport, onimport, onabout }: Props = $props();

  let renaming = $state(false);
  let nameDraft = $state('');

  const themes: ThemePref[] = ['auto', 'light', 'dark'];
  const project = $derived(workspace.project);

  function startRename() {
    nameDraft = project.name;
    renaming = true;
  }

  function finishRename(close: () => void) {
    workspace.rename(nameDraft);
    renaming = false;
    close();
  }

  function remove(close: () => void) {
    if (confirm(i18n.t('project.deleteConfirm', { name: projectLabel(project.name) }))) {
      workspace.remove(project.id);
      close();
    }
  }
</script>

{#snippet unitsToggle()}
  <div class="seg" role="radiogroup" aria-label={i18n.t('units.label')}>
    {#each ['metric', 'imperial'] as const as system (system)}
      <label>
        <input
          type="radio"
          name="units"
          value={system}
          checked={project.units === system}
          onchange={() => workspace.edit((p) => void (p.units = system))}
        />
        <span title={i18n.t(`units.${system}`)}>{system === 'metric' ? 'm' : 'ft'}</span>
      </label>
    {/each}
  </div>
{/snippet}

{#snippet languageToggle()}
  <div class="seg" role="radiogroup" aria-label={i18n.t('language.label')}>
    {#each LOCALES as locale (locale)}
      <label>
        <input
          type="radio"
          name="language"
          value={locale}
          checked={i18n.locale === locale}
          onchange={() => (i18n.locale = locale as Locale)}
        />
        <span lang={locale} title={i18n.t(`language.${locale}`)}>{locale.toUpperCase()}</span>
      </label>
    {/each}
  </div>
{/snippet}

<header class="topbar">
  <h1 class="brand">{APP_NAME}</h1>

  <div class="tools">
    <Dropdown label={i18n.t('project.switcher')} triggerClass="project">
      {#snippet trigger()}
        <span class="visually-hidden">{i18n.t('project.current')}:</span>
        <span class="project-name">{projectLabel(project.name)}</span>
        <span aria-hidden="true">▾</span>
      {/snippet}
      {#snippet children(close)}
        {#if renaming}
          <form
            class="rename"
            onsubmit={(e) => {
              e.preventDefault();
              finishRename(close);
            }}
          >
            <label for="project-name">{i18n.t('project.renameLabel')}</label>
            <input id="project-name" class="input" bind:value={nameDraft} maxlength="200" />
            <button class="btn primary" type="submit">{i18n.t('project.rename')}</button>
          </form>
        {:else}
          <ul class="projects">
            {#each workspace.index as entry (entry.id)}
              <li>
                <button
                  type="button"
                  class="btn quiet item"
                  aria-current={entry.id === project.id ? 'true' : undefined}
                  onclick={() => {
                    workspace.switchTo(entry.id);
                    close();
                  }}>{projectLabel(entry.id === project.id ? project.name : entry.name)}</button
                >
              </li>
            {/each}
          </ul>
          <div class="actions">
            <button
              type="button"
              class="btn"
              onclick={() => {
                workspace.newProject();
                close();
              }}>{i18n.t('project.new')}</button
            >
            <button
              type="button"
              class="btn"
              onclick={() => {
                workspace.duplicate(
                  `${projectLabel(project.name)} (${i18n.t('project.copySuffix')})`,
                );
                close();
              }}>{i18n.t('project.duplicate')}</button
            >
            <button type="button" class="btn" onclick={startRename}
              >{i18n.t('project.rename')}</button
            >
            <button type="button" class="btn" onclick={() => remove(close)}
              >{i18n.t('project.delete')}</button
            >
          </div>
        {/if}
      {/snippet}
    </Dropdown>

    <ConfidenceMeter report={analysis.result?.confidence ?? null} />

    {#if !viewport.compact}
      {@render unitsToggle()}
      {@render languageToggle()}
    {/if}

    <Dropdown label={i18n.t('menu.label')} align="end" triggerClass="menu">
      {#snippet trigger()}
        <span aria-hidden="true">☰</span>
        <span class="visually-hidden">{i18n.t('menu.label')}</span>
      {/snippet}
      {#snippet children(close)}
        <div class="actions">
          <button
            type="button"
            class="btn"
            disabled={!workspace.canUndo}
            onclick={() => workspace.undo()}>{i18n.t('menu.undo')}</button
          >
          <button
            type="button"
            class="btn"
            disabled={!workspace.canRedo}
            onclick={() => workspace.redo()}>{i18n.t('menu.redo')}</button
          >
        </div>
        <div class="actions">
          <button
            type="button"
            class="btn"
            onclick={() => {
              close();
              onshare();
            }}>{i18n.t('menu.share')}</button
          >
          <button
            type="button"
            class="btn"
            onclick={() => {
              close();
              onexport();
            }}>{i18n.t('menu.export')}</button
          >
          <button
            type="button"
            class="btn"
            onclick={() => {
              close();
              onimport();
            }}>{i18n.t('menu.import')}</button
          >
        </div>
        {#if viewport.compact}
          {@render unitsToggle()}
          {@render languageToggle()}
        {/if}
        <div class="seg" role="radiogroup" aria-label={i18n.t('theme.label')}>
          {#each themes as theme (theme)}
            <label>
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={prefs.theme === theme}
                onchange={() => (prefs.theme = theme)}
              />
              <span>{i18n.t(`theme.${theme}`)}</span>
            </label>
          {/each}
        </div>
        <button
          type="button"
          class="btn"
          onclick={() => {
            close();
            onabout();
          }}>{i18n.t('menu.about')}</button
        >
      {/snippet}
    </Dropdown>
  </div>
</header>

<style>
  .topbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    padding: 8px var(--gutter);
    min-height: var(--topbar-h);
    background: var(--surface);
    border-bottom: 1px solid var(--grid);
  }
  .brand {
    font-size: 17px;
    letter-spacing: 0.01em;
    color: var(--ink);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  :global(.btn.project) {
    max-width: 14rem;
  }
  .project-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .projects {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  .item {
    width: 100%;
    justify-content: flex-start;
  }
  .item[aria-current='true'] {
    border-color: var(--accent);
    color: var(--accent);
  }
  .actions {
    display: grid;
    gap: 8px;
  }
  .rename {
    display: grid;
    gap: 8px;
  }
  .rename .input {
    font-family: var(--font-sans);
  }
</style>
