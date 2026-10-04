# Scoring, Candidate Zones and Confidence (v1)

Status: implemented in M1 (`src/engine/scoring/`). Changes made during implementation are marked **(M1)**, changes from the R0 audit **(R0)** (see `docs/REVIEW_FINDINGS.md`). This document defines how the engine turns rules into ranked suggestions, transparently.

## Design principles

1. **Each physical effect is counted once.** For example, the midpoint null is already inside the bass model (P09); G01 then reports it as a finding but does **not** add a second penalty.
2. **Heuristics are never scored.** H01–H06 are overlays and suggestions only. The ranking comes from physics and strong guidelines.
3. **Goals have bounded influence.** User goals shift relative weights by at most ±50% and targets (angle, corner penalty). They never change a physics component's value or the hard constraints.
4. **Robust over optimal.** A position that is nearly as good but much less sensitive to input errors beats a knife-edge optimum.
5. **Everything is explainable.** Every score has a breakdown the UI can show ("why this zone").

## 1. Search space

v1 assumes the speakers sit along the front wall (`y` small), symmetric about the room centreline unless the user disables symmetry.

| Variable | Range | Step |
|---|---|---|
| Speaker front distance `d_f` (front of footprint to front wall, measured as rear panel to wall) | `max(0.05, minWallDistance)` … `maxSpeakerDistanceFromWall` (default 1.5 m, capped at `0.45·L`) | 0.05 m |
| Speaker half-spacing `s` (centre to room centreline) | `0.5 m` … `W/2 − 0.25 m` | 0.05 m |
| Listener `y_l` | `listenerYRange` or `d_f + 1.0 m` … `L − 0.3 m` | 0.05 m |
| Listener `x_l` | `W/2` (symmetric). Free only if `keepSymmetric = false` | — |
| Heights | speaker stand height and ear height as given (not optimised in v1) | — |

**Hard constraints (configurations removed, not penalised):**

- speaker footprint inside the room and not overlapping objects;
- listener not inside an object (except seat objects: bed, sofa, armchair, which are allowed);
- direct path from either speaker to the ears obstructed (G10 red flag);
- listener closer than 1.0 m to either speaker (near-field and desk use come after v1, see ROADMAP);
- **(M1)** listener less than 0.5 m in front of the speaker baffles (otherwise the search proposed seats *behind* the speakers);
- **(R0)** anything the app would red-flag itself, for what the search moves: the seat within 5% of the room midpoint (G01) or closer than 0.3 m to the back wall (G02), a speaker in a corner (G06), a stereo angle outside 35–90° (G04). Before R0 the best spot in 3 of 9 test rooms was at the midpoint while G01 red-flagged it. If the user's own constraints leave no such spot (for example a seat range inside the midpoint band), the search falls back to the other constraints and the finding stays. G08 (speaker height) is not part of it: heights are not searched in v1.

**(M1)** The pair is symmetric about the room centreline, or about the listener's x when `keepSymmetric` is off.

If `listenerFixed`, only speaker variables are searched. If the user locks the speakers, only the listener is searched.

**Search strategy (M1):** a coarse pass at 20 cm over the whole space, then a 5 cm refinement (±10 cm) around the ten best *distinct* coarse results. The step sizes in the table above are the refinement resolution.

**Budget:** this runs in a Web Worker and must finish in under 1.5 s on a mid-range phone. Measured in M1 (Node, desktop): Room R 0.25 s, the busy room 0.17 s, a 6 × 8 × 3 m room 0.5 s. Speed-ups:
- mode shapes factorise per axis (`cos·cos·cos`), so per-axis cosine tables replace most cosines;
- the source coupling is shared across listener positions;
- in symmetric setups whole mode families cancel exactly and are skipped.

## 2. Score components

Every component returns a value in `[0, 1]` (1 = best). The total is a weighted mean.

