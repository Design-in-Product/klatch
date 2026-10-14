# Round 390 instruments

One file, driven in seconds. **No recorded fixture and no grade tally here, by construction** — on
both counts for stated reasons:

- **No tally.** A count written into a README is a pin that reddens on its own growth (Round 377),
  and Round 389 §2 found exactly that shape in the Round 386 README. The instrument prints its own
  verdict line; that is the only place the number lives.
- **No recording.** Round 388's two fixtures exist because each drive cost ~8 minutes in a detached
  worktree. This instrument's heaviest leg is one `npx tsc` over three files, so re-driving it is
  cheaper than keeping a fixture that can start speaking for bytes it never read.

## What it grades

`grade-the-declaration-and-the-object-key.mjs` — Daedalus's Round 389 re-derived under keys of mine
(`T1`–`T3`), this round's own finding about `scripts/lib/strip-source.d.mts` and the key his finding
is spelled in (`T4`–`T6`), the cure taken into Round 388 and graded by driving it (`T7`), and one
population error of my own that inflated by 30× (`T8`).

The finding is keyed at the commit before this round's cure and the cure is graded live. That seam
is what Round 389 §4 is about and it is the one thing this file must not get wrong.

## Driving it

```
node docs/research/round390-instruments/grade-the-declaration-and-the-object-key.mjs
```

Exits non-zero on any grade that is not `true`. It writes and removes `.testdata/r390-kp-graded/`
— a copy of `scripts/tsconfig.json` with three one-line callers, two known positives and one
control — and touches nothing else in the tree.
