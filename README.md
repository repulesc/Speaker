# Speaker Placement Advisor

A free, open-source web app that helps anyone place loudspeakers and choose a listening seat in a rectangular room, using established room acoustics, and that is honest about what it doesn't know.

**Try it:** https://repulesc.github.io/Speaker/ (works offline once opened; nothing you enter leaves your device).

What it does:

- Type or drag your room, walls, furniture, speakers and seat. Rough values are fine: say when you are unsure.
- See a map of good and poor seats, the best spots for speakers and seat, and why, in plain words. Every statement carries its evidence level: 🔴 physics, 🟠 strong guideline, 🟡 heuristic, 🟣 your own ears.
- Get treatment and speaker-setting advice in order of usefulness, explore where single bass notes are loud or silent, compare setups, keep a listening log, and print a tape-measure sheet.

What it does not do: measure anything (no microphone), model non-rectangular rooms, or promise results. It is a guide; your ears have the last word.

**Status:** feature-complete for v1 and through its final audit (`docs/REVIEW_R5.md`). The Hungarian text awaits review by a native speaker (`npm run hu:review` shows what is left).

### Magyarul

Ingyenes, nyílt forráskódú webalkalmazás, amely a teremakusztika alapján segít megtalálni a hangfalak és a hallgatási pont jó helyét egy téglalap alakú szobában. Add meg (vagy húzd a helyére) a szobát, a falakat, a bútorokat, a hangfalakat és az ülőhelyet; az app térképen mutatja a jó és a gyenge helyeket, és egyszerű szavakkal elmondja, miért. Minden állítás mellett ott a bizonyítottsága: fizika, erős irányelv, ökölszabály vagy a saját füled. Nem mér semmit, és nem ígér eredményt: iránymutatás, a végső szó a füledé. Az adataid nem hagyják el az eszközödet.

## Where to read first

- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md): what and why (decisions are locked).
- [docs/RULE_CATALOGUE.md](docs/RULE_CATALOGUE.md): every acoustics rule, with formula, evidence level, sources and test case.
- [docs/SCORING.md](docs/SCORING.md): how suggestions are ranked, and the confidence model.
- [docs/REVIEW_FINDINGS.md](docs/REVIEW_FINDINGS.md), [docs/REVIEW_R3.md](docs/REVIEW_R3.md), [docs/REVIEW_R5.md](docs/REVIEW_R5.md): the audits, what they found and what was fixed.
- [CONTRIBUTING.md](CONTRIBUTING.md): how to report wrong advice, propose a rule or improve a translation.

## Development

Requires Node 22.

```sh
npm install
npm run dev      # local dev server
npm test         # unit, property and reference tests
npm run check    # type check (svelte-check)
npm run lint     # ESLint + Prettier
npm run build    # production build into dist/
npm run check:size  # JavaScript budget (150 KB gzip), after a build
npm run test:e2e    # browser tests and accessibility checks (builds first)
```

End-to-end tests need a Chromium. In CI it is installed with `npx playwright install chromium`; if you already have one, set `PW_CHROMIUM` to its path.

The independent physics reference (Python + NumPy) lives in `tools/reference/`. Run `python3 tools/reference/reference.py` to regenerate `tests/fixtures/reference.json`, and only deliberately. `python3 tools/reference/image_check.py` compares the bass model with an image-source calculation (`docs/verification/`).

## Layout

```
src/engine/   pure TypeScript acoustics engine (no UI, i18n or storage imports)
  rules/      one file per rule (P = physics, G = guideline, H = heuristic)
  scoring/    score components, search, robustness, heatmaps
src/units/    length parsing and formatting (SI inside, units only at the edge)
src/i18n/     English and Hungarian messages
src/app/      Svelte UI (components/, state/ for projects, saving, sharing)
tests/e2e/    Playwright journeys and axe checks
tests/        Vitest tests and fixtures
```

## License

Code: MIT ([LICENSE](LICENSE)). Rule catalogue and docs: CC BY 4.0 ([LICENSE-docs](LICENSE-docs)). Copyright holder: "Speaker Placement Advisor contributors".
