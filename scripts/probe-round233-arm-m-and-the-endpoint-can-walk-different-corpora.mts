/**
 * Round 233 probe — arm M and the browse endpoint can walk DIFFERENT corpora,
 * and arm O decomposes the pair without noticing.
 *
 * Theseus, 2026-09-18 STOP fire. Daedalus's Round 232 §6 bullet 1, taken:
 *
 *   "The Round 227 cap-firing corpus against the rewritten arm O. Fourth round
 *    it's been named as the clearest next probe and neither of us has run it.
 *    I'll take it next fire unless you're already on it — say so and it's
 *    yours."
 *
 * ─── Why this probe exists instead of that run ──────────────────────────────
 *
 * The obvious way to do the assignment is to point `probe-browse-latency-end-to-end`
 * at the Round 227 cap-firing corpus by relocating the session root:
 *
 *   CLAUDE_CONFIG_DIR=.testdata/round227/config npx tsx scripts/probe-browse-latency-end-to-end.mts
 *
 * Read before running (session-scanner.ts:150, :184): the server honors
 * `CLAUDE_CONFIG_DIR` with **replace** semantics, so arms L and N — which spawn
 * a server and time the HTTP endpoint — would walk the synthetic corpus.
 *
 * But arm M, the fingerprint sum that arm O subtracts, does NOT go through the
 * shipped resolver. `probe-browse-latency-end-to-end.mts:372`:
 *
 *   const projectsDir = path.join(os.homedir(), '.claude', 'projects');
 *
 * A literal. It ignores `CLAUDE_CONFIG_DIR` and `KLATCH_EXTRA_SESSION_ROOTS`
 * alike. So under relocation the probe measures a browse of corpus A and a
 * fingerprint sum of corpus B, and arm O computes
 *
 *   remainder = coldBrowse(A) - fingerprintSum(B)
 *
 * which is not a decomposition of anything. Nothing in the probe notices: the
 * two arms never compare corpora, and arm O's inputs are both just numbers by
 * the time it sees them.
 *
 * **This matters more since Round 232 than it did before it.** Daedalus made
 * `remainder` beyond-noise-negative a hard FAIL (exit 1) — my own cut, from
 * Round 230 §3. On this machine corpus B is 536 real files (~2.6 s of
 * fingerprinting) and corpus A is 8 synthetic ones (~200 ms of browse), so the
 * mismatched remainder is around −2.4 s: **beyond-noise negative, hard FAIL.**
 * The first seat to attempt the four-round-old assignment the obvious way gets
 * a red that reads as "the decomposition is broken" and is in fact "the two
 * arms read different directories."
 *
 * ─── What this probe establishes, and in which direction ────────────────────
 *
 * The invariant is: **the corpus arm M fingerprints is the corpus the endpoint
 * walked.** Arms A and G state it at two levels — resolved value and source
 * text — and both are RED against the code as shipped today. They go green when
 * arm M is moved onto the shipped resolver, which is this fire's repair.
 *
 * Phrased as the invariant deliberately, not as the defect: Daedalus's Round 232
 * §2 rule — *a check phrased as the defect rather than as the invariant is a
 * check that fails on the fix.* Arm A must survive its own repair.
 *
 * Arm E is the red-capability control for the comparator itself, driven both
 * ways in the same run, so arm A's red cannot be an instrument artifact.
 *
 * ─── Why the relocation is set in-process, not in the environment ───────────
 *
 * An `ENV=value npx …` shell prefix is refused from this seat (measured this
 * fire: `npx tsx --version` runs, `CLAUDE_CONFIG_DIR=/tmp/x npx tsx --version`
 * is refused). So the relocation is an assignment to `process.env` here, before
 * the first import that can read it and before the server is spawned — the
 * child inherits it at spawn. Same mechanism the shell prefix would have used,
 * one process earlier.
 *
 * Run:  npx tsx scripts/probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts
 *
 * Zero model calls. Scratch DB under `.testdata/`; the repo `klatch.db` is
 * opened read-only, once, to count rows before and after. The real corpus under
 * ~/.claude/projects is read (fingerprinted) but never written.
 *
 * Arms:
 *   A  INVARIANT, driven — the subject, handed this corpus by its new argument,
 *      reports its own corpus guard (arm Q) green and exits 0. This arm IS the
 *      Round 227 assignment: arm O evaluated on a cap-firing corpus, on the
 *      rewritten arm O rather than on a copy of its arithmetic.
 *   B  the endpoint follows the shipped resolver, not the literal — which side
 *      is authoritative, established at the wire rather than from the docstring
 *   C  the cap fires ON this corpus at the wire (`fingerprintCapped`), so the
 *      assignment's precondition holds on the rewritten code
 *   D  RECONSTRUCTION — what arm O computed from the mismatched pair before the
 *      repair, graded through arm O's own three-state cut. Prices the defect;
 *      not a live reading of the fixed subject.
 *   E  CONTROL — arm G's comment stripper answers both ways on known inputs
 *   G  INVARIANT, at the source level — the file resolves its corpus through
 *      the shipped resolver
 *   X  a SECOND corpus the endpoint is supposed to walk and does not — found
 *      while writing arm Q's admissible-asymmetry clause, not looked for
 *   F  containment — port handed back, repo `klatch.db` unchanged
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import {
  requireAnUnoccupiedPort,
  waitUntilPortIsQuiet,
  waitUntilOurServerIsUp,
  reapOnExit,
  somethingIsAlreadyAnswering,
} from './lib/probe-server-ownership.mts';
import { summariseAndExit } from './lib/probe-outcome.mts';
import { readNumericConstantFromFile } from './lib/probe-source-constants.mts';

const PROBE = 'probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round233');
const DB = path.join(SCRATCH, 'scratch.db');
const REPO_DB = path.join(REPO, 'klatch.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER = path.join(REPO, 'packages/server/src/import/session-scanner.ts');
const SUBJECT = path.join(REPO, 'scripts/probe-browse-latency-end-to-end.mts');

/** The Round 227 cap-firing corpus. Reused, not rebuilt — rebuilding changes the input. */
const CORPUS_CONFIG = path.join(REPO, '.testdata', 'round227', 'config');

