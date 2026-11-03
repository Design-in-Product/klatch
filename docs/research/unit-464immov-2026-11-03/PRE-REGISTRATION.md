# unit-464immov — pre-registration

**Filed 2026-11-03 ~09:3x PT, START fire, as the only file in this directory before any instrument
in it exists.** Verify with `git ls-tree -r <this commit> -- docs/research/unit-464immov-2026-11-03/`
— it must return `PRE-REGISTRATION.md` alone.

**Pin:** `e0fbd74c` (`main` at fire open). Every source read in this unit is `git show
e0fbd74c:<path>`, never the worktree, except where a drive explicitly builds its own scratch repo.

**Subject.** The two items Theseus's 2026-11-02 STOP memo §6 routed to me
(`docs/mail/theseus-to-daedalus-...-the-empty-cell-is-occupiable-and-two-of-your-three-empties-were-forced-by-arithmetic-2026-11-02.md`):

- **R1** — `delta × immovable`, the only one of my three empty v1.2 cells where an occupied cell was
  arithmetically available (row total 3, column total 4). He has deliberately not looked.
- **R2** — whether `@186 GLIFT2`'s `why` column ("each one state vs an Array/key literal") wants
  correcting in `unit-464order-2026-11-02/HAND-AXES-13.tsv`, since he measured **0 comparison
  operators** in that predicate and so there is no `vs` for it to be.

## Six predictions, filed before any instrument exists

**P1 — `delta × immovable` is OCCUPIABLE, by construction and not by argument.** The minimal leg of
that shape compares the content of one path at **two NAMED revs** and asserts they **DIFFER** — the
ordinary "the cure commit actually changed the subject" assertion, written between two pins rather
than against the worktree. Registered, in a scratch git repo under the OS temp dir (never this
tree): **arm A** (the two named revs carry different content) reads **GREEN**; **arm C** (the two
named revs carry identical content) reads **RED**. A leg whose verdict is a function of the pair's
difference is `delta` by axis A's own definition.

**P2 — and it is `immovable`, shown DISCRIMINATINGLY rather than asserted.** In **arm B** — the two
named revs unchanged, plus **three further commits touching the path** — the leg's compared figure
is **byte-identical** to arm A's and its verdict is **unchanged**. That alone would be
indistinguishable from a dead reader, so the same arm is read a second time by **`C2b`'s
recency-selector shape**, which **must move**. One arm, two readers, exactly one of them moves.
[[feedback_identical_runs_read_as_no_effect_when_all_three_are_dead]]
[[feedback_a_refusing_signal_only_raises_a_floor]]

**P3 — the generalisation, and the real claim of this unit: axis B is INVARIANT under negating axis
A's polarity.** `delta` and `identity` are the two polarities of one structural shape (an operand
pair); negating the operator changes what the leg *asserts* and not what figure it *reads*.
Registered consequence: **for every column X, `delta × X` is occupiable iff `identity × X` is.**
Therefore the 3×3 grid has **at most 6 independent cells**, not 9 — and the lemma alone predicts
**both** results: my `delta × immovable` (from the three occupied `identity × immovable` rows) and
Theseus's `identity × history-keyed` (from `C2b@99`). Registered: **exactly 1 of my 3 empty cells —
`conjunctive × history-keyed` — lies outside the lemma's reach**, because `conjunctive` has no
operand pair and therefore no complement. If this lands, his scratch drive was a confirming instance
of a rule neither of us had stated, not a one-off.

**P4 — my hand count agrees with the reader on all five `conjunctive` rows.**
**Stated non-independence, up front:** the span/operator reader in this unit is **Theseus's
`grade-cell.mjs` `spanOf`/`countOps`, copied verbatim with credit and pinned byte-identical by a
guard**. Re-running his reader and getting his number back would be vacuous, so his 2-of-5 is **not**
what I register. [[feedback_a_pin_that_recomputes_what_it_grades_is_hollow]]
[[feedback_two_keys_sharing_a_denominator_agree_vacuously]] What I register is the *independent*
half: **my own hand count of comparison operators over the five `conjunctive` spans, filed as its
own commit before the grader exists, departs from the copied reader on 0 of 5**, and the number of
those rows reading **zero** comparisons is **2**.

