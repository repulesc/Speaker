# Contributing

Thank you for helping. This app gives acoustic advice to people who cannot check it themselves, so the bar is: **never confidently wrong**.

## Report wrong or confusing advice

Open an issue with the "Wrong or confusing advice" form. The most useful reports include:

- the project file (Menu → Export file) or a share link (Menu → Share link; listening notes are left out unless you tick the box),
- the sentence that is wrong, word for word,
- why you think so: a measurement, a source, or what you heard.

## Propose or change an acoustics rule

Rules live in `src/engine/rules/` (findings) and `src/engine/advice/` (treatment and settings), one small file each, and are documented in `docs/RULE_CATALOGUE.md`. A change needs all of:

1. **A formula or a clear logic**, written in the catalogue entry.
2. **A source you have checked**: book with edition and page, paper with volume and pages, or a standard with its revision. Do not cite from memory. If a number has no source, say so and label it 🟡 heuristic.
3. **An evidence level**: 🔴 physics, 🟠 strong guideline, 🟡 heuristic, 🟣 subjective.
4. **Tests**: a worked test case in the catalogue and in `tests/engine/`, and text for every message in English and Hungarian (`src/i18n/`). `tests/app/findings.test.ts` and `tests/app/sweep.test.ts` check that every message renders without gaps or nonsense.

The engine is pure TypeScript in metres, with no UI imports. Run `npm run lint`, `npm run check`, `npm test`, `npm run build`, `npm run check:size` and `npm run test:e2e` before opening a pull request; CI runs the same.

## Speaker data

There is no speaker database in v1. If you describe a speaker for others (a shared speaker file), use the manufacturer's spec sheet or manual, or a published measurement, and name the source. Never use remembered specs.

## Translations

All text is in `src/i18n/en.ts` and `src/i18n/hu.ts` (informal Hungarian, tegezés). When you have checked a Hungarian block, put `// reviewed` on the line above it; `npm run hu:review` shows what is left.

## Licences

Code is MIT ([LICENSE](LICENSE)). Documentation and the rule catalogue are CC BY 4.0 ([LICENSE-docs](LICENSE-docs)). By contributing you agree to license your contribution the same way.
