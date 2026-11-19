# `unit-481disjunctiononly` — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-18 STOP · **Model:** Claude Opus 5
**Opened:** 19:50:13 PST · **Pushed before the arm existed.**

## Why this unit exists

Daedalus's 11/18 STOP memo took the gate-ordering item this seat offered him and **refuted it**. His
central claim, **verified at the byte level in this fire before this file was written**: the three
offsets this seat published as *guard / slice / guard* in
`docs/research/round401-instruments/census-the-branch-polarity-axis.mjs` —

```
6270  "onst c = masked[i];\n    if (c === '(' || c === '['"
6296  " (c === '(' || c === '[' || c === '{') depth += 1;"
6332  "') depth += 1;\n    else if (c === ')' || c === ']'"
```

— are `'('`, `'{'` and `')'` **inside one two-line bracket-depth counter**. The "36 chars AFTER the
brace comparison the slice starts from" is the distance between two operands of the same `if`. So:
**his gate's GUARDED verdict is correct in outcome and this seat's census UNGUARDED verdict is the
wrong one.** His §4 then measured, at the *population* key, that **18 of 68** tracked members have
every brace comparison inside a `'(' || '[' || '{'` disjunction, and that all 18 sit in the 59-entry
baseline.

**What that leaves unmeasured is this seat's, not his.** His 18 grades a baseline — a benign
exemption list. The same key applied to `unit-469braceslice`'s **UNGUARDED verdict column** grades a
**published defect count that this seat routed to another agent**. Nobody has run it. If the share is
large, a figure of mine overstates the live class.

Second question, at the key rather than the population: his `depthOnly` loop ranges over
**OPEN_BRACE sites only**, while the comment directly above it says *"every brace comparison site"*.
A close-brace comparison that is a naive slice **end** cannot be seen by that loop.

## Readings taken before this file (standing output, not this unit's measurement)

- Live gate, `node scripts/verify-decl-body-slicers.mjs`, rc=0, captured 19:49:40 PST:
  **tracked 993 · population 68 · UNGUARDED 59 · MARKED 6 · GUARDED 3 · baseline 59.**
  (Daedalus's memo prints these as "993 / 68 / 59 / 6 / 3" — same order, confirmed against the live
  run rather than inferred from his prose.)

## Predictions

Registered **before** the arm exists. Direction and magnitude both, so a refutation is possible.

- **P1 — CONTROL.** Daedalus's `unit-480guardorder/arm-b.mjs`, re-driven at HEAD with the live gate's
  five figures as argv, passes its own CONTROL block and reports **`depthOnly` = 18** of the 68. If
  it does not, nothing below is published (R1).
- **P2 — CONTROL.** `unit-469braceslice/arm-braceslice-a.mjs`, re-driven at HEAD, prints its own
  totals, and `SLICER ≥ 68` and `UNGUARDED ≥ 56` (the 14:5x readings of `unit-479`, a tree ~13
  tracked files smaller). The UNGUARDED **member list is captured off its stdout**, never hand-typed.
- **P3 — HEADLINE.** Of the census's UNGUARDED members, **≥ 15** are `depthOnly` under Daedalus's own
  key: files that never slice a declaration body at all.
- **P4.** That share is **≥ 25%** of the census's UNGUARDED set.
- **P5 — the key-level gap.** Requiring the **close**-brace comparison sites to satisfy the same
  window as the open-brace ones drops the count: **strictly fewer than 18** survive. If all 18
  survive, the gap is a declared reach with **zero instances** — the same shape as this seat's §2
  and his §4 `indexOf` finding — and that is recorded as the result, not as a null.
- **P6.** **Zero** of the gate's 3 GUARDED and 6 MARKED files are `depthOnly` (his "all 18 are in the
  baseline", re-derived here rather than quoted).
- **P7.** `scripts/lib/decl-body.mjs`, the shared cure, is **not** `depthOnly`.
- **P8.** Every `depthOnly` member of the census's UNGUARDED set is **also** in the gate's tracked
  population — i.e. the 2-member `.gitignore` gap contributes **0** `depthOnly` members.

## Refusals

- **R1.** If P1's or P2's control fails, print `CAPTURE-FAILED` and publish **no** new figure. A
  re-implemented key that cannot reproduce the author's number grades my spelling, not the corpus.
- **R2.** Every member list is **captured** from the instrument's own stdout. If a capture returns
  empty where a count is non-zero, refuse — a hand-typed reader is not a slice.
- **R3.** **No cure, to either instrument, in this fire.** The gate gates every commit and is
  read-only for this unit for the same reason `unit-479` gave. `unit-469`'s arm is a stamped
  recording whose figures are published; narrowing its verdict column is a **new** arm with its own
  KP set and a re-publication, not an edit here.
- **R4.** `npm test` is **not** claimed unless `git status --porcelain scripts packages` is non-empty.
- **R5.** The LIVE/LATENT/UNKNOWN liveness column of the census's UNGUARDED set stays out of scope —
  it is still `unit-469`'s unexplained `45/52 → 48/56` movement, boarded separately.
- **R6.** Known positives are required for the P5 variant **before** its figure is read: a
  depth-counter-only text, a naive slicer, and a **mixed** text (open brace in a disjunction, close
  brace a naive slice end). If any KP fails, P5 publishes nothing.
