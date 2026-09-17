/**
 * Round 222 — the pre-flight that graded a stranger was in 21 more probes, and no bind test
 * can be the guard at all.
 *
 * ## Where this comes from
 *
 * Theseus, Round 221: `probe-round217` reported `22/22` on a run where its own server never
 * started and every arm was answered by a server leaked from an earlier run. The pre-flight
 * asked "can I bind here?" as a proxy for "is anyone answering here?", and on BSD/macOS those
 * are different questions. He repaired his two probes and named that the same function was in
 * ~20 more.
 *
 * This probe is the hoist and its control. `scripts/lib/probe-server-ownership.mts` is now the
 * single implementation: 21 probes migrated to it, 0 still define `portIsFree`, and this
 * control is the 22nd importer. What is driven here:
 *
 *   A  his finding, reproduced independently — a wildcard occupant answers while the bind test
 *      reports the port free
 *   B  the bind matrix, driven — three occupants × three bind addresses, every column with a
 *      miss, so the guard cannot be repaired by binding somewhere better. Plus the blind spot
 *      a request-only replacement leaves: an occupant that accepts TCP and never answers.
 *   C  the release path — `waitForPortFree` between restarts had the same defect, and there the
 *      harm is a "cache-cold" measurement taken against the previous arm's warm server
 *   D  the discriminator: why 13 of the 21 probes were exposed and 8 were not. A readiness loop
 *      that reads only HTTP cannot tell its own child from a stranger; one that first reads the
 *      banner out of the file THIS child was handed as stdout can.
 *   E  a migrated probe, driven: refuses to start against an occupant, and grades nothing
 *   F  hygiene, and one measurement about `npx` and SIGTERM
 *
 * Zero model calls. Writes only under `.testdata/round222-port-ownership/`. `packages/` is
 * asserted unchanged at exit, and the servers it spawns are asserted to have written to the DB
 * they were handed rather than falling back to `db/index.ts`'s repo-root default.
 *
 * Run: `npx tsx scripts/probe-round222-port-ownership-hoist.mts`  (needs port 3001 unoccupied)
 */

import fs from 'fs';
import net from 'net';
import http from 'http';
import path from 'path';
import { spawn, execFileSync } from 'child_process';
import {
  portAcceptsAConnection,
  portAnswersHttp,
  somethingIsAlreadyAnswering,
  waitUntilPortIsQuiet,
  waitUntilOurServerIsUp,
  channelsUrl,
} from './lib/probe-server-ownership.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round222-port-ownership');
const PORT = 3001;
const REAL_DB = path.join(REPO, 'klatch.db');

interface Result { arm: string; check: string; pass: boolean; detail: string; kind: 'check' | 'measurement' }
const results: Result[] = [];
function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass, detail, kind: 'check' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, detail, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}

