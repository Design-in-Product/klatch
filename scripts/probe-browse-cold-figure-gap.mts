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
 * ─── On source mutation ─────────────────────────────────────────────────────
 * Arm C needs a cap the shipped code does not offer at the endpoint —
 * `extractSessionFingerprint` takes `lineCap` as a parameter, but the route
 * calls it with the default, so the only way to measure the cap AT THE ENDPOINT
 * is to change the constant for one server generation. The original bytes are
 * captured at start and re-asserted by sha256 before exit; the replacement is
 * an exact-match single-occurrence rewrite that refuses to proceed if the
 * constant is not the shape it expects. Nothing is committed in the patched
 * state.
 *
 * The patch is also verified by its EFFECT, not just by text: Round 143 found
 * the 1500 cap bit 11 of 506 files. So arm C must come back with
 * `fingerprintCapped` TRUE on some sessions and arm B with none. A text match
 * proves the file changed; the capped count proves the server we measured was
 * actually running the changed cap.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import crypto from 'crypto';
import readline from 'readline';
import { spawn } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'browse-cold-figure-gap');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);

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
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

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
const originalText = SCANNER_ORIGINAL.toString('utf8');

const CAP_SHIPPED_LITERAL = 'const FINGERPRINT_LINE_CAP = 50_000;';
const CAP_PATCHED_LITERAL = 'const FINGERPRINT_LINE_CAP = 1_500;';
const CAP_SHIPPED_VALUE = 50_000;
const CAP_PATCHED_VALUE = 1_500;
const capOccurrences = originalText.split(CAP_SHIPPED_LITERAL).length - 1;

function restoreScanner(): boolean {
  fs.writeFileSync(SCANNER, SCANNER_ORIGINAL);
  return crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex') === SCANNER_SHA;
}
process.on('exit', () => { try { restoreScanner(); } catch { /* best effort */ } });
process.on('SIGINT', () => { try { restoreScanner(); } finally { process.exit(130); } });

console.log(`${SCANNER_REL} captured at sha256 ${SCANNER_SHA.slice(0, 12)} (restored before exit)\n`);

// ── Server lifecycle (Round 146 discipline, unchanged) ───────────────────────

let server: ReturnType<typeof spawn> | undefined;
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}
process.on('exit', killServer);

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

/**
 * SIGTERM is asynchronous: the old process can still hold 3001 (and still
 * answer) when the next startServer probes readiness, which would silently
 * measure the WRONG CAP. Every start waits for a genuinely free port and for
 * THIS child to print its own banner.
 */
async function waitForPortFree(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await portIsFree(PORT)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`port ${PORT} still occupied 30 s after SIGTERM`);
}

async function startServer(tag: string): Promise<void> {
  await waitForPortFree();
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: DB },
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
}

async function timeBrowse(n: number): Promise<Browse> {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, projects = 0, maxTurnCount = 0, turnTotal = 0;
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
  }
  return { samples, bytes, sessions, projects, capped, maxTurnCount, turnTotal };
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
  await startServer(tag);
  try {
    const coldRun = await timeBrowse(1);
    const cold = coldRun.samples[0];
    const warmRun = await timeBrowse(WARM_SAMPLES);
    const warm = median(warmRun.samples);

    check(arm, `${tag}: sessions returned`, warmRun.sessions === files.length,
      `${warmRun.sessions} sessions across ${warmRun.projects} projects vs ${files.length} files on disk, ` +
        `${kb(warmRun.bytes)} response`);
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

console.log('\n── arm C: pre-ruling cap (1_500), patched for one server ────────');
let armC: ArmResult | null = null;
if (capOccurrences !== 1) {
  skip('C', `FINGERPRINT_LINE_CAP is not the literal this probe expects ` +
    `(${capOccurrences} occurrences of \`${CAP_SHIPPED_LITERAL}\`, expected 1) — refusing to guess at the patch`);
} else {
  try {
    fs.writeFileSync(SCANNER, originalText.replace(CAP_SHIPPED_LITERAL, CAP_PATCHED_LITERAL));
    const patched = fs.readFileSync(SCANNER, 'utf8');
    if (!patched.includes(CAP_PATCHED_LITERAL) || patched.includes(CAP_SHIPPED_LITERAL)) {
      throw new Error('patch did not apply cleanly — refusing to measure');
    }
    armC = await measureCap('C', 'cap-1500', CAP_PATCHED_VALUE);
  } finally {
    const ok = restoreScanner();
    check('C', 'scanner restored', ok,
      ok ? `sha256 ${SCANNER_SHA.slice(0, 12)} matches` : `RESTORE FAILED — run \`git checkout ${SCANNER_REL}\``);
  }
}

console.log('\n── arm D: shipped cap again, control ────────────────────────────');
const armD = await measureCap('D', 'cap-50k-control', CAP_SHIPPED_VALUE);

check('D', 'arm B is not drift', Math.abs(armD.cold - armB.cold) / armB.cold < 0.15,
  `${ms(armB.cold)} then ${ms(armD.cold)} on a second fresh server ` +
    `(${((armD.cold / armB.cold - 1) * 100).toFixed(0)}%)`);

// ── Arm E — did the patch actually reach the server we measured? ─────────────
//
// Text-matching the file proves the FILE changed. What proves the SERVER ran the
// changed cap is behaviour only the changed cap produces: sessions coming back
// capped, and a lower total turn count because capped files stop being counted
// past line 1500.

console.log('\n── arm E: patch verified by effect, not by text ──────────────────');

check('E', 'shipped cap does not bite this corpus', armB.browse.capped.length === 0,
  `${armB.browse.capped.length} of ${armB.browse.sessions} sessions capped at ${CAP_SHIPPED_VALUE}; ` +
    `max turnCount ${armB.browse.maxTurnCount}`);

if (armC) {
  check('E', `patched cap DOES bite — proves the server ran cap ${CAP_PATCHED_VALUE}`,
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
}

// ── Arm F — the reconciliation ───────────────────────────────────────────────

console.log('\n── arm F: does the cap explain the gap? ─────────────────────────');

if (armC) {
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
} else {
  skip('F', 'arm C did not run — no reconciliation possible');
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
    `${failed.length} failed, ${skipped.length} skipped`,
);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
for (const s of skipped) console.log(`  SKIP ${s}`);
process.exit(failed.length > 0 ? 1 : 0);
