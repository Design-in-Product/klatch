# unit-465scanopts — the browse screen's turn count and the import's turn count are computed with different options

**Seat:** Daedalus · **Date:** 2026-11-12 (MID/WORK fire) · **Model:** claude-opus-5

**Committed and pushed to `origin/main` before the arm exists.** Figures below that are not
labelled *measured this fire* are inputs to the predictions, not results.

---

## Why this unit exists

Theseus's 11/12 memo (`theseus-to-daedalus-argus-…-the-blocker-you-deferred-parser-ts-behind-is-dead-…`)
§1 reports that the blocker I parked the `parser.ts` unification behind is dead. Measured again
this fire, three calls, before writing this file:

```
git log -1 --format='%h %ad' --date=short origin/claude/cowork-import-hardening   b5e1672a 2026-09-02
git rev-list --left-right --count origin/main...origin/claude/cowork-import-hardening   2876   0
git merge-base --is-ancestor b5e1672a origin/main                                  rc=0
```

His figure was `2870 0`; mine is `2876 0`, and the difference is the six commits `main` has taken
since his fire — the right-hand `0` is the one that carries the claim, and it reproduces.

**But the deferral was not merely unblocked — it was partly discharged by the very branch it was
waiting on.** My 9/03 memo named two divergences between the browse scanner's inline filter and
`isHumanTurnBoundary`:

1. *"the scanner also drops `isVisibleInTranscriptOnly`"* — **`parser.ts:428` checks it today**, and
   `git log -1 -S` on that exact line returns **`b5e1672a`**, the branch tip. The thing I was
   waiting for is the thing that cured half of what I was waiting to fix.
2. *"the boundary predicate also requires `message.role`"* — still true, and inert: the scanner only
   increments when the predicate returns `true`, so the predicate's extra strictness is applied.

**What I found while reading the live code instead of my own memo is a third divergence that neither
my memo nor Theseus's names, and it is the one that can move a user-facing number.**

- `session-scanner.ts:426` — `if (isHumanTurnBoundary(event)) turnCount++;` — **no `opts`**.
- `parser.ts:626-629` — the import computes `requirePermissionMode` per file
  (`rawEvents.some(e => e.type === 'user' && e.permissionMode !== undefined)`) and passes it into
  `groupIntoTurns`, which passes it to `isHumanTurnBoundary`.

`requirePermissionMode` only *adds* a rejection clause (`parser.ts:442`). So the import's boundary
set is a **subset** of the scanner's on any session that carries `permissionMode`, and
`groupIntoTurns` pushes exactly one turn per boundary index (`parser.ts:503-567`), so the two counts
are directly comparable.

`turnCount` is **user-facing**: `ImportDialog.tsx:942-943` renders it as `"N exchanges"`, and
`session-scanner.ts:264` calls it **exact**.

And the legacy branch is not a harmless alternative — the parser's own docblock
(`parser.ts:430-437`) says testing only for absence *"fails open"* and, **on this exact file**,
*"6-7 of 75 turns fabricated."*

---

## Subject, pinned by content not by line number

Measured this fire, inputs to the predictions:

| file | lines | `grep -c permissionMode` |
|---|---|---|
| `exports/sessions/theseus-2026-03-22.jsonl` | 1001 | **73** |
| `packages/server/src/__tests__/fixtures/real-shapes-2.1.241.jsonl` | 400 | 2 |
| `packages/server/src/__tests__/fixtures/real-shapes-2.1.81.jsonl` | 20 | 4 |
| `research/1f171719-1bab-4650-b61d-d5938807cc8d.jsonl` | 5 | **0** |
| `packages/server/src/__tests__/fixtures/simple-session.jsonl` | 4 | **0** |
| `packages/server/src/__tests__/fixtures/tool-heavy-session.jsonl` | 7 | **0** |
| `packages/server/src/__tests__/fixtures/subagent-session.jsonl` | — | **0** |

The zero-`permissionMode` files are the **control arm**, not padding: they are the files on which
the divergence must be absent if it is keyed on what I say it is keyed on.

---

## Predictions, registered before the arm exists

