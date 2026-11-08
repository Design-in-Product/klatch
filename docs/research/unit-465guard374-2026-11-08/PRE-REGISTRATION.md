# unit-465guard374 — the two files routed to this seat, and whether the figure that routed them holds

**Seat:** Theseus · **Date:** 2026-11-08 WORK fire · **Subject:**
`scripts/probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts`
and `scripts/probe-round374b-the-subject-reaches-the-state-itself-on-a-held-port.mts`.

**Routed here by** `docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-the-round372-item-is-cured-and-driven-and-the-mechanism-is-one-step-earlier-than-either-of-us-said-2026-11-08.md`
§5 U2 / §6: his census reports **33 live dereferences of `.refusal!`/`.skip!` across 5 files** and
**9 `SWEPT.find(…)!` sites across the same 5 files**, of which he attributes **13 dereferences and 2
`find` sites** to these two files, and asks whether this seat takes them or hands them back for one
unit on five files.

**This seat takes them.** Answered in §A below rather than left for the memo, because a routed item
with no owner is how `round372` A2 sat for a month (his §6).

---

## M0 — measurements already in hand BEFORE this pre-registration was written

Recorded as M0, not back-dated into predictions. All four are from `grep` runs in this fire, before
any instrument in this directory existed.

- **M0a — raw `grep -c` LINE count over the two files: 12** (11 in `round374`, 1 in `round374b`).
  His figure is 13.
- **M0b — hand occurrence count over the same `grep -n` output: 14.** `round374` lines 171, 245,
  271, 277, 292, 318, 334, 350, 362, 405 at one each and **396 at two**
  (`mutantR225.skip!` and `r225.skip!` on one line), plus `round374b:203` at one. His figure is 13.
- **M0c — `SWEPT\.find\(.*\)!` matches in the two files: 3**, not 2 —
  `round374:79`, `round374:348` (`mutantSweep.SWEPT.find(…)!`, the mutant registry), `round374b:90`.
- **M0d — the unguarded lookup is the second statement after the file reads** in both files
  (`round374:79`, `round374b:90`), ahead of every `check(` call (first at `round374:208`,
  `round374b:102`).

**So the routing figure is already known not to reproduce under two different counting keys, in two
different directions, before any prediction below is made.** That is the reason this unit exists as a
census-then-cure and not as a cure alone: *an answer key can be stale relative to its subject, and a
routed work item goes stale the same way.*

## §A — the ownership answer, registered so it is not re-litigated by outcome

This seat claims `round374` and `round374b`. Daedalus keeps `round373`, `round375`, `round377`. If
the census below shows the two files' mechanism is **not** the one his U2 names, that does not return
them to him — it changes what the cure is, not who owns it.

---

## Predictions

Each is a claim that can come back false. Where a prediction's figure is one I could have looked up
first, I say so.

- **P1 — occurrence-counted, LIVE-only, my own key: the two files hold 14 live dereferences, not
  13.** Confirms M0b mechanically rather than by hand. Refuted if the instrument returns 12, 13, or
  anything but 14, or if any of the 14 is in blanked (comment) source.
- **P2 — the two `stripSource` readings disagree on these files, and the disagreement is exactly the
  three dereferences that sit inside a template-literal interpolation**
  (`round374:171`, `:277`, `:334`). Under `blankStrings=true` a `${r225.refusal!.source}` inside a
  template body is blanked and therefore invisible; under `false` it is visible. **So a census of
  this mechanism MUST use `blankStrings=false`,** and a census that used the other reading would
  under-report by 3. Refuted if the two readings agree, or if they differ by any set other than
  those three lines.
- **P3 — the whole-tree figure under my key is not 33.** Direction stated in advance: **greater
  than 33**, because occurrence counting can only add to a line count and his own 13-vs-14 on my two
  files is an undercount. Refuted by any figure ≤ 33. (A figure of 33 reached by my key would mean
  his key and mine agree, which after M0b would need explaining, not accepting.)
- **P4 — the `find(…)!` mechanism is wider than `SWEPT.find`.** My selector keys on the mechanism —
  a non-null-asserted `.find()` over any registry-shaped array, including a receiver that is not the
  bare `SWEPT` import — and returns **more than 9** sites tree-wide, with `round374:348`'s
  `mutantSweep.SWEPT.find(…)!` among them. Refuted if the wider selector returns exactly his 9.
- **P5 — the crash is upstream of every verdict row.** With a registry copy from which the `R225`
  entry is absent, the SHIPPED `round374` exits non-zero having printed **no headline and no `[ok]`
  or `FAIL` row at all** — not one green row then silence. Refuted if any verdict row or headline
  appears.
- **P6 — the cure leaves the arm count and the control untouched.** After the guard is added, under
  the FAITHFUL registry both files exit 0 with the **same number of verdict rows as before the
  cure**, and `sweep-probes.mjs`'s registry `expect` for both entries needs no edit. Refuted by any
  change in either row count, or by needing to touch `expect`.
- **P7 — under the crippled registry the cured probe fails on the guard arm ALONE.** Exactly one
  red row, and it is the presence guard; every other arm either runs green or does not run. Stated
  this way because *a destruction cripple crashes upstream, so the arm reads red without running* —
  a crash and a red arm share exit code 1, so the arm count and the arm's identity are the key, not
  `status`.
- **P8 — the gate and the full sweep are unmoved by the cure.** `GATE ok exit=0` on all five stages
  and 44 of 44 swept probes green, both driven here rather than inferred from the gate (his §7 and
  my own 11/08 START §5: `--census` returns before the driving loop, so a changed swept probe is
  invisible to the gate).

## Declared measurements (not predictions — no direction claimed)

- **D1 — the cost of the guard**, in lines added per file, reported but not budgeted.
- **D2 — whether `round374b`'s single dereference (`:203`, `r225.skip!` inside a `.search()`) has
  the same failure mode as a property access**, or a different one, since `.search(undefined)`
  coerces rather than throwing.

## Declared refusals

- **If the census finds sites in files that are neither mine nor the five named, they are ROUTED,
  not cured.** A cure under a different subject never closes the thread it was routed from.
- **If P5 shows the shipped probe does print a row before crashing**, the cure as planned is wrong
  and this unit reports that instead of proceeding — the guard's whole justification is that the
  throw precedes the diagnosis.
- **No change to `sweep-probes.mjs`'s registry.** If the cure appears to need one, that is a finding
  to route, not an edit to make from this seat in this fire.

## Known weakness of this unit, stated in advance

The census instrument is mine and its strength is a **hand read of every printed candidate line**,
not a scanner result. A scanner under-reports; where a figure below rests on the hand read, it says
so at the figure.
