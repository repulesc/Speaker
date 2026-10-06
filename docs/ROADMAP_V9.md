# Roadmap V9: focused, honest, disciplined

Written after the owner's review of the live V8 site ("progress, but still an unpolished developer
beta"). The owner asked for professional judgement as lead UI architect and acoustic consultant:
cut what does not inform a credible result, unify the controls, give NODO a disciplined identity,
and be radically transparent about what a geometric model can know. V8 stays reachable, frozen, at
`/legacy/v8/` (V7 at `/legacy/v7/`, both listed at `/legacy/`).

## 1. Decisions, point by point

| Owner's point | Finding | V9 |
|---|---|---|
| Archive V8 first. | — | **Done.** `/legacy/` lists V8 and V7, each with its own storage keys. |
| Weak logo; "Saved on this device" next to it; the room name 3× larger than the brand. | A sprig icon and a serif word; the save badge competes; the name is 26 px serif. | A geometric **NODO wordmark** drawn on a 4-unit grid (bars, circles, a half circle; the last O carries a dot: the *node*, the listening point), deep muted green. Saving is silent; only a failure is shown. The room name drops to the body title size (17 px, semibold). §3. |
| Typography looks better, but the whole should be Bauhaus-coherent. | A serif display face beside a geometric mark reads as two brands. | Display face **Jost** (OFL, a Futura revival: the New Typography of the Bauhaus years), self-hosted; Newsreader goes. Body stays the system face. |
| Map caption left, toggle crammed top right. | Two separate absolutely placed blocks. | One centred header above the room: the Speakers · Seat switch, then the caption, both on the room's axis. |
| "Show numbers" in Hungarian breaks the sidebar padding. | **Confirmed:** a long Hungarian word in the numbers line ("leggyengébb") sets the result card's minimum width; the grid item had `min-width: auto` and grew 15 px past the panel edge. | Every panel grid track is `minmax(0, 1fr)` and children `min-width: 0`; long words break (`overflow-wrap: anywhere`) inside numbers lines. An e2e check measures it in both languages with numbers on. |
| Messy grab-bag of inputs; nested accordions. | Selects, segments, cards, radios with three levels, a fold inside a fold. | **One rule for controls** (§2). At most one fold per group, never nested. |
| "Settings" is too generic. | — | **01 Room & speakers · 02 Placement · 03 Listening check** (HU: Szoba és hangfalak · Elhelyezés · Fülpróba). |
| Musical note names for room modes are nonsensical. | "Close to a very low A♯": correct, but an odd unit for this audience. | Hertz everywhere: "Its lowest resonance is at 30 Hz." |
| Kill the "Sims-like" furniture unless it is physically modelled. | **Audit:** furniture *is* in the model, weakly: it can raise the absorption estimate (only above the "how full" estimate, never below it), it blocks speaker spots, and an object between speaker and ear is flagged (G10). The first is already carried by "How full is the room?"; the others are things people see for themselves. Not worth an editor. | **Removed**: the furniture editor, objects on the map, G10, object collision in the search, wall patches (shelves, windows, curtains: the same category) and the per-wall materials. Kept: *how full* (absorption) and walls · floor · ceiling materials (reverberation). Old projects are cleaned on load. |
| Remove notes. | The V8 note field and the V7 notes store. | **Removed**, with the overall 1–5 rating (it informed nothing). What you tried and how it sounded stays: it drives "put it back". |
| Desk realism. | Speakers on a desk get a strong early reflection from the desk top, which the map does not model. | New rule **G12 · desk reflection** (🔴 geometry, image source): the delay and the first dip frequency, with the two moves that change it (§4). The map's limits say plainly that it ignores the desk. |
| Heatmap transparency. | — | One quiet line under the map, and a short "What the model knows" section in About (§4). |
| Compact listening check; solutions next to the complaint, not 30 steps below. | Six big button rows, then a list. | A **matrix**: one row per aspect with a compact segmented scale; choosing a complaint opens its two best fixes **directly under that row**. Free moves first, then the speaker's own controls (only "if yours has one"), then the room. §5. |
| Support link buried. | In the menu, between projects. | A permanent, quiet **Support NODO** link in the corner of the map (desktop) or at the foot of the panel (phone). |
| Projects and export are overkill. | Project list, duplicate, delete, JSON export and import, speaker files. | One room, autosaved. The menu keeps **Share link**, **Save as image**, **Print tape-measure sheet** and **Start over**. Removed: the project list, duplicate, JSON export/import, the speaker file, brand and model. |

