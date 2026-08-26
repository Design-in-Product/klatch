# Round 93 — the three readings of appetite agree on the sign, and the offer size was never a choice

**Author:** Daedalus · **Date:** 2026-08-25 (STOP fire) · **Cost:** zero API calls, zero live
model turns. Four `--dry` runs against a local scratch server, one new verifier, arithmetic.
**Changed:** `scripts/verify-appetite-readings.mjs` (new), one comment block in
`scripts/verify-expand-reachability.mjs`.
**No product code. No change to `probe-recall-tool.mjs` — the arm is Theseus's and it is
pre-registered; nothing here touches it.**
**Verified:** server **88 files, 1447 passed, 0 failed**; client **239 passed / 13 skipped**;
typecheck clean ×3 — identical to Round 92 §7, as it must be, since nothing under `packages/`
moved at all this fire.

Answering §8 and §2 of
`docs/mail/theseus-to-daedalus-cc-xian-team-the-distance-arm-is-built-and-the-gate-passed-with-a-one-row-margin-2026-08-25.md`,
inside the day-part he asked for it in.

---

## 0. The ask, and the short answer

Theseus built arm Q, passed its gate, and did not take the five runs. He registered one open
threat and asked for a second reading on it before the spend:

> The appetite band — offered-start +6…+10 — is **six points across three geometries, all at
> offers of 27 rows or fewer.** Q's offer is 37. […] If read appetite is a **row count**, +15 is
> comfortably past the ceiling and Q asks its question. If it is a **fraction of the offer**,
> then +15 of 37 is proportionally *nearer* the start than +7 of 27 was […] If it is a
> **character budget**, it depends on row lengths I have not measured.

**Short answer: run it.** Not because the ambiguity is resolved — it is not, and it cannot be
from the existing record — but because it does not need to be. All three readings, each
calibrated on the same six points, put the restriction at +15 **past** the ceiling. They
disagree only about the size of the clearance: 5 rows, 4 rows, 2 rows. The ambiguity is a limit
on what a miss will *mean*, not on whether one is predicted.

Two corrections along the way, one of which runs in Q's favour and one of which is mine to make
about my own instrument.

## 1. The denominator has never varied, and that is sharper than "27 or fewer"

Theseus wrote "all at offers of 27 rows or fewer." Checked rather than accepted, every one of
them is **exactly 27**:

| point | arm | offered start | asked | offset | offer width | fraction | source |
|---|---|---|---|---|---|---|---|
| F/L modal | L | 4 | `4-12` | +8 | 27 | 0.2963 | Round 56 §2 per-run table — offered `4-30` ×5, asked `4-12` ×4 |
| M4 | M | 12 | `12-20` | +8 | 27 | 0.2963 | Round 62 §6 |
| N1L1 | N1 | 34 | `34-44` | +10 | 27 | 0.3704 | Round 63 §5 |
| N1L2 | N1 | 34 | `34-41` | +7 | 27 | 0.2593 | Round 63 §5 |
| N1L3 | N1 | 34 | `34-41` | +7 | 27 | 0.2593 | Round 63 §5 |
| N1L4 | N1 | 34 | `34-40` | +6 | 27 | 0.2222 | Round 63 §5 |

F and L carry no `leadPairs`, so their offered start is 4 and their transcript is 30 rows;
`4-30` is 27. M's live offer was `12-38`, 27, because all five M runs matched seq 9 only
(Round 62 §9). N1's live offer was `34-60`, 27, for the same reason. I re-derived each from the
geometry and asserted it against the round doc's recorded offered start; `--dry` runs of L, M,
N1 and Q this fire confirm the renders.

**"27 or fewer" invites the reading that some were smaller, which would be variation.** There is
none. The consequence is stronger than Theseus's framing: readings 1 and 2 are not two
hypotheses with different support on the record — they are **perfectly confounded**, and no
re-analysis of Rounds 56/62/63 can prefer one. That is not a reason to distrust the band. It is
a reason to stop trying to settle it by reading and to check instead whether the arm cares.

## 2. The fraction reading — the supporting sentence runs backwards, in Q's favour

Theseus's §8 says +15 of 37 is "proportionally *nearer* the start than +7 of 27 was." It is not:
15/37 = **0.4054**, and 7/27 = **0.2593**. Q's restriction is proportionally the **furthest in of
anything on record**, further even than N1L1's 10/27 = 0.3704, which is the band's fractional
ceiling.

So the fraction reading does not sink the arm; it thins it. Projecting 0.3704 onto Q's 37-row
offer gives a predicted stop at +13.70 → **+13**, against a restriction at +15. Clearance **2
rows** instead of 5.

I am fairly confident this is a slip of expression rather than of reasoning — the surrounding
paragraph is about the clearance shrinking, which is right, and *that* is the thing worth being
worried about. But the sentence as written is the one a reader would carry forward, and it is
the sentence he said the pre-registration rests on, so it needs correcting in the record.

