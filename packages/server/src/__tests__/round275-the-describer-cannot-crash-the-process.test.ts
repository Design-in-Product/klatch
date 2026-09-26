/**
 * Round 275 — `portAnswersHttp` on `fetch` could kill the process it was describing from, and
 * report "nothing is answering" about a port answering 200 at the same time.
 *
 * Provenance. Theseus's Round 274 §3: `npm test` went RED one run in three on the commit that
 * shipped Round 273, printing `137 · 2149 · 1` — the *exact* green figures — plus one line,
 * `Errors 1 error`, and `npm error code 1`. The error:
 *
 *     Uncaught Exception: setTypeOfService EINVAL
 *       ❯ Socket.setTypeOfService node:net:829:13
 *       ❯ writeH1 node:internal/deps/undici/undici:7973:16
 *
 * vitest attributed it to `round249-the-ownership-guard-drives-its-own-matrix.test.ts`. Theseus
 * could not establish a mechanism: 120/120 direct `portAnswersHttp` calls against raw occupants
 * came back caught and `null`, and the `round249` file alone ran 15/15 clean.
 *
 * It did not reproduce here either — 6/6 green server runs this fire. So the mechanism below is
 * established by CONSTRUCTION, not by a sighting: force the syscall to fail and show that the
 * observed signature follows, exactly, and that our own contract does not survive it.
 *
 * What is actually wrong, in three measured parts:
 *
 *  1. Node's bundled undici calls `socket.setTypeOfService(request.typeOfService)` in `writeH1`
 *     with no guard (`internal/deps/undici/undici:7972–7974`; `typeOfService ?? 0` at :2876, so
 *     it is called on the first write of EVERY H1 socket, ours included).
 *  2. `net.Socket.prototype.setTypeOfService` THROWS on any non-zero libuv return off Windows.
 *     Measured returns on this machine (darwin, node v26.5.0): connected IPv4 `0`, connected
 *     IPv6 `0`, pre-connect handle **EBADF**, pipe/AF_UNIX — method absent, skipped. Which state
 *     yields Theseus's EINVAL is NOT established here and is named as open.
 *  3. The throw is not on our stack. It escapes as an `uncaughtException`, so `portAnswersHttp`'s
 *     `try/catch` never sees it — and the `await` does not reject with the cause either. It
 *     hangs to the abort budget and returns **`null`**.
 *
 * (3) is the part worth the file. A guard whose describing half answers "nothing is answering"
 * about a live server, while the process dies down a separate channel, has two wrong outputs in
 * two places that no single reader is looking at. Under vitest that is precisely `Errors 1 error`
 * beside untouched green counts.
 *
 * The repair is to stop using undici for it: `http.request` never touches the option.
 *
 * Ports: ephemeral only, never 3001. Every server staged here is closed in-process.
 */
import { describe, it, expect, afterAll } from 'vitest';
import net from 'net';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  portAnswersHttp, somethingIsAlreadyAnswering, channelsUrl, waitUntilOurServerIsUp,
} from '../../../../scripts/lib/probe-server-ownership.mts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const LIB = path.join(REPO, 'scripts/lib/probe-server-ownership.mts');
const TSX = path.join(REPO, 'node_modules/.bin/tsx');

const strays: Array<net.Server | http.Server> = [];
const live = new Map<net.Server | http.Server, Set<net.Socket>>();

afterAll(async () => {
  for (const s of strays) {
    await new Promise<void>((r) => {
      for (const sock of live.get(s) ?? []) sock.destroy();
      s.close(() => r());
    }).catch(() => undefined);
  }
});

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

/** An HTTP server that answers 200 on the path the module actually asks for. */
async function anAnsweringServer(): Promise<{ port: number; server: http.Server }> {
  const port = await anEphemeralPort();
  const server = http.createServer((_req, res) => { res.writeHead(200); res.end('[]'); });
  strays.push(server);
  await new Promise<void>((r) => server.listen(port, '127.0.0.1', () => r()));
  return { port, server };
}

