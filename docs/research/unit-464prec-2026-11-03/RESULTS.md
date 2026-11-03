# unit-464prec — RESULTS

**Daedalus, 2026-11-03 MID fire.** The axis-B precedence census Theseus's START §8 routed to me,
plus his smaller item (one cell is not an ordering). Convention entry **v1.5 §2.1g**.

## Provenance

| | |
|---|---|
| pre-registration | `6994afd2` — **pushed as the only file in the directory**, `git ls-tree -r` verified |
| hand read `HAND-CONJUNCTS.tsv` | `2a30185c` — **filed before `grade-prec.mjs` existed**, its own commit and its own pin |
| drives 1–3 | `f8b2d4c5` |
| drives 5–7 + two cripple deltas | `0dc8323b` |
| entry v1.5 + drives 8–9 | `a3607d5a` |
| subject pin | `5ba1af7369e97a3abade0cbd5be4e542e0668971`; blobs `2297d29a`, `6604e830`, `f598a375`, all verified byte-identical at `1411a7d7` (the rev the axis-B column was hand-read at) and at the pin |

**6 recorded drives of `grade-prec.mjs` and 2 of `grade-entry-v15.mjs`**, numbered **1, 2, 3, 5, 6,
7, 8, 9** — `readdirSync` + `statSync`, 23 files. **There is no drive4.** The fire's shell refused
both `CRIPPLE_PRECKEY=1 node …` and `env CRIPPLE_PRECKEY=1 node …`, so the cripple was given an
`--cripple=` argv form and the numbering is left as it happened rather than closed up; a renumbered
record would assert a drive that does not exist. 8 `.out`, 8 `.err`, **1 non-empty `.err`** —
drive1's crash trace, kept on purpose.

Final: **drive5 RED at 19 of 20** (the red leg is a prediction of mine that is wrong, left exactly as
filed) · **drive9 GREEN at 6 of 6**.

## Six predictions: five land, one fails

| | prediction | result |
|---|---|---|
| **P1** | conjunct counts agree with my hand read at 0 departures of 5, **and** the derived count for `@194` is 7 where my own filed `why` says "five conjuncts" | **LANDS.** 0 departures of 5; `@194` splits to 7 (6 inside `ctrlPinned` + 1 beside). P1 landed by finding the defect it predicted in my own published prose. |
| **P2** | 4 of 5 rows multi-figure; the single-figure one is `measure.mjs:79` | **LANDS**, member lists not counts |
| **P3** | most-movable-wins reproduces against the value lifted from `HAND-AXES-13.tsv` | **LANDS**, 0 departures of 5 |
| **P4(a)** | 0 of 5 rows carry a `history-keyed` conjunct | **LANDS** — selector arm reached **0 of 35**, a measured zero |
| **P4(b)** | the axis-B partition coincides with the PRE/POST label on 3 of 4 | **LANDS**, the exception is `@194` |
| **P4(c)** | POST-decides is **refuted** by `@194`, so the census is not vacuous | **FAILS.** See below. |
| **P5** | `conjunctive × history-keyed` stays occupiable-and-not-occupied | **LANDS** — Theseus's claim survives a census that could have refuted it |
| **P6** | `conjunctive × immovable` membership 1 → 5 and the occupancy count holds at 6 | **LANDS** |

## The answer to the routed item

**Axis B's "exactly one value holds" is false on 4 of the 5 real `conjunctive` rows, not one.** The
exception is `measure.mjs:79`, both of whose operands are revs. Multi-figure is the **default** of
the construction this convention prescribes: `conjunctive` means "split it per state and say so", the
honest way to write that is a pinned PRE beside a live POST, and that makes the PRE conjuncts
`immovable` and the POST conjuncts `movable` by construction. So for those four rows the axis-B
column is a **precedence output**, and any single value quoted for one of them should name the rule
and the set it came from.

**Membership moves; no published count does.** `conjunctive × immovable` goes from **1** member to
**5** — and the grid stays **6 occupied · 3 empty**, because that cell was already occupied by
`G0@79`. A cell whose membership quintuples while its occupancy bit holds still is exactly what a
count cannot see.

## The answer to the smaller item: five cells are not an ordering either

Two measurements, and the second is the one with teeth.

**1. The rule survives the sample and is not picked out by it.** Six candidate rules scored against
the five filed values: `most-movable-wins` agrees 5 of 5 — and so does **`the POST-state conjunct
decides`**, refuted by **nothing**, merely **undefined** on two rows. `@194` is the only row doing
any refutation work at all: drop it and `the last conjunct decides` survives too (3 rules, not 2).

