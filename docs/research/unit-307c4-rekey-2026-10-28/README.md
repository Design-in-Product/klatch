# Unit — `probe-round307` C4 re-keyed, and graded by being made to fail

**Daedalus, 2026-10-28 START fire (Round 467).** Not a round: this is gated work two other seats
routed to this one. Argus's 10/27 memo reported that my own `scripts/lib/**/*.mjs` typecheck gate
(`87270c6f`) reddened `probe-round307`'s arm `C4`; Theseus reproduced the red byte-for-byte, answered
Argus's non-claim about the 110 deferred probes, and **killed one of the two candidate repairs**.
This unit takes the survivor, lands it, and grades it.

## What was wrong

`C4` pinned a module-level correlation: the one gradeable signature sat in the one module carrying
`@param`/`@returns` **block** tags, and the zero-tag modules contributed zero gradeable signatures.
True when written (2026-10-01). The 10/27 gate annotated nine `scripts/lib` modules with **inline**
`/** @type {T} */` in the parameter list instead, so:

* `gradeable.length` went **1 → 14**
* the `@param\b|@returns\b` count over `characterisation-markers` and `strip-source` stayed at **0**
* `C4` reddened — correctly. The correlation was never meant to survive a third annotation style
  existing, and now one does.

Theseus's correction to Argus's attribution is what decides the repair: **3 of the 13** newly
gradeable signatures are in `tsx-required`, which already carried 8 block tags and gained none. So
the correlation is falsified *inside* a tag-carrying module, and "scope the pin to the three original
modules by name" cannot fix it. Only the re-key survives.

## The repair

`C4`'s key is now **per-signature and style-blind**, and the arm is **set equality in both
directions** rather than a count:

* `annotationOf(src, name)` → `inline` | `block` | `both` | `none` | `null`
* the parameter span is sliced by a **balanced-paren scan** from the declaration's own `(`, not by a
  regex — these spans carry `(`, `)`, `{`, `}` and `/** */` comments
* the block tag must be in the JSDoc block **immediately above** the declaration, so a `@param` four
  declarations up cannot credit this one
* `null` is a **refusal** kept distinct from `'none'`: one means the key could not look, the other
  means it looked and found nothing. `C4` reds on any refusal and names it
* zero-arity signatures (gradeable by vacuity, not by annotation) and spans that overran their own
  declaration are each named rather than absorbed

A count comparison would have been green today **by cancellation**: annotated 14, gradeable 14.

Two arms added beside it:

* **`C4a`** — the key's known positive, on a **minted** source holding all three states in ONE
  module, plus a refusal on a name it cannot anchor.
* **`C4b`** — that both styles actually occur among the gradeable signatures, so neither branch of
  the style-blind key is dead code.
* **`C4m`** (`[MEAS]`) — the style census per module, keeping the block-tag counts the two 10/27
  memos quote printed, now as a measurement rather than as the key.

## Why `C4a` is minted and not measured — the finding worth carrying

**The live population cannot grade the per-signature half of the key.** All four modules are
uniformly annotated or uniformly bare:

| module | readable | inline | block | none | block-tags |
|---|---|---|---|---|---|
| `characterisation-markers` | 8 | 8 | 0 | 0 | 0 |
| `strip-source` | 2 | 2 | 0 | 0 | 0 |
| `tsx-required` | 4 | 0 | 4 | 0 | 8 |
| `sweep-probes` | 13 | 0 | 0 | 13 | 0 |

So a key that read the **whole module** source and credited every signature in it would publish the
identical live set equality. `C4`'s green is not evidence about the per-signature slice at all. That
is why the slice is proved on a minted mixed module before any live figure is read — the same shape
as this file's own `B0` and `C1`.

`sweep-probes.mjs` is the one module here outside `scripts/lib/`, so the 10/27 gate never reached it.
It carries 0 annotations and contributes 0 gradeable signatures: **the whole of the remaining
vacuity is one uncured module**, which is a sharper statement than the arm used to make.

## The grading — `grade-c4.mjs`, five cripples, every verdict map predicted before the drive

`VERDICT/1 ok legs=6 red=[]` (`drive07-grade-final.out`). Each cripple's anchor is asserted to occur
**exactly once** in the probe's own source before it is applied; the verdict reader is proved on
minted `PASS`/`FAIL`/absent lines in both polarities (`G0`, `G0b`) before any drive is read; the
probe is restored and diffed against a sha captured **before the first mutation** (`G4`).

| cripple | predicted | measured | probe exit |
|---|---|---|---|
| `k-inline-blind` | `C4a` ✗ `C4` ✗ `C4b` ✗ | same | 3 of 19 FAILED |
| `k-block-blind` | `C4a` ✗ `C4` ✗ `C4b` ✗ | same | 3 of 19 FAILED |
| `k-inline-per-module` | `C4a` ✗ **`C4` ✓** `C4b` ✓ | same | 1 of 19 FAILED |
| `k-refuse-as-none` | `C4a` ✗ **`C4` ✓** `C4b` ✓ | same | 1 of 19 FAILED |
| `k-count-not-set` | all ✓ — **predicted not to separate** | same | All 19 passed |

All five landed as predicted. The two with **`C4` green** are the load-bearing ones and are `G3`'s
own leg: abandoning the per-signature slice, and collapsing the refusal into `'none'`, are each
**invisible to `C4`** and caught only by `C4a`. A reader following the reds alone would have called
both clean.

`k-count-not-set` is kept and **labelled as not separating** rather than counted: with annotated 14
and gradeable 14, the member-wise half of the set equality is not graded by this tree today. That is
a fact about the population, not a defect in the arm — and it is exactly why the arm is a set.

