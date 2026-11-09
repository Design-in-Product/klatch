# `unit-465rekey377` — item 1 of the 372–377 family pass: `probe-round377`'s six-site re-key

**Seat:** Daedalus. **Fire:** 2026-11-09 START (`date`-read 09:17 PST before this was opened).
**Baseline rev:** `3b086025` (`baseline-rev.txt`).
**Subject:** `scripts/probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts`.

## Why this unit exists, and who named it

Theseus's 11/08 STOP memo and Argus's 11/09 START memo both close on the same sentence: *item 1,
`round377`'s six-site re-key, is Daedalus's and is not started.* It is the **unconstrained head** of
the family pass — no other swept probe pins `round377`'s arm count — and the other three members
cannot be guarded until it lands, because guarding `round374` or `round375` reddens three of this
file's arms and guarding `round373` reddens `round374`'s `A0`.

The six sites, all live conjuncts, at the baseline rev:

```
:137  e374.expect.source === String.raw`All 8 regression checks passed` &&   (A1)
:138  e375.expect.source === String.raw`All 8 regression checks passed`,     (A1)
:672  c374Faithful.own === 'All 8 regression checks passed' &&               (C1)
:673  c375Faithful.own === 'All 8 regression checks passed',                 (C1)
:686  c374Renamed.own === 'All 8 regression checks passed',                  (C2)
:698  c375Renamed.own === 'All 8 regression checks passed',                  (C3)
```

## What landed, and why the two positions got different cures

Two replacements, not one, because the two positions are not the same claim. The full argument is in
the subject's own docblock at the `HEADLINE_SHAPE` declaration; in short:

| position | reads | cure | why not the other cure |
|---|---|---|---|
| `A1` (`:137`/`:138`) | the registry **alone** | `HEADLINE_SHAPE.test(e.expect.source)` | there is no second source to agree with, so `expect.test(…)` is unavailable; re-keying the conjunct to the registry it already reads would be vacuous |
| `C1`/`C2`/`C3` | a **drive** against the registry | `agrees(e.expect, own)` | shape-only still passes when a member's arms silently vanish, which is most of what these arms are for |

Also de-numbered, same fire, same mechanism (a published sentence nothing checks — Argus's
`unit-465skipE` precedent, cured by **removing** the number rather than refreshing it):

- `C1`'s reason prose, "are green on 8" → the count their own registry entry declares, with both
  printed and both pins interpolated live.
- `C5`'s reason prose, "green on 8 (C1)" → "green on their own declared count (C1)".
- the `drive()` comment that named `probe-round373`'s total (`All 15 …`) to explain why the LAST
  verdict line is taken rather than the first — the property stated, the sibling's number dropped.

**Rejected and recorded so the pass is not re-deriving it:** `e374.expect.source ===
e375.expect.source`. The two agree today, but nothing requires two independent probes to carry one
arm total and the pass could legitimately move one alone — that conjunct pins a coincidence and
manufactures the same false red one layer along.

**Arm count unchanged at 13**, derived not recalled (`check(` label scan: `A1 A2 A3 B1 B1c C0 C0b C1
C2 C3 C4 C5 C6`). This is what makes item 1 the head: the registry entry for `round377` is untouched,
so no sibling's pin moves and nothing else in the family is reddened by this commit.

## Drives, behaviour-preservation leg

| cell | capture | result |
|---|---|---|
| baseline, pre-cure bytes at `3b086025` | `drive-0-baseline.txt` | exit 0, **All 13 regression checks passed** |
| cured bytes | `drive-1-cured.txt` | exit 0, **All 13 regression checks passed** |

Typecheck (`npm run typecheck:scripts`, both script tsconfigs): clean.

## PRE-REGISTRATION — the grading leg, written before the instrument was built or run

A re-key that is green on the tree it was written against has shown nothing. What has to be shown is
that the cured spelling **and** the pre-cure spelling disagree on exactly one axis — the legitimate
move — and agree everywhere else, including where the arm must redden.

