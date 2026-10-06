# Roadmap V8: a refined, coherent product

Written after the owner's review of the live V7 site. The site works and the numbers are trusted;
what is missing is **a visual identity, a structure that explains itself, a set-up that does not
take five minutes, and a way to judge the sound by ear and act on it**. The owner gave a free hand
("the best possible result"). V7 stays reachable, frozen, at `/legacy/` (`public/legacy/README.md`).

## 1. The owner's critique, and what V8 does about each point

| What the owner said | Why it happens | V8 |
|---|---|---|
| "Okay to look at, but no visual identity. One of millions of websites." | System font, generic iOS blue, rounded boxes everywhere; nothing is specific to rooms and sound. | An identity built from what the app *is*: **an architect's drawing of your listening room**. A refined serif for titles, ink-on-paper colours, the room drawn like a plan (walls as a solid band, dimension ticks, a scale bar, a title block), one accent: the deep green of the heat map the owner likes. §3. |
| "Busy, like an old Android app: detailed descriptions everywhere." | Every control has a heading, a help line and a box. | Fewer boxes, typographic hierarchy instead of frames, help text only where a choice is unclear. One left edge, one spacing scale (4/8). |
| Undo and redo "really big and really bad". | Text glyphs at title size in 44 px boxes. | Small drawn icons, quiet until hovered, in the header next to the name. |
| The legend at the bottom is "on the left, should be aligned with the room". | It is pinned to the map's corner. | The legend sits directly under the room drawing, as wide as the room, as part of the drawing. |
| "Your Room" is misleading; can't rename; the pencil opens settings. | The button says "Your room" and shows a pencil, but opens every setting. | The project name is edited where it is shown (click the name in the header). The set-up is its own step, named for what it is. |
| The settings page: "lots of fields, different-sized text, five minutes, no idea what it does". Speakers under "room" is "a design bug". | Every input asks how sure you are; construction, openings, temperature, patches, furniture and speaker data are all on one page. | **Set up** asks only what changes the answer (room size, how full it is, the kind of speakers, where you sit, what can move), on one short page. Everything else is folded under "More detail", in plain groups. Speakers are their own group. §2. |
| "Result · Why · Tips: why what? Not obvious." | Tabs named after content types, not after what the user is doing. | Three **steps** named after what you do: **1 Set up · 2 Place · 3 Listen**. The reasons live inside Place, the tips inside Listen. |
| Several setups ("Current / + New setup") "make no sense when we are finding one best spot". | Kept from the comparison feature. | Removed from the screen. The data model keeps them (old projects still open); the UI shows one setup. |
| Hiding the side panel "does not make the room bigger, no function". | The map keeps its size. | The button goes. |
| The settings menu: "text slipping off the fields". | Long labels in fixed segments; clipped list rows. | A redrawn menu: rows, no clipped segments, labels that wrap. |
| "I can only dislike, stay neutral or like, and I hid it and can't get it back." Liking positions makes little sense with Undo. | The Live with it card rates positions, and Hide has no way back. | **Listen** is a step, always there. It asks how the sound *is* (§4), never "do you like this position". |
| "How do we rate sound stage, clean sound, imaging?" "A quiz… advice to do better, by placing, without buying." "Realistic like a sound engineer guessing by ear." | — | **The listening check** (§4): six aspects on two-sided scales (thin ↔ boomy…), then one change at a time to try, from rules with sources and honest confidence, each with Try / Keep / Undo. |
| "Most speakers require tuning… I have speakers that do not." "Millions of speakers; the site can't know them all." | — | Tuning advice only appears as "if your speakers have a … control", or when the user said they have one. The check never claims to know the speaker; it says what usually helps and lets the ears decide. |
| "Maybe AI, in a very minor part. Is it even possible?" | — | §5: not in V8. Possible only through a server or the user's own API key, which breaks "nothing leaves your device". The listening check does the job deterministically and can be tested. |
| "Keep the old site in a legacy folder; do not overwrite it." | — | Done first: `/legacy/` (V7, frozen, own storage keys). |

## 2. Structure

The left panel is a three-step guide. Each step is always reachable; nothing is locked.

1. **Set up** — the room, the speakers, where you sit. One page, three short groups:
   - *The room*: name, width, length, ceiling (one row), "I measured these" (one switch instead of a
     certainty choice per number), how full the room is. More detail: walls and floor, construction
     and openings, furniture, temperature.
   - *Your speakers*: kind, size, bass port. More detail: drivers, made for, spread, what they stand
     on, exact sizes, controls, brand and model, speaker file, where they stand now.
   - *Where you listen*: chair, sofa, desk or bed. More detail: what can move and how far, goals,
     ready to invest in treatment.
