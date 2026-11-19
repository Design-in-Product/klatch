# `unit-486markerstale` — PRE-REGISTRATION

**Seat:** Theseus · **Fire:** 2026-11-19 WORK · **Model:** Claude Opus 5
**Written and pushed BEFORE the arm exists.** `date`-reads at open: **14:47:08 PST**, gate drive
**14:48:24 PST**; this file written at **14:5x PST** (`date`-read, not estimated).

## The question, and who asked it

Daedalus's 11/19 WORK memo §2 routed this seat a **decision**, explicitly as a two-seat one:

> **7 of the 8 departures were `MARKED`.** … After the narrowing they are **out of the population
> entirely**, so those seven markers now grant an exemption nothing needs. … **Theseus — four of
> those seven are yours or mine as author, so if you want the marker-staleness check it is a
> two-seat decision and I will build it on your word.**

A decision taken on a recalled blast radius is the thing this project's own CLAUDE.md forbids. So
before the word is given, **the blast radius is measured**, and the measurement is keyed on what the
check would actually redden on rather than on the delta that produced it.

**The distinction this unit exists for.** Daedalus's **7** is a *delta*: the members his narrowing
moved from `MARKED` to out-of-population on one fire. A staleness check does not redden on a delta.
It reddens on **every tracked file that carries a marker and is not in the population** — whatever
put it there, and including files that were never in the population under either reading. Those two
sets are not the same set, and only one of them is a blast radius.

## Subject

**Subject A — the tracked tree at HEAD.** `git ls-files`, requirement 1's population, same as the
gate's. Read fresh in this fire; no recording is reused as a subject.

**Subject B — the gate itself**, `scripts/verify-decl-body-slicers.mjs`, as the source of every key.
No key is re-typed (see R3).

**Excluded by construction:** `SELF` — the gate and its baseline — captured out of the gate's own
`SELF` set rather than re-listed here. A hygiene gate that walks its own directory reddens in every
cell, and this corpus has shipped that defect (`scripts/verify-decl-body-slicers.mjs` header).

## The keys, all captured from the gate

- **K-MARKER** — the gate's own `MARKER` regex, `/brace-slicer-deliberate:\s*\S+/`, captured out of
  the gate's source. Read from **raw** text, as the gate reads it: the marker lives in a comment,
  which the code reading blanks.
- **K-POP** — the gate's population key: `OPEN_BRACE.test(code) && CLOSE_BRACE.test(code)` where
  `code = blankLongStrings(raw, 2)`, the reading `unit-484popnarrow` landed this morning. `cmp`,
  the brace constants and the `blankLongStrings` call are captured, not re-implemented.
- **K-POP-OLD** — the **pre-narrowing** reading, `stripSource(raw, false)` (comments blanked,
  strings KEPT), so that a stale marker admitted by the old key can be told from one that was never
  in the population at all. This is the discrimination Daedalus's delta cannot make from the delta
  alone.

## Predictions

Graded in **both** directions. A HIT is recorded when it works, not only noted when it fails.

- **P1 (control, floor)** — the live gate at HEAD reads **tracked 1007 · population 65 · UNGUARDED
  58 · MARKED 4 · GUARDED 3 · baseline 58 · rc=0**, and the arm's own `K-MARKER ∧ K-POP` set is
  **exactly** the gate's `MARKED` set — same members, not merely the same count. REFUTED on any
  figure mismatch or any member difference. This is the leg that proves the arm reads the gate's
  population and not a lookalike.
- **P2** — marker-bearing tracked code files under K-MARKER, excluding `SELF`, number **≥ 15**;
  point estimate **17**. REFUTED below 15. (`git grep -l` on the bare string returned 18 files
  including the gate at 14:48; K-MARKER is stricter than the bare string, so this is registered as a
  floor with the estimate named.)
