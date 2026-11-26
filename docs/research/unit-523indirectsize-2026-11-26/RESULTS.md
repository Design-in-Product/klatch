# unit-523indirectsize — results

**Agent:** Daedalus · **Fire:** 2026-11-26 WORK (bounded) · **Model:** claude-opus-5

| record | commit | clock (PST) |
|---|---|---|
| pre-registration | `259b7360` | `13:19:02` — read in the same command that created the directory |
| arm + addendum 1 (KP12) + addendum 2 (gate red) | `9aebc5d8` | `13:23:37` / `13:25:47` — both **before any drive** |
| arm driven once | `f247b428` | `13:26:30` · `ARM.out` 46,613 B · `ARM.err` **0 B** |
| post-hoc driven once | `48a73ee5` | `13:29:27` · `POSTHOC.out` 10,225 B · `POSTHOC.err` **0 B** |

**21 predictions: 13 HIT, 8 REFUTED. All eight refutations are mine.**
**KP 13 of 13.** `git diff --stat HEAD -- packages/ scripts/` asserted EMPTY inside the arm before
any measurement. Product tree untouched: **0** sites in `packages/` enter any figure here.

---

## 1. The deliverable — `unit-521`'s floor of 11 rises by 4, with a ceiling of 10 next to it

`unit-521setsizefalsegreen-2026-11-26` published `INVARIANCE 11` and called it, in its own §7, *"a
floor on one syntactic form, not a census of the claim."* This unit resolves the receiver of every
literal `.size <op> <n>` comparison that is **not** a direct `new Set(...)` tail, over **855**
instrument files at `f247b428`:

```
literal .size comparisons excluded as direct `new Set(...)` tails          60
INDIRECT population (unit-521 published 123 over 850 files)              123
  SET-BOUND           34      OTHER-BOUND         34      RECEIVER-UNKEYED   7
  SET-EXPR             0      UNRESOLVED           7      SET-TAIL-DIRECT    0
  MAP-BOUND           10      PROPERTY            10
  MAP-EXPR             0      CALL                21
  (class sum asserted == population: 123)

NARROWED HAZARD — (SET-BOUND or SET-EXPR) and INVARIANCE                   4
  guard: BLIND 4, GUARDED 0        files: 3
```

**The four, printed whole:**

```
docs/research/unit-464kind-2026-11-05/kind-resolve.mjs:186      receiver=kinds       bind:181
    kind: kinds.size === 1 ? [...kinds][0] : 'KIND-NOT-CONSTANT',
docs/research/unit-464kind-2026-11-05/kind-resolve.mjs:260      receiver=kinds       bind:181
    …the kind over the range is : {…}  ${kinds.size === 1 ? 'CONSTANT' : 'NOT CONSTANT'}
docs/research/unit-464order-2026-11-02/grade-order.mjs:281      receiver=keyedLists  bind:264
    keyedLists.size === 1 && varying.size >= 1 && !varying.has(FALLTHROUGH));
scripts/verify-appetite-readings.mjs:174                        receiver=widths      bind:150
    if (widths.size === 1) {
```

**All four are `BLIND`** — no presence predicate inside the set's own argument span — so
`unit-521`'s `GUARDED 0 of 11` extends to `GUARDED 0 of 15` across both syntactic forms. **P12 HIT**
(`[2, 25]`, measured 4), **P13 HIT** (registered ≥80% BLIND, measured 100%).

**And the ceiling, from PH2.** Six further `INVARIANCE` sites have a receiver whose **collection kind
this key did not resolve** — 5 `UNRESOLVED`, 1 `OTHER-BOUND`. Their origin lines are printed in
`captures/POSTHOC.out`, and three of them are visibly `Set`s: `probe-round207…mts:410`'s `picks` is
`const picks = new Set<string>()` (a **TypeScript generic**, which the binding reader's
`new Set(` literal cannot see), and `probe-round244…mts:188`'s `seen` is a **default parameter**
`seen = new Set<string>()`, which is not a `const|let|var` line at all.

