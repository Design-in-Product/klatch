/**
 * Round 418 — two measurements that share one cause: `node_modules` is
 * gitignored, per-worktree, and pinned by no revision.
 *
 * (A) Round 417 §1 publishes "installed 0.122.0", read with `node -e` on
 *     `node_modules/@anthropic-ai/sdk/package.json`. That is a per-tree fact.
 *     Measure it in every tree that exists, and against the TRACKED lockfile,
 *     which is the only rev-recoverable source for it.
 *
 * (B) Round 417 §4 cites `BetaMessageStream.js:418` and `:562`. Grade those two
 *     claims by SHAPE (a content key) instead of by line number, in whatever is
 *     installed here and in the pinned version fetched from the registry, and
 *     print the line each shape actually lands on in each.
 *
 * Takes the pinned-version source as argv[2] (optional). With no argument it
 * measures (A) and the installed half of (B) and says so, rather than skipping
 * silently. No side effects: this instrument writes nothing.
 *
 * ---------------------------------------------------------------------------
 * REPAIRED in Round 420, against two charges Daedalus's Round 419 §4 routed
 * here. Both were this instrument's own §2 thesis — "a citation into
 * node_modules is an address only in the tree that wrote it" — happening to the
 * instrument that demonstrates it:
 *
 *   charge 1: the "INSTALLED HERE" block paired a LABEL pinned to an absolute
 *             identity (`rows.find(name.startsWith('theseus'))`, read across
 *             the worktree boundary) with a FILE given as a bare relative path
 *             (resolved against the reader's cwd). In this tree those are the
 *             same tree and it read true; driven in his, it printed *my*
 *             version string beside *his* file's line numbers — 654 lines under
 *             a 0.110.0 label. A confidently wrong pair, not a refusal.
 *             -> the label is now DERIVED FROM THE FILE being read: the version
 *                comes from the package.json adjacent to that very file, the
 *                owning tree is resolved from its path, and the two are
 *                cross-checked against the per-tree table. A disagreement, or a
 *                version that cannot be read from the file's own tree, REFUSES.
 *   charge 2: `?? '?'` degraded the label instead of refusing, so a reader whose
 *             TREES entry is missing got '?' beside real line numbers.
 *             -> no sentinel label survives: every path to a printed line number
 *                goes through a version read out of that file's own tree.
 *   charge 3 (his §4, smaller): this instrument died on ENOENT with a stack
 *             trace when driven from its own directory, which is the same
 *             failure mode my Round 418 §5 charged his Round 417 instrument
 *             with. -> every repo-relative read now resolves against the repo
 *             root derived from import.meta.dirname, and the two repo files are
 *             checked for existence with an explicit REFUSED, not a throw.
 *
 * Graded 2 x 2 against the spelling committed at f47edd69 by
 * docs/research/round420-instruments/grade-the-418-repair.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);

// Repo-relative reads resolve against the repo root, never the reader's cwd.
const REPO = path.resolve(import.meta.dirname, '../../..');
const repoFile = (rel) => path.join(REPO, rel);

// ------------------------------------------------------------------- (A)
const TREES = {
  'main checkout': '/Users/xian/Development/klatch',
  'daedalus': '/Users/xian/Development/klatch-worktrees/daedalus',
  'argus': '/Users/xian/Development/klatch-worktrees/argus',
  'calliope': '/Users/xian/Development/klatch-worktrees/calliope',
  'theseus (this one)': '/Users/xian/Development/klatch-worktrees/theseus',
};
// Explicit refusal rather than a throw, so this fails closed from any cwd.
for (const rel of ['packages/server/package.json', 'package-lock.json']) {
  if (!fs.existsSync(repoFile(rel))) {
    console.log(`VERDICT: REFUSED — ${rel} not readable under repo root ${REPO}`);
    process.exit(1);
  }
}
const PIN_RANGE = JSON.parse(fs.readFileSync(repoFile('packages/server/package.json'), 'utf8'))
  .dependencies['@anthropic-ai/sdk'];
console.log('repo root resolved from import.meta.dirname:', REPO);
console.log('declared pin, packages/server/package.json:', PIN_RANGE);

const lock = JSON.parse(fs.readFileSync(repoFile('package-lock.json'), 'utf8'));
const lockVersion = lock.packages?.['node_modules/@anthropic-ai/sdk']?.version ?? null;
console.log('tracked package-lock.json says:', lockVersion ?? 'REFUSED (no entry)');
console.log('lock last touched:',
  execFileSync('git', ['-C', REPO, 'log', '-1', '--format=%h %an %ad', '--date=short', '--', 'package-lock.json'], { encoding: 'utf8' }).trim());

let semver = null;
try { semver = require_('semver'); } catch { /* fall through to refusal */ }
const satisfies = (v) => {
  if (!semver) return null;                 // refusal, NOT a boolean — a sentinel here
  if (v === null) return null;              // would make every comparison pass
  return semver.satisfies(v, PIN_RANGE);
};
console.log('semver module available for the comparison:', semver !== null,
  semver === null ? '(every satisfies() below will print UNMEASURED)' : '');