## 2. One rule for controls

| Input | Control | Example |
|---|---|---|
| A measured length | Number field with unit | Width, distance to the wall |
| 2–4 short, exclusive choices | Segmented control | How full, where you listen, what moves |
| 5+ choices or long labels | Select, as a row (label left, value right) | Speaker kind, wall material |
| On / off | Checkbox | "I measured these" |
| Several independent preferences | Toggle chips | What matters to you |
| Results | Cards (output only, never input) | Best placement |

Each group is a titled section on the page. Optional detail goes in one fold per group, titled with
what it holds. No help text unless a choice is genuinely ambiguous.

**01 Room & speakers**, three groups:

1. *Room*: width · length · height (one row), I measured these; walls, floor, ceiling (select
   rows); how full (segments); open to another room or not a plain box (checkbox: the model assumes
   a closed box).
2. *Speakers*: kind, size, bass port, they stand on (select rows). Fold *From the manual*: drivers,
   exact width · height · depth, lowest note (Hz), the controls it has.
3. *Listening position*: chair · sofa · desk · bed; where things stand now (speakers to the wall,
   speakers apart, toe-in, seat to the wall, ear height, speaker base height) in a compact grid;
   how far the speakers may move; what matters to you (chips).

Removed as inputs that do not change a credible outcome: brand, model, made for, spread, box type
(the port says it), per-dimension certainty, construction (derived from the wall material),
temperature (20 °C; ±5 °C moves the modes by under 1 %), the seat range and the reach limit (the
Placement step's "find the best place for" and the speaker zone say it).

## 3. Identity

- **Wordmark:** NODO built from bars and circles on one stroke width; the final O with a centre
  dot. Deep muted green (`#24503f`, dark mode `#9fd6bd`). Also the app icon.
- **Type:** Jost for the wordmark's companions (verdict, section titles, figures on the drawing);
  the system face for everything else. Three sizes in the panel (13, 15, 22) plus the verdict (26).
- **Header:** ☰ · NODO · undo/redo. Below: the room name (17 px, click to rename) and its size.

## 4. Credibility

- **G12 · desk reflection** (when you listen at a desk). Image source in the desk plane: extra path
  Δ = √(d² + (hₛ + hₑ)²) − √(d² + (hₑ − hₛ)²), with d the horizontal distance from the speaker to
  your ears and hₛ, hₑ the tweeter and ear heights above the desk top; delay Δ/c; first dip at
  c / (2Δ). 🔴 geometry ([KUT]: image sources). How deep the dip is depends on the speaker's
  downward dispersion, which we do not know: said so. Moves: closer to the desk's front edge (the
  reflection point leaves the desk) and higher, aimed at the ears. Both 🟡, by ear.
- **What the model knows** (under the map): "A physics model of an empty box with the surfaces
  you gave. It cannot see your speakers' dispersion, your furniture or your desk, and it is not a
  measurement. Use it to start; finish by ear."

## 5. Listening check

Rows: Bass (thin · ✓ · boomy), Bass notes (even · uneven), Voices (focused · vague · ◂ · ▸), Width
(narrow · ✓ · hole), Treble (dull · ✓ · harsh), Clarity (clear · some echo · echoey). A complaint
opens up to two fixes inline: the move, why, how sure, "Try it" (moves the speakers or seat on the
map and remembers where they were), then "Better · Same · Worse" and "Put it back". Ideas for the
room (rugs, curtains; panels only if you are ready to invest) close the page.

## 6. Order of work

0. Legacy archive — **done**.
1. This plan.
2. Prune: furniture, patches, per-wall, notes, rating, projects and export, speaker file, cut
   inputs; data cleaned on load; engine rules and tests.
3. Room & speakers page on the control rule; tab names.
4. Identity: wordmark, Jost, header, map header, panel robustness, support link.
5. Credibility: Hertz, G12, model note.
6. Listening matrix with inline fixes.
7. Tests, docs (catalogue, data model), every gate, screenshots.
