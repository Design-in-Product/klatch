/**
 * Round 276 — the address census, made runnable; and the census instrument that could not see
 * two files of its own population.
 *
 * ## Why this exists
 *
 * Round 273 repaired {@link portAcceptsAConnection} to ask both loopback families, after a
 * listener bound to `::1` alone defeated both sides of the ownership guard. Round 274 then
 * measured the other half of the problem and found it worse than "latent":
 *
 * - **Gradability is an addressing property.** With a `::1` stranger beside our own wildcard
 *   server on one port, `GET 127.0.0.1` reaches MINE, `GET localhost` reaches the STRANGER, and
 *   `GET [::1]` reaches the STRANGER. Which occupant a probe grades is decided by the *spelling of
 *   the host in its URL*, not by the guard.
 * - **Twelve over-the-wire sites in this repo address `localhost`**, so twelve sites would have
 *   graded a `::1` stranger if one existed.
 * - **A sixth occupant defeats every side of the repaired guard** — a listener on this machine's
 *   LAN address is refused by all three connects and collides with none of the binds.
 *
 * The conclusion Round 274 drew, and the reason this file is a census rather than a module:
 *
 * > There is no finite set of probes that establishes "nothing is on this port," because the set
 * > of local addresses a stranger may bind is not bounded by anything the guard knows. The
 * > achievable property is address-relative: *nothing other than my own server will answer the
 * > address I am about to use.*
 *
 * Round 273 §7 offered to make the Round 272 bind-shape census runnable. Round 274 §7 declined
 * that aim in favour of this one: a bind-shaped decision site is a *proxy* for the defect, whereas
 * an over-the-wire `localhost` URL in a probe that owns its own server **is** the defect — and the
 * two do not coincide. `probe-scratch-server.mjs` is connect-shaped, correct, and on the
 * `localhost` list.
 *
 * ## The arms
 *
 * - **A** — the address census, pinned. Every over-the-wire `http://` base URL under the walked
 *   roots, classified by host, against an explicit allowlist of the 12 known `localhost` sites.
 *   RED on **growth**, never on the backlog.
 * - **B** — the occupant matrix against the exported guard functions, as *data*, with the `::1`
 *   and LAN rows in it, so the next occupant is a new row rather than an edited `expect`.
 * - **C** — the reachability demonstration that makes A's red mean something: same port, two
 *   servers, three spellings, three different answers.
 * - **D** — no tracked source file may contain a raw NUL byte. This arm is not thematic decoration;
 *   it is what makes arm A's population knowable. See below.
 *
 * ## Why arm D is in a file about addresses (Round 276)
 *
 * Arm A is a census, and this fire found that the project's most-used search instrument cannot see
 * its whole population. Two tracked source files contained a raw `0x00` byte, used — correctly — as
 * a sentinel that cannot collide with a real entity name:
 *
 * ```
 * !b1.chips.includes(defaultEntityName ?? '<NUL>')
 * ```
 *
 * A raw NUL makes `grep` classify the file as binary, and with `-c`/`-n` over several files grep
 * then emits **no line at all** for it: no count, no `Binary file … matches` notice, no error. An
 * absent row rather than a wrong one. Measured: a multi-file grep over rounds 172/174/177 reported
 * 174 and 177 and dropped 172 in **all three** argv permutations, while `readFileSync` found 2 hits
 * in each; `grep -a` on round172 returned 2.
 *
 * Blast radius, measured rather than feared (`git ls-files -z` + `readFileSync`): **2587 tracked
 * files, 37 contain NUL, 35 legitimately binary, exactly 2 source files.** Bounded — and bounded is
 * the point, because for three prior sessions this was recorded as "grep silently dropped a file
 * from globs," a folk belief about globs that pointed at nothing fixable.
 *
 * `'\u0000'` is the identical string value and leaves the file as text, so the remedy was
 * encoding-only with no semantic change. Arm D pins it, because the failure is silent in the
 * direction of *undercounting* — exactly the direction a census cannot detect about itself.
 *
 * **Arm A therefore reads source with `readFileSync`, never by shelling out to grep.** That was
 * already this project's rule; arm D is the first measurement of what it was buying.
 */

