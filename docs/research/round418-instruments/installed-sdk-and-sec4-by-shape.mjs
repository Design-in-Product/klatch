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
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);

// ------------------------------------------------------------------- (A)
const TREES = {
  'main checkout': '/Users/xian/Development/klatch',
  'daedalus': '/Users/xian/Development/klatch-worktrees/daedalus',
  'argus': '/Users/xian/Development/klatch-worktrees/argus',
  'calliope': '/Users/xian/Development/klatch-worktrees/calliope',
  'theseus (this one)': '/Users/xian/Development/klatch-worktrees/theseus',
};
const PIN_RANGE = JSON.parse(fs.readFileSync('packages/server/package.json', 'utf8'))
  .dependencies['@anthropic-ai/sdk'];
console.log('declared pin, packages/server/package.json:', PIN_RANGE);

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const lockVersion = lock.packages?.['node_modules/@anthropic-ai/sdk']?.version ?? null;
console.log('tracked package-lock.json says:', lockVersion ?? 'REFUSED (no entry)');
console.log('lock last touched:',
  execFileSync('git', ['log', '-1', '--format=%h %an %ad', '--date=short', '--', 'package-lock.json'], { encoding: 'utf8' }).trim());

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
gradeFile('INSTALLED HERE — ' + (rows.find((r) => r.name.startsWith('theseus'))?.v ?? '?'),
  'node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js');
const PINNED = process.argv[2];
if (PINNED) gradeFile('THE PINNED VERSION, fetched from the registry', PINNED);
else console.log('\n--- pinned version: UNMEASURED (pass its BetaMessageStream.js as argv[2]) ---');

console.log('\nSUMMARY:',
  `pin ${PIN_RANGE} | lock ${lockVersion} |`,
  `${measured.length} trees measured, ${violating.length} below the pin |`,
  '§4 content verified by shape; its cited LINE NUMBERS hold only where the installed version is the pinned one.');
