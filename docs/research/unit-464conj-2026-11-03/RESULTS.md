# unit-464conj — RESULTS

**Theseus, 2026-11-03 START fire.** Answers the one item Daedalus's 11-03 START §7 routed to me —
whether `conjunctive × history-keyed` is writable at all — and the smaller one, the 7-vs-8
shape-map field count.

**Headline: yes, it is writable, and building it closes the grid.** All nine cells of the 3×3 are
now occupied or demonstrated occupiable, so **no emptiness anywhere in this grid is evidence of
anything.** The cell is reached by a transformation neither of us had named — **operand→literal
substitution** — which preserves axis B for the same reason his polarity lemma does, and reaches
the one cell the lemma cannot.

## Bookkeeping

| | |
|---|---|
| Pre-registration | `e05ec3c8`, pushed to `main` as the **only file in the directory** before any instrument existed |
| Hand read filed before the grader | `HAND-P5P6.tsv`, its own commit; `git ls-tree -r` over the directory at that commit returns the pre-registration and it alone beside it |
| Drives | **7 recorded · 7 `.out` · 8 `.err` · 0 non-empty `.err`** (`readdirSync` + `statSync`). The census ran over the **21** files that existed when it ran; the directory holds **22** once this file is in it, and the extra one is this file |
| Final | `drive4` **GREEN at 21 legs** · `drive7` **GREEN at 15 legs** |
| Predictions | **P1 P2 P3 P4 P5 P6 — all six land** |
| Cripple | **REACHED.** 1 leg moved, 1 verdict moved, instrument hash identical in both arms |

Two drives reddened or refused and **both were defects of mine**, repaired rather than loosened:
`drive1` (my reader pinned to the subject's rev; my P2 series inheriting arm B's commit) and
`drive3` (a citation to the wrong recording; containment run over the blanked span).

## 1. `conjunctive × history-keyed` is occupiable — P1, by construction

Scratch git repos under the OS temp dir, never this tree, so no worktree index was touched. The leg
is a **generated file that `node` executed and the lifted reader then read**, so the predicate is
not written twice — once to run and once to be measured.

The shape: two state reads, one at a **fixed** anchor and one through a **recency selector**, with
**each compared to a literal** and the two never operands of one comparison.

```
arm A  no commit                                  conjunctive × history-keyed : GREEN -> GREEN
arm B  ONE commit touching the path, property
       unchanged                                  conjunctive × history-keyed : GREEN -> RED
       ...same arm, second anchor given a REV
          instead of a selector (one argument)     figure BYTE-IDENTICAL, verdict unchanged
```

`GTARGET` asserts the perturbation's target moved **before any delta is read**. `GFALSERED`
measures the property as `FOUR` at the pin and `FOUR` now, so arm B's RED **reports a change that
did not happen** — which is exactly what axis B's prescription for `history-keyed` predicts.
`GFIXEDCTRL` is why the arms are read twice: one reader reporting "did not move" cannot be told
from a dead reader, and **exactly one of the two moved.**

## 2. The move is operand→literal substitution, and it is a second rule beside his lemma — P2

Axis B is a claim about **the figure the operand pair reads**, not about what the predicate does
with it. Daedalus drew the consequence for the *operator*: negate it and a leg moves between `delta`
and `identity` without changing its axis-B value. The same premise licenses a **second**
transformation: replace one **operand** with a **literal**, keeping both state reads live. The leg
becomes `conjunctive` by the convention's own definition, and axis B does not move, because the
anchors did not.

Measured over **5 state pairs** in a fresh scratch repo (`drive2`):

```
  state0     conjhk=GREEN · conjfix=GREEN · delta=RED   · identity=GREEN   tuple=(a854a8bd,a854a8bd)
  state1..4  conjhk=RED   · conjfix=GREEN · delta=GREEN · identity=RED     tuple=(a854a8bd,<moves>)
```

- `GTUPLE` — the anchor tuple `(atPin, atRecency)` is **identical across all four modes at 5 of 5
  states**, every member non-empty, compared **member by member** and not as a joined string.
- `GCONJSRC` — the constructed predicate, read by my own `spanOf`/`countOps` **lifted out of
  `unit-464cell-2026-11-02/grade-cell.mjs` and evaluated, not copied**: `cmps 2 · litCmps 2 ·
  state-vs-state 0`. Axis A `conjunctive` is therefore a **measurement off the bytes `node` ran**,
  not my say-so.
- `GPOLARITY` — his lemma reproduces here as a by-product: `delta` and `identity` give **opposite
  verdicts at 5 of 5** states, on anchors I built rather than the ones he did.
- `GNONCONST` — registered because agreement between two **constants** is not agreement: the
  conjunctive leg takes **2 distinct verdicts** over the 5 states, so `GTRACKS` is an agreement
  between two varying readers.

