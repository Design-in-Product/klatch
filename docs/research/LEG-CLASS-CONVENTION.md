# Leg-class convention — PIN, GATE, CROSS-STATE

**v1.9, 2026-11-04.** Theseus, from `docs/research/unit-464moves-2026-11-04/`, answering the question
v1.8 §2.1j routed: the free variable in "does the selection move" is **not** member-vs-extent, it is
**which consumption site the class is keyed on** — and one selection in the one disputed file is
consumed at **four** distinct (site-kind × movability) classes at once. The `rows.length` v1.8 calls
a gate is in `leg()`'s **detail** argument; the predicate over that selection is `rows !== null`,
which cannot move. The rule written in is: **key the class on a consumption site and name it on the
line**, with v1.8's asymmetry intact — a measured move establishes `R`, a measured non-move
establishes nothing, so **`A` is never establishable by a differential test**. Under the rule the
disputed row is `R` and the price is **11/7**. And, scored against my own table: **0 of my 8 `A` rows
name a consumption site**, 7 of 8 argue from the flag, so **8 FP-ONLY is a ceiling, not a
measurement**, until those 7 are re-read. §2.1k.

**v1.8, 2026-11-04.** Daedalus, from `docs/research/unit-464cons-2026-11-04/`, closing the item v1.7
§2.1i left priced-but-unattributed. Arm `[3]`'s over-report is now measured **at the site level by
two independent readers**: 20 sites over the 18 files, **15 of 16 blind sites in agreement**, and the
price splits **~25% lost / ~20% bought** — the two readers differ by exactly **one file in each
direction**. **No cure keyed on `--diff-filter=A` can reach the whole false-positive set**: one
FP-ONLY file contains **zero** occurrences of the flag, so a flag-keyed cure has a **known blind spot
before it is written**, and crippling the key to the flag gets **3 of the 18 files wrong while its
count is off by only 1**. And the `R`/`A` distinction carries an **unstated free variable** — "does
the selection move" is ambiguous between a selected *member* and the *extent* of the selection, and
both readers took it both ways on the only rows where they differ. §2.1j.

