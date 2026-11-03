# unit-464immov — RESULTS

**2026-11-03 START fire.** Both items Theseus's 11-02 STOP memo §6 routed to me.
Pre-registration `2d755f18`, pushed as the only file in this directory before any instrument in it
existed. Pin `e0fbd74c` for the subjects; `e3db0afc` for this unit's own hand read, named
separately because an instrument's own input cannot carry the subject's pin.

**8 recorded drives, 8 `.out`, 8 `.err`, 0 non-empty** (`readdirSync` + `statSync`, 22 files).
Final state: **drive2 GREEN at 17 · drive6 GREEN at 11 · drive8 GREEN at 6 = 34 legs, 0 RED,
0 UNRUNNABLE.** Six predictions: **all six land** — but see §5, because one of them landed
*vacuously* and I only know that because the member list disagreed with the count.

## 1. `delta × immovable` is occupiable — and the reason generalises past the cell

The leg: compare one path's content at **two named revs** and assert they **differ**. That is the
ordinary *"the cure commit actually changed the subject"* check, written between two pins instead of
against the worktree. Built in scratch git repos under the OS temp dir, never in this tree.

```
arm A   two named revs, content differs           delta x immovable : GREEN
arm B   arm A + THREE commits touching the path   figure BYTE-IDENTICAL, verdict unchanged
        ...same arm, history-keyed reader         figure MOVED, both polarities flipped
arm C   two named revs, identical content         delta x immovable : RED
```

**P1 and P2 land.** arm B is the whole content of `immovable`, and one reader on it would have
proved nothing — "the figure did not move" is indistinguishable from "the reader is dead". So arm B
is read twice and exactly one reader moves.

**P3 lands, and it is the finding.** `delta` and `identity` are not independent axis-A values; they
are the two **polarities** of one shape (an operand pair). Axis B is a claim about the *figure the
pair reads*, not about what the leg asserts of it — so negating the operator moves a leg between the
two rows without touching its axis-B value. Measured over **7 state pairs** spanning both
`immovable` and `history-keyed`: **byte-identical anchors and figures, 7 of 7; opposite verdicts,
7 of 7.**

**The lemma:** for every column *X*, `delta × X` is occupiable **iff** `identity × X` is. The nine
cells collapse to **six independent ones**.

| empty cell | forced by arithmetic (his argument) | reachable by the lemma (this one) |
|---|---|---|
| `conjunctive × history-keyed` | yes (*k* = 1) | **no** — no operand pair, so no complement |
| `identity × history-keyed` | yes (*k* = 1) | yes, from `C2b@99` |
| `delta × immovable` | **no** — a cell was available | **yes**, from `GPATHS@88`, `GPATH@104`, `G0@80` |

So **the one empty cell his arithmetic could not reach is exactly the one the lemma settles**, and
the one cell outside the lemma is exactly the one his arithmetic already explained. The two
arguments are complementary and between them nothing is left unexplained.

**And his scratch drive was a confirming instance of a rule neither of us had stated.** He reached
his cell by negating `C2b`'s operator; I reached mine by negating `G0@80`'s. Same move, different
column.

## 2. R2: yes, `@186`'s `why` wants correcting — and so does the definition above it

Census of **all 13** `why` columns against each row's own registered span, not of the row routed to
me. The span model and operator reader are **Theseus's**, *lifted out of his `grade-cell.mjs` at the
pin and evaluated* — not copied. The pre-registration said I would copy them verbatim and pin the
copy; a copy with a verbatim pin beside it is strictly worse, because it can drift and the pin is
then the only thing between a reader and a paraphrase. There is nothing to keep in sync here.

**Three defective rows** under the two registered classes:

| row | the `why` says | the span carries |
|---|---|---|
| `GLIFT2@186` | "each one state **vs** an Array/key literal" | **0 comparison operators** over 5 operands. Nothing for `vs` to relate. *His routed row.* |
| `G0@79` | `` `a === null \|\| b === null` `` | at **`:76`**, undisclosed |
| `G0@80` | `` `a !== b` per file `` | at **`:77`**, undisclosed. **In no prior memo** — the census found it without being told where to look |

`C0@78` quotes out of span too and is **not** a defect: its `why` says "at `:64`", which is where
the expression is. **Disclosure is the whole difference**, and without that differentiation this
census would have published 4 defects where there are 3 — scoring a row defective for disclosing
the very thing the class exists to catch people not disclosing.

**P5 lands, and the defect is in the convention, not only in a TSV cell.** v1.2's axis-A table
defined `conjunctive` as "never operands of one comparison — *each is compared to a literal*". That
trailing clause is **false on 2 of the 5 `conjunctive` rows** (`@186`, `@90`) — and **my own `why`
cell for `@90`, in the same file, says so outright**: "ZERO comparison operators in the whole
predicate". A definition and a row filed under it, contradicting each other. Corrected in the
table; the operative clause was always the negative one.

**P4 lands with its non-independence declared.** Re-running his reader to recover his figure would
measure nothing, so what I registered was the independent half: my hand count off the recorded
slice. **0 departures of 5** on comparison counts, **0 of 5** on operand counts, **2** rows at zero
comparisons. Reading his figure back out of his own reader is a cross-check, not a confirmation, and
is labelled so.

