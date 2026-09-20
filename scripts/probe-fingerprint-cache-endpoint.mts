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
 *   C  A/B with the cache switched off, so "cold == what it used to cost" is a
 *      measurement and not an assumption. Round 239: this is the shipped binary
 *      with `KLATCH_FINGERPRINT_CACHE=off`, not a restored commit — see below.
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
 * ── Round 239: arm C no longer restores a commit, and why that was urgent ─────
 *
 * Arm C used to write `git show dba7699^` over `session-scanner.ts` for one server
 * generation. To keep that A/B honest the probe refused to run unless the scanner on
 * disk was byte-identical to `dba7699` — which made **every later commit to that file
 * disarm it**. It had exited 1 at that guard since `18d46318` (2026-09-04), the day
 * after this probe was written, and a refusal is indistinguishable in a sweep from a
 * probe nobody ran. A pin to a commit, in a file expected to move, is a dead man's
 * switch.
 *
 * The pin was also measuring the wrong thing. A wholesale historical restore un-ships
 * everything else that landed in the file since — the cap ruling, the multi-root walk,
 * the export-root override — so the delta it reported as "the cache" was really
 * cache+cap+multi-root+export-root. Round 159 made this exact argument about
 * `probe-browse-endpoint-vs-channel-count`'s arm S.
 *
 * `KLATCH_FINGERPRINT_CACHE=off` removes both problems at once: same binary, one
 * behaviour, no pin and no write into shipped source.
 *
 * Safety:
 *  - `klatch.db` is never opened. A scratch DB under `.testdata/` throughout.
 *  - The corpus under ~/.claude/projects is read-only.
 *  - Arms E/F use a scratch file under `packages/server/exports/sessions/`, which
 *    the probe REFUSES to touch if it already exists — that directory is a real
 *    product surface and this probe will not delete anyone's data.
 *  - **Nothing under `packages/` is written at all.** The scanner's sha256 is read at
 *    start and re-asserted at exit; there is no restore, because there is no patch.
 *  - Zero model calls.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { waitUntilPortIsQuiet } from './lib/probe-server-ownership.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'fingerprint-cache-endpoint');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);
/**
 * Arms E and F need an export corpus they can append to and import from. Round 239:
 * that is now a scratch root under `.testdata/`, handed to the server via
 * `KLATCH_EXPORT_ROOT` (Round 235), rather than a write into the repo's own
 * `exports/sessions/`.
 *
 * Two bugs came out with the change, and only the first was visible:
 *
 *  - The path was **stale**. This probe wrote to `packages/server/exports/sessions`,
 *    which was where the scan looked when the probe was written (it was handed the
 *    server's working directory). Round 234 fixed the scan to resolve from the repo
 *    root; nothing updated this constant, and nothing noticed, because the probe was
 *    already refusing to start at its `dba7699` source guard. Driven for the first
 *    time since, arms E and F came back red on a scratch session the server was
 *    never going to see.
 *  - The refusal was **permanent**. Pointed at the corrected path, the old guard
 *    ("refuse if the directory already has content") would have skipped E and F on
 *    every real checkout — `exports/sessions/theseus-2026-03-22.jsonl` has been
 *    there since 2026-08-04. The guard was the right mitigation for writing into a
 *    product surface. The lever is the fix, and with it there is no product surface
 *    to protect, so the guard and its skip path are gone.
 */
const EXPORT_ROOT = path.join(SCRATCH, 'export-root');
const EXPORT_DIR = path.join(EXPORT_ROOT, 'exports', 'sessions');
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

const SCANNER_SHA = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');

console.log(`scanner sha256 ${SCANNER_SHA.slice(0, 12)}; arm C runs the shipped binary with ` +
  `KLATCH_FINGERPRINT_CACHE=off — nothing is patched\n`);

/**
 * Read-only. This probe no longer writes into `packages/`, so there is nothing to
 * restore; what remains is the assertion that nothing was written, which is the half
 * that was ever evidence. Round 237's note applies: a `restore` with no patch
 * outstanding can only overwrite a concurrent edit from another worktree and report
 * success doing it.
 */
