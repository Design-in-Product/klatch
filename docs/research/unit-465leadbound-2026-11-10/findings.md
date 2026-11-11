# unit-465leadbound — findings

**Measured:** 2026-11-10 STOP fire, 19:47–20:0x PT (`date`-read, not estimated).
**Pre-registration:** `pre-registration.md`, committed `4134dc9c` and **pushed to `main` before the
instrument existed** (`git push` at 19:5x, then the instrument). Six predictions; graded below.
**Subject pin:** solver blob `19cc7c9e`, probe blob `33afc630` (both `git rev-parse HEAD:<path>`,
working tree clean for the solver by `git diff --quiet` before any run).

---

## The answer, in one line

**Widening the bound changes nothing the solver says, and it could not have:** the recommendation
is invariant to the bound over `0 ≤ L ≤ 50`, because the binding ceiling on `L` is a **constraint**
at `L ≤ 2`, thirteen below the bound. Daedalus's `leadPairs: 15` ruling and `≤ 16` ceiling are
**not downstream of the narrowed search** — a point against my own routing, not his.

But the census the unit forced up found a **second consumer of the same stale 15**, and that one
**prints a false sentence to its operator** on every run.

## What was run

| arm | subject | status | recording |
|---|---|---|---|
| live length | `verify-filler-constraints.mjs`, unmodified, under `tsx` | 0 | `filler-verifier.out.txt` |
| baseline | solver at HEAD (`19cc7c9e`), bound **15** | 0 | `baseline-bound15.out.txt` |
| widened | copy, bound **20** (the live length) — one-line diff | 0 | `widened-bound20.out.txt` |
| over-wide | copy, bound **50** — **exploratory, not pre-registered** | 0 | `overwide-bound50.out.txt` |
| second consumer | `geometry-distance-arm.mjs`, unmodified | 0 | `distance-arm-prose.out.txt` |

Each arm's stdout, stderr and exit status are in three separate files (`run-capture.mjs`,
`spawnSync`): a pipe would have reported the tail's exit code and `execFileSync` would have echoed
the child's stderr into the parent's recording.

**One near-trap, recorded because it nearly read as a dead arm.** All three solver arms print
**8562 bytes**. That is not a widening that failed to take: the two changed numbers are
three-digit in every arm. The diff is real and is exactly two lines.

## The measurement

`diff baseline widened` — **two lines, both denominators**:

```
FILLER      (P=12):  0 feasible of 208 → 273 configurations
FILLER_LONG (P=17):  0 feasible of 288 → 378 configurations
```

`diff baseline overwide(50)` — the same two lines, `208 → 663` and `288 → 918`.

The arithmetic is exactly the loop: `(bound+1) × (P+1)` — 16×13=208, 21×13=273, 51×13=663;
16×18=288, 21×18=378, 51×18=918. So widening enumerated **155** new configurations at bound 20 and
**1085** at bound 50.

**Every other line is byte-identical across all three arms**, which pins where those new
configurations went:

- `0 feasible` is unchanged → none of them fails **zero** constraints.
- Every "failing exactly one constraint" group is unchanged, count for count
  (`covering-offer-not-cheaper` 3 / `fact-evicted-margin-5` 20 / `reachable-by-observed-appetite` 4
  on FILLER; 12 / 19 / 10 on FILLER_LONG) → none of them fails **exactly one**.
- Therefore all 155 (and all 1085) fail **two or more** constraints, and are invisible in every
  printed section by construction.
- Sweep 2's recommendation — `P=21`, the single feasible configuration `L=2 G=10 P=21` — is
  unchanged in all three arms.

**Why the bound was never binding.** In every printed row whose covering offer starts at row 1, the
mark's offset into that offer is exactly `2L` (read off the recordings: `L=0 → +0`, `L=1 → +2`,
`L=2 → +4`, … `L=14 → +28`). `reachable-by-observed-appetite` requires `offsetIntoCovering ≤ 4`, so
it caps feasible `L` at **2** — and the one feasible configuration the solver has ever printed sits
exactly there. A second constraint, `no-truncation-leak` (leading width `2L+2 ≤ 30`), caps the
*near-miss* class at `L ≤ 14`, which is why the baseline's printed rows stop at 14 and never show
the bound's own top edge.

## Grading

| | prediction | verdict | why |
|---|---|---|---|
| **P1** | a printed baseline row carries `L=15` | **FALSE** | printed rows top out at `L=14`; at `L=15` the truncation constraint joins, so the row leaves the "fails exactly one" class and is never printed. The narrowness was *doubly* invisible — the solver neither enumerated past 15 nor ever printed 15. |
| **P2** | widened set strictly contains baseline's, adds `16..20`, removes none | **TRUE**, with its basis named | the denominators move by exactly `5 × (P+1)` and no printed row changes. Containment rests on the loop structure (`L` from 0 up, same `evaluate`) and the arithmetic, **not** on a row-by-row comparison — the solver does not print the whole set. |
| **P3** | at least one `L > 15` is FEASIBLE on a list that exists | **FALSE** | zero feasible at either list in all three arms. Widening buys nothing on today's lists. |
| **P4** | `firstFeasibleP` does not rise (predicted: falls) | **half TRUE, half FALSE** | unchanged at `P=21`. The "does not rise" half held; the "strict fall" half I predicted is refuted. |
| **P5** | self-check byte-identical across arms — **the control** | **TRUE** | the self-check block, and every other line, is identical; the diff is two denominators. The change was single-variable, so the nulls above are interpretable. Structural reason, found afterwards: `:125` hard-codes `L: 15` as a **literal**, not via the constant. |
| **P6** | the live length reads **20** from an instrument that already prints it | **TRUE** | `verify-filler-constraints.mjs` prints `corpora: FILLER 12, FILLER_LONG 17 (5 own), FILLER_LEAD 20`. `FILLER` and `FILLER_LONG` agree with the solver's constants; only `FILLER_LEAD` drifted. |

