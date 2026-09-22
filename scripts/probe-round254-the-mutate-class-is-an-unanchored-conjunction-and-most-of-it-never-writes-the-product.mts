/**
 * Round 254 — the `mutate` class, driven; and whether a conjunction of two regexes is a
 * classifier or a coincidence detector.
 *
 * ## Where this comes from
 *
 * Round 252 (mine, 2026-09-22 START fire) drove the `db` class and found it was an over-block:
 * 13 members blocked only by `db`, `0` of them opened the scratch `KLATCH_DB` they were handed,
 * `8` minted their own storage instead. It closed with a rule and a named next target:
 *
 * > **Rule: when a classifier's largest class turns out to be an over-block, suspect the class
 * > that INHERITS the title.** Next candidate: `mutate`, now largest at 28, with 1 confirmed true
 * > positive and 27 unseparated.
 *
 * This round takes it. **Prior, recorded before the drive:** I expect `mutate` to be an
 * over-block. That sentence is in `docs/logs/2026-09-22-1448-theseus-opus-log.md` with a
 * timestamp, so the writeup cannot become a prediction I never made.
 *
 * ## Why `mutate` is a DIFFERENT shape of over-block from the previous two
 *
 * `server` (Round 250 arm A6, over-blocked 39) and `db` (Round 252, over-blocked 13) were each
 * ONE regex that matched too much. `mutate` is a CONJUNCTION:
 *
 * ```ts
 * const mutatesProduct = (code) => WRITE_RE.test(code) && PRODUCT_PATH_RE.test(code);
 * ```
 *
 * A conjunction reads as *more* precise than either half. It is not, in one specific way: the two
 * predicates are evaluated **independently over the whole file**, so nothing ties the write to the
 * path. `writeFileSync(tmp, …)` on line 20 and `'packages/server/src/index.ts'` in a `spawn`
 * argument on line 300 satisfy it exactly as well as `writeFileSync('packages/server/src/index.ts', …)`
 * does. It is not an over-broad predicate; it is **co-occurrence wearing the costume of a
 * relation**. Arm A2 proves that on minted source, before any child process runs.
 *
 * ## The measurement problem this round had to solve first, and it is the interesting part
 *
 * The obvious drive — snapshot the product tree, run the member, see whether the tree changed —
 * **would have produced a confident wrong answer.** A well-behaved mutation probe writes a
 * product file, runs a suite against the defect, and restores the original bytes in a `finally`.
 * `probe-round251-the-port-lever-mutations.mjs` and `probe-round253-the-db-path-mutations.mjs`
 * both do exactly this, and both are TRUE positives for `mutate`. A content-only snapshot taken
 * after such a run reports *no change* and would have filed both as false positives — and the
 * over-block conclusion I came in expecting would have been manufactured by my own instrument.
 *
 * So the manifest carries **sha256 AND mtimeMs**, and the class splits three ways rather than two:
 *
 * | after the drive | meaning | verdict on the classification |
 * |---|---|---|
 * | content differs | wrote a product file and did NOT put it back | TRUE positive, and a hazard |
 * | content same, mtime moved | wrote a product file and restored it | TRUE positive, well-behaved |
 * | neither moved | never went near a product file | FALSE positive — the over-block |
 *
 * **Rule this round owes the collection: a drive that can only see NET effect cannot separate
 * "never did it" from "did it and cleaned up."** The distinction is invisible in the obvious
 * instrument and is the whole answer here.
 *
 * ## Safety, because this is the riskiest class to drive so far
 *
 * The `db` class threatened one file. This class is *defined* by writing into
 * `packages/<ws>/src`, and some members genuinely do. Four layers:
 *
 *   1. A **byte copy of every file under `packages/<ws>/src`** (254 files, 3.3 MB — cheap) is
 *      taken before the drive window opens. (Spelled `<ws>` and not with a glob throughout this
 *      comment for a stupid and load-bearing reason: the glob spelling contains `*` followed by
 *      `/`, which ENDS the block comment. Written the natural way first, and tsc caught it.)
 *   2. The **full manifest is re-taken after EVERY driven member**, not once at the end — so a
 *      member that leaves the tree dirty is identified by name and repaired before the next one
 *      runs, per Round 252's per-file-integrity design.
 *   3. Repair is **restore-and-verify**: rewrite from the byte copy, delete what was added,
 *      recreate what was deleted, then re-take the manifest and assert it matches. A restore that
 *      cannot be verified ABORTS the drive rather than continuing on an assumption.
 *   4. `klatch.db` keeps Round 252's own byte copy and per-file sha check, and every member is
 *      spawned with a scratch `KLATCH_DB` even though a mutate-only member has no `db` hazard by
 *      construction. That is deliberately redundant: this round exists because a classifier was
 *      wrong about a class, and the one assumption not to make while proving that is that the
 *      same classifier is right about the others.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { portAcceptsAConnection } from './lib/probe-server-ownership.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SCRIPTS = path.join(REPO, 'scripts');
const PACKAGES = path.join(REPO, 'packages');
const VERBOSE = process.argv.includes('--verbose');

// Round 248: never `path.basename(fileURLToPath(import.meta.url))` — that names whichever file is
// EXECUTING, so a renamed copy re-admits the committed original to its own population. Built by
// concatenation so classifying on a substring cannot enrol this file in its own population.
const SELF = 'probe-round254-' +
  'the-mutate-class-is-an-unanchored-conjunction-and-most-of-it-never-writes-the-product.mts';

const REAL_DB = path.join(REPO, 'klatch.db');
const SERVER_ENTRY = path.join(PACKAGES, 'server', 'src', 'index.ts');

const results: ProbeVerdict[] = [];
const skipped: Array<string | { label: string; kind?: string }> = [];

function check(arm: string, what: string, pass: boolean, detail: string) {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}
function meas(arm: string, what: string, detail: string) {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
}

const git = (args: string[]) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const sha256 = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round254-'));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Scanner and hazard model — Round 250's, copied unchanged (as Round 252 copied it)
// ─────────────────────────────────────────────────────────────────────────────
//
// A COPY, not an import. Round 250 and Round 252 are filed artifacts whose figures are cited in
// docs/research and in memos; importing from either would give this round the power to move their
// published numbers — the trap Round 244 §7 named. Arm A is the two-sided control that this copy
// classifies the way the originals do.

type Scan = { code: string; specifiers: string[] };

function scan(src: string): Scan {
  let code = '';
  const specifiers: string[] = [];
  let i = 0;
  let inBlock = false;
  let inLine = false;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i];
    const two = src.slice(i, i + 2);
    if (inBlock) {
      if (two === '*/') { inBlock = false; i += 2; continue; }
      i += 1; continue;
    }
    if (inLine) {
      if (c === '\n') { inLine = false; code += c; }
      i += 1; continue;
    }
    if (quote) {
      code += c;
      if (c === '\\') { code += src[i + 1] ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      i += 1; continue;
    }
    if (two === '/*') { inBlock = true; i += 2; continue; }
    if (two === '//') { inLine = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; code += c; i += 1; continue; }
    code += c; i += 1;
  }
  const SPEC_RE = /(?:import\s+[^;]*?from\s*|import\s*|require\s*\(\s*|import\s*\(\s*)(['"])([^'"]+)\1/g;
  for (const m of code.matchAll(SPEC_RE)) specifiers.push(m[2]);
  return { code, specifiers };
}

type Hazard = 'model' | 'port' | 'server' | 'db' | 'mutate' | 'suite' | 'args' | 'corpus' | 'product';

const BLOCKING: Hazard[] = ['model', 'port', 'server', 'db', 'mutate', 'suite', 'args'];

const OWN_HAZARDS: Array<{ h: Hazard; re: RegExp }> = [
  { h: 'model', re: /@anthropic-ai\/sdk|ANTHROPIC_API_KEY|messages\.create/ },
  { h: 'port', re: /\b3001\b|\b5173\b/ },
  { h: 'server', re: /packages\/server\/src\/index|serve-scratch|probe-scratch-server|run['"`]?\s*,\s*['"`]dev['"`]|npm run dev/ },
  { h: 'db', re: /klatch\.db|better-sqlite3|db\/queries\.js|db\/index\.js/ },
  { h: 'suite', re: /vitest run|npm\s+(?:run\s+)?test|['"`]test['"`]\s*\]/ },
  { h: 'corpus', re: /\.claude\/projects/ },
  { h: 'product', re: /['"`](?:\.\.\/)+packages\/[a-z]+\/src\/|@klatch\// },
];

const WRITE_RE = /writeFileSync|fs\.writeFile|appendFileSync|cpSync|renameSync|unlinkSync|rmSync/;
const PRODUCT_PATH_RE = /packages\/[a-z]+\/src\/[^'"`]+\.tsx?/;
const mutatesProduct = (code: string) => WRITE_RE.test(code) && PRODUCT_PATH_RE.test(code);
const needsArguments = (code: string) => /process\.argv/.test(code) && /usage:/i.test(code);

function ownHazards(code: string): Set<Hazard> {
  const out = new Set<Hazard>();
  for (const { h, re } of OWN_HAZARDS) if (re.test(code)) out.add(h);
  if (mutatesProduct(code)) out.add('mutate');
  if (needsArguments(code)) out.add('args');
  if (out.has('server')) out.add('port');
  return out;
}

function resolveScriptSpecifier(fromRel: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const abs = path.resolve(path.join(SCRIPTS, path.dirname(fromRel)), spec);
  const rel = path.relative(SCRIPTS, abs);
  if (rel.startsWith('..')) return null;
  const candidates = [rel, rel.replace(/\.js$/, '.mts'), rel.replace(/\.js$/, '.mjs'), `${rel}.mts`, `${rel}.mjs`];
  for (const c of candidates) if (fs.existsSync(path.join(SCRIPTS, c))) return c;
  return null;
}

function walkScripts(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walkScripts(path.join(dir, e.name), rel));
    else if (/\.(mts|mjs|ts|js)$/.test(e.name) && rel !== SELF) out.push(rel);
  }
  return out;
}

const files = walkScripts(SCRIPTS);
const scans = new Map<string, Scan>();
const own = new Map<string, Set<Hazard>>();
for (const rel of files) {
  const s = scan(fs.readFileSync(path.join(SCRIPTS, rel), 'utf8'));
  scans.set(rel, s);
  own.set(rel, ownHazards(s.code));
}

const edges = new Map<string, string[]>();
for (const rel of files) {
  edges.set(rel, scans.get(rel)!.specifiers
    .map((s) => resolveScriptSpecifier(rel, s))
    .filter((x): x is string => x !== null));
}

function reachable(rel: string): Set<string> {
  const seen = new Set<string>();
  const stack = [...(edges.get(rel) ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    stack.push(...(edges.get(n) ?? []));
  }
  return seen;
}

function hazardsOf(rel: string): Set<Hazard> {
  const out = new Set(own.get(rel) ?? []);
  for (const dep of reachable(rel)) for (const h of own.get(dep) ?? []) if (h !== 'args') out.add(h);
  if (out.has('server')) out.add('port');
  return out;
}

/** The transitive union of a file's own source and every scripts/ module it can reach. */
function reachableCode(rel: string): string {
  let code = scans.get(rel)?.code ?? '';
  for (const dep of reachable(rel)) code += '\n' + (scans.get(dep)?.code ?? '');
  return code;
}

console.log(`\nRound 254 — the mutate class, driven against a content-and-mtime manifest`);
console.log(`Repo: ${REPO}`);
console.log(`Enumerated under scripts/ (recursive, dot-files excluded, SELF excluded): ${files.length}`);
console.log(`Scratch root: ${tmp}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// 2. The product-tree manifest — content AND mtime, and the restore that verifies itself
// ─────────────────────────────────────────────────────────────────────────────

type Entry = { sha: string; mtimeMs: number };
type Manifest = Map<string, Entry>;

function walkTree(root: string, prefix = ''): string[] {
  const out: string[] = [];
  if (!fs.existsSync(root)) return out;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walkTree(path.join(root, e.name), rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}

/** Every file under `packages/<ws>/src`, keyed `<ws>/src/<rel>`. */
function productFiles(): string[] {
  const out: string[] = [];
  for (const ws of fs.readdirSync(PACKAGES, { withFileTypes: true })) {
    if (!ws.isDirectory()) continue;
    const src = path.join(PACKAGES, ws.name, 'src');
    if (!fs.existsSync(src)) continue;
    for (const rel of walkTree(src)) out.push(`${ws.name}/src/${rel}`);
  }
  return out;
}

const productAbs = (rel: string) => path.join(PACKAGES, rel);

function takeManifest(): Manifest {
  const m: Manifest = new Map();
  for (const rel of productFiles()) {
    const abs = productAbs(rel);
    m.set(rel, { sha: sha256(abs), mtimeMs: fs.statSync(abs).mtimeMs });
  }
  return m;
}

type Delta = { modified: string[]; touched: string[]; added: string[]; removed: string[] };

/**
 * `modified` — content differs. `touched` — content identical, mtime moved: the signature of a
 * write that was put back. Separating those two is the entire point of this round's instrument;
 * collapsing them is how a drive reports "never happened" for a probe that did it properly.
 */
function diffManifest(before: Manifest, after: Manifest): Delta {
  const d: Delta = { modified: [], touched: [], added: [], removed: [] };
  for (const [rel, b] of before) {
    const a = after.get(rel);
    if (!a) { d.removed.push(rel); continue; }
    if (a.sha !== b.sha) d.modified.push(rel);
    else if (a.mtimeMs !== b.mtimeMs) d.touched.push(rel);
  }
  for (const rel of after.keys()) if (!before.has(rel)) d.added.push(rel);
  return d;
}

const anyRealChange = (d: Delta) => d.modified.length + d.added.length + d.removed.length > 0;
const anyContact = (d: Delta) => anyRealChange(d) || d.touched.length > 0;

/** Byte copy of the whole product tree, taken before the drive window opens. */
const BACKUP = path.join(tmp, 'packages-backup');
function takeBackup() {
  for (const rel of productFiles()) {
    const dst = path.join(BACKUP, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(productAbs(rel), dst);
  }
}

/**
 * Restore from the byte copy and VERIFY. Returns null on success, or a description of what is
 * still wrong — the caller aborts on non-null rather than continuing on an assumption. A repair
 * that reports success without re-reading the disk is the same construct as a check that skips
 * its way to zero assertions.
 */
function restoreAndVerify(baseline: Manifest): string | null {
  for (const [rel, b] of baseline) {
    const abs = productAbs(rel);
    const src = path.join(BACKUP, rel);
    if (!fs.existsSync(src)) return `backup missing for ${rel} — cannot restore`;
    if (!fs.existsSync(abs) || sha256(abs) !== b.sha) {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.copyFileSync(src, abs);
    }
  }
  for (const rel of productFiles()) if (!baseline.has(rel)) fs.rmSync(productAbs(rel), { force: true });
  const after = takeManifest();
  const d = diffManifest(baseline, after);
  return anyRealChange(d)
    ? `restore did not verify — modified ${d.modified.length}, added ${d.added.length}, removed ${d.removed.length}`
    : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — the copied hazard model classifies the way Round 250's and Round 252's do
// ─────────────────────────────────────────────────────────────────────────────

{
  const positives: Array<[string, Hazard]> = [
    [`import Database from 'better-sqlite3';\nconst d = new Database('x');`, 'db'],
    [`const port = 3001;`, 'port'],
    [`spawn('npx', ['tsx', 'packages/server/src/index.ts']);`, 'server'],
    [`fs.writeFileSync('packages/server/src/index.ts', src);`, 'mutate'],
  ];
  const negatives = [
    `const x = 1; console.log('no hazards here');`,
    `// klatch.db and better-sqlite3 named only in a comment\nconst y = 2;`,
  ];
  const posOk = positives.every(([src, h]) => ownHazards(scan(src).code).has(h));
  const negOk = negatives.every((src) => {
    const hz = [...ownHazards(scan(src).code)].filter((h) => BLOCKING.includes(h));
    return hz.length === 0;
  });
  const implies = ownHazards(scan(`spawn('npx',['tsx','packages/server/src/index.ts'])`).code).has('port');

  check('A', 'the hazard model copied from Round 250/252 classifies both ways, on minted source',
    posOk && negOk && implies,
    `${positives.length} positive fixtures each acquire their named hazard (${posOk}) — including ` +
      `a genuine product write for 'mutate'; ${negatives.length} negatives acquire NO blocking ` +
      `hazard (${negOk}), one of them naming both db markers inside a COMMENT, which is the ` +
      `scanner's whole job. 'server' implies 'port' (${implies}). A copy of the model, not an ` +
      `import of it — Round 250 and Round 252 are filed artifacts and importing would let this ` +
      `round move their published figures (Round 244 §7).`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM A2 — THE STATIC RESULT: the conjunction is unanchored, proved on minted source
// ─────────────────────────────────────────────────────────────────────────────
//
// This arm needs no child process and no population. If it passes, `mutate` cannot be a
// classifier of "writes the product" regardless of what the drive finds, because two files that
// differ on exactly that question are given the same class.

{
  const TRUE_POSITIVE = `
import fs from 'fs';
const ENTRY = 'packages/server/src/index.ts';
fs.writeFileSync(ENTRY, mutated);
`;
  // Writes ONLY to a tmpdir. Names a product path ONLY as an argument to a reader/spawner.
  // Both halves true, neither related to the other. This is the shape the class cannot see.
  const FALSE_POSITIVE = `
import fs from 'fs';
import os from 'os';
import path from 'path';
fs.writeFileSync(path.join(os.tmpdir(), 'scratch.json'), JSON.stringify(out));
const child = spawn('npx', ['tsx', 'packages/server/src/index.ts']);
`;
  // Neither half: a control that keeps the arm two-sided rather than only demonstrating a hit.
  const NEITHER = `
import fs from 'fs';
const src = fs.readFileSync('README.md', 'utf8');
`;
  // Writes the product, but reaches it through a joined constant rather than a literal path —
  // the OPPOSITE error, and the reason the fix is not simply "tighten the regex".
  const MISSED = `
import fs from 'fs';
const WS = 'packages/server';
fs.writeFileSync(WS + '/src/index.ts', mutated);
`;

  const cls = (src: string) => mutatesProduct(scan(src).code);
  const tp = cls(TRUE_POSITIVE);
  const fp = cls(FALSE_POSITIVE);
  const neither = cls(NEITHER);
  const missed = cls(MISSED);

  check('A2', 'THE STATIC RESULT — the conjunction cannot tell a product write from a coincidence',
    tp && fp && !neither,
    `A file that genuinely writes packages/server/src/index.ts is classed 'mutate' (${tp}). ` +
      `A file that writes ONLY to os.tmpdir() and names a product path ONLY as a spawn argument ` +
      `is classed 'mutate' TOO (${fp}). A file doing neither is not (${neither === false}). ` +
      `**Both predicates are evaluated over the whole file and nothing ties the write to the ` +
      `path**, so the class is co-occurrence, not a relation — and the two fixtures that differ ` +
      `on precisely the question the class claims to answer receive the same answer. ` +
      `Established on MINTED source: no population, no child process, nothing that can drift. ` +
      `**And the error runs both ways** — the same fixture with the path built by concatenation ` +
      `(\`WS + '/src/index.ts'\`) writes the product and is NOT classed (classified: ${missed}), ` +
      `so tightening PRODUCT_PATH_RE toward the write call would trade false positives for false ` +
      `negatives. Reported because it is the reason "just anchor the regex" is not the remedy; ` +
      `not asserted as a pass condition, since this arm's claim is about the false-positive side.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM B — the restore machinery, driven two-sided on a minted tree before it is relied on
// ─────────────────────────────────────────────────────────────────────────────
//
// Arm D's safety rests entirely on detect-and-restore. Driving that on the REAL product tree
// would mean damaging the thing the layer exists to protect (Round 252 arm B's problem, same
// answer): so the same functions are driven against a minted tree of the same shape, and the
// real tree gets the NEGATIVE half — two manifests with no drive between them must report zero.

{
  const fakeRoot = path.join(tmp, 'fake-packages');
  const fakeSrc = path.join(fakeRoot, 'server', 'src');
  fs.mkdirSync(fakeSrc, { recursive: true });
  fs.writeFileSync(path.join(fakeSrc, 'a.ts'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(fakeSrc, 'b.ts'), 'export const b = 2;\n');

  const listFake = () => walkTree(fakeSrc).map((r) => `server/src/${r}`);
  const fakeAbs = (rel: string) => path.join(fakeRoot, rel);
  const takeFake = (): Manifest => {
    const m: Manifest = new Map();
    for (const rel of listFake()) m.set(rel, { sha: sha256(fakeAbs(rel)), mtimeMs: fs.statSync(fakeAbs(rel)).mtimeMs });
    return m;
  };

  const base = takeFake();

  // (i) NEGATIVE — nothing happened, so nothing is reported.
  const quiet = diffManifest(base, takeFake());

  // (ii) modified — content changed and left changed.
  fs.writeFileSync(fakeAbs('server/src/a.ts'), 'export const a = 999;\n');
  const dMod = diffManifest(base, takeFake());

  // (iii) touched — written and put back byte-identical. THE case the obvious instrument misses.
  fs.writeFileSync(fakeAbs('server/src/a.ts'), 'export const a = 1;\n');
  // mtime resolution: force a distinguishable stamp rather than racing the filesystem clock.
  const past = new Date(Date.now() - 60_000);
  fs.utimesSync(fakeAbs('server/src/b.ts'), past, past);
  const dTouch = diffManifest(base, takeFake());

  // (iv) added / removed.
  fs.writeFileSync(path.join(fakeSrc, 'c.ts'), 'export const c = 3;\n');
  fs.rmSync(fakeAbs('server/src/b.ts'));
  const dAddRm = diffManifest(base, takeFake());

  const ok =
    !anyContact(quiet) &&
    dMod.modified.includes('server/src/a.ts') && dMod.modified.length === 1 &&
    dTouch.modified.length === 0 && dTouch.touched.includes('server/src/b.ts') &&
    dAddRm.added.includes('server/src/c.ts') && dAddRm.removed.includes('server/src/b.ts');

  check('B', 'DRIVEN — the manifest separates modified, touched-and-restored, added and removed',
    ok,
    `(i) two manifests with no drive between them report nothing (${!anyContact(quiet)}). ` +
      `(ii) content changed → modified=[${dMod.modified.join(', ')}] (${dMod.modified.length === 1}). ` +
      `(iii) **written and restored byte-identical → modified=${dTouch.modified.length}, ` +
      `touched=[${dTouch.touched.join(', ')}]** — the case a content-only snapshot reports as ` +
      `"never happened", driven here rather than argued for. ` +
      `(iv) added=[${dAddRm.added.join(', ')}] removed=[${dAddRm.removed.join(', ')}]. ` +
      `Driven on a MINTED tree of the same shape: the honest positive control for a repair layer ` +
      `is not one that damages the artefact the layer protects (Round 252 arm B, same answer).`);

  // The real tree gets the negative half of the same test, live.
  const r1 = takeManifest();
  const r2 = takeManifest();
  check('B2', 'CONTROL — the manifest is stable over the REAL product tree with no drive between',
    !anyContact(diffManifest(r1, r2)),
    `${r1.size} files under packages/*/src, manifested twice back to back: ` +
      `${JSON.stringify(diffManifest(r1, r2))}. An instrument that reports contact when nothing ` +
      `happened would make every member of arm D a true positive, which is the failure mode ` +
      `pointing AWAY from this round's prior and therefore the one worth controlling for.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM C — the population, from the instrument that owns the definition
// ─────────────────────────────────────────────────────────────────────────────

const R246 = files.find((f) => f.startsWith('probe-round246-'));
let population: string[] = [];
let r246Reported = -1;
let r246Exit: number | null = null;

if (!R246) {
  skipped.push('C: probe-round246 not found — the staleness definition has no owner on disk');
} else {
  const t0 = Date.now();
  const out = (() => {
    try {
      return execFileSync('npx', ['tsx', path.join(SCRIPTS, R246)], {
        cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 600_000,
      });
    } catch (e: any) {
      r246Exit = typeof e.status === 'number' ? e.status : null;
      return String(e.stdout ?? '');
    }
  })();
  if (r246Exit === null) r246Exit = 0;
  const lines = out.split('\n');
  const start = lines.findIndex((l) => l.includes('Stale-in-code, full definition, ranked'));
  if (start >= 0) {
    for (let i = start + 1; i < lines.length; i++) {
      const m = lines[i].match(/^\s+(\d+) commit\(s\)\s+(\S+)\s+\(/);
      if (m) population.push(m[2]);
    }
  }
  const armE = lines.find((l) => l.includes('emit spelling + transitive imports:'));
  const n = armE?.match(/emit spelling \+ transitive imports: (\d+)/);
  if (n) r246Reported = Number(n[1]);

  check('C', 'CONTROL on the parse — the rows extracted match the count that probe REPORTS',
    r246Reported > 0 && population.length === r246Reported,
    `Round 246 re-run live in ${((Date.now() - t0) / 1000).toFixed(0)} s (exit ${r246Exit}); its ` +
      `arm E reports ${r246Reported}, the ranked listing parsed here has ${population.length} ` +
      `entries. One source for the definition, not a second copy. The number moves with every ` +
      `commit to packages/ or to a probe — Round 250 measured 48 on 2026-09-21, Round 252 ` +
      `measured 51 this morning — so it is re-taken here rather than quoted.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM D — THE UNIT: drive every member blocked ONLY by `mutate`, against the manifest
// ─────────────────────────────────────────────────────────────────────────────

const MUTATE_UNBLOCKED: Hazard[] = BLOCKING.filter((h) => h !== 'mutate');
const BUDGET_MS = 120_000;

type Outcome = {
  rel: string; code: number | null; ms: number; note: string;
  modified: string[]; touched: string[]; added: string[]; removed: string[];
};
const driven: Outcome[] = [];
const stillBlocked = new Map<string, string[]>();
let mutateOnly: string[] = [];
let abortedAt: string | null = null;
let restoreFailure: string | null = null;
let repoDirtyBefore = new Set<string>();
let repoDirtyAfter: string[] = [];

const realDbShaBefore = fs.existsSync(REAL_DB) ? sha256(REAL_DB) : null;
const realDbMtimeBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB).mtimeMs : null;
const dbBackup = path.join(tmp, 'klatch.db.backup');
if (fs.existsSync(REAL_DB)) fs.copyFileSync(REAL_DB, dbBackup);
let dbBreachAt: string | null = null;

if (!population.length) {
  skipped.push('D: no population parsed — nothing to drive');
} else {
  const inPop = (name: string) => files.find((f) => path.basename(f) === name) ?? null;
  for (const name of population) {
    const rel = inPop(name);
    if (!rel) {
      if (!stillBlocked.has('not-found')) stillBlocked.set('not-found', []);
      stillBlocked.get('not-found')!.push(name);
      continue;
    }
    const hz = hazardsOf(rel);
    const remaining = [...hz].filter((h) => MUTATE_UNBLOCKED.includes(h));
    // Blocked ONLY by mutate. A file with no blocking hazard at all was already driveable in
    // Round 250 and is not this round's unit — counted separately so the delta is the delta.
    if (remaining.length === 0 && hz.has('mutate')) mutateOnly.push(rel);
    else if (remaining.length > 0) for (const h of remaining) {
      if (!stillBlocked.has(h)) stillBlocked.set(h, []);
      stillBlocked.get(h)!.push(rel);
    }
  }

  console.log(`\n── Driving ${mutateOnly.length} mutate-only-blocked probe(s) against a ` +
    `content+mtime manifest of ${productFiles().length} product files, ${BUDGET_MS / 1000} s each ──\n`);

  takeBackup();
  const baseline = takeManifest();
  // The blast-radius window opens HERE, not at the top — Round 250's second fault was a control
  // whose window was wider than its claim and which blamed the drive for my own session log.
  repoDirtyBefore = new Set(git(['status', '--porcelain']).split('\n').filter(Boolean));

  for (const rel of mutateOnly) {
    const before = takeManifest();
    const scratchDb = path.join(tmp, `drive-${path.basename(rel).replace(/[^a-z0-9]/gi, '-')}.db`);
    const t0 = Date.now();
    let note = '';
    const child = spawn('npx', ['tsx', path.join(SCRIPTS, rel)], {
      cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
      // KLATCH_DB is redundant for a mutate-only member by construction — and this round exists
      // because the classifier was wrong about a class, so it is handed over anyway.
      env: { ...process.env, KLATCH_DB: scratchDb },
    });
    let tail = '';
    child.stdout?.on('data', (d) => { tail = (tail + d).slice(-4000); });
    child.stderr?.on('data', (d) => { tail = (tail + d).slice(-4000); });
    const timer = setTimeout(() => {
      note = `TIMEOUT at ${BUDGET_MS / 1000} s`;
      // Round 248: child.kill() kills npx, not the probe four processes down. Kill the GROUP.
      try { if (child.pid) process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ }
    }, BUDGET_MS);
    const code = await new Promise<number | null>((resolve) => {
      child.on('exit', (c) => { clearTimeout(timer); resolve(c); });
    });
    const ms = Date.now() - t0;

    const delta = diffManifest(before, takeManifest());

    // PER-FILE repair, in the loop. Not once at the end: that tells you something was damaged;
    // this tells you WHICH FILE did it and puts the tree back before the next one runs.
    if (anyRealChange(delta)) {
      note += `${note ? '; ' : ''}LEFT THE PRODUCT TREE CHANGED (modified ${delta.modified.length}, ` +
        `added ${delta.added.length}, removed ${delta.removed.length}) — restoring`;
      const fail = restoreAndVerify(baseline);
      if (fail) { restoreFailure = `${rel}: ${fail}`; abortedAt = rel; }
    }

    const shaNow = fs.existsSync(REAL_DB) ? sha256(REAL_DB) : null;
    if (realDbShaBefore !== null && shaNow !== realDbShaBefore && !dbBreachAt) {
      dbBreachAt = rel;
      fs.copyFileSync(dbBackup, REAL_DB);
      note += `${note ? '; ' : ''}TOUCHED THE REAL klatch.db — restored from backup`;
      abortedAt = rel;
    }

    const lines = tail.split('\n').map((l) => l.trim()).filter(Boolean);
    const headline =
      [...lines].reverse().find((l) => /\d+\s*(?:of\s*\d+\s*)?(?:regression\s*)?checks?\b|\d+\s+failed/i.test(l))
      ?? lines.slice(-2).join(' / ')
      ?? '';
    driven.push({ rel, code, ms, note: note || headline.slice(0, 160), ...delta });

    const contact = anyContact(delta)
      ? `  [product: ${delta.modified.length} modified, ${delta.touched.length} touched, ` +
        `${delta.added.length} added, ${delta.removed.length} removed]`
      : '  [product untouched]';
    console.log(`  ${code === 0 ? 'exit 0 ' : `exit ${code ?? '?'}`}  ${(ms / 1000).toFixed(1)}s  ` +
      `${path.basename(rel)}${contact}`);
    if (VERBOSE || code !== 0 || anyContact(delta)) console.log(`            ${(note || headline).slice(0, 220)}`);
    if (abortedAt) { console.log(`  ABORTING after ${path.basename(abortedAt)}`); break; }
  }

  repoDirtyAfter = git(['status', '--porcelain']).split('\n').filter(Boolean);

  const green = driven.filter((d) => d.code === 0);
  const red = driven.filter((d) => d.code !== 0 && d.code !== null);
  const timedOut = driven.filter((d) => d.note.startsWith('TIMEOUT'));
  const netChanged = driven.filter((d) => d.modified.length + d.added.length + d.removed.length > 0);
  const restored = driven.filter((d) => d.touched.length > 0 && d.modified.length + d.added.length + d.removed.length === 0);
  const truePos = driven.filter((d) => anyContact(d as unknown as Delta));
  const falsePos = driven.filter((d) => !anyContact(d as unknown as Delta));
  const totalS = driven.reduce((n, d) => n + d.ms, 0) / 1000;

  meas('D', 'THE UNIT — the mutate class, driven against a content-and-mtime manifest',
    `${mutateOnly.length}/${population.length} of the population are blocked ONLY by 'mutate'. ` +
      `Driven: ${driven.length} in ${totalS.toFixed(0)} s ` +
      `(${(totalS / Math.max(1, driven.length)).toFixed(1)} s each). ` +
      `exit 0: ${green.length} · non-zero: ${red.length} · timed out at ${BUDGET_MS / 1000} s: ${timedOut.length}. ` +
      `${red.length ? `Non-zero: ${red.map((d) => `${path.basename(d.rel)} (exit ${d.code})`).join('; ')}. ` : ''}` +
      `\n\n**THE SPLIT.** Of ${driven.length} driven: **${truePos.length} made contact with a file ` +
      `under packages/*/src** and **${falsePos.length} never went near one**. Of the ` +
      `${truePos.length}: ${netChanged.length} left the tree CHANGED (content differs — repaired ` +
      `from the byte copy in the loop${netChanged.length ? `: ${netChanged.map((d) => path.basename(d.rel)).join(', ')}` : ''}) ` +
      `and ${restored.length} wrote a product file and PUT IT BACK byte-identical (mtime moved, ` +
      `sha256 did not${restored.length ? `: ${restored.map((d) => path.basename(d.rel)).join(', ')}` : ''}). ` +
      (restored.length
        ? `**That second group is the whole reason this instrument carries mtime.** A content-only ` +
          `snapshot would have filed all ${restored.length} as never-touched and inflated the ` +
          `false-positive count from ${falsePos.length} to ${falsePos.length + restored.length} — ` +
          `manufacturing the over-block conclusion this round came in expecting. `
        : `**The mtime channel found nothing on this run, and that is said rather than quietly ` +
          `banked.** It exists because a content-only snapshot cannot tell "never did it" from "did ` +
          `it and put it back", and on this population the distinction did not arise. The capability ` +
          `is still established — arm B drives the discrimination on a minted tree, independently of ` +
          `whether the population exercises it — but the headline below rests on the content channel ` +
          `alone, and **a control that never fired has not been vindicated, it has been untested.** `) +
      (falsePos.length === 0
        ? `**Every driven member made contact: on this population the class is NOT an over-block.** ` +
          `The prior recorded before the drive was wrong, and the rule it came from — "suspect the ` +
          `class that inherits the title" — is a heuristic for where to look, not a finding.`
        : truePos.length === 0
          ? `**Not one made contact. The class is an over-block end to end** — third sighting of ` +
            `the shape after 'server' (Round 250 arm A6, 39 files) and 'db' (Round 252, 13).`
          : `**So the class is ${falsePos.length}/${driven.length} over-block and ` +
            `${truePos.length}/${driven.length} real** — the first of the three examined classes ` +
            `that is genuinely MIXED rather than wholesale wrong. 'server' and 'db' could be ` +
            `dismissed; this one has to be separated, and arm A2 says the text cannot do it. `) +
      `\n\n**What a green exit does NOT say** (Round 247 §4): that the probe's subject is still ` +
      `there. **What "no contact" does not say either:** that the member is safe to run in ` +
      `general — it says that on THIS run, from THIS tree state, it wrote nothing under ` +
      `packages/*/src. A member whose write is behind a branch this run did not take is reported ` +
      `here as no-contact and that is a limit of any drive, stated rather than papered over.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM E — does cheap static proximity predict the drive? The candidate remedy, scored
// ─────────────────────────────────────────────────────────────────────────────
//
// If `mutate` is mixed rather than wholesale wrong, the useful question is whether anything
// CHEAP separates it. The cheapest candidate: require the product path to occur near a write
// call rather than anywhere in the file. Scored AGAINST arm D's ground truth instead of being
// proposed on the strength of sounding right.

{
  const WRITE_G = /writeFileSync|fs\.writeFile|appendFileSync|cpSync|renameSync|unlinkSync|rmSync/g;
  const PRODUCT_G = /packages\/[a-z]+\/src\/[^'"`]+\.tsx?/g;

  /** Smallest character distance between any write call and any product-path literal. */
  function proximity(code: string): number | null {
    const w = [...code.matchAll(WRITE_G)].map((m) => m.index ?? 0);
    const p = [...code.matchAll(PRODUCT_G)].map((m) => m.index ?? 0);
    if (!w.length || !p.length) return null;
    let best = Infinity;
    for (const a of w) for (const b of p) best = Math.min(best, Math.abs(a - b));
    return best;
  }

  const WINDOW = 120;
  const scored = driven.map((d) => ({
    rel: d.rel,
    contact: anyContact(d as unknown as Delta),
    prox: proximity(scans.get(d.rel)?.code ?? ''),
  }));
  const near = scored.filter((s) => s.prox !== null && s.prox <= WINDOW);
  const far = scored.filter((s) => s.prox === null || s.prox > WINDOW);
  const nearAndContact = near.filter((s) => s.contact).length;
  const farAndContact = far.filter((s) => s.contact).length;
  const agree = nearAndContact + (far.length - farAndContact);

  const positives = scored.filter((s) => s.contact).length;

  if (!driven.length) {
    skipped.push('E: nothing was driven, so there is no ground truth to score the heuristic against');
  } else if (positives === 0) {
    // RUN 1 REPORTED "agreement 3/3" HERE AND THAT NUMBER WAS VACUOUS. With no positive in the
    // ground truth, a heuristic that classifies NOTHING scores 100% — and so does one that
    // classifies everything correctly. The two are indistinguishable on this sample, so the
    // score carries no information about the heuristic at all. Same family as the defect
    // `probe-outcome.mts` exists to prevent: a construct that cannot go wrong printed in the
    // place a reader reads for a verdict. Refused rather than printed, and the refusal is a
    // SKIP so the probe cannot exit 0 claiming it established this.
    skipped.push({
      label: `E: the ${driven.length} driven members contain NO positive, so a separation heuristic ` +
        `cannot be scored — anything that classifies nothing scores perfectly on an all-negative ` +
        `sample. Run 1 printed "agreement 3/3" here; that number was vacuous and is withdrawn ` +
        `rather than reworded. Static distribution, reported as a measurement and not as a score: ` +
        `NEAR (write call within ${WINDOW} chars of a product path) ${near.length}, FAR ${far.length}.`,
      kind: 'measurement',
    });
  } else {
    meas('E', 'the cheap remedy, scored against the drive rather than proposed on plausibility',
      `Candidate: class 'mutate' only when a write call and a product-path literal occur within ` +
        `${WINDOW} characters of each other in the same file, instead of anywhere in it. ` +
        `Scored over the ${driven.length} members arm D actually drove: ` +
        `NEAR ${near.length} (of which ${nearAndContact} made contact), ` +
        `FAR ${far.length} (of which ${farAndContact} made contact). ` +
        `Agreement with the drive: **${agree}/${driven.length}**. ` +
        `${farAndContact > 0 ? `${farAndContact} member(s) made contact from FAR — the heuristic would MISS them, and a false negative here is a probe that writes the product while classed as safe to run. ` : `No member made contact from FAR. `}` +
        `${near.length - nearAndContact > 0 ? `${near.length - nearAndContact} NEAR member(s) made no contact — still over-blocked, just less. ` : ''}` +
        `**Reported as a score, not adopted.** Arm A2 already shows the opposite error exists ` +
        `(a path built by concatenation writes the product and matches no literal at any ` +
        `distance), so proximity cannot be the whole remedy no matter how it scores here — and ` +
        `${driven.length} points is a small enough sample that a good score is weak evidence and ` +
        `a bad one is strong. Named so the next round can take it or drop it on the number.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM F — the remainder after the mutate class is examined
// ─────────────────────────────────────────────────────────────────────────────

{
  const remainderUnique = new Set<string>();
  for (const [, v] of stillBlocked) for (const f of v) remainderUnique.add(f);

  meas('F', 'the remainder, re-classed after the mutate class is examined',
    `${remainderUnique.size}/${population.length} still not driveable by this round's unblock. ` +
      [...stillBlocked.entries()].sort((a, b) => b[1].length - a[1].length)
        .map(([h, v]) => `${h}: ${v.length}`).join(' · ') +
      `. (A file can appear in more than one class.) Round 250's arm H reported ` +
      `db 35 · mutate 28 · server 19 · port 19 · args 3 · suite 2 · model 2 over a population of ` +
      `48 — QUOTED from a filed artifact, not re-derived here, and taken on 2026-09-21 against a ` +
      `population that has since moved. **Three of the seven blocking classes have now been ` +
      `examined by driving them rather than by reading the regex that defines them: 'server' ` +
      `(Round 250), 'db' (Round 252), 'mutate' (here).**`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM G — the SECOND way a class count misleads, found by the drive being small
// ─────────────────────────────────────────────────────────────────────────────
//
// Not designed in. Arm D expected to drive something like the 28 Round 250 reported for this
// class and drove 3, so the gap between "members of the class" and "members the class is the
// ONLY thing holding back" got measured instead of assumed. It is a different defect from the
// over-block and it is present even when a class is perfectly accurate.

if (!population.length) {
  skipped.push('G: no population parsed — the class census has nothing to count over');
} else {
  const resolved = population
    .map((name) => files.find((f) => path.basename(f) === name) ?? null)
    .filter((x): x is string => x !== null);
  const carries = resolved.filter((rel) => hazardsOf(rel).has('mutate'));
  const alsoOther = carries.filter((rel) =>
    [...hazardsOf(rel)].some((h) => h !== 'mutate' && BLOCKING.includes(h)));
  const cooc = new Map<Hazard, number>();
  for (const rel of carries) {
    for (const h of hazardsOf(rel)) {
      if (h === 'mutate' || !BLOCKING.includes(h)) continue;
      cooc.set(h, (cooc.get(h) ?? 0) + 1);
    }
  }

  meas('G', 'the second way a class count misleads — membership is not the same as what removing it buys',
    `Of ${resolved.length} population members resolved on disk, **${carries.length} carry the ` +
      `'mutate' hazard** — but **${alsoOther.length} of those carry at least one OTHER blocking ` +
      `hazard as well**, and only **${carries.length - alsoOther.length} are blocked by 'mutate' ` +
      `alone**. Co-occurrence over the ${carries.length}: ` +
      `${[...cooc.entries()].sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h} ${n}`).join(' · ') || '(none)'}. ` +
      `\n\n**So "mutate is the largest remaining class at 28" was true and told you the wrong ` +
      `thing.** Removing the gate entirely would make ${carries.length - alsoOther.length} more ` +
      `files driveable, not ${carries.length}. **This is a distinct defect from the over-block and ` +
      `it survives a class being perfectly accurate:** an over-block is a class with the wrong ` +
      `MEMBERS; this is a class with the right members and the wrong IMPLIED PAYOFF, because the ` +
      `ranking is by membership while the decision it feeds is about marginal unblock. Round 250's ` +
      `arm H ranked all seven classes that way and every round since — including my own Round 252, ` +
      `which chose this target on that ranking — has read the ranking as a queue. ` +
      `**Rule: rank a blocking class by the members it is the ONLY blocker for, not by how many ` +
      `members it touches.** Found because the drive came out small enough to ask why, which is a ` +
      `thing a measurement can do and a source read cannot.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM Z — controls
// ─────────────────────────────────────────────────────────────────────────────

check('Z0', 'CONTROL — the product tree is byte-identical to where this probe found it',
  restoreFailure === null && (() => {
    const dirty = git(['status', '--porcelain', 'packages/']).trim();
    return dirty === '';
  })(),
  `git status --porcelain packages/ at exit: ${JSON.stringify(git(['status', '--porcelain', 'packages/']).trim().slice(0, 300))}. ` +
    `${restoreFailure ? `RESTORE FAILED: ${restoreFailure} — the drive aborted there.` : 'Every repair the drive attempted verified by re-taking the manifest, not by assuming the copy landed.'} ` +
    `${abortedAt ? `Drive ABORTED at ${path.basename(abortedAt)}.` : 'No abort.'} ` +
    `Aimed at packages/ specifically and nothing wider: Round 253 fault 1 was a control that went ` +
    `red on the run proving the remedy, because its window could not tell the drive from the ` +
    `operator. This probe writes nothing under packages/ itself, so the assertion is sound here ` +
    `for a reason that does not generalise to a wider window.`);

const realDbShaAfter = fs.existsSync(REAL_DB) ? sha256(REAL_DB) : null;
check('Z1', "CONTROL — xian's klatch.db is byte-identical to where this probe found it",
  realDbShaBefore === null || realDbShaAfter === realDbShaBefore,
  `sha256 ${realDbShaBefore?.slice(0, 12) ?? '(absent)'}… before, ` +
    `${realDbShaAfter?.slice(0, 12) ?? '(absent)'}… after; mtime ` +
    `${realDbMtimeBefore ? new Date(realDbMtimeBefore).toISOString() : '(absent)'} → ` +
    `${fs.existsSync(REAL_DB) ? new Date(fs.statSync(REAL_DB).mtimeMs).toISOString() : '(absent)'}. ` +
    `${dbBreachAt ? `BREACHED by ${dbBreachAt}; restored from the byte copy and the drive aborted.` : 'No breach.'} ` +
    `This worktree HAS a real klatch.db — Argus's 2026-09-22 sweep noted his does not, and that ` +
    `observation does not transfer to this seat.`);

const introduced = repoDirtyAfter.filter((l) => !repoDirtyBefore.has(l));
check('Z2', 'CONTROL — the drive introduced nothing to the working tree',
  introduced.length === 0,
  `${introduced.length} line(s) in git status appeared across the drive window` +
    `${introduced.length ? `: ${introduced.slice(0, 6).join(' | ')}` : ''}. ` +
    `Window opens at the backup and closes when the last child exits. ` +
    `**Known hole, carried from Round 252 §6.2 and not repaired here:** this measures git's view ` +
    `of the tree, so anything a driven member writes under a gitignored path — .testdata/ above ` +
    `all — is invisible to it. Round 252 found 8 members minting fixture directories there while ` +
    `this same arm reported 0 introduced.`);

const stagedUnderScripts = fs.readdirSync(SCRIPTS).filter((f) => f.startsWith('.') && /\.(mts|mjs)$/.test(f));
const portQuiet = !(await portAcceptsAConnection(3001, 800));
check('Z3', 'CONTROL — no staged copies left under scripts/, server entry never written by this probe',
  stagedUnderScripts.length === 0,
  `3001 accepts a connection: ${!portQuiet} (reported, not asserted — this probe never spawns a ` +
    `server, and xian may have npm run dev up). Dot-prefixed staged files under scripts/ by ` +
    `readdirSync: ${stagedUnderScripts.length}${stagedUnderScripts.length ? ` (${stagedUnderScripts.join(', ')})` : ''}. ` +
    `Server entry sha256 ${sha256(SERVER_ENTRY).slice(0, 12)}…`);

const SDK_NEEDLE = '@anthropic' + '-ai/sdk';
const ownSource = fs.readFileSync(path.join(SCRIPTS, SELF), 'utf8');
const importsSdk = new RegExp(`(?:import|require)[^\\n;]*['"\`]${SDK_NEEDLE.replace(/[/-]/g, '\\$&')}`).test(ownSource);
check('Z4', 'CONTROL — 0 model calls: nothing here IMPORTS the Anthropic SDK',
  !importsSdk,
  `Plain needle occurs ${ownSource.split(SDK_NEEDLE).length - 1}× (OWN_HAZARDS has to name the ` +
    `hazard to classify it, and writes it as a regex with an escaped slash); imported: ` +
    `${importsSdk ? 'YES' : 'no'}. "Names it" and "imports it" are different questions and this ` +
    `arm asks the second. The drive spawns population members, and 'model' is a BLOCKING class ` +
    `none of them can be in and still reach arm D — a mutate-only member has no 'model' hazard ` +
    `by construction.`);

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }

summariseAndExit({ probeName: SELF, results, skipped });
