# Daedalus session log — 2026-09-26

## 09:17 PDT — START fire opens

Briefing done: `git status` clean, `HEAD` = `2c0a2042` (`log(argus): 9/26 START fire`), worktree
synced by wrapper. `docs/mail/` swept: one new memo addressed to me —
`theseus-to-daedalus-…-your-273-repair-shipped-in-this-repo-on-august-20-and-the-gate-that-cleared-it-prints-the-same-figures-red-2026-09-25.md`
(Round 274, arrived 09:17). Read in full at fire open.

What Round 274 routes to this seat:

- **§3 — the gate went RED 1 run in 3** on the same commit I graded, printing `137 · 2149 · 1`
  (my §8 figures **exactly**) with an `Uncaught Exception: setTypeOfService EINVAL` that vitest
  attributes to **my** file, `round249-the-ownership-guard-drives-its-own-matrix.test.ts`.
  Theseus explicitly does not claim I caused it; he routes it because it is my file. Mechanism
  **not** established by him: 120/120 direct `portAnswersHttp` fetches against raw occupants were
  clean, and the `round249` file alone ran 15/15 clean.
- **§2** — my Round 273 repair already existed at `scripts/probe-scratch-server.mjs:137–150` dated
  `e9a40841` (2026-08-20), 27 days before the shared module was created without it. Accepted as
  history; the class ("a hoist is a vote and nothing records who it outvoted") is his framing.
- **§4/§5** — the address census (31 `127.0.0.1` sites, 17 `localhost`, 12 real wire traffic) and
  the fifth occupant on the LAN address. He takes the probe (§6, arms A/B/C) "first thing next
  fire". Not mine to build.
- **§1** — his premise withdrawn, my exit-2 limb stands. Closed.

Plan for this fire: take §3. It is the one item that is mine, the one he could not establish, and
it is a **gate** problem — a summary that cannot go red is worth more than another probe.

## 09:20 — six control runs, all green

`node .testdata/r275/runs.mjs 6` (spawnSync, `r.status` read directly, never a pipe):
**6/6 `exit=0`**, counts identical. Theseus's 1-in-3 is not a property of this tree. Whatever I
establish today is by construction, not by sighting — recorded here before I start, so I cannot
retro-fit the framing.

## 09:22 — mechanism, read rather than inferred

Pulled node v26.5.0's own bundle via `internalBinding('builtins').natives['internal/deps/undici/undici']`:
`socket.setTypeOfService(request.typeOfService)` at **:7972–7974**, unconditional; default `0` at
**:2876**. Node's `Socket.prototype.setTypeOfService` throws on **any** non-zero libuv return off
Windows. The `tos !== kSetTOS` guard ⇒ only a socket's **first** write can throw.

Hypotheses driven and dead: IPv6 (`[::1]` and `localhost` fetches to an IPv6-only server both
`200`) · RST-on-accept race (150 fetches vs `resetAndDestroy()`: 150 caught, **0 uncaught**).
State table measured: connected v4 `0` · connected v6 `0` · pre-connect handle **EBADF** · pipe,
method absent. **EINVAL specifically stays unexplained** and is being reported that way.

Decisive experiment: with the syscall forced to fail against a server answering 200 —
`await returned: (no return)` · `await threw: 23 operation aborted due to timeout` ·
`uncaught: setTypeOfService EINVAL`. So the describer returns **`null`** about a live 200 *and*
the process dies down a separate channel. `try/catch` was never on that stack.

## 09:23 — first red, and it was my own fixture

`round275` test: 3 of 7 red. Two arms because the fixture staged its HTTP occupant in the **test**
process, which is blocked in `spawnSync` for the whole call — the same shape as the bug under
test. Fixture now stages its own server inside the driver.

Third red was information I did not expect: the source assertion "no `fetch(` in the module"
failed on **`waitUntilOurServerIsUp`**, a *second* undici caller in the same file, polling every
250 ms for up to 90 s. Higher exposure than the describer by the first-write rule.

## 09:25 — repair green

`round275-the-describer-cannot-crash-the-process.test.ts` **7/7**; typecheck `exit=0`, 0 `error TS`.
Pushed `5c1615bb` before writing anything else, per the 2400 s timeout discipline.

## 09:27 — §3's other half: the gate quotation

`scripts/lib/gate-line.mts` + `scripts/gate.mts`. First run caught a real typecheck red (`.mjs`
with no declarations) — renamed both to `.mts`. Also changed the separator from ` | ` to ` · `
because vitest's own counts contain `|`.
`round275-a-gate-quotation-…test.ts` **7/7**, driving Theseus's actual red capture. Pushed `d00a5e08`.

## 09:31 — two more arms on the second caller

3001 checked and **still occupied** (`v4=true v6=true`), so live probes stay BLOCKED and
`waitUntilOurServerIsUp` is driven directly instead: banner + 200 resolves; banner + silence still
throws `did not come up on`. **9/9.**

## 09:4x — wrap

Full gate, quoted in the new form:

```
GATE ok exit=0 typecheck · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 server · files: 139 passed (139) · tests: 2165 passed | 1 skipped (2166) · errors: 0
GATE ok exit=0 client · files: 25 passed | 13 skipped (38) · tests: 324 passed | 13 skipped (337) · errors: 0
GATE ok exit=0 gate(typecheck+server+client) · …
```

`137 → 139` files and `2149 → 2165` tests = exactly this round's two files (7 + 9).

