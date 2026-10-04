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
