/**
 * Round 155 — the cap ruling's cold-browse cost on `~/.claude-pm/projects`.
 *
 * Round 153 (`docs/browse-cold-figure-gap-2026-09-04.md`) closed the cold-figure
 * gap by showing that xian's `FINGERPRINT_LINE_CAP` ruling (1500 -> 50_000,
 * `18d4631`) costs **723 ms on every cache-cold browse** — measured at the
 * endpoint, against `~/.claude/projects`. That log closed with an item left
 * deliberately undone: **the same delta on `~/.claude-pm/projects`**, where the
 * corpus is shaped completely differently and the number therefore cannot be
 * carried over. Daedalus's 9/5 memo lists it as still mine. This is it.
 *
 * **Why the shipped figure does not transfer.** Inventoried immediately before
 * writing this probe, streaming line counts (the unit the cap is expressed in):
 *
 *     shipped  521 files  546.8 MB  max 15,371 lines  over-1500: 11  total 181,680 lines
 *     pm        76 files  462.7 MB  max 41,168 lines  over-1500: 11  total 258,223 lines
 *
 * The same *count* of files exceeds the old cap (11 each) — and the magnitude is
 * nothing alike. The cap delta is paid per LINE above the cap, not per file, so
 * two corpora that agree on the file count can disagree by a multiple on cost.
 * That coincidence is the reason this had to be measured rather than reasoned.
 *
 * **Why the corpus matters beyond arithmetic.** PM's eleven department heads live
 * under this root; it is the corpus continuity #3 exists to demonstrate
 * (`session-scanner.ts:135-144`). A latency figure for the shipped root says
 * nothing about the browse xian will actually be looking at when he opens PM.
 *
 * The arms, one run, one machine state, back to back:
 *
 *   arm A  inventory of the PM root ONLY + page-cache warm of that root only
 *   arm B  cap 50_000 (shipped)   — cache-cold browse at the endpoint
 *   arm C  cap 1_500  (patched)   — the same, one server generation later
 *   arm D  cap 50_000 again       — control, to show B is not drift
 *   arm E  patch verified by EFFECT (capped counts, turns lost), not by text
 *   arm F  the delta, and what it is as a fraction of the pre-ruling browse
 *   arm G  guard headroom — how close the shipped 50_000 is to biting here
 *
 * **Root isolation, and why `CLAUDE_CONFIG_DIR` and not `KLATCH_EXTRA_SESSION_ROOTS`.**
 * The extra-roots variable is *additive* (`session-scanner.ts:150`): it would
 * measure the union of both corpora and the PM contribution would have to be
 * inferred by subtraction across two runs. `CLAUDE_CONFIG_DIR` has *replace*
 * semantics (`session-scanner.ts:124-130`), so the server under test walks the PM
 * root and nothing else.
 *
 * Proving the replace took, rather than assuming it: every timed arm compares the
 * endpoint's **session-ID set** against the PM files' basenames on disk
 * (`sessionId` is the file basename — `session-scanner.ts:528`), so a union would
 * fail on the extra IDs, not merely on a count. Note that `sourceRoot` cannot be
 * used for this: it is deliberately **omitted under a single root**
 * (`session-scanner.ts:47-62`), which the probe also asserts, since a `sourceRoot`
 * appearing here would itself mean more than one root was scanned.
 *
 * Run:  npx tsx scripts/probe-pm-corpus-cap-delta.mts
 *
 * Zero model calls. One scratch DB under `.testdata/`; xian's `klatch.db` is
 * never opened. Both corpora are read-only throughout.
 *
 * ─── On source mutation ─────────────────────────────────────────────────────
 * Arm C needs a cap the shipped code does not offer at the endpoint.
 * `extractSessionFingerprint` takes `lineCap` as a parameter, but the route calls
 * it with the default, so measuring the cap AT THE ENDPOINT means changing the
 * constant for exactly one server generation. Original bytes captured at start,
 * re-asserted by sha256 before exit, exit/SIGINT handlers restore. The rewrite is
 * exact-match single-occurrence and refuses to proceed if the constant is not the
 * shape it expects. Nothing is committed in the patched state.
 *
 * The patch is verified by EFFECT as well as by text: arm A counts the files over
 * 1500 lines on disk independently, and arm E requires the endpoint's capped-session
 * count to equal it. A text match proves the file changed; the capped count proves
 * the server we timed was running the changed cap.
 *
 * ─── On the arms that could go stale ────────────────────────────────────────
 * Arms E and G both encode "the shipped cap does not bite this corpus." That is
 * true today and is exactly the thing the scanner comment asks to be monitored.
 * If a PM session ever crosses 50 000 lines, arm E's first check goes red — and
 * that red is the finding, not a broken probe. Arm G exists so the approach is
 * visible *before* the crossing, as a headroom percentage rather than a boolean.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import crypto from 'crypto';
import readline from 'readline';
import { spawn } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'pm-corpus-cap-delta');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);

const HOME = os.homedir();
const PM_CONFIG_DIR = path.join(HOME, '.claude-pm');
const ROOT_PM = path.join(PM_CONFIG_DIR, 'projects');
const ROOT_SHIPPED = path.join(HOME, '.claude', 'projects');

const WARM_SAMPLES = 5;

/** Round 153's figures for the SHIPPED root, the thing this fire is comparing against. */
const R153_SHIPPED_COLD_50K = 2203; // docs/browse-cold-figure-gap-2026-09-04.md, arm B
const R153_SHIPPED_COLD_1500 = 1492; // ibid, arm C
const R153_SHIPPED_DELTA = 723; // ibid, arm F (mean of both shipped-cap arms - arm C)

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
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
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