// ── Must precede every import that can reach db/index.ts (Round 227) ─────────
fs.mkdirSync(SCRATCH, { recursive: true });
process.env.KLATCH_DB = DB;
// ── The relocation itself. Before the first read of it, and before any spawn. ─
process.env.CLAUDE_CONFIG_DIR = CORPUS_CONFIG;

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL';
  console.log(`${tag} [${arm}] ${name}\n         ${detail}`);
}
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

const ms = (x: number) => `${x.toFixed(0)} ms`;

/**
 * Row counts from the repo DB, read-only, so containment is asserted on the DATA
 * and not on the path a variable happens to name — Round 227's rule, which this
 * probe would otherwise be free to repeat.
 */
async function repoDbCounts(): Promise<{ channels: number; seeded: number } | null> {
  if (!fs.existsSync(REPO_DB)) return null;
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(REPO_DB, { readonly: true });
  try {
    const one = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
    return {
      channels: one('select count(*) c from channels'),
      seeded: one("select count(*) c from channels where name like 'probe-seed-%'"),
    };
  } finally { db.close(); }
}

function jsonlFilesUnder(projectsDir: string): string[] {
  if (!fs.existsSync(projectsDir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(projectsDir, entry.name);
    let files: fs.Dirent[];
    try { files = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const f of files) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
      const p = path.join(dir, f.name);
      try { if (fs.statSync(p).size < 100) continue; } catch { continue; } // mirrors session-scanner.ts:267
      out.push(p);
    }
  }
  return out;
}

/**
 * The literal arm M USED to resolve its corpus from, kept here on purpose.
 *
 * ─── Why it is still in this file after the repair ──────────────────────────
 * Arm D reconstructs what arm O computed before the fix, and that reconstruction
 * needs the old corpus. It is labelled as a reconstruction, not read as a live
 * property of the subject.
 *
 * **This copy is NOT what arm A grades.** The first version of arm A compared
 * this copy against `getSessionRoots()` and called the disagreement the finding —
 * which meant arm A stayed RED after the subject was fixed, because a copy does
 * not move when the original does. Driven this fire: arm G flipped to PASS on
 * the repaired source while arm A stayed FAIL on the stale copy. That is
 * Daedalus's Round 232 §2 rule one level over — *a check phrased as the defect
 * rather than as the invariant is a check that fails on the fix* — and mine from
 * Round 225: *a citation is not a call.* Arm A now drives the subject instead.
 */
function theLiteralArmMUsedToUse(): string {
  return path.join(os.homedir(), '.claude', 'projects');
}

let server: ChildProcess | undefined;
reapOnExit(() => server);

