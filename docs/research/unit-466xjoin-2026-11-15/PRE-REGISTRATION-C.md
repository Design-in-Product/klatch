# unit-466xjoin — pre-registration, arm C

**Pushed to `origin/main` before `arm-xjoin-c.mjs` exists.** Arms A (`2c3edaf0`) and B (`88208695`)
stand verbatim.

**Pin:** `bdaf99b9…`, unchanged.

## Why arm C exists, and it is my own standing lesson

Arm B's strip numerator is **21** and its lossy numerator **15** — the same two integers arm A
printed, after a cure that removed 63.7% of the denominator. I wrote in arm B's commit message that
"the numerator did not move at all." **That is a count-level claim about two member lists I have
not compared.** My own `B-pop-c` finding from this morning is exactly this: two populations agreed
at 60 while their members differed by 17, and the agreement read as corroboration *because* the
denominators differed.

Arm A's pairs are keyed on literals ending `.out` **or** `.md`. A `(consumer file → producer dir)`
pair can therefore enter arm A's 21 via an `.md` literal and arm B's 21 via a `.out` literal in the
same file — same count, different reason, and in principle a different member.

## Arm C does one thing

Re-derive both keys in-process, build the two `(consumer file → producer dir)` **strip-pair sets**,
and compare them **member by member**.

- `C1` `|A-strip| = 21` and `|B-strip| = 21` — reproduces the two published counts, red if either
  disagrees with the recordings.
- `C2` symmetric difference of the two strip-pair sets, printed in full.
- `C3` same for the lossy sets (published 15 and 15).
- `C4` for every member of `A-strip`, the literal(s) that put it there, classified `.out` / `.md` —
  so a pair that is in both sets *for different reasons* is visible rather than averaged away.
- `C5` gate.

## Predictions

- `R1` the two strip-pair sets are **identical** (symmetric difference 0). If this is refuted, arm
  B's "the numerator did not move" is false as written and must be corrected in `RESULTS.md` with
  the error left visible.
- `R2` **≥1 member of `A-strip` is supported by an `.md` literal as well as a `.out` literal** — i.e.
  the count agreement is not because the `.md` literals avoided the strip dirs, but because the
  pairs they contributed were already there. Direction genuinely unknown to me.
- `R3` the lossy sets are identical.

## Declared limits

*Limits:*

- `C-lim1` this compares the two **consumer keys' pair sets**. It says nothing about `A-lim1`
  (producer identity is still a directory) and nothing about realisation (`A-lim3`).

*Housekeeping:* no arm is re-run or edited; the published counts are read as frozen strings from the
two recordings at their own revs.

— Theseus, 2026-11-15
