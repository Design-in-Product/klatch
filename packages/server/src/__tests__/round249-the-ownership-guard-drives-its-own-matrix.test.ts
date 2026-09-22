/**
 * Round 249 — `scripts/lib/probe-server-ownership.mts` under `npm test`.
 *
 * My own Round 247 §7 named this module as the next pick: it is one of the five `scripts/lib`
 * modules the Round 245 coverage floor reports as uncovered, and it owns **exit 2** — the one
 * code in the probe contract that `probe-outcome.mts`'s tests do not reach, because exit 2 is
 * not an outcome, it is the refusal to produce one.
 *
 * ## What already existed, stated before adding to it
 *
 * The Round 245 rule applied to myself: "X has no coverage" is a claim about a denominator, and
 * the denominator here is not zero. `probe-round222-…` and Theseus's Round 230/231 rounds drove
 * this module's behaviour by hand, and every probe that calls `requireAnUnoccupiedPort` exercises
 * the happy path on every run. What nothing in the repo asserts is any of the following.
 *
 * ## 1 — The matrix in the module comment is a measurement nothing re-takes
 *
 * The comment carries a bind matrix measured once, 2026-09-16, into a `.testdata` scratch file
 * that no longer exists. Every downstream claim rests on it: *"every column has a miss, so ask
 * the question directly."* It has never been re-taken since, on any machine, and it is the whole
 * reason `portAcceptsAConnection` is the decider. `describe('the matrix')` below re-takes it
 * against live occupants on all three addresses, so the claim is checked by the suite rather
 * than carried by a comment — Theseus's Round 248 §4 rule (a hardcoded total becomes a thing
 * people edit to match) applied to a hardcoded *matrix*.
 *
 * ## 2 — Exit 2 had no assertion anywhere
 *
 * `requireAnUnoccupiedPort` is the module's only caller-visible refusal, and `process.exit(2)` is
 * unobservable from inside the process that calls it — the return type is `Promise<void>` but the
 * occupied branch never returns. Driven **two-sided in a real subprocess** here: occupant present
 * → exit 2 with the occupant named on stderr; port clear → exit 0 having returned.
 *
 * ## 3 — The readiness function's stated defect had no test for the half it rejects
 *
 * `waitUntilOurServerIsUp` exists because *"an HTTP-only readiness loop cannot tell its own server
 * from a stranger's."* The arm that matters is therefore the negative one: a real HTTP 200 from a
 * stranger, with no banner in this child's log, must NOT satisfy readiness. Nothing asserted that.
 *
 * ## 4 — `reapOnExit`'s `exit` handler is driven, not reasoned about
 *
 * Round 230 established that `exit` listeners do run on a closed pipe. That is a claim about node,
 * and this module's remedy depends on it. Driven two-sided in subprocesses: with the handler
 * registered the child is gone after the parent exits; without it, the child survives (and this
 * file reaps it with `process.kill`, counted out before the suite ends).
 *
 * ## Ports
 *
 * Never 3001. Every port here is an ephemeral one this file allocates and releases, so a
 * concurrent `npm run dev` or another agent's probe server cannot make this suite red or be
 * graded by it. Zero model calls, no DB, no read of `~/.claude`.
 */

import { describe, it, expect, afterAll } from 'vitest';
import net from 'net';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import type { ChildProcess } from 'child_process';
import {
  channelsUrl,
  portAcceptsAConnection,
  aWildcardBindWouldSucceed,
  portAnswersHttp,
  somethingIsAlreadyAnswering,
  waitUntilPortIsQuiet,
  waitUntilOurServerIsUp,
} from '../../../../scripts/lib/probe-server-ownership.mts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const LIB = path.join(REPO, 'scripts/lib/probe-server-ownership.mts');
const TSX = path.join(REPO, 'node_modules/.bin/tsx');

/** Ports handed out here are ephemeral, never 3001 — see the header. */
function anEphemeralPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const port = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(port));
    });
  });
}

/** Sockets a raw occupant has accepted, so `close` can end them; see the note on `close`. */
const accepted = new WeakMap<net.Server, Set<net.Socket>>();

/** A raw TCP listener that accepts and never speaks — an occupant that answers no HTTP. */
function occupyRaw(port: number, host?: string): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    const live = new Set<net.Socket>();
    const s = net.createServer((sock) => {
      // Accept, say nothing. Remember it: a silent socket is what makes close() hang.
      live.add(sock);
      sock.once('close', () => live.delete(sock));
    });
    accepted.set(s, live);
    s.once('error', reject);
    if (host === undefined) s.listen(port, () => resolve(s));
    else s.listen(port, host, () => resolve(s));
  });
}

