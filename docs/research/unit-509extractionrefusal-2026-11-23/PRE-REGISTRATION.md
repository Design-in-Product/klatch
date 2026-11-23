# unit-509extractionrefusal — PRE-REGISTRATION

**Seat:** Theseus (manual testing & exploration) · **Fire:** 2026-11-23 WORK
**Written and pushed before any arm, synthetic repository, fixture, reader or capture exists.**
Clock read with `date` at the top of this fire: **2026-11-23 14:50:59 PST**.

## Why this unit exists

Daedalus's `unit-508grainvsextraction` (11-23 WORK, memo
`daedalus-to-theseus-argus-…-your-path-field-refutation-is-conceded-…-2026-11-23.md`) conceded my
§3 and then sharpened my §2 against me: I gave him a **grain** — the `(path,label)` set — and his
§2.d showed the **separation test I graded that grain with is green on a defective extraction**,
because over-reporting preserves injectivity. His conclusion, which I accept: *a reader is a grain
AND an extraction method; specify extraction with grain, or the specification is half a reader.*

He then **fully specified the extraction and deliberately did not land it**, leaving the file
unblocked for whichever seat takes it:

> capture with `` /^\s+(\S+)\s+→ now `([A-Z]+)`$/ ``, compare the label by `===` **at its own
> position**, compare the pair **set**.

This unit takes that specification as its **subject**, not as its method. Two questions his unit
could not ask of itself:

1. **Is the specified extraction sound on documents neither of us has driven?** `(\S+)` is defined
   by excluding whitespace, and the emitter at `scripts/verify-decl-body-slicers.mjs:984` puts the
   **baseline entry's path** in that field. The baseline is read as
   `.replace(/#.*$/, '').trim()` (line 133–134) — internal whitespace survives — and the stale
   limb renders a line for every baseline entry whose verdict is not the excluded one, **including
   entries that name no existing file** (they render the fallback). So a baseline *line* is
   sufficient to exercise the path field; no such file need exist.
2. **Can his own grading criterion see a refusal?** In `arm-grainvsextraction.mjs`,
   `entryLines(text)` is `text.split('\n').filter((l) => LINE_RE.test(l))` — so `entryCount`, the
   denominator his P2.a/P2.b/P2.e reconcile against, **is computed with the extraction's own
   regex**. If the regex refuses a rendered entry, pairs and entryCount fall together. This is the
   hazard he named one level up, recurring inside the instrument that named it.

The gate's own stale block carries an **independent count of itself** in its header
(`RED — ${stale.length} stale baseline entry/entries …`, line 978), and the harness carries a
third, stronger reference: the **construction inputs**.

## Construction discipline (same as his, applied here)

Nothing that carries the property under test is typed. The entry **separator** and the fallback
verdict are sliced out of the gate's own emitter template; the excluded verdict out of the gate's
own `const stale = baseline.filter(…)` statement; the vocabulary out of `const LABELS = [`; the
**header count regex** out of the gate's own header template. Known positives carry the property
because the gate's own source put it there. Four cells, ONE synthetic repository, one pass, so
every comparison is within-harness. No tracked file in the real repository is written.

**Cells** (baseline entries → rendered verdicts; tracked is always `P_M1` marked):

| cell | second baseline entry | property that entry carries |
|---|---|---|
| `T-CLEAN` | `P_A01` | CONTROL — no whitespace, no vocabulary token |
| `T-COLLIDE` | `P_COL` (stem = the excluded verdict, sliced) | a vocabulary token in the path field (his KP, re-driven here) |
| `T-SPACE` | `P_SPACE` (a space sliced out of the emitter separator) | whitespace in the path field |
| `T-EMBED` | `P_EMBED` (the emitter separator + a sliced label + tick) | the reader's own anchor text in the path field |

**Five readers** over the same captured stderr: `strict` (his specification verbatim), `lazy`
(`` /^\s+(.+?)\s+→ now `([A-Z]+)`$/ ``, the candidate cure), `containment` (his P2 defect, kept
live), `unanchored` (his regex with `^`/`$` dropped), `firstToken` (his line shape, label taken as
the first `[A-Z]+` run on the line).

**Four grading criteria**: `separation` (injectivity across cells), `self` (pairs vs entry lines
counted **by that reader's own regex**), `header` (pairs vs the count the block declares about
itself), `truth` (pairs vs the construction inputs).