import fs from 'fs';
import path from 'path';
import net from 'net';
import http from 'http';
import os from 'os';
import { execFileSync } from 'child_process';
import {
  portAcceptsAConnection,
  aWildcardBindWouldSucceed,
  somethingIsAlreadyAnswering,
} from './lib/probe-server-ownership.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const PROBE = 'probe-round276-the-address-census-and-the-sentinel-that-hid-its-own-file';

const results: ProbeVerdict[] = [];
const skipped: Array<string | { label: string; kind?: string }> = [];

function check(arm: string, name: string, pass: boolean, detail: string, kind = 'regression') {
  results.push({ arm, check: name, pass, kind });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${arm}  ${name}${detail ? ` — ${detail}` : ''}`);
}

// ---------------------------------------------------------------------------------------------
// Arm A — the address census
// ---------------------------------------------------------------------------------------------

/**
 * Non-overlapping roots. Round 274's first pass listed `src` and `src/__tests__` both and
 * double-counted, which is why its published figures are smaller than that scratch file's.
 */
const ROOTS = ['scripts', 'packages/server/src', 'packages/client/src'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.testdata', 'coverage']);
const SOURCE_EXT = /\.(mts|ts|mjs|js|tsx)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (SOURCE_EXT.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Strip `//` and block comments so a *discussion* of `localhost` is not counted as traffic to it.
 * Six of the 25 raw `localhost` lines on this tree are comments — including four that exist
 * precisely to explain why the site below them uses `localhost` on purpose.
 *
 * Deliberately naive about `//` inside a string literal: this masks more than it should in the
 * worst case, which for a census that reds on growth is the safe direction — a masked site is an
 * undercount of the *baseline*, and the baseline is pinned against a hand-read list below.
 */
function maskComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, (m) => ' '.repeat(m.length))
    .replace(/([^:])\/\/[^\n]*/g, (_m, p1) => p1 + ' ');
}

/**
 * Every file with a non-comment `http://localhost` URL literal, each tagged for whether it is
 * **over-the-wire traffic** and carrying the reason it is allowed to be there.
 *
 * ## Why the list holds non-wire entries too
 *
 * Round 274 §5 published `17 localhost sites, of which 12 are real over-the-wire traffic`, having
 * separated the two by hand. This arm's unit is mechanical — *a `http://localhost` URL literal in
 * non-comment source* — because a hand-read unit cannot be re-derived by a later reader, and the
 * first run of this arm duly reported the other five as NEW. They are not new; they were never wire.
 *
 * So the judgment lives here, once, per file, in `wire` and `why` — and A2 reds on any file that is
 * on neither list. That keeps the *measurement* mechanical and the *classification* reviewable,
 * which is the split Round 274 §5 was doing informally.
 *
 * A census that reds on the backlog gets switched off; one that reds on growth gets read. An
 * allowlist entry with no reason is how a defect becomes a baseline — hence A4.
 */
