/**
 * Round 282 — the fourth variant, and first: *which socket* strands the raw-`net.Server` cell.
 *
 * Round 280 §5 left one thing open and named it this fire's first item:
 *
 * > "`agent: false` does not close the raw-`net.Server` cell. Arm F2 still hangs with the repaired
 * >  library... Your §7 instinct is probably right as the *second* half of a two-part change —
 * >  `agent: false` **plus** an abortive close... **I did not measure that fourth variant.**"
 *
 * Before measuring a remedy, this probe measures the thing the remedy is aimed at, because Round
 * 280's arm F does not support the attribution its own comment makes. Arm F's two cells are:
 *
 *   F1  `answersHttpVariant(port, 'pooled-default')`   — the HTTP request, and nothing else
 *   F2  `somethingIsAlreadyAnswering(port)`            — `portAcceptsAConnection` **then** `portAnswersHttp`
 *
 * The comment beside them says *"same server, same teardown, same budget — the only variable is the
 * client half."* That is **not true**: F2 opens a second TCP connection that F1 never opens — the
 * accept probe's. So a hang in F2 and not in F1 is consistent with two quite different causes, and
 * the one the writeup asserted (the HTTP client's socket) is only one of them. If the stranded
 * socket is the accept probe's, then a `destroy()`/reset added to `portAnswersHttp` fixes nothing,
 * and §7's instinct would be aimed at the wrong socket for the second round running.
 *
 * So: decompose first (arm B), then price the fourth variant on whichever half is actually
 * responsible (arms C/D), then price the cost of an abortive close (arm E, in a child process
 * because an abortive close is exactly the mechanism Round 280 §6 found can kill the described
 * process), then guard the `http.Server` cell against regression (arm F).
 *
 * Arms:
 *   A  environment pins, including the one the §2 mechanism depends on
 *   B  decomposition: which of the two sockets in `somethingIsAlreadyAnswering` strands the server
 *   C  the fourth variant on the HTTP half: FIN (`destroy`) and RST (`resetAndDestroy`)
 *   D  the same two closes on the accept half
 *   E  cost of an abortive close against an occupant with no `'error'` handler (child process)
 *   F  regression guard: the `http.Server` cell stays at 0 live and closes fast
 *
 * Discipline: ephemeral ports only, never 3001. Every staged server torn down with a bounded
 * teardown that reports rather than hangs. Child-process arm writes its verdict to a FILE and its
 * status is read from `spawnSync().status` directly, never through a pipe. `mkdirSync(…, {
 * recursive: true })` before any write under `.testdata/` — Argus's Round 280 finding, which was
 * that a probe writing into a gitignored directory it does not create only runs where it was
 * written.
 */
import * as http from 'node:http';
import * as net from 'node:net';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import {
  channelsUrl,
  portAcceptsAConnection,
  portAnswersHttp,
  somethingIsAlreadyAnswering,
} from './lib/probe-server-ownership.mts';

type Outcome = 'PASS' | 'FAIL' | 'MEAS' | 'SKIP';
const rows: { id: string; outcome: Outcome; text: string }[] = [];
const record = (id: string, outcome: Outcome, text: string): void => {
  rows.push({ id, outcome, text });
  console.log(`[${outcome === 'PASS' ? 'ok' : outcome === 'FAIL' ? 'FAIL' : outcome}] ${id}  ${text}`);
};
const check = (id: string, cond: boolean, text: string): void =>
  record(id, cond ? 'PASS' : 'FAIL', text);

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

/**
 * The realistic stranger of Round 278: a raw `net.Server` that writes a minimal HTTP 200 and then
 * never closes its own side. Every accepted socket is traced, so a hang can be *explained* rather
 * than only pinned — the events the server side saw are the evidence for which peer did what.
 */
