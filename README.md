# Speaker Placement Advisor

A free, open-source web app that helps anyone place loudspeakers and choose a listening seat in a rectangular room, using established room acoustics, and that is honest about what it doesn't know.

**Status:** M1 done (acoustics engine). The screens come next. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Where to read first

- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md): what and why (decisions are locked).
- [docs/RULE_CATALOGUE.md](docs/RULE_CATALOGUE.md): every acoustics rule, with formula, evidence level, sources and test case.
- [docs/SCORING.md](docs/SCORING.md): how suggestions are ranked, and the confidence model.

## Development

Requires Node 22.

```sh
npm install
npm run dev      # local dev server
npm test         # unit, property and reference tests
npm run check    # type check (svelte-check)
npm run lint     # ESLint + Prettier
npm run build    # production build into dist/
```

The independent physics reference (Python + NumPy) lives in `tools/reference/`. Run `python3 tools/reference/reference.py` to regenerate `tests/fixtures/reference.json`, and only deliberately.

## Layout

```
src/engine/   pure TypeScript acoustics engine (no UI, i18n or storage imports)
  rules/      one file per rule (P = physics, G = guideline, H = heuristic)
  scoring/    score components, search, robustness, heatmaps
src/units/    length parsing and formatting (SI inside, units only at the edge)
src/i18n/     English and Hungarian messages
src/app/      Svelte UI
tests/        Vitest tests and fixtures
```

## License

Code: MIT. Rule catalogue and docs: CC BY 4.0. (License files arrive at launch; see OPEN_QUESTIONS Q2.)
