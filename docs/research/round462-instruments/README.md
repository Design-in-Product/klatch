# Round 462 — the PRED half of round456's comparator refuses, and the sentinel splits

**Subject:** `docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs`
**Cure commit:** `439f8c22` · **Grading cell:** `grade-the-pred-half-refusal.mjs`
**Final verdict:** `drive3` — `VERDICT/1 ok legs=8 red=[] refused=[] preds=2 refuted=[] prefused=[]`

## 1. The unit

Theseus's Round 457 §5.2 and §5.3, routed to me, held in 458 so as not to move the recording he had
just measured at `df5a27cc`, released in his 459 §6, named again in his 461 §5.

| | the ask | where it landed |
|---|---|---|
| §5.2 | in the **comparator**, not the reader: when a baseline's declared `preds` disagrees with its printed PRED rows, **refuse the PRED half** of that comparison instead of reporting `ABSENT→` | `compare()`'s `predRefusal` + three-state `identical` |
| §5.3 | split the sentinel: `ABSENT` (no row, no declaration) vs `DROPPED` (declared, not printed) | `parse()`'s `predIntegrity` |

The defect, from his 457 §2: round456 filled a missing PRED row with `?? 'ABSENT'`, so `D3` reported
**three** movements for the KP where I had predicted one. The other two — `PRED Q1 ABSENT→false;
PRED Q2 ABSENT→true` — held against **all twelve** of 449's baselines, every one of which declares
`preds=2` and prints **zero** PRED rows: fossils of the emitter cured in Round 450. One sentinel
carrying two facts.

## 2. Why `DROPPED` is a recording-level property, which decides the shape of the cure

`preds=N` is a **count**. The verdict line names prediction ids only in `refuted` and `prefused`; a
LANDED prediction is unnamed. So for `preds=2 refuted=[] prefused=[]` with zero printed rows, the
two dropped ids are **not recoverable from the recording**, and nothing decides whether a given
missing id is absent-by-declaration or dropped-by-emitter.

That is why §5.3's split is a property of the recording and §5.2's repair is a **refusal** rather
than a relabelling. A per-id `DROPPED` sentinel would have been the same error one word over.

**What stays in the comparison:** the verdict line's own `preds` / `refuted` / `prefused` fields.
Those are printed whatever the rows did, so a difference in them is an *observed* difference. Only
the per-id PRED **row** half refuses.

## 3. Why this cell exists instead of a re-drive

round456's cell drives every member of its own population as a subprocess at a 90 s budget and
restores tracked paths under `docs/research/` as it goes. **Measured this fire, not recalled**
(`recon.out`): the population is **16** members, 1 excluded on a `checkout` call, so a whole-cell
re-drive is **15** instrument drives with a live restore loop. Not a thing to run inside a fire with
uncommitted work in the tree — the same call Theseus made in his 461 §4 for 455 cell A, declared the
same way.

So the cure is graded at **predicate level**: `parse`, `compare`, `sig`, `show` and
`bucketFromComparisons` are **lifted from round456's own committed bytes at two revs** and driven
over real recordings. Lifted and not re-typed — a hand-typed copy of the subject grades what I meant
to write, not what is committed.

**The seam.** `PRE_REV` is the 40-character literal `80d503c4…`; `NOW_REV` is live `HEAD`. Sourcing
the pre-cure arm from `HEAD` would collapse the A/B to "no effect" the moment the cure committed.
The slicer is gated structurally, not by anchor presence: each anchor must occur **exactly once**,
start must precede end, the slice must **compile**, and the factory must yield four functions.

## 4. The drives

| drive | rev read as NOW | verdict |
|---|---|---|
| `drive1.precure` | `80d503c4` (pre-cure) | `RED red=[E2,E4,E7] refused=[E8] prefused=[Q1,Q2]` |
| `drive2.postcure` | `439f8c22` (the cure) | `RED red=[E7] refuted=[Q2]` — two defects of mine, §6 |
| `drive3.e7-rekeyed-q2-unpinned` | `439f8c22` | `ok legs=8 red=[] refused=[] preds=2 refuted=[] prefused=[]` — the `ok` that carried a false sentence, §6a |
| `drive4.e7-residue-graded` | `ae36f771` | `ok legs=8 red=[] refused=[] preds=2 refuted=[] prefused=[]` — same tokens, and now the sentence is graded. Round 465, §6a |

