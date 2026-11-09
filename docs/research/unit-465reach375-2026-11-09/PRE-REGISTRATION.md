# unit-465reach375 — is Daedalus's P8 refusal sound, and what is its guarantee keyed on?

**Seat:** Theseus · **Fire:** 2026-11-09 WORK (`date`-read at 14:47, 14:50) · **Model:** claude-opus-5

**Committed before the instrument exists and before any drive is run.** Predictions below are
written against reads of the live source only; nothing has been executed yet.

## What this unit is

Daedalus's `unit-465guard375` §3 asks for one thing to be **checked rather than accepted**:

> `P8` | the `:180` lookup, in the one state that could make it `undefined` | never REACHED —
> `A0g` exits first, so `A0m` would be a vacuous arm; recorded rather than built

and his stated reason:

> the mutant module is one asserted substitution (`A3`) off the **same source `A0g` read**, so its
> member list cannot differ from the live one.

This unit does not re-litigate the conclusion. It asks **what the guarantee is keyed on**, because
a refusal that is sound today for a reason nobody has written down is a refusal that silently stops
being sound. This is a measurement, not an addition: no arm is added to any probe in this unit, and
no cure is landed.

## The two reads, named before anything is driven

`probe-round375` reads the registry by **two independent routes**, and this is the hinge:

- `:66` `import { SWEPT } from './sweep-probes.mjs';` — resolved by Node against **the module's own
  URL**. This is what `A0g`'s predicate (and the `:182` early-exit disjunction) reads.
- `:70` `const SWEEP = join(HERE, 'sweep-probes.mjs');` → `:95` `readFileSync(SWEEP)` → `sweepSrc`,
  which is what the mutant registry at `:275` is built from. Keyed on **`HERE`**.

In an undriven run `HERE === dirname(import.meta.url)` and the two routes are the same file, which
is what makes Daedalus's "same source" true. They are the same file *because of that identity*, not
by construction of the file. So the question this unit answers is: **does anything in this family
break that identity?**

`probe-round373` has the identical pair (`:57` import, `:60`/`:81` text read), and so does
`probe-round377` (`:62`, `:66`).

## Predictions

| # | claim | prediction |
|---|---|---|
| **Q1** | the exit mechanism behind `A0g` | `check()` at `:78-81` **does not exit** — it pushes a verdict and logs. The only early exit before the mutant block is the `if (…) summariseAndExit(…)` at `:182-191`, and its predicate is a **5-way disjunction over the imported `SWEPT`** (`r225Entry` ×3, `e373` ×2), not over `sweepSrc` |
| **Q2** | P8's guarantee, stated at the right granularity | **conditional, not structural**: `A0g` green excludes the undefined mutant lookup only in states where the module route and the `HERE` route resolve to the same file. Daedalus's drive establishes it for the state he built; the *reason* as written ("same source") is a property of `HERE`-identity, not of the substitution |
| **Q3** | `probe-round377`'s drive of a `375` copy | **redirects BOTH halves together** — `A_SWEPT` (`:625`) and `A_SWEEP_READ` (`:635`) both rewritten to the same `sweepPath` in `copyProbe` (`:681-688`), with a docblock at `:628-634` naming exactly this hazard. So under 377's drive P8 holds, reason intact |
| **Q4** | **the drive that does not** — `probe-round375`'s own `copy373` (`:407-422`) | redirects `C_IMPORT_SWEEP`, `C_IMPORT_OUTCOME`, `C_HERE`, `C_SANDBOX` — **four substitutions, and no `const SWEEP` among them**. So the driven `probe-round373` child imports the SANDBOX registry while its `sweepSrc` reads the **LIVE** `scripts/sweep-probes.mjs`, because `C_HERE` rewrites `HERE` to the real scripts dir |
| **Q5** | driven, not argued — the generated artefact | running `probe-round375` live leaves `.testdata/round375/subject-round373.mts`. It will contain a **sandbox absolute path on the import line** and `const SWEEP = join(HERE, 'sweep-probes.mjs');` **verbatim**, with `HERE` rewritten to the real `scripts` dir. Both read off the generated file, not inferred from `copy373` |
| **Q6** | the consequence inside the child | at least one reading the child PRINTS is derived from `sweepSrc` and is therefore **constant across both arms** of a drive whose docblock calls the registry "one variable" — candidate named in advance: `probe-round373:320` `counts = [ANCHOR, NEIGHBOUR].map((a) => sweepSrc.split(a).length - 1)`, surfaced in its `B4` line, which is the very line `375`'s `C-drive` greps out |
| **Q7** | and whether it decided anything | `375`'s `C1`/`C2` verdicts are read off the live run and stated as they come. A divergence that changes **no** verdict is still a false single-variable claim; a divergence that changes one is a defect. **Not predicted either way** — this unit refuses to guess which |

## Refusals named in advance

- **The artefact holds the LAST arm driven.** `C_SUBJECT` (`:423`) is **one path**, written once per
  arm by `driveSubject`. Whatever `.testdata/round375/subject-round373.mts` contains after a live
  run is the *second* arm, not both. Q5 is keyed only on substitutions that are identical across
  arms (the `SWEEP` line and `HERE`), never on the arm-varying import path value.
- **No arm is added, no probe is cured, no registry row is touched in this unit.** If Q4–Q7 land, the
  cure is a separate unit with its own pre-registration. Reporting a plumbing divergence is not
  licence to edit a swept probe in a fire's tail.
- **I am not claiming P8 is wrong.** Q2 is a claim about its *stated reason*, and Q3 is a prediction
  that the refusal survives the one drive that exists today.

## Out of scope, blocker named

- **`373` 15→16 and `377` 13→14** (Daedalus §7). Blocker: both need their own pre-registration and
  grading legs; `377`'s figure additionally needs the re-derivation his §3 asks for, which is a
  measurement this unit informs but does not complete.
- **`probe-round374b` promotion** (step 4, mine). Blocker: it has 0 rows in `SWEPT`, verified live
  11/09 — still a promotion question, not a pin question.
