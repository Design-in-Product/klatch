# unit-465bareline — RESULTS

**Seat:** Daedalus. **Fire:** 2026-11-12 START. **`date`-reads:** 09:20:33 (pre-registration),
09:24:44 (results). Pre-registration `97a52196`, **pushed to `origin/main` before the arm existed**.

Arm: `arm-bareline.mts`. Recording: `recording-bareline.txt` (verbatim child output).
**Apparatus: all checks passed. Predictions: 4 held, 1 refuted of 5.** The exit code tracks the
apparatus only — a refuted prediction is a result, and conjoining the two would have made a
discovery indistinguishable from a broken instrument.

## Headline

**The blindness my task list carries forward was cured by the change of form — and the half I
predicted was still blind is also mostly covered, but by accident, at 7 of 8.**

`daedalus-tasks.md:96` carried, as a blindness to pass forward: *"the screen sees added
**declarations**, and `once()`'s hazard is broken just as well by a duplicate **bare line**, on which
the screen is silent."* That was measured in `unit-465plant` LEG 8 against **my** screen, a two-rev
delta keyed on *added declarations*. Argus promoted a **static** form. **The sentence does not survive
the change of form:** the static screen re-enumerates every declaration and counts occurrences over
the whole file, so a bare line that duplicates an anchor's value raises that anchor's `occ` and is
flagged — with no new declaration anywhere (`A1c`).

## Per prediction, measured over predicted

| | prediction | outcome |
|---|---|---|
| **P1** | a comment-planted bare duplicate of an `occ==1` consumed anchor's value, in its own declaring file, is **flagged** | **HELD.** `R373_SANDBOX_DECL` (`probe-round374:219`) `occ 1 → 2`, flagged, file's flags `3 → 4`, **no declaration added** (`A1c`). `A4d`: the flag is **NEW** against the baseline, so the gate would **redden**. |
| **P2** | the same plant into a **different** population file adds **no flag anywhere** | **REFUTED.** `9 → 10`. See below — this is the unit's finding. |
| **P3** | at least one consumed anchor sits at `occ == 1`, so P1 is measurable on a real member | **HELD**, 8 of them. |
| **P4** | a bare-line plant on an **already-flagged** anchor stays **grandfathered**, gate green | **HELD.** `R373_IMPORT_OUTCOME` `occ 2 → 3`, key is `(file, name, value)` and `occ` is not in it. **Not a missed hazard** — the anchor was already non-unique, so no new hazard was created. Recorded as a bound on P1, not a second finding. |
| **P5** | the `occ == 1` figure is **unreported** by the subject today | **HELD.** Its `F1` line reports flags (`occ >= 2`) only. |

## P2, refuted — and the reason is better than the prediction

Planting `R373_SANDBOX_DECL`'s value as a comment into `probe-round375` flagged **`C_SANDBOX` in
`probe-round375`** (`A3c`), because **`probe-round375` declares its own anchor with the same value**
(`A3d`, measured, not inferred). The mechanism is the copier family itself: these three files are
copy-paste siblings, so the same anchor *value* is declared in more than one of them. A duplicate
landing in a sibling raises `occ` on **the sibling's own co-valued declaration**, and the
declaring-file key catches it there.

**So the cross-file case is covered — and covered by incidental geometry, not by design.** `A3f`
isolates the real blindness by construction: a value **exclusive to its own file**, planted into a
sibling, adds **no flag** (`9 → 9`). The declaring-file key is genuinely blind there, exactly as the
subject's own docblock (`:10-22`) says.

**`A3e` prices how much of the population that leaves: of the 8 consumed `occ==1` anchors, exactly
1 has a value appearing in no other population file.** So **7 of 8** would be caught by a
cross-file plant too, incidentally. **That figure is a count over 8, not a rate with authority**, and
it is a property of *today's* copier family: it collapses toward 1 of 8 the moment a copier stops
sharing header text with its siblings. This is the same "load-bearing by incidental geometry" shape
I measured on a sibling guard on 11/11 (`unit-465fixture` §A2) and that Argus credited in his
docblock — here it is quantified rather than named.

## Three figures, kept apart (R8) — and none of them is a rate

- **17** `once()`-consumed literal anchors in the live population (`P3a`)
- **8** of those at `occ == 1` (`P3b`) — the population one duplicate away from flagging
- **9** at `occ >= 2`, i.e. flagged; agrees with the shipped `F1` line **read off the child** (`P5a`)

**These do not join to Theseus's 11-anchor census population** (`unit-465recall`, 11/10). That
population is the census's anchor list; this is every literal declaration in three files that reaches
`once(`. Different keys, different denominators, no figure computed across them.

## What this does NOT claim

- Not the **target-keyed** screen (`occ(target, v) !== 1`). Still unbuilt, still unclaimed by either
  seat — Theseus's 11/10 §5 close and Argus's docblock `:22` both say so, and this unit does not
  change that.
- **Argus's docblock is not false and I am not reporting a defect in it.** `:10-22` states the
  declaring-file surrogate and names the coincidence it rests on. This unit measures the coincidence
  (`7 of 8`) and cures nothing in his file. **Nothing under `scripts/` or `packages/` was touched —
  `git diff --stat` read empty inside the arm (`R1`), printed rather than asserted.**

## Refusals, read back

- **R1** `git diff --stat -- scripts packages` → `""`, read **inside** the arm at the end of the run.
- **R2** reader **sliced** out of the subject at run time, 9851 B / 229 lines; both span markers
  asserted to occur **exactly once** (`S1`/`S2`), and the arm **refuses and exits 1** before
  reporting any figure if either fails. Four bindings recovered and type-checked callable (`S5`).
- **R3** victim anchor name, value, line and `occ` all **read off the live file** by the sliced
  reader (`A0`), never typed into the arm.
- **R4** not reached — P3 measured 8, so P1 ran on a real member. No declaration was planted.
- **R5** the shipped leg's exit code read **off the child** via `spawnSync` (`P0`, `rc=0`), and the
  population grounded on **its own `B1` line** rather than my re-typed filter (`P1b`, 3 vs 3).
- **R6** nothing promoted into `scripts/`; no edit to Argus's file. The one prose consequence is
  **routed by memo**.
- **R7** honoured by the table above: P2 is recorded as refuted, in its own section, as the finding.
- **R8** three figures above, kept apart, no rate.

## Consequences

1. **`daedalus-tasks.md:96` must be split, not closed.** The in-declaring-file half is **cured by the
   promoted form** and is live prose about a defect that no longer exists in the shipped screen. The
   cross-file half stands and is the subject's own named target-keyed blindness — now with a measured
   price (`1 of 8` exclusive today, `7 of 8` covered by sibling coincidence).
2. **Routed to Argus, his call, not applied:** his `F1` line reports `occ >= 2` only, so the **8 at
   `occ == 1`** — the set one duplicate away from reddening his gate — is unreported on every run. A
   `[MEAS]` line for it would make the near-miss population visible. Not a defect; an unreported
   denominator.
3. **Two task-list lines were stale before this unit and are closed by it** — see the task-list diff
   in this fire's commit: the gate-leg promotion (`:94`) shipped as Argus's `b942aa49` on 11/11, and
   the recall-figure join (`:97`) was built by Theseus as `unit-465recall-2026-11-10`. Both lines
   still read as open unblocked work this morning.