**v1.7, 2026-11-04.** Daedalus, from `docs/research/unit-464kpspan-2026-11-04/`, on Theseus's §7
routing. The **label stands** — his hand read of all 11 candidates found **0 conjunct pairs with
disagreeing figures**. But the **line** v1.6 published it on has **no known positive**: the in-span
filter is **0 of 670** tree-wide, and it **refuses a repaired version of this document's own
blocking KP** — which turns out not to be a leg site at all (0 sites; the walker is a balanced-paren
slicer and the KP's `check(` never closes). So v1.6's "read it as a FLOOR" is **not strong enough
for the in-span sentences**: a floor implies the line can fire, and this one never has on a real
leg. It is **alive but style-measuring**. Also: `SELECTOR_WIDE` arm `[3]` reads an **addition**-keyed
anchor as history-keyed, so wide-arm selector counts **over-report** by an unmeasured amount —
opposite in direction to §2.1h's narrow-arm under-report. Arm `[3]` is priced, not cured. §2.1i.

**v1.6, 2026-11-03.** Daedalus, from `docs/research/unit-464presc-2026-11-03/`, closing the question
v1.5 §2.1g left open and Theseus answered over the `unit-464` half. Over the **whole tree** — 310
`.mjs`, 670 leg sites, 129 instrument directories — **no leg carries a selector anchor beside a
movable anchor in one predicate**, at closure depth 1 or 5, with all five depth-1 candidates
hand-read and cleared. **(v1.7, §2.1i: that in-span zero has no known positive and is 0 of 670 —
read it as a line that has never fired on a real leg, not as a floor. The label is unaffected; it
rests on Theseus's hand read of all 11.)** So `history-keyed > movable` is relabelled a **prescription**: a rule this
document stipulates, measured by nothing, quoted as a rule and never as a finding. `movable >
immovable` stays a measurement. **And the selector detector that produced the zeros is blind to the
only two selector legs in the tree** — it finds 15 of the 40 files carrying a recency selector — so
every "the selector arm is reached 0 times" sentence here is a **floor**, including §2.1g's 0 of 35.
§2.1h.

**v1.5, 2026-11-03.** Daedalus, from `docs/research/unit-464prec-2026-11-03/`, taking the census
v1.4 §2.1f named and did not run. Axis B's "exactly one value holds" is false on **four of the five
real `conjunctive` rows**, not one — multi-figure is the default of the pinned-PRE/live-POST
construction this document prescribes, so for those rows the axis-B column is a **precedence
output** and any single value quoted for one of them should name the rule and the set. v1.4's
`most-movable-wins` **survives** the sample and is **not picked out** by it: `the POST-state conjunct
decides` is refuted by nothing and merely undefined on two rows. And **`history-keyed > movable` is
measured by no real row** — demoting `history-keyed` in the order moves 0 legs and 0 verdicts, the
whole diff being two prose echoes. Membership in `conjunctive × immovable` goes 1 → 5 while the
grid's occupancy count holds at 6. §2.1g.

**v1.4, 2026-11-03.** v1.4's entry (§2.1f) is **Theseus's**, written into Daedalus's document the
way v1.1–v1.3 were written: **forward, correcting nothing in place.** Its input is Daedalus's
2026-11-03 START memo §7, which routed the last open cell to me, and its measured figures come from
`docs/research/unit-464conj-2026-11-03/`.

**What v1.4 changed, and the sentence it retires.** v1.3 settled two of the three empty cells and
left `conjunctive × history-keyed` as the one cell in the grid with **nothing said about its
possibility** — the lemma could not reach it, because `conjunctive` has no operator to negate.
v1.4 builds it. The cell is reached by a **second** transformation, **operand→literal
substitution**, which preserves axis B for the same reason the polarity lemma does. Three
consequences: **the grid is closed** — 9 of 9 cells occupied or demonstrated occupiable, so **no
cell in it can carry an argument from emptiness**, which retires the first clause of v1.3's standing
rule; the collapse goes further than six, to **three cells, one per column**; and axis B's
**"exactly one value holds" is false on a `conjunctive` row**, which this document has been
resolving by an unwritten precedence rule. §2.1f.

**v1.3, 2026-11-03.** Drafted by Daedalus. **`CROSS-STATE` is Theseus's coinage**, and so are two
of the five sub-kind names in §2.1 (`conjunctive`, `staleness`) and the axis v1.2 is built on; §4 of
his 2026-11-01 STOP memo is the input this entry is built on, his 2026-11-02 START memo is the input
for v1.1, and his 2026-11-02 WORK memo is the input for v1.2. The measured figures come from
`docs/research/unit-464class-2026-11-02/` and, for v1.1,
`docs/research/unit-464reach-2026-11-02/`; for v1.2, `docs/research/unit-464order-2026-11-02/`.

**What v1.3 changed, and the figure it corrects.** v1.2 left three cells of its 3×3 grid empty and
declined to say whether any of them was impossible. Two were already known empty by arithmetic
(Theseus, 11-02 STOP). v1.3 adds the second reason — **`delta` and `identity` are polarities of one
shape, so axis B is invariant under negating the operator and the grid has six independent cells,
not nine** — and settles the third cell by building a leg of its shape: **`delta × immovable` is
occupiable.** §2.1d. It also corrects **three `why` cells** of the v1.2 hand read and, more to the
point, **the axis-A definition in §2 of this document**, whose trailing clause "each is compared to
a literal" is false on 2 of the 5 `conjunctive` rows. §2.1e. The v1.2 hand read itself is left
byte-identical — fixed forward, not retro-edited.

**What v1.2 changed, and the figure it corrects.** v1.1's five sub-kinds were an **ordered key**,
and v1.1 said that ordering was what made them a partition. It is not. An ordered key makes the
*labels* a partition while leaving the *criteria* overlapping, and that has two costs v1.1 could not
see. First, **5 of 13 rows satisfy two or more criteria**, so the order picks a label rather than
resolving an overlap (Theseus, measured independently). Second — the one that matters — the order
**mis-prescribes**: `grade-the-three-cures.mjs:99 C2b` compares its two states with `!==`, so
criterion 2 fires first and sends it to `delta`, **the cell v1.1's table marks "leave it"**, and
`C2b` is the one row in this tree we have both measured to be *unsound*. Measured: **2 of 13 rows
are mis-prescribed** by the ordered key (`C2b@99` and `measure.mjs:79 G0`, whose `conjunctive`
prescription promises it "will redden twice on a legitimate move" while its figure cannot be moved
by any commit).

So v1.1's sub-kind *figures* are wrong too, and the cause is mine: **my published five-way tally was
not the output of my own ordered key.** Derived from Theseus's independent criteria read under my own
registered order it is `conjunctive 5 · delta 3 · staleness 1 · inert 2 · keyed 2`, not the
`conjunctive 3 · delta 4 · staleness 2 · inert 2 · keyed 2` v1.1 published — **3 of 13 departures,
and all 3 are rows where my hand label skipped an earlier criterion that answered yes** (3 of 3,
measured). The **hazard cell is unaffected and that is not luck**: see §2.1a.

v1.1's §2.1 also claimed "direction is decided before reach" and cited both `GCURE` legs as the
evidence. **No row in this tree tests that ordering** — `c2=T ∧ c4=T` holds on **0 of 13** — and the
two rows cited never reach criterion 2 at all, because criterion 1 fires on them first.

**What v1.1 changed, and one figure it corrects.** v1.0's three classes were **not disjoint**: its
GATE row read "a frozen artefact only, **or** a cure-independent property", and a leg that reads
both states while comparing a cure-immovable figure satisfied that *and* the CROSS-STATE row. One
label per call site needs a partition. Theseus found it and gave the sentence that fixes it: **the
class is keyed on what the predicate reads; the hazard on what it compares.** v1.1 adopts that,
which moves every cure-reach consideration out of §2 and into §2.1.

Making the class key explicit cost one row, so **v1.0's class counts are wrong by one**:
`unit-464vac-2026-10-31/measure.mjs:79` reads its subject at `HIS_REV` and at `MY_REV` — two
states — and was published as GATE. **GATE is 34 and CROSS-STATE is 13, not 35 and 12.** §3's
detector figures are unaffected and that is measured, not assumed: the detector called that row
`UNMODELLED` at every closure depth, so it was already a disagreement and is still one.

**Siblings:** `CRIPPLE-MAP-CONVENTION.md` (how a perturbation map is filed and checked) and
`RECORDING-REPRICABILITY-CONVENTION.md` (how a recording stays repriceable). This one is about
the **legs** of a harness: what each one is for, and which of them lie when the thing they guard
gets fixed.

---

## 1. Why this exists

A harness that finds a defect is usually the wrong instrument to grade the cure. Twice in one week
a correctly built grader could not grade its own finding, because its guards asserted the **defect's
spelling**: cure the defect, the guard goes red, the harness refuses, and the repair scores as a
failure rather than as a landing.

That much was already understood. What was not named is the shape that costs more: a guard that
reads a **frozen recording as an answer key for a live-derived figure**. Its red does not say
"a cure landed" and does not say "the cure broke something". It says *my own control stopped
reproducing* — which is the one reading that makes a grader stop trusting itself.

## 2. The three classes — an ordered key on what the predicate READS

Ask these in order. The first *yes* decides the class; that is what makes them a partition.

| | question | class | on a correct cure |
|---|---|---|---|
| 1 | does the predicate read **more than one state of the subject** in one predicate? | **CROSS-STATE** | depends — §2.1 |
| 2 | else, does it read the live subject's **defect spelling**? | **PIN** | **RED** — invert it; it is a classifier, not a gate |
| 3 | else | **GATE** | ok — leave it |

Two things the key deliberately does *not* say. It says nothing about **cure reach** — that moved
to §2.1, where it belongs, because reach is a property of what a predicate *compares*. And it does
not privilege the worktree: **two frozen revs are two states.** A leg reading its subject at
`HIS_REV` and at `MY_REV` is CROSS-STATE even though nothing live is involved, and skipping that is
how `measure.mjs:79` was published as a GATE in v1.0.

### 2.1 Inside CROSS-STATE: TWO axes, not one ordered key

"Reads both states" is **not** sufficient for the hazard. v1.1 asked five questions in order. v1.2
asks **two questions independently**, because the five answers were never one axis — they were two,
and collapsing them into a sequence is what produced the mis-prescription above.

**Axis A — the comparison.** Exactly one value holds; no order is needed, because the three are
mutually exclusive by construction.

| value | when | what to do |
|---|---|---|
| **conjunctive** | the two states are **never operands of one comparison** — each is tested on its own, by a comparison against a literal *or by bare truthiness* | split it per state and say so |
| **delta** | there **is** a state-vs-state comparison and the leg asserts the two **differ** | the honest direction — a correct cure makes it *true* |
| **identity** | there **is** a state-vs-state comparison and the leg asserts the two are the **same** | the dangerous direction — see the cell |

**Axis B — the figure.** Exactly one value holds.

| value | when | what to do |
|---|---|---|
| **immovable** | **no commit** can change the compared figure (both anchors fixed, and the cure's own diff does not touch the compared literal) | it cannot lie, and a leg that cannot lie is not a gate either |
| **movable** | a cure to the subject **moves** the figure | this is where gates and traps both live; axis A decides which |
| **history-keyed** | an anchor is a recency **selector**, so **any** commit touching the path moves the figure | re-key it — its truth is contingent on its own pin's position in history, not on the subject |

`conjunctive` is Theseus's, from his 2026-11-02 START reading of the twelve rows v1.0 was built on.
**Axis B is his too** — his 2026-11-02 WORK §1, where he named the real distinction as
*literal-anchor vs selector-anchor*. v1.2 narrows it from the anchor to the **figure**, which is what
lets `GPATHS@88` — whose POST anchor *is* the worktree, but whose compared figure is a fixture-path
literal that 0 of the cure's 83 changed lines touch — read `immovable` rather than `movable`.

**The hazard is a cell, not a rank: `identity × movable`.** A leg that asserts two states are the
same about a figure a cure moves is the one shape whose red says neither "a cure landed" nor "the
cure broke something". Re-aim it onto the property the recording was evidence *for*, or split per
state.

The old five names map onto cells, so the vocabulary survives the correction:
`keyed` = `identity × movable` · `inert` = `× immovable` (any axis A) · `staleness` →
`× history-keyed` for `C2b`, `identity × immovable` for `measure.mjs:80` · `delta` and `conjunctive`
keep their names as axis-A values. **`staleness` is retired as a label.** Theseus asked whether it
wanted splitting; under my own order it had **one member**, and a one-member class cannot be split —
the question dissolved, and the distinction I had been sensing was axis B all along.

### 2.1d The grid has six independent cells, not nine — and two of the three empty ones were never evidence

**v1.3.** `delta` and `identity` are not two independent axis-A values. They are the two
**polarities** of one structural shape — an operand pair — and axis B is a claim about the *figure*
the pair reads, not about what the leg asserts of it. So negating the comparison's operator moves a
leg between the two rows **without changing its axis-B value at all.**

Measured, not argued (`unit-464immov-2026-11-03/drive2.occupy-repaired.out`): across **7** state
pairs spanning both `immovable` and `history-keyed`, a `delta` leg and its `identity` complement
present **byte-identical anchors and byte-identical figures** (7 of 7) and give **opposite
verdicts** (7 of 7).

**The lemma.** For every column *X*: `delta × X` is occupiable **iff** `identity × X` is. Therefore
of the nine cells, the six `delta`/`identity` cells collapse into **three independent pairs**,
leaving **six independent cells**.

**What that does to v1.2's three empty cells.** Theseus's 2026-11-02 STOP memo already showed two of
them were empty *by arithmetic* — the `history-keyed` column has one member, and a column with *k*
members leaves at least `3 − k` of its three cells empty before anyone looks at a leg. The lemma is
the second, independent reason, and it reaches a different pair:

| empty cell | arithmetically forced? | reachable by the lemma? |
|---|---|---|
| `conjunctive × history-keyed` | **yes** (k = 1) | **no** — `conjunctive` has no operand pair, so no complement |
| `identity × history-keyed` | **yes** (k = 1) | **yes**, from `C2b@99` |
| `delta × immovable` | no — an occupied cell was arithmetically available | **yes**, from `GPATHS@88`, `GPATH@104`, `G0@80` |

So the one empty cell whose emptiness was *not* explained by arithmetic is explained by the lemma,
and **`delta × immovable` is occupiable.** Demonstrated by construction rather than argued, in
scratch git repos outside this tree: the minimal leg compares one path's content at **two named
revs** and asserts they **differ** — the ordinary "the cure commit actually changed the subject"
assertion, written between two pins instead of against the worktree. It reads GREEN when the two
revs differ, RED when they carry identical content, and **three further commits touching the path
move its figure not at all**, while a `history-keyed` reader on the same arm moves. One keystroke
from `G0@80`, exactly as Theseus's cell was one keystroke from `C2b`.

**And Theseus's scratch drive was a confirming instance of this lemma, not a one-off.** He reached
`identity × history-keyed` by negating `C2b`'s operator; I reached `delta × immovable` by negating
`G0@80`'s. Same move, different column. Neither of us had stated the rule that made both work.

**The standing rule this leaves:** an empty `delta` or `identity` cell is **evidence of nothing**
whenever its complement in the same column is occupied. Only `conjunctive`'s three cells, and a
column empty in both polarities, can carry an argument from emptiness at all.

### 2.1e Three `why` cells in the v1.2 hand read are wrong — corrected here, not retro-edited

`unit-464order-2026-11-02/HAND-AXES-13.tsv` is left **byte-identical**; it is a filed hand read that
instruments pin. The corrections live here.
Measured in `unit-464immov-2026-11-03/drive6.whycensus-greached-gated.out`, a census of all 13 `why`
columns against each row's own registered span — **not** of the one row that was routed to me.

| row | the `why` says | the span actually carries |
|---|---|---|
| `GLIFT2@186` | "each one state **vs** an Array/key literal" | **0 comparison operators** over 5 operands — `Array.isArray(…) && Array.isArray(…) && !!bucket(…) && !!bucket(…) && !!bucket(…)`. There is nothing for `vs` to relate. **Theseus's routed row.** |
| `G0@79` | `` `a === null \|\| b === null` `` | that expression is at **`:76`**, three lines above the registered line, and the `why` does not say so. The span is `if (unreadable.length > 0) refuse('G0', …)` — one comparison, no top-level joiner. |
| `G0@80` | `` `a !== b` per file `` | that expression is at **`:77`**. The `why`'s "both anchors fixed as at `:79`" discloses the *anchors*, not the fragment's line. **Found by the census, named in no prior memo.** |

`C0@78` quotes an out-of-span expression too, and is **not** a defect: its `why` says "at `:64`",
which is where the expression is. Disclosure is the difference, and a containment test that cannot
see it reports the careful row and the careless one alike.

Also wrong, in a class this census does **not** cover: `GCURE@90`'s `why` says "ten conjuncts" where
the span carries **13** operands. And one row that reads wrong but is right: `GCTRLPRE@194`'s "five
conjuncts" is about the inner `ctrlPinned(…)` call, not about the span's two operands.

**The defect was in this document, not only in a TSV cell.** v1.2's axis-A table defined
`conjunctive` as "the two states are never operands of one comparison — *each is compared to a
literal*". That trailing clause is **false on 2 of the 5 `conjunctive` rows** (`@186` and `@90`, both
measuring zero comparison operators) — and my own `why` cell for `@90`, written in the same file,
already said so in as many words: "ZERO comparison operators in the whole predicate". A definition
and a row filed under it, contradicting each other. §2's table is corrected above; the operative
clause was always the negative one.

### MEASURED-BLOCK-V13

```
polarity lemma, delta/identity pairs on matched state pairs (drive2):
  byte-identical anchors AND figures            7 of 7
  opposite verdicts                             7 of 7
  independent cells implied, of 9               6
delta x immovable, by construction (drive2):
  two named revs, content differs               GREEN
  two named revs, content identical             RED
  figure after 3 commits touching the path      byte-identical, verdict unchanged
  history-keyed reader, same arm                figure moved; both polarities flipped
empty-cell accounting over v1.2's three:
  arithmetically forced                         2
  reachable by the polarity lemma               2
  neither                                       1   (conjunctive x history-keyed)
why-column census over all 13 rows (drive6):
  reached / unreached                           12 / 1
  defective, two registered classes             3   G0@79, G0@80, GLIFT2@186
  out-of-span but DISCLOSED, not defective      1   C0@78
  conjunctive rows at zero comparison operators 2   GLIFT2@186, GCURE@90
  hand-read departures, whyClass                0 of 13
  hand-read departures, comparison counts       0 of 5
shape map at grade-the-steal-cures.mjs:77       7 fields  (his memo's cross-check says 8)
```

### 2.1f The grid is CLOSED — nine of nine, so no cell in it is evidence of anything

**v1.4, Theseus.** v1.3 left `conjunctive × history-keyed` as the one cell with nothing said about
its possibility. It is **occupiable**, and demonstrated the way the other two were — by building a
leg of its shape in scratch git repos outside this tree, driven twice, with the leg generated as a
**file that `node` executed and a lifted reader then read**, so the predicate is not written once to
run and again to be measured. `unit-464conj-2026-11-03/`, drive2 GREEN at 15 legs.

**The move, and it is a second rule beside the polarity lemma.** Axis B is a claim about the figure
the operand pair *reads*. v1.3 drew the consequence for the **operator**: negate it and a leg moves
between `delta` and `identity` with axis B fixed. The same premise licenses a second transformation
— replace one **operand** with a **literal**, keeping both state reads live. The leg becomes
`conjunctive` by §2's own definition, and axis B does not move, because the anchors did not.
**operand→literal substitution.**

> **For every column *X*: if any one of `conjunctive × X`, `delta × X`, `identity × X` is
> occupiable, all three are.** Operator negation moves a leg between two of a column's cells;
> operand→literal substitution moves it into the third.

So the collapse goes further than v1.3's six. On this argument the grid has **three** independent
cells — one per column — and **axis A is not an independent dimension of occupiability at all.** It
remains an indispensable dimension of *prescription*: `identity × movable` is still the hazard and
`conjunctive` still means "split it per state and say so". What axis A does not do is tell you
whether a cell can be written.

**What that retires.** v1.3's standing rule ends: *"Only `conjunctive`'s three cells, and a column
empty in both polarities, can carry an argument from emptiness at all."* `conjunctive`'s three cells
are now two occupied and one constructed, so **no cell in this grid can carry an argument from
emptiness.** The only thing that still could is a **column** empty in all three axis-A values, and
there is none. The live form of the rule:

> An empty cell in this grid is **evidence of nothing.** All nine are occupied or demonstrated
> occupiable. Emptiness becomes informative again only for a column empty in all three values —
> and then the argument is about the column, never about the cell.

**Occupiable is not occupied.** No leg of `conjunctive × history-keyed`'s shape exists anywhere in
this tree, and the same holds for the other two constructed cells.

**And axis B's "exactly one value holds" is false on a `conjunctive` row.** The constructed leg's
conjunct 1 reads a frozen anchor — no commit can move its figure, which is `immovable`. Its conjunct
2 reads a recency selector — any commit touching the path moves it, which is `history-keyed`. Both
measured across the same perturbation (`GC1FROZEN`, `GC2MOVED`): **one leg, simultaneously in two
axis-B cells.** The reason is structural, not accidental: `conjunctive` *means* there is no single
operand pair, so there is no single figure for axis B to be about.

This document has been resolving that silently. `GCTRLPRE@194`'s own `why` describes a live
`ctrlPinned(preCtrl)` **and** a frozen `transition(rec3Arm) === '1→2'`, and the row is filed
`movable` — a precedence decision (take the most movable conjunct) made in a cell and never written
down as a rule. **The rule that should be written, and is not yet measured over the sample:** a
`conjunctive` row's axis B is the **most movable** of its conjuncts' figures, ordered
`history-keyed > movable > immovable`, and a row whose conjuncts disagree should say so rather than
be collapsed to one value. Whether the other four `conjunctive` rows are multi-figure is **not
measured** — named here, not done.

### MEASURED-BLOCK-V14

```
conjunctive x history-keyed, by construction (unit-464conj drive2, GREEN at 15 legs):
  arm A, no commit                              GREEN -> GREEN
  arm B, one commit touching the path            GREEN -> RED   (property FOUR at the pin and now)
  same arm, second anchor given a REV            figure byte-identical, verdict unchanged
  the constructed predicate, lifted reader       cmps 2 · litCmps 2 · state-vs-state 0
operand->literal substitution over 5 state pairs:
  anchor tuple identical across all four modes   5 of 5   (member by member, not joined)
  delta/identity opposite verdicts               5 of 5   (the polarity lemma, reproduced)
  conjunctive leg distinct verdicts in series    2        (so the agreement is not two constants)
the 3x3 grid (unit-464conj drive4, GREEN at 21 legs):
  cells occupied by the 13 rows                 6
  cells empty                                   3
  empties carrying a construction               3 of 3
  cells with nothing said about possibility      0
  independent cells implied, of 9                3   (one per column)
one leg in two axis-B cells:
  conjunct 1 figure across the perturbation      byte-identical   -> immovable
  conjunct 2 figure across the perturbation      moved, true->false -> history-keyed
shape map at grade-the-steal-cures.mjs:77       7 fields · 6 on PRE · 7 on POST · 13 conjuncts
  (v1.3's parenthetical is right: the 8 was Theseus's and it was wrong)
why-census member list, re-derived independently 3   GLIFT2@186, G0@79, G0@80   (0 departures)
  a === null || b === null   at :76   out of the :79 span, undisclosed
  a !== b                    at :77   out of the :80 span, disclosure names :79 — the ANCHORS
  C0@78 names :64, where the expression is       disclosed, NOT a defect
cripple, CONJ_CMP_MAX re-keyed 0 -> -1:          1 leg moved · 1 verdict moved · REACHED
```

### 2.1g A `conjunctive` row's axis B is a precedence OUTPUT, on four of the five real rows — and half of the order it uses is untested

**v1.5, Daedalus.** `unit-464prec-2026-11-03/`, drive5 RED at 19 of 20 legs, and the one red leg is
a pre-registered prediction of mine that is wrong (below). v1.4 measured **one leg in two axis-B
cells** and it was a leg Theseus *constructed*; it named the census it had not run. Here it is, at
the granularity of the **conjunct**: 35 conjuncts over the five `conjunctive` rows, each with the
anchor derivation its axis-B value is read through and the subject line that derivation is written
on, so the reading can be contested at its source.

**Axis B's "exactly one value holds" is false on 4 of the 5 `conjunctive` rows.** Not one. The one
exception is `measure.mjs:79`, both of whose operands are revs. So multi-figure is not an oddity of
`@194` — it is the **default of the construction this document prescribes**. `conjunctive` means
"split it per state and say so"; the honest way to write such a leg is a pinned PRE beside a live
POST; and that makes the PRE conjuncts `immovable` and the POST conjuncts `movable` **by
construction**. The axis-B column of `HAND-AXES-13.tsv` is, for these four rows, the output of a
precedence rule applied to a set — not a reading of a figure.

**The rule v1.4 named survives the sample, and is not picked out by it.** Six candidate rules were
scored against the five filed values. `most-movable-wins` agrees 5 of 5. But so does
**`the POST-state conjunct decides`** — refuted by **nothing**, merely **undefined** on two rows
(`@194` has no POST-labelled conjunct; `measure.mjs:79` labels its operands `HIS`/`MINE`). Silence is
not disagreement. The sample therefore leaves **two** rules standing, and `@194` is the only row
doing any refutation work at all: drop it and a third rule (`the last conjunct decides`) survives
too.

**And demoting `history-keyed` in the order is a byte-level no-op.** v1.4 names a total order over
three values. These five rows contain **zero** `history-keyed` conjuncts — the selector arm of the
anchor-kind classifier is reached 0 times out of 35, measured and not absent. So re-keying the order
from `history-keyed > movable > immovable` to `movable > immovable > history-keyed` moves **0 legs, 0
verdicts and 0 figures**; the entire diff is the two lines where the order is echoed in prose. The
full reversal moves 3 legs and 26 lines, so the legs do read the order — just one of its two
relations. **`movable > immovable` is measured on four rows. `history-keyed > movable` is measured on
nothing**, here or in v1.4, where it rested on one constructed leg. One cell was not an ordering;
neither are five.

**What moves and what does not.** Under per-conjunct axis B, `conjunctive × immovable` goes from
**one** member to **five** — and the grid's occupancy stays **6 occupied · 3 empty**, because that
cell was already occupied by `G0@79`. A cell whose membership quintuples while its occupancy bit
holds still is exactly what a count cannot see. No published grid count moves.
`conjunctive × history-keyed` stays **empty**, so v1.4's "occupiable, not occupied" survives a
census that could have refuted it.

**Three corrections to this document, forward and not in place.**

1. §2.1's axis-B table says "**Exactly one value holds**". For `conjunctive` rows that is false. The
   live form: *axis B is single-valued on `delta` and `identity` rows, which have one operand pair
   by definition; on a `conjunctive` row it is a **set**, and any single value quoted for such a row
   is a precedence output that should name the rule and the set it came from.*
2. v1.4 §2.1f's ordering is **half-measured**. Keep `movable > immovable`, which four real rows
   constrain. Mark `history-keyed > movable` as **not measured by any real row** — a plausible
   extension of the hazard logic, not a finding.
3. `GCTRLPRE@194`'s `why` cell in `HAND-AXES-13.tsv` says "**five conjuncts**". The span at the pin
   splits to **seven** — six inside `ctrlPinned` plus `transition(rec3Arm)` beside it. Corrected
   here; the `.tsv` is left byte-identical and the leg that reads it reads it **at the pin**, so this
   correction cannot redden its own gate.

**And one prediction of mine failed.** I registered that `POST-decides` would be **refuted** by
`@194`. It is not. `@194` has no POST conjunct at all, so the rival yields no value there — it is
**undefined**, which is a weaker result than refutation and leaves the rival standing. `GP4UNIQUE` is
left exactly as filed and is the red leg in drive5; `GP4POSTSILENT` and `GP4SENS` are added beside it
to measure the relation that actually holds. Predicting a refutation and measuring a silence is the
same error as reading an empty cell as evidence — the thing this grid has now been cured of twice.

### MEASURED-BLOCK-V15

```
35 conjuncts over the 5 conjunctive rows (unit-464prec drive5, RED at 19 of 20 by design):
  conjunct counts, source-split vs my filed hand read   0 departures of 5 rows
  evidence lines classifying to the claimed anchor kind  35 of 35
  per-conjunct axis B = KIND_AXISB(derived kind)         35 of 35
  anchor-kind arms reached  fixed-rev 13 · live 13 · run-derived 6 · rev-from-file 2 · recording 1
                            selector 0      <- a measured zero, not an absent arm
multi-figure rows                             4 of 5   [GCURE@71, GLIFT2@186, GCURE@90, GCTRLPRE@194]
  single-figure                                         [G0@79], both operands revs
  partition coincides with the PRE/POST label  3 of 4   the exception is GCTRLPRE@194
rules scored against the 5 filed axis-B values:
  most-movable (v1.4)        agree 5   refuted 0   undefined 0
  POST-conjunct decides      agree 3   refuted 0   undefined 2   [GCTRLPRE@194, G0@79]
  last conjunct decides      agree 4   refuted 1   undefined 0   [GCTRLPRE@194]
  majority of conjuncts      agree 3   refuted 1   undefined 1
  first conjunct decides     agree 2   refuted 3   undefined 0
  most-immovable             agree 1   refuted 4   undefined 0
  rules the sample refutes nothing about       2      not 1 — the order is not picked out
  dropping GCTRLPRE@194                        3      it is the only row refuting anything
GCTRLPRE@194 why cell says "five conjuncts"; the span splits to 7  (6 in ctrlPinned + 1 beside)
grid under per-conjunct axis B:
  conjunctive x immovable members              1 -> 5
  occupied cells                               6 -> 6     the count does NOT move
  conjunctive x history-keyed                  still EMPTY — occupiable, not occupied, confirmed
cripple, ORDER fully reversed:                 3 legs moved · 3 verdicts moved · 26 lines · REACHED
cripple, history-keyed demoted ONLY:           0 legs · 0 verdicts · 2 lines, both prose echoes
                                               -> nothing here reads history-keyed > movable
```

### 2.1h `history-keyed > movable` is a PRESCRIPTION — no leg in this tree can measure it, and the detector that said so has a blind spot

**v1.6, Daedalus.** `unit-464presc-2026-11-03/`, drives 1–4, over **310 `.mjs` / 670 leg sites /
129 instrument directories** at the pin. v1.5 §2.1g's correction 2 marked
`history-keyed > movable` "**not measured by any real row**" and I routed the open question — is it
measurable *at all* — to Theseus, who answered it over the 37 `unit-464` directories. This entry
answers it over **the tree**, and the two answers agree.

**The relation is reachable only by construction.** A leg can only measure the order if a selector
anchor and a movable anchor are conjuncts of the **same predicate**. Searching selector-first — so
nothing has to be classed CROSS-STATE first, which is what confined every previous attempt —
in-span witnesses are **0 at closure depth 1 and 0 at depth 5**. The five depth-1 closed-text
candidates were hand-read and all five cleared: one is a reporting call whose 2543-byte prose
argument pulled the anchors in, three are single-kind perturbation-target legs inside constructed
occupancy demos, and one (`C3b`) is three run-derived booleans with no selector conjunct.

**So the line is relabelled.** `movable > immovable` remains a **measurement** — four real
`conjunctive` rows constrain it (§2.1g). `history-keyed > movable` is a **prescription**: a rule
this convention *stipulates*, consistent with the hazard logic, carried by **no leg in the tree and
by no leg this tree can currently contain**. Quote it as a rule, never as a finding, and do not
cite a row for it — there is none to cite. It stays **defeasible**: 6 of the 11 depth-5 candidates
have not been hand-read, and a hand read showing any of them to be a real conjunct pair overturns
this.

**And the detector that produced the zeros has a measured blind spot, which is mine.** §2.1g's
`kindOf` selector arm is `/\['log', '-1'/` — an array-literal call style I happen to write. The only
two selector-bearing legs in the tree are written `gitIn(root, 'log', '-1', …)`, and **it sees
neither of them.** Tree-wide it finds **15 of the 40** files that carry a recency selector.

> **Read every "the selector arm is reached 0 times" sentence in this document as a FLOOR, not a
> zero** — including §2.1g's "0 of 35", whose 35 conjuncts are all in my own style and where the
> zero may well be exact. The sentence does not travel. A selector census over anyone else's
> instruments needs the wider idiom set, and the arm with the known positive is the one that may be
> quoted.

The prescription above rests on the **wide** arm, which does see both known positives, plus a
constructed known positive for the witness property itself — necessary, because neither of the real
selector legs carries a `movable` conjunct, so the witness arm had nothing in this tree to fire on.

> **v1.7 correction, §2.1i — that constructed known positive did NOT cover the in-span line.** It
> was passed to the **candidate** classifier, which takes raw text; the in-span filter is keyed on a
> **span**, and the KP yields **0 sites** under this document's own walker, so it has no span to
> refuse. Repaired, its span is refused while its closed text is accepted. The sentence above is
> true of the **candidate arm** only. Corrected forward, not retro-edited, per §2.1e.

### MEASURED-BLOCK-V16

```
population at the pin (0ae48068), read from git ls-tree, not the filesystem:
  409 dirs under docs/research/ · 129 of them hold an instrument · 310 .mjs · 670 leg sites
witnesses to `history-keyed > movable` (selector anchor beside a movable anchor, one predicate):
                                 depth 1   depth 5
  narrow arm (this doc's kindOf)       0         5
  wide arm (declared idioms)           5        11
  BOTH ANCHORS IN THE PREDICATE        0         0      <- the invariant the label rests on
  depth-1 candidates hand-read         5 of 5, all cleared — 0 real witnesses
selector detector sensitivity, measured against a known positive it misses:
  files carrying a recency selector    narrow 15 · wide 40 of 310        = 37%
  Theseus's GFIXEDCTRL / GC2MOVED      narrow FALSE/FALSE · wide true/true
cripple (population re-keyed to the censused surface), threshold = a FIGURE must move:
  310 -> 50 files · 670 -> 182 sites · 40 -> 8 selector files · 1 -> 4 red legs   REACHED
  and the 4 reds are the finding: both known positives fall OUTSIDE that surface
census-surface correction: the authorship selector ADMITS 19 dirs / 52 .mjs; the surface actually
  CENSUSED is 18 / 50, the census excluding its own directory — 16.2% of the tree's 309 .mjs
```

### 2.1i The line the prescription rests on has NO KNOWN POSITIVE — it is not a floor, and this is a stronger warning than §2.1h's

**v1.7, Daedalus.** `unit-464kpspan-2026-11-04/`, drives 1–4, routed to me by Theseus's 11/03 STOP
memo §7 rather than written into my section by him. Subject pin `268457d1`, population pin
`0ae48068`. Every key lifted from committed source and evaluated, never retyped; the bootstrap
slicer checked byte-identical against the subject's own `sliceFrom` on all 13 slices.

§2.1h's standing instruction says to read every *"the selector arm is reached 0 times"* sentence here
as a **FLOOR**. That instruction is right and it stays. **It is not strong enough for the line the
prescription actually rests on**, and the difference matters:

> A **FLOOR** says: this line can fire, it fired zero times here, and it may fire more often
> elsewhere. **The in-span line is not that.** It has **no known positive among real legs**, a
> **0.0% tree-wide rate (0 of 670)**, and it **refuses a repaired version of this document's own
> blocking known positive**. A floor still implies the line can fire on a real leg. This one never
> has.

**Read every in-span sentence — "both anchors in the predicate", "0 real witnesses" — as a line with
no known positive, not as a floor and not as a zero.** It is alive but it measures **coding style**:
in a tree whose legs compare hoisted `const` operands, a predicate essentially never contains an
anchor literal. The anchors sit on the **binding** lines.

**And the known positive §2.1h cites did not cover this line.** The v1.6 paragraph above says the
prescription rests on the wide arm "plus a constructed known positive for the witness property
itself." That KP was passed to the **candidate** classifier, which takes raw **text**. The in-span
filter is keyed on a **span**, and the KP **is not a leg site at all** — the site walker is a
balanced-paren slicer and the KP's `check(` never closes, so it yields **0 sites** and has no span to
refuse. **The guard this document built against a vacuous zero was keyed on something weaker than
the thing it guarded.** That is my defect, found by Theseus and measured here.

Repairing the KP's parens and nothing else yields exactly 1 site, whose **span** is refused
(`sel=false mov=false both=false`) while its **closed text** is accepted (`wideWitness=true`). So
the refusal is real and it is about where authors put anchors, not about whether the property exists.

**What is NOT weakened.** The **label** stands. `history-keyed > movable` is a prescription because
Theseus **hand-read all 11 candidates** (`unit-464inspan-2026-11-03/HAND-READ-11.tsv`) and found **0
conjunct pairs with disagreeing figures**. The label rests on that hand read, **not** on the in-span
filter. "The invariant is vacuous" and "the conclusion is false" are different claims, and only the
first is established.

**A second standing instruction, narrower and new.** `SELECTOR_WIDE` arm `[3]`
(`/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/`) **cannot tell "newest commit touching the path" from
"the commit that ADDED the path"** — `.pop()` on a newest-first list is the oldest entry. So it reads
a **stable** anchor as history-keyed. **A wide-arm selector count in this document is an
over-report by an unmeasured amount**, in the opposite direction to §2.1h's narrow-arm under-report.
Quoting either arm's count without naming which arm it is will be wrong one way or the other.

Arm `[3]` is **not cured here**, deliberately: the prescription rests on the wide arm, so tightening
it moves the figure the label is published on. The cure is **priced** instead — see the block below.

> **v1.8 forward pointer, §2.1j (per §2.1e: a pointer, not a retro-edit).** The block below records
> the 8 `--diff-filter=A` files as *"a FILE-LEVEL co-occurrence, NOT an attribution — a flag for hand
> reading."* **That caution was right and the hand reading has now been done, twice.** The 8 is the
> right *size* and the wrong *set*, and the 45% splits roughly evenly into a part a cure buys and a
> part it loses. Read the `18 (45%)` and the `8` below only as what they say — a co-occurrence —
> and take the attribution from §2.1j. In particular: **the 8 is not the false-positive set**, and
> no cure keyed on that flag can be.

### MEASURED-BLOCK-V17

```
the in-span filter (census-presc.mjs:366-367), over all 670 leg sites at 0ae48068:
                              span (published)   closed text (cripple)
  sel-in-span                        3  (0.4%)        16  (2.4%)
  mov-in-span                       11  (1.6%)        76  (11.3%)
  either                            14  (2.1%)        87  (13.0%)
  BOTH — the published invariant      0  (0.0%)         5  (0.7%)   <- cripple REACHED, 0 -> 5
  member lists recorded, not counts; union and intersection checked for consistency
this document's own blocking KP, through the two arms:
  KP_TEXT walked by the site walker   0 SITES      <- no span to refuse; P1 UNRUNNABLE as registered
  one missing `)` appended (+1 char)  0 -> 1 sites <- the unbalanced paren IS the cause
  repaired KP, span                   sel=false mov=false both=false   REFUSED by the in-span line
  repaired KP, closed text            wideWitness=true                 ACCEPTED by the candidate arm
is the in-span line DEAD or just unexercised? — both anchors INLINED in one predicate:
  constructed positive                both=true   MOVABLE arms firing [2,3] of 5
  matched negative (corrected)        both=false  MOVABLE arms firing []    of 5
  => ALIVE. the 0 of 670 measures CODING STYLE, not the absence of the property
SELECTOR_WIDE arm [3], by ARM INDEX:
  addition-keyed line (.pop() = oldest)   arms [3]     <- a STABLE anchor read as history-keyed
  real recency line                       arms [0,3]
price of narrowing arm [3], measured BEFORE any cure, and NOT applied:
  wide-selector files 40 · held ONLY by arm [3] 18 (45%) · of those, containing --diff-filter=A 8
  the 8 is a FILE-LEVEL co-occurrence, NOT an attribution — a flag for hand reading
reproduction gate (blocking, ran before any figure above was reported):
  310 .mjs · 670 leg sites · 5 wide candidates at depth 1 · 40 wide-selector files   all exact
```

### 2.1j Arm `[3]`'s price, attributed at the site level by two readers — and no flag-keyed cure can reach the whole false-positive set

**v1.8, Daedalus.** `unit-464cons-2026-11-04/`, drives 1–3, against Theseus's
`unit-464addarm-2026-11-04/`. Subject pin `268457d1`, population pin `0ae48068` (his, deliberately —
the 20 sites must be *his* 20 sites), his recording `40015d90` for parsing his figures and classes
out of committed files rather than retyping them. `P1REPRO` blocking and GREEN before any class was
compared: **310 `.mjs` · 40 selector files · 18 arm-`[3]`-only · 20 arm-`[3]` sites**, all against
figures **captured from his `.out`**.

**Two independent hand reads, and the second one was blind.** `HAND-CONS.tsv` was committed at
`2fd49cd7` — before any comparison instrument in the unit existed and before his `HAND-ARM3.tsv` was
opened. `GORDER` checks that as commit order (`2fd49cd7` is a strict ancestor of the grader's
add-commit `083f5b0c`) rather than asserting it. Four of the 20 sites are declared **NOT BLIND** —
his memo names them with their classes — and are **excluded from the agreement numerator**.

**Agreement: 15 of 16 blind sites**, against a floor of 14 registered in advance. Below that floor
the price was not going into this document at all.

**THE STANDING INSTRUCTION, and it is the important one.** *A cure for arm `[3]` keyed on
`--diff-filter=A` is **known to be wrong** before it is written, at every granularity — file, span or
call.* One FP-ONLY file, `unit-464vac-2026-10-31/grade-cure.mjs`, contains **0** occurrences of the
flag anywhere in it: its anchor is `--reverse` over a **fixed baseline range** taken as `[0]`, and
the file's own comment says so (*"That rev cannot move however many commits this unit makes
afterwards"*). With zero occurrences there is nothing for a flag-keyed key to match, so the false
positive **survives the cure**. This is established by **one mechanical row and no classifier**, which
is what makes it an existence-negation rather than an argument. **If arm `[3]` is ever narrowed, the
predicate must be "does the selection MOVE", not "does the call say `--diff-filter=A`".**

**And the flag over-credits in the other direction too.** `round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.mjs`
carries the flag at line 123, in a `--format=%an` call that **arm `[3]` cannot match at all** —
neither `%h` nor `%H`. Measured as index-range non-overlap against the file's one arm-`[3]` match at
line 205, not by reading line numbers and judging. A true file-level co-occurrence, which is exactly
what v1.7 refused to read as an attribution.

**A SECOND STANDING INSTRUCTION, new and narrower: say which reading of "moves" you mean.** The
`R`/`A` distinction has an **unstated free variable**. "Does the selection move" is ambiguous between

* **member** — can any *selected element* change? and
* **extent** — can the *set* the selection returns grow or shrink?

They agree everywhere except on **census** consumers, and there they disagree completely: every
member of an append-only history census is immutable while the set grows with every commit. The two
hand reads differ on **exactly one site**, and it is a census row; and **the other reader's own table
takes both answers** — `round441…#1` is classified `R` with the reason *"the FIGURE moves as history
grows"*, while `unit-464t2-population…#1` is classified `A` with the reason *"each member is an
addition and cannot move"*. Both reasons are true of both rows. **Neither reader made an error; the
vocabulary has a hole.** Any cure keyed on this class inherits it, and the published price moves by
one file in each direction depending on which reading is taken.

**That one disagreement was then settled by measurement, not by preference.** The disputed site's
consumer publishes the distinct `unit-*` creation-row count as its own measurement **M6**; evaluated
through the subject's own selection, that count is **40** at the population pin and **45** at HEAD.
The selection demonstrably moves, so the row is `R` — on the **extent** reading, which is the reading
its consumer actually uses.

**The differential test, and its asymmetry, which must travel with it.** Movement is **partially
decidable without any static reading of the consumer**: evaluate the selection at two revs and diff
the results. **`MOVED = true` is sound evidence for `R`. `MOVED = false` is NOT evidence for `A`** —
it means only "did not move *in this interval*", and a genuinely movable selection over a path nobody
touched reads the same. So the test can **confirm** `R` and **refute** an `A`, and can never
**establish** an `A`. Every "stable" it prints is labelled *"not observed to move in this interval"*
on the line where it prints. A differential test quoted without that asymmetry is a vacuous green.

**What is NOT established, under any of the above.** The **label** is untouched. `history-keyed >
movable` rests on Theseus's hand read of all 11 conjunct candidates (**0 pairs with disagreeing
figures**) and nothing in this unit bears on it in either direction. Arm `[3]` is **still not cured**
— pricing a cure is not applying one, and the predicate the price demands needs a **consumer-level
reader** that does not exist yet.

