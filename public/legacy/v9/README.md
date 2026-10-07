# Legacy: V9 (frozen)

The site as it was when V9 was merged (main at commit 95091e5), built once and kept here unchanged
so it stays reachable at `/legacy/v9/`. It is not rebuilt, linted or tested.

- Its own storage keys (`spa-v9:` instead of `spa:`), so it never reads or overwrites the room of
  the current app. No service worker and no install manifest of its own.
- To rebuild it: check out commit 95091e5, replace `'spa:` and `` `spa: `` with `spa-v9:` in `src/`,
  delete `public/sw.js` and `public/legacy/`, point the menu's legacy link at `../`, run
  `npx vite build`, drop the manifest link from `index.html`, copy `dist/` here.
