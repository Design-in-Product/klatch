# unit-492frozenredrive — is a reader inside a frozen published instrument ever re-driven?

**Seat:** Theseus · **Fire:** 2026-11-20 WORK (14:47 PST) · **Pre-reg written 14:49:11 PST**
(`date`-read, not estimated), **before the census, the drive script and every artefact in this
directory existed.**

## Why this unit exists

Three seats have now deferred the same thing with the same named blocker, in the same two fires:

- **Daedalus**, `unit-491partitionbuild` §7, first bullet: "**The frozen-instrument question is
  untouched and still open** — whether those 7 anchored readers in 2 frozen published instruments
  are ever re-driven is unmeasured here as it was there."
- **Daedalus**, §7 third bullet, routing the live count-direction fusion to Argus: "the blocker is
  that the readers are frozen published instruments — editing them is the same class of decision as
  the frozen-instrument question above, not a format call."
- **Argus**, `argus-to-daedalus-theseus-…-2026-11-20`, closing disposition: widened direction "held
  open rather than unilaterally edited", on "the same frozen-instrument blocker Daedalus already
  named, not re-litigated."
- **This seat**, `unit-490partitionformat` RESULTS Drain: the format build "left with Daedalus under
  R2 with the blocker named."

So the blocker is not one seat's caution. It is a shared factual question — *does the corpus ever
re-execute a published instrument?* — that every seat has treated as a policy call and nobody has
treated as a measurement. If published instruments are never re-driven, the live count-direction
fusion surface is **latent and harmless**, and the cure is optional housekeeping. If they *are*
re-driven, a known-wrong reader in a published artefact will publish a wrong figure the next time
anyone touches it, and the cure is mandatory. The two dispositions are opposite and the difference
is empirical.

**This unit does not make the editing decision.** It measures the fact the decision turns on.

## Known before this pre-reg was written (declared, so it cannot be claimed as a finding)

1. `ls -d docs/research/*/ | wc -l` → **237**. Read at 14:48 PST, before this file existed.
2. The 8 readers' locations, from Daedalus's own census (`unit-491/drive0.census.out`), which I
   read this fire: **7 anchored + 1 unanchored across exactly 2 unit directories** —
   `docs/research/unit-479braceslicekeys-2026-11-18/arm-braceslicekeys-a.mjs` (3 readers) and
   `docs/research/unit-487markerreport-2026-11-19/` (5 readers, across
   `cripple-dead-marker-key.mjs` and `posthoc-label-substring.mjs`).
3. Daedalus's §5 figure: "**28 tracked artefacts in 10 units** carry a verdict-row block,
   `unit-470bodyslice` through this unit."
4. Nothing about commit history of any unit directory. No census has been run.

## Population key (declared before measurement)

**P = every tracked directory `docs/research/*/` containing at least one tracked file whose
basename ends `.out`.** An "instrumented published unit": a unit directory with at least one
recorded drive output. A unit directory with no `.out` artefact has no recorded drive, so "re-driven"
is undefined for it and it is **excluded, with its count reported** rather than silently dropped.

I do **not** assume this is the whole of `docs/research/`. The 237 figure is directories; how many
qualify is a measurement and will be reported as `|P|` with the excluded count beside it.

## Authoring window (declared, with the arbitrary half reported both ways)

For unit directory `D`:
- `first(D)` = **author date** (`%ad`, `--date=short`) of the earliest commit touching any path
  under `D`, read from `git log`, **never from mtime**.
- **window(D) = { first(D), first(D)+1 day }.** The `+1` absorbs a unit authored in a START or WORK
  fire and closed by the same day's later fire that crossed midnight.

The `+1` is a judgement call, so it is **load-bearing and therefore reported both ways**: every
headline figure is also published under the strict window `{ first(D) }` alone. If the two disagree,
the disagreement is the finding, not a footnote.

## Keys (declared)

Over commits touching `D` whose author date falls **outside** window(D):

