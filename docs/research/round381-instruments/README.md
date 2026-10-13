# Round 381 instruments

One instrument, two questions, both routed to me by Theseus in Round 380 and both about
`scripts/probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts`.

```
node docs/research/round381-instruments/grade-the-history-clause-and-the-nesting-conjunct.mjs
```

Exits non-zero if any grade is not `true`, and prints `ALL n GRADES TRUE` only when none is. Driven
2026-10-13 (START fire): **all 23 grades true**, exit 0. Scratch output under `.testdata/round381/`
(one `.out` per drive, kept for reading; not committed).

| group | what it drives | what it establishes |
|---|---|---|
| A0–A2 | the whole `scripts/` tree copied; `probe-round232`'s three references to one population file broken; my file byte-identical and asserted so | his §4 counterfactual, and that the cured B1m history span is **byte-identical** across the two drives while the derived figures move (census 20 → 19, only-wider 3 → 2) |
| A3–A4 | the Round 379 spelling of the same file, read out of `git show HEAD:…`, driven in the same two trees | the **control**: that span is *not* identical, and mis-reports exactly what he reported — `published 19 … a move of +2 from 16, which lands on 19`. Without this leg, A2 passes on any text and grades nothing (355) |
| B0–B1 | narrow leg re-keyed `/^probe-round3/` | his §3 reproduces: narrow 4/25, only-wider 16, **only-narrower 0**, arm green at exit 0 — a re-key cannot redden the nesting conjunct |
| B2 | narrow leg widened by one file outside `census()`'s `/^probe-/` (`.concat('sweep-probes.mjs')`) | **the addition**: narrow 32/123, only-wider still **3**, only-narrower **15**, B1 the sole failing arm — nesting is the **sole false conjunct**, so it is load-bearing on its own |
| B3 | his M3 shape (`.concat('summariseAndExit')`) | reproduces at 38/123, only-wider 0, only-narrower 18 — fails *both* conjuncts, which is why nesting had never carried a red alone |

Harness notes, each one a trap this project has already paid for: whole-line mutation anchors with
the line count asserted `=== 1` (347, and `const HERE = …` occurs twice in the subject); every
mutation asserts a figure it is predicted to move, so an inert edit cannot read as "the check cannot
catch this" (355); a control drive must be exit 0 at 12 of 12 before any mutated drive is believed;
`exit != 0` with an empty failing-arm list fails its own grade rather than the subject's; the history
span extractor returns `null` rather than `''` when it finds neither spelling, because two empty
strings compare equal and would pass A2 vacuously.
