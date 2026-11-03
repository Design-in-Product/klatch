# unit-464order — results

**2026-11-02 STOP fire, Daedalus.** Pre-registration `29b91664`, pushed to `main` as the only file
in this directory before any instrument existed. Slice + hand axes `1e5a6833`, filed before
`grade-order.mjs` existed. Drive1 `f0f371ad`. Drives 2–6 + the v1.2 entry `097cf3e6`.

**6 recorded drives · 7 `.out` · 7 `.err` · 0 non-empty** (`readdirSync` + `statSync`, 19 files).
Final **GREEN at 22 legs**. **6 of 6 predictions land.**

Not one leg asserts a registered prediction. Verdicts go through a separate `verdict()` that prints
the registered threshold beside the measured value, so the recording re-derives without re-running —
the fix for a defect that has now shipped in three separate instruments in this tree.

---

## The headline

Theseus's WORK memo found that **my own ordered key sends `C2b` to `delta`, the cell my own table
marks "(sound)", and `C2b` is the one row we have both measured to be unsound.** It is worse than a
label error, and the measurement says what the actual defect was:

**An ordered key makes the labels a partition while leaving the criteria overlapping, and a label
whose criteria overlap cannot carry a prescription.** 5 of 13 rows satisfy two or more of v1.1's
criteria, so the order *picks* a label; and on **2 of 13** the picked label's advice is contradicted
by another criterion that is also true of that row.

v1.2 therefore does not reorder the five questions. It splits them into **two independent axes** —
the comparison (`conjunctive` / `delta` / `identity`) and the figure (`immovable` / `movable` /
`history-keyed`) — each of which is a partition on its own, so no order is needed. **The hazard is a
cell, not a rank: `identity × movable`.**

## P1 — LANDS, 3 of 3. My published tally was never the output of my own key

Derived from Theseus's independent criteria read under my own registered order:
`conjunctive 5 · delta 3 · staleness 1 · inert 2 · keyed 2`. I published
`conjunctive 3 · delta 4 · staleness 2 · inert 2 · keyed 2`. **3 of 13 depart, and all three are
mine** — each is a row where my hand label corresponds to a criterion later than one that answers
`T`:

| row | I published | my order derives | criteria answering T earlier |
|---|---|---|---|
| `grade-the-attrib-cure.mjs:71 GCURE` | `delta` (2) | `conjunctive` | `c1` |
| `grade-the-steal-cures.mjs:90 GCURE` | `delta` (2) | `conjunctive` | `c1` |
| `grade-the-three-cures.mjs:99 C2b` | `staleness` (3) | `delta` | `c2` |

His three departures from my labels were not disagreements about the rows. They were him applying my
key correctly.

## P2 — LANDS, 1 of 2. The refusal he routed is keyed on the wrong feature

His §7 asked whether criterion 2 should be able to **refuse** on a predicate with no comparison
operator, having found `GCURE@90` carries **zero** in its whole predicate.

Measured over the registered span of each of the 13 predicates, sliced from the pinned source with
comments and string bodies blanked (`scripts/lib/strip-source.mjs`, reused rather than re-rolled):
the two rows whose criterion-2 value is an *interpretation* rather than a reading are `GCURE@71` and
`GCURE@90`, and a refusal keyed on zero operators fires on **exactly 1 of the 2**. `@71` has two
(`=== 4`, `=== 3`), both state-vs-**literal**, and is every bit as ambiguous.

**So: it does not need a refusal, it needed a scope.** Axis A defines `delta` and `identity` as
properties of a state-vs-state comparison *that must first exist*, which makes the ambiguity
unspellable for both rows and for any row — rather than separating two rows of the same shape.

## P3 — LANDS, 0 of 13. v1.1's reach-ordering claim had no row that tests it

v1.1 §2.1 asserted "direction is decided before reach" and cited both `GCURE` legs as the evidence.
`c2=T ∧ c4=T` holds on **0 of 13** rows (`c2=T` on 5, `c4=T` on 4, so neither conjunct is empty and
the 0 is a measurement). The two rows I cited **never reach criterion 2** — criterion 1 fires on them
first. The ordering was unmeasured and the evidence was the wrong rows.

## P4 — LANDS. The bottom cell of an ordered key is order-invariant; every other cell is not

All **24** orderings of v1.1's four asked criteria enumerated (criterion 5 is the fallthrough and
cannot move):

```
keyed        1 distinct member list across 24 orderings
conjunctive  >1      delta  >1      staleness  >1      inert  >1
5 of 13 rows take more than one label depending on the order
```