function scannerUnchanged(): boolean {
  return crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex') === SCANNER_SHA;
}

// ── Scratch export session (arms E and F) ────────────────────────────────────

let scratchSessionPath: string | undefined;

function turnBytes(text: string): string {
  return [
    JSON.stringify({ type: 'user', sessionId: SCRATCH_SESSION_ID, message: { role: 'user', content: text } }),
    JSON.stringify({ type: 'assistant', sessionId: SCRATCH_SESSION_ID, message: { role: 'assistant', content: [{ type: 'text', text: 'ack ' + 'x'.repeat(60) }] } }),
  ].join('\n') + '\n';
}

/**
 * Returns nothing and cannot fail: `EXPORT_DIR` lives inside `SCRATCH`, which this
 * probe cleared and created at start. There is no longer a case where arms E and F
 * cannot run, so there is no longer a skip — and a skip helper for a case that cannot
 * occur makes "the feature shipped" and "the arm is missing" read the same in a sweep.
 */
function setUpScratchSession(): void {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  scratchSessionPath = path.join(EXPORT_DIR, `${SCRATCH_SESSION_ID}.jsonl`);
  fs.writeFileSync(scratchSessionPath, turnBytes('probe turn one, long enough to clear the scanner 100-byte floor'));
}

function tearDownScratchSession(): void {
  try {
    if (scratchSessionPath && fs.existsSync(scratchSessionPath)) fs.unlinkSync(scratchSessionPath);
  } catch { /* best effort */ }
}

// ── Server lifecycle (Theseus's two-condition start, Round 146) ──────────────

let server: ReturnType<typeof spawn> | undefined;
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}

function cleanup() { killServer(); tearDownScratchSession(); }
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

async function waitForPortFree(): Promise<void> {
  await waitUntilPortIsQuiet(PORT);
}

/**
 * SIGTERM is asynchronous. A port that answers is NOT proof that the process you
 * just started is the one answering — Theseus's Round 146 probe timed the wrong
 * build twice before this was fixed. Two conditions: port genuinely free, and
 * THIS child printed its own banner.
 */
async function startServer(tag: string, cacheLever?: 'off'): Promise<void> {
  await waitForPortFree();
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  // Theseus's Round 238 addition: when this probe is NOT setting the lever it must
  // **delete** it from the child, not merely leave it unset. These probes inherit the
  // fire's environment; a KLATCH_FINGERPRINT_CACHE set out there would silently make
  // every cache-on arm measure a configuration nobody in this file chose, and stay
  // green doing it.
  const env: NodeJS.ProcessEnv = { ...process.env, KLATCH_DB: DB, KLATCH_EXPORT_ROOT: EXPORT_ROOT };
  if (cacheLever) env.KLATCH_FINGERPRINT_CACHE = cacheLever;
  else delete env.KLATCH_FINGERPRINT_CACHE;
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env,
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
  /** Distinct `projectPath` values of every session the server flagged `isExported`. */
  exportDirs: string[];
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
      exportDirs: [...new Set(all.filter((s: any) => s.isExported).map((s: any) => String(s.projectPath)))].sort(),
    };
  }
}

