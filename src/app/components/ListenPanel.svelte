<script lang="ts">
  import type { ListeningNote, SymptomId } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { agreement } from '../listen/agreement';
  import {
    addNote,
    DURATIONS,
    ratingsBySetup,
    removeNote,
    setupKey,
    SYMPTOMS,
  } from '../listen/notes';
  import type { Duration } from '../listen/notes';
  import { variantLabel, workspace } from '../session.svelte';
  import { setups } from '../state/setups.svelte';

  const project = $derived(workspace.project);
  const active = $derived(project.variants.find((v) => v.id === project.activeVariantId)!);
  const setupName = $derived(variantLabel(active.name));
  const notes = $derived(
    project.notes
      .filter((n) => n.variantId === active.id)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );

  let rating = $state<ListeningNote['rating']>(undefined);
  let symptoms = $state<SymptomId[]>([]);
  let duration = $state<Duration | null>(null);
  let text = $state('');

  const RATINGS = [1, 2, 3, 4, 5] as const;

  function save() {
    const draft = {
      variantId: active.id,
      setupKey: setupKey(active),
      rating,
      symptoms: [...symptoms],
      listenedHours: duration ? DURATIONS[duration] : undefined,
      text,
    };
    workspace.edit((p) => addNote(p, draft));
    rating = undefined;
    symptoms = [];
    duration = null;
    text = '';
  }

  function toggle(id: SymptomId, on: boolean) {
    symptoms = on ? [...symptoms, id] : symptoms.filter((s) => s !== id);
  }

  // The app's score for each setup, to compare with the ratings.
  $effect(() => {
    void setups.refresh($state.snapshot(workspace.project));
  });
  const verdict = $derived.by(() => {
    const byId = ratingsBySetup(project.notes, project.variants);
    return agreement(
      project.variants.map((v) => ({
        id: v.id,
        name: variantLabel(v.name),
        score: setups.views[v.id]?.score ?? null,
        ratings: byId.get(v.id) ?? [],
      })),
    );
  });

  const currentKey = $derived(setupKey(active));
  const when = (iso: string) =>
    new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );
  const tries = (n: ListeningNote) => [...new Set(n.symptoms)];
  const durationOf = (hours: number | undefined): Duration | null =>
    hours === undefined
      ? null
      : hours <= DURATIONS.short
        ? 'short'
        : hours <= DURATIONS.hours
          ? 'hours'
          : 'days';
</script>