> **The figure to cite is a floor of 4 and a ceiling of 10, not a count.** `unit-521`'s 11 plus this
> unit's 4 is **15 measured `Set`-size invariance claims, every one BLIND**; the ceiling for the
> indirect form alone is **10**, and the gap is six receivers whose kind is unresolved — three of
> them by a single cause the binding reader could have covered and does not: **`new Set<T>(`**.

**P14 REFUTED, and the refutation is the useful half.** I registered that `MAP-BOUND ∧ INVARIANCE`
would have **≥1 member**, to show the `INDIRECT` bound's over-count is structural rather than
directional. It has **0**. Under the cured walk (PH1) `MAP-BOUND` is 16, and *still* 0 are invariance
claims — every `Map` size comparison in this corpus is `EMPTY` or `OTHER-N`. The over-count is real
(16 of 123 are `Map`s) but it is **not** an over-count of the hazard, and my reason for saying so was
wrong.

## 2. Against me first — the fall-through cell held 7 members and **0** of them were the shape it was planted for

`RECEIVER-UNKEYED` is the named fall-through. I added it, and KP11 to prove it reachable,
**specifically because** Theseus's `unit-522` aborted that morning on exactly this cell type. KP11
**passed**: a bracket receiver (`kpRows[0].size === 1`) does key `RECEIVER-UNKEYED`.

**PH1 then read the cell's seven live members. None of them is a bracket receiver.**

```
KEYWORD-ABSORBED        6   receiver="return out"   (six copies of `return out.size === 0 ? …`)
EMPTY-RECEIVER(TS `!`)  1   receiver=""             (`mOwn.get(f.viaDep)!.size === 0`)
REAL-BRACKET-RECEIVER   0   ← the shape KP11 planted
```

Both are **my reader's defects, not the corpus's shapes**:

- the backward identifier walk **crosses whitespace between two identifier runs**, so the keyword
  `return` is absorbed into the receiver and `return out` is neither a bare identifier nor a member
  chain;
- a **TypeScript non-null assertion** `!` immediately before `.size` breaks the walk at character 1,
  leaving an empty receiver.

Under a cured walk differing in exactly those two places, `RECEIVER-UNKEYED` goes **7 → 0**, and
every one of the seven lands in a keyed cell:

```
                  arm   cured   delta
MAP-BOUND          10      16     +6     ← all six `return out` sites are Maps
CALL               21      22     +1     ← the TS `!` site
RECEIVER-UNKEYED    7       0     −7
(all other classes identical; 7 of 123 sites moved)
```

> **KEEPER. A passing KP proves a cell is *reachable*; it says nothing about whether the cell's live
> members are the thing it was named for.** I checked the one failure direction Theseus's abort had
> just demonstrated — a fall-through that is unreachable, or a neighbour absorbing it — and did not
> check the other: a fall-through that is reachable, populated, and populated **entirely by my own
> reader's failures**. The cell reported `7` with no red anywhere, and `MAP-BOUND 10` was wrong by
> **60%** in consequence. The cure for a declared fall-through is to **read its members**, which
> costs one post-hoc leg, and a passing KP is exactly what makes that leg feel unnecessary.

**P11 HIT** on its interval (`[0, 15]`, measured 7) and the HIT is **worth nothing** — the interval
was satisfied by a number composed entirely of artefact. **P4 HIT at 10 and HITs again at 16**, so
the interval I registered could not distinguish a figure from the same figure 60% larger.

## 3. Against me second — the gate refuted my docblock's population claim before I could drive

Full record in `PRE-REGISTRATION-ADDENDUM-GATE-RED.md`, written before the first drive. The arm's
docblock claimed it was out of `verify-decl-body-slicers`' population *"by construction"*. **The
pre-commit hook reddened it.** `enclosingOpener` carried `c === '{'` and `c === '}'`, which is the
gate's key verbatim.

The sentence was **`unit-521`'s true sentence about a different reader, copied forward and asserted
about mine without reading mine.** Cured by narrowing — no character comparison against either brace
survives; interpolation context is two string searches. The baseline and the site marker were both
**declined with reasons**: a marker would have claimed this file's job is to reproduce the defect,
and a baseline entry would have moved the standing `population 65 / 4-3-58 / baseline 58` figures
every other seat's gate reads, so that an arm could keep a convenience. Two limits (L6, L7) bought by
the narrowing are declared there.

