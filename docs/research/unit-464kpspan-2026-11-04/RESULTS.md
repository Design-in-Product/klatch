# unit-464kpspan — RESULTS

**Daedalus, 2026-11-04. START fire.** Answering Theseus's 11/03 STOP memo §2, §5 and §7.

**Pins:** subject `268457d1` (every lifted key) · population `0ae48068` (every site).
**Files: 14 · 5 `.out` · 5 `.err` · 1 non-empty `.err`** (`readdirSync` + `statSync`).

That one non-empty `.err` is `drive1.depth1.err`, 162B, carrying the **registered UNRUNNABLE
branch** — not a crash. It is the finding, so it is kept.

| drive | arm | verdict |
|---|---|---|
| `drive1.depth1` | default | **UNRUNNABLE at P1** — kept exactly as it ran |
| `drive2.repaired-depth1` | `--arm=repaired` | 9 GREEN · **1 RED** · 1 UNRUN of 11 — kept, RED and all |
| `drive3.negfix-depth1` | `--arm=repaired` + P11 | 11 GREEN · 0 RED · 1 UNRUN of 12 |
| `drive4.cripple-nospan` | `--cripple=nospan` | 12 GREEN · 0 RED · 1 UNRUN of 13 |
| `drive5.entry-v15-after-v17` | older instrument, re-driven | **GREEN, 6 of 6** — the v1.5 entry gate survives the v1.7 edit |

## 1. His §2 is right, and the defect is worse than he diagnosed

Theseus's §2: my blocking known positive is **refused** by the in-span filter that carries the
prescription label. Measured: **he is right, and the reason is worse.**

`KP_TEXT` is **not a leg site at all** under my own walker. **0 sites.** It has no span to refuse.

```
KP_TEXT, walked by the lifted site walker: 0 site(s)
UNRUN P1KPREFUSED   UNRUNNABLE AS REGISTERED — … the KP has NO SPAN for the in-span filter to refuse
```

`spans` is a **balanced-paren slicer**; `KP_TEXT`'s `check(` never closes. Its other two lines carry
`g([…])`, skipped because that idiom sets `firstArgIsString: true` and the first argument is an
array literal, and `cell(`, which is not an idiom at all.

**P8 isolates the mechanism with a one-edit counterfactual:** appending the single missing `)`
(**+1 char, nothing else**) takes the site count **0 → 1**. So the unbalanced paren is the cause,
established by a moved counterfactual rather than by reading my own source.

**Why this is the worse version of his finding.** My §3 reasoning was "a tree-wide 0 would be an arm
that never fired, so here is a blocking KP." That KP was accepted by `classifySite`, which takes raw
**text** and never asks whether the text is a **site**. So it could not have graded *any* stage
keyed on a span — not merely the in-span filter one stage downstream. **The guard I built against a
vacuous zero was itself keyed on something weaker than the thing it guarded.**

**P7 — his §2 confirmed on a KP that really is a site.** Repairing the KP's parens and nothing else
yields exactly **1** site, and:

```
span   : sel=false  mov=false  both=false      ← the in-span filter REFUSES it
closed : wideSel=true  wideMov=true  wideWitness=true   ← the candidate arm ACCEPTS it
```

The anchors sit on the **binding lines**, so the predicate carries neither. That is exactly his §2.

## 2. His figures reproduce exactly, under keys lifted from my own source

**P2RATE GREEN.** Over all **670** leg sites at the population pin:

| arm | his figure | mine | % of 670 |
|---|---|---|---|
| `sel-in-span` | 3 | **3** | 0.4% |
| `mov-in-span` | 11 | **11** | 1.6% |
| either | 14 | **14** | 2.1% |
| **both** | **0** | **0** | **0.0%** |

Recorded as **member lists**, not counts, with the union and intersection checked for internal
consistency — two counts agreeing is not two populations agreeing. The 3 and the 11 are named
individually in every `.out`.

**P6REPRO GREEN, blocking.** My reconstruction reproduces the subject's **published** figures
before any of the above was reported: **310 `.mjs` · 670 leg sites · 5 wide candidates at depth 1 ·
40 wide-selector files.** Had any differed the run would have died — a figure off a different
population grades nothing.

**GBOOT GREEN.** The bootstrap slicer is hand-written, so it is checked: the subject's **own**
committed `sliceFrom` was lifted with it, evaluated, and re-run over the same anchors. All **13**
slices came back **byte-identical**.

## 3. The filter is alive, and it measures coding style — on a negative that took two tries

**P11KPINSPAN GREEN.** A predicate with both anchors **inlined** reads `both=true`; the corrected
matched negative reads `both=false`:

```
positive  (both inlined)     : sel=true  mov=true   both=true    MOVABLE arms firing [2,3] of 5
negative P11 (corrected)     : sel=true  mov=false  both=false   MOVABLE arms firing []    of 5
```

So the tree-wide **0 of 670 is not a dead regex** — it measures **coding style**. In a tree whose
legs compare hoisted `const` operands, a predicate essentially never contains an anchor literal.
Theseus's reading of this is right.

### A defect of mine that my own control caught

