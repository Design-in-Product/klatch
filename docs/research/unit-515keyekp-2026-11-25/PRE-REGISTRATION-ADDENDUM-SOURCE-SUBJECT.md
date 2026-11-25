# unit-515 addendum — the subject name from SOURCE, not from the diagnostic string

**Registered:** 2026-11-25 09:2x PT, after the arm's first drive, before this rung's script existed.

## Why this rung exists

The arm keyed 13 of the 14 terminal-bucket rows and left **1 `UNKEYED`**
(`verification-theseus-2026-11-21-stop-unit499-landing/control-untracked-member.mjs:22`). The cause
is in my own instrument, not in the row: two of the five mechanism arms (`CALLBACK-PARAM`,
`SUBJECT-IS-PARAM`) need the subject's **identifier**, and `subjectNameOf` extracts it from
`unit-513`'s **`why` string** — which carries a backtick-quoted identifier for some rows (`no origin
found for \`l\``) and a path for others. The one row whose `why` names a path therefore reached both
arms with `subjectName === null` and could not be tested by either.

**I derived a key's input from a diagnostic message.** The message was written to be read, not to be
parsed, and it carries the identifier only when the arm that wrote it happened to have one in hand.

My by-eye reading said that row is `SUBJECT-IS-PARAM` (`const s = buf.toString()`, `buf` a parameter
of `const figures = (buf) => …`). **That reading is currently unverified** — the key could not test
it, so the arm's `SUBJECT-IS-PARAM 0` neither confirms nor refutes my eye.

## Predictions

### P8 — a source-derived subject name recovers the one `UNKEYED` row

A subject-name reader that takes the identifier from the **use line's own text** (the receiver of the
method call whose argument is the pattern, or the pattern's argument where the call is
`/…/.test(X)`), KP'd in both directions, yields a non-null name for the `UNKEYED` row.
**Expected: HIT.**

### P9 — and the row then keys `SUBJECT-IS-PARAM`, confirming the by-eye reading

With a source-derived name, the row keys `SUBJECT-IS-PARAM`, `UNKEYED` goes **1 → 0**, and
`SUBJECT-IS-PARAM` goes **0 → 1** — i.e. the arm's refutation of P4 was **my key's blindness, and my
eye's reading of that row was right.** **Expected: HIT.** If it keys anything else, my eye was
wrong too and I will say so.

### P10 — the source-derived name does not disturb the 13 rows already keyed

Swapping the name source changes **0** of the 13 already-keyed rows' mechanisms. **Expected: HIT.**
This is the control: a reader swap that silently re-keys rows elsewhere would make P9's single-cell
gain unreadable.

### P11 — `unit-513`'s published upper bound of 12 is wrong, and wrong in the unsafe direction

The arm computed the reachable-silent interval off `unit-513`'s own capture as **`[1, 8]`**, where
`unit-513` §4 published **`[1, 12]`**. I predict the `12` is reproducible as `1 confirmed + 11
SILENT`, i.e. it **double-counts the confirmed member and treats every silent row as still
available to `GATE` even where Key E already resolved it elsewhere**; the honest upper bound is
`1 + (silent AND UNRESOLVED) = 8`. **Expected: HIT**, and if it holds, my own published interval
**overstated the hazard** and is corrected here, not caveated. Graded by recomputing both candidate
arithmetics from the committed capture and seeing which returns 12.

## Method

- The extractor is KP'd before it is used, including a **refusal** on a line with no receiver.
- The 13-row control (P10) is a **diff of mechanism per site** between the two name sources, not a
  comparison of totals — identical totals with two rows swapped would read as "no effect".
- Both candidate arithmetics for P11 are computed; neither is assumed.

— Daedalus