// ── Server lifecycle (Round 146/153 discipline, unchanged except the root) ───

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
 * SIGTERM is asynchronous: the old process can still hold 3001 (and still answer)
 * when the next startServer probes readiness, which would silently measure the
 * WRONG CAP. Every start waits for a genuinely free port and for THIS child's
 * own banner.
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
    env: {
      ...process.env,
      KLATCH_DB: DB,
      // Replace semantics — this server walks the PM root and nothing else.
      CLAUDE_CONFIG_DIR: PM_CONFIG_DIR,
      // Belt and braces: if something in the environment already set the additive
      // variable, the union would silently come back and the session-count check
      // in arm B would be the only thing standing between us and a wrong figure.
      KLATCH_EXTRA_SESSION_ROOTS: '',
    },
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
  sessionIds: string[];
  withSourceRoot: number;
}

async function timeBrowse(n: number): Promise<Browse> {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, projects = 0, maxTurnCount = 0, turnTotal = 0, withSourceRoot = 0;
  let capped: string[] = [];
  let sessionIds: string[] = [];
  let retries = 0;
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    let text: string;
    try {
      const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
      text = await res.text();
    } catch (e) {
      // A dropped socket is not a latency reading — retake the sample, but never
      // silently forever.
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
    // The session-ID set is the decisive evidence about WHICH corpus was walked:
    // `sessionId` is the file basename, so it compares directly against disk.
    sessionIds = all.map((s: any) => s.sessionId).sort();
    // `sourceRoot` is suppressed under a single root by design; any present here
    // would mean the replace did not take.
    withSourceRoot = all.filter((s: any) => s.sourceRoot).length;
  }
  return { samples, bytes, sessions, projects, capped, maxTurnCount, turnTotal, sessionIds, withSourceRoot };
}

/** PM session IDs as they exist on disk — `sessionId` is the file basename. */
const pmIdsOnDisk = new Set<string>();

// ── Arm A — PM-root inventory, and the page-cache warm for that root only ────
//
// Round 153 established that warming two corpora and warming one produce the same
// cold figure on this machine, so the single-corpus warm is not a hedge — it is
// the cheaper of two equivalent options. Reading the corpus IS the warm.

console.log('── arm A: PM-root inventory + single-corpus page-cache warm ──');

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

