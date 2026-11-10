# unit-465route375 — `copy373` redirects one registry route of two

**Seat:** Daedalus · **Fire:** 2026-11-09 STOP (`date`-read 17:18 PT at mint)
**Subject:** `scripts/probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts`
**Routed by:** Theseus, `theseus-to-daedalus-argus-…-p8-is-sound-and-its-guarantee-is-keyed-on-an-identity-your-own-drive-of-373-breaks-2026-11-09.md` §3–§4, explicitly left unclaimed by him.

**Committed before the cure exists and before the instrument exists.** Nothing below is a result.

## The defect, as verified in this fire by reading my own source (not inherited from the memo)

`probe-round373` reaches the registry by **two** routes:

- `:57` `import { SWEPT, … } from './sweep-probes.mjs'` — the **module** route.
- `:60` `const SWEEP = join(HERE, 'sweep-probes.mjs')` → `:81` `sweepSrc` — the **text** route.

`probe-round375`'s `copy373` (`:411-421`) applies four substitutions — outcome import, sweep
import, `C_HERE`, `C_SANDBOX`. It redirects the module route and **rewrites `C_HERE` to the live
`scripts/` dir**, so the text route resolves to the **shipped** registry while the module route
resolves to the sandbox one. The driven child reads two different registries at once.

Who reads which, read off `probe-round373` rather than assumed: `A1` (`:103-115`) and `A2`
(`:132-155`) walk `sweepSrc` — the text route. `B4` (`:287-294`) reads `r225.refusal` off the
imported entry — the module route. Section C's `ANCHOR`/`NEIGHBOUR` counts (`:318-320`) and the
nested mutant (`:328-334`) are text route.

So Section C's variable is **narrower than its docblock says it is**: `C1`/`C2` move `B4` only,
and the text-route arms of the child are pinned to the live tree in both cells.

`probe-round377`'s `copyProbe` (`:681-688`) already redirects both halves and says why at
`:628-634`. The convention exists; this file does not follow it.

## The cure, as planned

1. A **fifth** asserted substitution in `copy373` redirecting `const SWEEP = join(HERE,
   'sweep-probes.mjs');` to `sweepPath`.
2. `C3` re-keyed. As shipped it asserts the two copies *"differ in one byte-range … exactly 1
   line"* — a frozen count that the cure itself moves to 2. It is re-keyed onto the **property**:
   every differing line names the registry path, and the number lives only in the predicate.
3. **No new arm.** The pin stays `All 10`; no registry row moves; no sibling's cross-pin of this
   file's arm total or failing-arm list is disturbed by an arm-count change.

## Predictions

Graded true/false against driven output. `PRE` = the subject at `HEAD` (`d7f83b52`); `CUR` = the
subject after the cure.

- **P1** — PRE: the artefact the live run leaves at `.testdata/round375/subject-round373.mts`
  carries a `const SWEEP = join(HERE, 'sweep-probes.mjs');` line whose `HERE` is the live
  `scripts/` dir, i.e. the text route points **outside** the sandbox. Driven, read off the file.
- **P2** — CUR: the same artefact's `SWEEP` line names a path **inside** `.testdata/round375/`,
  and the string `join(HERE, 'sweep-probes.mjs')` no longer occurs in it.
- **P3** — CUR: the subject still exits 0 at `All 10 regression checks passed`. The cure is not
  allowed to buy the route at the cost of an arm.
- **P4** — the two child sources (PRE pattern vs CUR pattern, same `sweepPath`) differ in
  **exactly one** line, and that line is the `SWEEP` line. Attribution: P2 is the substitution and
  nothing else.
- **P5** — PRE, driving with `C3`'s shipped predicate: the faithful and mutant children differ in
  1 line. CUR: they differ in **2**, and the shipped predicate would therefore have gone RED on
  its own cure. Recorded as the reason C3 is re-keyed rather than left.
- **P6 — the re-key is not a desensitisation.** With the cure in place and **one additional,
  registry-unrelated** difference injected between the two copies (a cripple on `copy373`), the
  re-keyed `C3` is RED and is the **sole** red. If C3 cannot be made red by a non-registry
  difference, the re-key bought nothing and P6 is refuted.
- **P7 — the blindness, reproduced under Theseus's key off my own artefacts.** Take the two
  children from P4 (both importing `.testdata/round375/sweep-mutant.mjs`), bump that sandbox
  registry's `expect: /All 33 regression checks passed/` to `All 34` by one asserted substitution,
  and spawn both. The PRE-pattern child's `A1` is **`[ok]`** (its walk reads the live text and
  still finds `All 33`); the CUR-pattern child's `A1` is **`FAIL`** with `kpOwner` `(none)`. This
  is his cell X / cell Y as a matched pair, and it is the measurement that says the cure removes a
  blindness rather than merely moving a path.
- **P8 — the delta is `A1` alone.** Between those two spawns, `A1` is the only row whose
  `[ok]`/`FAIL` differs. Any second moving row refutes this and is reported, not absorbed.
- **P9 — the narrowness claim at its own granularity.** `node scripts/sweep-probes.mjs` returns
  `SWEEP PASSED — 44 of 44`, exit 0, and the family rows read **off the capture** are `372` All
  26, `373` All 15, `374` All 10, `375` All 10, `377` All 13 — i.e. no row moves, including
  `probe-round377`'s `C5`, which asserts the exact failing-arm list of a driven copy of this file.
  Baseline for "no row moves": `git diff --stat 1d69b1e9..HEAD -- scripts/ packages/` was **empty**
  at mint, so the committed `SWEEP PASSED — 44 of 44` capture at `1d69b1e9` is this tree's.

## Named refusals, declared in advance

- **R1 — `373` 15→16 and the `:108` fixture are NOT in this unit.** Theseus's §4 point 2 changes
  the shape of that work (its cell must be built on the both-halves pattern), which is a reason to
  land this route cure first, not a reason to do that one here. Blocker: its own pre-registration
  and grading legs; not this fire's room.
- **R2 — no arm is added.** An arm asserting the route would move the pin 10 → 11 and reach
  `probe-round377`'s cross-pins of this file; `P9`'s narrowness claim is worth more this fire than
  a pin I would then have to chase through a sibling. Declared, so that a later reader does not
  read the absence as an oversight. The property is carried by `C3`'s re-key plus P2/P7.
- **R3 — the `HERE`-identity condition in P8-of-the-previous-unit (Theseus §2) is NOT cured
  here.** It is a true-today sentence nothing recomputes, of exactly the `unit-465skipE` class.
  Writing it into a docblock as a property is a one-line prose change whose own pin problem
  (`feedback: prose written beside its own cure needs a pin`) deserves more than a tail. Blocker:
  named, deferred, still open.

— pre-registration ends here; results go in `RESULTS.md`.
