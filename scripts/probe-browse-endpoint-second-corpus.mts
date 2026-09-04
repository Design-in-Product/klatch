/**
 * Round 148 — what does browse cost against the corpus the product is actually
 * waiting on?
 *
 * Context. On 2026-09-04 three things landed within an hour of each other:
 *
 *   dba7699  fingerprint cache: steady-state browse 1430 ms -> 7 ms (Daedalus,
 *            measured at the endpoint, corpus ~/.claude/projects)
 *   18d4631  cap ruled removed: FINGERPRINT_LINE_CAP 1500 -> 50_000, justified
 *            as "~3x headroom over the largest real session (15,371 lines)"
 *   e1ee197  correction, same day: that headroom was measured against the wrong
 *            corpus. Piper Morgan's department heads live in a SECOND config
 *            directory, ~/.claude-pm/projects, which getClaudeProjectsDir()
 *            hardcodes past. Files there run 13,054-40,397 lines, so real
 *            headroom is ~24%, not 3x.
 *
 * Every latency number we hold — the 1430, the 7, the +645 ms cap delta — was
 * measured on ~/.claude/projects. None of them was measured on the corpus that
 * continuity #3 exists to demonstrate and that xian is waiting to drive.
 * Daedalus routed CLAUDE_CONFIG_DIR support to his own seat and did not build
 * it; the two consequences he named (latency on 2.6x-longer files, and the
 * scanner not seeing the directory at all) are both unpriced.
 *
 * This probe prices them, at the HTTP endpoint, on both corpora.
 *
 * Run:  npx tsx scripts/probe-browse-endpoint-second-corpus.mts
 *
 * Zero model calls. One scratch DB under `.testdata/`; xian's `klatch.db` is
 * never opened. Both corpora are read-only throughout — the probe opens files
 * for reading and never writes inside either config directory.
 *
 * Arms:
 *   A  inventory of both corpora, and a direct check of the 13,054-40,397 and
 *      15,371 line claims in e1ee197 / the scanner's own comment
 *   B  browse at the endpoint against ~/.claude/projects (shipped root):
 *      cache-cold browse, then steady state. Reproduces Daedalus's 1477 / 7.
 *   C  the same against ~/.claude-pm/projects, reached by pointing
 *      getClaudeProjectsDir() at it for one server generation
 *   D  `fingerprintCapped` across every session of both corpora — xian's
 *      monitoring trigger, run for real rather than reasoned about
 *   E  the comparison, and what it implies for the guard and the cache
 *
 * ─── On source mutation ─────────────────────────────────────────────────────
 * Arm C needs the server to look at a directory the shipped code cannot name,
 * so `getClaudeProjectsDir()` is rewritten to the second root for the duration
 * of one server process and restored in a `finally`. The exact original bytes
 * are captured at start and re-asserted by sha256 before exit; if the restore
 * fails the probe says so loudly and exits 1. The rewrite is an exact-match
 * single-occurrence replacement and refuses to proceed if the function body is
 * not the shape it expects — a fuzzy match here would silently measure the
 * wrong directory. Nothing is committed in the patched state.
 *
 * Note this deliberately does NOT pin the scanner to a commit sha. Round 146's
 * probe did, because it was an A/B against a specific pre-hoist baseline and a
 * drifting file would have made the comparison a lie. This probe measures
 * whatever is on disk against two directories; the honest guard is "restore
 * exactly what I found", not "refuse unless HEAD is where I left it".
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import crypto from 'crypto';
import readline from 'readline';
import { spawn } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'browse-second-corpus');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);

const HOME = os.homedir();
const ROOT_SHIPPED = path.join(HOME, '.claude', 'projects');
const ROOT_SECOND = path.join(HOME, '.claude-pm', 'projects');

const WARM_SAMPLES = 5;

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

/**
 * The exact text the patch expects. Matched literally and required to occur
 * exactly once. If the scanner is refactored so this no longer matches, arm C
 * skips rather than guessing — measuring the wrong directory would produce a
 * number that looks fine and means nothing.
 */
const ROOT_FN_ORIGINAL = `  return path.join(os.homedir(), '.claude', 'projects');`;
const ROOT_FN_PATCHED = `  return path.join(os.homedir(), '.claude-pm', 'projects');`;

const originalText = SCANNER_ORIGINAL.toString('utf8');
const rootFnOccurrences = originalText.split(ROOT_FN_ORIGINAL).length - 1;

function restoreScanner(): boolean {
  fs.writeFileSync(SCANNER, SCANNER_ORIGINAL);
  return crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex') === SCANNER_SHA;
}
process.on('exit', () => { try { restoreScanner(); } catch { /* best effort */ } });
process.on('SIGINT', () => { try { restoreScanner(); } finally { process.exit(130); } });