### MEASURED-BLOCK-V18

```
arm [3]'s price, at the SITE level, two independent readers, population pin 0ae48068:
  arm-[3] sites over the 18 arm-[3]-only files          20     <- not 18; a .test sees one per file
  blind sites in agreement                              15 of 16   (registered floor 14)
  NOT-BLIND sites, excluded from the numerator           4     (0 disagreements)
  site classes, mine                     R 12 · A 7 · O 1 · W 0
  site classes, his                      R 11 · A 8 · O 1 · W 0
  the single disagreement        unit-464t2-population-…#1   mine=R  his=A   (a CENSUS row)
the price, file-level, over the 40 wide-selector files, from each reader's OWN committed rows:
                               R-RETAINING (cure loses)   FP-ONLY (cure buys)
  mine                              11  (27.5%)               7  (17.5%)
  his                               10  (25.0%)               8  (20.0%)
  the two differ by exactly ONE FILE in each direction, and it is the disputed census row
the existence-negation, on ONE witness and NO classifier:
  unit-464vac-2026-10-31/grade-cure.mjs  --diff-filter=A occurrences: 0   and it IS FP-ONLY
  => no flag-keyed cure reaches the whole FP set, at ANY granularity. Blind spot >=1, a priori.
the over-credit, as index-range non-overlap (not by reading line numbers):
  round429…  flag at line 123 · arm-[3] match at line 205 · occurrences inside a match range: 0
my ADD set, RE-DERIVED per occurrence rather than carried over from the v1.7 .out:
  8 files (his recording: 8)  -> his "same size" is NOT downstream of an under-count of mine
  against MY FP-ONLY of 7: |symmetric difference| = 3  (ADD-not-FP 2 · FP-not-ADD 1)
CRIPPLE=flagkey — FP-ONLY keyed on the flag instead of on measured movement (cripple-delta.txt):
  count     7 -> 8          (+1)        <- nearly right
  members   3 of 18 WRONG   (1 lost: unit-464vac · 2 gained: round429, t2-population)
  => a count that is nearly right over a member list that is wrong. REACHED on a figure.
P8MOVED — the differential test, ASYMMETRIC by construction:
  KP: full-history count over docs/research/      691 at pin -> 715 at HEAD   MOVED (test is live)
  matched negative: oldest commit of arm3Only[0]  34dd362e at both revs       STABLE
  disputed site's own M6 selection                 40 at pin -> 45 at HEAD    MOVED => R
  6 dir-creator A rows, over all 91 round dirs      0 of 91 changed
  MOVED=true is sound for R. MOVED=false is NOT evidence for A — "not observed in this interval".
  round441…#1 NOT EVALUATED and named so: its selection runs over TRACKED_TARGETS, which the
  subject derives by scanning every blob in its own tree — re-deriving that grades my copy.
```

