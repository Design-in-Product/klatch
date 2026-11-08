# unit-465declpop — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-07 STOP · **Model:** `claude-opus-5`
**Baseline rev:** `f9d3127f` · **Cure committed at:** `7b1214db` (before being driven under the treatment)
Predictions and landing rule: `PRE-REGISTRATION.md`, committed at `ce5144fe` as the only file in
this directory before any instrument in it existed.

## Headline

`SWEPT` can hold more than one `skip:` now. The four arms that made it a one-declaration registry
are re-keyed on a live reading of the declaration population, all five probes are green with
Daedalus's entry pasted, and each re-keyed arm has been driven RED as the **sole** failing arm on a
registry whose declaration population genuinely moved.

**The memo's axis was right and its count was low.** Daedalus named the frozen pair
`filter((s) => s.skip).length === 1` and said five arms. There are **three root mechanisms across
four arms**, and the frozen pair is only two of them; the remaining **eight** failing arms are
downstream child drives that clear with no edit at all.

## P1 — baseline (HELD)

`pre-grading.txt`, tree as synced. 26 / 15 / 8 / 8 / 13, exit 0 on all five.

## P2 — the counterfactual, reproduced under my own hand (HELD, cell for cell)

`post-grading.txt`, with `unit-465adopt/apply-promotion.mts` run verbatim — a second `skip:` in
`SWEPT`, three declarations where there were two, nothing else changed.

| probe | Daedalus's table | driven here |
|---|---|---|
| round372 | 1 of 26 | **1 of 26** |
| round373 | 1 of 15 | **1 of 15** |
| round374 | 3 of 8 | **3 of 8** |
| round375 | 2 of 8 | **2 of 8** |
| round377 | 5 of 13 | **5 of 13** |

## P3 — the census (declared measurement; the finding this unit adds)

Eleven failing arms, read off each run's own `REGRESSIONS:` block rather than grepped for. **Three
root mechanisms, and a literal grep for `skip:` across `scripts/` cannot see any of them** — the
predicate is a property access, and in two of the four arms it is not a count at all:

1. **A frozen MEMBER LIST, object-level.** `probe-round372` A2: `JSON.stringify(SWEPT.filter((s) =>
   s.refusal || s.skip).map((s) => s.file)) === JSON.stringify([R225])`, plus "no entry declares one
   without the other" — which Daedalus's entry violates *legitimately*, since it declares a `skip:`
   and no `refusal:`.
2. **A frozen member list under an independent SOURCE-TEXT selector.** `probe-round373` A2:
   `owners.length === 2 && owners.every((o) => o === R225)`, where `owners` comes from walking the
   registry's source and attributing each declaration line to the nearest preceding `file:` line.
3. **The frozen pair COUNT.** `probe-round374` A5b and `probe-round375` A5 —
   `filter((s) => s.refusal).length === 1 && filter((s) => s.skip).length === 1`. The one the memo
   names, and the only one a census over `.(skip|refusal)).length` finds.

## P4 — inheritance (HELD)

The other **eight** failing arms are controls that drive sandbox copies of `probe-round373`, `374`
and `375` as children against a **verbatim copy of the live registry** and assert the child is
green: `round374` A0/A1, `round375` C1, and all five of `round377` C1–C5. They redden because their
children do. **No edit to `probe-round377` was needed or made** — curing the three root mechanisms
cleared its five reds, and its five asserted child-drive failing-arm lists did not move.

## The cure (`7b1214db`)

* **`round374` A5b, `round375` A5** — `=== 1` → the mutant registry's declaring member list, with
  per-entry refusal/skip presence, must **equal** the shipped one. **Strictly stronger** than the
  count it replaces: a declaration that moved to another entry, or a refusal swapped for a skip,
  passes `=== 1` and fails this. Written out in each file rather than shared, because borrowing one
  helper would make the two arms one reading instead of two.
* **`round372` A2** — re-aimed. The "only entry" and "never one without the other" clauses are
  **withdrawn as pass conditions, not weakened**: neither was ever a requirement of this probe, and
  what section B needs is that the entry it is keyed on declares **both** patterns, so the tuples
  built from its own declared sources reach both BLOCKED limbs. The live member list is named in the
  reason string so a reader sees the population the run met.
* **`round373` A2** — keeps what it was for, which is cross-key agreement with `round372` A2 under a
  selector that shares neither the source nor the matcher, by comparing the two populations
  **entry-by-entry and count-by-count** instead of freezing the two lines the registry carried that
  day. One conjunct added: no **orphan** declaration line, i.e. every line the source walk finds
  attributes to an entry the object-level selector also calls a declarer — a
  nearest-preceding-`file:` walk is exactly what would otherwise pick up a declaration inside a
  `DEFERRED` comment block.

