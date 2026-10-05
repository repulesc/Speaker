# How credible is the heatmap? (assessment, 5 October)

Written after the owner asked whether a model without speaker dispersion, baffle size or toe-in is
defensible. Short answer: **solid for what it claims (where the room, not the speaker, decides the
sound), silent about the rest, and it must keep saying so.**

## What the maps rest on

| Part | Method | Evidence | How well supported |
|---|---|---|---|
| Bass at the seat (C1 smoothness, C2 dips) | Modal sum of a rigid rectangular room, both speakers coherently, damping from T60, a speaker high-pass (P09) | 🔴 physics | Verified: mode count against Kuttruff's asymptotic formula; shape against an independent image-source model (correlation 0.98 to 0.99, mean difference about 1 dB, worst 3 to 4 dB near 110 Hz); `docs/verification/image-source.md`. **Not yet checked against a measured room (REW).** |
| Front-wall null (C3) | Single-boundary path-difference, `c/4d` | 🔴 | Standard (SBIR); the modal model takes over below the Schroeder frequency |
| Stereo angle and equal distances (C4), symmetry (C5), back wall (C6), corners (C7) | Guideline rules | 🟠 / 🟡 | Widely taught (ITU-R BS.1116, Toole, Everest); they are guidelines, and labelled so |
| Reflection points (C8, P06) | Image sources, inverse square only | 🔴 geometry, 🟡 level | Geometry is exact; the level ignores speaker directivity and wall absorption by frequency |

**Why a bass model is the right core.** Below roughly 200 to 300 Hz in a domestic room the sound is
decided by modes and boundaries, which depend on room size, speaker and seat position, and little
on the speaker's shape. This is also where placement changes the sound the most (several dB, at
specific frequencies), and where it is cheapest to fix. That is why the bass part carries the most
weight and why it is the part we verified.

## What it leaves out, and what that costs

1. **Dispersion (directivity).** Above the transition region, how a speaker spreads its sound
   decides how strong the first reflections are, how wide the sweet spot is, and what toe-in does.
   Today directivity enters only through the critical distance (P10, from a Q value) and one
   threshold in the reflection rules. Two speakers with different dispersion get nearly the same
   map above 300 Hz. **Consequence:** the map says little about imaging, treble and
   reflection-related character. The text already says toe-in is an experiment (H05) rather than
   giving a number, which is the honest position without measured polar data.
2. **Baffle size and diffraction.** Baffle step and edge diffraction shape the 200 to 800 Hz region
   and the speaker's own response. Not modelled. They matter for how a speaker sounds on a
   stand, less for how a room treats it.
3. **Toe-in.** Not in the score. Only in advice, as an experiment.
4. **Room idealisation.** A rigid rectangular box: no open doorways, no lightweight walls that
   absorb bass, no furniture in the modal sum (furniture is only a keep-out and a surface at
   reflection points). The model reports its own limits as lower confidence.
5. **Absolute level.** Only the shape of the response is meaningful, never loudness.

## Verdict

- **Defensible** as a placement advisor for the bass and the geometry, with the evidence labels
  the app shows. The maps never claim a measured response.
- **Not defensible** if presented as a prediction of the full-range sound, of imaging, or of a
  specific speaker's behaviour. The app does not claim that today; keep it that way.
- **The new "bass only" region of the speaker map** (speakers beside or behind the seat) is
  physics-only and hatched; it is not a stereo score and must not be read as one.

## What would raise credibility, in order of value

1. **A measured check.** One or two real rooms measured with REW (the project's own OPEN item),
   compared with the model at the seat. Highest value, needs a volunteer and a microphone.
2. **Directivity from data, not guesses.** For a handful of common speakers, publicly measured
   horizontal and vertical polars (Spinorama / manufacturer data), stored with their sources and
   marked verified. Then toe-in and first-reflection levels can use them. Without data, a
   generic model (for example a cardioid-like spread with a type-dependent beamwidth) can be
   offered as 🟡, clearly labelled as an estimate, and only for the reflection level and the
   toe-in experiment, not as a score.
3. **Frequency-dependent absorption in the modal damping** (per mode, not one T60), the likely
   cause of the 3 to 4 dB gap against the image-source check.
4. **Furniture in the modal model** is a large piece of work with small gain; leave it.

Needs the owner's sign-off before any dispersion model enters the score (project rule: every rule
needs a formula, a cited source, an evidence level and tests).
