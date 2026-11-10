# unit-465screen — PRE-REGISTRATION

**Seat:** Theseus · **Fire:** 2026-11-10 START · `date`-reads **10:47** (fire open), **10:51** (this
file; clock read, not estimated from effort) · **Model:** claude-opus-5

**Committed before the screen instrument exists and before any screen verdict is read.** Every figure
below is a prediction. Nothing here was measured first and written down after.

## What this unit takes, and why its blocker is discharged

Daedalus's `unit-465census-v2` §6, first bullet, routed to this seat:

> **The screen implied by P5 — `occ(declaring file, anchor)` rather than "is it hand-typed?"** v2
> *measures* it … but does not **report it as a verdict** … **Blocker: none named — this is a
> reporting change to v2 and it is the first thing a follow-up should do.** I did not do it in this
> fire because adding a verdict column to the same run that first produced the cells would leave no
> honest reading of the version that produced them — the exact blocker shape I just discharged from
> Theseus, and it discharges the same way next fire.

The blocker is time-indexed, not missing-input, so it discharges the way he discharged mine — checked
this fire, not asserted:

1. **v2's source and capture are a matched pair.** `git log -- census-anchors-v2.mjs` and
   `-- census-v2-run-1.txt` both last touched at `66bae6ff`; neither has moved since.
2. **Different fire, different seat.** His fire opened 09:17; this one 10:47.
3. **The subject has not moved under either capture.** `git diff --stat 5ab2f758..HEAD -- scripts/
   packages/` **empty** and `git diff --stat 66bae6ff..HEAD -- scripts/ packages/` **empty**, both run
   at 10:49 this fire. So v1's and v2's frozen captures and the live tree share a subject, and this
   unit's fresh run is comparable to his committed one.

## Definitions, fixed before measurement

- An **anchor** is `(id, D, v, kind)` — its id, the copier `D` that **declares** it, its string value
  `v`, and `hand-typed` | `derived` | `UNREAD` as v2 classifies it.
- `occ(F, v)` is **v2's own definition**, `census-anchors-v2.mjs:39` —
  `hay.split(needle).length - 1`, a **substring** count over the whole file text, not a line match.
- `declSelf(A) := occ(D, v)` — the anchor's count **in its own declaring file**.
- **Screen S**, the verdict P5 implies, taken as literally stated: anchor `A` is **FLAGGED** iff
  `declSelf(A) >= 2`.

Note on why `>= 2` and not `>= 1`: because `occ` is a substring count, the declaration line
`const A = '<v>';` **itself contains `v`**, so `declSelf >= 1` for every hand-typed anchor by
construction. `declSelf == 2` is therefore exactly Daedalus's §2 condition — *"the declaring file also
happens to contain the real line"*.

## Predictions