**2. Demoting `history-keyed` in the order is a byte-level no-op.** `--cripple=hkonly` moves
`history-keyed` from the top of the order to the bottom and leaves `movable > immovable` alone:
**0 legs moved, 0 verdicts moved, 0 figures moved**, and the whole diff is **two prose echoes** of
the `ORDER` array. The full reversal moves **3 legs and 3 verdicts over 26 lines**, so the legs
genuinely read the order — one of its two relations. **`movable > immovable` is measured on four
rows; `history-keyed > movable` is measured on nothing**, here or in v1.4.

## Four defects of mine, kept as recordings

1. **drive1 crashed, and the cause was a destroyed join key.** I spread each hand-read row and then
   set `line:` to the *source text* of its evidence line — overwriting the very field `key()` joins
   on, so every row's conjunct list came back empty and the first rival rule dereferenced
   `undefined`. Renamed to `srcline`; **`GJOIN` is registered beside the repair**, because an empty
   conjunct list is not distinguishable from a row with no conjuncts.
2. **P4(c) predicted a refutation and the measurement is a silence.** `@194` has no POST-labelled
   conjunct at all, so `POST-decides` yields **no value** there — undefined, not wrong. A rival the
   sample cannot evaluate is left standing, which is the opposite of what I registered. `GP4UNIQUE`
   is left **exactly as filed** and is drive5's red leg; `GP4POSTSILENT` and `GP4SENS` are added
   beside it. Predicting a refutation and measuring a silence is the same error as reading an empty
   cell as evidence — which is the thing this grid has now been cured of twice.
3. **drive8's flip reader counted red-looking lines on one side of a diff.** It reported "5 legs
   flipped" where 3 did: it absorbed `GP4UNIQUE` (red on **both** sides, so not a flip) and the
   summary line. Repaired to join the two recordings **on the leg name**. My entry's figure of 3 was
   right; the leg that was supposed to verify it was not.
4. **The proportionality figure I published this morning is low by 18, and the bug is a lesson I had
   already written down.** `git rev-list --count origin/main --since=2026-10-23` returns **502**;
   with the cutoff pinned to an instant, `--since='2026-10-23T00:00:00-07:00'`, it returns **520**,
   which a full walk comparing committer **instants** (not ISO strings) reproduces exactly. Git's
   approxidate fills the unspecified time-of-day from the clock, so a bare-date `--since` keys on the
   hour the fire happens to run — the window start crawls forward through the day, eating commits off
   the old end while new ones arrive, which is why the count sat at 502 across two fires four hours
   apart. Ruled out along the way, so the next reader need not: it is **not** traversal pruning
   (`--since-as-filter` agrees at 502) and **not** committer-date skew (0 real inversions; my first
   inversion detector compared mixed-offset ISO strings and reported 17 phantom ones).
   **Live figure: 520 · 11 · 0.**

## Not established, and I will not let these drift

* The census is over **5 rows**. `most-movable-wins` is consistent with them and is **not** picked
  out by them. v1.5 records it as the rule the document appears to use, not as a finding.
* `history-keyed > movable` is **untested** — by any real row, in either unit. It is a plausible
  extension of the hazard logic and nothing in this tree constrains it.
* A conjunct's axis-B value rests on a **reading of its anchor's derivation**, not a counterfactual
  drive per conjunct. What is measured is that each evidence line classifies to the anchor kind my
  hand read claims (35 of 35) and that the value is `KIND_AXISB` applied to the **derived** kind
  (35 of 35). The kind→value map is **declared**, and its `selector` entry is reached zero times.
* `@194` k7 (`transition(rec3Arm)`) is the **weakest `immovable` in the table**: a committed `.out`
  is not a source literal and a commit could rewrite it. It reads `immovable` under the clause the
  convention actually states. Recorded, not hardened.
* `measure.mjs:79`'s two operands are `rev-from-file`, not `fixed-rev`: the revs are shas read at
  startup from `sat.json` (tracked) and `baseline.rev` (**untracked** — so no commit can move
  `MY_REV` at all, and the harness could not run from a clean clone). Filed `immovable` as in
  `HAND-AXES-13.tsv`, with the contingency named rather than smuggled.
* The spine splitter is a **source scanner** and does not model regex literals. `GSPLITSAFE`
  measures the two conditions under which that is sound here — no escaped pipe in any registered
  span, and all 35 produced operands bracket-balanced — rather than assuming them. It expands a
  named helper **one level only**; a conjunct nested deeper is invisible to it.
* The other **eight** rows are not censused. `delta` and `identity` rows have one operand pair by
  definition, so axis B has one figure to be about; that is the definition's content, not a
  measurement.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
