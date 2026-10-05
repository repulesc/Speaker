# Kickoff for Opus: trust first, then a calmer, smarter app

Read, in this order: `CLAUDE.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP_V7.md` (the problems, the root
causes, the owner's decisions), `docs/WORDING.md`, `docs/MODEL_CREDIBILITY.md`. The owner is a visual
designer, not an engineer. He wants a speaker enthusiast to feel good using this, in English and
Hungarian. Never output confidently wrong acoustics.

## Mandate

1. **Phase 1, engine, test first, its own pull request.** The four bugs in ROADMAP_V7 (speakers behind
   the seat score well; one word, three different scores; sound path blocked by low furniture; spots that
   are not stereo spots coloured as if good). Decisions are made: speakers behind the seat stay at "Poor"
   with a plain warning; every word uses the cautious (robust) score. Also reproduce the unticked speaker
   progress marker. Add unit tests for each case the owner tried.
2. **Phase 2, speaker dropdowns** as specified in ROADMAP_V7 (kind, size, drivers, port, made for,
   spread, placed on), no brand data from memory, every value marked as an estimate, a test per mapping.
3. **Phase 3, the design system, free hand.** Cards and the whole left panel; the heat map's warm
   colour-blind-safe scale; speaker and label markers that read on every colour; dark-mode contrast; a
   "Show the numbers" switch; the first-run "what we found" line; the Live with it card with the three
   faces; selective, contextual tips. Keep the first-run survey and its fade, which the owner loves.
4. **Phase 4, review the whole branch**, then show the owner screenshots (desktop light and dark,
   Hungarian, phone) before opening the pull request.

## Rules that must hold

- The engine stays a pure TypeScript module with no UI imports; one small file per rule; metres inside.
- Every rule and tip: formula or honest label, evidence level, source (none invented; mark unverified), tests.
- All text through i18n, English and Hungarian, same key order. Everyday words by default; numbers only
  with "Show the numbers" or under Details. No technical units in plain texts.
- No backend, no accounts, no tracking. Everything stays on the device.
- Gates before every push: `npm test`, `npm run check`, `npm run lint`, `npm run build`,
  `npm run check:size` (budget 150 KB gzip), `npm run test:e2e`.
- Do not open a pull request unless the owner asks. Work on the branch you are given.

## Things the owner said he is unsure about (decide, then tell him in one line each)

- Which contextual tips to write first: choose the scenarios that most change someone's decision.
- Whether the Result tab keeps a "more tips" line or links to the Tips tab: no duplicate tips.
- The exact warm palette and the card style (any better idea than soft cards is welcome).