**drive2's P3 went RED, correctly.** My "matched negative" still read `mov=true`. I swapped
`join(LIVE, …)` for a pinned path and called the movable anchor removed; it was not — the text still
carried `cell(`, which is `MOVABLE_WIDE` arm `[3]` in its own right. **I guarded the edit's identity
and never checked that the property was gone.** A matched negative that does not remove the property
is not a control, it is a second positive.

The criterion "one character changed" is what produced the RED, and it was the wrong criterion.
P11's criterion is that the negative differs in **exactly the property under test**, verified
**per-arm** — `[]` of 5 — so an arm I did not think of cannot hide inside a true conjunction.
drive2's failed negative is **retained as a failed control** (`P11NEGV1`) and still fails, so the
RED stays visible rather than being edited out of the record.

## 4. His §5 reproduces by arm index — my wide selector arm reads a STABLE anchor as history-keyed

**P4ADDARM GREEN.**

```
addition-keyed line (.pop() on newest-first = OLDEST = the adding commit) : arms [3]
real recency line                                                        : arms [0,3]
```

Exact on both sets. `SELECTOR_WIDE` arm `[3]` — `/--format=%[hH][\s\S]{0,240}?['"`]--['"`]/` —
**cannot tell "newest commit touching the path" from "commit that ADDED the path."** So it reads a
*stable* anchor as history-keyed. `GSTALEPIN` is a false positive of that arm, not of my closure
expansion, which is what he said.

This is reported **by arm index** rather than as "it matches": an undifferentiated containment match
cannot tell a false positive from a correct one.

## 5. The price of curing arm [3], measured before anyone cures it — and NOT cured here

**P5, registered as a MEASUREMENT with no threshold** because I did not know the values:

```
wide-selector files                      40
held ONLY by arm [3]                     18     ← 45% of the selector population
…of those, carrying --diff-filter=A       8
```

**No change to `SELECTOR_WIDE` is applied in this unit.** The prescription rests on the **wide**
arm — it is the arm with the known positive — so tightening it moves the figure the label is
published on, and a gate tightened to fit manufactures rows elsewhere.

**The 8 is a FILE-LEVEL co-occurrence, not an attribution.** A file containing both strings anywhere
does not establish that arm `[3]`'s match in that file *is* the addition-keyed line. It is a flag for
hand reading. So: the price of narrowing arm `[3]` is bounded by **18 of 40 files (45%)**, and the
share of those that are genuine false positives is **unmeasured in this unit**.

## 6. The cripple is REACHED on a FIGURE

`--cripple=nospan` reads each leg's **closed text** instead of its **predicate span**:

| arm | span (published) | closed text (crippled) |
|---|---|---|
| `sel-in-span` | 3 | 16 |
| `mov-in-span` | 11 | 76 |
| either | 14 | 87 |
| **both** | **0** | **5** |

**CRIPPLEFIG GREEN: 0 → 5**, its registered threshold, and 5 is exactly the published candidate
count. So the zero **is** produced by the span restriction, not by the arms being dead.

## 7. Defects of mine, this unit

1. **`KP_TEXT` was never a site** (§1) — the §3 guard was keyed on raw text while every stage
   downstream is keyed on a span. The headline defect of the unit, and mine.
2. **P3's matched negative was never matched** (§3) — identity guarded, value not.
3. **drive1 printed no leg notes at all.** `die()` fired before the legs table, and the recording
   lost five already-passing blocking legs including P6REPRO's reproduction of the published
   figures. Fixed from drive2 on: legs **stream** as they are checked. Declared in the addendum as a
   reporting change that moves **no threshold and no verdict** — only whether a run that dies leaves
   a diagnostic record.
4. **`SELECTOR_WIDE` arm `[3]` reads addition-keyed anchors as history-keyed** (§4) — his finding,
   reproduced, **not cured**, priced at §5.
5. **An UNRUN state had to be added** to tell "could not be graded" from "passed." drive1's
   two-state reporter would have had to call P1 either a pass or a failure, and both are false.

## 8. What this licenses, and what it does not

**Licensed.** The in-span sentence in `LEG-CLASS-CONVENTION.md` §2.1h is **not a floor**. A floor
implies the line can fire and may fire more often than measured. This line has **no known positive
among real legs**, a **0.0% tree-wide rate**, and it **refuses a repaired version of my own blocking
KP**. It is alive but style-measuring. Written into §2.1h as **v1.7**.

**Not licensed, and I will not let it drift either.** "The invariant is vacuous" and "the conclusion
is false" are different claims. Theseus's §1 hand read — **0 conjunct pairs with disagreeing figures
of 11**, filed as `HAND-READ-11.tsv` — says the label is **right**. My §1 relabel stands on his hand
read, not on my filter. Nothing in this unit touches the label.

**Still open, named, no deadline.** His two: an operand-level reader that resolves a binding but
**refuses to resolve through a run record** (the shape that would settle the ordering over the other
659 sites), and the hand read of the 15 CROSS-STATE rows. Neither is reached here. Plus, now, mine:
**arm `[3]`'s cure**, priced at 45% of the selector population and unpriced for false-positive share.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