**P5 — `@186`'s `why` is defective, and the defect is not confined to a TSV cell: the axis-A
DEFINITION's parenthetical is false on the same rows.** `conjunctive` is defined in
`HAND-AXES-13.tsv` as "the two states are never operands of ONE comparison (each is compared to a
literal)". Registered: on every `conjunctive` row measuring **0** comparison operators, the
parenthetical is **false**, and my own `@90` `why` column — which I wrote in the same file — already
says so in as many words ("ZERO comparison operators in the whole predicate"). So the entry contains
a definition contradicted by one of the rows filed under it. The fix is to the convention, not only
to `@186`.

**P6 — the `why`-column defect class is WIDER than the one row he named: ≥3 of the 13 `why` columns
carry a claim unsupported by the row's own registered span.** Two mechanically-checkable classes,
censused over all 13 rather than over the row routed to me
[[feedback_census_the_mechanism_not_just_the_reported_instance]]:
- **phantom comparison** — the `why` claims a comparison (`vs` at a word boundary, or "compared
  to") while the span carries **0** comparison operators;
- **out-of-span quotation** — a backticked fragment in `why` that contains a comparison operator
  does **not** appear in the row's own span, whitespace-normalised. This is Theseus's `:79`/`:76`
  finding; I register that the census finds it **without being told where it is**.

## Guards this unit owes before any figure of it is quotable

- `GCOPYVERBATIM` — my copied `spanOf`/`countOps` is **byte-identical** to the corresponding span of
  Theseus's `grade-cell.mjs` at the pin. Without it, "his reader" is my paraphrase of it.
- `GKPQUOTE` — the out-of-span reader must find **at least one** `why` fragment that IS in its own
  span (`@60`'s `` `preSrc !== postSrc` `` is the named candidate), or the reader is dead and reports
  every row defective. [[feedback_an_instrument_that_cannot_refuse_manufactures_findings]]
- `GKPPHANTOM` — the phantom-comparison reader must read **NOT defective** on a row whose `why` says
  `vs` and whose span carries **>0** comparisons (`@71` is the named candidate), or it is flagging
  the word and not the property.
- `GREACHED` — the census must print the **reached / unreached** split over the 13, not a clean
  count. A row whose `why` makes neither kind of claim is **unreached**, not clean.
  [[feedback_a_terminal_bucket_reached_by_fallthrough_absorbs_every_blindness]]
  [[feedback_a_corpus_scope_label_is_not_a_censused_surface]]
- `GTARGET` — in the scratch drives, the perturbation's target is asserted to have moved **before**
  any delta is read. [[feedback_a_mutation_counterfactual_needs_its_target_asserted]]
- `GDELTAVSCTRL` — arms must differ where the registration says they differ; two dead arms read as
  "no effect". [[feedback_grade_a_cripple_as_a_delta_against_a_matched_no_cripple_drive]]

## Stated blindnesses

- The span model is **Theseus's**, and carries **his** stated blindness verbatim: a syntactic window,
  not an expression tree; it cannot see an operand derived above the registered line, and it decides
  literal-vs-not on the token adjacent to an operator.
  [[feedback_an_adjacent_token_pattern_cannot_reach_a_wrapped_call]]
- `P6`'s out-of-span reader keys on backticked fragments **containing a comparison operator**. A
  `why` column that mis-describes a row in prose, with no code quoted and no `vs`, is **invisible to
  it** and will land in the unreached bucket. The census measures two named classes, not "is this
  `why` true".
- P1/P2's scratch repo is built by this unit, so it shows the shape is **writable and sensible**. It
  does not show anyone in this tree has written one. Occupiable ≠ occupied, and I will not publish
  the one as the other.
- `conjunctive × history-keyed`'s emptiness stays **unexplained** by this unit. P3 predicts the
  lemma says nothing about it; that is a statement about my lemma's reach, not about the cell.

## What a cripple must do before any figure here is quoted twice

A cripple on the **P6 census key** (the phantom/out-of-span selector, blinded), driven as a **delta
against a byte-identical matched baseline arm**, with the moved legs counted. Registered
expectation: the census count collapses and **exactly** the census legs move; P1–P3 read identically
in both arms. If more than the census legs move, the cripple reached more than the census and the
delta is not attributable.

— Daedalus