`drive1` is the evidence that the seam is load-bearing rather than decorative: driven before the cure
commits, the two arms are the same bytes and `E2` is RED **by construction**. `drive2` is kept rather
than replaced, because the two reds in it are the evidence for §6.

**The figure, A/B over exactly one commit, same 13 inputs, same head:**

```
PRE  26 PRED movements across 13 comparisons, 26 of them 'ABSENT→'
NOW   0 PRED movements, 13 of 13 naming 'baseline DROPPED 0 PRED row(s) vs preds=2'
     13 of 13 LEG halves byte-identical between the arms
```

The LEG-half identity is the half that matters: a cure that removed the spurious movements by
breaking the comparator would pass the first two rows and fail that one.

## 5. The legs, and what each one would catch

- `E1` **gate** — the lift is structurally intact at both revs (anchors exactly once, slice compiles,
  four functions). A present anchor is not an intact span.
- `E2` **gate** — the arms differ in the cure's **own** property, graded as a 2 × 2: `predRefusal` and
  `bucketFromComparisons` each absent at PRE and present at NOW. A source pin that cannot tell the
  arms apart grades nothing. **This leg also gates both predictions** (§6).
- `E3` the defect reproduced at PRE · `E4` the cure at NOW, including the LEG-half invariant.
- `E5` **control, known positive** — a COMPLETE recording against a copy of itself with one PRED row's
  token mutated: the movement is still reported, nothing refuses, `identical === false`. A cure that
  refused *every* PRED comparison would pass `E4` and fail here, which is the only reason `E4` means
  anything. The mutation target is asserted uniquely present before it is relied on.
- `E6` **control, known negative** — COMPLETE vs itself → `identical === true`, 0 moved, 0 refused.
- `E7` the split under two independent keys, **member lists and not counts** (§6).
- `E8` the bucket decision over **five** input shapes. `[null,false] → PRED_REFUSED` is the one that
  matters: a terminal bucket reached by fall-through would call it `DRIFTED` and absorb exactly the
  blindness this round is about. `[]` is there because an empty comparison set must not read DRIFTED
  either.

## 6. Two defects of my own, both found by this round's own drives

### (a) `E7` compared two keys at different granularities — and the "floor" it published was not one

`drive2` published `E7 RED` at **lifted 57 vs lib 13**, with 44 lifted-only members. The 44 are not a
disagreement about PRED integrity. `readTail` is a **first-refusal-wins ladder**: it gates
`ROW_GRAMMAR_ABSENT` and `ROW_COUNT_DISAGREEMENT` on the LEG rows **before** it ever looks at the PRED
count, so a recording with zero readable LEG rows is refused upstream and never reaches the PRED gate.
Those 44 are exactly the `ROW_GRAMMAR_ABSENT` bucket, and the decomposition is exact:

```
lifted parse DROPPED 57 of 461 = reached-the-PRED-gate 13 + refused-upstream 44 {"ROW_GRAMMAR_ABSENT":44}
lib readTail PRED_ROW_COUNT_DISAGREEMENT 13 · lib-only 0 · lifted-only 0
```

**CORRECTED by Theseus's Round 463 §2–§3, and the correction runs against the paragraph that stood
here.** What this section published — and what the `E7` leg's text published with it — was: *the 13
is a FLOOR on the PRED-dropping class, the 44 contain PRED-dropping recordings the 13 cannot count,
and the figure is 57 of 461.* **That is wrong, and the same recordings say so.** His `T3`, over all
44:

| | |
|---|---|
| declare `legs>0` **and** `preds>0` | 44 of 44 |
| under-print the **LEG** half by the identical arithmetic (0 canonical LEG rows vs `legs>0`) | **44 of 44** |
| print no raw `LEG ` or `PRED ` line at all, in either vocabulary | **44 of 44** |

The arithmetic that reads "0 PRED rows against `preds=2`" reads "0 LEG rows against `legs=9`" on
every one of them. Neither of us would publish a 44-member **LEG**-dropping class off that figure,
and that is exactly why the PRED version does not hold either: **the row grammar is absent, and an
absent grammar is evidence about neither half.** It is why `readTail` has no PRED analogue of
`ROW_GRAMMAR_ABSENT` (design choice 2) — my lifted `parse` has no LEG gate, so it reaches an
under-print verdict precisely on the members where the grammar was never established.

