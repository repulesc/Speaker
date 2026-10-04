// Fails the build when the JavaScript the app loads at start-up exceeds the budget
// (docs/UI_SPEC.md §11: initial JS ≤ 150 KB gzip). Counts the main bundle and the engine worker.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 150;
const dir = new URL('../dist/assets/', import.meta.url);

const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
if (files.length === 0) {
  console.error('No JavaScript found in dist/assets. Run "npm run build" first.');
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const kb = gzipSync(readFileSync(new URL(file, dir))).length / 1024;
  total += kb;
  console.log(`${kb.toFixed(1).padStart(7)} KB gzip  ${file}`);
}
console.log(`${total.toFixed(1).padStart(7)} KB gzip  total (budget ${BUDGET_KB} KB)`);

if (total > BUDGET_KB) {
  console.error(`JavaScript is over the ${BUDGET_KB} KB budget.`);
  process.exit(1);
}