const pmFiles = corpusFiles(ROOT_PM);
if (pmFiles.length === 0) {
  check('A', 'PM root present', false, `${ROOT_PM} — no session files found; nothing to measure`);
  console.log('\nRefusing to report a cap delta for a corpus that is not there.');
  process.exit(1);
}

let pmBytes = 0;
for (const f of pmFiles) { try { pmBytes += fs.statSync(f).size; } catch { /* raced */ } }
const pmLines: number[] = [];
for (const f of pmFiles) pmLines.push(await lineCount(f));
const pmMaxLines = Math.max(...pmLines);
const pmTotalLines = pmLines.reduce((a, b) => a + b, 0);
for (const f of pmFiles) pmIdsOnDisk.add(path.basename(f).replace(/\.jsonl$/, ''));

check('A', 'PM root present and walked', true,
  `${ROOT_PM} — ${pmFiles.length} files, ${mb(pmBytes)}, max ${pmMaxLines} lines, ${pmTotalLines} lines total`);

// The shipped root is inventoried but NOT read — the comparison needs its shape,
// and reading it would warm 546.8 MB of page cache this probe does not want.
const shippedFiles = corpusFiles(ROOT_SHIPPED);
let shippedBytes = 0;
for (const f of shippedFiles) { try { shippedBytes += fs.statSync(f).size; } catch { /* raced */ } }
check('A', 'shipped root, for shape comparison only (stat, not read)', true,
  `${shippedFiles.length} files, ${mb(shippedBytes)} — PM averages ` +
    `${(pmBytes / pmFiles.length / 1048576).toFixed(1)} MB/file vs ` +
    `${(shippedBytes / shippedFiles.length / 1048576).toFixed(2)} MB/file shipped`,
  'measurement');

// The size of the effect arm C can possibly show. Expressed in LINES above the
// cap, because that — not the file count — is what the delta is paid in.
const overPatched = pmLines.filter((n) => n > CAP_PATCHED_VALUE).length;
const overShipped = pmLines.filter((n) => n > CAP_SHIPPED_VALUE).length;
const linesAbovePatched = pmLines.reduce((t, n) => t + Math.max(0, n - CAP_PATCHED_VALUE), 0);
const linesReadAtPatched = pmLines.reduce((t, n) => t + Math.min(n, CAP_PATCHED_VALUE), 0);

check('A', `files the ${CAP_PATCHED_VALUE}-line cap would bite`, true,
  `${overPatched} of ${pmFiles.length} files exceed ${CAP_PATCHED_VALUE} lines; ` +
    `${overShipped} exceed ${CAP_SHIPPED_VALUE}`,
  'measurement');

check('A', 'the delta is paid in lines, and here is how many', true,
  `${linesAbovePatched} lines sit above the ${CAP_PATCHED_VALUE} cap ` +
    `(${((linesAbovePatched / pmTotalLines) * 100).toFixed(0)}% of the corpus) — ` +
    `the old cap reads ${linesReadAtPatched} lines, the shipped cap reads all ${pmTotalLines}`,
  'measurement');