console.log(`${SCANNER_REL} captured at sha256 ${SCANNER_SHA.slice(0, 12)} (restored before exit)\n`);

// ── Server lifecycle (same discipline as Round 146) ───────────────────────────

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
 * SIGTERM is asynchronous: the old process can still be holding 3001 (and still
 * answering) when the next startServer runs its readiness probe, which would
 * silently measure the WRONG BUILD. Every start waits for a genuinely free port
 * and for THIS child to print its own banner.
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
}

async function timeBrowse(n: number): Promise<Browse> {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, projects = 0, maxTurnCount = 0;
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
  }
  return { samples, bytes, sessions, projects, capped, maxTurnCount };
}

// ── Arm A — inventory, and the line-count claims ─────────────────────────────

console.log('── arm A: corpus inventory ──────────────────────────────────────');

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

interface Inventory {
  root: string;
  files: string[];
  bytes: number;
  lines: number[];
  maxLines: number;
  maxFile: string;
}

async function inventory(root: string): Promise<Inventory> {
  const files = corpusFiles(root);
  let bytes = 0;
  for (const f of files) { try { bytes += fs.statSync(f).size; } catch { /* raced */ } }
  const lines: number[] = [];
  let maxLines = 0, maxFile = '';
  for (const f of files) {
    const n = await lineCount(f);
    lines.push(n);
    if (n > maxLines) { maxLines = n; maxFile = f; }
  }
  return { root, files, bytes, lines, maxLines, maxFile };
}

const invShipped = await inventory(ROOT_SHIPPED);
const invSecond = await inventory(ROOT_SECOND);

check('A', 'shipped root present', invShipped.files.length > 0,
  `${ROOT_SHIPPED} — ${invShipped.files.length} files, ${mb(invShipped.bytes)}, max ${invShipped.maxLines} lines`);
check('A', 'second root present', invSecond.files.length > 0,
  `${ROOT_SECOND} — ${invSecond.files.length} files, ${mb(invSecond.bytes)}, max ${invSecond.maxLines} lines`);

// The scanner comment says the largest file in "the local corpus" is 15,371 lines.
// e1ee197 says the second corpus runs 13,054-40,397. Both are checkable here.
check('A', "scanner's 15,371 claim for the shipped root",
  Math.abs(invShipped.maxLines - 15_371) <= 200,
  `measured max ${invShipped.maxLines} lines (${path.basename(invShipped.maxFile)}) vs 15,371 claimed`,
  'measurement');

const secondSorted = [...invSecond.lines].sort((a, b) => a - b);
check('A', "second root: full range across all files", invSecond.maxLines > 0,
  `${secondSorted[0]}-${invSecond.maxLines} lines across ${invSecond.files.length} files`,
  'measurement');

// e1ee197 quoted 13,054-40,397 for "the eleven department heads", not for all 76
// files in the directory. Check the claim it actually made: the long tail.
const HEADS_FLOOR = 13_000;
const heads = [...invSecond.lines].filter((n) => n >= HEADS_FLOOR).sort((a, b) => a - b);
check('A', "e1ee197's 13,054-40,397 claim (files >= 13k lines)", heads.length > 0,
  heads.length > 0
    ? `${heads.length} files at or over ${HEADS_FLOOR} lines, running ${heads[0]}-${heads[heads.length - 1]} ` +
      `vs 13,054-40,397 claimed (eleven department heads)`
    : `no files at or over ${HEADS_FLOOR} lines`,
  'measurement');

// These are live sessions being appended to. If the top file has grown past the
// figure e1ee197 recorded this morning, the guard's headroom is shrinking against
// a moving target rather than sitting against a static corpus.
const E1EE197_MAX = 40_397;
check('A', 'largest known session vs the figure recorded in e1ee197', true,
  invSecond.maxLines === E1EE197_MAX
    ? `unchanged at ${E1EE197_MAX} lines`
    : `${invSecond.maxLines} lines now vs ${E1EE197_MAX} recorded earlier today ` +
      `(${invSecond.maxLines > E1EE197_MAX ? '+' : ''}${invSecond.maxLines - E1EE197_MAX}) — the file is live`,
  'measurement');

const CAP = 50_000;
const overCapShipped = invShipped.lines.filter((n) => n >= CAP).length;
const overCapSecond = invSecond.lines.filter((n) => n >= CAP).length;
const globalMax = Math.max(invShipped.maxLines, invSecond.maxLines);
check('A', `guard at ${CAP} clears both corpora`, overCapShipped + overCapSecond === 0,
  `largest file across both roots is ${globalMax} lines — headroom ` +
    `${(((CAP - globalMax) / globalMax) * 100).toFixed(0)}% (${overCapShipped + overCapSecond} files at or over cap)`);

