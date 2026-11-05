#!/usr/bin/env node
// DECLARED POST-HOC. No prediction was registered for this probe and none is claimed.
//
// It exists because P6CRIPORDER came out RED — dead — on my 7 rows: the in-call ordering reader and
// a reader that ignores the call boundary entirely both report 6/1, on the same member lists. That
// makes P5ORDER's figure no evidence at all for the boundary model I fixed in §3 of the
// pre-registration before measuring.
//
// The open question that leaves, and the only reason to run this: is the boundary EVER live in this
// tree, or is "state the ordering flag" a rule about a distinction nothing here can exhibit? A base
// rate over my 7 cannot answer it — 7 rows is too few to tell "never" from "not here".
//
// Population: every `.mjs` under docs/research at the pin that holds at least one arm-[3] match.
// For each match: does `--reverse` inside the selection's own innermost enclosing call agree with
// `--reverse` anywhere in the file?

// SECOND RUN. The first run's figures (65 matches, 52 located, 44 agree / 8 disagree, 13 "not
// located") are WITHDRAWN, not corrected — they were computed with a scanner that desynchronised
// on nested template literals and on regex literals, which produces WRONG pairs downstream of the
// desync rather than missing ones. `probe-boundary.FIRST-WITHDRAWN.out` is kept as the recording.
// This run uses scan.mjs, whose EOF guard separates "no enclosing call here" from "my scan fell
// apart" — two outcomes the first run reported as one bucket.

import { execFileSync } from 'node:child_process';
import { scanParens, enclosingInvocation, ARM3_RE } from './scan.mjs';

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) => execFileSync('git', ['-C', TOP, ...args], { encoding: 'utf8' });
const PIN = '0ae48068';

const refuse = (m) => { console.log(`REFUSE: ${m}`); process.exit(2); };

console.log('=== probe-boundary (DECLARED POST-HOC, no prediction) ===');
console.log(`pin ${PIN}`);

let files;
try {
  files = git(['ls-tree', '-r', '--name-only', PIN, 'docs/research'])
    .split('\n').filter((f) => f.endsWith('.mjs'));
} catch (e) {
  refuse(`ls-tree failed: ${e.message}`);
}
if (files.length === 0) refuse('ls-tree returned 0 .mjs files — an empty listing is not a reading');
console.log(`.mjs files under docs/research at the pin: ${files.length}`);

let filesWithArm3 = 0;
let matchesTotal = 0;
let agree = 0;
let disagree = 0;
let unlocatable = 0;
let unscannable = 0;
const disagreeRows = [];
const unlocatableRows = [];
const unscannableRows = [];
const calleeTally = new Map();

for (const f of files) {
  let src;
  try { src = git(['show', `${PIN}:${f}`]); } catch { continue; }
  ARM3_RE.lastIndex = 0;
  const ms = [...src.matchAll(ARM3_RE)];
  if (ms.length === 0) continue;
  filesWithArm3++;
  const fileWide = /--reverse/.test(src);
  const scan = scanParens(src);
  ms.forEach((m, i) => {
    matchesTotal++;
    const site = `${f.replace(/^docs\/research\//, '')}#${i + 1}`;
    // UNSCANNABLE and NOT-LOCATED are different outcomes and are counted separately. The first
    // run fused them, which is how a desynced scan passed as "this site has no enclosing call".
    if (!scan.clean) {
      unscannable++;
      unscannableRows.push(`${site}  residue lex=${scan.residue.lex} parens=${scan.residue.unclosedParens} regex=${scan.residue.unterminatedRegex}`);
      return;
    }
    const inv = enclosingInvocation(scan.pairs, src, m.index, m.index + m[0].length);
    if (!inv) { unlocatable++; unlocatableRows.push(site); return; }
    calleeTally.set(inv.name, (calleeTally.get(inv.name) ?? 0) + 1);
    const inCall = /--reverse/.test(inv.text);
    if (inCall === fileWide) agree++;
    else { disagree++; disagreeRows.push(`${site}  in-call=${inCall} file-wide=${fileWide} callee=${inv.name}()`); }
  });
}

console.log('');
const located = matchesTotal - unlocatable - unscannable;
console.log(`files holding >=1 arm-[3] match : ${filesWithArm3}`);
console.log(`arm-[3] matches total           : ${matchesTotal}`);
console.log(`  invocation located            : ${located}`);
console.log(`  invocation NOT located        : ${unlocatable}   (clean scan, genuinely no enclosing call)`);
console.log(`  file UNSCANNABLE              : ${unscannable}   (scan desynced — not read at all)`);
console.log('');
console.log(`in-call reader AGREES with file-wide : ${agree}`);
console.log(`in-call reader DISAGREES             : ${disagree}`);
if (located > 0) {
  const pct = ((disagree / located) * 100).toFixed(1);
  console.log(`disagreement rate over located sites : ${pct}%  (${disagree}/${located})`);
  console.log(`  denominator is LOCATED sites only — not the ${matchesTotal} arm-[3] matches in the tree`);
}
console.log('');
console.log('-- callee names the selection is actually invoked through --');
[...calleeTally.entries()].sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`   ${String(c).padStart(4)}  ${n}()`));

if (disagreeRows.length) {
  console.log('');
  console.log('-- sites where the BOUNDARY MODEL BITES --');
  disagreeRows.forEach((r) => console.log('   ' + r));
}
if (unlocatableRows.length) {
  console.log('');
  console.log(`-- clean scan, no locatable enclosing call (${unlocatableRows.length}) --`);
  unlocatableRows.forEach((r) => console.log('   ' + r));
}
if (unscannableRows.length) {
  console.log('');
  console.log(`-- UNSCANNABLE, refused rather than read (${unscannableRows.length}) --`);
  unscannableRows.forEach((r) => console.log('   ' + r));
}

// Is the boundary live on MY 7 specifically? The grader already says no (P6CRIPORDER dead).
// Printed here against the tree-wide set so the two figures are read together, not separately.
const MY7 = new Set([
  'round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs#1',
  'round464-instruments/grade-the-stop-condition.mjs#1',
  'unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs#1',
  'unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs#1',
  'unit-464t2-reaim-2026-10-28/recon-credit-provenance.mjs#1',
  'unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs#1',
  'unit-464vac-2026-10-31/grade-cure.mjs#1',
]);
const disagreeSites = disagreeRows.map((r) => r.split(/\s{2,}/)[0]);
const inMy7 = disagreeSites.filter((s) => MY7.has(s));
console.log('');
console.log(`disagreeing sites that are among MY 7 : ${inMy7.length} of ${MY7.size}  [${inMy7.join(', ') || 'none'}]`);

console.log('');
console.log(`BOUNDARY-LIVE-SOMEWHERE: ${disagree > 0}`);
console.log(`BOUNDARY-LIVE-ON-MY-7:   ${inMy7.length > 0}`);
console.log(`DISAGREE=${disagree} AGREE=${agree} UNLOCATABLE=${unlocatable} UNSCANNABLE=${unscannable} TOTAL=${matchesTotal}`);
