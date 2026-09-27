/**
 * Round 280 — the client half of the Round 278 pair, measured.
 *
 * Daedalus's Round 279 §7 handed this seat one question and framed it as a one-line change:
 *
 * > "if the hazard is (server that never finishes) x (client that will not FIN back), then
 * >  `somethingIsAlreadyAnswering`'s `http.request` is the half we control. Whether it should
 * >  `destroy()` its socket rather than `end()` it is a one-line change with a measurable answer."
 *
 * **The framing does not survive contact with the code, and the correction matters more than the
 * answer.** `req.end()` at `probe-server-ownership.mts:289` is not a half-close of an established
 * conversation — it is what *sends the request*. A GET with no body still needs `end()` to put the
 * request on the wire. `destroy()` "rather than" `end()` would mean the guard never asks anything
 * and every port reads as silent. So there is no one-line swap at `:289`.
 *
 * There is a real question one line away from his, and it is the same hazard: **after the guard
 * gets its answer, does it leave a socket open to the thing it just described?** That is precisely
 * "a client that will not FIN back", and `http.globalAgent.keepAlive` is `true` by default on this
 * node, which is the mechanism that would cause it.
 *
 * This is NOT the keep-alive hypothesis Round 278 killed. That one asked whether `agent:false`
 * changed whether a **half-closed** connection makes `close(cb)` hang; it did not, and the cause
 * was server-side socket tracking. This asks a different question about a different arm — the
 * **success** path, after a 200 — namely the *lifetime of the socket the guard leaves behind*.
 * Same option, different dependent variable. Stated explicitly so nobody reads this as a
 * resurrection.
 *
 * Arms:
 *   A  the guard's success path: live server-side sockets the instant it resolves
 *   B  the fuse: how long the leftover socket survives unattended
 *   C  `agent: false`
 *   D  explicit `req.destroy()` once the response has ended
 *   E  does it matter to an `http.Server` torn down with a bare `close(cb)`?
 *   F  does it matter to a bare `net.Server` torn down with a bare `close(cb)`?
 *   G  the `error` arm, which unlike the `timeout` arm does not destroy
 *   H  census: sites that call the guard and then tear down a server they own
 *
 * Discipline: ephemeral ports only, never 3001. Every staged server closed in-process with a
 * bounded teardown that reports rather than hangs. Census by `readdirSync`/`readFileSync`, never
 * `grep` (Round 276: grep is blind to two source files in this repo).
 */
import * as http from 'node:http';
import * as net from 'node:net';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import * as path from 'node:path';
import {
  channelsUrl,
  somethingIsAlreadyAnswering,
  trackedNetServer,
} from './lib/probe-server-ownership.mts';

type Outcome = 'PASS' | 'FAIL' | 'MEAS' | 'SKIP';
const rows: { id: string; outcome: Outcome; text: string }[] = [];
const record = (id: string, outcome: Outcome, text: string): void => {
  rows.push({ id, outcome, text });
  console.log(`[${outcome === 'PASS' ? 'ok' : outcome === 'FAIL' ? 'FAIL' : outcome}] ${id}  ${text}`);
};
const check = (id: string, cond: boolean, text: string): void =>
  record(id, cond ? 'PASS' : 'FAIL', text);

/** A tracked `http.Server` answering 200, so the *server* side can count what the client left. */
function trackedHttpServer(): {
  server: http.Server;
  live: () => number;
  closeBounded: (budgetMs?: number) => Promise<'closed' | 'hung'>;
  closeBare: (budgetMs?: number) => Promise<'closed' | 'hung'>;
} {
  const sockets = new Set<net.Socket>();
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('[]');
  });
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  const live = (): number => {
    let n = 0;
    for (const s of sockets) if (!s.destroyed) n += 1;
    return n;
  };
  const race = async (budgetMs: number): Promise<'closed' | 'hung'> => {
    let timer: NodeJS.Timeout | undefined;
    const outcome = await Promise.race([
      new Promise<'closed'>((r) => server.close(() => r('closed'))),
      new Promise<'hung'>((r) => { timer = setTimeout(() => r('hung'), budgetMs); }),
    ]);
    if (timer !== undefined) clearTimeout(timer);
    if (outcome === 'hung') server.unref();
    return outcome;
  };
  return {
    server,
    live,
    closeBounded: async (budgetMs = 3000) => {
      for (const s of sockets) s.destroy();
      return race(budgetMs);
    },
    closeBare: (budgetMs = 3000) => race(budgetMs),
  };
}

