# Round 276 — the address census is built, and three instruments reported success while lying

**Theseus, 2026-09-26 (START fire).** Worktree `klatch-worktrees/theseus`, branch
`claude/theseus-cycle`, pushed to `main` as `bb5fa860` and `5b551ca1`.

Round 274 §7 committed to building the address census — arms A, B, C — as "the first thing next
fire." This is that fire, and the arms are built:
`scripts/probe-round276-the-address-census-and-the-sentinel-that-hid-its-own-file.mts`,
**17 regression checks, exit 0.**

Three separate instrument defects surfaced while building it. All three share the property this
project keeps rediscovering, and Round 275 named most sharply: **the failure arrives as success, or
as silence, rather than as a failure.** One of them is in the module Round 275 rewrote to prevent
exactly that.

---

## 1 — `grep` cannot see two of this repo's source files, and it was never about globs

A multi-file `grep -n requireAnUnoccupiedPort` over the four browser probes reported rounds 174 and
177 and **nothing at all** for round172 — no count, no `Binary file … matches` notice, no error, no
non-zero exit. A `readFileSync` pass found **2 hits in each of the three**.

Characterised before believing it:

| test | result |
|---|---|
| argv order `172,174,177` | 172 absent |
| argv order `177,174,172` | 172 absent |
| argv order `174,172,177` | 172 absent |
| `grep -a` on round172 alone | **2** |
| NUL bytes in round172 | **3** (offsets 19331, 22196, 30017) |

Not positional, then — it is that specific file, in every permutation. The three NUL bytes make grep
classify the file as binary, and with `-c`/`-n` over several files grep emits **no row** for it.

**Blast radius, measured rather than feared** (`git ls-files -z` + `readFileSync`, not grep —
`.testdata/r276/nul-census.txt`):

```
tracked files:            2587
files containing NUL:       37
  legitimately binary:      35   (PNG, mp4, .db backups, zip, docx)
  source files:              2
```

- `scripts/probe-round172-path-b-confirm-step-redrive.mts` — 3 NUL
- `scripts/probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts` — 1 NUL

### The bytes were correct and the encoding was not

All four sites are the same idiom — a NUL as a sentinel that cannot collide with a real name:

```ts
!b1.chips.includes(defaultEntityName ?? '<NUL>')                    // round172, ×3
names.filter((n) => norm(n) === norm(dupNames[0] ?? '<NUL>'))       // round204, ×1
```

The *value* is right and the code always ran correctly — `tsx` and vitest read the byte fine. The
author wrote a raw `0x00` where `'\u0000'` was meant. `'\u0000'` is the identical string value
(verified: `length === 1`, `charCodeAt(0) === 0`) and leaves the file as text, so the remedy is
encoding-only with **no semantic change**. Fixed in `bb5fa860`; NUL counts `3 → 0` and `1 → 0`, sizes
`+15` and `+5` (six chars replacing one byte), and grep now reports all three files in argv order.

**Why this is worth a paragraph rather than a footnote:** my own memory of this pathology, carried
across three prior sessions, read *"grep silently dropped a file from globs 3× in one session."* That
is a folk belief about globs, and it pointed at nothing fixable — the rule it generated was "don't
trust grep," which is unfalsifiable and therefore unactionable. The real statement is bounded,
mechanical, and closed by a four-byte edit: **two files contained NUL; grep suppresses NUL-containing
files silently; neither is true any more, and arm D fails if it becomes true again.**

My Round 274 census was `readdirSync`/`readFileSync` throughout and was therefore **not** affected.
That was a standing discipline rule rather than luck — arm D is the first measurement of what the
rule was buying.

---

## 2 — The arms, and what arm A actually pins

### Arm A — the address census

Round 274 §5's figures reproduce on today's tree: **399 source files walked**, all **12** over-the-wire
`localhost` sites present and unchanged. Daedalus's Round 275 §4 change did not move the figure, as he
predicted — `waitUntilOurServerIsUp`'s old `fetch` was a `127.0.0.1` site via `channelsUrl`, not a
`localhost` one.

Unit reconciliation, since my raw line count differed from Round 274's published 17: my first pass
counted lines containing the host (25 for `localhost`). The difference is exactly 6 comment lines plus
2 banner-parsing regex literals (`probe-round250:555`, `probe-round251:107`, which escape their
slashes and so are not URL literals at all). `17 = 12 wire + 5 non-wire`, matching Round 274's own
enumeration. **Reconciles; no drift.**

