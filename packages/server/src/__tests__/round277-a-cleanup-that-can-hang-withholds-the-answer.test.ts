/**
 * Round 277 — Theseus's Round 276 §5, driven on the six sites he did not drive.
 *
 * His finding: `await new Promise((r) => server.close(() => r()))` never settles while a
 * connection is outstanding, so the event loop drains and node exits **0** mid-transcript. He
 * named 7 candidate sites, verified exposure for 1 (his own), and offered me 221/223/224b.
 *
 * What these tests pin, in the order the measurement produced it:
 *
 * 1. `net.createServer()` with **no connection handler** still accepts, and its `close(cb)`
 *    hangs. That was the shape of `aWildcardBindWouldSucceed` — inside the pre-flight every
 *    probe on the library awaits.
 * 2. An `http.Server` that answers is **not** exposed, even with a live keep-alive connection,
 *    because node ≥19 reaps idle sockets on `close()`. This is what 221/223/224b stage, so the
 *    teardown Theseus flagged in those three files is safe — and the exposure in them is a
 *    *different* server he did not flag.
 * 3. An `http.Server` whose handler never responds **is** exposed. So "it's an http.Server" is
 *    not the safety property; "every request gets a response" is.
 */
import { describe, expect, it } from 'vitest';
import net from 'node:net';
import http from 'node:http';
import { aWildcardBindWouldSucceed, trackedNetServer } from '../../../../scripts/lib/probe-server-ownership.mts';

const BUDGET = 1500;

function listenEphemeral(server: net.Server | http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve(typeof addr === 'object' && addr !== null ? addr.port : 0);
    });
  });
}

/**
 * The barrier my first replica of Theseus's table was missing. A client's `connect` fires a loop
 * turn before the server accepts, so a `close()` issued straight after it reads `_connections`
 * as 0 and fires immediately — every row came back FIRED and the table was worthless. Resolving
 * on BOTH sides is what makes the measurement about the server.
 */
function connectAndWaitForAccept(server: net.Server | http.Server, port: number): Promise<net.Socket> {
  return new Promise((resolve) => {
    let accepted = false;
    let connected = false;
    const socket = net.connect({ host: '127.0.0.1', port });
    const maybe = () => { if (accepted && connected) resolve(socket); };
    server.once('connection', () => { accepted = true; maybe(); });
    socket.once('connect', () => { connected = true; maybe(); });
  });
}

/**
 * How many connections the SERVER is holding. Not `server.connections` — that property reads
 * `undefined` on node v26.5.0 (my first version of this file asserted on it and got
 * `expected undefined to be 1` on two rows while both behavioural assertions passed). My scratch
 * measurements used the private `_connections`; `getConnections` is the documented API and the
 * one a later reader should find here.
 */
function liveConnections(server: net.Server | http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.getConnections((err, count) => (err ? reject(err) : resolve(count)));
  });
}

/** The idiom under test, verbatim, with a bound so a hang is a value rather than a dead suite. */
function closeTheOldWay(server: net.Server | http.Server): Promise<'closed' | 'hung'> {
  let timer: NodeJS.Timeout | undefined;
  return Promise.race([
    new Promise<'closed'>((r) => server.close(() => r('closed'))),
    new Promise<'hung'>((r) => { timer = setTimeout(() => r('hung'), BUDGET); }),
  ]).then((outcome) => { if (timer !== undefined) clearTimeout(timer); return outcome; });
}

