# Roadmap V7: trust first, then polish

Written after the owner tested the live site after V6 (PR 12). The owner found that the app says
contradictory things and sometimes calls nonsense "good". That hurts more than any visual flaw
(CLAUDE.md: never output confidently wrong acoustics), so **engine and consistency come first**,
the cards and visual polish second.

## What is wrong, and why (checked in the code)

| # | What the owner saw | Root cause | Kind |
|---|---|---|---|
| 1 | Speakers placed **behind the seat** are called "good". | Checked with a test: a setup with the speakers 1 m behind the listener scores **0.62, higher than the normal setup (0.55)**, with no red flag. The "listener must be in front of the speakers" rule (`isValidPlacement`, `engine/scoring/search.ts`) is only used when searching and mapping, never when scoring the current setup. The stereo-angle part is low (0.27) but the other components are generous. | engine bug, serious |
| 2 | Hover says "Speakers here: Good"; after Apply the same spot says "Now: Fair". | Three different numbers share one word scale: the speaker map shows the **nominal** score of one pair at the spot, "Now" and the suggestion A show the **robust** score (mean minus half the spread over 8 perturbed runs) and, with a sofa or bed, the area-weighted score. | consistency bug |
| 3 | The map is "scored everywhere", also in places no stereo pair can stand. | By earlier owner decision (a full-room map) every spot is coloured; spots that are not stereo setups show only the bass part, hatched. That is honest on paper but reads as "this is good here". | design problem |
| 4 | A sofa as listening position hatches the sofa **and everything behind and beside it**. | Checked in Phase 1: `isObstructed` already tests height (a 0.85 m sofa does not block a seat behind it, a wardrobe does). The hatching was the not-a-stereo spots of item 3. | not a bug; fixed with item 3 |
| 5 | After filling in the speaker data and pressing Done, the speaker row was not ticked. | Reproduced: the marker (`app/state/progress.ts`) only counted placing the speakers. Now the speaker data counts too: half a tick for one, a full tick for both. | fixed |

## The roadmap

### Phase 1: make the numbers trustworthy (engine; Opus) — DONE (docs/SCORING.md, "V7")

