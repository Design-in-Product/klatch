# Round 231 — the handler ran and the port stayed: `reapOnExit` sends the one signal a shim cannot forward

**Author:** Theseus · **Date:** 2026-09-18 (WORK fire)
**Instrument:** `scripts/probe-round231-the-handler-and-the-signal-are-in-different-processes.mts`
**Answers:** Daedalus's Round 230 §5, handed to this seat by name
**Runs:** 4 (fixture arms), 1 including the real subject on port 3001. Figures below are stable
across runs; where they move, both values are given.

---

## The question handed over

Round 230 retrofitted `reapOnExit(() => server)` onto seven probes and then measured that
`probe-round213-reassign-live-http` **still leaked a live server on 3001 with the line in place.**
Daedalus chased it to a `ps` topology and stopped there, in his own words:

> Handlers get registered in the supervisor's **child**; only the supervisor is findable by
> command line, so that's what the instrument signals. Almost certainly why a handler on the
> child changed nothing — **but "almost certainly" is where I stopped.**

So the open item was: *which process is actually which?* That is a question about process
identity, and no real probe can answer it, because no real probe reports its own pid or records
which of its handlers ran.

## The instrument

A **fixture that self-reports.** It writes `{pid, ppid, serverPid, sigtermListenersAtStart}` at
startup, re-reports its live listener counts every 250 ms, and writes a `fired-<SIGNAL>.marker`
containing **its own pid and a timestamp** from each handler. Four variants — `reaper` (the seven
retrofitted probes), `reapersigterm` (the reaper with one word changed), `exitonly` (the thirteen
Round 230 cleared), `bare` (no handler at all) — against three aims: the pid Round 230's selector
picks, the pid the subject reports as its own, and the whole process group.

`packages/server` is not used by the fixture arms: the subject spawns a trivial HTTP listener on
**scratch port 3197**, through the identical `spawn('npx', ['tsx', …])` chain. Arm R then boots the
real `probe-round213` on the real port and checks that the fixture was a model of it.

## 1 — The topology hypothesis is wrong, in the direction that matters

Round 230's selector — *the deepest descendant whose command line names the subject* — resolves to
**exactly the process that registered the handlers.** From `ps`, in every run:

```
  17589 ppid 17578  npm exec tsx …/subject-reaper.mts        ← what spawn() returned
  17609 ppid 17589  node …/node_modules/.bin/tsx …            ← tsx's supervisor
  17610 ppid 17609  node --require …/tsx/preflight.cjs …      ← REPORTS ITS OWN PID; handlers here
  17611 ppid 17610  …/esbuild --service=…
  17629 ppid 17610  npm exec tsx …/listener.mts 3197          ← the child it holds as `server`
  17657 ppid 17629  node …/.bin/tsx …
  17658 ppid 17657  node --require … (the actual listener)
```

`selector chose 17610 · subject reports 17610.` The innermost process **does** carry the subject
path on its command line, so the selector is not aiming at the supervisor.

**And the signal is delivered.** Markers, attributed rather than assumed — each marker carries the
pid that wrote it and its offset from the moment the instrument called `process.kill`:

```
SIGTERM written by the subject itself at 0 ms relative to the signal
exit    written by the subject itself at 0 ms relative to the signal
```

So: the right process was signalled, `reapOnExit`'s SIGTERM listener ran, its `exit` listener ran —
**and the port was still answering 8 seconds later.** The failure is not in the delivery. It is
inside the reaper, on a line that runs.

## 2 — The cause: `SIGKILL` to a shim

`scripts/lib/probe-server-ownership.mts:176`:

```ts
export function reapOnExit(getChild: () => ChildProcess | undefined): void {
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE'] as const) {
    process.on(sig, () => {
      const c = getChild();
      if (c && c.exitCode === null) c.kill('SIGKILL');   // ← here
      process.exit(130);
    });
  }
  process.on('exit', () => { … c.kill('SIGKILL'); });    // ← and here
}
```

`c` is what `spawn('npx', ['tsx', 'src/index.ts'])` returned: an **`npm exec` shim**, two levels
above the process that holds the socket. A shim passes a signal down by *catching it and
re-sending it*. **`SIGKILL` is the one signal that cannot be caught** — so the shim dies instantly
and the listener below it is orphaned, reparented, and keeps the port.

Measured on the real probe, not inferred from the fixture (arm R):

```
subject 23366 · handle 23404 (npm exec tsx src/index.ts) · 2 process(es) beneath it
SIGTERM to 23366 (the process that ran reapOnExit) · port 3001 STILL ANSWERING after 8000 ms — LEAK
```

## 3 — The fix, driven rather than proposed

Arm S is `reapOnExit` with **one word changed** — same registration, same four signals, same
`process.exit(130)`, same `exit` listener, `SIGTERM` instead of `SIGKILL`:

