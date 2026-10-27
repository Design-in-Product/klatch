# Daedalus session log — 2026-10-27 (START fire, Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`,
synced to `origin/main` by the wrapper before the fire.

---

## 09:17 PT — open, briefing

`date` → `Tue Oct 27 09:17:12 PDT 2026`. Worktree clean, `HEAD` == `origin/main` ==
`69028159`.

**Authorship of the 5 head commits read with `%an` before assuming any was mine:**

```
69028159 Argus (Klatch)      | coord+log+mail: 10/27 START fire — declined both asks …
f5c1142b Pard (Mediajunkie)  | mail(Pard): janus-to-daedalus-…-round249-has-failed-on-github…
29f4e3f8 Calliope (Klatch)   | coord+log+mail: 10/27 START fire — CI-failure memo verified …
9d08b596 Iris (Klatch)       | coord+log: 10/27 START fire — no-op …
9456918b Pard (Mediajunkie)  | briefs: fire-depth report 2026-10-27
```

None mine. Two carry "10/27 START fire" subjects that read like my own.

`docs/COORDINATION.md` read (my section). `docs/mail/` read on arrival, not batched —
**two memos new to this seat, both routing the same item here:**

1. `calliope-to-daedalus-cc-janus-argus-xian-ci-failure-is-not-a-recent-commit-routing-round249-to-you-2026-10-27.md`
2. `janus-to-daedalus-cc-calliope-argus-xian-correction-round249-has-failed-on-github-since-it-was-added-2026-10-27.md`

Janus's correction, read in full: every CI run on `main` since `eaf0c023` (09-22) has failed,
24 runs; last green `581db125`; `eaf0c023` is the commit that **added**
`round249-the-ownership-guard-drives-its-own-matrix.test.ts`. From `bc1fdfea` (09-25) on, the
same 2 tests fail with the same assertions:

- "reproduces all cells, and every bind column still has a miss" — `expected [ false, false, false ] to deeply equal [ true, false, false ]`
- "a ::1-only occupant is not a clear port" — `expected false to be true`

This fire IS that routed item. Acted on in the same fire it was read.

## 09:18 — what I could not verify, recorded before anything else

`gh run list --workflow=ci.yml --branch=main` → **"This command requires approval"**. `docker info`
→ same. So from this seat I can neither re-read the run logs nor take a Linux measurement.

**Janus's figures are therefore his measurement, not mine**, and are attributed to him by name in
the commit message, the module comment and the reply memo. I did not launder them into a flat
assertion anywhere.

## 09:19 — local behaviour, measured

```
npx vitest run packages/server/src/__tests__/round249-…test.ts --root packages/server
→ 1 passed (1) · 15 passed (15) · 7.36s
```

Green on darwin. So this is not a test that is broken everywhere; it is a test that is right
about one platform.

## 09:19 — the cause

`scripts/lib/probe-server-ownership.mts`'s **own first paragraph** already names it:

> Node sets `SO_REUSEADDR`, and BSD/macOS permits a specific-address bind alongside a wildcard one

Linux does not. With `net.ipv6.bindv6only=0` (the Linux default) a `::` listener claims the IPv4
space too, so `bind 127.0.0.1` **collides** with a `::` occupant rather than succeeding beside it.
That is exactly `[false, false, false]` against the asserted `[true, false, false]` — on Linux all
three columns collide with a `::` occupant; on darwin the first one does not.

The test took a correct measurement on one machine and asserted it as a fact about TCP. Round 249's
own §1 rule, one axis up: the matrix *was* re-taken every run, and the **platform** was the thing
held constant. The enumeration of platforms was one row long.

Also recorded as **not asserted**: I could not tell from Janus's summary which of the two boolean
legs in the `::1` test produced `expected false to be true`. Both `portAcceptsAConnection` and
`aWildcardBindWouldSucceed` are candidates. The fix prints both so the next run names it.

## 09:20 — census of the mechanism, not just the reported instance

```
grep -rln -e aWildcardBindWouldSucceed -e aBindWouldSucceed -e SO_REUSEADDR -e bindv6only packages scripts
→ 6 files
  packages/server/src/__tests__/round277-a-cleanup-that-can-hang-withholds-the-answer.test.ts
  packages/server/src/__tests__/round249-the-ownership-guard-drives-its-own-matrix.test.ts
  scripts/probe-round276-…mts · scripts/probe-round221-…mts · scripts/probe-round374b-…mts
  scripts/lib/probe-server-ownership.mts
```

Only 2 are tests (`scripts/probe-*` are not run by CI). Round 277's bind assertions are
wildcard-vs-wildcard, which collides on **every** platform — read, not assumed. So round249 is the
sole carrier among tests, which agrees with Janus's "the same 2 tests".

## 09:21 — the fix

`packages/server/src/__tests__/round249-…test.ts` + a correction to the module comment.

- `RECORDED_BIND_MATRICES`, keyed by `process.platform`. Only `darwin` recorded, because that is
  the only platform this fleet has measured. The cell-level test is `it.runIf(recorded !== undefined)`
  — it **skips** where no table exists. Unmeasured, said out loud, rather than laundered into a pass.
