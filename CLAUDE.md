# Speaker Placement Advisor

Free, open-source, local-first web app (TypeScript strict + Vite + Svelte, static PWA) that helps people place loudspeakers in a rectangular room. Read `docs/PROJECT_BRIEF.md` first; its decisions are locked.

## Rules for working here

- Never output confidently wrong acoustics. Every rule needs a formula, a cited source, an evidence level (🔴 physics, 🟠 strong guideline, 🟡 heuristic, 🟣 subjective) and tests. Do not invent citations; mark anything unverified.
- Acoustics engine is a pure TypeScript module with no UI imports. One small file per rule.
- Internal unit is metres. Convert only at the UI edge.
- All user-facing text goes through i18n (English and Hungarian). No hard-coded strings in components.
- Priorities: 1. clean, readable, smooth code. 2. practical use. 3. aesthetics (Blueprint style, minimal).
- No backend, no accounts, no measurement features in v1.
- Speaker specs from memory are not trusted: verify, and mark the source.
- Work on the branch you were assigned. Do not create pull requests unless asked.
