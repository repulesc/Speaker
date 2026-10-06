# Legacy: V7 (frozen)

The site as it was when V7 was merged (main at commit 5e0ff6f), built once and kept
here unchanged so it stays reachable at `/legacy/v7/`. It is not rebuilt, linted or tested.

- Its own storage keys (`spa-v7:` instead of `spa:`), so it never reads or overwrites projects of
  the current app. No service worker and no install manifest of its own.
- To rebuild it: check out commit 5e0ff6f, replace `'spa:` and `` `spa: `` with `spa-v7:` in `src/`,
  delete `public/sw.js`, run `npx vite build`, drop the manifest link from `index.html`, copy `dist/`
  here.