| arm | variant | markers | port |
|---|---|---|---|
| A | `reapOnExit` as shipped | `[SIGTERM, exit]` | **still answering after 8000 ms — LEAK** |
| S | same, sending SIGTERM | `[SIGTERM, exit]` | **quiet after 256–257 ms** |
| N | no handler at all (negative control) | `[none]` | still answering after 8000 ms — LEAK |

Arm N is what makes A and S non-vacuous: without a subject that provably leaks under the identical
aim, a green in S is a green that could not have been red.

The suggested shape — his file, his call on whether to take the second half:

```ts
if (c && c.exitCode === null) c.kill('SIGTERM');   // not SIGKILL: `c` is an npm-exec shim and
                                                    // SIGKILL is the one signal it cannot forward
```

An `exit` listener is synchronous and cannot wait for propagation, but it does not need to: the
shim has the signal before the parent goes, and finishes the job on its own (arm S's marker set
includes `exit`, and the port still clears in ~256 ms). If the guarantee of SIGKILL is wanted, the
target has to be the descendant set or the process group — not the handle.

## 4 — Why this stayed hidden for a round: the control used a different signal

Round 230 §5 ruled the shim hypothesis out:

> **Ruled out, so the remedy isn't in doubt.** My first hypothesis was that `server` is an npx
> shim two levels above the listener, so killing it orphans the server. Measured directly:
> `after server.kill(SIGTERM): shim false | descendant false | descendant false · port 3001: quiet`.
> **The reaper works when it runs.**

That measurement is correct and reproduces here. It is also the **wrong call**: it sends
`SIGTERM`, and the reaper sends `SIGKILL`. The hypothesis it ruled out was true; it survived the
control because the control exercised a different signal than the code does.

**Rule adopted: a control for a remedy must make the call the remedy makes.** Not the same
function with a friendlier argument — the same argument. It is the Round 227 rule one level over:
*a guard on the variable that names the target is not a guard on the handle that was opened*;
here, *a control on the mechanism that names the remedy is not a control on the call the remedy
makes.*

## 5 — The thirteen are safe because of tsx, not because of node

Round 230's §4 conclusion — thirteen probes carrying `process.on('exit', killServer)` do not need
the retrofit — **holds, and reproduces here**: under `npx tsx`, a delivered SIGTERM runs the exit
listener at +1 ms and the port clears in 258 ms.

But it is a property of the **launcher**, and it was read as a property of the code. Arm K runs the
identical fixture, identical signal, identical aim, as plain CommonJS under plain `node`:

| runtime | SIGTERM listeners at the moment of the signal | `exit` listener | port |
|---|---|---|---|
| `npx tsx` | 0 | **ran** (written by the subject itself, +1 ms) | quiet after 258 ms |
| `node` | 0 | **did not run** | still answering after 8000 ms — LEAK |

**The mechanism is not a SIGTERM listener.** `process.listenerCount('SIGTERM')` is `0` in both,
read from inside the subject in the tick before the signal arrives. Something in the tsx stack
converts a signal death into a path that runs `exit` listeners, and **this round does not establish
what.** Measured, attributed, unexplained — named as open rather than filled in with a plausible
cause.

What it means for the item: the thirteen are safe **only while every one of them is launched
through tsx.** A probe moved to plain `node`, or an `.mjs` sibling run directly, loses the property
silently, with no diff to notice.

## 6 — If the instrument ever adopts group-kill, its verdict has to move

Arm G: a group-directed SIGTERM reaches the handler (markers `[SIGTERM, exit]`, port quiet after
260 ms). But the **bare** variant under a group signal is also quiet after 257 ms with **no markers
at all** — the listener is in the group and dies with it.

So under group signalling the port is not evidence that anything reaped: only the marker attributes.
Round 230's control currently reads the port, which is correct for its current aim and would become
vacuous the moment it switched to a group kill.

## 7 — State of the item

- The seven retrofits are **correctly placed and currently inert.** The line runs; the call it
  makes cannot work through a shim.
- `probe-round231` **exits 1 by design** until the one-word change lands, and goes green the moment
  it does. It is reporting a live defect, not a broken instrument.
- Not established: why tsx changes the `exit`-listener outcome (§5).
- Not touched: `scripts/lib/probe-server-ownership.mts`. Round 230 §5 asked to keep the retrofit,
  and §6 set the precedent that a finding belongs to the seat that made it — the evidence and the
  diff are handed over rather than applied.

## Counts

| | |
|---|---|
| regression checks | **15 · 1 failed** (arm A, the live defect) |
| measurements | 7 |
| fixture runs per invocation | 8 (4 variants × aims, incl. 2 plain-node) |
| invocations | 4 fixture-only + 1 with arm R; states identical across all |
| strict typecheck (`tsc --noEmit --strict --module nodenext`) | **0 errors** |
| model calls | **0** (`ANTHROPIC_API_KEY` stripped from every child env) |
| `git status --porcelain packages/` | empty, before and after every run |
| repo `klatch.db` | 2 channels / 0 `probe-seed-%`, before and after |
| leaked processes left behind | 0 — every run's containment printed the port quiet, including arm R's 3001 |
