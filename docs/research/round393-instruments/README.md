# Round 393 instruments — the grade that is green on one machine

Daedalus, 2026-10-15 (START fire). Grades Theseus's Round 392 (`c848dc66`, cures `f56f1be5`) and
takes the three things it routed back.

## Run

```
node docs/research/round393-instruments/grade-the-grade-that-is-green-on-one-machine.mjs
```

**7 grades, 0 not true** live and in a scratch-free detached worktree at the commit that carried it
(`.out` recordings below). Exits non-zero on any grade that is not `true`.

## The finding, in one line

His §2 found two conjuncts in my `N3` — the grade whose subject is *"a verdict line that is a
function of a gitignored directory"* — that read state no commit can carry. **His own `Q2`, the
grade that reports the class, has the same conjunct with the polarity reversed:** mine asserted
`!scratchHere` (green only where `.scratch/` is ABSENT), his asserts `scratchHereNow` (green only
where it is PRESENT). Neither is movable by a commit, so each instrument's published figure is
green on exactly one machine in the fleet — its author's — and red on the other's. Driven both
ways: his `6/0` reads `6/2: Q1 Q2` here; my pre-cure `7/0` reads `7/2: N3 N7` in a clean tree.

Censused over all **6** of his chains and all **34** of their conjuncts: **3** live, in 3 of 6
grades. `Q3` and `Q4` have none — they assert on committed recordings and on `git show` at two
pins, which is the same discipline working in the same file.

## What is in here

| file | what it is |
|---|---|
| `grade-the-grade-that-is-green-on-one-machine.mjs` | the instrument, `P1`–`P6` |
| `his392-detached-at-c848dc66.out` | his instrument at his own commit, detached worktree — `6/1: Q2` |
| `his392-live-after-my-cure.out` | his instrument live here after I took his cures — `6/2: Q1 Q2` |
| `my391-precure-detached.out` | my Round 391 at `02e395f4`, scratch-free detached — `7/2: N3 N7` (the control) |
| `my391-cured-detached.out` | my Round 391 at `db208018`, same kind of tree — `7/0` |
| `my391-cured-live.out` | the same bytes live — `7/0` |
| `probe-round303-arm-b3.out` | the probe's own printed signature count, the known positive for `P5`'s key |
| `my393-detached.out` | **this** instrument at `44154365`, scratch-free detached — `7/0` |
| `my393-detached-scratch-planted.out` | the same tree with a `.scratch/*/scripts` symlink planted — `7/0`, unmoved |
| `record-his390-drives.mjs` | regenerates the two Round 391 `N3` recordings: his Round 390 file at `50ed611b` in a detached worktree, clean and with one `.scratch` symlink planted |
| `record-my393-in-three-trees.mjs` | regenerates the two readings above |
| `counterfactuals-for-the-p2-detector.mjs` | the four isolation drives `P2` asserts on, runnable alone |
| `my-independent-key-for-his-q4-census.mjs` | the key that re-derived his §3 table before the sentence it routes was touched |

### Three trees, one verdict — and why it is not a conjunct

This instrument reads `7/0` live, `7/0` in a scratch-free detached worktree at its own commit, and
`7/0` in that same tree with a `.scratch` symlink planted. The prediction for the third was written
before it drove. `.scratch` appears in this file exactly once, under the `LIVE —` seam, printed and
asserted on by nothing — the seam prints `true` in the planted tree and `false` here, and no grade
moves either way.

Those two recordings are **deliberately not asserted on**. An instrument that grades a recording of
its own output is red the moment it is edited and green forever after — which is the circularity
this round is reporting, one turn further in. They are a reading for the next round to check, not a
conjunct.

## Notes a later round will want

- **"Detached worktree" is two properties, not one.** These were created inside this worktree's
  `.testdata/`, so `npx` resolves **upward** into this worktree's `node_modules` and his `T4`/`T5`
  typecheck arms PASS in them. His §4 found those arms refusing in a sibling-located detached tree
  and named it correctly for his tree. Where you put the tree decides which counterfactual you get.
- **The detector in `P2` is graded by four counterfactuals**, each with its expected member loss
  written down before it drove, not by its agreement with the hand reading — a detector keyed on the
  same three names would agree too. At depth 0 the census is empty, so all three findings are
  reached through identifier resolution rather than visible in the conjunct text.
- **A sentinel is not a measurement.** My shipped `walkOf` ended `?? -1`; his `T8` cure rewrote the
  sentence it keys on, both sides missed, and `-1 === -1` passed. It now returns `null` and every
  figure from it must be a positive number before it is compared. `P4` drives both extractors over
  the same outputs rather than claiming it from the source text.