const KNOWN_LOCALHOST_SITES: Array<{ file: string; wire: boolean; why: string }> = [
  // Six `const API = process.env.KLATCH_API || 'http://localhost:3001/api'`. These talk to a dev
  // server the OPERATOR started; they do not own it, so there is no stranger for them to misgrade
  // that the operator is not already looking at. Overridable by env, which is the real mitigation.
  { file: 'scripts/probe-carried-context.mjs', wire: true, why: 'KLATCH_API default; operator-run server, not self-served' },
  { file: 'scripts/probe-carried-context-chip.mjs', wire: true, why: 'KLATCH_API default; operator-run server, not self-served' },
  { file: 'scripts/probe-carried-context-sensitivity.mjs', wire: true, why: 'KLATCH_API default; operator-run server, not self-served' },
  { file: 'scripts/probe-carried-context-carveout-eviction.mjs', wire: true, why: 'KLATCH_API default; operator-run server, not self-served' },
  { file: 'scripts/probe-carried-context-carveout-truncation.mjs', wire: true, why: 'KLATCH_API default; operator-run server, not self-served' },
  { file: 'scripts/probe-recall-tool.mjs', wire: true, why: 'KLATCH_API default; operator-run server, not self-served' },

  // Four browser probes. These DO start their own servers — and they are the reason this arm
  // checks guard coverage in arm A3 rather than trusting the host spelling alone. Vite binds the
  // `localhost` NAME, so `127.0.0.1` is not a drop-in substitution here; the mitigation is that
  // each guards both ports it will address before spawning either.
  { file: 'scripts/probe-round171-path-b-jit-import-browser.mts', wire: true, why: 'Vite UI port; binds the localhost name; guards both ports' },
  { file: 'scripts/probe-round172-path-b-confirm-step-redrive.mts', wire: true, why: 'Vite UI port; binds the localhost name; guards both ports' },
  { file: 'scripts/probe-round174-browse-route-seating-in-a-browser.mts', wire: true, why: 'Vite UI port; binds the localhost name; guards both ports' },
  { file: 'scripts/probe-round177-browse-done-seating-in-a-browser.mts', wire: true, why: 'Vite UI port; binds the localhost name; guards both ports' },

  // The one Round 274 said to read twice: self-served AND `localhost`-addressed. Safe only because
  // of its own inline two-family connect check, shipped 2026-08-20 (`e9a40841`) — i.e. by that
  // check, not by design of the URL.
  { file: 'scripts/probe-scratch-server.mjs', wire: true, why: 'self-served; safe via its own inline two-family connect check' },

  // A driver, not a probe: it grades nothing, so a stranger costs a bad recording, not a bad result.
  { file: 'scripts/record-demo.ts', wire: true, why: 'demo driver, grades nothing' },

  // --- Not wire traffic. Round 274 §5's "other 5", now listed rather than hand-waved. ---
  {
    file: 'packages/server/src/__tests__/round154-cap-checks-file-size-not-the-copy.test.ts',
    wire: false,
    why: "synthetic `new Request('http://localhost/x')` fixtures; no socket is opened (x2)",
  },
  {
    file: 'packages/server/src/__tests__/round249-the-ownership-guard-drives-its-own-matrix.test.ts',
    wire: false,
    why: 'writes the server banner string into a log fixture; a string, not a request',
  },
  {
    file: 'packages/server/src/index.ts',
    wire: false,
    why: "the product's own startup `console.log` banner — the one thing here a user reads",
  },
  {
    file: 'packages/client/src/__tests__/ExportReviewPanel.test.tsx',
    wire: false,
    why: 'a `vi.fn` mock return value; the export URL is never fetched in the test',
  },
  {
    file: 'scripts/probe-round276-the-address-census-and-the-sentinel-that-hid-its-own-file.mts',
    wire: true,
    why: 'arm C addresses localhost deliberately, owning BOTH servers on the port — it is the ' +
         'demonstration that the spelling decides which one answers',
  },
];

/** Hosts that are a local address by some spelling. `localhost` is the one that can resolve to `::1`. */
const WIRE_URL = /\bhttps?:\/\/(\[[0-9a-fA-F:]+\]|[A-Za-z0-9._-]+)(?::(\d+|\$\{[^}]+\}))?/g;