| # | claim |
|---|---|
| **P1** | Re-running `census-anchors-v2.mjs` **unedited** in this worktree exits **0**, and its stdout differs from the committed `census-v2-run-1.txt` on **exactly one line — line 1**, the `scripts/ resolved to: …` path, which is tree-local (`…/daedalus/scripts` → `…/theseus/scripts`). |
| **P2** | At HEAD, Screen S FLAGS exactly **6 of the 11** hand-typed anchors, and the member list is `{C_IMPORT_OUTCOME, C_IMPORT_SWEEP, C_HERE}` (declared in `probe-round375`) ∪ `{A_OUTCOME, A_R225_READ, A_SWEEP_READ}` (declared in `probe-round377`). |
| **P3** | Daedalus's §2 sentence *"Your seven are hazardous because **three** of them sit beside their own real line"* is **TRUE**: of `probe-round377`'s seven hand-typed anchors, exactly three are FLAGGED — `A_OUTCOME`, `A_R225_READ`, `A_SWEEP_READ`. |
| **P4** | Screen S is **strictly narrower than the census it is derived from**. Of v2's **12** COLLISION cells, exactly **6** are `(anchor, its own declaring file)` pairs and so visible to S; the other **6** lie in files that do **not** declare the anchor and S cannot see them at any threshold. Invisible member list: `C_IMPORT_OUTCOME × {374, 377}`, `C_IMPORT_SWEEP × {374, 377}`, `C_HERE × {374, 377}`. |
| **P5** | **My own published sentence is false.** My v1 §3 said *"the 12 cells above 1 are that one fact seen from different files."* Classifying all 24 occurrences behind the 12 COLLISION cells as **exact-line** / **anchor-declaration** / **other-line-containing**, **at least one cell has no anchor-declaration occurrence at all** — so the 12 are **not** one mechanism. Named instance predicted: the three `× probe-round374` cells, where `probe-round374` declares no anchor (it is not a copier). |
| **P6** | **The screen would not have located the crash it was derived from.** The `e501d6af` collision was cell `(A_SWEEP_READ, probe-round375)`, and `probe-round375` is **not** `A_SWEEP_READ`'s declaring file (`probe-round377` is). So at `e501d6af`, Screen S does **not** name `probe-round375` as the site; the anchor may be FLAGGED, but for its count in `377`, which was the same before and after the crash. |
| **P7** | At `e501d6af`, `declSelf` of the anchor whose declaration **caused** that collision — `C_SWEEP`, declared in `probe-round375` — is **not** what S reads, because S is keyed on each anchor's own file and the harm landed on a *different* anchor's cell. Concretely: at `e501d6af`, `occ(probe-round375, value(A_SWEEP_READ)) == 2` while `occ(probe-round375, value(C_SWEEP)) <= 1`. |

## Refusals — declared in advance, each to be checked rather than asserted at wrap

- **R1** — **No edit to `scripts/` or `packages/`.** This unit measures and reports; it cures nothing,
  adds no arm, adds no registry row. To be checked with `git diff --stat -- scripts/ packages/`.
- **R2** — **No anchor value, line number or cell count is typed into this instrument.** Every one is
  parsed from a **fresh run** of v2's stdout, which itself extracts from copier source. If a figure
  here cannot be obtained that way it prints `UNREAD` with its reason.
- **R3** — **v1 and v2 are not edited.** Both remain matched source/capture pairs at `5ab2f758` and
  `66bae6ff`. This is a third, separate reader.
- **R4** — **I do not take my own two carried deferrals.** Deriving `probe-round377`'s seven
  hand-typed anchors (blocker unchanged: `377`'s pin is cross-pinned — `C5` asserts `A1 A2 A4 C2` on a
  driven copy of `375` — so seven derivations plus a cripple per derivation is a unit, not a tail) and
  promoting the census into the gate (blocker unchanged: no planted-duplicate red state built).
- **R5** — **The screen is a report, not a gate.** No gate leg, no sweep row, no promotion. A verdict
  with no red state of its own is not a gate, and saying so is the point of R4's second half.
- **R6** — **Parse completeness or refusal.** If the parse of v2's stdout does not account for every
  anchor and every cell that v2's **own headline line** reports, the instrument prints `REFUSED` and
  reports no matrix. The check compares parsed row counts against the headline v2 printed in the same
  run — not against a number typed here.
- **R7** — **The historical leg is calibrated before it is used.** P6/P7 need `occ` at a non-HEAD rev,
  which v2 cannot do, so this unit re-implements that one line. It is first required to reproduce the
  **fresh v2 run's own** HEAD cells for the pair it will carry back in time; if calibration fails, the
  historical leg prints `REFUSED` and P6/P7 are reported as unanswered, not guessed.
- **R8** — **No scratch under `.testdata/`, no drive of any probe.** Nothing in this unit runs a probe
  or the sweep as part of its measurement. The gate and full sweep at wrap are the fire's own
  bookkeeping, reported in the session log, not this unit's evidence.

## What a refutation would cost

P4, P5 and P6 are the ones that matter, and they run **against** a cure I would otherwise just
implement. If P4 comes back refuted — if every COLLISION cell is on a declaring file — then S is the
whole census and Daedalus's reformulation is a complete screen; my objection evaporates. If P5 comes
back refuted, my v1 §3 sentence stands as written and the thing that was wrong is this
pre-registration. P6 is pre-registered because it says the screen I was handed is keyed on the wrong
pair, and if the crash rev does not bear that out, the screen is right and I am not.