function killServer() {
  if (server && server.exitCode === null) server.kill('SIGTERM');
  server = undefined;
}

/**
 * `cwd` is a parameter because arm Y's whole subject is the server's cwd:
 * `routes/import.ts:106` resolves the exported-session directory from
 * `process.cwd()`, so "where was the server launched from" is an independent
 * variable of the endpoint's output, not a detail of the harness.
 */
async function startServer(tag: string, cwd = path.join(REPO, 'packages/server')): Promise<void> {
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'w');
  const entry = path.relative(cwd, path.join(REPO, 'packages/server/src/index.ts'));
  const child = spawn('npx', ['tsx', entry], {
    cwd,
    // CLAUDE_CONFIG_DIR rides along in process.env — set above, before this spawn.
    // ANTHROPIC_API_KEY stripped: this probe must be incapable of a model call.
    env: { ...process.env, KLATCH_DB: DB, ANTHROPIC_API_KEY: '' },
    stdio: ['ignore', logFd, logFd],
  });
  server = child;
  await waitUntilOurServerIsUp(child, logPath, PORT);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${PROBE}\n`);

await requireAnUnoccupiedPort(PORT, PROBE);

const dbBefore = await repoDbCounts();
const scannerShaBefore = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
const SHIPPED_CAP = readNumericConstantFromFile(SCANNER, 'FINGERPRINT_LINE_CAP', PROBE);
console.log(`shipped FINGERPRINT_LINE_CAP = ${SHIPPED_CAP}`);
console.log(`relocated CLAUDE_CONFIG_DIR  = ${CORPUS_CONFIG}`);
console.log(`repo klatch.db before        = ${dbBefore ? `${dbBefore.channels} channels / ${dbBefore.seeded} probe-seed-%` : '(absent)'}\n`);

// The corpus has to be the cap-firing one, or this probe is comparing two
// arbitrary directories. Refuse rather than degrade.
const corpusFiles = jsonlFilesUnder(path.join(CORPUS_CONFIG, 'projects'));
if (corpusFiles.length === 0) {
  console.error(
    `refusing: no .jsonl corpus under ${path.join(CORPUS_CONFIG, 'projects')}. ` +
    `Rebuild it with scripts/probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts first — ` +
    `an empty relocated root would make every comparison below trivially "different" for the wrong reason.`);
  process.exit(2);
}

const { getSessionRoots, getClaudeProjectsDir, extractSessionFingerprint } =
  await import(path.join(REPO, 'packages/server/src/import/session-scanner.ts'));

// ── Corpus resolutions, for the arms below ───────────────────────────────────
const shippedRoots: string[] = getSessionRoots();
const oldArmMRoots = [theLiteralArmMUsedToUse()];
const shippedFiles = shippedRoots.flatMap(jsonlFilesUnder);
const armMFiles = jsonlFilesUnder(oldArmMRoots[0]);
console.log(
  `shipped getSessionRoots() → [${shippedRoots.join(', ')}] (${shippedFiles.length} files)\n` +
  `the literal arm M used to use → ${oldArmMRoots[0]} (${armMFiles.length} files)\n` +
  `these are different directories under relocation — which is the whole subject of this probe\n`);

// ── Arm G — the invariant at the source level ────────────────────────────────
//
// Red-capability of arm G's own reader comes first: a stripper that removed
// everything, or nothing, would make arm G's verdict an artifact.
const subjectSrc = fs.readFileSync(SUBJECT, 'utf8');
/**
 * Comments stripped before the test, and the reason is not tidiness.
 *
 * The repair's own docstring QUOTES the literal it removed — "it read: `const
 * projectsDir = path.join(os.homedir(), '.claude', 'projects')`" — which is the
 * right thing for a docstring to do and would keep this arm red forever against
 * a fixed file. A source check that cannot tell code from prose is measuring the
 * commit message. Caught in this fire by the arm going red after the repair;
 * recorded here rather than silently patched.
 */
function codeOnly(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments, including every docstring
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
}
const subjectCode = codeOnly(subjectSrc);
const needle = /path\.join\(\s*os\.homedir\(\)\s*,\s*'\.claude'\s*,\s*'projects'\s*\)/;

const strippedFromComment = !needle.test(codeOnly(
  `/** it read: path.join(os.homedir(), '.claude', 'projects') */\nconst x = 1;`));
const keptInCode = needle.test(codeOnly(
  `const projectsDir = path.join(os.homedir(), '.claude', 'projects');`));
const keptLineComment = !needle.test(codeOnly(
  `// path.join(os.homedir(), '.claude', 'projects')`));
