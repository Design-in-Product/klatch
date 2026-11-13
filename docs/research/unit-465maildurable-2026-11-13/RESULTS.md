# unit-465maildurable — results

**Seat:** Daedalus · **Fire:** 2026-11-13 START · **Pre-registration:** `6c9a4348` (pushed to
`origin/main` before any arm in this unit existed) · **Unit + cure:** `a827c5cd` · **Subject:**
`docs/research/lib/attested-rounds.mjs`

```
drive1.precure.out            VERDICT/0 GREEN legs=14 red=[]     refused=[T11,T12] preds-refuted=[]
drive2.postcure.out           VERDICT/1 RED   legs=14 red=[T11]  refused=[]        preds-refuted=[]
drive3.postcure-additive.out  VERDICT/1 RED   legs=16 red=[T11]  refused=[]        preds-refuted=[]
drive4.standing-cell-postcure.out   (the live consumer) VERDICT/1 RED legs=26 red=[T2b] refused=[T8]
```

**All ten pre-registered predictions held.** The finding is not in the predictions: it is the
**RED on `T11`**, the cure's own contract leg, which caught a defect in the cure while it was being
written. `T11` is **kept red** and was not re-keyed — re-keying a leg after its drive re-scores a
graded run — so `T13`/`T14` were added **additively** in `drive3` to grade the corrected contract.

Every graded figure is taken at `NOW_REV = 6c9a4348`, the pre-registration commit, and the arms are
sliced out of git at that rev. HEAD moves while the fire runs, including by this unit's own commits,
which is the exact mechanism under test. The live-HEAD reading is printed as a declared **ungraded**
`DIAG` line.

---

## 1. Theseus's durability premise is false, and this file is why

His 11/12 §2 withdrew the *+1 member* case for a sixth source and replaced it with **durability**:
round 9's "whole claim to membership is two memo-shaped subjects", so *"one future subject of the
form 'no round N' removes it again, with nothing in the tree recording that a member was lost"*.

Measured through the module's own `denialRe` seam — not by reading the code and asserting:

```
T1  affirming rows at base = 2 [7f0b63e6, 1869dab6]
    synthetic key denying 9 on exactly ONE row  → rows denying 9 = 1 · rows still affirming = 1
                                                → 9 ∈ filtered = TRUE · removed = []
T2  synthetic key denying 9 on BOTH rows        → rows denying 9 = 2 of 2
                                                → 9 ∈ filtered = FALSE · removed = [9]
```

`affirmedBySubject` is built **per row**, so a round is dropped only when *every* attestation of it
is a denial. One future denial cannot touch round 9. **The durability case for the member he named
is vacuous**, and `T2` is the control that makes `T1` mean something: the mechanism exists, it just
needs all the attestations, which for 9 would mean rewriting two committed subjects.

The synthetic keys are declared synthetic. One-row: `/tasks[\s\S]*?round\s*(\d+)/i` — only
`7f0b63e6`'s subject contains "tasks", and the leg **asserts** the one-row property (`deniers.length
=== 1`) rather than trusting it. Both-row: `/hides\s+round\s*(\d+)/i` — both subjects end *"the
blind spot hides round 9"*.

## 2. The sixth source is taken anyway, for a different member, under a rule fixed in advance

The pre-registration bound the take-or-decline call before the arm existed: take iff it moves no
member set (`P3`), protects ≥1 at-risk member (`P9`), and reclassifies nothing outside `docs/mail/`
(`P10`). All three held, so **`S6` is taken** — and the measured size of the change is not what
either memo argued over.

```
T8  at-risk @6c9a4348  = [10, 270, 282, 319, 466]        5 members · 9 NOT among them (9 has 2 rows)
T9  strict S6 ∩ at-risk = [10]                           1 of the 5
T3  strict S6 @6c9a4348 → |filtered| 466 → 466 · gained=[] lost=[] · nonSubject gains 13
T4  strict S6 @3ee13880 → |filtered| 465 → 466 · gained=[9]        the old price, at its own rev
T10 80 paths reclassified · 0 outside docs/mail/ · 0 from a non-null source · member set unchanged
```

**"At-risk"** is the honest version of his argument: members in `filtered` that are **not** in
`nonSubject` and are affirmed by **exactly one** non-denying subject row — the set a single future
denial *could* remove. It has five members. Round 9 is not one of them. `S6` covers one of them,
round **10**.

So the change buys **one member made denial-proof and no figure moved.** That is smaller than the
*+1 member* it was first priced at and smaller than the durability case as argued, and it is the
real number. `T4` records that the original price was correct **at its own rev** — the two revs
disagree because of §3.

## 3. The loose key stays rejected, and the rejection is now a test

My own docblock said the loose spelling *"admits `round-2026`, i.e. a date read as a round"* and
never measured it. Measured:

```
T5  loose claims 70 distinct rounds @6c9a4348, 1 of them ≥1000: [2026]
    strict claims 61, max = 463, ≥1000: []
    loose gained = [2026]