function tracedRawServer(opts: { errorHandler: boolean } = { errorHandler: true }): {
  server: net.Server;
  live: () => number;
  trace: () => string;
  accepted: () => number;
  closeBare: (budgetMs?: number) => Promise<'closed' | 'hung'>;
  hardTeardown: () => void;
} {
  const sockets = new Set<net.Socket>();
  const events: string[] = [];
  let n = 0;
  const server = net.createServer((socket) => {
    const id = `s${(n += 1)}`;
    sockets.add(socket);
    for (const ev of ['end', 'close'] as const) {
      socket.once(ev, () => events.push(`${id}:${ev}`));
    }
    socket.once('close', () => sockets.delete(socket));
    // Round 280 §6: without this, an abortive close from the *describing* half becomes an
    // unhandled `'error'` event and kills this process. Arm E below runs the no-handler cell in a
    // child, which is why this flag exists at all rather than being hardcoded true.
    if (opts.errorHandler) socket.on('error', (e: NodeJS.ErrnoException) => events.push(`${id}:error(${e.code ?? 'ERR'})`));
    socket.write('HTTP/1.1 200 OK\r\ncontent-length: 2\r\ncontent-type: application/json\r\n\r\n[]');
  });
  const live = (): number => {
    let c = 0;
    for (const s of sockets) if (!s.destroyed) c += 1;
    return c;
  };
  return {
    server,
    live,
    trace: () => events.join(' '),
    accepted: () => n,
    closeBare: async (budgetMs = 3000) => {
      let timer: NodeJS.Timeout | undefined;
      const outcome = await Promise.race([
        new Promise<'closed'>((r) => server.close(() => r('closed'))),
        new Promise<'hung'>((r) => { timer = setTimeout(() => r('hung'), budgetMs); }),
      ]);
      if (timer !== undefined) clearTimeout(timer);
      if (outcome === 'hung') server.unref();
      return outcome;
    },
    hardTeardown: () => {
      for (const s of sockets) s.destroy();
      server.unref();
      server.close();
    },
  };
}

/**
 * `portAnswersHttp`'s body with one variable: what, if anything, the client does to its own socket
 * once the response has ended. The `pooled-default` and `agent-false` cells are kept line-for-line
 * equivalent to `probe-server-ownership.mts:279-332` before and after the Round 280 repair, so a
 * row that differs differs because of the variant and not because of a rewrite.
 */