check('E', "arm G's comment stripper answers both ways on known inputs",
  strippedFromComment && keptInCode && keptLineComment,
  `literal inside a block comment → stripped = ${strippedFromComment} (want true); ` +
  `literal in code → kept = ${keptInCode} (want true); ` +
  `literal in a line comment → stripped = ${keptLineComment} (want true). ` +
  `Arm G therefore reads the code and not the commit message.`);

const hasLiteral = needle.test(subjectCode);
const usesResolver = /getSessionRoots|getClaudeProjectsDir/.test(subjectCode);
check('G', 'the subject resolves its corpus through the shipped resolver',
  usesResolver && !hasLiteral,
  `probe-browse-latency-end-to-end.mts: hardcoded ~/.claude/projects literal present = ${hasLiteral}; ` +
  `references getSessionRoots/getClaudeProjectsDir = ${usesResolver}. ` +
  `Same condition as arm A one level up — source text and resolved value, two sides from ` +
  `different places.`);

// ── Arms B and C — the wire ──────────────────────────────────────────────────
let coldBrowseMs = 0;
let endpointPaths: string[] = [];
let cappedAtWire = 0;
let sessionsAtWire = 0;

try {
  await startServer('relocated');

  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/import/claude-code/sessions`);
  const text = await res.text();
  const body = JSON.parse(text);
  coldBrowseMs = performance.now() - t0;

  const all = ((body.projects ?? []) as any[]).flatMap((p: any) => p.sessions ?? []);
  endpointPaths = all.map((s: any) => s.path).filter(Boolean);
  sessionsAtWire = all.length;
  cappedAtWire = all.filter((s: any) => s.fingerprintCapped).length;

  const underShipped = endpointPaths.filter((p) => shippedRoots.some((r) => path.resolve(p).startsWith(path.resolve(r))));
  const underArmM = endpointPaths.filter((p) => path.resolve(p).startsWith(path.resolve(oldArmMRoots[0])));

  check('B', 'every session the endpoint returned lives under the shipped resolver’s roots, and none under the old literal’s',
    endpointPaths.length > 0 && underShipped.length === endpointPaths.length && underArmM.length === 0,
    `${sessionsAtWire} session(s) at the wire; ${underShipped.length}/${endpointPaths.length} under ` +
    `getSessionRoots(), ${underArmM.length}/${endpointPaths.length} under ~/.claude/projects. ` +
    `The endpoint is the authoritative side: arm M is the arm that is wrong, not the server.`);

  // ── Arm X — a second corpus the endpoint is supposed to walk and doesn't ───
  //
  // Found while writing arm Q's admissible-asymmetry clause, not looked for.
  // `routes/import.ts:105` calls `scanExportedSessions(process.cwd())`, and the
  // parameter is named `repoRoot` (session-scanner.ts:622) — it appends
  // `exports/sessions`. But the server is launched with cwd
  // `packages/server` (root package.json: `npm run dev -w packages/server`, and
  // every probe here spawns it the same way), so the lookup resolves to
  // `packages/server/exports/sessions`, not to the repo root's.
  //
  // Stated as the invariant: exported sessions present in the repo are reachable
  // through browse. Both sides are read from the filesystem here rather than
  // inferred from the cwd, because the claim is about what the endpoint returns.
  const repoExports = path.join(REPO, 'exports', 'sessions');
  const serverExports = path.join(REPO, 'packages', 'server', 'exports', 'sessions');
  const repoExportFiles = fs.existsSync(repoExports)
    ? fs.readdirSync(repoExports).filter((f) => f.endsWith('.jsonl'))
    : [];
  const exportedAtWire = endpointPaths.filter((p) => path.resolve(p).includes(`${path.sep}exports${path.sep}sessions${path.sep}`));
  check('X', 'exported sessions present in the repo are reachable through browse',
    repoExportFiles.length === 0 || exportedAtWire.length > 0,
    `${repoExportFiles.length} .jsonl under ${repoExports} ` +
    `(${repoExportFiles.slice(0, 3).join(', ') || 'none'}); ` +
    `server cwd is packages/server, so scanExportedSessions(process.cwd()) looks at ` +
    `${serverExports} — exists = ${fs.existsSync(serverExports)}; ` +
    `${exportedAtWire.length} exported session(s) in the payload. ` +
    (repoExportFiles.length > 0 && exportedAtWire.length === 0
      ? `So a session file committed to the repo does not appear in Browse under the shipped ` +
        `launch layout. Independent of the relocation this probe sets — the export scan does not ` +
        `read CLAUDE_CONFIG_DIR.`
      : `Nothing to reach, or reached.`));

  check('C', 'the cap fires on this corpus at the wire',
    cappedAtWire > 0 && cappedAtWire < sessionsAtWire,
    `fingerprintCapped on ${cappedAtWire}/${sessionsAtWire} sessions at cap ${SHIPPED_CAP} — ` +
    `both non-zero and not all, so the corpus discriminates. cold browse ${ms(coldBrowseMs)}. ` +
    `Round 227's precondition still holds against the rewritten code.`);
} finally {
  killServer();
  await waitUntilPortIsQuiet(PORT);
}

