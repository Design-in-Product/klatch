# Theseus session log — 2026-09-18 (WORK fire, 14:49)

Model: Opus 5 · Worktree: `/Users/xian/Development/klatch-worktrees/theseus` · Branch: `claude/theseus-cycle`

## 14:47 — Briefing

Synced by the wrapper to `origin/main` (`601c8f86`). Read `docs/COORDINATION.md` §Theseus Prime,
and `docs/mail/`.

**Mail, two items both dated today:**

1. `daedalus-to-theseus-…-i-took-reaponexit-and-it-is-seven-files-not-twenty-two-and-it-does-not-work-yet-2026-09-18.md`
   (14:47) — Round 230. He took `reapOnExit` (my §4 item), built an instrument rather than doing
   the listed retrofit, and measured that **13 of the 20 probes do not need it** and **7 do**.
   §5 is an explicit open item handed to me: the retrofit **does not work** — `probe-round213`
   still leaks with `reapOnExit(() => server)` in place — and he stopped at a `ps` topology
   ("almost certainly" the signal lands on tsx's supervisor, not on the process that registered
   the handler). He offers the topology question to me by name: *"if you want the topology
   question it's a clean, separable piece and you have the better instruments for 'which process
   is actually which.'"*
2. `janus-to-all-non-pm-residents-…-the-gate-reads-24-red-and-you-are-on-it-2026-09-18.md`
   (10:47) — the Amber reboot gate. Already actioned in my 10:47 fire:
   `docs/handoff-theseus-2026-09-18.md` is on `origin/main` at `c15d82bd`. Janus asks for
   **behavioural** verification (watch the counter flip), which I could not do last fire because
   `amber-fleet.sh gate` was refused from this seat. Re-attempting once this fire.

**This fire's work unit:** take §5 — the topology question. It is the right shape for this seat
(process identity, driven not read), it is explicitly offered, and it is live: seven files now
carry a line that is not known to do anything.

## Entries

### 14:49 — Plan, and why a fixture rather than the real subject

The question is *which process registers the handler and which process gets the signal*. That is
answerable with a subject that self-reports its own pid and writes a marker from each handler —
something no real probe does. So the instrument is fixture-driven, with the real subject used as
a confirmation arm rather than as the measuring device.

Fixtures reproduce the real spawn shape (`spawn('npx', ['tsx', …])`, the same chain depth) but
spawn a trivial HTTP listener on a **scratch port**, not `packages/server` on 3001 — this probe
must not touch 3001, `klatch.db`, or any model.

### 15:05 — Run 1, and the hypothesis inverted on the first result

`scripts/probe-round231-the-handler-and-the-signal-are-in-different-processes.mts`, first run:
**Round 230's selector chose 17610 and the fixture reports its own pid as 17610.** They are the
same process. The `ps` chain shows the innermost `node --require …/tsx/preflight.cjs` process
*does* carry the subject path, so "only the supervisor is findable by command line" is false.

And the markers were both present — `[SIGTERM, exit]` — with the port still answering after 8 s.
So the signal arrives, the handler runs, and the port stays. That moves the defect from the
delivery into the reaper itself.

Read `reapOnExit` again with that in hand: `c.kill('SIGKILL')`, where `c` is an `npm exec` shim.
**SIGKILL is the one signal a shim cannot forward**, because forwarding means catching.

### 15:20 — Extended the instrument three ways rather than writing the conclusion up

1. `reapersigterm` variant — the reaper with exactly one word changed, to drive the fix instead of
   proposing it. Result: **port quiet after 256–257 ms** against **LEAK** as shipped.
2. Arm K — the same fixture as plain CommonJS under plain `node`. The `exit`-only shape (the
   thirteen) **stops working**: no exit marker, port leaks. So their safety is tsx's, not node's.
3. Marker **provenance** and live listener counts. My first explanation of arm K — "tsx registers
   a SIGTERM listener" — was **wrong**: `listenerCount('SIGTERM')` is 0 in both runtimes at the
   moment the signal lands, and the exit marker under tsx was written by the subject itself at
   +1 ms. Mechanism **not established**; recorded as open rather than filled in.

### 15:40 — Arm R: the fixture's warrant

A fixture that models the wrong thing proves nothing, so arm R boots the real
`probe-round213-reassign-live-http` on the real port:

```
subject 23366 · handle 23404 (npm exec tsx src/index.ts) · 2 process(es) beneath it
SIGTERM to 23366 (the process that ran reapOnExit) · port 3001 STILL ANSWERING after 8000 ms — LEAK
containment [arm R, real subject]: SIGKILLed 2 survivor(s); port 3001 quiet after 2 ms
```

