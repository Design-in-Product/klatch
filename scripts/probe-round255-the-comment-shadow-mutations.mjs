/**
 * Mutation drive for Round 255. Green is not health (Round 247 §4): each mutation
 * restores a specific defect this change removed and names the arm that must go
 * red. A mutation nothing catches is reported as SURVIVED.
 *
 * Reads the vitest JSON reporter, never stdout text — Round 249's third fault.
 * Same shape as `probe-round253-the-db-path-mutations.mjs`, deliberately.
 *
 * Two things are new here, both taken from Theseus's Round 254 §1 the day he
 * filed it rather than noted for later:
 *
 * 1. **A `NO-OP MUTATION` verdict.** An anchor can match exactly once and still
 *    leave the file byte-identical — `from` and `to` differing only in something
 *    the edit does not actually change. That mutation runs the suite, passes, and
 *    reports SURVIVED, which reads as "an arm is missing" when the truth is "no
 *    defect was ever introduced." Two different repairs; the old driver could not
 *    tell them apart.
 * 2. **No anchor contains comment text.** His M2 died of a comment rewording,
 *    which is a thing a mutation should be structurally incapable of. Every
 *    `from` below is statement text only.
 *
 * The subject is `scripts/lib/probe-source-constants.mts`, so unlike Rounds 251
 * and 253 nothing under `packages/` is written at all — the sha guard covers the
 * lib module, and `git status --porcelain` covers everything else.
 *
 * M1 is the headline. It makes `maskComments` the identity function, which is
 * exactly the pre-Round-255 reader: first `const <name> = …` in byte order wins,
 * comment or code. If that survives, this round's test file is decoration.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(REPO, 'scripts/lib/probe-source-constants.mts');
const TEST = 'src/__tests__/round255-a-comment-is-not-a-declaration.test.ts';
const OUT = path.join(REPO, '.testdata/round255-mutate-result.json');

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const TARGETS = { 'probe-source-constants.mts': LIB };
const before = Object.fromEntries(Object.entries(TARGETS).map(([k, p]) => [k, sha(p)]));

/**
 * The working-tree control compares the porcelain **before against after**, not
 * against empty. Round 253's own controls arm asserted `git status --porcelain
 * packages/` was empty and went red on the run that proved the remedy worked —
 * the window could not tell the drive from the operator. The invariant this
 * driver is entitled to is "the drive left the tree as it found it," and that is
 * the one measured here. Its known hole is unchanged and still named: gitignored
 * writes (`.testdata/`) are invisible to git, so this control cannot see them —
 * Theseus, Round 252 §6.2.
 */
const porcelain = () =>
  execFileSync('git', ['status', '--porcelain', 'packages/', 'scripts/'], { cwd: REPO }).toString();
const treeBefore = porcelain();

const MUTATIONS = [
  {
    name: 'M1 make maskComments the identity — the pre-255 reader, restored verbatim',
    file: LIB,
    from: 'export function maskComments(src: string): string {\n  const out = src.split(\'\');',
    to: 'export function maskComments(src: string): string {\n  if (src) return src;\n  const out = src.split(\'\');',
    expect: 'reads the code declaration, not the comment above it',
  },
  {
    name: 'M2 prefer the first site instead of refusing two — the guess this module exists to refuse',
    file: LIB,
    from: '  if (sites.length > 1) {',
    to: '  if (sites.length > 99) {',
    expect: 'refuses two code declarations rather than preferring the first',
  },
  {
    name: 'M3 treat comment-only as simply absent — a different refusal, and the wrong one',
    file: LIB,
    from: '  if (INITIALISER(name).test(src)) {',
    to: '  if (false) {',
    expect: 'refuses a name that exists only inside comments rather than reading one',
  },
  {
    name: 'M4 drop the escape skip in the string scanner — an escaped quote closes the string',
    file: LIB,
    from: "    if (c === '\\\\') { i += 2; continue; }",
    to: '    // escape skip removed by M4',
    expect: 'does not let an escaped quote close a string early',
  },
  {
    name: 'M5 blank string contents too — masking more than comments hides declarations',
    file: LIB,
    from: "    if (c === mode) { mode = 'code'; i += 1; continue; }",
    to: "    if (c === mode) { mode = 'code'; i += 1; continue; }\n    out[i] = ' ';",
    // First aimed at 'does not treat // inside a string as a comment'; the drive reported
    // CAUGHT-but-not-by-the-aimed-arm and named this one instead, which is the arm that
    // actually covers it. The aim was corrected to what the run measured, not the other way.
    expect: 'leaves string contents standing',
  },
  {
    name: 'M8 never enter string mode — // inside a URL literal starts a comment',
    file: LIB,
    from: "      if (c === \"'\" || c === '\"' || c === '`') { mode = c; i += 1; continue; }",
    to: '      // string entry removed by M8',
    expect: 'does not treat // inside a string as a comment',
  },
  {
    name: 'M6 splice at the first raw match again — the write path that patched the comment',
    file: LIB,
    from: '    src.slice(0, site.initStart) + newExpr + trailing + src.slice(site.initStart + site.init.length);',
    to: '    src.replace(INITIALISER(name), (_a, init) => _a.slice(0, _a.length - init.length) + newExpr + trailing);',
    expect: 'patches the code declaration and leaves the quoting comment alone',
  },
  {
    name: 'M7 wire readLeadingFactorFromFile to the wrong reader — the export nothing called',
    file: LIB,
    from: '  return readLeadingFactor(fs.readFileSync(file, \'utf8\'), name, what);',
    to: '  return readNumericConstant(fs.readFileSync(file, \'utf8\'), name, what);',
    expect: 'readLeadingFactorFromFile reads the real import cap',
  },
];

