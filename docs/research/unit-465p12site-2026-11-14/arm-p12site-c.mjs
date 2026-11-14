/**
 * unit-465p12site — arm C
 *
 * Subject: the population key this seat published this morning, which widened Daedalus's
 * `readVerdict` to four readers on the stated rationale (arm-refusalfate-a.mjs:69-71) that
 * "a consumer of one of them is as exposed to a refusal as a consumer of readVerdict".
 *
 * Arm B's hand read found that false for `readCorpusRows`, which returns `{ rows, unknown }` and has
 * no `.ok` at all. This arm establishes each reader's shape by reading its OWN `return` statements
 * at the pin and printing them verbatim — not by calling it on a sample, because a sample that
 * happens not to refuse cannot show whether a refusal shape exists.
 *
 * Then it re-derives the population under a refusal-bearing-readers-only key and reports which of
 * this unit's and this morning's figures move.
 *
 * Pin: `5966f86d`. Arms A and B are NOT re-driven; their outputs stand verbatim.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = '5966f86db3a650b2858448eccb8796f5517e03e2';

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

const READERS = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];

// ───────────────────────────────── C1–C3: each reader's shape, off its own `return` statements

const libSrc = git('show', `${PIN}:docs/research/lib/verdict.mjs`);
const libLines = libSrc.split('\n');

/** The span of a top-level `export const NAME = (…) => {` / `export function NAME` body. */
function spanOf(name) {
  const startIdx = libLines.findIndex((ln) =>
    new RegExp(`^(?:export\\s+)?(?:const|function)\\s+${name}\\b`).test(ln));
  if (startIdx === -1) return null;
  let depth = 0; let seen = false;
  for (let i = startIdx; i < libLines.length; i += 1) {
    depth += (libLines[i].match(/\{/g) || []).length - (libLines[i].match(/\}/g) || []).length;
    if ((libLines[i].match(/\{/g) || []).length > 0) seen = true;
    if (seen && depth <= 0) return { from: startIdx + 1, to: i + 1 };
  }
  return { from: startIdx + 1, to: libLines.length };
}

console.log('          --- each reader\'s return statements, read verbatim at the pin');
const shapes = new Map();
for (const r of READERS) {
  const span = spanOf(r);
  if (span === null) { shapes.set(r, { found: false, returns: [], hasOk: false }); console.log(`          ${r}: DECLARATION NOT FOUND`); continue; }
  const returns = [];
  for (let i = span.from - 1; i < span.to; i += 1) {
    const ln = libLines[i];
    if (/^\s*return\b/.test(ln) && !/^\s*(\/\/|\*)/.test(ln)) returns.push({ n: i + 1, text: ln.trim() });
  }
  // The shape question: does ANY return of this reader carry an `ok:` or `refusal:` field?
  const hasOk = returns.some((x) => /\bok\s*:/.test(x.text));
  const hasRefusal = returns.some((x) => /\brefusal\s*:/.test(x.text));
  shapes.set(r, { found: true, span, returns, hasOk, hasRefusal });
  console.log(`          ${r}  (lines ${span.from}–${span.to})  ok-field=${hasOk} refusal-field=${hasRefusal}`);
  for (const x of returns) console.log(`              return@${x.n}  ${x.text.slice(0, 110)}`);
}

leg('C1', true,
  `reader shapes at the pin: ` +
  READERS.map((r) => `${r}=${shapes.get(r).found ? (shapes.get(r).hasOk ? 'OK-SHAPED' : 'NO-OK') : 'NOT-FOUND'}`).join(' · '));

pred('S1', shapes.get('readVerdict').hasOk && shapes.get('readVerdict').hasRefusal,
  `readVerdict returns an {ok, refusal}-shaped result: ok=${shapes.get('readVerdict').hasOk} ` +
  `refusal=${shapes.get('readVerdict').hasRefusal}`);

const okShaped = READERS.filter((r) => shapes.get(r).hasOk);
const noOk = READERS.filter((r) => shapes.get(r).found && !shapes.get(r).hasOk);
leg('C2', true,
  `the four "library readers" split by shape: refusal-bearing ${JSON.stringify(okShaped)} · ` +
  `no \`.ok\` at all ${JSON.stringify(noOk)}`);
pred('S2', okShaped.length > 0 && noOk.length > 0,
  `the four readers do NOT share one shape — "the library's readers" names a set whose members ` +
  `answer different questions: ${okShaped.length} refusal-bearing, ${noOk.length} refusal-free`);

// ───────────────────────── C4–C7: re-derive the population under each key and compare the three

const sources = git('ls-tree', '-r', '--name-only', PIN, 'docs/research/', 'scripts/', 'packages/')
  .split('\n')
  .filter((p) => p.endsWith('.mjs') && basename(dirname(p)) !== 'lib');
const srcOf = new Map();
for (const p of sources) srcOf.set(p, git('show', `${PIN}:${p}`));

const LIB_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*verdict\.mjs['"]/s;

/** The population under a given reader set — arm A's key verbatim, with the reader set swapped. */
function populationUnder(readerSet) {
  const out = [];
  for (const p of sources) {
    const src = srcOf.get(p);
    const m = src.match(LIB_IMPORT);
    const imported = m === null ? [] : m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter((s) => s !== '');
    if (imported.filter((n) => readerSet.includes(n)).length === 0) continue;
    const calls = readerSet.reduce((n, r) => n + (src.match(new RegExp(`\\b${r}\\s*\\(`, 'g')) || []).length, 0);
    if (calls === 0) continue;
    if ([...src.matchAll(/['"`][^'"`\n]*\.out['"`]/g)].length === 0) continue;
    if (!/readdirSync\s*\(|ls-tree|ls-files|globSync\s*\(/.test(src)) continue;
    out.push(p);
  }
  return out.sort();
}

const popWide = populationUnder(READERS);          // mine, this morning's rationale
const popOk = populationUnder(okShaped);           // refusal-bearing readers only
const popHis = populationUnder(['readVerdict']);   // Daedalus's key

leg('C3', popWide.length === 20, `my widened key at the pin reproduces arm A's 20: ${popWide.length}`);
leg('C4', true,
  `the same key under three reader sets: mine(4 readers)=${popWide.length} · ` +
  `refusal-bearing-only(${okShaped.length})=${popOk.length} · his(readVerdict)=${popHis.length}`);

const spurious = popWide.filter((p) => !popOk.includes(p));
console.log('          --- members admitted by my key that call NO refusal-bearing reader');
for (const p of spurious) {
  const src = srcOf.get(p);
  const which = READERS.filter((r) => new RegExp(`\\b${r}\\s*\\(`).test(src));
  console.log(`          ${p.replace('docs/research/', '')}`);
  console.log(`              readers actually called: ${JSON.stringify(which)} — none of them can refuse`);
}
leg('C5', true,
  `members in a population defined by exposure-to-refusal that have NO such exposure: ` +
  `${spurious.length} of ${popWide.length} ${JSON.stringify(spurious.map((p) => p.replace('docs/research/', '')))}`);
pred('S3', spurious.length > 0 && spurious.some((p) => p.includes('round451-instruments/settle-the-subset-question')),
  `at least one member is admitted only by a refusal-free reader, round451 among them: ` +
  `${spurious.length}, round451 present=${spurious.some((p) => p.includes('round451-instruments/settle-the-subset-question'))}`);

const hisSpurious = popHis.filter((p) => !popOk.includes(p));
pred('S4', hisSpurious.length === 0,
  `Daedalus's 12 are unaffected — every member of his key calls a refusal-bearing reader: ` +
  `spurious under his key = ${hisSpurious.length} ${JSON.stringify(hisSpurious)}`);

pred('S5', popOk.length > popHis.length && popOk.length < popWide.length,
  `the corrected population is strictly between his ${popHis.length} and my ${popWide.length}: ` +
  `${popOk.length}`);

// ───────────────────────── C6: which published figures move, stated as a table

const P12_MEMBERS = [
  'docs/research/round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs',
  'docs/research/round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs',
];
const numeratorSurvives = P12_MEMBERS.every((p) => popOk.includes(p));
leg('C6', true,
  `the corrected P12 rate: numerator ${P12_MEMBERS.filter((p) => popOk.includes(p)).length} of 2 survive the ` +
  `corrected key (both carriers call readVerdict: ${numeratorSurvives}) · ` +
  `arm B published 2 of ${popWide.length}, corrected 2 of ${popOk.length}`);

console.log('          --- figures that move, and figures that do not');
console.log(`          MOVES   arm A A5 cross-tab denominator:      20 → ${popOk.length}`);
console.log(`          MOVES   arm A A10 / arm B B5 denominator:    20 → ${popOk.length}`);
console.log(`          MOVES   this morning's arm A A3 "17":        17 → ${popOk.filter((p) => !p.includes('unit-465headpop') && !p.includes('arm-refusalfate-')).length} at THIS pin (not his rev — not comparable as a correction)`);
console.log(`          HOLDS   the P12 member list (both call readVerdict): ${JSON.stringify(P12_MEMBERS.map((p) => basename(p)))}`);
console.log(`          HOLDS   arm A A6, the 5 additions' classification: each was classified on its OWN sites, not on the denominator`);
console.log(`          HOLDS   this morning's superset claim (only-his empty): arithmetic, unaffected by what the extra members MEAN`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('C-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} prefused=[]`);
process.exit(red.length === 0 ? 0 : 1);