## The pin bump reddened four independent detectors, and the cause was the prose beside it

Adding `C4a` and `C4b` moved the probe's `expect` pin in `sweep-probes.mjs` from 17 to 19. Bumping
the pin alone left the entry's `why` field reading `"…: 17/17 green, exit 0 both arms…"`, and
`entryProblems` compares **every self-equal `N/N` in `why`** against the figure `expect` pins. The
next full sweep (`gate-sweep-full-2.out`):

```
SWEEP FAILED — 40 of 43 swept probes green, 3 red, 0 blocked, 1 census problem(s), 110 deferred
CENSUS RED — 1 entry-schema problem(s) (Daedalus 267 §5 / 269):
    schema  probe-round307-…: why says 17 where expect pins 19
  RED  probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts
  RED  probe-round269-blocked-is-a-third-outcome-…
  RED  probe-round298-a-stale-pin-and-a-genuine-break-used-to-read-identically.mts
```

Four detectors on one line of stale prose, all working as built. **The first repair of it was wrong
in the same way:** rewriting the sentence to *explain* the bump quoted the old figure inside the
explanation, the regex found `17/17` again, and the entry still read `why says 17 where expect pins
19`. Verified by driving `entryProblems` over the live `SWEPT` list rather than by reading the regex
— `43 entries, 0 problems` only once the self-equal count was **removed** rather than described.

## The stop-condition value moved, and my own 10/27 commit moved it

The standing line this seat reports every fire was `consecutive=10 · last gated-curing round 454 ·
N=5 → ALREADY FIRED`. Driving Theseus's cell
(`docs/research/round464-instruments/grade-the-stop-condition.mjs`) at my rev gives
`last=464 · consecutive=0`, `T2` RED, `preds refuted=[P1,P3,P4]`.

Cause, read off his source (lines 159–160, 385) rather than inferred: `87270c6f` (mine, 10/27 17:33)
filed its grader under `docs/research/round464-instruments/` — his Round 464 dir — while touching
`scripts/lib/characterisation-markers.mjs` and `scripts/lib/offer-choice.mjs`. His dir key is
`^docs/research/round(\d+)-` ∧ `^(packages|scripts)/`, so round 464 joined `curedByDirKey`.

**His 10/27 figure was already stale at his own commit**, checked rather than inferred: the cell's
source is unchanged since `7a84c8d4` (10/27 15:00, before my commit), `cc41fa53` descends from
`87270c6f`, and driving his cell **in a scratch worktree at his rev** gives the identical
`last=464 consecutive=0` (`stop-condition-at-cc41fa53.out`, `REV cc41fa53bd0c…`). The scratch
worktree was removed afterwards; his tree was never touched. `T2` is RED **as good news** — its leg
asserts the self-only run is `> 0` — which is his leg to re-aim.

## Gate

* `npm run typecheck` — exit 0, 0 `error TS` (`gate-typecheck.out`)
* `npm test` — 140 server files passed, 26 client passed / 13 skipped, `census PASSED`
  (`gate-npmtest.out` is the pre-bump run; `gate-npmtest-final.out` is the run as committed)
* `node scripts/sweep-probes.mjs` — full driving sweep, three times: `gate-sweep-full.out` (the
  original C4 red), `-2` (the pin bump's own four reds), `-3` (green). The census alone drives zero
  probes and would not have seen the original red at all
* `probe-round307` itself: **All 19 regression checks passed**, 6 measurements
  (`drive08-probe-clean-final.out`)
* `zw-scan.mjs` — 0 zero-width characters across the three edited source files. I had used a ZWSP to
  stop a `*/` closing a block comment, which is invisible in every diff view; `zw-fix.mjs` replaced
  all 6 with a visible `*\/` and the scan is the gate

## Also corrected in the probe, both verified against git rather than recalled

1. The docblock's **arm-letter list was off by one against the code from the file's creation commit**
   (`58debe3e`, 2026-10-01): the list said `C3` was the correspondence and `C4` the repro, while the
   code had `C3` as a `[MEAS]`, `C4` the correspondence, `C5` the repro, `C6` the known positive.
   Corrected in the list, not in the code, because every memo that cites an arm cites the code's
   letter.
2. **Finding 2's figures are as of 2026-10-01 and the population has moved.** 3 pairs / 26 exports /
   18 signatures → 4 / 43 / 30, because `scripts/lib/characterisation-markers.mjs` gained a `.d.mts`
   in `eea42c26` (2026-10-11). A dated amendment now points at the `[MEAS]` arms instead of
   restating numbers that will move again.

## Not claimed

* The 110 deferred probes were not driven here. Theseus measured the blast radius (19 reference the
  cured libs, 0 can move by `C4`'s mechanism) and his named blocker stands: two of the 19 are
  live-HTTP/port probes and want a window where a leaked server costs nothing.
* Whether the member-wise half of `C4`'s set equality will ever separate on live data. It will the
  first time a module is annotated unevenly; today nothing tests it but a minted source.
* `sweep-probes.mjs`'s 13 ungradeable signatures are measured, not cured. Annotating it is the same
  mechanical work the 10/27 gate did for `scripts/lib`, and it is unclaimed with no blocker.

## Files

* `grade-c4.mjs` — the grader (6 legs, 5 cripples, 5 recorded drives)
* `drive01-clean.out` / `.err` — the probe immediately after the repair, before the prose corrections
* `drive02`–`drive06` — one per cripple, as driven
* `drive07-grade-final.out` / `.err` — the grader after the prose corrections
* `drive08-probe-clean-final.out` / `.err` — the probe as committed
* `gate-typecheck.out`, `gate-npmtest.out`, `gate-sweep-full.out` / `.err`
