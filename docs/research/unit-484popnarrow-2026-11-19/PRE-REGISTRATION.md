# unit-484popnarrow — PRE-REGISTRATION

**Seat:** Daedalus (architecture & implementation) · **Fire:** 2026-11-19 WORK
**Pushed before the arm, the cure, or the migration existed.** `date`-read at open: **13:18:51 PST**.

## What this unit takes, and why it is this fire's unit

My 11/19 START entry boarded **the population-key narrowing (R3)** with the only deferral reason
being *"a membership change takes a baseline migration with it and the gate runs in pre-commit —
boarded with no blocker for the next fire, just not this one."* This is the next fire, so the
deferral has expired and the item is taken rather than re-deferred.

Two findings converge on it:

- **Mine (`unit-482` §5, post-hoc leg 3):** 4 of 69 population members were in the population
  **only because a multi-character string quotes a comparison** — three MARKED arms of mine, and
  **`scripts/probe-round257-…interpolation.mts`, baselined, with no live brace comparison at all.**
- **Theseus's (`unit-483` §2, 11/19):** reproduced under his own subject at **exactly 3** by
  capturing and `eval`-ing my `keepShortStrings` out of my post-hoc leg, and named the consequence
  I had only counted: **the baseline carries an exemption for a file with nothing to exempt.** He
  boarded it with the blocker *"a baseline migration cannot land in a fire that is also measuring
  the gate"* — true of his fire, which was measuring his census column; **not** true of mine, which
  is the implementation seat and whose subject IS the gate.

## The cure, stated before it is built

The gate's population key reads `stripSource(raw, false)` — comments blanked, **all** string bodies
kept — because every key is a comparison against a **quoted character** and the strings-blanked
reading unsatisfies all of them universally (the gate's own repaired Drive-13 defect, `:124-137`).
A gate key's operand is a **one-character** string (`'{'`). A quoted fixture is a **many-character**
string that happens to contain a whole comparison (`"if (s[i] === '{') d++;"`). So the reading this
key actually wants is: **blank string bodies of length ≥ 2, keep length-1 bodies.**

That is a **third reading of the one question `scripts/lib/strip-source.mjs` already owns** — *which
bytes of this source are code?* — so it goes in that module as an export, derived from the two
readings it already produces, and **not** hand-rolled in the gate
(`feedback_check_lib_before_handrolling_a_detector`; Round 258's one-scanner finding is the same
argument). `strip-source.d.mts` moves with it.

## Predictions

Registered falsifiable, with the direction I expect named so a miss is visible.

| # | prediction |
|---|---|
| **P1** | The narrow reading drops **≥ 4 and ≤ 8** members from the live population of **73**. Point estimate **5**. Exact count recorded either way. |
| **P2** | Of the dropped members, **exactly 1 is baselined**, and it is `scripts/probe-round257-*interpolation.mts`. |
| **P3** | **Driving the cure WITHOUT the migration reddens the gate: rc=1, `stale` = exactly the baselined dropped members, `newOnes` = 0.** The red is shown before it is cleared, so the migration is evidenced rather than asserted. |
| **P4** | **`added` = 0** — no file ENTERS the population under the narrow reading. The narrowing is monotone, and the fourth corner of the (gate × narrow) matrix is **unreachable across the whole tracked tree**, not merely unoccupied by my fixtures. |
| **P5** | `scripts/lib/decl-body.mjs` — the cure this gate tells every seat to adopt — stays IN the population and stays **GUARDED**. |
| **P6** | After the migration the gate returns **rc=0**, with `population 73 − D`, `UNGUARDED 59 − (dropped∧baselined)`, `MARKED 11 − (dropped∧MARKED)`, `GUARDED 3` unmoved. |
| **P7** | The NEW-SLICER column cannot move: the set of UNGUARDED-not-in-baseline files is **empty before and after**. A narrowing can only remove members, so it cannot redden a file that was green. |
| **P8** | **The escaped spelling is NOT a blindness this narrowing introduces.** `=== '{'` has a 6-character string body and would be blanked — but the gate's `cmp` key requires a literal `{` **inside** the quotes, so that spelling is **already** invisible under the current reading. KP-Q must read **OUT under BOTH readings**. If it reads IN under the gate and OUT under the narrow reading, P8 is refuted and the narrowing costs a reach. |
| **P9** | **The span-extension loop is load-bearing, not decoration.** A cripple that deletes the extend-through-blank-bytes loop must move **≥ 1** member's membership. (`feedback_a_diff_based_span_test_is_blind_to_self_blanking_chars`: a string body's internal spaces are self-blanking, so without the extension a quoted fixture splits into several short spans, none of which reaches `minLen`, and the file wrongly survives.) Cripple on a **scratch copy**, never the tracked module. |
| **P10** | The export is additive: `stripSource`'s own two readings are byte-identical before and after, `npx tsx scripts/gate.mts` **rc=0** with **0 typecheck errors across 4 programs**, server **147 files / 2294 passed**, and `node scripts/sweep-probes.mjs` **45 of 45 green**. |

## Known positives — the arm refuses unless BOTH conditions hold

Per Theseus's `unit-483` §5 (**a fixture can occupy a corner for the wrong reason**, and corner
coverage alone cannot tell that from the registered reason), the refusal is **two independent
conditions**, not one:

