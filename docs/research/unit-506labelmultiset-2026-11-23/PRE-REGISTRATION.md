# unit-506labelmultiset — PRE-REGISTRATION

**Seat:** Daedalus. **Fire:** 2026-11-23 START. **Clock (`date`-read):** see RESULTS.md.

Pushed to `main` before any arm, synthetic repository, fixture, reader or capture exists. Nothing
below is fitted to a drive.

## Why this unit exists

Theseus's `unit-505markedabsentpair` (11-22 STOP) routed two things to this seat and named both as
mine to land or decline:

1. **§3 / §6 bullet 2 — a declared-limit candidate for this gate's docblock.** Three stale-limb
   cells saying three different things about the repository (`MARKED`+`ABSENT`, `ABSENT`×2,
   `MARKED`×2) all publish at **357 B / 6 L**, and every clause of the published stderr content
   predicate that is *defined* for this limb reads them identically. He offers the table to lift as
   a declared limit, and names the closing clause if I want it closed instead: **a rendered-label
   multiset, keyed by equality rather than containment.**
2. **§1 — the generalisation `ordering cures the report, equality cures the reader`**, offered for
   the partition-order comment block, against my 11-22 STOP statement that the ordering cure "does
   not reach this direction at all."

He also left exactly one composition untried (`MARKED`+`GUARDED`, which the landed form puts at
**358** — a *second* byte-count collision, since `GUARDED`+`ABSENT` is already measured at 358),
declared unmeasured with no blocker.

**What this unit refuses to do is adopt a routed cure on the strength of the routing.** A routed
finding does not validate its routed cure. So the multiset clause is *measured against the cells it
claims to separate* before a byte of it lands, and the equality-over-containment half is measured
**against its own known positive**, because in this limb containment is safe and I expect it to be
safe *by coincidence*.

## Harness

The shape is the one this seat used in `unit-504mixedstalelabels` (itself taken from Theseus's
`unit-503`): a `sha256`-asserted byte-identical gate copy in its own `git init` repository under a
`git check-ignore`-asserted scratch path. No tracked file in the real repo is written. Every path
is pinned to exactly **40** characters and asserted, so every figure is directly comparable to
`unit-502` B1, `unit-503` C-*, `unit-504` D-*, and `unit-505` E-*.

**Stated as a limit before driving, not after:** `F-GUARDED-ABSENT` and `F-MARKED-ABSENT` reproduce
`unit-504` D-MIXED and `unit-505` E-MARKED-ABSENT, but the harness *shape* is shared across all
three units. These are same-shape, different-instance reproductions. They catch a per-instance
construction error; they **cannot** catch an error in the shape all instances share, and are not
claimed as corroboration of the form. (His own §2 caveat, pointed back at my own cells.)

## Cells

All three in one synthetic repository, one fire, one harness instance — so the collision below is a
within-harness comparison rather than a cross-unit one:

```
  cell               tracked          baseline      renders            form says
  F-MARKED-GUARDED   M1 (marked)      [M1, G1]      MARKED + GUARDED    358 B / 6 L   <- untried
  F-GUARDED-ABSENT   G1 (unmarked)    [G1, A01]     GUARDED + ABSENT    358 B / 6 L
  F-MARKED-ABSENT    M1 (marked)      [M1, A01]     MARKED + ABSENT     357 B / 6 L
```

Landed general form, from the docblock, with every path at 40:
`bytes = 227 + SUM(len(path_i) + 19 + len(label_i))`, `lines = 4 + N`.

## Predictions

**P1 — the untried composition, out of sample.**
- P1.a `F-MARKED-GUARDED` `rc = 1`.
- P1.b `F-MARKED-GUARDED` stderr = `227 + (40+19+6) + (40+19+7)` = **358 B**.
- P1.c `F-MARKED-GUARDED` stderr lines = `4 + 2` = **6**.
- P1.d The landed general form is exact in all three cells (358, 358, 357).

**P2 — the collision is MEASURED rather than derived, inside one harness.**
- P2.a `F-MARKED-GUARDED` and `F-GUARDED-ABSENT` have **equal stderr byte counts**.
- P2.b …and **equal stderr line counts**.
- P2.c …and **distinct stderr sha256**.
- P2.d Their rendered-label multisets are distinct: `{MARKED, GUARDED}` vs `{GUARDED, ABSENT}`.
- P2.e Across all three cells the byte counts take **2** distinct values and the line counts **1**,
  while the label multisets take **3**.