| ID | Component | Level | Default weight | Computation |
|---|---|---|---|---|
| C1 | Bass smoothness at the seat | 🔴 | 0.35 | P09 response, 1/6-oct smoothed, from `max(30 Hz, speaker f−6dB)` to `min(f_s, 200 Hz)` **(M1: capped at 200 Hz, see OPEN_QUESTIONS D)**. `σ` = standard deviation (dB) around the median. `C1 = clamp(1 − (σ − 2)/8, 0, 1)` (σ ≤ 2 dB → 1; σ ≥ 10 dB → 0). |
| C2 | Deep nulls at the seat | 🔴 | 0.10 | Largest dip below median within the C1 range: `C2 = clamp(1 − (dip − 6)/12, 0, 1)`. Separate from C1 because one deep null is audible even when σ looks fine. **(R0)** When the speaker's −6 dB point leaves less than half an octave of the band (a satellite), C1 and C2 get weight 0 and the rest is renormalised. |
| C3 | Front-wall interference above the scored bass band | 🔴 | 0.10 | From P04 / H04 for `f_null` above C1's upper limit: 1 if `f_null ≥ 300 Hz`, or if the speaker has a wall-compensation DSP and its rear panel is within 0.3 m of the wall; 0.3 up to 250 Hz, rising linearly to 1 at 300 Hz. Inside C1's band, C1 already includes it. |
| C4 | Stereo geometry | 🟠 | 0.15 | G04 angle (target per goals, OK band → ≥ 0.8, falls to 0 at the red-flag limits) × G05 (1 when symmetric by construction). |
| C5 | Symmetry of surroundings | 🟠 | 0.10 | G03: surface class match at mirrored side-reflection points (P06) and side-wall distance difference. |
| C6 | Seat boundary proximity | 🟠 | 0.10 | G02 back-wall distance: 0 at ≤ 0.3 m, 1 at ≥ 1.0 m, linear between. |
| C7 | Speaker boundary / corner / port | 🟠 | 0.10 | G06 corner proximity and G07 port clearance (manufacturer minimum if known). |
| C8 | Reflection handling vs goal | 🟠 | 0.00 → up to 0.10 | Only active when a goal favours it (G09). Hard surface at side reflection + goal "precise imaging" → lower. Never active by default because experts disagree. |

The weights sum to 1.00 with C8 at 0. When C8 is activated, the others are renormalised.

Notes:

- The thresholds inside C1–C7 (2 dB, 10 dB, 6 dB, 0.3 m, etc.) are 🟡 calibration choices. They live in one config file (`src/engine/scoring/thresholds.ts`) with comments pointing to this document. Changing them requires updating this document and the golden tests.
- Bass components (C1 + C2 = 0.45) dominate on purpose. Below the Schroeder frequency, position changes the sound most and is hardest to fix any other way [TOOLE].

## 3. Goal adjustments (bounded)

| Goal (weight 2 = important) | Effect |
|---|---|
| `wide-stage` | G04 target angle 62°; C8 prefers keeping side reflections (if smooth off-axis speaker) |
| `precise-imaging` | G04 target 58°; C4 weight × 1.3; C8 activates (prefers treated side reflections) |
| `flat-response` | Guideline weights (C3–C7) ÷ 1.2, then renormalised, which raises the share of C1 and C2 |
| `deep-bass` | C7 corner penalty × 0.7 (more boundary gain accepted). **(M1)** The C1 band is *not* changed, so goals never change a component's value. |
| `low-volume-listening` | No positional change; enables a hint about loudness perception (info only) |

Weight 1 (nice to have) applies half of each effect. Combined multipliers are capped at ×1.5 / ×0.5 relative to the default weight. If two goals conflict (wide-stage vs precise-imaging both important), the targets average and the app says "these goals pull in different directions; here's the compromise".

## 4. Robustness (uncertainty propagation)

Inputs are rarely exact. For a diverse pool of the best 30 search results (at least 10 cm apart, **M1**), the engine reruns scoring **8 times** with perturbed inputs (fixed pseudo-random seed for reproducibility):