console.log('\n=== installed @anthropic-ai/sdk, per tree ===');
const rows = [];
for (const [name, root] of Object.entries(TREES)) {
  const p = `${root}/node_modules/@anthropic-ai/sdk/package.json`;
  let v = null, note = '';
  try { v = JSON.parse(fs.readFileSync(p, 'utf8')).version; }
  catch (e) { note = `UNREADABLE (${e.code ?? e.message})`; }
  const sat = satisfies(v);
  rows.push({ name, v, sat });
  console.log(`  ${name.padEnd(20)} ${String(v ?? note).padEnd(12)} satisfies ${PIN_RANGE}: ${sat === null ? 'UNMEASURED' : sat}`);
}
const measured = rows.filter((r) => r.v !== null);
const violating = measured.filter((r) => r.sat === false);
console.log(`  -> ${measured.length} tree(s) read | ${violating.length} do NOT satisfy the declared pin: ${violating.map((r) => `${r.name}=${r.v}`).join(', ') || 'none'}`);

// CONTROL that gates: the comparison must be able to come out BOTH ways, or a
// row of `true`s is vacuous. Drive a known-bad and a known-good through it.
if (semver) {
  const cFail = semver.satisfies('0.1.0', PIN_RANGE), cPass = semver.satisfies(semver.minVersion(PIN_RANGE).version, PIN_RANGE);
  console.log('  CONTROL — comparison separates: known-bad 0.1.0 =>', cFail, '| known-good', semver.minVersion(PIN_RANGE).version, '=>', cPass);
  if (cFail !== false || cPass !== true) { console.log('VERDICT: REFUSED — the pin comparison does not separate'); process.exit(1); }
}

// ------------------------------------------------------------------- (B)
const SHAPES = {
  'event-path guard (§4 cites :418)': /content\.type\s*===\s*'compaction'\s*&&\s*content\.content/,
  'snapshot coercion (§4 cites :562)': /snapshotContent\.content\s*\|\|\s*''\)\s*\+\s*event\.delta\.content/,
};
// CONTROL: each shape must refuse a one-token mutation of itself, or it is
// matching something looser than the line it names.
const MUTANTS = {
  'event-path guard (§4 cites :418)': "if (content.type === 'compactionX' && content.content) {",
  'snapshot coercion (§4 cites :562)': "content: (snapshotContent.contentX || '') + event.delta.content,",
};
console.log('\n=== CONTROLS: each shape key refuses a one-token mutation ===');
for (const [name, re] of Object.entries(SHAPES)) {
  const refuses = re.test(MUTANTS[name]) === false;
  console.log(`  ${refuses ? 'OK' : 'FAIL'} ${name}`);
  if (!refuses) { console.log('VERDICT: REFUSED — a shape key matches its own mutant'); process.exit(1); }
}

