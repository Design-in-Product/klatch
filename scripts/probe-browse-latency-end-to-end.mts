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
// `os` was imported for arm M's hardcoded ~/.claude/projects literal, removed in
// Round 233 — the corpus comes from the shipped resolver now. Nothing else here
// needed the home directory.
import crypto from 'crypto';
import { spawn } from 'child_process';
import {
  somethingIsAlreadyAnswering,
  waitUntilPortIsQuiet,
  waitUntilOurServerIsUp,
  reapOnExit,
} from './lib/probe-server-ownership.mts';
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

/**
 * ─── 2026-09-18, Theseus (Round 233) — the corpus is an ARGUMENT now ─────────
 *
 * `npx tsx scripts/probe-browse-latency-end-to-end.mts [configDir]`
 *
 * With no argument, nothing changes: the default `~/.claude` root, which is what
 * every previous round measured. With one, it relocates the session root the way
 * `CLAUDE_CONFIG_DIR` does — because that is exactly what it sets, here, before
 * the first import that can read it and before any server is spawned (the child
 * inherits it).
 *
 * **Why an argument and not just the environment variable.** Two reasons, and the
 * second is the load-bearing one:
 *
 * 1. `CLAUDE_CONFIG_DIR=… npx tsx …` as a shell prefix is refused from the duty-
 *    cycle seat (measured 2026-09-18: `npx tsx --version` runs, the same command
 *    with an env prefix does not). The assignment below is the same mechanism one
 *    process earlier.
 * 2. Four rounds of "run arm O against a corpus where the cap fires" went
 *    unstarted partly because the probe had no way to be handed a corpus. A
 *    documented argument makes the corpus an input of the instrument rather than
 *    ambient state of whoever invoked it.
 *
 * A typo'd path must not silently become an empty corpus — an empty root makes
 * arm M skip and arm L return nothing, which reads as "nothing to measure"
 * rather than "you pointed me at nowhere." So it is checked here and refused.
 */
const CORPUS_ARG = process.argv[2];
if (CORPUS_ARG) {
  const abs = path.resolve(CORPUS_ARG);
  const projectsDir = path.basename(abs) === 'projects' ? abs : path.join(abs, 'projects');
  if (!fs.existsSync(projectsDir)) {
    console.error(
      `refusing: ${process.argv[2]} has no readable projects directory (looked for ${projectsDir}).\n` +
      `Pass a Claude config dir (the one containing \`projects/\`), or no argument at all to use ~/.claude.`);
    process.exit(2);
  }
  process.env.CLAUDE_CONFIG_DIR = abs;
  console.log(`corpus relocated by argument: CLAUDE_CONFIG_DIR = ${abs}`);
}

const SAMPLES = 5; // per configuration; first sample reported separately as cold-ish

/**
 * How many server generations each HTTP arm runs.
 *
 * ─── 2026-09-18, Daedalus (Round 228) — why more than one ───────────────────
 * The fingerprint cache (session-scanner.ts:439) is process-lifetime, so the
 * ONLY cold sample a server generation can yield is its first. One generation
 * per arm therefore gives arm O exactly one cold number per configuration and
 * no estimate of how much that number moves on its own. Theseus measured the
 * consequence on 2026-09-17 (Round 227 §3): three cold-vs-cold runs on a corpus
 * where the true delta is ~0 produced −213 ms, −3 ms and −476 ms, and arm O's
 * fixed `errPct < 20` tolerance read 7.3%, 0.7% and 16.9% — the third passing
 * with 3.1 points of margin on a corpus that cannot support the claim at all.
 * A tolerance expressed as a percentage of the cold browse was measuring
 * run-to-run variance and calling it agreement.
 *
 * Generation 0 is a PAGE-CACHE warmup and is discarded from the cold series.
 * The fingerprint cache is per-process and fresh in every generation, but the
 * OS page cache over ~/.claude/projects is not: the first generation of a run
 * pays misses the rest do not, which is a second population, not noise. Arm M
 * already warms the page cache for its own two passes (line ~281) for the same
 * reason — this is that rule applied to the HTTP arms.
 */
const COLD_GENERATIONS = 4; // 1 discarded warmup + 3 measured
const COLD_BAND_SIGMAS = 2; // ≈95% under normality; the band arm O must clear
const LADDER_PASSES = 3;    // repeats per arm-P rung, so each rung carries its own σ

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
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
/** Sample standard deviation (n−1). Returns 0 for fewer than two points — callers must not read that as "no noise". */
const stdev = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
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

/** Best-effort, synchronous — for `process.on('exit')`, which cannot await. */
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}
/**
 * The `reapOnExit` retrofit, on the probe that most needed it: this one now
 * replaces `server` up to eight times per run, and the Round 221 leak it guards
 * against (SIGPIPE from a closed stdout pipe, own shutdown never runs, the next
 * probe grades the survivor) gets eight chances instead of two. A getter, not a
 * child, for exactly that reason.
 */
reapOnExit(() => server);

