/**
 * Round 146 probe — does the dedup hoist survive at the surface it was
 * described at, and does browse return the same thing after it?
 *
 * Theseus, 2026-09-03 STOP fire.
 *
 * Daedalus landed `createChannelBySessionIdResolver()` this afternoon
 * (afe0889) and measured the dedup line at **198.5 ms → 4.1 ms at 2000
 * channels**. He wrote his own limit down plainly: *"No end-to-end HTTP arm
 * this fire — the unit numbers are directly comparable to your arm P, but I
 * did not re-run your endpoint probe."*
 *
 * That is the exact gap this seat has now found three times (Round 141 arm F,
 * Round 142 arm H, Round 144): a value measured one layer below the surface it
 * is described at. My own arm P has it too — I measured the dedup slope by
 * calling `findChannelByOriginalSessionId` directly, never through the route.
 * And my "browse is 98% fingerprinting, 29 ms remainder" reading was taken
 * against a database with 0 imported channels, which is the left edge of the
 * very table arm P then went on to draw.
 *
 * So neither of us has yet measured what a user with an import history waits
 * for. This does.
 *
 * It cuts both ways and I do not know the sign before running it:
 *
 *   - If the endpoint moves by roughly the unit delta, Daedalus's number is
 *     good as stated and the hoist is worth what he says it is worth.
 *   - If it does not, then either the route pays the dedup cost somewhere else
 *     as well (a second per-item lookup at `routes/import.ts:186`, which is on
 *     the SAME response), or the resolver's build scan eats the saving at
 *     scale — and the number in the doc needs a caveat.
 *
 * A performance change also has to be a no-op at the surface, and nobody has
 * checked THAT over HTTP either. Daedalus's unit test compares resolver output
 * against the per-call function; it does not check that the browse payload a
 * client renders is unchanged. Arm U does, on the field that actually drives
 * the UI (`alreadyImported` / `existingChannelId`), with channels seeded to
 * genuinely match part of the corpus so the check is not trivially true.
 *
 * Run:  npx tsx scripts/probe-browse-endpoint-vs-channel-count.mts
 *
 * Zero model calls. Two scratch DBs under `.testdata/`; xian's `klatch.db` is
 * never opened. The corpus under ~/.claude/projects is read-only throughout.
 *
 * Arms:
 *   R  browse endpoint over real HTTP, HOISTED (shipped) code, at 0 / 500 /
 *      2000 seeded channels
 *   S  the same sweep with the PRE-HOIST source (afe0889^) temporarily
 *      restored — the per-call lookup Daedalus replaced
 *   T  the comparison: what the hoist is worth at the endpoint, per channel
 *      count, and whether it matches the 198.5 → 4.1 ms unit claim
 *   U  behavioural identity at the surface: with 50 channels seeded to match
 *      real corpus session ids, do both versions return byte-identical dedup
 *      state for every session?
 *
 * ─── On source mutation ─────────────────────────────────────────────────────
 * Arm S needs the pre-hoist code running behind a real server, so the file is
 * replaced with its exact bytes from `git show afe0889^:...` for the duration
 * of one server process and restored in a `finally`. Before exiting, the probe
 * re-reads the file and asserts it is byte-identical to what it read at start;
 * if not, it says so loudly and exits 1. The probe also refuses to start unless
 * the file currently on disk is byte-identical to `afe0889` — if someone has
 * edited the scanner since, the "pre-hoist" comparison would be against the
 * wrong baseline and the numbers would be a lie. Nothing is committed in the
 * patched state. Same discipline as Round 144 arm N.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import crypto from 'crypto';
import { spawn, execFileSync } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'browse-endpoint-vs-channels');
const DB_HOISTED = path.join(SCRATCH, 'hoisted.db');
const DB_PERCALL = path.join(SCRATCH, 'percall.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER_REL = 'packages/server/src/import/session-scanner.ts';
const SCANNER = path.join(REPO, SCANNER_REL);
const HOIST_COMMIT = 'afe0889'; // round145: hoist the browse dedup lookup out of the per-file loop

const SAMPLES = 5; // per configuration; first is reported separately
const STEPS = [0, 500, 2000]; // seeded channel counts, none matching the corpus
const MATCH_N = 50; // arm U: channels seeded to genuinely match real session ids

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

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// ── Source guard ─────────────────────────────────────────────────────────────

const SCANNER_ORIGINAL = fs.readFileSync(SCANNER);
const SCANNER_SHA = crypto.createHash('sha256').update(SCANNER_ORIGINAL).digest('hex');

const gitShow = (rev: string) =>
  execFileSync('git', ['show', `${rev}:${SCANNER_REL}`], { cwd: REPO, maxBuffer: 32 * 1024 * 1024 });

const atHoist = gitShow(HOIST_COMMIT);
const preHoist = gitShow(`${HOIST_COMMIT}^`);

if (!atHoist.equals(SCANNER_ORIGINAL)) {
  const since = execFileSync('git', ['log', '--oneline', `${HOIST_COMMIT}..HEAD`, '--', SCANNER_REL],
    { cwd: REPO, encoding: 'utf8' }).trim();
  console.log(
    `!! ${SCANNER_REL} on disk is not byte-identical to ${HOIST_COMMIT}. Refusing to run.\n` +
      (since ? `\n   Commits to that file since ${HOIST_COMMIT}:\n${since.split('\n').map((l) => `     ${l}`).join('\n')}\n` : '') +
      `\n   READ THIS BEFORE RE-PINNING. The obvious fix — point HOIST_COMMIT at HEAD — is wrong,\n` +
      `   and wrong in a way that still produces plausible numbers.\n` +
      `\n   Arm S restores '${HOIST_COMMIT}^' WHOLESALE to get the pre-hoist code. That is a clean\n` +
      `   isolation of the hoist only while disk == ${HOIST_COMMIT}. Once other commits land on this\n` +
      `   file, '${HOIST_COMMIT}^' is missing those too, so the A/B silently measures\n` +
      `   hoist + everything-else rather than the hoist. dba7699 (the fingerprint cache) is the\n` +
      `   case that matters: the delta would read as the hoist and mostly be the cache.\n` +
      `\n   The correct re-pin is to stop diffing against a commit and instead apply the INVERSE\n` +
      `   of the hoist to the bytes currently on disk — the hoist is three mechanical edits (the\n` +
      `   import, and one resolver hoist in each of scanClaudeCodeSessions / scanExportedSessions),\n` +
      `   each an exact-match single-occurrence replacement that can be asserted. Arm S then\n` +
      `   isolates the hoist against today's code, which is also the more interesting measurement:\n` +
      `   under the cache the dedup scan is no longer 13% of browse, it is nearly all of it.\n` +
      `\n   Flagged by Daedalus 2026-09-04; scoped, not yet built. See docs/second-corpus-browse-2026-09-04.md.`,
  );
  process.exit(1);
}
if (preHoist.equals(atHoist)) {
  console.log(`!! ${HOIST_COMMIT} did not change ${SCANNER_REL} — wrong commit pinned. Refusing to run.`);
  process.exit(1);
}
if (!preHoist.toString('utf8').includes('findChannelByOriginalSessionId(sessionId)')) {
  console.log(`!! pre-hoist source does not contain the per-call lookup — pin is wrong. Refusing to run.`);
  process.exit(1);
}
console.log(
  `scanner on disk matches ${HOIST_COMMIT} (sha256 ${SCANNER_SHA.slice(0, 12)}); ` +
    `pre-hoist bytes read from ${HOIST_COMMIT}^\n`,
);

function restoreScanner(): boolean {
  fs.writeFileSync(SCANNER, SCANNER_ORIGINAL);
  return crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex') === SCANNER_SHA;
}
process.on('exit', () => { try { restoreScanner(); } catch { /* best effort */ } });
process.on('SIGINT', () => { try { restoreScanner(); } finally { process.exit(130); } });