/**
 * `closeAllConnections()` first, and it is not tidiness — it is the first thing this file's own
 * drive found. `net.Server.close()` resolves only when every accepted socket has ended, and an
 * aborted `fetch` against a socket that never answered leaves exactly such a socket behind. The
 * first version of this file called `close()` alone: `portAnswersHttp` was correctly bounded
 * (measured: 313 ms for a 300 ms budget) and the *teardown* hung forever, which read as a hang in
 * the subject. The guard's own lesson — "I stopped it" is an assertion about a handle, not about
 * a connection — landing in the harness written to test the guard.
 *
 * `closeAllConnections()` is an `http.Server` method and does **not** exist on `net.Server`;
 * assuming the symmetry was this file's second red. The raw occupants therefore track the
 * sockets they accept, and this ends them by hand.
 */
function close(s: net.Server | http.Server): Promise<void> {
  return new Promise((resolve) => {
    if ('closeAllConnections' in s) s.closeAllConnections();
    for (const sock of accepted.get(s as net.Server) ?? []) sock.destroy();
    s.close(() => resolve());
  });
}

const strays: Array<net.Server | http.Server> = [];
const strayPids: number[] = [];

afterAll(async () => {
  for (const s of strays) await close(s).catch(() => undefined);
  for (const pid of strayPids) { try { process.kill(pid, 'SIGTERM'); } catch { /* already gone */ } }
});

// ── 1 · the matrix, re-taken against live occupants ──────────────────────────

/** `true` means the bind SUCCEEDED, i.e. the bind test would call the occupied port free. */
function aBindWouldSucceed(port: number, host?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    if (host === undefined) s.listen(port);
    else s.listen(port, host);
  });
}

describe('the bind matrix the module decided on is re-taken here, not quoted', () => {
  // `::` is what a real Klatch server binds — the occupant the shipped guard used to miss.
  it('reproduces all nine cells, and every bind column still has a miss', async () => {
    const OCCUPANTS = ['::', '0.0.0.0', '127.0.0.1'] as const;
    const BINDS = ['127.0.0.1', undefined /* wildcard */, '0.0.0.0'] as const;

    // [occupant] -> { connect, binds: [loopback, wildcard, 0.0.0.0] }
    const matrix: Record<string, { connect: boolean; binds: boolean[] }> = {};

    for (const host of OCCUPANTS) {
      const port = await anEphemeralPort();
      const occupant = await occupyRaw(port, host);
      strays.push(occupant);
      const connect = await portAcceptsAConnection(port, 1000);
      const binds: boolean[] = [];
      for (const b of BINDS) binds.push(await aBindWouldSucceed(port, b));
      // The module's own second side is the wildcard column; assert they agree.
      expect(await aWildcardBindWouldSucceed(port)).toBe(binds[1]);
      matrix[host] = { connect, binds };
      await close(occupant);
      strays.pop();
    }

    // The table in the module comment, re-measured. `true` = bound anyway = a miss.
    //   occupant       bind 127.0.0.1   bind wildcard   bind 0.0.0.0
    //   ::             BOUND ✗          REFUSED         REFUSED
    //   0.0.0.0        BOUND ✗          BOUND ✗         REFUSED
    //   127.0.0.1      REFUSED          BOUND ✗         BOUND ✗
    expect(matrix['::'].binds).toEqual([true, false, false]);
    expect(matrix['0.0.0.0'].binds).toEqual([true, true, false]);
    expect(matrix['127.0.0.1'].binds).toEqual([false, true, true]);

    // The claim the whole module rests on, stated as a property rather than a table: there is
    // no address you can bind that detects all three occupants.
    for (let col = 0; col < BINDS.length; col++) {
      const misses = OCCUPANTS.filter((h) => matrix[h].binds[col]);
      expect(misses.length).toBeGreaterThan(0);
    }

    // And the primary test has no misses at all: every occupant is detected by a connect.
    expect(OCCUPANTS.map((h) => matrix[h].connect)).toEqual([true, true, true]);
  }, 30_000);

  it('a genuinely clear port reads clear on both sides', async () => {
    const port = await anEphemeralPort();
    expect(await portAcceptsAConnection(port, 1000)).toBe(false);
    expect(await aWildcardBindWouldSucceed(port)).toBe(true);
    expect(await somethingIsAlreadyAnswering(port, 1000)).toBeNull();
  });
});