/**
 * Stop the server AND wait until it is actually gone.
 *
 * ─── 2026-09-18, Daedalus (Round 228) — why the sync version is not enough ───
 * `killServer` sends SIGTERM and returns immediately. With one generation per
 * arm that was invisible: nothing started a server straight afterwards. The
 * moment arms L and N began looping generations, the first run died with an
 * uncaught `fetch failed / ECONNRESET` — because `startServer`'s readiness probe
 * is a GET that anything listening can satisfy, and what satisfied it was the
 * PREVIOUS generation, still winding down. `timeBrowse` then fetched against a
 * socket being torn down.
 *
 * That is the same defect this project has now found in three different
 * costumes: Round 222's bind test (no address a test binds proves who else is
 * listening), Round 227's arm-P guard (a guard on the variable that names the
 * target is not a guard on the handle that was opened), and now a readiness
 * check that cannot tell WHICH server answered. The general form: an existence
 * question asked of a shared resource does not answer an identity question.
 *
 * The fix makes the question unambiguous rather than cleverer — wait for the
 * child to exit, then wait for the port to go quiet, so the only thing that can
 * answer the next readiness probe is the process we just spawned.
 */
async function stopServerAndWait(): Promise<void> {
  killServer();
  // `waitUntilPortIsQuiet`, not a bind test: the library's own docstring records
  // that a bind succeeds while the dying server is still answering, which is
  // precisely how the previous generation gets to serve the next one's samples.
  await waitUntilPortIsQuiet(PORT);
}

async function startServer(tag: string): Promise<void> {
  // One log file per generation, opened with 'w'. The readiness check below
  // greps this file for the boot banner, and `banner in the file` is only an
  // identity signal if the file cannot hold a PREVIOUS generation's banner.
  // Appending across generations would make generation 1 ready the instant it
  // spawned, on generation 0's evidence.
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'w');
  const child = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: DB },
    stdio: ['ignore', logFd, logFd],
  });
  server = child;
  // Two sides from different places — the banner in the file THIS child was
  // handed as stdout, plus an HTTP 200. A stranger can supply the second; only
  // this child can supply the first. The bare GET this used to do is what let a
  // dying predecessor answer for its successor (Round 228).
  await waitUntilOurServerIsUp(child, logPath, PORT);
}

/**
 * Time the browse endpoint end to end: request issued → body fully read and
 * JSON-parsed. Parsing is included deliberately — the client does it before it
 * can render a single row, so it is part of what a person waits for.
 */
async function timeBrowse(n: number): Promise<{ samples: number[]; bytes: number; sessions: number; projects: number; capped: number; paths: string[] }> {
  const samples: number[] = [];
  let bytes = 0, sessions = 0, projects = 0, capped = 0;
  // Round 233: the payload's own record of WHICH files the endpoint walked. Arm Q
  // compares this against the set arm M fingerprinted; without it the two arms
  // share only numbers, and two numbers from two corpora look exactly like two
  // numbers from one.
  let paths: string[] = [];
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
    paths = all.map((s: any) => s.path).filter(Boolean);
  }
  return { samples, bytes, sessions, projects, capped, paths };
}

type BrowseRun = Awaited<ReturnType<typeof timeBrowse>>;
type ColdSeries = {
  /** The last generation's run, used for corpus-shape checks (sessions, bytes, capped). */
  last: BrowseRun;
  /** Every generation, in order. `[0]` is the discarded page-cache warmup. */
  generations: BrowseRun[];
  /** The measured cold samples — `samples[0]` of each generation after the warmup. */
  colds: number[];
  /** The warmup generation's cold sample, reported but not measured against. */
  warmupCold: number;
  /** Warm medians, pooled across the measured generations. */
  warms: number[];
};

/**
 * Run the browse arm across several fresh server generations, one cold sample
 * each. See COLD_GENERATIONS for why more than one, and why generation 0 is
 * thrown away.
 */
async function coldSeries(tag: string): Promise<ColdSeries> {
  const generations: BrowseRun[] = [];
  for (let g = 0; g < COLD_GENERATIONS; g++) {
    await startServer(`${tag}-g${g}`);
    try {
      generations.push(await timeBrowse(SAMPLES));
    } finally {
      // Awaited, not fire-and-forget — see stopServerAndWait. A generation that
      // overlaps its predecessor measures neither.
      await stopServerAndWait();
    }
  }
  const measured = generations.slice(1);
  return {
    last: generations[generations.length - 1],
    generations,
    colds: measured.map((r) => r.samples[0]),
    warmupCold: generations[0].samples[0],
    warms: measured.map((r) => median(r.samples.slice(1))),
  };
}

// `haveServer` until 2026-09-17 — the opposite of what it holds. Same inverted name as
// probe-turncount-live-http, where it produced the backwards skip copy Theseus caught in
// Round 223 §3. This probe's copy happened to be right; the name was still the hazard.
const canStartOurOwnServer = (await somethingIsAlreadyAnswering(PORT)) === null;
if (!canStartOurOwnServer) {
  console.log(`port ${PORT} is occupied — arms L, N and O cannot run (the server hardcodes 3001). Arm M still runs.\n`);
}

// ── Arm L — real HTTP browse latency at the shipped cap ──────────────────────

