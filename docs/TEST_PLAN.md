# Test Plan (v1)

Status: Phase 0 draft. Goal: the app must never give confidently wrong advice. Tests are the main defence, so they are written alongside, or before, the code they test.

## 1. Test layers

| Layer | Tool | Runs | Scope |
|---|---|---|---|
| Unit (engine) | Vitest | every push (CI) | each rule P/G/H/S, each score component, units parser and formatter |
| Property-based | Vitest + fast-check | every push | physical invariants (§3) |
| Reference / cross-check | Vitest against committed fixtures | every push | engine output vs an independent implementation (§4) |
| Golden scenarios | Vitest snapshot of ranked candidates | every push | Room R, the owner's room, edge rooms (§5) |
| i18n completeness | TypeScript compile + Vitest | every push | key and placeholder parity EN/HU |
| Component / UI | Vitest + Testing Library (Svelte) | every push | forms, certainty chips, unit fields |
| End-to-end | Playwright (Chromium) | every push | key journeys (§6) |
| Accessibility | axe-core in Playwright | every push | no serious or critical violations |
| Performance | Playwright timing + bundle-size check | every push | budgets from UI_SPEC §11 |
| Human review | checklist | each milestone | physics audit, Hungarian copy, "bad advice hunt" |

Deploy to GitHub Pages happens only when all automated layers pass.

## 2. Rule unit tests (from the worked examples)

Every test case in `RULE_CATALOGUE.md` becomes a unit test with the same numbers. Key values (Room R: W = 4.0, L = 5.0, H = 2.5, c = 343):

| Rule | Input | Expected |
|---|---|---|
| P01 | T = 20 °C / 0 °C / 25 °C | 343.2 / 331.3 / 346.1 m/s (±0.1) |
| P02 | Room R | (0,1,0) 34.30 · (1,0,0) 42.88 · (1,1,0) 54.91 · (0,2,0) and (0,0,1) 68.60 · (0,1,1) 76.70 · (2,0,0) 85.75 · (1,1,1) 87.87 · (0,3,0) 102.90 Hz (±0.01) |
| P03 | listener y = 2.5 | ψ(0,1,0) = 0 (exact, ≤ 1e-12) |
| P04 | d = 0.5 / 1.0 / 0.3 m | 171.5 / 85.75 / 285.8 Hz |
| P06 | speaker (1.2, 1.0), listener (2.0, 3.5), left wall | reflection y = 1.9375 m; delay 4.19 ms; level −3.8 dB |
| P07 | V = 50, T60 = 0.4 | 178.9 Hz |
| P08 | Room R, ᾱ = 0.25 | Sabine 0.379 s; Eyring 0.329 s; reported method = Eyring |
| P10 | V = 50, T60 = 0.4, Q = 2 / 4 | 0.90 / 1.27 m |
| P11 | Room R | ITU pass (1.76 ≤ 2.0 ≤ 3.2); coincidence caution at 68.6 Hz |
| G01 | y_l = 2.5 / 2.3 / 2.8 / 3.1 | red flag / red flag / caution / ok |
| G02 | y_l = 4.8 | red flag |
| G03 | side distances 0.9 vs 1.3 | red flag |
| G04 | speakers x = 1, 3 at y = 1; listener (2, 2.732) | 60.0° → ok |
| G05 | 2.40 vs 2.47 m | caution |
| G08 | axis 0.9 m, ears 1.1 m, distance 2.5 m | 4.6° → ok |
| H01 | Room R | overlay at y = 1.90 m |

Threshold edges get explicit tests on both sides (e.g. G01 at exactly 5% and 10%).

## 3. Property-based invariants