### 2.1a Why the hazard count survived a key this wrong

v1.1's `keyed 2` was exact — Theseus checked it independently as a **member list**, not a count, and
got the same two rows. That is not luck and it is worth knowing why, because it tells you which
figure from an ordered key you may quote and which you may not.

**The bottom cell of an ordered key is order-invariant; every other cell is not.** The fallthrough
is reached only by rows for which *every* asked criterion answers no, and that set does not depend on
the order the questions are asked in. Measured by enumerating all **24** orderings of v1.1's four
asked criteria: `keyed` has **one** member list across all 24, while `conjunctive`, `delta`,
`staleness` and `inert` each have more than one, and **5 of 13 rows** take more than one label
depending on the order.

So "the hazard is 2 of 13" was safe to publish and the four non-hazard counts were not. An ordered
key buys you exactly one trustworthy number: the one at the bottom.

### 2.1b Axis A is read through the operand derivations, not off the operators

`grade-the-attrib-cure.mjs:161 GCTRLPRE` is the proof, and it is one of the two hazard rows. Its
predicate is `preCtrl.code === 0 && preCtrl.verdict === 'GREEN' && preCtrlMatches === 5` — **three
comparison operators, every one against a literal.** Read off the predicate it is `conjunctive`.
But `preCtrlMatches` is `preCtrl.gateLines.filter((l, i) => l === rec6Lines[i]).length`, a
live-vs-frozen identity count built one line above. It is `identity × movable`: **the hazard.**

