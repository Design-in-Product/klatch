/**
 * Round 252 — the `db` class, driven; and what a scratch database does NOT unblock.
 *
 * ## Where this comes from
 *
 * Round 250 drove 3 of the 48 stale-in-code probes to an exit code and reported the remainder
 * by the class that blocks it: `db 35 · mutate 28 · server 19 · port 19 · args 3 · suite 2 ·
 * model 2`. Its arm H said of the largest class:
 *
 * > `'db'` needs a `KLATCH_DB` scratch path, which the product ALREADY supports, so that class
 * > is a harness change and not a product one.
 *
 * That sentence was written from a source read, not from a drive. This round takes it.
 * Daedalus's Round 251 §7 called it "the only structural blocker of that size left standing."
 *
 * ## What this probe claims, and what it refuses to claim
 *
 * 1. **`KLATCH_DB` is load-bearing, driven two-sided** (arm B) — the same child process, run
 *    twice with two different scratch paths, creates the database at the path it was handed and
 *    not at the other one. The negative side is *a different scratch path*, never *no variable
 *    at all*: the honest negative control here would point the product at xian's real
 *    `klatch.db`, and a control that has to damage the thing it protects is not a control.
 *    Stated as the weaker two-sided test it is, on purpose.
 *
 * 2. **The `db` class is driveable under a scratch path** (arm D) — every member whose ONLY
 *    remaining blocking hazard is `db`, spawned with `KLATCH_DB` pointed into a tmpdir.
 *
 * 3. **It does not claim those probes are healthy.** Round 247 §4's warning stands: a green exit
 *    says the file still exits 0 today, not that what it measures is still true. And a RED under
 *    a scratch database is ambiguous in a way a red under the real one is not — see arm E.
 *
 * ## The safety design, because this is the first round to drive the DB class
 *
 * `klatch.db` is xian's real database and this probe spawns 30-odd files that were classified as
 * touching one. Three layers, in order of how much they would have to fail:
 *
 *   - A **byte copy of `klatch.db` is taken before the drive** and restored if anything moves it.
 *   - Its **sha256 is checked after every single driven file**, not once at the end, so the blast
 *     radius of a probe that bypasses `KLATCH_DB` is bounded to one file rather than the run.
 *   - Arm E **counts the members that spell `klatch.db` as a literal path** — the population that
 *     could bypass the variable at all — instead of assuming the variable reaches everyone.
 *
 * The middle layer is the one that matters. Checking integrity once at the end tells you
 * something was damaged; checking it after each file tells you what did it, and stops.
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
const VERBOSE = process.argv.includes('--verbose');

// Round 248: never `path.basename(fileURLToPath(import.meta.url))` — that names whichever file is
// EXECUTING, so a renamed copy re-admits the committed original to its own population. Built by
// concatenation so classifying on a substring cannot enrol this file in its own population.
const SELF = 'probe-round252-' + 'the-db-class-is-unblocked-by-a-variable-the-product-already-reads.mts';

const REAL_DB = path.join(REPO, 'klatch.db');
const SERVER_ENTRY = path.join(REPO, 'packages', 'server', 'src', 'index.ts');

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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round252-'));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Scanner and hazard model — Round 250's, unchanged
// ─────────────────────────────────────────────────────────────────────────────
//
// Deliberately a copy of Round 250's definitions rather than an import. Round 250 is a FILED
// ARTIFACT whose figures are cited in docs/research and in two memos; importing from it would
// make this round able to move its numbers, which is the trap Round 244 §7 named. Arm A is the
// two-sided control that this copy classifies the way the original does.

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

/**
 * Does the file spell the repo database as a literal path, rather than reaching it through the
 * product's own resolution?
 *
 * This is the question arm E exists to answer and it is the reason the per-file integrity check
 * is in the loop. `KLATCH_DB` is read in `packages/server/src/db/index.ts:7`; a probe that goes
 * through `getDb()` honours it for free. A probe that writes `path.join(REPO, 'klatch.db')`
 * itself does not, and no environment variable will reach it.
 */