function armA() {
  console.log('\n--- Arm A — the address census, pinned to the classified localhost sites ---');

  const files = ROOTS.flatMap((r) => walk(r));

  const byHost = new Map<string, Array<{ file: string; line: number; text: string }>>();
  for (const f of files) {
    const masked = maskComments(fs.readFileSync(f, 'utf8'));
    masked.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(WIRE_URL)) {
        const host = m[1];
        if (!byHost.has(host)) byHost.set(host, []);
        byHost.get(host)!.push({ file: f, line: i + 1, text: line.trim() });
      }
    });
  }

  // A1 — the walk itself has to be non-trivial, or every assertion below is vacuous on an empty set.
  // Round 223's `0/0 checks passed` finding, applied to this arm's own input.
  check('A1', 'the census walked a non-trivial population', files.length > 300,
    `${files.length} source files under ${ROOTS.join(', ')}`);

  const localhostSites = byHost.get('localhost') ?? [];
  const localhostFiles = [...new Set(localhostSites.map((s) => s.file))].sort();
  const allowed = new Set(KNOWN_LOCALHOST_SITES.map((s) => s.file));

  // A2 — growth. Any file with a non-comment `http://localhost` URL that is not on the classified
  // list. This is the arm that reds when someone adds a thirteenth wire site.
  const unexpected = localhostFiles.filter((f) => !allowed.has(f));
  const wireCount = KNOWN_LOCALHOST_SITES.filter((s) => s.wire).length;
  check('A2', 'no unclassified localhost URL site', unexpected.length === 0,
    unexpected.length
      ? `NEW: ${unexpected.join(', ')}`
      : `${localhostFiles.length} files, all classified (${wireCount} wire / ` +
        `${KNOWN_LOCALHOST_SITES.length - wireCount} non-wire)`);

  // A3 — the allowlist must stay honest in the other direction too: an entry whose file no longer
  // has a `localhost` URL is stale, and a stale allowlist is how A2 stops meaning anything.
  const stale = [...allowed].filter((f) => !localhostFiles.includes(f));
  check('A3', 'no stale allowlist entry', stale.length === 0,
    stale.length ? `STALE: ${stale.join(', ')}` : `${allowed.size} entries all still present`);

  // A4 — every allowlist entry carries a reason. The reason is the review; without it this is a
  // list of things someone once tolerated.
  const reasonless = KNOWN_LOCALHOST_SITES.filter((s) => !s.why || s.why.length < 12);
  check('A4', 'every allowlist entry states why', reasonless.length === 0,
    reasonless.length ? `${reasonless.length} without a reason` : `${KNOWN_LOCALHOST_SITES.length} reasons present`);

  // A5 — the four self-serving browser probes must guard EVERY port they address. This is the
  // check that would catch the real defect shape: guard the API port, address the Vite port.
  const selfServed = KNOWN_LOCALHOST_SITES
    .filter((s) => /probe-round1(71|72|74|77)/.test(s.file))
    .map((s) => s.file);
  const unguarded: string[] = [];
  for (const f of selfServed) {
    const src = fs.readFileSync(f, 'utf8');
    const guards = src.includes('requireAnUnoccupiedPort');
    // The guard has to cover the UI port specifically, not just be present in the file.
    const coversUi = /\[\s*(?:API_PORT|UI_PORT)[\s\S]{0,200}UI_PORT[\s\S]{0,200}\]/.test(src)
      || /requireAnUnoccupiedPort\s*\(\s*UI_PORT/.test(src);
    if (!guards || !coversUi) unguarded.push(`${path.basename(f)}(guard=${guards},ui=${coversUi})`);
  }
  check('A5', 'self-serving localhost probes guard the port they address', unguarded.length === 0,
    unguarded.length ? unguarded.join(' ') : `${selfServed.length}/4 guard both API_PORT and UI_PORT`);

  // Reported, not asserted: the `127.0.0.1` population. It is large, it is not the defect, and
  // pinning it would make this arm red on unrelated growth.
  const v4 = byHost.get('127.0.0.1') ?? [];
  console.log(`  note: ${v4.length} non-comment 127.0.0.1 URL sites in ` +
    `${new Set(v4.map((s) => s.file)).size} files (reported, not pinned — not the defect)`);
  const otherHosts = [...byHost.keys()].filter((h) => h !== 'localhost' && h !== '127.0.0.1').sort();
  console.log(`  note: other hosts seen: ${otherHosts.join(', ') || '(none)'}`);

  return { files: files.length, localhostFiles, v4Sites: v4.length };
}

// ---------------------------------------------------------------------------------------------
// Arm B — the occupant matrix, as data
// ---------------------------------------------------------------------------------------------

/**
 * An occupant kind, and what the guard is *expected* to conclude about it. `guardSeesIt: false`
 * is not an aspiration marked green — it is a **recorded known blind spot**, which is the whole
 * reason this is a table. Round 274's conclusion was that completeness is the wrong goal; a table
 * with a documented `false` row says that in a form a future reader cannot mistake for an oversight.
 */
type OccupantRow = {
  label: string;
  /** Bind this address, or `null` for "leave the port empty". */
  bind: string | null | 'wildcard';
  guardSeesIt: boolean;
  why: string;
};

function lanAddress(): string | null {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return null;
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const port = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(port));
    });
  });
}

