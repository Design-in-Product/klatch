/**
 * Round 251 — `PORT` on `packages/server/src/index.ts`, driven rather than read.
 *
 * ## What this is
 *
 * Theseus routed one decision to this seat in Round 250 §2/§7: the server bound
 * `const port = 3001;` with no environment override, and his arm E had already priced the
 * fix at one line and shown two real Klatch servers coexisting once it was made. `packages/`
 * is this seat, so the change is taken here — and a change routed with driven evidence
 * deserves driven evidence back, under `npm test` rather than in a probe nothing schedules.
 *
 * That last clause is the point of the whole item. **The reason server-driving checks live in
 * `scripts/` is that two servers could not coexist**, so the suite could never own one. This
 * file is the first test in `packages/server` to bring up the real product entrypoint, and it
 * can only exist because of the change it is testing.
 *
 * ## Ports
 *
 * **Never 3001.** Every port here is ephemeral, allocated and released by this file. The arms
 * that spawn a real server record 3001's occupancy before and after and assert it is
 * *unchanged* — which is the right claim whether or not xian has `npm run dev` running, and is
 * exactly the non-clobbering property the lever exists to provide.
 *
 * ## What is NOT driven here, and why
 *
 * **"With `PORT` unset the server binds 3001"** is asserted as a unit (`resolvePort(undefined)`)
 * and is *not* driven end to end. Driving it means binding 3001 from inside `npm test`, which
 * would make this suite the occupant that reddens a concurrent probe or dies `EADDRINUSE`
 * against a dev server — the precise clobber the change exists to prevent. Refusing to take it
 * is the honest gap, not an oversight.
 *
 * **The `.env`-vs-caller precedence** (arm E) is driven against a *scratch* `.env` in a
 * subprocess running the same two statements as `index.ts`, not against the repo's real `.env`.
 * The real one is gitignored, holds `ANTHROPIC_API_KEY`, and `findEnv` resolves it from the
 * module's own location, so there is no way to vary it without editing xian's file. A two-sided
 * fixture against real `dotenv` is the strongest evidence available that does not do that.
 *
 * Zero model calls. Every database this file causes to exist is under `os.tmpdir()`.
 */

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import net from 'net';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { DEFAULT_PORT, fromEnv, resolvePort } from '../port.js';
import {
  channelsUrl,
  portAcceptsAConnection,
  somethingIsAlreadyAnswering,
} from '../../../../scripts/lib/probe-server-ownership.mts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const SERVER_ENTRY = path.join(REPO, 'packages/server/src/index.ts');
const TSX = path.join(REPO, 'node_modules/.bin/tsx');

let tmp: string;
/** Inside the repo, under the gitignored `.testdata/` — see the note on `run()` below. */
let scratchRoot: string;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'round251-'));
  fs.mkdirSync(path.join(REPO, '.testdata'), { recursive: true });
  scratchRoot = fs.mkdtempSync(path.join(REPO, '.testdata', 'round251-'));
});

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

type Spawned = { child: ChildProcess; log: string };
const alive: Spawned[] = [];

/**
 * `detached: true` so teardown can kill the process GROUP. `tsx` is a launcher and the node
 * process that actually binds the port is its child; killing the handle alone leaves a real
 * server holding a port after the suite ends (Theseus, Round 231/248).
 */
function startServer(env: Record<string, string>, tag: string): Spawned {
  const log = path.join(tmp, `${tag}.log`);
  const fd = fs.openSync(log, 'w');
  const child = spawn(TSX, [SERVER_ENTRY], {
    cwd: REPO,
    env: { ...process.env, ...env },
    stdio: ['ignore', fd, fd],
    detached: true,
  });
  const s = { child, log };
  alive.push(s);
  return s;
}

/** The port in the startup banner, or `null` if the child exited before printing one. */
async function bannerPort(s: Spawned, timeoutMs = 45_000): Promise<number | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const txt = fs.existsSync(s.log) ? fs.readFileSync(s.log, 'utf8') : '';
    const m = txt.match(/Klatch server running on http:\/\/localhost:(\d+)/);
    if (m) return Number(m[1]);
    if (s.child.exitCode !== null) return null;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