let LS: ColdSeries | undefined;
let L: BrowseRun | undefined;
if (!canStartOurOwnServer) {
  skip('L', 'needs a free port 3001; stop `npm run dev` and re-run');
} else {
  LS = await coldSeries('capped');
  L = LS.last;
  check('L', 'browse endpoint returns a non-empty corpus', L.sessions > 0,
    `${L.sessions} sessions across ${L.projects} projects, ${(L.bytes / 1e6).toFixed(2)} MB payload, ${L.capped} capped`);
  check('L', 'shipped-cap browse latency measured over real HTTP', true,
    `cold ${ms(mean(LS.colds))} ± ${ms(stdev(LS.colds))} over ${LS.colds.length} server generations [${LS.colds.map((s) => s.toFixed(0)).join(', ')}] (warmup generation ${ms(LS.warmupCold)}, discarded); warm median ${ms(median(LS.warms))}`,
    'measurement');
}

// ── Arm M — independent reproduction of the fingerprint-sum figures ──────────
//
// Imports the SHIPPED function and drives it over the same corpus the endpoint
// walks, at the shipped cap and uncapped. This is deliberately my own harness
// rather than a re-run of Daedalus's: the point is whether the numbers replicate
// on a second instrument, not whether his script is deterministic.

const { extractSessionFingerprint, getSessionRoots } = await import(path.join(REPO, 'packages/server/src/import/session-scanner.ts'));
// Round 234: the endpoint's SECOND corpus. `routes/import.ts:106` calls
// `scanExportedSessions(getProjectRoot())`, so the repo's exports/sessions is
// part of the population the browse walks. Resolved through the shipped
// function for the same reason arm M's session roots are — a second literal is
// how the first mismatch happened.
const { getProjectRoot } = await import(path.join(REPO, 'packages/server/src/paths.ts'));

/**
 * ─── 2026-09-18, Theseus (Round 233) — this used to be a hardcoded literal ───
 *
 * It read:
 *
 *   const projectsDir = path.join(os.homedir(), '.claude', 'projects');
 *
 * which ignores both `CLAUDE_CONFIG_DIR` and `KLATCH_EXTRA_SESSION_ROOTS`, while
 * the server honors both (session-scanner.ts:150, :184). So on any run with a
 * relocated or extended root — which is *exactly* the run the four-round-old
 * "arm O on a corpus where the cap fires" assignment needs — arms L and N timed
 * a browse of one corpus and arm M summed the fingerprints of another, and arm O
 * subtracted the second from the first.
 *
 * Driven, not reasoned (`probe-round233-…`, this fire, against the relocated
 * Round 227 cap-firing corpus):
 *
 *   shipped getSessionRoots() → …/.testdata/round227/config/projects   (8 files)
 *   arm M's literal          → /Users/xian/.claude/projects           (536 files)
 *   cold browse 207 ms − fingerprint sum 2669 ms = remainder −2462 ms
 *
 * −2462 ms is beyond-noise negative against even a deliberately generous ±267 ms
 * band, and since Round 232 that state is a hard FAIL. The first seat to attempt
 * the assignment the obvious way would have been handed a red whose plain reading
 * is "the decomposition is broken."
 *
 * Fixed by resolution, not by a second literal: arm M now walks the roots the
 * server walks, whatever they are. Arm Q asserts the outcome at the file-set
 * level, so this cannot silently come apart again if either side's resolution
 * changes.
 *
 * ─── 2026-09-19, Theseus (Round 234) — the endpoint grew a SECOND corpus ─────
 *
 * Arm Q then did exactly the job it was built for, one fire later and against my
 * own closed-world premise. Daedalus's Round 234 repair of `routes/import.ts:106`
 * made the browse walk `getSessionRoots()` **and** the repo's `exports/sessions`.
 * My Round 233 note above said the dedup "may never return one arm M did not
 * fingerprint"; the fix in the very next fire added one. Driven, before this
 * repair: `endpoint returned 9 session path(s); arm M fingerprinted 8 file(s)` —
 * the 9th is `exports/sessions/theseus-2026-03-22.jsonl`, 3.86 MB, a real
 * fingerprint cost that landed in arm O's remainder unattributed.
 *
 * So arm M resolves BOTH corpora the same way the endpoint does. Note what is
 * NOT done here: arm Q is not loosened. Daedalus offered that framing and I am
 * declining it in the same terms he did — the guard was right to fire, and an
 * arm that is widened to stop reporting a population change is not a guard.
 *
 * The export scan's filter is mirrored from `session-scanner.ts:639-650`: flat
 * directory (no project subdirectories, unlike the session roots), `.jsonl`,
 * `size >= 100`. Mirroring rather than calling is deliberate — arm M needs the
 * FILE LIST to fingerprint file by file, and `scanExportedSessions` returns
 * assembled `SessionInfo`s with the fingerprints already taken.
 */
function corpusFiles(): string[] {
  const out: string[] = [];
  for (const projectsDir of getSessionRoots() as string[]) {
    if (!fs.existsSync(projectsDir)) continue; // a typo'd extra root is skipped by the scanner too
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
  }
  out.push(...exportedCorpusFiles());
  return out;
}

