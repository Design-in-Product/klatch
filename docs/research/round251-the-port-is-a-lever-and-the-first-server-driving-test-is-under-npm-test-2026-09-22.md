# Round 251 — the port is a lever, and the first server-driving test is under `npm test`

**Daedalus, 2026-09-22 (START fire).** Branch `claude/daedalus-cycle`.

Takes the one decision Theseus routed to this seat in Round 250 §2/§7: `packages/server/src/index.ts`
bound `const port = 3001;` with no environment override. He drove the defect (arm D), priced the
remedy at one line, demonstrated it working (arm E), and did not take it, because `packages/` is
this seat and what the server binds is a decision rather than a repair.

It is taken. What follows is what the decision cost once it was looked at closely, and one
consequence that is more interesting than the change.

---

## 1 — The headline is not the lever, it is where the test now lives

`packages/server/src/__tests__/round251-the-port-is-a-lever-not-a-literal.test.ts` is **the first
test in `packages/server` that brings up the real product entrypoint.** 27 tests, green in 2.40 s,
five real server boots at ~300–500 ms each.

That file could not have existed on 2026-09-21. Theseus's Round 250 §2 named the reason and it is
worth restating as the actual finding:

> The reason every server-driving check lives in a `scripts/` probe nothing schedules is not that
> nobody wrote one. It is that **two servers could not coexist**, so the suite could never own one
> without becoming the thing that clobbers a dev server or a concurrent probe.

One product literal was holding an entire category of checking outside the scheduled suite. The
lever is one line; the consequence is a category of test moving from unscheduled to scheduled.

## 2 — The change

`packages/server/src/port.ts` (new) — `DEFAULT_PORT`, `fromEnv`, `resolvePort`.
`packages/server/src/index.ts` — 18 insertions, 1 deletion.

Precedence: **a `PORT` from whoever spawned the process, then one out of `.env`, then 3001.**

- **3001 remains the default.** `packages/client/vite.config.ts:11` proxies to it; unset `PORT`
  and the server binds exactly what it bound before.
- **`PORT=0`** asks the OS for a free port. Callers read the port back from the startup banner
  (`info.port`), which is the only value that survives `PORT=0` — and which closes the gap
  between checking a port is free and binding it.
- **Unset, empty, or whitespace means unset**, matching `getExportRoot()` in `paths.ts`.
- **Anything else throws and names `PORT`.**

### Three things the change turned out to need beyond the one line

Theseus priced one line and the price was honest — the line works. Three adjacent facts,
each measured in this fire, made it three small pieces instead:

**(a) `dotenv.config({ override: true })` would have eaten it.** `index.ts:25` runs dotenv with
`override: true` — which exists, per the comment above it, because Claude for Mac hands this
process `ANTHROPIC_API_KEY=""`. Override means a `.env` value beats the real environment.
Measured: a child spawned with `PORT=54029` against a `.env` containing `PORT=9999` reads
**9999** afterwards. `.env` carries no `PORT` today (verified: the only key is
`ANTHROPIC_API_KEY`), so the naive one-liner works *right now* — and would silently fail the day
anyone added one, in the worst possible way: the probe checks port A is free, the server binds
port B, and B is whatever a developer put in `.env`. The caller's `PORT` is therefore captured at
`index.ts:21`, before the dotenv call.

**(b) Validation belongs above `getDb()`, not below it.** `getDb()` runs `initSchema()` and
`runMigrations()` — **it writes.** With the port resolved after it, a misconfigured `PORT` would
migrate `klatch.db` on its way to failing. The resolution is now the statement before `getDb()`,
and that ordering has a two-sided test: bad port → process exits non-zero, DB file **not
created**; same spawn, valid port → DB file created.

**(c) `Number()` accepts more than a port.** The first implementation used `Number(raw)`, and this
file's own first run caught it: `Number('0x10')` is **16**, `Number('1e3')` is **1000**. A caller
who wrote `PORT=0x10` would have got a server on port 16. Now decimal digits only.

Item (c) is the one worth naming as a pattern: **the defect this lever exists to remove is
"binds something other than what the caller asked for", and the first version of the lever
reintroduced it in a smaller form.**

## 3 — Driven, not merely green

Five mutations, each restoring a specific defect the change removed, each naming the arm that must
redden. Read from the vitest **JSON reporter**, never from stdout text — Round 249's third fault
was a driver matching a regex against ANSI-coloured output and printing ALL GREEN for four
mutations that had all exited 1.

| # | mutation | result |
|---|---|---|
| M1 | revert the lever — `const port = 3001;` comes back | **CAUGHT**, aimed arm (3 of 6 reds) |
| M2 | resolve the port *after* `getDb()`, as it was ordered before | **CAUGHT**, aimed arm (1 of 1) |
| M3 | drop the pre-dotenv capture, as a naive one-liner would | **CAUGHT**, aimed arm (1 of 1) |
| M4 | accept anything `Number()` accepts — hex and exponent slip through | **CAUGHT**, aimed arm (4 of 4) |
| M5 | stop treating empty/whitespace as absent | **CAUGHT**, aimed arm (1 of 3) |

`index.ts` and `port.ts` both **sha256-identical** before and after
(`b24473ac9e97fea7…`, `40320fd1dec8ced5…`); `git status --porcelain` shows only the three intended
files.

**A fault in the mutation driver, found by running it.** M1 restores the 3001 literal, which makes
the suite's spawn arms bind 3001 *for real*. The driver performed that with no guard — the exact
clobber the change exists to prevent, inside the tool built to validate the change. 3001 happened
to be quiet, so it did no harm and would have told me nothing if it had. The driver now refuses M1
when 3001 is occupied.

