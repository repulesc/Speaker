# Open Questions & Unverified Claims

Status: end of Phase 0. Questions are numbered so you can answer them by number.

## A. Questions for the owner

### Resolved

| # | Decision |
|---|---|
| Q1 | The owner's measurements are **not needed**: the product is universal. TEST_PLAN §7 uses a synthetic "busy room" built from the owner's description. |
| Q4 | Hungarian register: **informal (tegezés)**. Final. |
| Q6 | **No speaker model database at launch.** Users describe their own speaker; generic type presets help. |
| Q7 | Desk / near-field setups: **after v1**, first item in ROADMAP "Later". The owner wants them. |
| Q8–Q12 | Recommendations accepted by default when the owner said "proceed": rules of thumb shown but not scored; default thresholds labelled "rule of thumb"; the five goals; shape-and-word evidence tags; the "busy-ness" shortcut. Can be revisited at any time. |

### Still open (not blocking M1)

| # | Question | Recommendation | Blocks |
|---|---|---|---|
| Q2 | **Copyright holder name** for the MIT and CC BY license files (your real name, a pseudonym, or "Speaker Placement Advisor contributors"). | your choice | M6 |
| Q3 | **App name.** Working title "Speaker Placement Advisor". A shorter brand name usable in both languages? | one short name for both languages | M2 (title, PWA manifest) |
| Q5 | **Hungarian reviewer:** will you review all Hungarian strings, or nominate someone? | you, at each milestone | M5 |

## B. Technical decisions to confirm at the start of M1

| # | Decision | Proposal |
|---|---|---|
| T1 | Framework shape | Plain **Vite + Svelte 5 + TypeScript** single-page app, not SvelteKit (no routing or server needed; simpler to read) |
| T2 | Dev dependencies | Vitest, @testing-library/svelte, fast-check, Playwright, axe-core, ESLint, Prettier. Runtime dependencies: Svelte only, if possible |
| T3 | Engine in a worker | Vite `?worker` import; the engine stays callable synchronously in tests |
| T4 | Reference fixtures | Python + NumPy in `tools/reference/`, run locally; JSON fixtures committed; CI does not need Python |
| T5 | PWA | a minimal hand-written service worker (cache app shell). Avoid a plugin unless it stays small and readable |
| T6 | Charts | hand-rolled SVG for the bass chart and heatmap (two small components), no chart library |
| T7 | Speaker data licensing | only store facts (numbers) with attribution; do not copy measurement graphs or text. Ask permission before deriving data from third-party measurements (e.g. Erin's Audio Corner) |

## C. Unverified claims (must be ✓ or removed before launch)

### Sources

| Where | Claim | Action |
|---|---|---|
| RULE_CATALOGUE references | edition, volume and pages of [EVP], [ALL74], [SCH96], [EYR30], [BON81], [BOLT46], [DAV80], [WALL49] | check each against the original or a library catalogue |
| [ITU1116], [ITU775] | current revision numbers and clause references (ratio criterion, ±30°, loudspeaker height wording) | check ITU-R site |
| P08 | typical domestic T60 range (0.3–0.6 s) attributed to [TOOLE] | find the exact passage, or relabel as heuristic |
| P10 | constant 0.057 in `r_c = 0.057·sqrt(QV/T)` and the default Q = 2 | verify in [EVP] / [KUT] |
| G02 | 0.3 m / 0.6 m back-wall thresholds | keep labelled heuristic unless a source gives numbers |
| G08 | ITU-R BS.1116 loudspeaker-height recommendation | verify wording |
| G10 | Toole chapter on nearby-object reflections and diffraction | find the chapter |
| H01 | origin of the "38% rule" | trace, or say "origin unclear" |
| H02 | origin of the rule of thirds | trace, or say "folk rule" |
| H03 | Cardas ratios 0.276·W and 0.447·W and the listener rule | verify on the Cardas page, or drop H03 |
| H04 | "near or far" framing in [TOOLE] | verify, or rely on physics derivation only |
| H06 | which manufacturers document treble-vs-room guidance | collect manufacturer sources (KEF Connect first) |
| Appendix A | all absorption coefficients | check every row against the cited table; CD-wall and canvas rows stay "low confidence" |

### KEF LSX II LT

| Claim | Action |
|---|---|
| Rear port location, dimensions, driver sizes, DSP options and ranges | confirm on the KEF spec sheet or user manual (KEF website blocked from this environment; the data came from search summaries and reviews) |
| "No toe-in needed" (owner's belief) | look for an official KEF statement. Until then H05's experiment applies |

## D. Risks noted during Phase 0

1. **Model vs reality in lightweight or open rooms.** Mitigated by confidence caps and clear wording. Real rooms can differ by several dB from the modal model even with perfect inputs.
2. **Over-trust in the score.** Mitigated by words instead of percentages, spread whiskers, the disclaimer, and the listening protocol.
3. **Speaker data quality.** Mitigated by the `verified` flag, required sources, and no web lookup in v1.
4. **Scope creep** (desk mode, subs, measurements). Parked in ROADMAP "Later".
