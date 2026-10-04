# Scoring, Candidate Zones and Confidence (v1)

Status: Phase 0 draft. This document defines how the engine turns rules into ranked suggestions, transparently.

## Design principles

1. **Each physical effect is counted once.** For example, the midpoint null is already inside the bass model (P09); G01 then reports it as a finding but does **not** add a second penalty.
2. **Heuristics are never scored.** H01–H06 are overlays and suggestions only. The ranking comes from physics and strong guidelines.
3. **Goals have bounded influence.** User goals can shift guideline weights by at most ±50% and can never change physics weights or hard constraints.
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
- listener closer than 1.0 m to either speaker (near-field use is out of scope for v1, see OPEN_QUESTIONS).

If `listenerFixed`, only speaker variables are searched. If the user locks the speakers, only the listener is searched.

**Budget:** for typical rooms there are 15–30 values per variable, so about 10⁴ configurations. Each needs a bass response (P09) at about 80 frequency points with about 150 modes. This runs in a Web Worker and must finish in under 1.5 s on a mid-range phone (Phase 1 performance test). Speed-up: mode shapes factorise per axis (`cos·cos·cos`), so per-axis cosine tables are precomputed once per room.

## 2. Score components

Every component returns a value in `[0, 1]` (1 = best). The total is a weighted mean.

| ID | Component | Level | Default weight | Computation |
|---|---|---|---|---|
| C1 | Bass smoothness at the seat | 🔴 | 0.35 | P09 response, 1/6-oct smoothed, from `max(30 Hz, speaker f−6dB)` to `f_s`. `σ` = standard deviation (dB) around the median. `C1 = clamp(1 − (σ − 2)/8, 0, 1)` (σ ≤ 2 dB → 1; σ ≥ 10 dB → 0). |
| C2 | Deep nulls at the seat | 🔴 | 0.10 | Largest dip below median within the C1 range: `C2 = clamp(1 − (dip − 6)/12, 0, 1)`. Separate from C1 because one deep null is audible even when σ looks fine. |
| C3 | Front-wall interference above `f_s` | 🔴 | 0.10 | From P04 / H04 for `f_null > f_s`: 1 if `f_null > 300 Hz` or the speaker has a wall-compensation DSP and is in "near" placement; linear down to 0.3 when `f_null` sits in 120–250 Hz. Counted only above `f_s` (below, C1 includes it). |
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
| `flat-response` | C1 and C2 weights × 1.2 (renormalised) |
| `deep-bass` | C1 low limit extended to 25 Hz; C7 corner penalty × 0.7 (more boundary gain accepted) |
| `low-volume-listening` | No positional change; enables a hint about loudness perception (info only) |

Weight 1 (nice to have) applies half of each effect. Combined multipliers are capped at ×1.5 / ×0.5 relative to the default weight. If two goals conflict (wide-stage vs precise-imaging both important), the targets average and the app says "these goals pull in different directions; here's the compromise".

## 4. Robustness (uncertainty propagation)

Inputs are rarely exact. For every candidate in the top 50 (by nominal score), the engine reruns scoring **8 times** with perturbed inputs (fixed pseudo-random seed for reproducibility):

| Input | Perturbation |
|---|---|
| Room dimension, measured | ±1% |
| Room dimension, estimated | ±5% |
| T60, estimated from presets | uniform within its computed range |
| T60, unknown | uniform 0.3–0.6 s |
| Listener and speaker positions | ±3 cm (people don't sit exactly still) |

`robustScore = mean − 0.5·stdDev`. Candidates are ranked by `robustScore`, and `scoreSpread = stdDev` is shown in the UI as a "how sure" whisker.

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
| `speakerAdvice` | speaker profile verified (3); port location (2); DSP controls (1) |

`confidence(output) = Σ(importance · factor) / Σ importance`.

### 6.3 Caps (model validity)

Caps limit an output's confidence however complete the inputs are:

| Condition | Cap |
|---|---|
| `construction = lightweight` | bass ≤ 0.6 |
| any `outOfModel` feature | bass ≤ 0.5. `non-rectangular` → all outputs ≤ 0.3 and a prominent "outside what we can model" banner |
| speaker profile not verified | speakerAdvice ≤ 0.6 |
| surface preset with low data confidence at a reflection point | reflections ≤ 0.7 |

### 6.4 Overall meter and the hint

- `overall = weighted mean of outputs` (bass 3, geometry 2, reflections 2, roomCharacter 1, speakerAdvice 1).
- Display: a 5-segment meter with words: "rough guess", "first impression", "solid", "detailed", "as good as it gets without measurements". Never a percentage, which would suggest false precision.
- **Next best input:** the input with the largest `importance · (1 − factor)` gain on `overall` becomes the hint: "Measure the ceiling height to firm up the bass prediction."

## 7. Test hooks

- Every component is a pure function `(config, context) → number` with unit tests at its threshold edges.
- **Golden tests:** fixed projects (Room R and the owner's room) with stored expected top candidates and scores. Any change in ranking fails CI and must be explained in the PR.
- **Invariants:**
  - mirror-symmetric rooms give mirror-symmetric heatmaps;
  - raising a goal weight never changes a physics component value;
  - removing all goals reproduces the default ranking.