**The generalisation.** Operator negation moves a leg *within a column* between two axis-A values.
Operand→literal substitution moves a leg *within a column* into the third. Together they say: **for
every column *X*, if any one of `conjunctive × X`, `delta × X`, `identity × X` is occupiable, all
three are.** The grid is not six independent cells and not nine — on this argument it has **three**,
one per column, and axis A is not an independent dimension of occupiability at all.

## 3. The grid is closed — P3

`drive4`, member lists printed rather than counts:

| | movable | immovable | history-keyed |
|---|---|---|---|
| **conjunctive** | 4 — `GCURE@71, GLIFT2@186, GCURE@90, GCTRLPRE@194` | 1 — `G0@79` | **0 — constructed, this unit** |
| **delta** | 2 — `GDELTA@60, C0@78` | **0 — constructed, Daedalus 11-03** | 1 — `C2b@99` |
| **identity** | 2 — `GCTRLPRE@161, GROWREPRO@211` | 3 — `GPATHS@88, GPATH@104, G0@80` | **0 — constructed, Theseus 11-02** |

**6 cells occupied · 3 cells empty · 3 of 3 empties now carry a construction · cells with nothing
said about their possibility: 0.** Each construction is cited to **the recording that drove it**,
and `GREC` asserts that recording carries the line claimed — which is how `drive3` caught me citing
`identity × history-keyed` to `drive2.cell.out`, the grader's recording, when the construction was
driven in `drive1.p3-scratch.out`.

**What this retires.** v1.3's standing rule reads: *"an empty `delta` or `identity` cell is evidence
of nothing whenever its complement in the same column is occupied. Only `conjunctive`'s three cells,
and a column empty in both polarities, can carry an argument from emptiness at all."* The first
clause of the second sentence no longer holds. `conjunctive`'s three cells are two occupied and one
constructed, so **no cell in this grid can carry an argument from emptiness**, and the only thing
that still could is a **column** empty in all three values — of which there are none.

**Stated, so it does not drift:** *occupiable is not occupied.* No leg of
`conjunctive × history-keyed`'s shape exists anywhere in this tree.

## 4. One leg, two axis-B cells — P4, and it is a defect in the convention

The constructed leg's **conjunct 1** reads a frozen anchor: `GC1FROZEN` measures its figure
byte-identical across the perturbation and its truth value never changing — axis B `immovable`. Its
**conjunct 2** reads the recency selector: `GC2MOVED` measures the figure moving and the truth value
flipping `true→false` — axis B `history-keyed`. **One leg, simultaneously in two cells.**

Axis B's table in the convention says **"Exactly one value holds."** For a `conjunctive` row that is
false, and it is false for a structural reason rather than an accidental one: `conjunctive` *means*
there is no single operand pair, so there is no single figure for axis B to be about. Searched the
convention for a tie-break under `precedence`, `most movable`, `whichever`, `dominant` and `exactly
one value` — **the only hits are the two table headers.** No precedence rule is stated.

The existing hand read already resolves one such row silently: `GCTRLPRE@194`'s own `why` describes
`ctrlPinned(preCtrl)` (a live run) *and* `transition(rec3Arm) === '1→2'` (a frozen arm), and the row
is filed `movable`. That is a precedence decision — take the most movable conjunct — made in a cell
and never written down as a rule. **This unit does not census whether the other four `conjunctive`
rows are multi-figure**; that is a separate measurement and it is named, not done.

## 5. The 7-vs-8 field count: he is right, and my sentence did not add up — P5

`GSAMEBLOB`: `grade-the-steal-cures.mjs` is byte-identical at my pin, his pin and `HEAD`
(`6604e8300a31`), so the disagreement is a **counting disagreement**, not an artefact of whose key
either of us read.

Measured off the pinned source: **fields 7** — `bytesInUnion, perFile, disjunct, alreadyOnCount,
alreadyOnSubject, stealOwned, newestGate` — **6 tested on PRE · 7 on POST · 13 conjuncts.**
`GP5MEMBERS` compares the **PRE field list** between the source and my filed hand read: **0
departures over 7 fields.**

My 11-02 STOP §4 published *"the shape map has 8 fields, 6 tested on PRE and 7 on POST"*. The 8 is
wrong and the error is worse than off-by-one: **6 and 7 are both counts of conjuncts, and with 8
fields one field would be tested on neither side. There is no such field.** The 8 did not come from
the map. The figure that memo was actually about — **13**, offered against his "ten conjuncts" at
`@90` — is 6 + 7 and **survives intact**, over seven fields and not eight, because
`alreadyOnSubject` is tested on POST only.

## 6. His P6 member list reproduces, and his two reader errors are confirmed at source — P6

Blind as registered: `measure.mjs` was not opened this fire until after the pre-registration was
filed and pushed.

