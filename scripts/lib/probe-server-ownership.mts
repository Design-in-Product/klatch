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
 * dual-stack `::` listener, the `0.0.0.0` listener, and the IPv4 loopback-only listener alike.
 * It does not care whether the occupant ever answers.
 *
 * ## The matrix above has a fourth occupant, and it defeated BOTH sides (Round 273)
 *
 * Until Round 273 this section read *"one test, no misses in the matrix above"* — and that was
 * true of the matrix above, which is the problem: it enumerates three occupants and the fourth
 * is the miss. Measured this worktree, 2026-09-25, `darwin`, node v26.5.0:
 *
 * ```
 * occupant        connect 127.0.0.1   connect ::1   bind 127.0.0.1   bind wildcard
 * ::1 only        ECONNREFUSED ✗      ACCEPTED      FREE ✗           FREE ✗
 * ```
 *
 * A listener on IPv6 loopback alone is invisible to a connect aimed at `127.0.0.1`, and — the
 * part that made this more than a docstring bug — it is **also invisible to the wildcard bind**,
 * because a wildcard `::` bind does not collide with a bound `::1`. So both sides of
 * {@link somethingIsAlreadyAnswering} read clear, it returned `null`, and
 * {@link requireAnUnoccupiedPort} let the probe through to bind a server beside a stranger's.
 * The independent-second-side design did not save this case; nothing did.
 *
 * `portAcceptsAConnection` now tries **both loopback families in parallel** and accepts either.
 * `localhost` alone would also have worked (it resolved to an ACCEPTED connect against all four
 * occupants) but it makes the guard depend on `/etc/hosts` and on node's happy-eyeballs default,
 * so the two addresses are named explicitly instead.
 *
 * **Not established:** whether any process on this fleet actually binds `::1` alone. Klatch's
 * own server binds `::` via `serve({ fetch, port })` and every leaked probe server inherits that,
 * so the hole was latent rather than live. It is closed on the strength of the measurement, not
 * of a sighting.
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
import http from 'http';
import fs from 'fs';
import type { ChildProcess } from 'child_process';

/** Every Klatch server mounts this; probes disagree about `BASE`, so derive it from the port. */
export function channelsUrl(port: number): string {
  return `http://127.0.0.1:${port}/api/channels`;
}

/** One family's worth of {@link portAcceptsAConnection}. */
function connectSucceeds(port: number, host: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host });
    const done = (answer: boolean) => { sock.destroy(); resolve(answer); };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
  });
}

/**
 * "does a connection succeed here?" — the primary test. Reaches any listener on the port
 * regardless of the address it bound; see the matrix in the module comment for why that is
 * the property a bind test cannot supply.
 *
 * Round 273: **both** loopback families, in parallel. Aimed at `127.0.0.1` alone this returned
 * `false` against a listener bound to `::1`, and the wildcard second side missed that occupant
 * too, so `requireAnUnoccupiedPort` let a probe through onto an occupied port. Parallel rather
 * than sequential so the worst case stays one `timeoutMs` rather than two; a genuinely clear port
 * costs nothing either way, because it refuses immediately instead of timing out.
 */
export function portAcceptsAConnection(port: number, timeoutMs = 1500): Promise<boolean> {
  return Promise.all([
    connectSucceeds(port, '127.0.0.1', timeoutMs),
    // A machine with no IPv6 loopback errors immediately here, which is a correct `false`.
    connectSucceeds(port, '::1', timeoutMs),
  ]).then((answers) => answers.some(Boolean));
}

/**
 * "can `packages/server` bind here?" — the independent second side. Binds the **wildcard**,
 * which is what `serve({ fetch, port })` does, so this asks the child's own question. Kept
 * for the case a connect cannot see: a socket bound but not listening.
 *
 * Round 273, on how much this second side actually buys: it is narrower than "whatever the
 * connect misses." A wildcard bind does NOT collide with a listener on `::1`, so before the
 * connect was widened to both families this function agreed with the wrong answer rather than
 * correcting it. Two sides that can go blind to the same occupant are one side.
 */
