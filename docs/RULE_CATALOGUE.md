# Rule Catalogue (v1)

Status: implemented in M1 (`src/engine/rules/`, one file per rule). Implementation notes are marked **(M1)**; changes from the R0 audit are marked **(R0)** and explained in `docs/REVIEW_FINDINGS.md`. License: CC BY 4.0.

This is the single source of truth for every piece of acoustics advice the app gives. The engine implements **only** rules listed here; each rule becomes one small file in `src/engine/rules/` with the same ID.

## How to read this document

Each rule has:

- **ID and level:** 🔴 physics, 🟠 strong guideline, 🟡 heuristic, 🟣 subjective.
- **In plain words:** roughly what the app shows to users (final copy lives in i18n files).
- **Formula / logic**, **inputs**, **output**.
- **Sources:** keys into the reference list at the end. A source marked **⚠ verify** has a bibliographic detail (edition, page, volume) not yet confirmed against the original. It must be checked before release. No rule ships with an unverified source as its only support.
- **Limits:** where the rule stops being valid.
- **Test case:** a worked example with numbers. These become unit tests in Phase 1.

Conventions used throughout:

- Units are SI: metres, seconds, hertz. `c` is the speed of sound.
- Coordinate system: origin at the floor, front-left corner (front wall = the wall the speakers face away from). `x` runs across the room width `W` (left to right as seen from the listening position), `y` runs along the length `L` away from the front wall, `z` runs up to the height `H`.
- "Acoustic centre" of a speaker is approximated by the centre of its bass/mid driver for low-frequency rules and by the tweeter (or the coaxial driver centre) for high-frequency and geometry rules.
- Standard reference room for test cases (**Room R**): `L = 5.0 m`, `W = 4.0 m`, `H = 2.5 m`, `c = 343 m/s`. Volume `V = 50 m³`, surface `S = 85 m²`.

### The central honesty rule

Physics rules (🔴) are exact **for the idealised model** (rigid rectangular box, point source). Real rooms differ: lightweight walls leak bass, furniture scatters, doors and openings change modes. So 🔴 means "this is what physics predicts for the room you described", and the app always shows the model's assumptions next to the result. Below the Schroeder frequency (P07) predictions are sharper than above it. Above it, statistics and psychoacoustics take over, which is why many higher-frequency rules are 🟠 or 🟡.

---

## 🔴 Physics rules

### P01 · Speed of sound

- **In plain words:** Sound travels a little faster in warm air. We use 20 °C unless you tell us otherwise.
- **Formula:** `c = 331.3 · sqrt(1 + T/273.15)` m/s, `T` in °C.
- **Inputs:** room temperature (optional, default 20 °C).
- **Output:** `c`, used by all other rules.
- **Sources:** [KUT], [EVP].
- **Limits:** ignores humidity (effect below about 0.5% at room conditions). This is irrelevant compared with dimension uncertainty.
- **Test case:** `T = 20 °C → c = 343.2 m/s`; `T = 0 °C → 331.3 m/s`; `T = 25 °C → 346.1 m/s`. Engine default `c = 343.0` when `T` is unknown (rounding consistent with most references).

### P02 · Room modes (rectangular room)

- **In plain words:** Every room has bass frequencies where sound "rings" because it fits between the walls. These cause some bass notes to boom and others to almost disappear, depending on where you sit.
- **Formula (Rayleigh):** `f(nx, ny, nz) = (c/2) · sqrt((nx/W)² + (ny/L)² + (nz/H)²)` for non-negative integers, not all zero.
  - **Axial modes:** one non-zero index. Strongest.
  - **Tangential modes:** two non-zero indices. About 3 dB weaker on average.
  - **Oblique modes:** three non-zero indices. About 6 dB weaker on average.
- **Inputs:** `L`, `W`, `H`, `c`.
- **Output:** list of modes up to `f_max` (default `2 · f_Schroeder`, minimum 300 Hz), each with frequency, indices and type.
- **Sources:** [KUT] ch. on wave theory, [EVP] ch. on modal resonances, [TOOLE] ch. on low frequencies.
- **Limits:** assumes rigid, parallel walls. Lightweight construction (drywall), large openings and doorways shift and damp modes. The app reports a lowered confidence when the user indicates lightweight walls or openings.
- **Test case (Room R):** sorted axial and lowest modes:

  | Mode (nx,ny,nz) | f (Hz) | Type |
  |---|---|---|
  | (0,1,0) | 34.30 | axial, length |
  | (1,0,0) | 42.88 | axial, width |
  | (1,1,0) | 54.91 | tangential |
  | (0,2,0) | 68.60 | axial, length |
  | (0,0,1) | 68.60 | axial, height (coincides with (0,2,0)) |
  | (0,1,1) | 76.70 | tangential |
  | (1,2,0) | 80.90 | tangential |
  | (1,0,1) | 80.90 | tangential |
  | (2,0,0) | 85.75 | axial, width |
  | (1,1,1) | 87.87 | oblique |
  | (0,3,0) | 102.90 | axial |

  The coincidence at 68.60 Hz is expected and is exactly what P11 flags. Indices follow the document convention (`nx` ↔ width, `ny` ↔ length, `nz` ↔ height).

### P03 · Mode shape and seat position (nodes and antinodes)

- **In plain words:** Each room mode is loud in some places and silent in others. If you sit exactly in the middle of the room's length, some bass frequencies vanish for you.
- **Formula:** relative pressure of mode `n` at point `(x, y, z)`: `ψ_n = cos(nx·π·x/W) · cos(ny·π·y/L) · cos(nz·π·z/H)`. `|ψ| = 1` at an antinode (all walls and corners), `ψ = 0` at a node.
- **Consequences used by other rules:**
  - At `y = L/2` all odd length-modes (ny = 1, 3, 5, …) are zero. The listener hears a null at the first length-mode.
  - At `y = L/4` and `3L/4` the second length-mode is zero.
  - Corners are antinodes for **every** mode, so a speaker or listener there excites or hears all of them at maximum.