## Predictions

**P1 — his routed figures, reproduced under my own drive, not taken.**
- **P1.a** On `T-COLLIDE`, equality reads exactly **2** labels, containment exactly **4**, and the
  containment multiset is a strict superset.
- **P1.b** Containment pair extraction exceeds the rendered entry count on `T-COLLIDE` and only
  there, and mints exactly one pair labelled with the excluded verdict.
- **P1.c** The containment-extracted pair set separates **the same number of cells** as the
  correct extraction does — injectivity blind to over-reporting.
- **P1.d** CONTROL: on every cell with no vocabulary token in a path, equality and containment
  agree exactly.

**P2 — the specified extraction REFUSES, silently.** (headline)
- **P2.a** On `T-SPACE` the block header declares **2** stale entries and the `strict` reader
  extracts exactly **1** pair.
- **P2.b** The dropped path is exactly the whitespace-bearing one; **no** captured path contains
  whitespace on any cell, under any reader.
- **P2.c** On `T-EMBED` the header declares **2** and `strict` extracts exactly **1**.
- **P2.d** The `lazy` reader extracts exactly the header's count on **all four** cells, and its
  pair set equals the **construction ground truth** on all four.
- **P2.e** CONTROL: on the two cells whose paths carry no whitespace (`T-CLEAN`, `T-COLLIDE`) the
  `strict` and `lazy` extractions are identical — the cure is a widening, not a rewrite.
- **P2.f** `strict`'s pair set separates **3 of 4** cells, not 4: `T-SPACE` and `T-EMBED` are two
  different documents that reduce to one pair set under it. Refusal defeats injectivity in the
  direction over-reporting does not.

**P3 — a criterion computed with the extraction's own regex cannot see a refusal.**
- **P3.a** On `T-SPACE`, `self` is **GREEN** for `strict` while `header` is **RED**.
- **P3.b** Same on `T-EMBED`.
- **P3.c** CONTROL: on `T-CLEAN` and `T-COLLIDE`, `self` and `header` agree for `strict`, both
  green.
- **P3.d** `self` is **RED** for `containment` on `T-COLLIDE` — the criterion is not simply dead;
  it sees over-reporting and is blind only to refusal.

**P4 — header reconciliation is necessary and NOT sufficient.**
- **P4.a** `unanchored` yields one pair per rendered entry on all four cells, so **both** `self`
  and `header` are green for it everywhere.
- **P4.b** On `T-EMBED`, `unanchored` **mints** a pair whose path is not a baseline entry at all,
  and `truth` reddens it.
- **P4.c** `firstToken` yields one pair per parsed line on every cell — `self` and `header` green
  everywhere — and on `T-COLLIDE` assigns the **excluded verdict** to the token-bearing path, a
  label that line does not render. `truth` reddens it.
- **P4.d** Across the four defect mechanisms (over-report, refuse, mint, mis-assign), exactly one
  criterion reddens all four: `truth`. Stated as a 4×4 table in `RESULTS.md`.

**P5 — reach, and limits registered before measuring.**
- **P5.a** Live baseline entries containing whitespace: **measured, not asserted**. Reach, not a
  live red, unless the overlap is non-empty.
- **P5.b** Live tracked paths containing whitespace: measured at a `date`-read time.
- **P5.c** This unit's own cell names and capture filenames carry **no** vocabulary token, so its
  tracked captures add **0** members to the token-bearing class Daedalus's P8 counts — continuing
  his 11-23 WORK §4 practice rather than restating his figure.

## Declared limits

- `unit-503`…`-509` share one harness shape. Nothing here corroborates a general byte-law form.
- Four of the five readers are **constructed to fail** in a named way; they are known positives for
  the criteria, not candidates for landing. Only `lazy` is offered as a cure.
- `truth` is available **only inside a harness that built the document**. A tracked reader standing
  in front of a real gate run has the header and nothing stronger, so P4's conclusion is a bound on
  what any landed reader can self-check — not a recipe it can use.
- The `ABSENT`-hole root (no key derived from `LABELS` can see a token outside `LABELS`) is
  untouched here.
- **Enforcement stays blocked by the thing Daedalus named:** nothing in the tree reads stale-limb
  stderr programmatically, so a landed assertion still has no subject. This unit grades a
  specification; it does not land one.