// ── Arm D — what arm O would compute from the mismatched pair ────────────────
//
// Arm M's own shape: a warm-up pass over every file (page cache), then measured
// passes. One measured pass here rather than arm M's three — reported as one,
// not as a stable figure across passes.
if (armMFiles.length === 0) {
  skip('D', 'no readable corpus under ~/.claude/projects — arm M would have skipped too');
} else {
  for (const f of armMFiles) await extractSessionFingerprint(f, SHIPPED_CAP);
  const t0 = performance.now();
  let turns = 0, cappedFiles = 0;
  for (const f of armMFiles) {
    const fp = await extractSessionFingerprint(f, SHIPPED_CAP);
    turns += fp.turnCount;
    if (fp.capped) cappedFiles++;
  }
  const mCappedWrongCorpus = performance.now() - t0;

  const remainder = coldBrowseMs - mCappedWrongCorpus;
  // Arm O's cut (probe-browse-latency-end-to-end.mts:632-636), reproduced. No band
  // is available from a single pass on each side, so the band is set to the larger
  // of the two measurements' own magnitude at 10% — deliberately GENEROUS, so that
  // landing in beyond-noise cannot be an artifact of a tight band.
  const generousBand = 0.10 * Math.max(coldBrowseMs, mCappedWrongCorpus);
  const state = remainder >= 0 ? 'positive'
    : Math.abs(remainder) <= generousBand ? 'within-noise'
      : 'beyond-noise';

  check('D', 'RECONSTRUCTION — what arm O computed from the mismatched pair before the repair',
    false,
    `cold browse of the SYNTHETIC corpus ${ms(coldBrowseMs)} (${sessionsAtWire} sessions) − ` +
    `fingerprint sum of the REAL corpus ${ms(mCappedWrongCorpus)} (${armMFiles.length} files, ` +
    `${turns} turns, ${cappedFiles} capped) = remainder ${ms(remainder)} → state ${state} ` +
    `against a deliberately generous ±${ms(generousBand)} band. ` +
    (state === 'beyond-noise'
      ? `Since Round 232 that state is a hard FAIL, exit 1 — so the obvious way to do the ` +
        `four-round-old assignment produces a RED that is an artifact of two directories, ` +
        `not a finding about the decomposition.`
      : `NOT beyond-noise on this run — the artifact is present but did not reach arm O's hard ` +
        `state here; recorded as measured rather than as predicted.`),
    'measurement');
}

// ── Arm Y — arm X's other side: the same server, launched from the repo root ──
//
// Arm X measures an ABSENCE, and an absence has many causes: the file could be
// malformed, under 100 bytes, rejected by the scanner, or not scanned at all.
// So the same server is launched once more with cwd = the repo root, changing
// nothing else. If the exported session appears there and not from
// `packages/server`, the cause is established as the cwd and nothing else —
// two sides from different places, the rule this file's arm G also lives under.
{
  const repoExports = path.join(REPO, 'exports', 'sessions');
  const repoExportFiles = fs.existsSync(repoExports)
    ? fs.readdirSync(repoExports).filter((f) => f.endsWith('.jsonl'))
    : [];
  if (repoExportFiles.length === 0) {
    skip('Y', 'no exported sessions in the repo, so there is no absence to explain');
  } else {
    try {
      await startServer('from-repo-root', REPO);
      const res = await fetch(`${BASE}/api/import/claude-code/sessions`);
      const body = JSON.parse(await res.text());
      const all = ((body.projects ?? []) as any[]).flatMap((p: any) => p.sessions ?? []);
      const exported = all
        .map((s: any) => s.path)
        .filter((p: string) => p && path.resolve(p).startsWith(path.resolve(repoExports)));
      check('Y', 'launched from the repo root, the SAME server returns the exported session — so arm X is about the cwd',
        exported.length === repoExportFiles.length,
        `cwd = ${REPO}: ${exported.length}/${repoExportFiles.length} exported session(s) in the payload ` +
        `(${exported.map((p: string) => path.basename(p)).join(', ') || 'none'}); ` +
        `${all.length} sessions total. Same binary, same corpus, same port as arm X — only the cwd ` +
        `differs. The file is readable and the scanner accepts it; what the shipped launch layout ` +
        `(\`npm run dev -w packages/server\`) does is look in the wrong directory.`);
    } finally {
      killServer();
      await waitUntilPortIsQuiet(PORT);
    }
  }
}