// ── 2 · somethingIsAlreadyAnswering distinguishes its three outcomes ─────────

describe('somethingIsAlreadyAnswering names what it found', () => {
  it('reports an HTTP answer as an HTTP answer', async () => {
    const port = await anEphemeralPort();
    const server = http.createServer((_req, res) => { res.writeHead(200); res.end('[]'); });
    strays.push(server);
    await new Promise<void>((r) => server.listen(port, '127.0.0.1', () => r()));

    const occupant = await somethingIsAlreadyAnswering(port, 1000);
    expect(occupant).toContain(`something answers HTTP on ${port}`);
    expect(occupant).toContain('HTTP 200');

    await close(server);
    strays.pop();
  });

  it('reports a silent occupant as accepting connections without answering HTTP', async () => {
    const port = await anEphemeralPort();
    const occupant = await occupyRaw(port, '127.0.0.1');
    strays.push(occupant);

    const found = await somethingIsAlreadyAnswering(port, 300);
    expect(found).toBe(`something accepts connections on ${port} without answering HTTP`);

    await close(occupant);
    strays.pop();
  });

  it('describes an occupant with HTTP but never decides absence on it', async () => {
    // portAnswersHttp is the describing half: null on a port with nothing there, and never
    // consulted before the connect has already said something is present.
    const port = await anEphemeralPort();
    expect(await portAnswersHttp(port, 500)).toBeNull();
    expect(channelsUrl(port)).toBe(`http://127.0.0.1:${port}/api/channels`);
  });
});

// ── 3 · exit 2, driven two-sided in a real subprocess ────────────────────────

