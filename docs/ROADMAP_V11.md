# V11 — UX cleanups, URL state, converging placement (plan for Sonnet)

## Context

Owner review of 11 Oct 2026 (Opus audit, quiz answered). Problems: tab title "Nodo"; logo pinned
left; a "Rooms on this device" list from multi-slot localStorage; ESS split across two brands; and
an endless "Apply" loop. The loop's root cause: `scoring/search.ts` limits the search to a zone
around where the speakers stand now (`constraints.speakerZone`), so every Apply moves the zone and
the next search finds another micro-gain. Product stance: speakers on dedicated stands, tape-measure
users, no measurement gear.
Owner decisions: Q1 URL on settle + one recovery copy; Q2 hybrid candidates (named seeds refined
by the existing scorer); Q3 auto-lock after Apply, any move unlocks; Q4 no analytics.
Out of scope: Tab 3 (Fülpróba) and every audio-test component.

Rules from CLAUDE.md apply: every placement idea is a rule with formula, source, evidence level
and tests; no invented citations (unverified → marked ⚠, like H03); EN+HU strings; metres inside.

## Batch 1 — cleanups

1. **Title "NODO".** `index.html` `<title>%APP_NAME%</title>`: make the replacement (vite config)
   insert `APP_NAME.toUpperCase()`. `APP_NAME` itself stays the single source in `src/app/config.ts`.
2. **Centred logo.** `Sidebar.svelte` (`.mast .bar`) and `MenuDrawer.svelte` header: three-column
   grid `[menu] [logo centred] [history / close]` with equal outer columns (`1fr auto 1fr`), the
   room name under the logo when set. Keep 44 px targets; check axe + typescale e2e.
3. **ESS brand.** Entries `ess-amt-1b-bookshelf` and `ess-labs-amt-1d-revival`: brand "ESS" for
   both; AMT-1D model "AMT-1D Revival", `aka` gains "ESS Labs AMT-1D". Rename file/id to
   `ess-amt-1d-revival` (the shipped-list test checks file = id). KEF: the data has no AMT flag;
   add a unit test that only entries with `special: 'amt'` show the AMT note, and confirm with the
   owner where they saw KEF under AMT (screenshot) before changing anything else.
4. **Room size in Tab 1:** already in `SetupRoom.svelte` under "Szoba"; no change. Onboarding has
   no name prompt; no change.

## Batch 1 — URL as source of truth (Q1)

- New `src/app/state/urlState.svelte.ts`:
  - On settle, write the project to `location.hash` with `encodeShare` (`src/app/state/share.ts`,
    existing `#p=` deflate format) via `history.replaceState`. "Settle" = after `workspace.edit`,
    skipped while `ui.dragging` (new flag set by PlanView pointerdown/up and the turn handle), and
    flushed on drag end and input blur.
  - `history.pushState` only for Apply and Start over, so Back undoes them.
  - `popstate` → `decodeShare` → load as one undoable step (reuse the App.svelte share-load path).
- Recovery: replace multi-slot storage (`persistence.ts`: `spa:index`, `spa:project:<id>`,
  `spa:active`) with one key `spa:last` holding the last project; the bare URL restores it. On
  first run, migrate the active project into `spa:last`; leave the old keys untouched (no data
  deleted).
- Remove the rooms list and `switchTo` from `MenuDrawer.svelte` / `workspace.svelte.ts`;
  i18n `project.switcher` goes (EN+HU). The "Share" action keeps working (it is the URL now).
- Guard: if `encodeShare` exceeds `SIZE_LIMITS.shareChars`, keep the last good hash and save to
  `spa:last` only.

## Batch 2 — converging recommendation (Q3)

- Project field (schema + `tidy`): `variant.applied?: { placement: Placement; idea: string; at }`,
  set by `applyCandidate` (`src/app/plan/placement.ts`).
- Derived `locked = applied && samePlacement(current, applied.placement, 0.01 m)`: any drag,
  typed position, room or speaker change makes it false by itself. A room/speaker edit also clears
  `applied`. It travels in the URL, so a reload keeps the state.
- `SuggestionCard.svelte` when locked: "Optimised position active", the idea name, the tape
  measures, and one button "Look again" (clears `applied`, runs a search). No candidates are
  computed while locked (skip the `analysis.ask` for suggestions).
- EN/HU strings: `suggest.locked`, `suggest.lockedHelp`, `suggest.lookAgain`.