**The unit is now mechanical, and the classification is data.** Round 274 separated wire from non-wire
by hand, and a hand-read unit cannot be re-derived by a later reader — the first run of arm A duly
reported the other five as NEW. So the arm measures *"a `http://localhost` URL literal in non-comment
source"* (mechanical, reproducible) and the allowlist carries `wire: true|false` plus a reason string
per file (reviewable, once). A2 reds on any file on neither list.

Current state: **17 files, all classified — 13 wire / 4 non-wire.** The thirteenth wire entry is this
probe itself, which addresses `localhost` deliberately in arm C while owning both servers on the port.

**A5 is the check that would catch the real defect shape:** guard the API port, address the Vite port.
All four self-serving browser probes (rounds 171/172/174/177) call `requireAnUnoccupiedPort` over
**both** `API_PORT` and `UI_PORT` before spawning either. **4/4 — no defect.** Note this is the answer
grep got wrong in §1; the finding that there was no finding depended on not using grep.

Reported but deliberately **not** pinned: 34 non-comment `127.0.0.1` URL sites in 31 files. Pinning
them would red the arm on unrelated growth, and they are not the defect.

### Arm B — the occupant matrix as data

Six rows, driven against the exported functions rather than against a remembered table:

```
occupant                      connect   wildcardBindFree   guard
nothing (empty port)          false     true               CLEAR
127.0.0.1 only                true      true               OCCUPIED
::1 only                      true      true               OCCUPIED
0.0.0.0                       true      true               OCCUPIED
:: (what our server binds)    true      false              OCCUPIED
192.168.1.119 (LAN address)   false     true               CLEAR
```

The LAN row is recorded as a **known blind spot with a reason**, not as an aspiration marked green.
That is the form Round 274 §6 argued for: completeness is the wrong goal, so the enumeration lives
somewhere a new row can be *added* without editing an `expect`, and a documented `false` cannot be
mistaken for an oversight.

### Arm C — the demonstration that makes A's red mean something

One port, our own `::` server and a `::1` stranger, three spellings:

```
GET http://127.0.0.1:PORT/   -> MINE
GET http://localhost:PORT/   -> STRANGER
GET http://[::1]:PORT/       -> STRANGER
```

Reproduces Round 274 exactly. The arm also asserts that the three answers do **not** agree — if they
ever do on this host, arm A's red has lost its meaning and needs re-justifying rather than trusting.

---

## 3 — The teardown could exit the process 0, mid-table

The first version of arm B staged `net.createServer((c) => c.end())` and tore it down with the
obvious idiom:

```ts
await new Promise<void>((r) => server.close(() => r()));
```

**The probe stopped after row 2 of 6 and exited 0.** No error, no signal, no stderr, no summary line —
and a transcript that read exactly like a table that had finished. `spawnSync` confirmed
`status=0 signal=null`.

`net.Server.close(cb)` stops the listener but fires its callback only once **every accepted connection
is gone**. With one socket outstanding it never fires, the `await` never settles, the event loop
drains, and node exits 0.

Measured (`.testdata/r276/b6.mts`) — occupant handler vs. whether `close(cb)` ever fires after the
ownership guard has run against it:

| occupant handler | live connections | `close(cb)` | after destroying tracked sockets |
|---|---|---|---|
| `c.end()` (half-close) | 1 | **never fires** | fires |
| `c.destroy()` | 0 | fires | — |
| silent (no reply) | 1 | **never fires** | fires |

So the case that hangs is the **realistic stranger** — the half-closing or silent occupant, which is
precisely what `somethingIsAlreadyAnswering` describes as *"accepts connections without answering
HTTP."*

Two things I checked rather than assumed:

- **Client-side `req.destroy()` does not clear it.** I hypothesised that `portAnswersHttp`'s `error`
  arm was leaking a socket by not destroying, unlike its `timeout` arm which does. Drove both variants
  (`.testdata/r276/b4.mts`): **both still `live=1`, both still hang.** The hypothesis was wrong and I
  am not reporting it as a finding. The server that accepted the socket has to drop it; the guard
  cannot fix this from its end.
- **`closeAllConnections()` is `http.Server`-only.** On a `net.Server` it is
  `TypeError: s.closeAllConnections is not a function` (node v26.5.0). Hence a tracked `Set`.

The teardown is now bounded and **throws** rather than hanging, because a teardown that can hang
converts every later arm into silence that looks like success — Round 269's "a third state must not
report as one of the first two," arriving in the teardown rather than in the verdict.

### The class, and its size

A `readFileSync` census of files that stage a server and await a `close()` callback **without**
tracking sockets: **7 of the 14 files that stage a server at all** (`.testdata/r276/close-hazard.txt`).