const SPELLS_DB_LITERAL = /klatch\.db/;

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

function walk(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else if (/\.(mts|mjs|ts|js)$/.test(e.name) && rel !== SELF) out.push(rel);
  }
  return out;
}

const files = walk(SCRIPTS);
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

console.log(`\nRound 252 — the db class, driven under a scratch database`);
console.log(`Repo: ${REPO}`);
console.log(`Enumerated under scripts/ (recursive, dot-files excluded, SELF excluded): ${files.length}`);
console.log(`Scratch root: ${tmp}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — the copied hazard model classifies the way Round 250's does
// ─────────────────────────────────────────────────────────────────────────────
//
// Two-sided, on MINTED source, classified as a pure function of text. The fixtures are never
// written under scripts/ — Round 248's finding is that a file staged inside the enumerated tree
// enters the population it is supposed to be outside of.

{
  const positives: Array<[string, Hazard]> = [
    [`import Database from 'better-sqlite3';\nconst d = new Database('x');`, 'db'],
    [`const p = path.join(REPO, 'klatch.db');`, 'db'],
    [`import { getDb } from '../packages/server/src/db/index.js';`, 'db'],
    [`const port = 3001;`, 'port'],
    [`spawn('npx', ['tsx', 'packages/server/src/index.ts']);`, 'server'],
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
  // The `server` implication, asserted rather than assumed.
  const implies = ownHazards(scan(`spawn('npx',['tsx','packages/server/src/index.ts'])`).code).has('port');

  check('A', 'the hazard model copied from Round 250 classifies both ways, on minted source',
    posOk && negOk && implies,
    `${positives.length} positive fixtures each acquire their named hazard (${posOk}); ` +
      `${negatives.length} negatives acquire NO blocking hazard (${negOk}) — including one where ` +
      `both db markers appear in a COMMENT, which is the scanner's whole job. 'server' implies ` +
      `'port' (${implies}). This is a copy of Round 250's model, not an import of it: Round 250 ` +
      `is a filed artifact whose figures are cited in two memos, and importing from it would give ` +
      `this round the power to move its published numbers (Round 244 §7's trap).`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM B — KLATCH_DB is load-bearing, driven two-sided against the real product
// ─────────────────────────────────────────────────────────────────────────────
//
// Not a source read of `db/index.ts:7`. The same child, twice, with two different scratch paths.
//
// WHY THE NEGATIVE SIDE IS "A DIFFERENT SCRATCH" AND NOT "UNSET": with KLATCH_DB unset, the
// product resolves to xian's real klatch.db and `getDb()` runs initSchema() + runMigrations(),
// which WRITE. The textbook negative control here damages the artefact the probe exists to
// protect. So the claim earned is "the product opens the database at the path KLATCH_DB names",
// which is what the drive needs, and NOT "the product would otherwise open the repo database",
// which is read from db/index.ts:7-9 and labelled as read.

const realDbShaBefore = fs.existsSync(REAL_DB) ? sha256(REAL_DB) : null;
const realDbMtimeBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB).mtimeMs : null;
const backup = path.join(tmp, 'klatch.db.backup');
if (fs.existsSync(REAL_DB)) fs.copyFileSync(REAL_DB, backup);

// The driver lives at the REPO ROOT, dot-prefixed, and not in the tmpdir — because
// `packages/server/src/db/index.ts` imports `@klatch/shared`, and node resolves a bare specifier
// by walking up from the IMPORTING file. From /tmp that walk never reaches this repo's
// node_modules. Found by running it, not by reasoning about it. Dot-prefixed so the scripts/
// walk cannot see it either way, and deleted before arm D's blast-radius window opens.
const DRIVER_SRC = `
import { getDb } from './packages/server/src/db/index.ts';
const db = getDb();
db.prepare('SELECT 1').get();
console.log('OPENED');
`;
const driverFile = path.join(REPO, '.probe-round252-open-the-db.mts');
fs.writeFileSync(driverFile, DRIVER_SRC);