## Batch 2 — hybrid candidates (Q2)

- New engine module `src/engine/scoring/seeds.ts` (pure, no UI imports). Each seed is a rule
  file-sized function with formula, source, evidence level:
  - S1 equilateral triangle with the seat at 38 % of L (reuse H01 `H01_SEAT_FRACTION`, G04 angle).
  - S2 boundary loading: speakers close to the front wall, only for sealed / front-ported or when
    the maker's minimum wall distance allows; rear ports keep G07 clearance.
  - S3 wide stance with long-wall distance rules — only if a verifiable source is found; otherwise
    mark ⚠ unverified in the catalogue and leave it out of the app (as H03).
  - S4 the best result of the existing whole-room search (no zone), so the engine can still find
    something the rules miss.
- Each seed is refined by `searchPlacements` with a small zone (≈0.3 m) around the seed, not
  around the current position; scored by the existing `Scorer`; red flags and hard constraints as
  today. Show the top 2–3 that are ≥ 0.3 m apart; each card names its idea ("Equilateral, 38 %
  seat", "Close to the wall", "Room's best bass").
- The user zone (`speakerZone`) still applies when the owner chose "speakers may move N cm":
  intersect it with the seed zone; with no seeds left inside, fall back to today's behaviour.
- Docs: catalogue rows for S1–S4, `docs/ROADMAP_V11.md` with these calls; DATA_MODEL `applied`.

## Files to touch (representative)

`index.html`/`vite.config.ts`, `Sidebar.svelte`, `MenuDrawer.svelte`, `workspace.svelte.ts`,
`persistence.ts`, new `urlState.svelte.ts`, `App.svelte`, `PlanView.svelte` (dragging flag),
`SuggestionCard.svelte`, `placement.ts`, `schema.ts`, `tidy.ts`, `engine/types.ts`,
new `engine/scoring/seeds.ts`, `engine/scoring/search.ts`, `data/speakers/entries/ess-*`,
`src/i18n/en.ts`, `hu.ts`, docs.

## Verification

- Unit: seeds (each respects hard constraints, G07, red flags; distinct ≥ 0.3 m), `samePlacement`
  and lock derivation, URL round-trip (encode → decode equals), migration to `spa:last`, ESS
  brand merge, KEF has no AMT note.
- e2e: title is "NODO"; logo centred (bounding box centre within 4 px of header centre); no rooms
  list; Apply → "Optimised position active" and no new suggestion after a reload; drag a speaker →
  suggestions return; Back after Apply restores the previous positions; reload of the bare site
  restores the last room; opening a `#p=` link loads it exactly; Tab 3 tests untouched and green.
- Gates: `npm test`, `check`, `lint`, `build`, `check:size` (≤ 150 KB), `test:e2e`; the CI guard
  that `dist` holds no invented speakers stays.
- One PR, then merge on green.

## As built (adjustments to the plan)

- **Storage:** the existing keys (`spa:project:<id>`, `spa:active`) are kept instead of a new
  `spa:last`: one room per device is enforced by `Workspace.load` (a room from a link or Back
  replaces the open one, which the device forgets) and `startOver`. The room list UI and
  `switchTo`/`importProject` are gone. Older stored rooms are not touched.
- **URL state:** `src/app/state/urlState.svelte.ts`. The address follows the saved room (400 ms
  after the last edit), never while a pointer is down; `replaceState` throughout, `pushState` only
  in `UrlState.step` (Apply, Start over). A fragment we wrote ourselves is skipped; an unreadable
  one is refused and cleaned.
- **Converged state:** `src/engine/converged.ts`; `variant.applied` records the layout, the idea
  and a key of the room and speaker; `analyze` returns no candidates while it holds.
- **Ideas:** S1 equilateral triangle (seat near 38 %), S2 close to the front wall (never closer
  than the port allows), S4 best overall; each refined by the existing scorer within 0.2 m (S2:
  0.1 m from the wall, 0.4 m spread, 0.5 m seat). S3 "wide stance" is not built: no verified
  source (⚠ unverified, as H03). Ideas are skipped when a speaker or the seat is fixed, and under
  a compromise search.
- **Not changed:** Tab 3 (listening check) and its audio tests. The KEF "under AMT" report could
  not be reproduced: only the two ESS entries carry the AMT note (a test now guards this).