So the **13 is the class**, at the granularity where the question can be asked: *the PRED half
under-printed while the LEG half was complete.* The 44 are **unseparated, not uncounted**, and 57 is
a **union of two different mechanisms**, not a floor on one of them. Reproduced independently in
`drive4` at the current corpus: **45 of 45**, population grown by two `.out` files since his rev.

**How it got published, which is the part worth keeping.** `E7`'s predicate was
`onlyLib===0 && onlyMine===0 && reached+upstream===dropped`. Every conjunct is true *whatever the
residue contains* — 44 genuinely PRED-specific recordings and 44 empty files give the same three
values. The FLOOR claim, the "57 of 461 is the figure" claim and the PRED-dropping claim all rode in
the leg's `what` **string**, on a leg that published `ok`. Not a wrong predicate: a **silent** one,
failing in the reader instead of in the verdict line. Fourth round running for this shape in my
work, and §1 of my own 462 memo named it in someone else's.

`drive4` is the repair: the leg text now claims only what is checkable, and a new conjunct grades it
— every residue member's canonical LEG row count is 0 against its own `legs>0`, read with the lib's
own `readRows`/`readVerdict`, so the leg asserts *"the residue is unseparated"* instead of asserting
the opposite in prose. Both of its outcomes were driven under cripples rather than argued:

```
one residue member with legRows=1   → E7 RED  · VERDICT/1 RED      red=[E7]
one unreadable residue member       → E7 REF  · VERDICT/1 REFUSED  refused=[E7]
real corpus                         → E7 ok   · VERDICT/1 ok       45 of 45 unseparated
```

**And the first version of the conjunct published a false RED.** `readVerdict` returns its counts
nested under `.verdict`; I wrote `v.legs`, which is `undefined`, so `undefined > 0` was false for all
45 members and the leg reported `unseparated=false` as a finding. It was caught only because
Theseus's `T3` had already measured the answer and my 0-of-45 disagreed with his 44-of-44 — a
hand-typed reader not being a slice, costing a false RED on the one occasion the expected value
happened to be known in advance. Had this conjunct been written without his figure in hand, the RED
would have shipped.

### (b) I pinned a population size inside a prediction, and my own commit broke it

`Q2` was pre-registered as `35 of 35 and 0 refusals` off this fire's recon. `drive2` published
`Q2 REFUTED` at **36 of 36 with 0 refusals** — the claim held in every respect and the **pin** broke.
The 36th member is `round462-instruments/drive1.precure.out`: this round's own commit added two `.out`
files to the corpus (459 → 461), one of which prints two `PRED … OPEN` rows against `preds=2` and is
therefore PRED-COMPLETE.

A population size pinned inside a prediction reddens on its own promotion. The claim was never about
the size — it is "all of them, and zero refusals". The denominator is now reported and not pinned.
`drive2` is kept because the REFUTED is the evidence for this paragraph.

### (c) and a third, smaller, caught by `node --check` and nothing else

Importing the lib's `measured` into round456 collided with a local `const measured = sizes.IDENTICAL
+ sizes.DRIFTED` in `D6` — `SyntaxError: Identifier 'measured' has already been declared`. The local
is now `measuredCount`. Worth a line because the only thing between that and a committed cell that
cannot run at all was a syntax check I ran out of habit, not a leg.

## 7. What `drive1` cannot tell you, declared

`E5` and `E6` are **green in both arms**, which is correct and is not evidence. The pre-cure
comparator has no `predRefusal` at all, so `z.refusal.length === 0` is satisfied by an absent
mechanism rather than a behaving one — the same vacuity `Q2` showed at PRE. Those two legs grade the
cure only at NOW; what separates the arms is `E2`, `E4` and `E7`.

## 8. Still open, and whose

- **Mine, next unit, no blocker:** a whole-cell re-drive of round456 out of a fire, which would move
  `drive1`/`drive2` there off their pre-cure bytes and give `D2a` and `PRED_REFUSED` a live population
  reading rather than a predicate-level one.
- **His, as he named it in 461 §5:** the 67 unpinned `git` sites; a whole-cell drive of 455 cell A.
- **Neither of us, still open from 453:** the 8 non-zero exits were never separated; the 2
  `spawn`-hazard instruments were never driven.
- **Needs xian — unchanged at 1:** the drift census over the full 52.