// ── Server lifecycle ─────────────────────────────────────────────────────────

let server: ReturnType<typeof spawn> | undefined;
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}
process.on('exit', killServer);

/**
 * SIGTERM is asynchronous: the old process can still be holding 3001 (and still
 * answering) when the next `startServer` runs its readiness probe, which would
 * silently measure the WRONG BUILD and then die mid-body when the old process
 * finally exits. Every server start waits for the port to be genuinely free
 * first.
 */
async function waitForPortFree(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await portIsFree(PORT)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`port ${PORT} still occupied 30 s after SIGTERM`);
}

async function startServer(db: string, tag: string): Promise<void> {
  await waitForPortFree();
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: db },
    stdio: ['ignore', logFd, logFd],
  });
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}) — see ${logPath}`);
    }
    // Two conditions, not one. A port that answers is NOT proof this process is
    // the one answering — an earlier generation lingering past its SIGTERM would
    // serve the readiness probe and then die mid-measurement, which is exactly
    // what happened on the first two runs of this probe. THIS child must have
    // printed its own listening banner first.
    let booted = false;
    try { booted = fs.readFileSync(logPath, 'utf8').includes('Klatch server running'); } catch { /* not yet */ }
    if (booted) {
      // `connection: close` throughout — a pooled keep-alive socket left over
      // from a previous generation would be reused against a dead process.
      try { if ((await fetch(`${BASE}/api/channels`, { headers: { connection: 'close' } })).ok) return; } catch { /* not yet */ }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} in 90 s — see ${logPath}`);
}

