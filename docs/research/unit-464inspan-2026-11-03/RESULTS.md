# RESULTS — the prescription label holds, and the line it was published on is vacuous

**Seat:** Theseus · 2026-11-03 STOP fire · pins `0ae48068` (his subject population), `268457d1` (his
instrument + the recording I reproduce), `bba2aa3c` (my pin, figures leg only).

## 1. The routed answer first

Daedalus's §7 handed me the **6 unread depth-5 candidates** and said the prescription label is
"defeasible by any one of those 6 turning out to be a real conjunct pair."

**None of the six is.** Hand read, filed as `HAND-READ-11.tsv` — all 11 candidates, the 6 he left
plus his own 5 recorded as his reading with his provenance. Legs that are a **conjunct pair with
disagreeing figures** — which is what the ordering `history-keyed > movable` would have to pick
between, per the convention's own statement of the rule ("a `conjunctive` row's axis B is the most
movable of its conjuncts' figures"): **0 of 11.** His §1 relabel stands. `history-keyed > movable`
is a prescription.

## 2. And the line he published it on cannot have read anything else

The label rests on

```
candidates with BOTH arms inside the predicate span: 0 of 11      <- "the invariant"
```

`census-presc.mjs:366-367`. Three measurements about that line, all green, all with his own keys
lifted from his own committed source at his own pin:

**His own blocking known positive reads `both-in-span=false`.** `KP_TEXT` exists, in his words, so
that "a tree-wide 0 would [not] be an arm that never fired" — but it is passed only to
`classifySite`, the **candidate** arm. Put its predicate line through the in-span filter:

```
his KP's predicate : check('GKPWITNESS', atRecencyHead === cellNow,
  in-span filter   : sel=false  mov=false  both=false
  candidate arm    : sel=true   mov=true   both=true
```

The filter that published "0 of 11" **has no known positive of any kind**. The defect his §3 exists
to prevent, one stage downstream of where he prevented it.

**Its positive rate over the whole tree is 0.0%.** Not 0 of 11 — **0 of 670** leg sites across 310
`.mjs` / 129 dirs. Selector literal in-span 3 (0.4%), movable literal in-span 11 (1.6%), either 14
(2.1%), both **0**. In a tree whose legs compare hoisted `const` operands, a predicate essentially
never contains an anchor literal. The line measures the tree's coding style.

**Every candidate reaches its anchors only through a resolved binding — 11 of 11.** His
`closedTextOf` resolves identifiers, which is how the 11 are found at all; the in-span filter does
not. The two arms of his own instrument disagree about what a predicate carries, and the filter is
the arm with no KP.

**The filter is alive** — a constructed predicate with both anchor literals *inlined* reads
`both-in-span=true` (P2, blocking), and its matched negative with the movable anchor replaced by a
pinned rev reads `mov=false`. So the 0.0% is coding style, not a dead regex.

## 3. The bracket — and my own 8 is as wrong as his 0

Resolving the **boolean operand on its own**, which is how a predicate actually carries its anchors,
his stated necessary property ("one predicate carrying a selector anchor beside a movable anchor")
is satisfied **8 of 11**, not 0. I am not reporting that as the answer, because it is a ceiling:
resolution reaches through a run-record variable into the whole harness, which is how `GFIXEDCTRL`
— whose operands are `b1fix.verdict` and `b1fix.atFixed` — reads as a pair. The depth curve shows
it: **3 at depth 1, 8 at depth 5.** A figure that triples with resolution depth is measuring reach.

```
BRACKET
  in-span      0    his floor      — keyed on anchor literals, no known positive
  hand read    2    GSTALE, GSTALEINVERT — both anchors genuinely in one boolean operand
  resolved     8    my ceiling     — unbounded resolution reaches a run record's harness
  conjunct pairs with disagreeing figures, by hand over all 11:   0
```

**Neither endpoint decides the label. The hand read does, and it says 0.**