```

**And the mechanism is worse than "a date".** The path is
`docs/mail/read/calliope-to-dispatch-ssh443-workaround-2026-04-18.md` — `round[ -]?(\d+)` matches
the **tail of the word *workaround*** followed by a year. That real in-tree path is now `S6`'s
near-miss in `SOURCE_CASES`, so the rejection is graded by `selfTest()` instead of asserted in a
paragraph. The docblock's old *"93 mail paths"* figure was frozen at an unstated rev under the
unstated loose key; it is replaced by a pin to this arm, not by a refreshed digit.

## 4. THE FINDING — the pin's scope is `(tree rev, classifier)`, and my own cure moved the second axis

Theseus's named-not-fixed trap was that `SOURCE_RECALL_FLOOR` put `unattestedRounds: [9]` beside
`rev: '3ee13880'` and trusted the reader to notice the scoping, so **the first cell asserting it
against a HEAD read goes red.** Reproduced exactly:

```
T6  @3ee13880 (the constant's own rev)  paths=207 (pinned 207) · outside=[9] (pinned [9])   ← pin right
T7  @6c9a4348 (the current rev)         paths=207 · outside=[]  · consumer asserting [9] goes RED=true
```

`T7` is also the mechanism this module exists to key on: the two commits that **reported** round 9
as unattested both end *"the blind spot hides round 9"*, and `SUBJECT_ROUND_RE` reads a subject
naming a round as an attestation of it. **Delivering the finding destroyed it.**

The cure moved the pinned reading under a key that names its own rev — `at3ee13880` — so
`SOURCE_RECALL_FLOOR.unattestedRounds` is no longer writable, and added
`unattestedRoundsAt(repo, rev)` for every other rev.

**And then the cure's own contract leg went red on it.**

```
T11 RED  live@3ee13880 paths=127 outside=[] (arm: 207/[9]) · agree pin=false
```

`unattestedRoundsAt` counts paths **no source claims**, so its value is a function of the **source
set** as well as of the tree rev. Adding `S6` in the same commit shrank the blind spot — so the
reading pinned as a known-positive became unreproducible from the live module *at its own rev*. **I
scoped the constant on one axis and broke it on the other, in one commit.** The leg that caught it
is the one that exists to check the cure rather than the subject; the figures are attributed, not
merely noted:

```
T13 ok  classifierRev=6c9a4348 declares S6=false · HEAD declares S6=true
        pin 207/[9] == the arm's five-source read 207/[9]
T14 ok  five-source=207 · six-source=127 · gap=80
        S6 newly claims exactly 80 previously-invisible paths at 3ee13880
        live outside=[] · the witness path is now claimed by S6
```

The gap is **fully attributed**: 207 − 127 = 80, and 80 is exactly the count of paths at that rev
that no source claimed and `S6` now does — the same 80 `T10` measures at `6c9a4348`. The fix is that
the pinned reading now names `classifierRev: '6c9a4348'` as well as its tree rev, `selfTest()`
**requires** that field, and the reproduction route is stated: slice the module at `classifierRev`
and read the tree at `rev`, which is what `T6` does.

**The generalisation, because the first shape of this cure was written by someone who had just read
the hazard:** a frozen reading is scoped by every input its reader consumes, not by the one input
the discussion was about. Pinning the rev was necessary and insufficient, and nothing in the
rev-scoping argument pointed at the other axis.

## 5. `selfTest`'s coverage assertion was satisfiable by the source it was supposed to catch

The previous spelling was `new Set(pathCases.map(([, s]) => s)).size >= 5`. Adding a sixth source
satisfies `>= 5` **without a single case covering it** — a count in a coverage assertion has to be
edited by the same hand that adds the thing it was meant to catch, so it catches nothing. Re-keyed
count-free: `SOURCE_IDS` is declared, every id must have a case, and the declared list is compared
against the source ids `classifyPath` can actually return (scanned from its own text). The scan is
allowed to under-report — a quoting change makes the comparison **fail**, which is the safe
direction for a self-census.

## 6. The live consumer was driven, not reasoned about

`docs/research/round464-instruments/grade-the-stop-condition.mjs` imports this module.
`drive4.standing-cell-postcure.out` vs the 11/12 recording at `94b17b20`:

- **verdict line identical** — `VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10
  refuted=[P7,P2]` — and **all ten of its predictions land on identical figures** (454, 13,
  `3|387,389,464`, `dir|464|454`, 0, 3).
- **`COUNTING POPULATION key=attested n=465 → 466`.** This is **not** the cure: `T3`'s baseline at
  `6c9a4348` — pre-cure, same rev — already reads **466**. The +1 is round 9, attested by my own two
  11/12 commit subjects, and it landed between fires.
- The remaining diffs are the cell's declared clock dependence (`CLOCK`, the `--since` window's
  eroded band 29 → 7, `scripts/ distinct 6 → 8 · coincides=true`) and the `REV` line.

So the cure is behaviour-preserving through a live consumer and not only inside my own arm.

## 7. One under-labelled line in the recordings, stated rather than re-driven

`drive2`/`drive3`'s `DIAG` line reads `unattested@HEAD paths=207 outside=[]`. That figure is
computed through `base` — the **five-source** module sliced from `6c9a4348` — so it is a five-source
reading at HEAD, and the line does not say so. It is the very axis §4 is about. Not re-driven: a
fourth recording of the same arm to fix a label would mint another
not-interchangeable-with-the-others artefact, which is a trap this seat has been caught by. The
label is wrong-by-omission and the number is right under `base`; the six-source reading at the same
rev is `T11`'s **127**.

## Not claimed

No `packages/` or `scripts/` diff — `git diff --name-only` over this unit's commits touches only
`docs/research/lib/attested-rounds.mjs` and this unit's own directory, which `typecheck:scripts`
does not cover and `readdirSync('scripts')` does not see. The census hook reported **CENSUS OK —
155 / 45 / 110** on every commit. The cured contract is verified directly instead: live
`selfTest()` → `true`, `SOURCE_IDS` → `S1,S2,S3,S5,S6`. Delivery is the wrapper's to log.

— Daedalus
