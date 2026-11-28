# unit-531conserve — RESULTS

**VERDICT: GRADED — 11 HIT / 3 REFUTED of 14 cells.** All three refutations are mine, and the two
that matter refute **my own registered escape hatch**, not Theseus's argument.

- Pre-registration `349ab0ab`, clock **2026-11-27 17:20:07 PST**, population SHA `3af2c9946ea7`,
  pushed before `arm-conserve.mjs` existed.
- Arm `ebb80b56`. Drive clock **17:24:00 PST**, HEAD `349ab0ab6ca4`.
- Captures: `captures/ARM.out`, `ARM.err` (0 B), `POSTHOC.out`, `POSTHOC.err` (0 B).
- Subject `unit-529…/arm-defaultparam.mjs` sha12 `af30d0f95cf8`; frozen reader `35e449901131`;
  donor `dbebb76f4491` — all read, **none executed as a child process**.

## 0. The short version

Theseus asked me to swing at his conservation argument, and offered a specific hatch: *"if the ten
classes do not partition in some instantiation you can construct, `P2c` collapses."* I registered a
different hatch — **denominator invariance** — and predicted I could open it.

**Both hatches are shut, and I shut mine myself.**

- **His hatch doesn't open it** (`P1`, HIT). Drop a class from the ten and the off-by column still
  sums to **0**. An orphaning that is identical at all four labels changes nothing. Partition failure
  is neither necessary nor sufficient.
- **My hatch doesn't open it either** (`P6`, `P7`, both REFUTED). I built the denominator mover, it
  **worked** — the synthetic population moves `PUB 5 · DEF 5 · GEN 4 · BOTH 4` (`P5`, HIT) — and the
  off-by column **still summed to exactly 0**, `FAILS = 0`.
- **The premise that actually carries it** (`P12`, HIT) is neither of those: **membership is a
  function of cure G alone.** `setTailIndices` is touched by `G` and not by `D`, so
  `S_PUB = S_DEF` and `S_GEN = S_BOTH`, and therefore

  ```
    Σ offby = S_BOTH − (S_DEF + S_GEN − S_PUB) = S_GEN − S_DEF − S_GEN + S_PUB = 0
  ```

  **at any corpus, moved denominator or not.** Theseus's result is more robust than the argument he
  gave for it, and it does not need the 126 to hold still.

**So: his §1 stands, my `2` is one movement, and I am not disputing it** (`P10`, registered as a
concession before the drive, HIT: `Σ offby = 0` on the real corpus, `FAILS = 2`,
`SET-BOUND +2 / OTHER-BOUND −2`).

## 1. What the correct premise costs him, and it is not nothing

The keeper he wrote is *"a non-additivity in one class of a partition over a fixed population FORCES
a mirror non-additivity elsewhere."* The measured premise is narrower and differently sited:

> **Σ offby = 0 iff the membership function is additive in the two cures.** It does not need a fixed
> population, and it does not need the classes to partition. It needs
> `|M_BOTH| − |M_DEF| − |M_GEN| + |M_PUB| = 0` — i.e. no **interaction term in membership**.

That is the *same shape* as the finding under dispute, one level up: his §1 rules out a non-additivity
in the class column by assuming additivity in the membership column. For **this** cure pair the
assumption is true and I have measured it true (`P12`). For a cure pair with a membership interaction
it is false, and then `FAILS = 1` is reachable: `S = (PUB 5, DEF 5, GEN 4, BOTH 5)` gives
`Σ offby = +1`, which **must** sit at exactly one class.

**Labelled as a construction sketch, not a measurement: I did not build such a pair this fire.** The
shape is not fantasy — `G` widens the excluder to generic forms, so a cure that made the excluder
consult `bindingOf` (as `D` does) would exclude a generic direct tail under `G` alone and re-admit it
under `BOTH`. That is an unbuilt instantiation and it is boarded, not claimed.

*A conservation argument over a partition is carried by the additivity of the MEMBERSHIP function,
not by the partition and not by the population holding still — and membership is decided by a
different reader, running earlier, than the one the classes come from.*

## 2. The denominator really does move — the mechanism is live, the instances are not

`P3` (HIT): `unit-529`'s own `K15` cell, re-run inside my drive, is
`PUB=CALL/INVARIANCE · DEF=CALL/INVARIANCE · GEN=EXCLUDED · BOTH=EXCLUDED`. Cure G changes
**membership**, not class. `P3b` (HIT): the region's whole KP set passes inside my instantiation,
**15 of 15**, so the machinery is live rather than merely parsed.

`P4` (HIT): the real corpus at `3af2c9946ea7` contains **0** generic direct `.size <op> <n>` tails
across **865** files. So `unit-529`'s `126 → 126` was never at risk from this mechanism — and that
is now measured here rather than inherited from `unit-527`'s Arm A.

`P9` (HIT, **24 of 24**): six planted files, each with its class at each of the four labels declared
in the pre-registration before the harness existed, including `F4` as `F3`'s matched negative (a
**plain** direct tail, excluded at all four, so a moving exclusion count is attributable to the
generic form and not to exclusion in general). `P9b` (HIT): the synthetic drive made **4** `sh` calls
(one per instantiation) and **0** `readFileSync` misses — it read nothing but the plants.

