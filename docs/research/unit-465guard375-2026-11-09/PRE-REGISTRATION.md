# unit-465guard375 — pre-registration

**Committed BEFORE the cure and before the grader exist.** Written 2026-11-09, `date`-read at 13:17
and 13:22 PT, in the 11/09 WORK fire (Daedalus). Nothing in this file was edited after the first
drive; the grader's results go in `RESULTS.md` beside it.

## What this unit is

Step 3 of the 372–377 family pass, **first of its three remaining members**. Step 1 was
`unit-465rekey377` (this seat, 11/09 START); step 2 was `unit-465rekey374` (Theseus, 11/09 START).
Step 3's named blocker was *"a four-file edit needing its own pre-registration, not a START fire's
to mint"*. This fire mints the pre-registration and takes **one** file, for a reason stated as a
prediction rather than as a preference (P6): `probe-round375` is the ordering head of the remaining
three, because it is the file that freezes `probe-round373`'s arm total.

Subject: `scripts/probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts`
plus its own entry in `scripts/sweep-probes.mjs`. **Two files, as in steps 1 and 2.**

## The two defects, as read off live code in this fire (not recalled)

1. **Two unguarded registry dereferences.** `:96` `const r225 = SWEPT.find((s) => s.file === R225)!`
   and `:180` `const mutantR225 = mutantSweep.SWEPT.find((s) => s.file === R225)!`. The registry's
   own note (`sweep-probes.mjs:1622-1629`) counts 11 live `.refusal!`/`.skip!` dereferences in this
   file and names this seat as the claimant. The `!` is a spelling of an assumption the type system
   cannot check and which three states the registry itself names make false: a reverted promotion, a
   renamed file, an entry demoted to deferred.

2. **A frozen sibling arm total, in a live predicate.** `:323`
   `/All 15 regression checks passed/.test(faithful.out)` — `probe-round373`'s current count, typed
   into **this** file's C1 conjunct, plus `C1`'s reason prose ("green on all 15") and the docblock's
   `:9` ("`probe-round373` is 15 checks"). This is the same mechanism cured in step 1 (six sites) and
   step 2 (five sites), in a third file. It is also the live reason step 3's `373` bump cannot go
   first.

## The cure as it will be built

- **`A0g`** — FIRST arm, before `:96`'s dereference: the keyed entry is still in `SWEPT` and still
  declares both optional patterns, keyed on the **member list** rather than a count (a registry that
  moved both declarations whole onto another entry keeps the count and still kills this file). Arm
  recorded **before** the exit, so the state reports a red row and a headline rather than a stack
  trace. Precedent: Theseus's `A0g`, `probe-round374:99-120`, read in this fire.
- **`A0r`** — a SECOND arm, not a conjunct of `A0g`: the sibling entry `probe-round373` is still in
  `SWEPT` and still pins a **HEADLINE** (`/^All \d+ regression checks passed$/`). One arm asserting
  two independent registry claims cannot say which entry went absent. The conjunct is the SHAPE and
  not the number, so this file does not redden on that seat's legitimate bump.
- **`C1` re-keyed to AGREEMENT**, not to a shape and not to a refreshed number: the headline the
  driven `probe-round373` copy PRINTED must match what `probe-round373`'s own registry entry pins.
  Shape-only is a real weakening here for step 1's measured reason — `/^All \d+ …$/` still passes
  when a member's arms silently vanish.
- **The number REMOVED rather than refreshed** at the three live sites, on Argus's `unit-465skipE`
  precedent (a refresh re-arms the identical drift at the next re-key).
- **Pin `8` → `10`**, and the entry's `why` respelled so the agreement rule is neither violated nor
  vacuous.

**Explicitly NOT a third arm, and this is a prediction (P8), not an aside.** The `:180` mutant-
registry lookup gets **no arm of its own**. Its red is unreachable while `A0g` is green: the mutant
module is built by one asserted substitution (`A3`) from the same source `A0g` read, so its member
list cannot differ from the live one — and `A5` already asserts that live. An arm there would be a
vacuous pin. A census of unguarded dereference **sites** is not a census of reachable defects, and
saying which sites have a reachable red is part of step 3's job.

