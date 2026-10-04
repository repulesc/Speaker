# Roadmap (v1)

Each milestone ends with a short review and a demo the owner can click (from M2 on, a GitHub Pages preview). Model and effort suggestions follow PROJECT_BRIEF §10.

## M0 · Specification (this milestone)

- **Deliverables:** `RULE_CATALOGUE`, `DATA_MODEL`, `SCORING`, `UI_SPEC`, `I18N_AND_UNITS`, `TEST_PLAN`, `ROADMAP`, `OPEN_QUESTIONS`.
- **Acceptance:** the owner has read the documents and answered the open questions marked "owner". Blocking questions are resolved or explicitly deferred.

## M1 · Engine core (Opus, high effort): ✅ done

Delivered: scaffold and CI, units module, all v1 rules except H03, scoring, search, robustness, heatmaps, confidence, subjective mapping, actions, worker wrapper, Python reference fixtures, 125 tests. A minimal bilingual placeholder page proves the build and deploy pipeline.

- **Scope:**
  - project scaffold: Vite, Svelte, TypeScript strict, Vitest, ESLint, Prettier, GitHub Actions CI;
  - `src/units/` (parse and format);
  - `src/engine/`: P01–P11, G01–G10, H01–H06 overlays, S-rule mapping;
  - the scoring and confidence model, Web Worker wrapper;
  - `tools/reference/` with the independent Python fixtures.
- **Acceptance:**
  - every worked example in the rule catalogue passes as a unit test;
  - property invariants pass;
  - the engine matches the reference fixtures within tolerance;
  - Room R golden snapshot committed;
  - a full analysis runs in under 1.5 s in a worker (CI timing on the standard runner, with margin);
  - zero dependencies in `src/engine/` besides TypeScript.

## M2 · App shell, i18n, units, persistence (Sonnet, medium effort): ✅ done, one check open

Delivered: Blueprint tokens and self-hosted IBM Plex fonts, light and dark themes, top bar, stepper, desktop / tablet / phone layouts with a bottom sheet, EN and HU shell strings, unit fields with certainty chips, the Room step, live plan drawing, autosave, projects, undo and redo, export and import, share links, confidence meter (engine in a worker), PWA with offline support, the app name in one place, licenses, 22 end-to-end tests (including axe accessibility checks), a bundle-size guard (49 KB gzip), and CI with Pages deploy.

**Still open:** "the deployed preview URL works on an iPhone". It needs this branch merged to `main` and Pages switched on (Settings → Pages → Source: GitHub Actions); it can't be verified from the development sandbox.

- **Scope:**
  - Blueprint design tokens, self-hosted fonts, light and dark themes;
  - top bar, stepper, desktop, tablet and phone layouts, bottom sheet;
  - i18n system with EN and HU (shell strings);
  - unit fields with certainty chips;
  - autosave, projects, export and import, share link;
  - GitHub Pages deploy gated on CI.
- **Acceptance:**
  - E2E journeys 4–9 pass ✅;
  - axe shows no serious violations ✅;
  - initial JS ≤ 150 KB gzip ✅ (49 KB);
  - the deployed preview URL works on an iPhone (open, see above).

## M3 · Input steps and live drawing (Sonnet, medium effort; Opus review): ✅ built, review and owner test open

Delivered: all five input steps (Room, Surfaces, Furnishing, Speakers, Goals) plus a minimal Results summary; interactive top view and side view (drag, 5 cm snapping, centreline snap, mirror-lock, arrow-key nudging with one undo step per gesture); setup variants with tabs; the wall elevation editor with draggable patches and first-reflection rings; object palette with typed sizes and rotation; speaker types, speaker form, speaker file save and load; constraints (reach, seat modes, fixed speakers); 204 unit tests and 41 browser tests, with accessibility scans on every step in light and dark.

**Deliberate scope notes**
- *Results are minimal.* TEST_PLAN journeys 1 and 3 mention "findings" and a "comparison". In M3 the Results step shows score words, the confidence word and red-flag and caution counts; finding texts, zones, the bass chart and the variant comparison are M4 (they need the reviewed Hungarian and English copy for every finding).
- *Variants* can be created, renamed, deleted and switched, and are independent; scoring them side by side is M4.

**Open before M3 can be called closed**
- Opus review (physics-adjacent choices below).
- The owner enters their own room in Detailed mode without help in ≤ 10 minutes.

**Opus review: look at these**
1. Quick-mode "busy-ness" absorption ranges and the furniture defaults in `src/engine/presets/objects.ts` (all 🟡).
2. The default placement rule (equilateral triangle, rear panel 0.5 m from the front wall) and the placement limits in `src/app/plan/placement.ts` (`MIN_HALF_GAP`, seat height 0.3–2.0 m).
3. That patches (windows, CD walls, curtains) reach `P08` through `surfaceAbsorptionArea` (tested), and that first-reflection rings use `P06` only for the near side wall and floor/ceiling.
4. Hungarian strings in `src/i18n/hu.ts` added in M3 (owner will review).

- **Scope:**
  - Steps 1–5;
  - interactive top view and side view (SVG): drag, snap, keyboard move, undo and redo;
  - wall and patch editor;
  - object palette;
  - speaker entry form with generic type presets (no model database in v1); profile export and import;
  - variants.
- **Acceptance:**
  - E2E journeys 1–3 and 10 pass ✅;
  - a non-technical tester (owner) enters their room in Detailed mode without help in ≤ 10 minutes (open).

## M4 · Results (Opus for the result logic, Sonnet for the UI)

- **Scope:**
  - results page sections 1–9;
  - heatmaps, candidates and comparison;
  - bass chart;
  - "Why?" panels with sources;
  - confidence meter and hint;
  - rules-of-thumb overlay;
  - listening protocol and notes with S-rules;
  - print report.
- **Acceptance:**
  - all golden scenarios produce sensible, reviewed output;
  - no finding is shown without a rule ID, a level and a source;
  - Hungarian copy for all findings drafted.

## M5 · Review and hardening (Opus, xhigh effort)

- **Scope:** physics audit, bad-advice hunt, Hungarian native review, resolution of all ⚠ sources, external-tool spot checks recorded in `docs/verification/`, accessibility pass, performance pass, About and Sources page, disclaimer.
- **Acceptance:**
  - zero unresolved ⚠ in rules that ship;
  - all review checklists complete;
  - the owner signs off.

## M6 · Launch

- **Scope:** public GitHub Pages URL, README (EN and HU), LICENSE (MIT) plus LICENSE-docs (CC BY 4.0), contribution notes (how to propose a rule with a source; how to add a speaker with sources), and an issue template for "wrong advice" reports.
- **Acceptance:** the owner shares it with friends.

## Later (not v1, in rough priority order)

1. **Desk / near-field setups** (owner wants this; first after v1): desk-surface reflection, short distances, desk DSP modes.
2. Curated speaker database and web lookup ("suggest, then verify").
3. Subwoofer support (single sub, then multi-sub [WELTI06]).
4. Non-rectangular rooms (L-shape via approximate methods, with clear confidence caps).
5. Measurement import (REW export files).
6. More languages.
7. Donation link.

## Revamp (decided after owner testing): see [REVAMP_PLAN.md](REVAMP_PLAN.md)

The old M4–M6 above are replaced by phases R0–R5 in REVAMP_PLAN: a full audit first (R0, done: `docs/REVIEW_FINDINGS.md`), then engine additions (R1), the dark "Instrument" workbench with heatmaps, probe and explanations (R2, done), treatment advisor, listening log and room-mode explorer (R3), copy (R4) and a final audit (R5).
