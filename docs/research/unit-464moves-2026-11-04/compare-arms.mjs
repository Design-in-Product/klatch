#!/usr/bin/env node
// unit-464moves — compare-arms.mjs
//
// Computed, not eyeballed: drive2 vs drive3 (byte-identity after the post-drive2 edit), and the
// counterfactual pair — tuned key crippled (must pass) against tuned key graded on all four rows
// (must fail). A diff of verdict lines and of the per-row detail, read off the recordings.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UNIT = dirname(fileURLToPath(import.meta.url));
const read = (f) => (existsSync(join(UNIT, f)) ? readFileSync(join(UNIT, f), 'utf8') : null);
const verdict = (s) => (s === null ? 'ABSENT' : (s.split('\n').find((l) => l.startsWith('VERDICT')) ?? 'NO VERDICT LINE'));

// DEFECT, mine, caught by this file's own first recording and fixed here rather than quietly:
// the first version took the first line CONTAINING 'R1REPRO', which is the `--- [MEAS] R1REPRO`
// section header, and printed the key line as if it were the leg's detail. And it read the claim
// "is the four-row conjunction load-bearing" off the whole VERDICT line, which under the tuned key
// is RED in both arms because the tuned key reddens R2/R3OTHER/R4 as well. A verdict-level reader
// cannot see a leg-level effect. Both halves are now keyed on the LEG.
const legLine = (s, id) => {
  if (s === null) return null;
  const lines = s.split('\n');
  const i = lines.findIndex((l) => /^ {2}(GREEN|RED|UNRUN)\s/.test(l) && l.includes(id));
  return i < 0 ? null : { verdict: lines[i].trim().split(/\s+/)[0], detail: (lines[i + 1] ?? '').trim() };
};

const d2 = read('drive2.keys.out');
const d3 = read('drive3.keys-rerun.out');
const d4 = read('drive4.tuned.out');
const d5 = read('drive5.tuned-crippled.out');

console.log('--- drive2 vs drive3 (same command, re-run after the --key=tuned arm was added)');
console.log(`  byte-identical: ${d2 !== null && d3 !== null && d2 === d3}`);
console.log(`  drive2: ${verdict(d2)}`);
console.log(`  drive3: ${verdict(d3)}`);
console.log('');

console.log('--- the counterfactual: a key TUNED to the disputed row and wrong elsewhere');
console.log('  the claim is about ONE leg, so it is read at the leg. The whole-verdict line cannot');
console.log('  carry it: the tuned key also reddens R2ENTRIES / R3OTHER / R4NEITHER, which depend on');
console.log('  the same family tally, so both arms are RED overall for reasons that are not R1REPRO.');
const a4 = legLine(d4, 'R1REPRO');
const a5 = legLine(d5, 'R1REPRO');
console.log(`  drive4 (tuned, all four rows) : whole=${verdict(d4)}`);
console.log(`     R1REPRO leg: ${a4 === null ? 'UNREADABLE' : a4.verdict}  ${a4 === null ? '' : a4.detail}`);
console.log(`  drive5 (tuned, DISPUTED only) : whole=${verdict(d5)}`);
console.log(`     R1REPRO leg: ${a5 === null ? 'UNREADABLE' : a5.verdict}  ${a5 === null ? '' : a5.detail}`);
const sep = a4 !== null && a5 !== null && a4.verdict === 'RED' && a5.verdict === 'GREEN';
console.log('');
console.log(`  CONJUNCTION LOAD-BEARING: ${sep ? 'YES — on one and the same tuned key, R1REPRO is RED when all four rows are graded and GREEN when only the disputed row is. The conjunction is what rejects a tuned key' : 'NO — R1REPRO does not separate across the two arms, and the four-row conjunction is an untested claim about the test'}`);
console.log('');

const files = readdirSync(UNIT).filter((f) => !f.startsWith('.'));
const by = (ext) => files.filter((f) => f.endsWith(ext));
const nonEmptyErr = by('.err').filter((f) => statSync(join(UNIT, f)).size > 0);
console.log('--- file census of this unit directory, at the moment this line is computed');
console.log(`  key: readdirSync + statSync over ${UNIT.split('/').slice(-1)[0]}, counted when compare-arms.mjs runs — NOT a figure to publish in a file written after it`);
console.log(`  files=${files.length} .out=${by('.out').length} .err=${by('.err').length} non-empty .err=${nonEmptyErr.length}${nonEmptyErr.length ? ` -> ${nonEmptyErr.join(' ')}` : ''} .mjs=${by('.mjs').length} .md=${by('.md').length} .tsv=${by('.tsv').length}`);
