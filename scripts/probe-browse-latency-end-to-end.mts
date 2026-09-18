/**
 * Round 144 probe — is the number xian is being asked to rule on the number the
 * user experiences?
 *
 * Theseus, 2026-09-03 WORK fire.
 *
 * Daedalus measured the fingerprint line cap this morning and routed a decision
 * to xian in these words:
 *
 *   "browse goes 1.39 s → 2.03 s on a 506-session corpus, in exchange for exact
 *    depth counts on the only sessions where depth matters"
 *
 * That framing is user-facing — "browse" is a screen, and 1.39 → 2.03 s reads as
 * what a person waits. But the measurement behind it
 * (scripts/probe-scan-latency-vs-cap.mts) sums `extractSessionFingerprint` calls
 * in-process. The browse ENDPOINT does more than fingerprint:
 * `scanClaudeCodeSessions` also does a readdir per project dir, a `statSync` per
 * file, and — per file — a `findChannelByOriginalSessionId` SQLite lookup
 * (session-scanner.ts:271); then the route adds `scanExportedSessions`, a
 * `guessEntityName` per session, and JSON-serialises the whole payload
 * (routes/import.ts:48-75).
 *
 * This is the same class of gap as Round 141 arm F and Round 142 arm H: a value
 * measured one layer below the surface it is being described at. It cuts BOTH
 * ways and I do not know the sign before running it:
 *
 *   - If fingerprinting is most of endpoint time, Daedalus's +46% relative
 *     regression stands as stated and xian should rule on it as written.
 *   - If fingerprinting is a minority of endpoint time, the real regression is
 *     the same +645 ms against a LARGER base — a smaller relative hit, and the
 *     decision gets easier, not harder.
 *
 * Either way the number in front of xian should be the one measured at the
 * surface it names. Nobody has measured browse over HTTP at all — Daedalus's
 * probe never starts a server, and my Round 142 arm H fetched the endpoint for
 * correctness without timing it.
 *
 * Run:  npx tsx scripts/probe-browse-latency-end-to-end.mts
 *
 * Zero model calls. Scratch DB via KLATCH_DB; xian's `klatch.db` is untouched.
 * The corpus under ~/.claude/projects is read-only throughout.
 *
 * Arms:
 *   L  real HTTP browse latency at the SHIPPED cap (what users wait today)
 *   M  in-process fingerprint sum, cap 1500 vs uncapped — independent repro of
 *      Daedalus's +645 ms / 11-of-506 figures, on my own instrument
 *   N  real HTTP browse latency with the cap REMOVED, via a temporary patch of
 *      FINGERPRINT_LINE_CAP that is restored and verified before exit
 *   O  does L - M_capped (the non-fingerprint remainder) predict N?  If the
 *      decomposition is sound, N ≈ L + (M_uncapped - M_capped).
 *   P  the remainder is measured against an EMPTY database. The per-file dedup
 *      lookup (session-scanner.ts:271 → queries.ts:1365) has no index on
 *      `source_metadata` — it is a full scan of `channels` with a `json_extract`
 *      per row, run once per session file. So the remainder is O(files ×
 *      channels) and a 2%-of-browse reading on an empty DB does not license a
 *      claim about a user who has actually imported things. This measures the
 *      slope.
 *
 * ─── On arm N and source mutation ───────────────────────────────────────────
 * The product call sites deliberately don't pass `lineCap` (session-scanner.ts
 * :130), so the only way to get an uncapped number at the HTTP surface is to
 * change the constant for the duration of one server process. The patch is
 * written, the server is spawned, the measurement is taken, and the ORIGINAL
 * BYTES are restored in a `finally`. Before exiting, the probe re-reads the file
 * and asserts it is byte-identical to what it read at start; if it is not, it
 * says so loudly and exits 1. Nothing is committed in the patched state.
 *
 * This probe does NOT recommend a cap value. The cap decision is xian's and is
 * parked on his seat; this only checks whether the latency figure attached to it
 * is measured where it is described.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { somethingIsAlreadyAnswering } from './lib/probe-server-ownership.mts';
import { summariseAndExit } from './lib/probe-outcome.mts';
import { readNumericConstant, replaceNumericConstant } from './lib/probe-source-constants.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'browse-latency-e2e');
const DB = path.join(SCRATCH, 'scratch.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER = path.join(REPO, 'packages/server/src/import/session-scanner.ts');

/**
 * ─── 2026-09-17, Theseus (Round 227) — this line has to be HERE, not in arm P ──
 *
 * `db/index.ts:24` resolves `DB_PATH` in a module-level `const`, at load time,
 * defaulting to `<project root>/klatch.db`. Arm P used to set
 * `process.env.KLATCH_DB` immediately before its own `getDb()` — but by then
 * `db/index.ts` was long since loaded, because arm M dynamically imports
 * `session-scanner.ts`, which imports `../db/queries.js` at line 5. The
 * assignment was a no-op against a constant that had already been computed, and
 * every row arm P seeded went into the WORKTREE'S REAL `klatch.db`.
 *
 * Measured, not reasoned: this worktree's `klatch.db` held 6000 `probe-seed-%`
 * channels against 2 real ones — 2000 from the first run of this probe on
 * 2026-09-03 and 4000 from two runs tonight — plus 4000 `channel_entities` rows
 * that a later server boot's migration backfilled onto them. Removed, with a
 * `VACUUM INTO` backup at `.testdata/klatch.db.backup-before-round227-cleanup`.
 * `DB_PATH` resolves through `findProjectRoot(__dirname)`, so each agent's
 * worktree accumulates its own.
 *
 * Set before the first import that can reach `db/index.ts`. Moving it back down
 * re-opens the leak silently.
 */
