# Roadmap V5: from "settings" to "an answer you can act on"

Written after the owner's review of the live site (PR 9 state). It records the owner's decisions,
the defaults chosen where the owner has not answered yet (marked **Default**), and the order of
work for the implementing session. Locked decisions in `PROJECT_BRIEF.md` and `CLAUDE.md` still apply:
no confidently wrong acoustics, every rule with a source and evidence level, all text in EN + HU.

## Owner's guiding idea

> "I think we should separate the interactive experience, suggestions, solutions, and the actual
> process of trying to make sense of where the listening position and speakers should be. This should
> be strictly separated from the settings." Not a tweaking ocean, but something that helps us decide.

## 1. Answered by the owner (survey round 1)

| Topic | Decision |
| --- | --- |
| Side panel | **Answer first**, settings folded below. |
| Map layer picker | **Two big choices: Speakers / Seat.** Diagnostic layers (bass evenness, bass holes, wall interference, stereo symmetry, back wall, overall goals) move under a "Why?" disclosure. The long drop-down goes away. |
| "You are here" | **Yes:** a marker on the map at the current speaker/seat spot, with a score word ("Fair", "Good"). |
| Fade | **No fade-out.** The heat map covers the whole room on every layer; spots that are impossible or advised against are hatched, not blank. |

## 2. Answer to "is it a bug?"

Not a bug. On the speaker map the seat is fixed, so the map asks "if I put the pair *here*, how good
is it for this seat?", which does not depend on where the speakers are now. Moving the seat changes
the question, so that map changes. The missing piece was feedback: nothing showed where the current
speakers sit on that map. The "you are here" marker (section 1) fixes the understanding; no model change.

## 3. Work items, in order

### A. Quick wins (small, no model change) — DONE (A1–A3 implemented)
1. **Recommended-placement marker much more noticeable.** Today: thin dashed blue square. Make it:
   solid accent outline 2.5 px, white inner ring + soft shadow so it reads on every heat colour,
   semi-opaque accent fill, a "Best" label chip. Actual speakers stay white. Check on all heat
   colours and in the share image (`shareImage.ts` copies stroke/fill properties; drop-shadow filters
   are removed there, so the ring must be a real stroke).
2. **"You are here" marker** with score word on the speaker and seat maps.
3. **Whole-room heat map on all layers.** Seat layers: remove fade (`fadeAlpha`, FADE_M, GAP_FILLED_M),
   fill the whole room, hatch spots that cannot hold a seat (furniture, too close to a wall). Keep
   the relative scale and the Absolute switch.

### B. Result widget (the main redesign) — DONE
Replaces the "Results" submenus. Top of the side panel, always visible:
1. One sentence verdict with the mood face and score word ("Good. One thing could be better: ...").
2. **One or two suggestions**, each a single card with a before/after preview and an Apply button
   (existing Apply flow). Never more than two at once; the rest sit under "More ideas".
3. A "Why?" disclosure holds the diagnostic layers and the detailed rule list.
4. **Settings are strictly below**, folded: room, surfaces, furniture, speakers, constraints.
   Nothing in the widget changes a setting silently; the widget only proposes, the user applies.
5. Map picker: two large segmented choices (Speakers | Seat), plus "Why?".

Acceptance: a first-time user can read the verdict, apply a suggestion and see the face change without
opening any settings section. HU copy fits (type-scale and overflow e2e tests stay green).

### C. Listening area (replaces the single point) — DONE

As built: presets only (Chair, Sofa, Desk, Bed), no dragging or resizing, so it does not become one more thing to tweak. Desk replaces the old "listening distance" switch (Desk = sit close). Scoring: the area's spots, middle counting twice, inside the robustness runs (docs/SCORING.md §4). The plan below was the starting point.
**Default** (owner has not picked yet; chosen because it is simplest for non-engineers):
- Presets by what you sit on: armchair, sofa (2–3 people), desk, bed. Each is a rectangle of typical
  size with a centre point (armchair ~0.8 x 0.8 m, sofa ~2.0 x 0.9 m, desk ~0.8 x 0.6 m, bed ~1.6 x 0.8 m
  head area; mark sizes as typical, not sourced) and can be dragged/resized.
- The existing seat point = the area centre ("main listening spot"); scoring stays on that point as
  the headline, plus a **worst-case check over the area** (lowest score at the 4 corners + centre).
  The widget says e.g. "Good in the middle, weaker at the left end of the sofa".
- Search: speaker spots are scored for the centre and penalised only if the area corners fall below a
  threshold; no new tuning sliders.
- Evidence: bass response varies over metres, so area-average/worst-case is physics 🔴 for bass; the
  stereo-angle part for off-centre seats is geometry 🔴. Do not claim a "sweet spot" size without a source.

### D. Speaker choice in the survey (optional) — DONE

