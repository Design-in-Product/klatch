# unit-465leadcure — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-11 WORK (opened 14:47 PST)
**Written:** 2026-11-11 **14:50:49 PST** (`date`-read, not estimated from effort)
**Status at writing:** no cure applied, no recording taken. This file is committed and pushed to
`origin/main` before the first recording exists.

## What this unit does

It takes the two cures this seat claimed as its next WORK unit in the 11/11 START fire entry, and
which Daedalus's `unit-465fixture` routed back as input rather than redesigning:

1. `scripts/geometry-marking-before-seed.mjs:44` — `LIST_LENGTHS.FILLER_LEAD: 15`, stale since
   ~2026-08-19 (live `FILLER_LEAD` is **20**, read this fire off the project's own instrument,
   `npx tsx scripts/verify-filler-constraints.mjs` → `corpora: FILLER 12, FILLER_LONG 17 (5 own),
   FILLER_LEAD 20`).
2. `scripts/geometry-distance-arm.mjs:136` — the printed sentence `FILLER_LEAD holds 15, so that is
   5 new pairs`.

## The design call, settled by census rather than by preference

The deferred question was posed as **"remove the number vs. parse it"** keyed on `FILLER_LEAD`. A
census of all eleven `LIST_LENGTHS` uses in the subject file (`grep -n LIST_LENGTHS`, this fire)
says the question is keyed on the wrong unit: the object has **three members filling three
different roles**, and they do not get the same answer.

| member | role in the file | printed? | asserted by anything? | live value | state |
|---|---|---|---|---|---|
| `FILLER: 12` | **geometry input** — `P:` at `:125`, `:151`; sweep start `:244`; sweep subject `:218`/`:274` | no | **yes** — the `:125` self-check fails loudly if the derived N1 geometry moves | 12 | correct **and guarded** |
| `FILLER_LONG: 17` | sweep `P` value `:218`/`:274`; **arithmetic inside a printed sentence** `:254` | **yes** | **no** | 17 | correct, **unguarded** |
| `FILLER_LEAD: 15` | **loop bound only** — `:220`, `:245`, `:259`, `:276` | no | **no** | 20 | **wrong**, unguarded |

So:

- `FILLER_LEAD` is **not a fact this file needs**. It is a sweep extent. Its value is additionally
  known-inert over `0..50` (measured, `unit-465leadbound` 11/10: three bounds differ in exactly two
  lines, both denominators; the binding ceiling on `L` is a constraint at **2**, thirteen below the
  bound). **Cure: remove the claim**, not refresh it and not parse it. Parsing would add a
  cross-file source-scanner to a file whose docblock premise is "zero API calls, zero server, zero
  DB — this is arithmetic", to keep a number honest that provably cannot change a conclusion.
- `FILLER` keeps its name and value: it is a real input and the self-check really guards it.
- `FILLER_LONG` is **the next `FILLER_LEAD`** — same unguarded position, and printed. Not cured
  here; **flagged** (see P6). Fixing it silently inside a unit about `FILLER_LEAD` would be a cure
  under a different subject.

## Predictions

Graded TRUE/FALSE against recordings after the fact. Weak predictions are declared weak here, not
after grading.

- **P1 — `geometry-marking-before-seed.mjs`, post-cure, exits 0 and differs from the HEAD baseline
  in exactly two lines, both denominators** (`208 → 273` and `288 → 378`).
  **Declared weak:** this restates a figure already measured twice (11/10 `unit-465leadbound`,
  11/11 `unit-465blanket` arm A2) on a subject blob that has not changed. It is a control, not a
  discovery.
- **P2 — the self-check block's printed lines are byte-identical to baseline.** The cure must not
  touch `:125`'s literal `L: 15`; drifted site and dangerous site are disjoint, and the blanket
  substitution that fuses them is what reddens at exit 1.
- **P3 — `geometry-distance-arm.mjs`, post-cure, exits 0, and the diff against baseline is confined
  to the sentence lines I edit.** No table row moves: the table is parametric and `FILLER_LEAD` is
  not one of its inputs.
- **P4 — `geometry-distance-arm.mjs` at HEAD never reads `FILLER_LEAD` programmatically**; the `15`
  exists only inside the printed string literal. If this is FALSE the cure is larger than a
  sentence and this unit's scope is wrong.
- **P5 — after both cures, no surviving literal in either file claims `FILLER_LEAD`'s length.**
  Censused over the mechanism (any `15`/`20` adjacent to a `FILLER_LEAD` mention), not just the two
  instances I set out to fix.
- **P6 — the `:136` sentence's error is an inversion, not a staleness.** The sentence bills "5 new
  pairs" as a cost of reaching `leadPairs: 20`. `probe-recall-tool.mjs:1873` hard-fails when
  `needLead > FILLER_LEAD.length` and its message demands exactly `needLead - length` new pairs —
  so with length 15 the arm was **corpus-blocked** and the sentence was a correct reading of that
  guard. With length 20, `20 > 20` is false: the arm is **available and the cost is zero**. Predict
  the parametric half of the same sentence (`both offers then exceed the 30-row expand cap`) is
  still TRUE and must survive the cure: `leading = 2L-2 = 38` at `L=20` and `trailing = 2P+3 = 37`
  at `P=17`, both over `MAX_EXPAND = 30`.

## Refusals, declared up front

- `:125`'s `L: 15` literal and the `:126` `want` fixture are **not touched**. Daedalus's A2 measured
  that refreshing that fixture yields `rc=0` publishing a **false** N1 line, which
  `no-truncation-leak` is structurally unable to catch. The operative instruction is *on A1's red,
  revert the change — do not refresh the fixture.*
- `FILLER_LONG: 17` is **not** bumped, parsed, or re-roled. It is correct today; the finding is a
  hazard and belongs in its own unit.
- This cure touches `scripts/`, so a **sweep/gate leg is owed** and will be run and reported with
  its summary line, not inferred from an exit code.

## Baseline discipline

Baselines are taken from the **pinned pre-cure rev via `git`**, not from the working tree after
editing, so the comparison cannot be contaminated by the cure it grades. Subject pin recorded in
RESULTS.md as a blob sha read with `git ls-tree`, `-C`-pinned.