function runSuite() {
  try {
    execFileSync(
      'npx',
      ['vitest', 'run', TEST, '--root', 'packages/server', '--reporter=json', '--outputFile', OUT],
      { cwd: REPO, stdio: 'ignore', env: { ...process.env, NO_COLOR: '1' } },
    );
  } catch {
    /* non-zero exit is the expected outcome for a caught mutation */
  }
  const r = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const failed = [];
  for (const f of r.testResults ?? []) {
    for (const a of f.assertionResults ?? []) {
      if (a.status === 'failed') failed.push(a.fullName ?? a.title);
    }
  }
  return { ok: r.success === true, total: r.numTotalTests, failed };
}

const baseline = runSuite();
console.log(`BASELINE: success=${baseline.ok} total=${baseline.total} failed=${baseline.failed.length}`);
if (!baseline.ok) {
  console.log('  baseline is not green — aborting');
  process.exit(1);
}

let anyStructural = false;
for (const m of MUTATIONS) {
  const original = fs.readFileSync(m.file, 'utf8');
  const hits = original.split(m.from).length - 1;
  if (hits !== 1) {
    anyStructural = true;
    console.log(`${m.name}\n  ANCHOR MISS (${hits} occurrences) — this mutation has stopped measuring`);
    continue;
  }
  const mutated = original.replace(m.from, m.to);
  if (mutated === original) {
    // Theseus, Round 254 §1: an anchor that matches while the file comes out
    // unchanged is a third way for a mutation to stop measuring, and it reads as
    // SURVIVED — the verdict for "an arm is missing" — when nothing was broken.
    anyStructural = true;
    console.log(`${m.name}\n  NO-OP MUTATION — anchor matched but the file is byte-identical`);
    continue;
  }
  fs.writeFileSync(m.file, mutated);

  let res;
  try {
    res = runSuite();
  } finally {
    fs.writeFileSync(m.file, original);
  }
  const aimed = res.failed.filter((n) => n.includes(m.expect));
  const verdict = res.ok
    ? 'SURVIVED — nothing caught it'
    : aimed.length
      ? `CAUGHT by the aimed arm (${aimed.length} of ${res.failed.length} reds)`
      : `CAUGHT, but NOT by the aimed arm — reds: ${res.failed.join(' | ')}`;
  console.log(`${m.name}\n  ${verdict}`);
  if (!res.ok && aimed.length) console.log(`  aimed red: ${aimed[0]}`);
  if (res.ok) anyStructural = true;
}

let clean = true;
for (const [label, p] of Object.entries(TARGETS)) {
  const same = before[label] === sha(p);
  if (!same) clean = false;
  console.log(`RESTORED: ${label.padEnd(28)} ${same ? 'sha256 identical' : 'CHANGED — INVESTIGATE'}  ${before[label].slice(0, 16)}…`);
}
const treeAfter = porcelain();
const sameTree = treeAfter === treeBefore;
if (!sameTree) clean = false;
console.log(
  `WORKING TREE: packages/ + scripts/ ${sameTree ? 'identical to before the drive' : 'MOVED — INVESTIGATE'}` +
  ` (${treeBefore.trim() === '' ? 'clean at entry' : treeBefore.trim().split('\n').length + ' entries at entry'})`);
process.exit(clean && !anyStructural ? 0 : 1);
