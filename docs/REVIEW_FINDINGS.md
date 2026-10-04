# Review Findings (Phase R0 audit)

Status: R0 complete. Every critical and high finding is fixed and has regression tests. **R1 update:** M1, M2, M4, M6, M7, M8, M9, M11, L3 and L10 are fixed too, and M5 is decided (marked below); the rest remain proposals.

**Scope:** the whole mechanics as of commit `f9b2bb7`:

- engine physics, scoring, search, robustness and confidence;
- calibration choices and sources;
- app state: workspace, autosave, share links, file import;
- placement, i18n, accessibility, offline use and deploy;
- the test suite.

No new features.

**Method:**

- Every formula was re-derived.
- The engine was run on nine rooms: Room R (4 × 5 × 2.5 m), the busy room, 6 × 8 × 3, a 4 m cube, 3 × 8 × 2.5, 2.5 × 3 × 2.4, 3.6 × 4.4 × 2.7, 4.3 × 5.9 × 2.7, and a sealed floorstander in 4.5 × 6 × 2.6.
- The search was compared with an exhaustive 5 cm search.
- Room proportions were swept over 2,424 plausible rooms.
- Hostile but well-formed projects were fed to the importer and the engine.
- A crafted share link was opened in the production build.

Numbers below come from those runs. The regression tests in `tests/engine/review-r0.test.ts` (named after the findings), `tests/engine/golden.test.ts`, `tests/app/*.test.ts` and `tests/e2e/journeys.spec.ts` reproduce the key ones. The tests for C1, C3, H2, H3, H4 and H5 were also run against the old code, where they fail.

**Severity:**

| Level | Meaning |
|---|---|
| Critical | The app gives confidently wrong advice, or a link can break it. |
| High | Misleading output or broken mechanics in realistic use. |
| Medium | Wrong in edge cases, or a calibration worth changing. |
| Low | Cosmetic, documentation, or defence in depth. |

## Summary

| ID | Severity | Finding | Status |
|---|---|---|---|
| C1 | critical | The recommended spot can carry a red flag from the app's own rules | Fixed |
| C2 | critical | NaN scores are shown as "very good" | Fixed |
| C3 | critical | A crafted share link makes the app unusable until site data is cleared | Fixed |
| H1 | high | Cautions that fire for almost every room and seat ("Cautions: 7") | Fixed |
| H2 | high | Placing furniture can make the room more reverberant | Fixed |
| H3 | high | Typical furnished rooms are estimated far too reverberant ("live") | Fixed |
| H4 | high | The ranking of near-equal candidates is decided by random noise | Fixed |
| H5 | high | Well-formed files and links that crash the engine or give NaN; stale results after a failure | Fixed |
| H6 | high | No golden scenarios (TEST_PLAN §5), so C1 slipped through | Fixed |
| M1–M14 | medium | See below | Proposals |
| L1–L14 | low | See below | Proposals |

## Critical

### C1 · The recommended spot can carry a red flag from the app's own rules — fixed

- **Evidence:**
  - In 3 of 9 rooms the best candidate's seat was at the room midpoint, which G01 red-flags:
    - 4 m cube: seat at 1.80 m (L = 4);
    - 2.5 × 3 × 2.4 m: 1.50 m (L = 3);
    - 4.3 × 5.9 × 2.7 m: 3.15 m.
  - In the small room, seat scores along the centreline from y = 0.9 to 2.1 m were 0.637, 0.761, 0.823, **0.938 (midpoint)**, 0.898, 0.798, 0.538.
  - At the exact midpoint the first length mode drops out: −4 dB near 57 Hz. A +9 dB peak seen elsewhere also disappears. So the smoothness score (C1, σ of the curve) and the dip score (C2, relative to the median) both prefer the midpoint, while G01 calls it a red flag.
- **Why it matters:** the app recommended a position and red-flagged it at the same time.
- **Fix:**
  - Red flags that depend on what the search moves are now hard constraints (`avoidsRedFlags` in `src/engine/scoring/search.ts`):
    - G01: the seat within 5% of the midpoint;
    - G02: the seat closer than 0.3 m to the back wall;
    - G04: a stereo angle outside 35–90°;
    - G06: a speaker in a corner.
  - If the user's own constraints leave no such spot (for example a seat range inside the midpoint band), the search falls back and the red flag stays.
  - The red-flag thresholds now live once, in the rule files.