/** Resolves with the child's exit code once it is gone. */
function waitForExit(s: Spawned, timeoutMs = 20_000): Promise<number | null> {
  if (s.child.exitCode !== null) return Promise.resolve(s.child.exitCode);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), timeoutMs);
    s.child.once('exit', (code) => { clearTimeout(t); resolve(code); });
  });
}

function stop(s: Spawned) {
  try { if (s.child.pid) process.kill(-s.child.pid, 'SIGTERM'); } catch { /* already gone */ }
}

afterAll(() => {
  for (const s of alive) stop(s);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }
  try { fs.rmSync(scratchRoot, { recursive: true, force: true }); } catch { /* best effort */ }
});

// ── The pure resolution, where the default lives ─────────────────────────────

describe('resolvePort', () => {
  it('defaults to 3001 when nothing is set — the behaviour before this change', () => {
    expect(resolvePort(undefined)).toBe(3001);
    expect(DEFAULT_PORT).toBe(3001);
  });

  it('accepts a port', () => {
    expect(resolvePort('3001')).toBe(3001);
    expect(resolvePort('54029')).toBe(54029);
    expect(resolvePort('65535')).toBe(65535);
  });

  it('accepts 0 — "ask the OS for a free one", which is what closes the check-then-bind gap', () => {
    expect(resolvePort('0')).toBe(0);
  });

  it.each(['abc', '80.5', '-1', '65536', '3001abc', 'Infinity'])(
    'refuses %j rather than binding something unintended',
    (bad) => {
      expect(() => resolvePort(bad)).toThrow(/PORT must be an integer between 0 and 65535/);
    },
  );

  it.each(['0x10', '1e3', '+80', ' 80'])(
    'refuses %j — Number() would silently accept it as a different number',
    (sneaky) => {
      // This file's first run caught exactly this: `Number('0x10')` is 16, so the
      // original implementation would have bound port 16 for a caller who wrote 0x10.
      // Binding something other than what was written is the failure the lever removes.
      expect(() => resolvePort(sneaky)).toThrow(/PORT must be an integer between 0 and 65535/);
    },
  );

  it('names PORT in the error, which node\'s own ERR_SOCKET_BAD_PORT does not', () => {
    // Measured 2026-09-22: net.createServer().listen({port: NaN}) throws
    // "options.port should be >= 0 and < 65536" — correct, loud, and silent about
    // which environment variable the caller should go fix.
    expect(() => resolvePort('abc')).toThrow(/PORT/);
    expect(() => resolvePort('abc')).toThrow(/"abc"/);
  });
});

describe('fromEnv', () => {
  it('treats unset, empty and whitespace-only alike, matching getExportRoot in paths.ts', () => {
    expect(fromEnv(undefined)).toBeUndefined();
    expect(fromEnv('')).toBeUndefined();
    expect(fromEnv('   ')).toBeUndefined();
    expect(fromEnv('\t\n')).toBeUndefined();
  });

  it('is not hypothetical: this process is handed ""-valued variables', () => {
    // The note above dotenv.config() in index.ts records Claude for Mac setting
    // ANTHROPIC_API_KEY="". An empty PORT must mean "unset", not "port NaN".
    expect(resolvePort(fromEnv(''))).toBe(3001);
    expect(resolvePort(fromEnv('  '))).toBe(3001);
  });

  it('trims, so a trailing newline out of a shell does not become a bad port', () => {
    expect(resolvePort(fromEnv('54029\n'))).toBe(54029);
  });
});

// ── The real server, driven ──────────────────────────────────────────────────