Instrument: `grade-the-headline-rekey.mjs`. Both spellings are **sliced out of real bytes, not
re-typed**: the pre-cure conjuncts out of `git show 3b086025:<subject>`, the cured ones out of the
live file, each located by an anchor asserted to occur exactly once, then evaluated against
synthesised registry entries and `Drive` values. The rejected shape-only spelling is carried as a
third column so the reason it was rejected is measured rather than preferred.

Predictions, all pre-registered here and graded as written (`PRE` = pre-cure spelling, `CUR` = cured,
`SHP` = the rejected shape-only spelling):

| # | cell | PRE | CUR | SHP |
|---|---|---|---|---|
| P1 | FAITHFUL — pin `All 8`, drive printed `All 8` | true | true | true |
| P2 | **BUMPED** — the pass's legitimate move: pin `All 10`, printed `All 10` | **false** | **true** | true |
| P3 | **DISAGREE** — pin `All 10`, printed `All 8` (a hand-typed bump with no arm added) | false | **false** | **true** |
| P4 | **VANISHED** — pin `All 8`, printed `All 2` (arms silently disappear) | false | **false** | **true** |
| P5 | RED DRIVE — `own === null`, the drive went red | false | **false** | false |
| P6 | A1 axis, BUMPED — pin source `All 10 regression checks passed` | **false** | **true** | n/a |
| P7 | A1 axis, NOT A HEADLINE — pin source `Done: 8 checks` | false | **false** | n/a |
| P8 | A1 axis, A STRING not a RegExp — `expect` is `'All 8 regression checks passed'` | false | **false** | n/a |

P2 is the defect this unit exists to remove. **P3 and P4 are the legs that make the re-key a
measurement rather than a loosening** — and P3/P4 under `SHP` are the measured reason shape-only was
rejected at `C1`/`C2`/`C3`: it passes both. P5 is the vacuity leg: a `null` that short-circuited to
true would make the arm pass on the failure it exists to catch.

**Known cost, stated rather than discovered later:** the cured `A1` no longer catches a wrong value
hand-typed into the registry with no arm added. That claim has not been dropped — it moved to `C1`,
where it is driven rather than read off source text, which is this whole 375/376/377 chain's thesis.
P3 is the leg that proves it actually arrived there.

## RESULT — written only after the instrument was driven

**`grade-run-2.txt`: All 13 grades true, exit 0.** Seven `[MEAS]` rows publish every sliced
expression verbatim, so each predicate graded below can be read against the bytes it came from.

**One prediction missed, and it is the most useful row in the table.** `grade-run-1.txt` — committed,
not discarded — returned **1 of 12 FAILED: P3 DISAGREE**. The pre-registration put `PRE` at `false`;
the drive returned `true`. The mechanism, once seen:

> The pre-cure conjunct `c374Faithful.own === 'All 8 regression checks passed'` reads the DRIVE
> against a frozen literal and **never reads the registry at all.** In the DISAGREE state the pin
> moved to `All 10` and the printed headline is still `All 8` — which still equals the literal, so
> the old conjunct passes.

I predicted at **arm** level while the cell grades **one conjunct**. The cell's expectation was
corrected to `true` after the drive; the correction is recorded in the instrument's own docblock, the
failing run is kept as the artefact, and the pre-registered table above is left exactly as written.

The miss made the result **stronger than predicted**, and exposed a leg the pre-registration did not
have — added as **`P3b`**, which closes the cost this unit had named as open:

| | the DISAGREE state (pin hand-bumped, no arm added) |
|---|---|
| pre-cure file | reddens at **`A1`** (its source-text pin on the registry) — `C1` passes blind |
| cured file | reddens at **`C1`** (driven registry-vs-file agreement) |

So the claim was not dropped by the re-key: it **moved** from a source-text pin to a driven agreement
pin, which is this 375/376/377 chain's own thesis. And the pre-cure `C1` conjunct turns out never to
have been an agreement pin at all — it was a constant pin that happened to agree. The re-key is a
**strengthening** at `C1`, not merely a desensitisation.

### The table as driven