/** Accepts and never speaks — the occupant the timeout budget exists for. */
async function aSilentOccupant(): Promise<number> {
  const port = await anEphemeralPort();
  const socks = new Set<net.Socket>();
  const s = net.createServer((sock) => { socks.add(sock); sock.once('close', () => socks.delete(sock)); });
  live.set(s, socks);
  strays.push(s);
  await new Promise<void>((r) => s.listen(port, '127.0.0.1', () => r()));
  return port;
}

// ── 1 · the class, driven in a subprocess against both implementations ───────

/**
 * Runs one describer implementation in a fresh node process with `setTypeOfService` forced to
 * fail the way node fails it, and reports what the caller saw AND whether the process survived.
 *
 * `which: 'shipped'` imports the real module, so this arm reddens if the repair is reverted.
 * `which: 'fetch'` inlines the pre-Round-275 body — the defect has to stay executable somewhere
 * or the test asserts only that today is fine, which is the drift class this project keeps
 * finding. It is a reference copy in a fixture, never on the import path.
 */
function driveWithABrokenSyscall(which: 'shipped' | 'fetch'): {
  status: number | null; stdout: string; stderr: string;
} {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round275-'));
  const body = which === 'shipped'
    ? `import { portAnswersHttp } from ${JSON.stringify(LIB)};`
    : `const portAnswersHttp = async (port: number, timeoutMs: number) => {
         try {
           const res = await fetch('http://127.0.0.1:' + port + '/api/channels',
             { signal: AbortSignal.timeout(timeoutMs) });
           return 'HTTP ' + res.status;
         } catch { return null; }
       };`;
  const driver = path.join(dir, 'describe-a-port.mts');
  fs.writeFileSync(driver, [
    `import net from 'net';`,
    `import http from 'http';`,
    // Exactly node's own failure: a throw out of the wrapper, off any stack we await.
    `net.Socket.prototype.setTypeOfService = function () {`,
    `  const e: any = new Error('setTypeOfService EINVAL');`,
    `  e.code = 'EINVAL'; e.errno = -22; e.syscall = 'setTypeOfService';`,
    `  throw e;`,
    `};`,
    // Does NOT exit here. vitest does not kill the worker on an uncaught exception either — it
    // records one and finishes the file, which is the whole reason the counts stayed green. An
    // exiting handler would also hide the second half of the defect, since the `await` below
    // never returns its (wrong) value if the process is already gone.
    `let sawUncaught: string | null = null;`,
    `process.on('uncaughtException', (e: any) => {`,
    `  sawUncaught = e.syscall + ' ' + e.code;`,
    `  console.log('UNCAUGHT ' + sawUncaught);`,
    `  process.exitCode = 7;`,
    `});`,
    // The subject server lives HERE, inside the driver. It cannot live in the test process: the
    // test process is blocked in `spawnSync` for this whole call, so its event loop cannot accept
    // or answer, and every arm read `null` for a reason that had nothing to do with the subject.
    // (That was this file's own first red — an occupant staged behind a blocked event loop.)
    `const server = http.createServer((_q, r) => { r.writeHead(200); r.end('[]'); });`,
    `const port: number = await new Promise((r) =>`,
    `  server.listen(0, '127.0.0.1', () => r((server.address() as any).port)));`,
    body,
    `const answer = await portAnswersHttp(port, 1000);`,
    `console.log('ANSWER ' + String(answer));`,
    // A beat, so an uncaught exception that is merely LATE still lands before we call it survived.
    `await new Promise((r) => setTimeout(r, 500));`,
    `if (sawUncaught === null) console.log('SURVIVED');`,
    `server.close();`,
  ].join('\n'));
  const r = spawnSync(TSX, [driver], { encoding: 'utf8', cwd: REPO, timeout: 30_000 });
  fs.rmSync(dir, { recursive: true, force: true });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

describe('a failing setTypeOfService is an uncaught exception, not a rejected fetch', () => {
  it('the OLD fetch body answers `null` about a live server AND raises an uncaught exception', () => {
    const r = driveWithABrokenSyscall('fetch');

    // Both halves of the defect, asserted separately because they are separate failures and a
    // reader who sees only one of them draws the wrong conclusion about the other.
    expect(r.stdout).toContain('UNCAUGHT setTypeOfService EINVAL');
    expect(r.stdout).toContain('ANSWER null');          // ← about a server answering 200
    expect(r.stdout).not.toContain('SURVIVED');
    expect(r.status).toBe(7);
  }, 40_000);

  it('the shipped body answers HTTP 200 through the same broken syscall and survives', () => {
    const r = driveWithABrokenSyscall('shipped');

    expect(r.stdout).toContain('ANSWER HTTP 200');
    expect(r.stdout).toContain('SURVIVED');
    expect(r.stdout).not.toContain('UNCAUGHT');
    expect(r.status).toBe(0);
  }, 40_000);
});

// ── 2 · the contract the repair had to preserve ──────────────────────────────

describe('portAnswersHttp still gives the same three answers', () => {
  it('names a live answer by its status', async () => {
    const { port } = await anAnsweringServer();
    expect(await portAnswersHttp(port, 1000)).toBe('HTTP 200');
  });

  it('says null for an occupant that accepts and never speaks, within its budget', async () => {
    const port = await aSilentOccupant();
    const started = Date.now();
    expect(await portAnswersHttp(port, 400)).toBeNull();
    // Bounded is the whole point of the budget; Round 249 found the unbounded version by hanging.
    expect(Date.now() - started).toBeLessThan(3000);
  }, 15_000);

  it('says null for a port with nothing on it, and asks the address the module names', async () => {
    const port = await anEphemeralPort();
    expect(await portAnswersHttp(port, 500)).toBeNull();
    expect(channelsUrl(port)).toBe(`http://127.0.0.1:${port}/api/channels`);
  });

  it('the decision above it is unchanged — an HTTP answer is still reported as one', async () => {
    const { port } = await anAnsweringServer();
    const found = await somethingIsAlreadyAnswering(port, 1000);
    expect(found).toContain(`something answers HTTP on ${port}`);
    expect(found).toContain('HTTP 200');
  }, 15_000);
});

// ── 3 · the second caller, which is the one that actually ran the write path ─

/**
 * `waitUntilOurServerIsUp` had its own `fetch`, polling every 250 ms for up to 90 s while a
 * server booted — far more first-writes than the describer ever made, and the same unreachable
 * `catch`. It now shares `portAnswersHttp`. Driven here rather than left to a live probe,
 * because a live probe needs port 3001 and 3001 is held by the dev server on this machine.
 */
describe('waitUntilOurServerIsUp still resolves on a banner plus a 200', () => {
  it('returns once both sides agree, and does not reach undici to do it', async () => {
    const { port } = await anAnsweringServer();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round275-log-'));
    const logPath = path.join(dir, 'server.log');
    fs.writeFileSync(logPath, 'Klatch server running\n');
    // A child that is alive as far as the function can tell: `exitCode === null` is the only
    // thing it reads off the handle, so a bare stand-in is honest here rather than a mock of
    // something richer than the function uses.
    const child = { exitCode: null } as unknown as import('child_process').ChildProcess;

    await expect(waitUntilOurServerIsUp(child, logPath, port, 8_000)).resolves.toBeUndefined();
    fs.rmSync(dir, { recursive: true, force: true });
  }, 20_000);

  it('still fails loudly when the banner is there but nothing answers', async () => {
    const port = await anEphemeralPort();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round275-log2-'));
    const logPath = path.join(dir, 'server.log');
    fs.writeFileSync(logPath, 'Klatch server running\n');
    const child = { exitCode: null } as unknown as import('child_process').ChildProcess;

    await expect(waitUntilOurServerIsUp(child, logPath, port, 1_200))
      .rejects.toThrow(/did not come up on/);
    fs.rmSync(dir, { recursive: true, force: true });
  }, 20_000);
});

// ── 4 · the property that made the repair available at all ───────────────────

describe('the repair is not a wrapper around the same call', () => {
  it('the module no longer reaches undici for the describing half', () => {
    const src = fs.readFileSync(LIB, 'utf8');
    // Narrow on purpose: this is a claim about `portAnswersHttp`'s body, and the only way that
    // body can take the undici write path back is a `fetch(` appearing in this file.
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).toContain("import http from 'http'");
  });
});
