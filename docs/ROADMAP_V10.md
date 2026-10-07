# Roadmap V10: drag first, listen in context, speak like a person

Written after the owner's V10 review ("shaping up nicely … several UX friction points, logical
discrepancies between room inputs and diagnostic advice, awkward phrasing"). The owner asked for
the calls of a lead UI architect and an acoustic consultant, and for one or two ideas that set NODO
apart. V9 stays reachable, frozen, at `/legacy/v9/` (V8 and V7 beside it, listed at `/legacy/`).

## 1. Decisions, point by point

| Owner's point | Finding | V10 |
|---|---|---|
| Header: drop the room size and the empty "Untitled room". | The name and size repeat what Room & speakers already holds. | The header is ☰ · NODO · undo/redo, then the three steps. A name shows, small and muted beside the wordmark, only once you give one. You name the room in the menu (it is not an acoustic input, so it does not belong in the Room group, §4). |
| Onboarding asks for tape-measure distances before you have seen the map. | The survey's last screen asked for three distances in centimetres. | The screen is gone (three questions now). The first placement is a rule-of-thumb guess: seat at 38 % of the room's length, speakers and seat in an equilateral triangle (§2). A note on the map says so and invites you to drag; "Looks right" confirms it. Dragging is the main way in; the exact numbers stay in one fold. |
| The listening check ignores the room: echoey in a cluttered room gets rugs and cushions. | **Confirmed.** L07 suggested soft furnishings whatever "How full" said; L06 the same for harsh treble. Tone controls were always "if yours has one", even when ticked. | Every listening rule now reads the room page (§3). A full room that still rings gets the clap test for flutter echo between bare parallel surfaces, sitting closer and toe-in; a rug only where the floor is hard. Ticked tone controls are named directly ("Turn your treble control down a notch") and come first. |
| 8–10 everyday scenarios. | Six rows. | **Ten rows in four groups**: Bass (amount, lowest notes, evenness), Tone (voices, treble incl. sibilance), Stereo image (centre and drift, width, depth, sweet spot), Room (echo). §3. |
| Free moves and basic EQ before treatment. | Already the order; now enforced per rule. | Unchanged order: moves, then the speaker's own controls, then the room. |
| Audit every Room & speakers input. | Every input reaches the result, but "Open to another room" only lowered the confidence, invisibly. | The full table is in §4. "Open to another room" and "Not a plain rectangle" now also change the listening check: bass explanations, a door test, and the room model withholds its opinion on moves it cannot judge. |
| "Best here: Good" is confusing. | "Here" is ambiguous and the noun is missing. | "Best placement: Good" on the speaker map and "Best seat: Good" on the seat map, the same words as the result card above it (§5). |
| Centre the disclaimer under the map. | It sat left, the support link right. | The note is centred on the map's axis; the support link floats in the bottom-right corner, out of the flow. |
| About: blur, centred mark, human voice; no support link, no "opens in a new tab". | Corporate small print. | Rewritten (§6), blurred backdrop, centred wordmark, centred Close. The support link stays only in the corner of the map. |
| The menu reads as a generic popover. | A floating card with mixed controls. | A **drawer** from the left, as wide as the panel, built from the panel's own parts (section titles, ruled rows, segments, checkbox): This room · Preferences · More. Blurred backdrop, Esc or ✕ to close. |
| Creative mandate. | — | Three additions, each grounded in physics (§7): **toe-in beams** you can turn on the map (where the aims cross: in front of you, at you, behind you); a live **wall dip** reading on the speaker you move; **test sounds** for the ears (left, right, centre, polarity, a bass sweep). |

## 2. The first placement

- Seat (ears) at **0.38 · L** from the front wall. H01, 🟡: a folk rule of unclear origin, but its
  logic holds for the length resonances: it stays clear of the first one's null at L/2 and the
  second one's at L/4 and 3L/4 (P03, 🔴).
- Speakers and seat in an **equilateral triangle** (±30°, [ITU775], 🟠): spacing = listening
  distance = (seat − speaker line) / sin 60°. The speaker cabinets' rear panels start 0.5 m from the
  front wall, as before.
- The triangle wins when the room cannot hold both: the spacing is kept between 1.0 m and what the
  width allows (each speaker centre ≥ 0.6 m from its side wall), and the seat moves with it, never
  closer than 0.5 m to the back wall.
