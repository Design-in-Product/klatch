# `unit-530compose` — results

- **Seat:** Theseus, 2026-11-27 WORK fire
- **Pre-registration:** `d9f67716` on `origin/main`, pinned `0d81d567a79e`, clock `14:49:54 PST`,
  **pushed before `arm-compose.mjs` existed**
- **Drive:** arm at `14:55:40 PST`, post-hoc at `14:57:21 PST`, both at `d9f67716124a`
- **GRADED: 28 HIT / 1 REFUTED of 29.** Post-hoc **7 HIT / 0 REFUTED of 7**
- **My own detectors: KP/KN 13 of 13** (arm) and **8 of 8** (repaired key, post-hoc)
- **His 15 KP cells, re-run inside my arm: 15 of 15**
- `ARM.err`, `CONTROL-529.err`, `POSTHOC.err` — all **0 B**

## 0. What was attacked, and what was not

Daedalus's `unit-529` §2(c) asked to be broken:

> *Two cures priced separately cannot be added, because the cheaper one routes the same members to a
> class the other one re-routes — so a roadmap of independently priced cures over-counts their
> union.* **This is the one I would most like either of you to try to break.**

**The finding stands and is his.** The two cures do not compose additively; I reproduce it exactly.
What does not stand is the **count**, the **direction**, the **granularity** and the **status**.

## 1. His machinery was executed, not retyped

`arm-defaultparam.mjs` is read as text, cut at the `Arm A` banner (prefix **13,743 B**), stripped of
its `import` lines and its `import.meta`-dependent `ROOT` (**6 lines**, 13,402 B), and run through
`new Function` with those bindings passed in. `RUN`, `CLS`, `CORPUS`, `INST`, `NARROW` and his KP set
here **are his bytes**. His **15 KP cells re-ran and all 15 pass** (`S2`), so the machinery is live
rather than merely parsed. This unit cannot drift from the unit it audits.

## 2. THE ANSWER — the non-additivity is FORCED, so his "2" is one movement reported twice

The ten `CLASSES` **partition** a population that is **constant at 126** across all four
instantiations (`P1`, `P1b`: 0 sites in zero or multiple classes). Therefore:

```
  Σ_k BOTH[k] − Σ_k (DEF[k] + GEN[k] − PUB[k])  =  126 − (126 + 126 − 126)  =  0     identically
```

The off-by column **cannot** sum to anything but zero at constant population (`P2a`, `P2b`). The
consequence (`P2c`): **the count of classes at which addition fails can never be 1.** A non-zero
failure arrives in **mirrored pairs**. So `classes where addition FAILS: 2` is not two findings — it
is **one movement of 2 members**, with conservation forcing the mirror at whichever class they
vacated.

**His own arm asserts the premise and never draws the consequence.** `arm-defaultparam.mjs:279`
throws unless `class sum === population` for each label — 150 lines **above** the `P9` cell that
needed it. `P2d`: searching the whole subject for conservation language (`sums to zero`,
`conservation`, `mirror`, `forced by the partition`, `never 1`, `cannot be 1`) returns **nothing**.
The `2` was published unqualified.

*A non-additivity in one class of a partition over a fixed population forces a mirror
non-additivity elsewhere, so counting "classes where addition fails" double-counts one movement.*

## 3. His cell never ran at the granularity his keeper is about

The hazard — `(SET-BOUND or SET-EXPR) and INVARIANCE`, `arm-defaultparam.mjs:306` — is the figure
`unit-521`'s `GUARDED 0` claim is about, and the only figure in the unit a roadmap would price.

- `P5a/P5b`: his additivity block is **457 B**, iterates **`CLASSES`**, and **never mentions
  `NARROW`**.
- `P5c`: **nowhere** in the subject is an additive hazard prediction compared to the measured `BOTH`
  hazard. The hazard is computed, published as `4 / 4 / 5 / 7`, and never passed through the test.

Run there (`P6`):

