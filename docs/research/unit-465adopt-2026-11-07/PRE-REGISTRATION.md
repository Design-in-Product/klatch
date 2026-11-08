# unit-465adopt — the promotion decision I declined this morning, retaken now its blocker is cleared

**Seat:** Daedalus · **Date:** 2026-11-07 (STOP fire) · **Model:** claude-opus-5

**Registered before any instrument in this directory existed and before any drive.** The landing
rule is at the bottom and is set before a result is read.

## Why there is a unit here at all

This morning (`unit-465promote`, WORK fire) I was asked by Theseus's §5 to promote
`scripts/probe-backfill-sidecar-neutrality.mts` out of `DEFERRED` in `scripts/sweep-probes.mjs`,
and I **declined with a named blocker**: arm E is race-shaped, Theseus keyed "the state was built"
on the `-wal`'s inode, and keying on identity turns a *lost* race into a non-zero exit that
`classify` reads as RED — a red on a tree where the product behaved perfectly. Two of arm E's three
rows also printed a `FAIL` whose own reason text said the claim held.

Theseus took the cure (`unit-465skipE`, 15:0x PT) and his memo says the blocker is cleared on its
own axis: the not-built path is now a hard skip through `probe-outcome.mts`, so the probe exits 3
and prints a structural `did not run: <label>` line, and `classify`'s BLOCKED limb accepts that
pair **only if the promoting entry declares the label**.

I am not promoting on the strength of his table. *A routed finding does not validate its routed
cure*, and the join this promotion turns on is specifically between **his label** and **my
regex** — a string equality nobody has driven under my key. So: my own cripples, my own drives,
registered first.

**What I am not re-deriving.** That a *real* lost race reaches the not-built branch is Theseus's
drive1, and I cite it as his. My X1 below is an honest state builder lifted from his cripple
(`c71aacf0`) under my own variable name, which is the same mechanism, not a re-spelling of it.

## The entry I propose to write

```js
  {
    file: 'probe-backfill-sidecar-neutrality.mts',
    expect: /All 13 regression checks passed/,
    skip: /the race state could not be built/,
    why: '…13 regression…',
  },
```

Moved out of `DEFERRED`, with the existing DEFERRED note's history left whole where the note's own
record of the uncured state belongs.

## Predictions

Each one is a cell, driven against the **real probe** via `npx tsx`, with `classify`,
`entryProblems` and `measurementCheck` **imported** from `scripts/sweep-probes.mjs` and never
re-spelled at the call site — a grader that re-types the thing it grades grades its own copy.

**The entry's three states, which is where the declaration has to be load-bearing both ways:**

* **P1 — control.** No cripple: exit **0**, output carries the literal pin `All 13 regression
  checks passed`, and `classify` with the proposed `expect` + `skip` returns
  `state: 'PASS', matched: true, skipped: false`.
* **P2 — X1, race lost, label declared.** Exit **3**; **some single line** of the output contains
  `did not run:` *and* matches `/the race state could not be built/`; `classify` returns
  `state: 'BLOCKED', skipped: true`. (The same-line conjunction is asserted on the line, not on the
  whole output — `classify` requires both on one line and a whole-output check would pass for the
  wrong reason.)
* **P3 — X1, no declaration.** The *same recorded output*, classified with `skip` undefined:
  `state: 'RED'`.
* **P4 — X1, declared label absent from the line.** The same output, classified with
  `/the race state was not built/` (a near-miss spelling): `state: 'RED'`.

**That promotion does not blind the arm — the half a promotion can quietly cost:**

* **P5 — C1, the product's size test removed, race won.** Exit **1**, pin **unmatched**, and
  `classify` with the full proposed entry returns `state: 'RED'`. If this came back BLOCKED or
  PASS, the promotion would be buying a cell that cannot report the defect arm E exists for, and
  the answer would be no.
* **P6 — X1 + C1, a lost race under a crippled product.** Exit **3**, `state: 'BLOCKED'`.
  Registered as a **prediction** rather than inherited as Theseus's §5 finding: it is correct
  (nothing was measured, so nothing may be concluded) and it is the cost I am accepting — arm E's
  power is conditional on winning the race, and a BLOCKED row here means *we do not know*, never
  *the guard is intact*.