1. **Reciprocity:** the P09 response is identical when the source and receiver are swapped.
2. **Scaling:** all dimensions × k ⇒ all mode frequencies × 1/k.
3. **Symmetry:** a mirror-symmetric setup gives mirror-symmetric heatmaps (within floating-point tolerance).
4. **Node exactness:** a receiver on a mode's nodal plane gets zero contribution from that mode.
5. **Goal isolation:** changing goals never changes C1, C2 or C3 values.
6. **Monotonic confidence:** changing any input from unknown → estimated → measured never lowers confidence.
7. **Units round-trip:** `parse(format(x))` within half the display precision.
8. **Determinism:** same project ⇒ byte-identical `Analysis` (seeded perturbations).

## 4. Independent cross-checks

The model must not be checked only against itself.

- **Reference implementation:** `tools/reference/` holds a short, independently written Python (NumPy) implementation of P02, P04, P06, P07, P08 and P09. It's written from the formulas in the rule catalogue, **not** translated from the TypeScript. It generates JSON fixtures that are committed. CI compares the engine output with the fixtures (tolerances: frequencies ±0.01 Hz, bass curve ±0.5 dB after normalisation). Fixtures are regenerated only deliberately, with a reason in the commit message.
- **External tool spot-checks (manual, recorded):** for Room R and the owner's room, compare against at least one established room simulator, such as the REW room simulator or the amroc room-mode calculator:
  - mode list;
  - shape of the predicted response, with the same positions.

  Record the screenshots and numbers in `docs/verification/`. Differences above tolerance must be explained (for example a different damping assumption) or fixed.
- **Literature cross-check:** every source marked ⚠ in the rule catalogue must be resolved (✓ or rule dropped) before v1 launch. This is tracked in `OPEN_QUESTIONS.md`.

## 5. Golden scenarios