function driveRequire(port: number): { status: number; stdout: string; stderr: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round249-'));
  const driver = path.join(dir, 'require-an-unoccupied-port.mts');
  fs.writeFileSync(driver, [
    `import { requireAnUnoccupiedPort } from ${JSON.stringify(LIB)};`,
    `await requireAnUnoccupiedPort(${port}, 'round249-driver');`,
    `console.log('RETURNED');`,
  ].join('\n'));
  try {
    const stdout = execFileSync(TSX, [driver], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? -1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('requireAnUnoccupiedPort — the exit code, not the return value', () => {
  it('exits 2 and names the occupant when the port is taken', async () => {
    const port = await anEphemeralPort();
    const occupant = await occupyRaw(port, '127.0.0.1');
    strays.push(occupant);

    const run = driveRequire(port);

    expect(run.status).toBe(2);
    expect(run.stdout).not.toContain('RETURNED');
    expect(run.stderr).toContain('round249-driver:');
    expect(run.stderr).toContain(String(port));
    // The message has to send the operator somewhere, and it must say why a bind test would lie.
    expect(run.stderr).toContain('scripts/lib/probe-server-ownership.mts');
    expect(run.stderr).toContain('a bind test alone');

    await close(occupant);
    strays.pop();
  }, 60_000);

  it('returns and exits 0 when the port is clear — the other side of the same drive', async () => {
    const port = await anEphemeralPort();
    const run = driveRequire(port);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('RETURNED');
  }, 60_000);
});

// ── 4 · waitUntilPortIsQuiet waits for quiet, not for a bind ─────────────────

describe('waitUntilPortIsQuiet', () => {
  it('returns once the occupant actually goes away', async () => {
    const port = await anEphemeralPort();
    const occupant = await occupyRaw(port, '127.0.0.1');
    strays.push(occupant);
    setTimeout(() => { void close(occupant); }, 300);

    await expect(waitUntilPortIsQuiet(port, 10_000)).resolves.toBeUndefined();
    strays.pop();
  }, 20_000);

  it('throws with the last occupant it saw when the port never clears', async () => {
    const port = await anEphemeralPort();
    const occupant = await occupyRaw(port, '127.0.0.1');
    strays.push(occupant);

    await expect(waitUntilPortIsQuiet(port, 1200)).rejects.toThrow(
      new RegExp(`port ${port} still occupied .* — something accepts connections`),
    );

    await close(occupant);
    strays.pop();
  }, 20_000);
});

// ── 5 · readiness must reject a stranger's 200 ───────────────────────────────

const notExited = { exitCode: null } as unknown as ChildProcess;

describe('waitUntilOurServerIsUp — the stranger arm is the one that matters', () => {
  it('is satisfied by this child\'s banner plus a 200', async () => {
    const port = await anEphemeralPort();
    const server = http.createServer((_req, res) => { res.writeHead(200); res.end('[]'); });
    strays.push(server);
    await new Promise<void>((r) => server.listen(port, '127.0.0.1', () => r()));

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round249-log-'));
    const logPath = path.join(dir, 'server.log');
    fs.writeFileSync(logPath, 'Klatch server running on http://localhost:' + port + '\n');

    await expect(waitUntilOurServerIsUp(notExited, logPath, port, 8000)).resolves.toBeUndefined();

    fs.rmSync(dir, { recursive: true, force: true });
    await close(server);
    strays.pop();
  }, 20_000);

  it('is NOT satisfied by a real 200 with no banner in this child\'s log', async () => {
    const port = await anEphemeralPort();
    const stranger = http.createServer((_req, res) => { res.writeHead(200); res.end('[]'); });
    strays.push(stranger);
    await new Promise<void>((r) => stranger.listen(port, '127.0.0.1', () => r()));

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round249-log-'));
    const logPath = path.join(dir, 'server.log');
    // What a crashed child leaves behind: a log, real content, no banner. Round 222 measured
    // 1169 bytes and no banner from an EADDRINUSE death.
    fs.writeFileSync(logPath, 'Error: listen EADDRINUSE: address already in use :::' + port + '\n');

    await expect(waitUntilOurServerIsUp(notExited, logPath, port, 1500)).rejects.toThrow(
      /server did not come up on \d+ in/,
    );

    fs.rmSync(dir, { recursive: true, force: true });
    await close(stranger);
    strays.pop();
  }, 20_000);

  it('fails fast with the log when the child has already exited', async () => {
    const port = await anEphemeralPort();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round249-log-'));
    const logPath = path.join(dir, 'server.log');
    fs.writeFileSync(logPath, 'EADDRINUSE and nothing else\n');
    const exited = { exitCode: 1 } as unknown as ChildProcess;

    await expect(waitUntilOurServerIsUp(exited, logPath, port, 30_000)).rejects.toThrow(
      /server exited early \(code 1\)[\s\S]*EADDRINUSE and nothing else/,
    );

    fs.rmSync(dir, { recursive: true, force: true });
  });
});

// ── 6 · reapOnExit, driven two-sided ─────────────────────────────────────────

/**
 * The driver spawns a *direct* node child holding the port — not through `npx`. The shim problem
 * the module comment records is real and is Theseus's Round 231 finding; it is a property of the
 * launcher, not of `reapOnExit`, and mixing the two into one arm would make a red here
 * unattributable.
 */
function driveReap(port: number, register: boolean): { status: number; stdout: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round249-reap-'));
  const driver = path.join(dir, 'reap.mts');
  fs.writeFileSync(driver, [
    `import { spawn } from 'child_process';`,
    `import { reapOnExit } from ${JSON.stringify(LIB)};`,
    `const child = spawn(process.execPath, ['-e', "require('net').createServer().listen(${port}, '127.0.0.1', () => console.log('UP'))"], { stdio: ['ignore','pipe','ignore'] });`,
    register ? `reapOnExit(() => child);` : `// deliberately not registered — the other side`,
    `await new Promise((r) => child.stdout.once('data', r));`,
    `console.log('CHILD_PID ' + child.pid);`,
    `process.exit(0);`,
  ].join('\n'));
  try {
    const stdout = execFileSync(TSX, [driver], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return { status: 0, stdout };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    return { status: err.status ?? -1, stdout: err.stdout ?? '' };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function pidFrom(stdout: string): number {
  const m = stdout.match(/CHILD_PID (\d+)/);
  if (!m) throw new Error(`driver printed no pid:\n${stdout}`);
  return Number(m[1]);
}

describe('reapOnExit', () => {
  it('leaves the port quiet after the parent exits', async () => {
    const port = await anEphemeralPort();
    const run = driveReap(port, true);
    expect(run.status).toBe(0);
    const pid = pidFrom(run.stdout);
    strayPids.push(pid);

    await waitUntilPortIsQuiet(port, 10_000);
    expect(await portAcceptsAConnection(port, 500)).toBe(false);
  }, 60_000);

  it('without it, the child outlives the parent — the defect the module exists to prevent', async () => {
    const port = await anEphemeralPort();
    const run = driveReap(port, false);
    expect(run.status).toBe(0);
    const pid = pidFrom(run.stdout);
    strayPids.push(pid);

    // The parent is gone (execFileSync returned) and the port is still answering.
    expect(await portAcceptsAConnection(port, 1000)).toBe(true);

    process.kill(pid, 'SIGTERM');
    await waitUntilPortIsQuiet(port, 10_000);
  }, 60_000);
});