- **After:** no candidate carries a red flag in any of the nine rooms. Cautions and red flags at the best spot dropped from 3–7 per room to 0–2.
- **Tests:**
  - `review-r0` "C1 ·" (three rooms, plus the fallback);
  - golden "Room R … avoids the midpoint".

### C2 · NaN scores are shown as "very good" — fixed

- **Evidence:**
  - A speaker −6 dB point of 201–500 Hz (the speaker form accepts 10–500 Hz) leaves the scored bass band empty.
    - Current and best scores become NaN.
    - `scoreWord(NaN)` in `StepResults.svelte` fails every comparison and returns "very good".
    - P09 reports "smooth".
    - In very large rooms (Schroeder frequency below 80 Hz), the band tops out at 120 Hz, so this already happens from 121 Hz.
  - A one-value `absorptionRange` in a file gives a NaN reverberation time, and NaN everywhere after it.
  - A seat dragged onto a speaker's front baffle (a 5 cm grid point) gives C4 = NaN, and G04 says "ok" with angle `null`.
- **Fix:**
  - The bass band is never empty (`bassBand` in P09). With less than half an octave left, the bass is not scored: C1 and C2 get weight 0 and P09 reports `notScored`.
  - The stereo angle is 0° (a red flag) when the seat is on a speaker.
  - The mean absorption never goes below 0.01.
  - A component that cannot be computed counts as 0.
  - The UI never reads a non-finite score as good: it shows "poor".
  - Schema fixes (H5).
- **Tests:**
  - `review-r0` "C2 ·": f6 of 201, 250 and 500 Hz; the band function; the seat on a speaker; a property test over random placements;
  - golden "satellite speaker".

### C3 · A crafted share link makes the app unusable until site data is cleared — fixed

- **Evidence:**
  - Two setups (variants) with the same id passed validation.
  - The UI keys lists by id, and Svelte throws `each_key_duplicate` in production builds too.
  - The imported project is autosaved before it renders.
  - Verified with the production build in Playwright: the first load throws, and a reload shows a blank page.
  - The only way out was clearing site data, which also deletes every saved project.
  - Duplicate object or patch ids break the plan and surfaces views the same way.
- **Fix:**
  - The validator rejects duplicate ids in setups, objects, patches and notes (`distinctIds` in `src/app/state/validate.ts`). A stored project that fails validation is never opened.
  - A Svelte error boundary in `App.svelte` replaces a blank page with "This project cannot be shown", with *Export file* and *Start a new project*. This is defence in depth against unknown render errors.
  - The stored project list is de-duplicated by id.
- **Tests:**
  - `projectFile.test.ts` "rejects well-formed files that would break the app";
  - `share.test.ts`;
  - `workspace.test.ts`;
  - e2e "a crafted share link is refused, and the app still works after a reload".

## High

### H1 · Cautions that fire for almost every room and seat — fixed

This is the engine side of the owner's "Cautions: 7, and I can't tell what they are".

- **Evidence:**
  - **P11 coincident modes.** The plain 5% test flagged 99.7% of 2,424 plausible rooms (W 2.8–6 m, L 3.4–8 m, H 2.3–3.0 m), 4.9 pairs per room on average. It emitted up to three separate cautions. RULE_CATALOGUE P11 asks for one result per check.
  - **P09 peaks and dips.** Every peak or dip over 6 dB was a caution. The *best* spot found had a dip of 6.3–9.9 dB in 6 of 9 rooms, and a 6.8 dB peak in a seventh. Real rooms almost always do.
  - **P04 "aligned boundaries".** A caution in 6 of 9 default setups, even when the combined dip lies inside the modelled bass band. There P09 already models and scores it, and the catalogue calls P04 an explanation.
  - **G10.** One finding per speaker for an object near both.