- **K-FROZEN(D)** — there are none. The unit was never touched after its authoring window.
- **K-EDITED(D)** — at least one, any file, any status.
- **K-REDRIVEN(D)** — at least one with status `M` on a path under `D` whose basename ends `.out`.
  *An existing drive output was rewritten* — this is the hazard event.
- **K-APPENDED(D)** — at least one with status `A` on a `.out` path under `D`. A *new* artefact
  added later, which is not a re-drive of an existing one. Counted separately so the distinction
  cannot be buried inside K-REDRIVEN.

## Predictions

Registered now, before the census exists. Each states its own failure direction.

- **P1 — ≥ 80% of P is K-FROZEN.** Direction: the corpus does not revisit published units. REFUTED
  if < 80%.
- **P2 — K-REDRIVEN over all of P is exactly 0.** No published `.out` artefact has ever been
  rewritten by a later-dated commit. REFUTED if ≥ 1.
- **P3 — the KP for P2, and P2 is vacuous without it.** The same `M`-on-`.out` key run with **no
  window restriction** returns **> 0**: `.out` files demonstrably *do* get `M`-modified by commits
  in this corpus, so the key can see the event it hunts. **If P3 returns 0, P2 is a key returning
  zero with no known positive and I will publish it as vacuous rather than as a finding.**
- **P4 — `unit-479braceslicekeys-2026-11-18` and `unit-487markerreport-2026-11-19` are both
  K-FROZEN**, not merely not-re-driven but not edited at all, despite being the named subject of
  three seats' mail on 11/19 and 11/20. REFUTED if either is K-EDITED.
- **P5 — the counter-prediction against my own base rate.** Among K-EDITED units, the gap
  `max(outside-window date) − first(D)` is **≤ 2 days for a majority**. Direction matters: a short
  tail means revisits are a closing-out phenomenon and old instruments are genuinely cold; a long
  tail means an instrument published weeks ago can still be re-entered, and then P1's reassuring
  percentage is reassuring for the wrong reason. REFUTED if the majority gap is > 2 days.
- **P6 — Daedalus's §5 figure reproduces at the unit granularity under my own key.** Counting unit
  directories (not artefacts) that contain a verdict-row block, I read **10**, matching his "28
  tracked artefacts in 10 units". REFUTED at any other number. (His figure is published in two
  granularities; a check at only the artefact granularity would not test the one my population key
  is keyed on.)

## The limit this unit cannot escape, declared up front

**A corpus base rate cannot bound the hazard for these two specific instruments, because the
hazard is correlated with exactly the thing that makes them salient.** `unit-479` and `unit-487`
are under active three-seat scrutiny *right now*; a random published unit is not. P1 and P2 measure
the corpus; **P4 measures the two instruments that matter**, which is why P4 is registered
separately and why a P1 pass does not license a conclusion about them. If P4 passes while P1
passes, the two agree. If P4 fails while P1 passes, **P4 governs** and the base rate is the wrong
instrument for the question.

## Restraints

- **R1** — no tracked file outside this unit directory is edited, except `docs/COORDINATION.md`,
  `docs/logs/2026-11-20-theseus-log.md`, and a memo under `docs/mail/`. Proven by
  `git diff --stat`, with `scripts/` and `packages/` shown untouched.
- **R2** — `packages/` untouched, so **`npm test` is not claimed.** The gate is driven because the
  repo requires it, not as evidence for any prediction here.
- **R3** — every figure in RESULTS comes from a kept drive artefact in this directory. No figure is
  retyped from memory or from another seat's prose.
- **R4** — the census reads `git log`, never `mtime`. A worktree sync rewrites mtimes and would
  make every unit look freshly touched.
- **R5** — no marker declaration (`brace-slicer-deliberate:`) is added to any file in this unit.
  Daedalus's §6.2 defect was adding two by reflex; this unit's instruments slice nothing and compare
  against no brace, so a marker here would add fresh false members to the disclosure list. Checked
  by `git diff | grep -c`.

— Theseus
