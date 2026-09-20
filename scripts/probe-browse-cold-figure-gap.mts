/**
 * Round 153 — close the cold-figure gap that Rounds 147 and 148 both left open.
 *
 * The open item, in both our words. Daedalus's Round 147 fingerprint-cache doc
 * (`docs/fingerprint-cache-2026-09-04.md`) reports cache-cold browse against
 * `~/.claude/projects` at **1477 ms**, measured at the endpoint with the page
 * cache pre-warmed. My Round 148 probe measured the same endpoint, same root,
 * same discipline, at **2164 ms** and **2177 ms** on a second fresh server —
 * 1.47x his figure and stable across two servers. Both of us wrote it up as
 * unexplained and neither of us ran the discriminating arm. His 9/4 STOP memo
 * lists it as still open; so does my 9/4 WORK log. It has now been carried
 * across two fires by two agents, which is exactly the shape of a number that
 * quietly becomes folklore.
 *
 * The hypothesis this probe exists to kill or confirm. The two runs were not
 * measuring the same build. Daedalus measured at `dba7699` (09:23). Two hours
 * later `18d4631` (10:18, xian's ruling) raised FINGERPRINT_LINE_CAP from
 * **1500 to 50_000**. My run was after it. Round 143 had already priced that
 * change in isolation at **+645 ms on a 1387 ms browse** — and 1477 + 645 =
 * 2122, which is 2% from my 2164.
 *
 * That arithmetic is suggestive and is NOT a measurement: it crosses two runs,
 * two corpora (506 files / 547 MB vs 516 / 531 MB), and two machine states.
 * This probe does it as one run, one corpus, one machine state, back to back:
 *
 *   arm B  cap 50_000 (shipped)  — cache-cold browse at the endpoint
 *   arm C  cap 1_500 (patched)   — the same, one server generation later
 *   arm D  cap 50_000 again      — control, to show B is not drift
 *
 * If C lands near 1477 and B - C lands near 645, the gap is closed: it was
 * never a discrepancy, it was xian's cap ruling showing up at the endpoint,
 * and the ~690 ms it costs on every cache-cold browse is a real number nobody
 * has written down. If C does NOT land near 1477, the cap is not the whole
 * story and the residual is the finding — three other commits touched the
 * scanner between the two runs (`e1ee197` comment-only, `4602561` multi-root
 * walk) and the residual would be theirs to explain.
 *
 * Also tests the second candidate, for free. My Round 148 probe read BOTH
 * corpora (989 MB) to equalise the page cache; Daedalus read one (531 MB). On a
 * machine under memory pressure the extra 456 MB could have evicted the shipped
 * corpus's own pages, making my "page-cache-warm" number partly a disk number.
 * This probe warms the shipped root ONLY. If arm B still reproduces ~2164 under
 * a single-corpus warm, that hypothesis is dead and the cap is the live one.
 *
 * Run:  npx tsx scripts/probe-browse-cold-figure-gap.mts
 *
 * Zero model calls. One scratch DB under `.testdata/`; xian's `klatch.db` is
 * never opened. The corpus is read-only throughout.
 *
 * ─── On source mutation: there is none any more (Round 237) ────────────────
 * Arm C needs a cap the shipped code did not offer at the endpoint.
 * `extractSessionFingerprint` has always taken `lineCap` as a parameter, but the
 * route called it with the default, so from Round 153 until 2026-09-19 this probe
 * **wrote a patched `session-scanner.ts` to disk**, booted a server against it,
 * and restored the bytes in a `finally`, guarded by a skip on "the constant is
 * not the shape I expect".
 *
 * That guard is the one Theseus's Round 236 finding is about. A skip renders
 * "the feature shipped" and "this arm is missing" indistinguishable, and the
 * constant's spelling had already moved once — `50000` → `50_000` on 2026-09-04,
 * which killed one probe outright and gave another a cap 1000x too small.
 *
 * `resolveFingerprintLineCap()` is the lever that retires it. Arm C now sets
 * `KLATCH_FINGERPRINT_LINE_CAP` on the environment of the server it spawns. This
 * probe reads `session-scanner.ts` (for the shipped cap, spelling-tolerantly) and
 * never writes it; a `*` check asserts the file is byte-identical at exit, which
 * is now a statement about a file nothing in this process opens for writing.
 *
 * The cap is still verified by its EFFECT, not by the apparatus: Round 143 found
 * the 1500 cap bit 11 of 506 files, so arm C must come back with
 * `fingerprintCapped` TRUE on some sessions and arm B with none. "The variable
 * was set" is exactly as weak a claim as "the file was patched" — arm E is what
 * proves the server we measured was actually running the cap we asked for.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import readline from 'readline';
import { spawn } from 'child_process';
import { waitUntilPortIsQuiet } from './lib/probe-server-ownership.mts';
import { readNumericConstant } from './lib/probe-source-constants.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'browse-cold-figure-gap');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);

/**
 * An export-free root, so the repo's own `exports/sessions/` is not in the corpus
 * being priced. Round 234 fixed the export scan to resolve the repo root from the
 * module's location; correct, and it put a 3.86 MB export into the payload of
 * every probe that measures `~/.claude/projects` — including this one, whose arm
 * A counts files on disk under the shipped root and then asserts the endpoint
 * returns that many. `KLATCH_EXPORT_ROOT` (Round 235) is replace-semantics, so
 * pointing it at a directory with no `exports/sessions/` is how a probe gets an
 * empty export corpus. Asserted by effect in every arm, not assumed.
 */
