# Theseus session log — 2026-09-26 19:47 PT (STOP fire, Round 280)

Model: claude-opus-5. Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.

## 19:47 — fire open, briefing

- `git status --porcelain` empty. `HEAD` = `7389bfc4` (iris STOP log), synced by the wrapper.
- `docs/COORDINATION.md` read (Theseus section at `:2030`); my last entry is Round 278, ~15:10 PT.
- `docs/mail/` swept. One memo new to this seat since my 15:07 outbound:
  `daedalus-to-theseus-…-the-gate-is-built-and-its-first-run-found-a-check-that-had-been-red-all-day-2026-09-26.md`
  (Round 279). Read in full.
- Round 279 routes to me explicitly in **§7**: whether `somethingIsAlreadyAnswering`'s
  `http.request` should `destroy()` its socket rather than `end()` it — *"Yours or mine, and I have
  no claim on it — you have the harness for exactly this."* Taken.
- Also landed by him this fire: my §5 (`Z2a` filter widened) and my §6 (round251's
  `anEphemeralPort()`). Both confirmed in his memo; I have not re-verified them yet.

## 19:52 — his §7 framing does not survive contact with the code

`probe-server-ownership.mts:289` is `req.end()`. That is not a half-close of an established
conversation — **it is what sends the request.** A GET with no body still needs `end()` to put the
request on the wire. `destroy()` "rather than" `end()` means the guard never asks anything and every
port reads as silent. There is no one-line swap at `:289`.

The real question one line away from his, same hazard: **after the guard gets its answer, does it
leave a socket open to the thing it just described?** That is exactly "a client that will not FIN
back". Baseline measured this fire:

```
node v26.5.0
http.globalAgent.keepAlive=true  timeout=5000  keepAliveMsecs=1000
```

So the success path pools its socket by default. **This is not the keep-alive hypothesis Round 278
killed** — that one asked whether `agent:false` changed whether a *half-closed* connection makes
`close(cb)` hang (it did not; the cause was server-side socket tracking). This asks about the
*success* arm and the *lifetime* of the socket left behind. Same option, different dependent
variable. Stated explicitly so it is not read as a resurrection.

## 19:56 — probe built, and Daedalus's new gate caught my file on its first cross-seat use

`scripts/probe-round280-the-client-half-of-the-pair-and-what-it-leaves-behind.mts`, arms A–H.

First `npx tsc -p scripts/tsconfig.json` (the config he landed in Round 279 §1) returned **3
errors, all mine**: `@types/node`'s `http.Agent` declares none of `keepAlive`, `options`, or
`keepAliveMsecs`, though all three exist at runtime and all three are the mechanism this probe is
about. Narrowed with a documented view rather than a `@ts-expect-error`, per his §5 (a directive
telling the gate not to look is worse than a declaration). Re-run: **0 bytes, exit 0.**

Worth recording plainly: his gate was under 3 hours old and its first contact with another seat's
new file was a true positive.

## 20:00 — run 1: five results and one crash

`.testdata/r280/run1.txt`:

| arm | result |
|---|---|
| A4 | **the shipped guard leaves 1 socket open** to the server it just described — CONFIRMED |
| B1 | the leftover socket closes unattended after **~4028 ms** |
| C1 | as-shipped → `HTTP 200`, live-after=**1** |
| C2 | `agent: false` → `HTTP 200`, live-after=**0** |
| C3 | `destroy-on-end` → `HTTP 200`, live-after=**1** — *the §7 instinct does not work* |
| E1 | `http.Server` bare `close(cb)` with the leftover socket → **closed in 0 ms — NOT exposed** |
| F | **process died**: unhandled `'error'` ECONNRESET, before F1 printed |

Two things to carry forward:

1. **C3 answers his §7 in the negative.** Destroying the request after the answer arrives does not
   reclaim the socket — by then the socket has been released to the agent's free pool and the request
   object no longer owns it. Only declining to pool (`agent: false`) leaves nothing behind.
2. **The arm F crash is a finding, not just a probe bug.** `portAcceptsAConnection:113` does
   `sock.destroy()` — an abortive close. Against a server that has already *written* data, that
   produces ECONNRESET on the server side. `trackedNetServer` (`:216–223`) registers `'close'` on
   accepted sockets and **no `'error'` handler**. So the guard can kill the process it is describing
   from — which is the exact property the comment at `:258` says must not hold, arrived at by a
   different mechanism than the `fetch`/`setTypeOfService` one Round 275 closed.

Next: fix F's handler, demote C3 to a pure measurement, add a child-process arm that reproduces the
crash without killing my own table, re-drive, then decide on the `agent: false` lib edit on the
evidence rather than the instinct.

## 20:08 — run 2: every arm reproduces, and arm I confirms the crash in a child

`.testdata/r280/run2.txt`. Arm I, driven both ways in a child process so it cannot end my own table:

```
no-handler     child status=1  signal=null  ECONNRESET-in-stderr=true   verdict-file="(no file)"
with-handler   child status=0  signal=null  ECONNRESET-in-stderr=false  verdict-file="REACHED-THE-END verdict=…"
```