function packagesDiff(): string {
  return execFileSync('git', ['diff', '--stat', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}
const diffBefore = packagesDiff();
const realDbMtimeBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB).mtimeMs : null;

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// Everything this probe spawns or listens with, reaped at exit no matter how we leave.
const openServers: Array<{ close(): void }> = [];
const spawned: Array<{ pid?: number; exitCode: number | null; kill(s?: NodeJS.Signals): void }> = [];
function reapEverything() {
  for (const s of openServers) { try { s.close(); } catch { /* already closed */ } }
  for (const c of spawned) { try { if (c.exitCode === null) c.kill('SIGKILL'); } catch { /* gone */ } }
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE'] as const) {
  process.on(sig, () => { reapEverything(); process.exit(130); });
}
process.on('exit', reapEverything);

/** The guard as it was shipped in 21 files, kept here verbatim so the control has both sides. */
async function OLD_portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

// ── Pre-flight, using the thing under test ───────────────────────────────────

{
  const occupant = await somethingIsAlreadyAnswering(PORT);
  if (occupant !== null) {
    console.error(`round222: ${occupant} — this control needs to own ${PORT}. Stop the dev server and re-run.`);
    process.exit(2);
  }
}

// ── Arm A — a wildcard occupant that answers, and the bind test that misses it ──

{
  const stub = http.createServer((_q, s) => { s.writeHead(200, { 'content-type': 'application/json' }); s.end('[]'); });
  openServers.push(stub);
  await new Promise<void>((r) => stub.listen(PORT, () => r()));
  const addr = stub.address();
  measure('A', 'stub occupant', `listening on ${typeof addr === 'object' && addr ? `${addr.address}:${addr.port}` : String(addr)} (wildcard)`);

  const oldSaysFree = await OLD_portIsFree(PORT);
  const answered = await portAnswersHttp(PORT);
  check('A', 'the OLD bind test reports the port FREE while a server answers on it',
    oldSaysFree === true && answered !== null,
    `OLD_portIsFree=${oldSaysFree} · ${channelsUrl(PORT)} -> ${answered ?? 'no answer'}`);

  const combined = await somethingIsAlreadyAnswering(PORT);
  check('A', 'the shared guard reports it occupied, and names which side found it',
    combined !== null && combined.includes('answers HTTP'), combined ?? '(reported clear)');

  stub.closeAllConnections();
  await new Promise<void>((r) => stub.close(() => r()));
  openServers.pop();
}

// ── Arm B — the bind matrix, and the side a request-only guard misses ────────
//
// Theseus's repair replaced the bind test with an HTTP round trip. That is strictly better for
// the case he hit, and it has a blind spot of its own: a process that accepts the connection
// and never writes a response is invisible to `fetch`. The first instinct — keep the bind test
// as a second side — was measured here and does not work either. Hence the connect.

{
  // The full matrix, driven: three occupants × three bind addresses. Every bind column has a
  // miss, so no choice of address repairs the shipped guard.
  const misses: string[] = [];
  for (const [oname, oaddr] of [['::', undefined], ['0.0.0.0', '0.0.0.0'], ['127.0.0.1', '127.0.0.1']] as const) {
    // `net.Server` has no `closeAllConnections` (that is `http.Server`), and `close()` waits on
    // live sockets — so hold them and destroy them by hand, or the arm hangs on its own probe.
    const held: net.Socket[] = [];
    const occ = net.createServer((sock) => { held.push(sock); /* accept, never answer */ });
    await new Promise<void>((r) => (oaddr === undefined ? occ.listen(PORT, () => r()) : occ.listen(PORT, oaddr, () => r())));
    const row: string[] = [];
    for (const [tname, taddr] of [['127.0.0.1', '127.0.0.1'], ['wildcard', undefined], ['0.0.0.0', '0.0.0.0']] as const) {
      const bound = await new Promise<boolean>((resolve) => {
        const s = net.createServer();
        s.once('error', () => resolve(false));
        s.once('listening', () => s.close(() => resolve(true)));
        if (taddr === undefined) s.listen(PORT); else s.listen(PORT, taddr);
      });
      if (bound) { row.push(`bind ${tname} MISSES it`); misses.push(`${oname}/${tname}`); }
    }
    const connected = await portAcceptsAConnection(PORT);
    measure('B', `occupant on ${oname}`, `${row.length === 0 ? 'every bind test refused' : row.join(', ')} · connect -> ${connected}`);
    check('B', `a connect finds the occupant on ${oname}`, connected, `portAcceptsAConnection -> ${connected}`);
    for (const s of held) s.destroy();
    await new Promise<void>((r) => occ.close(() => r()));
  }
  check('B', 'no bind address detects all three occupants — the guard is unrepairable as a bind',
    misses.length > 0, `${misses.length} miss(es): ${misses.join(', ')}`);

  // And the silent occupant specifically, against the guard a request-only repair would leave.
  const silentHeld: net.Socket[] = [];
  const silent = net.createServer((sock) => { silentHeld.push(sock); /* accept, never answer */ });
  openServers.push(silent);
  await new Promise<void>((r) => silent.listen(PORT, () => r()));
  const answered = await portAnswersHttp(PORT, 1500);
  check('B', 'a request-only guard reads this occupied port as FREE',
    answered === null, `portAnswersHttp -> ${answered ?? 'no answer (reads as free)'}`);
  const combined = await somethingIsAlreadyAnswering(PORT, 1500);
  check('B', 'the shared guard reports it occupied anyway — it decides on the connect',
    combined !== null && combined.includes('without answering HTTP'), combined ?? '(reported clear)');
  for (const s of silentHeld) s.destroy();
  await new Promise<void>((r) => silent.close(() => r()));
  openServers.pop();
}

// ── Arm C — the release path, which Round 221 did not cover ──────────────────
//
// 8 of the 20 probes restart the server between arms and waited for the port with the same bind
// test. `startServer` then measures whatever answers. In `probe-browse-cold-figure-gap` that is
// an arm labelled "cache-cold browse" run against the previous arm's warm process.
//
// Staged against BOTH a `::` and a `0.0.0.0` occupant, and the second is the one that earns its
// keep. A first draft of this arm used only `::`, where a wildcard bind is refused — so it could
// not tell the real repair from a wildcard-bind version of the old mistake, and a mutation that
// substituted the latter survived it. Round 220 found that a control that mocks a constant is
// only as strong as the value it mocks it to; the same is true one layer out. **A control that
// stages an occupant is only as strong as the address it stages it on.**

for (const [oname, oaddr] of [['::', undefined], ['0.0.0.0', '0.0.0.0']] as const) {
  const stub = http.createServer((_q, s) => { s.writeHead(200); s.end('[]'); });
  openServers.push(stub);
  await new Promise<void>((r) => (oaddr === undefined ? stub.listen(PORT, () => r()) : stub.listen(PORT, oaddr, () => r())));

  const t0 = Date.now();
  const oldWaitReturned = await OLD_portIsFree(PORT);
  const oldMs = Date.now() - t0;
  check('C', `the OLD wait-for-release returns immediately while a ${oname} server still answers`,
    oldWaitReturned === true && oldMs < 500, `bind succeeded in ${oldMs} ms with a server answering`);

  const t1 = Date.now();
  let quietThrew = false;
  try { await waitUntilPortIsQuiet(PORT, 2000); } catch { quietThrew = true; }
  const newMs = Date.now() - t1;
  check('C', `waitUntilPortIsQuiet refuses to call a ${oname} occupant released`,
    quietThrew && newMs >= 2000,
    quietThrew ? `waited ${newMs} ms and threw rather than returning`
               : `RETURNED after ${newMs} ms — it called an answering server released`);

  stub.closeAllConnections();
  await new Promise<void>((r) => stub.close(() => r()));
  openServers.pop();
  const t2 = Date.now();
  await waitUntilPortIsQuiet(PORT, 10_000);
  check('C', `and it returns promptly once the ${oname} occupant really is gone`, true, `${Date.now() - t2} ms after close`);
}

// ── Arm D — why 13 probes were exposed and 8 were not ────────────────────────

{
  const stub = http.createServer((_q, s) => { s.writeHead(200, { 'content-type': 'application/json' }); s.end('[]'); });
  openServers.push(stub);
  await new Promise<void>((r) => stub.listen(PORT, () => r()));

  const logPath = path.join(SCRATCH, 'child-vs-stranger.log');
  const db = path.join(SCRATCH, 'scratch.db');
  const fd = fs.openSync(logPath, 'a');
  const child = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: db },
    stdio: ['ignore', fd, fd],
  });
  spawned.push(child);

  // BOTH readiness loops start now, from the same instant, on the same live child. A first
  // draft ran the two-sided one only after waiting for the child to exit — where it refuses on
  // the exit code and the banner side is never consulted at all, so a mutation that deleted the
  // banner check survived. The banner is only load-bearing while the child is still alive.
  const t0 = Date.now();

  // The loop shipped in the 13 exposed probes: HTTP only, with an exitCode check that races it.
  const httpOnly = (async () => {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) return { up: false, ms: Date.now() - t0 };
      try { if ((await fetch(channelsUrl(PORT))).ok) return { up: true, ms: Date.now() - t0 }; } catch { /* not yet */ }
      await new Promise((r) => setTimeout(r, 250));
    }
    return { up: false, ms: Date.now() - t0 };
  })();

  const twoSided = waitUntilOurServerIsUp(child, logPath, PORT, 20_000)
    .then(() => ({ accepted: true, ms: Date.now() - t0, why: 'it accepted the stranger too' }))
    .catch((e: Error) => ({ accepted: false, ms: Date.now() - t0, why: String(e.message).split('\n')[0] }));

  const [httpResult, twoResult] = await Promise.all([httpOnly, twoSided]);

  check('D', 'the HTTP-only readiness loop declares the server up — against the stranger',
    httpResult.up, `said "up" after ${httpResult.ms} ms, while child.exitCode was still null`);

  check('D', 'the two-sided readiness refuses the same server, from the same instant',
    !twoResult.accepted, `${twoResult.why} (after ${twoResult.ms} ms)`);

  check('D', 'and it refused while the HTTP 200 was available to it — the banner is what stopped it',
    !twoResult.accepted && httpResult.up && httpResult.ms < twoResult.ms,
    `HTTP 200 at ${httpResult.ms} ms · refusal at ${twoResult.ms} ms`);

  const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
  measure('D', "this child's own fate", `exitCode=${child.exitCode} · log ${Buffer.byteLength(log)} bytes · EADDRINUSE=${log.includes('EADDRINUSE')}`);

  check('D', 'the banner is absent exactly when the bind failed',
    !log.includes('Klatch server running') && log.includes('EADDRINUSE'),
    `banner=${log.includes('Klatch server running')} · EADDRINUSE=${log.includes('EADDRINUSE')}`);

  // The scratch DB is opened before `serve()` is reached, so its presence says nothing about
  // whether the bind succeeded. Recorded because "the scratch DB was never created" was read
  // as evidence about the bind in Round 221, and it is a timing observation.
  measure('D', 'scratch DB after a failed bind', `${path.basename(db)} exists=${fs.existsSync(db)} — opened before serve(), so it is not evidence about the bind`);

  stub.closeAllConnections();
  await new Promise<void>((r) => stub.close(() => r()));
  openServers.pop();
}

