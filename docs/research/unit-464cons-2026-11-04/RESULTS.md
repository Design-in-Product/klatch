# RESULTS — `unit-464cons`

**2026-11-04, WORK fire, Daedalus.** A second independent hand read of Theseus's 20 arm-`[3]`
sites; his existence-negation tested on one witness with no classifier; and the one reader
disagreement settled by measurement rather than by preference.

**Pins.** Subject `268457d1` · population `0ae48068` (his, deliberately) · his recording
`40015d90`. **Commits.** Pre-registration `c23d92e7` (the directory's only file at that commit),
hand read `2fd49cd7` (before any comparison instrument and before his TSV was opened), addendum 1
`bc01d2dc` (before the grader existed), drive1 + addendum 2 `083f5b0c`, drives 2–3 + cripple delta
`214c1372`.

**File census** — `readdirSync` + `statSync`, not from the shape of the plan: **15 files** with this
one · **4 `.out`** · **4 `.err`** · **0 non-empty `.err`** · **1 computed `.txt`**.

**Legs.** drive1 **14 legs: 10 GREEN · 2 RED · 2 UNRUN**; drive2 after the two registered repairs
**14 legs: 13 GREEN · 0 RED · 1 UNRUN**; drive3 (cripple) **15 legs: 14 GREEN · 0 RED · 1 UNRUN**.
The surviving UNRUN is `P8R441`, declared not-reached with its reason rather than dropped.

---

## 1. His answer reproduces, and his existence-negation is now established rather than argued

`P1REPRO` is **blocking** and ran before any class was compared: **310 `.mjs` · 40 selector files ·
18 arm-`[3]`-only · 20 arm-`[3]` sites**, every figure against his own published numbers **parsed
out of his committed `drive1.enumerate.out`**. His rows are indented and flag-padded; a hand-typed
row is not a slice.

**`P2WITNESS` — the whole of his §3, on one row and no classifier.**
`unit-464vac-2026-10-31/grade-cure.mjs` contains **0** occurrences of `--diff-filter=A` anywhere in
the file, and my own committed hand read makes it **FP-ONLY**. With zero occurrences there is
nothing for a flag-keyed key to match **at any granularity** — file, span or call — so the false
positive **survives** any such cure. His claim was an existence-negation, and those are the
highest-risk statements on this project; this one is carried by a single mechanical fact, which is
the only kind of evidence that settles one.

**`P3OVER` — and the flag over-credits in the other direction too.** round429's one flag occurrence
sits at line 123; its one arm-`[3]` match is at line 205; **0 of 1** occurrences fall inside any
match range. Measured as **index-range non-overlap**, not by reading line numbers and judging that
they look far apart.

**`P7SYMDIFF` — one of my own registered predictions was wrong, in my favour, and that still
counts.** I registered that my START-fire ADD-8 might not survive re-derivation, because it came
from a `.test` that stops at the first match per file — the defect his §5 found. Re-derived **per
occurrence**, the ADD set is still **8 files**. So his "same size by coincidence" framing is **not**
downstream of an under-count of mine. Reported because I registered the opposite.

## 2. The price, from two readers, and they differ by one file in each direction

```
                              R-RETAINING (a cure LOSES)   FP-ONLY (a cure BUYS)
  mine                              11  (27.5%)                 7  (17.5%)
  his                               10  (25.0%)                 8  (20.0%)
```

`P5AGREE`: **15 of 16 blind sites agree**, against a floor of **14 registered in advance** — below
which the price was not going into `LEG-CLASS-CONVENTION.md` at all. The four NOT-BLIND sites (his
memo names them with their classes) are **excluded from the numerator** and agree 4 of 4, which is
worth nothing and is reported as worth nothing.

`GORDER` closes the blindness claim as **commit order read off git**, not as an assertion:
`HAND-CONS.tsv` added at `2fd49cd7`, the grader added at `083f5b0c`, the first a **strict ancestor**
of the second. My TSV is also read **at its own add-commit**, not from the worktree — a hand read I
could have edited after seeing his would not be a blind hand read.

## 3. The one disagreement is the finding: an unstated free variable, not a reading slip

The single disagreement is `unit-464t2-population-2026-10-28/grade-the-round-population.mjs#1` —
mine **R**, his **A**. Both of us described the same mechanism in writing and divided on **what "the
selection" is**: a selected **member**, or the **extent** of the selection. Each member of an
append-only history census is immutable; the set it returns grows with every commit. The two
readings agree everywhere except on census consumers, and there they disagree completely.

**And his own table takes both answers.** `round441…#1` is classified `R` with the reason *"the
FIGURE moves as history grows"*; `t2-population…#1` is classified `A` with the reason *"each member
is an addition and cannot move"*. Both reasons are true of both rows — a commit SHA, once in
round441's list, also cannot move; t2-population's row set also grows. Neither reader made an error.
**The vocabulary has a hole**, it is load-bearing for exactly one file of the price, and any cure
keyed on the class inherits it.

**`P8MOVED` settles this one empirically.** The disputed site's consumer publishes the distinct
`unit-*` creation-row count as its own measurement **M6** (`grade-the-round-population.mjs:287`) and
gates on `rows.length` (G1, line 308). Evaluated through the subject's own selection, that count is
**40** at the population pin and **45** at HEAD. The selection **moves**, so the row is `R` on the
reading its consumer actually uses.

**The test's asymmetry is registered, printed, and must travel with the figure.** `MOVED = true` is
sound evidence for `R`; **`MOVED = false` is NOT evidence for `A`** — it means only "did not move in
*this* interval", and a genuinely movable selection over an untouched path reads identically. So
`P8NEGS`'s *0 of 91 round dirs changed* is a **consistency check on my own `A` rows, not a proof of
them**, and the leg says so on the line where it prints. `GMOVEDKP` guards the other end: the test's
own known positive must read MOVED (691 → 715 commits over `docs/research/`) and its matched
negative must read STABLE (`34dd362e` at both revs), or every "stable" below it is uninterpretable.

**What this does not become.** `P8MOVED` is **not** the cure predicate. It is a *differential* test
needing two revs and an actual intervening commit, and its negative half carries no information. It
does not replace the static consumer-level reader Theseus named — that reader is his, and it stays
his. This is a cheaper instrument that answers one half of the question soundly.

## 4. The cripple is reached on a figure, and the figure is the point

`--cripple=flagkey` keys FP-ONLY on `--diff-filter=A` instead of on measured movement, with the
delta **computed into `cripple-delta.txt`** rather than eyeballed:

```
  count     7 -> 8          (+1)        <- nearly right
  members   3 of 18 WRONG   (1 lost: unit-464vac · 2 gained: round429, t2-population)
```

A count that is nearly right standing on a member list that is wrong — the exact failure the 11/04
START fire refused to commit when it recorded its 8 as a **co-occurrence, not an attribution**. The
cripple and the finding are one fact from two directions, and under **my** hand read the flag-keyed
key is wrong about **3** files, not his 2, because the disputed census row is a third error it makes.

## 5. Five defects of mine

1. **`GBOOT` compared an object to a string.** The subject's `sliceFrom` returns `{ text, lines }`
   (`census-presc.mjs:64-73`); my bootstrap returns a string; I compared them with `!==`, so all
   three slices read as disagreements and the printed reason — *"disagreements:
   sliceFrom,SELECTOR_WIDE,MOVABLE_WIDE"* — was **false**. It **fails closed**: a check that can only
   go RED cannot launder a bad lift. **This is the same mis-key Theseus reports in his own `GBOOT`
   the same morning** (his §8, defect 1). Two seats, two instruments, one day, the same defect, each
   caught by its own drive. Worth recording as a class: *a lifted function's return **shape** is part
   of its interface, and a bootstrap check that does not assert the shape is comparing types.*
2. **`GMOVEDKP`'s matched negative was keyed on a path absent at one rev.** I chose the *subject* as
   the declared path — and `git ls-tree 0ae48068 -- docs/research/unit-464presc-2026-11-03/` is
   **empty**, with `merge-base --is-ancestor 268457d1 0ae48068` exiting **1**: the subject pin is
   **newer** than the population pin. `oldestOf` returned `null` at both ends and `null !== null` is
   `false`, so an **absence printed as a disagreement**. The repair draws the negative **from the
   measurement** (`arm3Only[0]`) and adds the missing third state — `moved`, `stable` and
   `unresolvable` are three findings, and an instrument with two states for three outcomes will
   mislabel one of them.
3. **A registered prediction of mine was wrong** — `P7SYMDIFF`. I predicted my ADD-8 might not
   survive per-occurrence re-derivation and it did, exactly. Reported as refuted rather than quietly
   dropped.
4. **`P8R441` is unreachable by this instrument and I had not seen that when I registered it.**
   Addendum 1 lists round441 as a control; its selection runs over `TRACKED_TARGETS`, which the
   subject derives by scanning every `.mjs` blob in the tree at its own `REV` for a
   `writeFileSync(join(HERE|REPO, '<literal>'))` shape. Re-deriving that by hand would grade **my
   re-implementation**, not the subject's selection. Reported **UNRUN with the reason**, not dropped
   and not faked; both readers already agree on the row, so no figure turns on it.
5. **drive3 was re-run after I added the delta emission.** The first drive3 computed the same delta
   and printed it to the console only; the re-run writes `cripple-delta.txt` from the same
   computation. A **reporting change**, moving no threshold and no verdict — declared here because
   an edit between drives is exactly the kind of thing that should never be silent, even when
   nothing committed changed.

## 6. Deliverable — convention v1.8 §2.1j

`LEG-CLASS-CONVENTION.md` goes to **v1.8** with a new **§2.1j** and `MEASURED-BLOCK-V18`. Two
standing instructions:

1. **A cure for arm `[3]` keyed on `--diff-filter=A` is known wrong before it is written**, at every
   granularity. If arm `[3]` is narrowed, the predicate must be *"does the selection move"*.
2. **Say which reading of "moves" you mean** — *member* or *extent*. They agree everywhere but on
   census rows, and they are load-bearing for one file of the published price.

§2.1i's `18 (45%)` / `8` block takes a **forward pointer, not a retro-edit**, per §2.1e: the
co-occurrence caution it records was right, the hand reading it called for has now been done twice,
and the attribution lives in §2.1j.

**Older instrument checked, not assumed.** The v1.5 entry gate
(`unit-464prec-2026-11-03/grade-entry-v15.mjs`) re-driven **after** the v1.8 edit —
**GREEN, 6 of 6**, empty `.err` (`drive4.entry-v15-after-v18.out`).

## 7. The label is untouched

`history-keyed > movable` rests on Theseus's hand read of all 11 conjunct candidates — **0 pairs
with disagreeing figures** — and nothing in this unit bears on it in either direction. v1.7 said
"arm `[3]` over-reports by an unmeasured amount"; v1.8 says "arm `[3]` over-reports on a measured set
of files, two readers agree on 15 of 16 of them, and 1 member of the false-positive set is invisible
to the obvious cure." **Neither sentence says the conclusion is false**, and arm `[3]` is still not
cured — pricing a cure is not applying one.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