const EXPORT_FREE_ROOT = path.join(SCRATCH, 'no-exports');

const HOME = os.homedir();
const ROOT_SHIPPED = path.join(HOME, '.claude', 'projects');

const WARM_SAMPLES = 5;

/** The figures this probe exists to reconcile. */
const DAEDALUS_COLD_R147 = 1477; // docs/fingerprint-cache-2026-09-04.md, cap 1500
const THESEUS_COLD_R148 = 2164; // docs/second-corpus-browse-2026-09-04.md, cap 50_000
const R143_CAP_DELTA = 645; // docs/scan-cap-latency-2026-09-03.md, 1500 -> uncapped

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
// This probe has no skip path. It had two — both downstream of arm C's source
// patch, which could fail to match the literal it expected — and Round 237
// removed the patch, so neither condition can arise. A skip helper kept for a
// case that can no longer occur is the same stale guard in miniature: the next
// reader would take "0 skipped" as evidence that something was checked.

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const ms = (n: number) => `${n.toFixed(0)} ms`;
const mb = (n: number) => `${(n / 1048576).toFixed(0)} MB`;
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// ── Source guard ─────────────────────────────────────────────────────────────

const SCANNER_ORIGINAL = fs.readFileSync(SCANNER);
const SCANNER_SHA = crypto.createHash('sha256').update(SCANNER_ORIGINAL).digest('hex');

/**
 * The shipped cap, READ FROM SOURCE rather than hardcoded — spelling-tolerantly,
 * via the reader that exists because `50000` became `50_000` on 2026-09-04 and
 * broke two probes in two different ways. Arm B's label and arm E's "does not
 * bite" assertion are both about this number; a stale copy of it would make both
 * of them describe a cap the server is not running.
 */
const CAP_SHIPPED_VALUE = readNumericConstant(
  SCANNER_ORIGINAL.toString('utf8'), 'FINGERPRINT_LINE_CAP', 'probe-browse-cold-figure-gap');
const CAP_PATCHED_VALUE = 1_500;

/**
 * Read-only, and that is the point. Since Round 237 this probe sets
 * `KLATCH_FINGERPRINT_LINE_CAP` on the server it spawns instead of rewriting the
 * scanner, so there is nothing to restore — this function now exists to *witness*
 * that, by proving the file on disk is byte-identical to the one captured at
 * start. It never writes.
 */
function scannerUnchanged(): boolean {
  return crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex') === SCANNER_SHA;
}

console.log(
  `${SCANNER_REL} captured at sha256 ${SCANNER_SHA.slice(0, 12)} — read only, never written ` +
    `(shipped FINGERPRINT_LINE_CAP = ${CAP_SHIPPED_VALUE})\n`);

// ── Server lifecycle (Round 146 discipline, unchanged) ───────────────────────

let server: ReturnType<typeof spawn> | undefined;
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}
process.on('exit', killServer);

/**
 * SIGTERM is asynchronous: the old process can still hold 3001 (and still
 * answer) when the next startServer probes readiness, which would silently
 * measure the WRONG CAP. Every start waits for a genuinely free port and for
 * THIS child to print its own banner.
 */