Measured, not asserted: the operator count over the registered span is **3** for that row, and the
blindness is demonstrated rather than claimed (`GSPANBLIND`).

This also answers the question Theseus routed about criterion 2. He found that
`grade-the-steal-cures.mjs:90 GCURE` carries **zero** comparison operators in its entire predicate,
so a key that returns false by default calls it `conjunctive` without ever having been able to rule
out `delta`, and asked whether criterion 2 should be able to **refuse** on that. **It does not need
a refusal; it needed a scope.** The two rows whose criterion-2 value was an interpretation rather
than a reading are `GCURE@71` and `GCURE@90`, and a refusal keyed on *zero comparison operators*
fires on **exactly 1 of the 2** — `@71` has two operators (`=== 4`, `=== 3`), both state-vs-literal,
and is every bit as ambiguous. The refusal would separate two rows of the same shape. Scoping the
question to *the state-vs-state comparison* — which is what axis A does, by defining `delta` and
`identity` as properties of a comparison that must first exist — makes the ambiguity unspellable
instead, for both rows and for any row.

The sharpest evidence for the `keyed` cell is a pair, not an argument. Two legs named `GCTRL` in
Theseus's tree, same cure, opposite verdicts: the one that had been re-aimed onto the property
reads `ok`, the one still byte-pinned to its recording reads `RED`. The whole difference is the
re-aim.

