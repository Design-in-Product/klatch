/**
 * unit-465refusalfate — arm A
 *
 * Subject: Daedalus's 2026-11-14 §5 first bullet — "whether the other 11 of 12 population readers
 * DECLARE the refusal or DROP it".
 *
 * Two things this arm does that the question as asked does not:
 *
 *  1. It re-derives the 17 / 15 / 12 under an independently written key rather than reading his
 *     member list in as a literal. His list is loaded only as a FOIL and compared.
 *  2. It classifies **call sites**, not files. The hand read (12 members, all 12 read, recorded in
 *     RESULTS.md with a verbatim slice each) found at least one file that both drops a refusal in
 *     its population loop and names refusals elsewhere, so a per-FILE verdict cannot be stated.
 *
 * Mechanical keys, both positive, no fall-through bucket:
 *
 *   - `bareSkip`: a line that tests a reader result's `.ok` and, ON THE SAME LINE, skips with
 *     `continue` / `return` and does not mention `.refusal`. Exact; no proximity window.
 *   - `refusalMention`: an occurrence of `.refusal`, which in these files can only come from a
 *     reader result.
 *
 * The cross-tab of the two is the published shape. The HAND MAP is the answer key and the
 * mechanical cross-tab is graded against it — not the other way round (12 is a small population).
 *
 * Declared limits: a source key cannot see a refusal dropped dynamically, and `refusalMention` is a
 * presence key over the file, so a file that mentions `.refusal` only in a comment would be scored
 * as naming one. Both are asserted against the hand map, which is where that would show up.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const THIS_UNIT = 'docs/research/unit-465refusalfate-2026-11-14/';

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

// ─────────────────────────────────────────── A1–A3: re-derive his 17 / 15 / 12 under my own key

const sources = git('ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/', 'scripts/', 'packages/')
  .split('\n')
  .filter((p) => p.endsWith('.mjs') && !p.startsWith(THIS_UNIT) && basename(dirname(p)) !== 'lib');

const srcOf = new Map();
for (const p of sources) srcOf.set(p, git('show', `HEAD:${p}`));

// My key for "imports the library's reader": any named import of a read* function from a
// verdict.mjs path. His key named `readVerdict` specifically; mine admits readTail/readRows/
// readCorpusRows too, because those are the library's readers as well and a consumer of one of them
// is as exposed to a refusal as a consumer of readVerdict.
const LIB_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*verdict\.mjs['"]/s;
const READERS = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];

const rows = [];
for (const p of sources) {
  const src = srcOf.get(p);
  const m = src.match(LIB_IMPORT);
  const imported = m === null ? [] : m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter((s) => s !== '');
  const importedReaders = imported.filter((n) => READERS.includes(n));
  if (importedReaders.length === 0) continue;
  const calls = READERS.reduce((n, r) => n + (src.match(new RegExp(`\\b${r}\\s*\\(`, 'g')) || []).length, 0);
  const quotedOut = [...src.matchAll(/['"`][^'"`\n]*\.out['"`]/g)].length;
  const enumHow = /readdirSync\s*\(/.test(src) ? 'readdirSync'
    : /ls-tree/.test(src) ? 'ls-tree'
    : /ls-files/.test(src) ? 'ls-files'
    : /globSync\s*\(/.test(src) ? 'globSync' : null;
  rows.push({ p, importedReaders, calls, quotedOut, enumHow });
}

const libConsumers = rows.filter((r) => r.calls > 0);
const recordingConsumers = libConsumers.filter((r) => r.quotedOut > 0);
const walkers = recordingConsumers.filter((r) => r.enumHow !== null);

leg('A1', true, `library-reader importers that call one: ${libConsumers.length} (his C5 = 17)`);
leg('A2', true, `of those, naming a quoted .out literal: ${recordingConsumers.length} (his C6 = 15)`);
leg('A3', true, `of those, enumerating a population: ${walkers.length} (his C7 = 12)`);

// His 12, loaded as a FOIL and compared member-for-member, not used as my population.
const HIS_12 = [
  'docs/research/round448-instruments/census-pred-occupancy.mjs',
  'docs/research/round448-instruments/grade-the-four-list-scorer.mjs',
  'docs/research/round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs',
  'docs/research/round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs',
  'docs/research/round452-instruments/no-id-class-separates-and-the-liveness-reader-is-cured.mjs',
  'docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs',
  'docs/research/round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs',
  'docs/research/round462-instruments/grade-the-pred-half-refusal.mjs',
  'docs/research/round462-instruments/recon.mjs',
  'docs/research/round463-instruments/grade-the-57-of-461-class.mjs',
  'docs/research/round463-instruments/recon.mjs',
  'docs/research/round463-instruments/which-residue-member-postdates.mjs',
];
const mine = walkers.map((r) => r.p).sort();
const onlyHis = HIS_12.filter((p) => !mine.includes(p));
const onlyMine = mine.filter((p) => !HIS_12.includes(p));
leg('A4', true,
  `member-for-member vs his 12: mine=${mine.length} his=${HIS_12.length} only-his=${JSON.stringify(onlyHis)} only-mine=${JSON.stringify(onlyMine)}`);
pred('P1', libConsumers.length === 17 && recordingConsumers.length === 15 && walkers.length === 12
  && onlyHis.length === 0 && onlyMine.length === 0,
  `his 17/15/12 reproduce under an independently written key AND the member lists are identical: ` +
  `${libConsumers.length}/${recordingConsumers.length}/${walkers.length}, set-diff ${onlyHis.length + onlyMine.length}`);

// ───────────────────────────────── A5: the per-SITE classification, with every site printed

// A bare skip: a `.ok` test that skips on the same line and carries no `.refusal`.
const BARE_SKIP = /\.ok\s*(?:!==\s*true|===\s*false|\)|\s*===\s*true)[^\n]*\b(?:continue|return)\b[^\n]*$/;
const OK_TEST = /\.ok\s*(?:!==|===)\s*(?:true|false)|\(\s*!\s*\w+\.ok\b|&&\s*!\s*\w+\.ok\b/;

const SUBJECTS = mine.length === 12 ? mine : HIS_12;
const classified = [];
console.log('          --- every `.ok` test in each of the 12, with its fate on that line');
for (const p of SUBJECTS) {
  const lines = (srcOf.get(p) ?? git('show', `HEAD:${p}`)).split('\n');
  const sites = [];
  lines.forEach((ln, i) => {
    if (!OK_TEST.test(ln)) return;
    const codeOnly = ln.replace(/^\s*(\/\/|\*).*$/, '');
    if (codeOnly === '') return;
    const bare = BARE_SKIP.test(ln) && !/\.refusal/.test(ln);
    sites.push({ n: i + 1, bare, names: /\.refusal/.test(ln), text: ln.trim() });
  });
  const bareSkips = sites.filter((s) => s.bare);
  const namingSites = sites.filter((s) => s.names);
  const refusalMentions = (srcOf.get(p).match(/\.refusal/g) || []).length;
  classified.push({ p, sites: sites.length, bareSkips: bareSkips.length, namingSites: namingSites.length, refusalMentions });
  console.log(`          ${p.replace('docs/research/', '')}`);
  console.log(`              sites=${sites.length} bare-skip=${bareSkips.length} naming=${namingSites.length} .refusal-mentions=${refusalMentions}`);
  for (const s of bareSkips) console.log(`              DROP@${s.n}   ${s.text.slice(0, 110)}`);
  for (const s of namingSites.slice(0, 2)) console.log(`              NAME@${s.n}   ${s.text.slice(0, 110)}`);
}

const dropsOnly = classified.filter((c) => c.bareSkips > 0 && c.refusalMentions === 0);
const namesOnly = classified.filter((c) => c.bareSkips === 0 && c.refusalMentions > 0);
const both = classified.filter((c) => c.bareSkips > 0 && c.refusalMentions > 0);
const neither = classified.filter((c) => c.bareSkips === 0 && c.refusalMentions === 0);

leg('A5', dropsOnly.length + namesOnly.length + both.length + neither.length === classified.length,
  `cross-tab partitions all ${classified.length}: drops-only=${dropsOnly.length} names-only=${namesOnly.length} ` +
  `BOTH=${both.length} neither=${neither.length}`);
leg('A6', true, `the BOTH cell, which a per-file verdict cannot state: ${JSON.stringify(both.map((c) => c.p.replace('docs/research/', '')))}`);
pred('P2', namesOnly.length + both.length > 1,
  `the declaring count is strictly greater than his 1 hand-check: names-only=${namesOnly.length} plus both=${both.length}`);
pred('P3', dropsOnly.length + both.length > 0,
  `at least one member drops a refusal with a bare same-line skip: ${dropsOnly.length + both.length} do`);
pred('P5', both.length > 0,
  `no member can be classified from the \`!ok\` test alone — the BOTH cell is non-empty (${both.length}), ` +
  `so the fate is decided per SITE and a per-file key must refuse`);

// ─────────────────────── A7: the published-denominator question, the thing the drop actually costs

// For each file with a bare skip, does it ALSO publish a count of the population it skipped from?
// Keyed on a `of ${...length}` / `of ' + ...length` shape in an emitted string on any line.
const DENOM = /\bof\s*(?:\$\{|'\s*\+\s*|"\s*\+\s*)[^\n]*\.length/;
console.log('          --- for each dropping member, whether a whole-population denominator is published beside the figure');
const denomRows = [];
for (const c of [...dropsOnly, ...both]) {
  const lines = srcOf.get(c.p).split('\n');
  const hits = lines.map((ln, i) => ({ n: i + 1, ln })).filter((x) => DENOM.test(x.ln) && /console\.log|leg\(|say\(|`/.test(x.ln));
  denomRows.push({ p: c.p, hits: hits.length });
  console.log(`          ${c.p.replace('docs/research/', '')}  whole-population-denominator sites = ${hits.length}`);
  for (const h of hits.slice(0, 3)) console.log(`              @${h.n}  ${h.ln.trim().slice(0, 120)}`);
}
leg('A7', true,
  `dropping members that publish a figure against a whole-population denominator: ` +
  `${denomRows.filter((r) => r.hits > 0).length} of ${denomRows.length}`);

// ───────────────────────────────────────────── A8: P6 — re-derive his 98 / 198 partition

const { readVerdict } = await import('../lib/verdict.mjs');
const allOut = git('ls-tree', '-r', '--name-only', '-z', 'HEAD', 'docs/', 'scripts/')
  .split('\0').filter((p) => p.endsWith('.out'));
let carry = 0; let readable = 0; let unreadable = 0;
const kinds = new Map();
for (const p of allOut) {
  const text = git('show', `HEAD:${p}`);
  if (!/VERDICT\//.test(text)) continue;
  carry += 1;
  const rv = readVerdict(text);
  if (rv.ok === true) readable += 1;
  else { unreadable += 1; kinds.set(rv.refusal, (kinds.get(rv.refusal) ?? 0) + 1); }
}
leg('A8', true,
  `tracked .out carrying a VERDICT/ headline: ${carry}; readable ${readable}; unreadable ${unreadable} ` +
  `${JSON.stringify(Object.fromEntries(kinds))}`);
pred('P6', carry === 296 && readable === 198 && unreadable === 98,
  `his 296 / 198 readable / 98 unreadable partition reproduces: ${carry} / ${readable} / ${unreadable}`);

// ──────────────────────────────────────── A9: P7 — is any member's ls-tree population cwd-sensitive?

const unpinned = [];
for (const c of classified) {
  const src = srcOf.get(c.p);
  if (!/ls-tree/.test(src)) continue;
  // The pin can be on the argv array (`'-C', ROOT`) or via a cwd option on the exec call.
  const pinned = /['"]-C['"]/.test(src) || /\bcwd\s*:/.test(src);
  if (!pinned) unpinned.push(c.p);
}
leg('A9', true,
  `members enumerating with ls-tree and carrying NO -C/cwd pin: ${unpinned.length} ` +
  `${JSON.stringify(unpinned.map((p) => p.replace('docs/research/', '')))}`);
pred('P7', unpinned.length > 0,
  `at least one of the 12 runs ls-tree with no -C pin, making its population cwd-sensitive: ${unpinned.length}`);

// ───────────────────────────────── A10: grade the mechanical cross-tab against the HAND MAP

// The hand map. Every one of the 12 was opened and read this fire; the verbatim slice for each is
// in RESULTS.md. This is the answer key, and the mechanical cross-tab above is what gets graded.
const HAND = {
  'round448-instruments/census-pred-occupancy.mjs': 'DECLARE',
  'round448-instruments/grade-the-four-list-scorer.mjs': 'BOTH',
  'round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs': 'DROP',
  'round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs': 'DROP',
  'round452-instruments/no-id-class-separates-and-the-liveness-reader-is-cured.mjs': 'BOTH',
  'round456-instruments/drift-census-over-the-verdict-publishing-population.mjs': 'DECLARE',
  'round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs': 'DECLARE',
  'round462-instruments/grade-the-pred-half-refusal.mjs': 'DECLARE',
  'round462-instruments/recon.mjs': 'DECLARE',
  'round463-instruments/grade-the-57-of-461-class.mjs': 'DECLARE',
  'round463-instruments/recon.mjs': 'DECLARE',
  'round463-instruments/which-residue-member-postdates.mjs': 'DECLARE',
};
const mech = (c) => (c.bareSkips > 0 && c.refusalMentions > 0) ? 'BOTH'
  : c.bareSkips > 0 ? 'DROP'
  : c.refusalMentions > 0 ? 'DECLARE' : 'NEITHER';
const disagree = [];
console.log('          --- hand map vs mechanical cross-tab, member by member');
for (const c of classified) {
  const k = c.p.replace('docs/research/', '');
  const h = HAND[k] ?? '(not in hand map)';
  const m = mech(c);
  if (h !== m) disagree.push(`${k}: hand=${h} mech=${m}`);
  console.log(`          ${h === m ? 'agree   ' : 'DIVERGE '} hand=${h.padEnd(8)} mech=${m.padEnd(8)} ${k}`);
}
leg('A10', true, `hand/mechanical divergences: ${disagree.length} ${JSON.stringify(disagree)}`);
leg('A11', Object.keys(HAND).length === 12 && classified.length === 12,
  `the hand map covers every member and only members: hand=${Object.keys(HAND).length} population=${classified.length}`);

const handDeclare = Object.values(HAND).filter((v) => v === 'DECLARE').length;
const handDrop = Object.values(HAND).filter((v) => v === 'DROP').length;
const handBoth = Object.values(HAND).filter((v) => v === 'BOTH').length;
leg('A12', handDeclare + handDrop + handBoth === 12,
  `THE ANSWER TO HIS §5, hand-read: DECLARE ${handDeclare} · DROP ${handDrop} · BOTH ${handBoth} of 12`);

// ───────────────────────────────────────────────────────────────────────────────── gate

const dirty = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('A-gate', dirty === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
  `preds=${preds.length} refuted=[${refuted}] prefused=[]`
);
process.exit(exit);