**The entry as an object, checked by the file's own auditors rather than by my reading of them:**

* **P7 — `entryProblems(entry)` returns `[]`.** `expect` contains no `\d`; it pins `13`; `why`
  states `13` in the checkable `N regression` spelling; `why` contains no self-equal `N/N` pair
  other than `13`.
* **P8 — `measurementCheck(entry, controlOut)` returns `{}`.** My `why` will claim no measurement
  count, so the claim is absent rather than unenforceable. Predicted `{}`, not `{note}`.

**The registry move, and the thing a promotion is most likely to break silently:**

* **P9 — the census moves by exactly one in each direction.** `node scripts/sweep-probes.mjs
  --census`: total probe files **154 unchanged**, swept **43 → 44**, deferred **111 → 110**,
  `CENSUS OK`, exit 0.
* **P10 — no swept probe reddens on this promotion.** *A pin on a count reddens on its own
  promotion*, so the population at risk is the swept probes that read the registry at all:
  **25 of the 43**, selected mechanically by `SWEPT.length`-membership ∩ source containing
  `SWEPT|DEFERRED`, not by eye. All 25 driven **before** the edit and **again after** it, and the
  prediction is **verdict-identical per probe across the pair** — a delta, because a probe that
  was already red before my edit is not evidence about my edit, and a constant-reader blindness
  cancels in the difference.
* **P11 — promotion does not reach `npm test`.** `package.json` and `gate.mts` both pass
  `--census`, which returns before the driving loop. So the gate's server and client figures stay
  byte-identical to this morning's (server **143 files / 2221 passed / 1 skipped (2222)**; client
  **26 / 346, 333 passed / 13 skipped**) and the probe appears in no vitest output. This re-reads
  my own `unit-465promote` §5 as a prediction instead of leaving it as a note.

## A declared measurement, with no threshold attached

* **M1 — the spontaneous race-loss rate.** Promotion buys a cell that is silent whenever the race
  is lost, and a BLOCKED row takes the whole hand sweep's exit code to **2** (`sweepExit`). Nobody
  has measured how often a *healthy* run loses it; Theseus has two control drives, both won. I will
  drive the uncrippled probe **10** times and report the count of not-won states. This is a
  measurement, not a prediction: I am not declaring a rate I would accept in advance, because the
  honest form of the question is "what does the entry's `why` have to tell the next reader", and
  any non-zero count changes that text rather than the decision.

## What is NOT in scope

* **E4/E5** — the `-shm` orphan when a `-wal` pre-exists — is Theseus's open product decision, read
  this fire at `unit-465sizeguard/PRE-REGISTRATION.md:105` and `RESULTS.md:185` rather than taken
  from the memo. It is a question about what the *cure* should do, not about whether the probe is
  sweep-readable, and it does not gate this axis. Declared cost: when E4/E5 lands as new arms the
  pin moves off 13, exactly as it would for any entry.
* The `DEFERRED` note's existing text. It is a record of drives that happened and stays true as
  one; promotion moves the file, it does not overwrite the history of why it was declined.

## Landing rule, set before any result is read

* **Promote** iff P1–P9 and P11 all hold *and* P10 shows no verdict change on any of the 25.
* **P5 failing is dispositive against promotion** on its own: a cell that cannot report its
  defect is worse than no cell, because a green sweep row would then be evidence for a claim the
  probe is not making.
* **P2 failing** (the label/regex join) means the regex Theseus specified is wrong as written, and
  the promotion is declined again with that as the named blocker — not patched by widening my
  regex until it matches, which would be keying my entry on whatever the run happened to print.
* **M1 non-zero** does not block; it is written into the entry's `why` as a declared property of
  the cell, so the next reader of a BLOCKED row is not surprised by it.
* Any prediction that comes back refuted is recorded as refuted, with the refuting output, before
  anything in the tree is edited to suit it.
* Both cripples are env-gated, committed **before** being driven, and removed before the unit
  lands — with restoration verified against a pre-action baseline taken from git, not from a quiet
  `git status`.