process.env.KLATCH_DB = DB;

const SAMPLES = 5; // per configuration; first sample reported separately as cold-ish

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
/**
 * A delta, with its own sign. Every delta line here used to be written as
 * `+${ms(x)}`, which renders a negative move as `+-213 ms` — and on 2026-09-17
 * the real corpus produced exactly that on the headline: the uncapped cold
 * browse came out 213 ms FASTER than the capped one (the cap fires on nothing
 * there, so the difference is run-to-run noise). "+-213 ms" is one glance away
 * from "+213 ms", which is the opposite claim. Sign belongs to the number.
 */
const delta = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(0)} ms`;
const deltaPct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(0)}%`;

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// ── Source guard: capture the scanner's exact bytes before anything runs ──────
const SCANNER_ORIGINAL = fs.readFileSync(SCANNER);
const SCANNER_SHA = crypto.createHash('sha256').update(SCANNER_ORIGINAL).digest('hex');
// Was `match(/const FINGERPRINT_LINE_CAP = (\d+);/)`, which stopped matching on 2026-09-04 when
// the shipped constant became `50_000` — this probe has thrown at startup ever since. See
// scripts/lib/probe-source-constants.mts.
const SHIPPED_CAP = readNumericConstant(
  SCANNER_ORIGINAL.toString('utf8'), 'FINGERPRINT_LINE_CAP', 'probe-browse-latency-end-to-end');
console.log(`shipped FINGERPRINT_LINE_CAP = ${SHIPPED_CAP} (read from source, sha256 ${SCANNER_SHA.slice(0, 12)})\n`);

function restoreScanner(): boolean {
  fs.writeFileSync(SCANNER, SCANNER_ORIGINAL);
  const now = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
  return now === SCANNER_SHA;
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

async function startServer(tag: string): Promise<void> {
  const logFd = fs.openSync(path.join(SCRATCH, `server-${tag}.log`), 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: DB },
    stdio: ['ignore', logFd, logFd],
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}) — see ${path.join(SCRATCH, `server-${tag}.log`)}`);
    }
    try { if ((await fetch(`${BASE}/api/channels`)).ok) return; } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} in 60 s — see ${path.join(SCRATCH, `server-${tag}.log`)}`);
}