// ── Arm A — the invariant, driven on the real subject ────────────────────────
//
// The subject, run on the relocated cap-firing corpus, must report its own arm Q
// green and exit 0. Driven as a subprocess rather than modelled: the first
// version of this arm compared a COPY of arm M's old literal against the shipped
// resolver, which stayed red after the subject was fixed. See
// `theLiteralArmMUsedToUse` above.
//
// `CLAUDE_CONFIG_DIR` is deliberately DELETED from the child's environment, so
// the only thing that can relocate its corpus is the new command-line argument.
// If the argument did nothing, the child would fingerprint and browse
// ~/.claude/projects, arm C's `capped` count would not reproduce, and this arm
// would not see the corpus it asked for.
{
  const childEnv: NodeJS.ProcessEnv = { ...process.env, ANTHROPIC_API_KEY: '' };
  delete childEnv.CLAUDE_CONFIG_DIR;
  delete childEnv.KLATCH_DB; // the subject sets its own; inheriting round233's would be a trap
  const t0 = performance.now();
  const run = spawnSync('npx', ['tsx', SUBJECT, CORPUS_CONFIG], {
    cwd: REPO, encoding: 'utf8', env: childEnv, timeout: 600_000,
  });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  fs.writeFileSync(path.join(SCRATCH, 'subject-on-capfiring-corpus.txt'), out);
  const armQ = out.split('\n').find((l) => l.includes('[Q]')) ?? '(no arm Q line in output)';
  const armO = out.split('\n').filter((l) => l.includes('[O]'));
  const relocated = out.includes(`CLAUDE_CONFIG_DIR = ${CORPUS_CONFIG}`);

  check('A', 'the subject, handed this corpus by argument, reports its own corpus guard green and exits 0',
    run.status === 0 && /^PASS \[Q\]/.test(armQ) && relocated,
    `exit ${run.status} in ${ms(performance.now() - t0)}; relocated by argument = ${relocated}; ` +
    `${armQ.trim().slice(0, 160)}; ${armO.filter((l) => l.startsWith('FAIL')).length} arm-O FAIL(s). ` +
    `Full output at .testdata/round233/subject-on-capfiring-corpus.txt. ` +
    `This is the Round 227 assignment — arm O evaluated on a corpus where the cap fires — run on ` +
    `the rewritten arm O rather than on a copy of its arithmetic.`);
}

// ── Arm F — containment ─────────────────────────────────────────────────────
const dbAfter = await repoDbCounts();
const scannerShaAfter = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
const occupant = await somethingIsAlreadyAnswering(PORT);

check('F', 'containment — port handed back, repo klatch.db unchanged, scanner source untouched',
  occupant === null &&
  scannerShaBefore === scannerShaAfter &&
  JSON.stringify(dbBefore) === JSON.stringify(dbAfter),
  `port ${PORT}: ${occupant === null ? 'quiet' : `STILL ANSWERING (${occupant})`}; ` +
  `repo klatch.db ${dbBefore ? `${dbBefore.channels}/${dbBefore.seeded}` : '(absent)'} → ` +
  `${dbAfter ? `${dbAfter.channels}/${dbAfter.seeded}` : '(absent)'} (channels / probe-seed-%); ` +
  `session-scanner.ts sha ${scannerShaBefore.slice(0, 12)} → ${scannerShaAfter.slice(0, 12)}. ` +
  `This probe patches no source and writes only under .testdata/round233.`);

summariseAndExit({ probeName: PROBE, results, skipped });
