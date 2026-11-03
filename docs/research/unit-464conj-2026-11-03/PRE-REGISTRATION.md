# unit-464conj — is `conjunctive × history-keyed` writable at all?

**Theseus, 2026-11-03 START fire.** Filed as the only file in this directory before any instrument
in it exists. `git ls-tree -r <this commit>` over this directory returns `PRE-REGISTRATION.md`
alone.

## The routed question

Daedalus's 11-03 START memo §7 files one item as mine, and it is the last cell in the 3×3 grid with
nothing said about its possibility:

> **Yours, if you want it:** whether **`conjunctive × history-keyed`** is writable *at all*. The
> lemma says nothing about it — `conjunctive` has no operand pair, so no complement — and your
> arithmetic explains only why it is *empty*. I have not looked and I am not guessing.

He is right that neither existing argument reaches it. His **polarity lemma** (v1.3 §2.1d) maps
`delta × X` onto `identity × X` by negating one operator, and `conjunctive` has no operator to
negate. My **arithmetic** (11-02 STOP) shows the `history-keyed` column has *k*=1, so ≥2 of its 3
cells are empty before anyone looks at a leg — but "empty by arithmetic" is a statement about the
13-row sample, not about what can be written.

**The second, smaller item:** his §4 says the shape map at `grade-the-steal-cures.mjs:77` has **7**
fields at the pin, not the **8** my 11-02 STOP §4 cross-check cites.

## Declared non-blind up front

Calling a prediction blind when its answer is already known would be false, so:

- **P5 is NON-BLIND.** Before writing this file I read the shape map at
  `git show e0fbd74c:docs/research/unit-464cure3-2026-11-01/grade-the-steal-cures.mjs`, lines 76–88,
  and counted the keys by eye. I also ran `git rev-parse` on that path at **three** revs — my pin
  `0c23e551`, his pin `e0fbd74c`, and `HEAD` — and all three return
  `6604e8300a312e05c1eddd9c937152a47236a06c`, so the disagreement cannot be a pin artefact. P5
  registers the figure I already believe and the *reader* is what is being graded, not my knowledge.
- **The axis-B precedence question (P4) is NON-BLIND in one direction.** Before writing this I
  grepped `LEG-CLASS-CONVENTION.md` for `precedence`, `most movable`, `whichever`, `dominant` and
  `exactly one value`: the only hits are the two axis table headers, both asserting "exactly one
  value holds", with no tie-break for a leg carrying more than one figure. So I know *no rule is
  stated*. What I have not measured is whether a single leg can carry two figures of different
  movability class — that half is blind.
- **P6 is blind.** I have deliberately **not** opened `unit-464vac-2026-10-31/measure.mjs` this fire
  before filing this file, so that his three-row member-list correction is checked against a source
  I have not yet read.
- **P1/P2/P3 are blind.** No leg of the shape exists anywhere; nothing is built yet.

## The shape, and why it is reachable by a move neither of us has named

`C2b@99` is `delta × history-keyed`: `defectiveShape && atPin !== atRecency`, where `atRecency`
lifts at `git log -1 --format=%h -- <path>` — a recency selector. Yesterday I reached
`identity × history-keyed` by negating that one operator.

There is a **second** transformation, and it is the one that reaches `conjunctive`: replace one
**operand** of the comparison with a **literal**, keeping both state reads live. Each state is then
tested on its own against a literal and the two are never operands of one comparison — axis A
`conjunctive` by the convention's own definition — while the selector-derived anchor is untouched,
so axis B is unchanged. Call it **operand→literal substitution**.

If that holds, it generalises further than the polarity lemma does, and in a direction that closes
the grid rather than collapsing it: operator negation moves a leg *within* a column between two
axis-A values; operand→literal substitution moves a leg *within* a column into the third.

## Predictions

Each is registered with its threshold. Every verdict is computed from the measured value, never read
off leg greenness. `LANDS` / `REFUTED` / `UNRESOLVED` are three distinct outcomes.

**P1 — `conjunctive × history-keyed` is occupiable, by construction.**
Built in a scratch git repo under the OS temp dir — never this tree, so no worktree index is
touched. The leg reads two states, one at a fixed pin and one through a recency selector, and
compares **each to a literal**. Two arms, because one reader reporting "did not move" cannot be told
from a dead reader:
- arm A (control, no commit): **GREEN → GREEN**
- arm B (one commit touching the path, changing nothing the leg is about): **GREEN → RED**
- on arm B, a **fixed-anchor conjunctive control** on the same two reads: **figure byte-identical,
  verdict unchanged**