- **Fix:**
  - **P11:** one finding, only for coincidences in third-octave bands with fewer than five modes (Bonello's second criterion). 30.7% of the same 2,424 rooms get it; Room R (68.6 Hz) and the 4 m cube still do.
  - **P09:** 6–10 dB is information; beyond 10 dB it is a caution.
  - **P04 "aligned":** a caution only above the scored bass band.
  - **G10:** one finding per object, for the nearer speaker.
- **After:** cautions now separate poor setups (2–4) from the best spots (0–2), and each one left is meaningful: stacked room modes, an uneven wall (the CD wall), a passive speaker nearby, or being near the midpoint.
- **Tests:** `review-r0` "H1 ·" (five tests).

### H2 · Placing furniture can make the room more reverberant — fixed

- **Evidence:**
  - Placed objects *replaced* the busy-ness estimate. In Room R with "some furniture", T60 was 0.79 s.
  - Placing a bed swapped 3–7 m² of estimated furnishing for the bed's 1.5–3 m², and T60 rose to 1.07 s.
  - The UI said the placed furniture is used "instead of this estimate". But placed furniture is rarely all of it, and adding an absorber must never raise T60.
- **Fix:** the busy-ness estimate always applies ("some" when unknown). Placed objects count when they add up to more, never less. The furnishing help text says so in English and Hungarian.
- **Tests:** `review-r0` "H2 ·" (the bed example, plus a property test over object kinds and busy-ness levels).

### H3 · Typical furnished rooms are estimated far too reverberant — fixed

- **Evidence:**
  - With the default surfaces and "some furniture", 7 of the 8 test rooms that use that setting read as "live", at 0.72–1.43 s mid-band. Only the smallest (2.5 × 3 × 2.4 m, 0.39 s) did not:

    | Room | T60 (s) |
    |---|---|
    | Room R | 0.79 |
    | 6 × 8 × 3 m | 1.43 |
    | 4.3 × 5.9 × 2.7 m | 0.96 |
    | 3.6 × 4.4 × 2.7 m | 0.72 |

  - Typical domestic rooms measure about 0.3–0.6 s (`DEFAULTS.t60Range`; the source is still ⚠).
  - The busy-ness amounts were fixed m² values, so bigger rooms got the same furniture as small ones.
  - This fed P08 ("live"), the Schroeder frequency (the top of the bass band), modal damping, and H06's treble advice.
- **Fix:** busy-ness is now absorption per m² of floor (🟡):

  | Level | m² sabins per m² of floor |
  |---|---|
  | bare | 0–0.2 |
  | some | 0.3–0.6 |
  | busy | 0.5–0.9 |
  | very busy | 0.7–1.2 |

  The values are anchored so that Room R with the default surfaces gives about 1.1 s (bare), 0.56 s (some), 0.37 s (busy) and 0.28 s (very busy).
- **After:**
  - Six typical rooms (3 × 4 × 2.4 m up to 6 × 8 × 2.7 m) land between 0.52 and 0.65 s.
  - The busy room reads "dead" (0.23 s), so H06 now suggests the small treble lift TEST_PLAN §7 expects.
  - Rooms with very high ceilings stay "live", as they should (4 m cube: 0.80 s).
- **Tests:**
  - `review-r0` "H3 ·";
  - the Sabine reference test now passes the furnishing directly, so it checks the formula, not the calibration.

### H4 · The ranking of near-equal candidates is decided by random noise — fixed

- **Evidence:**
  - The robust score is the mean over eight perturbed runs minus half their spread.
  - For the same placement it varied by 0.022–0.075 across seeds.
  - Reversing the order of the pool changed it by up to 0.044: each placement drew its own position errors from one shared random stream.
  - The order of the top six changed with every seed (Room R orders: 024153, 214035, 201435, …).
  - An unrelated edit that reorders the pool could move "best spot A" by tens of centimetres.
- **Fix:** common random numbers. The eight perturbed rooms and the position errors are drawn once per analysis and applied to every placement, the current setup included.
- **After:**
  - A placement's robust score no longer depends on the pool (exactly equal when reordered or scored alone).
  - Clearly fragile spots stay last for every seed.
  - Only near-ties (within about 0.01) still swap.
- **Tests:** `review-r0` "H4 ·".

### H5 · Well-formed files and links that crash the engine or give NaN; stale results after a failure — fixed

- **Evidence:** each of these passed the validator.
  - A surface map missing a boundary threw `TypeError` in the engine on every analysis of that project.
  - A one-value absorption range gave NaN.
  - Custom absorption with 2 instead of 6 bands was silently misread.
  - An empty or reversed seat range gave zero candidates.
  - When an analysis failed, the error card appeared but the *previous* results stayed on screen beside it, describing a project that no longer existed.
- **Fix:**
  - Exact lengths for band values and ranges.
  - Ordered ranges.
  - All six boundaries required in `surfaces.base` and `surfaces.baseCertainty`.
  - At least one setup.
  - The search normalises the seat range.
  - A failed analysis clears the old result.
- **Tests:** `projectFile.test.ts` (12 cases), plus C2's tests.

### H6 · No golden scenarios — fixed

- **Evidence:** TEST_PLAN §5 lists nine golden scenarios; none existed. The only midpoint check covered Room R and the busy room, so C1 went unnoticed.
- **Fix:** `tests/engine/golden.test.ts` covers all nine scenarios plus a satellite speaker. Each has a snapshot of the top three candidates, scores and findings, and an assertion of what the scenario is for. A changed snapshot means the advice changed and needs review.

## Medium (proposals)

**M1 · The C1/C3 hand-over has a cliff.** **Fixed in R1**: C3 uses the null at the seat and fades in over a third of an octave.
- **Evidence:**
  - The front-wall dip counts in C3 only above the scored band. Inside it, C1 "already includes it", but the modal model shows the steady-state front-wall dip as only a few dB.
  - In Room R, moving the speakers 2 cm (rear clearance 0.17 → 0.19 m, null 204 → 195 Hz) lifts C3 from 0.30 to 1.00 and the total from 0.777 to 0.850, while C1 stays at 0.79 and C2 moves by 0.01.
  - C3 also uses the on-axis `c/4d`. For a listener 30° off the wall's normal the null sits 10–15% higher: with the woofer 0.5 m from the wall and the seat 1.65 m from it, 188 Hz rather than 172 Hz.
  - It did not move the optimum in the nine rooms.
- **Proposal:** compute the null from the actual front-wall reflection path (P06's delay, `f = 1/(2Δt)`), and taper the hand-over over a third of an octave.

**M2 · C3 gives speakers with a wall-distance DSP setting a free pass.** **Fixed in R1.**
- **Evidence:** C3 is 1 whenever the rear panel is within 0.3 m and the speaker has a wall setting. For cabinets 0.18–0.3 m deep, that covers every front-wall null between the top of the bass band (145–200 Hz) and 300 Hz. EQ cannot fill a cancellation; a wall setting corrects the bass *gain*.
- **Proposal:** remove the exception and keep G07's reminder. One line plus a test. It changes rankings for the owner's speaker type.

**M3 · The default wall material carries the wrong data.** **Fixed in R5** (`docs/REVIEW_R5.md`, F1).
- **Evidence:** "plaster-brick" holds the classic values for rough plaster *on lath* (0.14 at 125 Hz, panel absorption). Plaster on masonry is about 0.01–0.02 at 125 Hz (from memory, ⚠ check against the table). It is the default for the walls and the ceiling, so it sets much of the predicted low-frequency damping.
- **Proposal:** split it into "plaster on masonry" and "plaster on lath or board", check both rows against the table, then re-check the H3 anchors.

**M4 · "Flat response" de-emphasises C3, which is physics.** **Fixed in R1.**
- **Evidence:** SCORING §3 divides "guideline weights (C3–C7)" by 1.2. C3 is labelled 🔴, and the front-wall dip is exactly what a flat-response goal cares about.
- **Proposal:** divide only C4–C7.

**M5 · The best spot can sit in G01's caution band** (5–10% from the midpoint). **Decided in R1:** the model wins; the G01 caution text (R4) will say the full model accounts for the missing mode at that seat.
- **Evidence:** after C1, this happens in 3 of 9 rooms (6 × 8, the cube, the small room). The model prefers those spots; the guideline's own words say "move by at least 10%".
- **Decision for R1:**
  - *Recommended:* let the model win, and have the G01 caution text say that the full model accounts for the missing mode at this seat.
  - *Alternative:* extend the search guard to 10%.

**M6 · Heatmaps do not mark red-flag zones.** **Fixed in R1**: the seat layers carry a red-flag mask.
- **Evidence:** the seat heatmap applies only physical validity, so the midpoint band can show as the brightest cells while the pins avoid it.
- **Proposal:** R1's layers hatch the G01 and G02 bands and the corners.

**M7 · G08 can red-flag every candidate.** **Fixed in R1** as advice D04 (the base height for ear-level tweeters); heights are still not searched.
- **Evidence:** heights are not searched, so low speakers carry the same G08 red flag at every candidate.
- **Proposal:** a "raise or tilt the speakers" action; consider searching heights in R1.

**M8 · Typed clearance and stand height move only the left speaker when the mirror lock is off.** **Fixed in R1.**
- **Evidence:** `setSpeakerClearance` and `setStandHeight` in `src/app/plan/placement.ts` move one speaker, but the fields read as both ("Back of the speakers to the front wall").
- **Proposal:** apply both values to both speakers.

**M9 · The DSP block is not validated.** **Fixed in R1.**
- **Evidence:** `dsp: obj({})` accepts anything. It is only read as booleans today, but R1's settings advice will read the ranges.
- **Proposal:** validate the treble and bass ranges (min ≤ max, step > 0), the booleans, and the placement-mode strings.

**M10 · Large rooms are slow.** **R5:** typical rooms are within budget; large rooms now say they take a few seconds.
- **Evidence:** on a desktop, 12 × 12 × 4 m takes 1.3 s, 15 × 20 × 4 m 2.1 s and 20 × 30 × 6 m 7.9 s; a phone is roughly 3–5 times slower. The budget is 1.5 s on a phone. The engine runs in a worker, so the UI stays responsive.
- **Proposal:** scale the coarse step with the room size, cap the mode count, or say "large room, this takes a while".

**M11 · H06 advises on assumed rooms, and the model's T60 rises towards treble.** **First half fixed in R1** (H06 needs surfaces or furnishing described); the band factors still need a source.
- **Evidence:** H06 suggests treble trims from defaults alone. The model's T60 rises with frequency because the furniture factors stay flat above 500 Hz, while soft furnishings usually absorb more there (⚠ source needed).
- **Proposal:** require some furnishing or surface input before H06 fires; revisit the band factors with a source.

**M12 · No external cross-check yet.** **R5:** an image-source cross-check is done (`docs/verification/image-source.md`); a measured room is still open.
- **Evidence:** TEST_PLAN §4 asks for REW or amroc comparisons in `docs/verification/`. The Python reference implements the same model, so it checks the code, not the model.
- **Proposal:** owner or R5.

**M13 · Findings have no text yet.**
- **Evidence:** the UI shows only counts. Already scheduled for R1 (keys) and R4 (copy); listed because it is the user-visible half of H1.

**M14 · The service worker cache grows forever.** **Fixed in R5.**
- **Evidence:** old hashed assets are never evicted, so the cache grows with every deploy.
- **Proposal:** name the cache per build, or prune it on activate.

## Low (proposals)

1. P05 and H04 look at the left speaker only.
2. Confidence uses only the left speaker's placement certainty.
3. A project without a `busyness` field counts its furnishing as "estimated" in confidence; it should be "unknown". **Fixed in R1.**
4. P08 counts overlapping patches twice, while P06 uses the last patch.
5. SCORING says C1's σ is taken "around the median", but the code uses the mean. The scorer takes the upper median for C2, while P09 takes the true median.
6. The coarse-to-fine search missed the exhaustive 5 cm optimum by 0.002–0.012 in 3 of 9 rooms; it matched elsewhere. That is less than the robust spread.
7. Perturbed placements in the robustness runs are not re-checked against the hard constraints.
8. The undo history keeps up to 100 full JSON snapshots: up to about 100 MB with a 1 MB project.
9. Positions outside the room are accepted from files. The engine copes; the drawing may not.
10. G06 measures from the front baffle: a deep cabinet pushed into a corner gets a caution, not a red flag. **Fixed in R1** (measured from the cabinet; found again by the new validation suite).
11. The monotonic-confidence property varies only the room dimensions, and the weights property checks only C1.
12. There are no Testing Library component tests, though TEST_PLAN lists them; the e2e tests cover the components.
13. The Pages deploy has no `concurrency` group, so two quick pushes to `main` could deploy out of order. **Fixed in R5.**
14. `importProject` silently ignores an import at the project limit. The caller shows an error first, so this is unreachable today.

## Checked and found sound

- **Formulas.** Each was re-derived; no unit mix-ups (metres, Hz versus rad/s, °C):
  - P01 speed of sound and P02 Rayleigh modes;
  - P03 mode shapes (cos·cos·cos, nodes exact);
  - P04 `c/4d` and P06 mirror-image points;
  - P07 Schroeder and P08 Sabine/Eyring;
  - P09 modal Green's function, with `K_n = V/∏ε`, `δ = 6.91/T60(125 Hz)`, the 0 Hz term (pressure-zone gain), damping as `2jδω_n`, and the Butterworth f6 normalisation;
  - P10 critical distance;
  - the P11 ITU ratio and Bonello count.
- **Axes.** x ↔ width, y ↔ length, z ↔ height, consistently across modes, mode shapes, reflections, placement, patch (u, v), the drawing and the engine.
- **Convergence of the modal sum.** After 1/6-octave smoothing, 1.5× and 4× truncation differ by at most 0.7 dB (90–285 Hz, Room R). That is better than OPEN_QUESTIONS D5 feared.
- **Share links and imports.**
  - The project travels in the fragment only.
  - A link is capped at 20,000 characters, and decompression stops at 1 MB as it streams.
  - Garbage is rejected without throwing, and everything passes the schema.
  - No project text is rendered as HTML (`{@html}` is unused), and no project URL is rendered as a link.
- **Persistence.** Storage blocked, quota full and corrupt entries all degrade gracefully, and are tested.
- **i18n.** English and Hungarian keys and placeholders match (tested). No hard-coded strings were found in components.
- **Accessibility.** axe scans pass for every step in light and dark and on the phone, and the keyboard journey passes. A VoiceOver pass is still a human check (TEST_PLAN §8).
- **Offline use.** Tested end to end.
- **Deploy.** Only from `main`, and only after every check passes.

## Calibration choices (🟡), judged

| Choice | Where | Verdict |
|---|---|---|
| Busy-ness absorption | `presets/objects.ts` | **Changed** (H3): per m² of floor; placed objects count when they add up to more (H2) |
| Furniture band factors ×0.5 (125 Hz), ×0.8 (250 Hz) | P08 | Keep; the factors above 500 Hz may be too low (M11) |
| P05 gain categories | P05 | Keep: qualitative, information only |
| P04 "aligned" (10%, < 1.5 m) | P04 | Keep the test; caution only above the scored band (H1) |
| P08 dead/live at 0.3 / 0.6 s | P08 | Keep: matches the typical domestic range |
| P09 report 6 dB | P09 | Keep; **new** caution at 10 dB (H1) |
| Scored bass band ≤ 200 Hz | P09 | Keep: converges well. The hand-over to C3 needs work (M1) |
| Narrowest scored band, half an octave | P09 | **New** (C2) |
| C1 σ 2→10 dB, C2 dip 6→18 dB | thresholds | Keep: the best seats measure σ ≈ 2–4 dB |
| C3 250/300 Hz ramp, 0.3 floor | thresholds | Keep for now; fix the cliff (M1) and the DSP exception (M2) |
| C4 ±10° → 0.8, limits 35° / 90° | thresholds | Keep |
| C5 0.1 / 0.3 m, surface mismatch 0.6 | thresholds | Keep |
| C6 back wall 0.3 → 1.0 m | thresholds | Keep |
| C7 corner 0 / 0.5, rear port 0.4 | thresholds | Keep |
| C8 0.5 / 0.7 (goal-dependent) | thresholds | Keep |
| Default weights (C1 0.35 …) | thresholds | Keep: bass dominates on purpose |
| Goal adjustments | `settings.ts` | Keep, except "flat response" de-emphasising C3 (M4) |
| Robustness: 8 runs, ±1% / ±5% room size, ±3 cm, mean − 0.5·spread | `search.ts` | Keep; common random numbers added (H4) |
| Confidence factors 1 / 0.6 / 0.2 and caps | `confidence.ts` | Keep |
| G01 5% / 10% | G01 | Keep; see M5 |
| G02 0.3 / 0.6 m, G03 0.1 / 0.3 m, G04 bands, G05 2 / 10 cm | G rules | Keep (labelled rules of thumb) |
| G06 0.25 / 0.5 m, G07 0.2 m, G08 10° / 15° / 20°, G10 0.3 / 1 m | G rules | Keep (L10) |
| H04 80 / 300 Hz, H06 0.3 / 0.6 s | H rules | Keep (M11) |

## Sources

"From memory" means recalled during the audit and **not checked against the original**. These are candidates to confirm, not citations. Nothing marked ⚠ in the catalogue has been changed to ✓ unless it could be derived.

| Key | R0 assessment | The owner (or a library) should check |
|---|---|---|
| [TOOLE] | ✓ 3rd ed., Routledge, 2018 | chapter cites for G01, G02, G09, G10, H04, and the typical domestic T60 |
| [EVP] | from memory: 7th ed., McGraw-Hill, about 2022 (Pohlmann) | edition and year; every absorption row, especially the plaster rows (M3) |
| [KUT] | ✓ 6th ed., CRC Press, 2016 | chapter and equation numbers |
| [ALL74] | from memory: *JAES* 22(5), June 1974, pp. 314–320 | pages |
| [SCH96] | from memory: *JASA* 99(5), 1996, pp. 3240–3241 | pages |
| [EYR30] | from memory: *JASA* 1(2), January 1930, pp. 217–241 | issue and pages |
| [BON81] | from memory: *JAES* 29(9), 1981, pp. 597–606 | pages, and **the wording of the second criterion**, which P11 now relies on |
| [BOLT46] | from memory: *JASA* 18(1), 1946, pp. 130–133 | pages |
| [ITU1116] | from memory: latest is BS.1116-3 (2015) | revision; the clauses for the ratio criterion and loudspeaker height (G08) |
| [ITU775] | from memory: BS.775-3 (2012) or later; the ±30° front pair is in it | revision |
| [DAV80] | from memory: *JAES* 28(9), 1980, pp. 585–595 | pages |
| [WALL49] | from memory: *Am. J. Psychol.* 62(3), 1949, pp. 315–336 | pages |
| P10 constant 0.057 | **✓ by derivation**: `sqrt(0.161/16π) = 0.0566` (catalogue updated) | equation numbers only |
| P08 typical range 0.3–0.6 s | now the anchor of H3. A candidate survey: C. Díaz and A. Pedrero, "The reverberation time of furnished rooms in dwellings", *Applied Acoustics* 66 (2005), from memory | find a primary source |
| H01 (38%), H02 (thirds) | origin unknown; keep "origin unclear" and "folk rule" | — |
| H03 (Cardas) | still not implemented | numbers on the Cardas page |
| KEF LSX II LT test data | unverified (no lookups in R0, by design) | KEF spec sheet and manual |

## What the owner needs to do

1. **Review the Hungarian text added in R0:** `crash.title`, `crash.body`, `crash.details`, `crash.export`, `crash.newProject`, and `furnishing.busy.combined` (the latter replaces `furnishing.busy.ignored`).
2. **Check the sources** in the table above when convenient, starting with [BON81]'s second criterion and the typical domestic T60.
3. ~~Decide M5~~ — decided in R1 by default (the model wins, with an explanation); say so if you prefer the 10% rule.
4. **Accept or adjust the new busy-ness calibration (H3).** It is anchored to 0.3–0.6 s for typical rooms and stays labelled a rule of thumb.
5. ~~Approve M1–M4~~ — M1, M2 and M4 went into R1; M3 still waits for the absorption table.