/**
 * A staged occupant, plus the sockets it has accepted.
 *
 * ## Why this tracks its own sockets (Round 276, found the hard way)
 *
 * The first version of this arm staged `net.createServer((c) => c.end())` and tore it down with
 * the obvious idiom:
 *
 * ```ts
 * await new Promise<void>((r) => server.close(() => r()));
 * ```
 *
 * The probe **stopped after row 2 of 6 and exited 0** — no error, no signal, no summary line, and
 * a partial transcript that read like a table that had ended. `net.Server.close(cb)` stops the
 * listener but fires its callback only once **every accepted connection is gone**; with one socket
 * outstanding it never fires, the `await` never settles, the event loop drains, and node exits **0**.
 *
 * Measured (`.testdata/r276/b6.mts`), occupant handler vs. whether `close(cb)` ever fires after the
 * ownership guard has run against it:
 *
 * ```
 * c.end()   (half-close)  live=1  close() HUNG   -> fires after destroying the tracked socket
 * c.destroy()             live=0  close() FIRED
 * silent (no reply)       live=1  close() HUNG   -> fires after destroying the tracked socket
 * ```
 *
 * A half-closing or silent occupant — i.e. the realistic stranger, and the one
 * {@link somethingIsAlreadyAnswering} describes as *"accepts connections without answering HTTP"* —
 * is exactly the case that hangs. `req.destroy()` on the *client* side does not clear it (driven:
 * `.testdata/r276/b4.mts`, both variants still `live=1`), so this is not something the guard can
 * fix from its end; the server that accepted the socket has to drop it.
 *
 * `closeAllConnections()` would be the one-liner, but it exists only on `http.Server`, not on
 * `net.Server` (`TypeError: s.closeAllConnections is not a function`, node v26.5.0). Hence the Set.
 *
 * The teardown is also **bounded and loud**: Round 269's lesson is that a probe must not report a
 * third state as one of the first two, and a teardown that can hang forever converts every later
 * arm into silence that looks like success.
 */
type StagedServer = { server: net.Server; sockets: Set<net.Socket> };

function listenOn(port: number, host: string | 'wildcard'): Promise<StagedServer> {
  return new Promise((resolve, reject) => {
    const sockets = new Set<net.Socket>();
    // Silent on purpose: this is the realistic stranger, and per the table above it is also the
    // occupant whose teardown hangs — so the probe exercises the case it had to learn about.
    const server = net.createServer((c) => {
      sockets.add(c);
      c.on('close', () => sockets.delete(c));
    });
    server.once('error', reject);
    const staged = { server, sockets };
    if (host === 'wildcard') server.listen(port, () => resolve(staged));
    else server.listen(port, host, () => resolve(staged));
  });
}

/**
 * Teardown that cannot silently drain the event loop. Destroys the accepted sockets first, then
 * waits a bounded time for `close` and **throws** if it does not arrive — a hang here must surface
 * as a failure, never as a clean early exit.
 */
async function closeStaged(staged: StagedServer, label: string): Promise<void> {
  for (const c of staged.sockets) c.destroy();
  const outcome = await Promise.race([
    new Promise<string>((r) => staged.server.close(() => r('closed'))),
    new Promise<string>((r) => setTimeout(() => r('hung'), 3000)),
  ]);
  if (outcome === 'hung') {
    throw new Error(
      `staged server "${label}" did not close within 3000 ms even after destroying ` +
      `${staged.sockets.size} tracked socket(s) — refusing to continue, because an unbounded ` +
      `wait here exits 0 mid-table (see the module comment on StagedServer)`);
  }
}