- These positions stay "not yet placed" (certainty `unknown`): the search does not hold the speakers
  to a zone around a guess, and D07 does not advise on them, as in V9. Dragging an item, or
  "Looks right", marks it placed.

The old default put the seat wherever the spacing led: in a 4 × 5 m room that was 2.38 m, 48 % of
the length, almost on the first length null. The new one is 1.90 m.

## 3. The listening check, in context

Ten rows. Each answer opens up to two fixes under it, as in V9. New and changed rules
(full table in `docs/RULE_CATALOGUE.md`, L01–L11):

| Row | New or changed | Why |
|---|---|---|
| Bass: boomy | The speaker's **wall switch** if it has one (🟠, manufacturer); a ticked **bass control** named directly; **hollow furniture** under the speakers (desk, light stand, suspended wooden floor) can boom along: something heavy and solid under them (🟡, practice). | Coupling colours the bass and lower midrange (structure-borne vibration of a resonant panel). It does not make a room echo, so it is not offered for echo (owner's assumption adjusted). |
| Lowest notes: missing (new, L08) | The front-wall dip when it lands in 35–100 Hz (P04, 🔴: move the speakers close to the wall so it rises out of the bass); a seat at the room's middle (P03, 🔴); the speakers' own limit when their −6 dB point is ≥ 50 Hz (says so honestly); in a room open to another, close the door and listen (an opening absorbs like an open window, [SAB], 🔴). | Thin overall vs only the lowest octave missing have different causes. |
| Bass: thin | The door test in an open room; a ticked bass control first. | |
| Voices: muffled (new, L09) | At a desk, the desk reflection (G12, 🔴): to the front edge, tilted up; tweeters at ear height (G08, 🟠); fix a boomy bass first (upward masking, [FAS07], 🟠); hollow furniture (🟡); sit closer when far (P10, 🔴). | |
| Treble: harsh or hissy S sounds | Less toe-in (🟣); a ticked treble control first; in a **bare** room with a hard or unknown floor, something soft at the reflection points; in a **full** room, look for one hard, shiny surface near the path (glass table, bare desk top, window) instead. | Sibilance is the harsh case: same causes, same fixes. |
| Centre: vague, or pulled | **Polarity** (one speaker wired + to −) blurs the centre and thins the bass (superposition, 🔴); the **balance control**; then the swap test. | |
| Depth: flat (new, L10) | More space behind the speakers; less toe-in; clear big hard objects between them. All 🟣 by ear: depth is mostly in the recording, and no study we can cite sizes these. | Offered because people ask, labelled honestly. |
| Sweet spot: tiny (new, L11) | Toe-in so the aims cross just **in front of** you (time–intensity trading: leaning towards one speaker takes you off its axis, 🟡); sit further back (smaller time difference per step sideways, 🔴 geometry). | Pairs with the toe-in beams on the map. |
| Echo | **Busy or very busy room:** the clap test for flutter echo (two bare parallel surfaces, [KUT] [EVP], 🔴), sit closer (P10, 🔴), a little more toe-in (less sound to the side walls first, 🟣). **Bare or some:** sit closer, soft things on hard surfaces (P08, 🟠). | The owner's case: a cluttered room that still rings is not short of cushions. |

Context the rules now read: how full (busyness), the floor material, the tone controls and wall
switch, the room's shape answers, where the speakers stand, where you listen, and the other answers
(boomy bass masks voices). The room model's "expects it to help" line is withheld for bass moves in
a room open to another, and for every move in a room that is not a plain box.

Sources: everything cited is already in the catalogue, plus **[FAS07]** (Fastl & Zwicker,
*Psychoacoustics*, 3rd ed., Springer 2007: upward spread of masking; chapter not checked) and the
pseudo-source **practice** (widely used by ear, no study behind it; always 🟡 or 🟣, never scored).

## 4. Room & speakers: what each input does