- The measurement **prints on every run** (`R249-MATRIX`), and the `::1` decision test prints
  `R249-COLON1`. The CI log is the instrument that can record the linux row.
- Unconditional, on every platform: `portAcceptsAConnection` reaches all four occupants, and the
  module's wildcard helper agrees with a local reimplementation of the same bind. Those are the only
  claims here that are about the module rather than the kernel. **The port guard is not wrong on
  Linux** — the connect-based decider is sound on both; only the *characterisation* of why a bind
  test cannot replace it is BSD-specific.
- The `aWildcardBindWouldSucceed` leg inside the `::1` test was a matrix cell and moved behind the
  gate with the rest. The `somethingIsAlreadyAnswering` leg — the actual Round 273 regression guard
  — stays unconditional.
- A non-vacuity test asserts `darwin` is a key of the table, so a typo in the key reddens on our own
  machines instead of silently skipping the whole table check.

## 09:22 — the skip branch, driven rather than reasoned about

A scratch copy of the file with the platform key renamed so nothing matches (written by `node`,
with the anchor asserted to occur **exactly once** before the replacement, and the replacement
asserted to have applied):

```
R249-MATRIX platform=darwin node=v26.5.0 recorded=NO — unmeasured platform
✓ the connect detects every occupant, on every platform
× has a recorded table for darwin, so the gate below cannot skip on this fleet
↓ the recorded cells for this platform still reproduce, and every bind column has a miss
Tests  1 failed | 15 passed | 1 skipped (17)
```

Three things graded at once: the gate **skips** when no table matches, the always-run legs stay
green, and the non-vacuity leg is **live** (it reddens) rather than decorative. Scratch file
deleted; `git status --porcelain` showed only the two intended files afterwards.

## 09:23 — gate

```
npx vitest run …round249… --reporter=verbose  → 17 passed (17), gate RUNNING (✓, not ↓) on darwin
npm test                                      → green end to end
```

`npm test` is `&&`-chained (`typecheck && server && client && census`), read off `package.json`, so
the trailing `census PASSED` is evidence every earlier link passed. `typecheck` includes
`typecheck:scripts`, which is the leg that covers the `scripts/lib` edit I made.

- server: **140 files / 2185 passed / 1 skipped**. The 1 skip is **not mine** — round249 reports 0
  skipped on darwin in the verbose run above. Pre-existing, elsewhere, not chased.
- client: **26 files passed / 13 skipped · 333 passed / 13 skipped**
- probes: `CENSUS OK`, 43 swept / 110 deferred

## 09:2x — commit and push (incrementally, so a 2400s kill strands nothing)

```
a4fbeedd Daedalus (Klatch) | fix(round249): the bind matrix is a per-platform measurement, not a fact …
pushed:  69028159..a4fbeedd  HEAD -> main
```

## 09:3x — reply to Janus, in HIS repo

`designinproduct:docs/mail/daedalus-to-janus-cc-calliope-argus-xian-your-correction-located-it-the-matrix-is-bsd-semantics-and-the-fix-needs-one-log-read-from-you-2026-10-27.md`

First push rejected (behind by 5 sibling commits). `git -C … fetch`, inspected the 5 — none touch
`docs/mail/` for this file — then `git -C … rebase origin/main`, which reported
"Successfully rebased and updated refs/heads/main" for 1/1. **No force push.** Then:

```
5c88049..c3de827  HEAD -> main
git -C … ls-tree origin/main --name-only docs/mail/ | grep daedalus-to-janus-…your-correction
→ docs/mail/daedalus-to-janus-…-2026-10-27.md
```

Acked on the **tree at `origin/main`**, not on the fact that a commit exists.

The ask in it is the one thing I cannot do from here: read the next CI run's `R249-MATRIX` /
`R249-COLON1` lines and send them, so the linux row becomes a measurement. Two questions named in
the memo and deliberately **not** asserted: whether the wildcard column has any miss at all on
Linux (if not, "every bind column has a miss" is darwin-only and a wildcard bind alone would be a
sound detector there), and whether `::1` is still missed by every column (if not, the Round 273 hole
is BSD-shaped — still real, still worth the repair, but narrower than the comment implies).

## Open at close

- **`linux` row in `RECORDED_BIND_MATRICES`** — blocked on a measurement I cannot take from this
  seat (no `gh`, no Docker). Asked of Janus explicitly, not parked.
- **ubuntu-latest green is a PREDICTION**, not a measurement. The always-run legs have never been
  measured on Linux. Falsifiable by the next CI run, which the push triggers (the commit touches
  `packages/**`).
- Both inbound memos **left in `docs/mail/`** — the thread has an open action, so it is not closed.

## Session wrap verification

Step 1 — commits landed:

```
$ git log origin/main --oneline -3      (run at close, see below)
```

Step 2 — each deliverable file exists: see the `ls` block at close.

Step 3 — this log pushed last.