```
scripts/lib/probe-server-ownership.mts
scripts/probe-round221-probe-ownership-control.mts
scripts/probe-round223-twenty-one-probes-against-a-stranger.mts
scripts/probe-round224b-the-migrated-probes-against-a-stranger.mts
scripts/probe-round250-the-drive-was-never-priced-and-the-port-is-one-line-of-product.mts
scripts/probe-round276-…  (this one, now fixed)
packages/server/src/__tests__/round251-the-port-is-a-lever-not-a-literal.test.ts
```

**Stated at the strength the evidence carries:** these are *candidates*, not sightings. I verified
exposure for my own probe only. Whether each of the other six is actually exposed depends on whether
anything connects to its staged server and leaves a half-open or silent socket, and I did not drive
them this fire. Rounds 221/223/224b are "probes against a stranger" and stage occupants for the
ownership guard to inspect, which is the exposing shape — so my prior is that some of them are
affected — but a prior is not a measurement and I am not publishing it as one. **Open item, mine.**

---

## 4 — The IPv6 hole in the function that was rewritten to close a hole like it

Arm C's `[::1]` row first reported **"(no answer)"** about a server that was answering. Cause,
measured three ways against a live `::1` server:

```
new URL('http://[::1]:P/').hostname          ->  "[::1]"      (brackets KEPT)
http.request({ host: url.hostname, … })      ->  ERROR ENOTFOUND
http.request({ host: '::1', … })             ->  STRANGER
http.request(urlObject)                      ->  STRANGER
```

Node's WHATWG `URL` retains the brackets in `.hostname`, and `http.request` then tries to resolve the
bracketed string as a DNS name. **An IPv6 address is the one case where "take the URL apart and pass
the pieces" is lossy.**

**The same decomposition is in `portAnswersHttp`** — the function Round 275 rewrote from `fetch` to
`http.request` specifically so that it would stop returning `null` about a port that answers 200:

```ts
const url = new URL(channelsUrl(port));
const req = http.request(
  { host: url.hostname, port: Number(url.port), path: url.pathname, … },
```

**Latent today**, because `channelsUrl` returns `http://127.0.0.1:${port}/api/channels` and
`hostname` is then plain. But the reason Round 275 gave for building it from `channelsUrl` is that
*"the address this asks about must stay the address the rest of the module names"* — i.e. it is built
to follow `channelsUrl` if `channelsUrl` changes. **The one change anybody would plausibly make to
`channelsUrl` is to an IPv6 literal, which is the direction Rounds 273–275 have been pushing the
module — and that change is the one this breaks.** The failure mode is the exact one Round 275
eliminated: `null`, "nothing is answering," about a live server; and because `null` feeds
`somethingIsAlreadyAnswering`'s describing half, it would mislabel rather than crash.

Repaired in `5b551ca1`: passes the `URL` object. No behaviour change on `127.0.0.1` — gate identical.

Single-sourcing an address does not help if the transport then takes the address apart. That is the
Round 222 lesson (a hoist does not stop a second copy in the hoisted file) one level lower: the
*address* was single-sourced and its *decomposition* was not.

---

## 5 — Gate

```
GATE ok exit=0 typecheck · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 server · files: 139 passed (139) · tests: 2165 passed | 1 skipped (2166) · errors: 0
GATE ok exit=0 client · files: 25 passed | 13 skipped (38) · tests: 324 passed | 13 skipped (337) · errors: 0
GATE ok exit=0 gate(typecheck+server+client) · files: (no Test Files line) · tests: (no Tests line) · errors: 0
```

Byte-identical to Round 275 §7 in every figure, so the shared-lib change broke nothing.
`renderGate` quoting the exit code beside the counts is doing its job on its second round of use —
and note §3 is the same defect class one layer out: the counts and the exit code were both fine while
the probe's own transcript was the thing that couldn't go red.

Hygiene: ports **ephemeral throughout, never 3001**; every staged server closed in-process through
the bounded teardown; nothing killed, nothing leaked. 0 model calls, no server from `packages/`, no
database, no corpus. Controls into gitignored `.testdata/r276/`, **files not pipes**.

---

## 6 — What is open

- **Mine, next fire:** drive the other six `close()`-hazard candidates from §3 and convert the
  candidate list into sightings or clear them. The census names them; nothing yet grades them.
- **Mine:** arm A pins `localhost` and reports `127.0.0.1` without pinning. Whether the 34
  `127.0.0.1` sites deserve a pin of their own is a judgment I have not made.
- **For xian — tenth flag.** `COORDINATION.md` measured this fire (`wc -l`): **3555 lines**, up 13
  from Daedalus's 3542 this morning. Ten flags across two seats, no ruling. The proposal is unchanged
  and mechanical: archive everything before 2026-09-01 into `docs/coordination-archive/2026-08.md`,
  leave a pointer.
