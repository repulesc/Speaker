# Review of R2 and R3 (Opus)

Scope: everything built since R1 that turns engine output into advice or numbers on screen: the Treat tab (T and D rule copy), the bass-note explorer, the furniture palette and materials, the Listen tab, compare setups, the print sheet, and the R2 finding sentences. Goal: find places where the app could say something confidently wrong. Each fix has a test.

## Fixed

| # | Severity | What was wrong | Fix |
|---|---|---|---|
| F1 | High | Compare and the Listen agreement used the probe's *nominal* score, while "Your setup" shows the *robust* score. The same setup could read "Good" in one place and "Fair" in another. | New engine job `setupScore` (`src/engine/setupScore.ts`): the robust score with the analysis's seed, plus the bass curve. Test: equals `analyze().current.score` exactly. |
| F2 | High | A rating stayed attached to a setup after it was moved, so the agreement compared what the ears heard *before* with the app's score *after*. | Each note stores a fingerprint of the setup (positions to 1 cm, toe-in, objects, busy-ness). Only ratings that match the setup as it stands count; older ones stay in the list, marked. Tests in `tests/app/listen.test.ts`. |
| F3 | High | The S07 tip ("image pulls to one side") said a pull that follows the swapped cable is "the speaker or amplifier". Swapping cables only separates *upstream* (source, amplifier, cable) from *speaker or room*; separating speaker from room needs the speakers swapped. The catalogue line had the same confusion. | Tip and catalogue rewritten: balance control, then cable swap at the amplifier, then speaker swap. EN and HU. |
| F4 | Medium | Print sheet: the seat line used `{height}` but was given `ears`, so the ear height never printed. | Template fixed (EN, HU). |
| F5 | Medium | The bass-note pattern was drawn half a grid cell (about 5–10 cm) off: the grid stores cell centres, the canvas was placed at the first centre instead of the first edge. | Canvas placed at `x0 − step/2`, like the score map. |
| F6 | Medium | The explorer offered notes up to 200 Hz with no warning, though above the room's transition (Schroeder) frequency, about 150–250 Hz in homes, modes overlap and a rigid-box model describes the real room less well. | A sentence appears above the transition frequency. |
| F7 | Medium | "Setup X scores higher" and the agreement treated a score gap of 0.02 as meaningful. A 5 cm placement error alone moves scores by up to 0.04 (fragility "steady" band). | Tie threshold 0.05, shared by compare and the agreement, documented. |
| F8 | Medium | T05 "too dead": with little soft furnishing it advised taking away "about 0 m²" of absorption. | No advice when under 1 m² could be removed. Test. |
| F9 | Medium | D04: when the speaker's axis is above the ears even standing on the floor, it advised a stand "about 0 cm" high. | New `tilt` variant (tilt down or sit higher), EN and HU. Test. |
| F10 | Low | T02 said a rug "usually helps" the floor reflection. A rug absorbs mainly the treble; it does little for the lower frequencies of that reflection. | Copy says so (EN, HU). |
| F11 | Low | Compare and Listen re-scored every setup on every drag event, queueing work in the worker. | Scoring waits until edits settle (300 ms). |

## Checked, no change

- **Explorer physics** (`modeField`): same modal sum and damping as P09, modes to twice the note, 0 Hz term included, levels relative. "Nearby" uses ±5 %, close to the modal half-power bandwidth (2.2/T60 Hz) for typical rooms between 40 and 100 Hz.
- **T01, T03, T04, T06, D01, D02, D03, D05, D06**: the conditions match the findings they build on, and the copy does not promise more than the rule. T03's "quarter wavelength" equals the woofer's own distance from the wall, so "a panel would need to be about that deep" is literally right.
- **R2 finding sentences**: read against the rules; no overclaims found.
- **Print numbers**: rear panel to front wall = `base.y − depth/2` (same as `rearClearance`), centre to nearest side wall, toe-in sign as stored (positive = inward for both). Unit test.
- **Material absorption**: per-m² ranges are ordinary coefficients times exposed surface; a sofa of 2 × 0.9 × 0.85 m chosen as "soft" gives 1.0–2.4 m², close to the per-kind table (1.5–3.0).

## Left open (documented, not fixed)

- **New furniture absorption values** are estimates without a source (⚠ in RULE_CATALOGUE). A wardrobe defaults to "hard" while its table value (0.2–0.6 m²) assumes some clothing absorption; the difference is small next to the busy-ness range.
- **D04** speaks of "tweeters at ear height" but uses the acoustic axis height from the profile, which for some speakers lies between tweeter and midrange. Fine for the advice; R4 may word it as "the speakers' axis".
- **The agreement** is a count of agreeing pairs, not a statistical test. With two or three setups it is a hint, and the copy says to trust the ears when it disagrees.
- **Hungarian** text of all the above still needs the owner's review (R4).