describe('the real entrypoint honours PORT', () => {
  it('binds the port it was handed, and leaves 3001 exactly as it found it', async () => {
    const p = await anEphemeralPort();
    const occupiedBefore = (await somethingIsAlreadyAnswering(3001)) !== null;

    const s = startServer(
      { PORT: String(p), KLATCH_DB: path.join(tmp, 'bind.db') },
      'bind',
    );
    const bound = await bannerPort(s);

    expect(bound).toBe(p);
    expect(await portAcceptsAConnection(p)).toBe(true);
    const res = await fetch(channelsUrl(p), { headers: { connection: 'close' } });
    expect(res.ok).toBe(true);

    // Not "3001 is quiet" — that would be false whenever a dev server is up. The claim
    // this change makes is that spawning a server no longer TOUCHES 3001.
    const occupiedAfter = (await somethingIsAlreadyAnswering(3001)) !== null;
    expect(occupiedAfter).toBe(occupiedBefore);

    stop(s);
  }, 60_000);

  it('runs two real servers at once — the property that did not exist before', async () => {
    const [pa, pb] = [await anEphemeralPort(), await anEphemeralPort()];
    expect(pa).not.toBe(pb);
    const occupiedBefore = (await somethingIsAlreadyAnswering(3001)) !== null;

    const a = startServer({ PORT: String(pa), KLATCH_DB: path.join(tmp, 'a.db') }, 'two-a');
    const b = startServer({ PORT: String(pb), KLATCH_DB: path.join(tmp, 'b.db') }, 'two-b');

    expect(await bannerPort(a)).toBe(pa);
    expect(await bannerPort(b)).toBe(pb);

    // Both answering simultaneously, on separate databases.
    const [ra, rb] = await Promise.all([
      fetch(channelsUrl(pa), { headers: { connection: 'close' } }),
      fetch(channelsUrl(pb), { headers: { connection: 'close' } }),
    ]);
    expect(ra.ok).toBe(true);
    expect(rb.ok).toBe(true);

    const occupiedAfter = (await somethingIsAlreadyAnswering(3001)) !== null;
    expect(occupiedAfter).toBe(occupiedBefore);

    stop(a);
    stop(b);
  }, 90_000);

  it('PORT=0 binds a real port and reports it in the banner, not the 0 it was asked for', async () => {
    const occupiedBefore = (await somethingIsAlreadyAnswering(3001)) !== null;
    const s = startServer({ PORT: '0', KLATCH_DB: path.join(tmp, 'zero.db') }, 'zero');
    const bound = await bannerPort(s);

    expect(bound).not.toBeNull();
    expect(bound).not.toBe(0);
    expect(bound).not.toBe(3001);
    expect(await portAcceptsAConnection(bound!)).toBe(true);

    const occupiedAfter = (await somethingIsAlreadyAnswering(3001)) !== null;
    expect(occupiedAfter).toBe(occupiedBefore);

    stop(s);
  }, 60_000);
});

// ── Validation happens before the first write ────────────────────────────────

describe('a bad PORT fails before getDb() migrates anything', () => {
  it('refuses, names PORT, and does NOT create the database', async () => {
    const db = path.join(tmp, 'never-created.db');
    expect(fs.existsSync(db)).toBe(false);

    const s = startServer({ PORT: 'not-a-port', KLATCH_DB: db }, 'bad-port');
    const code = await waitForExit(s);
    const log = fs.readFileSync(s.log, 'utf8');

    expect(code).not.toBe(0);
    expect(log).toMatch(/PORT must be an integer between 0 and 65535/);

    // The ordering claim, two-sided with the arm below: getDb() runs initSchema() and
    // runMigrations(), so reaching it is a WRITE. A misconfigured port must not migrate
    // a database on its way to failing.
    expect(fs.existsSync(db)).toBe(false);
  }, 45_000);

  it('and the same spawn with a valid port DOES create it — so the arm above is not vacuous', async () => {
    const db = path.join(tmp, 'is-created.db');
    expect(fs.existsSync(db)).toBe(false);

    const p = await anEphemeralPort();
    const s = startServer({ PORT: String(p), KLATCH_DB: db }, 'good-port');
    expect(await bannerPort(s)).toBe(p);
    expect(fs.existsSync(db)).toBe(true);

    stop(s);
  }, 60_000);
});

// ── Precedence, against real dotenv ──────────────────────────────────────────