export function aWildcardBindWouldSucceed(port: number, closeBudgetMs = 3000): Promise<boolean> {
  const { server, closeBounded } = trackedNetServer();
  return new Promise((resolve) => {
    let settled = false;
    const done = (answer: boolean) => { if (!settled) { settled = true; resolve(answer); } };
    server.once('error', () => done(false));
    server.once('listening', () => {
      // The answer is already known here — the bind succeeded. Cleanup follows, bounded, and
      // cannot withhold it: see `trackedNetServer` for the measurement that made this necessary.
      void closeBounded(closeBudgetMs).then(() => done(true));
    });
    server.listen(port);
  });
}

/**
 * A `net.Server` whose accepted sockets are tracked, and a teardown that cannot hang.
 *
 * ## Round 277: `net.createServer()` with no connection handler still ACCEPTS
 *
 * Theseus, Round 276 §5, found that `await new Promise((r) => server.close(() => r()))` never
 * settles while a connection is outstanding — the event loop drains and node exits **0**, which
 * is the one failure a probe cannot see, because a truncated transcript reads exactly like a
 * finished one. He flagged 7 candidate sites and did not drive 6 of them.
 *
 * Driven here (`.testdata/r277/measure2.mjs`, `measure3.mjs`, node v26.5.0, darwin; the first
 * replica needed a server-side `connection` barrier — without it `close()` reads `_connections`
 * as 0 because the client's `connect` fires a loop turn before the server accepts, and every row
 * came back FIRED):
 *
 * ```
 * occupant                                          live  close(cb)
 * net.Server  c.end()  (half-close)                  1    FIRED  0ms   <- disagrees with his table
 * net.Server  c.destroy()                            0    FIRED  0ms
 * net.Server  silent (no reply)                      1    HUNG   (his row, reproduced)
 * net.createServer() with NO handler                 1    HUNG   <- this function's own shape
 * http.Server answering 200, contacted by fetch      1    FIRED  1ms
 * http.Server answering 200, via http.request        1    FIRED  0ms
 * http.Server + raw connect, client left open        1    FIRED  0ms
 * http.Server whose handler NEVER responds           1    HUNG
 * DEFAULTS: keepAliveTimeout=5000 headersTimeout=60000 requestTimeout=300000
 * ```
 *
 * Two corrections to the class fall out of that table, and both matter more than the fix:
 *
 * 1. **The discriminator is not "awaits `close(cb)` without tracking sockets."** Every
 *    `http.Server` row FIRED, including with a live connection, because node ≥19's
 *    `Server.close()` reaps *idle* keep-alive sockets. The exposing property is "can hold a
 *    connection it will never finish": any `net.Server` (nothing reaps its sockets), or an
 *    `http.Server` with a handler that can fail to respond. An `http.Server` that always
 *    responds is safe.
 *
 *    **Round 282 sharpens the parenthetical, which was the mechanism stated too loosely.** It is
 *    not that nothing reaps a `net.Server`'s sockets — node reaps them fine when the client
 *    closes, via `allowHalfOpen: false`. It is that a socket whose read side is **paused** never
 *    consumes the client's FIN, so `'end'` never fires and the automatic half-close never runs.
 *    That unifies rows 3 and 4 of the table above (`silent (no reply)` and `NO handler`, both
 *    HUNG) under one cause rather than two observations: neither ever reads. A connection handler
 *    that calls `socket.resume()` is not exposed at all — measured as a paired control in
 *    `probe-round282` arm H (paused -> hung 3003 ms, one added `resume()` -> closed 1 ms).
 * 2. **`net.createServer()` with no `connection` listener is not inert.** It accepts, and the
 *    socket then has no owner and no reaper. That is the shape of the *old, deliberately broken*
 *    bind guard this module exists to replace — and it was still the shape of this module's own
 *    second side.
 *
 * Why this placement is the worst one in the repo: `aWildcardBindWouldSucceed` is awaited by
 * `somethingIsAlreadyAnswering` → `requireAnUnoccupiedPort`, which is the pre-flight of every
 * probe on this library. It is reached **only** on the branch where nothing accepts a connection
 * — the port-looks-clear case — so a connect landing inside its bind window would hang the
 * pre-flight and the probe would exit 0 having graded nothing.
 *
 * **Latent, not sighted.** A hammer firing a connect every 1 ms landed **0** connects inside the
 * live window (`measure3.mjs` row X2, which resolved `true` in 1 ms). The bind window is shorter
 * than the interval I could drive it at; that is a failure to catch it, not evidence it cannot
 * happen.
 */
