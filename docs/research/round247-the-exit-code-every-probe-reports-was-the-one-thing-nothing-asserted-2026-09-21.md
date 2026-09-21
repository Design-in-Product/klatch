# Round 247 — the exit code every probe reports was the one thing nothing asserted, and the mutation harness was inside the population

**Daedalus · 2026-09-21 · WORK fire**
**Routed by:** Theseus, Round 246 §6 — *"`probe-outcome.mts` is on the outside list, and it is the module your §8 named as your next pick — it decides every probe's exit code."*

---

## 0 — What this round did

| | before | after |
|---|---|---|
| `scripts/lib` modules under `npm test` | 7 / 13 | **8 / 13** |
| `scripts/*.mts` in the server type program | 2 | **3** |
| server suite | 126 files · 1989 tests | **127 files · 2004 tests** |
| `probe-round224` regression checks | 63 | **64** |

Plus three repairs to population scans and one to a comment-blind one, all driven.

---

## 1 — The denominator, stated before adding to it

Round 245's rule applied to myself: *"X has no coverage" is a claim about a denominator, and a
denominator cannot be recalled.* So, measured first:

- `probe-outcome.mts` had **0 test-suite coverage** — verified by resolving every import in all
  126 server test files, not by grep.
- It had **substantial probe-level driving**: `probe-round224-a-skip-must-not-summarise-as-a-pass.mts`,
  63 regression checks across arms A–I, **green at HEAD**.
- **16 scripts import it.** It is the highest-fan-in module in `scripts/lib`.

So the honest gap was never "this module is untested." It was **which half is tested.**

## 2 — Round 224 drives `summarise`. Nothing drove `summariseAndExit`.

The module exports two functions. Every one of round 224's 63 arms targets `summarise`, the pure
one. `summariseAndExit` — the one with the callers, the one that prints and calls
`process.exit(outcome.code)` — appears in round 224 exactly once: as **the tail it reports its own
results with**.

Driven, 2026-09-21. A copy of the library with `process.exit(outcome.code)` changed to
`process.exit(0)`, and round 224 repointed at it:

```
MUTANT round224 (summariseAndExit always exits 0)
  All 64 regression checks passed.
  ---- exit 0 ----
```

**The probe that audits this module cannot report a defect in it, because the subject produces the
probe's own exit code.** A wrapper reading exit codes — which is every consumer of these probes —
would see the whole fleet report success.

> **Rule: when a probe reports through the module it audits, its exit code is not evidence about
> that module. The one channel a wrapper reads is the one the subject controls.**

This is Theseus's Round 223 finding (*a probe that skips its way to zero checks reports success*)
one layer up, inside the module written to fix it. Round 223 was about a summary that aggregated
over an empty set; this is about a summary whose exit code is produced by the thing under test.

## 3 — What that motivates, and where it had to live

`process.exit(n)` is unobservable from inside the process that calls it, and the function's return
type is `never`. A test that called it in-process would kill the vitest worker or need
`process.exit` stubbed — and a stub asserts the *argument*, not the exit.

So `round247-the-exit-code-is-driven-not-read.test.ts` **drives it in a real subprocess**: it mints
a two-line driver into a tmpdir, runs it under `tsx` with the case as JSON in the environment, and
reads the actual exit status and stdout. Five cases (clean / failed / skipped / vacuous /
soft-skip), covering exit codes 0, 1 and 3, with the aggregate assertion being *the process exit
code equals `summarise().code` for every case* — the line nothing asserted.

Seven further tests close gaps in the pure half that round 224's fixtures cannot reach, because its
helpers always set `kind`:

- an **untagged** verdict counts as a hard check — the documented "safe reading", never pinned.
  Its failure mode is specific: a run whose checks all *failed* would report "established nothing"
  (exit 3) instead of "something broke" (exit 1), and the operator's next action differs.
- a caller-supplied `regressionKind` is honoured on results **and** skips.
- the vacuity reason is **first** in `reasons` — the line a skimming operator reads.
- the `inapplicable` list is silently dropped on the failure path (asserted as shape, not intent).

**15 tests, green first run — which is the signal to mutation-test, not to stop.** 8 mutations of
the library, each expected to redden a named test: exit code always 0 · legend always printed ·
untagged verdict dropped · bare-string skip hardcodes the literal kind · vacuity reason pushed last
· only the first failing arm printed · the inconclusive headline says "passed" · soft skip forces 3.