Re-measured after the push: `tracked files read: 1122`, **population 65**, `MARKED/GUARDED/UNGUARDED`
**4/3/58**, baseline **58** — unmoved, which is the point.

## 4. Against me third — P20 is refuted **at zero**, and the zero is the finding

Arm B keyed all **97** `NO-COMPARISON` sites by what the size flows into:

```
INTERP-OR-ARG      71      BOUND-UNCOMPARED   11      B-UNKEYED        10
BOUND-COMPARED      4      PROPERTY-ASSIGN     0      RETURN            1
(class sum asserted == population: 97)

THE CLAIM ONE BINDING AWAY — BOUND-COMPARED whose comparison keys INVARIANCE:   0
BOUND-COMPARED by comparison direction:   { OTHER-N: 4 }
```

I registered P20 as **> 0** and in `[1, 20]`: a hazard reachable only by the two arms together. It is
**0**. Every one of the four size-bound names that *is* compared to a literal is compared under
`OTHER-N`. **So `unit-521`'s `NO-COMPARISON` residual of 95/97 contains no instance of the hazard at
all**, and the honest description of that cell is not "a blind spot" but **"71 of 97 are a size being
printed into a report"** — an argument or an interpolation, which is not a claim about invariance and
cannot be false-green.

**PH3 puts a floor under the zero rather than leaving it bare.** Of the 11 `BOUND-UNCOMPARED`, **2
are compared to a non-literal** (`legFiles > new …`, `consFilesRead < consFilesK`) — **L3/L4's
region, outside every key in this unit**. And one member line shows the shape directly:
`probe-round311…mts:323`, `const shapesDisjoint = new Set([…]).size === shapeSum` — a size compared
to a **variable**, which is an invariance claim in substance and invisible to both arms by
construction. That reading is **hand-read off a printed member line and is not a keyed figure**;
naming it is what L3 is for.

**P15, P16, P17 all refuted in the same direction and for one reason**: I priced the `NO-COMPARISON`
cell as mostly *bindings* (P15 `[20, 70]`, measured **15**) when it is mostly *reporting* (P17
`[10, 60]`, measured **71**). Three intervals, one wrong model of what instruments do with a set
size. **P6 and P8 refuted the same way**: `UNRESOLVED` `[10, 60]` measured **7** and `CALL`
`[0, 10]` measured **21** — I over-priced unresolvability and under-priced the
`statSync(join(…)).size` idiom. **P5 refuted at 34 against `[0, 20]`** — `OTHER-BOUND`, a bound
identifier that is neither `Set` nor `Map`, is the joint-largest class in the table and I priced it
as a remainder.

## 5. Against me fourth — PH5 reports self-inclusion as **0** and that zero is blind

The arm was committed before being driven, so **this unit's own arm is in this unit's population**
(corpus 854 at registration, **855** at the drive). PH5 was written to measure that, and reports:

```
this unit's own tracked code files in the corpus: 1
Arm A sites contributed by this unit: 0
Arm B BOUND sites contributed by this unit: 0
excluded direct tails contributed by this unit: 0
```

**The Arm B figure is a blind zero.** PH5 collects only `BOUND` sites, so it cannot see any other Arm
B class. Grepping the arm's own capture — `grep -n unit-523indirectsize captures/ARM.out` — finds
**2 `INTERP-OR-ARG` sites**, both `arm-indirectsize.mjs` printing `new Set(...).size` into a report
line. So self-inclusion is **2 of 97 Arm B sites, 0 of 123 Arm A sites**, and the post-hoc leg built
to measure it under-reported by 2 in the one class the arm's own code happens to occupy.

> **A self-inclusion leg keyed on one sub-class reports zero for the whole arm.** The number I would
> have published is `0`, and the thing that corrected it was a `grep` over my own capture — the same
> move that makes any other absence claim checkable.

## 6. Open — and one of these is a disagreement between two of my own readings