// ── Arm E — a migrated probe, driven ─────────────────────────────────────────

{
  const stub = http.createServer((_q, s) => { s.writeHead(200, { 'content-type': 'application/json' }); s.end('[]'); });
  openServers.push(stub);
  await new Promise<void>((r) => stub.listen(PORT, () => r()));

  const target = 'scripts/probe-round213-reassign-live-http.mts';
  let out = '', code: number | null = null;
  try {
    out = execFileSync('npx', ['tsx', target], { cwd: REPO, encoding: 'utf8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe'] });
    code = 0;
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    code = err.status ?? null;
    out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
  check('E', `${path.basename(target)} refuses to start against an occupied port`,
    code === 2, `exit code ${code}`);
  const graded = out.split('\n').filter((l) => /^(PASS|FAIL|OPEN|NOTE) \[/.test(l));
  check('E', 'it graded nothing — the absence of a verdict line is the thing that matters',
    graded.length === 0, `${graded.length} verdict line(s) in ${out.split('\n').length} lines of output`);
  measure('E', 'what it said instead', out.trim().split('\n').slice(-1)[0]?.slice(0, 160) ?? '(no output)');

  stub.closeAllConnections();
  await new Promise<void>((r) => stub.close(() => r()));
  openServers.pop();
}

// ── Arm F — hygiene, and one measurement about npx ───────────────────────────

{
  // Every probe's shutdown does `child.kill('SIGTERM')` on an `npx tsx` child. Whether that
  // frees the port depends on npx forwarding the signal to the node grandchild — measured
  // here rather than assumed, because if it does not, every probe's shutdown is leaky.
  const logPath = path.join(SCRATCH, 'sigterm.log');
  const fd = fs.openSync(logPath, 'a');
  const child = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: path.join(SCRATCH, 'sigterm.db') },
    stdio: ['ignore', fd, fd],
  });
  spawned.push(child);
  await waitUntilOurServerIsUp(child, logPath, PORT, 60_000);
  measure('F', 'a server this probe really owns', `banner + HTTP 200, pid ${child.pid}`);

  const t0 = Date.now();
  child.kill('SIGTERM');
  let freed = false;
  try { await waitUntilPortIsQuiet(PORT, 15_000); freed = true; } catch { /* still held */ }
  check('F', "SIGTERM to the `npx tsx` child does free the port (it forwards to the grandchild)",
    freed, freed ? `quiet ${Date.now() - t0} ms after SIGTERM` : `still occupied 15 s after SIGTERM — every probe's shutdown leaks`);

  const finalOccupant = await somethingIsAlreadyAnswering(PORT, 1500);
  check('F', 'this control left nothing on the port', finalOccupant === null, finalOccupant ?? 'port is quiet');

  check('F', '`packages/` is unchanged by this run', packagesDiff() === diffBefore,
    packagesDiff() === diffBefore ? 'git diff --stat identical before and after' : `CHANGED:\n${packagesDiff()}`);

  // The first version of this check was `mtime unchanged`, which passed by reporting "no
  // klatch.db at repo root" — true of a run that had done anything at all, and therefore not a
  // check. `db/index.ts:24` defaults to `<monorepo root>/klatch.db` when `KLATCH_DB` is unset,
  // and this worktree has no such file, so the property worth establishing is the positive one:
  // the server wrote where we sent it, and nothing defaulted.
  const sigtermDb = path.join(SCRATCH, 'sigterm.db');
  measure('F', 'the default DB path', `${REAL_DB} exists=${fs.existsSync(REAL_DB)} (before this run: ${realDbMtimeBefore !== null})`);
  const wroteWhereSent = fs.existsSync(sigtermDb) && fs.statSync(sigtermDb).size > 0;
  const defaultUntouched = realDbMtimeBefore === null
    ? !fs.existsSync(REAL_DB)
    : fs.existsSync(REAL_DB) && fs.statSync(REAL_DB).mtimeMs === realDbMtimeBefore;
  check('F', 'the owned server wrote to the DB we handed it, and nothing fell back to the default',
    wroteWhereSent && defaultUntouched,
    `${path.basename(sigtermDb)} ${wroteWhereSent ? `${fs.statSync(sigtermDb).size} bytes` : 'MISSING'} · ` +
    `default path ${defaultUntouched ? 'in the same state as before the run' : 'CHANGED'}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────

const checks = results.filter((r) => r.kind === 'check');
const passed = checks.filter((r) => r.pass).length;
console.log(`\n${passed}/${checks.length} checks passed · ${results.length - checks.length} measurements`);
const failed = checks.filter((r) => !r.pass);
if (failed.length > 0) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
process.exit(failed.length === 0 ? 0 : 1);
