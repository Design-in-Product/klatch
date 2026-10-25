# Round 450 — rows get the guards the verdict line has had since 444

**Seat:** Daedalus · **Date:** 2026-10-24 (STOP fire) · **Subject:** `docs/research/lib/verdict.mjs`

Taking the two items Theseus's Round 449 left here, both against my own file: §3 (`renderTail`
accepted a prediction's detail and discarded it) and §4 (the row-grammar decision he declined to
make because the file is mine).

## The decision §4 asked for, and why it is neither horn

He framed it as a choice: make `renderRows` the one grammar (re-keying two of my readers) or widen
the readers (keeping six spellings alive). Both horns assume one grammar serving one job. There are
two jobs — **emitting** the canonical grammar, and **reading** a heterogeneous historical corpus —
and the answer is that the lib owns both:

| | reader | grammar | refuses |
|---|---|---|---|
| going forward | `readRows` / `readTail` | canonical only | by name, 6 declared codes |
| the corpus | `readCorpusRows` | the censused 8, declared in `LEGACY_ROW_TOKENS` | reports unknown spellings, never buckets them |

Widening the two hand-rolled readers in place keeps them hand-rolled, which is the actual disease —
the count of per-round row regexes grows with the population, which is the argument `verdict.mjs`
itself rests on. Narrowing to the canonical grammar alone makes 390 committed recordings
unreadable. One shared wide reader over a declared table costs neither.

## The finding, mine

Driving it first (`probe0`, run before any cure was designed) found why §4 had never come up: of
`renderVerdict`'s three guards — `ID_GRAMMAR`, the tri-state throw, round-trip closure —
`renderRows` had **none**. Every guard in the file was keyed on the verdict **line**, the artifact
declared machine-readable. Five shapes `renderVerdict` throws on emitted happily, and the fifth is
why rows are not a weaker version of the same problem:

```
ok: 'yes'          → "LEG G1 undefined x"       a fall-through to the string "undefined", in the
                                                file whose docstring says it has no fall-through
id: 'G1 ok hello'  → "LEG G1 ok hello ok x"     two tokens; a positional reader takes the wrong one
id: ''             → "LEG  ok x"
{ name: 'G1' }     → "LEG undefined RED x"      Theseus's 443 §1 shape, still live one artifact over
what: 'a\nLEG G2 ok forged'
                   → TWO LINES, the second a well-formed row for a leg THAT DOES NOT EXIST
```

A verdict is one line, so a bad field malforms it. A row set is multi-line, so one leg's free text
can **forge another leg's row** — and the reader that would believe it is `record-cripples.mjs`, the
tool that grades whether a cripple moved the leg it declared.

## The prediction vocabulary is censused, not chosen

`PRED_TOKENS` is `LANDED`/`REFUTED`/`OPEN`, keyed on `drive1.census-row-vocabulary.out` over 390
committed `.out` files: `LANDED` appears in **52** recordings, more than `RED` (30) or `REF` (10).
My independent key finds the **same eight spellings** Theseus's did off a different population,
which is the agreement worth having. Spelling a prediction `ok`/`RED`/`REF` would have invented a
ninth and tenth spelling in the file that exists to stop spelling drift. The cost of two
vocabularies — a row carrying the right token for the wrong kind — is refused as
`WRONG_KIND_TOKEN` rather than left for a reader to notice (`W8`).

## What the cripple grading found, which is the best thing here

Four textual mutations of the real published source, each anchored exactly once, each driven in a
scratch tree at the lib's own depth. First grading: **three of four returned `selfTest() === true`.**
Deleting the tri-state throw, the newline check or the trailing-whitespace check leaves the
round-trip closure to catch the same shapes with a different message. The behaviour was guarded
twice and the diagnosis once, and a self-test keyed on *did it throw* cannot tell a guard from its
own backstop. Every bad-row case now asserts the **reason**. All four cripples GOOD with a clean
control.

## Files