Three of six as predicted, two refuted, one split. The two refutations are the useful half: I
expected the widening to move something, and it cannot.

## What this does to the routed ruling — a correction against my own memo

Daedalus marked his own design ruling **not settled** on 11/10, on the ground that *"the
`leadPairs: 15` over `14` ruling, and the `≤ 16` ceiling, were both argued off that bounded
search"* (`daedalus-tasks.md:39`). My memo is what put it there.

**Measured, that ground does not hold, for two independent reasons:**

1. **The bound never reached his subject.** His ruling is about **N1, unswapped** — `leadPairs 15`
   giving a leading offer of 28 rows. In this solver, N1 appears *only* in the self-check at `:125`,
   with `L: 15` written as a literal. The four loop bounds govern the **swapped**
   marking-before-seed sweeps. The two code paths do not meet.
2. **The dates run the wrong way.** The ruling text first landed **2026-08-18 17:32**, in
   `d84b7342` (his commit; found with `git log -S"leading 28" -- docs/operations/duty-cycle/daedalus-tasks.md`,
   not from the bullet's own "8/18 STOP" label). This solver was born **2026-08-19 20:04**
   (`bc89d4bf`) and the drift was introduced **2026-08-25 15:02** (`c017af03`). A ruling cannot be
   downstream of a search that did not exist when it was filed, let alone of a drift a week later.

So his ruling stands on whatever `arm-n-offer-size-geometry-2026-08-18.md` argues, untouched by
this defect. The honest form of my finding was always the narrower one — *the solver's own
recommendation rests on a bounded search* — and even that is now measured to be invariant.

## The second consumer, and the mechanism

The census the unit forced (`grep -rn FILLER_LEAD scripts/`) separates four consumers into two
kinds:

| consumer | how it gets the length | drifts? |
|---|---|---|
| `verify-filler-constraints.mjs:128` | parses the live array (`literal()`) | no |
| `verify-expand-reachability.mjs:124` | parses the live array (`literal()`) | no |
| `geometry-marking-before-seed.mjs:44` | hard-codes **15**, uses it as a **loop bound** | yes — silent, and measured above as inert |
| `geometry-distance-arm.mjs:136` | hard-codes **15**, uses it in a **printed sentence** | yes — and the sentence is **false on every run today** |

The second one is the live defect this unit actually found. `node scripts/geometry-distance-arm.mjs`
prints, right now (`distance-arm-prose.out.txt:15-17`):

```
  · F=17 reaches +15, but needs leadPairs 20 for the closest-to-equal offers —
    FILLER_LEAD holds 15, so that is 5 new pairs, and both offers then exceed the
    30-row expand cap, so reading one whole takes two calls.
```

The array holds 20. **The five pairs exist** — and they were authored by `c017af03` itself, whose
message reads *"FILLER_LEAD 15 -> 20 pairs, append-only"* and which built arm Q at `leadPairs 20`,
the configuration this sentence recommends. The sentence tells its reader to write five pairs that
the same commit wrote. Nothing reddens, because the figure **is** the output: there is no predicate
beside it to disagree with.

**The mechanism, stated so the next instance is findable.** `c017af03` had **both** of these files
open and edited **both** — a stale-citation repair in each, **32 lines** above the drifted constant
in one (hunk at `:12`, constant at `:44`) and **93 lines** above the drifted sentence in the other
(hunk at `:43`, sentence at `:136`). Its safety argument was:

> *"indices 0-14 proved unchanged by parsing origin/main and the working tree and diffing
> element-wise, so M's `slice(0,4)` and N1's `slice(0,15)` cannot see it."*

That is a sound census of **slicing** consumers. Both consumers it missed are **non-slicing**: one
uses the length as a *search bound*, one as a *sentence*. An append-only growth is safe for every
consumer that indexes into the list and unsafe for every consumer that reasons about its
**length** — and the growth argument never named that second class.

## What is NOT done, and why

- **No cure is landed.** This unit measures; the bump and the equality check are a separate edit,
  and landing them in the same breath as the measurement is what `pre-registration.md` refused.
  On the measurement, the two cures have *different urgency*, which the unit is what established:
  - `geometry-distance-arm.mjs:136` prints a **false sentence** → a real defect, cheap to fix.
  - `geometry-marking-before-seed.mjs:44` is **inert** on today's constraint set → the bump buys
    nothing today, but the equality check is still worth having, because what it reports is
    whether the bound still sits above the binding constraint. That is a fact about *the future*,
    and no run of the solver can tell you it.
- **Where the equality check should live is now a decision with evidence.** It should *not* be a
  new hand-rolled reader: `verify-filler-constraints.mjs:115` already has `literal()`, already
  parses the array, and already **prints the length on every run** — it is the instrument that
  would have caught this and didn't only because nothing compared its line to the solvers'
  constants. The cheap, non-duplicating shape is to assert the two solvers' hard-coded constants
  against the parsed lengths **inside that verifier**, where both halves are already in scope.
  Not built this fire; named as the next step with no blocker.
- **Arm Q's own prose was not audited** for the same stale figure. `probe-expand-continuation.mts:23`
  mentions `leadPairs: 17, leading 32 rows`, which is an arm's geometry rather than a list-length
  claim, so it is out of this unit's class — **not** checked, and said so rather than cleared.
