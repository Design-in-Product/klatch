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