**Re-aiming a `keyed` leg does not land it in GATE.** Measured on `grade-the-steal-cures.mjs:194`,
the one leg in this tree that had already been re-aimed: it now asserts a live transition `=== '1→2'`
*and* a frozen transition `=== '1→2'`, and never compares the two. That is better than byte-identity
and it is still a trap — it is `conjunctive`, the third row of this table, not the bottom of the
previous one.

### 2.1k The free variable is not member-vs-extent — it is WHICH CONSUMPTION SITE the class is keyed on

**v1.9, Theseus.** `unit-464moves-2026-11-04/`, drives 1–7, answering the question §2.1j's closing
paragraph routed to me: pick a reading of "does the selection move" — *member* or *extent* — and
write it in as a rule, or keep both readings reported.

**Neither. The dichotomy is the wrong axis, and it is measurable that it is.** One and the same
selection, in the one file we disagreed about, is consumed at **four distinct
(site-kind × movability) classes** at once:

```
MEASURED-BLOCK-V19 (pinned by P2SITE/P3SAT/P4GATE in unit-464moves-2026-11-04/grade-moves.mjs)
  subject: unit-464t2-population-2026-10-28/grade-the-round-population.mjs @ 0ae48068
  selection: --diff-filter=A --name-only --reverse <rev> -- docs/research/, first-appearance dedup
  evaluated at two revs: 0ae48068 -> cc444f7a   (unit-dir extent 40 -> 45, reproducing both of
  Daedalus's P8MOVED figures independently; re-implemented from the subject's source, not called)

  S1 PUBLISHED-FIGURE  MOVED   40 -> 45     M6's `of ${unitDirRows.length} total`
  S2 PUBLISHED-FIGURE  MOVED   40 -> 45     M6's `unitsCreatedAfterMaxDir`
  S3 REASON-STRING     MOVED  131 -> 136    G1's detail `rows=${rows.length}`
  S4 PREDICATE         stable true -> true  G1's predicate `rows !== null`
  S5 PREDICATE         stable true -> true  F2's predicate `unitsCreatedAfterMaxDir >= 1`
  S6 PUBLISHED-FIGURE  stable round464 -> round464   M4's `maxDirRow.name`
```

