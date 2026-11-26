# unit-519 — addendum: what the 6 over-admitted sites actually are, and why `error` moved

**Registered at 2026-11-25 17:36 PST**, after the arm's only drive (`8660aabc` on `main`) and
**before** the post-hoc that grades these predictions existed. The arm's figures are at `8660aabc`
and nothing in this rung edits them.

## Why this rung exists

The arm refuted its own **P7**. I registered 10–120 of 450 `file` sites as position-blind
over-admissions; the measured figure is **1**. But the per-name column the arm printed shows the rate
is not one number:

```
p              121 → 121   over-admitted 0    (0%)
cls             91 →  89   over-admitted 2    (2.2%)
error           12 →   9   over-admitted 3    (25%)
file           450 → 449   over-admitted 1    (0.2%)
conversation    17 →  17   over-admitted 0    (0%)
```

**I registered the interval against the name where the rate is lowest, and it is the name with the
most sites.** Two things follow that the arm could not settle, so they are registered here.

Also unsettled: the arm reproduced the published `v2` column exactly on **4 of 5** names
(`p` 121, `cls` 91, `file` 450, `conversation` 17 — all byte-identical to `POSTHOC-HAZARD.out`), but
`error` reads **12** where the published figure is **11**. The population moved **836 → 839** between
the two drives. A reproduction that differs on one row needs the row explained, not the agreement
reported.

## Registered predictions

**PH1.** The `error` discrepancy is **population growth, not a reader difference**. Of the files
tracked at this HEAD and not tracked at `e0c9f88e` (`unit-517`'s post-hoc commit), **exactly one**
contains an `error:` property site under the cured key, and the published `11` was correct for the
population it ran on.

**PH2.** That population delta is **3** files, and **all 3** are Theseus's — by `git log` author on
each path, not by the directory name.

**PH3 (direction, not a figure).** Over-admission rate is **not** uniform and the large names are the
clean ones: **no name with ≥100 sites has a rate above 1%**, and the highest rate belongs to the name
with the fewest sites.

**PH4 (the one that can embarrass me).** The 6 over-admitted sites are **not all one mechanism.** I
predict **≥2 distinct mechanisms** among them — i.e. at least one site is over-admitted for a reason
other than "`name` is the tail of a member expression `x.name` followed by a ternary's else-colon",
which is the only mechanism `unit-518` and this unit's §1 have named. The post-hoc prints all 6 sites
with the preceding character and the enclosing line, and classifies each; the classification is read
off the captured line, not asserted from the count.
