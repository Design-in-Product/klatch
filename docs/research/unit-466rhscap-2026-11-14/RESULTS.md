# unit-466rhscap — results

**Seat:** Theseus. **Fire:** 2026-11-14 STOP. **Arms:** A (`drive1.arma.out`), B
(`drive2.armb.out`, plus the preserved crash `drive2-crash1.armb.{out,err}`).
**Subject pin:** `5966f86d`. **Answer-key rev:** `2694a13e`. **This fire's pin:** `e06c44d4`.

Both arms verdict **GREEN**. Arm A: 10 legs, 0 red, 6 predictions — 4 landed, 1 refuted, 1 prefused.
Arm B: 7 legs, 0 red, 5 predictions — **5 landed, 0 refuted**.

## The boarded question, answered

`unit-465p12site` boarded this, verbatim: *re-key the 11 declarations whose RHS hit the 4-line join
cap and re-run arm B, to establish whether the 2 unbound `RESOLVED` sites are genuinely unbound or
lost a chain member to the cap.*

**They are genuinely unbound. The cap is not merely un-implicated for those two — it is inert across
the entire measurement.** Three figures, all from `drive2.armb.out`:

| leg | figure |
|---|---|
| `B3` | sites compared under both keys **7** (`RESOLVED` 4) · chains that changed **0** · bound verdicts that moved **0** |
| `B4` | cap-hit declarations **11** · appearing in **no** chain of **any** site: **11** · in at least one: **0** |
| `B5` | corrected `P12` **2 of 20** under `K-cap` *and* **2 of 20** under `K-bal`, membership identical to the recording's |

So `K-bal`'s promotion is **DECLINED**, printed by the arm rather than argued in prose: it moves
nothing on this question, and it carries a cost the cap does not (below).

## The baseline was matched, not assumed

The whole delta is worthless if the re-implemented `K-cap` is not arm B's. It is, exactly:

- `A2`: cap-hit count **11 vs 11**.
- `A3`: all four `B3` figures, **7/4/2/4 vs 7/4/2/4**.

Both were written as **gates**, and every later prediction in arm A is guarded on
`baselineMatched` so that a broken baseline prefuses rather than quietly publishing a delta against
the wrong thing. The figures on the right of those comparisons are **captured by regex out of
`2694a13e:…/drive2.armb.out`** — the sole commit that has ever touched either arm B or its recording
(`git log --format=%H --` over each: one line, the same hash). Nothing in either arm hand-types `11`,
`7`, `4` or `2 of 20`.

## What the declared limit actually was: a true count with zero reach

Arm B of `unit-465p12site` printed its cap as an honest declared limit — *"11 RHS joins hit the
4-line cap without reaching a `;`, so a chain member could be missed."* The count was right. The
hazard it names had **no reach at all**: `B4` finds that **11 of 11** of those declarations appear in
no chain of any site in the measurement. `chainOf` only ever walks declarations reachable from a
loop identifier, and all 11 cap hits are module-level fixture tables (`ROWS`, `SENTENCES`,
`CANDIDATES`, `HAND`, `SHAPES`, `sep`) plus one helper (`driveFile`) — none of them on a derivation
path from any bare-skip site's loop.

That is a pattern worth naming, because this corpus publishes declared limits in exactly this form
and I write them myself: **a declared limit states a count and implies a reach, and a reader cannot
tell them apart.** "11 joins hit the cap, so a chain member could be missed" reads as *up to 11
chain members may be missing*. The true reading was *0*. The count is not the measurement; the
intersection with the thing being measured is. A declared limit should either carry its reach or say
it was not measured — and this one, mine, did neither.

## My own defect: arm A refuted a true prediction against a display string

Arm A's `A7` printed, in one line, `members DIFFER` **and** `P12 membership unchanged`. Those cannot
both be about the measurement, and the one that was wrong was mine. `B5` in the recording prints its
members through `p.replace('docs/research/', '')` — a **display** transform. Arm A compared that
printed list against `CAP.p12Members`, which holds the **join key**: the full repo-relative path. So
`P5` came back **REFUTED** on a prefix, not on a fact.

Arm B does not re-explain this; it **asserts** the diagnosis. `B2` requires all three of: the raw
comparison **fails**, the basename comparison **agrees**, and the prefix-lifted comparison
**agrees**. Only the prefix can satisfy that conjunction, and it does — `exactly the prefix, nothing
else`. `Q1` and `Q2` landed. The corrected verdict on `P5` is that it **held**.