export function trackedNetServer(
  onConnection: (socket: net.Socket) => void = (socket) => socket.destroy(),
): { server: net.Server; closeBounded: (budgetMs?: number) => Promise<'closed' | 'hung'> } {
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
    // Round 280 (Theseus): this `'error'` handler is load-bearing, and its absence killed a probe
    // outright before it printed a row. `portAcceptsAConnection` above closes its probe socket with
    // `sock.destroy()` — an abortive close. Against a server that has already *written* bytes, that
    // arrives server-side as ECONNRESET on the accepted socket; an accepted socket with no `'error'`
    // listener turns that into an unhandled `'error'` event, which is fatal to the process.
    //
    // So this is the property at `portAnswersHttp`'s doc comment — "the describing half of an
    // ownership guard must not be able to kill the process it is describing from" — failing by a
    // second mechanism. Round 275 established it for a throw out of `fetch`; this is an unhandled
    // event on the described server's own socket. Reproduced in a child process both ways
    // (`probe-round280` arm I): without the handler, status 1 and the table never finishes; with it,
    // status 0 and the same guard returns the same verdict.
    //
    // **Latent, not live, at the time of writing:** 0 of this function's callers pass an
    // `onConnection` that writes bytes, and the default (`socket.destroy()`) writes nothing — which
    // is why nothing has hit it. Fixed in the primitive rather than in the callers, because the
    // first caller that answers a request is the one that would find out.
    socket.on('error', () => { /* an occupant's socket erroring is not this primitive's failure */ });
    onConnection(socket);
  });
  const closeBounded = async (budgetMs = 3000): Promise<'closed' | 'hung'> => {
    for (const socket of sockets) socket.destroy();
    let timer: NodeJS.Timeout | undefined;
    const outcome = await Promise.race([
      new Promise<'closed'>((r) => server.close(() => r('closed'))),
      new Promise<'hung'>((r) => { timer = setTimeout(() => r('hung'), budgetMs); }),
    ]);
    if (timer !== undefined) clearTimeout(timer);
    // `unref` rather than throw: this is a cleanup primitive, and a cleanup that throws replaces
    // one unreadable outcome with another. The caller gets the word `hung` and decides.
    if (outcome === 'hung') server.unref();
    return outcome;
  };
  return { server, closeBounded };
}

/**
 * "is anyone answering here?" — used to describe an occupant, never to decide there isn't one.
 *
 * Round 275: `http.request`, NOT `fetch`. This function's whole contract is "never throws, says
 * `null` when it cannot tell", and on `fetch` that contract was **false**. Node's bundled undici
 * calls `socket.setTypeOfService(request.typeOfService)` unconditionally in `writeH1`
 * (`internal/deps/undici/undici:7972–7974`; the default is `0`, line 2876), and node's
 * `Socket.prototype.setTypeOfService` **throws** on any non-zero libuv return outside Windows.
 * undici does not wrap that call, so the throw leaves the write path as an **uncaughtException**
 * — not a rejected promise. Driven: with that call forced to fail, the `await` here does not
 * reject with the cause at all; it hangs until the abort budget and this function returns
 * **`null`**, i.e. reports "nothing is answering" about a port that answers `200`, while the
 * process dies through a completely different channel. A `try/catch` cannot reach it, because
 * the throw was never on this stack.
 *
 * `http.request` does not touch that option. Same three outcomes, same budget, measured:
 * live server `HTTP 200` in 6 ms · silent occupant `null` at the budget · empty port `null` in
 * 4 ms. The describing half of an ownership guard must not be able to kill the process it is
 * describing from.
 */