<div class="listen">
  <h2>{i18n.t('listen.title')}</h2>
  <p class="muted">{i18n.t('listen.intro')}</p>

  <section class="card" aria-labelledby="protocol-title">
    <h3 id="protocol-title">{i18n.t('listen.protocolTitle')}</h3>
    <ol>
      <li>{i18n.t('listen.protocol.one')}</li>
      <li>{i18n.t('listen.protocol.two')}</li>
      <li>{i18n.t('listen.protocol.three')}</li>
    </ol>
    <p class="muted">{i18n.t('listen.adapt')}</p>
  </section>

  <section class="card" aria-labelledby="agreement-title">
    <h3 id="agreement-title">{i18n.t('listen.agreement.title')}</h3>
    <p role="status" data-testid="agreement">
      {#if verdict.verdict === 'disagree'}
        {i18n.t('listen.agreement.disagree', { ears: verdict.ears, app: verdict.app })}
      {:else}
        {i18n.t(
          `listen.agreement.${verdict.verdict === 'not-enough' ? 'notEnough' : verdict.verdict}`,
        )}
      {/if}
    </p>
  </section>

  <form
    class="card"
    aria-labelledby="form-title"
    onsubmit={(e) => {
      e.preventDefault();
      save();
    }}
  >
    <h3 id="form-title">{i18n.t('listen.formTitle', { setup: setupName })}</h3>

    <fieldset>
      <legend>{i18n.t('listen.rating.legend')}</legend>
      <div class="seg">
        {#each RATINGS as n (n)}
          <label>
            <input
              type="radio"
              name="rating"
              value={n}
              checked={rating === n}
              aria-label={i18n.t('listen.rating.value', { n })}
              onchange={() => (rating = n)}
            />
            <span aria-hidden="true">{n}</span>
          </label>
        {/each}
      </div>
      <p class="muted">{i18n.t('listen.rating.scale')}</p>
    </fieldset>

    <fieldset>
      <legend>{i18n.t('listen.symptoms')}</legend>
      {#each SYMPTOMS as id (id)}
        <label class="choice">
          <input
            type="checkbox"
            checked={symptoms.includes(id)}
            onchange={(e) => toggle(id, e.currentTarget.checked)}
          />
          {i18n.t(`listen.symptom.${id}.name`)}
        </label>
      {/each}
    </fieldset>

    <fieldset>
      <legend>{i18n.t('listen.duration.legend')}</legend>
      <div class="seg">
        {#each Object.keys(DURATIONS) as d (d)}
          <label>
            <input
              type="radio"
              name="duration"
              value={d}
              checked={duration === d}
              onchange={() => (duration = d as Duration)}
            />
            <span>{i18n.t(`listen.duration.${d}`)}</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <div class="field">
      <label for="note-text">{i18n.t('listen.text')}</label>
      <textarea id="note-text" class="input" rows="3" maxlength="2000" bind:value={text}></textarea>
    </div>
    <button type="submit" class="btn primary">{i18n.t('listen.save')}</button>
  </form>

  <section aria-labelledby="notes-list-title">
    <h3 id="notes-list-title">{i18n.t('listen.listTitle', { setup: setupName })}</h3>
    {#each notes as n (n.id)}
      <article class="card">
        <p class="meta">
          <span>{when(n.createdAt)}</span>
          <span>
            {#if n.rating}{i18n.t('listen.rating.value', { n: n.rating })}{/if}
            {#if durationOf(n.listenedHours)}
              · {i18n.t(`listen.duration.${durationOf(n.listenedHours)}`)}{/if}
          </span>
        </p>
        {#if n.rating && n.setupKey !== currentKey}
          <p class="muted">{i18n.t('listen.earlier')}</p>
        {/if}
        {#if n.text}<p>{n.text}</p>{/if}
        {#each tries(n) as id (id)}
          <p class="symptom">
            <strong>{i18n.t(`listen.symptom.${id}.name`)}.</strong>
            {i18n.t('listen.tryThis')}: {i18n.t(`listen.symptom.${id}.try`)}
          </p>
        {/each}
        <button
          type="button"
          class="btn quiet"
          onclick={() => workspace.edit((p) => removeNote(p, n.id))}
          >{i18n.t('listen.delete')}</button
        >
      </article>
    {:else}
      <p class="muted">{i18n.t('listen.empty')}</p>
    {/each}
  </section>
</div>

<style>
  .listen,
  form,
  fieldset,
  section {
    display: grid;
    gap: 10px;
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    padding: 0;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 14px;
  }
  h3 {
    font-size: 12px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  ol {
    margin: 0;
    padding-left: 20px;
    font-size: 14px;
    line-height: 1.5;
  }
  p {
    margin: 0;
  }
  .muted {
    color: var(--ink-muted);
    font-size: 13px;
  }
  .card {
    display: grid;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--grid-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
    font-size: 14px;
    line-height: 1.5;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--ink-muted);
    font-size: 12px;
  }
  .seg {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .seg label {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--grid-strong);
    border-radius: 999px;
    cursor: pointer;
  }
  .seg label:has(input:checked) {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }
  .seg label:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .seg input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: inherit;
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
  .field {
    display: grid;
    gap: 6px;
  }
  textarea {
    font-family: var(--font-sans);
    resize: vertical;
  }
  .symptom {
    font-size: 13px;
  }
</style>