- **Inputs:** positions, room dimensions.
- **Output:** per mode, coupling factors for each speaker and the listener.
- **Sources:** [KUT], [EVP], [TOOLE].
- **Limits:** same as P02.
- **Test case (Room R):** listener at `y = 2.5 m` (= L/2): `ψ(0,1,0) = cos(π/2) = 0` → the 34.30 Hz mode is not heard. Listener at `y = 1.25 m`: `ψ(0,2,0) = cos(π/2) = 0` → 68.60 Hz length-mode not heard (the 68.60 Hz height-mode still is, unless ear height is `H/2`).

### P04 · Speaker-boundary interference (SBIR)

- **In plain words:** Sound from the back of the speaker bounces off the wall behind it and partly cancels the sound coming straight to you. This makes a dip in the bass or low midrange. The dip's pitch depends only on the distance to the wall.
- **Formula:** for a single nearby boundary at distance `d` from the speaker's acoustic centre, the first cancellation is at `f_null ≈ c / (4·d)`. Further nulls at `3·f_null`, `5·f_null`, …, but these are much shallower because the speaker becomes directional at higher frequencies.
- **Applies to:** front wall (most important), nearest side wall, floor, ceiling.
- **Inputs:** speaker position, acoustic centre height, room dimensions, speaker directivity (if known: frequency below which the speaker is effectively omnidirectional).
- **Output:** `f_null` for the front wall (info). **(M1)** When two boundaries (front, nearest side, floor, ceiling, each < 1.5 m) are within 10% of each other in distance, their nulls line up and deepen, at the combined frequency (🟡 threshold). **(R0)** This is a caution only when the combined frequency lies above the scored bass band; inside it, P09 already models and scores the combined dip, so it is an explanation (info). Before R0 it was a caution in most setups.
- **Sources:** [ALL74] (original treatment of boundary effects on power output), [TOOLE] ch. on low-frequency boundary interaction, [EVP].
- **Limits:** `c/(4d)` is the free-field, single-boundary, listener-far-away approximation. Real notch depth depends on directivity and on the other boundaries. Below the Schroeder frequency SBIR and room modes are the same physics, so the full model (P09) takes over for scoring. P04 is used for **explanation** and above the Schroeder frequency.
- **Test case:** `d = 0.5 m → f_null = 171.5 Hz`; `d = 1.0 m → 85.75 Hz`; `d = 0.3 m → 285.8 Hz`.
- **At the seat (R1):** scoring (C3) and the treatment advisor use the null as heard at the seat: the reflection comes from the woofer's mirror image behind the front wall, and the first cancellation is where the extra path Δ is half a wavelength, `f = c / (2Δ)`. On the wall's normal Δ = 2d (so `c/4d`); off it, the null is higher (10–15 % at a typical stereo seat). Checked against a brute-force two-path sum (`tests/engine/validation.test.ts`).

### P05 · Boundary bass gain

- **In plain words:** The closer a speaker is to walls and corners, the more bass it produces. A speaker against one wall gains bass, one in a corner gains a lot.
- **Logic:** at frequencies where boundaries are much closer than a quarter wavelength, each adjacent boundary ideally doubles the radiated pressure (up to +6 dB per boundary in the limit: half-space, quarter-space, eighth-space). In practice the gain is smaller and frequency-dependent.
- **Inputs:** distances to front wall, side wall, floor.
- **Output:** qualitative bass-gain level (low / moderate / high / very high) plus the frequency range affected. Never a single dB number shown as fact.
- **Sources:** [ALL74], [TOOLE], [EVP].
- **Limits:** idealised. Speaker manufacturers often compensate with DSP "wall" or "desk" modes (see G07, H06).
- **Test case:** speaker 0.15 m from front wall, 0.4 m from side wall, 0.8 m above floor → "high" boundary gain below ≈ `c/(4·0.4) ≈ 214 Hz`, rising further below ≈ `c/(4·0.15) ≈ 572 Hz` from the front wall alone. The engine returns category `high`, not a number.

### P06 · First-reflection points (mirror-image method)

- **In plain words:** The first echo from each wall reaches you a few milliseconds after the direct sound. We show exactly where on each wall that echo bounces, so you know what surface is there (glass, CDs, curtain).
- **Formula:** mirror the speaker in the wall plane. The reflection point is where the straight line from the mirrored speaker to the listener crosses the wall. For the left wall (`x = 0`), with speaker `(sx, sy)` and listener `(lx, ly)`: `y_r = sy + (ly − sy) · sx / (sx + lx)`. Analogous for the right wall, floor, ceiling and front wall.
- **Derived quantities:**
  - path difference `Δ = |image − listener| − |speaker − listener|`;
  - delay `Δ/c`;
  - level re direct sound `20·log10(d_direct / d_reflected)` (inverse square only, before surface absorption and speaker directivity).
- **Inputs:** speaker and listener positions and heights, room dimensions, surface type at the reflection point.
- **Output:** reflection point coordinates for each speaker and boundary, delay in ms, geometric level in dB, and the surface found there.
- **Sources:** [KUT], [EVP], [TOOLE].
- **Limits:** specular (mirror-like) reflection, valid when the surface is large compared with the wavelength. Bookshelves and CD walls scatter, so their "reflection" is spread out. The app says so.
- **Test case:** speaker `(1.2, 1.0)`, listener `(2.0, 3.5)`, left wall. Reflection point `y_r = 1.9375 m`. Direct path 2.625 m, reflected path 4.061 m, delay 4.19 ms, geometric level −3.8 dB.

### P07 · Schroeder frequency

- **In plain words:** Below this frequency the room behaves like a set of distinct resonances (where you sit matters a lot for bass). Above it, the room's sound is smoother and the speaker itself matters more.
- **Formula:** `f_s ≈ 2000 · sqrt(T60 / V)` (T60 in s, V in m³).
- **Inputs:** `V`, `T60` (from P08, or default).
- **Output:** `f_s` in Hz, shown as approximate (±30% messaging).
- **Sources:** [SCH96], [KUT], [TOOLE].
- **Limits:** a statistical transition, not a hard line. Toole notes small domestic rooms have a gradual transition region. The UI never shows `f_s` with more than 2 significant figures.
- **Test case:** `V = 50 m³`, `T60 = 0.4 s → f_s = 178.9 Hz` (displayed "≈ 180 Hz").

