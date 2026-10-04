# Kickoff prompt for the Opus session (copy and paste)

Use **Opus, xhigh effort**.

> Read `CLAUDE.md`, `docs/PROJECT_BRIEF.md` and `docs/REVAMP_PLAN.md` fully. The decisions in REVAMP_PLAN are locked.
>
> **Phase R0: a full audit of the mechanics. Do not build new features yet.**
>
> Review everything with fresh, skeptical eyes, as an engineer and acoustician who has to defend this product against bad advice:
>
> 1. **Physics and engine** (`src/engine`, `docs/RULE_CATALOGUE.md`, `docs/SCORING.md`): re-derive every formula; check units, axes and conventions (width ↔ x, length ↔ y); the modal model and its truncation limits; P04/P05 boundary rules; P06 reflections; P08 reverberation (Sabine/Eyring switch, per-band furniture factors); P09 speaker roll-off assumption; scoring thresholds, weights and goal adjustments; search coverage (is the best placement ever missed?); robustness perturbations; confidence caps. Look for ways the engine can give a **confidently wrong** answer. Add tests for every bug found.
> 2. **Calibration choices** flagged 🟡 in OPEN_QUESTIONS and in `src/engine/presets`: judge each, keep, change or relabel.
> 3. **Sources:** resolve every ⚠ you can verify from your own knowledge with explicit uncertainty; never invent a citation; list what the owner must check.
> 4. **App mechanics** (`src/app`): workspace, undo and coalescing, autosave, share links and file import (hostile input, size limits, decompression bombs), placement and patch logic, speaker file schema, i18n completeness, accessibility, offline behaviour, Pages deploy.
> 5. **Test suite:** missing cases, vacuous assertions, flaky timing, gaps against `docs/TEST_PLAN.md`.
>
> Output `docs/REVIEW_FINDINGS.md`: findings ranked critical / high / medium / low, each with evidence (file and line, a failing test or a worked number), a fix, and status. **Fix everything critical and high** with tests; list the rest as proposals. Run all checks (`npm run lint`, `check`, `test`, `build`, `check:size`, `test:e2e`) before pushing. Commit and push to the current branch. Do not open a pull request unless asked; do not start R1.
