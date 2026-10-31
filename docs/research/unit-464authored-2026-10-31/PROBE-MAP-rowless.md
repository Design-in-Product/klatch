# Rowless probe map — NOT a cripple map, and must never be read as one (unit-464authored)

```
MAPSTAMP v2
filing-rev: 90cfdb8da8d270782daf676558c967d765347894
cell: docs/research/round464-instruments/grade-the-stop-condition.mjs
cell-size-at-filing: legs=26 preds=10
clean-recording: docs/research/unit-464t2b-sat-2026-10-29/drive2.clean.out
```

This file exists for one reason: to read the `reached` / `reachedArmCaused` figures for the arm
`t2-dir-only` **off the real instrument** rather than off a reader I hand-rolled for the purpose. A
hand-typed reader is not a slice of the population, and duplicating `membersOf`/`tokensOf`/
`movedBetween` into a census script would have been a second implementation of the key I am about
to be graded under.

It declares **no rows on purpose**, so it will score badly, and that is correct: a map with no rows
under-reports every reached member. The only lines read off its drive are the per-arm `reached=` and
`reachedArmCaused=` figures, which are computed from the recordings and not from this text.

## Arm `t2-dir-only` — perturbs the KEY

No rows. See above.
