// Counts the Hungarian text the owner has not reviewed yet (docs/I18N_AND_UNITS.md, R4).
// A top-level block in src/i18n/hu.ts counts as reviewed when the line above it is
// `  // reviewed`. Prints the blocks still open. A report, never a failure.
import { readFileSync } from 'node:fs';

const lines = readFileSync(new URL('../src/i18n/hu.ts', import.meta.url), 'utf8').split('\n');
const blocks = [];
for (let i = 0; i < lines.length; i++) {
  const match = /^ {2}([A-Za-z0-9]+): \{$/.exec(lines[i]);
  if (!match) continue;
  let end = i + 1;
  while (end < lines.length && lines[end] !== '  },') end++;
  const strings = lines.slice(i, end).filter((l) => /'[^']*'|"[^"]*"/.test(l)).length;
  blocks.push({ name: match[1], reviewed: lines[i - 1]?.trim() === '// reviewed', strings });
}

const open = blocks.filter((b) => !b.reviewed);
const left = open.reduce((sum, b) => sum + b.strings, 0);
console.log(
  `Hungarian review: ${blocks.length - open.length} of ${blocks.length} blocks reviewed, about ${left} strings left.`,
);
if (open.length) console.log(`Open: ${open.map((b) => `${b.name} (${b.strings})`).join(', ')}`);