```
  NARROWED HAZARD   PUB 4   DEF 4   GEN 5   BOTH 7
    additive = DEF + GEN − PUB = 4 + 5 − 4 = 5
    measured BOTH = 7 · off by +2        — the additive model UNDER-counts
```

A **third** non-additive figure. His "exactly two classes" does not cover it, because the hazard is
not a class — which is exactly why his cell could not see it.

## 4. The direction word is wrong for every figure a roadmap would price

Tallying every non-additive figure in the unit (`P7a`, `P7b`):

```
  figure                kind      off-by   vacated?  direction
  SET-BOUND             class     +2       false     additive UNDER-counts
  OTHER-BOUND           class     -2       true      additive OVER-counts
  NARROWED-HAZARD       derived   +2       false     additive UNDER-counts
```

The additive model **UNDER-counts 2 and OVER-counts 1**, and the single over-count is at the
**vacated** class — the one the members left, which no roadmap prices. His keeper says the roadmap
*"over-counts their union."* **For the destination class and for the hazard it under-counts.** The
over-count exists only where a roadmap is not looking.

And `P9` explains why this is a consequence rather than a coincidence of this corpus: **no site is
returned to its `PUB` class by adding the second cure** — **0** cancellations in 126. A pair of
cures that cannot cancel can only *add* destinations, so the sign at any destination is non-negative
and the only negative off-by is a vacated figure. *Two cures that cannot cancel UNDER-price their
union at every destination; the over-count sits at the class the members left.*

## 5. The members, measured without a key

His own §2(d) found `keyOf = path:line:receiver` hiding **4 population members** behind 4 colliding
keys, so every member figure here is **positional** — and the alignment is asserted before it is used
(`P3a`: **0** of 504 index/label pairs misaligned).

```
  non-constant sites: 6 in 2 patterns
    4 × OTHER-BOUND | OTHER-BOUND | SET-BOUND | SET-BOUND      (G alone suffices)
          docs/research/unit-465bareline-2026-11-12/arm-bareline.mts:187
          scripts/probe-round207-…:410
          scripts/probe-round256-…:905
          scripts/probe-round265-…:319
    2 × UNRESOLVED | OTHER-BOUND | UNRESOLVED | SET-BOUND      (needs BOTH)
          scripts/probe-round244-…:188   (twice — two comparisons on one line)
  jointly routed 2 · destination-shifted 2 · cancelled 0
```

The keyless census **sees both** `probe-round244:188` members as separate rows. His keyed movement
list prints **one**. This is his §2(d) defect, independently reproduced from the other side.

`P4a/P4b`: the 2 jointly-routed sites and the 2 destination-shifted sites are **the same 2** — one
movement, not two. Additivity is defined on counts and has no per-site referent; the ±2 is
attributable to members **only** through the tuple.

## 6. The cures are in SERIES — so the interaction term was guaranteed before any drive

`P8c` reads it out of **his own KP set** rather than re-planting it: `K2` already says *a GENERIC
bound Set is `OTHER-BOUND` until G is present* (`PUB=OTHER-BOUND · DEF=OTHER-BOUND · GEN=SET-BOUND ·
BOTH=SET-BOUND`). And `P8d`, measured on both jointly-routed sites: under `DEF` they are
`OTHER-BOUND` with `bindLine 185`; under `BOTH`, `SET-BOUND` at the same `bindLine`.

So `D` **produces** a bound rhs and `S4` — the `SET-BOUND` binding test — **consumes** it. These are
not two independent factors in a 2×2; they are a **producer and a consumer**. The interaction term was
**structurally determined before the arm ran**, which is why `P9`'s no-cancellation result is a
property of the pair rather than a finding about the corpus.

## 7. AGAINST ME — `P8b` REFUTED, and the key was the whole of it

`P8b` predicted "one of the four `GSUBS` widens that very test" and keyed it on the **literal**
`new Set(` appearing in the substitution's anchor. It scored **0 of 4**.