## P6 — the cure under the second declaration (HELD)

`cured-second-grading.txt`, cure in and the entry pasted: **26 / 15 / 8 / 8 / 13, exit 0 on all
five.** 5 of 5 restored at full counts, not merely "fewer reds". The registry blocker is cleared.

## P7 — the cure on the clean tree (CONTROL, HELD)

`cured-clean-grading.txt`, cure in and the entry absent: 26 / 15 / 8 / 8 / 13, exit 0. Driven and
recorded **before** the cure was committed, so the arms were not moved to fit the treatment.

## P5 — the cure is not a relaxation (CONTROL, HELD on three of four arms; one ungradeable)

Three declared cripples, each removed before this file was written, each asserting the re-keyed arm
goes RED and is the **sole** failing arm — so the red is attributable to the population change and
not to a registry that stopped parsing:

| cripple | state | result |
|---|---|---|
| `X2` (`round374`) | a declaration appears on an entry that is not round225, in the mutant registry only; round225's own two intact | **`1 of 8 FAILED`, A5b the only arm** |
| `Y1` (`round375`) | same state, built independently in that file's own mutant | **`1 of 8 FAILED`, A5 the only arm** |
| `Z1` (`round373`) | the source-text selector widened to take `expect:` lines, so the two populations disagree with every object-level member still present | **`1 of 15 FAILED`, A2 the only arm**; the arm printed `3 of 45 declaration line(s) found`, so the orphan conjunct caught it too |

**`round372` A2 has no driven control, and this is reported rather than papered over.** Its
deciding state is a registry where round225 declares only one of the two patterns — and `A1b`,
upstream of A2, dereferences `r225.skip!`, so that state crashes the file before A2 runs. A2 is
**ungradeable** there, not green.

The same shape was measured directly and is why it is stated as a limit rather than guessed:
cripple **`X1`** destroyed round225's declaration in `round374`'s mutant and the probe died at
`:366` on `mutantR225.refusal!.source` — `TypeError: Cannot read properties of undefined`,
`cripple-X1.err` — **before A5b was reached**. A crash is a non-zero exit the sweep reads as red,
and it is not the arm reddening. X1 establishes nothing about A5b and is recorded as the reason X2
had to be built the way it was.

**What no cripple here establishes:** that the new key is *strictly stronger* than `=== 1`. X2, Y1
and Z1 all drive population changes the old count would also have caught. The strengthening claim
rests on reading the predicate — a count-preserving membership move is the state that separates
them, and it cannot be driven through these arms, because moving either of round225's declarations
crashes the file upstream exactly as X1 did. Argued, not measured, and labelled as such.

## P8 — gate (HELD)

`gate.out`: `GATE ok exit=0` on census, typecheck, server, client and the aggregate. Server
**143 / 2221 passed | 1 skipped (2222)**; client **26 passed | 13 skipped (39)** files and
**333 passed | 13 skipped (346)** tests — byte-identical to this morning's figures, as expected for
a unit that adds no vitest test. A moving gate would have been the finding.

## Restoration

Verified against a pre-action baseline taken from git, not a quiet `git status`:

* `grep -rln 'U465DECLPOP' scripts/ packages/` → **no files**.
* `git diff --stat 7b1214db -- scripts/ packages/` → **empty**, so all four probes are
  byte-identical to the committed cure.
* `git diff --stat f9d3127f -- scripts/ packages/` → exactly the four cure files,
  **110 insertions / 19 deletions**, and nothing else. `sweep-probes.mjs` is untouched: the pasted
  entry was applied twice and restored twice, and the declaration count is back at 2.

## What is now open, and whose it is

* **Daedalus's, and unblocked by this unit.** The promotion of
  `probe-backfill-sidecar-neutrality.mts`. The entry to paste is still verbatim in
  `unit-465adopt/apply-promotion.mts`'s `header` array; the five graders are green under it, driven
  here. I have not re-taken his promotion — it is his decision and his attestation.
* **Not claimed, named with its blocker.** `round372` A2's deciding control, and the
  strictly-stronger claim for all four arms. Both need the same thing: an entry whose declarations
  can be moved without the probes' upstream `r225.skip!` / `r225.refusal!` dereferences crashing
  first. That is a change to those probes' A1/A1b arms, not to the cure, and it is a separate unit.
* **Mine, unchanged.** E4/E5.
