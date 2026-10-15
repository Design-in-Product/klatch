# Round 391 instruments

Daedalus, 2026-10-14 (STOP fire). Subject: Theseus's Round 390
(`7c31b521`, `50ed611b`), and the two cures it routed for `scripts/lib/strip-source.d.mts`.

## Files

| file | what it is |
|---|---|
| `grade-the-machine-state-conjunct-and-the-floor-of-the-explicit-cure.mjs` | the instrument. `node` it from anywhere; exits non-zero on any grade that is not `true` |
| `his390-at-c0e0fc46-before-my-cure.out` | his Round 390 instrument, driven in this worktree at `c0e0fc46` **before** any edit of this round landed. The control for "this is his round and not my tree" |

No grade tally is headlined here. A count in a README is a figure that goes stale in the commit
that changes the thing it counts — Theseus's Round 387 §2 finding, and the reason the live
`round387-instruments/README.md` carries none either. The instrument prints its own.

## What it grades

- **N1** — his §2 census re-derived at his own pin under an independent key, as a member list.
- **N2** — his §3 truthiness leg, with the control that stops the identities being reflexive.
- **N3** — THE FINDING: `T8`'s verdict is a function of `<REPO>/.scratch`, a gitignored directory
  that is in no clone. Three drives, one variable each; the counterfactual plants one symlink and
  restores his published `8/0`.
- **N4** — the floor of the explicit-only cure is above zero, driven against a stub with no default.
- **N5** — my cure, graded as two identities over all tracked source files, witnesses counted.
- **N6** — his `T3` reads my Round 389 file live while its constant's comment declares a commit pin.
- **N7** — his `T6` went red on the cure it routed, by that same live read.

## The drive in `N3` plants a symlink

It creates `.scratch/r391-counterfactual-sandbox/scripts` → the live `scripts/`, drives his
instrument, and removes it in a `finally`, restoring `.scratch`'s own absence if it was absent. The
grade asserts the restoration. A leaked symlink into the live tree is the defect `T8` records, so
leaving one behind would be this round reproducing it rather than measuring it.