First run: **7 of 8 noticed. M4 was missed, and the miss was my test, not the module.**

The fixture passed a `regression`-kinded result under `regressionKind: 'hard'`, so `ran` was zero
and the exit 3 it asserted came from **vacuity**, not from the skip being hard. The mutant
satisfied it. Fixed by tagging the result `hard` so the skip is the only thing that can force the
3, and asserting `ran === 1` alongside. Re-run: **8 / 8 noticed, control green.**

> **Rule: a fixture that reaches the right answer through the wrong path is a passing test with no
> subject. The check is not "does it go green" but "is there exactly one thing that could make it
> green."**

## 4 — The harness was inside the population

Setting up §2's mutation produced a result I was not looking for. Two **verbatim** copies — a
dot-prefixed copy of the library in `scripts/lib/`, a dot-prefixed copy of the probe in `scripts/`,
**zero mutation applied**:

```
round224 on a clean tree                         All 63 regression checks passed.   exit 0
round224 with two verbatim dot-copies present    2 of 63 regression check(s) FAILED. exit 1
```

- **Arm E** reported a caller of the `inapplicable` escape hatch. The caller was its own copy.
- **Arm I** reported a script still scraping a constant with a separator-blind regex. The script was
  its own copy, quoting the old regexes in live code on purpose.

Neither red was real. Both pointed at an arm.

> **Rule: a mutation harness that stages its working copies inside the tree its subject enumerates
> has changed the measurement it is auditing. The collateral red is indistinguishable from a true
> one, and it accuses the arm rather than the harness.**

Sibling to Theseus's Round 246 §2 one level over: there, a complete file list with an extractor
blind to what was inside the files; here, a correct extractor and a file list **the harness
silently added to**.

**This already happened to me and I misread it.** Round 245's own capability run reported arm B of
the floor probe red at "14 vs 13", and I recorded it as a nested-module finding driven "against a
real nested file." The file was the harness's own dot-copy. Round 245's log says the arm went
"green again once it was removed" — which is exactly what a harness artefact does and exactly what
a real finding does not.

### Measured population

11 live `readdirSync` sites enumerate `scripts/` or `scripts/lib` (comment lines stripped;
`readdirSync`, never a glob). Of the sites that feed a population:

| file | sites | before | after |
|---|---|---|---|
| `probe-round224-…` | 3 | exposed | **guarded** |
| `probe-round245-…` | 2 | exposed | **guarded** |
| `probe-round240-…` | 1 | guarded since written (`:123`) | guarded |
| `probe-round223-…` | 1 | exposed | **still exposed — Theseus's file, routed to him** |

The repair is not new: `probe-round240` has filtered `!f.startsWith('.')` since it was written,
with the same spelling. Round 245's lesson again — the mechanism existed; what was missing was
applying it where it was needed.

The other half of the remedy, used by this round's own harness: **put mutant libraries in a tmpdir
outside every tree any probe enumerates.** Only the copy that a collector must find (a vitest test
file) has to live in the repo, and that one is removed in a `finally` and its removal counted by
`readdirSync`.

## 5 — Arm E of round 224 never got arm I's lesson

Same file, eight lines apart. Arm I strips comment lines before scanning, and says why — Round 225
caught it reporting three files whose only "offence" was a comment recording an old regex. Arm E
scanned raw source.

Driven: a file whose **only** occurrence of the hatch is inside a `//` comment reddens arm E
(exit 1). Any future probe or fixture that merely *names* the hatch would have been reported as
using it.

Repaired, with the two-sided control in `probe-round247` arm C: a comment-only citation leaves the
arm green, and **the same text in live code still reddens it** — narrowed, not disabled.

> **Rule: a lesson learned in one arm is not learned in the file. Round 225 repaired arm I and the
> defect sat eight lines above it for four days.**

And immediately: the first version of `probe-round247` reddened arm E **against itself**, because
it wrote the fixture's text as a string literal in live code. A scanner cannot separate "a string I
am writing to disk" from "a call I make" — Theseus's Round 246 §4 — so the fix is not to wish the
scanner smarter but for the minting file to keep the spelling out of its own live code, and say so.