- **P1 — the divergence is live and signed.** On `exports/sessions/theseus-2026-03-22.jsonl` the
  scanner's `turnCount` is **strictly greater** than `parseEvents().turns.length`. Point prediction
  from the parser's own docblock: **delta is 6 or 7**. Graded as HELD only if the delta is in
  `{6,7}`; a delta in `[1,20]` outside that is a PARTIAL (direction right, magnitude wrong).

- **P2 — the harm is one-signed.** On **every** file measured, scanner `turnCount` ≥ import turn
  count. The browse screen can over-report exchanges; it cannot under-report them. (Structural:
  `requirePermissionMode` only adds a rejection.)

- **P3 — control.** On every file with **zero** user events carrying `permissionMode`, the delta is
  **exactly 0**. If a zero-`permissionMode` file shows a non-zero delta, the cause is not the one
  I have named and P1 does not get to keep its explanation.

- **P4 — the probe built to catch this drift cannot see it.**
  `scripts/probe-browse-count-vs-persisted-rows.mts` calls `groupIntoTurns(...)` at `:63` and
  `isHumanTurnBoundary(e)` at `:79` **both without `opts`**. On the same file where P1's delta is
  non-zero, the probe prints `(== parser boundaries)` and **no** `predicate drift` line — i.e. it
  reports agreement, and that agreement is **vacuous**, because both of its keys read the legacy
  branch. Graded by running the probe, not by reading it.

- **P5 — two live comments assert something false.** Both of these say the scanner drops
  `isVisibleInTranscriptOnly` and the predicate does not check it:
  - `session-scanner.ts:421-425`
  - `probe-browse-count-vs-persisted-rows.mts:70-72`

  `parser.ts:428` checks it. Census of the claim across `packages/server/src`, `scripts`,
  `packages/client/src` this fire: **2 sites** (the other `near-identical` hits are round-37x probe
  prose about string replacement and are not this claim). Graded as HELD if both sites are present
  verbatim in the live tree at run time — because a cure has to edit **prose as well as code**, and
  a count of sites is what tells the next fire whether it got them all.

- **P6 — `session-scanner.ts:416-418` is false as written.** The comment claims the scanner counts
  turns *"with the importer's own predicate, so the browse screen and the import agree by
  construction rather than by coincidence."* If P1 holds, the sentence is false for every
  `permissionMode` session. Graded as HELD if the sentence is present verbatim AND P1 holds.

---

## Refusals — the arm prints no figure if any of these fails

- **R1** `session-scanner.ts` contains `if (isHumanTurnBoundary(event)) turnCount++;` **exactly
  once**.
- **R2** `session-scanner.ts` contains `requirePermissionMode` **zero times**. If it appears, the
  scanner may already pass the option and my premise is wrong — refuse rather than measure.
- **R3** `parser.ts` contains `const requirePermissionMode = rawEvents.some(` **exactly once**.
- **R4** every fixture path in the table above exists and is readable.
- **R5** for each file, the arm recomputes boundaries under the file's own `requirePermissionMode`
  and asserts that count **equals** `parseEvents().turns.length`. If turn count ever stops equalling
  boundary count, the comparison in P1 is not the comparison I described — refuse.
- **R6** for each file, the arm computes `requirePermissionMode` two ways — the parser's own `some()`
  over user events, and a direct count of user events carrying `permissionMode` — and refuses if
  `some()` is false while the count is `> 0`.
- **R7** the arm reads every figure off the **live tree at run time**. No number in this
  pre-registration is restated by the arm as a result; the table above is an input.
- **R8** **exit code tracks the APPARATUS only.** A refuted prediction and a broken instrument must
  not share `rc=1`. The arm prints the refusal tally and the prediction tally as two separate
  headline lines, and exits non-zero only on a refusal or a crash.

---

## What this unit does NOT do

- **It does not apply a cure.** If P1 holds, the fix touches `packages/server/src` — a gate leg is
  owed and the change is a behaviour change to a user-facing number, which wants its own commit and
  its own driven gate, not a line smuggled into a measurement unit.
- It does not re-measure the `messageCount`/persisted-rows decomposition the Round 141 probe already
  owns. This unit is about `turnCount` only.
- It makes no claim about which count is *right* for the browse screen. Agreeing with the import is
  the stated design intent (`session-scanner.ts:416-418`); whether that intent is correct is not a
  measurement.
