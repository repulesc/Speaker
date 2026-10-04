# Design brief v3: from "functional" to "finished"

Written after the owner tested the redesign (PR #5). **Rule one: do not change anything that works.** The engine, the numbers, the advice and the tests stay as they are; this is visual and interaction work. `docs/design/before-v3/` holds screenshots of every sidebar page today (dark and light, desktop) so the work starts from what the owner sees.

## The owner's feedback, in order

1. **Goals (dark mode): the selection is invisible.** The chosen option and the others look the same.
2. **The bass chart at the bottom is too big.** Nobody studies it for long; it takes space from the room. Move it into the sidebar or make it tiny.
3. **The heatmap looks pixelated and cheap** ("a bad radar image from the 90s"). It must look like a good heatmap.
4. **"How sure are we" popover is broken:** it opens to the left, off the screen, unreadable.
5. **The Speakers page is a wall of fields.** Wanted: like Apple's "configure your MacBook" pages, with big clear choices, not a form.
6. **Every sub-page needs the same polish.** Goals, "Improve the room" and the others: titles too close, too many text sizes in a narrow column, text feels "metric" (dry), spacing tight.
7. **The Best placement card has too many things:** a huge title, five buttons in two rows (Both / Speakers / Seat; Room / Desk), and six text sizes. Looks like a military screen.
9. **Make it feel like one product, Apple-like, less confusing.** Some people would skip the site and just drag the speakers because it looks complicated.
11. **The room drawing is clean but amateur** ("first sketch in Illustrator"). No need for furniture shapes; wants a better overall drawing, together with the heatmap.
13. Keeps: the colours, and the Best placement logic ("makes a lot of sense when I play with it"). Wants the text hierarchy cleaner.

(Items 8, 10, 12, 14 were empty in the message.)

## What causes what (found in the code and screenshots)

| Feedback | Cause |
|---|---|
| 1 | The segmented control's "selected" thumb uses `--surface`, which in dark mode is almost the same grey as the track (`--fill`). Selection is only a font-weight change. |
| 4 | The confidence meter lives in the left sidebar but its popover is anchored `right: 0` to a trigger at the far left, so it extends past the screen edge. `Dropdown.svelte` has `start`/`end` but no collision handling. |
| 3 | The seat map is computed on a 10 cm grid (15 cm / 20 cm for bigger rooms) and drawn one pixel per cell, then scaled by the browser. 36 × 44 cells for a 3.6 × 4.4 m room. Smoothing is only the browser's default. |
| 5, 6, 7 | Each page was restyled separately with its own sizes. Text sizes are not enforced: titles, intros, labels, hints, values and buttons all differ. |
| 2 | The chart is a full-width panel under the map (150 px high) in `App.svelte`. |
| 11 | Dimension "pills" everywhere, thin default strokes, plain rectangles for speakers and furniture, a hard black dashed seat. |

## Suggestions beyond the owner's list

1. **Build a small component set first, then move every page onto it.** Today each page styles itself, which is why polish keeps being uneven. Needed: `Page` (title + one-line intro), `Group` (title + rounded list), `Row`, `Field` (label above, hint below, error), `Choice` (big selectable card with title and subtitle, radio semantics, a clear check mark), `Segmented`, `Disclosure` ("More details", closed by default), `Stat` (a number with a word). No page may use raw `h2/h3/p` sizes.
2. **A fixed type scale for the sidebar: three sizes only.** Title 22, body 15, caption 13. Weights: 600 for titles and values, 400 for the rest. A test fails the build if a sidebar page uses a fourth size (it reads the computed styles, like the existing touch-target check).
3. **Selection is shown by more than weight.** Selected = tinted accent background + accent border + check mark; this works in light, dark and for colour-blind users. Applies to `Choice`, `Segmented` and the goals options.
4. **The Speakers page becomes a short configurator.** Step 1: pick a type from big cards with a small drawing each (bookshelf, coaxial, floorstander). Step 2: "Where it stands" as three plain questions (How far from the front wall, how far apart, how high). Everything else (dimensions, port, DSP, brand, constraints, save file) goes into "More details", closed. Same data and fields; fewer on screen.
5. **Best placement card, simplified.** One big sentence as the answer ("Move the seat 20 cm back and the speakers 30 cm apart"), two small lines of numbers below, one primary button, A/B/C as a small segmented control. The two option rows move into a "Options" disclosure ("Place: both · Distance: room"). One title size.
6. **Bass chart: a word and a sparkline in the Best placement card** ("Bass at your seat: a little uneven near 80 Hz" with a 40 px curve), and the full chart on its own page, "Bass response". The room gets the freed height.
7. **Heatmap, properly.** (a) Interpolate the 10 cm grid to about 2 cm with bicubic (Catmull-Rom) on the canvas, so zones are smooth; (b) soft contour lines at 3 to 4 score levels; (c) a gentle glow around the best zone; (d) cells that are unavailable fade out with a soft edge instead of a hard cut; (e) keep the viridis ramp (it is the colour-blind-safe part) but lift the floor so "poor" is not near-black in dark mode. No new engine calls: the same data, drawn better. Rendering is at device pixel ratio, not 1 pixel per cell.
8. **Room drawing, calmer.** Rounded room outline with a thin wall and a soft shadow; dimension labels hidden until you hover or select an item (keep one total width and length); speakers as proper top-down shapes (cabinet, two circles for drivers, a small front mark); a seat as a soft circle with a facing arrow; furniture as soft rounded rectangles in a neutral fill with their name inside, no hatching. Dashed suggestion stays, in the accent colour.
9. **First-run guide:** three screens (room size, speaker type, "where you sit"), then straight to the Best placement. Afterwards the full lists are still one tap away. This is what stops people from "just dragging the speakers".
10. **Keep design from drifting.** Add visual screenshots of the key pages (light, dark, phone) to the e2e suite as reference images, so a later change that breaks the layout shows up. Screenshots are updated deliberately.
11. **Order of work.** (1) tokens + components + type-scale test, (2) fix items 1 and 4, (3) Best placement card and the sidebar pages, (4) heatmap + room drawing, (5) chart move, (6) first-run guide, (7) screenshot tests, (8) Hungarian text re-check (text length changes a layout more than English does).

## Constraints

- All tests keep passing (331 unit, 59 browser). Selectors in the e2e tests change only where a control moved; no engine file is touched except what the heatmap needs for display.
- 44 px touch targets, WCAG AA contrast in both themes (axe runs on every page).
- English and Hungarian for every string; Hungarian is usually 20 to 30% longer, so test with it.
- Bundle stays under 150 KB gzip (now 112 KB).
- The product name stays only in `src/app/config.ts`.

## Suggested model split

- **Opus, high:** components, type scale, Best placement card, Speakers configurator, heatmap rendering, room drawing (the design judgment is the hard part).
- **Sonnet, medium:** moving the remaining pages onto the components, the first-run guide, screenshot tests, Hungarian re-check.