### P08 · Reverberation time estimate (Sabine and Eyring)

- **In plain words:** How long the room "rings" after a sound stops. A busy, soft room is short (dead), a bare room is long (live). We estimate it from your surfaces and furniture.
- **Formulas:**
  - **Sabine:** `T60 = 0.161 · V / A`, where `A = Σ S_i·α_i + Σ A_objects` (m² sabins).
  - **Eyring:** `T60 = 0.161 · V / (−S · ln(1 − ᾱ))`, with `ᾱ = A / S`.
  - The engine reports **Eyring** when `ᾱ > 0.2` (Sabine overestimates T60 in absorbent rooms), otherwise Sabine. Computed per octave band 125 Hz – 4 kHz.
- **Inputs:** room dimensions, surface materials (presets with absorption coefficients, see Appendix A), furniture objects, occupancy.
- **Output:** T60 per band, plus a single "mid" value (average of 500 Hz and 1 kHz), plus a range reflecting input uncertainty.
- **Sources:** [SAB], [EYR30], [KUT], [EVP] (absorption tables).
- **Limits:** both formulas assume a diffuse field, which small rooms do not have. Treat as a **rough character estimate** (dead / balanced / live), not a measurement. Displayed with one decimal and a range.
- **Default when unknown:** `T60_mid = 0.4 s` with range 0.3–0.6 s. **(R5)** Supported by surveys of furnished living rooms [DWELL]: 0.33 s (Burgess, 500 Hz) to 0.51 s (Jackson, 1 kHz), about 0.4 s across 602 Canadian homes (Bradley). The earlier attribution to [TOOLE] was not checked and is dropped.
- **Furnishing (R0):** the busy-ness answer gives an absorption per m² of floor (bare 0–0.2, some 0.3–0.6, busy 0.5–0.9, very busy 0.7–1.2 m² sabins per m², 🟡), "some" when not answered. Placed furniture counts too: the larger of the two is used, so placing a sofa never makes the room more reverberant. Anchors: Room R with the default surfaces gives about 1.1 s bare, 0.56 s with some furniture, 0.37 s busy and 0.28 s very busy. Before R0 the amounts were fixed (bare 0–2 … very busy 10–18 m²), which made typical rooms read 0.7–1.4 s ("live"), and placed objects replaced the estimate, so placing a bed could raise T60 (0.79 → 1.07 s in Room R).
- **Object materials (R3):** an object whose material the user chose (hard, soft, absorbent) absorbs `surface × [0, 0.05] / [0.15, 0.35] / [0.5, 0.8]` m² sabins, where surface is top plus four sides. The new kinds (wardrobe 0.2–0.6, bookcase 0.3–0.9, large plant 0.1–0.3, piano 0–0.3, others 0) are 🟡 rough estimates with no source, shown as estimates. **(R5)** For upholstery, [PRA]'s heavily upholstered seats (0.70–0.84 per m² of floor at two seats per m², mid bands) give about 0.35–0.42 m² per seat, so a three-seat sofa takes about 1.1–1.3 m² and an armchair about 0.4 m²: the table's sofa (1.5–3.0) and armchair (0.5–1.0) are on the high side but of the right order. Kept; the busy-ness floor dominates in most rooms.
- **Floor (R0):** the mean absorption never goes below 0.01, which keeps T60 finite for any input.
- **Test case (Room R):** `ᾱ = 0.25 → A = 21.25 m²`. Sabine `T60 = 0.379 s`. Eyring `T60 = 0.329 s`. Since `ᾱ > 0.2`, the engine reports 0.33 s.

### P09 · Low-frequency response at the listening position (modal model)

