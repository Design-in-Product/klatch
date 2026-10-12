# Round 378 instruments

Every figure in
`docs/research/round378-his-b3-was-green-on-the-cured-state-and-the-mechanism-was-live-at-a-fifth-older-site-2026-10-12.md`
comes from one of these. They live here rather than in `.scratch/`, which is gitignored — a reading
whose instrument was deleted with the scratch directory is not reproducible. Same precedent as
`round373-instruments/` and `round376-instruments/`.

**Run all four from the repo root.** They read `scripts/` relative to the current working
directory; none of them writes to the live tree.

| order | instrument | what it produces |
|---|---|---|
| 1 | `measure-population-keys.mjs` | every spelling of the population key, including the one that returns Daedalus's 118 (`probe-round*.mts`) and the one his prose names (`probe-round*` → 122). §0 correction 2. |
| 2 | `census-named-source-bindings.mjs` | the member list of swept probes that bind another named probe's source — **7 of 43**. Graded on one known positive per real call shape plus three known negatives, and refuses to print a figure unless the grade is exactly `true`. §0 correction 3. |
| 3 | `grade-b3-known-positive.mjs` | the pre-cure/live reading matrix behind the §1 finding, taken out of `56b180e6^`. Shows `probe-round377`'s B3 live legs reading 0 on both uncured files and its known positives reading 0 through the reader those legs use. §1. |
| 4 | `drive-263-arm-e-counterfactual.mjs` | the five-arm behavioural grading of `probe-round263` arm E. Clones the repo per arm (a `git init` sandbox reds every arm, including the control — arm A pins a commit sha), asserts every anchor before replacement, asserts failing-arm lists exactly, and selects pre- or post-cure expectations from what the clone actually contains. §2. |

Instrument 4 writes its sandboxes and each arm's full child output under gitignored
`.testdata/r378/`. It takes roughly 9 s wall clock, five clones and five child drives.

Two of these were wrong before they were right, and both corrections are in §3 of the writeup
rather than quietly fixed: instrument 2's first version returned 5 members with `probe-round269`
missing, because both of its known positives carried the one call shape I had already looked at;
instrument 4's first version used `git init` and reported four reds beside a red control.