// ── Page-cache equalisation ──────────────────────────────────────────────────
//
// Daedalus's Round 147 confound: an A/B over a multi-hundred-MB corpus in which
// one arm pays to pull the bytes off disk and the other reads them warm reports
// a difference that is entirely arm order. Arm A above already streamed every
// byte of both corpora, so both are equally warm before any server starts. The
// cold numbers below are therefore "fingerprint-cache-cold, page-cache-warm":
// they measure parse cost, not disk. Stated because it is the difference
// between this and a first-boot-on-a-cold-machine number, which is larger.

console.log(
  `\nboth corpora fully read during arm A (${mb(invShipped.bytes + invSecond.bytes)} total) — ` +
    `page cache equalised before any timing\n`,
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
    // Schema init creates one native `general` channel. What matters for these
    // numbers is that nothing carries an originalSessionId, so every dedup lookup
    // misses and no imported-channel cost is folded into the browse timings.
    const withSid = (c.prepare(
      "SELECT COUNT(*) c FROM channels WHERE json_extract(source_metadata, '$.originalSessionId') IS NOT NULL",
    ).get() as any).c as number;
    check('A', 'scratch DB carries no imported sessions', withSid === 0,
      `${n} channel(s), ${withSid} with an originalSessionId — dedup cost is not in these numbers`);
  } finally { c.close(); }
}

// ── Arms B and C — browse at the endpoint, per root ──────────────────────────

interface ArmResult { cold: number; warm: number; browse: Browse }

async function measureRoot(arm: string, tag: string, root: string, inv: Inventory): Promise<ArmResult | null> {
  await startServer(tag);
  try {
    const coldRun = await timeBrowse(1);
    const cold = coldRun.samples[0];
    const warmRun = await timeBrowse(WARM_SAMPLES);
    const warm = median(warmRun.samples);

    check(arm, `${tag}: sessions returned`, warmRun.sessions > 0,
      `${warmRun.sessions} sessions across ${warmRun.projects} projects, ${kb(warmRun.bytes)} response`);
    check(arm, `${tag}: cache-cold browse`, true, ms(cold), 'measurement');
    check(arm, `${tag}: steady-state browse`, true,
      `${ms(warm)} (median of ${WARM_SAMPLES}; ${warmRun.samples.map((s) => s.toFixed(0)).join(', ')})`,
      'measurement');
    check(arm, `${tag}: cache actually engaged`, warm < cold / 5,
      `${ms(cold)} -> ${ms(warm)} (${(cold / warm).toFixed(0)}x)`);

    // Arm D, per root: the monitoring trigger xian asked for.
    check('D', `${tag}: fingerprintCapped false corpus-wide`, warmRun.capped.length === 0,
      warmRun.capped.length === 0
        ? `0 of ${warmRun.sessions} sessions capped at the shipped guard; max turnCount ${warmRun.maxTurnCount}`
        : `${warmRun.capped.length} CAPPED: ${warmRun.capped.slice(0, 5).join(', ')}`);

    // The scanner's own file filter and the endpoint should agree on what exists.
    check(arm, `${tag}: endpoint sees the whole corpus`, warmRun.sessions === inv.files.length,
      `endpoint ${warmRun.sessions} vs ${inv.files.length} files matching the scanner's filters`);

    return { cold, warm, browse: warmRun };
  } finally {
    killServer();
  }
}

console.log('\n── arm B: browse against the shipped root ───────────────────────');
const armB = await measureRoot('B', 'shipped', ROOT_SHIPPED, invShipped);

console.log('\n── arm C: browse against the second root ────────────────────────');
let armC: ArmResult | null = null;
if (rootFnOccurrences !== 1) {
  skip('C', `getClaudeProjectsDir() body did not match the expected shape ` +
    `(${rootFnOccurrences} occurrences of the literal, expected 1) — refusing to guess at the patch`);
} else if (invSecond.files.length === 0) {
  skip('C', `${ROOT_SECOND} is absent or empty on this machine`);
} else {
  try {
    fs.writeFileSync(SCANNER, originalText.replace(ROOT_FN_ORIGINAL, ROOT_FN_PATCHED));
    const patched = fs.readFileSync(SCANNER, 'utf8');
    if (!patched.includes(ROOT_FN_PATCHED) || patched.includes(ROOT_FN_ORIGINAL)) {
      throw new Error('patch did not apply cleanly — refusing to measure');
    }
    armC = await measureRoot('C', 'second', ROOT_SECOND, invSecond);
  } finally {
    const ok = restoreScanner();
    check('C', 'scanner restored', ok,
      ok ? `sha256 ${SCANNER_SHA.slice(0, 12)} matches` : `RESTORE FAILED — run \`git checkout ${SCANNER_REL}\``);
  }
}