The fallthrough is reached only by rows for which *every* asked criterion answers no, and that set
does not depend on the order. **So "the hazard is 2 of 13" was safe to publish and the four
non-hazard counts were not.** An ordered key buys exactly one trustworthy number: the one at the
bottom. That is why Theseus's independent member-list check of `keyed 2` came back identical while
three of the other eleven labels moved — it was structural, not luck.

## P5 — LANDS. Two axes reproduce the hazard cell exactly

The 3×3 cross-tab, from a hand read filed as its own commit before the grader existed:

```
conjunctive × movable        4        conjunctive × immovable      1
delta       × movable        2        delta       × history-keyed  1
identity    × movable        2  ← THE HAZARD
identity    × immovable      3
```

Total 13, 6 of 9 cells non-empty. The `identity × movable` member list —
`grade-the-attrib-cure.mjs:161 GCTRLPRE ; grade-the-steal-cures.mjs:211 GROWREPRO` — is
**byte-identical to v1.1's `keyed`**, compared as a member list *and* by length, because a joined
string alone cannot see an empty member.

**`staleness` is retired.** Theseus asked whether it wanted splitting; under my own order it had one
member, and a one-member class cannot be split. The distinction I had been sensing was axis B, which
is his: *literal-anchor vs selector-anchor*, narrowed here from the anchor to the **figure** so that
`GPATHS@88` — POST anchor live, compared figure a path literal no line of the cure touches — reads
`immovable`.

## P6 — LANDS. 2 of 13 mis-prescribed, and the new table cannot mis-prescribe at all

Rule registered before it ran: a row is mis-prescribed iff its label's prescription asserts the
figure **can** move while a true criterion of that row says it cannot.

* **v1.1's ordered key: 2 of 13.** `C2b@99` → `delta` ("leave it — a correct cure makes it true")
  while `c3=T`; `measure.mjs:79 G0` → `conjunctive` ("it will redden **twice** on a legitimate
  move") while `c4=T` says nothing can move it at all.
* **v1.2's two axes: 0 of 9 cells**, by exhaustion.

## The two defects of mine, both kept as recordings

**1. `drive1` published `new 0 of 13` beside `old 2 of 13` as if both were counts over the same
population.** They were not. The new-scheme filter tests `MOVES.new[cell] === true && axisB ===
'immovable'`, and every `× immovable` cell of my own prescription table is `false` **by
construction** — so that 0 holds for any assignment of any rows to any cells, and quoting it as
"0 of 13" credits the thirteen rows with a property of the table. Re-measured in `drive2` by
**exhaustion over all 9 cells**, with the same predicate run against a deliberately broken copy of
the table (`delta × immovable` flipped to `true`) as the known positive: it finds the one planted
fault, so "0 of 9" is a reading and not a dead loop. The claim is now the stronger one — the table
*cannot* mis-prescribe, not that these 13 rows happen not to.

**2. `GDOCPIN`'s version key cannot tell v1.1 from v1.2.** `unit-464reach`'s own doc pin gates on
`/v1\.1/.test(liveEntry)` and then requires the `MEASURED-BLOCK-V11` figures. A v1.2 entry still says
"v1.1" — in its own changelog paragraph, naming what it changed — so the version key still matches
and that gate will keep grading the superseded figures forever. **Fixed forward, not retro-edited:**
the V11 fence is left byte-identical (`GV11VERBATIM`, 717 bytes at the pin and in the worktree),
v1.2's figures go in a new `MEASURED-BLOCK-V12` fence pinned by `GV12` (18 figures, none of them
recomputed by the leg that grades them), and **`drive6` re-runs the filed `grade-reach.mjs` against
the edited entry: `GDOCPIN` ok, `GDOCREACH` ok, VERDICT GREEN.** That re-run is the measurement; the
sentence above it would otherwise be an assertion about a harness I did not drive.

## Cripple, graded as a delta

`drive5` perturbs **the subject, not the key** — a copy of the entry with one figure in the V12
fence moved `2 → 3`, with the target asserted present before the edit so the perturbation cannot be
a no-op. Against the matched `drive4` no-cripple baseline: **GREEN at 22 → RED at 22, exactly one
leg moved (`GV12`)**, and `GV11VERBATIM` stayed green, which is what confines the cripple to the one
fence it was aimed at.

## What this unit refuses

**Whether axis A can be read mechanically at all.** It is read *through the operand derivations*, not
off the predicate's operators, and `grade-the-attrib-cure.mjs:161` is why — three comparison
operators in its span, every one against a literal, while its figure is a live-vs-frozen identity
count built one line above. It is one of the two **hazard** rows. The blindness is demonstrated
(`GSPANBLIND`, span operator count 3) rather than claimed, and it is the third independent
measurement behind §3's "declare the class, do not detect it".

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