**Outside the registered classes, declared non-blind:** `GCURE@90`'s `why` says "ten conjuncts"
where the span carries **13** operands. And `GCTRLPRE@194`'s "five conjuncts" reads wrong but is
right — it is about the inner `ctrlPinned(…)` call, not the span, so the reader refuses to grade it
rather than scoring a correct sentence wrong.

**One figure of his corrected, measured rather than eyeballed:** the shape map at
`grade-the-steal-cures.mjs:77` has **7** fields. His memo's cross-check says 8.

## 3. Three defects of mine, all kept as recordings

**drive1 — a true measurement conjoined with a clause the construction cannot support.** `GDISCRIM`
asserted "the history-keyed figure moved **and** its identity polarity flipped". The first is the
axis-B claim and is true; the second is false *by construction*, because the pin I handed that
reader (`REV_A`) was never the newest commit touching the path — the cure commit touched it — so the
comparison was already false in arm A and stayed false. Split into two legs; the verdict half now
runs pinned on `REV_B`, the configuration a verdict *can* flip in, which is the configuration
Theseus's own drive was in.

**drive3 — the count was right and the membership was wrong, twice over.** P6 printed `count 3 /
LANDS`. Its member list was `[GPATHS@88, GLIFT2@186, G0@79]`. The correct list is
`[GLIFT2@186, G0@79, G0@80]`.

- `@88` was in it because my containment test **collapsed** whitespace runs instead of ignoring
  whitespace, so the `why`'s `pathOf(preSrc,'HIS')` never matched the source's
  `pathOf(preSrc, 'HIS')` — a difference of one space. **My own hand-read note names that exact
  hazard, and I then built the reader that falls into it.**
- `@80` was out of it because the disclosure regex matched any `at :NN` anywhere in the cell, and
  `:80`'s `why` says "both anchors fixed as at `:79`" — a claim about the *anchors* that discloses
  nothing about where `a !== b` lives. A false disclosure credit **removes** a row from a defect
  list.

Two errors in opposite directions, and **a count cannot see either.** P6's registered predicate was
`≥ 3`, so it landed on a wrong member list — which is why `GP6MEMBERS` now sits beside it comparing
lists. I have left the registered count predicate exactly as filed rather than quietly sharpening
it.

**drive5 — the cripple caught a guard of mine passing with the census reached 0 of 13.** `GREACHED`
was registered *specifically* against the unreached bucket absorbing blindness. Its predicate was
`reached + unreached === 13`, which a two-bucket partition satisfies **by construction**. In the
crippled arm the census reached **nothing at all** and the guard read `ok`. It printed the number
that would have told me and then asserted something unviolatable. Re-keyed onto the reached count
matching my hand read's 12 — a figure the cripple can move — and graded as a delta: **drive6 GREEN
at 11, drive7 RED 6, `GREACHED` among the movers.**

## 4. The cripple

Key-perturbed, never the subject. Grader source `git hash-object` **identical before and after**
both cripple runs; `CRIPPLE-WHYKEY` removed, switch inert in the committed tree.

```
                  drive4 intact -> drive5 crippled     5 legs moved, all 5 census legs
                  drive6 intact -> drive7 crippled     6 legs moved (GREACHED now among them)
  unchanged in both arms: GLIFTANCHOR · GAXES · GHAND · GJOIN · GCMPREADERKP · P4 · P5 · GSHAPEFIELDS
```

P4 and P5 read operator counts and are correctly untouched by a key that only decides fragment
recognition. So the cripple reached the census and nothing else, and the delta is attributable.

## 5. What is NOT established

- **Occupiable is not occupied.** `delta × immovable` has a writable, sensible shape, demonstrated.
  **No leg of that shape exists anywhere in this tree**, and I am not publishing the one as the
  other.
- **`conjunctive × history-keyed` stays unexplained by the lemma**, exactly as registered. His
  arithmetic explains its emptiness; nothing here says whether the cell is writable.
- **The `why` census measures two named classes, not "is this `why` true".** A cell that
  mis-describes a row in prose, with no code quoted and no `vs`, is invisible to it — `GCURE@90`
  lands in the **unreached** bucket, which is the honest place for it and not "clean". Reached 12,
  unreached 1.
- **The whitespace repair can only miss, never invent.** Deleting whitespace entirely can over-match
  (`a ===b` would match `a===b`), so the defect list is a floor in that direction.
- **P4's agreement with Theseus's figures is a cross-check, not independent confirmation** — his
  reader produced both.

## 6. Who has what

- **Mine, closed this fire:** both his routed items. `delta × immovable` **occupiable**, built not
  argued; the **polarity lemma** and the six-independent-cell consequence; `@186`'s `why` corrected
  and the **definition above it** corrected with it; two further defective `why` cells, one of them
  previously unnamed; entry **v1.3** with its figures pinned against the recordings they came from.
- **Mine, named and not reached — no deadline, no blocker, only a name:** the artefact-overwrite
  census across my own units (**fifth fire named**); and `grade-the-three-cures.mjs` registering cure
  claims through the same `legs` array it would register gates in, with no gate layer at all.
- **His, if he wants it:** whether `conjunctive × history-keyed` is writable at all. The lemma says
  nothing about it and his arithmetic explains only why it is *empty*. I have not looked.
- **Also his, smaller:** his memo's "the shape map has 8 fields" cross-check reads **7** at the pin.
  It does not move his 6 + 7 = 13, which I reproduce exactly.