| file | what |
|---|---|
| `probe0-what-the-row-emitter-does-not-guard.mjs` | ran first, before the cure existed; the record of that ordering |
| `census-the-row-vocabulary.mjs` → `drive1` | the 8 spellings, under my own key |
| `grade-the-row-guards.mjs` → `drive7` (pre-commit), `drive10` (post-commit) | 9 legs, 2 predictions |
| `record-cripples.mjs` → `drive5` (first, 3 of 4 BAD), `drive6` (reason-keyed, 4 of 4 GOOD) | mutation counterfactuals |
| `postcommit-rediff.mjs` → `drive8` | movers declared before the commit, diffed after |
| `drive9.npm-test-gate.out` | the repo gate |
| `drive2`, `drive3`, `drive4` | the three drives that each exposed a defect of mine (see below) |

## Four defects of my own, each found by driving

1. **`W5` came out RED against a correct lib.** A source scan keyed
   `/refuseRow\(\s*'([A-Z_]+)'/` found 4 of 6 and reported `UNKNOWN_ROW_TOKEN` and
   `WRONG_KIND_TOKEN` as declared-but-never-called — while `W8`, three legs below, was driving both
   by name in the same run. They are reached through a ternary: an adjacent-token pattern cannot
   reach a wrapped call, and it failed by returning a **smaller** number. Re-keyed in two
   directions: reachability is DRIVEN (a source scan cannot establish a branch is live), and the
   no-strays scan reads whole call texts with the wrapped call as the selector's own known positive
   plus a control.
2. **`W6` published a fabricated finding against my own two rounds.** Its exemplar was not in the
   padded shape the old readers key on — and carried a `.replace(/^ ok/, ' ok')` that replaced a
   string with itself — so it reported *446 reads 0/8, 448 reads 0/8*. Driven against the
   four-character token field they actually key on: each reads **3 of 8**, missing sets differing by
   one member each way, `{FAIL}` vs `{RED}`. The readers are narrow; they are not blind.
3. **`W9` was pinned to `HEAD~1`**, so it would have gone vacuous on this very commit by comparing
   the cured lib to itself. Pinned to a literal pre-round rev.
4. **`Q1`'s adoption figure counted this round's own recordings** — Theseus's 449 §5.6 defect, one
   round old, repeated. Both figures published now: 13/390 outside this directory, 17/398 including
   it.

And a check **removed** rather than fixed: "every cripple name occurs >1×" is a property of
env-var dispatch, where the subject must read the name for the cripple to fire. These are textual
mutations, where the anchor is load-bearing — it reported all four as unread against four cripples
that demonstrably fire.

## Verdicts

```
drive7.pre-commit-final.out    VERDICT/1 ok legs=9 red=[] refused=[] preds=2 refuted=[] prefused=[]
drive8.postcommit-rediff.out   VERDICT MAPS IDENTICAL: true · 11 rows, 0 tokens moved · GATE: true
drive6.cripple-grading-...out  ALL CRIPPLES CAUGHT BY NAME, WITH A CLEAN CONTROL: true
```

## Not taken, with reasons

- **Replacing the two hand-rolled readers at their call sites** with `readCorpusRows`. The lib half
  is built and `W6` measures the gap; swapping them is an edit to Rounds 446 and 448, whose
  recordings are committed evidence, and it wants its own round so the before/after is readable.
- **A real-exemplar key for `W6`.** Mine uses synthesized padded exemplars; his used lines from
  recordings. On my key each reader reads 3 of 8 with missing sets differing by one member each way,
  which makes his **first** wording right ("each is blind to a spelling the other reads") and his
  published correction ("448's coverage is a subset of 446's") wrong. Two keys, two answers, and I
  have not settled which exemplar set is the fair one — flagged rather than resolved.
- **The `GRADE <id>: true` / `NOT TRUE <id>: false` grammar**, a third historical row shape the
  census turned up (282 occurrences). Keyed positively so it is not sitting in a leftover bucket,
  but not read by `readCorpusRows`, and its pass/fail spellings are asymmetric.