- **In plain words:** We simulate how the bass will sound where you sit, from the room's resonances and where the speakers are. This shows which bass notes will be too loud or too quiet.
- **Model (modal sum, Green's function of a rectangular room):** `p(ω) ∝ Σ_n ψ_n(r_s) · ψ_n(r_l) / ( K_n · (ω² − ω_n² − 2j·δ_n·ω_n) )`, where:
  - `ω_n = 2π·f_n`;
  - `K_n = V / (ε_x·ε_y·ε_z)`, with `ε = 1` for a zero index and `2` otherwise;
  - `δ_n ≈ 6.91 / T60` (decay constant from reverberation time at low frequency);
  - both speakers are summed coherently (bass is mostly mono in recordings).
- **Frequency range:** displayed curve from 20 Hz to `min(1.5 · f_s, 300 Hz)` (at least 120 Hz), at 1/24-octave points with 1/6-octave smoothing. Scoring uses `max(30 Hz, f6)` to `min(f_s, 200 Hz)`.
- **Truncation (M1):** modes up to 1.5× the top frequency. The sum converges slowly; see OPEN_QUESTIONS D5.
- **Speaker roll-off (M1):** a Butterworth high-pass with exactly −6 dB at the profile's f6, 2nd order for sealed boxes and 4th order otherwise. Shape only, an assumption.
- **Findings (M1, R0):** a peak or dip more than 6 dB from the median inside the scoring band is reported: as information up to 10 dB, as a caution beyond (🟡 thresholds). Before R0 every 6 dB extreme was a caution, and the best spot found had one in 7 of 9 test rooms, so the caution carried no information.
- **Narrow bands (R0):** the scored band is never empty. If the speaker's −6 dB point leaves less than half an octave of it (a small satellite), the bass is not scored (C1 and C2 get weight 0) and P09 reports `notScored` instead of a peak, dip or "smooth". Before R0 such speakers (f6 above 200 Hz, which the form accepts) produced NaN scores that the UI showed as "very good".
- **Inputs:** room dimensions, speaker and listener positions, low-frequency T60, speaker low-frequency extension (−6 dB point) if known, used to weight the low end.
- **Output:** predicted relative SPL curve (dB, normalised to its median), list of peaks and dips with frequencies.
- **Sources:** [KUT] (modal Green's function), [EVP].
- **Limits:** assumes rigid walls, uniform damping across modes, point (monopole) sources, empty room. Absolute levels are meaningless; only the **shape** and the **relative comparison between positions** are used. This is the same class of model used by common room simulators. Phase 1 must cross-check it against an independent implementation (see TEST_PLAN).
- **Test case (properties, exact):**
  1. Swapping speaker and listener positions gives the identical response (reciprocity).
  2. Listener at `y = L/2`: the (0,1,0) term contributes exactly 0.
  3. Scaling all dimensions by `k` scales all mode frequencies by `1/k`.

### P10 · Critical distance

- **In plain words:** Close to the speaker, you hear mostly the speaker. Far away, you hear mostly the room. This is the distance where they are equal.
- **Formula:** `r_c ≈ 0.057 · sqrt(Q · V / T60)` (m), `Q` = directivity factor of the speaker in the relevant band.
- **Inputs:** `V`, `T60_mid`, `Q` (default 2 for a typical small two-way monitor at mid frequencies if unknown, range 2–5).
- **Output:** `r_c` and the ratio listening distance ÷ `r_c`.
- **Sources:** [EVP], [KUT]. **(R0)** The constant is ✓ by derivation: the critical distance `r_c = sqrt(Q·A / (16π))` with Sabine's `A = 0.161·V / T60` gives `sqrt(0.161 / (16π)) = 0.0566`. (R5) Equation numbers are not needed: the derivation stands on its own.
- **Limits:** diffuse-field assumption, rough in small rooms. Used only as context for goal "precise imaging" (G08 and scoring), never as a red flag on its own.
- **Test case:** `V = 50`, `T60 = 0.4`, `Q = 2 → r_c = 0.90 m`. With `Q = 4 → 1.27 m`.
- **(V5) Dispersion choice** (survey and Speakers page, 🟡 estimate): *Typical* keeps the speaker type's estimated `Q`; *Narrow* doubles it (+3 dB directivity index), *Wide* halves it (−3 dB), never below 1 (omnidirectional). So `Q` spans about 1–6. It reaches this rule only, never the score or the maps (`tests/engine/dispersion.test.ts`). The factor of two is a deliberately coarse step, not from a source: without measurements the app cannot tell a waveguide from a plain dome, and says so.

### P11 · Room proportion quality (information only)

- **In plain words:** Some room shapes spread their bass resonances evenly, others stack them on top of each other. You probably can't change your room, but this explains why some rooms are harder.
- **Logic, three independent checks, each reported separately:**
  1. **Coincident modes:** axial modes within 5% of each other below `f_s`.
  2. **Bonello criterion:** count of modes per 1/3-octave band should not decrease with frequency, and bands with fewer than 5 modes should not contain coincident modes [BON81].
  3. **ITU-R BS.1116 ratio criterion:** `1.1·(W/H) ≤ L/H ≤ 4.5·(W/H) − 4`, with `L/H < 3` and `W/H < 3` [ITU1116].
- **Output:** pass / caution per check, with the coincident frequencies listed. Never changes scoring (the room is given). It informs the confidence and the "why" texts.
- **Coincidences (R0):** one finding for the check (the lowest stacked pair, plus the number of pairs), and only for pairs in a third-octave band with fewer than five modes, Bonello's second criterion. The plain 5% test flagged 99.7% of 2,424 plausible rooms (up to three separate cautions each), which told the user nothing; with the criterion 30.7% of them get it. Room R (68.6 Hz) and the 4 m cube still do.
- **Sources:** [BON81], [BOLT46] (historical area chart, cited for context only), [ITU1116].
- **Limits:** these criteria were designed for empty rooms and critical listening rooms. They are contested as predictors of perceived quality [TOOLE].
- **Test case (Room R):** `W/H = 1.6`, `L/H = 2.0`. ITU: `1.76 ≤ 2.0 ≤ 3.2` → pass. Coincidence: 68.60 Hz (length 2nd and height 1st) → caution.

---

## 🟠 Strong guidelines

### G01 · Don't sit at the room's midpoint (length)

- **In plain words:** Sitting exactly halfway between the front and back walls removes the room's deepest bass note for you. Move forward or back by at least about 10% of the room length.
- **Logic:** derived from P03. Red flag if `|y_l − L/2| < 0.05·L`. Caution between 0.05·L and 0.10·L. The tolerance band is a 🟡 heuristic; the null itself is 🔴.
- **Same check across the width:** the listener is normally centred left-right (`x = W/2`), which places them at the node of odd width-modes. This is an accepted trade-off for stereo symmetry. The app explains it and does **not** flag it as a red flag.
- **Sources:** [TOOLE], [EVP].
- **Test case (Room R):** `y_l = 2.5 → red flag` (0%). `y_l = 2.3 → red flag` (4%). `y_l = 2.8 → caution` (6%). `y_l = 3.1 → ok` (12%).

### G02 · Don't sit with your head against the back wall

- **In plain words:** Right against the back wall every bass resonance is at full strength, and the wall's reflection arrives almost instantly. Bass gets heavy and boomy.
- **Logic:** red flag if the listener's ears are less than 0.3 m from the back wall. Caution between 0.3 and 0.6 m. Thresholds are 🟡 heuristics. The underlying antinode physics (P03) and the near-coincident reflection (P06) are 🔴.
- **Sources:** physics from P03 (every mode has a pressure maximum at the wall) and P06 (the reflection delay); [TOOLE], [EVP] discuss it. **(R5)** No checked source gives the distances, so the 0.3 / 0.6 m thresholds are 🟡 heuristics, as the rule says.
- **Test case (Room R):** `y_l = 4.8 → 0.2 m` from back wall → red flag.

### G03 · Left-right symmetry

- **In plain words:** For a stable, centred stereo image both speakers should see a similar room: similar distances to their side walls and similar surfaces at the first-reflection points.
- **Logic:**
  - geometric asymmetry `|d_side_left − d_side_right|` for the speakers: caution above 0.10 m, red flag above 0.30 m;
  - surface asymmetry: different surface **classes** (reflective / absorptive / diffusive) at the mirrored first-reflection points → caution.
- **Sources:** [TOOLE], [ITU1116] (symmetry requirement for reference listening rooms).
- **Limits:** thresholds are 🟡. Toole notes that the auditory system is fairly tolerant of reflection asymmetry. The app treats surface asymmetry as caution, never red flag.
- **Test case:** speakers 0.9 m and 1.3 m from their side walls → difference 0.4 m → red flag.

### G04 · Stereo listening angle

- **In plain words:** The classic stereo set-up forms a triangle with about 60° between the speakers as seen from your seat. Much narrower and the stage shrinks, much wider and the centre image weakens.
- **Logic:** angle `θ` between the two speaker axes-to-listener lines. Target 60°. OK 50–70°. Info 45–50° and 70–75°. Caution 35–45° and 75–90°. Red flag below 35° or above 90°. The target is from the standard [ITU775]; the tolerance bands are 🟡.
- **Goal interaction:** "wide soundstage" moves the preferred point to about 60–65°, "precise imaging" to about 55–60°. Both remain within the OK band (bounded influence, see SCORING).
- **Sources:** [ITU775], [TOOLE].
- **Test case:** speakers at `x = 1.0` and `3.0` (`y = 1.0`), listener at `(2.0, 2.73)` → half-angle `atan(1.0/1.73) = 30.0°` → `θ = 60.0°`.

### G05 · Equal distances to both speakers

- **In plain words:** If one speaker is closer, the sound image pulls towards it. Keep both distances equal to within a couple of centimetres.
- **Logic:** path difference `|d_L − d_R|`: OK ≤ 0.02 m, caution up to 0.10 m, red flag above 0.10 m. The underlying effect, that sounds arriving first dominate localisation (precedence effect), is established [WALL49]. The centimetre thresholds are 🟡.
- **Sources:** [WALL49], [TOOLE].
- **Test case:** `d_L = 2.40`, `d_R = 2.47` → 0.07 m → caution.

### G06 · Avoid corners (unless the speaker is designed for it)

- **In plain words:** In a corner the speaker excites every bass resonance at full strength and gets a big, uneven bass boost.
- **Logic:** derived from P03 and P05. Caution when a speaker's acoustic centre is within 0.5 m of two walls. Red flag within 0.25 m of two walls. The exception is a speaker profile flagged `designedForCorner` (rare). **(R1)** Distances are measured from the cabinet (rear panel to the front wall, side panel to the side wall), where a rear port also sits; from the woofer on the front baffle, a deep cabinet pushed fully into a corner could never be red-flagged.
- **Sources:** [ALL74], [TOOLE]. Thresholds 🟡.

### G07 · Bass port clearance (speaker-specific)

- **In plain words:** Your speaker breathes bass through a port at the back. Pushed close to the wall, the bass gets heavier and can get boomy.
- **Logic:**
  - if `portLocation = rear`: use the manufacturer's minimum wall distance if present in the speaker profile. Otherwise caution when the rear panel is closer than 0.2 m to the wall (🟡 default).
  - if the speaker has a DSP placement setting ("wall mode", "distance from wall"), the result tells the user to set it to match the chosen position (🟠, manufacturer guidance).
  - sealed and front-ported speakers get no port caution.
- **Sources:** manufacturer documentation per speaker profile; [TOOLE] for the general behaviour.

### G08 · Tweeter or acoustic axis at ear height

- **In plain words:** Speakers sound most accurate when your ears are at the height the designer intended, usually tweeter height. This matters less for coaxial designs, but still matters.
- **Logic:** vertical angle from the speaker's reference axis to the ears. OK within ±10°, caution within ±20°, red flag beyond. If the profile has measured vertical directivity, the thresholds come from it (narrower or wider). Coaxial drivers (`driverLayout = coaxial`) widen OK to ±15° (🟡).
- **Sources:** [TOOLE] (off-axis and vertical lobing behaviour of multiway speakers), [ITU1116]: the reference axis should meet the listening point at the height of a seated listener's ears, tilted at most 10° (✓ R5, from secondary summaries of BS.1116-3).
- **Test case:** tweeter 0.9 m high, ears 1.1 m high, distance 2.5 m → `atan(0.2/2.5) = 4.6°` → OK.

### G09 · First reflections: the two schools (goal-dependent)

- **In plain words:** Experts disagree here, so we tell you both sides. Side-wall reflections make the sound wider and more spacious, but can blur precise imaging. Studios often absorb them. Many listeners at home prefer to keep them, especially with speakers that sound similar off-axis.
- **Logic:** for each side-wall reflection point (P06):
  - **reflective hard surface (glass, bare plaster) and goal "precise imaging"** → suggestion "consider absorption or diffusion here" (🟡);
  - **goal "wide soundstage"** with a speaker that has smooth off-axis response → "keeping this reflection is fine and may help width" (🟡);
  - **neither goal emphasised** → information only.
- Never a red flag. The disagreement is real and documented: the LEDE / reflection-free-zone approach [DAV80] vs. listener-preference research summarised in [TOOLE].
- **Sources:** [TOOLE], [DAV80].

### G10 · Objects close to or between the speakers and you

- **In plain words:** Anything between a speaker and your ears blocks or scatters the sound. Large hard objects right beside a speaker (another speaker, a cabinet side, a monitor) add early reflections that blur the image.
- **Logic:**
  - an object intersecting the direct path from a speaker to the listener (top view and height check) → red flag;
  - a hard object within 0.3 m of a speaker's side or front → caution (🟡 threshold);
  - other loudspeakers nearby (switched off): caution "passive speakers can resonate along. We can't predict how much; test by ear (cover or move them)" → 🟡 / 🟣. No source claims a magnitude; the app says so.
  - **(R0)** one finding per object, for the nearer speaker (before R0 an object near both speakers gave two).
- **Sources:** the physics of reflection (P06) and of a blocked direct path; [TOOLE] discusses nearby-object reflections (chapter not checked, R5). No number in this rule comes from a source: the 0.3 m threshold is 🟡.

---

## 🟡 Heuristics (shown as reference guides, never scored)

These appear as optional dashed overlay lines on the plan ("popular starting points"). Each explains where it comes from and that it is not a law.

### H01 · The "38% rule"

- **In plain words:** A popular starting point puts your seat at about 38% of the room length from the front wall. It tends to avoid the worst length-mode nulls. It's a rule of thumb, not a law.
- **Logic:** overlay line at `y = 0.38·L`.
- **Sources:** widely repeated in hi-fi literature and forums. **Origin not established**; no peer-reviewed source found. **(R5) Resolved:** the app says "where it comes from is unclear" and shows it only as a 🟡 overlay compared with the physics.
- **Test case (Room R):** `y = 1.90 m`.

### H02 · Rule of thirds

- **In plain words:** Another starting point: speakers about one-third into the room, seat about two-thirds.
- **Logic:** overlay lines at `y = L/3` (speakers) and `y = 2L/3` (listener).
- **Sources:** common practice. **(R5) Resolved:** no citable origin; the app calls it "a folk rule".

### H03 · Cardas method (**not implemented in M1**: unverified)

- **In plain words:** A placement recipe from a cable manufacturer, based on room-width ratios.
- **Logic:** speaker (woofer centre) at `0.276·W` from the side wall and `0.447·W` from the front wall. Listener per the published recipe.
- **Sources:** [CARDAS]. **(R5) Dropped from v1:** the numbers could not be verified, and H03 is not implemented.

### H04 · Front-wall distance: near or far, not in between

- **In plain words:** Either put speakers close to the wall (the dip moves high where the speaker becomes directional, and many speakers have a wall-compensation setting) or far out (the dip moves very low). Middle distances put the dip right in the upper bass.
- **Logic:** derived from P04. Report where `f_null` falls:
  - `f_null > 300 Hz` ("close", `d < ~0.29 m`);
  - `f_null < 80 Hz` ("far", `d > ~1.07 m`);
  - otherwise "the dip lands in the upper bass at X Hz".

  The band edges (80 / 300 Hz) are 🟡.
- **Sources:** physics from [ALL74], **(R5)** the "near or far" advice follows from the physics (P04: the null moves above the bass band when close, below it when far) and is not attributed to [TOOLE].

### H05 · Toe-in

- **In plain words:** Turning the speakers towards you usually sharpens the centre image; pointing them straight ahead usually widens the stage and softens treble. How much depends on how evenly your speaker spreads sound. Some speakers (often coaxials) change less with angle. Try it by ear.
- **Logic:** no numeric recommendation unless measured horizontal directivity exists in the speaker profile. Then the app reports how much the on-listener-axis response changes between 0° and the current angle (from data, 🟠). Otherwise it offers an experiment: listen with axes crossing behind you, at you and in front of you.
- **Sources:** [TOOLE]. Manufacturer guidance per profile.
- **Note on "no toe-in needed" claims:** shown only as manufacturer guidance with the source, never as a law.

### H06 · Treble trim versus room character

- **In plain words:** A soft, busy room absorbs treble and can sound dull; a bare, hard room can sound bright. If your speaker has a treble control, a small adjustment can compensate.
- **Logic:** if `T60_high` (2–4 kHz) is in the "dead" range (below about 0.3 s, 🟡) → suggest a small treble lift (e.g. +0.5 to +1 dB), only if the speaker profile has a treble control. If in the "live" range (above about 0.6 s, 🟡) → suggest a small cut. Always phrased as "try, then listen".
- **Sources:** manufacturer EQ guidance (KEF Connect offers room-size / acoustic-character and treble settings), [TOOLE] (room acoustics and the perceived spectral balance). **(R5)** No manufacturer is cited by name; the rule is 🟡 and always says "try it and listen".

---

## Treatment advice (T) and speaker settings (D) — R1

What to change in the room or on the speaker, most useful first; the first item answers "if you can only do one thing". Each piece of advice states the direction of its effect and a rough size (small / moderate / large), never a promise. Priorities are 🟡 ordering choices. Code: `src/engine/advice/`, one file per rule. Display text: `advice.<id>.<variant>` (written in R4).

| ID | Advice | Level | Sources | When |
|---|---|---|---|---|
| T01 | Side-wall first reflections: absorb or diffuse there (imaging goal), or try it and listen (goals split or none). About 5 cm of porous absorber works across the mid and treble range (🟡; R5: a porous layer absorbs well once it is about a quarter wavelength thick [KUT], and 5 cm is a quarter wavelength at 1.7 kHz, with useful absorption from roughly 500 Hz) | 🟠 (points 🔴 P06) | [TOOLE], [DAV80] | hard, flat surface at a near-side reflection point; nothing for a "wide stage" goal |
| T02 | A thick rug at the floor reflection (mainly treble: a rug does little for bass, R3 review); a panel at the ceiling reflection (ranked lower: vertical reflections matter less for imaging) | 🟠 | [TOOLE] | hard floor or ceiling at the point |
| T03 | The front-wall dip: move the speakers first; a panel needs to be about a quarter wavelength deep to remove it (porous absorbers work where the air moves, which peaks λ/4 from a wall), so a 10–20 cm panel only makes it a little shallower | 🔴 | [KUT], [EVP], [ALL74] | null at the seat between 80 and 300 Hz; "panel" only when the speakers are fixed |
| T04 | Bass traps in the corners (pressure maxima of every mode, P03); honest that small corner pieces do little below 100 Hz | 🟠 | [KUT], [EVP], [TOOLE] | P09 peak caution or P11 stacked modes |
| T05 | Too live: about 5 m² of extra soft absorption (a large rug, heavy curtains), with the predicted T60; too dead: take some away (no advice when there is under 1 m² of soft furnishing to remove, R3 review) | 🔴 model (P08), target band 🟡 | [SAB], [EYR30], [EVP] | P08 live or dead |
| T06 | Head near the back wall: move forward first; if the seat is fixed, a thick absorber (≥ 10 cm) behind the head | 🟠 | [TOOLE] | G02 caution or red flag |
| D01 | Match the wall-distance setting: the distance, and whether it counts as close (< 0.3 m, 🟡). Option names come from the speaker's manual (the app does not know them and says so) | 🟠 | manufacturer | the profile has a wall setting |
| D02 | One step of bass cut for high boundary gain, then listen | 🟡 | [ALL74], manufacturer | P05 high or very high, and a bass control |
| D03 | One step of the treble control in H06's direction, then listen | 🟡 | manufacturer, [TOOLE] | H06 lift or cut, and a treble control |
| D04 | The base height that puts the tweeter at ear height, or tilt the speaker (heights are not searched in v1). When the axis is above the ears even with the speaker on the floor (base height under 5 cm), the `tilt` variant: tilt down or sit higher (R3 review) | 🟠 | [TOOLE], [ITU1116] ✓ | G08 caution or red flag |
| D05 | Move a rear port out to the minimum; the manual says whether port plugs exist (the app does not know and says so) | 🟠 | manufacturer, [TOOLE] | G07 too close |
| D06 | Desk mode when the speakers stand on a desk or table, otherwise stand mode | 🟠 | manufacturer | the profile lists those modes |

## 🟣 Subjective rules (symptom → hypotheses → experiment)

Subjective input never changes the computed positions. It produces a **ranked list of likely causes**, using the user's room data, and one experiment for each. Ranking: hypotheses whose physical precondition is present in the room data rank first (for example "boomy" ranks "back wall too close" first only if G02 fired).

| ID | Symptom (user picks) | Hypotheses (checked against data) | Experiment |
|---|---|---|---|
| S01 | Boomy / heavy bass | Listener near back wall (G02); speaker near corner (G06); rear port close to wall (G07); peak predicted at seat (P09); DSP wall mode off | Move seat 20 cm forward; move speakers 10 cm out; enable wall compensation |
| S02 | Thin / weak bass | Seat at null (P03, G01); SBIR dip in upper bass (P04, H04); speakers far from walls with no boundary gain (P05) | Move seat ±15 cm; try the "near" or "far" front-wall option |
| S03 | Vague centre / lacks focus | Unequal distances (G05); asymmetry (G03); strong early side reflection (G09); too little toe-in (H05); ear height off axis (G08) | Measure both distances with tape; try toe-in at you |
| S04 | Narrow soundstage | Angle too narrow (G04); absorption at side reflections with goal "wide" (G09); too much toe-in (H05) | Widen speakers 10 cm each; reduce toe-in |
| S05 | Harsh / bright treble | Hard surfaces at first reflections (P06); live room (P08); toe-in straight at ears with bright speaker (H05); treble trim | Reduce toe-in slightly; soften one reflection point; treble −0.5 dB |
| S06 | Dull / closed-in | Very dead room (P08, H06); ears above or below axis (G08); obstruction (G10) | Check heights; treble +0.5 dB; remove obstruction |
| S07 | Image pulls to one side | Unequal distances (G05); asymmetric reflections or objects (G03, G10) | Check the balance control. Swap the L and R cables at the amplifier: if the pull changes side, the cause is upstream (source, amplifier, cable). If not, swap the speakers: if the pull follows a speaker, it is the speaker; otherwise the room (R3 review: the old wording mixed these up) |

Rules for S-rules:

- Each experiment changes **one** thing, by a stated amount, with the same three reference tracks, and asks for a rating. Results are logged per setup variant.
- If the user's rating after a physics-backed change contradicts the physics (for example they prefer a position at a predicted null), the app records it and says so honestly. It doesn't argue, it doesn't change the model, and it notes that preference is valid.

---

## Rules explicitly NOT in v1

- Multiple subwoofer optimisation [WELTI06]: out of scope (no subwoofer support in v1; the owner's speakers have a sub out, possible v2).
- Non-rectangular room modes (L-shapes, slanted ceilings): out of scope. Confidence capped, see SCORING.
- Room EQ / measurement-based correction: out of scope (no measurements).
- Absolute SPL predictions: never shown.

---

## Appendix A · Surface and object presets (absorption coefficients)

Octave bands 125 / 250 / 500 / 1k / 2k / 4k Hz. Values are typical published figures of the kind tabulated in [EVP]. Every preset is displayed to the user as an *estimate*. **(R5)** Each row was compared with a second, independent table, [PRA] (the materials database shipped with pyroomacoustics 0.10.1); the book table itself could not be opened from the build environment. The last column gives the result.

| Preset | 125 | 250 | 500 | 1k | 2k | 4k | Class | R5 check against [PRA] |
|---|---|---|---|---|---|---|---|---|
| Painted plaster / concrete | 0.01 | 0.01 | 0.02 | 0.02 | 0.02 | 0.03 | reflective | ✓ "smooth unpainted concrete" 0.01, 0.01, 0.02, 0.02, 0.02, 0.05 |
| Plastered brick (**changed in R5**) | 0.013 | 0.015 | 0.02 | 0.03 | 0.04 | 0.05 | reflective | ✓ "rendered brickwork" 0.01, 0.02, 0.02, 0.03, 0.03, 0.04; the classic "plaster, smooth on tile or brick" row has exactly these values (confirmed in a search summary of the sengpielaudio table) |
| Plaster on wooden lath (**new in R5**) | 0.14 | 0.10 | 0.06 | 0.05 | 0.04 | 0.03 | reflective | ≈ the classic "rough plaster on lath" row; same order as [PRA] "plasterboard on frame" 0.15, 0.10, 0.06, 0.04 |
| Gypsum board on studs (lightweight) | 0.29 | 0.10 | 0.05 | 0.04 | 0.07 | 0.09 | reflective (+ bass leak flag) | ≈ single board; [PRA]'s double board with mineral wool has 0.15 at 125 Hz. Kept: one board is the common case |
| Window glass | 0.35 | 0.25 | 0.18 | 0.12 | 0.07 | 0.04 | reflective | differs: [PRA] "glass window, 0.68 kg/m²" has 0.10 at 125 Hz. Thin panes resonate, so tables differ widely; kept, low weight in practice (small areas) |
| Wood floor | 0.15 | 0.11 | 0.10 | 0.07 | 0.06 | 0.07 | reflective | ✓ "wood, 1.6 cm on planks" 0.18, 0.12, 0.10, 0.09, 0.08, 0.07 |
| Heavy carpet on concrete | 0.02 | 0.06 | 0.14 | 0.37 | 0.60 | 0.65 | absorptive (HF) | ✓ same shape as "thin carpet cemented to concrete" (lower) and "6 mm pile on open-cell foam" (similar) |
| Carpet on underlay | 0.08 | 0.24 | 0.57 | 0.69 | 0.71 | 0.73 | absorptive | ✓ identical to "carpet 1.35 kg/m², on hair felt or foam rubber" |
| Heavy curtain, draped | 0.14 | 0.35 | 0.55 | 0.72 | 0.70 | 0.65 | absorptive | ✓ same order as "cotton curtains draped to 3/4 area" 0.30, 0.45, 0.65, 0.56, 0.59, 0.71 |
| Bookshelf / CD or record wall | 0.15 | 0.20 | 0.25 | 0.30 | 0.35 | 0.35 | diffusive · **low confidence** (no standard data) | no row to compare: estimate |
| Canvas painting on wall | wall value +0.05 above 500 Hz | | | | | | reflective · **low confidence** | estimate |

Objects (absorption area, m² sabins, per object, mid bands):

| Object | ≈ A (500 Hz–1 kHz) | Confidence |
|---|---|---|
| Upholstered bed / large sofa | 1.5 – 3.0 | low |
| Upholstered armchair | 0.5 – 1.0 | low |
| Person seated | 0.4 – 0.5 | medium |
| Wooden table / cabinet | ≈ 0 absorption; counts as reflector / scatterer | n/a |

Object values are ranges. The engine uses the midpoint and propagates the range into T60 uncertainty.

**(R5) Fixed:** the default wall and ceiling material "plastered brick" carried the values for rough plaster *on lath* (0.14 at 125 Hz), about ten times the bass absorption of plaster on masonry. It now has the masonry values, and "plaster on wooden lath" is its own choice. The busy-ness amounts were raised by 0.1 m² per m² of floor so that the anchors of P08 stay where they were (mid T60). The predicted bass reverberation rises (Room R, some furniture: 0.48 → 0.86 s at 125 Hz), so the predicted peaks and dips get deeper. See `docs/REVIEW_R5.md`.

---

## References

| Key | Reference | Status |
|---|---|---|
| [TOOLE] | Toole, F. E. *Sound Reproduction: The Acoustics and Psychoacoustics of Loudspeakers and Rooms*, 3rd ed. Routledge, 2018. | ✓ book. Chapter-level cites not checked (no access from the build environment); no number in the engine depends on them (R5) |
| [EVP] | Everest, F. A. & Pohlmann, K. C. *Master Handbook of Acoustics*, 7th ed. McGraw-Hill, 2021. ISBN 978-1-260-47359-9. | ✓ edition (R5). Absorption tables: compared row by row with [PRA], see Appendix A |
| [KUT] | Kuttruff, H. *Room Acoustics*, 6th ed. CRC Press, 2016. ISBN 978-1-4822-6043-4. | ✓ book (R5). Chapter cites not checked; formulas used are standard and derived in this catalogue |
| [ALL74] | Allison, R. F. "The Influence of Room Boundaries on Loudspeaker Power Output." *J. Audio Eng. Soc.* 22(6), June 1974 (AES 48th Convention paper 951). | ✓ volume and issue (R5: was given as 22(5)). Pages not confirmed |
| [SCH96] | Schroeder, M. R. "The 'Schroeder frequency' revisited." *J. Acoust. Soc. Am.* 99(5), 3240–3241, 1996. doi:10.1121/1.414868 | ✓ (R5) |
| [SAB] | Sabine, W. C. *Collected Papers on Acoustics*. Harvard University Press, 1922. | ✓ |
| [EYR30] | Eyring, C. F. "Reverberation Time in 'Dead' Rooms." *J. Acoust. Soc. Am.* 1(2A), 217–241, 1930. doi:10.1121/1.1915175 | ✓ (R5) |
| [BON81] | Bonello, O. J. "A New Criterion for the Distribution of Normal Room Modes." *J. Audio Eng. Soc.* 29(9), 597–606, 1981. | ✓ (R5) |
| [BOLT46] | Bolt, R. H. "Note on Normal Frequency Statistics for Rectangular Rooms." *J. Acoust. Soc. Am.* 18, 130–133, 1946. | ✓ (R5; issue number dropped, not confirmed) |
| [ITU1116] | ITU-R Recommendation BS.1116-3 (02/2015): methods for the subjective assessment of small impairments in audio systems, incl. reference listening room requirements. | ✓ revision (R5). Loudspeaker height: the reference axis meets the listening point at seated ear height, inclination at most 10° (✓ from secondary summaries; clause number not checked) |
| [ITU775] | ITU-R Recommendation BS.775-4 (12/2022): multichannel stereophonic sound system with and without accompanying picture (±30° front pair). | ✓ revision (R5) |
| [DAV80] | Davis, D. & Davis, C. "The LEDE Concept for the Control of Acoustic and Psychoacoustic Parameters in Recording Control Rooms." *J. Audio Eng. Soc.* 28(9), 585–595, 1980. | ✓ pages (R5) |
| [WALL49] | Wallach, H., Newman, E. B. & Rosenzweig, M. R. "The Precedence Effect in Sound Localization." *American Journal of Psychology* 62, 315–336, 1949. | ✓ (R5; issue number dropped, not confirmed) |
| [PRA] | pyroomacoustics 0.10.1, `materials.json` (absorption database), MIT licence, from PyPI. A compilation of published tables. | ✓ used to cross-check Appendix A (R5) |
| [DWELL] | Surveys of furnished dwellings, as summarised in the introduction of *Applied Sciences* 11(6), 2709 (2021): Bradley (602 Canadian homes, about 0.4 s, 100–4000 Hz), Burgess et al. (47 living rooms, 0.33 s at 500 Hz), Jackson et al. (50 living rooms, 0.51 s at 1 kHz), Parkin et al. (about 0.5 s). | ✓ secondary summary (R5); originals not checked |
| [WELTI06] | Welti, T. & Devantier, A. "Low-Frequency Optimization Using Multiple Subwoofers." *J. Audio Eng. Soc.* 54(5), 2006. | not used in v1 |
| [CARDAS] | Cardas Audio, speaker placement guide (web page). | not used: H03 is not implemented (its numbers stay unverified) |
