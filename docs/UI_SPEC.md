# UI Specification (v1): "Blueprint"

Status: Phase 0 draft. Wireframes are described in words; visual mockups come at the start of Phase 2.

## 1. Design intent

Calm, precise, technical, like a clean architectural drawing. Thin lines, lots of air, one accent colour. It should feel trustworthy to an engineer and friendly to a grandparent. Priorities: clarity → practicality → beauty.

**Not:** skeuomorphic hi-fi (wood, VU meters), gamer UI, dashboards full of numbers, emoji-heavy UI.

## 2. Design tokens

All tokens are CSS custom properties on `:root`, redefined for dark mode via `prefers-color-scheme` and an explicit `[data-theme]` override.

### Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F4F7FB` | `#0B1626` | page background (faint blueprint paper) |
| `--surface` | `#FFFFFF` | `#102033` | panels, cards, bottom sheet |
| `--ink` | `#142235` | `#E6EEF8` | primary text |
| `--ink-muted` | `#4A5B72` | `#9FB1C8` | secondary text, labels |
| `--line` | `#1F4E8C` | `#7FB2F0` | drawing lines (room, speakers, listener) |
| `--grid` | `#DCE5F0` | `#1C2F47` | background grid, dividers |
| `--accent` | `#2563C9` | `#5B9BF0` | interactive elements, focus ring, selection |
| `--ok` | `#2F7D4F` | `#5CC48A` | good findings |
| `--caution` | `#A15C07` | `#F0B45B` | caution |
| `--danger` | `#B42318` | `#F97066` | red flags |

- All text/background pairs must meet WCAG 2.2 AA (4.5:1, large text 3:1). Phase 2 verifies with an automated contrast check.
- Severity is **never colour-only**: each has an icon (✓ circle, ! triangle, ✕ octagon) and a word.
- **Evidence badges are not coloured red/orange/yellow/purple in the UI**, because that would clash with the severity colours (a "red" physics badge on a harmless finding reads as danger). In the UI they are small outlined tags with a shape and a word:

  | Level | Shape | Label |
  |---|---|---|
  | physics | ● | Physics |
  | guideline | ◆ | Guideline |
  | heuristic | ▲ | Rule of thumb |
  | subjective | ◇ | Your ears |

  The emoji (🔴🟠🟡🟣) stay in docs only.
- **Heatmap:** single-hue sequential ramp on the accent blue (light → dark = worse → better), plus the good-zone outline as a dashed `--ok` line. Colour-blind safe by construction (lightness only).

### Typography

- **IBM Plex Sans** (UI text) and **IBM Plex Mono** (numbers, dimensions on the drawing). The technical feel matches Blueprint, the fonts have a complete Hungarian character set, and they are licensed under the SIL OFL. **Self-hosted** (no Google Fonts request, for privacy), subset to Latin + Latin Extended-A, `font-display: swap`.
- Scale: 13 / 15 / 17 (body) / 20 / 26 / 34 px, line height 1.5 body, 1.25 headings. Base body size 17 px, for older users.
- Numbers use tabular figures (`font-variant-numeric: tabular-nums`).

### Spacing, shape, motion

- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px. Page gutter 16 px on phones, 24–32 px on desktop.
- Radius: 6 px (inputs, buttons), 10 px (cards). Borders 1 px `--grid`. No heavy shadows; one subtle elevation for the bottom sheet.
- Drawing strokes: walls 1.5 px, objects 1 px, dimension lines 0.75 px with arrowheads, a 10 cm minor / 1 m major background grid.
- Motion: 150–200 ms ease-out for position changes. Results never flash: changed values cross-fade. All motion is disabled under `prefers-reduced-motion`.

## 3. Layout

