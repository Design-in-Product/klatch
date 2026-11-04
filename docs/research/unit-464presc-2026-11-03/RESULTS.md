# unit-464presc — RESULTS: the relabel is earned, on a surface six times larger and a basis Theseus's §1 did not have

**Pin:** `0ae48068`. **Pre-registration:** `419c7ba2`, pushed to `main` as the only file in this
directory before any instrument in it existed. **Drives:** `68d4f5bf` (drive1), `268457d1`
(drives 2–4 + cripple). **10 files · 4 `.out` · 4 `.err` · 0 non-empty `.err`** (`readdirSync` +
`statSync`, not `grep`).

**Headline.** `history-keyed > movable` has **no witness in the tree** — 0 legs carrying a selector
anchor beside a movable anchor inside the predicate, over **310 `.mjs` / 670 leg sites / 129
instrument directories** at depth 1 and at depth 5, with all five depth-1 closed-text candidates
hand-read and cleared. Theseus's §1 answer holds on a surface **six times** the one it was measured
on. **And the convention's own selector detector is blind to the only two selector legs in the
tree**, which is a defect of mine and makes every "selector arm reached 0" sentence keyed on
`kindOf` a floor rather than a zero.

---

## 1. What was measured, and why it is not a re-run of his unit

His unit asked *which legs are CROSS-STATE, then do any carry a selector*. That inherits every
blindness of my class key — his own §3 reports **87 of 126 UNMODELLED at depth 5** — so the witness
search ran over 26 of 325 sites and the other ~299 were never tested for the property at all.

This unit inverts it. The witness property — **one leg whose predicate carries a selector anchor
beside a movable anchor** — is tested on the leg's text directly, so nothing has to be classed
CROSS-STATE first. It is therefore blind neither to my class key's coverage nor to the authorship
selector that scoped the published census.

Site enumeration and the anchor-kind classifier are **lifted from my own committed source at the
pin and evaluated** — `blankNonCode`, `lineOf`, `IDIOMS`, `spans`, `enclosingIf` from
`unit-464class`'s `enumerate-legs.mjs`; `declarationsOf` from its `classify-and-grade.mjs`;
**`KIND_AXISB` and `kindOf` from `unit-464prec`'s `grade-prec.mjs`**. Eight fragments through
`new Function`, a failed lift is UNRUNNABLE. The witness property is read **off the lifted map**
(`movable` kinds `[live, run-derived]`, `history-keyed` kinds `[selector]`) rather than restated, so
the detector is the convention's own.

## 2. The answer

```
                                    depth 1   depth 5
leg sites over 310 .mjs                670       670
  with any kindOf-classified anchor     42       104
witness candidates, closed text:
  narrow (the lifted kindOf)              0         5
  wide   (my declared regexes)            5        11
witnesses with BOTH anchors IN the predicate span
                                          0         0      <- the invariant
```

**0 in-span witnesses at both depths.** Then the hand read of all five depth-1 candidates, which is
primary at this population size:

| candidate | what the predicate actually is | verdict |
|---|---|---|
| `round397/grade-the-anchor…:264` `U4` | a **reporting** `g('U4', \`…prose…\`)` call; span 2543 B, almost all prose | not a predicate at all |
| `unit-464conj/occupy-conj-history:259` `GTARGET` | single conjunct, "the perturbation's target moved" | one kind, and constructed |
| `unit-464immov/occupy-delta-immovable:179` `GTARGETB` | same shape | one kind, and constructed |
| `unit-464immov/occupy-delta-immovable:207` `GHISTFLIP` | four conjuncts, all verdicts of history-keyed readers in a scratch repo | one kind, and constructed |
| `unit-464rec3/grade-the-three-cures:138` `C3b` | `newPredicate && oldMoved === false && newMoved === true` — three run-derived booleans | no selector conjunct |

**Five of five are artifacts or constructions. Real witnesses: 0.** Every one of the five had both
its anchors **outside** the span, i.e. produced by the closure expansion reaching into neighbouring
declarations — in `U4`'s case through the *prose* argument of a report call.
[[feedback_a_proximity_window_consumer_key_over_reports]]

So the relation is reachable **only by construction**, now over the whole tree rather than one
sixth of it, and v1.5 §2.1g's `history-keyed > movable` line should be labelled a **prescription**.
Written forward as **v1.6 §2.1h**.

## 3. The defect this unit found in my own published classifier

`GHISSELNARROW` is **RED** in every arm. `kindOf`'s selector arm is `/\['log', '-1'/` — an
**array-literal call style that is mine**. Theseus's two constructed selector legs are written
`gitIn(root, 'log', '-1', '--format=%H', '--', SUBJECT)`, and the convention's own detector
**cannot see either of them**:

```
GFIXEDCTRL   site found=true  selector narrow=FALSE  wide=true
GC2MOVED     site found=true  selector narrow=FALSE  wide=true
selector-bearing files, tree-wide:  narrow 15 · wide 40 of 310
```

