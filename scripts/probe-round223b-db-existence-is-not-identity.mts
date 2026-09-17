/**
 * Round 223b — "the scratch DB exists, so the server that answered is mine" is not an identity
 * check, and the fact that retires it is one Daedalus already established for a different reason.
 *
 * ## The two halves nobody had put together
 *
 * Round 221 (mine). After the Round 217 stranger incident I added a second side to
 * `probe-round219`'s readiness, at `probe-round219-files-cap-live-http.mts:204`:
 *
 * ```ts
 * // Readiness says "something answered", not "my server answered". […] it runs migrations at
 * // boot — so the file existing at all is evidence produced by the process under test.
 * if (!fs.existsSync(DB)) { … await shutdown(3); }
 * ```
 *
 * Round 222 §3 (Daedalus), correcting a different claim of mine:
 *
 * > *"The DB is not evidence: `db/index.ts` opens it before `index.ts:35` reaches `serve()`, so on
 * > a failed bind it is created anyway — measured, `scratch.db exists=true` after `EADDRINUSE`."*
 *
 * He wrote that to correct my account of *why the Round 217 evidence pointed where it did*. It is
 * also, unremarked by either of us, the exact defeater for the guard I had written the same day.
 * A child that loses the bind still creates the DB. So on a run where a stranger answers readiness
 * and this probe's own child dies `EADDRINUSE`, `fs.existsSync(DB)` is satisfied **by the corpse**.
 *
 * ## What this probe establishes, and what it refuses to conclude
 *
 * The question is a race, so it is measured rather than argued: with a stranger on the port and a
 * real `packages/server` child spawned against it, does the scratch DB exist at the moment an
 * HTTP-only readiness loop first declares the server up?
 *
 * - If **yes**, the check is defeated outright.
 * - If **no**, the check survives this run *by timing it does not control* — which is not a
 *   property, and is the same "a check that races is not a guard" that Round 222 §3 found in the
 *   `child.exitCode !== null` lines.
 *
 * Either answer retires it in favour of the banner, so the probe reports the number rather than
 * hanging a verdict on which way the race fell on one machine on one afternoon.
 *
 * ## Round 225 — arm A was repaired, and the memo's §7 table was wrong
 *
 * The 13/13 published in the Round 223 memo was taken *before* the fold that this probe argued
 * for landed, in the same commit. Argus re-ran this file unmodified and got 11/13 · 2 failed, and
 * was right. Arm A had been written as "the defect is still here", which goes red the moment the
 * defect is fixed — so it is now "the repair is still here", and reads comment-stripped source,
 * because its one surviving green check was matching a citation in prose rather than a call.
 *
 * Arms B and C — the race itself, which is what this file is for — were unaffected and reproduce
 * on Argus's runs as well as mine. See `scripts/probe-round225-a-citation-is-not-a-call.mts`.
 *
 * Run: `npx tsx scripts/probe-round223b-db-existence-is-not-identity.mts`  (needs 3001 free)
 */

import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execFileSync, type ChildProcess } from 'child_process';
import {
  portAcceptsAConnection, channelsUrl, waitUntilOurServerIsUp, waitUntilPortIsQuiet, reapOnExit,
} from './lib/probe-server-ownership.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const PORT = 3001;
const SCRATCH = path.join(REPO, '.testdata', 'round223b');
const DB = path.join(SCRATCH, 'scratch.db');
const LOG = path.join(SCRATCH, 'server.log');

type Result = { arm: string; check: string; pass: boolean; detail: string; kind: 'check' | 'measurement' };
const results: Result[] = [];
function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass, detail, kind: 'check' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, detail, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}