One `'error'` handler is the entire difference. `H4` confirms from source that `trackedNetServer`
registered **no** `'error'` handler; `H5` confirms **0** callers pass an `onConnection` that writes
bytes, so the crash was **latent, not live** — recorded as latent rather than dressed up.

`F3` confirmed the hang: bare `net.Server` occupant, `live-at-teardown=1`, bare `close(cb)` **hung
in 3002 ms**. The Round 278 pair, end to end, with the repo's own shipped client as the client half.

One arm of run 2 was **my own imprecision**: `G3` failed reading `agent.sockets` — that is
*bookkeeping*, and a socket can be listed there after it is dead. A claim about a Map is not a claim
about a connection. Re-cut to count undestroyed sockets among the listed ones: `listed-in-agent=1,
of-those-undestroyed=0`, so the error arm's missing `destroy()` is **inert**, and the FAIL was mine.

## 20:15 — both repairs landed in the library

`scripts/lib/probe-server-ownership.mts`:
- `portAnswersHttp` → `agent: false`, with the four-row table recorded in the comment.
- `trackedNetServer` → an `'error'` handler on accepted sockets, with the mechanism recorded.

Probe restructured so it **pins the repair, not the defect**: `A4` now asserts 0 live sockets and
cites the pre-repair 1. Arm B deliberately drives the *pooled replica*, not the repaired library —
"how long was the window" must stay answerable after the window is closed, or the repair erases its
own justification. Arm F split into two cells (pooled client vs. repaired library).

## 20:20 — the repair does NOT close the raw-net.Server cell, and that is not a regression

Run 3: `F2` still **hung** with the repaired library, `live-at-teardown=1`. My first framing called
that a REGRESSION. It is not. The two cells fail for different reasons:

- `http.Server` honours the `Connection: close` that `agent: false` sends and closes its own side →
  `A4` = 0 live, `E1` closes in 0–1 ms.
- a raw `net.Server` that writes a response and ignores headers keeps **its** side open whatever the
  client does short of an abortive close → `close(cb)` never settles.

Which is Round 278's own conclusion arriving again: this is a property of the **pair**, and the
client can only fix the client's half. Re-cut `F2a` as a MEASUREMENT of a known-open hazard rather
than a failing check, so an honest red stays available for the day it changes.

**OPEN, mine, first item next fire:** the untested **fourth** variant — `agent: false` **plus** an
abortive close. That is where Daedalus's §7 instinct should finally work, because with no pool the
request still owns the socket. I did not measure it; I ran out of fire. Named, not guessed at.

## 20:26 — run 4 green, gate green

- `npx tsc -p scripts/tsconfig.json` → **0 bytes, exit 0** (5 invocations this fire).
- Probe run 4: **12 checks passed · 0 failed · 40 measurements**, exit 0.
- `npm test` → **exit 0**. Server **140 files / 2174 passed / 1 skipped**; client **25 passed + 13
  skipped files / 324 passed + 13 skipped**. **Byte-identical to Round 279 §6 and Round 278's gate**,
  which is the expected result for a `scripts/` change — and this fire the typecheck stage covering
  `scripts/*.mts` is inside it, so the two lib edits were gated rather than hand-checked.

## 20:30 — wrap

Commits: `305af34f` (WIP backstop), `6c6567f9` (probe + both lib repairs), `eb7eed82` (memo, own
commit, pushed straight to `main` per the worktree mail rule). All three pushed to `origin/main`
during the fire rather than at the end.

**Discipline:** ports **ephemeral only, never 3001** — and unlike Round 278 I asserted nothing about
3001's state this fire. Every staged server closed in-process; arm F destroys its sockets and
`unref`s whatever the teardown outcome, so the probe cannot be the thing that leaks. Nothing killed.
Arm I's child reaped by `spawnSync` with a 20 s timeout; `spawnSync().status` read directly, **never
through a pipe**. Census by `readdirSync`/`readFileSync`, **never `grep`** (Round 276). Controls in
gitignored `.testdata/r280/`, **files not pipes**. 0 model calls, no database, no corpus.

**Not done, and not glossed:** (1) the fourth variant above. (2) Daedalus's §6 claims that he landed
my §5 and §6 — I read his account and did **not** independently re-drive either; the memo says so
rather than letting an ack imply a check. (3) His §4 arm-E finding and §8 round240 `[I]` red:
untouched this fire. (4) Arm `H3`'s "22 of 33 guard callers close a server without the tracked
teardown" **over-counts by construction** — `.close(` matches `http.Server` and child-process handles
too, and arm E shows `http.Server` is not exposed. Candidates from source text, not sightings.

**To xian — fourteenth flag:** `COORDINATION.md` is **3616 lines** (`wc -l`, this fire), up 11 from
Daedalus's 3605 this afternoon, before my entry. Fourteen flags, two seats, no ruling. Same
mechanical proposal, unchanged and seconded: archive everything before 2026-09-01 into
`docs/coordination-archive/2026-08.md`, leave a pointer. Reversible, and not something either seat
should do unilaterally to the file every seat reads at session start.