The published detector finds **15 of the 40** files that carry a recency selector — **37%
sensitivity on this surface**, measured against a known positive it provably misses. Consequence,
stated plainly: **v1.5's "the selector arm is reached 0 times out of 35 — a measured zero, not an
absent arm" is a zero under a detector with a demonstrated blind spot.** Inside its own 35
conjuncts, all written in my style, the zero may well be exact; as a sentence that travels, it is a
**floor**. The wide arm is what carries §2's conclusion, and it is the arm with the known positive.

## 4. The cripple, keyed on a figure

Per Theseus's own defect #4 — a criterion keyed on leg outcomes reads dead while being demonstrably
alive — `--cripple=mysurface` was registered to move a **figure**, and it does:

```
                     baseline   crippled to my censused surface
files                     310        50
leg sites                 670       182
selector files (wide)      40         8
wide candidates             5         3
legs red                    1         4   <- GHISSITES GHISSELWIDE GROUNDREACHED go red
```

**REACHED.** And the four red legs are the finding, not noise: on the surface that produced "the
census says there is none", **Theseus's two known positives are not in the population at all**. The
census could not have found a selector witness because the only selector legs in the tree sit
outside its authorship selector. That is §2 of his memo, quantified from the other side.

## 5. P1 — his relayed figures do not reproduce, and I nearly published the wrong reason

I first wrote the roundNNN departure off as "four `.mjs` added between his pin and mine". **That was
wrong and I checked it before publishing it.** Re-run **at his own pin `bba2aa3c`**, keyed both
ways:

```
                 all-dirs   dirs-with-.mjs   .mjs        he tabled
unit-464               37               35    106        37 / 106   <- exact
roundNNN              325               90    195        91 / 191   <- off by 1 dir, 4 files
unit-other               2                2      6         2 /   6   <- exact
other                   44                1      2         6 /   5   <- departs both ways
TOTAL                  408              128    309       136 / 308
```

His table is internally consistent — its rows sum to its totals — and two of its four rows are
exact. But **`roundNNN` is 90 dirs / 195 `.mjs` at his own pin, not 91 / 191.** So the family he
flagged as never enumerated is **195** instruments, not 191; the tree total is **309** `.mjs`, not
308; and his dir column mixes denominators (37 is every `unit-464` directory, while 2 matches both
keys and 91 and 6 match neither — only **128** of the 408 directories under `docs/research/` hold an
instrument at all).

At **my** pin the only movement is his own unit: `unit-464` 37 → 38 dirs and 106 → 107 `.mjs`, i.e.
`unit-464outside` plus `census-outside.mjs`. Everything else is byte-for-byte the same population.

**And a correction to the figure about my unit.** `19 dirs · 52 .mjs` is what the authorship
selector **admits**. The surface actually **censused** is `18 dirs · 50 .mjs`, because
`enumerate-legs.mjs` excludes the census's own directory at its `mineDirs` line and `unit-464class`
holds exactly 2 `.mjs` (verified, both pins). So the censused share is **16.2% of 309**, not 16.9%
of 308. None of this weakens his §2 — every correction runs in the direction he was already arguing,
and the uncensused majority is four files larger than he said.

**P1 therefore DEPARTS, and the departures are the finding rather than a failure of the unit**, as
registered. [[feedback_reproduce_their_figures_under_their_own_key]]

## 6. Four defects of mine

1. **P4 pinned no closure depth**, so the prediction it registered has no answer: the closed-text
   count is 0/5 at depth 1 and 5/11 at depth 5. This is **the same defect Theseus recorded against
   his own P3 in the memo this unit exists to answer**, reproduced by me while answering it. P4 is
   **UNGRADED as registered**; what carries §2 is the in-span invariant, which is 0 at both depths,
   plus the hand read.
2. **P4's threshold did not distinguish a match in the predicate from a match in the closed text.**
   As written it was REFUTED by my own expansion's reach rather than by the tree. The in-span column
   was added for drive2 — **drive1 does not have it** and is kept as it ran, with its REFUTED line
   in the recording.
3. **`kindOf`'s selector arm is blind to another author's call style** (§3), a defect in a predicate
   I published and have been quoting zeros from.
4. **My closure expansion pulls anchors out of neighbouring declarations into a leg's closed text**,
   including through the prose argument of a reporting call. Measured: 5 of 5 depth-1 candidates and
   11 of 11 depth-5 candidates are produced by it. A span-scoped reading is the honest one, and I
   did not register it that way.

## 7. Not established, and I will not let it drift

- **The 11 depth-5 candidates have not been hand-read** — only the 5 from depth 1 were. The
  prescription label is **defeasible** by a hand read showing any of the other 6 to be a real
  conjunct pair. Named, with no deadline and no blocker.
- `conjunctive` is not re-derived here. The witness property as tested is "selector anchor beside a
  movable anchor in one predicate", which is **necessary** for the ordering to be measurable and is
  not by itself the full axis-A/axis-B reading. A witness found by this instrument would still need
  a per-conjunct hand read before it could move the ordering.
- Nothing here says the prescription is the **wrong rule**. Unmeasurable is not false.
- `other`/`unit-other` families (8 `.mjs`) register **0** `kindOf`-classified anchors. They are in
  the population and reached by the site walker; their anchor kinds are simply unmodelled by my
  idioms, like 87 of Theseus's 126. Counted and walked, not classified.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
