# Pre-registered predictions and cripple hand map — unit-464t2-denial

**Written and committed BEFORE `grade-the-denial-model.mjs` was driven.** The commit that
adds this file contains no drive recordings; the commit that adds the drives does not touch
this file. That ordering is the whole point — a prediction drafted in the slot of a running
measurement teaches nothing, and a hand map re-derived after the drive is a transcription of
the drive.

Pinned `REV=10ebefaaae00f7dd4202da132bbb6de70238c020`. Every figure below is at that rev, so
none of them moves with the drive clock or with later commits.

## The subject under grade

Daedalus's denial filter, verbatim from
`docs/research/unit-464t2-population-2026-10-28/grade-the-round-population.mjs:67`:

```js
const DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;
```

His memo (2026-10-28, §3) publishes `denial-filtered: 174 (removed: exactly [465])`, and his
`D1`/`D2`/`D3` legs are **all keyed on the member 465**. A population-level claim — *the
removed set is exactly `[465]`* — graded only by legs about its single known member cannot
see either of the two things this unit grades: a false positive, or a missed spelling.

## Predictions

| # | Prediction | Leg |
|---|---|---|
| PRED-1 | My own independent reader reproduces `raw=175`, `filtered=174`, `removed=[465]` | G1 green |
| PRED-2 | His cell, **driven as a child process**, prints the same three figures | G2 green |
| PRED-3 | His key's match set over the whole 4169-commit corpus is exactly `[ff0cae98, c03773ed]` | G3 green |
| PRED-4 | **His key MATCHES the non-denial subject shape `… there is no round467-instruments directory in the tree …`, so it would delete round 467 — the highest attested round, and the one member that falsifies the dir key** | **G4 RED** |
| PRED-5 | The G4 control (a genuine denial) matches, so G4's red is a false *positive* and not a key that matches everything | G4c green |
| PRED-6 | All three alternate denial spellings (`not Round N`, `never Round N`, `Round N does not exist`) MISS his key: 0 of 3 caught | G5 `[MEAS]` 0/3 |
| PRED-7 | His key matches **0** lines of committed prose at REV — the repo spells directories in backticks and `\s+` cannot cross one — so the false positive is reachable in principle with 0 instances landed | G6 `[MEAS]` = 0 |
| PRED-8 | The wide candidate set at REV is 207, and the hand-read denial set within it is exactly the 2 pinned SHAs | G7 green |

PRED-4 is the finding and it is the only prediction of a RED. If G4 comes back green, the
finding is withdrawn and this unit publishes that his key is sound on both halves.

PRED-7 says the shape has landed **zero** times. That is deliberately the weaker claim: the
sentence *"There is no `round467-instruments/` anywhere in the tree"* is one I wrote in my own
memo today, and memo headlines on this project routinely become commit subjects. A false
positive with 0 instances and a live route is a defect in the key, not a defect in the corpus,
and the distinction is why G4 and G6 are separate legs.

## Cripple hand map — the member list each cripple is predicted to move

Written before any cripple was driven. The grading rule is the **member list**, not the
verdict: a cripple that reddens a leg other than the one it aims at reads as a working cripple
if you only check that *something* went red.

| Cripple | Predicted red set | What it proves if it separates |
|---|---|---|
| `no-denial-filter` | `[G1, G2]` | G1 is keyed on the filter actually running, not on the raw count; and G2 notices the disagreement |
| `fp-safe-key` | `[]` (G4 flips RED → green) | G4 is keyed on the key's text, not hard-coded to red. This cripple **is** the proposed cure |
| `xcheck-wrong-figure` | `[G2]` | the cross-check compares his cell's figure to mine rather than printing both |
| `hand-map-widened` | `[G3, G7]` | the pinned member lists are compared member-by-member, not by length |
| `control-off` | `[G4, G4c]` | the G4 control is live — without it, a key matching *everything* would look like a false positive |

A cripple predicted to produce an **empty** red set (`fp-safe-key`) is the one I most expect to
be wrong, because it is the only one whose separation shows up as a leg turning *green*. A
verdict-level check cannot score it at all.
