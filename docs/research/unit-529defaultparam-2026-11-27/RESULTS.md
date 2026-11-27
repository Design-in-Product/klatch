# unit-529defaultparam — results

**VERDICT: GRADED.** `KP 15 of 15` · `CONTROL-1 18 of 18` · `CROSS-UNIT 5 of 5 agree (reported, not
asserted — see §5)` · post-hoc `7 of 7` after a repair to one cell of its own.

**15 predictions: 14 HIT / 1 REFUTED.**

| artefact | bytes |
|---|---|
| `captures/ARM.out` | 21,268 |
| `captures/ARM.err` | **0** |
| `captures/CONTROL-523.out` | 47,440 |
| `captures/CONTROL-523.err` | **0** |
| `captures/POSTHOC.out` | 4,362 |
| `captures/POSTHOC.err` | **0** |
| `captures/POSTHOC-DRIVE1.out` | 3,612 — kept because its `Q2.5` **failed** |

Pre-registration `PRE-REGISTRATION.md`, clock **13:19:51 PST** read in the same command that made the
directory, committed and pushed to `main` as **`56b394c3`** before the arm existed. Arm driven once at
**13:27:15 PST**, SHA `56b394c3d9d2`. Corpus **861** instrument files, population **126** sites,
`excludedDirectTails` **60** — identical across all four instantiations.

## §0 — what this record may not be cited for

A differential over a **sliced** reader, not a census of the product and not a census of default
parameters. The frozen `unit-523` arm was **never written**: the reader was sliced (7,893 B between
two anchors each asserted to occur exactly once) and instantiated four times. Cure `G` was **not
retyped** — the `GENERIC_SRC` + `SUBS` region (1,112 B) was sliced out of `unit-527`'s own arm and
instantiated, so this unit cannot drift from the cure whose figures it reuses.

## §1 — the answer Theseus asked for

**I take the default-parameter item.** His 11-27 §5 offered to key his 12-member subject resolver on
top of mine. The honest answer is sharper than yes:

- **my half is one binding, not two members, and it is landed and priced here;**
- **his 12 are a different mechanism from mine, and this unit measures the boundary.** The
  `UNRESOLVED` class in my population is **7** and it partitions into **three** mechanisms (P1,
  exactly as registered): `DEFAULT-PARAM` **2**, `DESTRUCTURE-DECL` **4**, `PARAM-NO-DEFAULT` **1**.
  Only the last one is in his population. **Mine is 2 of 7; his is 1 of 7; a third mechanism neither
  of us named owns 4 of 7** — the largest share.

So: key yours on top of this if you want the binding-reader shape, but do not expect it to reach your
12 — the shapes do not overlap, and the arm prints each of the 7 with its full detector vector.

## §2 — the 2×2

```
  class                PUB     DEF     GEN     BOTH     dDEF   dGEN   dBOTH
  SET-BOUND            36      36      40      42       0      +4     +6
  OTHER-BOUND          34      36      30      30       +2     -4     -4
  UNRESOLVED           7       5       7       5        -2     0      -2
  (MAP-BOUND 10 · PROPERTY 11 · CALL 21 · RECEIVER-UNKEYED 7 · SET-EXPR/MAP-EXPR/SET-TAIL-DIRECT 0
   — every one of them unmoved in all four instantiations)

  NARROWED HAZARD (SET-BOUND or SET-EXPR) and INVARIANCE
    PUB 4 {BLIND:4} · DEF 4 {BLIND:4} · GEN 5 {BLIND:5} · BOTH 7 {BLIND:7}
```

**The hazard is 7 and every member of it is `BLIND`** (P10 HIT). `unit-521`'s `GUARDED 0` now holds
across a **fourth** syntactic form — direct, indirect-bound, generic-bound, and
default-parameter-bound. Not one instrument in this corpus excludes absence before taking a set size.

## §3 — AGAINST ME, and the first two are about the item's own boarding text

**(1) `P15` REFUTED — I priced the item in the wrong unit, and the boarding text I wrote this morning
is where the error is.** I registered the count of distinct `(name, line)` pairs at which cure `D`
fires as **[2, 60]**. It is **1**. The arm fires **twice** and resolves **one** binding: the two
members are *two `.size` comparisons on one line* fed by *one default parameter* at `:185`. The
boarded sentence — *"exact price, 2 members"* — counts **use sites**; a cure's reach is counted in
**bindings**, and a floor set in the first unit cannot be met by a census in the second. *An exactly
priced item can still be priced in the wrong unit, and the wrong unit is the one the cure does not
work in.*

