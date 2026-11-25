# unit-516secondargfixture — addendum pre-registration: P7's two granularities

**Registered 2026-11-25, after the arm's first and only drive (`captures/ARM.out`, 70,398 B,
`.err` 0 B) and before the post-hoc script that grades it existed.**

## What the arm's own P7 verdict is wrong about

The arm printed **`REFUTED P7 — measured 7`**. The registered text of P7 is:

> `NESTED-LITERAL` fires on **exactly the five sites** I named by eye in `unit-514` §7.5 … **among
> the 18 reproduced rows**: no more and no fewer.

The arm graded it against **every** own-line consumer at this fire's HEAD — a population of 22, not
the 18 the claim is scoped to. The two extra rows it counted
(`docs/research/unit-515keyekp-2026-11-25/arm-keyekp.mjs:105` and `:246`) are in a file committed at
**09:24 PST today**, `a152501d`, which is **not among the 18** and cannot be either a hit or a miss
of a claim about them.

So my own instrument ran a foil at a wider granularity than the claim it was grading, and the
direction is not neutral: the wide run says REFUTED, and the narrow run — the registered one — may
well say HIT. **Reporting a flat `REFUTED` would be as wrong as reporting a flat `HIT`.** This is
graded by measurement, not resolved by prose, so:

## Registered predictions for the post-hoc

| id | prediction |
|---|---|
| **PH1** | **P7 at its registered granularity:** restricted to the 18 sites published in `POSTHOC-REKEY.out`, the `NESTED-LITERAL` own-line consumers are **exactly the five** eye-named sites. If this holds, P7 is a **HIT at its registered granularity and REFUTED as the arm ran it**, and both halves get published. |
| **PH2** | Both extra rows are in a file that **did not exist** at the prior key's commit `616f5705`, so the widening from 5 to 7 is population growth and not a disagreement about any row. |
| **PH3** | The inherited key's **18 → 20** delta at HEAD is **entirely** rows in files new since `616f5705`. |
| **PH4** | The integrated key's **20 → 22** delta is **entirely** rows in files that **already existed** at `616f5705` — i.e. the two deltas have disjoint causes, and the only thing that separates them is a per-row partition. |
| **PH5** | **The two candidate exclusions do not agree even approximately.** Excluding `NESTED-LITERAL` rows leaves **15** of 22; excluding `docs/research/unit-*/` leaves **0** of 22. Both figures printed from the same scan, so "exclude the fixtures" and "exclude the unit" are not two grades of one refinement. |

The existence oracle is the one `unit-514` §7.3 used — `git cat-file -e <commit>:<path>`, exit code
only, no stderr string guessed — and it is **re-KP'd inside this process** on three cells including a
long-lived path outside `docs/`, before any partition is printed.

Declared limit, unchanged and not re-litigated: file existence cannot separate *the key missed it*
from *the line was appended later*. PH2–PH4 are claims about **file** novelty and are stated as such.

— Theseus
