# Design brief v4: from "good" to "designed"

Written after the owner tested the V3 pass (PR #6, merged). The owner is a visual designer and will share the site publicly, so visual quality is high priority. **Rule one is unchanged: do not change anything that works.** The engine, the numbers and the advice stay as they are, except where an item below says so.

## How to work (read this first)

The owner wants Opus to have real freedom, without surprises.

- **Fixed (do not change):** the engine and its numbers; "never confidently wrong" (no invented scores, estimates are labelled); the colours the owner likes (the yellow-to-purple heat ramp, the accent blue); English and Hungarian for every string; 44 px touch targets; WCAG AA; the product name only in `src/app/config.ts`.
- **Open to Opus:** layout, spacing, type, motion, the flow of the survey, how the heatmap is drawn, button and label wording.
- **Propose first, then build.** Before a big change, make 2 or 3 quick versions of that one screen and show screenshots (light, dark, phone). The owner picks, mixes or rejects. Do not redesign pages the owner has not mentioned; ask before changing anything outside this brief.
- **Stages, each ending with something to look at.** Stage 1: heatmap and home page. Stage 2: the survey. Stage 3: Surfaces, Speakers and the remaining pages in the style set by stages 1 and 2. After each stage, screenshots; the owner says "good", "change X" or "revert".
- **Safety net.** One branch per stage; `main` (the live site) changes only after the owner says yes.
- **Models.** Opus for design judgement (heatmap, home page, survey). Sonnet, medium, for routine work (Surfaces list, text, tests, Hungarian re-read). Options (screenshots) come before building, to save credits.
- The owner is new to coding: no code to read, plain explanations, a short running list of done / next / needs a decision.

## Owner's answers (4 October)

- **Audience:** both, simple first. Everyday listeners by default; a "show details" way in for enthusiasts.
- **Look:** calm, Apple-like. The heatmap is the one colourful thing. (The owner may send 3 to 5 reference images.)
- **First visit:** start the survey straight away (no example room, no intro screen). An "Example room" shortcut inside the survey is still welcome as a later idea.
- **Zone limit:** when the movement limit stops the best spot, the card shows what the limit costs ("Within 50 cm: Good. With more room: Very good.").

- **Heatmap default:** not decided; build all three options side by side first and let the owner choose by looking.
- **Survey length:** short, 4 screens (room size, what to work out, speaker type, where things are). Surfaces, busyness and the rest are refined later in the sidebar.
- **Movement zone:** one number ("How far can you move them?", about 50 cm), applied around each speaker.
- **Sharing:** "Share as image" first (room, map and recommendation as a clean picture); link preview later.

- **Menu structure:** Opus decides. Propose a structure with screenshots (keep the lists, or fewer groups such as Your room / Your speakers / Results); the owner approves or rejects.
- **Freedom:** Opus asks before restructuring. Polish within today's structure needs only a checkpoint. If Opus judges that a fuller redesign would be clearly better, it says so, shows why with screenshots, and the owner decides before any of it is built.
- **Layout (desktop):** Opus proposes. Mock up sidebar-left with the map on the right (as now) and floating cards over a full-screen map; the owner chooses.
- **Wording tone:** undecided. Show 2 or 3 example versions (for example the Best placement card and one survey screen in a friendly-and-short, a neutral-and-precise and a warm voice) and let the owner pick by reading.

- **Devices:** equal in principle, but the owner works on a Mac and the precise heatmap is a desktop tool: design desktop first, make the phone a clean, working version (not a gimmick). Keep the existing phone tests passing.
- **Theme:** follow the visitor's device, with a switch in the menu (as now).
- **Confidence:** quiet, one small word near the result; details open on tap.
- **Unknown values:** use a typical value, label it "typical", keep going; the confidence word reflects it.

- **Heatmap colour scale:** relative by default (colours stretch from this room's worst to its best, so the map is vivid and the best area glows), always with one honest word for the absolute level ("Best here: Fair"). An "absolute scale" switch for enthusiasts under "show details".
- **Default map when only the speakers move:** the speaker-placement map (how good each spot is for the speakers, the seat staying put), with the movement zone outlined. The seat map stays available as a layer.
- **Survey look (desktop):** a calm centered card, one question at a time ("2 of 4"), then a reveal: the room and heatmap fade in at the end. Not the "room builds as you answer" variant.
- **Typeface:** the system font, as now (San Francisco on a Mac). No web font.

- **Best placement answer:** one plain sentence first (what to change relative to the current setup), the exact numbers below in small type, the map shows the result. The sentence must be unambiguous ("Move each speaker 10 cm toward the front wall and 30 cm further apart", not "30 cm apart", which could mean the final spacing) and must come from the engine's real numbers, never be rounded into something untrue.
- **Map interaction:** hover shows a small tooltip (score and a one-line reason); click pins it. Keep the map itself clean.
- **Motion:** subtle and quick, about 150 to 250 ms: fades and slides, speakers glide when a placement is applied, the map crossfades when it updates. Respect "reduce motion".
- **Loading:** a small spinner next to the title (not skeletons). Keep the previous result visible meanwhile.

- **Apply:** show a before/after comparison on the map for a few seconds so the change is obvious. Undo stays one step away (it already works with the Undo button and Ctrl+Z); do not remove it.
- **Share and Export:** inside the settings menu, as the owner chose. Opus should note that this is harder to discover than a button on the map and may suggest a more visible entry point; the owner decides.
- **Drawing labels:** Opus decides. Propose in the options (few human labels such as "Front wall", "Left speaker", "You", versus constant technical dimensions); the owner chooses.
- **Legend:** a thin gradient bar with two words, "Poorer" to "Better", with the room's best level named; out of the way, bottom-left of the map.

- **Left panel home list:** undecided. Mock up both (rows with the value on the right, as now; and a grid of four icon cards with a one-word status) and let the owner choose by looking.
- **Moving between sections:** drill in with Back (as now): tap a row, the section slides in, Back returns.
- **Panel size:** the left panel can be hidden with a small toggle so the map fills the window (also good for screenshots and sharing).
- **Fun features:** the owner picked **guided listening tests** (short "play this track, try this move" experiments so people can check the advice by ear; builds on the existing Listen tab). The owner added that the main way to stand out is an excellent design; the fun features are a bonus.

## The owner's feedback, in order

1. **Settings icon:** replace the cog with the three-lines menu icon (friendlier, less industrial).
2. **Goal-first flow (most important).** Ask at the start what the user wants to work out: speaker placement only (the default, because most people have a fixed seat), seat only, or both. The whole site adapts: map, Best placement card, probe card. The engine already supports a fixed seat or fixed speakers, so this is mostly interface work. Speakers-only needs the seat position, so the survey asks where the user sits.
3. **Movement zone for the speakers (very important).** With a fixed seat, the recommendation must stay near where the speakers are now. Today the only limit is "how far into the room" (default 1.5 m from the front wall), which is how a middle-of-the-room suggestion happens. Add "How far can you move them?" centred on the current speaker positions, default about 50 cm. Separate freedom for spacing (closer or wider relative to the seat) and for distance to the front wall. The search only considers positions inside the zone. The card says what the limit costs (see the answers above) and says so honestly when nothing in the zone beats the current setup. The zone is drawn on the map as a soft outline, and the speaker-placement layer is limited to it (or dims outside it). The survey asks for it when "speakers only" is chosen.
4. **Probe card:** after clicking the room, only "Move my seat here" appears. With goal-first, the main action follows the goal ("Place speaker here" for speakers-only). It must be obvious, not a gimmick.
5. **Heatmap: keep it, whole room, much better looking.** The owner likes the colours (yellow to purple) and wants the exact-location detail of the full map. Problems seen in the screenshot: (a) a hard straight edge where the map starts in front of the speakers; (b) the "advised against" area darkened into a smudge; (c) faded colours, because dimming, a lifted ramp and transparency stack; (d) banded stripes with hard left and right ends; (e) still not smooth enough.
   - Cause of (a): `seatScorable` in `src/engine/scoring/search.ts` leaves out seats that are not ahead of both speakers, because the stereo checks mean nothing there. Keep that rule; change the drawing.
   - Plan: remove the dimming and the extra transparency; stretch the colours to each room's own worst-to-best range; mark "advised against" with a fine outline or light hatch; finer interpolation, drawn at full screen resolution, slight dithering against colour banding; a soft fade at the unscored front zone, labelled "not a listening position". **Bass layers can be drawn across the whole room**, including beside and behind the speakers: that is real room-mode physics and the bass-note explorer already covers the whole room. Do not invent stereo scores where none exist.
   - Start with 3 options shown side by side: glossy smooth gradient, soft zones, calm neutral room with a glowing sweet spot (plus the full heatmap on demand). The owner picks.
6. **Dispersion and accuracy.** Today dispersion only feeds P10 (critical distance); H05 toe-in gives no numbers (no measured data). Making dispersion matter means modelling how each speaker type spreads its sound, which would be a labelled estimate. Needs the owner's sign-off, formulas and citations first (project rule); do after stages 1 to 3.
7. **Survey (the first-run flow).** Looks industrial next to the sidebar home. Rebuild: one calm screen at a time, small buttons, one clear text hierarchy. Content: room size, room surfaces, how bare or busy the room is, speaker type, speaker height, what the user wants to work out (goal-first), and, for speakers-only, where they sit and how much room they have to move the speakers. Test Hungarian on a phone (longer text).
8. **Surfaces page.** The six-wall clicking (front, back, left, right, floor, ceiling) looks confused. Replace with a short list of drop-downs, most common options first or grouped, a sensible default, and a "same for all walls" option. Rare things (bookshelf, CD wall) go under "Add something on a wall". No icons needed; plain words.
9. **Overall:** one product, Apple-like, less confusing; consistent text hierarchy and spacing on every page (the shared component set from the V3 brief is still open); reference screenshots in the tests so the layout cannot drift.
10. **Sharing (the site will be public):** "Share as image" (room, map and recommendation as a clean picture), a good link preview, a calm empty state, subtle motion (map fades in, card slides). These come after the stages above.

## Status of earlier work

V3 first pass is merged (see the status section at the end of `docs/DESIGN_BRIEF_V3.md`). Still open from V3: the shared component set, the first-run guide (now item 7 here), reference screenshots, a Hungarian re-read on a phone.

## Constraints

- All tests keep passing; e2e selectors change only where a control moved.
- Bundle under 150 KB gzip (now about 115 KB).
- Every new rule or estimate needs a formula, a cited source, an evidence level and tests; mark anything unverified.

## Fun and personality (owner's answers, 4 October, late)

The owner is tired of archaic, scientific-looking, poorly designed sites and wants the experience to be likeable, not sweaty.

- **Faces:** a friendly face (a mood for the whole setup, for example a calm smile for "Good") on the **Best placement card** only. Not on the seat marker, not in tooltips. Opus shows both styles on the real card (custom-drawn minimal faces in the site's own style, and system emoji) and the owner chooses by looking. The mood must come from the real score, never be invented.
- **Tiny celebrations:** subtle moments of delight (the map glows when a great spot is found, speakers glide into place). No confetti, nothing kitsch. Respect "reduce motion".
- **Not now:** guess-first, room personality line, sound-taste quiz. Opus may still propose them in its open mandate.
- **Sound-based ideas** (hearing the room, finding the dead spot by ear, try-this-move-then-compare): the owner chose "none for now" in this round, after earlier choosing guided listening tests. Treat sound features as a later release and confirm with the owner before building the guided tests.

## Name

Working name: **Stanza** (the owner's favourite: sounds good, uncommon, not a feminine name). Keep it until something better comes up. Caveats to check before launch: Stanza is also the name of a Stanford natural-language Python library and, I believe, of an old e-reader app; check domains and trademarks. The name lives only in `src/app/config.ts`.

## Open mandate for Opus (the owner asked for this explicitly)

Beyond the list above, think out of the box about the whole site. Re-evaluate what is here, find what is missing, and propose.

- **Think about real users and real situations.** Most people have a fixed seat; many have limited room to move speakers; many will open the link from a friend. What would a first-time visitor try to do, and where would they get stuck? What is missing for them: for example a "why should I trust this" moment, a comparison with how they set up today, a way to remember the result and come back, or a printable "tape-measure" card (a first version exists in the print sheet).
- **Ideas that make the site stand out from similar tools.** Excellent design first. Then features that are fun and still honest. Subjective or psychological ideas are welcome only where they make sense, and must always be labelled as taste ("your preference"), never presented as physics. Candidates the owner has seen and not yet ruled in or out: sound-taste sliders (tight and punchy to warm and spacious), music-based tuning ("what do you mostly listen to?"), a shareable one-line "character of your room" generated from the real analysis. The owner's chosen direction is the guided listening tests.
- **Ask before restructuring.** Propose with screenshots or a short written case first. The owner decides before anything big is built. New features need the same rigour as rules: honest wording, evidence level, tests.

## Naming (decide with the owner; the name lives only in `src/app/config.ts`)

Wanted: simple, unique, symbolic, easy to say in any language, no cringe, no kitsch; obscure is fine. Ten options, none of them checked for domains, trademarks or existing sites (do that before choosing):

1. **Eigen**: German "own, proper"; the maths word behind a room's own tones (eigenmodes). Note: also the name of a well-known maths library.
2. **Aula**: Latin and Hungarian for a hall; short, calm, means "room". Common word in German and Hungarian.
3. **Tria**: from the triangle of the two speakers and the listener, the central shape of stereo.
4. **Locus**: Latin "place"; in maths, the set of points that meet a condition, which is what the map shows. Very common word.
5. **Stanza**: Italian "room", also a verse of a song. Used by some software.
6. **Sabine**: after Wallace Sabine, founder of architectural acoustics. Reads as a person's name; I believe an audio company uses it.
7. **Haas**: after Helmut Haas, the precedence effect behind stereo imaging. A well-known surname and brand.
8. **Axo**: from axial room modes, the strongest bass patterns. Short and open.
9. **Placet**: Latin "it pleases", and a nod to "placement". A real word (approval) in Hungarian.
10. **Fermata**: the held note or pause in music: sit still and listen. A standard musical term; may feel slightly precious.


## Status (stage 1, first pass)

Done on the branch, all checks green (340 unit, 61 browser tests):

- **Heatmap renderer** (`src/app/map/heat.ts`): colours stretched over the room's own range (2nd to 98th percentile, never narrower than 0.2 score points so near-equal seats stay soft), eleven-stop viridis, no dimming, no transparency, ordered dithering against banding, a 45 cm soft fade where seats stop being scored (labelled "Not a listening position" on the plan), "advised against" as a fine outline and light hatch instead of a dark smudge. Legend bottom-left of the map: ramp, "Best here: {word}" for the score layers, and an "Absolute scale" switch.
- **Three looks to choose from:** `gradient` (default), `zones`, `glow`. Switch with `?heat=zones` or `?heat=glow` in the address until the owner picks one; then the other two are removed.
- **Settings icon:** three lines instead of the cog.
- **Speaker zone:** "How far can the speakers move from where they are now?" 25 cm / 50 cm (default for new projects) / 1 m / Anywhere. The search keeps each speaker within that circle; the zone only applies once the user has placed the speakers (placeholders are not a place anyone is tied to). The Best placement card says what the zone costs when the score word differs ("Within 50 cm: Fair. With more room: Good."). The zone is drawn as a dashed circle around each speaker, clipped to the room. Tests: `tests/engine/zone.test.ts`, e2e for the choice.

**Owner's choices (5 October):** the **zones** look (the most visible); the other two were removed. The bass-note pattern keeps a continuous gradient, because it is a physical level, not a score. **Working name: Nodo** (Italian "node", the quiet points of a room's sound), set in `src/app/config.ts`; the copyright line in the README keeps the old wording until the owner decides.

Next: the goal-first survey (stage 2).

## Status (5 October, stages 2 and 3, first pass)

Done on the branch, all checks green:

- **Goal-first survey** (`Survey.svelte`): a centred card, four screens (room size; what to work out; speaker type; where things are now, with the movement zone for speakers only), "2 of 4" progress, Skip keeps the answers so far, then the room and the answer fade in. An empty ceiling becomes a typical 2.5 m (the analysis needs one) and the text says so.
- **Speakers only by default** for new projects (seat fixed). The map opens on "where the speakers go" when the seat is fixed, on the seat map otherwise. "Fixed" now only limits the suggestions: the seat and the speakers can always be dragged to where they really are.
- **Best placement** answers in one plain sentence relative to now ("Move the speakers 20 cm further from the front wall and 40 cm closer together."), the exact numbers below in small type; "Your setup is already about as good as it gets" when nothing worthwhile is left. A small spinner beside the title while it recalculates.
- **Apply**: the speakers and the seat glide to their new spots; the old spots are outlined ("Before") for a few seconds; a small floating message with **Undo**.
- **Map**: hover shows a small tooltip; click pins it. On the speaker map the tooltip says how good the speakers would be there, and a click offers "Move the speakers here". The option letter sits between the suggested speakers when the seat stays, so it never hides the seat.
- **Side panel** can be hidden (toolbar button, wide screens).
- **Surfaces**: three drop-downs (walls, floor, ceiling), most common first; "Each wall separately" and "Add something on a wall" are folded away.
- **Share as image** in the menu: room, map and answer as one picture (shared directly on phones).
- **Mood face** on the Best placement card, from the real score word, with a soft glow at Good or better.
- Home list rows now show the walls' finish and the speaker type.

### Still to choose (look at the screenshots, or add the switch to the address)

1. **Face style:** drawn (default) or emoji: `?face=emoji`.
2. **Home list:** rows (default) or four-up cards: `?home=cards`.
3. **Wording tone** — the site now uses A. Examples:
   - **A. Friendly and short:** "Move the speakers 20 cm further from the front wall and 40 cm closer together." Survey: "What do you want to work out?"
   - **B. Neutral and precise:** "Recommended: rear panels 50 cm from the front wall, 1.60 m apart (now 30 cm and 2.00 m)." Survey: "Choose what to optimise."
   - **C. Warm and conversational:** "Nearly there. Bring your speakers about 20 cm out from the wall and a little closer together, around 40 cm." Survey: "So, what are we figuring out today?"

### Not built yet

- **Desktop layout option** with floating cards over a full-screen map (the panel toggle gives a first taste). Worth a mock-up before building: it changes every page.
- **Bass layers across the whole room** (beside and behind the speakers): needs an engine change, physics-only layers.
- **Dispersion modelling** (needs the owner's sign-off, formulas and sources first).
- **Reference screenshots** in the e2e suite and the shared component set (from V3).
- **Guided listening tests** (later release, confirm first).
