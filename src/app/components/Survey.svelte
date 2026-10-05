<script lang="ts">
  import { tick } from 'svelte';
  import { SPEAKER_TYPES } from '../../engine/presets/speakerTypes';
  import { i18n } from '../../i18n/locale.svelte';
  import { formatLength } from '../../units/format';
  import {
    activeVariant,
    cabinet,
    moveSeat,
    roomSize,
    setSpeakerClearance,
    setSpeakerSpacing,
  } from '../plan/placement';
  import { workspace } from '../session.svelte';
  import { GOALS, goalOf, setGoal } from '../state/goal';
  import { ROOM_LIMITS, USUAL_ROOM_RANGE } from '../state/limits';
  import { applySpeakerType } from '../state/speaker';
  import { ui } from '../ui.svelte';
  import LengthField from './LengthField.svelte';
  import LengthInput from './LengthInput.svelte';
  import SpeakerTypeIcon from './SpeakerTypeIcon.svelte';

  /**
   * First run: four calm questions on one card, then the room is revealed (owner decisions,
   * docs/DESIGN_BRIEF_V4.md). Everything asked here can be changed later in the sidebar; "Skip"
   * keeps the answers so far.
   */
  const TOTAL = 4;
  const STEPS = [1, 2, 3, 4];
  let screen = $state(1);
  let card = $state<HTMLElement>();

  const project = $derived(workspace.project);
  const room = $derived(roomSize(project));
  const system = $derived(project.units);
  const goal = $derived(goalOf(project));
  const variant = $derived(activeVariant(project));
  const cab = $derived(cabinet(project));
  const ZONES = [0.25, 0.5, 1, null] as const;
  const fmt = (m: number) => formatLength(m, system, 'position', i18n.locale);
  const dims = ['width', 'length', 'height'] as const;

  /** The type whose typical values the speaker still has (as on the Speakers page). */
  const chosenType = $derived(
    SPEAKER_TYPES.find(
      (t) =>
        Math.abs((project.speaker.dimensions.w.value ?? -1) - t.w) < 1e-6 &&
        Math.abs((project.speaker.dimensions.d.value ?? -1) - t.d) < 1e-6 &&
        project.speaker.portLocation.value === t.portLocation &&
        project.speaker.driverLayout.value === t.driverLayout,
    )?.id ?? null,
  );

  /** A typical ceiling, assumed when it is left empty (the analysis needs one). */
  const TYPICAL_CEILING = 2.5;
  function assumeCeiling() {
    if (project.room.height.value !== null) return;
    workspace.edit(
      (p) => void (p.room.height = { value: TYPICAL_CEILING, certainty: 'estimated' }),
    );
  }

  async function go(next: number) {
    if (screen === 1) assumeCeiling();
    screen = next;
    await tick();
    card?.querySelector<HTMLElement>('h2')?.focus();
  }

  function finish() {
    if (room) assumeCeiling();
    ui.survey = false;
    ui.step = room ? 'results' : 'room';
    ui.reveal = true;
    setTimeout(() => (ui.reveal = false), 900);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') finish();
  }
</script>