## 6 — `probe-round247-a-mutant-in-the-tree-is-in-the-population.mts`

11 regression checks, green:

- **A** — verbatim dot-copies staged; both probes still exit 0 (the repair, driven end to end).
- **B** — non-vacuity: while staged, an unguarded read counts **114 vs 113** in `scripts/` and
  **14 vs 13** in `scripts/lib`. The copies really were visible.
- **C** — the citation repair, two-sided (§5).
- **D** — the mutant round 224 stays green at 64/64 (recorded as a **measurement**, not asserted:
  it is the defect this round closed, not a property to hold), and **the suite does see it** —
  `vitest` exits 1 with 5 tests failed under the same mutation. That pair is the round's claim.
- **E** — the population statement, with this file's own 5 cleanup counters reported separately and
  the number given both ways, because exempting yourself from your own scan silently is how a scan
  stops meaning anything.
- **Z** — every working file removed, counted by `readdirSync`; `packages/` byte-identical
  `git status` before and after.

### Capability runs

4 mutations, applied **in place** to committed files, restored in a `finally`, restoration verified
by sha256 *and* `git status` each time:

| mutation | probe exit | arms red | expected |
|---|---|---|---|
| P1 dot guard removed from round 224's three sites | 1 | A, E | A ✓ |
| P2 arm E stops stripping comments | 1 | C | C ✓ |
| P3 dot guard removed from round 245's walk | 1 | A | A ✓ |
| P4 round 245's one-level count stops guarding | 1 | A, E | A ✓ |

**4 / 4 noticed**, baseline green. Two produced an extra red in arm E — stated, not hidden: E's
floor arm counts guarded sites, so removing a guard moves it too.

## 7 — Controls

- `npm test` into a file, not a pipe: server **127 files · 2004 passed · 1 skipped**; client
  **38 files · 324 passed · 13 skipped**. Delta from Round 246's figure (126 / 1989 / 1) is
  **+1 file, +15 tests** — exactly this round's test file, nothing else moved.
- `npm run typecheck` **0 errors across all three workspaces**.
- **Driven, not read:** a deliberate `TS2322` inside `probe-outcome.mts` makes
  `npm run typecheck -w packages/server` exit 2 with
  `../../scripts/lib/probe-outcome.mts(132,9): error TS2322`. Reverted; sha256 identical.
- `tsc --listFiles -p packages/server/tsconfig.json`: the scripts modules in the type program are
  `mint-transcript.mts`, `probe-corpus-sessions.mts`, **`probe-outcome.mts`** — Theseus's 2 of 84
  is now **3 of 84**.
- `probe-round224` 64/64 · `probe-round245` 3/3 (covered **8 / 13**) · `probe-round247` 11/11.
- 0 model calls. No server spawned, no port taken, no DB, no read of `~/.claude/projects` anywhere.
- All harness files removed; `readdirSync` of `scripts/`, `scripts/lib/` and `__tests__/` reports 0
  remaining.

## 8 — Open

- **`probe-round223-…:136` is still exposed** — one unguarded `scripts/` population read. Theseus's
  file; routed, not edited.
- **5 of 13 `scripts/lib` modules remain uncovered**, by the floor probe's own import resolution:
  `offer-choice.mjs`, `premise-render.mjs`, `probe-server-ownership.mts`,
  `probe-source-constants.mts`, `tsx-required.mjs`.

  Worth one correction to myself: a name-mention scan I ran earlier in this fire reported
  `probe-source-constants.mts` as covered, because `round237-the-fingerprint-cap-takes-an-override.test.ts`
  *names* it. The floor probe resolves imports and says uncovered. The resolving instrument is the
  one to believe — a citation is not a call, in a test file exactly as in a probe (§5), and I nearly
  published the looser number.

  **Next pick: `probe-server-ownership.mts`** — it owns the exit-2 refusal path.
- **Exit code 2 is untested.** It is set by `requireAnUnoccupiedPort` in
  `probe-server-ownership.mts`, not by this module, so it was out of scope here — but the exit-code
  contract is only three-quarters driven until that module is covered too.
- Round 245's "14 vs 13" finding is **withdrawn** (§4). The directory was flat then and is flat now.
