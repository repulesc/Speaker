# Speaker Placement Advisor: Project Brief

Status: **decisions locked after brainstorming. Phase 0 specification written, awaiting owner review.**
Audience: Claude sessions working on this project, and the project owner.

> **Decisions the owner changed later.** V9 (docs/ROADMAP_V9.md): no placing furniture or things on walls ("How full is the room?" carries the furnishing), no JSON export and import (one room, shared by link), no listening notes. The display face is Jost and the brand is the NODO wordmark. Where this brief says otherwise, the roadmap wins.

Phase 0 documents:

- [RULE_CATALOGUE](RULE_CATALOGUE.md)
- [DATA_MODEL](DATA_MODEL.md)
- [SCORING](SCORING.md)
- [UI_SPEC](UI_SPEC.md)
- [I18N_AND_UNITS](I18N_AND_UNITS.md)
- [TEST_PLAN](TEST_PLAN.md)
- [ROADMAP](ROADMAP.md)
- [OPEN_QUESTIONS](OPEN_QUESTIONS.md)

## 1. Vision

A free, open-source web app that helps anyone find good loudspeaker and listening positions in a room, using established room acoustics. The owner is an inventor, not an acoustician; the users are hi-fi owners of all levels, including older, non-technical people. The app must be scientifically honest but never require scientific knowledge to use.

It is a **scientific helper**, not an oracle. It explains, ranks options, and flags red flags and no-gos. It does not claim a single "perfect" position.

## 2. Non-negotiable principles

1. **Never give confidently wrong information.** Placement is contested. Every output carries an evidence level (see 5).
2. **Honest uncertainty.** Unknown inputs, unsupported room shapes and missing speaker data lower confidence, and the app says why.
3. **Zones, not points.** Output is ranked candidate zones with reasoning, plus a listening-test protocol so the user verifies by ear.
4. **Science first, subjective second.** Physics and documented rules drive results. Subjective notes (after hours or days of listening) generate hypotheses and experiments; they never silently override physics.
5. **Every rule is traceable.** Each rule has a formula, a cited source, an evidence level and tests.
6. **No measurement features in v1.** No microphone, no REW import. Most users have no microphone. Possible later phase, not now.

## 3. Decisions (locked)

| Topic | Decision |
|---|---|
| Platform | Static web app (PWA): installable, offline-capable, mobile and desktop |
| Backend / accounts | None. Local-first. Data in the browser |
| Hosting | GitHub Pages (repo `repulesc/speaker`), auto-deploy on passing CI |
| Framework | TypeScript (strict) + Vite + **Svelte** |
| Plan drawing | SVG (heatmap may use canvas if needed) |
| Visual style | **Blueprint**: thin technical line work, muted navy and white, calm whitespace |
| Themes | Light and dark |
| Languages | **English and Hungarian** from day one (all text in translation files) |
| Units | Metric and imperial. Internal canonical unit is metres, conversion only at UI edges |
| License | MIT for code, CC BY for the rule catalogue and docs |
| Hungarian register | Informal (tegezés) |
| Speakers | User-entered profiles plus generic type presets; no model database at launch |
| Desk / near-field setups | After v1 (first item in "Later"); wanted by the owner |
| Room shapes (v1) | **Rectangular only.** Others get a clear "low confidence / out of scope" message. Revisit only if cheap and unambiguous |
| Money | Free. Optional donation link (Ko-fi / GitHub Sponsors) later |
| Priorities | 1. smooth, clean, easy-to-read code. 2. practical use. 3. aesthetics (minimal, not ugly) |

## 4. UX concept

- **Results from the first answer.** No "finish the quiz to see anything". Results update live as inputs are added.
- **Confidence meter** shows how much the app knows, with hints such as "add wall materials to firm this up".
- **Layout.** Desktop: questions on the left, live room drawing and findings on the right. Phone: drawing on top, bottom sheet with questions below.
- **Two depths, one flow.**
  - Quick: room size, speaker, goals. Baseline in about a minute.
  - Detailed: wall surfaces, furnishing, exact speaker model.
- **Steps.** Room, Surfaces, Furnishing, Speakers, Goals, Results. Freely revisitable, nothing lost.
- **Direct manipulation.** Drag speakers, listener and furniture on a top-down and a side view. Snapping, exact typed values, undo and redo.
- **Every field allows "unknown" or "estimate".** A measured / estimated / unknown tag per input feeds the confidence meter.
- **Forgiving unit input.** `3.5`, `3,5 m`, `350cm`, `11'6"` all parse. Invalid input is rejected visibly.
- **Persistence and sharing without accounts.**
  - Autosave to the browser.
  - Share link with the whole setup encoded in the URL.
  - JSON export and import.
  - Printable or PDF report.
  - Several named variants of one room ("bed moved", "speakers 20 cm out").
- **Plain language first.** Technical detail one tap deeper. Nobody needs to know "SBIR" to use it.
- **Accessibility.** Full keyboard use, good contrast, colour-blind-safe heatmap, readable sizes.

## 5. Evidence levels (used on every output)

- 🔴 **Physics:** computed from the inputs (room modes, boundary-cancellation frequency, mirror-image first-reflection points, Schroeder frequency, Sabine RT60 estimate).
- 🟠 **Strong guideline:** widely agreed practice (symmetry, avoiding the exact room midpoint, avoiding corners, ear and tweeter height).
- 🟡 **Heuristic:** contested rules of thumb (38% rule, rule of thirds, specific distances). Presented as starting points, not laws.
- 🟣 **Subjective:** the user's listening feedback.