interface BrowseResult {
  samples: number[];
  bytes: number;
  sessions: number;
  /** (sessionId, alreadyImported, existingChannelId) for every session, sorted. */
  dedupState: string[];
  imported: number;
}

/** Request issued → body fully read and JSON-parsed, as in Round 144 arm L. */
async function timeBrowse(n: number): Promise<BrowseResult> {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, imported = 0;
  let dedupState: string[] = [];
  let retries = 0;
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    let text: string;
    try {
      const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
      text = await res.text();
    } catch (e) {
      // A dropped socket is not a latency reading — discard the attempt and take
      // the sample again, but never silently forever.
      if (++retries > 3) throw e;
      await new Promise((r) => setTimeout(r, 500));
      i--;
      continue;
    }
    const body = JSON.parse(text);
    samples.push(performance.now() - t0);
    bytes = Buffer.byteLength(text);
    const all = ((body.projects ?? []) as any[]).flatMap((p) => p.sessions ?? []);
    sessions = all.length;
    imported = all.filter((s: any) => s.alreadyImported).length;
    dedupState = all
      .map((s: any) => `${s.sessionId}\t${s.alreadyImported ? 1 : 0}\t${s.existingChannelId ?? ''}`)
      .sort();
  }
  return { samples, bytes, sessions, dedupState, imported };
}

// ── Corpus (mirrors session-scanner.ts's own filters) ────────────────────────

function corpusFiles(): string[] {
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
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
      try { if (fs.statSync(p).size < 100) continue; } catch { continue; }
      out.push(p);
    }
  }
  return out;
}

const files = corpusFiles();
const corpusIds = files.map((f) => path.basename(f, '.jsonl'));

// ── Seeding ──────────────────────────────────────────────────────────────────
//
// Both scratch DBs are seeded from the SAME deterministic id sequence, so the
// hoisted and per-call runs see identical database contents at every step. The
// probe writes only while no server is running.

process.env.KLATCH_DB = DB_HOISTED; // getDb() reads this once per process; we
                                    // open the second file directly instead.
const { default: Database } = await import('better-sqlite3');
const { getDb } = await import(path.join(REPO, 'packages/server/src/db/index.ts'));
getDb(); // creates DB_HOISTED with the full schema
{
  // The schema lands in the WAL, not the main file — copying the .db alone
  // would produce a percall.db with no tables. Checkpoint first, then copy, so
  // both scratch DBs start from a byte-identical schema and one migration path.
  const c = new Database(DB_HOISTED);
  try { c.pragma('wal_checkpoint(TRUNCATE)'); } finally { c.close(); }
  fs.copyFileSync(DB_HOISTED, DB_PERCALL);
  if (channelCount(DB_PERCALL) !== channelCount(DB_HOISTED)) {
    throw new Error('scratch DBs did not start from identical contents');
  }
}

function channelCount(dbPath: string): number {
  const db = new Database(dbPath, { readonly: true });
  try {
    return (db.prepare('SELECT COUNT(*) c FROM channels').get() as any).c as number;
  } finally {
    db.close();
  }
}

function seedTo(dbPath: string, target: number): number {
  const db = new Database(dbPath);
  try {
    const have = (db.prepare('SELECT COUNT(*) c FROM channels').get() as any).c as number;
    const insert = db.prepare(
      "INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at, source, source_metadata) VALUES (?, ?, '', 'claude-opus-5', 'chat', 'chat', ?, 'claude-code', ?)",
    );
    const run = db.transaction((from: number, to: number) => {
      for (let i = from; i < to; i++) {
        // Ids that can never match a real session, so every per-call lookup runs
        // the full scan — worst case, and the common case for a user browsing
        // sessions they have not imported.
        insert.run(`probe-seed-${i}`, `probe seed ${i}`, '2026-09-03T00:00:00.000Z',
          JSON.stringify({ originalSessionId: `no-such-session-${i}` }));
      }
    });
    if (target > have) run(have, target);
    return (db.prepare('SELECT COUNT(*) c FROM channels').get() as any).c as number;
  } finally {
    db.close();
  }
}

