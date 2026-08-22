# Theseus session log — 2026-08-21 19:47 (STOP fire, opus)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.
Network available this fire; two pushes to `origin/main` over the default route, no port-443
workaround needed.

---

## 19:47 — briefing

Pulled state was current (wrapper synced immediately before the fire). `git log origin/main -3`
showed three STOP commits from **other** agents (Iris 19:19, Argus 18:02, Daedalus 17:25) — my
own last fire was the 14:47 WORK fire, so this is my first STOP of the day and gets its own log.

`docs/mail/` — one memo addressed to me, unread:
`daedalus-to-theseus-cc-xian-team-two-thirds-of-the-tap-was-free-and-the-late-subscriber-loses-it-silently-2026-08-21.md`
(committed 17:24). Read in full. It is **not** cc-only: §3 assigns me the probe-side subscriber
with two named constraints. That is the work unit for this fire.

## 19:50 — what the memo actually assigns

He took the sequencing decision I had left as a recommendation (build the tap *before* the arm),
built the free two thirds, and found that `routes/messages.ts:383` — the whole emitter→wire hop —
had **no test at all**: his mutation dropped `toolInput` and nothing in the other 84 files noticed.

Then he split the work: *"the server end is proven and free; the probe end is yours"*, declining
to touch `probe-recall-tool.mjs` on instrument-ownership grounds. Two constraints asked for rather
than assumed: failure isolation, and the lost-race silence visible in the per-run JSON.

Verified his three code claims myself rather than taking them (`client.ts:892-905`,
`routes/messages.ts:300-320`, `db/queries.ts` artifact fields) — all hold. Also verified the thing
that makes the join possible at all and which neither memo had stated: the frame's `inputSummary`
comes from the **same** `toolUseInputSummary(name, input)` call the artifact stores
(`client.ts:892` and `:658`), so the two are byte-identical by construction.

## 19:52 — built `scripts/lib/recall-tap.mjs`

Reader, join, per-call verdicts, run summary. Design notes in the file; the two decisions worth
recording here:

- **`startRecallTap` deliberately sets no status.** It has not been shown the artifact rows, so it
  *cannot* tell `lost-race` from `no-calls` — identical bytes, and the artifact list is the only
  discriminator. `alignTapToCalls` decides.
- **Neither `readExpandArg` nor the summary grammar is reimplemented.** Accepted-vs-rejected comes
  from the artifact summary's `kind`; present-vs-absent is a key test on the raw frame. A local
  copy of `readExpandArg` would have made it one source twice.

## 19:53 — certification: 7 tests, green on the first run

`packages/server/src/__tests__/round71-probe-tap-joins-the-wire-to-the-artifact.test.ts`, reusing
Daedalus's harness (SDK mock, gate, subscriber-before-turn) deliberately rather than rewriting it.
It drives the **shipped probe module** over the real route — real frames from real `client.ts`,
real rows from real `createToolUseArtifact`.

Green on the first run, which is when a test is least trustworthy (my own Round 67 lesson). Ran
three controls.

## 19:55–19:58 — three controls, all run

| control | mutation | result |
|---|---|---|
| **A (production)** | `routes/messages.ts:383` strips `toolInput` before `JSON.stringify` (his own control) | **5/7 red**, every one a named `AssertionError`, none a crash |
| **B (module)** | `readTapVerdict` ignores `expandPresent` | **1 red — the only test that noticed**, exactly the discriminator case |
| **C (module)** | uniqueness check disabled | **1 red**, plus the measured result below |

**Control C is the finding.** I had justified the uniqueness requirement with the phrase "a wrong
join answers the tap's own question by coin flip." I ran it instead of leaving it as an argument:

```
status  : partial
offset  : 0
verdicts: ["dropped-expand","no-frame"]
```

The frame from **call 2** attaches to **call 1**. One guess produces two wrong answers — the
genuine `{query: ''}` is *falsely diagnosed* as a dropped expand, and the real dropped expand is
*reported as unseen*. Worse than a coin flip, which would at least be right half the time on one
call.

**Control A's unlooked-for result.** The two tests that stayed green are exactly the two that
don't depend on the wire carrying `toolInput`. So under a production change that silently strips
the field, the tap degrades to `no-frame` everywhere and attaches nothing wrong. Failure isolation
asked for as a *network* property holds against a *schema* change too — not designed for.

**Control B validates a claim about test design.** The docblock asserts that without the
`{query: ''}` case, a verdict function returning `dropped-expand` unconditionally would pass.
Control B *is* that function, and it passed six of seven.

All three reverted; `git diff --stat -- packages/` empty before continuing.

## 19:58 — wired into the probe

`probe-recall-tool.mjs`: subscribe immediately after the POST (earliest a subscriber can exist),
grace-then-abort after `settle()`, join, additive `tap` object in the per-run JSON, unconditional
console line.

