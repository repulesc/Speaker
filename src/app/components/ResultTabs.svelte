<script lang="ts">
  import { i18n } from '../../i18n/locale.svelte';
  import { ui, type ResultTab } from '../ui.svelte';
  import SuggestionCard from './SuggestionCard.svelte';
  import TreatPanel from './TreatPanel.svelte';
  import WhyTab from './WhyTab.svelte';

  /**
   * The result in three tabs instead of pages with "Back" (owner decision, docs/ROADMAP_V5.md, V6):
   * the answer, the reasons behind it, and what else to try. On a touch screen a sideways swipe
   * moves between them too.
   */
  const TABS: readonly ResultTab[] = ['result', 'why', 'tips'];

  let start: { x: number; y: number } | null = null;
  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    start = t ? { x: t.clientX, y: t.clientY } : null;
  }
  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    start = null;
    // A clear sideways swipe only: scrolling and taps stay what they are.
    if (Math.abs(dx) < 60 || Math.abs(dx) < 2 * Math.abs(dy)) return;
    const i = TABS.indexOf(ui.tab) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < TABS.length) ui.tab = TABS[i]!;
  }
</script>

<div class="tabs">
  <div class="seg switch" role="tablist" aria-label={i18n.t('tabs.label')}>
    {#each TABS as t (t)}
      <button
        type="button"
        role="tab"
        id="tab-{t}"
        aria-selected={ui.tab === t}
        aria-controls="tabpanel"
        tabindex={ui.tab === t ? 0 : -1}
        onclick={() => (ui.tab = t)}
        onkeydown={(e) => {
          const i = TABS.indexOf(t);
          const next =
            e.key === 'ArrowRight'
              ? TABS[(i + 1) % TABS.length]
              : e.key === 'ArrowLeft'
                ? TABS[(i + TABS.length - 1) % TABS.length]
                : null;
          if (!next) return;
          e.preventDefault();
          ui.tab = next;
          document.getElementById(`tab-${next}`)?.focus();
        }}>{i18n.t(`tabs.${t}`)}</button
      >
    {/each}
  </div>

  <div
    class="panel"
    id="tabpanel"
    role="tabpanel"
    tabindex="-1"
    aria-labelledby="tab-{ui.tab}"
    ontouchstart={onTouchStart}
    ontouchend={onTouchEnd}
  >
    {#if ui.tab === 'result'}
      <SuggestionCard />
    {:else if ui.tab === 'why'}
      <WhyTab />
    {:else}
      <TreatPanel />
    {/if}
  </div>
</div>

<style>
  .tabs {
    display: grid;
    gap: 14px;
  }
  .switch {
    display: flex;
  }
  .switch button {
    position: relative;
    flex: 1;
    min-height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: 7px;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
  }
  .switch button[aria-selected='true'] {
    background: var(--thumb);
    box-shadow:
      0 1px 3px rgb(0 0 0 / 0.16),
      0 0 0 0.5px rgb(0 0 0 / 0.06);
    color: var(--thumb-ink);
    font-weight: 600;
  }
  .switch button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  @media (pointer: coarse), (max-width: 1023px) {
    .switch button {
      min-height: 44px;
    }
  }
</style>
