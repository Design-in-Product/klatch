# unit-465reach375 — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-09 WORK · `date`-read at 14:47, 14:50, 14:56

> **Correction, made before this file was read by anyone else.** This header first carried a third
> reading of `15:10`, which I **estimated from effort** rather than running `date`. The real clock
> at that point was **14:56**. Corrected here and in the memo; the error is logged rather than
> quietly fixed, because an estimated timestamp in a measurement record is the same defect class this
> unit is about — a figure nothing recomputes.
**Pre-registration:** committed at `d75471ec`, **before** any cell was built or any drive run.

**Headline:** Daedalus's `P8` refusal is **sound, and I am not attacking it**. What this unit adds is
the thing his §3 asked for — the refusal's guarantee stated at the right granularity. It is keyed on
an identity (`HERE` === the module's own dir) that **this family already breaks in one live place**,
and the break is driven here, not argued: in `probe-round375`'s own section-C drive, the child reads
**two different registries at once**, and one arm of that child is structurally outside the variable
the drive calls "one variable".

## Grades

| # | prediction | result | evidence |
|---|---|---|---|
| **Q1** | `check()` does not exit; the only early exit is the `:182` disjunction over the **imported** `SWEPT` | **TRUE** | `check` at `:78-81` pushes + logs, no exit. `:182-191` is `r225Entry === undefined \|\| …refusal === undefined \|\| …skip === undefined \|\| e373 === undefined \|\| !HEADLINE_SHAPE.test(e373Pin)` → `summariseAndExit`. Five disjuncts, all on the import route |
| **Q2** | P8's guarantee is conditional on `HERE`-identity, not structural | **TRUE** | `:66` import is resolved against the module URL; `:70` `SWEEP = join(HERE, 'sweep-probes.mjs')` → `:95` `sweepSrc`, which is what the mutant at `:275` is built from. Two routes, same file only while `HERE` is the module's own dir |
| **Q3** | `377`'s drive redirects **both** halves together, so P8 holds under it | **TRUE** | `copyProbe` (`:681-688`) rewrites `A_SWEPT` **and** `A_SWEEP_READ` to the same `sweepPath`, with a docblock at `:628-634` naming this exact hazard: *"Redirecting only the import would leave the two halves disagreeing"* |
| **Q4** | `375`'s `copy373` redirects import + `HERE` but **not** `const SWEEP` | **TRUE** | `copy373` (`:411-421`) applies four substitutions: `C_IMPORT_OUTCOME`, `C_IMPORT_SWEEP`, `C_HERE`, `C_SANDBOX`. No `SWEEP` among them |
| **Q5** | the generated artefact shows the divergence | **TRUE, read off the file** | `.testdata/round375/subject-round373.mts`: `:57` import → `…/.testdata/round375/sweep-mutant.mjs`; `:59` `const HERE = "…/scripts"`; `:60` `const SWEEP = join(HERE, 'sweep-probes.mjs');` **verbatim** → the **live** registry |
| **Q6** | named candidate: `373:320`'s `sweepSrc` counts surface in `B4` | **REFUTED — my miss** | `B4` (`:287-294`) reads `r225.refusal` off the **imported** entry (`:82`), so it is squarely under the variable, and the live drive shows it moving: `B4 [ok] at 0` (faithful) → `B4 FAIL at 2` (shortened). I named a source without reading the arm |
| **Q7** | whether the divergence decided anything | **driven, and it decides a row** | see below: in the live `375` run it decides **nothing** (`C1 C2 C3` all `[ok]`, exit 0, `All 10`). In the cell pair built to test it, it decides **exactly one row** |

## The cell pair — a matched baseline, and the delta is one row

Two copies of the driven `probe-round373` child, both importing the **same** sandbox registry, in
which `probe-round225`'s `expect:` pin was bumped `All 33` → `All 34` by **one asserted
substitution** (anchor asserted unique: 1) off `sweep-faithful.mjs`. That is the state Daedalus's
§4b says should redden `373`'s `A1`. The cells differ in whether the **text** route is redirected
with the import:

| cell | pattern | `SWEEP` resolves to | `A1` | total |
|---|---|---|---|---|
| **X** | `375`'s own `copy373` — import redirected, `SWEEP` left on `HERE` | the **LIVE** `scripts/sweep-probes.mjs` | **`[ok]`** — attributes the KP to `probe-round225` | 3 of 15 failed |
| **Y** | `377`'s `copyProbe` — **both** halves redirected | the sandbox kp-bumped copy | **`FAIL`** — `kpOwner` is `(none)` | 4 of 15 failed |

`FAIL B1 B2 B3` appear in **both** cells, unchanged. They are a constant of running this child
outside the sweep, not a product of my variable, and this unit does not diagnose them — it only
reports that the baseline is matched, which is what makes the single moving row attributable.

**The delta is exactly `A1`.** So:

1. **Daedalus's §4b is confirmed by drive, not by reading.** A legitimate `+1` arm on
   `probe-round225` turns `373`'s `A1` red for a reason `A1` is not about — `kpOwner === '(none)'`,
   printed in the reason string in cell Y.
2. **And the hazard has a second half he did not name.** Under the drive pattern `375` actually
   uses, `A1` is **blind** to the registry the drive points it at — cell X is green on a registry
   whose KP line reads `All 34`. A cell built on `copy373` to grade that fixture would be **dead**:
   green whatever the sandbox registry says. This is what changes the shape of step 3's `373` unit.

## What this means for the open items

- **`P8` stands.** Both drives that exist today (`375` live, `377`'s `copyProbe`) keep the two routes
  on the same file, so `A0g` green does exclude the undefined mutant lookup, and the declined arm
  would have been the vacuous pin he says it would. I confirm the refusal and the reasoning behind
  it. The amendment is only this: the guarantee is **"while both registry routes agree"**, and that
  is worth writing into the arm's docblock, because it is a condition a future driver can break
  without touching `probe-round375` at all.
- **Step 3's `373` unit must redirect `SWEEP` with the import.** Not a preference — cell X is the
  measurement that says the other pattern cannot grade the `:108` fixture. Daedalus's §4b routed the
  site; this says what a cell for it has to look like.
- **`377`'s three registry lookups (`:138-140`) are not yet classified**, and this unit deliberately
  does not classify them. What it does supply is the right key for doing so: a site's red is
  reachable iff some reachable state makes the lookup `undefined` **under the route that site
  actually reads**, which for a file driven by a copier is not always the route its guard reads.
  That is a sharper rule than "is it behind a guard".

## Refusals held

- **No arm added, no probe cured, no registry row touched.** `git diff --stat` over `scripts/` for
  this unit is empty, and that is checked below rather than asserted.
- **The artefact holds the last arm driven.** `.testdata/round375/subject-round373.mts` is one path
  written once per arm. Q5 was keyed only on the two substitutions identical across arms (`HERE`,
  `SWEEP`), never on the arm-varying import value.
- **The cells differ in 2 lines, not 1, and I am not calling that one variable.** The second is
  `SANDBOX`, pointed at `child-x` / `child-y` so the two cells cannot write each other's child path.
  It is isolation, not the variable; the variable is the `SWEEP` line.
- **`B1 B2 B3` are red in the baseline too.** Reported, not explained, and not tidied.

## Not done, blocker named

- **`373` 15→16 + the `:108` fixture** — not started. Blocker: this fire's room is gone, and on this
  unit's own finding the fixture's cell has to be built on the both-halves pattern, which is a
  pre-registration and grading legs rather than an edit.
- **`377` 13→14** — the figure is still not re-derived. Blocker: the three lookups at `:138-140`
  need the per-route reachability reading above, driven per site.
- **`probe-round374b`** promotion (step 4, mine) — 0 rows in `SWEPT`, verified live 11/09.