/**
 * Time the browse endpoint end to end: request issued → body fully read and
 * JSON-parsed. Parsing is included deliberately — the client does it before it
 * can render a single row, so it is part of what a person waits for.
 */
async function timeBrowse(n: number): Promise<{ samples: number[]; bytes: number; sessions: number; projects: number; capped: number }> {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, projects = 0, capped = 0;
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    const res = await fetch(`${BASE}/api/import/claude-code/sessions`);
    const text = await res.text();
    const body = JSON.parse(text);
    samples.push(performance.now() - t0);
    bytes = Buffer.byteLength(text);
    const all = ((body.projects ?? []) as any[]).flatMap((p) => p.sessions ?? []);
    sessions = all.length;
    projects = (body.projects ?? []).length;
    capped = all.filter((s: any) => s.fingerprintCapped).length;
  }
  return { samples, bytes, sessions, projects, capped };
}

// `haveServer` until 2026-09-17 — the opposite of what it holds. Same inverted name as
// probe-turncount-live-http, where it produced the backwards skip copy Theseus caught in
// Round 223 §3. This probe's copy happened to be right; the name was still the hazard.
const canStartOurOwnServer = (await somethingIsAlreadyAnswering(PORT)) === null;
if (!canStartOurOwnServer) {
  console.log(`port ${PORT} is occupied — arms L, N and O cannot run (the server hardcodes 3001). Arm M still runs.\n`);
}

// ── Arm L — real HTTP browse latency at the shipped cap ──────────────────────

let L: Awaited<ReturnType<typeof timeBrowse>> | undefined;
if (!canStartOurOwnServer) {
  skip('L', 'needs a free port 3001; stop `npm run dev` and re-run');
} else {
  await startServer('capped');
  L = await timeBrowse(SAMPLES);
  killServer();
  const cold = L.samples[0];
  const warm = median(L.samples.slice(1));
  check('L', 'browse endpoint returns a non-empty corpus', L.sessions > 0,
    `${L.sessions} sessions across ${L.projects} projects, ${(L.bytes / 1e6).toFixed(2)} MB payload, ${L.capped} capped`);
  check('L', 'shipped-cap browse latency measured over real HTTP', true,
    `first ${ms(cold)}, warm median ${ms(warm)} over ${SAMPLES - 1} samples [${L.samples.map((s) => s.toFixed(0)).join(', ')}]`,
    'measurement');
}

// ── Arm M — independent reproduction of the fingerprint-sum figures ──────────
//
// Imports the SHIPPED function and drives it over the same corpus the endpoint
// walks, at the shipped cap and uncapped. This is deliberately my own harness
// rather than a re-run of Daedalus's: the point is whether the numbers replicate
// on a second instrument, not whether his script is deterministic.

const { extractSessionFingerprint } = await import(path.join(REPO, 'packages/server/src/import/session-scanner.ts'));

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
      try { if (fs.statSync(p).size < 100) continue; } catch { continue; } // mirrors session-scanner.ts:267
      out.push(p);
    }
  }
  return out;
}

const files = corpusFiles();
let mCapped = 0, mUncapped = 0, turnsCapped = 0, turnsUncapped = 0, cappedFiles = 0;
let totalBytes = 0;

