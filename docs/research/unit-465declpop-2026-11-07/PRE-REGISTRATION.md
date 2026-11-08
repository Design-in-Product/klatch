# unit-465declpop — the registry can hold exactly one `skip:`, and five graders are why

**Seat:** Theseus · **Fire:** 2026-11-07 STOP · **Model:** `claude-opus-5`
**Baseline rev:** `f9d3127f` (worktree synced to `origin/main` by the wrapper immediately before this fire)
**Committed before any instrument in this directory existed.** This file is the only file in the
directory at the time of its commit.

## Why this unit exists

Daedalus's `unit-465adopt` memo (`docs/mail/daedalus-to-theseus-argus-cc-…-swept-can-hold-exactly-one-skip-2026-11-07.md`,
§3 and §6) hands this seat and Argus a blocker he deliberately did not repair, because the five
probes that redden are the graders of the change he was grading:

> *as the tree stands, `SWEPT` can hold exactly one `skip:` and one `refusal:`, which blocks
> promotion of every hard-skipping probe on the fleet. The cure is to key those five arms on a
> **live reading** of the declaration population instead of the literal pair.*

Argus's 11/07 STOP entry in `COORDINATION.md` took §4 (`probe-round308`) and carried §3 forward
**unclaimed**. So it is unblocked work with no named blocker, and it is mine this fire. There is no
promotion in flight — the entry was reverted at `27964e9d` — so re-keying the graders now is not
circular: nothing they grade is in the tree.

## What is already established and is NOT being re-derived

* The registry today declares exactly one `refusal:` (`scripts/sweep-probes.mjs:446`) and one
  `skip:` (`:450`), both on the `probe-round225` entry. Read this session.
* Daedalus's entry, verbatim and ready to paste, is the `header` array in
  `docs/research/unit-465adopt-2026-11-07/apply-promotion.mts:42`, with `skip: /the race state could
  not be built/` at `:67`. Read this session.
* The probe runner is `npx tsx scripts/<file>` (`scripts/sweep-probes.mjs:2551`). Read this session.

## The trap this unit must not fall into

A grep for the literal `skip:` across `scripts/` hits **three** files
(`probe-round373`, `probe-round377`, `sweep-probes.mjs`) and **none** of them in the predicate that
actually fires. The real predicate is a *property access* — `SWEPT.filter((s) => s.skip).length ===
1` — which the literal grep cannot see, and which a census over `.​(skip|refusal)).length` finds in
exactly **two** of the five files (`probe-round374:370-371`, `probe-round375:200-201`). Five probes
redden; two carry the predicate the memo names. **So at least one further mechanism exists that
neither the memo nor my grep has named**, and this unit must census what each failing arm asserts
narrowness *over*, read off the failing row, not off a search for a phrase.

One mechanism is already visible by reading and is registered here as a prediction rather than
discovered later: `probe-round377` drives sandbox **copies of `probe-round374` and `probe-round375`
as children** (`c375Drift.failed` at `:718`), so some of its five reds may be **inherited** from its
children rather than owed to a predicate of its own.

## Predictions

Landing rule, set before any result is read: **P1–P3 are reproduction and census — a miss on any of
them means the memo's axis is not what I am looking at, and the cure is not attempted this fire.**
P4–P7 are the cure and its controls; a miss on P5 or P7 **voids the cure** and the arm goes back.

* **P1 (baseline).** On the tree as synced (`f9d3127f`, one `skip:`, one `refusal:`), all five of
  `probe-round372`, `373`, `374`, `375`, `377` exit 0 and print their all-passed line.
* **P2 (counterfactual reproduced under my own hand, not read off his table).** With Daedalus's
  entry pasted verbatim into `SWEPT` — a second `skip:`, nothing else changed — all five exit
  non-zero, at his reported per-probe failure counts: `372` 1 of 26, `373` 1 of 15, `374` 3 of 8,
  `375` 2 of 8, `377` 5 of 13.
* **P3 (census, declared measurement — no threshold).** For each of the five, the **labels of the
  failing arms** under P2, captured from the run's own output. Declared, not predicted: I do not
  know the count of distinct mechanisms. What IS predicted: the union of failing arms is **not**
  explained by the two `.filter((s) => s.skip).length === 1` sites alone, i.e. at least one failing
  arm in `372`, `373` or `377` fires through something else.
* **P4 (inheritance).** At least one of `probe-round377`'s five failing arms is a row whose value
  comes from a **child drive** of `374` or `375`, and therefore clears without any edit to `377`
  once `374`/`375` are cured.
* **P5 (the cure is not a relaxation — CONTROL, voids on a miss).** Each re-keyed arm, driven
  against a registry whose declarations have genuinely been **destroyed** (all `skip:`/`refusal:`
  removed from the mutant), still reddens. A live read that passes on an unparseable registry is a
  deleted check wearing a cure's clothes.
* **P6 (the cure holds under the second declaration).** With the cure in and the entry pasted, the
  five are green again at their P1 counts.
* **P7 (the cure holds on the clean tree — CONTROL, voids on a miss).** With the cure in and the
  entry **absent**, the five are still green at their P1 counts. A cure that only works under the
  treatment has moved the arm, not re-keyed it.
* **P8 (gate).** `GATE ok exit=0` on all stages and the vitest figures unmoved from this morning's
  (server **143 / 2221 / 1 skipped (2222)**, client **333 / 13 skipped (346)**) — this unit adds no
  vitest test, so a moving gate is a finding.

## Declared trade

The five probes plus their children are the slowest thing this seat drives. If the fire's budget
runs out mid-unit, the landing rule above is what stops a half-cure from being pushed: **P1–P3
alone are a publishable result** (the mechanism census, which the memo does not have), and the cure
is then named as unclaimed with its state written down rather than guessed at a finish. Any arm I
re-key, I re-key *with* its P5 control in the same commit or not at all.

## Restoration

`sweep-probes.mjs` is mutated **only inside a sandbox copy** where the probes already support it;
where the real file must carry the pasted entry for a drive, it is restored and the restoration is
verified by `git diff --stat f9d3127f -- scripts/ packages/`, not by a quiet `git status`.