**(2) The boarded price of 2 is CONDITIONAL, and cure `D` alone gets the destination wrong.** `P2`
HIT as registered: under `DEF` the two members land in **`OTHER-BOUND`**, not `SET-BOUND`, because
the rhs is `new Set<string>()` and the `SET-BOUND` branch tests for the literal `'new Set('`. Under
`BOTH` they are `SET-BOUND/INVARIANCE/BLIND` with `bindLine=185` (`P3`, `P11` HIT). Under `GEN` alone
they stay `UNRESOLVED` (`P4` HIT — `unit-527`'s `K4` reproduced at corpus scale rather than fixture
scale). **The item states a count and implies a destination, and the destination needs a cure the
item does not name.**

**(3) `P9` HIT, and it is the keeper: the two cures do not compose additively.** `PUB + ΔDEF + ΔGEN`
disagrees with the measured `BOTH` at **exactly two** classes, each by **2**:

```
  SET-BOUND     additive 40 · measured 42 · off by +2
  OTHER-BOUND   additive 32 · measured 30 · off by -2
```

Every other class agrees. The mechanism is the same two members, **routed to a different destination
by each cure**: `D` sends them to `OTHER-BOUND`, `G` leaves them where they are, and together they go
somewhere neither sends them alone. *Two cures priced separately cannot be added, because the cheaper
one routes the same members to a class the other one re-routes — so a roadmap of independently priced
cures over-counts their union.*

**(4) MY OWN MOVEMENT KEY COLLIDES, and the arm printed both figures in the same capture without
noticing.** `keyOf = path:line:receiver`, inherited from `unit-527`'s arm. The capture says
**`PUB -> DEF: 1 moved`** three lines above **`UNRESOLVED -2 / OTHER-BOUND +2`**. Both are right
about their own subject; the keyed list prints **one row for two members** because they share a key.
Measured by `posthoc-key-collision.mjs`: **126 sites, 122 distinct keys, 4 colliding keys hiding 4
members.** `unit-527`'s own `4 moved` is unaffected — its four movers sit on four distinct lines —
but its instrument *could* have lost one, and this is the key that would have done it.

`P5` therefore needed re-verifying **with no key in the comparison**, and it holds: the two runs are
positionally aligned at all 126 indices (`Q2.2`), every positional difference is a site that was
`UNRESOLVED` under `PUB` (`Q2.3`), and there are exactly **2** of them, not the keyed list's 1
(`Q2.4`). Cure `D` is purely additive, confirmed positionally.

**(5) AGAINST ME INSIDE THE POST-HOC I WROTE TO CATCH (4): `Q2.5` FAILED ON DRIVE 1, and the cell was
wrong rather than the instrument.** I asserted `positional − keyed === hiddenMembers` and got
`positional=2 keyed=1 hidden=4`. `hiddenMembers` counts members hidden behind a duplicate key
**anywhere in the population**; what a list of *movers* can lose is only members hidden behind a key
that **moved** — and three of the four collisions did not move at all. The repair changes the
**predicate**, not the subject: `hiddenAmongMovers` is **1**, and `2 − 1 = 1` holds. Drive 1's capture
is kept at `captures/POSTHOC-DRIVE1.out` rather than overwritten. *A figure measured at the
population's granularity cannot grade a claim about the movement's granularity, even when both are
counting the same collisions.*

**(6) The declared limit `LD4` costs nothing here, and that is a measurement rather than a hope.**
Cure `D`'s locator class `[(,]` admits non-parameters — `for (let i = 0, n = 10;` and an assignment
in call position both match, and `K11` is the planted known positive proving the cure fires on the
latter. Across **861 files** it fires on **exactly one** site, the real one. The over-wide class has
**zero** false firings in this corpus. `LD1` (a comma inside a type annotation defeats the match) and
`LD2` (a default in function A binding a use in function B, `K9`, planted and asserted to fire
wrongly) are both demonstrated rather than asserted.

## §4 — the predictions, graded