### Desktop (≥ 1024 px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ Speaker Placement   [Project ▾]      [Confidence ▮▮▮▯▯]  m|ft  EN|HU ☰ │
├──────────────────────────┬────────────────────────────────────────────┤
│ Stepper: Room · Surfaces │                                            │
│  · Furnishing · Speakers │        TOP VIEW (plan, interactive)        │
│  · Goals · Results       │                                            │
│ ───────────────────────  │                                            │
│ Step content (form)      ├──────────────────────┬─────────────────────┤
│                          │ SIDE VIEW (section)  │ Live findings (3–5) │
│ [Back]        [Next]     │                      │ + "See all results" │
└──────────────────────────┴──────────────────────┴─────────────────────┘
```

- The left panel is 400–440 px. The right side holds the drawing, which always stays visible.
- The Results step widens the right side; the left panel shows the results list, and the drawing highlights whatever result is hovered or focused.

### Tablet (640–1023 px)

The drawing takes the top 45% (sticky). The panel scrolls below.

### Phone (< 640 px)

The drawing takes the top ~40% of the viewport. The **bottom sheet** holds the stepper and the form: it can be dragged between peek (stepper plus a one-line summary), half and full. The confidence meter is compact in the top bar. No horizontal page scroll, ever.

> **Implementation notes (M2).**
> - The stepper shows every step name from 640 px up (wrapping to a second row if needed); on phones only the active step shows its name, the others are numbers with tooltips and screen-reader names.
> - On phones the units, language and theme toggles live in the ☰ menu, to keep the top bar to two rows.
> - On phones the sheet is part of the flex layout, so the drawing always fits the space above it (peek / half / full).
> - Untitled projects have an empty name and show "Untitled room" in the current language.
> - Numbers and units are separated by a non-breaking space, and the input parser accepts it back.

## 4. Global elements

- **Top bar:**
  - app name;
  - project switcher (rename, duplicate, new, delete with confirmation);
  - **confidence meter** (5 segments plus a word; tap opens "What would improve this?");
  - units toggle;
  - language toggle (EN / HU);
  - menu: Share link, Export file, Import file, Print report, Theme, About & sources, Disclaimer.
- **Variant tabs** above the drawing: "Current ▾", "+ New variant" (duplicates the active one). Rename inline.
- **Undo / redo:** buttons in the drawing toolbar and Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z. History covers all edits in the session.
- **Autosave indicator:** "Saved on this device" (quiet text). If storage is unavailable: "Not saved: your browser blocks storage. Use Export to keep your work."

## 5. Modes: Quick and Detailed

- On first open: a short welcome card with "Quick start (about 1 minute)" or "Detailed setup".
- **Quick** shows only Room (W, L, H), Speakers (model, rough positions), Goals, then Results. Surfaces and Furnishing appear in the stepper as "optional · improves confidence".
- Switching mode never loses data. Quick vs Detailed is just which steps are emphasised.

## 6. Steps and fields

Every numeric field has the **certainty selector** inline: a small three-state chip "measured / estimated / don't know" (default "estimated"). Choosing "don't know" greys the field, shows the default that will be used, and lowers confidence.

### Step 1 · Room

| Field | Control | Validation / hints |
|---|---|---|
| Width, length, height | unit-aware number inputs; the drawing updates live | Accept 1.5–30 m (H: 1.8–8 m). Outside the "usual" range (W/L 2–12 m, H 2.2–4 m) → soft warning "Is that right?" (no rejection). |
| Where are the speakers? | pick the wall on a mini plan | The chosen wall becomes "front"; the drawing rotates so it's at the top |
| Walls are mostly… | Solid (brick/concrete) · Lightweight (plasterboard) · Not sure | Explains why it matters (bass leaks through lightweight walls) |
| Does the room have…? | checkboxes: open doorway, opening to another room, alcove, slanted ceiling, not really rectangular | Any of these → the "what we can't model" note appears |
| Temperature (advanced, collapsed) | number, default 20 °C | — |

### Step 2 · Surfaces

- The drawing switches to **wall picker mode**: tap a wall, the floor or the ceiling (the side view gives access to floor and ceiling).
- A sheet shows the **base material** as a grid of illustrated tiles (simple line icons): plaster, brick, plasterboard, glass, wood floor, carpet, carpet on underlay, curtain, bookshelf / CD wall, artwork.
- **Add a patch:** "Add window / shelf / curtain / painting…" opens a small elevation view of that wall. The user drags a rectangle, or types position and size.
- **First-reflection hint:** once speakers and the listener exist, the side walls show the reflection points as small rings. "This spot matters most; what's here?" This guides the user to describe the right patch.

### Step 3 · Furnishing

- Object palette (line icons): bed, sofa, armchair, table, cabinet, shelf, radiator, other speaker, TV, desk, custom.
- Tap to add at a sensible default spot, then drag; sizes are editable with typed values. Rotation is 0° / 90° (v1).
- Each object shows "affects: reflections · room sound · blocks the view?" as small tags, so users learn what matters.
- "Busy-ness" shortcut for Quick users: **Bare / Some furniture / Busy / Very busy**. This maps to an object-absorption estimate with a wide range, and certainty "estimated".

### Step 4 · Speakers

- **Start from a type:** pick a generic speaker type (small bookshelf, coaxial monitor, floor-stander, …). It prefills typical values, all marked "estimated". There is no model database in v1.
- **Describe your speaker:** a short form with plain-language questions and pictures: size, "Where is the bass port?" (front / back / bottom / none / don't know), "Is it a coaxial driver (tweeter in the middle of the woofer)?", "Does it have tone or placement settings?". Every field allows "don't know". Brand and model are free text, for the user's own reference. Profiles can be saved, exported and imported as files.
- **Optional web lookup (later, see OPEN_QUESTIONS):** suggests values with sources that the user must confirm. v1 ships without it.
- **Placement:**
  - drag both speakers; mirror-lock is on by default;
  - typed: distance from front wall, distance apart, stand / desk height, toe-in angle;
  - **Constraints:** "How far into the room can the speakers come?" (slider and number) and "Can your seat move?" (Fixed / Forward-backward within … / Freely).
- **Listener:** drag the seat. Ear height defaults to 1.1 m seated ("measured / estimated" chip).

### Step 5 · Goals

- Chips with three states (don't care · nice · important): Wide soundstage · Precise imaging · Flat, neutral sound · Deep bass · I mostly listen quietly.
- Conflict notice when both "wide" and "precise" are important: "These pull in different directions. We'll find a balance and show you the trade-off."

### Step 6 · Results

Order (from PROJECT_BRIEF §7):

1. **Summary card:** "Your setup: Fair → Best found: Very good". Confidence meter repeated. A disclaimer line: "Guidance, not a guarantee. Your ears have the final say."
2. **Do this first (max 3):** numbered action cards with the expected effect and "Show on plan" (animates a ghost of the suggested position on the drawing). Button "Try this as a new variant".
3. **Red flags & cautions:** list of finding cards, each with an evidence tag, a severity icon, plain-language text, and "Why?" (expands: the physics in two sentences, assumptions, formula, sources).
4. **Recommended zones:** heatmap toggle on the plan (Seat zones / Speaker zones), candidates A–E as pins, with a comparison table (score bar, spread whisker, main reason).
5. **Bass at your seat:** a simple line chart, 20–300 Hz log axis, of the relative predicted response for the current variant vs the selected candidate. Peaks and dips are labelled ("a dip at 43 Hz, a low bass note"). Caption: "Simulated, relative; real rooms differ."
6. **Room character:** dead · balanced · live, with T60 as a range, and the Schroeder frequency shown as "≈ 180 Hz".
7. **Your speaker:** speaker-specific guidance (port, DSP settings to choose, toe-in experiment).
8. **Listen & refine:** opens the listening protocol (§7).
9. **What we can't model:** honest list of assumptions and out-of-model features.

Popular rules of thumb (38%, thirds) appear as an optional "Show rules of thumb" overlay with a note: "starting points, not laws."

## 7. Listening protocol & notes

- **Guided experiment:** "Change one thing → listen to the same 3 tracks → rate."
  - Suggested track types are described (a centred vocal, a bass-line track, a wide orchestral or ambient recording). No streaming integration.
  - The user picks their own tracks and they're remembered by name.
- **Rating:** 5-point scale plus symptom chips (boomy, thin bass, vague centre, narrow, harsh, dull, pulls to one side), with "How long have you listened to this setup?" (< 1 h / a few hours / days).
- **Notes timeline** per variant. A symptom triggers the S-rules: "Likely causes in your room: … · Try this: …".
- Copy reminder: "Ears adapt over hours. Judge after some time, and compare at the same volume."

## 8. Interaction details

- **Drag on the plan:** pointer and touch. Snapping to 5 cm, to the room centreline and to mirror positions (a light haptic on phones where supported).
- **Keyboard:** every draggable item is focusable. Arrows move 1 cm, Shift+Arrow 10 cm. Every drag has an equivalent form field.
- **Recompute:** debounced 150 ms after the last edit, run in a Web Worker. While computing, the old results stay visible with a subtle "updating" bar, so nothing goes blank.
- **Dimension labels** on the drawing in Plex Mono, in the chosen units.
- **Hover / focus linking:** hovering a finding highlights its geometry (reflection point, wall, seat), and vice versa.

## 9. Empty, error and edge states

| Situation | Behaviour |
|---|---|
| No room dimensions yet | Drawing shows a dashed placeholder room. Results say "Tell us the room size to begin." |
| Speakers not placed | Auto-place symmetrically at a default (0.5 m from front wall, 60° triangle) marked "default; drag to your real position". |
| Engine error | Card: "Something went wrong calculating this. Your data is safe." Plus a "Copy details" button (error and anonymised project JSON) for bug reports. Never a blank screen. |
| Invalid share link / import | "This link or file couldn't be read" plus the reason. The current project is not overwritten. |
| Out-of-model room | Banner at the top of Results: "Your room has features we can't model (…). Treat bass results as rough." |
| Storage blocked | See autosave indicator (§4). |

## 10. Print / PDF report

A print stylesheet produces a 2–3 page A4/Letter report:

1. Plan with the recommended positions and dimensions to the walls (tape-measure friendly: "left speaker: 62 cm from the front wall, 118 cm from the left wall").
2. Do-this-first and red flags.
3. Assumptions, confidence and sources.

Uses `window.print()`; no PDF library.

## 11. Accessibility & performance budgets

- WCAG 2.2 AA, verified with an automated check (axe) in CI plus a manual keyboard pass per milestone.
- Tap targets ≥ 44 × 44 px. Body text ≥ 17 px. Zoom to 200% without loss.
- Live region announces significant result changes: "Overall rating changed to Good."
- The SVG drawing has a text alternative: a summary list of positions and distances.
- Budgets: initial JS ≤ 150 KB gzip; first render < 2 s on a mid-range phone over 4G; engine run < 1.5 s (in a worker).
