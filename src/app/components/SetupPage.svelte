<script lang="ts">
  import { tick } from 'svelte';
  import type { Busyness } from '../../engine/types';
  import { i18n } from '../../i18n/locale.svelte';
  import { activeVariant } from '../plan/placement';
  import { workspace } from '../session.svelte';
  import { ROOM_LIMITS, USUAL_ROOM_RANGE } from '../state/limits';
  import { ui } from '../ui.svelte';
  import LengthField from './LengthField.svelte';
  import PlacementOptions from './PlacementOptions.svelte';
  import SpeakerQuestions from './SpeakerQuestions.svelte';
  import StepFurnishing from './StepFurnishing.svelte';
  import StepGoals from './StepGoals.svelte';
  import StepRoom from './StepRoom.svelte';
  import StepSpeakers from './StepSpeakers.svelte';
  import StepSurfaces from './StepSurfaces.svelte';

  /**
   * Set up (docs/ROADMAP_V8.md §2): only what changes the answer, on one short page, in three
   * groups: the room, the speakers, where you listen. Everything else waits under "More…" (owner
   * feedback after V7: five minutes of fields, no idea what they do). The map stays in view, so
   * every answer shows at once.
   */
  const project = $derived(workspace.project);
  const room = $derived(project.room);
  const system = $derived(project.units);
  const dims = ['width', 'length', 'height'] as const;
  const known = $derived(dims.filter((d) => room[d].value !== null));
  const measured = $derived(
    known.length > 0 && known.every((d) => room[d].certainty === 'measured'),
  );
  /** One switch instead of "how sure are you" under every number. */
  function setMeasured(on: boolean) {
    workspace.edit((p) => {
      for (const d of dims) {
        const v = p.room[d];
        if (v.value !== null) v.certainty = on ? 'measured' : 'estimated';
      }
    });
  }

  const BUSY: readonly Busyness[] = ['bare', 'some', 'busy', 'very-busy'];
  const busyKey = { bare: 'bare', some: 'some', busy: 'busy', 'very-busy': 'veryBusy' } as const;
  const busy = $derived(activeVariant(project).busyness?.value ?? null);
  const setBusy = (value: Busyness) =>
    workspace.edit((p) => void (activeVariant(p).busyness = { value, certainty: 'estimated' }));

  /** Where a section of the old settings now lives: a group, or a fold inside one. */
  const TARGET: Record<string, string> = {
    room: 'setup-room',
    surfaces: 'setup-room-more',
    furnishing: 'setup-room-more',
    speakers: 'setup-speakers',
    goals: 'setup-listen-more',
    ready: 'setup-listen-more',
  };
  let page = $state<HTMLElement>();
  $effect(() => {
    const target = ui.roomTarget;
    if (!target) return;
    void tick().then(() => {
      const el = page?.querySelector<HTMLElement>(`#${TARGET[target] ?? `setup-${target}`}`);
      if (el instanceof HTMLDetailsElement) el.open = true;
      el?.scrollIntoView({ block: 'start' });
    });
  });
</script>