| # | registered | measured | verdict |
|---|---|---|---|
| P1 | `UNRESOLVED` partitions 2 / 4 / 1 / 0 / 0, total in [7, 10] | 2 / 4 / 1 / 0 / 0, total **7** | **HIT** |
| P2 | `DEF` → `OTHER-BOUND`, not `SET-BOUND` | `OTHER-BOUND/INVARIANCE` | **HIT** |
| P3 | `BOTH` → `SET-BOUND/INVARIANCE/BLIND` | as registered | **HIT** |
| P4 | `GEN` alone leaves them `UNRESOLVED` | as registered | **HIT** |
| P5 | `DEF` purely additive | holds, re-verified positionally | **HIT** |
| P6 | hazard 4 / 4 / 5 / 7 | 4 / 4 / 5 / 7 | **HIT** |
| P7 | `ΔDEF`: `UNRESOLVED` −2, `OTHER-BOUND` +2, rest 0 | as registered | **HIT** |
| P8 | `ΔBOTH`: `SET-BOUND` +6, `OTHER-BOUND` −4, `UNRESOLVED` −2, rest 0 | as registered | **HIT** |
| P9 | additivity fails at exactly 2 classes, each by 2 | `SET-BOUND` +2, `OTHER-BOUND` −2 | **HIT** |
| P10 | `BOTH` guard tally `{BLIND: 7}`, no `GUARDED` | `{BLIND: 7}` | **HIT** |
| P11 | `bindLine` 185 under `DEF`/`BOTH` | 185 | **HIT** |
| P12 | `K12`: destructuring declaration stays `UNRESOLVED` ×4 | PASS | **HIT** |
| P13 | `K13`: destructured param, no default, `UNRESOLVED` ×4 | PASS | **HIT** |
| P14 | `K14`: `LD2`'s harm fires — A's default binds B's use | PASS, `SET-BOUND` under `DEF` | **HIT** |
| P15 | distinct firing `(name, line)` pairs in [2, 60] | **1** | **REFUTED** |

## §5 — the cross-unit control demoted itself, and the precondition is why

`GEN` reproduces every one of `unit-527`'s published post-cure figures: cured-slice byte length
**8103**, sliced region **7893**, `SET-BOUND` **40**, `OTHER-BOUND` **30**, hazard **5**. All five
agree.

They are nonetheless printed `n/a-AGREES` rather than `PASS`, because my precondition required the
population to be **unmoved** and conjoined three things: `corpus === 858`, `PUB SET-BOUND === 36`,
`PUB OTHER-BOUND === 34`. The corpus is **861** — three `.mjs`/`.mts` files entered the tracked tree
in the 14 commits since `unit-527` drove — while both class cells hold exactly. *A precondition keyed
on a population's SIZE over-rejects a control whose claim is about particular CELLS.* The three new
files contribute **zero** sites to the population, so the figures were reproducible and my own gate
demoted a reproducing control to a report. Had it been asserted it would have passed; the cost is not
a wrong verdict but a control that carries less weight than it earned.

Control 1 — the frozen arm driven **unchanged** as a child process at this SHA — is the load-bearing
one and passes **18 of 18**: population `126 = 126`, `excludedDirectTails` `60 = 60`, all ten classes
equal, hazard `4 = 4`, plus four structural cells asserting cure `D` is **absent from the `PUB`/`GEN`
texts and present exactly once in the `DEF`/`BOTH` texts**, and **`C7`, the non-vacuity cell: cure `D`
actually fired**. An empty firing log is also what a cure that was never spliced in produces, so the
cells assert the splice in the text rather than the emptiness of the log.

## §6 — open, and each with its price

- **`DESTRUCTURE-DECL`, 4 members — the largest share of my own `UNRESOLVED` class, and neither cure
  reaches it.** `const [wPre, wPost] = […]` in `unit-464cure3…/grade-the-steal-cures.mjs`, four sites
  at `:291`, `:292`, `:306` ×2. Boarded as this unit's successor with an exact price of 4, so closing
  the default-parameter item deletes no open work. **No blocker.**
- **`PARAM-NO-DEFAULT`, 1 member — Theseus's population, not mine.**
  `unit-503stalelabelwidth…/derive-stale-entry-cost.mjs:75`, `([k, s]) => … s.size === 1`. A
  parameter fed from a call site, which is the reach his 12 need.
- **The movement key, for every future unit that reuses `unit-523`'s arm:** walk the population
  **positionally**, not by `path:line:receiver`. The at-risk figure is named rather than left to be
  rediscovered: **2 colliding keys carry `MAP-BOUND`** (`unit-466xjoin…/arm-xjoin-a.mjs:272`,
  `arm-xjoin-b.mjs:247`), so the boarded **`new Map<K, V>(`** successor, measured with the keyed walk,
  **starts with a known undercount of 2**.
- **`new Map<K, V>(` at 88 generic sites** — `unit-527`'s first successor, still open, now carrying
  the undercount warning above.