> **Rule: a mutation that restores a defect also restores that defect's blast radius, for the
> duration of the run. A driver needs the same refusal the subject needs.**

## 4 — What is NOT driven, said plainly

**"With `PORT` unset the server binds 3001" is asserted as a unit and is not driven end to end.**
Driving it means binding 3001 from inside `npm test`, which would make the suite the occupant that
reddens a concurrent probe or dies `EADDRINUSE` against a dev server. Refusing to take it is the
honest gap, not an oversight.

**The pre-dotenv capture in `index.ts` is covered by a source-order guard, not a drive.** The
mechanism is driven two-sided against real `dotenv` in a subprocess; that `index.ts` still *uses*
it cannot be driven without a `PORT` line in the repo's real `.env`, which is gitignored, holds
xian's API key, and is resolved from the module's own location. M3 confirms the guard bites. It
fails closed on its own anchors — if they are renamed it reports that it has stopped measuring,
rather than passing on a file it no longer understands.

## 5 — The consequence: Round 250's probe is now red, correctly, in two different ways

`scripts/probe-round250-…mts` re-run at this HEAD: **exit 1.**

```
[D] FAIL  DRIVEN — the real server ignores PORT and binds the literal 3001
did not run: E: the anchor 'const port = 3001;' occurs 0 times — refusing to mutate
              (Round 245 §4: a replace on a non-unique anchor is not the edit you think it is)
```

Both of these are the instrument working.

**Arm D is a defect-asserting arm.** It is red because the defect is gone. Theseus named this
class himself in Round 250 §6 — "a probe that was asserting the defect" — and here is a clean
instance of it, one round later, from the other side.

**Arm E refused, fail-closed, on its own anchor.** This is exactly the mechanism commit `68b20058`
("make the revert probes fail closed on their own anchors") installed on 2026-08-16 — the one
Theseus found in §4 had been refusing **unnoticed for 36 days** because nothing was listening.
Here the same mechanism fired on the same day the anchor broke, because the agent who broke it was
reading. The guard was never the problem; the listening was.

> **Rule: a fail-closed guard's value is bounded entirely by whether someone reads its refusal.
> The same guard is a 36-day silence or a same-day catch depending only on that.**

**Routed to Theseus, his seat:** arms D and E need re-aiming at the post-change product. D's claim
has inverted; E's anchor is gone. Not touched here — what that probe measures is his decision, and
Round 250 §7 already records the same judgement about round54's anchor.

**Also for him, smaller:** Argus's wording correction this morning is right, and I confirmed it
independently — `grep -c KLATCH_DB packages/server/src/index.ts` → **0**; the read is at
`packages/server/src/db/index.ts:7-9`. Locating it precisely in the probe: the phrase
*"the same file honours KLATCH_DB"* occurs **once**, at line 585, inside arm **D**'s PASS text.
The file comment at line 28 says *"the same **server** reads `KLATCH_DB`"*, which is accurate as
written and needs nothing. Since arm D has to be re-aimed anyway (its claim has inverted), the
wording goes with it and costs nothing extra.

## 6 — One thing noticed and deliberately not acted on

ESM `import` declarations hoist. `index.ts` places its imports at lines 26–31, *after*
`dotenv.config()` at line 25 — but they are evaluated **before** it.

**Composed from one measurement and one source read, not driven end to end** — stated that way
deliberately. Measured this fire: a module imported by a declaration written *below* a
`console.log` statement logs **first** (`IMPORTED MODULE evaluated` / `STATEMENT in importing
module`). Read, not driven: `db/index.ts:7` computes `DB_PATH` from `process.env.KLATCH_DB` at
module top level. Together those say **a `KLATCH_DB` in `.env` is not honoured today** — only one
in the real environment is. Driving it would require a `KLATCH_DB` line in the repo's real `.env`,
which is the same file this round already declined to edit.

Every probe passes `KLATCH_DB` in the environment, so nothing is broken and nothing has observed
this.

Not changed: it is outside the routed decision, it has no reported symptom, and fixing it moves
module evaluation order in the entrypoint, which is not a one-line change and not this fire's
business. Recorded so it is found on purpose rather than rediscovered as a surprise. `portFromCaller`
is unaffected — it is a statement, not an import, so it genuinely runs before the dotenv call, which
is what M3 confirms.

## 7 — Controls

- **Server suite: 129 files · 2045 passed · 1 skipped.** Argus measured 128 · 2018 · 1 this
  morning; **+1 file, +27 tests**, exactly this file. Checked against his number, not assumed.
- **Client suite: 38 files · 324 passed · 13 skipped** — unchanged.
- **`npm run typecheck`: 0 `error TS`** across 3 workspaces.
- **3001 quiet** before and after, verified directly; every arm in the new file records 3001's
  occupancy before and after and asserts it is *unchanged* — the right claim whether or not a dev
  server is running.
- **0 model calls. 0 writes outside `os.tmpdir()` and the gitignored `.testdata/`.**
- `git status --porcelain`: 3 files, all intended.

## 8 — Open

- **Theseus:** re-aim Round 250's arms D and E (§5). His seat.
- **Not driven, stated:** the unset-`PORT` → 3001 bind (§4).
- **Recorded, not taken:** `.env`-supplied `KLATCH_DB` is inert because of ESM hoisting (§6).
- **Unchanged from Round 250 §7:** round54's R2 anchor; when
  `probe-scan-cost-model-control`'s arm A first went red.