export function portAnswersHttp(port: number, timeoutMs = 3000): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (answer: string | null) => { if (!settled) { settled = true; resolve(answer); } };
    // Built FROM `channelsUrl`, not beside it: the address this asks about must stay the address
    // the rest of the module names, or the two drift and only one of them is under test.
    //
    // Round 276 (Theseus): passed as a URL **object**, not decomposed into `{ host, port, path }`.
    // The decomposition was correct for today's `channelsUrl` and silently wrong for the address
    // family this module spent Rounds 273–275 learning to see. Measured:
    // `new URL('http://[::1]:P/').hostname` is `'[::1]'` — node keeps the brackets — and
    // `http.request({ host: '[::1]' })` fails **ENOTFOUND**, so this function would return `null`
    // ("nothing is answering") about a server answering 200. Driven against a live `::1` server:
    // `host: url.hostname` -> ENOTFOUND · `host: '::1'` -> 200 · `http.request(urlObject)` -> 200.
    //
    // That mattered because the whole point of building this FROM `channelsUrl` is that it follows
    // `channelsUrl` if `channelsUrl` changes — and the one change anybody would plausibly make to it
    // is the one that broke it. Single-sourcing the address does not help if the transport then
    // takes the address apart. No behaviour change on `127.0.0.1`; verified in the gate below.
    //
    // Round 280 (Theseus): `agent: false`. Daedalus's Round 279 §7 asked whether this request
    // should `destroy()` its socket rather than `end()` it. It cannot — `req.end()` is what *sends*
    // the request, and a GET with no body still needs it; without it the guard asks nothing and
    // every port reads as silent. The real hazard is one line later and it is the same one: on this
    // node `http.globalAgent.keepAlive` is `true` with a 5 s timeout, so after a successful answer
    // this request **pooled** its socket and left it open to the server it had just described.
    // Measured, `probe-round280`:
    //
    //   live server-side sockets, immediately after the guard resolves   1
    //   unattended lifetime of that socket                               ~4002 ms
    //   with `agent: false`                                              0
    //   with `req.destroy()` once the response has ended                 1   <- §7's instinct, and it does not work
    //
    // `destroy-on-end` fails because by then the socket has been released to the agent's free pool
    // and the request object no longer owns it. Only declining to pool leaves nothing behind.
    //
    // It mattered: a bare `net.Server` occupant that has written bytes, torn down with a bare
    // `close(cb)`, **hung** (3002 ms budget, exhausted) purely because of the socket this guard left
    // behind. An `http.Server` is NOT exposed — it reaps its own idle keep-alive sockets, closing in
    // 0–1 ms — so the blast radius was the `net.Server` family, which is why `trackedNetServer`
    // exists. Cost of the fix: none measurable. The answer is still `HTTP 200`; a one-shot guard has
    // no reuse to lose.
    //
    // Round 282 (Theseus) — **correcting Round 280's own explanation of the cell it left open.**
    // Round 280 §5 recorded that `agent: false` does not close the raw-`net.Server` cell and
    // explained it as *"a raw `net.Server` that writes a response and ignores headers keeps its side
    // open whatever the client does short of an abortive close."* **That explanation is wrong, and
    // the remedy it implied is dead.** Measured (`probe-round282`, 12 checks · 0 failed):
    //
    //   - By the time `res` emits `'end'` with `agent: false`, this client's socket is **already
    //     half-closed** (`writable=false`): node put a FIN on the wire when the `Connection: close`
    //     response completed. There was never a client-side close left to add — the fourth variant
    //     was going to perform an action node had already performed.
    //   - The reason the server's accepted socket does not notice that FIN is that it is **never
    //     read**. A `net.Server` connection handler that writes and does not `resume()` (or attach a
    //     `'data'` listener) leaves its read stream paused, so the FIN is never consumed, `'end'`
    //     never fires, `allowHalfOpen: false`'s automatic half-close never triggers, and
    //     `close(cb)` waits forever. One added `socket.resume()` on the SERVER closes the same cell
    //     in 1–2 ms against this unchanged guard (arm H, paired control: paused -> hung 3003 ms,
    //     resumed -> closed 1 ms, trace `[end]`).
    //   - So the Round 278 pair is **not** (server that never finishes) x (client that will not FIN
    //     back). The client FINs before the guard resolves. It is (server that never READS) x
    //     (nothing) — a one-factor hazard, and the factor is the occupant's, not this module's.
    //
    // **Do not add an abortive close here.** Measured: `res.socket.resetAndDestroy()` at response end
    // reaches the wire not at all (the socket's write side is already shut) and makes this function
    // return `null` — "nothing is answering" — about a server that answered 200, on both the raw and
    // the `http.Server` family. That is the Round 276 ENOTFOUND defect class again: a remedy that
    // blinds the describing half. A RST *would* close the cell if one could be sent (arm I1: from a
    // still-writable socket it kills the paused server socket, EPIPE + close); the guard simply has
    // no writable socket left by the time it has an answer.
    const req = http.request(
      new URL(channelsUrl(port)),
      { method: 'GET', timeout: timeoutMs, agent: false },
      (res) => { res.resume(); done(`HTTP ${res.statusCode}`); },
    );
    // Both arms resolve rather than reject: absence of an answer is this function's `null`, and
    // an occupant that accepts and never speaks is the case the budget exists for.
    req.once('timeout', () => { req.destroy(); done(null); });
    req.once('error', () => done(null));
    req.end();
  });
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
 * Reap the child on every exit path, not just the happy one — a probe that dies without
 * reaping leaves a server that the next probe then grades.
 *
 * The Round 221 incident was recorded here as "the pipe closed, node took SIGPIPE, and the
 * probe's own `shutdown()` never ran." **That account does not reproduce** (measured Round 230,
 * confirmed Round 231): on this node a closed stdout pipe raises an uncaught `EPIPE`, not a
 * signal death, and `exit` listeners *do* run. Mechanism not established; the likeliest
 * candidate is that the leaking probe was one of the seven that had no handler at all.
 *
 * The signal is SIGTERM, not SIGKILL, and that is the whole remedy (Round 231, Theseus).
 * `getChild()` returns what `spawn('npx', ['tsx', …])` handed back — an `npm exec` shim, two
 * processes above the socket. A shim forwards a signal by catching it and re-sending it, and
 * SIGKILL is the one signal that cannot be caught: the shim died instantly and the listener
 * below it was orphaned holding the port. Measured, same code otherwise: SIGKILL → still
 * answering after 8000 ms; SIGTERM → quiet after ~256 ms. If SIGKILL's guarantee is ever
 * wanted here, the target has to be the descendant set or the process group, never the handle.
 *
 * Takes a getter, not a child: restart-based probes replace `server` several times per run.
 */
export function reapOnExit(getChild: () => ChildProcess | undefined): void {
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE'] as const) {
    process.on(sig, () => {
      const c = getChild();
      if (c && c.exitCode === null) c.kill('SIGTERM');
      process.exit(130);
    });
  }
  process.on('exit', () => {
    const c = getChild();
    if (c && c.exitCode === null) c.kill('SIGTERM');
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
    // Round 275: `portAnswersHttp`, not a second `fetch` of its own. This poll ran the undici
    // write path once every 250 ms for as long as a server took to boot — far more first-writes
    // than the describer ever made, and with the same `catch { }` that cannot catch a throw
    // raised off this stack. Sharing the one implementation is also the Round 222 lesson applied
    // inside the module that Round 222 produced: a second copy of an HTTP call in the same file
    // is still a second copy.
    if (booted) {
      const answer = await portAnswersHttp(port, 2000);
      if (answer !== null && /^HTTP 2\d\d$/.test(answer)) return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '(no log)';
  throw new Error(`server did not come up on ${port} in ${timeoutMs / 1000} s — see ${logPath}\n${log}`);
}
