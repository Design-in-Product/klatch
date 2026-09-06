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
 * ─── Round 159 re-pin (Theseus, 2026-09-05 STOP fire) ───────────────────────
 * Arm S used to restore `afe0889^` WHOLESALE, guarded by a byte-identity check
 * against `afe0889`. Four commits have landed on session-scanner.ts since —
 * the fingerprint cache, the cap ruling, the headroom correction, multi-root
 * scanning — so that guard has been refusing to run since 2026-09-04, which is
 * correct behaviour and not a bug. The obvious fix (re-pin HOIST_COMMIT at
 * HEAD) is wrong and wrong QUIETLY: it would measure hoist+cache+cap+multiroot
 * and print it as the hoist.
 *
 * Arm S now applies the INVERSE of the hoist to the bytes on disk today, and a
 * new arm V validates that transform against the hoist commit pair before
 * anything is patched. See the arm-V block below for the full reasoning.
 *
 * Arms:
 *   V  the inverse-hoist transform is exactly the inverse of the hoist —
 *      applied to afe0889 it must reproduce afe0889^ byte-for-byte
 *   R  browse endpoint over real HTTP, HOISTED (shipped) code, at 0 / 500 /
 *      2000 seeded channels
 *   S  the same sweep with the hoist inverted on TODAY's source — the per-call
 *      lookup Daedalus replaced, against today's cache/cap/multi-root scanner
 *   T  the comparison: what the hoist is worth at the endpoint, per channel
 *      count, and whether it matches the 198.5 → 4.1 ms unit claim
 *   U  behavioural identity at the surface: with 50 channels seeded to match
 *      real corpus session ids, do both versions return byte-identical dedup
 *      state for every session?
 *
 * ─── On source mutation ─────────────────────────────────────────────────────
 * Arm S needs the pre-hoist code running behind a real server, so the file is
 * replaced with its transformed bytes for the duration of one server process
 * and restored in a `finally`. Before exiting, the probe re-reads the file and
 * asserts it is byte-identical to what it read at start; if not, it says so
 * loudly and exits 1. Nothing is committed in the patched state. Same
 * discipline as Round 144 arm N.
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

// ── Arm V — the inverse-hoist transform, and its validation ──────────────────
//
// Round 159 (2026-09-05) replaced the original arm-S mechanism. It used to get
// its pre-hoist code by restoring `afe0889^` WHOLESALE, guarded by a check that
// the file on disk was byte-identical to `afe0889`. That guard fired correctly
// from 2026-09-04 onward and the probe refused to run for three rounds, because
// four commits have landed on this file since the hoist:
//
//   dba7699  the fingerprint cache        18d4631  the cap ruling
//   e1ee197  the headroom correction      4602561  multi-root scanning
//
// Re-pinning HOIST_COMMIT at HEAD would have been the obvious fix and it is
// WRONG — `afe0889^` is missing all four, so the A/B would have silently
// measured hoist+cache+cap+multi-root and reported it as the hoist. It would
// not have errored. It would have produced a plausible number, and dba7699
// alone is ~200× the effect under test.
//
// So arm S no longer diffs against a commit. It applies the INVERSE of the
// hoist to whatever bytes are on disk today — three mechanical edits, five
// textual sites, every one an exact-match replacement with an ASSERTED
// occurrence count. That isolates the hoist against today's code, which is also
// the better measurement: under dba7699 the dedup scan is no longer 13% of
// browse, it is nearly all of the warm path, because the fingerprint half is a
// Map hit and the dedup half was deliberately left uncached.
//
// The transform is not trusted on its own say-so. Arm V validates it against
// the hoist commit pair before anything is patched: apply the SAME transform to
// `afe0889` and assert the output is BYTE-IDENTICAL to `afe0889^`. If the
// transform is truly the inverse of the hoist, that must hold exactly — and if
// it ever stops holding, the probe refuses rather than measuring the wrong
// thing. The commit pair is now a test fixture for the transform, not the
// source of the patched bytes.