As built: the survey's speaker screen keeps the drawn type cards (they already carry size and cabinet: bookshelf, monitor, floorstander), and adds the bass port (sealed / front / back) and, folded under "More", dispersion (narrow / typical / wide). No separate size question: the type sets typical sizes, and exact sizes stay on the Speakers page. Dispersion only changes the critical-distance advice (docs/RULE_CATALOGUE.md P10). The plan below was the starting point.
**Default:** an optional fifth survey screen "Your speakers" that can be skipped ("I don't know yet"):
- Type: studio monitor / hi-fi / bookshelf / floorstander.
- Size: small / medium / large (cabinet size, bass reach).
- Porting: sealed / front port / rear port.
- Advanced, folded: dispersion narrow / typical / wide.
Same fields already exist in the Speakers step; the survey just fills them. Unknown = general best
spots (current behaviour).

**Dispersion without measurements (recommendation to the owner):** default to "typical" and say so.
Use it only for advice that does not change the score: reflection and toe-in wording, and the tone
note (section E). Map three generic categories to coarse directivity classes (an estimate, labelled
🟡), never to numbers on the heat map. Needs owner sign-off, formulas and citations before it
touches the score (see `MODEL_CREDIBILITY.md`). Without measurements, "general best spots" is the
honest answer; dispersion only refines wording.

### E. Tone advice (bass / treble / basic EQ) — DONE

As built: one new rule, D07, says what D02 (bass cut near walls) and D03/H06 (treble for a dead or live room) already said, for the many people who never tell the app about their tone controls: "if your speakers or amplifier have a bass/treble control…". Same conditions and sources, no new numbers. The result widget shows the most useful room idea and one tone hint. Not built: "small speakers in a big, busy room → treble lift". No source supports the small-speaker part; the busy-room part is H06 (a busy room is a dead room, and a dead room gets the treble-lift hint). The plan below was the starting point.
**Default:** advice sentences in the widget, never filter numbers presented as exact:
- Small speakers in a large or very reflective room → "may sound thin; a small bass lift or a
  subwoofer could help" (physics 🔴 for bass reach; the lift wording 🟠).
- Speakers close to a wall or corner → "bass boost; consider a bass cut / port plug" (boundary
  gain 🔴, existing rule family).
- Lively (hard-surface) room → "treble can sound bright; soft furnishings help" (reverberation
  physics 🔴; remedy 🟠).
- Dead room with small speakers → treble lift wording (existing H06).
- Listening far from the speakers (past critical distance) → "room sound dominates; closer helps"
  (existing P10).
Every item carries an evidence label and a source, reuses existing D/H rules where they exist, and
is marked 🟡/🟣 when subjective. No claim without a formula or a citation; mark anything unverified.
The owner's example (small speakers in a big, busy room → high-frequency lift) is not yet
verified: no source has been checked. Find and cite one before shipping it; otherwise drop it.

### F. Hungarian pass and visual references — DONE (checked by screenshots: desktop light and dark, Hungarian, phone; the type-scale and overflow tests cover every page in both languages)
Re-check all new HU strings for fit and tone; refresh the reference screenshots.

## 4. Order for the implementing session

1. A1 marker, A2 you-are-here, A3 whole-room heat map (one PR, visual).
2. B result widget + map picker (one PR; biggest UX change).
3. C listening area (engine: worst-case over area; UI: presets).
4. D survey speaker screen (UI only).
5. E tone advice (only items with verified sources).
6. F.

Each step: tests first for engine changes, i18n EN+HU, `npm test`, `check`, `lint`, `build`,
`check:size`, `test:e2e` before pushing.

## 5. Still open (defaults apply if the owner does not answer)

- Listening area shape and scoring (section C default).
- Speaker categories on the survey vs later in the sidebar (section D default).
- Tone advice scope and wording (section E default; verified sources are the gate).
- Earlier V4 items: face style (drawn), home list rows vs cards (rows), wording tone (friendly, short).

## V5.1: light by default, treatment on opt-in, a support link

Owner decision after the first review: panels and bass traps are a real investment (money, time, decisions) and cannot be tried instantly, so a random visitor should not be told to buy them.

- Every piece of advice now says what it takes (`effort`: free, cheap, invest). Moves, settings and tone hints are free; a rug or heavier curtains are cheap; panels, bass traps and thick absorbers are an investment (`docs/RULE_CATALOGUE.md`, T/D table).
- Investment advice appears only after the box "I'm ready to invest in acoustic treatment" is ticked (Settings, under "Your room"; `constraints.treatmentReady`, off by default). Off: the result widget, Improve the room, the print sheet and the map rings show only free or cheap ideas, and Improve the room adds one line saying bigger options exist, with a button to the box. On: they appear in the same order, tagged "Bigger investment". The engine still computes everything; only what is shown changes.
- The app never says what to buy: no products, shops, prices or affiliate links.
- `SUPPORT_URL` in `src/app/config.ts` (empty for now) turns on a plain "Support this project" link in the menu and the About dialog (a Buy Me a Coffee, Ko-fi or PayPal.me page). No embedded widget, so the app loads no third-party code.