<div class="setup" bind:this={page}>
  <section class="group" id="setup-room" aria-labelledby="setup-room-title">
    <h2 id="setup-room-title">{i18n.t('setup.room.title')}</h2>
    <div class="sizes">
      {#each dims as dim (dim)}
        <LengthField
          id="room-{dim}"
          label={i18n.t(`room.${dim}`)}
          kind="room"
          value={room[dim]}
          {system}
          limits={ROOM_LIMITS[dim]}
          usual={USUAL_ROOM_RANGE[dim]}
          chips={false}
          onchange={(next) =>
            workspace.edit(
              (p) =>
                void (p.room[dim] =
                  measured && next.value !== null ? { ...next, certainty: 'measured' } : next),
            )}
        />
      {/each}
    </div>
    {#if known.length > 0}
      <label class="check">
        <input
          type="checkbox"
          checked={measured}
          onchange={(e) => setMeasured(e.currentTarget.checked)}
        />
        <span>{i18n.t('setup.room.measured')}</span>
      </label>
    {/if}
    <div class="field">
      <span class="label" id="setup-busy">{i18n.t('setup.room.busy')}</span>
      <div class="seg" role="radiogroup" aria-labelledby="setup-busy">
        {#each BUSY as level (level)}
          <label>
            <input
              type="radio"
              name="setup-busy"
              checked={busy === level}
              onchange={() => setBusy(level)}
            />
            <span>{i18n.t(`furnishing.busy.${busyKey[level]}`)}</span>
          </label>
        {/each}
      </div>
    </div>
    <details class="more" id="setup-room-more">
      <summary>
        <span class="more-title">{i18n.t('setup.room.more')}</span>
        <span class="more-hint">{i18n.t('setup.room.moreHint')}</span>
      </summary>
      <div class="more-body">
        <h3 id="setup-surfaces">{i18n.t('surfaces.title')}</h3>
        <StepSurfaces embedded />
        <h3 id="setup-furnishing">{i18n.t('furnishing.title')}</h3>
        <StepFurnishing embedded />
        <h3>{i18n.t('setup.room.build')}</h3>
        <StepRoom embedded />
      </div>
    </details>
  </section>

  <section class="group" id="setup-speakers" aria-labelledby="setup-speakers-title">
    <h2 id="setup-speakers-title">{i18n.t('setup.speakers.title')}</h2>
    <SpeakerQuestions questions={['kind', 'size', 'port']} />
    <details class="more" bind:open={ui.speakerDetails}>
      <summary>
        <span class="more-title">{i18n.t('setup.speakers.more')}</span>
        <span class="more-hint">{i18n.t('setup.speakers.moreHint')}</span>
      </summary>
      <!-- Rendered only when open: these fields share names (Width, Height) with the room's. -->
      {#if ui.speakerDetails}
        <div class="more-body">
          <SpeakerQuestions questions={['drivers', 'madeFor', 'spread', 'placedOn']} note={false} />
          <StepSpeakers embedded />
        </div>
      {/if}
    </details>
  </section>

  <section class="group" id="setup-listen" aria-labelledby="setup-listen-title">
    <h2 id="setup-listen-title">{i18n.t('setup.listen.title')}</h2>
    <PlacementOptions parts={['place']} plain />
    <details class="more" id="setup-listen-more">
      <summary>
        <span class="more-title">{i18n.t('setup.listen.more')}</span>
        <span class="more-hint">{i18n.t('setup.listen.moreHint')}</span>
      </summary>
      <div class="more-body">
        <h3 id="setup-goals">{i18n.t('goals.title')}</h3>
        <StepGoals embedded />
        <h3 id="setup-ready">{i18n.t('sheet.treatment')}</h3>
        <PlacementOptions parts={['ready']} plain />
      </div>
    </details>
  </section>

  <button type="button" class="btn primary next" onclick={() => (ui.tab = 'place')}>
    {i18n.t('setup.next')}
  </button>
</div>

<style>
  .setup {
    display: grid;
    gap: 36px;
  }
  .group {
    display: grid;
    gap: 16px;
  }
  .sizes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  /* In the row, the three sizes are short: their labels and inputs line up. */
  .sizes :global(label) {
    font-size: var(--text-sm);
  }
  .field {
    display: grid;
    gap: 8px;
  }
  .label {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .seg {
    display: flex;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 32px;
    margin-top: -6px;
    color: var(--ink-muted);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .check input {
    width: 18px;
    height: 18px;
    accent-color: var(--accent-fill);
  }
  @media (pointer: coarse) {
    .check {
      min-height: 44px;
    }
  }
  /* "More…": one quiet row with a hint of what is inside. */
  .more {
    border-top: 1px solid var(--grid);
  }
  .more summary {
    display: grid;
    gap: 2px;
    min-height: 44px;
    padding: 12px 0 0;
    cursor: pointer;
    list-style: none;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more-title {
    color: var(--accent);
    font-size: var(--text-md);
    font-weight: 600;
  }
  .more-title::after {
    content: '›';
    display: inline-block;
    margin-left: 6px;
    transition: transform 0.15s ease;
  }
  .more[open] .more-title::after {
    transform: rotate(90deg);
  }
  .more-hint {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .more-body {
    display: grid;
    gap: 20px;
    padding-top: 20px;
  }
  .more-body h3 {
    margin-top: 8px;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 500;
  }
  .next {
    width: 100%;
  }
  @media (prefers-reduced-motion: reduce) {
    .more-title::after {
      transition: none;
    }
  }
</style>
