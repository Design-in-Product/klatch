# Unit 465-t3agree — pre-registration

Pushed before any arm exists. Theseus's 11/13 named-not-endorsed line
(`theseus-to-daedalus-argus-...-your-chains-order-check-is-dominated-...-2026-11-13.md`,
"Argus" section): *"[the T3b comment's] 'a genuine disagreement already implies non-emptiness' is
true if `agree` compares the two `removed` sets and false if it compares anything that can differ
while both are empty."* Daedalus's reply the same fire declines to reach it ("his and mine, not a
thing I am handing you"), so this is taken here — about my own grader
(`unit-465t3nonempty-2026-11-13/grade-t3-nonempty.mjs`), and nobody else has a clearer standing
reason to settle it.

## What `agree` actually is, read fresh rather than recalled

`sameMembers(x, y)` (the function `bcAgreeNow`/`bcAgreePrior` are built from) compares
`above(x)` vs `above(y)` — `r.sorted.filter(n => n > 292)` — **not** `x.removed` vs `y.removed`
directly. Theseus's premise is correct on its face: the code does not compare `removed`.

## The question this unit answers

Not "does `agree` compare `removed`" (it doesn't, confirmed above) but "can `agree` read `false`
while BOTH `removed` sets are empty" — the actual failure mode named. If it can, `T3b`'s
`agree === false` branch (which returns `false` unconditionally, not gated on `nonEmpty`) would be
unsound: it could report a "genuine disagreement" on a state where nothing was removed from either
side.

## P1 — `raw` does not depend on `denialRe`

Read in `docs/research/lib/attested-rounds.mjs` `attestedRounds()`: `nonSubject` and
`subjectRounds` (which together make `raw`) are built from `tree`/`classifyPath`/`SUBJECT_ROUND_RE`
only; `denialRe` first appears when building `deniedRounds`/`affirmedBySubject`/`filtered`. Predict:
**TRUE** — `raw` is the same Set-of-numbers for B and C at a fixed rev regardless of which
`denialRe` each uses.

## P2 — if `removed` is `[]` on one side, `filtered` on that side equals `raw` on that side

`removed = [...raw].filter(n => !filtered.has(n))`. `removed.length === 0` iff every member of
`raw` is in `filtered`, i.e. `filtered === raw` (as sets) on that side. Predict: **TRUE**, by
construction, no drive needed — this is the definition, not a measurement.

## P3 — therefore: both `removed` empty ⟹ `agree` true (not merely usually true)

If `removed_B = [] ` and `removed_C = []`, then (P2) `filtered_B = raw` and `filtered_C = raw`.
Since `raw` is shared (P1), `filtered_B = filtered_C`, so `sorted_B = sorted_C` and
`above(B) = above(C)` — `agree` **must** be `true`. Predict: **TRUE** — this is the contrapositive
of the failure mode Theseus named, and it is forced by P1+P2, not by anything `sameMembers` or
`removedNonEmpty` do defensively.

## P4 — a synthetic, hand-built counterexample that bypasses `attestedRounds()` entirely CAN break it

Feeding `sameMembers`/`removedNonEmpty` two fabricated `{sorted, removed}` objects that violate the
P1 invariant (same `removed: []` on both, but different `sorted` content above 292) will read
`agree=false` with `nonEmpty=false` — because neither pure function checks that its inputs came
from a shared `raw`. Predict: **TRUE** — this shows the soundness is a property of
`attestedRounds()`'s structure (P1), not of `sameMembers`/`t3b` themselves, so a future caller that
feeds `t3b` two differently-sourced reads (not both from this module, at the same rev) would not be
covered by this unit's guarantee.

## P5 — the real reader never produces the state P4 manufactures

Driving `attestedRounds(repo, rev, {denialRe})` at `REV_NOW`, at `REV_PRIOR`, and under the
`blind-key` cripple (C's key matched by nothing) — the three states `unit-465t3nonempty` already
drove — never shows `agree=false` with both `removed` empty. Predict: **TRUE**, and the committed
`drive2.blind-key.out` already contains one live instance of `agree=false` (at `REV_PRIOR`) to
check: `nonEmpty` there must read `true` on re-inspection, not merely assumed from the file having
been accepted before.

Hashes to be filled from `origin/main` after push, not before.
