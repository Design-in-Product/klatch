/**
 * Round 147 — size the fingerprint cache AT THE ENDPOINT.
 *
 * Theseus's Round 146 lesson, taken literally: "a cost measured in a tight loop
 * is a lower bound on the same cost measured in situ. When you size that cache,
 * size it at the endpoint." The 29 ms browse floor everyone has been quoting is
 * a tight-loop remainder, and his own arm P was optimistic by 2.4x when the same
 * work was measured through the route. So nothing here is measured below HTTP.
 *
 * Arms:
 *
 *   A  cold browse, cache build — first browse of a fresh server process.
 *   B  warm browse — the steady state a user actually sits in.
 *   C  A/B against the PRE-CACHE build, so "cold == what it used to cost" is a
 *      measurement and not an assumption. The pre-cache source is restored from
 *      `git show <CACHE_COMMIT>^` for the duration of one server generation and
 *      restored afterwards, sha256-verified. Same discipline as Theseus's
 *      Round 146 probe.
 *   D  payload identity — the warm browse must be byte-identical to the cold one
 *      across the full session tuple INCLUDING the fingerprint fields. This is
 *      the arm the unit tests cannot provide: identity of what a client renders.
 *   E  invalidation at the endpoint — append a turn to a scratch session file
 *      between two browses and assert the served turnCount moves. A cache that
 *      never invalidates would pass every other arm in this file.
 *   F  dedup freshness at the endpoint — import a scratch session between two
 *      browses (DB write only, file untouched) and assert alreadyImported flips.
 *      This is the failure mode of caching the whole SessionInfo.
 *
 * Safety:
 *  - `klatch.db` is never opened. A scratch DB under `.testdata/` throughout.
 *  - The corpus under ~/.claude/projects is read-only.
 *  - Arms E/F use a scratch file under `packages/server/exports/sessions/`, which
 *    the probe REFUSES to touch if it already exists — that directory is a real
 *    product surface and this probe will not delete anyone's data.
 *  - Nothing under `packages/` is committed in the patched state; the scanner is
 *    restored on every exit path and its sha256 re-asserted.
 *  - Zero model calls.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import crypto from 'crypto';
import { spawn, execFileSync } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'fingerprint-cache-endpoint');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);
const CACHE_COMMIT = 'dba7699'; // round147: cache browse fingerprints
const EXPORT_DIR = path.join(REPO, 'packages/server/exports/sessions');
const SCRATCH_SESSION_ID = 'f1f1f1f1-0000-4000-8000-r147probe0001';

const SAMPLES = 6; // per configuration; sample 1 is the cold one and is reported alone

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  console.log(`${pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const ms = (n: number) => `${n.toFixed(0)} ms`;

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// ── Source guard ─────────────────────────────────────────────────────────────

const SCANNER_ORIGINAL = fs.readFileSync(SCANNER);
const SCANNER_SHA = crypto.createHash('sha256').update(SCANNER_ORIGINAL).digest('hex');

const gitShow = (rev: string) =>
  execFileSync('git', ['show', `${rev}:${SCANNER_REL}`], { cwd: REPO, maxBuffer: 32 * 1024 * 1024 });

const atCache = gitShow(CACHE_COMMIT);
const preCache = gitShow(`${CACHE_COMMIT}^`);

if (!atCache.equals(SCANNER_ORIGINAL)) {
  console.log(`!! ${SCANNER_REL} on disk is not byte-identical to ${CACHE_COMMIT}; arm C would not be a\n   clean A/B. Refusing to run.`);
  process.exit(1);
}
if (preCache.toString('utf8').includes('getSessionFingerprint')) {
  console.log(`!! pre-cache source already contains the cache — wrong commit pinned. Refusing to run.`);
  process.exit(1);
}
console.log(`scanner on disk matches ${CACHE_COMMIT} (sha256 ${SCANNER_SHA.slice(0, 12)}); pre-cache bytes from ${CACHE_COMMIT}^\n`);

function restoreScanner(): boolean {
  fs.writeFileSync(SCANNER, SCANNER_ORIGINAL);
  return crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex') === SCANNER_SHA;
}

// ── Scratch export session (arms E and F) ────────────────────────────────────

let ownsExportDir = false;
let scratchSessionPath: string | undefined;

function turnBytes(text: string): string {
  return [
    JSON.stringify({ type: 'user', sessionId: SCRATCH_SESSION_ID, message: { role: 'user', content: text } }),
    JSON.stringify({ type: 'assistant', sessionId: SCRATCH_SESSION_ID, message: { role: 'assistant', content: [{ type: 'text', text: 'ack ' + 'x'.repeat(60) }] } }),
  ].join('\n') + '\n';
}

function setUpScratchSession(): boolean {
  if (fs.existsSync(EXPORT_DIR) && fs.readdirSync(EXPORT_DIR).length > 0) {
    console.log(`SKIP [E/F] ${path.relative(REPO, EXPORT_DIR)} already has content; refusing to write into a real product directory.`);
    return false;
  }
  ownsExportDir = !fs.existsSync(EXPORT_DIR);
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  scratchSessionPath = path.join(EXPORT_DIR, `${SCRATCH_SESSION_ID}.jsonl`);
  fs.writeFileSync(scratchSessionPath, turnBytes('probe turn one, long enough to clear the scanner 100-byte floor'));
  return true;
}

function tearDownScratchSession(): void {
  try {
    if (scratchSessionPath && fs.existsSync(scratchSessionPath)) fs.unlinkSync(scratchSessionPath);
    if (ownsExportDir && fs.existsSync(EXPORT_DIR) && fs.readdirSync(EXPORT_DIR).length === 0) {
      fs.rmdirSync(EXPORT_DIR);
      const parent = path.dirname(EXPORT_DIR);
      if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) fs.rmdirSync(parent);
    }
  } catch { /* best effort */ }
}