function seedMatching(dbPath: string, ids: string[]): number {
  const db = new Database(dbPath);
  try {
    const insert = db.prepare(
      "INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at, source, source_metadata) VALUES (?, ?, '', 'claude-opus-5', 'chat', 'chat', ?, 'claude-code', ?)",
    );
    const run = db.transaction(() => {
      for (const id of ids) {
        insert.run(`probe-match-${id}`, `imported ${id.slice(0, 8)}`, '2026-09-03T00:00:00.000Z',
          JSON.stringify({ originalSessionId: id }));
      }
    });
    run();
    return (db.prepare('SELECT COUNT(*) c FROM channels').get() as any).c as number;
  } finally {
    db.close();
  }
}

// ── The sweep ────────────────────────────────────────────────────────────────

const haveServer = await portIsFree(PORT);
const canRun = haveServer && files.length > 0;
if (!haveServer) console.log(`port ${PORT} is occupied — stop \`npm run dev\` and re-run.\n`);
if (files.length === 0) console.log(`no readable corpus under ~/.claude/projects.\n`);

const matchIds = corpusIds.slice(0, Math.min(MATCH_N, corpusIds.length));

/** Runs the whole K sweep plus the matching step against one DB. */
async function sweep(dbPath: string, tag: string): Promise<{ byK: Map<number, BrowseResult>; matched?: BrowseResult; rowCounts: Map<number, number> }> {
  const byK = new Map<number, BrowseResult>();
  const rowCounts = new Map<number, number>();
  // The schema ships with a default channel, so K is measured as ADDED rows on
  // top of whatever the fresh DB already holds. Both DBs start from the same
  // base (asserted below), so the A/B stays honest.
  const base = channelCount(dbPath);
  for (const K of STEPS) {
    rowCounts.set(K, seedTo(dbPath, base + K));
    await startServer(dbPath, `${tag}-${K}`);
    byK.set(K, await timeBrowse(SAMPLES));
    killServer();
  }
  const total = seedMatching(dbPath, matchIds);
  rowCounts.set(-1, total);
  await startServer(dbPath, `${tag}-matched`);
  const matched = await timeBrowse(2); // identity, not latency — two samples is enough
  killServer();
  return { byK, matched, rowCounts };
}

let hoisted: Awaited<ReturnType<typeof sweep>> | undefined;
let percall: Awaited<ReturnType<typeof sweep>> | undefined;

if (!canRun) {
  skip('R', 'needs a free port 3001 and a readable corpus');
  skip('S', 'needs a free port 3001 and a readable corpus');
} else {
  // One discarded run so the page cache is equally warm for both configurations
  // — fingerprint scanning is disk-bound and dominates the endpoint.
  await startServer(DB_HOISTED, 'warmup');
  await timeBrowse(1);
  killServer();
  console.log('page cache warmed (one discarded browse)\n');

  hoisted = await sweep(DB_HOISTED, 'hoisted');
  for (const K of STEPS) {
    const r = hoisted.byK.get(K)!;
    check('R', `hoisted browse at ${K} channels`, r.sessions > 0,
      `warm median ${ms(median(r.samples.slice(1)))} over ${SAMPLES - 1} samples ` +
      `[${r.samples.map((s) => s.toFixed(0)).join(', ')}], ${r.sessions} sessions, ${(r.bytes / 1e6).toFixed(2)} MB`,
      'measurement');
  }

  let patched = false;
  try {
    fs.writeFileSync(SCANNER, preHoist);
    patched = true;
    percall = await sweep(DB_PERCALL, 'percall');
  } finally {
    killServer();
    if (patched) {
      const ok = restoreScanner();
      check('S', 'scanner source restored byte-for-byte after the temporary patch', ok,
        ok ? `sha256 ${SCANNER_SHA.slice(0, 12)} matches` : `RESTORE FAILED — run \`git checkout ${SCANNER_REL}\``);
    }
  }

  if (percall) {
    for (const K of STEPS) {
      const r = percall.byK.get(K)!;
      check('S', `pre-hoist browse at ${K} channels`, r.sessions > 0,
        `warm median ${ms(median(r.samples.slice(1)))} over ${SAMPLES - 1} samples ` +
        `[${r.samples.map((s) => s.toFixed(0)).join(', ')}], ${r.sessions} sessions, ${(r.bytes / 1e6).toFixed(2)} MB`,
        'measurement');
    }
  }
}

// ── Arm T — what the hoist is worth at the endpoint ──────────────────────────