| Scenario | Purpose |
|---|---|
| Room R, empty, default speaker | baseline; must recommend avoiding y = 2.5 and show the 68.6 Hz coincidence |
| Cube room 4 × 4 × 4 m | worst-case coincidences; P11 must caution strongly; confidence unchanged (it's a valid room) |
| Long narrow room 8 × 3 × 2.5 m | speakers on the short wall; stereo angle must still be reachable |
| Tiny room 2.5 × 3 × 2.4 m | near-field limits; listener-to-speaker constraint (≥ 1 m) still satisfiable or clearly reported |
| Lightweight walls | bass confidence capped at 0.6 |
| Room with "slanted ceiling" | out-of-model banner; caps applied |
| Seat fixed against back wall | G02 red flag; the engine must still give the best speaker positions for that seat |
| Speaker with rear port and min wall distance | G07 caution and constraint respected |
| Owner's room (§7) | real-world sanity check |

The snapshot holds the top 3 candidates (positions rounded to 5 cm), their scores (2 decimals) and the finding IDs. Changes require explicit review.

## 6. End-to-end journeys (Playwright)

1. **Quick start:** open → choose Quick → enter 5 × 4 × 2.5 m → choose a speaker → Results show at least one finding and a confidence word, within 3 s.
2. **Edit without restart:** after results, change the ceiling height → results update; nothing else is lost.
3. **Variants:** create a variant, move the seat 20 cm → the comparison shows both; undo restores.
4. **Units:** switch to imperial → all displayed values convert; type `11'6"` → stored as 3.5052 m.
5. **Language:** switch to Hungarian → no English left on screen (scan for the keys' English text).
6. **Share:** create a share link → open in a fresh context → identical project (notes excluded).
7. **Export / import:** round-trip the file; importing a corrupt file shows an error and keeps the current project.
8. **Storage blocked:** run with storage disabled → app works, shows the "not saved" notice.
9. **Phone viewport (390 × 844):** bottom sheet works; no horizontal scroll; tap targets ≥ 44 px.
10. **Keyboard only:** complete Quick start without a mouse.

## 7. The owner's room: test profile

One realistic profile. The product stays universal. **Missing values must be supplied by the owner before Phase 1 golden tests** (see OPEN_QUESTIONS Q1).

| Item | Value | Status |
|---|---|---|
| Room width × length × height | ? × ? × ? m | ⚠ owner to measure |
| Construction | ? | ⚠ owner |
| Speakers | KEF LSX II LT (owner wrote "LSX LT2"; the product page is titled "LSX 2 LT", sold as "LSX II LT") | partially verified (below) |
| One side wall | fully covered with CDs → preset `shelf-diffusive` (low data confidence) | from owner |
| Other side wall | radiator and window in the corner, reported to be outside the first-reflection zone → check with P06 once positions are known | from owner. P06 must confirm |
| Front wall (behind speakers) | two large canvases, no glass → `canvas-art` patches | from owner |
| Other speakers near the main speakers, mostly behind | `other-speaker` objects → G10 caution | from owner; positions needed |
| Floor | thick carpet → `carpet-heavy` or `carpet-underlay` | from owner |
| Furnishing | bed, table, furniture, artworks: "very busy" | from owner; bed position needed |
| Goals | wide-stage: important · precise-imaging: important · flat-response: important | from owner (conflict notice expected) |
| Speaker positions, stand height, seat position, ear height | ? | ⚠ owner |

**KEF LSX II LT, data gathered in Phase 0 (`verified: false` until a human checks the primary sources):**

| Field | Value | Source |
|---|---|---|
| Drivers | Uni-Q coaxial: 19 mm aluminium dome HF, 115 mm magnesium/aluminium alloy cone LF/MF | KEF product page (via search summary); SoundStage! Simplifi review |
| Enclosure | bass reflex, **rear port** (upper corner of the rear panel) | review summaries (Erin's Audio Corner, SoundStage! Simplifi); ⚠ confirm on KEF spec sheet |
| External dimensions | 240 × 155 × 180 mm (H × W × D order assumed) | review summary; ⚠ confirm on the KEF spec sheet. The figures were also in the search query, so treat them as unconfirmed |
| Frequency range | 49 Hz – 47 kHz (−6 dB); 54 Hz – 28 kHz (±3 dB), both "depending on EQ settings" | KEF product page (via search summary) |
| Amplification | 70 W (LF) + 30 W (HF) Class D per speaker | KEF product page (via search summary) |
| Max SPL | 102 dB @ 1 m | KEF product page (via search summary) |
| DSP (KEF Connect app) | Normal mode: placement (stand / desk), distance from the front wall, room size / acoustic character. Expert mode: finer bass and treble adjustments. Subwoofer output present. | KEF product page (via search summary) ⚠ confirm exact option names and ranges in the app or manual |
| Directivity | measured spinorama data exists (Erin's Audio Corner) | ⚠ extract `omniBelowHz`, horizontal and vertical data with attribution, if licensing allows |
| Manufacturer toe-in guidance | not found yet | ⚠ the owner's belief that no toe-in is needed stays unverified; H05 applies |

Expected behaviour for this profile once the dimensions are known:

- G07: the rear port means the app reminds the user to set the KEF Connect wall-distance option to match the chosen distance.
- G10: caution about nearby passive speakers, with the "cover or move them and listen" experiment.
- H06: a very busy room → likely a "dead" high-band T60 → suggestion "consider a small treble lift; try and listen", because the speaker has a treble control.
- Goals conflict notice (wide vs precise).

## 8. Human review checklists (each milestone)

**Physics audit (Opus, high or xhigh effort):**

- Re-derive each implemented formula from the catalogue.
- Run the reference fixtures.
- Look for unit mistakes (cm vs m, Hz vs rad/s).
- Confirm that every finding shown has a rule ID, a level and a source.

**Bad-advice hunt:** run the golden scenarios and read each result as a skeptical audiophile. Is any statement stronger than its evidence level? Is any heuristic presented as fact?

**Hungarian copy:** native read-through of all changed strings.

**Accessibility:** keyboard pass and a screen-reader smoke test (VoiceOver on iOS).