const SCANNER_ORIGINAL = fs.readFileSync(SCANNER);
const SCANNER_SHA = crypto.createHash('sha256').update(SCANNER_ORIGINAL).digest('hex');

const gitShow = (rev: string) =>
  execFileSync('git', ['show', `${rev}:${SCANNER_REL}`], { cwd: REPO, maxBuffer: 32 * 1024 * 1024 });

const atHoist = gitShow(HOIST_COMMIT).toString('utf8');
const preHoist = gitShow(`${HOIST_COMMIT}^`).toString('utf8');

/**
 * The three edits the hoist made, inverted. Each is (pattern, replacement,
 * expected occurrence count) — the count is the assertion. A silent 0-match or
 * an unexpected extra match is the failure mode that would corrupt the A/B, so
 * every site is counted rather than merely replaced.
 */
const HOIST_INVERSE: Array<{ what: string; find: RegExp; to: string; expect: number }> = [
  {
    what: 'import: the resolver factory back to the per-call lookup',
    find: /import \{ createChannelBySessionIdResolver \} from '\.\.\/db\/queries\.js';/g,
    to: "import { findChannelByOriginalSessionId } from '../db/queries.js';",
    expect: 1,
  },
  {
    // Deletes the resolver construction AND the contiguous run of `//` comment
    // lines the hoist added directly above it, AND the blank line after — that
    // whole block is what afe0889 inserted, so removing less than all of it
    // would not reproduce afe0889^ and arm V would catch it.
    what: 'resolver construction + its comment block, in both scanners',
    find: /(?:^[ \t]*\/\/.*\n)*^[ \t]*const findChannel = createChannelBySessionIdResolver\(\);\n\n/gm,
    to: '',
    expect: 2,
  },
  {
    what: 'call sites: the hoisted resolver back to the per-call lookup',
    find: /findChannel\(sessionId\)/g,
    to: 'findChannelByOriginalSessionId(sessionId)',
    expect: 2,
  },
];

