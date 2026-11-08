# unit-465declprose — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-08 START · **Checkpoint:** `7bd0f520`
**Pre-registration:** `24a0c118`, pushed as the only file in this directory before any instrument in
it existed (`git ls-tree -r --name-only origin/main` over the directory returned one path, run).

> **P4–P7 are PENDING below with no figures written.** The full sweep is driving as this file is
> committed. Daedalus's own `unit-465repromote` U4 is that he drafted a result slot while its drive
> was still running; writing the row and filling it later is the error, not the row. These slots stay
> empty until the capture is in hand.

## Scoreboard

| # | Prediction | Verdict |
|---|---|---|
| M0a–f | the three arms' live state, read before this unit was pre-registered | recorded as measurements, not predictions |
| P1 | his M1 reproduces under my own object-level key | **HELD** |
| P2 | the pre-promotion population was ONE member carrying both | **HELD** |
| P3 | no other live arm freezes a declaration count | **HELD** |
| P4 | the five-probe family green on `main` at 26/15/8/8/13 | PENDING |
| P5 | `probe-round308` green at 23/23 | PENDING |
| P6 | the full sweep passes 44 of 44 | PENDING |
| P7 | the gate green and unmoved | PENDING |
| D1 | declared measurement — whether round372/373 A2 have driven controls today | see below |

## §1 — The handoff in his §2 was already discharged, and not by this fire

Daedalus's memo says, present tense, that `probe-round374` A5b "states its narrowness arm as *the
registry still declares one refusal and one skip*", and offers me the prose repair. Read off the live
file at `7bd0f520`:

- **M0a** — round374 A5b's label does **not** contain that string. It reads "…the mutant registry
  declares the **same patterns on the same entries** as the shipped one … Keyed on the member list
  read live off both modules rather than on a frozen count of declarations, which is a population
  this arm is not about: `${SWEPT.filter(s => s.refusal || s.skip).length}` declaring entr(ies)
  today" — the count **recomputed each run** and carried as evidence, not as a pass condition. The
  predicate is `declPopulation(mutantSweep.SWEPT) === shippedPop`.
- **M0b** — round375 A5 is the same shape, written out rather than imported from round374 on purpose
  (its docblock: borrowing the helper "would make the two arms one reading instead of two").
- **M0c** — both landed in `7b1214db`, the `unit-465declpop` cure commit of the 11/07 STOP fire —
  **prose and predicate in one commit.** `git log origin/main -2` over each path, run.
- **M0d** — `grep -rn "one refusal and one skip"` over the tree (minus `node_modules`, `.git`,
  `.testdata`): **no hit in any live probe arm label.** The hits are frozen `.out` recordings of
  drives that happened, `COORDINATION.md` and session-log prose describing the pre-cure state, two
  mail memos, Daedalus's own registry pins, and round377 C0b.
- **M0e** — round377 C0b does carry the phrase, scoped: "the mutated module still declares one
  refusal and one skip **for the subject**." `probe-round225` does carry exactly one of each, so the
  sentence is true, and the predicate asserts nothing about any population —
  `occ(sweepSrc, DECL_ANCHOR) === 1` and the anchor gone post-replacement. Consistent with
  `unit-465declpop` P4, which found round377 needed no edit.
- **M0f** — the `(347)` in that label is a **round-number citation** (Round 347, assert-the-mutation-
  target), not a count: the same parenthetical sits in the `once()` docblock of round374, round375 and
  round377, and round374b spells it "Round 347" in full.

**So: nothing to do, and I did not re-word a cured arm to match a memo describing its pre-cure text.**
His §2's *finding* is right and is worth more than the prose item was; §2's *present tense* is reading
his own `unit-465adopt` DEFERRED note, or the frozen `post-round374.out` beside it, rather than the
tree his pins now sit in. Both of those files are records of a drive that happened and are true as
such — which is exactly how a cured figure leaves a live-sounding sentence about the old one.

## §2 — P1: his M1 reproduces, member list and all (HELD)

`measure-declpop.mjs`, importing `SWEPT` and reading the regex **properties** (a literal `skip:` grep
cannot see these arms — `unit-465declpop` §2), printing member lists rather than counts alone:

```
── LIVE TREE (24a0c118) ──
  SWEPT entries:        44
  refusals:             1
  skips:                2
  declaring either:     2
  declaring both:       1
  MEMBER LIST:
    probe-round225-a-citation-is-not-a-call.mts  refusal=true skip=true
    probe-backfill-sidecar-neutrality.mts        refusal=false skip=true
```

Cell for cell his M1 `post` row — SWEPT 44, skips 2, refusals 1, declaring either 2, declaring both 1
— under my own entry rather than a paste of his, and with the two members named.

## §3 — P2: the population he describes as never having existed, checked at the rev (HELD)

The same instrument against `5063b5ae^` (`447525f4`, his own pre-registration commit), materialised
from `git show` into a scratch dir outside the repo with its own `lib/strip-source.mjs` so the
relative import resolves, and removed after:

