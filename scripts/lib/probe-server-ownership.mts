/**
 * Probe server ownership — one place for "is this port mine?"
 *
 * ## Why this exists
 *
 * Theseus, Round 221 (`docs/mail/theseus-to-daedalus-…-a-probe-of-mine-graded-a-strangers-process-2026-09-16.md`):
 * a probe reported `22/22` on a run where its own server never started and every arm was
 * answered by a leaked server from an earlier run. The pre-flight that let it through was
 *
 * ```ts
 * net.createServer().listen(3001, '127.0.0.1')   // "is the port free?"
 * ```
 *
 * Node sets `SO_REUSEADDR`, and BSD/macOS permits a specific-address bind alongside a wildcard
 * one, so that bind succeeds while a wildcard server is answering on the same port. The guard
 * was named for "is anyone answering here?" and tested "can I bind here?" — a different
 * property. Reproduced independently in this worktree, 2026-09-16 (Round 222):
 *
 * ```
 * stub listening on {"address":"::","family":"IPv6","port":3001}
 * OLD portIsFree(3001) -> true
 * ```
 *
 * That exact function was copy-pasted into 20 further probes under `scripts/`. This module is
 * the single implementation they now share.
 *
 * ## A bind test cannot be repaired by binding somewhere better
 *
 * The obvious fix is to bind the address the real server binds. Measured instead of assumed,
 * 2026-09-16, this machine (`.testdata/.../bind-matrix.mts`, Round 222):
 *
 * ```
 * occupant                     bind 127.0.0.1    bind wildcard    bind 0.0.0.0
 * :: (what the real server does)   BOUND ✗        REFUSED          REFUSED
 * 0.0.0.0                          BOUND ✗        BOUND ✗          REFUSED
 * 127.0.0.1                        REFUSED        BOUND ✗          BOUND ✗
 * ```
 *
 * **Every column has a miss.** There is no address to bind that detects all three occupants,
 * because `SO_REUSEADDR` makes "can I bind" a question about *overlap*, not about occupancy.
 * The shipped guard's column misses the one that matters most: a real Klatch server, which
 * binds `::`.
 *
 * ## So ask the question directly: does a connection succeed?
 *
 * A TCP connect to `127.0.0.1:<port>` reaches whichever socket claims that address — the
 * dual-stack `::` listener, the `0.0.0.0` listener, and the loopback-only listener alike. One
 * test, no misses in the matrix above, and it does not care whether the occupant ever answers.
 *
 * {@link somethingIsAlreadyAnswering} therefore decides on the connect, keeps a **wildcard**
 * bind as an independent second side (it asks the exact question `packages/server` will ask a
 * moment later, and it catches a socket bound but not listening), and uses HTTP only to
 * *describe* what it found. Two sides that came from different places — the rule Round 220
 * adopted after finding `count(EMPTY) === count(EMPTY)` in its own output, applied one layer
 * below the checks, where every check downstream inherits the answer.
 *
 * ## What a probe should call
 *
 * - {@link somethingIsAlreadyAnswering} — before spawning anything (exit 2 on occupied).
 * - {@link waitUntilPortIsQuiet} — between a SIGTERM and the next spawn, instead of waiting
 *   for a bind to succeed.
 * - {@link reapOnExit} — so a truncated run (a closed pipe, SIGPIPE) does not leak the child
 *   that becomes the next run's stranger.
 * - {@link waitUntilOurServerIsUp} — readiness that reads *this child's own log* for its
 *   banner before believing an HTTP 200. An HTTP-only readiness loop cannot tell its own
 *   server from a stranger's, and the `child.exitCode !== null` check in those loops does not
 *   save it: a stranger answers on the first poll, ~1–2 s before a crashing `npx tsx` child
 *   has a exit code to read.
 */

import net from 'net';
import fs from 'fs';
import type { ChildProcess } from 'child_process';

/** Every Klatch server mounts this; probes disagree about `BASE`, so derive it from the port. */
export function channelsUrl(port: number): string {
  return `http://127.0.0.1:${port}/api/channels`;
}

/**
 * "does a connection succeed here?" — the primary test. Reaches any listener on the port
 * regardless of the address it bound; see the matrix in the module comment for why that is
 * the property a bind test cannot supply.
 */
export function portAcceptsAConnection(port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' });
    const done = (answer: boolean) => { sock.destroy(); resolve(answer); };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
  });
}

/**
 * "can `packages/server` bind here?" — the independent second side. Binds the **wildcard**,
 * which is what `serve({ fetch, port })` does, so this asks the child's own question. Kept
 * for the case a connect cannot see: a socket bound but not listening.
 */
