# Open Questions & Unverified Claims

Status: end of Phase 0. Questions are numbered so you can answer them by number.

## A. Questions for the owner

### Resolved

| # | Decision |
|---|---|
| Q1 | The owner's measurements are **not needed**: the product is universal. TEST_PLAN §7 uses a synthetic "busy room" built from the owner's description. |
| Q2 | License files use "Speaker Placement Advisor contributors" as the holder (done in M2). |
| Q3 | App name: decided later, after the product and site exist. It lives in `src/app/config.ts` only. |
| Q4 | Hungarian register: **informal (tegezés)**. Final. |
| Q5 | The owner reviews all Hungarian strings. |
| Q6 | **No speaker model database at launch.** Users describe their own speaker; generic type presets help. |
| Q7 | Desk / near-field setups: **after v1**, first item in ROADMAP "Later". The owner wants them. |
| Q8–Q12 | Recommendations accepted by default when the owner said "proceed": rules of thumb shown but not scored; default thresholds labelled "rule of thumb"; the five goals; shape-and-word evidence tags; the "busy-ness" shortcut. Can be revisited at any time. |

### Still open

None. Everything from Phase 0 is decided or deferred.

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

**R5 status:** resolved, except where marked. Details and the sources found are in RULE_CATALOGUE (References, Appendix A) and `docs/REVIEW_R5.md`. The build environment could reach search summaries and package registries only, so book chapters were not opened.

| Where | Claim | R5 result |
|---|---|---|
| References | edition, volume and pages of [EVP], [ALL74], [SCH96], [EYR30], [BON81], [BOLT46], [DAV80], [WALL49] | ✓ all; [ALL74] corrected to 22(6); [ALL74] pages and two issue numbers not confirmed (dropped) |
| [ITU1116], [ITU775] | current revisions, loudspeaker height wording | ✓ BS.1116-3 (2015), BS.775-4 (2022); height wording ✓ from secondary summaries |
| P08 | typical domestic T60 (0.3–0.6 s) | ✓ supported by dwelling surveys [DWELL] (0.33–0.51 s); the [TOOLE] attribution is dropped |
| P10 | constant 0.057 | ✓ by derivation; default Q = 2 stays a 🟡 assumption |
| G02 | 0.3 / 0.6 m thresholds | 🟡 heuristic, labelled so |
| G08 | ITU-R BS.1116 height wording | ✓ |
| G10 | Toole chapter | no number depends on it; 🟡 threshold |
| H01 / H02 | origins | the app says "origin unclear" / "folk rule" |
| H03 | Cardas | dropped from v1 |
| H04 | "near or far" | derived from physics (P04) |
| H06 | manufacturer guidance | 🟡, "try it and listen", no manufacturer named |
| Appendix A | absorption coefficients | compared row by row with a second table [PRA]; **plastered brick fixed** (was plaster-on-lath data), lath is its own choice; window glass differs between tables (noted) |

### KEF LSX II LT

No speaker model data ships in v1 (Q6), so nothing here reaches users. If a profile is added later, the claims below must be checked first.

| Claim | Action |
|---|---|
| Rear port location, dimensions, driver sizes, DSP options and ranges | confirm on the KEF spec sheet or user manual |
| "No toe-in needed" (owner's belief) | look for an official KEF statement. Until then H05's experiment applies |

## D. Risks and model limits

1. **Model vs reality in lightweight or open rooms.** Mitigated by confidence caps and clear wording. Real rooms can differ by several dB from the modal model even with perfect inputs.
2. **Over-trust in the score.** Mitigated by words instead of percentages, spread whiskers, the disclaimer, and the listening protocol.
3. **Speaker data quality.** Mitigated by the `verified` flag, required sources, and no web lookup in v1.
4. **Scope creep** (desk mode, subs, measurements). Parked in ROADMAP "Later".
5. **Modal-sum truncation (found in M1).** The point-source modal sum converges slowly: raising the truncation from 1.5× to 4× the top frequency moved raw bass curves by up to ≈ 1.5 dB, without settling monotonically. Mitigations:
   - the scored band is capped at 200 Hz (C1/C2), with the front-wall dip above it scored by C3;
   - 1/6-octave smoothing;
   - robust scoring.

   Rankings were checked to be stable: the best placement is the same, or tied, at 1.5× and 3.5× truncation in three test rooms. The M5 external cross-check (REW / amroc) should look at this specifically.

   R0: after 1/6-octave smoothing, 1.5× and 4× truncation differed by at most 0.7 dB between 90 and 285 Hz in Room R (five speaker distances). The raw-curve differences above are mostly smoothed away.
6. **Calibration choices introduced in M1** (all 🟡, in `src/engine/scoring/thresholds.ts` and the presets), as judged in the R0 audit (`docs/REVIEW_FINDINGS.md`, "Calibration choices"):
   - furniture absorbs less at low frequencies (×0.5 at 125 Hz, ×0.8 at 250 Hz): kept;
   - the busy-ness ranges: **changed in R0** to absorption per m² of floor (bare 0–0.2, some 0.3–0.6, busy 0.5–0.9, very busy 0.7–1.2), with placed objects counting when they add up to more;
   - P05 gain categories: kept;
   - the P04 "aligned boundaries" rule (two boundaries within 10%): kept, but a caution only above the scored bass band (R0);
   - P08 dead/live bands (0.3 / 0.6 s): kept.

   Added in R0, also 🟡: P09 reports 6–10 dB as information and a caution beyond 10 dB; bass is not scored when less than half an octave of the band is left; P11 counts coincidences only in third-octave bands with fewer than five modes (Bonello).
7. **H03 (Cardas) is not implemented**: its numbers are unverified (section C).