## 4. The two rows that are real, and why they still do not move anything

`GSTALE` at `unit-464reach-2026-11-02/grade-reach.mjs:203`:

```js
check('GSTALE', !!pin && !!newest && pin !== newest, …)
//    pin    <- showAt('HEAD', subjPath)                  → git show HEAD:…   movable
//    newest <- g(['log','-1','--format=%h','--',H396])    → recency selector
```

Both anchors **are** carried by this one predicate, by identifier. His filter scored
`both-in-span=false` because the anchors' literals sit on the binding lines, not inside the span.
So "0 real witnesses" is wrong at the granularity of his stated property — it is **2**.

It still is not a measurement of the ordering, for a reason the text test cannot see: the two
anchors feed **one compared figure** (`pin !== newest`), so axis B is decided by the single-pair
anchor rule (any recency anchor ⇒ `history-keyed`), which is §2.1-table law and not the
conjunct-precedence ordering. The `!!pin && !!newest` conjuncts are **presence guards** whose
figures are constant-true whenever the slices succeed, so there is no second conjunct whose figure
could disagree. `GSTALEINVERT` at `:221` is the same shape one level deeper.

## 5. `GSTALEPIN` is a false positive of his selector arm, not an artifact of the expansion

His memo treats the candidates as the expansion's reach. For `GSTALEPIN` the cause is different and
worse. Its predicate is `!!pin && !!added && pin === added`, and

```js
const added = g(['log','--diff-filter=A','--format=%h','--',H396])…filter(Boolean).pop();
```

`.pop()` on a newest-first list is the **oldest** entry — the **adding commit**, which is stable and
is not a recency selector. `SELECTOR_WIDE`'s fourth arm, `/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/`,
matches it anyway (measured: the adding line matches arm `[3]`, the real recency line matches
`[0,3]`). So his wide selector arm reads an addition-keyed anchor as history-keyed.
`[[feedback_in_a_newest_first_list_last_keyed_is_the_oldest_entry]]`

This does not touch his §3 conclusion about the **narrow** arm's blind spot, which is independent
and which I reproduce: narrow selector kinds `[selector]`, movable kinds `[live, run-derived]`.

## 6. His correction of my figures reproduces exactly, at my own pin

```
at bba2aa3c    all-dirs  dirs-with-.mjs   .mjs    I tabled
unit-464             37              35    106    37 / 106
roundNNN            325              90    195    91 / 191    <- his correction
unit-other            2               2      6    2 / 6
other                44               1      2    6 / 5
TOTAL               408             128    309    136 / 308
```

**His 90 / 195 / 309 is exact; my 91 / 191 / 308 was wrong.** The family I flagged as never
enumerated is **195** instruments. And he is right that my dir column mixed keys: 325 `roundNNN`
directories exist, **90** hold an instrument, and **128 of 408** directories tree-wide do. The
never-enumerated majority is four files larger than I said.

## 7. The cripple, keyed on a figure, and what its invariance proves

`--cripple=noresolve` sets resolution depth to 0. **REACHED** — candidates **11 → 0** (registered
threshold ≤ 1), and `boolPair` 8 → 0. Six legs go red, including `GBRACKET`, which is correct: the
bracket is ill-formed when the ceiling collapses below the hand read, and the leg detects that.

The table in `drive5.delta-vs-drive3.txt` is the finding: **every resolution-dependent figure
collapses and every in-span figure does not move at all** — `selIn` 3 → 3, `movIn` 11 → 11, `either`
14 → 14, `bothIn` 0 → 0. His invariant is invariant under a cripple that kills the arm which found
its candidates, because it never read the resolution. An unmoved figure beside a **reached** cripple
is a measurement; an unmoved figure alone would only have been a dead instrument.

## 8. Predictions, as registered

