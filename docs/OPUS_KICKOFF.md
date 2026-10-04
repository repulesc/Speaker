# Kickoff prompt for the Opus session (copy and paste)

> Read `docs/PROJECT_BRIEF.md` and `CLAUDE.md` fully. All product decisions in the brief are locked; do not re-litigate them.
>
> **This session is Phase 0 only: write documents, no application code.** Produce, under `docs/`:
>
> 1. `RULE_CATALOGUE.md`: every v1 acoustics rule (room modes, speaker-boundary interference, mirror-image first reflections, Schroeder frequency, Sabine RT60 estimate, symmetry, midpoint avoidance, listening-position heuristics and so on). For each rule give the formula, plain-language explanation, inputs needed, evidence level (🔴🟠🟡🟣), at least one citable source, known limits, and one worked test case with numbers. Be explicit where the literature disagrees. Do not invent citations; if unsure of a source, say so and mark it for verification.
> 2. `DATA_MODEL.md`: the TypeScript types for room, surfaces, objects, speaker profile, goals, subjective feedback, results and the saved/shared state format (versioned).
> 3. `SCORING.md`: how candidate zones are scored, how rules are weighted, how conflicts are resolved, and the confidence-meter model.
> 4. `UI_SPEC.md`: Blueprint design tokens (colour, type, spacing), the layout for desktop and phone, every step's fields and microcopy intent, empty and error states, and accessibility requirements.
> 5. `I18N_AND_UNITS.md`: translation-file structure for English and Hungarian, unit parsing and formatting rules, and notes on natural Hungarian hi-fi terminology.
> 6. `TEST_PLAN.md`: textbook cases, cross-checks against independent references, and the owner's room as a test profile.
> 7. `ROADMAP.md`: milestones with acceptance criteria.
>
> Then list every open question you could not resolve, and the unverified claims, in `docs/OPEN_QUESTIONS.md`. Commit and push to the current branch. Do not start Phase 1.
