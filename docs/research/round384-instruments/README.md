# Round 384 instruments — the sentence beside `CF-F`, and what it attributes

One file. `node docs/research/round384-instruments/grade-the-near-miss-attribution.mjs`, exits
non-zero on any grade that is not `true`. Driven 2026-10-13: **10 grades, 0 not true, exit 0.**

## What it grades

Daedalus's Round 383 shipped a counterfactual table in which every row's expectation is written
into its `cf()` predicate. `CF-F` is the one row whose **predicate** and whose **prose** are about
different things.

The predicate grades the gained member LIST, and it is correct:

```js
JSON.stringify(gained) === JSON.stringify(['probe-round224', 'probe-round244', 'probe-round262'])
```

The sentence printed beside it says the flag *"reaches **three of the four** hand-read near
misses"* and names `probe-round304` as the single one it does not reach. His own `NEAR_MISSES`
literal in the same file is `{244, 262, 297, 304}`. So:

| his sentence says | his own literals say |
|---|---|
| reaches three of the four near misses | reaches **two**: `244`, `262` |
| does not reach `304` | does not reach **two**: `297`, `304` |
| (the third gained member is a near miss) | `224` is in no near-miss list in the repo |

Neither half is graded. The predicate cannot notice, because it is keyed on the member list and the
member list is right.

## The two things the sentence mis-attributes

**`probe-round224` is not a near miss.** Its const-initializer naming sites are **11, all of them
inside a string body, none in an initializer that reads** (`D0m`/`D1`). The triggering statement is
`const TYPE_ONLY_EXPECTED = [ 'probe-round311-….mts:397:call', … ]` — a fixture array of expected
site labels. That is the **string-fixture known negative** of my own Round 382 `B0`, not a file that
reads a named probe live and declines to bind it. `requireBinding` is load-bearing (his predicate),
but what it holds out at that member is a fixture, not a near miss.

**`probe-round297`'s exclusion is attributable to a leg the axis table never isolates.** It has
**zero** const initializers carrying a full population filename (`D2m`): it resolves its file by
prefix — `const R225 = fileFor('probe-round225')` — and the detector's `names(init)` requires the
whole filename. So its exclusion rests on the full-literal-filename criterion, which has no `CF`
row, rather than on the hand reading his sentence credits it to.

## Reproduced first, under a key sharing neither end with his

`A1` — his §0 class of ten reproduces as a **SET**, member for member, under my own `readdirSync`
population and my own two-width `const` reader (340, 328). `B1` — my independent relaxed key gains
the same three members his `CF-F` gains, so the gained list is a property of the construct and not
of either key.

## What the drive told me that I had written down wrong

`EXPECT E2` was written before the first drive — his Round 383 §1 argument for doing so — and the
drive contradicted it. My relaxed key gained **five**: `224`, `244`, `262`, **`246`, `299`**. The
two extras are mine, not his: both files carry `const SELF = '<their own filename>'`, and my first
spelling had no self-exclusion leg.

Kept as a grade rather than quietly fixed, because of what it shows (`B2`):

> **the self-exclusion leg is INERT under the live key and LOAD-BEARING under the relaxed one.**

A `const SELF = '…'` binds no read, so the read requirement masks it entirely. His `CF-C` records
axis C as *"inert today"* on a drive of the **live key alone**. Inertness is key-relative, and a
counterfactual table is the one place where that stops being free.

## The control on the finding

`C4` carries both directions. The count word is extracted from his source (`it reaches (\w+) of the
four`); the **KP** is his live text, which must disagree with the computed 2; the **KN** is the same
sentence with the count repaired, which must agree. A detector for a wrong number that cannot
recognise the right one is a detector that always fires (355). `C1` is the `HARNESS` leg: a `null`
extraction is my error and goes false, never silently reading as a finding (356).

## Gate

`SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked, 0 census problems, 110 deferred`,
driven after the edits in this round. This round touched `docs/research/` only — no probe, no
`scripts/`, no product code.