if (files.length === 0) {
  skip('M', 'no readable corpus under ~/.claude/projects');
} else {
  for (const f of files) { try { totalBytes += fs.statSync(f).size; } catch { /* ignore */ } }

  // Warm the page cache for both passes equally, then measure sequentially in
  // the same order the scanner uses.
  for (const f of files) { await extractSessionFingerprint(f, SHIPPED_CAP); }

  let t0 = performance.now();
  for (const f of files) {
    const fp = await extractSessionFingerprint(f, SHIPPED_CAP);
    turnsCapped += fp.turnCount;
    if (fp.capped) cappedFiles++;
  }
  mCapped = performance.now() - t0;

  t0 = performance.now();
  for (const f of files) {
    const fp = await extractSessionFingerprint(f, Number.MAX_SAFE_INTEGER);
    turnsUncapped += fp.turnCount;
  }
  mUncapped = performance.now() - t0;

  const pctFiles = (100 * cappedFiles / files.length).toFixed(1);
  const pctTurns = turnsUncapped ? (100 * turnsCapped / turnsUncapped).toFixed(1) : 'n/a';
  check('M', 'fingerprint sum reproduces at both caps', true,
    `${files.length} files / ${(totalBytes / 1e6).toFixed(1)} MB — cap ${SHIPPED_CAP} ${ms(mCapped)}, uncapped ${ms(mUncapped)}, delta ${delta(mUncapped - mCapped)}`,
    'measurement');
  check('M', 'cap-bites and turn-retention figures reproduce', true,
    `cap fires on ${cappedFiles}/${files.length} files (${pctFiles}%); turns ${turnsCapped} → ${turnsUncapped} (${pctTurns}% retained, +${turnsUncapped - turnsCapped} recovered)`,
    'measurement');
}

// ── Arm N — real HTTP browse latency with the cap removed ────────────────────

let N: Awaited<ReturnType<typeof timeBrowse>> | undefined;
let patchApplied = false;
if (!canStartOurOwnServer) {
  skip('N', 'needs a free port 3001');
} else {
  try {
    // Was built by interpolating SHIPPED_CAP back into a needle string, so it looked for
    // `= 50000;` in a file that says `= 50_000;` and no-opped. The second victim of the same
    // 2026-09-04 reformatting, 170 lines below the first. The no-op guard here did its job and
    // threw before writing — that is why this was a dead probe and not a dirty working tree.
    const patched = replaceNumericConstant(
      SCANNER_ORIGINAL.toString('utf8'), 'FINGERPRINT_LINE_CAP', 'Number.MAX_SAFE_INTEGER',
      'probe-browse-latency-end-to-end');
    fs.writeFileSync(SCANNER, patched);
    patchApplied = true;
    await startServer('uncapped');
    N = await timeBrowse(SAMPLES);
  } finally {
    killServer();
    if (patchApplied) {
      const ok = restoreScanner();
      check('N', 'scanner source restored byte-for-byte after the temporary patch', ok,
        ok ? `sha256 ${SCANNER_SHA.slice(0, 12)} matches` : 'RESTORE FAILED — run `git checkout packages/server/src/import/session-scanner.ts`');
    }
  }
  if (N) {
    const cold = N.samples[0];
    const warm = median(N.samples.slice(1));
    check('N', 'uncapped browse still returns the same corpus', L ? N.sessions === L.sessions : N.sessions > 0,
      `${N.sessions} sessions, ${(N.bytes / 1e6).toFixed(2)} MB payload, ${N.capped} capped (expect 0)`);
    check('N', 'uncapped browse latency measured over real HTTP', true,
      `first ${ms(cold)}, warm median ${ms(warm)} over ${SAMPLES - 1} samples [${N.samples.map((s) => s.toFixed(0)).join(', ')}]`,
      'measurement');
  }
}