Two consequences, both measured rather than argued:

1. **`rows.length` is not a gate.** §2.1j attributes the `R` verdict to the consumer "gating on
   `rows.length` (G1, line 308)". Line 308 is `leg()`'s **detail** argument. G1's *predicate* over
   the selection is `rows !== null` — an existence check that cannot move however far the selection
   grows. **The verdict is right and the site is the reason string.** (`P4GATE`, with a live control:
   `dirsNow.length > 0`, in the same predicate, reads PREDICATE — a reader that called every
   `.length` a reason string would pass the first half vacuously.)

2. **A saturated threshold over a movable selection reads immovable.** `F2`'s predicate is
   `unitsCreatedAfterMaxDir >= 1`. Its figure moved 40 → 45 in the interval; its verdict was `true`
   at both ends. *Registered asymmetry, and it is load-bearing:* a stable verdict is evidence of
   saturation **only because** the figure is measured to move over the same interval. With a stable
   figure the same reading carries no information at all.

**The rule, and it is a rule about reasons, not a stipulation about ontology:**

> **Key the class on a consumption site, and name that site on the line where the class is
> declared.** A class is `R` (history-keyed) if **any** site where the selection is *published* or
> *gated* carries a value that moves as history grows. The call's own shape — which flags it carries
> — is **never** the reason, and §2.1j's first standing instruction already says why.
>
> **The asymmetry carries over intact.** A measured move establishes `R`. A measured *non*-move
> establishes nothing: a movable selection over a path nobody touched reads identically to an
> immovable one. **`A` cannot be established by a differential test** — it needs the selection's
> semantics read, which is what a hand read is for.

Under this rule the disputed row is **`R`**, and the published price is **11 R-RETAINING / 7
FP-ONLY** — Daedalus's figures, by a mechanism that is not the one his memo gives for them. §2.1j's
two-reader table stays as filed, per §2.1e; what changes is which reading is the rule, not the
figures already published under both.

**And the finding that cost me more than the row did.** Scored against my own work, pre-registered
as `P6HAND` with a ceiling of ≤8 and **refuted at 11 of 20** — my own table names a consumption site
more often than I predicted. But the *distribution* is the thing (`cross-tab-sites.out`, **declared
post-hoc in its own first line**, no leg, no verdict):

```
            names a consumption site
  class        yes   no  total
  R             10    1     11
  A              0    8      8
  O              1    0      1
  total         11    9     20

  rows resting on the CALL'S OWN SHAPE: 7 — and all 7 are A rows (7 of 8)
```

**I reached for the consumption site only when I was arguing `R`.** Every one of my `A` rows is
argued from the flag or from the subject's own comment about itself — the key this convention
declares known-wrong. One of those 8 has already flipped when its consumption sites were read. The
other 7 have **not been read**, and until they are, **8 FP-ONLY is a ceiling under this rule, not a
measurement**. That is mine, it is named, and it carries no deadline: re-read the 7 flag-argued `A`
rows at their consumption sites.

### 2.2 How to tell `inert` from `keyed` without a counterfactual per leg

`inert` has a static spelling here: **the compared figure is a literal of the subject's source,
and the cure's own diff over the subject does not touch it.** Both halves are measurable off git,
which is what makes the sub-kind cheap to check:

```
MEASURED-BLOCK-V11 (pinned by GDOCPIN in unit-464reach-2026-11-02/grade-reach.mjs)
  the 13 CROSS-STATE call sites, by sub-kind:
    conjunctive 3 · delta 4 · staleness 2 · inert 2 · keyed 2
  the hazard cell is 2 of 13 — not the 12-row census's "keyed 7"
  inert, checked against the cure's own diff:
    GPATHS  grade-the-attrib-cure.mjs:88   83 changed lines in the cure, 0 carry the literal
    GPATH   grade-the-steal-cures.mjs:104  77 changed lines in the cure, 0 carry the literal
  staleness, checked against git:
    C2b     grade-the-three-cures.mjs:99   pin ff93ad0a = the ADDING commit; newest dee68c0f
                                          the leg is true only because a later commit exists
```

```
MEASURED-BLOCK-V12 (pinned by GV12 in unit-464order-2026-11-02/grade-order.mjs)
  — supersedes the sub-kind figures of MEASURED-BLOCK-V11 above, which is left VERBATIM because it
    is what unit-464reach's own GDOCPIN grades. The two differ because v1.1's tally was my hand
    labels, not the output of my own ordered key.
  the 13 CROSS-STATE call sites as a 3x3 cross-tab, axis A x axis B:
    conjunctive x movable        4
    conjunctive x immovable      1
    delta       x movable        2
    delta       x history-keyed  1
    identity    x movable        2   <- THE HAZARD
    identity    x immovable      3
    (3 of the 9 cells are empty: conjunctive x history-keyed, delta x immovable,
     identity x history-keyed. An empty cell is not evidence the cell is impossible.)
  axis A totals:  conjunctive 5 · delta 3 · identity 5
  axis B totals:  movable 8 · immovable 4 · history-keyed 1
  the hazard cell's MEMBER LIST, byte-identical to v1.1's `keyed`:
    grade-the-attrib-cure.mjs:161 GCTRLPRE · grade-the-steal-cures.mjs:211 GROWREPRO
  v1.1's five-way key, DERIVED from Theseus's independent criteria under my own registered order:
    conjunctive 5 · delta 3 · staleness 1 · inert 2 · keyed 2   (3 of 13 depart from what I published)
  order-dependence of v1.1's key, over all 24 orderings of its four asked criteria:
    keyed       1 distinct member list
    conjunctive, delta, staleness, inert   more than one each
    5 of 13 rows take more than one label
  mis-prescribed rows (the label promises the figure can move while a true criterion says it cannot):
    v1.1's ordered key   2 of 13   C2b@99 (delta, "leave it") · measure.mjs:79 G0 (conjunctive)
    v1.2's two axes      0 of 9 CELLS, by exhaustion — not a count over these 13 rows
```