function packagesDirty(): string {
  return execFileSync('git', ['status', '--porcelain', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}
const packagesBefore = packagesDirty();

/**
 * Read back from the scratch DB rather than asserted. The child that created this file lost its
 * bind, so it can never have served a request — but "it can never have" is the reasoning that
 * produced two vacuous checks in this repo already, so the row count is read.
 */
function messageRows(): number {
  if (!fs.existsSync(DB)) return 0;
  const out = execFileSync('npx', ['tsx', '-e',
    `import Database from 'better-sqlite3';` +
    `const d = new Database(${JSON.stringify(DB)}, { readonly: true });` +
    `try { console.log(d.prepare('select count(*) c from messages').get().c); } catch { console.log('NOTABLE'); }`,
  ], { cwd: path.join(REPO, 'packages/server'), encoding: 'utf8' }).trim();
  return out === 'NOTABLE' ? 0 : Number(out.split('\n').pop());
}

// ── Arm A — the repair this probe argued for is still in place ───────────────
//
// ROUND 225 REPAIR. This arm was written the other way round: it asserted that the *defect* was
// still present in `probe-round219`, as a precondition for measuring it. The fold that removed
// the defect landed in the same commit as this file, so Argus — re-running it unmodified on
// 2026-09-17 — got 11/13 where my §7 table published 13/13. His diagnosis was exactly right.
//
// Two things follow, and the second is the one worth keeping.
//
// 1. A precondition of the form "the defect is still here" **dies of its own success**. It goes
//    red the moment the thing it exists to justify gets fixed, and it goes red at whoever fixed
//    it. Inverted — "the repair is still here" — it is a regression check: green until someone
//    puts the defect back, which is the only occasion anyone wants to hear from it.
//
// 2. Of arm A's three checks, two went red honestly and **one stayed green off a comment**.
//    `probe-round219:162` is prose *recording that the DB check was removed*; the unanchored
//    regex matched the citation and reported the call as present. A citation is not a call, so
//    the source is stripped of comments before any of this is decided. Round 225 drives both.

const R219 = path.join(REPO, 'scripts', 'probe-round219-files-cap-live-http.mts');
const r219src = fs.readFileSync(R219, 'utf8');
/** Comments blanked, line numbers preserved — so a mention in prose cannot satisfy a check. */
const r219code = r219src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '));
const r219lines = r219code.split('\n');
const readyLine = r219lines.findIndex((l) => /await waitUntilOurServerIsUp\(/.test(l));

check('A', 'probe-round219 no longer identifies its own server by the scratch DB existing',
  !/if\s*\(!fs\.existsSync\(DB\)\)/.test(r219code),
  'no `if (!fs.existsSync(DB))` call site in comment-stripped source ' +
  `(it still appears in prose at :${r219src.split('\n').findIndex((l) => /if\s*\(!fs\.existsSync\(DB\)\)/.test(l)) + 1}, which is why this reads code only)`);
check('A', 'its readiness now has the banner side a stranger cannot supply',
  readyLine >= 0, readyLine >= 0
    ? `waitUntilOurServerIsUp at probe-round219:${readyLine + 1}`
    : 'not found — the fold was reverted, and arms B/C below are why that is wrong');
check('A', 'and the local HTTP-only readiness is gone, folded onto the shared module',
  !/somethingIsAlreadyAnswering/.test(r219code) && /probe-server-ownership/.test(r219code),
  'no local somethingIsAlreadyAnswering call; imports lib/probe-server-ownership');

// ── The stranger ─────────────────────────────────────────────────────────────

if (await portAcceptsAConnection(PORT, 1000)) {
  console.error('probe-round223b: something already holds 3001. This probe must stage its own occupant. Stop it and re-run.');
  process.exit(2);
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

let strangerRequests = 0;
const stranger = http.createServer((_req, res) => {
  strangerRequests += 1;
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('[]');
});
await new Promise<void>((resolve, reject) => {
  stranger.once('error', reject);
  stranger.listen(PORT, () => resolve()); // wildcard — `::`, what packages/server binds
});
const addr = stranger.address();
measure('B', 'stranger staged', `${typeof addr === 'string' ? addr : addr?.address} on ${PORT}, answering every path with 200 []`);

let child: ChildProcess | undefined;
reapOnExit(() => child);
process.on('exit', () => { try { stranger.close(); } catch { /* already */ } });

// ── Arm B — spawn a real child into the occupied port and time everything ────

const logFd = fs.openSync(LOG, 'a');
const t0 = Date.now();
child = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(REPO, 'packages/server'),
  env: { ...process.env, KLATCH_DB: DB, KLATCH_FILES_DIR: path.join(SCRATCH, 'files') },
  stdio: ['ignore', logFd, logFd],
});

let tHttpReady: number | null = null;   // an HTTP-only loop's "the server is up"
let dbAtHttpReady: boolean | null = null; // the Round 221 identity check, evaluated at that instant
let tDbCreated: number | null = null;
let tBanner: number | null = null;
let tExit: number | null = null;

// One polling loop, so every observation is taken from the same clock and the same run rather
// than from three separate attempts that could each have landed differently.
const deadline = Date.now() + 40_000;
while (Date.now() < deadline) {
  const now = Date.now();
  if (tDbCreated === null && fs.existsSync(DB)) tDbCreated = now - t0;
  if (tBanner === null) {
    try { if (fs.readFileSync(LOG, 'utf8').includes('Klatch server running')) tBanner = now - t0; } catch { /* not yet */ }
  }
  if (tExit === null && child.exitCode !== null) tExit = now - t0;
  if (tHttpReady === null) {
    let ok = false;
    try { ok = (await fetch(channelsUrl(PORT), { headers: { connection: 'close' } })).ok; } catch { /* not yet */ }
    if (ok) {
      tHttpReady = Date.now() - t0;
      // Evaluated here, at the instant the HTTP-only loop would have broken out — not afterwards,
      // which is the timing mistake Round 222 §5 found in its own arm D.
      dbAtHttpReady = fs.existsSync(DB);
    }
  }
  if (tExit !== null && tHttpReady !== null && tDbCreated !== null) break;
  await new Promise((r) => setTimeout(r, 20));
}

const log = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8') : '';
check('B', 'the child lost the bind, as designed',
  /EADDRINUSE/.test(log) && child.exitCode !== null && child.exitCode !== 0,
  `exitCode=${child.exitCode} · EADDRINUSE=${/EADDRINUSE/.test(log)} · log ${log.length} bytes`);
check('B', 'and never printed its banner',
  tBanner === null, tBanner === null ? 'no "Klatch server running" in this child\'s own log' : `banner at +${tBanner} ms — the stranger cannot have written this, re-read`);
check('B', 'Daedalus\'s §3 reproduces from this seat: the scratch DB is created despite the failed bind',
  tDbCreated !== null && fs.existsSync(DB),
  tDbCreated !== null ? `${path.basename(DB)} appeared at +${tDbCreated} ms, ${fs.statSync(DB).size} bytes, after a bind that failed` : 'DB never appeared — his correction does NOT reproduce here');
check('B', 'an HTTP-only readiness loop declares this server up',
  tHttpReady !== null, tHttpReady !== null ? `"up" at +${tHttpReady} ms — answered by the stranger, ${strangerRequests} requests served` : 'never declared up');

measure('B', 'the race, in one run',
  `HTTP says up at +${tHttpReady ?? -1} ms · scratch DB exists at +${tDbCreated ?? -1} ms · ` +
  `child exit code readable at +${tExit ?? -1} ms · banner ${tBanner === null ? 'never' : `+${tBanner} ms`}`);

// ── Arm C — the verdict on the Round 221 identity check ──────────────────────

const defeated = dbAtHttpReady === true;
measure('C', 'THE NUMBER — was the scratch DB there when HTTP said "up"?',
  defeated
    ? `YES — fs.existsSync(DB) was TRUE at +${tHttpReady} ms. The Round 221 identity check would have ` +
      `passed this run and the probe would have graded the stranger.`
    : `NO — fs.existsSync(DB) was FALSE at +${tHttpReady} ms (the DB arrived at +${tDbCreated} ms, ` +
      `${(tDbCreated ?? 0) - (tHttpReady ?? 0)} ms later). The check survives this run — by ${(tDbCreated ?? 0) - (tHttpReady ?? 0)} ms ` +
      `of a race it does not control, on one machine, once.`);

check('C', 'either way the check is decided by a race rather than by evidence',
  dbAtHttpReady !== null,
  `dbAtHttpReady=${dbAtHttpReady} · the two events are ${Math.abs((tDbCreated ?? 0) - (tHttpReady ?? 0))} ms apart, ` +
  `and nothing in probe-round219 orders them`);

check('C', 'the banner side is not a race — it is absent exactly when the bind failed',
  tBanner === null && /EADDRINUSE/.test(log),
  'no banner on a run where the DB exists, the port answers 200, and this child is dead');

let twoSidedRefused = false;
let twoSidedSaid = '';
try {
  await waitUntilOurServerIsUp(child, LOG, PORT, 3_000);
  twoSidedSaid = 'returned — it believed the stranger';
} catch (e) {
  twoSidedRefused = true;
  twoSidedSaid = String((e as Error).message).split('\n')[0];
}
check('C', 'waitUntilOurServerIsUp refuses the same server the HTTP-only loop accepted',
  twoSidedRefused, twoSidedSaid);

// ── Hygiene ──────────────────────────────────────────────────────────────────

if (child.exitCode === null) child.kill('SIGKILL');
stranger.close();
await waitUntilPortIsQuiet(PORT, 10_000);
check('Z', 'nothing left holding 3001', !(await portAcceptsAConnection(PORT, 800)), 'connect refused after teardown');
check('Z', 'packages/ is where this probe found it',
  packagesDirty() === packagesBefore,
  packagesDirty() === packagesBefore ? 'git status --porcelain -- packages/ unchanged' : `CHANGED: ${packagesDirty().slice(0, 160)}`);
check('Z', 'no message row was ever created — every request in this run went to the stub',
  messageRows() === 0, `${messageRows()} rows in messages in the scratch DB`);

const checks = results.filter((r) => r.kind === 'check');
const failed = checks.filter((r) => !r.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} checks · ${results.length - checks.length} measurements · ${failed.length} failed`);
if (failed.length) for (const f of failed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
process.exit(failed.length ? 1 : 0);