<div class="backdrop" onkeydown={onKeydown} role="presentation">
  <div class="card" role="dialog" aria-modal="true" aria-labelledby="survey-title" bind:this={card}>
    <div class="top">
      <span class="count">{i18n.t('survey.step', { n: screen, total: TOTAL })}</span>
      <div class="dots" aria-hidden="true">
        {#each STEPS as n (n)}<span class:on={n <= screen}></span>{/each}
      </div>
      <button type="button" class="link" onclick={finish}>{i18n.t('survey.skip')}</button>
    </div>

    {#if screen === 1}
      <h2 id="survey-title" tabindex="-1">{i18n.t('survey.room.title')}</h2>
      <p class="help">
        {i18n.t('survey.room.help', {
          height: formatLength(TYPICAL_CEILING, system, 'room', i18n.locale),
        })}
      </p>
      <div class="fields">
        {#each dims as dim (dim)}
          <LengthField
            id="survey-{dim}"
            label={i18n.t(`room.${dim}`)}
            kind="room"
            value={project.room[dim]}
            {system}
            limits={ROOM_LIMITS[dim]}
            usual={USUAL_ROOM_RANGE[dim]}
            chips={false}
            onchange={(next) => workspace.edit((p) => void (p.room[dim] = next))}
          />
        {/each}
      </div>
    {:else if screen === 2}
      <h2 id="survey-title" tabindex="-1">{i18n.t('survey.goal.title')}</h2>
      <p class="help">{i18n.t('survey.goal.help')}</p>
      <div class="choices" role="radiogroup" aria-labelledby="survey-title">
        {#each GOALS as g (g)}
          <label class="choice">
            <input
              type="radio"
              name="survey-goal"
              checked={goal === g}
              onchange={() => workspace.edit((p) => setGoal(p, g))}
            />
            <span class="choice-title">{i18n.t(`survey.goal.${g}.name`)}</span>
            <span class="choice-sub">{i18n.t(`survey.goal.${g}.help`)}</span>
          </label>
        {/each}
      </div>
    {:else if screen === 3}
      <h2 id="survey-title" tabindex="-1">{i18n.t('survey.speaker.title')}</h2>
      <p class="help">{i18n.t('survey.speaker.help')}</p>
      <div class="types" role="radiogroup" aria-labelledby="survey-title">
        {#each SPEAKER_TYPES as type (type.id)}
          <label class="type">
            <input
              type="radio"
              name="survey-type"
              checked={chosenType === type.id}
              onchange={() => workspace.edit((p) => applySpeakerType(p, type.id))}
            />
            <SpeakerTypeIcon {type} />
            <span class="choice-title">{i18n.t(`speakers.type.${type.id}.name`)}</span>
          </label>
        {/each}
      </div>
    {:else}
      <h2 id="survey-title" tabindex="-1">{i18n.t('survey.where.title')}</h2>
      {#if goal === 'both' || !room}
        <p class="help">{i18n.t('survey.where.both')}</p>
      {:else}
        <p class="help">{i18n.t('survey.where.help')}</p>
        <div class="fields">
          {#if goal === 'speakers'}
            <LengthInput
              id="survey-seat"
              label={i18n.t('speakers.placement.seat')}
              value={variant.listener.ears.y}
              {system}
              limits={{ min: 0.1, max: room.L - 0.1 }}
              onchange={(y) => workspace.edit((p) => void moveSeat(p, { y }, { grid: false }))}
            />
          {/if}
          <LengthInput
            id="survey-clearance"
            label={i18n.t('speakers.placement.clearance')}
            value={variant.speakers.left.base.y - cab.d / 2}
            {system}
            limits={{ min: 0, max: room.L / 2 }}
            onchange={(v) => workspace.edit((p) => void setSpeakerClearance(p, v))}
          />
          <LengthInput
            id="survey-spacing"
            label={i18n.t('speakers.placement.spacing')}
            value={variant.speakers.right.base.x - variant.speakers.left.base.x}
            {system}
            limits={{ min: 0.3, max: room.W - cab.w }}
            onchange={(v) => workspace.edit((p) => void setSpeakerSpacing(p, v))}
          />
          {#if goal === 'speakers'}
            <fieldset>
              <legend>{i18n.t('speakers.limits.zone.legend')}</legend>
              <div class="seg" role="radiogroup" aria-label={i18n.t('speakers.limits.zone.legend')}>
                {#each ZONES as zone (zone ?? 'any')}
                  <label>
                    <input
                      type="radio"
                      name="survey-zone"
                      checked={project.constraints.speakerZone === (zone ?? undefined)}
                      onchange={() =>
                        workspace.edit((p) => {
                          if (zone === null) delete p.constraints.speakerZone;
                          else p.constraints.speakerZone = zone;
                        })}
                    />
                    {zone === null ? i18n.t('speakers.limits.zone.any') : fmt(zone)}
                  </label>
                {/each}
              </div>
            </fieldset>
          {/if}
        </div>
      {/if}
    {/if}

    <div class="actions">
      {#if screen > 1}
        <button type="button" class="link" onclick={() => go(screen - 1)}
          >{i18n.t('survey.back')}</button
        >
      {/if}
      {#if screen < TOTAL}
        <button
          type="button"
          class="btn primary"
          disabled={screen === 1 && !room}
          onclick={() => go(screen + 1)}>{i18n.t('survey.next')}</button
        >
      {:else}
        <button type="button" class="btn primary" onclick={finish}>{i18n.t('survey.done')}</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 16px;
    background: color-mix(in srgb, var(--bg) 70%, transparent);
    backdrop-filter: blur(18px);
    animation: fade 0.25s ease;
  }
  .card {
    display: grid;
    gap: 16px;
    width: min(520px, 100%);
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    padding: 24px;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow);
    animation: rise 0.3s ease;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .dots {
    display: flex;
    gap: 4px;
    flex: 1;
  }
  .dots span {
    width: 18px;
    height: 4px;
    border-radius: 2px;
    background: var(--grid);
    transition: background 0.2s ease;
  }
  .dots span.on {
    background: var(--accent-fill);
  }
  h2 {
    margin: 4px 0 0;
    outline: none;
  }
  .help {
    margin: -8px 0 0;
    color: var(--ink-muted);
    font-size: var(--text-md);
  }
  .fields {
    display: grid;
    gap: 14px;
  }
  .choices {
    display: grid;
    gap: 8px;
  }
  .choice,
  .type {
    position: relative;
    display: grid;
    gap: 2px;
    padding: 12px 14px;
    border-radius: var(--radius-md);
    box-shadow: 0 0 0 1px var(--grid);
    cursor: pointer;
  }
  .choice input,
  .type input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .choice:has(input:checked),
  .type:has(input:checked) {
    box-shadow: 0 0 0 2px var(--accent-fill);
  }
  .choice:has(input:focus-visible),
  .type:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .choice-title {
    font-size: var(--text-md);
    font-weight: 600;
  }
  .choice-sub {
    color: var(--ink-muted);
    font-size: var(--text-sm);
  }
  .types {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .type {
    justify-items: center;
    text-align: center;
  }
  .type :global(.icon) {
    width: 40px;
    height: 54px;
  }
  .type .choice-title {
    font-size: var(--text-sm);
  }
  fieldset {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    padding: 0;
    font-weight: 600;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    margin-top: 4px;
  }
  .actions .btn {
    min-width: 110px;
  }
  .link {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: var(--text-md);
    cursor: pointer;
  }
  .top .link {
    font-size: var(--text-sm);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .backdrop,
    .card {
      animation: none;
    }
  }
</style>