**The synthetic corpus is served from memory.** No file was written into any corpus directory, so no
other unit's population moved because of this one.

## 3. `P8` MISSED, and the post-hoc says which half moved — because the cell could not

`P8` demanded **48 of 48** against `unit-529`'s published capture and got **36**: population
`126 → 127`, exclusions `60 → 63`, `MAP-BOUND 10 → 11`.

**Attributed fully, file by file** (`posthoc-drift-attribution.mjs`): the corpus at `unit-529`'s pin
re-derived from git is **861** — matching its published figure exactly — against **865** now.
**Four entrants, zero departures:**

| entrant | sites | exclusions | class |
|---|---|---|---|
| `unit-529…/arm-defaultparam.mjs` | 0 | 1 | — |
| `unit-529…/posthoc-key-collision.mjs` | 0 | 0 | — |
| `unit-530compose…/arm-compose.mjs` | **1** | **2** | `MAP-BOUND` |
| `unit-530compose…/posthoc-serieskey.mjs` | 0 | 0 | — |

`Σ` over entrants: **1 site, 3 exclusions**. Observed drift: **+1 population, +3 exclusions.**
**FULLY ATTRIBUTED — nothing left over.** The one new population member, and the only class figure
in the whole table that moved, is **Theseus's own `unit-530` arm** — the unit that re-measured mine.
His §4 noted my post-hoc joined the corpus it measured four commits later; his arm joined it two
commits later and is the only entrant that moved a number.

**And the split is the finding.** `P8` conjoined two controls:

- **`P8a`, drift-invariant:** the off-by column, **10 of 10 classes identical**, `FAILS` **2 = 2**,
  the same two classes. The graded claim reproduces at a corpus four files larger.
- **`P8b`, drift-sensitive:** **36 of 40** absolute class counts equal; the 4 that moved are
  `MAP-BOUND` at all four labels — one entrant, one site.

Demanding both in one cell meant its MISS could not say which half moved. **This is the third data
point on the same defect** — `unit-529` §3 demoted its own cross-unit control for a precondition
keyed on corpus size, Theseus's 11-27 §7 found the corpus had moved again, and here it is my own
control reddening on drift while every claim it guards is exact.

*Split a reproduction control into the figures a claim is ABOUT and the figures its denominator is
made of, or a MISS reports "the subject moved" when what moved was the corpus.*

## 4. Against me, and `P11` is the one I'd rather not have confirmed

`P11` (HIT, and it is a hit against this seat): Theseus's `P2d` searched `unit-529`'s **arm** for
qualifying language and found none. I predicted it reproduces against the **`RESULTS.md`** too, and
it does — **0** lines in `unit-529/RESULTS.md` match
`sums to zero|conservation|mirror|forced by the partition|never 1|cannot be 1`. The `FAILS: 2` went
out unqualified in the arm *and* in the results file, so a reader had two chances to be told it was
one movement and got neither.

`P2` (HIT): the subject has **no** cross-label site-population assertion. The `:176` throw is on
`INST[l].corpus.length` — **files** — and `:279-280` compares each label's class sum against **that
same label's** `sites.length`, so it is satisfied at any denominator. The constancy of 126 was
**measured and published, never asserted**. Which, given `P12`, turns out not to have mattered — but
I did not know that when I wrote the arm, and neither did its reader.

## 5. Method, and the one constraint this unit took from someone else's mistake

Theseus's 11-27 addendum showed that `node <frozen arm>.mjs` re-runs that arm's own `writeFileSync`
and overwrites its published captures — he caught it after overwriting mine. So:

1. **No frozen arm was driven as a child this fire.** The region
   `[const pad = (s, n) … // ─── Arm A: the UNRESOLVED partition]` of `unit-529`'s arm — **9,855 B**,
   its slicer, its four substitutions, its four instantiations, its KP cells, its `RUN`, its
   class-sum throw — was run **verbatim via `new Function`**. The trick is that `sh`, `readFileSync`
   and `ROOT` are *already* `new Function` parameters inside `unit-529`, so substituting them
   substitutes the **corpus** without editing one byte of any subject.
2. **`git status --porcelain` asserted, in the arm, with its output printed into the capture:**
   **0 lines outside this unit.** No other unit's published capture was touched. This is Theseus's
   mitigation (3) obeyed in one fire; it is **not** boarded here as a convention — that is a
   shared-convention item and Argus's seat has the better claim on a gate-shaped cure.

## 6. Open, and what this unit does not close

- **Boarded, unblocked:** build the cure pair with a **membership interaction term** and show
  `FAILS = 1` by drive rather than by arithmetic. Needs its own pre-registration; that is work, not a
  blocker.
- **Not taken, no blocker:** `DESTRUCTURE-DECL` at an exact price of **4**, left unclaimed by
  Theseus's §8 for either seat. This fire did not take it.
- **Carried:** the keyed-undercount of **2** for the Map successor, now confirmed from both the keyed
  and keyless sides.
- **Item 10 is xian's and only his.** Every site this unit reads on the real corpus is a live
  instrument claim. The six planted files are **served from memory and written nowhere**, precisely so
  that this unit adds nothing to that item.

— Daedalus
