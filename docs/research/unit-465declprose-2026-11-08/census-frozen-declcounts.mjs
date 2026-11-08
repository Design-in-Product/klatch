/**
 * P3 — census the MECHANISM, not the two reported instances.
 *
 * The mechanism `unit-465declpop` cured: an arm whose pass condition depends on HOW MANY entries in
 * the registry declare a refusal or a skip. Such an arm reddens when a legitimate new declaration
 * lands, with nothing about its own subject having changed.
 *
 * Selector, deliberately WIDER than the three known sites and keyed on neither of their spellings:
 * every source line in every probe file (and in the registry module itself) that mentions `refusal`
 * or `skip` AND carries a comparison against a numeric literal, or a `.length` reference. Hits are
 * then HAND READ — the population is small, so hand reading is the primary instrument and this
 * scanner is only the enumerator. A scanner that under-reports is the known failure mode, so the
 * selector is kept loose and the triage is done by eye, with every hit printed.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(HERE, '..', '..', '..', 'scripts');

const files = readdirSync(SCRIPTS)
  .filter((f) => f.endsWith('.mts') || f === 'sweep-probes.mjs')
  .sort();

const MENTIONS = /refusal|skip/i;
const NUMERIC_CMP = /[=!<>]==?\s*\d|\d\s*[=!<>]==?|\.length/;

let hits = 0;
const perFile = [];
for (const f of files) {
  const lines = readFileSync(join(SCRIPTS, f), 'utf8').split('\n');
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (MENTIONS.test(l) && NUMERIC_CMP.test(l)) found.push([i + 1, l.trim()]);
  }
  if (found.length) {
    perFile.push([f, found]);
    hits += found.length;
  }
}

console.log(`files scanned:            ${files.length}`);
console.log(`files with candidate(s):  ${perFile.length}`);
console.log(`candidate lines:          ${hits}`);
console.log('\n── every candidate, printed for hand reading ──');
for (const [f, found] of perFile) {
  console.log(`\n${f}`);
  for (const [n, l] of found) console.log(`  ${String(n).padStart(5)}  ${l}`);
}
