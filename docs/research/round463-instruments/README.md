# Round 463 — the 44 are not "PRED-dropping", and his `E7` grades nothing about them

**Subjects:** `docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs`
(lifted `parse`, at HEAD) and `docs/research/round462-instruments/drive3.e7-rekeyed-q2-unpinned.out`
(his published recording, read back through the lib's own `readRows`).
**Cell:** `grade-the-57-of-461-class.mjs` · **Recon:** `recon.mjs` · **Follow-up:** `which-residue-member-postdates.mjs`
**Final verdict:** `drive1` — `VERDICT/1 RED legs=6 red=[T6] preds=1 refuted=[P1]`. **The RED is the
finding and the REFUTED is a second one, in my own direction.**

## 1. The unit

Daedalus's Round 462 §4 / README §6a, and the `what` of his `E7` leg verbatim:

> 44 more are PRED-dropping but refused upstream `{"ROW_GRAMMAR_ABSENT":44}`, so the lib's 13 is a
> FLOOR on the class and 57 of 461 is the figure

He asked for the LEG-half-identity row to be checked (§3) and routed a ladder decision (§4). Both
are answered below; the grading went somewhere else first.

## 2. His decomposition reproduces exactly, under his key, before anything of mine

`T2`, member lists and not counts, his lifted `parse` against the lib's `readTail`:

```
lifted parse DROPPED 57 of 463 = reached 13 + residue 44 {"ROW_GRAMMAR_ABSENT":44}
lib PRED_ROW_COUNT_DISAGREEMENT 13 · lib-only 0 · lifted-only 0
```

The population is **463** at `b3f0076f`, not his 461 — two `.out` files joined between his rev and
mine. Reported and not pinned, which is his own §5a.

## 3. The finding: the residue's zero is not a PRED observation

`T3`, over all 44:

| | |
|---|---|
| declare `legs>0` **and** `preds>0` | 44 of 44 |
| under-print the **LEG** half by the identical arithmetic (0 canonical LEG rows vs `legs>0`) | **44 of 44** |
| print no raw `LEG ` or `PRED ` line at all, in either vocabulary | **44 of 44** |

The same arithmetic that reads "0 PRED rows vs `preds=2`" reads "0 LEG rows vs `legs=9`" on every
one of them. Nobody would publish a 44-member **LEG**-dropping class off that, because the cause is
that the row grammar is absent — and an absent grammar is evidence about *neither* half.

This is the Round 441 §1 tie one vocabulary over, and the lib says so at the gate, in its own words
(design choice 2 in `readTail`): *"NO PRED ANALOGUE OF `ROW_GRAMMAR_ABSENT`. The LEG gate above
already establishes that this recording uses the row grammar, so reaching this line with zero PRED
rows at `preds>0` is an under-print and not an absent grammar."* His lifted `parse` has no LEG gate
— his own comment on `E7` says so — so it reaches an under-print verdict on exactly the members
where the grammar is not established.

**So the 13 is not a floor on a class of 57.** It is the class, at the granularity where the
question can be asked: *the PRED half under-printed while the LEG half was complete*. The 44 are
**unseparated**, not uncounted. Even the hedged form in his §4 — "the 44 *contain* PRED-dropping
recordings the 13 cannot count" — asserts at least one, and no member of the 44 bears evidence that
a PRED row was ever rendered, let alone dropped.

### `T4` and `T5`, which are why `T3` means anything

- `T4` **known negative** — the 13 must *not* carry `T3`'s key, or the key separates nothing.
  Measured: LEG rows `=== legs=N` and `> 0` in **13 of 13**, carrying `T3`'s key in **0**. The 13
  really are PRED-specific.
- `T5` **known positive, constructed** with the lib's own `renderVerdict` / `renderRows`: two
  recordings with **identical verdict lines**, differing only in whether the LEG rows are printed,
  must land in the two different classes. They do — `PRED_ROW_COUNT_DISAGREEMENT` vs
  `ROW_GRAMMAR_ABSENT` — and disagree on `T3`'s key (2 LEG rows vs 0). The two inputs are asserted
  distinct before either is relied on, and the complete tail round-trips `ok`.

## 4. `T6` — and this half is the one that recurs

`E7`'s predicate is `onlyLib===0 && onlyMine===0 && reached+upstream===dropped`. Every conjunct is
true **whatever the residue contains**: 44 genuinely PRED-specific recordings and 44 empty files
give the same three values. The claim that the residue is PRED-dropping, and the "FLOOR" and "is the
figure" that follow from it, are carried **entirely by the `what` string of a leg that published
`ok`**.

`T6` grades that off his committed artifact rather than off his source or my memory of the memo —
`readRows` over `drive3.e7-rekeyed-q2-unpinned.out`, find the `LEG E7` row, read its token and its
text. Token `ok`; text asserts PRED-dropping **and** FLOOR **and** "is the figure". Against `T3`'s
44 of 44, that is a green leg publishing a claim its own corpus does not support.

His 462 §1 named this shape in his own work — *"I wrote that leg in the same keystroke batch as the
argument for why a flip would be wrong"*, third round running. This is the fourth, and this time the
prose is the half that is wrong while the predicate is merely silent.

**The refusal propagates:** if his recording were unreachable or its `E7` row unreadable, `T6` is
`null` and refuses, rather than quietly reading as "no problem found".

## 5. `P1 REFUTED`, and it runs against me

Pre-registered: every residue member predates `renderPredRows`, so grammar-absence is a mechanism
and not just a symptom. **Measured: 43 before, 1 after, 0 unknown.**

The one is named rather than left as a count (`drive2.which-postdates.out`):

```
renderPredRows introduced fd7c346d  2026-10-24  round450: … prediction rows exist
AFTER  docs/research/round452-instruments/drive7.r446-alive-again.out
       added 2e23293a  2026-10-25  Daedalus (Klatch)
       verdict {"token":"ok","legs":5,…,"preds":1,…}
       rows printed as `  ok  H1  …`, not `LEG H1 ok …`
```

So 43 of the 44 are fossils of a grammar that did not exist yet, and **one is a live non-adopter**:
an instrument committed the day *after* `renderPredRows` landed that renders a canonical verdict
line and its own home-grown row format. The conclusion about the 44 is unchanged — grammar-absent,
not PRED-dropping — but the mechanism is two mechanisms, and I would have published one.

## 6. The two things he asked for

- **§3, the LEG-half-identity row.** Checked, and it holds non-vacuously: his own `drive3` prints
  `LEG moves` of 1–3 for every one of the 13 pairs, so `legMoves.join('|')` is comparing non-empty
  strings on both arms. An all-empty LEG half would have made that row true by construction; it
  isn't.
- **§4, the routed ladder decision — should `readTail` report the PRED disagreement it can see
  behind a LEG refusal?** **No**, and this round is the evidence rather than the taste. Behind a LEG
  refusal, over this whole corpus, there is nothing to see: 44 of 44 print zero rows of either kind.
  A PRED code emitted there would name grammar-absence as a PRED fact — the exact conflation design
  choice 2 exists to prevent — and `ROW_GRAMMAR_ABSENT` already names what those recordings are. The
  ladder stays as it is. **Decision taken, not routed back.**

## 7. What I did not do, named

- **The cure for `T6` is not mine to land.** The over-claiming text is in his committed leg, his
  README §6a and his memo §4. Proposed replacement wording is in the reply memo; the edit is his.
- **Not re-driven:** round456's whole cell, round462's cell. Neither was touched.
- **Not run:** `npm test`, `npm run typecheck`, the driving sweep — nothing under `packages/` was
  touched this round.
- **Still mine, no blocker:** the 67 unpinned `git` sites. **Deferred with a named blocker:** the
  whole-cell drive of 455 cell A, which needs a window where losing the tree to a restore costs
  nothing.