| # | cell | PRE | CUR | SHP (hand-typed, rejected) |
|---|---|---|---|---|
| P1 | FAITHFUL | true | true | true |
| P2 | **BUMPED** — the pass's legitimate move | **false** | **true** | true |
| P3 | **DISAGREE** | true *(corrected, was predicted false)* | **false** | **true** |
| P3b | DISAGREE, arm level | reddens at `A1` | reddens at `C1` | n/a |
| P4 | **VANISHED** — arms silently disappear | false | **false** | **true** |
| P5 | RED DRIVE (`own === null`) | false | **false** | false |
| P6 | A1, BUMPED | **false** | **true** | n/a |
| P7 | A1, not a headline pattern | false | **false** | n/a |
| P8 | A1, a string not a RegExp | false | **false** | n/a |

**P2 is the defect removed:** the one axis on which the two spellings disagree is the legitimate move,
and the cured spelling is the one that survives it. **P4 is the measured reason shape-only was
rejected** at `C1`/`C2`/`C3` — it passes a member whose arms vanished; so does it in P3. **P5 is the
vacuity leg** — a `null` that short-circuited to true would make the arm pass on the failure it
exists to catch; `agrees` spells it rather than defaulting it.

### Legs that keep the one graded conjunct from standing for more than it is

- **`S-*` (3 grades).** P1–P5 grade the `round374` conjunct of `C1`. The other three cured
  C-conjuncts are *derived* from it by identifier substitution and each is asserted to occur exactly
  once in the live file — so "same shape" is checked, not claimed. One known positive per shape is
  coverage of one axis.
- **`L1`/`L2`.** That the six sites are gone from **code**, not just from the lines quoted in a memo,
  read through the repo's own shared reader (`stripSource(src, false)`, comments blanked, strings
  kept) rather than a hand-rolled grep: headline literals go **6 → 0** in the code reading, while
  **2 remain raw**, both docblock prose describing this cure. Regex bodies are blanked in both of
  that module's readings, so `HEADLINE_SHAPE` cannot be counted by this leg.
- **Every spelling but one is a slice.** `PRE` out of `git show 3b086025:<subject>`, `CUR` out of the
  live file, and `HEADLINE_SHAPE`'s initializer and `agrees`'s body out of the live file too — a
  grader that re-typed either would be grading its own copy of the cure. `SHP` is the single
  hand-typed column, and it is labelled as such in the instrument, in every printed row, and here,
  because it is a rejected alternative that was never shipped and so exists in no bytes to slice.
- **The grader has a known positive of its own:** it went red on run 1, at the single cell whose
  expectation was wrong, naming that cell. An instrument that has only ever been green has not shown
  it can redden.

## What this unblocks, and what is explicitly NOT done here

Item 1 is done. Theseus's revised order (his 11/08 STOP §2, which I accept) now runs from step 3:

- **Step 2 is withdrawn** — `round374:201`'s `all15` folds into step 3 as two arms and four prose
  sites in his file, his correction, his file.
- **Step 3** — the four guards and four bumps in one commit: `373` 15→16, `374` **8→10**, `375`
  **8→10**, `377` 13→14. Two of the four are at +2, from opposite directions (his `A0g` second
  lookup; my `round375:180` mutant-import presence). **Not started here**, and the named blocker is
  that it is a four-file edit needing its own pre-registration, which is not a START fire's to mint.
- **Step 4** — `round374b`, separately, his.
- **Unowned successor, flagged by Theseus and not claimed by this seat:** `scripts/lib/` holds 23
  files and **none** mentions `SWEPT` (his `readdirSync` figure and his greps, not re-derived here —
  labelled as his). Five private unguarded registry lookups across five members, each about to grow
  its own private guard arm in step 3. Extracting the shared reader *inside* the family pass would be
  an instrument grading its own change; it needs its own unit.

**One thing this unit does NOT claim.** `round377`'s own three unguarded `SWEPT.find(…)!` lookups at
`:96`/`:97`/`:98` are untouched. They are step 3's `377` 13→14 guard arm, not item 1 — and had I
added the guard here, this commit would no longer be the unconstrained head.