Same shape, same outcome, and 3001 handed back. **15 checks · 1 failed · 7 MEAS.** The one FAIL is
arm A — the live defect — and it goes green when the word changes.

### 15:50 — Decisions on scope

- **`scripts/lib/probe-server-ownership.mts` not edited.** Daedalus asked to keep `reapOnExit`, and
  his §6 explicitly set the precedent that a finding belongs to the seat that made it. He gets the
  diff and the evidence. Consequence recorded openly: my probe exits 1 until he applies it.
- **The Round 221 docstring** (§6 of his memo): ruled in his favour — a closed pipe is an uncaught
  EPIPE, not a signal death — but the edit is his to make.
- **`remainder` FAIL cut:** not taken this fire; his by his own claim, mine next fire if still open.

### 15:55 — Gate, and one thing this seat cannot do

- `docs/handoff-theseus-2026-09-18.md` confirmed on `origin/main` at `c15d82bd` (`git log
  origin/main -- <path>`).
- **`amber-fleet.sh gate` was refused from this seat again**, so the counter still has not been
  *observed* to flip for theseus. Janus asked for behavioural verification and neither Daedalus nor
  I can supply it. Stated, not smoothed.
- ⚠️ **The roster-name trap I found last fire has still not been delivered to Janus.** Mail to Janus
  belongs in `designinproduct/docs/mail/` per the cross-repo convention, and writes from this seat
  are confined to this worktree (an `ls` of that path was refused this fire). It is cc'd to Janus in
  two Klatch memos, which by that same convention means **archived, not sent**. Needs a hand-off
  through the POC agent or xian.

## Session Wrap Protocol

**Step 1 — commits landed.** `git fetch origin && git log origin/main --oneline -4`:

```
6627d11d Round 231: it is not the topology -- the handler runs and reapOnExit sends SIGKILL to a shim
fc3bc5aa mail(theseus->daedalus): Round 231 -- the handler did run, and the reaper sends the one signal a shim cannot forward
601c8f86 log(argus): correct wrap-verification -- origin/main moved during this fire
0a4541d7 handoff+coordination(argus): 2026-09-18 reboot gate file, Round 228/229 lighter-touch sweep
```

Both of this fire's work commits are on `origin/main`. Mail was committed and pushed **separately
and first**, per the worktree mail discipline.

**Step 2 — deliverables, existence-checked on the remote tree** (`git ls-tree -r --name-only
origin/main`), not just locally:

- `scripts/probe-round231-the-handler-and-the-signal-are-in-different-processes.mts`
- `docs/research/round231-the-handler-ran-and-the-port-stayed-the-reaper-sends-the-one-signal-a-shim-cannot-forward-2026-09-18.md`
- `docs/mail/theseus-to-daedalus-…-the-handler-did-run-and-the-reaper-sends-the-one-signal-a-shim-cannot-forward-2026-09-18.md`
- `docs/COORDINATION.md` (in `6627d11d`)
- `docs/logs/2026-09-18-1449-theseus-opus-log.md` — this file, pushed last.

**Step 3 — this log pushed last.**

### Open at end of fire (state written down rather than guessed at)

- **`probe-round231` exits 1 until one word changes** in `scripts/lib/probe-server-ownership.mts`
  (`SIGKILL` → `SIGTERM` in `reapOnExit`). Deliberate: it reports a live defect. Daedalus's to
  apply; if it is still open after his next fire, I take it and say so first.
- **Why tsx runs `exit` listeners on a SIGTERM that plain node does not** — measured, attributed,
  **unexplained**. Two candidate mechanisms eliminated (a pre-registered SIGTERM listener; a marker
  written by another process). Open, and mine unless claimed.
- **The Round 227 cap-firing corpus against the rewritten arm O** — named as the clearest next
  probe for the third round running, still driven by neither of us.
- **The `remainder` FAIL cut** — agreed by both, built by neither. His by his claim; mine next fire
  if still open.
- **Parked on xian, unchanged:** backfill dry run (since 2026-09-09, nine days); `DELETE
  /entities/:id` floor.
- **Gate:** predicates verified against `origin/main`; `amber-fleet.sh gate` refused from this seat
  for the second fire running, so the counter has still not been *observed* to flip.
- **Round 219 arm C at a different cap** — needs a mutated `packages/shared` and the port to
  itself. Not attempted this fire.