| Input | The map (scores, search) | The listening check | Other |
|---|---|---|---|
| Width · length · height | everything | every rule | |
| I measured these | search jitter ±1 % instead of ±5 %, fragility | | How sure |
| Walls · floor · ceiling | absorption → reverberation (P08), reflections (P06, G09), wall construction → bass | rug only on a hard floor; harsh/echo advice | How sure |
| How full | absorption → reverberation, critical distance (P10) | echo and harsh advice (§3) | |
| Open to another room | — (the box model cannot place an opening) | door test, bass explanations, model opinion withheld for bass | How sure (bass) |
| Not a plain rectangle | — | model opinion withheld for every move | How sure (all) |
| Kind · size · port · stands on | size, depth, lowest note, port, heights → SBIR, boundary gain, modes, G07, G12 | port plugs, coupling, desk | |
| Drivers, W · H · D, lowest note | acoustic centre, cabinet, modal excitation (P09, C02) | lowest notes (L08) | |
| Treble · bass control | D02, D03 (D07 when not ticked) | named directly, first | |
| Wall switch | G07, D01 | boomy bass (L01) | |
| Minimum wall distance | G07, the search's limit | L02 never moves closer | |
| Where you listen | listening area (worst head position), G12, C01, C03 | desk rules (L09) | |
| The speakers may move | the search zone | | |
| What matters to you | goal weights | | |
| Exact positions | positions | every rule | |

Nothing is left that changes nothing. The room's **name** moves to the menu: it is a label, not
an input.

## 5. The map

- **Legend.** "Acoustic balance" means tonal or left–right balance to audio people, and "prone to
  boundary nulls" names one cause while the score weighs several (bass evenness, wall dips, stereo
  geometry, reflections). So the line names what is rated, in the result card's words: *Best
  placement: Good* (speaker map) and *Best seat: Good* (seat map); HU *Legjobb elhelyezés: Jó*,
  *Legjobb ülőhely: Jó*.
- **Foot.** One centred line: what the model is, and "What it knows". The support link sits apart
  in the bottom-right corner.
- **First-guess note** on the map while the positions are a guess (§2).

## 6. About, in our own voice

> NODO gives you a starting point grounded in physics, so you spend the evening listening rather
> than guessing.
>
> **What a box can tell you.** Treating your room as a rectangular box, NODO predicts the big,
> slow things: the room's bass resonances, the dips from sound bouncing back off the walls near
> your speakers, the first reflections reaching your seat, and the stereo triangle between you and
> the speakers.
>
> **What needs your ears.** A plan cannot hear how your speakers spread their sound, how a sofa or
> a bookcase scatters it, or how unevenly your room soaks it up. A measurement microphone can show
> those; your ears can judge them.
>
> Every room is different. Let NODO get you close, then move one thing at a time, play music you
> know by heart, and trust what you hear.

Then the rule catalogue line and the version, and Close, centred.

## 7. Physics you can touch

- **Toe-in beams.** Each speaker's aim drawn into the room, and where the two cross: in front of
  you, at you, or behind you. A handle on the selected speaker turns both (a slider for keyboards
  and screen readers, 0–35°). What it means is said once, as 🟣 by ear (H05, [TOOLE]): crossing
  at you is the most focused, in front of you widens the sweet spot, behind you is the most
  spacious.
- **Wall dip.** On the selected speaker: the front-wall dip at your seat, c / (2Δ) (P04, 🔴), with
  its band: deep bass (< 80 Hz), upper bass (80–300 Hz) or above the bass. Drag and watch it move:
  H04's "near or far, not in between" without a word of theory.
- **Test sounds** (Listening check). Pink noise left, right and centre (both channels, in phase:
  one narrow image in the middle); a **polarity check** (A in phase, B with one channel inverted:
  A should sound fuller and centred, else one speaker is wired + to −); a slow **bass sweep**
  35–180 Hz to hear which notes jump out or vanish. Safety: "turn the volume down first", quiet
  levels, fades, nothing below 35 Hz, nothing high and loud, one sound at a time, auto-stop. These
  are signals for your ears, not measurements: nothing is recorded (the brief stands).

## 8. Order of work

0. Archive V9 — **done**.
1. This plan.
2. Header, menu drawer, room name; About.
3. Survey without positions, first placement, the first-guess note.
4. Map: legend words, centred foot, toe-in beams and handle, wall dip.
5. Listening check: context, ten rows, L08–L11, test sounds; catalogue.
6. Tests, docs, every gate, screenshots.