## 6. Inputs

- **Room (rectangular):** length, width, height. Optional: openings, alcoves flagged as "not modelled".
- **Surfaces (per wall, floor, ceiling):** hard, glass, plaster, wood, curtain, carpet, bookshelf or irregular surface (for example a wall of CDs: partly diffusing), canvases or paintings, and so on.
- **Objects:** furniture, bed, radiator, window, other speakers or equipment near the speaker (non-driven objects can reflect or resonate).
- **Listening position and speaker positions,** including speaker height and ear height.
- **Speaker profile:**
  - dimensions;
  - sealed or ported, and **port location** (front, rear, down), which matters near walls;
  - driver layout (for example a coaxial Uni-Q);
  - dispersion and directivity;
  - sensitivity and power;
  - DSP and EQ controls (wall, desk, treble trim and so on).
- **Speaker data source (decided after Phase 0).** The user describes their own speaker; there is **no built-in model database at launch**. Generic *speaker-type presets* (for example "small rear-ported bookshelf", "coaxial active monitor", "sealed floor-stander") prefill typical values marked as estimates. Profiles can be saved and shared as files. A curated database may come later. Web lookup only as "suggest, then the user verifies", with a source shown. Dispersion data should point to measured sources where they exist. **Never trust remembered specs; verify them.**
- **Goals:** wide soundstage, precise imaging, flat response, and so on. These weight suggestions, never override physics.
- **Subjective feedback (optional, later in the flow):** symptoms such as "lacks focus" map to hypotheses and experiments (check toe-in, first reflections, boundary distance, ear height). They never auto-change the physics result.

## 7. Outputs

In this order on the results page:

1. **"Do this first":** the top three actions.
2. **Red flags and no-gos,** each with a plain-language "why": speaker or listener at the room midpoint, a boundary-cancellation notch in a critical range, untreated hard first-reflection points, asymmetry problems, reflective objects near the speaker, and so on.
3. **Ranked candidate zones** on the plan (heatmap).
4. **Predicted problem frequencies** (modes, boundary notches) in plain language, with simple fixes.
5. **Speaker-specific guidance.** Example: a soft, busy room absorbs treble, so a small treble lift may help; a bare room may need a trim. Toe-in advice is derived from the speaker's dispersion data, not assumed. A claim such as "no toe-in needed" must be treated as something to verify.
6. **Listening-test protocol:** move 10 cm, same tracks, rate, log.

Each claim carries its evidence badge and an expandable "why, and the source". The app states plainly: guidance, not a guarantee.

## 8. Architecture and code principles

- **Acoustics engine is a pure TypeScript module** with no UI code, separately testable and readable.
- **One small file per rule** containing formula, source citation, evidence level and tests.
- **Rule catalogue** (documents in `docs/`) is the single source of truth, written before the engine.
- Strict TypeScript, few dependencies, small readable modules.
- Automated tests and CI on every change. Deploy to Pages only if tests pass.
- Tests include textbook cases and cross-checks against independent references (for example room-mode calculators).
- i18n from the start: all strings keyed, with EN and HU files. Hungarian copy needs special care for natural phrasing and hi-fi terms.

## 9. Test case modelled on the owner's room (one profile, not the product)

The owner's actual measurements are not needed: the product is universal. TEST_PLAN uses a synthetic "busy room" scenario built from this description.

Used as one realistic test profile; the app itself stays universal.

- KEF LSX II LT speakers (owner wrote "LSX LT2"). Data gathered so far, including a **rear bass-reflex port**, is in TEST_PLAN §7; it is still unverified against KEF primary sources. Uni-Q driver with wide, even dispersion. Digital EQ with treble, bass extension and wall and desk placement settings. Owner believes toe-in is not required. Verify, don't assume.
- One side wall fully covered in CDs (irregular, partly diffusing).
- Opposite side: radiator and window in a corner, outside the first-reflection point.
- Behind the speakers: two large canvases, no glass.
- Other speakers around and behind the main speakers.
- Thick carpet, a bed, lots of furniture and artwork: a very busy, damped room.
- Goals: wide, big soundstage, precise imaging, as flat a response as possible.

## 10. Phases

0. **Specification (Opus, high effort):** rule catalogue, data model, UI wireframes in words, i18n plan, test plan. **Documents only; the owner reviews them before any code.**
1. **Acoustics engine (Opus, high effort):** pure library with tests.
2. **UI and wizard (Sonnet, medium effort):** Blueprint design system, live plan, steps, results, EN and HU.
3. **Review (Opus) at each milestone:** physics audit, search for bad advice, accessibility and code clarity.
4. **Later, out of scope for v1:** non-rectangular rooms, measurement import, donation link, more languages.

## 11. Open questions for Phase 0 to resolve

- Which room-mode, boundary-interference and reflection rules make the v1 rule catalogue, and what exact evidence level and source does each get?
- How to represent surfaces and absorption in a way a layperson can fill in (presets with typical absorption coefficients, shown as estimates).
- How candidate zones are scored and how conflicting rules are weighed, transparently.
- Seed contents of the speaker database and its data-quality rules (source, date, "verified" flag).
- Exact confidence-meter model.
- Licensing detail: the copyright holder name for the MIT and CC BY files, and a short "guidance, not a guarantee" disclaimer text.