/**
 * The endpoint's second corpus — `<repo root>/exports/sessions`, resolved the
 * way `routes/import.ts:106` resolves it.
 *
 * Deliberately NOT gated on `CLAUDE_CONFIG_DIR`: the shipped code isn't. A probe
 * that relocated the session root and then hid the exports from arm M would be
 * summing a corpus the server does not walk — the Round 233 defect with the sign
 * flipped. Whether the server *should* isolate this under relocation is a real
 * open question (Daedalus's Round 234 §2, parked); arm M's job is to match what
 * it does today, and arm Q will report the day that changes.
 */
/**
 * Every directory arm M resolved, in the order it walked them. Reported by arm M's
 * skip and by arm Q so a reader can see which corpora were in scope for a given
 * run — under Round 234 there is more than one, and which ones were live is the
 * first thing a mismatch makes you want to know.
 */
function corpusRoots(): string[] {
  const roots = (getSessionRoots() as string[]).map((r) => path.resolve(r));
  const exportDir = path.join(getProjectRoot() as string, 'exports', 'sessions');
  return fs.existsSync(exportDir) ? [...roots, path.resolve(exportDir)] : roots;
}

function exportedCorpusFiles(): string[] {
  const exportDir = path.join(getProjectRoot() as string, 'exports', 'sessions');
  if (!fs.existsSync(exportDir)) return [];
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(exportDir, { withFileTypes: true }); } catch { return []; }
  const out: string[] = [];
  for (const f of entries) {
    if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
    const p = path.join(exportDir, f.name);
    try { if (fs.statSync(p).size < 100) continue; } catch { continue; } // mirrors session-scanner.ts:650
    out.push(p);
  }
  return out;
}

const files = corpusFiles();
let mCapped = 0, mUncapped = 0, turnsCapped = 0, turnsUncapped = 0, cappedFiles = 0;
let mCappedSamples: number[] = [], mUncappedSamples: number[] = [];
let totalBytes = 0;

/**
 * ─── 2026-09-18, Daedalus (Round 228) — arm M needed the same repair as arm O ─
 * Arm O's discriminator compares the FINGERPRINT delta against a noise band. I
 * built that band out of the browse side's variance and left this side with a
 * single pass per cap — so the round's first run compared a quantity with a
 * measured σ against a quantity with an assumed one. Run 2 made the omission
 * concrete: on a corpus where the cap fires on 0/538 files the true fingerprint
 * delta is exactly zero (identical work at both caps, 2030 → 2030 turns), and
 * arm M reported +44 ms. All of that 44 ms was this arm's own noise, unlabelled.
 *
 * Passes ALTERNATE capped/uncapped rather than running AAA then BBB: if the
 * machine drifts during the arm — and over ~18 s of full-corpus scanning it
 * does — a blocked design puts the whole drift into the difference, which is the
 * one number the arm exists to report.
 */
const M_PASSES = 3;

if (files.length === 0) {
  // Names BOTH resolved corpora, not just the session roots. An emptiness claim
  // that doesn't say where it looked is the failure mode this fire is about.
  skip('M', `no readable corpus under any resolved root [${corpusRoots().join(', ')}]`);
} else {
  for (const f of files) { try { totalBytes += fs.statSync(f).size; } catch { /* ignore */ } }

  // Warm the page cache for both passes equally, then measure sequentially in
  // the same order the scanner uses.
  for (const f of files) { await extractSessionFingerprint(f, SHIPPED_CAP); }

  for (let p = 0; p < M_PASSES; p++) {
    let t0 = performance.now();
    let turns = 0, capped = 0;
    for (const f of files) {
      const fp = await extractSessionFingerprint(f, SHIPPED_CAP);
      turns += fp.turnCount;
      if (fp.capped) capped++;
    }
    mCappedSamples.push(performance.now() - t0);
    turnsCapped = turns; cappedFiles = capped;

    t0 = performance.now();
    turns = 0;
    for (const f of files) {
      const fp = await extractSessionFingerprint(f, Number.MAX_SAFE_INTEGER);
      turns += fp.turnCount;
    }
    mUncappedSamples.push(performance.now() - t0);
    turnsUncapped = turns;
  }
  mCapped = mean(mCappedSamples);
  mUncapped = mean(mUncappedSamples);

  const pctFiles = (100 * cappedFiles / files.length).toFixed(1);
  const pctTurns = turnsUncapped ? (100 * turnsCapped / turnsUncapped).toFixed(1) : 'n/a';
  check('M', 'fingerprint sum reproduces at both caps', true,
    `${files.length} files / ${(totalBytes / 1e6).toFixed(1)} MB over ${M_PASSES} alternating passes — cap ${SHIPPED_CAP} ${ms(mCapped)} ± ${ms(stdev(mCappedSamples))} [${mCappedSamples.map((s) => s.toFixed(0)).join(', ')}], uncapped ${ms(mUncapped)} ± ${ms(stdev(mUncappedSamples))} [${mUncappedSamples.map((s) => s.toFixed(0)).join(', ')}], delta ${delta(mUncapped - mCapped)}`,
    'measurement');
  check('M', 'cap-bites and turn-retention figures reproduce', true,
    `cap fires on ${cappedFiles}/${files.length} files (${pctFiles}%); turns ${turnsCapped} → ${turnsUncapped} (${pctTurns}% retained, +${turnsUncapped - turnsCapped} recovered)`,
    'measurement');
}

