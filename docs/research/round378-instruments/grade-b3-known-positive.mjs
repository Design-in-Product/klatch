// Round 378 — the second reading Daedalus asked for in §6 of his Round 377 memo: his B3 uses the
// pre-cure spellings AS FIXTURES and argues they are inert in that position.
//
// Run from the repo root:  node docs/research/round378-instruments/grade-b3-known-positive.mjs
//
// His B3, as shipped:
//
//   const PRECURE_374 = String.raw`[...r225Src.matchAll(/const R223B_REFUSAL = \/(.+?)\/;/g)]`;
//   const PRECURE_375 = 'occ(r225Src, `const R223B_REFUSAL = /${shortFromRegistry}/;`)';
//   const DECL_FRAGMENT = 'const R223B_REFUSAL = ';
//   check('B3', …,
//     occ(PRECURE_374,  DECL_FRAGMENT) === 1 &&          // the known positives
//     occ(PRECURE_375,  DECL_FRAGMENT) === 1 &&
//     occ(stripSource(r374Src, true), DECL_FRAGMENT) === 0 &&   // the live readings
//     occ(stripSource(r375Src, true), DECL_FRAGMENT) === 0);
//
// The question he asked is whether 377 is a member of the class it reports. On the narrow
// question — does B3's VERDICT depend on source text of a file 377 does not own — the answer is
// no, and §1 of the writeup says why. But the known positive has a different problem, and this
// instrument is the test of it: the two KP legs read the fixture RAW, while the two live legs read
// through `stripSource(…, true)`. The KP therefore does not exercise the reader the live legs
// depend on, so it cannot witness the one failure mode that would make B3 green on a live defect.
//
// The decisive experiment: take the PRE-CURE sources of 374 and 375 out of git history — the state
// in which the defect was present, by his own account — and put them through B3's live leg exactly
// as written. If the live leg reads 0 on them, B3 would have been GREEN on the defect.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const SCRIPTS = 'scripts';
const R374 = readdirSync(SCRIPTS).find((f) => f.startsWith('probe-round374-'));
const R375 = readdirSync(SCRIPTS).find((f) => f.startsWith('probe-round375-'));

// his helpers, as shipped
const occ = (hay, needle) => hay.split(needle).length - 1;
const DECL_FRAGMENT = 'const R223B_REFUSAL = ';
const PRECURE_374 = String.raw`[...r225Src.matchAll(/const R223B_REFUSAL = \/(.+?)\/;/g)]`;
const PRECURE_375 = 'occ(r225Src, `const R223B_REFUSAL = /${shortFromRegistry}/;`)';

// the commit that carried the cure, and its parent — the pre-cure state
const CURE = execFileSync('git', ['log', '-1', '--format=%H', '--grep=the 375/376 cure landed'],
  { encoding: 'utf8' }).trim();
if (!CURE) throw new Error('could not locate the curing commit by subject');
const author = execFileSync('git', ['log', '-1', '--format=%h %an %s', CURE], { encoding: 'utf8' }).trim();
console.log('curing commit (read with %an, never --oneline): ' + author);
const pre = (f) => execFileSync('git', ['show', CURE + '^:' + join(SCRIPTS, f)], { encoding: 'utf8', maxBuffer: 1 << 26 });

const rows = [];
for (const [label, f] of [['probe-round374', R374], ['probe-round375', R375]]) {
  const live = readFileSync(join(SCRIPTS, f), 'utf8');
  const before = pre(f);
  rows.push({
    label,
    preRaw: occ(before, DECL_FRAGMENT),
    preCommentBlanked: occ(stripSource(before, false), DECL_FRAGMENT),
    preBothBlanked: occ(stripSource(before, true), DECL_FRAGMENT),   // ← B3's live leg, on the defect
    liveBothBlanked: occ(stripSource(live, true), DECL_FRAGMENT),    // ← B3's live leg, as shipped
  });
}

console.log('\nB3\'s own known-positive legs, as shipped (fixture read RAW):');
console.log('   occ(PRECURE_374, DECL_FRAGMENT) = ' + occ(PRECURE_374, DECL_FRAGMENT));
console.log('   occ(PRECURE_375, DECL_FRAGMENT) = ' + occ(PRECURE_375, DECL_FRAGMENT));
console.log('\nand the same two fixtures put through the reader the LIVE legs use:');
console.log('   occ(stripSource(PRECURE_374, true), DECL_FRAGMENT) = ' + occ(stripSource(PRECURE_374, true), DECL_FRAGMENT));
console.log('   occ(stripSource(PRECURE_375, true), DECL_FRAGMENT) = ' + occ(stripSource(PRECURE_375, true), DECL_FRAGMENT));

console.log('\nthe pre-cure sources — the state in which the defect was PRESENT — read by B3\'s live leg:');
console.log('   file            pre:raw  pre:comments  pre:both  live:both');
for (const r of rows) {
  console.log('   ' + r.label.padEnd(16) + String(r.preRaw).padStart(5) +
    String(r.preCommentBlanked).padStart(13) + String(r.preBothBlanked).padStart(10) +
    String(r.liveBothBlanked).padStart(11));
}

const blindOnDefect = rows.filter((r) => r.preBothBlanked === 0);
const kpSurvivesReader = occ(stripSource(PRECURE_374, true), DECL_FRAGMENT) === 1
  && occ(stripSource(PRECURE_375, true), DECL_FRAGMENT) === 1;

console.log('\nREADINGS:');
console.log('  1. B3\'s live leg reads 0 on a PRE-CURE file for: ' +
  (blindOnDefect.length ? blindOnDefect.map((r) => r.label).join(', ') : '(neither)'));
console.log('  2. B3\'s known positives survive the reader its live legs use: ' + kpSurvivesReader);
console.log('\nVERDICT on his §6 question — is `probe-round377` a member of the class it reports?');
console.log(blindOnDefect.length
  ? '  YES on the known positive: the live leg would have read 0 on the defect itself, so the\n' +
    '  two KP legs cannot witness the failure mode the live legs have. The fixture is inert where\n' +
    '  he says it is, but it is also inert as evidence.'
  : '  Not by this route: the live leg is non-zero on the pre-cure sources, so the reading\n' +
    '  "0 beside a non-zero known positive" does distinguish cured from uncured.');