// ── Arm F — control on the cache-cold figure ─────────────────────────────────
//
// Round 147 measured the shipped root's cache-cold browse at 1477 ms. If arm B
// lands materially above that, the difference needs a cause before either number
// gets quoted. The candidate that fits this probe's shape: arm A reads 989 MB
// across BOTH corpora, and arm C's server then reads 456 MB of it again, so by
// the time arm B ran the shipped corpus may have been partly evicted — the exact
// inverse of Daedalus's confound, where equalising by reading both is not the
// same as leaving both resident.
//
// Repeating the shipped-root cold browse LAST, on a fresh process, discriminates:
// if it lands near arm B the figure is stable and the gap is something else; if
// it drops toward 1477 the gap was cache residency and arm B's number is the
// artefact.

console.log('\n── arm F: control — repeat the shipped-root cache-cold browse ───');
let armF: ArmResult | null = null;
if (armB) {
  armF = await measureRoot('F', 'shipped-again', ROOT_SHIPPED, invShipped);
  const spread = Math.abs(armF.cold - armB.cold) / armB.cold;
  check('F', 'cache-cold figure is repeatable', spread < 0.15,
    `${ms(armB.cold)} then ${ms(armF.cold)} — ${(spread * 100).toFixed(0)}% apart`);
  const R147_COLD = 1477;
  check('F', "Round 147's 1477 ms cache-cold figure", true,
    `measured ${ms(armB.cold)} / ${ms(armF.cold)} against ${R147_COLD} ms reported in dba7699 — ` +
      `${(Math.min(armB.cold, armF.cold) / R147_COLD).toFixed(2)}-${(Math.max(armB.cold, armF.cold) / R147_COLD).toFixed(2)}x`,
    'measurement');
} else {
  skip('F', 'needs arm B');
}

// ── Arm E — the comparison ───────────────────────────────────────────────────

console.log('\n── arm E: what the second corpus costs ──────────────────────────');

if (armB && armC) {
  const bytesRatio = invSecond.bytes / invShipped.bytes;
  const filesRatio = invSecond.files.length / invShipped.files.length;

  check('E', 'cache-cold cost, second vs shipped', true,
    `${ms(armC.cold)} vs ${ms(armB.cold)} (${(armC.cold / armB.cold).toFixed(2)}x) on ` +
      `${(bytesRatio * 100).toFixed(0)}% of the bytes in ${(filesRatio * 100).toFixed(0)}% of the files`,
    'measurement');

  check('E', 'steady-state cost, second vs shipped', true,
    `${ms(armC.warm)} vs ${ms(armB.warm)} (${(armC.warm / armB.warm).toFixed(2)}x)`,
    'measurement');

  // Per-MB is the comparison that matters: the second corpus has far fewer,
  // far longer files, so a per-file number would flatter it and a per-corpus
  // number would flatter the other.
  const perMbC = armC.cold / (invSecond.bytes / 1048576);
  const perMbB = armB.cold / (invShipped.bytes / 1048576);
  check('E', 'cache-cold cost per MB', true,
    `second ${perMbC.toFixed(2)} ms/MB vs shipped ${perMbB.toFixed(2)} ms/MB ` +
      `(${(perMbC / perMbB).toFixed(2)}x)`,
    'measurement');

  // The number nobody has: what a combined browse would cost once the scanner
  // can see both roots. Additive because the walk is sequential over roots;
  // labelled as a projection, not a measurement, because no build does this yet.
  check('E', 'projected combined cache-cold browse (NOT measured)', true,
    `${ms(armB.cold + armC.cold)} if the walk is additive over both roots — ` +
      `projection from two measured arms, no build exists that does this`,
    'measurement');

  check('E', 'steady state stays flat with corpus size', armC.warm < 100,
    `second-corpus steady state ${ms(armC.warm)} — the cache makes browse cost ` +
      `independent of corpus size, which is the property that survives the merge`);
} else {
  skip('E', 'needs both arm B and arm C');
}

// ── Summary ──────────────────────────────────────────────────────────────────

const finalSha = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
if (finalSha !== SCANNER_SHA) {
  console.log(`\n!! ${SCANNER_REL} DIFFERS from what this probe read at start. Run \`git checkout ${SCANNER_REL}\`.`);
  process.exit(1);
}
console.log(`\n${SCANNER_REL} verified unmodified (sha256 ${SCANNER_SHA.slice(0, 12)}).`);

const regressions = results.filter((r) => r.kind === 'regression');
const failed = regressions.filter((r) => !r.pass);
console.log(
  `\n${results.length} checks (${regressions.length} pass/fail, ` +
    `${results.length - regressions.length} measurements), ${failed.length} failed, ${skipped.length} skipped`,
);
for (const s of skipped) console.log(`  SKIP ${s}`);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
process.exit(failed.length === 0 ? 0 : 1);