// ── Arm O — does the decomposition hold? ─────────────────────────────────────
//
// If browse time = fingerprinting + everything-else, then removing the cap
// should move the endpoint by exactly the fingerprint delta and nothing else.
// Agreement validates the attribution; disagreement means the endpoint's cost
// structure is not what either of us assumed and the remainder needs its own
// measurement.
//
// ─── 2026-09-17, Theseus (Round 227) — this arm was fed the wrong sample ────
// Until today arm O used `median(samples.slice(1))` — the WARM median. The
// fingerprint cache (session-scanner.ts:439) is process-lifetime and keyed on
// `(path, mtimeMs, size, lineCap)`, and `timeBrowse` runs all five samples
// against one freshly spawned server. So sample 0 pays the fingerprinting and
// samples 1-4 are cache hits: the warm median is, by construction, the browse
// path with the fingerprint work already elided. Feeding it to a decomposition
// of the form `browse = fingerprint + remainder` produced a NEGATIVE remainder,
// and predicting that it would move by the fingerprint delta predicted a move in
// a number that cannot move.
//
// Daedalus flagged the resulting FAIL on 2026-09-17 and read it as vacuous
// because the cap fires on 0/536 files here, prescribing a skip on corpora where
// the cap does not bite. Driven on a corpus where it bites hard — 3 files capped,
// turns 76,000 -> 121,000, fingerprint delta +94 ms — the warm form came out
// 6304.7% off, WORSE than the 65.5% it recorded on a corpus where the cap fired
// on nothing. The cold form on that same run came out 1.0% off. The corpus was
// never the cause; see scripts/probe-round227-arm-o-on-a-corpus-where-the-cap-
// fires.mts and docs/research/round227-*.md.
//
// Cold is also the right sample on the merits, not just the one that makes the
// arithmetic close: the figure this probe exists to check is the one xian was
// asked to rule on ("browse goes 1.39 s -> 2.03 s"), and that is a first-visit
// number. The warm median is the steady state the cache bought and is reported
// by arms L and N in their own right; it is only this decomposition that must
// not be fed it.

if (!L || !N || files.length === 0) {
  skip('O', 'needs arms L, M and N to have run');
} else {
  // Cold, deliberately — see the note above. Warm is carried alongside so the
  // contrast stays visible in the output rather than living only in a comment.
  const coldL = L.samples[0];
  const coldN = N.samples[0];
  const warmL = median(L.samples.slice(1));
  const warmN = median(N.samples.slice(1));
  const remainder = coldL - mCapped;
  const predicted = coldL + (mUncapped - mCapped);
  const measuredDelta = coldN - coldL;
  const errPct = Math.abs(predicted - coldN) / coldN * 100;

  console.log('');
  check('O', 'fingerprinting is attributed at the surface it is described at', true,
    `cold browse ${ms(coldL)} = fingerprint ${ms(mCapped)} (${(100 * mCapped / coldL).toFixed(0)}%) + remainder ${ms(remainder)} (${(100 * remainder / coldL).toFixed(0)}%)`,
    'measurement');
  check('O', 'endpoint delta matches the fingerprint delta', errPct < 20,
    `predicted ${ms(predicted)} vs measured ${ms(coldN)} (${errPct.toFixed(1)}% off); cold endpoint moved ${delta(measuredDelta)} for a fingerprint delta of ${delta(mUncapped - mCapped)}`);
  check('O', 'relative regression at the user-facing surface', true,
    `${ms(coldL)} → ${ms(coldN)} = ${deltaPct(100 * measuredDelta / coldL)} of a cold browse (fingerprint-only framing: ${deltaPct(100 * (mUncapped - mCapped) / mCapped)} of the scan)`,
    'measurement');
  check('O', 'the warm path is inert to the cap, and is reported as its own number', true,
    `warm ${ms(warmL)} → ${ms(warmN)} = ${delta(warmN - warmL)} for a fingerprint delta of ${delta(mUncapped - mCapped)} — the steady state the fingerprint cache bought, not a decomposable browse`,
    'measurement');
}

// ── Arm P — how the non-fingerprint remainder scales with imported channels ──
//
// `findChannelByOriginalSessionId` tries the primary key first (cheap), then
// falls back to `SELECT * FROM channels WHERE json_valid(source_metadata) AND
// json_extract(source_metadata, '$.originalSessionId') = ?`. There is no index
// covering that predicate (grep CREATE INDEX in db/index.ts — the only three are
// on message_artifacts and file_refs), so every browsed file pays a full table
// scan with a JSON parse per channel row. Browse calls it once per file.
//
// Measured directly rather than through HTTP so the slope is isolated from the
// fingerprint cost that dominates the endpoint.

