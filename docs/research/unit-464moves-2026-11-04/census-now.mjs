#!/usr/bin/env node
// unit-464moves — census-now.mjs
//
// Counts, at the moment it runs, what the memo and the log are about to publish. Run AFTER every
// other file in the directory exists, and the figures it prints are re-derived again from
// `git ls-tree origin/main` at wrap time — a count taken before the write that completes its own
// directory is false the moment it is published, which is this seat's own 11/04 defect 7.

import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UNIT = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(UNIT).filter((f) => !f.startsWith('.'));
const by = (ext) => files.filter((f) => f.endsWith(ext));
const err = by('.err');
const nonEmpty = err.filter((f) => statSync(join(UNIT, f)).size > 0);
const drives = files.filter((f) => /^drive\d+\..*\.out$|^drive\d+\.out$/.test(f));

console.log('key: readdirSync + statSync over the unit directory, at the instant this runs');
console.log(`  files        : ${files.length}`);
console.log(`  .out         : ${by('.out').length}`);
console.log(`  .err         : ${err.length}`);
console.log(`  non-empty .err: ${nonEmpty.length}${nonEmpty.length ? ` -> ${nonEmpty.join(' ')}` : ''}`);
console.log(`  .mjs         : ${by('.mjs').length}`);
console.log(`  .md          : ${by('.md').length}`);
console.log(`  .tsv         : ${by('.tsv').length}`);
console.log(`  drive recordings (driveN.*.out): ${drives.length} -> ${drives.sort().join(' ')}`);