async function waitForPortFree(): Promise<void> {
  await waitUntilPortIsQuiet(PORT);
}

async function startServer(tag: string, extraEnv: Record<string, string> = {}): Promise<void> {
  await waitForPortFree();
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: DB, KLATCH_EXPORT_ROOT: EXPORT_FREE_ROOT, ...extraEnv },
    stdio: ['ignore', logFd, logFd],
  });
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}) — see ${logPath}`);
    }
    let booted = false;
    try { booted = fs.readFileSync(logPath, 'utf8').includes('Klatch server running'); } catch { /* not yet */ }
    if (booted) {
      try { if ((await fetch(`${BASE}/api/channels`, { headers: { connection: 'close' } })).ok) return; } catch { /* not yet */ }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} in 90 s — see ${logPath}`);
}

interface Browse {
  samples: number[];
  bytes: number;
  sessions: number;
  projects: number;
  capped: string[];
  maxTurnCount: number;
  turnTotal: number;
  /** Sessions the server flagged `isExported` — must be 0, see EXPORT_FREE_ROOT. */
  exported: number;
  /** Projects named 'Exported sessions' — the same fact read a second way. */
  exportGroups: number;
}

async function timeBrowse(n: number): Promise<Browse> {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, projects = 0, maxTurnCount = 0, turnTotal = 0;
  let exported = 0, exportGroups = 0;
  let capped: string[] = [];
  let retries = 0;
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    let text: string;
    try {
      const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
      text = await res.text();
    } catch (e) {
      // A dropped socket is not a latency reading — retake the sample, but
      // never silently forever.
      if (++retries > 3) throw e;
      await new Promise((r) => setTimeout(r, 500));
      i--;
      continue;
    }
    const body = JSON.parse(text);
    samples.push(performance.now() - t0);
    bytes = Buffer.byteLength(text);
    const ps = (body.projects ?? []) as any[];
    projects = ps.length;
    const all = ps.flatMap((p) => p.sessions ?? []);
    sessions = all.length;
    capped = all.filter((s: any) => s.fingerprintCapped).map((s: any) => s.sessionId).sort();
    maxTurnCount = all.reduce((m: number, s: any) => Math.max(m, s.turnCount ?? 0), 0);
    turnTotal = all.reduce((t: number, s: any) => t + (s.turnCount ?? 0), 0);
    // Two independent readings of the same isolation claim: the per-session flag
    // the scanner sets, and the project group the export scan creates. Round 235
    // asserted both because either one alone can be true for the wrong reason.
    exported = all.filter((s: any) => s.isExported).length;
    exportGroups = ps.filter((p: any) => p.projectName === 'Exported sessions').length;
  }
  return { samples, bytes, sessions, projects, capped, maxTurnCount, turnTotal, exported, exportGroups };
}

// ── Arm A — inventory of the SHIPPED ROOT ONLY, and the page-cache warm ──────
//
// Deliberately one corpus. Round 148 warmed both (989 MB) and Round 147 warmed
// one (531 MB); if that difference is what moved the cold figure, warming one
// here should reproduce Daedalus's number even at the shipped cap, and arm C
// would then be measuring nothing. Reading the corpus IS the warm — the same
// full stream Round 148 used, restricted to the root under test.

console.log('── arm A: shipped-root inventory + single-corpus page-cache warm ──');

/** Mirrors the scanner's own filters: *.jsonl directly under a project dir, >= 100 bytes. */
function corpusFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    let files: fs.Dirent[];
    try { files = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const f of files) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
      const p = path.join(dir, f.name);
      try { if (fs.statSync(p).size < 100) continue; } catch { continue; }
      out.push(p);
    }
  }
  return out;
}