// ── Server lifecycle (Theseus's two-condition start, Round 146) ──────────────

let server: ReturnType<typeof spawn> | undefined;
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}

function cleanup() { killServer(); tearDownScratchSession(); try { restoreScanner(); } catch { /* best effort */ } }
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

async function waitForPortFree(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await portIsFree(PORT)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`port ${PORT} still occupied 30 s after SIGTERM`);
}

/**
 * SIGTERM is asynchronous. A port that answers is NOT proof that the process you
 * just started is the one answering — Theseus's Round 146 probe timed the wrong
 * build twice before this was fixed. Two conditions: port genuinely free, and
 * THIS child printed its own banner.
 */
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
    if (server.exitCode !== null) throw new Error(`server exited early (code ${server.exitCode}) — see ${logPath}`);
    let booted = false;
    try { booted = fs.readFileSync(logPath, 'utf8').includes('Klatch server running'); } catch { /* not yet */ }
    if (booted) {
      try { if ((await fetch(`${BASE}/api/channels`, { headers: { connection: 'close' } })).ok) return; } catch { /* not yet */ }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} in 90 s — see ${logPath}`);
}

// ── Browse ───────────────────────────────────────────────────────────────────

interface Browse {
  msTaken: number;
  bytes: number;
  sessions: number;
  /** Full rendered tuple per session, sorted — the thing a client actually shows. */
  rows: string[];
  scratch?: { turnCount?: number; alreadyImported: boolean; existingChannelId?: string };
}

async function browse(): Promise<Browse> {
  let retries = 0;
  for (;;) {
    const t0 = performance.now();
    let text: string;
    try {
      const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
      text = await res.text();
    } catch (e) {
      if (++retries > 3) throw e;
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    const msTaken = performance.now() - t0;
    const body = JSON.parse(text);
    const all = ((body.projects ?? []) as any[]).flatMap((p) => p.sessions ?? []);
    const scratchRow = all.find((s: any) => s.sessionId === SCRATCH_SESSION_ID);
    return {
      msTaken,
      bytes: Buffer.byteLength(text),
      sessions: all.length,
      rows: all
        .map((s: any) => [s.sessionId, s.messageCount, s.turnCount, s.fingerprintCapped ?? false, s.firstUserMessage ?? '', s.sizeBytes, s.alreadyImported ? 1 : 0, s.existingChannelId ?? ''].join('\t'))
        .sort(),
      scratch: scratchRow
        ? { turnCount: scratchRow.turnCount, alreadyImported: !!scratchRow.alreadyImported, existingChannelId: scratchRow.existingChannelId }
        : undefined,
    };
  }
}

/** One server generation: cold browse, then SAMPLES-1 warm ones. */
async function coldThenWarm(tag: string): Promise<{ cold: Browse; warm: Browse[] }> {
  await startServer(tag);
  const cold = await browse();
  const warm: Browse[] = [];
  for (let i = 1; i < SAMPLES; i++) warm.push(await browse());
  return { cold, warm };
}

// ── Corpus sanity (mirrors session-scanner.ts's own filters) ─────────────────

function corpusFiles(): string[] {
  const dir = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let fl: fs.Dirent[];
    try { fl = fs.readdirSync(path.join(dir, entry.name), { withFileTypes: true }); } catch { continue; }
    for (const f of fl) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
      const p = path.join(dir, entry.name, f.name);
      try { if (fs.statSync(p).size >= 100) out.push(p); } catch { /* skip */ }
    }
  }
  return out;
}

/**
 * Read every corpus byte once BEFORE any measurement.
 *
 * The first run of this probe measured the cached build's cold browse at 1870 ms
 * against the pre-cache build's 1460 ms and reported a 28% regression that does
 * not exist: the cached generation ran first and paid to pull 531 MB off disk,
 * and by the time the pre-cache generation ran, the OS page cache was holding it.
 * The order of the arms was the whole finding.
 *
 * Both generations are fresh processes, so no JIT state carries between them; the
 * page cache is the only shared resource, and this equalises it. Same discipline
 * as Theseus's Round 146 discarded first browse, which is where the idea comes from.
 */
function prewarmPageCache(files: string[]): number {
  let bytes = 0;
  for (const f of files) {
    try { bytes += fs.readFileSync(f).length; } catch { /* skip */ }
  }
  return bytes;
}

// ── Run ──────────────────────────────────────────────────────────────────────

const files = corpusFiles();
if (files.length === 0) {
  console.log('no readable corpus — every arm here needs one. Refusing to report numbers from an empty scan.');
  process.exit(1);
}
const warmed = prewarmPageCache(files);
console.log(`corpus: ${files.length} sessions, ${(warmed / 1048576).toFixed(1)} MB under ~/.claude/projects — page cache pre-warmed before any arm\n`);

const haveScratch = setUpScratchSession();

let cachedCold = 0, cachedWarm = 0, preCold = 0, preWarm = 0;

try {
  // ---- Arms A, B, D, E, F: the cached build ---------------------------------
  console.log('— cached build —');
  const cached = await coldThenWarm('cached');
  cachedCold = cached.cold.msTaken;
  const warmSamples = cached.warm.map((w) => w.msTaken);
  cachedWarm = median(warmSamples);

  check('A', 'cold browse (cache build) measured at the endpoint', true,
    `${ms(cachedCold)} over ${cached.cold.sessions} sessions, ${(cached.cold.bytes / 1048576).toFixed(2)} MB payload`, 'measurement');
  check('B', 'warm browse (cache hit) measured at the endpoint', true,
    `${ms(cachedWarm)} median of ${warmSamples.length} — samples [${warmSamples.map((s) => s.toFixed(0)).join(', ')}]`, 'measurement');
  check('B', 'warm is faster than cold', cachedWarm < cachedCold,
    `${ms(cachedCold)} -> ${ms(cachedWarm)}, ${(cachedCold / Math.max(cachedWarm, 0.001)).toFixed(1)}x`);

  const rowsIdentical = cached.warm.every((w) => w.rows.length === cached.cold.rows.length && w.rows.every((r, i) => r === cached.cold.rows[i]));
  check('D', 'warm payload byte-identical to cold across the full rendered tuple', rowsIdentical,
    rowsIdentical
      ? `${cached.cold.rows.length} sessions x (messageCount, turnCount, capped, firstUserMessage, sizeBytes, alreadyImported, existingChannelId) identical on all ${cached.warm.length} warm browses`
      : `MISMATCH — the cache is serving something the uncached scan does not`);

  if (haveScratch) {
    // ---- Arm E: invalidation through the route -----------------------------
    const beforeAppend = cached.warm[cached.warm.length - 1].scratch;
    check('E', 'scratch session is visible in the browse payload', !!beforeAppend,
      beforeAppend ? `turnCount ${beforeAppend.turnCount}` : 'not found — arm E cannot run');

    if (beforeAppend) {
      await new Promise((r) => setTimeout(r, 20));
      fs.appendFileSync(scratchSessionPath!, turnBytes('probe turn two, appended between two browses'));
      const afterAppend = (await browse()).scratch;
      check('E', 'appending to a file invalidates its cached fingerprint at the endpoint',
        afterAppend?.turnCount === (beforeAppend.turnCount ?? 0) + 1,
        `turnCount ${beforeAppend.turnCount} -> ${afterAppend?.turnCount} after one appended turn`);
    }

    // ---- Arm F: dedup must NOT be cached ------------------------------------
    const beforeImport = (await browse()).scratch;
    check('F', 'scratch session reads as not-yet-imported', beforeImport?.alreadyImported === false,
      `alreadyImported=${beforeImport?.alreadyImported}`);

    // DB write only. The file is not touched, so a whole-SessionInfo cache would
    // keep serving alreadyImported=false here.
    const res = await fetch(`${BASE}/api/channels`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', connection: 'close' },
      body: JSON.stringify({ name: 'r147-probe-import', systemPrompt: '' }),
    });
    const created = await res.json() as any;
    const channelId = created?.id ?? created?.channel?.id;
    if (!channelId) {
      check('F', 'could create a channel to stand in for an import', false, `unexpected POST /api/channels body: ${JSON.stringify(created).slice(0, 200)}`);
    } else {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database(DB);
      db.prepare('UPDATE channels SET source = ?, source_metadata = ? WHERE id = ?')
        .run('claude-code', JSON.stringify({ originalSessionId: SCRATCH_SESSION_ID }), channelId);
      db.close();

      const afterImport = (await browse()).scratch;
      check('F', 'importing a session flips alreadyImported without the file changing',
        afterImport?.alreadyImported === true && afterImport?.existingChannelId === channelId,
        `alreadyImported ${beforeImport?.alreadyImported} -> ${afterImport?.alreadyImported}, existingChannelId=${afterImport?.existingChannelId ?? '(none)'}`);
      check('F', 'the fingerprint half still came from cache across that import',
        afterImport?.turnCount === beforeImport?.turnCount,
        `turnCount ${beforeImport?.turnCount} -> ${afterImport?.turnCount} (unchanged, as the file was untouched)`);
    }
  }

  killServer();

  // ---- Arm C: the same measurement against the pre-cache build --------------
  console.log('\n— pre-cache build (restored from git) —');
  fs.writeFileSync(SCANNER, preCache);
  try {
    const pre = await coldThenWarm('precache');
    preCold = pre.cold.msTaken;
    const preWarmSamples = pre.warm.map((w) => w.msTaken);
    preWarm = median(preWarmSamples);
    check('C', 'pre-cache cold browse', true, ms(preCold), 'measurement');
    check('C', 'pre-cache repeat browse', true,
      `${ms(preWarm)} median of ${preWarmSamples.length} — samples [${preWarmSamples.map((s) => s.toFixed(0)).join(', ')}]`, 'measurement');
    check('C', 'pre-cache repeat browse costs the same as its first (no reuse existed)',
      Math.abs(preWarm - preCold) / preCold < 0.15,
      `${ms(preCold)} vs ${ms(preWarm)} — ${((preWarm - preCold) / preCold * 100).toFixed(1)}% apart`);
    check('C', 'cached cold browse is not materially slower than pre-cache — the cache fill is cheap',
      cachedCold < preCold * 1.15,
      `pre-cache ${ms(preCold)} vs cached-build cold ${ms(cachedCold)} (${((cachedCold - preCold) / preCold * 100).toFixed(1)}%)`);
  } finally {
    killServer();
    const ok = restoreScanner();
    check('C', 'scanner restored byte-identical after the patched generation', ok,
      ok ? `sha256 ${SCANNER_SHA.slice(0, 12)}` : 'RESTORE FAILED — check git status before committing anything');
  }
} finally {
  killServer();
  tearDownScratchSession();
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(78));
console.log('Steady-state browse, measured at the endpoint\n');
console.log(`  pre-cache  every browse   ${ms(preWarm)}`);
console.log(`  cached     first browse   ${ms(cachedCold)}`);
console.log(`  cached     every browse after   ${ms(cachedWarm)}   (${(preWarm / Math.max(cachedWarm, 0.001)).toFixed(0)}x)`);
console.log(`\n  saved per repeat browse: ${ms(preWarm - cachedWarm)}`);
console.log('='.repeat(78));

const failed = results.filter((r) => !r.pass && r.kind === 'regression');
console.log(`\n${results.length} checks, ${failed.length} failed`);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
process.exit(failed.length ? 1 : 0);