| Input | Perturbation |
|---|---|
| Room dimension, measured | ±1% |
| Room dimension, estimated | ±5% |
| T60, estimated from presets | uniform within its computed range |
| T60, unknown | uniform 0.3–0.6 s |
| Listener and speaker positions | ±3 cm (people don't sit exactly still) |

`robustScore = mean − 0.5·stdDev`. Candidates are ranked by `robustScore`, and `scoreSpread = stdDev` is shown in the UI as a "how sure" whisker.

**(R0) Common random numbers:** the eight perturbed rooms and the position errors are drawn once per analysis and applied to every placement alike, the current setup included. Before R0 each placement drew its own position errors from a shared stream, so a placement's robust score depended on which other placements were in the pool and in what order (by up to 0.03), and the order of near-equal candidates changed with every seed.

## 5. From scores to what the user sees

- **Top candidates:** up to 5, greedily picked by robust score with a minimum separation of 0.2 m (any speaker or the listener) so they are genuinely different options. Labelled A, B, C…
- **Zones:** for the **heatmap of the seat**, speakers are fixed at the current or selected candidate and the listener is moved over the grid. For the **heatmap of the speakers**, the seat is fixed and the speaker pair is moved. Cells within 0.05 of the best robust score form the "good zone" outline. The colour scale is the score itself (sequential, colour-blind safe).
- **Current setup:** always scored too, so the user sees "your current setup: 0.62, best found: 0.81".
- **Top actions ("Do this first", max 3):** a rule-based picker over findings: red flags first, then the single move from current setup to the nearest good-zone cell with the largest score gain ("move your seat 25 cm forward"), then speaker DSP settings (G07, H06). Each action states its expected effect in plain words, never a promise.
- **Score presentation:** never shown as a bare "grade". Shown as a bar with words (poor / fair / good / very good) and a "why" breakdown by component.

## 6. Confidence model

The confidence meter answers "how much should you trust these results, given what you've told us?". It is **not** a measure of how good the room is.

### 6.1 Per-input certainty factor

| Certainty | Factor |
|---|---|
| measured | 1.0 |
| estimated | 0.6 |
| unknown (default used) | 0.2 |
| unknown (no default possible) | 0.0 |

### 6.2 Per-output confidence

Each output (bass prediction, reflections, stereo geometry, room character, speaker-specific advice) depends on specific inputs with importance weights:

| Output | Inputs (importance) |
|---|---|
| `bass` | room L, W, H (3 each); speaker position (2); listener position (2); construction type (2); T60 low (1); speaker LF extension (1) |
| `reflections` | positions (2 each); surfaces at reflection points (3); speaker directivity (1) |
| `geometry` | speaker positions (3); listener position (3) |
| `roomCharacter` | surfaces (3); objects (2); room dimensions (1) |
| `speakerAdvice` | port location (3); enclosure type (2); acoustic-axis height (1); driver layout (1) **(M1: no model database, so no "verified" input)** |

`confidence(output) = Σ(importance · factor) / Σ importance`.

### 6.3 Caps (model validity)

Caps limit an output's confidence however complete the inputs are:

| Condition | Cap |
|---|---|
| `construction = lightweight` | bass ≤ 0.6 |
| any `outOfModel` feature | bass ≤ 0.5. `non-rectangular` → all outputs ≤ 0.3 and a prominent "outside what we can model" banner |
| surface preset with low data confidence at a reflection point | reflections ≤ 0.7 |

### 6.4 Overall meter and the hint

- `overall = weighted mean of outputs` (bass 3, geometry 2, reflections 2, roomCharacter 1, speakerAdvice 1).
- Display: a 5-segment meter with words: "rough guess", "first impression", "solid", "detailed", "as good as it gets without measurements" (thresholds 0.3 / 0.45 / 0.6 / 0.75, `confidenceStep()`). Never a percentage, which would suggest false precision.
- **Next best input:** the input with the largest `importance · (1 − factor)` gain on `overall` becomes the hint: "Measure the ceiling height to firm up the bass prediction."

## 7. Test hooks

- Every component is a pure function `(config, context) → number` with unit tests at its threshold edges. A component that cannot be computed (for example a seat on a speaker) counts as 0, never as NaN **(R0)**.
- **Golden tests:** fixed projects (Room R and the busy room) with stored expected top candidates and scores. Any change in ranking fails CI and must be explained in the PR.
- **Invariants:**
  - mirror-symmetric rooms give mirror-symmetric heatmaps;
  - raising a goal weight never changes a physics component value;
  - removing all goals reproduces the default ranking.