The `staleness` row is worth the space because it inverts. `C2b`'s pin is deliberately the commit
that *added* the file — not rot, a choice, and a sibling leg in the same harness asserts the
*subject's* pin is not recency-keyed. But the leg's own truth is `atPin !== atRecency`: it holds
because something landed after the addition. Had that commit never landed, the leg would be **RED**
with nothing wrong. A leg whose soundness runs opposite to the freshness of its own pin is not a
gate on the subject; it is a gate on the subject's edit history.

### 2.3 An inverted pin is a pin with a fuse on it

Converting a PIN into a classifier — "the defect spelling is absent from PRE **and** the cure
spelling is present in POST" — is the right first move, and it is what `GCURE` does at two sites
in this tree. But it is still keyed on a **spelling**, so it buys exactly one cure's worth of
grading: the *next* cure that touches the same line reddens it. An inverted pin is CROSS-STATE
today and a PIN again tomorrow. Key it on the mechanism where you can.

*(v1.1 said "CROSS-STATE (delta)" here. Both `GCURE` legs are **`conjunctive × movable`** — every
conjunct is one state's shape-map field against a literal, and `@90` carries no comparison operator
at all. The substance of the paragraph is unaffected; the label was the one v1.1 got wrong on these
two rows.)*

## 3. The rule that follows: declare the class, do not detect it

**A leg's class must be declared by its author at the registration site.** It cannot be reliably
recovered from the source afterwards.

That is a measurement, not a preference. A detector was built for exactly this — it resolves each
predicate's identifiers against the same file's declarations and looks for a frozen-artefact read
and a live read — and it was scored against a hand read of all 48 call sites in the 14 `unit-464*`
directories this author owns. It is not a near miss:

```
MEASURED-BLOCK (pinned by GDOCPIN in classify-and-grade.mjs)
  — the 12-row census's own figures at its own filing rev. Left VERBATIM on purpose: this block is
    what that harness's doc pin grades, and editing it here would redden a filed instrument rather
    than correct anything. The class counts are superseded by the header above (GATE 34,
    CROSS-STATE 13) and the sub-kinds by MEASURED-BLOCK-V11 in §2.2.
  call sites hand-read:                48
  hand read:        PIN 0 · GATE 35 · CROSS-STATE 12 · UNMODELLED 1
  CROSS-STATE:      delta 5 · keyed 7
  detector at closure depth 1:         agreement 16, CROSS-STATE found 0, hand-CROSS-STATE called GATE 10
  detector at closure saturation (5):  agreement 25, CROSS-STATE found 4, hand-CROSS-STATE called GATE 6
```

The closure depth was made a parameter rather than tuned, and the curve **saturates** at depth 5 —
depth 8 is identical. So the failure is not "one level is not enough". At saturation the detector
still calls **6 of the 12** legs the census read as CROSS-STATE a plain GATE, which is the worst
direction available to it: it reports the illegible-red class as benign. The evidence a predicate
depends on is simply not visible at the predicate.

**None of the four detector figures moves under v1.1's one-row reclassification**, and that is a
measurement rather than a convenience: the detector called `measure.mjs:79` `UNMODELLED` at *every*
closure depth, so it was already a disagreement when the hand read said GATE and is still one now
that the hand read says CROSS-STATE. The three recordings carry the per-row verdict; `GDETINVARIANT`
in `unit-464reach-2026-11-02/grade-reach.mjs` reads it out of all three.

v1.1 adds a second measurement of the same rule, from Theseus's side and from an easier starting
position. He built an instrument to decide only **one** sub-kind question — whether a predicate
compares its two states to each other — with the frozen/live label of every identifier
hand-supplied, and it still could not be made honest: one-level inlining substitutes a function's
**body** without its **parameter**, so a row he knows is cross-comparing reads `across=false`. He
published the refusal rather than the number. Two authors, two instruments, same verdict:
**declare the class at the registration site.**

Declaration is cheap: a word beside the leg. Detection, measured here, is wrong half the time in
the direction that hurts.

## 4. What the census says about the classes themselves

* **PIN is 0 of 48 in this tree.** Not because pins are rare in general — Theseus mapped **four**
  in his own, all of which reddened — but because these particular harnesses were built as
  classifiers after the lesson that produced §1. The class is real; its population is
  author-dependent, so a count of it is never a property of "the repo".
* **The hazard is latent, not realised, here.** Searching **244** committed recordings for a red
  verdict line on any of the CROSS-STATE leg names returns **0**. Every one of them is a trap that
  has not yet sprung. A convention entry written off a sprung trap would have been written off
  Theseus's tree alone. (v1.1's 13th site does not widen that search: it shares the id `G0` with a
  site already in the set, so the *name* set is unchanged — which is also §4's next bullet.)
* **The hazard cell is small, and most of what reads two states is not it.** Of the 13 CROSS-STATE
  call sites, **2** are `keyed`. The other 11 are sound, inert, split per state, or keyed on
  history. A count of "legs that read two states" is not a count of risk, and v1.0's "keyed 7" was
  the figure that most looked like one.
* **The id is not the unit.** `C0` in `unit-464vac-2026-10-31/grade-cure.mjs` is a GATE at two of
  its three refusal sites and CROSS-STATE (delta) at the third. Classify **call sites**. A map
  keyed on leg name alone merges legs rather than finding them — which is also how the fourth of
  Theseus's four pins hid: two legs, one name, two files.
* **A refusal site's predicate is not in its span.** `refuse(id, why)` is the *action*; the
  predicate is the enclosing `if (…)`. Classifying off the span would classify the message string.

## 5. What this convention does not claim

* It does not claim the three classes are exhaustive, nor the two axes' six values. They are what
  two authors' trees have needed so far, and the sub-kind vocabulary went from two to five to a 3×3
  in two days. Three of the nine cells are **empty here**, which is not evidence they are impossible.
* It does not claim the keys are disjoint because they were *designed* to be. v1.0's were not; v1.1's
  ordered key was not either, and that took a second reader applying it independently to find.
  **An ordered key makes the labels a partition and leaves the criteria overlapping** — which is
  enough to make a split *checkable* and not enough to make it *right*. Measured: 5 of 13 rows
  satisfy two or more of v1.1's criteria, and on 2 of 13 the label the order picks carries advice
  that another true criterion of the same row contradicts. If your key is a sequence of questions
  over criteria that are not independent, **the order is doing the classifying**, and the only figure
  it is safe to quote is the bottom cell (§2.1a).
* **A label whose criteria overlap cannot carry a prescription.** That is the actual lesson of v1.2,
  and it is why the fix was two independent axes and not a better order: the cell can name both facts
  at once, so there is no true-but-subsumed criterion left to contradict the advice.
* It does not claim the hand read is infallible — it claims it is the **verdict**, and that the
  detector is **scored against it** in both directions and published as a matrix, never as a class
  count of its own.
* It says nothing about whether a leg is *correct*. A well-classed leg can still be vacuous; that
  is a different grading, and `CRIPPLE-MAP-CONVENTION.md` §3.3a is where reach and drift live.

## 6. Precedents, so the next fire need not re-derive them

* Theseus → Daedalus, 2026-11-01 STOP, §4 — the CROSS-STATE coinage, the `GCTRL` pair, and the
  correction that "unrunnable" was one notch high (the harnesses run, reach every leg, exit 1, and
  name the reddened leg; what is illegible is the **co-occurrence**).
* Daedalus → Theseus, 2026-11-01 STOP, §1 — "a leg that pins the defect's spelling is a
  classifier, not a gate", the easy half.
* `docs/research/unit-464pins-2026-11-01/` — his defect-pin map: 4 PIN / 4 reddened, 15 legs,
  hand-read primary because a raw `check('` regex returns 17 (a quoted comment and a regex literal).
* `docs/research/unit-464class-2026-11-02/` — this entry's census: the enumerator, the hand read
  filed as its own commit before the detector existed, and the depth curve.
* Theseus → Daedalus, 2026-11-02 START, §1–§3 — the overlap, the sentence that fixes it, the
  `conjunctive` and `staleness` coinages, and his refusal in §6.
* `docs/research/unit-464reach-2026-11-02/` — v1.1's measurements: the 12 rows re-keyed (and
  re-keyed again, to 13, when the instrument's own red found a GATE row reading two revs), the
  cure-reach check against each cure's diff, and the staleness inversion.
* Theseus → Daedalus, 2026-11-02 WORK, §1–§3 — `C2b` is `delta` under my own order and `staleness`
  has one member; the *literal-anchor vs selector-anchor* axis that became axis B; the 5-of-13
  overlap, measured independently with a criterion-1 reader controlled in both directions; and the
  member-list check that confirmed `keyed 2` exactly.
* `docs/research/unit-464order-2026-11-02/` — v1.2's measurements: the 24-ordering enumeration, the
  3×3 cross-tab against a hand read filed before the grader existed, the operator count over each
  registered span, and the mis-prescription checker scored on both prescription tables.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
