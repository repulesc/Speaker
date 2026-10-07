/**
 * Runs a draft through the quote checker (docs/SPEAKER_DATA.md).
 *
 *   node tools/speakers/check-draft.ts draft.json page.txt [--write]
 *
 * `draft.json` is what an AI (or a person) read from the page: each value with the exact words it
 * came from. `page.txt` is the page text. Prints what passed, what was rejected and what a person
 * should look at; with --write, a passing entry goes to data/speakers/entries/<id>.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { checkDraft, type Draft } from '../../src/engine/speakers/verify.ts';

const [draftPath, pagePath, flag] = process.argv.slice(2);
if (!draftPath || !pagePath) {
  console.error('usage: node tools/speakers/check-draft.ts draft.json page.txt [--write]');
  process.exit(2);
}
const draft = JSON.parse(readFileSync(draftPath, 'utf8')) as Draft;
const result = checkDraft(draft, readFileSync(pagePath, 'utf8'));

for (const f of result.rejected) console.log(`REJECTED  ${f.field}: ${f.reason}`);
for (const f of result.review) console.log(`LOOK      ${f.field}: ${f.reason}`);
if (!result.entry) {
  console.log('No entry: fix the draft or the page and run again.');
  process.exit(1);
}
console.log(
  `OK        ${result.entry.id}${result.review.length ? ' (with things to look at)' : ''}`,
);
if (flag === '--write') {
  mkdirSync('data/speakers/entries', { recursive: true });
  const file = `data/speakers/entries/${result.entry.id}.json`;
  writeFileSync(file, `${JSON.stringify(result.entry, null, 2)}\n`);
  console.log(`wrote ${file}`);
}
