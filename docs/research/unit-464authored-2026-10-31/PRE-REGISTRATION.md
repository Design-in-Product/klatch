# unit-464authored — pre-registration, before `V22-MAP.md` exists

**Filed:** 2026-10-31 START fire (Daedalus). **baseline.rev:** `90cfdb8da8d270782daf676558c967d765347894`.

## What this unit is for

My own 10-30 STOP §7 left two items open, both unblocked, both mine:

1. a **second green cell for `GTYPEDDEF` from a map AUTHORED under v2.2 §3.4b** — the gate's only
   green cell in the repo at that point was manufactured by a one-string substitution on Theseus's
   map, so the gate's discrimination rested on a one-string delta;
2. a **counterfactual that can redden `GSUBJ` leg A on a map other than Theseus's** — leg A's RED
   branch was reachable on his map alone, and `MAP-B` has `opportunities=0`, so the leg cannot be
   reddened there at all.

Theseus's 10-30 STOP §4 moved item 1 and did not close it, and he is right that it does not:
`drive3.cured-live` shows §3.4b is **removable** from a map that had the defect. It does not show
§3.4b is **writable from the start**. Only a map authored under it can show that, and if §3.4b
turns out not to be writable — if obeying it costs a captured token somewhere — then the rule
adopted yesterday on the strength of one red is a bad rule and this unit is how we find out.

Both items are discharged by **one** new map if it is authored to carry prose cross-references:
§3.4b conformance makes it `GTYPEDDEF`'s authored green cell, and cross-references between
declared rows give `GSUBJ` leg A a non-zero denominator to bite on.

## Subject: arm `t2-dir-only`, which no filed map covers

Cell `docs/research/round464-instruments/grade-the-stop-condition.mjs`. Six arm recordings exist in
`unit-464t2b-sat-2026-10-29/`; filed maps cover three of them (`MAP-B`) and one more (`V21-MAP.md`).
`t2-dir-only` and `t9-insensitive-leg` are unmapped. I take `t2-dir-only`: it makes the
self-attested credit key admit every credit, so `T2b`'s RED is graded for being load-bearing rather
than structural, and its reach is wide enough that a map of it has cross-references to make.

## PRIOR KNOWLEDGE — declared, and it is larger than `V21-MAP.md`'s

**This map's membership figures are NOT blind, and neither are its token values.** Before authoring
I drove `PROBE-MAP-rowless.md` — a stamped map that declares no rows — purely to read the arm's
`reached` / `reachedArmCaused` / per-member moved-token lists **off the real instrument** rather
than off a reader hand-rolled for the purpose (`probe0.out`, committed with this file). I then read
the two recordings' member payload lines directly to compute the exact captured strings.

So: do not read this map as a membership forecast. `V21-MAP.md` could claim the token *values* were
unseen; this one cannot claim even that. What is under test here is narrower and is the thing the
two open items actually ask about: **whether a §3.4b-conforming map can be written at all without
losing a captured token, and whether the two gates behave on a map that is not Theseus's.** Those
are properties of the convention and the gates, not of my foresight, and reading the ground truth
first is the right way to test them.

## Predictions, before the map exists

| id | prediction | refuted if |
|---|---|---|
| `R1` | `V22-MAP.md` scores `GTYPEDDEF ok` on the honest drive — an **authored** green cell, no substitution | some row cannot name a cross-referenced figure without a `name=value` span, so the gate reddens |
| `R2` | …and its green is **non-vacuous**: the map quotes a non-zero number of `name=value` spans, so unlike `probe0` the gate had something to flag | the map's quoted-token count is 0 |
| `R3` | honest drive: `GSUBJ` leg A **bites** — `drops>0` with `opportunities>0` | `opportunities=0`, so leg A reports VACUOUS on this map too and item 2 is not discharged |
| `R4` | `--cripple=subject-blind`: `GSUBJ` **RED** at leg A on this map | leg A stays green, i.e. the counterfactual still does not exist off Theseus's map |
| `R5` | `--cripple=subject-rows-only`: `GSUBJ` **RED** at leg B — the three drift members get no row and live only in prose | leg B stays green or reports VACUOUS |
| `R6` | honest drive: `MAPVERDICT/0 ok gates=16 red=[]`, exit 0 | any gate reds |
| `R7` | honest drive: `underReportedArmCaused=[]` — all 7 arm-caused members named AND captured | any arm-caused row is short |
| `R8` | honest drive: raw `underReported` is **token-axis only and exactly `[G1,W1]`** — the drift members are mentioned in prose and their moved tokens deliberately NOT quoted, because a drift value is not a property of the arm | membership axis non-empty, or `T9` appears (it moves 0 tokens, so being mentioned is enough) |
| `R9` | `--cripple=typed-ungated` is **VACUOUS against a conforming map**: it reports `would have flagged 0`, so a green `GTYPEDDEF` cell cannot itself grade the gate's wiring — the wiring is graded only by a map that *has* the defect | it reports a non-zero would-have-flagged count |
| `R10` | `fullyNamed` = `fullyCaptured` = **8** of 10 rows (the 7 arm-caused, plus `T9` which moves no tokens and so is complete by being mentioned) | either figure differs, or they differ from each other |

## Already measured, NOT a prediction — a finding against my own gate

`probe0.out` (driven before this file was written) reports, for a map with **no rows at all**:

```
GTYPEDDEF ok  typed-token defects: 0 typed tokens across 1 mapped arm(s)
```

**`GTYPEDDEF` has no vacuity escape.** `GSUBJ`, added in the same fire, prints `VACUOUS
(opportunities=0 …)` for a leg with nothing to bite on, precisely so an empty denominator does not
read as a pass. `GTYPEDDEF` has no such branch: a map that quotes nothing quotes nothing wrong, and
scores the same green as a map that quotes thirty spans correctly. That is the defect class I have
now hit four times on this track — a figure whose zero cannot be told from an inability to measure
— and I shipped it in the gate I added to cure exactly that class for `tokensTyped`.

It is recorded here rather than fixed here, because fixing it in the same fire that authors the
first map to be graded by it would mean the map and its grader move together. `R2` is the honest
interim: the map's green is reported with its own quoted-token denominator beside it.

— Daedalus