Arm A is not edited and not re-driven. `drive1.arma.out` stands verbatim with `members DIFFER` and
`REFUTED P5` in it, for the same reason unit-465's arm A was left standing with its wrong key: the
defect is the evidence.

The leg form matters here and is deliberate: `B2`'s red depends on the raw comparison *failing*,
which is a leg asserting the defect — ordinarily the shape that reddens on its own cure. It is safe
only because the artefact it reads is **frozen at `2694a13e`**, not live. If anyone ever re-drives
unit-465's arm B, `B2` must be re-pinned rather than re-run.

## The re-key's own price, measured rather than waved at

Pre-registered before the arm existed: balance-based termination buys a failure mode the cap does
not have — a function-bodied RHS terminates at the `;` *after the whole body*, so the "chain" then
contains every declared identifier mentioned anywhere inside it. That is proximity, not derivation,
and it can bind a site **spuriously**.

Measured (`A5`, `A8`): over the bare-skip-bearing files, `K-bal` reads **354** declarations, of which
**22 (6.2%)** are function-bodied; longest spans `[42, 27, 26, 25, 22]` lines; **0** declarations hit
the 400-line safety bound, so there is no silent truncation hiding in the result. **0** sites bind
under `K-bal` but not `K-cap`, which is why `P6` prefused rather than landing — correctly: it was
written as a conditional on a newly-bound site existing, and none does.

Of the 11 cap hits, **exactly 1** is function-bodied (`driveFile@339`, 8 lines) — `P3` landed on a
margin of one. So the cap was mostly truncating long *data* literals, not function bodies: the
longest, `HAND@120`, spans **42** lines under `K-bal` against the cap's 4.

## Grading

**Arm A — 6 predictions: 4 landed, 1 refuted, 1 prefused.**

| id | outcome | note |
|---|---|---|
| `P1` | LANDED | 11 vs 11 |
| `P2` | LANDED | 7/4/2/4 exactly |
| `P3` | LANDED | 1 of 11 function-bodied — a margin of one |
| `P4` | LANDED | 0 cap-hit declarations in either named site's chain |
| `P5` | **REFUTED, and the refutation was wrong** | refuted on the display prefix; `Q1` re-decides it as held |
| `P6` | PREFUSED | conditional on a newly-bound site; there are none |

**Arm B — 5 predictions, all 5 landed:** `Q1` (the refutation was my artefact), `Q2` (the prefix is
the sole cause), `Q3` (0 of 4 chains changed), `Q4` (11 of 11 cap hits in no chain), `Q5` (`P12` = 2
of 20 either way, promotion declined).

**Worth discounting:** `P1` and `P2` are reproduction floors, not discoveries — they were written to
be able to go red, and their landing is what licenses the rest rather than being a result. `Q5`
largely restates `Q3` once `Q3` holds. The three that carry weight are `Q4` (the declared limit's
reach is zero), `Q1`/`Q2` (my own refutation was an artefact), and `P4` (the boarded question).

## Drive record, including the crash

`drive2.armb.out` is the second drive of arm B. The **first** crashed before any leg printed —
`CAP.p12Members.map(basename)` hands `basename` the array index as its `suffix` argument and throws
`ERR_INVALID_ARG_TYPE`. It is kept as `drive2-crash1.armb.{out,err}` rather than overwritten, and the
fix carries a comment naming it, because a crash recording with **no `VERDICT` line** is the only
thing that distinguishes "the arm ran and went red" from "the arm never ran." Both recordings are
committed. `drive1.arma.err` and `drive2.armb.err` are **0 bytes**.

## Boarded out of this unit

**Unblocked, either seat — `docs/research/` is a display transform appearing in dozens of these
arms' print paths.** Census how many published member lists in the `docs/research/unit-*` and
`round*-instruments` corpus are printed through a path-stripping transform while the same arm's
comparisons use the unstripped join key. This unit found one such comparison and it published a
false REFUTED; the mechanism is not specific to this arm, and a count-agreeing/membership-differing
pair is the hardest version to notice because the headline number is right.

**Unblocked, either seat — the declared-limit reach question, generalised.** `B4`'s shape
(intersect the declared limit's population with the population actually measured) is three lines of
code and applies to every `declared limit` line this corpus prints. Worth a sweep-level reader:
which declared limits have ever had their reach measured, and which merely state a count.

**Not promoted, deliberately.** `K-bal` goes nowhere. It is in this unit's arms only, and `B5`
prints the declined promotion so that no later reader mistakes its existence for an endorsement.

**No deferral without a named blocker.** Nothing in this unit is left blocked; the two items above
need no other seat's output and no server, and are offered to whichever seat reaches them first.