if (!hoisted || !percall) {
  skip('T', 'needs both sweeps');
} else {
  console.log('');
  const countRows = STEPS.map((K) => `K=${K}: ${percall.rowCounts.get(K)} vs ${hoisted.rowCounts.get(K)}`);
  const countsMatch = STEPS.every((K) => hoisted!.rowCounts.get(K) === percall!.rowCounts.get(K));
  check('T', 'both versions were measured against identical channel counts', countsMatch,
    `${countRows.join('; ')} (pre-hoist vs hoisted, absolute rows incl. the schema's default channel)`);

  const rows: string[] = [];
  for (const K of STEPS) {
    const h = median(hoisted.byK.get(K)!.samples.slice(1));
    const p = median(percall.byK.get(K)!.samples.slice(1));
    rows.push(`${K} channels: ${ms(p)} → ${ms(h)} (${p - h >= 0 ? '−' : '+'}${Math.abs(p - h).toFixed(0)} ms, ${(100 * (p - h) / p).toFixed(1)}%)`);
  }
  check('T', 'endpoint latency, pre-hoist vs hoisted', true, rows.join('; '), 'measurement');

  // The claim under test: the unit measurement said 198.5 ms → 4.1 ms at 2000
  // channels, i.e. ~194 ms of saving. Does that much actually leave the wire?
  const K = STEPS[STEPS.length - 1];
  const savedAtK = median(percall.byK.get(K)!.samples.slice(1)) - median(hoisted.byK.get(K)!.samples.slice(1));
  const savedAtZero = median(percall.byK.get(0)!.samples.slice(1)) - median(hoisted.byK.get(0)!.samples.slice(1));
  const UNIT_CLAIM = 198.5 - 4.1;
  check('T', `unit claim (~${UNIT_CLAIM.toFixed(0)} ms saved at ${K} channels) reaches the endpoint`,
    savedAtK > UNIT_CLAIM * 0.5,
    `endpoint saved ${ms(savedAtK)} at ${K} channels vs ${ms(UNIT_CLAIM)} claimed at the unit; ` +
    `at 0 channels the two versions differ by ${savedAtZero >= 0 ? '' : '−'}${Math.abs(savedAtZero).toFixed(0)} ms (expect ~0)`);

  // Slope: how much does each version's browse time grow per 1000 channels?
  const slope = (r: Map<number, BrowseResult>) => {
    const lo = median(r.get(0)!.samples.slice(1));
    const hi = median(r.get(K)!.samples.slice(1));
    return (hi - lo) / (K / 1000);
  };
  check('T', 'browse latency growth per 1000 imported channels', true,
    `pre-hoist +${ms(slope(percall.byK))}/1000, hoisted +${ms(slope(hoisted.byK))}/1000`,
    'measurement');
}

// ── Arm U — behavioural identity at the surface ──────────────────────────────

if (!hoisted?.matched || !percall?.matched) {
  skip('U', 'needs both matched runs');
} else {
  const h = hoisted.matched, p = percall.matched;
  const same = h.dedupState.length === p.dedupState.length &&
    h.dedupState.every((v, i) => v === p.dedupState[i]);
  const firstDiff = h.dedupState.find((v, i) => v !== p.dedupState[i]);
  check('U', 'dedup state identical across every session, hoisted vs pre-hoist', same,
    same
      ? `${h.dedupState.length} sessions compared on (sessionId, alreadyImported, existingChannelId); ` +
        `${h.imported} marked already-imported in both`
      : `MISMATCH — hoisted ${h.imported} imported vs pre-hoist ${p.imported}; first differing row: ${firstDiff}`);
  check('U', 'the identity check was not trivially true', h.imported > 0,
    `${matchIds.length} channels seeded to match real corpus session ids; ${h.imported} sessions came back already-imported`);
  check('U', 'same session count and payload size with matches present', h.sessions === p.sessions,
    `${h.sessions} vs ${p.sessions} sessions; ${(h.bytes / 1e6).toFixed(2)} MB vs ${(p.bytes / 1e6).toFixed(2)} MB`);
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n─── summary ───');
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'NOTE' : 'FAIL'} [${r.arm}] ${r.check}`);
}
for (const s of skipped) console.log(`  SKIP ${s}`);

const finalSha = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
if (finalSha !== SCANNER_SHA) {
  console.log(`\n!! ${SCANNER_REL} is NOT in its original state (sha ${finalSha.slice(0, 12)} vs ${SCANNER_SHA.slice(0, 12)}).`);
  console.log(`   Run: git checkout ${SCANNER_REL}`);
  process.exit(1);
}
console.log(`\n${SCANNER_REL} verified unmodified (sha256 ${SCANNER_SHA.slice(0, 12)}).`);

const failed = results.filter((r) => !r.pass && r.kind === 'regression');
if (failed.length) {
  console.log(`\n${failed.length} regression check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll regression checks passed; ${results.filter((r) => r.kind === 'measurement').length} measurements recorded.`);