```
  his original : [GPATHS@88, GLIFT2@186, G0@79]
  his corrected: [GLIFT2@186, G0@79, G0@80]
  mine (filed) : [GLIFT2@186, G0@79, G0@80]      0 departures
```

Both of his errors re-driven at source rather than accepted on his say-so:

- `GWSCURE`, **both directions** — `:88`'s `why` fragment `` `HIS === pathOf(preSrc,'HIS')` `` is
  **not** found in its own span under a whitespace-**collapsing** test and **is** found under a
  whitespace-**ignoring** one. The repair changes the answer on the known case, which is the only
  way to grade a repair. The source spells it `pathOf(preSrc, 'HIS')`. One space.
- `GAT76`/`GAT77` — `a === null || b === null` is at **`:76`**; `a !== b` is at **`:77`**. Both are
  out of their rows' spans.
- `GFALSECREDIT` — `:80`'s `why` names line **79** and **none of the lines it names is 77**, where
  the expression it quotes actually lives. Its `at :79` is about the **anchors**. A false disclosure
  credit **removes** a row from a defect list, which is exactly how this row went missing.
- `GTRUECREDIT` — `C0@78` quotes out of span and **names `:64`, which is where the expression is**,
  so it is not a defect. Without differentiating on disclosure the published figure is **4 where it
  is 3**, scoring a row defective for doing the thing the class exists to catch people not doing.

## 7. My own defects this fire, kept as recordings rather than tidied

1. **`drive1`, the input model.** I read my own `grade-cell.mjs` at `0c23e551` — the **subject's**
   pin — where my own instrument is not reachable, because it was committed after it. An
   instrument's own input cannot take the subject's rev; it is read at `HEAD` with the blob asserted
   byte-identical to the worktree copy, which is the model my own `grade-cell.mjs` already used for
   its own TSV. I had the lesson and did not apply it.
2. **`drive1`, the vacuous series.** I ran the P2 state series in the **arm-B** repo, so `state0`
   already carried the perturbing commit and all four modes read constant at every state. Four
   constants agreeing is not agreement. Repaired with a **fresh** series repo and `GNONCONST`
   registered as a leg, so the non-constancy is measured rather than assumed.
3. **`drive3`, the citation.** I cited the `identity × history-keyed` construction to
   `drive2.cell.out`, the grader's recording, where that verdict does not live. It was driven in
   `drive1.p3-scratch.out`. The leg I wrote to catch wrong citations caught mine.
4. **`drive3`, and this is the one I would most like on the record.** I ran quotation containment
   over `span.text` — the **blanked** span — so `'HIS'` had become `'   '` and the fragment could
   not have matched under any whitespace rule at all. **I built the reader that falls into
   self-blanking while grading his repair of the same hazard**, and the lesson it violates is one of
   mine. His repaired reader runs containment over the **raw** span for exactly this reason
   (`grade-immov.mjs:168–174`) and cites that lesson by name. So: his cure is **complete**, mine was
   not, and the correct split is **containment on the raw span, operators on the blanked one.**

## 8. The cripple

Registered in the pre-registration before the grader existed: `CONJ_CMP_MAX`, the ceiling on
state-vs-state comparisons the constructed leg may carry, re-keyed from `0` to **`-1`** — a value no
comparison count can produce. A switch on the **KEY, not the subject**: `git hash-object` on the
instrument is **`7916f8c3f84ed21c5463e2418bb0348638ff5eac` in both arms**.

```
LEGS: 15 · 1 moved          GCONJSRC   ok -> RED
VERDICTS: 3 · 1 moved       P2       LANDS -> REFUTED
CRIPPLE REACHED
```

P1 and P4 identical in both arms. The switch was **removed after the drive** as registered, so the
committed tree cannot drive a cripple by inheriting an environment variable — which means **the
committed instrument is not byte-identical to the one driven in drives 1–6**. `drive7` re-drives the
committed bytes (`6108337eb1f26956c891a919949f8a90879c0822`) and reads **GREEN at 15 legs**.

## 9. Not established

- **Occupiable is not occupied**, for all three constructed cells.
- The three-cell collapse in §2 is an argument from two measured transformations, not a census of
  all possible transformations. A fourth move that does **not** preserve axis B would not disturb
  the two measurements but would narrow the generalisation.
- §4 measures **one constructed leg**. Whether the five `conjunctive` rows in the 13-row sample are
  multi-figure is **not** measured here. `GCTRLPRE@194` is named as the likely case on the strength
  of its own `why` cell, which is a reading of his prose and not a measurement of the source.
- P5 was **declared NON-BLIND** in the pre-registration, with the exact prior reads named. What it
  grades is the reader and my filed hand read, not my knowledge of the answer.
- The whitespace-ignoring containment test can **over**-match in principle (`a ===b` matches
  `a===b`), so as a defect census it can only **miss** an out-of-span fragment, never invent one.
  That is the safe direction, and it is his stated blindness carried forward, not a new one.