2. **Place** — the answer: one sentence (in the serif), what to change, Apply, options A · B · C,
   "find the best place for" speakers / seat / both, and *why* as the two or three reasons that
   matter, each with "show on the map". The bass chart and the per-reason maps fold under "The
   details".
3. **Listen** — the listening check, the changes it suggests, and what you tried (§4).

The map stays on the right with only what belongs to the map: Speakers | Seat, and the legend
under the drawing.

## 3. Identity

- **Concept:** a calm architectural drawing of your room, on paper, with your speakers in it.
  Refined, quiet, public-facing; the product is the drawing and one clear sentence.
- **Type:** *Newsreader* (Production Type, OFL, self-hosted, latin and latin-ext for Hungarian) for
  the logo, step titles, the verdict and the numbers on the drawing; the system UI font for
  everything else. No third-party font request (local-first).
- **Colour:** paper (`#f5f2ea`), ink (`#1d221f`), hairlines from the ink; one accent, *listening
  green* (`#2b6b55`), which is also the "best" end of the heat scale, so the map and the interface
  speak one colour. Clay (`#a5532e`) only for warnings. Dark: charcoal paper, light ink, a lighter
  green.
- **Drawing:** walls as a solid band; dimension lines with architectural ticks and figures in the
  serif; a scale bar and a small title block (room name, size, step) on the drawing; speakers as
  dark cabinets with a light rim; labels as small chips.
- **Rhythm:** one left edge, spacing 4/8/12/16/24/32, three text sizes in the panel plus the serif
  title. Boxes only where a group must hold together (the recommendation, the check).

## 4. The listening check

Play a piece you know well, from your seat, for a minute or two. Then answer what you hear, each
on a two-sided scale with "just right" in the middle (or "not sure"):

| Aspect | Scale |
|---|---|
| Bass amount | thin · just right · boomy |
| Bass evenness | even · some notes boom or vanish |
| Centre (voices in the middle) | vague · focused · pulled to one side |
| Width | narrow · just right · too wide, hole in the middle |
| Treble | dull · just right · bright or harsh |
| Clarity | clear · a little echo · echoey |
| Overall, against what you expect from these speakers | five faces |

The engine (`src/engine/listening/`, pure, one file per rule) turns the answers and the setup into
**changes to try**, most likely to help first, at most three at a time. Each has: one action in
plain words; a concrete amount where the app knows the geometry (move out 15 cm, toe in 5°); why;
how sure, as a sound engineer would say it (*physics*: usually works; *guideline*: often works;
*by ear*: sometimes works, trust your ears); and a source or an honest "by ear". Moves are applied
with one tap and are undoable. After trying: better / same / worse; worse offers Undo. The checks
and tries are kept with the project, on the device.

Examples (all from existing rules and sources): boomy and close to the front wall → move out
(boundary gain, [ALL74]); boomy and the seat near the back wall → sit forward (G02); notes boom or
vanish → move the seat 10–20 cm (room modes, P03); thin and far from the wall → move closer;
vague centre → check equal distances (G05), then more toe-in (by ear, [TOOLE]); pulled to one side
→ unequal distances, else the swap test (S07); narrow → wider apart or sit closer (stereo angle,
[ITU775]); too wide → closer together or sit further back; bright → less toe-in, a rug, treble down
if you have the control; dull → more toe-in, tweeters at ear height (G08); echoey → sit closer
(critical distance, P10), soft things on hard surfaces.

What it never does: name products, promise results, or pretend to know the speaker.

## 5. AI

Not in V8. A language model needs either a server (no backend is a locked decision) or the user's
own API key (sends room data off the device, and is a burden for most users). The listening check
covers what an assistant would do here, deterministically, testably and honestly. If a later
version wants it, the only acceptable form is opt-in, bring-your-own-key, clearly labelled, and
never deciding the numbers.

## 6. Order of work

0. Freeze V7 at `/legacy/` — **done**.
1. Identity and shell: tokens, Newsreader, header (name, small undo/redo), menu, map toolbar without
   setups and panel toggle, legend under the room, drawing style.
2. The three steps and the new Set up page.
3. The listening check: engine rules with tests, the Listen step, try / keep / undo.
4. Review: every gate, screenshots (desktop light and dark, Hungarian, phone) before the PR.