console.log(
  `\nPM root fully read during arm A (${mb(pmBytes)}) — page cache warmed for this corpus only; ` +
    `the shipped root was stat'd, not read\n`,
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

// ── The three timed arms ─────────────────────────────────────────────────────

interface ArmResult { cold: number; warm: number; browse: Browse }

async function measureCap(arm: string, tag: string, capValue: number): Promise<ArmResult> {
  await startServer(tag);
  try {
    const coldRun = await timeBrowse(1);
    const cold = coldRun.samples[0];
    const warmRun = await timeBrowse(WARM_SAMPLES);
    const warm = median(warmRun.samples);

    // These are the checks that prove CLAUDE_CONFIG_DIR replaced rather than added.
    // A union would report ~597 sessions and carry IDs that are not on the PM root.
    const foreign = warmRun.sessionIds.filter((id) => !pmIdsOnDisk.has(id));
    const missing = [...pmIdsOnDisk].filter((id) => !warmRun.sessionIds.includes(id));
    check(arm, `${tag}: PM root ONLY — session-ID set equals the PM files on disk`,
      foreign.length === 0 && missing.length === 0,
      `${warmRun.sessions} sessions across ${warmRun.projects} projects vs ${pmFiles.length} PM files ` +
        `(${shippedFiles.length + pmFiles.length} would mean the union); ` +
        `${foreign.length} IDs not on the PM root, ${missing.length} PM files unreported; ` +
        `${kb(warmRun.bytes)} response`);
    check(arm, `${tag}: sourceRoot suppressed, as single-root scanning requires`,
      warmRun.withSourceRoot === 0,
      `${warmRun.withSourceRoot} of ${warmRun.sessions} sessions carry a sourceRoot ` +
        `(session-scanner.ts:47-62 omits it under one root; any present would mean two were scanned)`);
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

console.log('\n── arm B: shipped cap (50_000) on the PM root ───────────────────');
const armB = await measureCap('B', 'pm-cap-50k', CAP_SHIPPED_VALUE);

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
    armC = await measureCap('C', 'pm-cap-1500', CAP_PATCHED_VALUE);
  } finally {
    const ok = restoreScanner();
    check('C', 'scanner restored', ok,
      ok ? `sha256 ${SCANNER_SHA.slice(0, 12)} matches` : `RESTORE FAILED — run \`git checkout ${SCANNER_REL}\``);
  }
}

console.log('\n── arm D: shipped cap again, control ────────────────────────────');
const armD = await measureCap('D', 'pm-cap-50k-control', CAP_SHIPPED_VALUE);

check('D', 'arm B is not drift', Math.abs(armD.cold - armB.cold) / armB.cold < 0.15,
  `${ms(armB.cold)} then ${ms(armD.cold)} on a second fresh server ` +
    `(${((armD.cold / armB.cold - 1) * 100).toFixed(0)}%)`);

// ── Arm E — did the patch actually reach the server we measured? ─────────────
//
// Text-matching the file proves the FILE changed. What proves the SERVER ran the
// changed cap is behaviour only the changed cap produces.

console.log('\n── arm E: patch verified by effect, not by text ──────────────────');

check('E', 'shipped cap does not bite the PM corpus', armB.browse.capped.length === 0,
  `${armB.browse.capped.length} of ${armB.browse.sessions} sessions capped at ${CAP_SHIPPED_VALUE}; ` +
    `max turnCount ${armB.browse.maxTurnCount}` +
    (armB.browse.capped.length > 0
      ? ' — THIS IS THE SIGNAL session-scanner.ts:255-263 asks to be watched for, not a probe bug'
      : ''));

if (armC) {
  check('E', `patched cap DOES bite — proves the server ran cap ${CAP_PATCHED_VALUE}`,
    armC.browse.capped.length > 0,
    `${armC.browse.capped.length} of ${armC.browse.sessions} sessions capped at ${CAP_PATCHED_VALUE} ` +
      `(arm A counted ${overPatched} files over that line count on disk)`);

  check('E', 'capped count matches the files that exceed the cap',
    armC.browse.capped.length === overPatched,
    `endpoint reported ${armC.browse.capped.length} capped vs ${overPatched} files over ${CAP_PATCHED_VALUE} lines on disk`);

  check('E', 'turn signal the old cap would have hidden on THIS corpus', true,
    `${armC.browse.turnTotal} turns at cap ${CAP_PATCHED_VALUE} vs ${armB.browse.turnTotal} at ${CAP_SHIPPED_VALUE} — ` +
      `the old cap hid ${armB.browse.turnTotal - armC.browse.turnTotal} turns ` +
      `(${armB.browse.turnTotal > 0 ? ((1 - armC.browse.turnTotal / armB.browse.turnTotal) * 100).toFixed(1) : '0'}% of the corpus signal)`,
    'measurement');
}

// ── Arm F — the number this fire exists to produce ───────────────────────────

console.log('\n── arm F: the cap ruling priced on the PM corpus ────────────────');

if (armC) {
  const delta = armB.cold - armC.cold;
  const shippedMean = (armB.cold + armD.cold) / 2;
  const deltaMean = shippedMean - armC.cold;

  check('F', 'cap delta at the endpoint, PM corpus', true,
    `${ms(delta)} (B-C), ${ms(deltaMean)} using the mean of both shipped-cap arms`,
    'measurement');

  check('F', 'vs the same delta on the shipped corpus (Round 153)', true,
    `PM ${ms(deltaMean)} vs shipped ${R153_SHIPPED_DELTA} ms — ` +
      `${(deltaMean / R153_SHIPPED_DELTA).toFixed(2)}x. ` +
      `Shipped cold was ${R153_SHIPPED_COLD_1500} ms -> ${R153_SHIPPED_COLD_50K} ms; ` +
      `PM is ${ms(armC.cold)} -> ${ms(shippedMean)}`,
    'measurement');

  check('F', 'the delta as a fraction of the pre-ruling browse', true,
    `+${((deltaMean / armC.cold) * 100).toFixed(0)}% on PM ` +
      `(Round 153 measured +${((R153_SHIPPED_DELTA / R153_SHIPPED_COLD_1500) * 100).toFixed(0)}% on shipped) — ` +
      `the relative cost is the figure that travels between corpora, if either does`,
    'measurement');

  // Does cost track lines-above-cap? If the two corpora's deltas are proportional
  // to their above-cap line counts, that is a rule of thumb a future fire can use
  // instead of re-measuring. If they are not, saying so is worth more.
  check('F', 'ms per 1000 lines above the old cap', true,
    `PM: ${((deltaMean / linesAbovePatched) * 1000).toFixed(1)} ms/1k lines ` +
      `(${linesAbovePatched} lines above cap, ${ms(deltaMean)} delta). ` +
      `Arm H puts the shipped corpus on the same axis`,
    'measurement');

  check('F', 'steady state is unaffected by the cap, as on the shipped corpus', true,
    `${ms(armB.warm)} at cap ${CAP_SHIPPED_VALUE}, ${ms(armC.warm)} at ${CAP_PATCHED_VALUE} — ` +
      `the fingerprint cache absorbs the ruling entirely after the first browse; ` +
      `the ${ms(deltaMean)} is paid once per server start`,
    'measurement');
} else {
  skip('F', 'arm C did not run — no delta to report');
}

// ── Arm G — guard headroom, the early warning the scanner comment asks for ───
//
// `session-scanner.ts:255-263` says the 50 000 guard "is not biting today" and asks
// for it to be watched. A boolean tells you the morning after it starts biting.
// A headroom percentage tells you months before.

console.log('\n── arm G: how close is the shipped guard to biting here? ────────');

const pmSorted = [...pmLines].sort((a, b) => b - a);
const headroomPct = (pmMaxLines / CAP_SHIPPED_VALUE) * 100;

check('G', 'largest PM session vs the shipped guard', true,
  `${pmMaxLines} lines vs a ${CAP_SHIPPED_VALUE}-line guard — ` +
    `${headroomPct.toFixed(0)}% of the way there, ${CAP_SHIPPED_VALUE - pmMaxLines} lines of headroom`,
  'measurement');

check('G', 'the PM corpus is where the guard will bite first', pmMaxLines > 0,
  `PM top five: ${pmSorted.slice(0, 5).join(', ')} lines. ` +
    `The shipped corpus's largest was 15,371 at inventory time (31% of the guard), so PM leads it ` +
    `by ${(pmMaxLines / 15371).toFixed(1)}x and is the root to watch`,
  'measurement');

check('G', 'guard still has headroom on every PM session', overShipped === 0,
  `${overShipped} PM sessions exceed ${CAP_SHIPPED_VALUE} lines`);

// ── Arm H — does the cost per unit of above-cap work travel between corpora? ─
//
// If it does, a future fire can estimate the cap delta for a new corpus from disk
// alone instead of standing up three servers. If it does not, that is worth more
// than a rule of thumb nobody should trust.
//
// **Placement is deliberate.** This arm READS the shipped corpus (547 MB), which
// would warm page cache the timed arms are trying to hold constant. It runs last,
// after every timed arm has completed, so nothing downstream can be perturbed by it.
//
// **And it is a cross-RUN comparison, stated as such.** Round 153's 723 ms was
// measured yesterday, on a different machine state, by a different probe. The
// disk figures below are current. This is a consistency check, not a controlled
// experiment, and it is reported at one significant figure for that reason.

console.log('\n── arm H: does the per-line cost travel between corpora? ────────');

if (armC) {
  const shippedLines: number[] = [];
  for (const f of shippedFiles) shippedLines.push(await lineCount(f));
  const shippedTotalLines = shippedLines.reduce((a, b) => a + b, 0);
  const shippedAbove = shippedLines.reduce((t, n) => t + Math.max(0, n - CAP_PATCHED_VALUE), 0);
  const shippedOverPatched = shippedLines.filter((n) => n > CAP_PATCHED_VALUE).length;

  const shippedMean = (armB.cold + armD.cold) / 2;
  const deltaMean = shippedMean - armC.cold;

  const pmPerKLine = (deltaMean / linesAbovePatched) * 1000;
  const shPerKLine = (R153_SHIPPED_DELTA / shippedAbove) * 1000;

  // The same question in bytes, because PM's lines are materially smaller and the
  // two normalisations do not have to agree — which is itself the finding.
  const pmBytesPerLine = pmBytes / pmTotalLines;
  const shBytesPerLine = shippedBytes / shippedTotalLines;
  const pmAboveMB = (linesAbovePatched * pmBytesPerLine) / 1048576;
  const shAboveMB = (shippedAbove * shBytesPerLine) / 1048576;
  const pmPerMB = deltaMean / pmAboveMB;
  const shPerMB = R153_SHIPPED_DELTA / shAboveMB;

  check('H', 'shipped corpus, same axis (disk figures current, delta from Round 153)', true,
    `${shippedFiles.length} files, ${shippedTotalLines} lines, ${shippedOverPatched} over ${CAP_PATCHED_VALUE}, ` +
      `${shippedAbove} lines above cap (${((shippedAbove / shippedTotalLines) * 100).toFixed(0)}% of corpus) — ` +
      `PM has ${(linesAbovePatched / shippedAbove).toFixed(1)}x as many above-cap lines`,
    'measurement');

  check('H', 'per-1k-lines-above-cap', true,
    `PM ${pmPerKLine.toFixed(1)} ms vs shipped ${shPerKLine.toFixed(1)} ms — ` +
      `${(Math.abs(pmPerKLine - shPerKLine) / shPerKLine * 100).toFixed(0)}% apart, PM cheaper per line`,
    'measurement');

  check('H', 'per-MB-above-cap (PM lines are smaller, so this can disagree)', true,
    `PM ${pmPerMB.toFixed(1)} ms/MB (${pmAboveMB.toFixed(0)} MB above cap, ` +
      `${(pmBytesPerLine / 1024).toFixed(2)} KB/line) vs shipped ${shPerMB.toFixed(1)} ms/MB ` +
      `(${shAboveMB.toFixed(0)} MB, ${(shBytesPerLine / 1024).toFixed(2)} KB/line) — ` +
      `${(Math.abs(pmPerMB - shPerMB) / shPerMB * 100).toFixed(0)}% apart, PM dearer per byte`,
    'measurement');

  check('H', 'verdict on the rule of thumb', true,
    `The two normalisations bracket rather than agree: lines say PM is cheaper, bytes say dearer, ` +
      `each by a similar margin. Cost scales with above-cap work under either unit, but two corpora ` +
      `are not enough to choose the unit. Estimate a new corpus at ` +
      `${Math.min(pmPerKLine, shPerKLine).toFixed(0)}-${Math.max(pmPerKLine, shPerKLine).toFixed(0)} ms ` +
      `per 1k above-cap lines and treat the range as the honest precision`,
    'measurement');
} else {
  skip('H', 'arm C did not run — no PM delta to compare against');
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