- **P3 — THE HEADLINE.** The stale-marker set (`K-MARKER ∧ ¬K-POP`, excluding `SELF`) is **strictly
  greater than 7**; point estimate **13**. REFUTED at ≤ 7. **If this is refuted, Daedalus's 7 is the
  blast radius and the decision is the one he framed.** If it holds, the decision he framed was
  sized on a delta and the real list is roughly double.
- **P4** — Daedalus's seven are a **strict subset** of the stale set, and **≥ 1** stale member is
  stale under **K-POP-OLD too** — i.e. it carries a marker and was never in the population under
  either reading, so its marker never exempted anything on any fire. REFUTED if the stale set under
  K-POP-OLD is empty, which would mean every stale marker was made stale by this morning's
  narrowing.
- **P5 — the site-level claim requirement 3 makes is not the claim the gate reads.** Requirement 3's
  wording is *"a declared marker **at the site**"*, and the gate's test is `MARKER.test(raw)` —
  file-level. Prediction: in the **in-population** marker-bearing files, **≥ 1 marker occurrence has
  no brace comparison on its own line**. REFUTED if every marker occurrence in those files sits on a
  line that itself carries a brace comparison, which would mean the file-level test is a faithful
  proxy today.
- **P6 (KP set, PASS/REFUSE)** — three hand-built known positives, each carrying **the property**
  and not an analogy (this seat's `unit-483` §5 lesson, and Daedalus's `drive5` repeat of it):
  - **KP-A** a live two-sided brace comparison **plus** a marker → `marker=true pop=true` (**needed**)
  - **KP-B** a marker plus **only** a multi-character string quoting a comparison → `marker=true
    pop=false` (**stale**), and `pop=true` under K-POP-OLD
  - **KP-C** a live two-sided brace comparison and **no** marker → `marker=false pop=true` (outside
    this subject entirely)
  If any KP lands on the wrong side the arm **refuses rc=4 and publishes no figure.** A corner-
  coverage check is explicitly **not** sufficient: `unit-483` §5 showed a broken KP can occupy its
  corner by not being in the population at all, so **each KP is asserted against its own registered
  side**, per KP, and coverage is reported but is not the gate.

## Refusals, declared in advance

- **R1 — nothing is cured and no marker is removed.** Not one tracked file loses a
  `brace-slicer-deliberate:` line in this fire. The decision this unit informs is precisely *whether*
  a published instrument may be edited to drop a dead marker; a fire that answers it by doing it has
  destroyed its own subject. `git status --porcelain scripts packages` must be **empty** at close.
- **R2 — the gate is not edited.** `scripts/verify-decl-body-slicers.mjs` gates every commit in this
  fire; a fire measuring the gate does not also change it (the same blocker Daedalus correctly said
  did not apply to *his* fire, because the gate was his subject — it does apply to this one, whose
  subject is the marker convention).
- **R3 — no key is re-typed.** `MARKER`, `cmp`, the brace constants, `SELF` and the
  `blankLongStrings(raw, 2)` reading are all captured out of the gate's source text with asserted
  capture counts. Any capture failure is **rc=3**, not a fallback to a hand-typed copy.
- **R4 — `unit-484popnarrow`'s RESULTS.md is not edited.** Daedalus's 7 is his published figure
  against his tree. If P3 holds, the wider figure is published **here**, and his is cited as correct
  about the delta it measured.
- **R5 — no recommendation is published that the measurement does not reach.** If P3 holds, this unit
  may still recommend building the check; what it may not do is report the blast radius as 7.

## What this cannot answer

Whether a frozen, published research instrument **may** be edited to drop a now-dead marker is a
question about what a published artefact *is*. No arm settles it. This unit sizes it and names the
structural asymmetry; the ruling is xian's if the two seats disagree.

It also cannot grade whether a marker's stated *reason* is still true — only whether the file it sits
in is still in the population. A marker whose file is in the population for a different comparison
than the one the reason names reads **needed** here and may not be.

— Theseus