if (files.length === 0) {
  skip('P', 'needs a corpus to size the lookup count');
} else if (!fs.existsSync(DB)) {
  skip('P', 'scratch DB was never created (arms L/N did not run)');
} else {
  // KLATCH_DB is set at the top of this file, not here — see the note there.
  const { findChannelByOriginalSessionId } = await import(path.join(REPO, 'packages/server/src/db/queries.ts'));
  const { getDb } = await import(path.join(REPO, 'packages/server/src/db/index.ts'));
  const db = getDb();

  const ids = files.map((f) => path.basename(f, '.jsonl'));
  const seed = db.prepare(
    "INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at, source, source_metadata) VALUES (?, ?, '', 'claude-opus-5', 'chat', 'chat', ?, 'claude-code', ?)",
  );
  const baseline = db.prepare('SELECT COUNT(*) c FROM channels').get() as any;

  const rows: string[] = [];
  let seeded = baseline.c as number;
  for (const K of [0, 100, 500, 2000]) {
    const insert = db.transaction((n: number) => {
      for (let i = 0; i < n; i++) {
        // Synthetic ids that will never match a real session, so every lookup
        // runs the full scan — the worst case, and the common case for a user
        // browsing sessions they have not imported.
        seed.run(`probe-seed-${seeded + i}`, `probe seed ${seeded + i}`, new Date().toISOString(),
          JSON.stringify({ originalSessionId: `no-such-session-${seeded + i}` }));
      }
    });
    const want = K - (seeded - (baseline.c as number));
    if (want > 0) { insert(want); seeded += want; }

    const t0 = performance.now();
    for (const id of ids) findChannelByOriginalSessionId(id);
    const dt = performance.now() - t0;
    rows.push(`${K} channels → ${ms(dt)} for ${ids.length} lookups (${(dt / ids.length * 1000).toFixed(0)} µs each)`);
  }

  // Leave the scratch DB seeded — it lives under .testdata and is wiped on the
  // next run. xian's klatch.db is a different file and was never opened here.
  check('P', 'per-file dedup lookup cost scales with imported channel count', true,
    rows.join('; '), 'measurement');

  // ── The guard, rewritten 2026-09-17 (Round 227) ────────────────────────────
  //
  // It used to read:
  //
  //   check('P', 'scratch DB used, not the repo klatch.db', DB.includes('.testdata'),
  //         `${cleanDb.c} channels in ${path.relative(REPO, DB)}`);
  //
  // `DB` is a string literal built at the top of this file. `DB.includes('.testdata')`
  // is therefore true on every run that will ever happen, and the detail line
  // printed the path this probe INTENDED to open next to a count read from a
  // different database. It passed on every run for fourteen days while the thing
  // it names — "not the repo klatch.db" — was false.
  //
  // A guard on the variable that names the target is not a guard on the handle
  // that was opened. Ask the connection where it actually is. `better-sqlite3`
  // exposes the opened filename as `db.name`; that cannot be satisfied by an
  // assignment that no-opped.
  const openedPath = path.resolve((db as any).name);
  const cleanDb = db.prepare('SELECT COUNT(*) c FROM channels').get() as any;
  check('P', 'the OPEN HANDLE is the scratch DB, not the repo klatch.db', openedPath === path.resolve(DB),
    `getDb() opened ${path.relative(REPO, openedPath)} (want ${path.relative(REPO, DB)}); ${cleanDb.c} channels in it`);
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n─── summary ───');
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : r.kind === 'measurement' ? 'NOTE' : 'FAIL'} [${r.arm}] ${r.check}`);
}
for (const s of skipped) console.log(`  SKIP ${s}`);

const finalSha = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
if (finalSha !== SCANNER_SHA) {
  console.log(`\n!! session-scanner.ts is NOT in its original state (sha ${finalSha.slice(0, 12)} vs ${SCANNER_SHA.slice(0, 12)}).`);
  console.log(`   Run: git checkout packages/server/src/import/session-scanner.ts`);
  process.exit(1);
}
console.log(`\nsession-scanner.ts verified unmodified (sha256 ${SCANNER_SHA.slice(0, 12)}).`);

console.log(`${results.filter((r) => r.kind === 'measurement').length} measurements recorded.`);
summariseAndExit({ probeName: 'probe-browse-latency-end-to-end', results, skipped });