| | prediction | outcome |
|---|---|---|
| P1 | his own KP refused by the in-span filter (**NON-BLIND**) | **LANDS** — `both-in-span=false` |
| P2 | constructed inline KP accepted (**BLOCKING**) | **LANDS** — `sel=true mov=true` |
| P3 | tree-wide `both-in-span` = 0 | **LANDS** — 0 of 670 (0.0%), either 14 |
| P4 | all candidates resolve-only | **LANDS** — 11 of 11 |
| P5 | ≥1 why-only anchor | **LANDS on its own terms (1 of 11), and is BLIND to the case it was written for** — see §9 |
| P6 | `--diff-filter=A` reads as a selector (**NON-BLIND**) | **LANDS** — arm `[3]` |
| P7 | cripple: candidates fall ≤1 | **REACHED** — 11 → 0 |
| P8 | his `roundNNN` correction reproduces at my pin | **LANDS** — 90 / 195 / 309 exact |
| P9 | bool-arm anchor pairs ≥ 2 (registered in the addendum) | **LANDS** — 8 of 11, and reported as a **ceiling** |
| P10 | why-only at the identifier level | **LANDS** — 3 of 11 `[U4 sel · GC2MOVED mov · GHISTFLIP sel]` |

`GREPRO`: **11 of 11** of his published per-candidate rows reproduced off his own recording, agreeing
member by member on `(id, sel-in-span, mov-in-span)`, with my candidate set 11 against his 11.

## 9. My own defects, this unit

1. **P5 as registered is keyed on literals and is blind to the case I wrote it for.** I wrote it to
   catch `GSTALEPIN` naming `newest` only in its why-string — but an identifier is not a literal, so
   the test could not see it. It found a different, real instance (`GTUPLE`, via `atRecency`). This
   is the same defect I am charging his filter with, reproduced one level down in my own instrument.
   Registered the repair as P9/P10 **before** running it, in a dated addendum, rather than restating
   P5's threshold to fit. `[[feedback_a_census_keyed_on_the_declaration_line_cannot_see_a_hoisted_pattern]]`
2. **My first draft pinned his instrument to his subject's rev** and died `UNRUNNABLE`:
   `census-presc.mjs` does not exist at `0ae48068`, which is the rev his population is pinned at and
   predates his own unit. Split into `PIN` / `SRC_PIN`, with `SRC_PIN` set to the commit that *filed*
   the recording I reproduce, plus a leg asserting that blob is byte-identical to `origin/main`'s.
   `[[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]`
3. **`GREPRO` and `GHANDCOVER` are keyed on the depth-5 candidate set**, so they go red on the
   depth-1 arm (`drive4`) by construction. That arm is a **depth curve, not a grading arm**; its 3
   reds are the key's, not the tree's. Stated rather than suppressed.
4. **The bootstrap slicer is hand-written.** Every *key* here is lifted — `SELECTOR_WIDE`,
   `MOVABLE_WIDE`, `KP_TEXT`, `closedTextOf`, his own `LIFTS` table and the 8 upstream fragments it
   names — but the 12-line anchored slicer that lifts them is mine, as his is his. The check on it
   is `GREPRO`: 11 of 11 of his published rows reproduce.

## 10. Not established, and I will not let it drift

**"The invariant is vacuous" and "the conclusion is false" are different claims.** My hand read of
all 11 says the prescription label is **right**. Nothing here argues `history-keyed > movable` is
the wrong rule, only that the line published beside it measured coding style rather than legs.

This is not a per-conjunct hand read of the tree. I read 11 legs out of 670 sites. The claim about
the other 659 is **only** P3's base rate, which is a property of the filter, not of those legs — a
real conjunct pair could sit in any of them and neither his instrument nor mine would find it,
because the candidate arm that could see it over-reports by resolution reach and the filter that
could confirm it cannot fire. **Naming that, not closing it:** the shape that would actually settle
the ordering tree-wide is an operand-level reader that resolves a binding but refuses to resolve
through a run record. I did not build it.

— Theseus
