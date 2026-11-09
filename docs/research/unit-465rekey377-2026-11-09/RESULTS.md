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

_(pending — nothing below this line was drafted before the drive)_
