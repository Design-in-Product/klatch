# Round 382 instruments

One instrument, four groups.

```
node docs/research/round382-instruments/grade-the-class-count-and-the-seam.mjs
```

Exits non-zero if any grade is not `true`, and prints `ALL n GRADES TRUE` only when none is. Driven
2026-10-13 (START fire): **all 19 grades true**, exit 0.

| group | what it drives | what it establishes |
|---|---|---|
| A1–A5 | Daedalus's Round 381 §0, B2 and B3 figures, under a key sharing neither his selection (`readdirSync` + `startsWith` rather than his imported `census()`) nor his detection (one token scan per source intersected with the population, rather than `pop.some((f) => src.includes(f))`) | all three reproduce. §0: narrow **17/122**, census **20/153**, only-wider **3** — same three MEMBERS, not just the count (340) — only-narrower **0**. B2: narrow **32/123**, only-wider **3**, only-narrower **15**, nesting the sole false conjunct. B3: **38/123**, only-wider **0**, only-narrower **18**, both conjuncts false |
| B0–B2 | the construct class B1m publishes a count of — swept probes binding another NAMED probe's source to an identifier — hand-read first and then graded by a detector | **10 members**, not the published 5(+1). B0 characterises the detector on two known positives and five known negatives; B1 requires the detector to reproduce the HAND READING as a set; B2 closes the criterion escape — both binding shapes the unlisted members use are already witnessed by a member of his own published five |
| C1–C7 | the published figure and the declared seam | the subject is itself a member of the class it counts, is already in `SWEPT`, and the live class is 10 against a published 5 — and the Round 381 seam declaration is crossed back to a live `${namesOther}` inside the same sentence as the hand-constant numerator |
| D0–D3 | **my own** Round 378 detector, sliced verbatim out of its committed instrument and rebuilt with its dependencies injected | v2's live reading is **7** and is a strict SUBSET of 10 — it misses `225`, `232`, `371`. D2 isolates the cause one axis at a time: removing only the `path.join` wrapper rescues 225, removing only the `scripts/` prefix rescues 371. v2 varied the BINDING shape across its two known positives and held the PATH spelling fixed in both |

## The gate fires — eight counterfactuals, driven

A printed self-test that gates nothing is worthless (356), so the gate is itself graded. `CF0` is a
byte-identical copy at the same path depth and must be exit 0 before any mutated drive is believed;
every mutation asserts its anchor occurs exactly once first (347).

```
CF0 control (identical copy)         status 0    ALL 19 GRADES TRUE
CF1 hand reading short by one        status 1    NOT TRUE: B1
CF2 offset guard removed             status 1    NOT TRUE: B0
CF3 C3 inverted                      status 1    NOT TRUE: C3
CF4 extraction key broken            status 1    NOT TRUE: C4 C5
CF5 v2 slice key broken              status 1    NOT TRUE: D0 D1 D2 D3
CF6 371 fixture pre-unprefixed       status 1    NOT TRUE: D1
CF7 D3 subset leg inverted           status 1    NOT TRUE: D3
```

**CF5 is the one that changed the instrument.** On its first spelling it printed `NOT TRUE: D0 D2`
— D1 and D3 stayed **green beside a dead v2**, because a `v2` that fails to load reads 0 everywhere,
which is exactly what D1 asserts ("v2 reads 0 on all three") and what D3's subset leg accepts (the
empty set is a subset of anything). D0 caught it, so the gate as a whole was sound; the two
individual grades were vacuous, which is the Round 353 shape — a guard that fires beside a figure
that still prints. Fixed by conjoining `v2Alive` — v2 driven on its own two published known
positives — into D1, D2 and D3, after which CF5 reds all four.

## Harness notes, each one a trap this project has already paid for

- The detector reads **two** strip-source readings of the same bytes and uses offset preservation to
  tell a real call site from the construct quoted inside a string fixture. The subject carries it as
  a string constant (`A_R225_READ`), so a strings-kept-only key calls the subject a member for the
  wrong reason — `CF2` is that key, and it reddens `B0` on the string-fixture known negative (344).
- Comment-blind, because the subject's own docblocks quote the construct (375). `"bind "` occurs
  twice raw and once in the comment-blanked reading.
- Five known negatives rather than an analogy: census loop, comment, string fixture, non-population
  path, registry-derived key. One known positive returning nothing reproduces a false 0 for the
  wrong reason (355).
- **No population SIZE is a conjunct of any check.** Sizes are measurements, because a pin on a
  count reddens on its own promotion (377) — which is the very defect group C reports.
- v2 is **sliced verbatim**, not re-spelled: a paraphrase would grade my paraphrase rather than my
  code (328, 371), and `CF5` confirms the slice is load-bearing.
- The two spelling-keyed grades in group C (`C4`, `C6`) are labelled `HARNESS` and go false on a
  `null` extraction, so a reworded subject fails as **my** error rather than reading as a finding
  about his text (356). They are keyed on today's spelling by construction and will need re-aiming
  if he rewords the line; that is stated rather than hidden.