- **UNEXPLAINED, 6 of 60.** `unit-521` published **54** size-keyed direct-tail sites over 850 files;
  this reading excludes **60** over 855. **The delta is not population growth, and that is
  measured, not assumed**: PH5 reports unit-522 contributes **0** of the excluded tails and this unit
  contributes **0**. So two readings of "is this a direct `new Set(...).size <op> <n>` tail",
  both mine, differ by **6 on files that existed at `unit-521`'s SHA**. I have not found the
  mechanism and I am not guessing at it here. One of the two readings is wrong by 6, and
  `unit-521`'s is the one the floor-of-11 claim rests on. **Boarded, no blocker.**
- **`new Set<T>(` is a one-line cure to the binding reader** and it would resolve at least 3 of the 6
  ceiling members (`picks`, `seen`, and `seen` again). Not applied here: this unit's figures are
  published off the reader as driven, and changing the reader after the drive republishes the census.
  **Boarded, no blocker.**
- **L3's region is now sized and still uncounted**: a `.size` compared to a **variable** rather than
  a literal. Two members found inside `BOUND-UNCOMPARED` and one visible in a member line; no key in
  either unit reaches it.
- **Closed by this drive:** both of `unit-521`'s boarded residuals. The `INDIRECT` 123 is keyed (the
  hazard in it is **4**, floor; **10**, ceiling); the `NO-COMPARISON` 97 is keyed and holds **0**
  instances of the hazard.
- **Unchanged and not mine:** Key E's second cause (the evidence-model change) stays open on my list;
  the `EMPTY-READS-INVARIANT` + `continue` reachability question stays open on my list;
  `unit-516` §5's 15-vs-0 census-purpose choice is **xian's and only his**.

## 7. Prediction ledger

| # | registered | measured | verdict |
|---|---|---|---|
| P1 | `INDIRECT` ∈ [123, 140] | **123** | HIT (at the bound) |
| P2 | `NO-COMPARISON` ∈ [95, 112] | **97** | HIT |
| P3 | `SET-BOUND` ∈ [20, 70] | **34** | HIT |
| P4 | `MAP-BOUND` ∈ [5, 45] | **10** (cured **16**) | HIT — and could not tell the two apart |
| P5 | `OTHER-BOUND` ∈ [0, 20] | **34** | **REFUTED** |
| P6 | `UNRESOLVED` ∈ [10, 60] | **7** | **REFUTED** |
| P7 | `PROPERTY` ∈ [1, 30] | **10** | HIT |
| P8 | `CALL` ∈ [0, 10] | **21** (cured **22**) | **REFUTED** |
| P9 | `SET-EXPR` + `MAP-EXPR` ∈ [0, 12] | **0** | HIT |
| P10 | `SET-TAIL-DIRECT` = 0 | **0** | HIT — two independent tail readings agree |
| P11 | `RECEIVER-UNKEYED` ∈ [0, 15] | **7** (cured **0**) | HIT, and worthless — see §2 |
| P12 | narrowed hazard > 0, ∈ [2, 25] | **4** | HIT |
| P13 | ≥ 80% of them `BLIND` | **4 of 4, 100%** | HIT |
| P14 | `MAP-BOUND ∧ INVARIANCE` ≥ 1 | **0** (cured **0** of 16) | **REFUTED** |
| P15 | `BOUND` ∈ [20, 70] | **15** | **REFUTED** |
| P16 | `BOUND-COMPARED` ∈ [5, 50] | **4** | **REFUTED** |
| P17 | `INTERP-OR-ARG` ∈ [10, 60] | **71** | **REFUTED** |
| P18 | `PROPERTY-ASSIGN` ∈ [0, 25] | **0** | HIT |
| P19 | `RETURN` ∈ [0, 15] | **1** | HIT |
| P20 | claim one binding away > 0, ∈ [1, 20] | **0** | **REFUTED** |
| P21 | `B-UNKEYED` ∈ [0, 15] | **10** | HIT, cell reachable by KP13 |

Post-hoc legs, all **unregistered** and labelled so in the capture: PH1 (fall-through membership,
cured-walk delta), PH2 (ceiling, 6 unresolved-kind invariance sites with origins printed), PH3 (floor
under P20's zero), PH4 (the deliverable figure does not move under the cure: 4 → 4, BLIND 4 → BLIND
4), PH5 (self-inclusion — **and its own zero is blind, §5**).

— Daedalus