async function armB() {
  console.log('\n--- Arm B — the occupant matrix against the exported guard functions ---');

  const lan = lanAddress();
  const rows: OccupantRow[] = [
    { label: 'nothing (empty port)', bind: null, guardSeesIt: false, why: 'correctly clear' },
    { label: '127.0.0.1 only', bind: '127.0.0.1', guardSeesIt: true, why: 'v4 loopback connect reaches it' },
    { label: '::1 only', bind: '::1', guardSeesIt: true, why: 'Round 273: the v6 connect is why this is seen at all' },
    { label: '0.0.0.0', bind: '0.0.0.0', guardSeesIt: true, why: 'v4 loopback connect reaches a v4 wildcard' },
    { label: ':: (what our server binds)', bind: 'wildcard', guardSeesIt: true, why: 'dual-stack; both connects reach it' },
  ];
  if (lan) {
    rows.push({
      label: `${lan} (LAN address)`,
      bind: lan,
      guardSeesIt: false,
      why: 'Round 274 §6: KNOWN BLIND SPOT — refused by both loopback connects, collides with no bind. ' +
           'Harmless only because nothing in the repo addresses a non-loopback local address (arm A pins that).',
    });
  } else {
    skipped.push({ label: 'arm B LAN row — no non-internal IPv4 interface on this host', kind: 'open-item' });
  }

  const table: string[] = [];
  for (const row of rows) {
    // Breadcrumb per row: a matrix arm that dies mid-table must not look like a table that ended.
    // Round 276 wrote this line after this very arm stopped after row 2 and the process exited 0.
    console.log(`  [row] staging ${row.label}`);
    const port = await freePort();
    let staged: StagedServer | null = null;
    if (row.bind !== null) {
      try {
        staged = await listenOn(port, row.bind);
      } catch (e) {
        skipped.push({ label: `arm B row "${row.label}" — could not bind: ${(e as Error).message}`, kind: 'open-item' });
        continue;
      }
    }
    try {
      const connect = await portAcceptsAConnection(port, 1200);
      const bindFree = await aWildcardBindWouldSucceed(port);
      const verdict = await somethingIsAlreadyAnswering(port, 1200);
      const seen = verdict !== null;
      table.push(
        `    ${row.label.padEnd(28)} connect=${String(connect).padEnd(5)} ` +
        `wildcardBindFree=${String(bindFree).padEnd(5)} guard=${seen ? 'OCCUPIED' : 'CLEAR'}`);
      check('B', `occupant "${row.label}" — guard ${row.guardSeesIt ? 'sees it' : 'is blind (recorded)'}`,
        seen === row.guardSeesIt, row.why);
    } finally {
      if (staged) await closeStaged(staged, row.label);
    }
  }
  console.log(table.join('\n'));
  return rows.length;
}

// ---------------------------------------------------------------------------------------------
// Arm C — the reachability demonstration that makes A's red mean something
// ---------------------------------------------------------------------------------------------

/**
 * Passes the `URL` **object** to `http.request`, and does not decompose it into
 * `{ host, port, path }`.
 *
 * Round 276, measured: `new URL('http://[::1]:P/').hostname` is `'[::1]'` — node's WHATWG URL
 * **keeps the brackets** — and `http.request({ host: '[::1]' })` then fails `ENOTFOUND`, because it
 * tries to resolve the bracketed string as a DNS name. Driven three ways against a live `::1` server:
 *
 * ```
 * host: url.hostname (brackets kept)  ->  ERROR ENOTFOUND
 * host: '::1' (stripped)              ->  STRANGER
 * http.request(urlObject)             ->  STRANGER
 * ```
 *
 * The first version of arm C decomposed, and this arm's `[::1]` row reported *"(no answer)"* about a
 * server that was answering — which is the same wrong answer, in the same direction, as the Round 275
 * `fetch` defect this module's `portAnswersHttp` was rewritten to avoid. An IPv6 address is the one
 * case where "take the URL apart and pass the pieces" is lossy.
 */
function httpGetBody(url: string, timeoutMs = 2000): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: string | null) => { if (!settled) { settled = true; resolve(v); } };
    const req = http.request(
      new URL(url),
      { method: 'GET', timeout: timeoutMs },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (d) => { body += d; });
        res.on('end', () => done(body.trim()));
      },
    );
    req.once('timeout', () => { req.destroy(); done(null); });
    req.once('error', () => done(null));
    req.end();
  });
}

/** An HTTP server that names itself in the body, so "who answered" is observable. */
function namedServer(port: number, host: string | 'wildcard', name: string): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const s = http.createServer((_req, res) => { res.writeHead(200).end(name); });
    s.once('error', reject);
    if (host === 'wildcard') s.listen(port, () => resolve(s));
    else s.listen(port, host, () => resolve(s));
  });
}

