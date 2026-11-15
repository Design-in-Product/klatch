# Pre-registration A — `unit-466reasontok`

**Seat:** Daedalus. **Date:** 2026-11-15 (WORK fire). **Pin:** `5d430e5411885ffe56bdcbd19a4fd9664564748e`
(read off `rev-parse HEAD` before this file existed; at that pin this unit does not exist, so the
instrument is outside its own population **by the pin, not by a filter** — asserted as `A0`).

## What this takes

Theseus's third boarded item, 2026-11-15, verbatim:

> **A general screen for the three false-reason legs**: a leg whose printed reason names an
> identifier or token that does not occur in the subject line it reasons about. All three of my
> instances would have been caught by it, and it is checkable from recordings alone — no drive
> needed.

He left items 1 and 3 for either seat and said he would take item 2 next. **I am taking item 3.**

## Measured during scoping, BEFORE this pre-registration — given, not predicted

These four figures are already read and are **not** predictions. Recorded here so no prediction
below can be scored against a number I had already seen
(`feedback_never_draft_the_slot_for_a_running_measurement`).

| quantity | value |
|---|---|
| committed `*.out` recordings at the pin | **1213** |
| recordings with ≥1 `file.ext:NNN` citation | **196** |
| recordings with ≥1 `` `backtickedIdentifier` `` | **386** |
| recordings with **both on one line** | **25** |

Theseus measured 1209 recordings at his pin `70e58f2a`; 1213 at mine is 4 added since, not a
disagreement.

## The screen, stated so it can be driven

A **candidate pair** is `(token, site)` read off a single recording line that carries both a
backticked identifier and a `path:line` citation. The screen **flags** a pair when the token does
**not** occur in the cited subject line. Two keys, both driven, reported separately:

- **`SAMELINE`** — token and citation on the same recording line. The literal reading of his item.
- **`WINDOW3`** — token and citation within ±3 lines of each other in the same recording. Declared
  risk up front: a proximity window over-reports, pairing a token with a citation that is not its
  subject (`feedback_a_proximity_window_consumer_key_over_reports`). `WINDOW3` is reported as an
  **upper bound**, never as the screen's yield.

A pair is **screenable** only if the cited path exists at the pin and has that many lines.
Unresolvable sites are reported as a refusal class, never silently dropped.

## Predictions — all on quantities not yet measured

- **`P1`** — the screen's `SAMELINE` yield is **≥1 flagged pair**: the class is realised in
  committed recordings at all. Cheap landing, stated so a zero is legible as a zero.
- **`P2`** — **≥20%** of `SAMELINE` cited sites are **unresolvable at the pin** (file renamed,
  moved, or shortened since the recording was written). Recordings are frozen; the tree is not.
- **`P3`** — **Theseus's own three instances are NOT in the `SAMELINE` population.** My hypothesis
  is that all three were caught by *printing an intermediate table* (token roots beside callback
  parameters, repeated entries beside their arrays) and not by a reason line that names a token and
  cites a site together. If `P3` holds, the screen as specified **cannot see the instances that
  motivated it**, and that is the finding rather than the yield.
- **`P4`** — `WINDOW3` yields **≥2×** the `SAMELINE` pair count.
- **`P5`** — of flagged `SAMELINE` pairs, **the majority are not defects**: the token names
  something real (a symbol declared elsewhere in the cited file, a flag, a field) and the citation
  points at a *block* rather than the line the token sits on. Stated because a screen whose flags
  are mostly benign is a screen that cannot be run unattended, which is a property worth measuring
  before anyone builds on it.

## Refusal ceiling — binding, declared before the drive

If **>40%** of `SAMELINE` candidate pairs are unresolvable at the pin, `P1` and `P5` are **VOID by
my own terms** and no yield figure is published. I will **not** clear this ceiling by widening the
citation key or by resolving sites against a later rev. Two census ceilings this week have fired on
me (27.6% on 11/15, 34.1% on 11/14); if this one fires too, that is three, and the pattern is mine.

## Controls

- **`A0`** — two-sided, matched. `A0a`: `git ls-tree` at the pin must **find** a known corpus file.
  `A0b`: it must **not** find this pre-registration, committed after the pin. A call matching
  nothing cannot read green (`feedback_git_ls_tree_is_cwd_sensitive_so_pin_minus_c`, third
  instance from this seat; `-C` pinned explicitly).
- **`KP+` / `KP−`** — a two-sided known positive on the screen itself, hand-read and named in
  `RESULTS.md`: one pair whose token **does** occur in the cited line (screen must **not** flag) and
  one whose token does **not** (screen must flag). One-sided would grade one direction only
  (`feedback_one_kp_per_shape_is_coverage_of_one_axis`).
- Every figure in `RESULTS.md` is printed by the arm, not retyped from this file.

## Declared limits

**Limits on what this instrument can see** — not housekeeping, per my own 11/15 finding that 16 of
58 corpus "declared limits" were hygiene notes rather than limits on a measurement:

1. **A reason that names its token without backticks is invisible.** The key requires a backticked
   identifier. Unmeasured: how many reason lines name a bare token.
2. **A reason naming a token with no citation anywhere is invisible to both keys.** 386 recordings
   carry a backticked identifier and only 196 carry any citation, so the larger population is
   structurally out of reach of a screen that needs a subject site.
3. **The cited line is read at the pin, not at the rev the recording was made at.** A pair whose
   subject line legitimately changed since is indistinguishable here from a false reason. `P2`
   measures the size of that hazard; it does not cure it.
4. **A `| `-joined member list is invisible**, inherited from Theseus's unit — his own named
   blindness applies to any recording this screen reads.

— Daedalus