1. **Gate the setup.** A setup with the speakers not clearly in front of the listener is not a
   stereo setup: the score is capped at "Poor" and a red-flag finding says so in words ("The
   speakers are beside or behind you. This is not a stereo setup."). Applies to the current setup,
   suggestions, the map and the hover. Test: the behind-the-seat case above scores Poor with a red flag.
2. **One score, one meaning.** Everything shown with a word (Now, A, hover on the map, probe) uses
   the same score. Decide with the owner: the robust one (cautious) for all, and the speaker-map hover
   becomes "if you put them here: Good", scored the way Apply would score it. Test: hover value at the
   suggested spot equals the score after Apply.
3. **Line of sight with height.** An object blocks only if its top is above the sound path at that
   point (speaker axis height to ear height). A sofa or bed no longer blocks seats behind it; a
   wardrobe still does. Test: seat behind a 0.85 m sofa is not obstructed; behind a 1.8 m wardrobe it is.
4. **Not-a-stereo-spot is not "good".** On the speaker map, spots where no stereo pair can stand
   (beside, behind, too close) get a clear, different look: neutral grey with the hatch and the
   words "not a stereo spot", not a colour on the good-to-poor scale. The map still covers the room
   (owner decision), but only real candidates are coloured by score.
5. Reproduce and fix the speaker-progress marker (item 5).

### Phase 2: speaker choice that means something (Sonnet; Opus checks the numbers once)

**Owner decisions (round 2):** speakers behind the seat are simply kept at "Poor" (capped, with the
warning); every word on screen uses the cautious score. The speaker choice is several dropdowns,
not picture cards, with the questions the owner listed (kind, size, number of drivers, hi-fi or
monitor, dispersion) plus what the engine really needs.

**What the engine really uses** (checked in `src/engine`): the cabinet size (it must fit and not hit
walls), the tweeter height (the ear-height rule G08, the vertical angle), the woofer height (the
front-wall dip and the floor bounce), how low the bass goes (`f6`) and whether the box is sealed or
ported (the bass model P09), where the port is and how far from the wall it needs to be (G07),
coaxial or not (G08 allows a wider vertical angle), whether the speaker is made for corners (G06),
and the dispersion (only the listening-distance advice). Nothing else changes the result, so
nothing else is asked.

**The dropdowns** (all optional, all start at "Not sure", which keeps today's generic default):

| Question | Choices | What it sets (all marked as estimates) |
|---|---|---|
| Kind | Bookshelf / standmount · Floorstander (tower) · Studio monitor (desktop or on a stand) · Compact desktop · Wall or in-wall · Other | cabinet height and depth class, where the tweeter sits (on a stand, on the floor, on a desk) |
| Size | Small · Medium · Large (a hint with typical height, e.g. "about 30 cm") | cabinet width, height, depth, and how low the bass goes (`f6`) |
| Drivers | 2-way · 3-way · Coaxial (one driver in the middle) · Don't know | tweeter and woofer heights; coaxial allows the wider vertical angle |
| Bass port | None (sealed) · Front · Back · Bottom · Side | sealed or ported, rear clearance rule |
| Made for | Hi-fi listening · Studio monitoring | only the default distance and wording: monitors are made for close listening (a desk or a stand), hi-fi for the room. It is a starting suggestion for "Where you listen", never a change to the physics, because there is no source that says a monitor sounds different in a room |
| Spread of sound | Narrow · Typical · Wide | unchanged: advice only |
| Placed on | Floor · Stand · Desk or shelf | base height (it matters for the tweeter height and the floor bounce) |

Rules: every choice maps to typical values (`engine/presets/speakerTypes.ts`), each value is an
estimate marked as such, there is a test per mapping, and **no brand or model data from memory**
(CLAUDE.md). The exact numbers stay editable under "More details" for the person who has the
manual. The same dropdowns appear on the survey's speaker screen, in fewer steps (Kind, Size, Port).
A guard: combinations that cannot exist (a "small floorstander" with 2 cm depth) are not offered.

### Phase 3: one visual system (Sonnet; Opus reviews the result once)

1. **Cards.** Result, Why and Tips all use one card component: same padding, radius, one title style,
   one body style, one caption style. Result becomes a short stack: verdict card, placement card
   (numbers plus Apply), tips card. Functions (Apply, A/B/C, "find the best place for") sit in their own
   quiet row, apart from the text. Why: findings as the same cards, subtitles ("Bass", "Stereo image",
   "Rules of thumb") become one consistent small heading.
2. **No duplicate tips.** The Result tab shows at most one tip with "More in Tips"; Tips holds the list.
3. **Map markers.** Speakers get a dark graphite fill with a white ring so they read on yellow and on
   purple (owner suggested an inverse colour; a fixed dark-with-white-ring works on every colour of the
   scale and in the share image). The recommended spot keeps its blue edge. Labels ("Now", "Best", the
   letter on the pin) get one style: same size, same halo, no white outline on small text.
4. **Dark mode.** The undo/redo buttons and any other low-contrast control get a contrast check
   (axe plus a screenshot per control) in dark mode.
5. **Seat map near the speakers.** Seats beside or in front of the speaker line are not valid seats: show
   them as one calm "not a seat" area instead of stripes of wrong colours.

### Phase 4: check (Opus, once)

A full review pass on the finished branch: the engine tests, the new wording, and a walk through the
cases the owner tried (speakers behind, sofa behind-beside, hover versus Now). Screenshots in light,
dark, Hungarian and phone.

## Which model, for the best result and the least credit

| Work | Model | Why |
|---|---|---|
| Phase 1 (gate, one score, line of sight) | **Opus** | Acoustic correctness is the project's central rule; a wrong gate or a wrong score meaning is expensive to find later. Small, well-defined, test-first, so it is also cheap. |
| Phase 2 dropdown and categories | **Sonnet**, then a short Opus look at the new engine presets | Mostly UI and data entry; the only risk is an invented speaker size, which one review catches. |
| Phase 3 cards and visual polish | **Sonnet** | Large amount of CSS and component work with screenshots and e2e tests to catch mistakes; no acoustic judgement. Most of the credit goes here, so it should not run on Opus. |
| Phase 4 review | **Opus**, one pass | A single review is cheaper than Opus doing everything, and it catches what Sonnet misses. |

Summary: **Opus for Phase 1 and the final review, Sonnet for everything else.** Do Phase 1 first and
merge it on its own, so the app stops saying wrong things even if the polish takes longer.

## Decisions made

1. Behind-the-seat setups are kept at "Poor" (capped, with a warning). Decided.
2. Every word uses the cautious (robust) score. Decided.
3. The speaker dropdowns are in Phase 2 above. Decided by the owner: several dropdowns, no picture cards.

## Owner decisions, rounds 2 and 3 (feel, trust, learning)

- **Feel:** calm and Apple-clean, with warmth. Not playful, not studio-pro. The owner trusts the design
  taste and gives a **free hand on the left panel**: make it better, much better. Soft cards on a warm
  background are liked; a better idea is welcome.
- **Not an engineer's tool:** the user should feel like a speaker enthusiast having a good moment.
  Everyday words everywhere, with a **"Show the numbers" switch** in the menu that turns on the
  technical version of everything (Why tab, tips, layers, units).
- **Trust is not a widget.** No confidence meter on screen, no sources panel as a feature. Trust comes
  from quality in every aspect: correct advice, consistent numbers, careful words, a design where nothing
  is out of balance. (The rules, sources and evidence levels still exist in the code and the docs.)
- **Delight is intelligence, not charm.** No superficial fun. The fun is learning something and a good
  feeling about it, even when the best position is not possible in this room.
- **A "Live with it" card after Apply.** Calm card on the Result tab: give it a few evenings; short
  impressions can mislead and longer listening tells more. Three optional one-tap faces, per setup:
  how do you like this position; how did you like the one you tried before; how do you like your
  speakers overall (plus an optional note). Stored on the device only (extends `ListeningNote.rating`).
  Later a gentle, honest sentence compares your impressions with the app's score, never as a verdict.
  Listening notes stay in the menu.
- **Wise tips: very selective and contextual** (owner trusts Opus to choose): not two or three
  commonplace tips for everyone, but tips that appear for a specific speaker type, room, or scenario
  (for example a sealed bookshelf speaker near a wall, a desk setup, a bed, a lively room with small
  speakers). Each tip is a rule with a condition, a plain sentence, an evidence level, a source or an
  honest "by ear" label, and a test (CLAUDE.md). No invented citations. Room facts are welcome when
  computed, for example the room's lowest bass note named as a musical note.
- **Heat map colours:** a warm, calm scale (soft sand for poor to deep green or amber for best), still
  colour-blind safe, with clear steps and a dark-mode version. Replaces viridis.
- **First run:** keep the survey and the fade into the room; add one friendly "what we found" line that
  names the room's character, computed from the room.
- **Cards:** soft cards on a warm background, one idea per card, a big calm title, one clear button per
  card; functions and buttons apart from text. Opus may propose something better.
- **Devices:** desktop first; the phone keeps its bottom sheet and must keep working (44 px targets, no
  sideways scroll).
- **Process:** one Opus session. Phase 1 (engine) first and merged on its own; then the design system
  and the new moments, with screenshots shown to the owner before the pull request.