type Variant = 'pooled-default' | 'agent-false' | 'agent-false-fin' | 'agent-false-rst';
function answersHttpVariant(port: number, variant: Variant, timeoutMs = 3000): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (answer: string | null): void => {
      if (!settled) { settled = true; resolve(answer); }
    };
    const opts: http.RequestOptions = { method: 'GET', timeout: timeoutMs };
    if (variant !== 'pooled-default') opts.agent = false;
    const req = http.request(new URL(channelsUrl(port)), opts, (res) => {
      if (variant === 'agent-false-fin' || variant === 'agent-false-rst') {
        // The close must happen once the response has *ended*, not in this callback: at callback
        // time the body has not necessarily arrived, and closing here would make the guard's own
        // answer unreliable — which is the failure mode Round 280 §1 caught in §7's framing.
        res.once('end', () => {
          const sock = res.socket;
          if (sock !== null && sock !== undefined) {
            if (variant === 'agent-false-rst') sock.resetAndDestroy();
            else sock.destroy();
          }
          done(`HTTP ${res.statusCode}`);
        });
        res.resume();
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

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** One cell: stage a fresh raw server, run `drive`, then tear down with a BARE `close(cb)`. */
async function cell(
  id: string,
  label: string,
  drive: (port: number) => Promise<unknown>,
): Promise<{ outcome: 'closed' | 'hung'; live: number; ms: number; trace: string; accepted: number }> {
  const h = tracedRawServer();
  const port = await listen(h.server);
  const verdict = await drive(port);
  const live = h.live();
  const t0 = Date.now();
  const outcome = await h.closeBare(3000);
  const ms = Date.now() - t0;
  const trace = h.trace();
  const accepted = h.accepted();
  record(id, 'MEAS',
    `${label.padEnd(34)} verdict=${JSON.stringify(verdict)} accepted=${accepted} ` +
    `live-at-teardown=${live} bare close(cb) -> ${outcome} in ${ms} ms  [server-side: ${trace || 'no events'}]`);
  h.hardTeardown();
  return { outcome, live, ms, trace, accepted };
}

async function main(): Promise<void> {
  console.log(`node ${process.version}`);

  // ---- A: environment pins --------------------------------------------------------------------
  {
    // Narrowed views rather than `@ts-expect-error`, per Daedalus's Round 279 §5: `@types/node`'s
    // `http.Agent` declares none of these though all exist at runtime, and all are the mechanism
    // under test.
    const globalFacts = http.globalAgent as unknown as { keepAlive?: boolean; keepAliveMsecs?: number };
    const freshFacts = new http.Agent() as unknown as { keepAlive?: boolean };
    record('A1', 'MEAS',
      `http.globalAgent.keepAlive=${globalFacts.keepAlive} keepAliveMsecs=${globalFacts.keepAliveMsecs} · ` +
      `new http.Agent().keepAlive=${freshFacts.keepAlive}`);
    // This is the pin the Round 280 §2 mechanism rests on and it was never pinned: `agent: false`
    // is documented as "a new Agent with default values will be used", so the repair only declines
    // to pool if a *fresh* Agent's `keepAlive` default is false while the global's is true. If a
    // future node flips the fresh default to true, `agent: false` silently stops being a fix and
    // every Round 280 figure goes stale with no red anywhere.
    check('A2', globalFacts.keepAlive === true && freshFacts.keepAlive === false,
      globalFacts.keepAlive === true && freshFacts.keepAlive === false
        ? 'the asymmetry the Round 280 repair depends on holds: globalAgent pools, a fresh Agent does not, so `agent: false` declines to pool'
        : `the asymmetry is GONE (global=${globalFacts.keepAlive}, fresh=${freshFacts.keepAlive}) — \`agent: false\` is no longer a no-pool switch and every Round 280 figure needs re-measuring`);
    check('A3', typeof (net.Socket.prototype as unknown as { resetAndDestroy?: unknown }).resetAndDestroy === 'function',
      'net.Socket#resetAndDestroy is available, so a genuinely abortive (RST) close is expressible and arm C2 is not a stub');
  }

  // ---- B: decomposition — which socket strands the raw net.Server? -----------------------------
  //
  // Round 280 F1 vs F2 differ by TWO things, not one. Four cells here isolate them: the HTTP half
  // alone (pre- and post-repair), the accept half alone, and both together as the library ships.
  const b1 = await cell('B1', 'HTTP half only, pooled (=F1)', (p) => answersHttpVariant(p, 'pooled-default'));
  const b2 = await cell('B2', 'HTTP half only, agent:false', (p) => portAnswersHttp(p));
  const b3 = await cell('B3', 'accept half ONLY, no request', (p) => portAcceptsAConnection(p));
  const b4 = await cell('B4', 'both, as shipped (=F2)', (p) => somethingIsAlreadyAnswering(p));

  check('B5', b1.outcome === 'hung',
    b1.outcome === 'hung'
      ? 'the pooled HTTP client strands the raw server: Round 280 F1 reproduces here'
      : `Round 280 F1 does NOT reproduce (got ${b1.outcome} in ${b1.ms} ms) — the baseline the repair was measured against has moved and must be re-established before anything below is trusted`);
  check('B6', b4.outcome === 'hung',
    b4.outcome === 'hung'
      ? 'Round 280 F2 reproduces: the shipped library still strands the raw-net.Server cell'
      : `Round 280 F2 does NOT reproduce (got ${b4.outcome} in ${b4.ms} ms) — the open cell closed for a reason other than this round, and that reason must be found before the cell is called fixed`);
  // The attribution check. This is the one the round exists for.
  record('B7', 'MEAS',
    `attribution: HTTP-half-alone(agent:false)=${b2.outcome} · accept-half-alone=${b3.outcome} · both=${b4.outcome}`);
  if (b2.outcome === 'hung' && b3.outcome === 'closed') {
    check('B8', true,
      'attributed to the HTTP half: `agent: false` alone still strands, the accept probe alone does not. Round 280 §5 aimed at the right socket, and the fourth variant (arms C) is the remedy to price');
  } else if (b2.outcome === 'closed' && b3.outcome === 'hung') {
    check('B8', true,
      'attributed to the ACCEPT half: the repaired HTTP request leaves nothing, and `portAcceptsAConnection` is what strands the server. Round 280 §5 named the wrong socket and the fourth variant would have fixed nothing — the remedy belongs in `connectSucceeds` (arm D), not in `portAnswersHttp`');
  } else if (b2.outcome === 'hung' && b3.outcome === 'hung') {
    check('B8', true,
      'BOTH halves strand independently — a one-socket remedy cannot close the cell, and Round 280 §5 understated the problem rather than misattributing it');
  } else {
    check('B8', false,
      `neither half strands alone (HTTP=${b2.outcome}, accept=${b3.outcome}) yet together they ${b4.outcome} — an interaction, and the fourth variant is not the shape of the remedy at all`);
  }

  // ---- C: the fourth variant on the HTTP half --------------------------------------------------
  //
  // FIN and RST as separate cells, because the difference decides arm E's cost. `destroy()` after
  // the body has been flushed is an orderly close; `resetAndDestroy()` is the genuinely abortive
  // one, and an abortive close is the exact mechanism Round 280 §6 found can kill an occupant.
  // If the orderly close is sufficient, the remedy is free of that hazard. If only the reset
  // works, the remedy re-arms §6 against every occupant that is not our own primitive.
  const c1 = await cell('C1', 'agent:false + FIN on end', (p) => answersHttpVariant(p, 'agent-false-fin'));
  const c2 = await cell('C2', 'agent:false + RST on end', (p) => answersHttpVariant(p, 'agent-false-rst'));
  // A remedy that closes the cell by breaking the answer is worthless — this is the trap Round 280
  // §1 caught in the original one-line framing, so the answer is measured separately from the
  // teardown, on a fresh server each time so the two questions cannot contaminate each other.
  const answerOnly = async (v: Variant): Promise<string | null> => {
    const h = tracedRawServer();
    const p = await listen(h.server);
    const a = await answersHttpVariant(p, v);
    h.hardTeardown();
    return a;
  };
  const c1Answer = await answerOnly('agent-false-fin');
  const c2Answer = await answerOnly('agent-false-rst');
  record('C3', 'MEAS',
    `answers under the two closes: FIN=${JSON.stringify(c1Answer)} RST=${JSON.stringify(c2Answer)}`);
  check('C4', c1Answer === 'HTTP 200',
    c1Answer === 'HTTP 200'
      ? 'the orderly (FIN) close preserves the guard\'s answer'
      : `the orderly close changed the ANSWER to ${JSON.stringify(c1Answer)} — disqualifying on its own`);
  // The RST cell's blindness is pinned as a CHECK ON THE DISQUALIFICATION, not as a red. It is a
  // measured property of a candidate that will not be adopted, and a probe that exits 1 forever is
  // a broken instrument. Two-sided: if a future node makes the abortive close survivable, this goes
  // red and somebody re-opens the variant on purpose rather than by accident.
  check('C5', c2Answer === null,
    c2Answer === null
      ? 'the abortive (RST) close is DISQUALIFIED for a second, worse reason than not working: the guard reports null — "nothing is answering" — about a server that answered 200. Same class as the Round 276 ENOTFOUND defect: a remedy that makes the describing half blind'
      : `the RST close no longer blinds the guard (answer=${JSON.stringify(c2Answer)}) — the reason this variant was disqualified has changed and the variant deserves re-pricing`);
  check('C6', c1.outcome === 'hung' && c2.outcome === 'hung',
    c1.outcome === 'hung' && c2.outcome === 'hung'
      ? `the fourth variant does NOT close the cell in either form (FIN -> hung in ${c1.ms} ms, RST -> hung in ${c2.ms} ms). Round 280 §5's two-part hypothesis, and Daedalus's Round 279 §7 instinct in its final form, are both dead: the raw-net.Server cell cannot be closed from the client half`
      : `a close DID settle the cell (FIN=${c1.outcome}, RST=${c2.outcome}) — the fourth variant is live after all and this round's conclusion must be rewritten`);

  // ---- D: the same two closes on the accept half -----------------------------------------------
  //
  // `connectSucceeds` closes its probe socket with `sock.destroy()` the instant `'connect'` fires —
  // which is before the server's connection handler has necessarily written anything. Both closes
  // measured here regardless of arm B's attribution, because "the accept probe is innocent" is a
  // claim that should rest on a row and not on a reading.
  const accept = (port: number, how: 'destroy' | 'reset'): Promise<boolean> =>
    new Promise((resolve) => {
      const sock = net.connect({ port, host: '127.0.0.1' });
      const done = (answer: boolean): void => {
        if (how === 'reset') sock.resetAndDestroy(); else sock.destroy();
        resolve(answer);
      };
      sock.setTimeout(1500, () => done(false));
      sock.once('connect', () => done(true));
      sock.once('error', () => done(false));
    });
  const d1 = await cell('D1', 'accept half, FIN (as shipped)', (p) => accept(p, 'destroy'));
  const d2 = await cell('D2', 'accept half, RST', (p) => accept(p, 'reset'));
  record('D3', 'MEAS', `accept-half closes: shipped-destroy -> ${d1.outcome}, reset -> ${d2.outcome}`);

  // ---- E: what an abortive close costs an occupant with no 'error' handler ----------------------
  //
  // Round 280 §6: an abortive close against a server that has already written bytes arrives as
  // ECONNRESET on the accepted socket, and an accepted socket with no `'error'` listener turns that
  // into an unhandled `'error'` event, which is fatal. Our own primitive now registers one — but
  // the 33 guard callers point at servers we do not own. So if arm C's RST is the remedy, this is
  // its price, and it is measured in a CHILD process rather than reasoned about, because in-process
  // it would end the table.
  {
    const dir = path.join('.testdata', 'r282');
    // Argus's Round 280 finding, applied here at the point of writing rather than after the fact.
    mkdirSync(dir, { recursive: true });
    for (const kind of ['no-handler', 'with-handler'] as const) {
      const childPath = path.join(dir, `arm-e-${kind}.mts`);
      const outPath = path.join(dir, `arm-e-${kind}-verdict.txt`);
      if (existsSync(outPath)) unlinkSync(outPath);
      // The verdict is written by a timer that fires AFTER the reset, not by any success path. That
      // is deliberate: what is being measured is whether this process is still alive 400 ms after
      // an abortive close arrived at an accepted socket. If an unhandled `'error'` kills it, the
      // timer never fires, there is no file, and the status is non-zero. A first version of this arm
      // exited on `req.once('error')` — and since the reset makes the client's own request error,
      // both cells reported `REQ-ERROR` and the arm measured the client rather than the occupant.
      const child = [
        "import * as net from 'node:net';",
        "import * as http from 'node:http';",
        "import { writeFileSync } from 'node:fs';",
        `const OUT = ${JSON.stringify(outPath)};`,
        'const notes: string[] = [];',
        'const server = net.createServer((socket) => {',
        kind === 'with-handler'
          ? "  socket.on('error', (e: NodeJS.ErrnoException) => notes.push(`server-socket-error:${e.code ?? 'ERR'}`));"
          : '  // deliberately no error handler: this is the Round 280 §6 hazard, re-armed by the remedy',
        "  socket.write('HTTP/1.1 200 OK\\r\\ncontent-length: 2\\r\\n\\r\\n[]');",
        '});',
        "server.listen(0, '127.0.0.1', () => {",
        '  const addr = server.address();',
        "  if (addr === null || typeof addr === 'string') { writeFileSync(OUT, 'NO-PORT'); process.exit(3); }",
        '  const req = http.request(',
        '    new URL(`http://127.0.0.1:${addr.port}/api/channels`),',
        "    { method: 'GET', timeout: 3000, agent: false },",
        '    (res) => {',
        "      res.once('end', () => {",
        '        const sock = res.socket;',
        "        if (sock) { sock.resetAndDestroy(); notes.push('client-reset-sent'); }",
        '        setTimeout(() => {',
        '          writeFileSync(OUT, `SURVIVED status=${res.statusCode} notes=${notes.join(",")}`);',
        '          server.unref();',
        '          server.close();',
        '          process.exit(0);',
        '        }, 400);',
        '      });',
        '      res.resume();',
        '    },',
        '  );',
        "  req.once('error', (e: NodeJS.ErrnoException) => notes.push(`client-req-error:${e.code ?? 'ERR'}`));",
        '  req.end();',
        '  // Backstop: if the response never ends at all, still report rather than hang the parent.',
        "  setTimeout(() => { writeFileSync(OUT, `NO-RESPONSE-END notes=${notes.join(',')}`); process.exit(5); }, 5000);",
        '});',
      ].join('\n');
      writeFileSync(childPath, child);
      // Status read from `spawnSync().status` directly — never through a pipe, which would report
      // the pipe's exit code instead of the child's.
      const run = spawnSync(process.execPath, ['--experimental-strip-types', childPath], {
        encoding: 'utf8',
        timeout: 20_000,
      });
      const verdict = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '(no file)';
      const reset = /ECONNRESET/.test(`${run.stderr ?? ''}`);
      record(kind === 'no-handler' ? 'E1' : 'E2', 'MEAS',
        `${kind.padEnd(13)} child status=${run.status} ECONNRESET-in-stderr=${reset} verdict-file=${JSON.stringify(verdict)}`);
    }
  }

  // ---- F: regression guard on the http.Server cell ---------------------------------------------
  //
  // Round 280 arm A4 pinned `agent: false` at 0 leftover sockets against an `http.Server`. Whatever
  // arms C/D recommend must not move that, and the guard belongs in the same run as the proposal.
  {
    const httpCell = async (v: Variant): Promise<{ answer: string | null; live: number; outcome: string; ms: number }> => {
      const sockets = new Set<net.Socket>();
      const server = http.createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('[]');
      });
      server.on('connection', (s) => {
        sockets.add(s);
        s.once('close', () => sockets.delete(s));
        // Same reason as `tracedRawServer`: an abortive close from the describing half must not be
        // able to kill this process. `http.Server` installs its own socket error handling, but this
        // arm must not depend on that to survive long enough to report.
        s.on('error', () => { /* Round 280 §6 */ });
      });
      const port = await listen(server);
      const answer = await answersHttpVariant(port, v);
      await sleep(50);
      let live = 0;
      for (const s of sockets) if (!s.destroyed) live += 1;
      const t0 = Date.now();
      let timer: NodeJS.Timeout | undefined;
      const outcome = await Promise.race([
        new Promise<'closed'>((r) => server.close(() => r('closed'))),
        new Promise<'hung'>((r) => { timer = setTimeout(() => r('hung'), 3000); }),
      ]);
      if (timer !== undefined) clearTimeout(timer);
      const ms = Date.now() - t0;
      for (const s of sockets) s.destroy();
      server.unref();
      server.close();
      return { answer, live, outcome, ms };
    };
    // The SHIPPED variant is what the regression check is about. Round 280 arm A4 pinned it at 0
    // leftover sockets; this re-pins it in the same run as the proposal, so a recommendation cannot
    // be made against a baseline nobody re-measured.
    const shipped = await httpCell('agent-false');
    record('F1', 'MEAS',
      `http.Server, SHIPPED (agent:false): answer=${JSON.stringify(shipped.answer)} live=${shipped.live} bare close(cb) -> ${shipped.outcome} in ${shipped.ms} ms`);
    check('F2', shipped.answer === 'HTTP 200' && shipped.live === 0 && shipped.outcome === 'closed',
      shipped.answer === 'HTTP 200' && shipped.live === 0 && shipped.outcome === 'closed'
        ? 'Round 280 A4 re-pinned independently of that round: the shipped guard answers 200, leaves 0 sockets, and the http.Server closes'
        : `the SHIPPED guard's http.Server cell has moved (answer=${JSON.stringify(shipped.answer)} live=${shipped.live} close=${shipped.outcome}) — Round 280 A4 no longer holds and that is a live regression, not a candidate's cost`);
    const rst = await httpCell('agent-false-rst');
    record('F3', 'MEAS',
      `http.Server, RST candidate: answer=${JSON.stringify(rst.answer)} live=${rst.live} bare close(cb) -> ${rst.outcome} in ${rst.ms} ms — the blindness of C5 is not confined to raw occupants; it is the http.Server family too, which is the family the guard actually points at in this repo`);
  }

  // ---- G: why the client's close never reaches the server --------------------------------------
  //
  // Arms C1/C2 both left the server's accepted socket with NO server-side events at all — not
  // `'end'`, not `'close'`, not `'error'` — for the whole 3 s budget. That is the fact that needs
  // explaining, because "the client closed its socket and the server did not notice" is not a thing
  // TCP does. Either the socket being closed is not the connection, or it is not being closed.
  // Instrumented from the client side rather than inferred.
  {
    const h = tracedRawServer();
    const port = await listen(h.server);
    const notes: string[] = [];
    await new Promise<void>((resolve) => {
      const req = http.request(
        new URL(channelsUrl(port)),
        { method: 'GET', timeout: 3000, agent: false },
        (res) => {
          res.once('end', () => {
            const sock = res.socket;
            notes.push(`at-end: res.socket=${sock === null ? 'null' : sock === undefined ? 'undefined' : 'present'}`);
            if (sock !== null && sock !== undefined) {
              notes.push(`before-destroy: destroyed=${sock.destroyed} readable=${sock.readable} writable=${sock.writable}`);
              sock.once('close', () => notes.push('client-socket-close-fired'));
              sock.destroy();
              notes.push(`after-destroy: destroyed=${sock.destroyed}`);
            }
            setTimeout(resolve, 600);
          });
          res.resume();
        },
      );
      req.once('error', (e: NodeJS.ErrnoException) => { notes.push(`req-error:${e.code ?? 'ERR'}`); resolve(); });
      req.end();
    });
    record('G1', 'MEAS', `client-side: ${notes.join(' | ')}`);
    record('G2', 'MEAS', `server-side 600 ms after the client destroyed its socket: ${h.trace() || 'STILL no events'} · live=${h.live()}`);
    // The headline of the whole round is in one field of G1: `writable=false` BEFORE the guard does
    // anything. The client's write side was already shut — node sent FIN when the response with
    // `Connection: close` completed — so a FIN was on the wire before any remedy could be applied.
    // There is no client-side close left to add: the thing the fourth variant was going to do had
    // already happened.
    const alreadyHalfClosed = notes.some((n) => n.startsWith('before-destroy:') && n.includes('writable=false'));
    check('G3', alreadyHalfClosed,
      alreadyHalfClosed
        ? 'the client had ALREADY closed its write side before the guard acted (`writable=false` at response end, with `agent: false`), so a FIN was on the wire before any remedy could be applied. The fourth variant was going to add a close that node had already performed — which is why neither form of it changed the outcome'
        : `the client socket was still writable at response end (${notes.join(' | ')}) — the mechanism below does not apply and arm H's diagnosis must be re-derived`);
    record('G4', 'MEAS',
      'so the open question is no longer "what should the client do" but "why does a FIN not close the server\'s accepted socket" — arm H, next');
    h.hardTeardown();
  }

  // ---- H: the decisive control — the server's READ side, not the client's write side -------------
  //
  // Hypothesis from arm G: the staged raw server never attaches a `'data'` listener and never calls
  // `resume()`, so its read stream is **paused**. A paused socket does not consume from the kernel
  // buffer, so the client's FIN is never read, `'end'` is never emitted, `allowHalfOpen: false`'s
  // automatic half-close never triggers, and the socket stays open forever. `server.close(cb)` waits
  // on it. If that is the mechanism, then ONE line on the SERVER closes the cell with no change to
  // the client at all — and the paired control below is the test, because the only difference
  // between the cells is `socket.resume()`.
  {
    const paired = async (readSide: 'paused' | 'resumed'): Promise<{ outcome: string; ms: number; trace: string }> => {
      const sockets = new Set<net.Socket>();
      const events: string[] = [];
      const server = net.createServer((socket) => {
        sockets.add(socket);
        socket.once('end', () => events.push('end'));
        socket.once('close', () => events.push('close'));
        socket.once('close', () => sockets.delete(socket));
        socket.on('error', (e: NodeJS.ErrnoException) => events.push(`error(${e.code ?? 'ERR'})`));
        socket.write('HTTP/1.1 200 OK\r\ncontent-length: 2\r\ncontent-type: application/json\r\n\r\n[]');
        // The entire variable.
        if (readSide === 'resumed') socket.resume();
      });
      const port = await listen(server);
      await portAnswersHttp(port);
      const t0 = Date.now();
      let timer: NodeJS.Timeout | undefined;
      const outcome = await Promise.race([
        new Promise<'closed'>((r) => server.close(() => r('closed'))),
        new Promise<'hung'>((r) => { timer = setTimeout(() => r('hung'), 3000); }),
      ]);
      if (timer !== undefined) clearTimeout(timer);
      const ms = Date.now() - t0;
      const trace = events.join(' ');
      for (const s of sockets) s.destroy();
      server.unref();
      server.close();
      return { outcome, ms, trace };
    };
    const paused = await paired('paused');
    const resumed = await paired('resumed');
    record('H1', 'MEAS', `raw server, read side PAUSED   (as staged in Round 280 arm F): bare close(cb) -> ${paused.outcome} in ${paused.ms} ms [${paused.trace || 'no events'}]`);
    record('H2', 'MEAS', `raw server, read side RESUMED  (one added line): bare close(cb) -> ${resumed.outcome} in ${resumed.ms} ms [${resumed.trace || 'no events'}]`);
    check('H3', paused.outcome === 'hung' && resumed.outcome === 'closed',
      paused.outcome === 'hung' && resumed.outcome === 'closed'
        ? `diagnosed, and the shipped guard is exonerated: the ONLY difference between these two cells is one \`socket.resume()\` on the SERVER. Paused, the client's FIN is never read, \`'end'\` never fires, and \`close(cb)\` waits forever. Resumed, the same shipped guard against the same server closes in ${resumed.ms} ms with the trace [${resumed.trace}]. The Round 278 pair is NOT (server that never finishes) x (client that will not FIN back) — the client FINs before the guard even resolves. It is (server that never READS) x (nothing). A one-factor hazard, and the factor is not ours`
        : `the read side is NOT the variable (paused=${paused.outcome}, resumed=${resumed.outcome}) — arm G's hypothesis is wrong and the hang is still unexplained`);
  }

  // ---- I: why the abortive close was both ineffective AND blinding ------------------------------
  //
  // Arm E's children both reported `client-req-error:EINVAL`, which is the missing half of C5. A
  // socket whose write side is already shut cannot be reset — `resetAndDestroy()` needs to *send*
  // something. So the RST never reached the wire (hence no effect) and the EINVAL surfaced on the
  // request as an `'error'`, which `portAnswersHttp`'s error arm turns into `null` (hence blind).
  // Both halves of C5 from one cause. Pinned with a control on a socket that IS still writable, so
  // "EINVAL because not writable" rests on a contrast and not on a reading.
  {
    // First version of this arm read `sock.writable` AFTER the reset, so both cells printed
    // `writable=false` and the contrast it existed to draw was invisible. It also resolved
    // synchronously, before an asynchronous `'error'` could arrive. Both corrected: the state is
    // sampled before the call, and the cell waits for the error window to pass.
    const resetOutcome = (stage: 'writable' | 'half-closed'): Promise<string> =>
      new Promise((resolve) => {
        const h = tracedRawServer();
        void listen(h.server).then((port) => {
          const sock = net.connect({ port, host: '127.0.0.1' });
          const errs: string[] = [];
          sock.on('error', (e: NodeJS.ErrnoException) => errs.push(e.code ?? 'ERR'));
          const doReset = (): void => {
            const writableBefore = sock.writable;
            let threwSync = '';
            try {
              sock.resetAndDestroy();
            } catch (e) {
              threwSync = (e as NodeJS.ErrnoException).code ?? 'ERR';
            }
            // The error, if any, is emitted asynchronously — wait for it rather than racing it.
            setTimeout(() => {
              h.hardTeardown();
              resolve(
                `writable-before-reset=${writableBefore} sync-throw=${threwSync || 'none'} ` +
                `async-errors=[${errs.join(',') || 'none'}] server-side=[${h.trace() || 'no events'}]`,
              );
            }, 200);
          };
          sock.once('connect', () => {
            sock.write('GET /api/channels HTTP/1.1\r\nhost: x\r\n\r\n');
            // Shut our write side first in the half-closed cell, exactly as node's client has done
            // by the time `res` emits `'end'` with `agent: false`.
            if (stage === 'half-closed') { sock.end(); setTimeout(doReset, 100); } else { doReset(); }
          });
        });
      });
    const w = await resetOutcome('writable');
    const hc = await resetOutcome('half-closed');
    record('I1', 'MEAS', `resetAndDestroy() on a socket still writable:            ${w}`);
    record('I2', 'MEAS', `resetAndDestroy() on a socket already shut for writing:  ${hc}`);
    // What this contrast establishes, and what it does not. It establishes the EFFECT: the reset
    // reaches the wire from a writable socket and does not from one already shut. It does NOT
    // establish the errno — the shut-socket reset fails **silently** here, with no synchronous throw
    // and no asynchronous `'error'` on the socket at all.
    const reachesWireWhenWritable = /error\(/.test(w) && !/error\(/.test(hc);
    check('I3', reachesWireWhenWritable,
      reachesWireWhenWritable
        ? `the effect tracks writability, on a contrast rather than a reading: from a writable socket the reset reaches the wire and kills the paused server socket (${w.replace(/^.*server-side=/, 'server-side=')}), and from a socket already shut for writing it reaches nothing. So the fourth variant fails because the close is UNREACHABLE by the time the guard can act, not because an abortive close would not work — which is a sharper and more useful negative than "it does not work"`
        : `the reset's effect does not track writability in this control (writable-cell=${w} · shut-cell=${hc}) — the mechanism proposed for C2/C5 is not established and stays a hypothesis`);
    // The errno, explicitly NOT claimed. Arm E's two children both reported `client-req-error:EINVAL`
    // on the *request* object; this arm's bare-socket control produced no errno at all. Different
    // surfaces, and I am not merging them. There is also a standing unexplained EINVAL in this repo
    // — Round 275, `setTypeOfService EINVAL`, which Daedalus explicitly declined to claim the errno
    // for — but that one is on undici's stack and arm E's is on node's `http`, so they are not
    // assumed to be the same thing either. Recorded as an observation with its provenance, not as a
    // finding.
    record('I4', 'MEAS',
      'EINVAL: observed twice on the request object in arm E, produced zero times by this arm\'s ' +
      'bare-socket control. This probe does NOT explain the errno and does not merge it with the ' +
      'open Round 275 `setTypeOfService EINVAL` (different stack: node `http` vs undici). Open.');
    record('I5', 'MEAS',
      `paused-server kill confirmed from the writable side: ${w} — so a RST does close the Round 280 F2 cell; the guard simply has no writable socket left with which to send one`);
  }

  const failed = rows.filter((r) => r.outcome === 'FAIL');
  const passed = rows.filter((r) => r.outcome === 'PASS');
  const meas = rows.filter((r) => r.outcome === 'MEAS');
  console.log(`\n${passed.length} check(s) passed · ${failed.length} failed · ${meas.length} measurement(s)`);
  for (const r of meas) console.log(`[MEAS] ${r.id}  ${r.text}`);
  if (failed.length > 0) {
    for (const r of failed) console.log(`[FAIL] ${r.id}  ${r.text}`);
    process.exit(1);
  }
}

main().then(
  () => process.exit(0),
  (err: unknown) => { console.error('THREW —', err); process.exit(2); },
);