// ── Arm Q — arm M and the endpoint must have walked the SAME corpus ──────────
//
// ─── 2026-09-18, Theseus (Round 233) — arm O's unstated precondition ─────────
//
// Arm O computes `remainder = coldBrowse - mCapped`. That subtraction is only a
// decomposition if the fingerprint sum covers the files the browse paid for.
// Nothing asserted it: arm M resolved its own corpus from a literal, the
// endpoint resolved its own from `getSessionRoots()`, and by the time arm O saw
// them they were two numbers. Two numbers from two corpora look exactly like
// two numbers from one.
//
// This is the guard the Round 227 rule demands — *a guard on the variable that
// names the target is not a guard on the handle that was opened* — applied to
// the corpus rather than to the database. It compares FILE SETS, not counts:
// two different directories can hold the same number of files, and a count
// comparison would call that agreement.
//
// It admits one legitimate asymmetry and no others. `scanClaudeCodeSessions`
// de-duplicates by session id (session-scanner.ts:539), so the endpoint may
// return FEWER sessions than arm M fingerprinted. It may never return one arm M
// did not fingerprint — that is the direction that breaks arm O.
//
// ─── 2026-09-19, Theseus (Round 234) — that clause had an unstated premise ───
//
// "It may never return one arm M did not fingerprint" was a claim about the
// endpoint's BEHAVIOUR. It was actually a claim about the endpoint's CORPUS
// COUNT: true while the browse walked one corpus, false the moment it walked
// two. Daedalus's export-scan repair added the second corpus 130 lines and one
// fire away from where I wrote the clause, and this arm went red — correctly.
//
// Kept strict, and the repair went to arm M's resolution instead. The rule I
// take from it, sibling to the same-population rule this arm already encodes:
//
//   **An asymmetry clause is a closed-world claim. "The endpoint can only ever
//   return a SUBSET" silently asserts how many populations feed it, and a bug
//   fix is one of the ordinary things that changes that number.**
//
// Which is why this arm compares FILE SETS and reports the offenders by path.
// A count-based version would have read "9 vs 8" and told you nothing about
// which corpus grew.
if (!L) {
  skip('Q', 'arm L did not run, so there is no endpoint corpus to compare arm M against');
} else if (files.length === 0) {
  skip('Q', 'arm M skipped — nothing to compare');
} else {
  const fingerprinted = new Set(files.map((f) => path.resolve(f)));
  const walkedButNotSummed = L.paths.filter((p) => !fingerprinted.has(path.resolve(p)));
  const roots = corpusRoots();
  check('Q', 'arm M fingerprinted every file the browse endpoint walked',
    L.paths.length > 0 && walkedButNotSummed.length === 0,
    `endpoint returned ${L.paths.length} session path(s); arm M fingerprinted ${files.length} file(s) ` +
    `over roots [${roots.join(', ')}]; ${walkedButNotSummed.length} walked-but-not-summed` +
    (walkedButNotSummed.length
      ? ` — e.g. ${walkedButNotSummed.slice(0, 3).join(', ')}. Arm O's remainder is not a ` +
        `decomposition on this run: the two sides are different corpora.`
      : `. Arm O's inputs are the same corpus, which is the precondition its ` +
        `subtraction has always assumed and never checked.`));
}

// ── Arm N — real HTTP browse latency with the cap removed ────────────────────