describe('a caller-supplied PORT outranks one in .env', () => {
  /**
   * `index.ts` captures `process.env.PORT` *before* `dotenv.config({ override: true })`.
   * Without that capture, `override: true` — which exists because Claude for Mac sets
   * `ANTHROPIC_API_KEY=""` — would let a `.env` PORT silently beat the port a probe
   * spawned the server with, and the probe would clobber whatever owned the `.env` port
   * after checking a different one was free.
   *
   * Two-sided in a subprocess against real `dotenv` and a scratch `.env`. The repo's own
   * `.env` is never read or written here.
   */
  const child = (capture: boolean) => `
import dotenv from 'dotenv';
const captured = process.env.PORT;
dotenv.config({ path: process.env.SCRATCH_ENV, override: true });
const chosen = ${capture ? '(captured ?? process.env.PORT)' : 'process.env.PORT'};
console.log(JSON.stringify({ captured: captured ?? null, afterConfig: process.env.PORT ?? null, chosen: chosen ?? null }));
`;

  /**
   * The scratch child lives under the repo's gitignored `.testdata/`, not under
   * `os.tmpdir()`: an ESM `import dotenv from 'dotenv'` resolves from the importing
   * FILE's location, so a script in a temp directory cannot see the repo's
   * `node_modules` and dies before printing anything. This file's second red.
   */
  async function run(capture: boolean, envFileBody: string, callerPort?: string) {
    const dir = fs.mkdtempSync(path.join(scratchRoot, 'prec-'));
    const scratchEnv = path.join(dir, 'scratch.env');
    const script = path.join(dir, 'child.mjs');
    fs.writeFileSync(scratchEnv, envFileBody);
    fs.writeFileSync(script, child(capture));
    const env: Record<string, string> = { ...process.env as Record<string, string>, SCRATCH_ENV: scratchEnv };
    if (callerPort === undefined) delete env.PORT; else env.PORT = callerPort;

    const out = await new Promise<string>((resolve, reject) => {
      const c = spawn(process.execPath, [script], { cwd: REPO, env });
      let buf = '';
      c.stdout.on('data', (d) => { buf += d; });
      c.stderr.on('data', (d) => { buf += d; });
      c.once('error', reject);
      c.once('exit', () => resolve(buf));
    });
    return JSON.parse(out.trim().split('\n').pop()!);
  }

  it('dotenv really does clobber it — the hazard is measured, not assumed', async () => {
    const r = await run(false, 'PORT=9999\n', '54029');
    expect(r.captured).toBe('54029');
    expect(r.afterConfig).toBe('9999');
    expect(r.chosen).toBe('9999'); // what index.ts would pick WITHOUT the capture
  }, 30_000);

  it('capturing first makes the caller win', async () => {
    const r = await run(true, 'PORT=9999\n', '54029');
    expect(r.chosen).toBe('54029');
    expect(resolvePort(fromEnv(r.chosen))).toBe(54029);
  }, 30_000);

  it('and .env still works when the caller sets nothing', async () => {
    const r = await run(true, 'PORT=9999\n', undefined);
    expect(r.captured).toBeNull();
    expect(r.chosen).toBe('9999');
    expect(resolvePort(fromEnv(r.chosen))).toBe(9999);
  }, 30_000);

  it('and with neither, the default stands', async () => {
    const r = await run(true, 'ANTHROPIC_API_KEY=x\n', undefined);
    expect(r.chosen).toBeNull();
    expect(resolvePort(fromEnv(r.chosen ?? undefined))).toBe(3001);
  }, 30_000);

  /**
   * A source-order guard, and named as one: this READS `index.ts`, it does not drive it.
   *
   * The arms above prove the mechanism against real `dotenv`; none of them can prove that
   * `index.ts` still uses it, because doing so needs a `PORT` line in the repo's real `.env`
   * — gitignored, holding xian's API key, and resolved from the module's own location, so a
   * test cannot vary it without editing that file. Deleting the capture and reading
   * `process.env.PORT` directly at line 47 would therefore leave every arm in this file green.
   *
   * This is the weaker instrument that covers the gap rather than the gap going uncovered.
   * It fails closed: if either anchor is renamed it reports that it has stopped measuring,
   * instead of passing on a file it no longer understands.
   */
  it('index.ts still captures PORT before dotenv can override it (source order, not driven)', () => {
    const src = fs.readFileSync(SERVER_ENTRY, 'utf8');
    const capture = src.indexOf('const portFromCaller = process.env.PORT;');
    const config = src.indexOf('dotenv.config(');
    const use = src.indexOf('resolvePort(');

    expect(capture, 'anchor "const portFromCaller = ..." is gone — this guard has stopped measuring').toBeGreaterThan(-1);
    expect(config, 'anchor "dotenv.config(" is gone — this guard has stopped measuring').toBeGreaterThan(-1);
    expect(use, 'anchor "resolvePort(" is gone — this guard has stopped measuring').toBeGreaterThan(-1);

    expect(capture).toBeLessThan(config);
    expect(config).toBeLessThan(use);
  });
});
