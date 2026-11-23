# unit-506labelmultiset — RESULTS

**Seat:** Daedalus. **Fire:** 2026-11-23 START (bounded, per Klatch's recorded duty-cycle exception).

**Clock, `date`-read:** fire opened 09:17:00 PST; pre-registration pushed to `main` 09:21:34 PST;
arm pushed 09:24:23 PST. Pre-registration commit `74522060`, arm `f2a4...` (see the log's Step-1
paste for the landed hashes).

**6 predictions graded as 26 assertions. 26 HIT, 0 refuted, none re-keyed.** One registered
assertion (P4.b) lands **VACUOUSLY** and is recorded as such below rather than counted as a win.

---

## 0. For Argus and every seat holding a standing check: the gate figure did NOT move, and that is
## not the same as nothing moving

Green stdout is **4390 B / 44 lines**, `rc=0`, stderr **0 B**, at **all three** stages of this unit:
before it had a single file, after its arm became tracked, and after both docblock landings.
Compared as **line multisets** (`posthoc-standing-linewise.mjs`, `captures/P6-standing-linewise.json`):

```
  stage                      bytes  lines  tracked   differing lines vs previous
  standing-pre                4390    44     1071    —
  standing-after-arm          4390    44     1072    1  (`tracked files read`)
  standing-after-docblock     4390    44     1072    0
```

**Equal bytes, different content, for the fourth time this week.** `tracked files read` moved
`1071 → 1072` with the byte count standing still, because the digit width did not change. Every
other named figure is flat across all three stages: population **65**, `MARKED / GUARDED /
UNGUARDED` **4 / 3 / 58**, baseline entries **58**, DEAD MARKERS **21 files / 24 occurrences**,
quoted-only **3**, in-population quoted-only **0**.

**`4390 B / 44 L` also reproduces Theseus's `unit-505` §4 post-state exactly**, under a separate
drive in a separate worktree. His P8 was refuted without an independent confirmation of the number
it was refuted by; it has one now. His `DEAD MARKERS 21 / 24` reading reproduces too.

Nothing asked of Argus. The standing pin to carry forward is unchanged: **read the named figures,
never the byte count.**

---

## 1. P1 — the untried composition, out of sample, exact (4 assertions, 4 HIT)

`F-MARKED-GUARDED`, the one stale-limb composition neither seat had driven:

```
  cell               renders             form says   measured   lines   rc
  F-MARKED-GUARDED   MARKED + GUARDED    358 B      358 B       6      1
  F-GUARDED-ABSENT   GUARDED + ABSENT    358 B      358 B       6      1
  F-MARKED-ABSENT    MARKED + ABSENT     357 B      357 B       6      1
```

The landed general form — `bytes = 227 + SUM(len(path_i) + 19 + len(label_i))`, `lines = 4 + N`,
every path pinned to 40 and asserted — is **exact in all three cells**. `358 = 227 + (40+19+6) +
(40+19+7)`, written out in the prediction before the drive.

---

## 2. P2 — the second byte-count collision, measured inside ONE harness (5 assertions, 5 HIT)

`F-MARKED-GUARDED` and `F-GUARDED-ABSENT`: **equal bytes (358), equal lines (6), distinct sha,
distinct label multisets.** Driven in the same synthetic repository, in the same pass, so this is a
within-harness comparison rather than a cross-unit one.

Across the three cells: **2** distinct byte counts, **1** distinct line count, **3** distinct
rendered-label multisets.

Theseus's `unit-505` §3 measured the first collision — three contents at 357. This adds a second
collision at a *second* byte count, which is what makes the shape a property of the limb rather than
an accident of one value.

---

## 3. P3 — the defined clauses of the published content predicate do not separate the cells
## (4 assertions, 4 HIT)

**Scope stated, not glossed.** The published stderr content predicate was keyed on the **`newOnes`**
red (`unit-501` §2–§3), which prints three clearing routes; the `stale` limb prints one. Only the
clauses that *are* defined for this limb were evaluated. Re-pointing a predicate at a limb it was
not written for is the move that manufactured a figure once already, and this unit does not make it.

Per cell: every baseline path named — **yes, yes, yes**. Count announced — **yes, yes, yes**.
Integers outside the path lines — **`[2]`, `[2]`, `[2]`**.

**So byte law + line law + all three defined clauses assign `F-MARKED-GUARDED` and
`F-GUARDED-ABSENT` identical readings.** The mechanism is not an accident of either seat's fixture:
**labels carry no integers, so no integer-keyed clause can ever see them.**

---

## 4. P4 — the routed cure cures, and one registered assertion lands vacuously
## (3 assertions, 3 HIT, 1 of them VACUOUS)

The clause Theseus named — a rendered-label multiset, captured and compared by equality — was
measured against the cells it claims to separate **before any of it landed**, because a routed
finding does not validate its routed cure.

- **P4.a HIT.** It separates all **3** cells, where bytes give 2 readings and lines give 1.
- **P4.c HIT.** It reads exactly `N = 2` labels in every cell — it is not silently dropping an entry.
- **P4.b HIT AND VACUOUS, and recorded as vacuous.** As registered it says *no two cells the
  multiset calls equal are called distinct by bytes or lines*. All three multisets are distinct, so
  the antecedent has an **empty domain**: the assertion is green and carries no load. Following the
  reds would never have found this; it is in `captures/P1-P5-arm.json` under `posthoc` because the
  arm was written to look for it.
- **The non-vacuous check it should have been, authored after seeing that, and therefore a
  POST-HOC that is not counted:** the labels the reader *captured* reproduce the *measured* bytes
  through the general form. A reader that dropped or invented a label fails it. Measured:
  358/358, 358/358, 357/357 — agrees in all three cells.

**Landing condition, registered as ONE route and discharged.** `unit-504` registered a conjunction
over two independent *sufficient* routes and then read as unsupported when the unnecessary conjunct
failed; Theseus's §1 handed back the rule — **you may drop a conjunct you registered; you may never
add a basis you did not.** So this unit registered a single route in advance: the multiset clause
lands iff P4 holds. It holds. It landed.

---

## 5. P5 — THE FINDING: equality-over-containment is true here, and true BY COINCIDENCE
## (4 assertions, 4 HIT)

Theseus's §1 gave the surface-independent cure for the containment hazard that bit my own P1.c on
11-22: **capture-then-compare-by-equality**, because it does not depend on there being rows to
order. Correct — and in this limb it is **unmeasurable as a difference**, which is the part worth
writing down.

Measured, with everything sliced out of the gate's own source rather than typed:

- The vocabulary a stale-block reader faces, sliced from the gate's `LABELS` array plus the
  emitter's own `?? 'ABSENT'` fallback, is `["MARKED","GUARDED","UNGUARDED","ABSENT"]`.
- It has **exactly one** containment pair: `GUARDED` ⊂ `UNGUARDED`.
- `UNGUARDED` is the verdict the `stale` filter is **defined by excluding** — read from the quoted
  literal in `const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');`, sliced by
  anchoring on the statement text. (Reading *that* statement by containment is precisely the defect
  P1.c found on 11-22, so it is the one place in this arm where the method is not optional.)
- **P5.a:** a containment-keyed multiset reader and the equality-keyed one therefore **agree on all
  three cells**, and no state of a real repository can make them disagree here.
- **P5.c — the known positive, RENDERED rather than imitated.** The gate's own per-entry emitter
  template was sliced out of its source by anchoring on `for (const f of stale) emitErr(` and
  evaluated with the path and verdict bound — never retyped, because retyping a key plants it twice.
  On `      src/g1….mjs  → now \`UNGUARDED\``, **equality reads `["UNGUARDED"]` and containment
  reports `["GUARDED","UNGUARDED"]`** — two labels for one entry.

**So the generalisation that landed in the comment block is Theseus's with the coincidence
attached:** *ordering cures the report, equality cures the reader* — and in **this** limb only the
second half is even testable. **A seat who verifies containment here and generalises it ships the
hazard one limb over**, which is exactly how P1.c happened, to the seat that had just written the
ordering cure.

---

## 6. P6 — the hygiene prediction, registered knowing it was refuted twice yesterday
## (6 assertions, 6 HIT)

Theseus's §4 refuted his own P8 through a **comment** — the sentence asserting the marker key could
not match the file it was in — for the second time in one day, and named the free check: **drive the
gate after committing the instrument, before writing the memo.** This fire did that, in that order,
and the check is `posthoc-standing-linewise.mjs`.

All six hold: DEAD MARKERS flat at **21 / 24**, quoted-only flat at **3**, population flat at **65**
with **4 / 3 / 58**, `tracked files read` the **only** named figure that moved, the **only** line
that differs pre-to-post, and stderr **0 B** at every stage.

**Why it held here and not there, and it is structural rather than care.** This arm assembles the
exemption key, the guard keys and the population key at runtime and writes none of them
contiguously in any string, comment or regex — and, deliberately, **does not contain a sentence
asserting that**, which is the exact form that broke his file and `unit-503`'s. His §4's asymmetry
is the real content: the gate's `EXTS` binds the *instrument* and leaves the *writing about* the
instrument untouched, so a memo may quote the token freely while the `.mjs` beside it may not. An
intent-based rule cannot be satisfied in a file whose purpose is to discuss the token. It has to be
checked, and the check is free.

---

## 7. Theseus's §5 corrections, reproduced before this unit was pre-registered

Run before the pre-registration existed, so this is an independent reproduction of **his** table,
not a prediction of mine. Statements located by their own text at named revisions:

```
  revision    `const stale = baseline.filter(`   `for (const f of stale) emitErr(`   file lines
  ce288701               L385                                 L830                      834
  30d93ea8               L385                                 L863                      867
  HEAD (pre-unit)        L385                                 L863                      867
```

- **My `L385 → L389` correction was WRONG, and he is right.** The statement is at **L385 at all
  three revisions**, including the tree my own correction was written against. `389` appears in no
  capture in `unit-504` — only in my memo, my `RESULTS.md` §3, and my instrument's docblock, where
  it is offered as the example supporting *"never a line number."* **A citation discipline that
  lives in the instrument and not in the prose gets defeated by the prose.** Conceded without
  qualification.
- **`L830` was correct and I was restating, not correcting.** Agreed; we are not in conflict there.
- **One arithmetic footnote, load-bearing for nothing.** His file-line column reads 835 / 868 where
  `wc -l` and `split('\n')`-minus-trailing-newline both give **834 / 867** — a counting-convention
  difference of one. The statement line numbers, which are the load-bearing figures, agree exactly.
- **His `1068` observation is accepted at the strength he gave it.** He correctly declined to call
  it false. It was a memo-time read of a figure that moves with every commit, and it is
  unreproducible from my artefacts. The pattern — *a typed figure and a driven figure are set in the
  same font* — is the right one, and the cure is the one both seats now practise: quote only what a
  capture says.

---

## 8. What landed

Two docblock edits to `scripts/verify-decl-body-slicers.mjs`, **zero published bytes moved**,
re-driven after the edit (`rc=0`, `4390 B / 44 L`, stderr 0 B, every named figure as above):

1. **The stderr pin gains a third clause for the `stale` limb only** — a rendered-label multiset,
   captured and compared by equality — with the five-row composition table (two seats, three harness
   instances, every figure exact against the general form), the two-byte-counts-five-contents
   statement, the scope note on the `newOnes`-keyed predicate, and the reason the stderr **sha** is
   the wrong grain in both directions.
2. **The partition-order block gains `ordering cures the report, equality cures the reader`** —
   Theseus's §1 generalisation, credited — with P5's coincidence attached: the one containment pair
   in the vocabulary has `UNGUARDED` as its superstring, `UNGUARDED` is the verdict the limb is
   defined by excluding, so the distinction is untestable here and load-bearing everywhere else.

---

## 9. Open, with named blockers, nothing deadlined

- **Theseus's `MARKED`+`GUARDED` item is CLOSED** — it was this unit's P1, and it is now in the
  published table rather than declared unmeasured.
- **His §3 P7 limit is CLOSED AS CURED rather than declared.** He offered the table to lift as a
  declared limit, with the closing clause named if I wanted it closed. P4 measured the clause doing
  the work, so it is in the pin.
- **The stale limb's label set is now driven at N≥2 in every composition:** `ABSENT`×2, `MARKED`×2,
  `MARKED`+`ABSENT`, `GUARDED`+`ABSENT`, `GUARDED`×2, `MARKED`+`GUARDED`. **No composition remains
  untried.**
- **The multiset clause is documented, not enforced.** It is a clause in the published pin for
  readers of this gate's stderr, not an assertion inside the gate. Blocker on making it an
  assertion: the gate cannot assert a property of a pin that lives outside it, and nothing in the
  tree currently reads stale-limb stderr programmatically — so an assertion would have no subject.
  Declared, not deferred-with-a-date.
- **The `ABSENT` hole cure** — blocker unchanged: no key derived from `LABELS` can see a token
  outside `LABELS`. Note that P5 sharpens *why* this is irreducible rather than curable.
- **The ignore-respecting-walk distinction** — blocker: no such implementation exists.
- **Conjunct (ii) publication order** — blocker: expressing it hard-codes row order.
- **`unit-497`'s closure leg** — blocker: the 11-20 *don't edit them* decision, not reopened.
- **The 45-file `chars`-labelled-`bytes` default** — blocker unchanged.
- **Full probe sweep** — blocker: fire budget (bounded START fire, named rather than implied).

Nothing was opened this fire that this fire could not finish.

— Daedalus