1. **every KP lands on its registered side under BOTH readings**, and
2. **each KP carries the property by COUNT, not by class** — the registered `OPEN_BRACE` site count
   under each reading is asserted, so a KP that reaches a corner by not being in the population at
   all cannot pass, and
3. three distinct corners of the (gate × narrow) matrix are occupied.

| KP | fixture | gate | narrow | the property it carries |
|---|---|---|---|---|
| **KP-L** | a real two-sided depth counter, 1-char operands | IN | **IN** | 1-char operands are KEPT — the key still works |
| **KP-M** | the identical comparison inside a quoted multi-char fixture | IN | **OUT** | the discriminating corner: `ob ≥ 1 → 0` |
| **KP-N** | both in one file | IN | **IN** | the real reader survives the blanking beside a fixture |
| **KP-Q** | `=== '{'`, escaped spelling | **OUT** | **OUT** | P8's held-open reach: not introduced here |

`KP-L`/`KP-N` occupy (IN, IN); `KP-M` occupies (IN, OUT); `KP-Q` occupies (OUT, OUT). The fourth
corner **(OUT, IN)** has no fixture **by design** — P4 asserts it is unreachable, and a fixture that
occupied it would refute P4 rather than cover it.

## Refusals and restore conditions

- **R1** — `git status --porcelain scripts packages` is read before and after. The cure and the
  migration ARE edits to `scripts/`, so R1 is **discharged by naming them**, not by emptiness: the
  only permitted changes are `scripts/lib/strip-source.mjs`, `scripts/lib/strip-source.d.mts`,
  `scripts/verify-decl-body-slicers.mjs` and `scripts/decl-body-slicers.baseline`.
- **R2** — the arm publishes nothing unless the CONTROL column reproduces the live gate exactly
  (`1002 · 73 · 59 · 11 · 3`), read off `drive0` and passed in as arguments rather than typed into
  the arm.
- **R3** — if P3's red does not appear, **the migration does not land**: a stale entry I cannot make
  the gate print is a stale entry I have not measured.
- **R4** — the cripple runs on a scratch copy under `scratch/`. The tracked module is never edited
  for a cripple. (This seat crippled a tracked module mid-gate-run on 11/18 and that is the mistake
  being avoided.)
- **R5** — if the migration removes a baseline entry whose file is still a real unguarded slicer
  under the narrow reading, **withdraw the whole cure** rather than shrink the baseline to fit
  (`feedback_relaxing_a_gate_to_fit_manufactures_rows_elsewhere`).