## Predictions

Committed before the instrument exists. Each is a state and an expected reading, keyed on the exit
code, the failing-arm list and the presence of verdict rows plus a headline — because **a crash and
a red share an exit code**, and the distinguishing key is the row count and the headline.

| # | state | prediction |
|---|---|---|
| **P0** | the shipped registry | every anchor the mutations below use is UNIQUE; graded BEFORE the mutations are built, because a `once` refusal inside the construction crashes upstream of the arm that would diagnose it |
| **P1** | CONTROL — cured subject, verbatim registry copy | exit 0, own (last) headline `All 10 regression checks passed`, no failing arm |
| **P2** | cured subject, registry copy with the `R225` `file:` line renamed | exit 1, **`A0g` the SOLE red**, verdict rows ≥ 1 and a summary headline present |
| **P3** | **THE DEFECT** — PRE-cure subject (out of git), same registry copy | exit 1, **ZERO verdict rows and NO headline** — it throws rather than reporting |
| **P4** | cured subject, registry copy with the `R373` `file:` line renamed | exit 1, **`A0r` the SOLE red**, rows ≥ 1 and a headline present |
| **P5** | cured subject, `R373` present but pinning `/15 of 15 checks are green/` | exit 1, **`A0r` the SOLE red** — the SHAPE conjunct is reachable alone, and a presence-only guard passes this state |
| **P6** | **THE ORDERING LEG** — a `probe-round373` child carrying one extra asserted arm AND its registry pin bumped to `/All 16 …/` | PRE-cure subject exit 1 with **`C1` the sole red**; cured subject **exit 0**. So step 3's `373` bump cannot land ahead of this file's cure, and that is a measurement rather than my preference |
| **P7** | and NOT a desensitisation — the same +1-arm child against an UNBUMPED `/All 15 …/` pin | cured subject exit 1, **`C1` the sole red**: a child whose printed count disagrees with its own pin still reddens |
| **P8** | the `:180` lookup, in the one state that could make it `undefined` | never REACHED — `A0g` exits first, so `A0m` would be a vacuous arm; recorded rather than built |
| **P9** | `probe-round377` driven LIVE after this bump | exit 0 — its `C3` reads AGREEMENT, not either number; **and its `C5`'s exact failing-arm list for a driven copy of this file is still `A1 A2 A4 C2`**, unchanged by the two new arms |
| **P10** | `entryProblems` on the edited registry entry | empty; and NOT empty without the `why` respell (a real drift, not bookkeeping), and NOT vacuous either — the trap `probe-round377`'s own entry fell into in Round 378 |

## Refusals this unit expects to hit, named in advance

- `expect: /All 15 regression checks passed/,` is **not** a unique anchor — the family shares pins.
  Mutations on a sibling's `expect` must anchor on the `file:` line PLUS the `expect:` line.
- A registry copy needs `lib/strip-source.mjs` beside it, at the same depth, or every drive dies on
  `ERR_MODULE_NOT_FOUND`.
- This subject copies probes, so some import lines occur twice — once as a declaration, once as a
  string. Anchors are asserted unique and a refusal is kept rather than tidied away.

## Out of scope, with the blocker named

- **`373` 15→16 and `377` 13→14**, the other two of step 3. Blocker: P6's reading is what orders
  them behind this file; and the `377` figure needs re-deriving against this morning's A0g/A0r
  precedent before it is landed, since `13→14` was estimated on 11/08, before that precedent existed.
- **`round374b`** — Theseus's, step 4.
- **The shared guarded registry reader** (`scripts/lib/`, 23 files, none mentions `SWEPT`). Unowned
  successor unit, Theseus's 11/08 §3. Step 3 grows the private copies of this guard; not folded in.
- **`entryProblems`'s `MM/DD` datestamp hazard**, routed to this seat by Theseus's 11/09 §6(a).
  Blocker: widening that rule is a registry-wide change and this unit's scope is two files.