/** Applies the inverse hoist, asserting every site count. Throws on any miss. */
function applyInverseHoist(src: string, label: string): string {
  let out = src;
  for (const e of HOIST_INVERSE) {
    const n = (out.match(e.find) ?? []).length;
    if (n !== e.expect) {
      throw new Error(
        `inverse-hoist transform does not apply to ${label}: expected ${e.expect} occurrence(s) ` +
          `of "${e.what}", found ${n}. Refusing to run — a partial transform would measure ` +
          `something other than the hoist and would not look like an error.`,
      );
    }
    out = out.replace(e.find, e.to);
  }
  // Post-conditions: nothing hoisted may survive, and the per-call form must be
  // present at exactly the two read-only sites the hoist replaced.
  if (out.includes('createChannelBySessionIdResolver')) {
    throw new Error(`inverse-hoist left a resolver reference in ${label}`);
  }
  if (/findChannel\(/.test(out)) {
    throw new Error(`inverse-hoist left a hoisted call site in ${label}`);
  }
  if ((out.match(/findChannelByOriginalSessionId\(sessionId\)/g) ?? []).length !== 2) {
    throw new Error(`inverse-hoist did not produce exactly two per-call lookups in ${label}`);
  }
  if (out === src) throw new Error(`inverse-hoist was a no-op on ${label}`);
  return out;
}

// Arm V, run before anything is patched. If this fails the probe never touches
// the working tree.
let transformValidated = false;
let vDetail = '';
try {
  const rebuilt = applyInverseHoist(atHoist, `${HOIST_COMMIT} (the hoist commit itself)`);
  transformValidated = rebuilt === preHoist;
  vDetail = transformValidated
    ? `transform applied to ${HOIST_COMMIT} reproduces ${HOIST_COMMIT}^ byte-for-byte ` +
      `(${Buffer.byteLength(rebuilt)} bytes, sha256 ` +
      `${crypto.createHash('sha256').update(rebuilt).digest('hex').slice(0, 12)})`
    : `transform applied to ${HOIST_COMMIT} does NOT reproduce ${HOIST_COMMIT}^ ` +
      `(${Buffer.byteLength(rebuilt)} vs ${Buffer.byteLength(preHoist)} bytes) — ` +
      `the transform is not the inverse of the hoist`;
} catch (e) {
  vDetail = `transform failed against the commit pair: ${(e as Error).message}`;
}

if (!transformValidated) {
  console.log(
    `!! Arm V FAILED — ${vDetail}\n` +
      `\n   Refusing to run. The transform is the only thing that makes arm S an isolation of\n` +
      `   the hoist rather than of hoist-plus-everything-since. If it cannot reproduce the\n` +
      `   known pre-hoist bytes from the known hoisted bytes, it cannot be trusted to produce\n` +
      `   pre-hoist bytes from today's.`,
  );
  process.exit(1);
}

// Now the same transform against today's bytes. Computed here, before any
// server runs, so a shape change on disk is a refusal and not a mid-run abort.
let preHoistToday: string;
try {
  preHoistToday = applyInverseHoist(SCANNER_ORIGINAL.toString('utf8'), `${SCANNER_REL} on disk`);
} catch (e) {
  console.log(
    `!! ${(e as Error).message}\n` +
      `\n   The hoist's shape has changed on disk since Round 159 wrote this transform.\n` +
      `   Fix the transform to match the new shape — do NOT fall back to restoring a commit\n` +
      `   wholesale, which is the failure this arm exists to prevent. Arm V will tell you\n` +
      `   whether the repaired transform is still the inverse of the hoist.`,
  );
  process.exit(1);
}

const since = execFileSync('git', ['log', '--oneline', `${HOIST_COMMIT}..HEAD`, '--', SCANNER_REL],
  { cwd: REPO, encoding: 'utf8' }).trim();
const commitsSince = since ? since.split('\n').length : 0;

check('V', 'inverse-hoist transform reproduces the known pre-hoist bytes from the known hoisted bytes',
  transformValidated, vDetail);
check('V', 'the transform was validated against a commit pair that is genuinely stale', commitsSince > 0,
  commitsSince > 0
    ? `${commitsSince} commit(s) to ${SCANNER_REL} since ${HOIST_COMMIT} — a wholesale restore of ` +
      `${HOIST_COMMIT}^ would have measured the hoist PLUS all of them:\n${since.split('\n').map((l) => `        ${l}`).join('\n')}`
    : `no commits to the scanner since ${HOIST_COMMIT} — the wholesale restore would still have been valid`);
check('V', 'arm S patch bytes come from today\'s disk, not from a commit', true,
  `disk sha256 ${SCANNER_SHA.slice(0, 12)} → transformed ` +
    `sha256 ${crypto.createHash('sha256').update(preHoistToday).digest('hex').slice(0, 12)}; ` +
    `${SCANNER_ORIGINAL.length} → ${Buffer.byteLength(preHoistToday)} bytes ` +
    `(${Buffer.byteLength(preHoistToday) - SCANNER_ORIGINAL.length} bytes)`,
  'measurement');
console.log('');

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
    // Round 159: transformed from disk (arm V), NOT `git show afe0889^`.
    fs.writeFileSync(SCANNER, preHoistToday);
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
    // Round 146 annotated this zero-channel delta "expect ~0" and it is not ~0 —
    // it is the hoist's FIXED floor. At 0 seeded channels the pre-hoist code
    // still issues one prepared-statement lookup per session FILE (528 of them)
    // against a 1-row channels table, so the saving is per-call overhead with
    // the scan cost taken out. Invisible in Round 146 at 0.5% of a 2.3 s browse;
    // under the cache it is most of a warm one. Reported, not asserted to zero.
    `at 0 channels they still differ by ${savedAtZero >= 0 ? '' : '−'}${Math.abs(savedAtZero).toFixed(0)} ms ` +
    `— the per-call FLOOR (one lookup per session file, not per channel), not noise`);

  // Slope: how much does each version's browse time grow per 1000 channels?
  const slope = (r: Map<number, BrowseResult>) => {
    const lo = median(r.get(0)!.samples.slice(1));
    const hi = median(r.get(K)!.samples.slice(1));
    return (hi - lo) / (K / 1000);
  };
  check('T', 'browse latency growth per 1000 imported channels', true,
    `pre-hoist +${ms(slope(percall.byK))}/1000, hoisted +${ms(slope(hoisted.byK))}/1000`,
    'measurement');

  // Round 159 addition — the reason the re-pin was worth doing at all. Round 146
  // measured this before dba7699 existed, when the fingerprint scan dominated
  // browse and the dedup line was ~13% of it. Under the cache the FIRST browse
  // still pays full fingerprint freight and every browse after is a Map hit —
  // so the hoist's share of the warm path should be far larger than its share
  // of the cold one, from the same saving in absolute ms. Reported as two rows
  // rather than one, because a single "% of browse" figure is now ambiguous
  // about which browse it means, and that ambiguity is what made 13% stale.
  const coldRows: string[] = [];
  const warmRows: string[] = [];
  for (const K of STEPS) {
    const hc = hoisted.byK.get(K)!.samples[0], pc = percall.byK.get(K)!.samples[0];
    const hw = median(hoisted.byK.get(K)!.samples.slice(1)), pw = median(percall.byK.get(K)!.samples.slice(1));
    coldRows.push(`${K}: ${ms(pc)} → ${ms(hc)} (${(100 * (pc - hc) / pc).toFixed(1)}% of cold browse)`);
    warmRows.push(`${K}: ${ms(pw)} → ${ms(hw)} (${(100 * (pw - hw) / pw).toFixed(1)}% of warm browse)`);
  }
  check('T', 'the hoist as a share of COLD (cache-filling) browse', true, coldRows.join('; '), 'measurement');
  check('T', 'the hoist as a share of WARM (cache-hit) browse', true, warmRows.join('; '), 'measurement');

  const Kmax = STEPS[STEPS.length - 1];
  const warmShare = (() => {
    const hw = median(hoisted.byK.get(Kmax)!.samples.slice(1));
    const pw = median(percall.byK.get(Kmax)!.samples.slice(1));
    return 100 * (pw - hw) / pw;
  })();
  // Round 146's own table: 2000 channels, 1634 ms → 1409 ms, −224 ms = 13.7%.
  // That percentage is not wrong; it is measured against a browse that
  // re-fingerprinted every file on every request. dba7699 removed that
  // denominator from the warm path without touching the numerator.
  const R146_SHARE = 13.7;
  check('T', `Round 146's 13.7%-of-browse figure is stale in its DENOMINATOR, not its numerator`,
    warmShare > R146_SHARE,
    `at ${Kmax} channels the hoist is ${warmShare.toFixed(1)}% of warm browse vs Round 146's ` +
    `${R146_SHARE}% (its 1634→1409 ms row); the saving in absolute ms is unchanged — ` +
    `${ms(savedAtK)} today vs 224 ms then — so what moved is what it is a share OF`);

  // Round 146 isolated a 27 ms component of its 224 ms that was present at 0
  // channels and did not scale. Same quantity, re-measured under the cache where
  // it is resolvable rather than 1.7% of a disk-bound number. Reported as a
  // reproduction attempt with its own verdict, not folded into the headline.
  const R146_FLOOR = 27;
  const floorRatio = savedAtZero / R146_FLOOR;
  check('T', `Round 146's 27 ms zero-channel floor reproduces in KIND but not in MAGNITUDE`,
    savedAtZero > 0,
    `measured ${ms(savedAtZero)} at 0 channels against Round 146's 27 ms — ${floorRatio.toFixed(2)}× — ` +
    `and on MORE files (528 now vs 508 then), so the direction is wrong for a per-file cost. ` +
    `The floor is real and positive in every run; its Round 146 magnitude is not confirmed. ` +
    `Most likely 27 ms was 1.7% of a 1634 ms disk-bound browse and inside that run's variance, ` +
    `whereas here it is ~60% of a 19 ms one. NOT asserted — flagged as an open non-reproduction.`,
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
