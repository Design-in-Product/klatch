# Addendum 1 to `unit-464cons`'s pre-registration

**Registered 2026-11-04, WORK fire, after `HAND-CONS.tsv` was committed and pushed (`2fd49cd7`)
and BEFORE any grader in this unit exists.** `git log --diff-filter=A` over
`docs/research/unit-464cons-2026-11-04/` is the check: `PRE-REGISTRATION.md` at `c23d92e7`,
`HAND-CONS.tsv` at `2fd49cd7`, this file next, and `grade-cons.mjs` after all three.

---

## 1. What prompted the addendum

The comparison I registered as `P5AGREE` has now been read, and it came out **15 of 16 blind sites
in agreement** — above the registered floor of 14, so the price is publishable. But the **one**
disagreement is not a reading slip, and treating it as one would throw away the only new thing in
this unit.

**The disagreement:** `unit-464t2-population-2026-10-28/grade-the-round-population.mjs#1`. He
classifies it **A**; I classified it **R**. Both of us saw the same mechanism and said so in
writing:

* his reason: *"an addition CENSUS, not an anchor. Each member is an addition and cannot move; the
  SET grows as paths are added, noted rather than hidden."*
* mine: *"Each individual row is immutable, but the ROW SET grows with every new research
  directory — and the consumer reads the set, not one row."*

We agree on every fact and divide on **what "the selection" is**: a selected *member*, or the
*extent* of the selection.

**And his own table takes both answers.** `round441-instruments/key-the-silent-class-from-source.mjs#1`
is the same shape — a HEAD-bounded log consumed as a census — and he classifies it **R**, with the
reason *"The FIGURE moves as history grows, so arm [3] is right even though this is a census rather
than an anchor."* Member-immutability is equally true of round441's members: a commit SHA, once in
that list, stays in it. So the reason he gives for `A` on one census row is true of the row he
gives `R` to, and the reason he gives for `R` on that one is true of the row he gives `A` to.

That is not an error by either reader. It is an **unstated free variable in the class definition** —
"does the selection move" is ambiguous between *member* and *extent*, the two readings disagree on
exactly the census rows, and the published price moves by one file in each direction depending on
which one you pick. A cure keyed on this vocabulary inherits the ambiguity.

## 2. `P8MOVED` — settle it by measurement instead of by preference

Registered **before the instrument exists**, with its prediction and, more importantly, with its
limit.

**The test.** For every site whose selection is mechanically re-derivable from the call alone,
evaluate the selection **twice** — once bounded at `POP_PIN` (`0ae48068`) and once at `HEAD` — and
report `moved` / `stable` from the two results. No static reading of the consumer is required, and
no judgment about what "the selection" means: if the two evaluations differ, the selection moved,
as a fact about this repository.

**Registered predictions:**

| site | my class | his class | prediction |
|---|---|---|---|
| `unit-464t2-population#1` | R | **A** | **MOVED.** The consumer publishes `unitDirRows.length` as measurement **M6** (line 287) and gates on `rows.length` (G1, line 308). Every `unit-*` directory created under `docs/research/` since the pin adds a row — and both seats create one most fires. |
| `round441#1` | R | R | **MOVED.** Control, not a finding: the two readers already agree here, so a MOVED result tells me the test is not inert on the class it is supposed to detect. |
| the 6 dir-creator `A` sites | A | A | **STABLE.** Matched negatives: `--diff-filter=A --reverse` then first, over a round directory, selects the directory's earliest add-commit, which no later commit can re-seat. If any of these reads MOVED, my own `A` classifications are wrong and I report that. |

**The limit, which is the whole reason this leg is honest.** The test is **asymmetric** and I am
registering that now rather than discovering it in the results:

> `MOVED = true` is sound evidence for **R** — the selection demonstrably changed.
> `MOVED = false` is **NOT** evidence for **A**. It means the selection did not move *in this
> interval*. A genuinely movable selection over a path that nobody happened to touch between the
> two revs reads `stable` and is not.

So `P8MOVED` can **confirm** R and can **refute** an `A` classification; it can never **establish**
one. Any `stable` row below is reported as "not observed to move in this interval," never as
"stable," and the six matched negatives are a **consistency check on my hand read**, not a proof of
their class. A leg whose negative result means nothing must say so on the line where the negative
is printed, or it is a vacuous green.
[[feedback_vacuous_gates_and_guards]] [[feedback_a_guard_on_identity_does_not_guard_value]]

**`GMOVEDKP`** — a known positive for the test itself, because a differential test that cannot
detect a difference proves nothing about the rows it calls stable. The KP is a selection known to
move: the full-history log of a path **touched between the two revs**, taken as `[0]`. If
`GMOVEDKP` does not report MOVED, `P8MOVED` is dead and every `stable` in its table is
uninterpretable. A matched negative accompanies it: the same path's **oldest** commit
(`--reverse`, `[0]`), which must read STABLE across the same interval.

## 3. What this does and does not license

**Licensed if `P8MOVED` lands as predicted:** reporting the one hand-read disagreement **resolved
on a measurement** — R for `t2-population#1`, because the figure its consumer publishes is
different at the two revs — and recording in `LEG-CLASS-CONVENTION.md` that the `R`/`A` distinction
needs the member/extent reading stated explicitly, because two careful readers took it both ways on
the only two rows where it matters.

**Not licensed:** promoting `P8MOVED` into "the cure predicate." It is a *differential* test, it
needs two revs and an actual intervening commit, and its negative half carries no information. It
does not replace the static consumer-level reader Theseus named — it is a cheaper instrument that
answers one half of the question, and the half it answers is the half with sound evidence. His
reader stays his.

**Also not licensed:** changing a single row of `HAND-CONS.tsv`. It is committed. If `P8MOVED`
refutes one of my classes, the refutation is reported against the filed row and the row stays as
filed.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
