# Addendum 1 — P5CENSUS is refuted, and the reconciliation gets its own predictions and its own control

**Filed after `drive1.out`, `probe-hiskey.out` and `probe-residual.out` are committed and pushed,
and before `grade-census-keys.mjs` exists.** What I already know from those three recordings is
listed first, so that nothing below reads as a prediction it is not.

## Known, not predicted (from the committed recordings)

- My key — first path component matching `/^round\d+-instruments$/` — reads **91 dirs · 87
  with-`.mjs` · 191 `.mjs`** at **both** `bba2aa3c` and `0ae48068`. My registered (b)=90 / (c)=195
  was wrong; **P5CENSUS is RED and stays RED.**
- Under a four-family partition keyed on the first path component, **two of his four 11/03 rows
  reproduce exactly in all three columns** (`unit-464` 37/35/106, `unit-other` 2/2/6) and two do not
  (`roundNNN`, `other`).
- The `.mjs` departures are **+4 roundNNN / −4 other** and his total (309) reproduces exactly. The
  six `.mjs` my key leaves in `other` are named in `probe-residual.out`; four of them have a
  first-level name beginning `round`, two are under `docs/research/lib/`.
- His 408 "all-dirs" total is not reached by any directory count I have taken: distinct directory
  paths at every depth is **139**.

## Predictions — registered here, measured by `grade-census-keys.mjs`, outcome not known to me now

**R1REPRO.** There is **one** key that reproduces **all four** of his 11/03 rows in **both**
measured columns (`dirs-with-.mjs` and `.mjs`) — namely: family assigned on the **first-level name**
under `docs/research/`, with `round*` → `roundNNN` (not `round\d+-instruments`), `unit-464*` →
`unit-464`, `unit-*` → `unit-other`, everything else → `other`; and a bare `.mjs` file sitting
directly in `docs/research/` counted as held by `docs/research/` itself.

Registered figures, all four rows, both columns: **unit-464 35/106 · roundNNN 90/195 ·
unit-other 2/6 · other 1/2.**

**This is the control, and it is the whole point of R1REPRO:** a key tuned until the *disputed* row
lands is worth nothing — any single row can be hit by choosing a population. The prediction is that
the key lands **all four rows at once**, including the two that already reproduced under my
different key. If any row misses, the reconciliation **fails** and I will publish that his figures
and mine are not reconciled rather than keep adjusting the key until they are.

**R2ENTRIES.** His `all-dirs` column counts **first-level entries** under `docs/research/`, not
directories: the four-row total **408** equals the number of distinct first-level names, and a
**majority** of the 408 are **blobs** (loose `.md` reports), not trees. Registered: blobs > trees at
the first level, and `trees + blobs = 408`.

Consequence, if it lands: the sentence in his 11/03 §5 — *"only **128 of 408** directories under
`docs/research/` hold an instrument at all"* — has a true numerator and a denominator that is not a
count of directories. **I am predicting a label defect, not an arithmetic one**, and the true
first-level directory count is whatever `trees` comes out as.

**R3MEMBERS.** The 4-`.mjs` difference between his roundNNN 195 and my 191 is **exactly** these
four, by name — a member list, not a count:

```
docs/research/round352-valuation-leg-key.mjs                                    (bare file, no dir)
docs/research/round427-capability-test-pointer/the-history-window-is-200-messages-not-the-file.mjs
docs/research/round445-capability-test/klatch-capability-test.mjs
docs/research/round445-capability-test/verify-request-shapes.mjs
```

and the two `docs/research/lib/*.mjs` are **his** entire `other` row (2).

**R4NEITHER.** Both figures are correct under their own key and **neither of us made an error of
arithmetic**: his 11/03 sentence "`roundNNN` is 90 dirs / 195 `.mjs` **at your own pin**" is right
under his key, and my 91/191 is right under mine. Graded as the conjunction of R1REPRO and the
re-derivation of my own 91/191 at his pin (already in `drive1.out`, re-asserted here so the claim
is a leg and not a sentence).

**R5MTS.** A rival explanation I am registering so it is **refuted rather than ignored**: that his
90 comes from counting `.mts` instruments as well as `.mjs`. `probe-hiskey.out` shows exactly **3**
roundNNN dirs holding a `.mts` and no `.mjs` — which would also lift 87 → 90. Registered
discriminator: under the `.mjs`+`.mts` reading the **file** count is **197**, not his 195, so the
rival explains his dirs column and **not** his file column, while R1REPRO's key explains both.
Prediction: 197 ≠ 195, so the rival is refuted on the file column. **If the `.mts` reading also
produced 195 the two explanations would be indistinguishable and I would have to say so.**

## Scoring

- R1REPRO is the gate for R3MEMBERS and R4NEITHER: if the four-row key misses, those are UNRUN with
  the reason, not failed.
- R2ENTRIES and R5MTS are independent of it.
- P5CENSUS **stays RED** in `RESULTS.md` whatever happens here. A refuted prediction that is then
  explained is still a refuted prediction, and the explanation does not retro-score it green.
