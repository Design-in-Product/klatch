#!/usr/bin/env node
/**
 * **DECLARED POST-HOC. Written after the drive, grading nothing.** The five MISSes of
 * `arm-stream-pin.mjs` stand as registered and are NOT re-keyed; this reads what moved and why.
 *
 * Both misses are the same mechanism in two places, and it is the mechanism the pin call is about:
 * **a byte figure published about this gate is a function of the tree, and this unit's own files
 * changed the tree.** One of them changed a published LIST, not just a digit.
 *
 * Nothing here drives the gate. It reads captures already on disk.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const CAPS = join(HERE, 'captures');
const NL = String.fromCharCode(10);
const B = (s) => Buffer.byteLength(s);

const read = (p) => readFileSync(p, 'utf8');
const say = (s) => console.log(s);

say('posthoc-why-both-figures-moved — a declared post-hoc; the MISSes stand as registered');
say('');

/* ---------------------------------------------------- MISS 1: A2 stderr 934 -> 1024, 10 -> 11 */
say('MISS 1  P1.A2.errbytes / P1.A2.errlines — the LAW held; my PREDICTION\'S POPULATION did not.');
const a2 = read(join(CAPS, 'a2-red-three-plants.err'));
const entryLines = a2.split(NL).filter((l) => /^ {6}\S/.test(l) && l.includes('.mjs'));
const lens = entryLines.map((l) => l.trim().length);
say(`  entry lines actually published by the drive: ${entryLines.length}`);
for (const l of entryLines) say(`     len ${String(l.trim().length).padStart(3)}  ${l.trim()}`);
const derived = 658 + lens.reduce((a, L) => a + L + 7, 0);
say(`  the literal-derived law at the ACTUAL population: 658 + SUM(len + 7) = ${derived}`);
say(`  measured stderr: ${B(a2)}   lines ${a2.split(NL).length - 1}   law lines 7 + ${lens.length} = ${7 + lens.length}`);
say(`  LAW AGREES AT THE TRUE N: ${derived === B(a2)}`);
say('');
say('  Cause, and it is a defect in the ARM and not in the law: family A never reset A1\'s plant');
say('  before adding A2\'s three, so the A2 drive ran at N=4. I registered "N=3" from the arm I');
say('  intended to write rather than from the arm I wrote — the prediction asserted a population');
say('  the drive then chose for itself. The registered prediction is REFUTED; the law it was');
say('  derived from now has a fifth and sixth in-sample datapoint (N=1 at 83, N=4) and zero');
say('  disagreements across six.');
say('');

/* ---------------------------------------------------- MISS 2: stdout 3935 -> 4005, 38 -> 39 */
say('MISS 2  P1.A*.outbytes / outlines — the published RED stdout figure went stale inside this');
say('        fire, and THIS UNIT\'S OWN FILE is what moved it.');
const a1 = read(join(CAPS, 'a1-red-one-plant.out'));
say(`  measured A1 red stdout: ${B(a1)} B / ${a1.split(NL).length - 1} lines`);
say('  predicted from the figure BOTH seats published hours earlier: 3935 B / 38 lines');
say(`  delta: ${B(a1) - 3935} B, +${a1.split(NL).length - 1 - 38} line`);
const quoted = a1.split(NL).filter((l) => l.includes('unit-502streampin'));
for (const l of quoted) say(`     the new published line: ${JSON.stringify(l)}  (${B(l) + 1} B with its newline)`);
say('');
say('  Mechanism: `derive-limb-laws.mjs` SLICES the gate\'s route-2 literal, so it necessarily');
say('  contains the exemption token inside a string. The gate\'s own `quotedOnly` list — printed');
say('  unconditionally — therefore grew from 2 files to 3, and a published LIST line is a path.');
say('  The gate says this about itself in the IRREDUCIBLE LIMIT block: "Every file that measures');
say('  this gate has to quote its key, so the instrument is the author of this class."');
say('');
say('  This is the SAME mechanism as the `21 of 41 published lines are paths` caveat, reaching the');
say('  RED report rather than the green one — and it is the strongest argument available for the');
say('  pin call, because it arrived as a refutation of my own leg rather than as an argument.');
say('  A byte figure for the red branch is no more pinnable than one for the green branch: I used');
say('  a four-hour-old published figure as an answer key and it was already stale.');
say('');

/* ---------------------------------------------------- what DID hold */
say('WHAT HELD, and it is what the recommendation should be keyed on:');
say('  - stderr bytes/lines: exact, on both limbs, from literals, at N=1, N=4 (newOnes) and');
say('    N=1, N=3 (stale) — 0 disagreements. stderr is a DEFECT report: its content is a');
say('    function of the defects, not of the tree.');
say('  - stdout: every NAMED figure read by name was correct where predicted; only the byte');
say('    COUNT and the line COUNT failed. stdout is a TREE report.');
say('  That asymmetry is the pin.');

const b1 = existsSync(join(CAPS, 'b1-stale-one-entry.out')) ? read(join(CAPS, 'b1-stale-one-entry.out')) : '';
if (b1) {
  say('');
  say('  Footnote, because it bears on the stale limb\'s own stdout: at an EMPTY population the');
  say(`  scratch copy's stdout is ${B(b1)} B / ${b1.split(NL).length - 1} lines, against 4160 / 41 green and 4005 / 39 red in`);
  say('  the real tree. Three different stdout documents from one gate. A byte figure names one.');
}