function openDbWith(scratch: string): { ok: boolean; out: string } {
  try {
    const out = execFileSync('npx', ['tsx', driverFile], {
      cwd: REPO, encoding: 'utf8', timeout: 120_000,
      env: { ...process.env, KLATCH_DB: scratch },
    });
    return { ok: /OPENED/.test(out), out: out.slice(-400) };
  } catch (e: any) {
    return { ok: false, out: String(e.stdout ?? '').slice(-200) + String(e.stderr ?? '').slice(-400) };
  }
}

{
  const a = path.join(tmp, 'side-a.db');
  const b = path.join(tmp, 'side-b.db');
  const ra = openDbWith(a);
  const aExistsAfterA = fs.existsSync(a);
  const bExistsAfterA = fs.existsSync(b);
  const rb = openDbWith(b);
  const bExistsAfterB = fs.existsSync(b);
  const realUnmoved = realDbShaBefore === null || sha256(REAL_DB) === realDbShaBefore;

  check('B', 'DRIVEN two-sided — the product opens the database KLATCH_DB names, and only that one',
    ra.ok && rb.ok && aExistsAfterA && !bExistsAfterA && bExistsAfterB && realUnmoved,
    `Run 1 (KLATCH_DB=side-a.db): getDb() succeeded (${ra.ok}); side-a.db exists ` +
      `(${aExistsAfterA}); side-b.db does NOT (${bExistsAfterA === false}). Run 2 ` +
      `(KLATCH_DB=side-b.db): succeeded (${rb.ok}); side-b.db now exists (${bExistsAfterB}). ` +
      `Real klatch.db sha256 unchanged across both (${realUnmoved}). ` +
      `${ra.ok && rb.ok ? '' : `stderr tail: ${(ra.ok ? rb.out : ra.out).slice(-300)} `}` +
      `**The negative side is a DIFFERENT SCRATCH, not an unset variable, and that is a weaker ` +
      `control said plainly rather than dressed up:** unset points getDb() at xian's real ` +
      `klatch.db and getDb() runs initSchema()+runMigrations(), which write. A control that has ` +
      `to damage the artefact it protects is not one. That the fallback is the repo database is ` +
      `READ from packages/server/src/db/index.ts:7-9, not driven, and is labelled as read.`);

  try { fs.rmSync(driverFile, { force: true }); } catch { /* best effort */ }
  check('B2', 'CONTROL — the minted driver is off disk before the blast-radius window opens',
    !fs.existsSync(driverFile),
    `${path.relative(REPO, driverFile)} removed (${!fs.existsSync(driverFile)}). It had to be ` +
      `written inside the repo for bare-specifier resolution to reach node_modules, so it is the ` +
      `one file this probe adds to the tree; asserted gone rather than assumed, because arm Z2's ` +
      `window opens after this point and would not have caught it.`);
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
    `Round 246 re-run live in ${((Date.now() - t0) / 1000).toFixed(0)} s (exit ${r246Exit}); ` +
      `its arm E reports ${r246Reported}, the ranked listing parsed here has ${population.length} ` +
      `entries. One source for the definition, not a second copy of it. ` +
      `(Round 250 measured 48 in this same way on 2026-09-21; the number moves with every commit ` +
      `to packages/ or to a probe, so it is re-taken here rather than quoted.)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM D — THE UNIT: drive every member blocked ONLY by `db`
// ─────────────────────────────────────────────────────────────────────────────

const DB_UNBLOCKED: Hazard[] = BLOCKING.filter((h) => h !== 'db');
const BUDGET_MS = 90_000;

type Outcome = { rel: string; code: number | null; ms: number; note: string; dbTouched: boolean };
const driven: Outcome[] = [];
const stillBlocked = new Map<string, string[]>();
let dbOnly: string[] = [];
let integrityBreachAt: string | null = null;
let repoDirtyBefore = new Set<string>();
let repoDirtyAfter: string[] = [];

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
    const remaining = [...hz].filter((h) => DB_UNBLOCKED.includes(h));
    // Blocked ONLY by db: nothing else blocking remains once a scratch path is supplied.
    // A file with no blocking hazard at all was already driveable in Round 250 and is NOT
    // this round's unit — counted separately so the delta this round buys is the delta and
    // not Round 250's 3 files recounted.
    if (remaining.length === 0 && hz.has('db')) dbOnly.push(rel);
    else if (remaining.length > 0) for (const h of remaining) {
      if (!stillBlocked.has(h)) stillBlocked.set(h, []);
      stillBlocked.get(h)!.push(rel);
    }
  }

  console.log(`\n── Driving ${dbOnly.length} db-only-blocked probe(s) under a scratch KLATCH_DB, ` +
    `${BUDGET_MS / 1000} s budget each ──\n`);

  // The blast-radius window opens HERE, not at the top — Round 250's second fault was a control
  // whose window was wider than its claim and which blamed the drive for my own session log.
  repoDirtyBefore = new Set(git(['status', '--porcelain']).split('\n').filter(Boolean));

  for (const rel of dbOnly) {
    const scratch = path.join(tmp, `drive-${path.basename(rel).replace(/[^a-z0-9]/gi, '-')}.db`);
    const t0 = Date.now();
    let note = '';
    const child = spawn('npx', ['tsx', path.join(SCRIPTS, rel)], {
      cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
      env: { ...process.env, KLATCH_DB: scratch },
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

    // PER-FILE integrity check. Not once at the end: that tells you something was damaged;
    // this tells you WHICH FILE did it, and stops before the next one.
    const shaNow = fs.existsSync(REAL_DB) ? sha256(REAL_DB) : null;
    const dbTouched = realDbShaBefore !== null && shaNow !== realDbShaBefore;
    if (dbTouched && !integrityBreachAt) {
      integrityBreachAt = rel;
      fs.copyFileSync(backup, REAL_DB);
      note += `${note ? '; ' : ''}TOUCHED THE REAL klatch.db — restored from backup, drive ABORTED`;
    }

    // Run 1's extractor took the LAST line matching /passed|failed|check/i, and for four of the
    // thirteen that line was the bare word `FAILED:` — a section header, not a verdict. Prefer a
    // line that carries a COUNT, and fall back to the last non-empty lines rather than to a word.
    const lines = tail.split('\n').map((l) => l.trim()).filter(Boolean);
    const headline =
      [...lines].reverse().find((l) => /\d+\s*(?:of\s*\d+\s*)?(?:regression\s*)?checks?\b|\d+\s+failed/i.test(l))
      ?? lines.slice(-2).join(' / ')
      ?? '';
    driven.push({ rel, code, ms, note: note || headline.slice(0, 160), dbTouched });
    console.log(`  ${code === 0 ? 'exit 0 ' : `exit ${code ?? '?'}`}  ${(ms / 1000).toFixed(1)}s  ` +
      `${path.basename(rel)}${fs.existsSync(scratch) ? '  [scratch used]' : ''}`);
    if (VERBOSE || code !== 0) console.log(`            ${(note || headline).slice(0, 220)}`);
    if (integrityBreachAt) break;
  }

  repoDirtyAfter = git(['status', '--porcelain']).split('\n').filter(Boolean);

  const green = driven.filter((d) => d.code === 0);
  const red = driven.filter((d) => d.code !== 0 && d.code !== null);
  const timedOut = driven.filter((d) => d.note.startsWith('TIMEOUT'));
  const usedScratch = dbOnly.filter((rel) =>
    fs.existsSync(path.join(tmp, `drive-${path.basename(rel).replace(/[^a-z0-9]/gi, '-')}.db`)));
  const totalS = driven.reduce((n, d) => n + d.ms, 0) / 1000;

  meas('D', 'THE UNIT — the db class, driven under a scratch KLATCH_DB',
    `${dbOnly.length}/${population.length} of the population are blocked ONLY by 'db'. ` +
      `Driven: ${driven.length} in ${totalS.toFixed(0)} s ` +
      `(${(totalS / Math.max(1, driven.length)).toFixed(1)} s each). ` +
      `exit 0: ${green.length} · non-zero: ${red.length} · timed out at ${BUDGET_MS / 1000} s: ${timedOut.length}. ` +
      `${red.length ? `Non-zero: ${red.map((d) => `${path.basename(d.rel)} (exit ${d.code})`).join('; ')}. ` : ''}` +
      `**${usedScratch.length}/${dbOnly.length} of them actually CREATED the scratch database ` +
      `they were handed.** That is the measurement this round was built to take and it does not ` +
      `say what the round was designed expecting. ` +
      (usedScratch.length === 0
        ? `**Not one. The unblock was not what unblocked them.** The 'db' gate held ${dbOnly.length} ` +
          `files back on a regex — 'names klatch.db, or imports better-sqlite3, or reaches ` +
          `db/queries.js' — and on the evidence of the drive these probes already isolate their ` +
          `own storage (they mint a database in their own tmpdir, which is why KLATCH_DB reached ` +
          `none of them). So the honest sentence is NOT "a scratch path unblocked the largest ` +
          `class." It is: **the largest blocking class was substantially an over-block, and the ` +
          `remedy designed for it was never exercised.** Round 250's arm A6 found the same shape ` +
          `in the 'server' marker, which over-blocked 39 files by matching any import from that ` +
          `workspace. Second sighting, in the class that replaced it as the largest. `
        : `${usedScratch.length} did, so for those the scratch path is load-bearing and arm B's ` +
          `two-sided drive is what makes running them safe. The other ${dbOnly.length - usedScratch.length} ` +
          `were held back by the classifier rather than by a database. `) +
      `Round 250 drove 3/48 for free; the delta this round adds is these ${driven.length}. ` +
      `**What a green exit does NOT say** (Round 247 §4): that the probe's subject is still there. ` +
      `**What a RED here does not say either** — see arm E.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM E — the ambiguity a scratch database introduces, counted not waved at
// ─────────────────────────────────────────────────────────────────────────────

{
  const literalSpellers = dbOnly.filter((rel) => SPELLS_DB_LITERAL.test(reachableCode(rel)));
  const viaProduct = dbOnly.filter((rel) => /db\/(?:queries|index)\.js/.test(reachableCode(rel)));
  const redRels = new Set(driven.filter((d) => d.code !== 0 && d.code !== null).map((d) => d.rel));
  const redAndLiteral = literalSpellers.filter((r) => redRels.has(r));

  meas('E', 'what a scratch database changes, and which members it cannot reach at all',
    `Of the ${dbOnly.length} db-only members: ${viaProduct.length} reach the database through the ` +
      `product's own resolution (db/queries.js or db/index.js) and therefore honour KLATCH_DB for ` +
      `free; ${literalSpellers.length} spell 'klatch.db' as a literal somewhere in their reachable ` +
      `source, and for those **no environment variable is guaranteed to reach them** — whether it ` +
      `does depends on what they do with the literal, which is not statically decidable and is not ` +
      `claimed here. That population is exactly why the integrity check in arm D's loop runs after ` +
      `EVERY file rather than once at the end. ` +
      `${redAndLiteral.length} of the non-zero exits are literal-spellers (${redAndLiteral.map((r) => path.basename(r)).join(', ') || 'none'}). ` +
      `**Rule: unblocking a class by redirecting a shared resource does not drive the same probe ` +
      `you were blocked from driving — it drives that probe against a DIFFERENT resource.** A red ` +
      `under a scratch database and a red under the real one are not the same verdict, and this ` +
      `round can only report the first. Saying "the db class is now driveable" without that clause ` +
      `would be the strongest sentence available and the wrong one.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM F — the remainder after the db unblock, and whether Round 251's lever moves it
// ─────────────────────────────────────────────────────────────────────────────

{
  const remainderUnique = new Set<string>();
  for (const [, v] of stillBlocked) for (const f of v) remainderUnique.add(f);

  meas('F', 'the remainder, re-classed after the db unblock',
    `${remainderUnique.size}/${population.length} still not driveable. ` +
      [...stillBlocked.entries()].sort((a, b) => b[1].length - a[1].length)
        .map(([h, v]) => `${h}: ${v.length}`).join(' · ') +
      `. (A file can appear in more than one class.) Round 250's arm H, for comparison, reported ` +
      `db 35 · mutate 28 · server 19 · port 19 · args 3 · suite 2 · model 2 over the same ` +
      `population — those figures are from a filed artifact and are QUOTED, not re-derived here.`);

  // Round 251 shipped `PORT` as a lever. Does it unblock the port class? Measured, not assumed.
  const portBlocked = (stillBlocked.get('port') ?? []).concat(stillBlocked.get('server') ?? []);
  const uniquePortBlocked = [...new Set(portBlocked)];
  const spellsPortItself = uniquePortBlocked.filter((rel) => /\b3001\b|\b5173\b/.test(scans.get(rel)?.code ?? ''));
  const leverPresent = fs.existsSync(path.join(REPO, 'packages/server/src/port.ts'))
    && /resolvePort/.test(fs.readFileSync(SERVER_ENTRY, 'utf8'));

  meas('G', "Round 251's PORT lever is in the product — and it does not by itself unblock the class",
    `packages/server/src/port.ts present and index.ts calls resolvePort (${leverPresent}, read ` +
      `this fire, not carried from the memo). ${uniquePortBlocked.length} population members are ` +
      `blocked by port and/or server; ${spellsPortItself.length} of them spell 3001 or 5173 in ` +
      `their OWN source. **The lever moved the product, not the harness.** Passing PORT=<free> to ` +
      `such a probe moves the server it spawns and leaves the probe connecting to 3001, so it goes ` +
      `red for a reason that has nothing to do with staleness — the same class of ambiguity arm E ` +
      `names for the database, and the reason this round did not attempt the port class on the ` +
      `strength of the lever landing. That class is ${spellsPortItself.length} file-by-file edits, ` +
      `not one environment variable; the db class was one variable because the product resolves ` +
      `the path and the probes mostly do not. **Rule: a product lever unblocks a harness class ` +
      `only where the harness had delegated the choice to the product in the first place.**`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM Z — controls
// ─────────────────────────────────────────────────────────────────────────────

const realDbShaAfter = fs.existsSync(REAL_DB) ? sha256(REAL_DB) : null;

check('Z1', "CONTROL — xian's klatch.db is byte-identical to where this probe found it",
  realDbShaBefore === null || realDbShaAfter === realDbShaBefore,
  `sha256 ${realDbShaBefore?.slice(0, 12) ?? '(absent)'}… before, ` +
    `${realDbShaAfter?.slice(0, 12) ?? '(absent)'}… after; mtime ` +
    `${realDbMtimeBefore ? new Date(realDbMtimeBefore).toISOString() : '(absent)'} → ` +
    `${fs.existsSync(REAL_DB) ? new Date(fs.statSync(REAL_DB).mtimeMs).toISOString() : '(absent)'}. ` +
    `${integrityBreachAt ? `BREACHED by ${integrityBreachAt}; restored from the byte copy taken before the drive and the drive was ABORTED there.` : 'No breach; the backup was never needed.'} ` +
    `A copy was taken before the drive regardless — the check that never fires is the one worth ` +
    `having when it does.`);

const introduced = repoDirtyAfter.filter((l) => !repoDirtyBefore.has(l));
check('Z2', 'CONTROL — the drive introduced nothing to the working tree, and packages/ is clean',
  introduced.length === 0 && git(['status', '--porcelain', 'packages/']).trim() === '',
  `${introduced.length} line(s) in git status appeared across the drive window` +
    `${introduced.length ? `: ${introduced.slice(0, 6).join(' | ')}` : ''}. ` +
    `git status --porcelain packages/ is ${git(['status', '--porcelain', 'packages/']).trim() === '' ? 'empty' : 'NOT empty'}. ` +
    `Window opens at the first spawn and closes when the last child exits (Round 250 fault 2).`);

const stagedUnderScripts = fs.readdirSync(SCRIPTS).filter((f) => f.startsWith('.') && /\.(mts|mjs)$/.test(f));
const portQuiet = !(await portAcceptsAConnection(3001, 800));
check('Z3', 'CONTROL — 3001 quiet at exit, no staged copies left under scripts/',
  stagedUnderScripts.length === 0,
  `3001 accepts a connection: ${!portQuiet} (reported, not asserted — xian may have npm run dev ` +
    `up, and this probe never spawns a server). Dot-prefixed staged files under scripts/ by ` +
    `readdirSync: ${stagedUnderScripts.length}${stagedUnderScripts.length ? ` (${stagedUnderScripts.join(', ')})` : ''}. ` +
    `Server entry sha256 ${sha256(SERVER_ENTRY).slice(0, 12)}… — this probe never writes it.`);

// Written braced for the self-citation trap — OWN_HAZARDS has to name the SDK to classify it —
// and then the run said the trap was not there: the marker is written as a REGEX, so the source
// carries `@anthropic-ai\/sdk` with an escaped slash and the plain needle occurs zero times.
// The defensive spelling is kept; the CLAIM that the naive version would have failed is not,
// because it was never driven and it happens to be false. Both counts are printed so the reader
// can see which spelling is present rather than take either of us on it.
const SDK_NEEDLE = '@anthropic' + '-ai/sdk';
const SDK_NEEDLE_ESCAPED = '@anthropic' + '-ai\\/sdk';
const ownSource = fs.readFileSync(path.join(SCRIPTS, SELF), 'utf8');
const importsSdk = new RegExp(`(?:import|require)[^\\n;]*['"\`]${SDK_NEEDLE.replace(/[/-]/g, '\\$&')}`).test(ownSource);

check('Z4', 'CONTROL — 0 model calls: nothing here IMPORTS the Anthropic SDK',
  !importsSdk,
  `Plain needle occurs ${ownSource.split(SDK_NEEDLE).length - 1}×; regex-escaped spelling ` +
    `${ownSource.split(SDK_NEEDLE_ESCAPED).length - 1}× (OWN_HAZARDS, where classifying the ` +
    `hazard requires naming it); imported: ${importsSdk ? 'YES' : 'no'}. "Names it" and "imports ` +
    `it" are different questions and this arm asks the second. **Run 1's version of this text ` +
    `claimed the naive occurrence-test "would have failed" — it would not have, because of that ` +
    `escaped slash, and I had not driven the counterfactual I was asserting. Withdrawn rather ` +
    `than left standing: a control arm that overstates its own near-miss is a control arm nobody ` +
    `should trust about anything else.** ` +
    `Asserted against this file's own source on disk rather than promised in prose. The drive ` +
    `spawns population members, and the 'model' hazard is a BLOCKING class none of them can be ` +
    `in and still reach arm D — a db-only member has no 'model' hazard by construction.`);

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }

summariseAndExit({ probeName: SELF, results, skipped });