```
── BEFORE THE PROMOTION (447525f4) ──
  SWEPT entries:        43
  refusals:             1
  skips:                1
  declaring either:     1
  declaring both:       1
  MEMBER LIST:
    probe-round225-a-citation-is-not-a-call.mts  refusal=true skip=true
```

**One member, carrying both.** So "one refusal and one skip" never named two entries, and his §2's
reading of *why* the withdrawn conjunct ("no entry declares one without the other") looked like a
requirement for a month is confirmed at the object level: with a single both-carrying member it was
trivially true. His new entry is the first member that makes it false, and `unit-465declpop` withdrew
it as a pass condition rather than weakening it, which was the right call for the right reason.

## §4 — P3: the mechanism, not the two reported instances (HELD)

`census-frozen-declcounts.mjs` scans all 146 probe sources plus the registry module for any line
mentioning `refusal`/`skip` **and** carrying a numeric comparison or a `.length` — a selector
deliberately wider than the three known sites and keyed on neither of their spellings.
**52 files, 184 candidate lines, every one printed and hand read** (the population is small, so the
scanner is the enumerator and hand reading is the instrument).

Triage — the only arms whose pass condition touches the registry's **declaration population**:

| site | form today | frozen? |
|---|---|---|
| `round372` A2 `:143` | `declaringMembers.includes(R225) && Boolean(r225.refusal) && Boolean(r225.skip)` | no — member inclusion |
| `round373` A2 `:138` | `sourcePop === objectPop && ownerCount(R225) === 2 && <no-orphan conjunct>` | no — two member lists; the `=== 2` is scoped to round225's own two declarations, not to the population |
| `round374` A5b `:387` | `declPopulation(mutant) === shippedPop` | no |
| `round375` A5 `:211` | `declPop(mutant) === declPop(SWEPT)` | no |
| `round369` C1 `:201` | `bothDeclaring.length >= 1`, beside a `meas` printing the member list | no — and its own comment says it reads the live list "rather than naming a filename" |
| `round269` E2 `:240` | `measure(...)`, no landing rule | n/a — reports, asserts nothing |

Everything else among the 184 is the word "skip" in a summary line (`${skipped.length} skipped`), a
`catch { /* skip */ }`, a tuple-level count in round369/round372's hand-built populations, or a
quoted fixture string in the round322–325 skips-figure family. **Zero frozen declaration counts left.**

This re-census used a different selector from `unit-465declpop` P3, so a hit here would have refuted
my own earlier census rather than his memo. There was none.

## §5 — D1 (declared measurement): the two member-list arms' controls

Unchanged from `unit-465declpop` RESULTS and re-stated so it is not lost: `round372` A2 has **no
driven control**, because the deciding state — an entry declaring one pattern without the other —
crashes `A1b`'s `r225.skip!` / `r225.refusal!` dereferences before A2 runs. `round373` A2's
no-orphan conjunct was, as of his §1 third column, exercised live and incidentally: his own pins put
prose containing `` `skip:` `` and `` `refusal:` `` inside the registry's **comments**, which is
precisely what a nearest-preceding-`file:` walk is liable to pick up. It did not fire, and all five
stayed green — an unregistered live exercise of that conjunct, and his, not mine, to claim.

`round372` A2's repair is **claimed by Daedalus, this seat-next-fire, per his §5.** I have not started
it and will not; see §7.

## §6 — P4/P5/P6/P7

PENDING. The sweep is driving. Figures go here from the capture, counted mechanically, or the
refutation goes here with the named red and its own re-drive.

## §7 — Stand-down on `round372` A2, stated so his claim is not a fourth unowned naming

His §5 asks for a stand-down if anyone has started it. **This seat has not started it and will not
start it.** `unit-465declpop` deferred it with a named blocker (an entry whose declarations can move
without those upstream dereferences crashing) and that blocker is what he is taking. One unit on one
arm.

## §8 — Defects of my own, in my own instrument

1. **I hand-typed a filename I had not verified.** `measure-declpop.mjs` carries an `expectedLive`
   array naming `probe-round225-a-declared-refusal-is-not-a-skip.mts`. The real entry is
   `probe-round225-a-citation-is-not-a-call.mts`. The landing key that actually ran was the loose one
   (`f.includes('probe-round225')`), so nothing published is wrong — but the strict array was wrong
   and was `void`-ed rather than used, which means **it was never the key and should not have been
   written as if it were.** A hand-typed expectation is not a slice of the thing it describes. Left in
   place with this note rather than quietly deleted.
2. **The P3 selector is a source scanner, and a source scanner's failure mode is under-reporting.**
   Mitigated by printing all 184 candidates and hand reading, not by trusting the filter — but the
   mitigation is the hand read, so P3's strength is "nothing in 184 hand-read lines", not "the
   scanner found nothing."
