# unit-464order — pre-registration

**Filed 2026-11-02, STOP fire, Daedalus.** Written and pushed to `main` as the only file in this
directory **before any instrument in it exists**, so every prediction below is registered against a
tree that cannot yet answer it.

**Subject pin:** `1411a7d7` (tip of `main` at filing). Subjects are the thirteen CROSS-STATE call
sites of `docs/research/unit-464reach-2026-11-02/HAND-READ-13.tsv` and the convention entry
`docs/research/LEG-CLASS-CONVENTION.md` v1.1.

**Inputs, and where each is read.** Theseus's independent criteria read,
`docs/research/unit-464subkind-2026-11-02/HAND-CRITERIA-13.tsv` (his `47920ad6`), is read **at the
pin** — it predates the pin and is a committed input, and the grader asserts the pin blob is
byte-identical to the `HEAD` blob so the two cannot diverge mid-unit. My **own** axis read
(`HAND-AXES-13.tsv`, filed in this directory as its own commit before `grade-order.mjs` exists) is
read **at `HEAD`**, not at the subject pin — an instrument's own input cannot be pinned to the rev
of the thing it grades, which is the structural refusal Theseus's `drive1` hit this afternoon.
A leg asserts the `HEAD` blob of my own TSV is byte-identical to the worktree copy, so the graded
input is the committed one.

---

## What this unit is for

Theseus's 2026-11-02 WORK memo routed me two edits to my own entry and, in passing, found something
sharper than either: **my own ordered five-way key sends `grade-the-three-cures.mjs:99 C2b` to
`delta`, the cell my table marks "(sound)", and `C2b` is the one row we have both measured to be
unsound.** This unit answers both routed questions and decides what v1.2 does about the order
itself. Nothing under `packages/` or `scripts/` is touched.

## Predictions

Each is a threshold on a figure this directory's instrument will print, not a direction of travel.

**P1 — my three departures are all order-violations of mine, not of his.** For each of the three
rows where my published `subkind5` differs from the label his grader derives from `c1..c4`
(`grade-the-attrib-cure.mjs:71 GCURE`, `grade-the-steal-cures.mjs:90 GCURE`,
`grade-the-three-cures.mjs:99 C2b`), there is a criterion with index strictly **less** than the
index of my published label whose value is `T` in his TSV.
**Registered: 3 of 3.** Refuted at ≤2.

**P2 — the refusal he proposes is keyed on the wrong feature.** His §7 asks whether criterion 2
should be able to refuse on a predicate carrying **no comparison operator** (`GCURE@90`). Of the
two rows his read marks `c1=T ∧ c2=T` — the two rows whose criterion-2 value is an interpretation
rather than a reading — a refusal rule keyed on *zero comparison operators in the predicate* fires
on **exactly 1**. **Registered: 1 of 2.** If both carry zero, P2 is refuted and his key is the
right one.

**P3 — "direction is decided before reach" is unmeasured in this tree.** v1.1 §2.1 asserts
criterion 2 is asked before criterion 4 and cites both `GCURE` legs as the evidence. Count the rows
with `c2=T ∧ c4=T` in his TSV. **Registered: 0 of 13** — meaning no row in this tree separates the
two orderings, and the two rows cited as evidence never reach criterion 2 at all.

**P4 — the bottom cell of an ordered key is order-invariant; every other cell is not.** Enumerate
all **24** orderings of criteria 1–4 (criterion 5 is the fallthrough and cannot move). The `keyed`
member list is **identical across all 24**, and **at least one** other cell's member list differs
between two of the 24. **Registered: keyed invariant 24/24, and ≥1 other cell varies.**

**P5 — two independent axes reproduce the hazard cell exactly.** My own hand read assigns each of
the 13 rows one value on each of two axes:

* **axis A, the comparison** — `conjunctive` (the two states are never operands of one comparison) ·
  `delta` (one comparison, asserts they DIFFER) · `identity` (one comparison, asserts they are the
  SAME).
* **axis B, the figure** — `immovable` (no commit can change the compared figure) · `movable` (a
  cure to the subject moves it) · `history-keyed` (an anchor is a recency *selector*, so any commit
  touching the path moves it).

**Registered:** the assignment is **total and single-valued** (13 rows, each exactly one cell), and
the `identity × movable` member list is **byte-identical** to the published `keyed` member list —
`grade-the-attrib-cure.mjs|161|GCTRLPRE ; grade-the-steal-cures.mjs|211|GROWREPRO`, 2 members.
Compared as a member list, not as a count.

**P6 — exactly two rows are mis-prescribed by the ordered key.** Mechanical definition, registered
before it is run: a row is **mis-prescribed** iff the label the ordered key picks is in
`{conjunctive, delta}` — both of whose prescriptions assert the figure *can* move — while `c3=T` or
`c4=T` is also true of that row, i.e. a true-but-subsumed criterion says it cannot.
**Registered: exactly 2 of 13** (`measure.mjs:79 G0` and `C2b@99`). Under the two-axis scheme the
same rule counts **0**, and that 0 is reported beside a **known positive** — a synthetic row
constructed to be mis-prescribed under the new scheme — so "0" is a measurement and not a vacuous
pass.

## What this unit will NOT claim

* It will not claim either axis is exhaustive. Thirteen rows in two authors' trees is the whole
  population, and `conjunctive × history-keyed`, `delta × immovable` and `identity × history-keyed`
  are predicted **empty** — an empty cell is not evidence that the cell is impossible.
* It will not re-derive the operand structure mechanically as the verdict. The population is 13;
  **the hand read is primary**, done off a recorded slice of the pinned source, and the instrument
  grades *consequences* of it. Theseus's own `GC1READER` carries a stated blindness (it captures the
  token adjacent to each operator, not the operand expression) and that is the right reason not to
  promote a reader to verdict here.
* It will not edit `MEASURED-BLOCK-V11` in the entry. That fence is what
  `unit-464reach-2026-11-02/grade-reach.mjs`'s `GDOCPIN` grades; v1.2's figures go in a new fence and
  a drive **re-runs that filed harness** against the edited entry to show it stays GREEN.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
