# unit-469braceslice — PRE-REGISTRATION

**Seat:** Theseus (Klatch) · **Fire:** 2026-11-17 START · **Written before the instrument exists.**

## Why this unit

Two instruments, two seats, one mechanism, inside eighteen hours:

- **This seat, `unit-467importprice-2026-11-16` §3.** `bodyFrom`'s first version took the first `{`
  at or after the declaration. In every annotated signature in `packages/client/src/api/client.ts`
  that `{` is a **parameter type literal**, so the "body" was a parameter type, `S1` came back `[]`,
  the key assembled from it was `/\b()\s*\(/` — which matches every call in every file — and the run
  reported 23 phantom "movers" with files, lines and hazard lists. The two-sided negative control
  caught it; the known positive landed vacuously.
- **Daedalus, `unit-468createlit-2026-11-17` §5.** Census arm A's drive 1 started brace counting at
  the first `{` after the function head. `opts?: { name?: string; makeDefault?: boolean }` and
  `sourceMetadata: Record<string, unknown> = {}` opened and closed the "body" on the signature's own
  line, so the slice held no `INSERT INTO` and **`createGroundRulesPreset` — the member the whole
  unit was about — fell out of the population with no error.** Drive 1 said 11/10/0 and looked clean.

Daedalus states the general form and leaves it to "whichever of us writes the next source scanner."
Nobody has censused it. **The question this unit answers is how many of this corpus's scanners carry
the mechanism, how many are guarded, and which of the unguarded ones are wrong *today* as opposed to
wrong *if their subject changes*.**

**A design fact that killed the first plan, recorded because it changes what a known positive can
be.** I intended to read the pre-cure slicers out of git. They are not there:
`git log -- docs/research/unit-467importprice-2026-11-16/arm-importprice-a.mts` and
`… unit-468createlit-2026-11-17/arm-createlit-a.mjs` each return **exactly one commit**
(`69650467`, `7041f882`) — both repaired before first commit. The drive-1 recordings survive; the
drive-1 code does not. So the known positive is a **cripple of the live cured arms** (delete the
paren-match prelude, re-classify), which is real code with the property, not a fixture and not an
analogy.

## Population (fixed here, before counting)

`P` = every file under `scripts/`, `docs/research/`, `docs/operations/`, `packages/*/src/` with
extension `.ts|.mts|.js|.mjs` whose source contains a **character comparison against an open
brace** — operationally `/[=!]==?\s*['"]\{['"]/` or `/['"]\{['"]\s*[=!]==?/`. Test files are **not**
excluded; a scanner in a test is still a scanner.

## Classification (fixed here)

Per file in `P`:

- **SLICER** — compares against both `'{'` and `'}'`. A file that only ever compares against `'{'`
  is counted but is **not** a slicer (it is not delimiting a region).
- **GUARDED** — in the source *preceding the first* `'{'` comparison, there is a paren-depth
  construct: a comparison against `'('` **and** one against `')'`. This is the cure both arms
  adopted: match the parameter list first, then start counting braces.
- **UNGUARDED** — a SLICER that is not GUARDED.
- **LIVE** — an UNGUARDED slicer for which I can **name** a signature, in a file the scanner
  actually reads, carrying a `{` before the body's opening brace. Naming is required; see refusals.

## Predictions

- **P1 — population size.** `|SLICER| ≥ 6`.
- **P2 — the defect is not confined to the two that were caught.** At least one UNGUARDED SLICER
  exists besides those two arms.
- **P3 — the cure is local, not a corpus idiom.** `|GUARDED| = 2`, and the two are exactly
  `arm-importprice-a.mts` and `arm-createlit-a.mjs`. If a third file is guarded, the two seats
  re-derived something the corpus already knew and that is the more interesting result.
- **P4 — known positive, by cripple.** With the paren-match prelude deleted from each of the two
  GUARDED arms, both classify **UNGUARDED**. Both legs must move; one is not coverage of the other
  (they are different languages of the same mechanism — a char loop over `lines` vs. an `indexOf`
  walk over the whole text).
- **P5 — most of the exposure is latent, not live.** Fewer than half of the UNGUARDED slicers are
  LIVE.
- **P6 — negative control.** At least one file in `P` is **not** a SLICER, and the key must say so.
  A key that classifies everything it matches as a slicer has no negative limb and I will not report
  a rate from it.
- **P7 — the instrument is not exposed to the defect it hunts.** My census key does no body slicing
  at all: it works on whole-file text and index positions. Asserted by a leg that greps the
  instrument's own source for a brace-depth scan and requires zero, not by my saying so.

## Refusals, registered

- **If `|SLICER| < 3`, I publish no rate.** Three is a hand count; a percentage over it is a figure
  with a denominator that cannot carry one.
- **I will not call an UNGUARDED slicer *wrong* without naming the breaking signature** in a file it
  reads. Unguarded-and-latent and unguarded-and-live are different findings and the second one costs
  something. An unnamed LIVE is reported as UNKNOWN.
- **If the key's own 400-char window for the GUARDED test turns out to be doing the work** (i.e. the
  classification flips when the window widens to whole-file), the window is the finding and the
  classification is withdrawn. A proximity window is a consumer key and this seat has been wrong
  with one before.

## Legs planned

`A1` population + its two-sided breakdown · `A2` SLICER/GUARDED/UNGUARDED partition sums to `|P|` ·
`A3` the two known arms classify GUARDED (sanity, separate from `A4` so a red says which) ·
`A4` cripple KP on arm-importprice-a · `A5` cripple KP on arm-createlit-a · `A6` negative control:
at least one non-SLICER · `A7` instrument self-check (P7) · `A8` window-sensitivity check (the third
refusal) · `A9` `git status --porcelain packages scripts` empty — this unit writes only under
`docs/`.

— Theseus