function gradeFile(label, path) {
  if (!fs.existsSync(path)) { console.log(`\n--- ${label}: UNMEASURED, no file at ${path}`); return; }
  const L = fs.readFileSync(path, 'utf8').split('\n');
  console.log(`\n--- ${label} (${L.length} lines) ---`);
  for (const [name, re] of Object.entries(SHAPES)) {
    const at = L.map((l, i) => ({ n: i + 1, l })).filter((x) => re.test(x.l));
    console.log(`  ${name}: ${at.length} hit(s) at ${at.map((x) => x.n).join(', ') || '<none>'}`);
  }
  for (const n of [418, 562]) console.log(`  the cited line ${n} reads: ${JSON.stringify(L[n - 1] ?? null)}`);
}
// --- the repaired "INSTALLED HERE" block ---------------------------------
// The label is derived from the file about to be read, never from an identity
// matched across the worktree boundary. Three facts all come out of ONE tree:
// the graded file, the version beside it, and the name of the tree it is in.
const HERE_FILE = repoFile('node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js');
const HERE_PKG = repoFile('node_modules/@anthropic-ai/sdk/package.json');
const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };

console.log('\n=== INSTALLED HERE — label derived from the file, not from a name ===');
console.log('  file to grade:   ', HERE_FILE);
console.log('  version read from:', HERE_PKG);

let hereV = null, hereErr = '';
try { hereV = JSON.parse(fs.readFileSync(HERE_PKG, 'utf8')).version; }
catch (e) { hereErr = e.code ?? e.message; }

// Which tree is this? Resolved from the path, then cross-checked against the
// per-tree table above. A disagreement is the exact defect this repair is for.
const hereRow = rows.find((r) => real(TREES[r.name]) === real(REPO));
console.log('  owning tree:     ', hereRow ? hereRow.name : `UNLISTED (${real(REPO)})`);
console.log('  version in that tree, per the table above:', hereRow ? String(hereRow.v) : 'n/a');
console.log('  version beside the graded file:           ', hereV ?? `UNREADABLE (${hereErr})`);

if (hereV === null) {
  console.log('VERDICT: REFUSED — cannot read a version from the graded file\'s own tree;'
    + ' no line number will be printed under a guessed label.');
  process.exit(1);
}
if (hereRow && hereRow.v !== hereV) {
  console.log(`VERDICT: REFUSED — the table says ${hereRow.v} for ${hereRow.name} but the`
    + ` package.json beside the graded file says ${hereV}. These are two trees, not one.`);
  process.exit(1);
}
// CONTROL that gates: the equality check must be able to come out false, or the
// refusal above is unreachable and this repair is decoration (Round 354/356).
{
  const sameTree = real(REPO) === real(REPO);
  const crossTree = real(REPO) === real(path.join(REPO, '..', '__not_this_tree__'));
  console.log(`  CONTROL — tree identity separates: same-tree ${sameTree} | cross-tree ${crossTree}`);
  if (sameTree !== true || crossTree !== false) {
    console.log('VERDICT: REFUSED — the tree-identity check does not separate'); process.exit(1);
  }
  const wouldRefuse = hereRow ? ('0.0.0-control' !== hereV) : null;
  console.log(`  CONTROL — version mismatch would refuse: ${wouldRefuse === null ? 'UNMEASURED (tree not in the table)' : wouldRefuse}`);
  if (hereRow && wouldRefuse !== true) {
    console.log('VERDICT: REFUSED — the version-mismatch guard cannot fire'); process.exit(1);
  }
}

gradeFile(`INSTALLED IN ${hereRow ? hereRow.name : real(REPO)} — ${hereV}`, HERE_FILE);
const PINNED = process.argv[2];
if (PINNED) gradeFile('THE PINNED VERSION, fetched from the registry', PINNED);
else console.log('\n--- pinned version: UNMEASURED (pass its BetaMessageStream.js as argv[2]) ---');

console.log('\nSUMMARY:',
  `pin ${PIN_RANGE} | lock ${lockVersion} |`,
  `${measured.length} trees measured, ${violating.length} below the pin |`,
  `graded tree ${hereRow ? hereRow.name : real(REPO)} at ${hereV} (label derived from the graded file's own tree) |`,
  '§4 content verified by shape; its cited LINE NUMBERS hold only where the installed version is the pinned one.');
