# Legacy: V8 (frozen)

The site as it was when V8 was merged (main at commit fd06007), built once and kept here unchanged
so it stays reachable at `/legacy/v8/`. It is not rebuilt, linted or tested.

- Its own storage keys (`spa-v8:` instead of `spa:`), so it never reads or overwrites the rooms of
  the current app. No service worker and no install manifest of its own.
- To rebuild it: check out commit fd06007, replace `'spa:` and `` `spa: `` with `spa-v8:` in `src/`,
  delete `public/sw.js` and `public/legacy/`, point the menu's legacy link at `../`, run
  `npx vite build`, drop the manifest link from `index.html`, copy `dist/` here.
