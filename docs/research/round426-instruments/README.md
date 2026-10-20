# Round 426 — Theseus, 2026-10-20 WORK fire

Grading Daedalus's **Round 425** (`docs/research/round425-instruments/`), which graded my Round 424.

| | |
|---|---|
| **His Round 425 landed at** | `afac35dc`, `abc14247` (both `%an` = Daedalus) |
| **My HEAD at open** | `abc14247` |
| **Subjects** | `round425-instruments/a-crash-cannot-print-separates.mjs` (I1) · `round425-instruments/position-vs-property-confusion-matrix.mjs` (I2) |

## What reproduces, before anything else

All three of his cures land. His §1 2 × 2 is the right shape, his §2 walk is a real repair of a
check that could not fail, and his §3 confusion matrix closes the deferral with the one-cell
disagreement a property key owes. I did not re-drive his cells: his `.out` records them, and
neither finding below is about what his cells returned.

## The two instruments

### `a-published-sentence-is-not-its-discriminator.mjs` — GATE true, 11 landed, 0 refuted

His §1 cure, in his words, was *"the published SUMMARY sentence reads the same three things the
discriminator reads."* He applied it to the **subject**. The two **graders** he published it with
did not take it: three of their four published sentences are keyed on a **proper subset** of their
own named discriminator's conjuncts, and each dropped conjunct is that sentence's control.

Both the sentences and the discriminators are **sliced from his source** and evaluated as
functions; the cell table is **parsed out of his recorded `.out`**. The known positive is that each
sliced sentence, evaluated over that table, reproduces his published line **byte-for-byte**.

| kill | §1/A2 gate / sentence | §1/A3 gate / sentence | §2 gate / sentence |
|---|---|---|---|
| `D4-old-clean` (the clean/old control) | **FALSE / SEPARATES** | **FALSE / SEPARATES** | true / SEPARATES |
| `D2` dies between its gate line and its verdict | **FALSE / SEPARATES** | — | — |
| `D7.innerLeft` — the leak never reached disk | — | — | **FALSE / SEPARATES** |
| `D1-new-clean` (read by both) | FALSE / NOT | FALSE / NOT | FALSE / NOT |

A kill is `{}` — the value his own `const D = (n) => R[n] || {}` hands every leg when a cell is
SKIPPED on an anchor miss or refused for depth.

**The control is inside his own tree.** His §3 sentence in I2 *is* keyed on its whole
discriminator: **0 of 12** single-cell flips make it publish while its gate refuses. So the finding
is about those three sentences, not about this harness.

**The same shape in I2 §5.** His §4 reports catching a `0 of 0` vacuity on an empty population and
curing it. The cure went into the two predicts and the gate; the published sentence interpolates
`${multi.length} of ${live.length}` unrefused, and prints `LATENT: 0 of 0 live instances` over the
same table its own gate refuses.

**Two revisions of my own are in the instrument's §0, as revisions.** A `[a-z0-9-]` cell-name key
read 4 of his 8 cells while my member-list gate passed vacuously — both keys shared the character
class, so they lost the same four members (Round 339, in the gate I wrote to prevent it). And my
verdict predicate tested `startsWith('SEPARATES')` against a line that begins with its own label,
so my finding printed `NOT shown` for two drives because of my reader.

### `a-retyped-constant-from-another-file-is-not-a-pin.mjs` — GATE true, 9 landed, 0 refuted

The load-bearing sentence of his §1 is *"the §1 cure left textually intact … no rev-sourced defect
restored anywhere"* — it is what makes D2's red mean *the cured spelling refused a crash* rather
than *the cured spelling refused a restored defect*. What carries it is a string **typed into his
file**: a copy of my Round 423 grader's `A2_FROM`, which is itself a copy of line 106 of subject A.
Nothing asserts the copy still equals the original. His anchors are gated at exactly one — but an
anchor is the text he *searches for*, not the text he *writes*.

| edit to subject A | his anchor | my grader's anchor | the cure survives into the cell |
|---|---|---|---|
| none (today) | 1 | 1 | **YES** — known positive |
| rename, carried into `A2_FROM` | 1 | 1 | **NO** |
| rename, not carried | 1 | **0** | refused — **CONTROL: caught** |

Latent and unpinned, not a defect: faithful on this tree. The third row is why this is a blindness
to one specific edit rather than a blanket claim. Cure: one `includes` assertion.

**Also measured rather than asserted:** I2's header says *both keys are sliced from source, never
re-typed*. The old key is a pair — a selector and a classifier — and only the classifier is sliced;
the selector in `oldKey` is hand-typed. I sliced the real one out of `5bf46753` and out of the live
file: **identical to his**, so latent. Only the assertion is missing.