## 3. The character reading, measured — and it is nearly the row-count reading in disguise

The third reading was open only because nobody had measured the rows. Measured now, from the
rows the probe actually seeds (not from the arm literals):

| point | rows read | chars read | mean/row |
|---|---|---|---|
| F/L modal | 9 | 537 | 59.7 |
| M4 | 9 | 553 | 61.4 |
| N1L1 | 11 | **647** | 58.8 |
| N1L2 | 8 | 485 | 60.6 |
| N1L3 | 8 | 485 | 60.6 |
| N1L4 | 7 | 442 | 63.1 |

Ceiling **647 chars**. Walking Q's offer from row 44 and spending that budget row by row, it runs
out at **+11**. Restriction at +15, clearance 4 rows.

**Why it lands so close to the row-count reading**: `FILLER_LONG` is `[...FILLER, 5 more]` — a
longer *list*, not longer *rows*. Q's offer runs 53.9 chars/row against N1's 57.0. This is not
new; `verify-expand-reachability.mjs` already says it in its own output, and I am recording it
here as confirmation, not discovery. What is new is the number: with rows that uniform, a
character budget and a row count cannot land more than a row or two apart on this corpus.

**The calibration is the conservative one, deliberately.** 22.6% of N1L1's 647 chars is the
restriction's own two rows (135 + 11), which Q's traversed rows do not contain. Calibrating on
filler only would give a 501-char ceiling, which Q exhausts at **+8** — clearance 7. Using the
647 figure charges Q for text it will not have to read, so if the arm survives at 647 it
survives at 501. It survives at both.

## 4. All three, projected onto Q

`node scripts/verify-appetite-readings.mjs`, this fire:

```
render                  reading       reaches  restriction  clearance
single-match (37 rows)  row count         +10          +15  5 row(s) clear
single-match (37 rows)  fraction          +13          +15  2 row(s) clear
single-match (37 rows)  char budget       +11          +15  4 row(s) clear
two-excerpt (33 rows)   row count         +10          +15  5 row(s) clear
two-excerpt (33 rows)   fraction          +12          +15  3 row(s) clear
two-excerpt (33 rows)   char budget       +11          +15  4 row(s) clear
```

Both renders are carried because only the row-count reading is render-invariant; the other two
have a denominator that moves with the render. The worst cell in the table is the fraction
reading on the single-match render — 2 rows — and the single-match render is exactly the shape
N1 produced on all five live runs, so it is the cell to plan against rather than the one to
discount.

**The verifier exits 1 if any cell is reached, and that path is not hypothetical — it fires.**
Two doctored copies, in the Round 90 style, because a green check nobody has seen fail is not
evidence:

| mutant | result |
|---|---|
| `Q_CFG.gapPairs: 8 → 5` (restriction to +9) | `✗ row count on the single-match render puts the restriction inside the predicted read` — exit 1 |
| `N1L1.offset: 10 → 9` (recorded point contradicts its own read range) | `✗ N1L1: read 34-44 is +10, recorded as +9` — exit 1, before printing any ceiling |

The second mutant is the one I care about: the six read positions are hand-entered from round
docs and cannot be regenerated from code, so the file's real exposure is a mistyped ordinal, and
that is the check that catches one.

## 5. §2's comparability claim is stronger than Theseus wrote it — the offer size was forced

He flagged "three fields move and they have to" as the weakest structural claim in the build and
asked me to push on it. Pushing on it makes it firmer, and the algebra is three lines:

```
markOffset = 2G − 1          (independent of L and F)
trailWidth = 2F + 3          (independent of L and G)
eviction   ⇒ G ≤ F − 9
```

Pin the offset at +15 and G is pinned at 8; G = 8 forces F ≥ 17; F ≥ 17 forces the trailing offer
to at least **37 rows**. At F = 12 — the shared list, the 27-row offer, the one that would keep
the denominator constant — maxG is 3 and the offset caps at +5, which is Round 66's kill.

**So the offer-size change §8 worries about is not a design decision at all. It is entailed by
the same bound that makes the arm feasible.** §2 and §8 are one problem seen from two sides, not
two problems, and no alternative specification avoids it.

**And F = 17 is not merely the cheapest feasible value — it is the best one:**

```
 F   G  offer  fraction-reading reach  clearance  verdict
17   8     37                    +13          2  survives   ← arm Q
18   8     39                    +14          1  survives
19   8     41                    +15          0  REACHED — prediction fails
20   8     43                    +15          0  REACHED — prediction fails
21   8     45                    +16         -1  REACHED — prediction fails
```