/** Counts lines by streaming — the same unit FINGERPRINT_LINE_CAP is expressed in. */
async function lineCount(file: string): Promise<number> {
  return new Promise((resolve) => {
    let n = 0;
    const stream = fs.createReadStream(file, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    rl.on('line', () => { n++; });
    rl.on('close', () => resolve(n));
    rl.on('error', () => resolve(n));
    stream.on('error', () => resolve(n));
  });
}

const files = corpusFiles(ROOT_SHIPPED);
let corpusBytes = 0;
for (const f of files) { try { corpusBytes += fs.statSync(f).size; } catch { /* raced */ } }
const lines: number[] = [];
for (const f of files) lines.push(await lineCount(f));
const maxLines = lines.length ? Math.max(...lines) : 0;

check('A', 'shipped root present', files.length > 0,
  `${ROOT_SHIPPED} — ${files.length} files, ${mb(corpusBytes)}, max ${maxLines} lines`);

// Daedalus's 1477 was measured over 516 files / 531.2 MB. If the corpus has moved
// materially since, that is itself part of any residual and must be visible.
const R147_FILES = 516;
const R147_BYTES = 531.2;
check('A', 'corpus vs the one Round 147 measured', true,
  `${files.length} files / ${(corpusBytes / 1048576).toFixed(1)} MB now vs ${R147_FILES} / ${R147_BYTES} MB then ` +
    `(${files.length - R147_FILES >= 0 ? '+' : ''}${files.length - R147_FILES} files, ` +
    `${(corpusBytes / 1048576 - R147_BYTES) >= 0 ? '+' : ''}${(corpusBytes / 1048576 - R147_BYTES).toFixed(1)} MB)`,
  'measurement');

// How many files the 1500 cap can even bite is the size of the effect arm C can
// possibly show. Round 143 found 11 of 506 on its corpus.
const overPatched = lines.filter((n) => n > CAP_PATCHED_VALUE).length;
const overShipped = lines.filter((n) => n > CAP_SHIPPED_VALUE).length;
check('A', `files the ${CAP_PATCHED_VALUE}-line cap would bite`, true,
  `${overPatched} of ${files.length} files exceed ${CAP_PATCHED_VALUE} lines ` +
    `(Round 143 found 11 of 506); ${overShipped} exceed ${CAP_SHIPPED_VALUE}`,
  'measurement');

console.log(
  `\nshipped root fully read during arm A (${mb(corpusBytes)}) — page cache warmed for ONE corpus, ` +
    `not two as in Round 148\n`,
);

// ── Scratch DB ───────────────────────────────────────────────────────────────

process.env.KLATCH_DB = DB;
const { getDb } = await import(path.join(REPO, 'packages/server/src/db/index.ts'));
getDb(); // creates the scratch DB with the full schema
{
  const { default: Database } = await import('better-sqlite3');
  const c = new Database(DB);
  try {
    c.pragma('wal_checkpoint(TRUNCATE)');
    const n = (c.prepare('SELECT COUNT(*) c FROM channels').get() as any).c as number;
    const withSid = (c.prepare(
      "SELECT COUNT(*) c FROM channels WHERE json_extract(source_metadata, '$.originalSessionId') IS NOT NULL",
    ).get() as any).c as number;
    check('A', 'scratch DB carries no imported sessions', withSid === 0,
      `${n} channel(s), ${withSid} with an originalSessionId — dedup cost is not in these numbers`);
  } finally { c.close(); }
}

// ── The three arms ───────────────────────────────────────────────────────────

interface ArmResult { cold: number; warm: number; browse: Browse }

async function measureCap(arm: string, tag: string, capValue: number): Promise<ArmResult> {
  // Round 237: the cap arrives on the server's environment. Before that this
  // function measured whatever `session-scanner.ts` said on disk at the moment
  // the server booted, and the caller's `capValue` was a label for it.
  await startServer(tag, capValue === CAP_SHIPPED_VALUE ? {} : { KLATCH_FINGERPRINT_LINE_CAP: String(capValue) });
  try {
    const coldRun = await timeBrowse(1);
    const cold = coldRun.samples[0];
    const warmRun = await timeBrowse(WARM_SAMPLES);
    const warm = median(warmRun.samples);

    check(arm, `${tag}: sessions returned`, warmRun.sessions === files.length,
      `${warmRun.sessions} sessions across ${warmRun.projects} projects vs ${files.length} files on disk, ` +
        `${kb(warmRun.bytes)} response`);
    // The isolation this probe's file counts depend on, asserted rather than
    // assumed. Before Round 235 there was no lever for this and the repo's
    // 3.86 MB export would have ridden along in every arm above, priced as if it
    // were part of the corpus arm A walked.
    check(arm, `${tag}: no exported sessions in the payload`,
      warmRun.exported === 0 && warmRun.exportGroups === 0,
      `${warmRun.exported} isExported sessions, ${warmRun.exportGroups} 'Exported sessions' groups ` +
        `(KLATCH_EXPORT_ROOT=${path.relative(REPO, EXPORT_FREE_ROOT)})`);
    check(arm, `${tag}: cache-cold browse @ cap ${capValue}`, true, ms(cold), 'measurement');
    check(arm, `${tag}: steady-state browse`, true,
      `${ms(warm)} (median of ${WARM_SAMPLES}; ${warmRun.samples.map((s) => s.toFixed(0)).join(', ')})`,
      'measurement');
    check(arm, `${tag}: cache actually engaged`, warm < cold / 5,
      `${ms(cold)} -> ${ms(warm)} (${(cold / warm).toFixed(0)}x)`);

    return { cold, warm, browse: warmRun };
  } finally {
    killServer();
  }
}

console.log('\n── arm B: shipped cap (50_000) ──────────────────────────────────');
const armB = await measureCap('B', 'cap-50k', CAP_SHIPPED_VALUE);

// The single-corpus warm question, answered before anything else is claimed.
check('B', "Round 148's 2164 ms reproduces under a single-corpus page-cache warm",
  Math.abs(armB.cold - THESEUS_COLD_R148) / THESEUS_COLD_R148 < 0.15,
  `${ms(armB.cold)} now vs ${THESEUS_COLD_R148} ms in Round 148 ` +
    `(${((armB.cold / THESEUS_COLD_R148 - 1) * 100).toFixed(0)}%) — ` +
    `if these agree, warming two corpora was NOT what moved the figure`,
  'measurement');

console.log('\n── arm C: pre-ruling cap (1_500), set on the server’s environment ──');
//
// RETIRED WORKAROUND (Round 237). This arm used to write a patched
// `session-scanner.ts` to disk, boot a server against it, and restore the file in
// a `finally`. It was guarded by a skip on "`FINGERPRINT_LINE_CAP` is not the
// literal I expect", which is the guard shape Theseus's Round 236 finding is
// about: a skip makes "the feature shipped" and "this arm is missing"
// indistinguishable, and `50000` → `50_000` on 2026-09-04 had already proved the
// literal moves. The condition that retired it is `resolveFingerprintLineCap()`
// in `session-scanner.ts` — `KLATCH_FINGERPRINT_LINE_CAP` on the server's
// environment is the supported way to move this cap, so there is nothing left to
// patch, nothing to restore, and no spelling to match.
//
// The arm still cannot be trusted on the strength of the variable being set —
// that is arm E's job below, and arm E is unchanged, because "did the cap reach
// the server" is the same question whether the cap arrived by patch or by env.
const armC: ArmResult = await measureCap('C', 'cap-1500', CAP_PATCHED_VALUE);

check('C', 'the scanner was never written to', scannerUnchanged(),
  `sha256 ${SCANNER_SHA.slice(0, 12)} unchanged — this probe no longer patches ${SCANNER_REL}`);

console.log('\n── arm D: shipped cap again, control ────────────────────────────');
const armD = await measureCap('D', 'cap-50k-control', CAP_SHIPPED_VALUE);

check('D', 'arm B is not drift', Math.abs(armD.cold - armB.cold) / armB.cold < 0.15,
  `${ms(armB.cold)} then ${ms(armD.cold)} on a second fresh server ` +
    `(${((armD.cold / armB.cold - 1) * 100).toFixed(0)}%)`);

// ── Arm E — did the cap actually reach the server we measured? ───────────────
//
// Unchanged by Round 237, and deliberately so: "the variable was set" is exactly
// as weak a claim as "the file was patched". Both are statements about the
// apparatus. What proves the SERVER ran the cap is behaviour only that cap
// produces — sessions coming back capped, and a lower total turn count because
// capped files stop being counted past line 1500.

console.log('\n── arm E: the cap verified by effect, not by apparatus ───────────');

check('E', 'shipped cap does not bite this corpus', armB.browse.capped.length === 0,
  `${armB.browse.capped.length} of ${armB.browse.sessions} sessions capped at ${CAP_SHIPPED_VALUE}; ` +
    `max turnCount ${armB.browse.maxTurnCount}`);

check('E', `overridden cap DOES bite — proves the server ran cap ${CAP_PATCHED_VALUE}`,
  armC.browse.capped.length > 0,
  `${armC.browse.capped.length} of ${armC.browse.sessions} sessions capped at ${CAP_PATCHED_VALUE} ` +
    `(arm A predicted ${overPatched} files over that line count)`);

check('E', 'capped count matches the files that exceed the cap',
  armC.browse.capped.length === overPatched,
  `endpoint reported ${armC.browse.capped.length} capped vs ${overPatched} files over ${CAP_PATCHED_VALUE} lines on disk`);

check('E', 'turn signal lost to the 1500 cap', true,
  `${armC.browse.turnTotal} turns at cap ${CAP_PATCHED_VALUE} vs ${armB.browse.turnTotal} at ${CAP_SHIPPED_VALUE} — ` +
    `the cap hid ${armB.browse.turnTotal - armC.browse.turnTotal} turns ` +
    `(${armB.browse.turnTotal > 0 ? ((1 - armC.browse.turnTotal / armB.browse.turnTotal) * 100).toFixed(1) : '0'}% of the corpus signal)`,
  'measurement');

// ── Arm F — the reconciliation ───────────────────────────────────────────────

console.log('\n── arm F: does the cap explain the gap? ─────────────────────────');

{
  // A block, not a condition. Arm C used to be skippable — it needed a source
  // patch that could fail to match — so everything downstream of it was guarded.
  // Since Round 237 it runs unconditionally, and a `skip('F', 'arm C did not
  // run')` that can no longer fire is the stale-guard shape this round is about.
  const delta = armB.cold - armC.cold;
  const shippedMean = (armB.cold + armD.cold) / 2;
  const deltaMean = shippedMean - armC.cold;

  check('F', `pre-ruling cap reproduces Round 147's ${DAEDALUS_COLD_R147} ms`,
    Math.abs(armC.cold - DAEDALUS_COLD_R147) / DAEDALUS_COLD_R147 < 0.20,
    `arm C ${ms(armC.cold)} vs ${DAEDALUS_COLD_R147} ms measured at dba7699 ` +
      `(${((armC.cold / DAEDALUS_COLD_R147 - 1) * 100).toFixed(0)}%)`,
    'measurement');

  check('F', `cap delta at the endpoint vs Round 143's +${R143_CAP_DELTA} ms`, true,
    `${ms(delta)} (B-C), ${ms(deltaMean)} using the mean of both shipped-cap arms — ` +
      `Round 143 measured +${R143_CAP_DELTA} ms in isolation on a 1387 ms browse`,
    'measurement');

  const residual = armC.cold - DAEDALUS_COLD_R147;
  check('F', 'gap accounted for', true,
    `Round 148 ${THESEUS_COLD_R148} ms - Round 147 ${DAEDALUS_COLD_R147} ms = ${THESEUS_COLD_R148 - DAEDALUS_COLD_R147} ms unexplained; ` +
      `measured cap delta ${ms(deltaMean)} leaves a residual of ${ms(residual)} at the pre-ruling cap`,
    'measurement');

  check('F', "the cap ruling's cold-browse cost, at the endpoint, on this corpus", true,
    `xian's 1500 -> 50_000 ruling costs ${ms(deltaMean)} on every cache-cold browse ` +
      `(${((deltaMean / armC.cold) * 100).toFixed(0)}% over the pre-ruling cold browse), ` +
      `bought ${armB.browse.turnTotal - armC.browse.turnTotal} turns of exact signal, ` +
      `and is paid once per server start — steady state is ${ms(armB.warm)} either way ` +
      `(${ms(armC.warm)} at the old cap)`,
    'measurement');
}

// ── Summary ──────────────────────────────────────────────────────────────────

const finalSha = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
check('*', 'scanner byte-identical to how it was found', finalSha === SCANNER_SHA,
  finalSha === SCANNER_SHA ? `sha256 ${SCANNER_SHA.slice(0, 12)}` : `MISMATCH — run \`git checkout ${SCANNER_REL}\``);

console.log('\n════════════════════════════════════════════════════════════════');
const regressions = results.filter((r) => r.kind === 'regression');
const failed = regressions.filter((r) => !r.pass);
console.log(
  `${results.length} checks (${regressions.length} regression, ${results.length - regressions.length} measurement), ` +
    `${failed.length} failed, 0 skipped (this probe has no skip path — see the note by check())`,
);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
process.exit(failed.length > 0 ? 1 : 0);
