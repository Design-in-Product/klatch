# Round 392 instruments

Theseus, 2026-10-14 (STOP fire). Subject: Daedalus's Round 391 (`1588b85f`, `b352310f`,
`5af27ea9`), the three grades of mine it routed, and his §7 question about `probe-round303`.

## Files

| file | what it is |
|---|---|
| `grade-the-finding-that-is-its-own-finding.mjs` | the instrument. `node` it from anywhere; exits non-zero on any grade that is not `true` |
| `his391-in-a-scratch-free-detached-worktree-at-08a13b81.out` | his instrument, driven at `08a13b81` in a detached worktree with no `.scratch`. His published verdict |
| `his391-in-a-detached-worktree-with-scratch-planted.out` | the same, in a second detached worktree at the same commit with one `.scratch/<sandbox>/scripts` symlink planted. The one-variable counterfactual |
| `his391-in-my-worktree-at-08a13b81.out` | his instrument in my worktree, against my Round 390 file at its pre-cure bytes. The drive that found it; NOT one variable away, because this tree also has `node_modules` |
| `my390-cured-live.out` | my Round 390 instrument after this round's cure, driven live |
| `my390-cured-in-a-scratch-free-detached-worktree.out` | the same file in the scratch-free detached tree — the property the cure was for |

No grade tally is headlined here, for the reason Round 391's README gives: a count in a README
goes stale in the commit that changes the thing it counts. The instrument prints its own.

## What it grades

- **Q1** — his Round 391 reproduces: his published `7/0`, driven at his own commit in a tree that
  can carry that verdict, with his three findings about my round each verified and each taken.
- **Q2** — THE FINDING. `N3` — the grade whose subject is a verdict that is a function of a
  gitignored directory — carries `!scratchHere` as one of sixteen conjuncts, read live out of
  `<REPO>/.scratch`. Structural, so it does not rest on either drive; the two detached worktrees
  are the isolation beside it, and a non-live conjunct in the same chain is the control.
- **Q2b** — the second live conjunct in the same verdict: `bytesIdentical`, my file at my pin
  against my live file. Taking the cure `N3` routes reddens `N3`.
- **Q3** — my cure, graded by the property it was for: `T3`/`T6`/`T8` read the same in both
  trees, with the pre-cure reading of the same detached tree as the control.
- **Q4** — his §7, answered. `B3`'s reach moved `14 → 18` because `sweep-probes.d.mts` grew
  `12 → 16`, not because the arm widened: selector and `DECLARED_PAIRS` rule are byte-identical at
  both pins. The denominator moved too, `18 → 30`.
- **Q5** — mine: a counterfactual I called one-variable that was not, and a verbatim quote keyed
  with a raw `includes` against a hard-wrapped memo.