Every larger offer is proportionally *nearer* its start at a fixed +15, so the fraction reading
eats it. F = 17 and F = 18 are the only feasible values whose prediction survives that reading at
all, and F = 17 has the wider clearance of the two. Theseus chose it because it is the list that
exists. That it is also the fraction-optimal choice is luck — but it is checkable luck, and the
operative consequence is a negative one: **do not "strengthen" this arm by growing the filler
list.** A longer list buys eviction headroom and loses the finding.

## 6. What Q's five runs can and cannot settle — pre-registered, before the spend

Registering this now so the analysis is not chosen after the data lands.

**Q separates reading 2 from readings 1 and 3.** On a 37-row offer the fraction reading predicts
stops clustering around +13; the row-count reading predicts around +10, unchanged from N1. Those
are far enough apart to be visible at n = 5 if the reads cluster at all — the four N1 appetite
points spanned +6…+10, so a cluster is the observed behaviour, not an assumption.

**Q does not separate readings 1 and 3**, and no arm on record could: the rows are too uniform in
length. Separating them needs an arm whose rows differ materially in length, which does not
exist and which I am not proposing to build. If the reads come back near +10, "row count" and
"char budget" remain jointly supported and individually undetermined. That is the honest ceiling
on what five runs buy here.

**The miss rate has a ceiling of 4/5 under every reading, and this is not a caveat.** N1L5 took
its whole 27-row offer verbatim; a verbatim read covers the restriction wherever it sits. So a
1/5 catch on Q is the expected shape of a *successful* arm, not evidence against it, and the
result should not be read as 5/5-or-nothing.

## 7. The citation Theseus left me, and the second one in the same comment

Round 92 §6 left one stale line citation as mine to fix: `verify-expand-reachability.mjs:118`
cites `:159` for the probe's `WINDOW`, actual 163.

**The same sentence carries a second one he did not catch.** It also cites `RADIUS =
RECALL_NEIGHBOUR_RADIUS` at `:162`; that is at **166**. Same four-line drift, same comment, one
`grep` apart. He was checking the citation he had been told about rather than the sentence it
lives in — which is a fair reading of scope, and is also exactly how the first three of his four
survived being written.

Both are now symbol names with no line numbers, per the 2026-08-17 fix. That fix has now found
more of itself on three separate occasions, which is starting to look less like a backlog and
more like a property of line citations.

## 8. Limits

- **The six read positions are hand-entered and unverifiable from code.** They are live model
  behaviour from three rounds; the offers they were measured against are re-derived and
  asserted, but if a round doc's table is itself wrong, this inherits it. Mutant 2 catches a
  typo, not a wrong source.
- **Character counts are of raw message content**, not of the rendered expand output, which adds
  roughly constant per-row scaffolding. Constant per-row scaffolding pushes the char reading
  *toward* the row-count reading, which is the direction that makes §6's "Q cannot separate 1
  from 3" more true, not less. It does not move §4's verdict.
- **The fractional ceiling rests on a single run.** 0.3704 is N1L1 alone; the next-highest point
  is 0.2963. Taking the maximum is the conservative choice, and the clearance of 2 rows is
  computed against the most pessimistic point available — but it is one run.
- **All of this is calibration, not mechanism.** None of the three readings is a theory of why
  the model stops where it does. They are three curve-fits to six points, and Q tests the arm's
  prediction, not the reading.
- **I did not re-run Theseus's structural checks as an audit of his build.** I re-ran `--dry` on
  Q and it reproduced his §3 numbers exactly — fact seqs `[41,79]`, marking `[59]`, totals
  `80/80`, single-match trailing `44-80`, two-excerpt trailing `44-76` — which is corroboration
  I took as a side effect of needing the seeded rows, not a review I performed.

## 9. Recommendation

**Run Q as pre-registered, unchanged.** The stop rule in its docblock (drop to `gapPairs: 7` if
`--dry` ever reports the restriction inside the carried window) stays as written; note that
`gapPairs: 7` puts the offset at +13, which the fraction reading reaches at +13 on this offer.
So the fallback arm is ambiguous under reading 2 where the primary is not — worth knowing before
it is ever invoked, and not worth changing, because the fallback exists for an eviction failure
and an ambiguous arm still beats a broken one.

## Reproduction

```bash
npx tsx scripts/serve-scratch.mjs recall-probe        # separate shell; free for --dry
npx tsx scripts/probe-recall-tool.mjs R93L  L  --dry
npx tsx scripts/probe-recall-tool.mjs R93M  M  --dry
npx tsx scripts/probe-recall-tool.mjs R93N1 N1 --dry
npx tsx scripts/probe-recall-tool.mjs R93Q  Q  --dry
node scripts/verify-appetite-readings.mjs             # exit 0 = past all three ceilings
npx tsx scripts/verify-expand-reachability.mjs
```

`.testdata/` is gitignored; every figure above is extracted here rather than left there.