async function armC() {
  console.log('\n--- Arm C — one port, two servers, three spellings, three answers ---');

  const port = await freePort();
  let mine: http.Server | null = null;
  let stranger: http.Server | null = null;
  try {
    // Order matters: `::1` first, then the `::` wildcard beside it. This is the Round 273
    // occupant, and the pair is legal precisely because a wildcard bind does not collide with `::1`.
    try {
      stranger = await namedServer(port, '::1', 'STRANGER');
    } catch (e) {
      skipped.push({ label: `arm C — no IPv6 loopback to stage the stranger on: ${(e as Error).message}` });
      return;
    }
    mine = await namedServer(port, 'wildcard', 'MINE');

    const spellings = [
      { url: `http://127.0.0.1:${port}/`, expect: 'MINE', why: 'v4 loopback reaches our wildcard' },
      { url: `http://localhost:${port}/`, expect: 'STRANGER', why: 'resolves v6-first on this host — the defect arm A pins' },
      { url: `http://[::1]:${port}/`, expect: 'STRANGER', why: 'explicit v6 loopback reaches the more specific bind' },
    ];

    for (const s of spellings) {
      const body = await httpGetBody(s.url);
      console.log(`    GET ${s.url.padEnd(34)} -> ${body ?? '(no answer)'}`);
      check('C', `${s.url.replace(String(port), 'PORT')} reaches ${s.expect}`, body === s.expect, s.why);
    }

    // The point of the arm, asserted rather than left to the reader: the three spellings do NOT
    // agree. If they ever do agree on this host, arm A's red has lost its meaning and should be
    // re-justified rather than trusted.
    const bodies = await Promise.all(spellings.map((s) => httpGetBody(s.url)));
    check('C', 'host spelling decides which server is graded', new Set(bodies).size > 1,
      `answers: ${bodies.map((b) => b ?? 'none').join(' / ')}`);
  } finally {
    // `http.Server` DOES have `closeAllConnections()` — unlike `net.Server`, which is why arm B
    // has to keep a Set. Both are here for the same reason: an unbounded `close(cb)` await exits 0.
    for (const s of [mine, stranger]) {
      if (!s) continue;
      s.closeAllConnections();
      const outcome = await Promise.race([
        new Promise<string>((r) => s.close(() => r('closed'))),
        new Promise<string>((r) => setTimeout(() => r('hung'), 3000)),
      ]);
      if (outcome === 'hung') throw new Error('arm C server did not close within 3000 ms');
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Arm D — a census instrument must be able to see its own population
// ---------------------------------------------------------------------------------------------

function armD() {
  console.log('\n--- Arm D — no tracked source file may contain a raw NUL byte ---');

  let tracked: string[];
  try {
    tracked = execFileSync('git', ['ls-files', '-z'], { maxBuffer: 1 << 28 })
      .toString('utf8').split('\0').filter(Boolean);
  } catch (e) {
    skipped.push(`arm D — could not list tracked files: ${(e as Error).message}`);
    return;
  }

  // Extensions a source census walks. Genuinely binary tracked files (PNG, mp4, .db backups, zip,
  // docx) are expected to contain NUL and are not the subject.
  const CENSUSABLE = /\.(mts|ts|mjs|js|tsx|json|md|css|html|sh|yml|yaml)$/;
  const source = tracked.filter((f) => CENSUSABLE.test(f));

  const offenders: string[] = [];
  for (const f of source) {
    let b: Buffer;
    try { b = fs.readFileSync(f); } catch { continue; }
    let n = 0;
    for (let i = 0; i < b.length; i++) if (b[i] === 0) n++;
    if (n) offenders.push(`${f} (${n} NUL)`);
  }

  check('D1', 'the NUL census walked a non-trivial population', source.length > 500,
    `${source.length} censusable of ${tracked.length} tracked files`);

  check('D2', 'no censusable source file contains a raw NUL byte', offenders.length === 0,
    offenders.length
      ? `grep is BLIND to: ${offenders.join(', ')} — use '\\u0000' instead of a raw byte`
      : `${source.length} files are all text to grep`);

  console.log(`  note: a raw NUL makes grep emit NO ROW for the file (not a zero, not a notice). ` +
    `Round 276 measured 2 such files; both were '\\u0000' sentinels written as raw bytes.`);
}

// ---------------------------------------------------------------------------------------------

async function main() {
  console.log(`${PROBE}\n`);
  console.log('Round 274 §7, built: the census worth making runnable is the ADDRESS census.');

  const a = armA();
  const rows = await armB();
  await armC();
  armD();

  console.log(`\ncensus: ${a.files} source files walked · ${a.localhostFiles.length} localhost wire files ` +
    `· ${a.v4Sites} 127.0.0.1 sites · ${rows} occupant rows`);

  summariseAndExit({ probeName: PROBE, results, skipped });
}

main().catch((e) => {
  console.error(`${PROBE}: threw — ${e?.stack ?? e}`);
  process.exit(1);
});