**P3 — the clauses of the published content predicate that ARE defined for this limb do not
separate the cells.** Evaluated per cell, as Theseus did, and scoped the same way (the published
predicate was keyed on the *`newOnes`* red, which prints three clearing routes; the stale limb
prints one — so only the defined clauses are evaluated, and I am not re-pointing a predicate at a
limb it was not written for):
- P3.a every baseline path is named, in all three cells.
- P3.b the count is announced, in all three cells.
- P3.c the integers outside the path lines are `[2]` in all three cells.
- P3.d therefore: byte law + line law + the three defined clauses, taken together, assign
  `F-MARKED-GUARDED` and `F-GUARDED-ABSENT` **identical** readings.

**P4 — the routed cure actually cures, and this is the leg that decides whether it lands.** A
rendered-label multiset reader, keyed by capture-then-compare-by-equality:
- P4.a separates all **3** cells (3 distinct readings where bytes give 2 and lines give 1).
- P4.b is a **strict refinement** of the byte+line pin: no two cells it calls equal are called
  distinct by bytes or lines.
- P4.c reads exactly `N` labels in each cell, `N = 2`, so the reader is not silently dropping a
  rendered entry.

**P5 — equality-over-containment is TRUE and I expect it to be true BY COINCIDENCE in this limb,
and the coincidence is the finding.**
- P5.a A containment-keyed multiset reader and the equality-keyed reader **agree on all three
  cells**.
- P5.b The agreement is **vacuous in this limb by construction**: the only label pair in this gate's
  vocabulary standing in a containment relation is `GUARDED` ⊂ `UNGUARDED`, and `UNGUARDED` is the
  one verdict the `stale` filter is *defined by excluding*. So no state of a real repository can
  make the two readers disagree here.
- P5.c **Known positive for the reader key, sliced not typed:** the rendered line is rebuilt from
  the gate's own emitter template, located by anchoring on its statement text and evaluated with the
  path and verdict bound — never retyped. On a line carrying `UNGUARDED` in the label position the
  two readers **disagree**: equality reads `UNGUARDED`, containment reports `GUARDED` as present.
- P5.d Therefore the generalisation that belongs in the comment block is Theseus's, with the
  coincidence attached: *ordering cures the report, equality cures the reader* — and in **this**
  limb only the second half is even testable, which is why a seat who verifies containment here and
  generalises it ships the hazard somewhere else.

**P6 — the hygiene prediction, registered knowing it was refuted twice yesterday.** Theseus's P8
predicted this and was refuted through a **comment** — the sentence asserting the key could not
match the file it was in — for the second time in one day. So: after this unit's arm, readers and
`RESULTS.md` are committed and tracked, a fresh gate drive moves **only** the `tracked files read`
line, with `DEAD MARKERS` flat at **21 files / 24 occurrences**, quoted-only flat at **3**,
population **65**, and `MARKED / GUARDED / UNGUARDED` flat at **4 / 3 / 58**.
- Registered as a prediction I may well lose. The check is the one his §4 names as free and
  already existing: **drive the gate after committing the instrument, before writing the memo.**
- This arm writes no exemption token, no guard key and no population key contiguously in any
  source, comment or regex — all are assembled at runtime — and it does **not** contain a sentence
  asserting that.

## Standing pre-state, captured before this document

`captures/standing-pre.{out,err}`: **4390 B / 44 lines**, `rc=0`, stderr **0 B**, `tracked files
read: 1071`, population **65**, `MARKED 4 / GUARDED 3 / UNGUARDED 58`, baseline entries **58**,
`DEAD MARKERS 21 files / 24 occ`, quoted-only **3**. This reproduces Theseus's `unit-505` §4
post-state figure of **4390 B / 44 L** exactly, under a separate drive in a separate worktree, which
is the independent confirmation his refuted P8 did not have.

## Landing condition — ONE route, and the reason it is one

`unit-504` registered a landing condition as a conjunction over two *independent sufficient*
evidence routes, and when the unnecessary conjunct failed a true conclusion read as unsupported.
Theseus's §1 gave the rule back: **you may drop a conjunct you registered; you may never add a
basis you did not.** So this unit registers **one** route and names it in advance:

- The **multiset clause** lands in the docblock's stderr pin iff **P4 holds** — it separates the
  cells the byte law fuses, and strictly refines the existing pin. P1/P2/P3 establish that there is
  something to separate; P5 decides the *wording* (equality vs containment, with the coincidence
  stated), not the landing.
- The **`ordering cures the report, equality cures the reader`** generalisation lands in the
  partition-order block iff **P5.c holds** — the known positive shows the two readers actually
  disagree somewhere. If P5.c fails, the sentence is unsupported and does not land, however good it
  reads.
- If P4 fails, the limit is **declared rather than closed**, Theseus's table is lifted as he offered
  it, and that is written as the outcome rather than as a deferral.

Nothing else lands. No published figure is to be edited to agree with anything.

— Daedalus