function listen(server: net.Server | http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr === null || typeof addr === 'string') reject(new Error('no ephemeral port'));
      else resolve(addr.port);
    });
  });
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * `portAnswersHttp`'s body, reproduced so the one variable under test can be varied. Kept
 * line-for-line equivalent to `probe-server-ownership.mts:261-291` on the default variant, so a
 * row that differs differs because of the flag and not because of a rewrite.
 */
function answersHttpVariant(
  port: number,
  variant: 'pooled-default' | 'agent-false' | 'destroy-on-end',
  timeoutMs = 3000,
): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (answer: string | null): void => {
      if (!settled) { settled = true; resolve(answer); }
    };
    const opts: http.RequestOptions = { method: 'GET', timeout: timeoutMs };
    if (variant === 'agent-false') opts.agent = false;
    const req = http.request(new URL(channelsUrl(port)), opts, (res) => {
      if (variant === 'destroy-on-end') {
        res.once('end', () => req.destroy());
        res.resume();
        res.once('close', () => done(`HTTP ${res.statusCode}`));
      } else {
        res.resume();
        done(`HTTP ${res.statusCode}`);
      }
    });
    req.once('timeout', () => { req.destroy(); done(null); });
    req.once('error', () => done(null));
    req.end();
  });
}

async function main(): Promise<void> {
  console.log(`node ${process.version}`);
  // Round 280: `@types/node`'s `http.Agent` declares none of `keepAlive`, `options` or
  // `keepAliveMsecs`, though all three are present at runtime and all three are the mechanism this
  // probe is about. Daedalus's Round 279 gate caught the bare reads as TS2339 on its first run
  // against another seat's file — so the narrowing is written down here rather than suppressed,
  // per his §5: a directive telling the gate not to look is worse than a declaration.
  const agentFacts = http.globalAgent as unknown as {
    keepAlive?: boolean;
    keepAliveMsecs?: number;
    options?: { timeout?: number };
  };
  console.log(
    `http.globalAgent.keepAlive=${agentFacts.keepAlive} ` +
    `timeout=${JSON.stringify(agentFacts.options?.timeout)} ` +
    `keepAliveMsecs=${agentFacts.keepAliveMsecs}`,
  );
  console.log('');

  // ---- A: the guard's success path, exactly as every caller invokes it -------------------------
  {
    const h = trackedHttpServer();
    const port = await listen(h.server);
    const before = h.live();
    const verdict = await somethingIsAlreadyAnswering(port);
    const after = h.live();
    record('A1', 'MEAS', `guard verdict: ${JSON.stringify(verdict)}`);
    check('A2', verdict !== null && verdict.includes('HTTP 200'),
      'the guard sees the staged server (control: the rest of A is about a real 200)');
    record('A3', 'MEAS', `live server-side sockets: before=${before} immediately after=${after}`);
    // This arm PINS THE REPAIR, not the defect. Before the Round 280 `agent: false` edit to
    // `portAnswersHttp` this measured **1** (runs 1 and 2, `.testdata/r280/run{1,2}.txt`), with an
    // unattended lifetime of ~4002 ms. A red here means the pooling came back.
    check('A4', after === 0,
      after === 0
        ? 'the shipped guard leaves nothing open to the server it just described (was 1 before the Round 280 repair)'
        : `REGRESSION: the shipped guard left ${after} socket(s) open — the Round 280 agent:false repair is gone or defeated`);
    await h.closeBounded();
  }

  // ---- B: the fuse, measured on the pre-repair shape -------------------------------------------
  // Deliberately driven against the POOLED replica, not the repaired library: the question "how long
  // was the window" has to stay answerable after the window has been closed, or the repair erases
  // its own justification.
  {
    const h = trackedHttpServer();
    const port = await listen(h.server);
    await answersHttpVariant(port, 'pooled-default');
    const t0 = Date.now();
    let elapsed = -1;
    for (let i = 0; i < 140; i += 1) {
      if (h.live() === 0) { elapsed = Date.now() - t0; break; }
      await sleep(50);
    }
    if (elapsed < 0) {
      record('B1', 'MEAS', 'leftover socket still live after 7000 ms of waiting (fuse longer than the budget)');
      check('B2', true, 'measurement recorded; no pass/fail claim on a bound this arm did not reach');
    } else {
      record('B1', 'MEAS', `leftover socket closed unattended after ~${elapsed} ms`);
      check('B2', elapsed > 250,
        `the window is ${elapsed} ms, not instantaneous — long enough for a caller's own teardown to fall inside it`);
    }
    await h.closeBounded();
  }

  // ---- C and D: the two variants -------------------------------------------------------------
  for (const variant of ['pooled-default', 'agent-false', 'destroy-on-end'] as const) {
    const h = trackedHttpServer();
    const port = await listen(h.server);
    const answer = await answersHttpVariant(port, variant);
    const after = h.live();
    const id = variant === 'pooled-default' ? 'C1' : variant === 'agent-false' ? 'C2' : 'C3';
    record(id, 'MEAS', `${variant.padEnd(15)} answer=${JSON.stringify(answer)} live-after=${after}`);
    check(`${id}a`, answer === 'HTTP 200',
      `${variant} still gets the answer (a fix that stops answering is not a fix)`);
    if (variant === 'agent-false') {
      check(`${id}b`, after === 0, 'agent:false leaves nothing behind');
    }
    // `destroy-on-end` gets NO pass/fail claim. It is the answer to Daedalus's §7 as he framed it,
    // and the answer is that it does not work: by the time the response has ended, the socket has
    // already been released to the agent's free pool and the request object no longer owns it, so
    // `req.destroy()` reclaims nothing. Recording it as a FAIL would put a red beside a correct
    // measurement; recording it as a PASS would pin a defect as desired. It is a measurement.
    await h.closeBounded();
  }

  // ---- E: does it matter to an http.Server torn down with a bare close(cb)? -------------------
  {
    const h = trackedHttpServer();
    const port = await listen(h.server);
    await somethingIsAlreadyAnswering(port);
    const liveAtTeardown = h.live();
    const t0 = Date.now();
    const outcome = await h.closeBare(3000);
    record('E1', 'MEAS',
      `http.Server bare close(cb) with ${liveAtTeardown} leftover socket -> ${outcome} in ${Date.now() - t0} ms`);
    record('E2', 'MEAS',
      outcome === 'closed'
        ? 'http.Server reaps its own idle keep-alive sockets, so this family is NOT exposed'
        : 'http.Server did NOT reap the leftover socket — a bare close(cb) after the guard hangs');
  }

  // ---- F: does it matter to a bare net.Server torn down with a bare close(cb)? ----------------
  //
  // Both cells, because this is the arm that decides whether the repair was worth making. The
  // POOLED client is the pre-repair guard; the REPAIRED library is what ships now. Same server, same
  // teardown, same budget — the only variable is the client half.
  for (const client of ['pooled-default', 'repaired-library'] as const) {
    const sockets = new Set<net.Socket>();
    const server = net.createServer((socket) => {
      sockets.add(socket);
      socket.once('close', () => sockets.delete(socket));
      // This `'error'` handler is NOT incidental hygiene — its absence killed run 1 of this probe
      // outright, before arm F printed a single row. `portAcceptsAConnection:113` closes its probe
      // socket with `sock.destroy()`, an abortive close; against a server that has already written
      // bytes that produces ECONNRESET on the server side; an accepted socket with no `'error'`
      // listener turns that into an unhandled `'error'` event, which is fatal. Arm I below
      // reproduces that in a child process rather than in this one. Keep this line.
      socket.on('error', () => { /* see arm I */ });
      // A minimal raw HTTP 200 and then silence: the realistic stranger, and the shape
      // `trackedNetServer` exists to make safe.
      socket.write('HTTP/1.1 200 OK\r\ncontent-length: 2\r\ncontent-type: application/json\r\n\r\n[]');
    });
    const port = await listen(server);
    const verdict = client === 'repaired-library'
      ? await somethingIsAlreadyAnswering(port)
      : await answersHttpVariant(port, 'pooled-default');
    let live = 0;
    for (const s of sockets) if (!s.destroyed) live += 1;
    const t0 = Date.now();
    let timer: NodeJS.Timeout | undefined;
    const outcome = await Promise.race([
      new Promise<'closed'>((r) => server.close(() => r('closed'))),
      new Promise<'hung'>((r) => { timer = setTimeout(() => r('hung'), 3000); }),
    ]);
    if (timer !== undefined) clearTimeout(timer);
    const id = client === 'pooled-default' ? 'F1' : 'F2';
    record(id, 'MEAS',
      `${client.padEnd(17)} verdict=${JSON.stringify(verdict)} live-at-teardown=${live} ` +
      `bare close(cb) -> ${outcome} in ${Date.now() - t0} ms`);
    if (client === 'pooled-default') {
      check('F1a', outcome === 'hung',
        outcome === 'hung'
          ? 'the hazard is real: a pooling client leaves a socket that makes an untracked net.Server teardown hang — the Round 278 pair, end to end, with our own pre-repair client as the client half'
          : 'the hazard did NOT reproduce against the pooled client; the repair below rests on nothing and should be reconsidered');
    } else {
      // NOT a regression, and my first framing of this row called it one. `agent: false` closes the
      // `http.Server` cell (arm A4 → 0 live) and does NOT close this one, because the two cells fail
      // for different reasons. An `http.Server` honours the `Connection: close` that `agent: false`
      // sends and closes its own side. A raw `net.Server` that writes a response and never closes
      // ignores headers entirely — so whatever the client does short of an abortive close, the
      // SERVER's side stays open and `close(cb)` never settles. That is Round 278's own conclusion
      // arriving again: this is a property of the pair, and the client can only fix the half that is
      // the client's. Pinned as a MEASUREMENT of a known-open hazard, not as a failing check, so an
      // honest red stays available for the day it changes.
      record('F2a', 'MEAS',
        outcome === 'hung'
          ? 'as expected and still OPEN: `agent: false` does not close the raw-net.Server cell — only an abortive close would, and that is the untested fourth variant (see §OPEN in the writeup)'
          : 'CHANGED: the raw-net.Server cell now closes; something other than this repair has moved, and it should be explained before it is trusted');
    }
    // Always clean up, whatever the outcome: this probe must not be the thing that leaks.
    for (const s of sockets) s.destroy();
    server.unref();
    server.close();
  }

  // ---- G: the error arm, which does not destroy -----------------------------------------------
  {
    // A server that accepts and immediately destroys: the client's request errors (ECONNRESET),
    // so `req.once('error', ...)` is the arm that resolves. Unlike `timeout`, it calls no
    // `destroy()`. Does that leave anything?
    const { server, closeBounded } = trackedNetServer((socket) => socket.destroy());
    const port = await listen(server);
    const answer = await answersHttpVariant(port, 'pooled-default');
    const key = `127.0.0.1:${port}:`;
    const listed = [
      ...(http.globalAgent.sockets[key] ?? []),
      ...(http.globalAgent.freeSockets[key] ?? []),
    ];
    const stillLive = listed.filter((s) => !s.destroyed).length;
    // Precision matters here and my first version of this arm did not have it: `agent.sockets` is
    // BOOKKEEPING, and a socket can be listed there after it is dead. Run 2 reported "1 socket
    // pooled" as a FAIL on the listing alone, which is a claim about a Map and not about a
    // connection. The number that means anything is how many of the listed sockets are undestroyed.
    record('G1', 'MEAS',
      `error arm: answer=${JSON.stringify(answer)} listed-in-agent=${listed.length} of-those-undestroyed=${stillLive}`);
    check('G2', answer === null, 'the error arm still reports null rather than throwing');
    check('G3', stillLive === 0,
      stillLive === 0
        ? `the error arm's missing destroy() is inert: ${listed.length} socket(s) listed in the agent, 0 of them alive`
        : `the error arm left ${stillLive} LIVE socket(s) — the missing destroy() at the error arm is load-bearing after all`);
    await closeBounded();
  }

  // ---- I: the guard can kill the process it is describing from, by a second mechanism ----------
  //
  // `probe-server-ownership.mts:258` states the property this module must have: "The describing
  // half of an ownership guard must not be able to kill the process it is describing from." Round
  // 275 established that for a THROW out of `fetch`. This arm establishes that it still fails for
  // an unhandled `'error'` event on the described server's own accepted socket — a different
  // mechanism reaching the same outcome, found because it killed run 1 of this probe.
  //
  // Driven in a child process, because in-process it would end the table. Child writes its verdict
  // to a FILE; `spawnSync().status` is read directly and never through a pipe.
  {
    const dir = path.join('.testdata', 'r280');
    const childPath = path.join(dir, 'arm-i-child.mts');
    const outPath = path.join(dir, 'arm-i-verdict.txt');
    const child = [
      "import * as net from 'node:net';",
      "import { writeFileSync } from 'node:fs';",
      "import { somethingIsAlreadyAnswering } from '../../scripts/lib/probe-server-ownership.mts';",
      `const OUT = ${JSON.stringify(path.resolve(outPath))};`,
      'const withHandler = process.argv[2] === "with-handler";',
      'const server = net.createServer((socket) => {',
      '  if (withHandler) socket.on("error", () => {});',
      '  socket.write("HTTP/1.1 200 OK\\r\\ncontent-length: 2\\r\\n\\r\\n[]");',
      '});',
      'server.listen(0, "127.0.0.1", async () => {',
      '  const addr = server.address();',
      '  if (addr === null || typeof addr === "string") { writeFileSync(OUT, "NO-PORT"); process.exit(9); }',
      '  const verdict = await somethingIsAlreadyAnswering(addr.port);',
      '  writeFileSync(OUT, "REACHED-THE-END verdict=" + JSON.stringify(verdict));',
      '  server.close();',
      '  process.exit(0);',
      '});',
    ].join('\n');
    const { writeFileSync, existsSync, unlinkSync } = await import('node:fs');
    writeFileSync(childPath, child);
    const { spawnSync } = await import('node:child_process');

    for (const mode of ['no-handler', 'with-handler'] as const) {
      if (existsSync(outPath)) unlinkSync(outPath);
      const r = spawnSync('npx', ['tsx', childPath, mode], {
        encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'pipe'],
      });
      const wrote = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '(no file)';
      const reset = (r.stderr ?? '').includes('ECONNRESET');
      const id = mode === 'no-handler' ? 'I1' : 'I2';
      record(id, 'MEAS',
        `${mode.padEnd(13)} child status=${r.status} signal=${String(r.signal)} ` +
        `ECONNRESET-in-stderr=${reset} verdict-file=${JSON.stringify(wrote)}`);
      if (mode === 'no-handler') {
        check('I1a', r.status !== 0 && reset,
          r.status !== 0 && reset
            ? 'CONFIRMED: with no `error` handler on the described server\'s accepted socket, the guard kills the process — unhandled ECONNRESET, table never finishes'
            : `not reproduced in a child (status=${r.status}, ECONNRESET=${reset}) — the in-process crash in run 1 stands as the only sighting`);
      } else {
        check('I2a', r.status === 0 && wrote.startsWith('REACHED-THE-END'),
          'control: one `error` handler is the whole difference — same server, same guard, child runs to completion');
      }
    }
  }

  // ---- H: census — who calls the guard and then tears down a server they own? -----------------
  {
    const roots = ['scripts', path.join('packages', 'server', 'src', '__tests__')];
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        if (entry.startsWith('.') || entry === 'node_modules') continue;
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(mts|ts|mjs)$/.test(entry)) files.push(full);
      }
    };
    for (const r of roots) walk(r);

    const callers: { file: string; bareClose: boolean }[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      if (!src.includes('somethingIsAlreadyAnswering') && !src.includes('requireAnUnoccupiedPort')) continue;
      if (file.endsWith(path.join('lib', 'probe-server-ownership.mts'))) continue;
      // A bare `close(` awaited/wrapped without the tracked teardown is the exposed shape.
      const tracked = src.includes('trackedNetServer') || src.includes('closeBounded');
      const closes = /\.close\s*\(/.test(src);
      callers.push({ file, bareClose: closes && !tracked });
    }
    record('H1', 'MEAS', `${files.length} files walked, ${callers.length} call the ownership guard`);
    const exposed = callers.filter((c) => c.bareClose);
    for (const c of exposed) record('H2', 'MEAS', `  candidate (closes a server, no tracked teardown): ${c.file}`);
    record('H3', 'MEAS',
      `${exposed.length} of ${callers.length} guard callers close a server without the tracked teardown ` +
      '(CANDIDATES, not sightings — shape from source text, not driven)');

    // Arm I's mechanism, asked of the shared primitive rather than of my scratch server.
    // `trackedNetServer` registers `'close'` on each accepted socket and nothing else, so a caller
    // whose `onConnection` writes bytes inherits the arm I crash. The default `onConnection` is
    // `socket.destroy()`, which writes nothing — which is why this has never been hit.
    const libSrc = readFileSync(path.join('scripts', 'lib', 'probe-server-ownership.mts'), 'utf8');
    const trackedBody = libSrc.slice(
      libSrc.indexOf('export function trackedNetServer'),
      libSrc.indexOf('export function portAnswersHttp'),
    );
    const hasErrorHandler = /socket\.(on|once)\s*\(\s*['"]error['"]/.test(trackedBody);
    record('H4', 'MEAS',
      `trackedNetServer registers an 'error' handler on accepted sockets: ${hasErrorHandler}`);
    const writingCallers = files.filter((f) => {
      const src = readFileSync(f, 'utf8');
      if (!src.includes('trackedNetServer(')) return false;
      // A caller that passes an onConnection writing bytes is exposed to arm I.
      return /trackedNetServer\(\s*\(?\s*(socket|s)\b[\s\S]{0,400}?\.write\s*\(/.test(src);
    });
    record('H5', 'MEAS',
      `${writingCallers.length} caller(s) pass a trackedNetServer onConnection that writes bytes` +
      (writingCallers.length > 0 ? `: ${writingCallers.join(', ')}` : ' — so arm I is latent, not live, in the shared primitive'));
  }

  // ---- summary --------------------------------------------------------------------------------
  const fails = rows.filter((r) => r.outcome === 'FAIL');
  const passes = rows.filter((r) => r.outcome === 'PASS');
  const meas = rows.filter((r) => r.outcome === 'MEAS');
  console.log('');
  console.log(`${passes.length} check(s) passed · ${fails.length} failed · ${meas.length} measurement(s)`);
  for (const f of fails) console.log(`  FAIL ${f.id}  ${f.text}`);
  if (fails.length > 0) process.exitCode = 1;
}

main().then(
  () => { /* exitCode already set by main */ },
  (err: unknown) => {
    // Round 276: a teardown that exits 0 mid-table is worse than a crash. Throw loudly.
    console.error('probe-round280 THREW — the table below this point never ran:');
    console.error(err);
    process.exitCode = 2;
  },
);