/** One server generation: cold browse, then SAMPLES-1 warm ones. */
async function coldThenWarm(tag: string, cacheLever?: 'off'): Promise<{ cold: Browse; warm: Browse[] }> {
  await startServer(tag, cacheLever);
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

setUpScratchSession();

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

  // ---- Arm G: the export root the server actually used ----------------------
  //
  // Asserted two independent ways, because "I set KLATCH_EXPORT_ROOT" is not
  // evidence that the server read it — the whole reason Round 235 built the lever
  // read-per-call was that a captured read makes it silently inert. The positive:
  // the only export directory in the payload is the scratch one. The negative: the
  // repo's own `exports/sessions/` is not in it, and that directory is non-empty on
  // every checkout, so its absence cannot be a vacuous pass.
  const repoExportDir = path.join(REPO, 'exports', 'sessions');
  const seenExportDirs = cached.cold.exportDirs;
  check('G', 'the served export corpus is the scratch root, not the repo',
    seenExportDirs.length === 1 && seenExportDirs[0] === EXPORT_DIR,
    `served [${seenExportDirs.map((d) => path.relative(REPO, d)).join(', ')}]; expected ${path.relative(REPO, EXPORT_DIR)}`);
  check('G', "the repo's own exports/sessions is absent from the payload and is not empty on disk",
    !seenExportDirs.includes(repoExportDir) && fs.existsSync(repoExportDir) &&
      fs.readdirSync(repoExportDir).some((f) => f.endsWith('.jsonl')),
    `${path.relative(REPO, repoExportDir)} holds ` +
    `${fs.existsSync(repoExportDir) ? fs.readdirSync(repoExportDir).filter((f) => f.endsWith('.jsonl')).length : 0} .jsonl ` +
    `and contributed 0 sessions`);

  {
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

  // ---- Arm C: the same measurement with the cache switched off --------------
  //
  // Round 239: this used to be `git show dba7699^` written over the scanner. The
  // lever measures a strictly better thing — the *same binary* with one behaviour
  // removed, rather than a build that also predates the cap ruling, the multi-root
  // walk and the export-root override. The old arm attributed all four to the cache.
  console.log('\n— cache off (shipped binary, KLATCH_FINGERPRINT_CACHE=off) —');
  try {
    const pre = await coldThenWarm('cacheoff', 'off');
    preCold = pre.cold.msTaken;
    const preWarmSamples = pre.warm.map((w) => w.msTaken);
    preWarm = median(preWarmSamples);
    check('C', 'cache-off cold browse', true, ms(preCold), 'measurement');
    check('C', 'cache-off repeat browse', true,
      `${ms(preWarm)} median of ${preWarmSamples.length} — samples [${preWarmSamples.map((s) => s.toFixed(0)).join(', ')}]`, 'measurement');
    // THIS is the proof the lever bit, and it is the only one worth having. "The
    // variable was set" is as weak a claim as "the file was patched" — a lever that
    // resolved to `on` would show a warm browse an order of magnitude faster here and
    // every other arm in this probe would stay green. Round 237's rule, Theseus's
    // Round 238 restatement: assert the measured effect, not the configuration.
    check('C', 'with the cache off, a repeat browse costs the same as the first (no reuse existed)',
      Math.abs(preWarm - preCold) / preCold < 0.15,
      `${ms(preCold)} vs ${ms(preWarm)} — ${((preWarm - preCold) / preCold * 100).toFixed(1)}% apart`);
    check('C', 'the cache fill is cheap — a cold browse with the cache on is not materially slower',
      cachedCold < preCold * 1.15,
      `cache off ${ms(preCold)} vs cache on, cold ${ms(cachedCold)} (${((cachedCold - preCold) / preCold * 100).toFixed(1)}%)`);
  } finally {
    killServer();
    const ok = scannerUnchanged();
    check('C', 'shipped source was never written to', ok,
      ok ? `sha256 ${SCANNER_SHA.slice(0, 12)} unchanged across every arm`
         : `MISMATCH — this probe does not write to ${SCANNER_REL}; inspect \`git diff\` before assuming it did`);
  }
} finally {
  killServer();
  tearDownScratchSession();
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(78));
console.log('Steady-state browse, measured at the endpoint\n');
console.log(`  cache off  every browse   ${ms(preWarm)}`);
console.log(`  cache on   first browse   ${ms(cachedCold)}`);
console.log(`  cache on   every browse after   ${ms(cachedWarm)}   (${(preWarm / Math.max(cachedWarm, 0.001)).toFixed(0)}x)`);
console.log(`\n  saved per repeat browse: ${ms(preWarm - cachedWarm)}`);
console.log('='.repeat(78));

const failed = results.filter((r) => !r.pass && r.kind === 'regression');
console.log(`\n${results.length} checks, ${failed.length} failed`);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
process.exit(failed.length ? 1 : 0);