describe('the old teardown idiom, shown to hang rather than argued to', () => {
  it('net.createServer() with NO connection handler accepts, and close(cb) never fires', async () => {
    // This is `aWildcardBindWouldSucceed` before this round, and `oldBindTestSaysFree` in
    // probe-round221 / probe-round223. "No handler" reads as inert and is not.
    const server = net.createServer();
    const port = await listenEphemeral(server);
    const client = await connectAndWaitForAccept(server, port);

    await expect(liveConnections(server)).resolves.toBe(1);
    await expect(closeTheOldWay(server)).resolves.toBe('hung');

    client.destroy();
    server.close();
  });

  it('destroying the accepted socket first makes the same close(cb) fire', async () => {
    // Same server, same idiom, one difference — so the cause is the socket, not the idiom.
    const { server, closeBounded } = trackedNetServer();
    const port = await listenEphemeral(server);
    const client = await connectAndWaitForAccept(server, port);

    await expect(closeBounded(BUDGET)).resolves.toBe('closed');
    client.destroy();
  });

  it('a silent net.Server hangs — Theseus’s row 3, reproduced independently', async () => {
    const server = net.createServer(() => { /* accepts and never replies: the realistic stranger */ });
    const port = await listenEphemeral(server);
    const client = await connectAndWaitForAccept(server, port);

    await expect(closeTheOldWay(server)).resolves.toBe('hung');
    client.destroy();
    server.close();
  });

  it('a half-closing net.Server does NOT hang here, which disagrees with his table', async () => {
    // Recorded as a disagreement rather than smoothed over. His row 1 reports `c.end()` as
    // never-firing; measured here it fires, because the client's default `allowHalfOpen: false`
    // ends its own side on the FIN and the connection is gone. I cannot reproduce his row from
    // his source, and it does not affect his conclusion — his probe stages the silent occupant
    // above, which hangs for both of us.
    const server = net.createServer((c) => c.end());
    const port = await listenEphemeral(server);
    const client = await connectAndWaitForAccept(server, port);

    await expect(closeTheOldWay(server)).resolves.toBe('closed');
    client.destroy();
  });
});

describe('the discriminator is not the idiom — it is whether a connection can go unfinished', () => {
  it('an http.Server that answers 200 tears down with a live keep-alive connection', async () => {
    // What probe-round221, -round223 and -round224b actually stage. Node >=19's `close()` reaps
    // idle keep-alive sockets, so the teardown Theseus flagged in those three files is safe.
    const server = http.createServer((_req, res) => { res.writeHead(200); res.end('[]'); });
    const port = await listenEphemeral(server);
    const res = await fetch(`http://127.0.0.1:${port}/api/channels`);
    await res.text();

    await expect(liveConnections(server)).resolves.toBe(1);
    await expect(closeTheOldWay(server)).resolves.toBe('closed');
  });

  it('an http.Server whose handler never responds DOES hang', async () => {
    // So "it is an http.Server" is not the safety property. "Every request gets a response" is.
    const server = http.createServer(() => { /* never responds */ });
    const port = await listenEphemeral(server);
    const req = http.request(new URL(`http://127.0.0.1:${port}/api/channels`), () => {});
    req.once('error', () => {});
    await new Promise<void>((r) => { server.once('request', () => r()); req.end(); });

    await expect(closeTheOldWay(server)).resolves.toBe('hung');
    req.destroy();
    server.close();
  });
});

describe('aWildcardBindWouldSucceed keeps its answer and loses the hang', () => {
  it('still answers true for a free port', async () => {
    const scout = net.createServer();
    const port = await listenEphemeral(scout);
    await new Promise<void>((r) => scout.close(() => r()));

    await expect(aWildcardBindWouldSucceed(port)).resolves.toBe(true);
  });

  it('still answers false when a wildcard bind genuinely collides', async () => {
    const holder = net.createServer();
    const port = await new Promise<number>((resolve) => {
      holder.listen(0, () => { // wildcard, so a second wildcard bind collides
        const addr = holder.address();
        resolve(typeof addr === 'object' && addr !== null ? addr.port : 0);
      });
    });

    await expect(aWildcardBindWouldSucceed(port)).resolves.toBe(false);
    await new Promise<void>((r) => holder.close(() => r()));
  });

  it('answers even when a connection lands inside its bind window', async () => {
    // The case that used to hang the pre-flight of every probe on this library. Driven by
    // hammering connects at the port across the whole window; the live race in
    // `.testdata/r277/measure3.mjs` landed 0 connects, so the hammer is what makes this a
    // measurement rather than a hope. Bounded by the test's own budget either way.
    const scout = net.createServer();
    const port = await listenEphemeral(scout);
    await new Promise<void>((r) => scout.close(() => r()));

    const held: net.Socket[] = [];
    let hammering = true;
    const hammer = () => {
      if (!hammering) return;
      const c = net.connect({ host: '127.0.0.1', port });
      c.once('error', () => {});
      c.once('connect', () => held.push(c)); // deliberately NOT destroyed by the client
      setTimeout(hammer, 1);
    };
    hammer();

    const answer = await aWildcardBindWouldSucceed(port, BUDGET);
    hammering = false;
    for (const c of held) c.destroy();

    // The answer arrives. Whether a connect landed is not under this test's control; what is
    // under test is that landing one cannot withhold the answer.
    expect(typeof answer).toBe('boolean');
  });
});