export function aWildcardBindWouldSucceed(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port);
  });
}

/** "is anyone answering here?" — used to describe an occupant, never to decide there isn't one. */
export async function portAnswersHttp(port: number, timeoutMs = 3000): Promise<string | null> {
  try {
    const res = await fetch(channelsUrl(port), { signal: AbortSignal.timeout(timeoutMs) });
    return `HTTP ${res.status}`;
  } catch {
    return null;
  }
}

/**
 * Is anything at all on this port? Returns a human-readable reason, or `null` for genuinely
 * clear. The name is Theseus's, kept so his Round 221 repair and this hoist say the same
 * thing; the decision is the connect, not the HTTP round trip.
 */
export async function somethingIsAlreadyAnswering(port: number, timeoutMs = 1500): Promise<string | null> {
  if (await portAcceptsAConnection(port, timeoutMs)) {
    const answered = await portAnswersHttp(port, timeoutMs);
    return answered !== null
      ? `something answers HTTP on ${port} (${answered})`
      : `something accepts connections on ${port} without answering HTTP`;
  }
  if (!(await aWildcardBindWouldSucceed(port))) {
    return `${port} refuses a wildcard bind though nothing accepts a connection — the server will not start`;
  }
  return null;
}

/**
 * Pre-flight. Exits 2 rather than throwing: a probe that cannot own its server has not failed
 * a check, it has not run, and those must not look alike in the output.
 */
export async function requireAnUnoccupiedPort(port: number, probeName: string): Promise<void> {
  const occupant = await somethingIsAlreadyAnswering(port);
  if (occupant === null) return;
  console.error(
    `${probeName}: ${occupant} — this probe must own the server it grades, and a bind test alone ` +
    `will not tell you this (scripts/lib/probe-server-ownership.mts). Stop \`npm run dev\` or the ` +
    `leaked probe server and re-run.`);
  process.exit(2);
}

/**
 * Between a SIGTERM and the next spawn. The old `waitForPortFree` returned as soon as a bind
 * succeeded, which — per the finding above — it does while the dying server is still answering.
 * In a restart-based probe that means the next arm can measure the previous arm's process:
 * a "cache-cold" number taken against a warm server, with nothing in the output to show it.
 */
export async function waitUntilPortIsQuiet(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = 'never checked';
  while (Date.now() < deadline) {
    const occupant = await somethingIsAlreadyAnswering(port, 1000);
    if (occupant === null) return;
    last = occupant;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`port ${port} still occupied ${timeoutMs / 1000} s after SIGTERM — ${last}`);
}

/**
 * Reap the child on every exit path, not just the happy one. The Round 221 leak happened
 * because a probe's stdout was piped to `head`, the pipe closed, node took SIGPIPE, and the
 * probe's own `shutdown()` never ran — leaving the server that the next probe then graded.
 *
 * Takes a getter, not a child: restart-based probes replace `server` several times per run.
 */
export function reapOnExit(getChild: () => ChildProcess | undefined): void {
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE'] as const) {
    process.on(sig, () => {
      const c = getChild();
      if (c && c.exitCode === null) c.kill('SIGKILL');
      process.exit(130);
    });
  }
  process.on('exit', () => {
    const c = getChild();
    if (c && c.exitCode === null) c.kill('SIGKILL');
  });
}

/**
 * Readiness with two sides from different places: the banner in the file THIS child was handed
 * as stdout, and an HTTP 200 from the port. A stranger can supply the second; only this child
 * can supply the first.
 *
 * Measured 2026-09-16 (Round 222): with a wildcard occupant on 3001, a real `packages/server`
 * child dies `EADDRINUSE` with `exitCode 1`, 1169 bytes of log, and **no banner** — so the
 * banner is exactly absent when the bind failed. Note the scratch DB *is* created before
 * `serve()` is reached, so "the scratch DB was never written" is a timing observation, not
 * evidence about the bind.
 */
export async function waitUntilOurServerIsUp(
  child: ChildProcess,
  logPath: string,
  port: number,
  timeoutMs = 90_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '(no log)';
      throw new Error(`server exited early (code ${child.exitCode}) — see ${logPath}\n${log}`);
    }
    let booted = false;
    try { booted = fs.readFileSync(logPath, 'utf8').includes('Klatch server running'); } catch { /* not yet */ }
    if (booted) {
      try { if ((await fetch(channelsUrl(port), { headers: { connection: 'close' } })).ok) return; } catch { /* not yet */ }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '(no log)';
  throw new Error(`server did not come up on ${port} in ${timeoutMs / 1000} s — see ${logPath}\n${log}`);
}