**Caught and fixed mid-build:** my first version called `tap.abort()` *before* awaiting `tap.done`.
`settle()` polls REST once a second, so the reader can still be draining — aborting there would
have truncated a completing capture and *manufactured* the `lost-race`/`partial` the tap exists to
detect. Replaced with a grace race (10s, `unref`'d timer) and abort only as a backstop.

**`unscorableCalls` deliberately unchanged**, which is where I take his intent and not his letter.
The tap can only ever *reduce* unscorability, never add to it, so folding a race outcome into that
count would make a Round 69 number depend on a race. Tap-aware figures went into the new `tap`
object instead. Flagged to him as a disagreement he can push back on.

## 19:59 — typecheck failure, and what it cost to fix honestly

`npm test` red: the test imports untyped `.mjs` across the package boundary (TS7016). Rejected a
hand-written `.d.mts` mirror — it is a second copy of the contract that can drift while tests keep
passing, the exact failure mode this file exists to prevent one level down. Used
`@ts-expect-error` (self-cleaning: if `scripts/` ever gains types, the build says to delete it).

**First attempt failed, and the reason is worth recording:** the directive suppresses the
*following line*, and tsc reports an import's error on its **final** line — so my wrapped
multi-line import moved its own error out from under its own suppression, producing *both* an
unused-directive error and the original one. Collapsed to a single line. Found by running, not by
reading.

## 20:00 — two things built and then deleted

`TAP_STATUS.OFF` (produced by nothing — a dry run `continue`s before the live turn and there is no
`--no-tap` flag, so the value advertised a switch that doesn't exist) and `readSseEvents`'s
`onEvent` callback (no caller). Opposite call from Round 69's `unknown` branch, which I kept for a
hypothetical and which proved reachable — the difference being that `unknown` is a *fallback* for
an unforeseen input while `OFF` was a *claim* that a mode exists.

## Honest limit, restated rather than buried

**The probe's ~20 lines of wiring are unexercised.** The module is certified end-to-end against the
real route; the glue sits in the live path and `--dry` `continue`s before the live turn, so a dry
run reaches none of it. Unchanged from Round 69, not fixable without spend. Checked instead:
syntax, that every imported name resolves, and that the degraded path returns `failed` /
all-`no-frame` / `unresolvedCalls: 1` — Round 69's behaviour exactly. Validate on run 1 before
quoting run 1's numbers.

---

## Session wrap verification

**Step 1 — commits landed on `origin/main`** (`git log origin/main --oneline -5`):

```
a7c58a7 round70: the probe-side SSE tap, certified against the real route and refusing an ambiguous join
5a3d39e mail: reply to Daedalus — the probe end of the tap is built, and a wrong join is wrong in both directions at once
142ff9d log+coordination: 8/21 STOP — no-op, round-70 mail is cc-only, blockers unmoved
0c316c3 log+coordination: 8/21 STOP — round 70's SSE-wire tap independently re-verified
cd455b6 log+coordination: 8/21 STOP — round 70, the emitter-to-SSE hop is pinned and the late-subscriber race is a scoring rule
```

Mail was committed separately and pushed to `main` **first** (`5a3d39e`), ahead of the work commit
(`a7c58a7`), per the worktree mail rule.

**Step 2 — deliverable files** (`ls`, each returned):

```
docs/logs/2026-08-21-1947-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-xian-team-the-probe-end-is-built-and-a-wrong-join-is-wrong-in-both-directions-2026-08-21.md
docs/research/round70-the-probe-side-tap-built-and-what-a-wrong-join-costs-2026-08-21.md
packages/server/src/__tests__/round71-probe-tap-joins-the-wire-to-the-artifact.test.ts
scripts/lib/recall-tap.mjs
```

**Step 3 — production tree clean.** `git diff --stat -- packages/` empty (no *tracked* file under
`packages/` modified; the only addition is the new test file). All three control mutations
reverted and `git status --porcelain` checked before each commit.

**Numbers, all verified this fire:** `npm test` server **1415/1415 (86 files)** — Daedalus's 1408
plus my 7 — client **239 passed / 13 skipped**, unchanged. `npm run typecheck` clean across
shared, server, client. `verify-empty-tail-detector.mjs`, `verify-filler-constraints.mjs` and
`verify-offer-choice.mjs` all pass, so the probe edit moved no arm field, ordinal or scoring
surface. `probe-recall-tool.mjs`: **131 insertions, 1 deletion**, the deleted line being the POST
it replaces — a proof rather than an assurance that nothing else in the instrument moved.

**Cost: zero API calls, zero live runs, no server started, no `.testdata/` file left behind.**

**Open, unchanged: the distance arm's go/no-go is xian's** — `F=17, L=20, G=8`, 80 rows, five opus
runs. **This fire removed a risk from an instrument, which is not a reason to run one.** Also open
and not mine: per-condition reporting; the K-vs-J miss case; the 0/12 non-expansion path; the
per-run JSON ruling, option (2), and the backfill.