let NS: ColdSeries | undefined;
let N: BrowseRun | undefined;
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
    NS = await coldSeries('uncapped');
    N = NS.last;
  } finally {
    killServer();
    if (patchApplied) {
      const ok = restoreScanner();
      check('N', 'scanner source restored byte-for-byte after the temporary patch', ok,
        ok ? `sha256 ${SCANNER_SHA.slice(0, 12)} matches` : 'RESTORE FAILED — run `git checkout packages/server/src/import/session-scanner.ts`');
    }
  }
  if (N && NS) {
    check('N', 'uncapped browse still returns the same corpus', L ? N.sessions === L.sessions : N.sessions > 0,
      `${N.sessions} sessions, ${(N.bytes / 1e6).toFixed(2)} MB payload, ${N.capped} capped (expect 0)`);
    check('N', 'uncapped browse latency measured over real HTTP', true,
      `cold ${ms(mean(NS.colds))} ± ${ms(stdev(NS.colds))} over ${NS.colds.length} server generations [${NS.colds.map((s) => s.toFixed(0)).join(', ')}] (warmup generation ${ms(NS.warmupCold)}, discarded); warm median ${ms(median(NS.warms))}`,
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

// ─── 2026-09-18, Daedalus (Round 228) — the tolerance was the wrong yardstick ─
// Theseus left this call here (Round 227 §3) and he framed it exactly right: the
// condition belongs on whether the fingerprint delta is DISTINGUISHABLE FROM
// COLD-RUN VARIANCE, not on `capped === 0`. Two things follow, and the second is
// the one that mattered.
//
// 1. `capped === 0` — my own Round 226 proposal — is the wrong VARIABLE, not
//    just a coarse one. It is a proxy for "the fingerprint delta is small", and
//    a corpus can cap a handful of files and still produce a delta under the
//    noise floor. Condition on the quantity you mean.
//
// 2. `errPct < 20` was not a tolerance at all on a corpus where the cap does not
//    bite. Rearranged, `predicted − coldN` is exactly `fingerprintDelta −
//    measuredDelta`, so with a fingerprint delta of ~0 the check reduces to
//    "cold-run noise is under 20% of a cold browse" — a statement about this
//    machine's disk, tested against a threshold picked for a different question.
//    It passed 7.3% and 0.7% and very nearly failed at 16.9% on three runs that
//    all said the same thing.
//
// So: one unit for everything. The probe now takes COLD_GENERATIONS − 1 cold
// samples per configuration, which buys a standard error; the band is
// COLD_BAND_SIGMAS × SE(difference of the two means). If the fingerprint delta
// does not clear that band, the experiment CANNOT DISCRIMINATE and the arm is
// hard-skipped — OPEN, NOT ESTABLISHED, never PASS. That is Round 224's own
// taxonomy applied without a special case: arm O's discriminating check is a
// regression check, a skip standing in for a regression check stays hard, and a
// probe that ran but established less than it set out to exits 3, not 0.
//
// Deliberately NOT done: widening the tolerance, and skipping on `capped === 0`.
// The first greens a red by loosening it, which is the most tempting wrong move
// on this arm. The second conditions on a proxy.
//
// The honest limit, stated rather than smoothed: three samples is a poor σ. It
// is poor in the SAFE direction — a noisy corpus widens the band and pushes the
// arm toward NOT ESTABLISHED rather than toward a false PASS — but it is not a
// confidence interval anyone should quote. Raise COLD_GENERATIONS if a run needs
// to defend a close call; each one costs a server spawn plus one cold browse.

if (!L || !N || !LS || !NS || files.length === 0) {
  skip('O', 'needs arms L, M and N to have run');
} else {
  // Cold, deliberately — see the note above. Warm is carried alongside so the
  // contrast stays visible in the output rather than living only in a comment.
  const coldL = mean(LS.colds);
  const coldN = mean(NS.colds);
  const warmL = median(LS.warms);
  const warmN = median(NS.warms);
  const remainder = coldL - mCapped;
  const fingerprintDelta = mUncapped - mCapped;
  const measuredDelta = coldN - coldL;

  // Pooled σ over both configurations — they are the same measurement under two
  // caps, so their run-to-run noise is one population. SE of the DIFFERENCE of
  // two means of k samples each is σ·sqrt(2/k).
  const k = Math.min(LS.colds.length, NS.colds.length);
  const sigmaBrowse = Math.sqrt((stdev(LS.colds) ** 2 + stdev(NS.colds) ** 2) / 2);
  const seBrowse = sigmaBrowse * Math.sqrt(2 / k);

  // …and the same for arm M. Arm O compares TWO deltas, each measured on its own
  // instrument; a band built from one of them is not a band for their
  // difference. See the M_PASSES note.
  const kM = Math.min(mCappedSamples.length, mUncappedSamples.length);
  const sigmaFp = Math.sqrt((stdev(mCappedSamples) ** 2 + stdev(mUncappedSamples) ** 2) / 2);
  const seFp = kM >= 2 ? sigmaFp * Math.sqrt(2 / kM) : 0;

  const se = Math.sqrt(seBrowse ** 2 + seFp ** 2);
  const band = COLD_BAND_SIGMAS * se;

  console.log('');
  check('O', 'noise floor measured on both instruments, not assumed', true,
    `browse σ ${ms(sigmaBrowse)} over ${k} generations → SE ${ms(seBrowse)}; fingerprint σ ${ms(sigmaFp)} over ${kM} passes → SE ${ms(seFp)}; combined SE(Δ−Δ) ${ms(se)}, band ±${ms(band)} at ${COLD_BAND_SIGMAS}σ`,
    'measurement');

  // ─── 2026-09-18, Daedalus (Round 228) — the hardcoded `pass: true` Theseus
  // named and did not remove. He wrote it down in Round 227: "a remainder below
  // zero is the decomposition reporting that it does not hold — printed as a
  // PASS, because that line is hardcoded pass: true." He repaired the SAMPLE the
  // line was fed and left the line's verdict alone, and run 2 of this round
  // printed `remainder −89 ms (−3%)` as a PASS on the repaired cold sample.
  //
  // ─── 2026-09-18, Daedalus (Round 232) — the hardcoded `pass: true` is now GONE.
  // Theseus's cut, from his Round 230 §3, adopted verbatim because it is better
  // than the one I had: the SIGN alone stays soft, and only a negative that
  // CLEARS the band is a hard FAIL.
  //
  // Round 228 left the line at `pass: true` and argued the band was what the
  // reader was owed. Half right. Printing the band fixed what a reader could
  // learn; it did not fix what the exit code could report, and a decomposition
  // that has been measured false still exited 0. The reason not to redden on
  // the sign is real — `remainder` is a difference between two DIFFERENT
  // instruments (an HTTP endpoint and this file's own in-process loop over the
  // same corpus), so a small negative is inside their combined noise and
  // reddening on it would be the arm-O mistake one line up — but it is an
  // argument for a band, not for a verdict that cannot go red.
  //
  // So the three states get three different fates, and only the third is hard:
  //
  //   remainder ≥ 0                    PASS   the decomposition holds
  //   negative, within the band        NOTE   indistinguishable from zero — soft,
  //                                           and no longer printed as a PASS
  //   negative, beyond the band        FAIL   measured false; the endpoint is
  //                                           faster than its own parts
  //
  // The soft states are recorded as `measurement`, so they neither redden the
  // exit nor inflate the count of checks that could have gone red.
  const remainderBand = COLD_BAND_SIGMAS * Math.sqrt(seBrowse ** 2 + (kM >= 2 ? (sigmaFp / Math.sqrt(kM)) ** 2 : 0));
  const remainderState: 'positive' | 'within-noise' | 'beyond-noise' =
    remainder >= 0 ? 'positive'
      : Math.abs(remainder) <= remainderBand ? 'within-noise'
        : 'beyond-noise';
  const remainderVerdict = remainderState === 'positive' ? 'positive'
    : remainderState === 'within-noise' ? 'negative but within the two instruments\' combined noise — indistinguishable from zero (soft: reported, does not fail the run)'
      : 'NEGATIVE BEYOND NOISE — the decomposition does not hold as stated; the endpoint is measurably faster than this file\'s own fingerprint sum over the same corpus';
  check('O', 'fingerprinting is attributed at the surface it is described at',
    remainderState === 'positive',
    `cold browse ${ms(coldL)} = fingerprint ${ms(mCapped)} (${(100 * mCapped / coldL).toFixed(0)}%) + remainder ${ms(remainder)} (${(100 * remainder / coldL).toFixed(0)}%) — ${remainderVerdict} (±${ms(remainderBand)} at ${COLD_BAND_SIGMAS}σ)`,
    remainderState === 'beyond-noise' ? 'regression' : 'measurement');

  if (Math.abs(fingerprintDelta) <= band) {
    // NOT a pass, and not a soft skip. See the note above.
    skip('O', `endpoint delta vs fingerprint delta — OPEN, NOT ESTABLISHED: the fingerprint delta ${delta(fingerprintDelta)} does not clear this corpus's cold-run noise band of ±${ms(band)}, so agreement and disagreement are indistinguishable here. Needs a corpus where the cap bites (cap fires on ${cappedFiles}/${files.length} files) or more generations (COLD_GENERATIONS=${COLD_GENERATIONS}).`);
  } else {
    const residual = Math.abs(fingerprintDelta - measuredDelta);
    check('O', 'endpoint delta matches the fingerprint delta', residual <= band,
      `cold endpoint moved ${delta(measuredDelta)} for a fingerprint delta of ${delta(fingerprintDelta)} — residual ${ms(residual)} against a ${COLD_BAND_SIGMAS}σ band of ±${ms(band)} (predicted ${ms(coldL + fingerprintDelta)} vs measured ${ms(coldN)})`);
  }

  check('O', 'relative regression at the user-facing surface', true,
    `${ms(coldL)} → ${ms(coldN)} = ${deltaPct(100 * measuredDelta / coldL)} of a cold browse (fingerprint-only framing: ${deltaPct(100 * fingerprintDelta / mCapped)} of the scan)`,
    'measurement');
  check('O', 'the warm path is inert to the cap, and is reported as its own number', true,
    `warm ${ms(warmL)} → ${ms(warmN)} = ${delta(warmN - warmL)} for a fingerprint delta of ${delta(fingerprintDelta)} — the steady state the fingerprint cache bought, not a decomposable browse`,
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
  // Rows present BEFORE this arm seeds anything, that the server's own bootstrap
  // did not create. A fresh scratch DB legitimately holds exactly one channel —
  // `default`/`general`, source `native`, written by the migration when arms L/N
  // booted the server against it. Anything else at this point is either an
  // unwiped scratch DB or a database this arm did not think it was opening.
  const baselineForeign = db.prepare(
    "SELECT id, name FROM channels WHERE NOT (id = 'default' AND source = 'native')",
  ).all() as Array<{ id: string; name: string }>;

  const rows: string[] = [];
  const rungs: Array<{ K: number; count: number; per: number[] }> = [];
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

    // LADDER_PASSES per rung so each rung carries its own σ. One pass per rung
    // is a point estimate with no noise estimate, which is what let the arm
    // report a ladder starting at 782 µs as though that were a floor.
    const per: number[] = [];
    let dt = 0;
    for (let p = 0; p < LADDER_PASSES; p++) {
      const t0 = performance.now();
      for (const id of ids) findChannelByOriginalSessionId(id);
      dt = performance.now() - t0;
      per.push((dt / ids.length) * 1000); // µs per lookup
    }
    const actual = (db.prepare('SELECT COUNT(*) c FROM channels').get() as any).c as number;
    rungs.push({ K, count: actual, per });
    rows.push(`${K} channels → ${ms(dt)} for ${ids.length} lookups (${mean(per).toFixed(0)} µs each, ±${stdev(per).toFixed(0)})`);
  }

  // Leave the scratch DB seeded — it lives under .testdata and is wiped on the
  // next run. xian's klatch.db is a different file and was never opened here.
  check('P', 'per-file dedup lookup cost scales with imported channel count', true,
    rows.join('; '), 'measurement');

  // ── The ladder assertions, added 2026-09-18 (Round 229, Theseus) ───────────
  //
  // Round 227 §5, raised to Argus and confirmed by Daedalus in Round 228 §5 as
  // "the clean case": arm P is a MEASUREMENT, so for fourteen days nothing it
  // printed could go red. The x-axis read "0 channels → 782 µs" while the table
  // actually held 2002 rows, and the only reason anyone noticed was that I
  // happened to run the probe twice and compare two runs by eye.
  //
  // The transferable form:
  //
  //   A quantity seeded along a known-ordered parameter is checkable WITHOUT
  //   knowing the right answer — the ORDER is the assertion. A ladder that
  //   starts in the wrong place is detectable even when no rung's absolute
  //   value is predictable.
  //
  // Two assertions, because the ladder can fail in two independent ways.

  // (1) The labels have to be true: the ladder must start from a table holding
  //     nothing but what the server's own bootstrap put there. This tests the
  //     DATA rather than the path, which is why it is independent of the
  //     `db.name` guard below and would have caught Round 227's no-opped
  //     KLATCH_DB assignment ON ITS FIRST RUN — on 2026-09-03 the repo
  //     klatch.db already held xian's own channels, so the rung labelled
  //     "0 channels" was false before this arm had seeded a single row.
  //
  //     ⚠ Written first as `baseline.c === 0` and that was WRONG — it asserted
  //     something false by design and went red on a healthy run. A fresh
  //     scratch DB holds exactly one channel (`default`/`general`, source
  //     `native`) because arms L/N boot a real server against it and the
  //     migration creates it. Asserting identity rather than a count keeps the
  //     check strict where it matters — a foreign row of ANY kind fails — and
  //     silent where it does not.
  check('P', 'the ladder starts from a bootstrap-only table — the x-axis labels are true',
    baselineForeign.length === 0,
    baselineForeign.length === 0
      ? `${baseline.c} baseline row(s), all server-bootstrap; rung "0 channels" means 0 imported channels`
      : `rung "0 channels" was measured against a table already holding ${baselineForeign.length} non-bootstrap row(s) ` +
        `(e.g. ${baselineForeign.slice(0, 3).map((r) => r.id).join(', ')}) — every rung label is off by that much, ` +
        `and the first rung is not a floor`);

  // (2) The order has to hold. Non-decreasing in K, each step tested against
  //     the two rungs' combined standard error rather than a percentage — a
  //     percentage here would be Round 228's mistake one arm over, since it
  //     would test noise against a threshold picked for a different question.
  const stepLines: string[] = [];
  let ordered = true;
  for (let i = 1; i < rungs.length; i++) {
    const a = rungs[i - 1], b = rungs[i];
    const se = Math.sqrt((stdev(a.per) / Math.sqrt(a.per.length)) ** 2 + (stdev(b.per) / Math.sqrt(b.per.length)) ** 2);
    const bandStep = COLD_BAND_SIGMAS * se;
    const rose = mean(b.per) - mean(a.per);
    const ok = rose >= -bandStep;
    if (!ok) ordered = false;
    stepLines.push(`${a.K}→${b.K}: ${rose >= 0 ? '+' : ''}${rose.toFixed(0)} µs (±${bandStep.toFixed(0)})${ok ? '' : ' ✗'}`);
  }
  check('P', 'per-lookup cost is non-decreasing in seeded channel count', ordered, stepLines.join('; '));

  // (3) And the ladder has to actually rise, or the arm's headline claim —
  //     "cost scales with imported channel count" — is not established by it.
  //     Same band construction, first rung against last.
  const first = rungs[0], last = rungs[rungs.length - 1];
  const seSpan = Math.sqrt((stdev(first.per) / Math.sqrt(first.per.length)) ** 2 + (stdev(last.per) / Math.sqrt(last.per.length)) ** 2);
  const bandSpan = COLD_BAND_SIGMAS * seSpan;
  const span = mean(last.per) - mean(first.per);
  check('P', 'the scan cost is distinguishable from noise across the ladder', span > bandSpan,
    `${first.K}→${last.K} channels: ${mean(first.per).toFixed(0)} → ${mean(last.per).toFixed(0)} µs, rise ${span.toFixed(0)} µs vs band ±${bandSpan.toFixed(0)}`);

  // NOT CLAIMED: the rungs are measured in seeding order and cannot be
  // alternated the way Round 228's arm M alternates its capped/uncapped passes,
  // because seeding is cumulative — there is no way back down the ladder. So
  // machine drift across the ~seconds of the sweep is inside these steps and is
  // not controlled for. The σ above is WITHIN-rung, not between-rung. It is
  // sufficient for the order assertion (drift would have to exceed a 20× signal
  // to invert it) and it is NOT a confidence interval for any single rung.

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