**`const NEEDLE = 'new Set('`** (`Q1`). The literal my key searched for is exactly the string the
subject binds to `NEEDLE` — and **every consumer reaches it by name**. The post-hoc scores three keys
over the same population of four:

```
  LITERAL (the refuted P8b key)     —            0 of 4
  VARIABLE (NEEDLE by name)         S1,S3,S4     3 of 4
  ESCAPED-REGEX (new\s+Set\s*\()    S2           1 of 4
  UNION                             S1,S2,S3,S4  4 of 4
```

All four substitutions **do** target the Set-shape test (`Q2d`), so the claim `P8b` carried was
right and its key was wrong. The repaired key is gated **KP/KN 8 of 8** before any figure is read
off it, including a stated negative: a hypothetical substitution using the plain literal is caught
by **neither** leg, which is reported rather than hidden (`R8`).

`Q2e`: the single undifferentiated miss hid **two mechanisms** — **3 variable-indirected** and
**1 regex-escaped**. *A detector keyed on a literal is blind to every site that reaches that literal
through a variable, and one undifferentiated miss can hold more than one reason.*

**`P8b` stays REFUTED in the arm.** The claim being confirmed under a repaired key is a different
thing from the prediction having been right, and the grade records the prediction.

## 8. Control — his arm, driven unchanged at my pin

`P10a–d`: `node arm-defaultparam.mjs` as a child process, **no edit**, exit **0**. Diffed against
**his own capture**, it differs in **six lines**:

```
  SHA 56b394c3d9d2 → d9f67716124a          clock 13:27:15 → 14:55:42 PST
  instrument corpus: 861 → 863 files       excludedDirectTails: 60 → 61  (two rows)
  the cross-unit control's printed condition line
```

**Every class figure, every hazard figure, the whole off-by column and `FAILS: 2` are
byte-identical.** His unit reproduces exactly across **2** new corpus files and **1** new excluded
direct tail. `P11`: corpus **863** at my pin against his 861 — drift reported, not laundered; `PUB
SET-BOUND 36` and `OTHER-BOUND 34` unmoved, so the entering files contribute **0** sites.

`P10d` is the cell that matters for method: my **sliced** reading and his **child process** agree on
all four cells (`SET-BOUND` additive 40 / measured 42; `OTHER-BOUND` additive 32 / measured 30).

## 9. Gate

`population 65 · MARKED 4 / GUARDED 3 / UNGUARDED 58 · baseline 58` — **flat** at both pushes.
`tracked files read` **1129 → 1131**, the growth being this unit's own two files, and **neither
entered the brace-slicer population**, as this arm's docblock claims by construction. No
`--no-verify` anywhere this fire.

One self-inflicted catch worth recording: the arm's docblock originally **quoted both brace
characters** while claiming no such literal appears in the file — a sentence that falsifies itself and
would have joined the gate's own irreducible-limit list. Caught by searching the file for the thing
the sentence denied, before the first drive.

## 10. Successors — boarded with figures, no deadlines, no blockers invented

1. **`DESTRUCTURE-DECL` at an exact price of 4** — Daedalus's own boarded successor, unclaimed by
   either seat, reachable by neither cure in `unit-529`. The largest share of his `UNRESOLVED` 7.
2. **My 12 `UNRESOLVED` from `unit-528`, now with a known positive.** Daedalus names
   `derive-stale-entry-cost.mjs:75` as the cheapest known positive sitting in a pinned population
   with a published class. His §0 is measured and correct: our populations **do not overlap** (his 2
   of 7, mine 1 of 7), so this is a separate resolver, not a key on top of his.
3. **The `new Map<K, V>(` successor starts with a known undercount of 2** — his §2(d) names it; my
   keyless census independently confirms the collision mechanism from the other side.
4. **Carried:** `L2`, `L3`, `unit-516` §5 pattern defect, `SECOND-ARG` nested-call blindness.

## 11. What this unit does not touch

**Item 10 is xian's call and only his.** This unit adds nothing to it: every site it reads is a live
instrument claim, no fixtures, so the partition question is where `unit-525` §4 left it.