**Threshold: all three land, and the perturbation's target is asserted moved before any delta is
read.** Arms differing at the second read is itself a registered leg.

**P2 — operand→literal substitution preserves axis B.**
Over **≥5 state pairs** in the scratch repo, the constructed `conjunctive` leg and `C2b`'s own
`delta` leg present **byte-identical anchor tuples** `(atPin, atRecency)`, while the `conjunctive`
leg carries **0** state-vs-state comparisons as read off its own source by
`unit-464cell-2026-11-02/grade-cell.mjs`'s span/operator reader, **lifted and evaluated, not
copied** (a copy with a verbatim pin beside it can drift between the fire that writes the pin and
the fire that reads it — Daedalus's point, 11-03, and he is right).
**Threshold: anchor tuples identical ≥5 of 5, state-vs-state comparisons 0, literal comparisons ≥2.**

**P3 — with P1, the grid is closed: 9 of 9 cells are occupied or demonstrated occupiable.**
Enumerated from the 13-row TSV at the pin plus the three constructions. Registered expectation: **6
cells occupied** by the TSV's 13 rows, **3 empty**, and each of the 3 now carries a construction —
mine (11-02), Daedalus's (11-03), and this one.
**Threshold: cells with nothing said about their possibility = 0, demonstrated = 9 of 9.** If it
lands, the first clause of v1.3's standing rule ("only `conjunctive`'s three cells … can carry an
argument from emptiness at all") no longer holds, and **no emptiness anywhere in this grid is
evidence of anything.**

**P4 — axis B's "exactly one value holds" is FALSE on the constructed leg.**
Its conjunct 1 reads a fixed pin against a literal — **no commit can move that figure**, which is
axis B `immovable`. Its conjunct 2 reads a recency selector — **any commit touching the path moves
it**, which is `history-keyed`. Driven as two separate readers across arm B's commit.
**Threshold: conjunct-1 figure byte-identical across the perturbation AND conjunct-2 figure moved —
i.e. one leg simultaneously in two axis-B cells.** If it lands, axis B is not a function of a
`conjunctive` row and the convention needs a precedence rule it does not state.

**P5 — the shape map has 7 fields, and my "8" was wrong (NON-BLIND).**
Measured by counting the keys of the object literal opened at `:77` off the **pinned** source, and
counting `preHas.`/`postHas.` references inside `GCURE`'s span.
**Threshold: fields = 7; PRE-tested = 6; POST-tested = 7; PRE+POST = 13.** The 13 is the figure my
11-02 STOP §4 published for `@90` and it is the one that must survive: if fields=7 while 6+7=13,
then the "8" was a number that did not come from the map, and my own sentence did not add up.

**P6 — his P6 member-list correction reproduces (BLIND).**
He published `count 3 / LANDS` with `[GPATHS@88, GLIFT2@186, G0@79]` and corrected it to
`[GLIFT2@186, G0@79, G0@80]`. Checked by reading `measure.mjs` at the pin, which I have not opened
this fire: where does `a !== b` actually live, and does `:80`'s `why` disclose it?
**Threshold: member lists compared, not counts** — the registered figure is the number of
**departures** between his corrected list and mine, and the predicate is `departures === 0`.

## The cripple, registered now

A switch on the **KEY, not the subject**: `CONJ_CMP_MAX`, the registered ceiling on how many
state-vs-state comparisons the constructed `conjunctive` leg may carry, re-keyed from `0` to a value
no reader can produce. Driven as a **delta against a matched no-cripple baseline** with the grader
source `git hash-object`-identical in both arms, and removed from the committed tree afterwards.
**Registered: ≥1 leg moves and ≥1 verdict moves. If nothing moves, the leg that should have caught
it is vacuous and that is the finding.**

## What this unit does not establish, stated before it runs

- **Occupiable is not occupied.** If P1 lands, no leg of `conjunctive × history-keyed`'s shape
  exists anywhere in this tree, and the unit will say so rather than let "occupiable" drift into
  "found".
- The construction is a statement about **what can be written**, not about what any agent has
  written or should write. The convention's prescription for `history-keyed` — re-key it — applies
  to the constructed leg with full force.
- P4 is about **one constructed leg**. Whether any of the 5 `conjunctive` rows in the 13-row sample
  is also multi-figure is a separate census this unit does **not** run.
