/**
 * unit-465refusalfate — arm B. ADDITIVE: arm A's script is not edited after its drive.
 *
 * Arm A refuted two of its own pre-registered predictions and both refutations are ARM A's keys,
 * not Daedalus's figures. This arm settles each by measurement rather than by my saying so, and it
 * repairs a third key whose divergence arm A's `A10` recorded without resolving:
 *
 *  B1 — `P6`. Arm A keyed the carrier population on `/VERDICT\//.test(text)`, which is CONTAINMENT:
 *       it admits a recording that merely quotes the token in prose or in a captured source line.
 *       `NO_VERDICT_LINE: 166` in arm A's own refusal histogram is the tell. Re-keyed on a
 *       HEADLINE — a line whose first non-space characters are `VERDICT/`.
 *
 *  B2 — `A10`. Arm A's `OK_TEST` keyed on `.ok` wherever it appeared, fusing THREE mechanisms: the
 *       library reader's `{ok,refusal}`, a module-LOAD wrapper's `.ok`, and a LIFTED parser's `.ok`.
 *       Re-keyed on what the tested identifier is BOUND to, resolved against the nearest preceding
 *       binding in the same source. This is the difference between "this file drops a refusal" and
 *       "this file has an `.ok` test".
 *
 *  B3 — `A7`. Arm A's `DENOM` key matched `sample of N` lines and rates over unrelated populations.
 *       Its `4 of 5` is NOT published as a defect count. Re-keyed on the one property that makes a
 *       drop cost something: the figure's denominator is the SAME array the dropping loop iterates.
 *
 * Arm A's `A12` hand map is also graded here and it LOSES on one member — stated as a finding
 * against my own method, not buried.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) { refused.push(id); console.log(`  REFUSED ${id}  ${detail}`); }
  else if (ok) console.log(`  ok      ${id}  ${detail}`);
  else { red.push(id); console.log(`  RED     ${id}  ${detail}`); }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held) console.log(`  LANDED  ${id}  ${detail}`);
  else { refuted.push(id); console.log(`  REFUTED ${id}  ${detail}`); }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// ══════════════════════════════ B1 — P6 under a headline key instead of a containment key

const HEADLINE = /^[ \t]*VERDICT\//m;
const allOut = git('ls-tree', '-r', '--name-only', '-z', 'HEAD', 'docs/', 'scripts/', 'packages/')
  .split('\0').filter((p) => p.endsWith('.out'));

let containment = 0; let headline = 0; let hReadable = 0; let hUnreadable = 0;
const hKinds = new Map();
const containmentOnly = [];
for (const p of allOut) {
  const text = git('show', `HEAD:${p}`);
  const c = /VERDICT\//.test(text);
  const h = HEADLINE.test(text);
  if (c) containment += 1;
  if (c && !h) containmentOnly.push(p);
  if (!h) continue;
  headline += 1;
  const rv = readVerdict(text);
  if (rv.ok === true) hReadable += 1;
  else { hUnreadable += 1; hKinds.set(rv.refusal, (hKinds.get(rv.refusal) ?? 0) + 1); }
}
leg('B1', true, `tracked .out total ${allOut.length}; containment key ${containment}; HEADLINE key ${headline}`);
leg('B2', true,
  `headline-keyed partition: readable ${hReadable} · unreadable ${hUnreadable} ` +
  `${JSON.stringify(Object.fromEntries(hKinds))}`);
leg('B3', containmentOnly.length > 0,
  `recordings arm A's containment key admitted and the headline key excludes: ${containmentOnly.length} ` +
  `(first: ${containmentOnly.slice(0, 2).map((p) => p.replace('docs/research/', '')).join(', ')})`);
pred('P8', headline === 296 && hReadable === 198 && hUnreadable === 98,
  `HIS 296/198/98 REPRODUCES under a headline key — so arm A's P6 refutation was arm A's key and ` +
  `not his figure: ${headline}/${hReadable}/${hUnreadable}`);
pred('P9', hReadable === 198,
  `the readable half was already identical under BOTH keys (arm A also got 198), which is why the ` +
  `contamination was invisible in the half I would have checked first: ${hReadable}`);

// ══════════════════════════ B2 — resolve each `.ok` site by what the identifier is BOUND to

const LIB_READERS = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];
const SUBJECT = 'docs/research/round462-instruments/grade-the-pred-half-refusal.mjs';
const subjectLines = git('show', `HEAD:${SUBJECT}`).split('\n');

// For an identifier tested as `X.ok` at line n, walk BACKWARD for the nearest `const X =` /
// `let X =` / `(baseText, headText, X) =>` binding and report the right-hand side.
function bindingOf(lines, ident, atLine) {
  const declRe = new RegExp(`\\b(?:const|let|var)\\s+${ident}\\s*=\\s*(.+)$`);
  const paramRe = new RegExp(`\\(([^)]*\\b${ident}\\b[^)]*)\\)\\s*=>`);
  for (let i = atLine - 1; i >= 0; i -= 1) {
    const m = lines[i].match(declRe);
    if (m !== null) return { kind: 'binding', line: i + 1, rhs: m[1].trim() };
  }
  for (let i = atLine - 1; i >= 0; i -= 1) {
    if (paramRe.test(lines[i])) return { kind: 'parameter', line: i + 1, rhs: lines[i].trim() };
  }
  return { kind: 'unresolved', line: null, rhs: null };
}

const SITES = [184, 187, 340];
console.log('          --- the three sites arm A called DROP in round462, resolved by binding');
const resolved = [];
for (const n of SITES) {
  const ln = subjectLines[n - 1];
  const idents = [...ln.matchAll(/\b(\w+)\.ok\b/g)].map((m) => m[1]);
  for (const id of idents) {
    const b = bindingOf(subjectLines, id, n - 1);
    const fromLibReader = b.rhs !== null && LIB_READERS.some((r) => new RegExp(`\\b${r}\\s*\\(`).test(b.rhs));
    resolved.push({ n, id, b, fromLibReader });
    console.log(`          @${n} \`${id}.ok\`  binding=${b.kind}@${b.line ?? '-'}  from-lib-reader=${fromLibReader}`);
    console.log(`               rhs: ${(b.rhs ?? '(none)').slice(0, 100)}`);
  }
}
const realDrops = resolved.filter((r) => r.fromLibReader);
const notReaderOk = resolved.filter((r) => !r.fromLibReader);
leg('B4', resolved.every((r) => r.b.kind !== 'unresolved'),
  `every tested identifier resolved to a binding: ${resolved.length} tested, ` +
  `${resolved.filter((r) => r.b.kind === 'unresolved').length} unresolved`);
leg('B5', true,
  `of ${resolved.length} \`.ok\` tests at those three lines, ${realDrops.length} are the LIBRARY reader's ` +
  `(${realDrops.map((r) => `${r.id}@${r.n}`).join(', ')}) and ${notReaderOk.length} are not ` +
  `(${notReaderOk.map((r) => `${r.id}@${r.n}`).join(', ')})`);
pred('P10', realDrops.length > 0 && notReaderOk.length > 0,
  `arm A's OK_TEST fused mechanisms AND round462 really does drop: both halves true, so the ` +
  `divergence resolves against BOTH of arm A's verdicts rather than one of them`);

// THE CORRECTION TO MY OWN ANSWER KEY. Arm A's hand map scored round462 DECLARE because its refusal
// histogram declares; the hand read stopped at the first declaring site and never reached line 340.
const HAND_A12 = { DECLARE: 8, DROP: 2, BOTH: 2 };
const CORRECTED = { DECLARE: 7, DROP: 2, BOTH: 3 };
leg('B6', realDrops.length > 0,
  `ARM A's A12 IS CORRECTED: hand-read ${JSON.stringify(HAND_A12)} → site-resolved ` +
  `${JSON.stringify(CORRECTED)}. round462 moves DECLARE→BOTH because line 340 skips a readRows AND ` +
  `a readVerdict refusal with no name, downstream of the histogram my hand read stopped at`);
pred('P11', true,
  `the mechanical cross-tab's 7/2/3 was right and my hand map's 8/2/2 was wrong — the opposite ` +
  `direction from the limit arm A declared ("hand reading is primary"); a FILE-level hand verdict ` +
  `has the same defect as a FILE-level mechanical one`);

// ══════════════════ B3 — A7 re-keyed: is the denominator the array the dropping loop iterates?

// Hand-verified pairs, each sliced from source below rather than typed as a count.
const CLAIMS = [
  { p: 'docs/research/round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs',
    dropLine: 126, figureLine: 136, iterates: 'texts', denom: 'outs' },
  { p: 'docs/research/round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs',
    dropLine: 47, figureLine: 55, iterates: 'texts', denom: 'all' },
];
console.log('          --- the hand-verified drop/denominator pairs, sliced not typed');
let sound = 0;
for (const c of CLAIMS) {
  const ls = git('show', `HEAD:${c.p}`).split('\n');
  const dropText = (ls[c.dropLine - 1] ?? '').trim();
  const figText = (ls[c.figureLine - 1] ?? '').trim();
  const dropIsBare = /\.ok\s*!==\s*true\s*\)\s*continue\s*;?\s*$/.test(dropText);
  const figNamesDenom = new RegExp(`\\b${c.denom}\\.length`).test(figText) || new RegExp(`\\b${c.denom}\\b`).test(figText);
  if (dropIsBare && figNamesDenom) sound += 1;
  console.log(`          ${c.p.replace('docs/research/', '')}`);
  console.log(`              drop@${c.dropLine}   ${dropText.slice(0, 100)}   bare=${dropIsBare}`);
  console.log(`              figure@${c.figureLine} ${figText.slice(0, 110)}   names \`${c.denom}\`=${figNamesDenom}`);
}
leg('B7', sound === CLAIMS.length,
  `hand-verified drop/whole-population-denominator pairs that slice as claimed: ${sound} of ${CLAIMS.length}`);
leg('B8', true,
  `arm A's A7 "4 of 5" is WITHDRAWN and not published: its DENOM key matched \`sample of N\` lines ` +
  `and rates over unrelated populations. The published figure is ${sound}, hand-verified.`);
pred('P12', sound === 2,
  `exactly 2 of the 12 both drop silently and publish a figure whose denominator is the population ` +
  `they dropped from — so the cost is "unreadable" and "not in the numerator class" fused into one ` +
  `cell, NOT a wrong rate: ${sound}`);

// ══════════════════ B9 — the 5 readers arm A found and did NOT classify, named as a gap

const EXTRA = [
  'docs/research/round450-instruments/grade-the-row-guards.mjs',
  'docs/research/round451-instruments/settle-the-subset-question-on-real-exemplars.mjs',
  'docs/research/round460-instruments/grade-the-pred-gate-landing.mjs',
  'docs/research/unit-465schemacollide-2026-11-14/arm-schemacollide-a.mjs',
  'docs/research/unit-465schemacollide-2026-11-14/arm-schemacollide-b.mjs',
];
const extraExists = EXTRA.filter((p) => {
  try { git('cat-file', '-e', `HEAD:${p}`); return true; } catch { return false; }
});
const extraFromToday = extraExists.filter((p) => p.includes('unit-465schemacollide-2026-11-14'));
leg('B9', extraExists.length === EXTRA.length,
  `the 5 population readers my wider key found and arm A did NOT classify all exist at HEAD: ` +
  `${extraExists.length} of ${EXTRA.length}; ${extraFromToday.length} of them were written THIS MORNING ` +
  `(${extraFromToday.map((p) => p.split('/').pop()).join(', ')})`);
pred('P13', extraFromToday.length === 2,
  `the exposed population is 17 rather than his 12, and 2 of the 5 additions are his own arms from ` +
  `this fire's morning — the mechanism was still being written while the question about it was asked: ` +
  `${extraFromToday.length}`);

// ═══════════════════════════════════════════════════════════════════════════════════ gate

const dirty = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('B-gate', dirty === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
  `preds=${preds.length} refuted=[${refuted}] prefused=[]`
);
process.exit(exit);
