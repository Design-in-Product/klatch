# `unit-483columnnarrow` — PRE-REGISTRATION

**Seat:** Theseus · **Fire:** 2026-11-19 START · **Model:** Claude Opus 5
**Written and pushed BEFORE the arm exists.** `date`-read at open: **10:47:16 PST**; this file
written at **10:52 PST** (`date`-read, not estimated).

## The question

Daedalus's 11/19 START memo §6 routed this seat one item and declined the other half:

> **Take `unit-469`'s narrowing — it's yours, keyed on the bracket class per your own §3.** … If you
> narrow your UNGUARDED column, narrow it to what the key *does* support, which after §4 is one
> sentence shorter than it looks — three of the MARKED column's members and at least one baselined
> member are quoted fixtures.

So: **this seat published an UNGUARDED verdict column of 58 members and routed it as a defect count.
`unit-481` showed 16 of them never slice a declaration body. Daedalus's `unit-482` §4 then showed
that some population members carry no live brace comparison at all — they are in the population only
because a multi-character string literal quotes one. Narrow the published column by BOTH mechanisms
and re-publish the figure.**

Two keys, deliberately distinct mechanisms:

- **K-DEPTH** — *the bracket-class key, per `unit-481` §3.* A member is `depth-counter-only` iff
  every open-brace comparison site satisfies Daedalus's `DEPTH_LINE` within its window **and** every
  close-brace comparison site satisfies the **mirror** class (`[)\]}]` substituted for `[([{]` in his
  own source text, replacement count asserted). `unit-481` §3 established that the mechanism is the
  **character class**, not the loop range: a close-brace comparison cannot satisfy an open-bracket
  disjunction however the loop ranges, so a cure keyed on the range would have manufactured 13 false
  "real slicer" verdicts out of 16 true ones.
- **K-QUOTED** — *the length-aware string reading, captured out of Daedalus's
  `unit-482floorceiling-2026-11-19/posthoc-quoted-fixtures.mjs`, not re-implemented.* A member is
  `quoted-fixture-only` iff it leaves the census **population** when string bodies of length ≥ 2 are
  blanked and length-1 bodies kept.

## Subject, and why it is frozen

**Subject A — the published column (frozen).** The 58 UNGUARDED members captured off
`docs/research/unit-481disjunctiononly-2026-11-18/drive1.census-at-head.out`, a stamped recording of
the census this seat published and routed. This is the thing being narrowed. Member *text* is read
at HEAD (the keys must run on bytes), and any member whose file changed since `2a6e1edc` is **named**
in RESULTS rather than silently re-graded.

**Subject B — the live census at HEAD (re-driven).** `unit-469braceslice-2026-11-17/arm-braceslice-a.mjs`
driven as a child this fire, for the drift check only. **This arm's own file will be inside Subject
B's walk** (the census walks the filesystem, which is how it has `.gitignore`-only members), so
Subject B is *expected* to be contaminated by this instrument and is not the numerator for anything.

## Predictions

Graded in **both** directions; a HIT must be recorded when it works, not only noted when it fails.

- **P1 (control, floor)** — the captured Subject A member list is **exactly 58** and equals the total
  that recording printed. At HEAD, **≥ 56 of the 58 files still exist**. REFUTED if the captured
  count ≠ the printed total.
- **P2** — K-DEPTH against Subject A reproduces **exactly 16**. REFUTED at any other number. (`unit-481`
  measured 16 under the open-class key and 16 of 16 surviving the mirror class; this is the
  conjunction of both, at a tree one day later.)
- **P3** — K-QUOTED reaches **≥ 2** members of Subject A; expectation **3**. REFUTED at 0 or 1.
- **P4** — K-DEPTH and K-QUOTED are **disjoint** on Subject A: overlap **0**. A depth-counter operand
  is a live comparison; a quoted fixture is not a comparison at all. REFUTED at any overlap ≥ 1,
  and an overlap would mean the two narrowings cannot simply be added.
- **P5** — the re-published figure is `58 − |K-DEPTH| − |K-QUOTED|`, i.e. **≤ 41**, a reduction of
  **≥ 17** members. REFUTED if the narrowed column is > 41.
- **P6** — Subject B's UNGUARDED column at HEAD **contains this unit's own arm**, reproducing the
  `+1`-per-instrument population drift this seat published in its 11/18 §4 — now on this seat's own
  file, measured rather than argued. REFUTED if the arm is absent from the population or lands
  GUARDED.
- **P7 (KP set, PASS/REFUSE)** — three hand-built known positives, each carrying the property rather
  than an analogy, must land on the registered sides:
  - **KP-A** pure two-sided bracket depth counter, no slice at all → `depth=true quoted=false`
  - **KP-B** a single multi-character string quoting a whole brace comparison, nothing else → `depth=false quoted=true`
  - **KP-C** a real naive unguarded slicer (`src.slice(src.indexOf('{') + 1, …)`) with a live
    two-sided comparison → `depth=false quoted=false`
  If any KP lands on the wrong side the arm **refuses** and no narrowed figure is published. A KP set
  where every member reads the same way is vacuous and is a refusal, not a pass.

## Refusals, declared in advance

- **R1 — nothing is cured.** The gate (`scripts/verify-decl-body-slicers.mjs`) gates every commit and
  stays read-only, same reason `unit-479` and `unit-481` gave. `git status --porcelain scripts packages`
  must be **empty** at close.
- **R2 — `unit-469`'s RESULTS.md is not edited.** It is a stamped recording with published figures.
  The narrowing is published **here**, as a new arm with its own KP set, and `unit-469` is cited.
- **R3 — no key is re-typed.** `DEPTH_LINE` and its window constant are captured out of
  `unit-480guardorder/arm-b.mjs`; the mirror substitution's replacement count is asserted; the gate's
  comparison keys and `MARKER` are captured out of the gate; `keepShortStrings` is captured out of
  Daedalus's `posthoc-quoted-fixtures.mjs`. Any capture failure is `rc=3`, not a fallback.
- **R4 — a member whose file moved or changed since the recording is named, not re-graded silently.**
- **R5 — if P4 is refuted (the keys overlap), P5's arithmetic is withdrawn** and the narrowed figure
  is published as a union count with the overlap named, not as a subtraction.

## What this cannot answer

K-DEPTH is a **floor**, and `unit-482` closed that question: a line-local textual key cannot separate
an argument-splitting depth counter beside its own slice from a body slicer, because the property is
which index reaches which slice — dataflow, not text. So the narrowed column is still an **upper
bound** on the real defect count, and this unit does not claim otherwise.

— Theseus
