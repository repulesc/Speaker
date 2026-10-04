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

## M2 · App shell, i18n, units, persistence (Sonnet, medium effort)

- **Scope:**
  - Blueprint design tokens, self-hosted fonts, light and dark themes;
  - top bar, stepper, desktop, tablet and phone layouts, bottom sheet;
  - i18n system with EN and HU (shell strings);
  - unit fields with certainty chips;
  - autosave, projects, export and import, share link;
  - GitHub Pages deploy gated on CI.
- **Acceptance:**
  - E2E journeys 4–9 pass;
  - axe shows no serious violations;
  - initial JS ≤ 150 KB gzip;
  - the deployed preview URL works on an iPhone.

## M3 · Input steps and live drawing (Sonnet, medium effort; Opus review)

- **Scope:**
  - Steps 1–5;
  - interactive top view and side view (SVG): drag, snap, keyboard move, undo and redo;
  - wall and patch editor;
  - object palette;
  - speaker entry form with generic type presets (no model database in v1); profile export and import;
  - variants.
- **Acceptance:**
  - E2E journeys 1–3 and 10 pass;
  - a non-technical tester (owner) enters their room in Detailed mode without help in ≤ 10 minutes.

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
