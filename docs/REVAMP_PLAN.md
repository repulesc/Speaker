# Revamp plan: from "form with a result" to "a workbench that shows and explains"

Status: owner decisions made after testing the deployed M3 app. This supersedes the old M4–M6 plan in ROADMAP.

## Why

The owner tested M3 and found: positions can only be guessed by dragging; distances and heights are buried at the bottom of the Speakers step; "Best we found" says nothing about *where*; there is no heatmap; "Cautions: 7" cannot be read; the Results step is bare; the look is dated; the furniture list is too small. All fair. The engine already computes seat and speaker score grids and the best five candidates, plus findings; **the UI shows none of it**. This revamp puts that on screen, explains it, and makes the advice trustworthy.

## Decisions (locked)

- **One workbench screen** instead of a six-step wizard. Setup (room, speaker) is quick; after that everything happens on one screen.
- **Look: "Instrument"** (dark, modern). Reference: `docs/design/instrument-workbench.mock.html` (a Design Component mock; open it as HTML or read its inline styles; it is the visual target, not code to ship).
- **Side view is hidden by default** (a dock button opens it).
- Add all of: treatment advisor, A/B listening log, speaker-specific settings advice, room-mode explorer, folk-rule comparison, bigger furniture list with free-form custom objects.
- Hungarian stays informal (tegezés). The owner reviews Hungarian text.
- The golden ratio is **not** a placement rule. The 38 % rule is 1 − 0.618, a folk heuristic; show it as an overlay and compare it with what the physics says for the user's room.

## Design tokens (from the Instrument mock)

| Token | Value |
|---|---|
| Page / panel / panel 2 | `#0b0f14` / `#0e141c`–`#121923` / `#182231` |
| Lines | `#1e2a3b`, `#243247`, `#2c3d57` |
| Text / muted | `#e8eef6` / `#8fa1b8` (min contrast 4.5:1 on panels) |
| Accent | `#6ea8ff` |
| Heat ramp (poorer → better) | `#440154` `#31688e` `#21908c` `#5dc863` `#fde725` (viridis; lightness-ordered, colour-blind safe) |
| Caution | `#f2b84b` |
| Type | Sora (UI), JetBrains Mono (numbers), self-hosted, Latin + Latin-Ext (Hungarian ő ű) |
| Shape | 8–14 px radii, 1 px borders, soft shadow only on floating cards |

Keep all accessibility rules from UI_SPEC (WCAG 2.2 AA, 44 px targets, severity never colour-only, shape+word evidence tags, reduced motion). Light theme may follow later.

## The workbench

