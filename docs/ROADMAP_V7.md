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
| 4 | A sofa as listening position hatches the sofa **and everything behind and beside it**. | `isObstructed` (`engine/rules/G10-objects.ts`) is a 2-D test: any object between speaker and seat blocks. A 0.85 m sofa is treated as a wall for sound travelling to ears at about 1.1 m, so every seat behind or beside it is "obstructed" and hatched. | engine bug |
| 5 | After filling in the speaker data and pressing Done, the speaker row was not ticked. | The progress marker (`app/state/progress.ts`) counts a section by its certainty flags, which typed values do not always change. Not reproduced yet. | needs a repro |

## The roadmap

### Phase 1: make the numbers trustworthy (engine; Opus)

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

### Phase 2: speaker choice that means something (Sonnet, small engine part checked by Opus)

- Replace the five illustrated cards with one **dropdown "What kind of speakers?"** and, below it,
  only details that change the result: size/height (monitor, bookshelf, tower), port (none, front,
  back), driver layout (two-way, coaxial, three-way), dispersion (existing choice). Categories map
  to the existing generic presets (`engine/presets/speakerTypes.ts`); more categories (small and
  large monitor, tower, floorstander with side port, studio monitor with front port) each need a
  typical size, a sourced or clearly marked estimate and a test. **No brand or model data from memory**
  (CLAUDE.md).
- Same dropdown in the survey screen.

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

## Decisions I need from the owner before Phase 1

1. Behind-the-seat setups: cap at "Poor" with a red flag (my recommendation), or refuse to score them?
2. Which score for the words: the cautious robust one everywhere (my recommendation) or the plain one?
3. Which speaker categories belong in the dropdown (my starting list is above)?