1. **Top bar:** name, setup tabs (Current / Bed moved / + New), confidence meter, units and language, menu.
2. **Dock** (left, icons with labels, *sections not steps*): Room, Surfaces, Furniture, Speakers, Goals, Side view.
3. **Map** (centre): the room with the **heatmap on the floor**; layer chips: Overall, Bass evenness, Bass holes, Wall interference, Reflections, Stereo, My goals; legend; best-spot pins A, B, C; **dimension lines with typed values on the plan** (speaker to wall, spacing, seat to wall, room size). Click a number to type an exact value. Drag still works (snap 5 cm, mirror-lock).
4. **Probe:** hover or tap any point: why it is good or bad there (plain words, evidence tag) and the predicted bass shape.
5. **Bass chart** under the map (predicted *shape*, not loudness; mode markers; optional overlay of a chosen candidate).
6. **Right panel, three tabs:** **Why** (selected item's exact fields; findings in plain words with severity icon + evidence tag + "try this"; "Your setup: X → best: Y" with a one-click "try spot A"), **Treat** (treatment advisor), **Listen** (A/B listening log).
7. Phone: map on top, bottom sheet for the panel, layers as a horizontal scroller.

## New features

- **Layers:** one heatmap per concern (engine: C1 bass smoothness, C2 deep nulls, C3 wall interference, reflections, C4/C5 stereo and symmetry) plus "My goals" (weights from the goals). Each layer carries its evidence level and a one-line "what this means".
- **Probe / why:** a per-point breakdown (component values, which rules fired) rendered as text. Needs engine support: `explainPoint(project, point)`.
- **Findings with text:** every finding message key gets EN and HU copy (title, body, "why", "try this"), checked by the existing i18n key-parity test. Group and count cautions (replace "7 cautions" with the readable list).
- **Room-mode explorer:** slide a frequency (20–200 Hz): show the pressure pattern in the room (the modal sum at that frequency, speaker as source). Shows where a bass note is loud or silent.
- **Folk-rule comparison:** overlay 38 % and thirds on the heatmap with a plain note on what the physics says here. (Cardas stays out until its numbers are verified.)
- **Treatment advisor:** from first-reflection points (P06), corners and the T60 estimate: where an absorber or diffuser helps most, in rank order, with the predicted effect described honestly (direction and rough size, never a promise), respecting what the user can change. "If you can only do one thing…". Needs a documented rule set with sources; mark anything unverified.
- **A/B listening log:** guided experiments (change one thing by a stated amount, same three tracks, rate 1–5, symptoms from S01–S07, listening duration). Stores ratings per setup. **Closes the loop:** shows whether the app's ranking agrees with the user's ears over time, and says when it does not.
- **Speaker-specific settings advice:** from the speaker profile (port location, wall/desk placement setting, treble and bass trims, minimum wall distance): which setting to pick for the chosen position and why (extends G07, H06). Verified facts only; unverified manufacturer details are marked.
- **Furniture:** a much larger palette (add e.g. wardrobe, bookcase, piano, rack, plant, curtain/blind as object, rug as floor patch, fireplace, door, window seat, standing lamp, subwoofer-like box…) **plus a free-form custom object** (name, size, hard/soft/absorbent). Quick-mode busy-ness stays as a shortcut.
- **Compare setups:** A/B overlay of two setups' bass curves and scores.
- **Print / PDF:** a tape-measure sheet ("left speaker: rear 62 cm from the front wall, 1.00 m from the left wall, base 89 cm…").

## Foolproofing (the point of the product)

1. **Say where it is guessing.** Every number carries certainty; the map shows confidence; the model's limits (rigid rectangular room, point sources) are one tap away on a "How this works and what it cannot know" page, with the rule catalogue's sources.
2. **Robust, not knife-edge.** Rank by robust score (already built); show a "how fragile is this spot" indicator (sensitivity to ±5 cm and ±5 % room size); never present a single point as truth.
3. **Sanity guards.** If inputs are implausible, or a recommendation depends on an out-of-model feature, say so instead of drawing a confident map. Cap or grey the heatmap when confidence is low.
4. **Validate the model.** Independent reference (Python) stays; add cross-checks against published or well-known results (mode frequencies of textbook rooms; SBIR null positions; a rectangular-room modal response against an independent implementation such as REW's room simulator, recorded in `docs/verification/`). Add a regression suite of "known bad setups must be flagged".
5. **Never overstate.** Heuristics are shown as heuristics and never scored. "Guidance, not a guarantee" stays visible.
6. **Honest unknowns.** Unverified sources stay marked ⚠ until a human checks them; the app lists which rules rest on unverified references.

## Take away or shrink

The numbered wizard and the welcome card; the confidence meter as a top-bar widget (move into the map and panel); the always-visible side view; five goal radio groups (replace by two or three simple sliders such as "imaging ↔ envelopment" and "bass depth ↔ smoothness", still mapped to the same goal weights); the bare Results step; the "coming in the next update" copy.

## Work plan

| Phase | What | Model / effort |
|---|---|---|
| **R0** | **Full audit of the mechanics**: engine physics, scoring, search, robustness, workspace and persistence, import/share security, i18n, accessibility, tests. Output `docs/REVIEW_FINDINGS.md` (severity-ranked, with evidence) and fix everything critical and high. Resolve or re-mark the ⚠ sources that can be checked. **Done:** findings and the R1 proposals in `docs/REVIEW_FINDINGS.md`. | **Opus, xhigh** |
| R1 | Engine additions: layers, `explainPoint`, sensitivity, mode-field, treatment rules, speaker-settings rules, folk-rule comparison, finding copy keys; validation suite. **Done**, except the copy itself: the finding and advice keys and their parameters are fixed, the EN and HU text for them is R4. Also fixed the audit's M1, M2, M4, M6–M9, M11, L3, L10. | Opus, high |
| R2 | Workbench UI in the Instrument look: dock, map with heatmap and dimension lines, probe, chart, right panel, phone layout. **Done** (see "R2 status" below). | Sonnet, medium (Opus review) |
| R3 | Treat tab, room-mode explorer **(done, see "R3 status")**; Listen tab, compare, print sheet, larger furniture **(done, see "R3 status")** | Sonnet medium + Opus for the rules |
| R4 | EN + HU copy for every finding and rule; Hungarian review by the owner. **Drafted**; owner review open (`npm run hu:review`, steps below) | Sonnet draft, owner review |
| R5 | Physics audit of the whole product, bad-advice hunt, accessibility, performance, launch. **Done** (`docs/REVIEW_R5.md`); waits on the R4 Hungarian review before launch | Opus, xhigh |

Each phase ends with a deployed preview the owner can click, and updated tests (unit, browser, axe, validation).

## R2 status

Built: the Instrument look (Sora, JetBrains Mono, dark by default, quiet light variant), the one-screen workbench (dock, map, right panel; on phones the dock and panel form a bottom sheet under the map), and:

- **Map:** the seat heatmap under the plan (eight layers, each with its one-line meaning and evidence tag; stretched viridis ramp with a legend), hatched cells where the guidelines advise against sitting, best-spot pins A/B/C (a spot with the same seat as another is nudged aside), a preview of a chosen spot (the map, the ghost speakers and the bass chart switch to it, "Try spot A" applies it as one undo step).
- **Dimensions on the plan:** speaker to front wall, speaker to side wall, between the speakers, seat to front wall, room width and length. Click a number to type an exact value (same parser and limits as the forms).
- **Probe:** hover (mouse) or tap/click (pinned) shows the seat score, the most serious position-dependent finding or the weakest layer, and "Move my seat here". The bass chart overlays the probe's curve.
- **Bass chart:** the predicted shape at the seat, the judged range, axial room modes, overlays for the previewed spot and the probe.
- **Why panel:** "your setup vs best" with fragility, best spots, findings grouped by concern with severity icon + word and evidence tag in plain sentences (EN and HU for every finding key; values formatted in the user's units), notes behind a toggle, the rules of thumb compared with the map, and the confidence hint.
- **Side view** hidden until the dock button asks for it; the welcome card, the stepper and the Quick/Detailed choice are gone.

Not in R2 (R3): the Treat and Listen tabs, the room-mode explorer slider, compare setups, print sheet, the bigger furniture palette. The advice rules (T and D) have no text yet (R4); they are not shown.

**New Hungarian text to review** (owner): `finding.*` (about 65 sentences), `layer.*`, `evidence.*`, `severity.*`, `concern.*`, `dock.*`, `panel.*`, `map.*`, `why.*`, `probe.*`, `chart.*`, `words.*`, `folkRule.*`, `next.*`, and `crash.*` / `furnishing.busy.combined` from R0. Hungarian cannot say "the A spot" without the article problem, so spots read "Hely A".

## R3 status (items 1 to 3)

- **Treat tab** (panel tabs "Why" / "Treat"): the engine's treatment advice (T rules) and speaker-settings advice (D rules) as plain sentences in EN and HU, ordered by expected effect. The first is "If you can only do one thing". Each card carries an effect word and an evidence tag; advice with a place on the map is numbered, and the same numbers appear as rings on the plan while the tab is open. Sizes are rough guides, never promises.
- **Bass-note explorer** ("Bass note" chip in the layer bar): a 20 to 200 Hz slider paints the pressure pattern of one note at ear height (the modal Green's-function model, speakers as they are) in place of the score map, with jump buttons to the three lowest axial resonances and a sentence naming the resonances within 5 % of the note. Computed in the worker (`modeField`). 🔴 physics for the pattern; the model is a rigid-wall rectangular room with damping from the estimated T60, so real rooms differ in detail.

## R3 status (items 4 to 6)

- **Bigger furniture list:** wardrobe, bookcase, piano, equipment rack, large plant, fireplace, standing lamp and subwoofer join the palette, and the free-form "Other object" keeps its name and size. Every object now has a **material** (hard, soft, absorbent). When one is chosen, the absorption follows from the object's exposed surface (top and sides) times 0.0–0.05, 0.15–0.35 or 0.5–0.8 m² sabins per m² 🟡; without a choice the per-kind table applies. These per-kind and per-material numbers are rough estimates (🟡), not sourced measurements, and placed furniture still only raises the room's absorption estimate, never lowers it.
- **Listen tab:** a short protocol (one change, same three tracks, same volume, then rate), a note form (rating 1 to 5, symptoms S01 to S07, listening time, free text), the notes per setup with a "Try this" tip for each symptom (from the S rules in RULE_CATALOGUE), and an **agreement** line. The agreement compares every pair of rated setups: the one with the higher mean rating should also have the higher app score. Rating gaps under 0.5 and score gaps under 0.05 count as ties (0.05: below what a 5 cm or 5 % input error can change, see fragility). Only ratings given to the setup as it stands count: each note keeps a fingerprint of the positions and objects, and moving anything retires older ratings from the comparison (they stay in the list, marked). When ears and ranking disagree the text says to trust the ears and to re-check what was entered. Notes never change the calculation (🟣 subjective), and stay out of share links unless asked for.
- **Compare setups:** in the Why tab, pick another setup; its score is shown next to the current one (as words, with "about the same" under 0.05 apart; the same robust score as "Your setup") and its bass curve is drawn on the chart as a dashed line, each at its own seat. Leaving the Why tab ends the comparison.
- **Print sheet** (Menu, "Print sheet"): an A4 or Letter page with a sketch of the room from above and the tape-measure numbers (rear panel to front wall, centre to the nearest side wall, stand height, toe-in, seat and ear height, distances) for the current setup and for best spot A, plus the top treatment advice and the open problems.

Not built: guided experiments with stored experiment ids (the protocol is text only), the plan sketch of treatment spots on the print sheet.

**More Hungarian text to review** (owner): `tabs.*`, `treat.*`, `mode.*`, `advice.*` (19 keys), `words.gain` / `words.zone`; and for items 4 to 6: `listen.*`, `compare.*`, `print.*`, `furnishing.material.*`, the eight new `object.*` names and `menu.print`.

## R4: how to review the Hungarian (owner)

1. Open `src/i18n/hu.ts` on GitHub and press the pencil icon (or send corrections in a chat with Claude, quoting the old and the new text).
2. Change only the text between the quotes. Keep every `{name}` placeholder as it is: the app fills in a number or a word there.
3. When a block (for example `listen: {`) reads well, add a line `  // reviewed` directly above it.
4. `npm run hu:review` (and CI) shows how many blocks are left.

## After owner testing of R5: redesign and placement fixes

Owner feedback: the speaker placement the app computes was hidden; the heatmap had holes around furniture; best spots sat 1–1.2 m from the speakers; the interface was scattered over three sides and looked like "a CRT in a sci-fi film". Decisions and what was built:

- **Best placement first.** The sidebar opens on a "Best placement" card: where the speakers go (distance from the front wall to the back of the speaker, spacing) and where the seat goes (distance from the front wall and from the speakers), "Apply", and options A/B/C. Two choices sit on the card: what to place (both, speakers only for a fixed seat such as a bed or sofa, seat only) and the listening distance (room: 1.5 m or more; desk: close). The suggested speakers (dashed) and seat (A) are always drawn on the map.
- **Listening distance** (`constraints.listeningDistance`, 🟡): room listening keeps every best spot 1.5 m or more from both speakers; "desk" allows down to 0.6 m. A room too small for 1.5 m gets the best closer spot, and the card says so.
- **Rear ports** always keep their clearance in the search (default 0.2 m unless the manual says otherwise), so the app never suggests what its own G07 caution warns about.
- **Seat map without holes.** Every seat in front of the speakers is scored; blocked or occupied seats and red-flagged ones are dimmed (not hidden or hatched). Furniture is drawn see-through.
- **Layout.** One sidebar (left on wide screens, a bottom sheet on phones) holds everything you set and read: a settings menu at the top left (language, units, theme, projects, share, export, import, print, about), the best placement, then grouped lists for the room sections and the result pages (Why this result, Improve the room, Listening notes), each opening as its own page with "Back". The rest of the screen is the room, with one small toolbar (setups, map layer, bass note, side view). The top bar, the dock and the tabs are gone.
- **Look.** Light by default and dark with the system, the platform's own font (no web fonts), one type scale (12/13/15/17/22 px), one accent colour, segmented controls and grouped lists as in the platform settings apps. Every control is 44 px on touch screens; WCAG AA contrast in both themes (axe).

New Hungarian text to review: `settings.*`, `nav.*`, `suggest.*`, `map.dimmed`, `panel.label`, `panel.done`, `furnishing.title`.

### Speaker placement layer

The map layer menu has a ninth entry, "Where the speakers go": how well the speaker pair would score at each position, with the seat staying where it is (the engine's `speakerHeatmap`: the left speaker over the left half, the right one mirrored about the seat). Brighter is better. It shows the whole landscape behind the single answer on the Best placement card, so a user who cannot put the speakers at the suggested spot can see the next best places. New Hungarian text: `layer.speakers.*`.
