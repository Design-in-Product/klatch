# unit-464cell — RESULTS

**Theseus, 2026-11-02 STOP fire.** Pin `0c23e551`. Pre-registration `9193256a` (pushed to `main` as
the only file in this directory before any instrument in it existed). Slice + hand counts
`6c5bc7ad`. Drives 1–2 `cf3cea03`. Drives 3–4 (the census cripple pair) in the commit carrying this
revision of the file.

**Final: GREEN at 6 legs in drive1, GREEN at 9 legs in drive2 and in drive3 — 0 RED, 0 UNRUNNABLE in
all three. `drive4` is a deliberate cripple and is RED at 9 legs by design.**
Six predictions: **P1, P2, P3, P4, P6 land. P5 refuted** — and the refutation is the sharper half of
the answer to routed item 2.

Drive2 carries five verdicts (P1/P2/P4/P5/P6). **P3's verdict lives in drive1**, the scratch-repo
drive, and nowhere else; the grader does not grade it.

## Routed item 1 — `identity × history-keyed` is a real cell. It is occupiable, and I built one.

**P3 lands, by construction rather than by argument** (`drive1.p3-scratch.out`). In a scratch git
repo under the OS temp dir — never Klatch's own tree, so no worktree index was touched — the minimal
leg of that exact shape was driven twice:

```
arm A (control — no commit):        identity × history-keyed : GREEN -> GREEN
arm B (one commit touching the path, property unchanged):
                                    identity × history-keyed : GREEN -> RED
                                    C2b's own delta shape    : RED   -> GREEN
```

The cell is reached from `C2b` by negating **one operator**: `atPin !== atRecency` →
`atPin === atRecency`, which is the ordinary "my pin is still the newest commit touching this path"
freshness assertion — a leg a person writes on purpose. `GFALSERED` asserts the property the leg is
supposed to be about is `FOUR` at the pin and `FOUR` now, so arm B's RED reports a change that did
not happen: exactly the hazard axis B's prescription predicts. `GTARGET` asserts the perturbation's
target moved before the delta is read; `GDELTAVSCTRL` asserts the two arms differ at the second read,
because two arms that are both dead read as "no effect".

`GINVERSE` is the part I did not expect to be so clean: **`C2b`'s own shape and this one cannot both
be green on the same two states.** They are complements. The empty cell is the other half of a row
we already have.

**P1 lands, and it says the emptiness was never evidence.** Derived from his own TSV, not re-typed:

```
axis B totals: movable 8 · immovable 4 · history-keyed 1
EMPTY cells (3): conjunctive × history-keyed ; delta × immovable ; identity × history-keyed
history-keyed column total k=1 → at least 2 of its 3 cells are empty by ARITHMETIC
empty cells lying in the history-keyed column: 2
empty cells where an occupied cell was arithmetically available: delta × immovable  (the only one)
```

A column with *k* members leaves at least `3 − k` of its three cells empty whatever the underlying
possibility set is. With **k = 1**, two of those three cells are empty *before you look at a single
leg*. So **two of his three empty cells carry no information at all**, and `identity ×
history-keyed` is one of the two. The one empty cell that is worth a sentence is **`delta ×
immovable`** — row total 3, column total 4, an occupied cell was available, and it is still empty.
That is the cell to be curious about, not this one.

**P2 lands, and the figure is the surprise of the unit.** Censusing the *mechanism* rather than the
reported instance, over all **304** `.mjs`/`.mts` files under `docs/research/` at the pin: the
unpinned-`git log -1`-yielding-`%h` recency selector is at **25 sites in 15 files**, member list
printed in full in `drive2.cell.out`. `GCENSUSKP` is the known positive — the census must find a
site in `C2b`'s own file or it cannot be quoted for the rest — and 22 further `git log -1` calls were
**rejected as fixed, with the reason printed per site** (either no `%h`/`%H`, or pinned to a named
rev), which is the negative direction demonstrated on real inputs rather than claimed.

So `history-keyed 1` is a fact about **the 13-row sample**, not about the tree. The mechanism is
common here. The sample under-represents it by a factor of 25.

**Taken together:** the cell is not impossible (P3 built one), and its emptiness was arithmetically
forced (P1) over a sample that under-represents the mechanism 25:1 (P2). Three independent reasons,
none of which needed the other two.

## Routed item 2 — no, `conjunctive` should not carry a count. Three measurements say why.

**P4 lands (declared NON-BLIND).** At `grade-the-steal-cures.mjs:90`: **0 comparison operators, 13
top-level operands.** The proposal's own wording is "the number of states **compared to** literals",
and on the row that motivates it that number is **zero**. The 13 is a count of bare truthiness
conjuncts — 6 testing PRE's shape map and 7 testing POST's — not of comparisons.

And **`@90` is not alone.** `@186 GLIFT2` also reads **0 comparison operators** over 5 operands:
`Array.isArray(preDecl) && … && !!bucket(postDecl, 'pop-flag')` has no comparison in it either,
while his why-column reads "five conjuncts, each one state vs an Array/key literal". There is no
`vs` in that predicate. **2 of the 5 `conjunctive` rows have no comparison operator at all**, so a
count of literal-comparisons reads 0 on 40% of the class it would annotate.

**His "ten conjuncts" at `@90` is thirteen.** My hand read said 13 before the grader ran; the grader
measured 13; `GHANDJOIN` reports **0 departures of 5** between my hand read and the measurement. The
cross-check is that the shape map has 8 fields and the predicate tests 6 of them on PRE and 7 on
POST.

**P5 REFUTED, and the refutation is worth more than the prediction was.** I registered that `:79`'s
span carries a top-level `||` where `@90` carries `&&`, so a count named "conjuncts" would be
counting disjuncts on one of the two motivating rows. Measured: **`:79`'s span carries no top-level
joiner at all — 0 `&&` and 0 `||`.** Its registered line is

```
79  if (unreadable.length > 0) refuse('G0', …)
```

one comparison, `length > 0`. The `a === null || b === null` that his why-column attributes to `:79`
— and that **my own prior memo attributed to `:76`, correctly, one fire ago** — is three lines above
the registered line. **The expression the count is supposed to count is not in the row's own span.**
So "two" at `:79` is not a count of anything readable at `:79`; it is his reading of `:76`.

**P6 lands.** At `@194`, both span operands are call-wrapped and both are defined elsewhere in the
same pinned file: `ctrlPinned` at `:190` with **5** comparisons inside, `transition` at `:183` with
**4**. The span reads **1** comparison. A span-level count is therefore a **lower bound off by an
order of magnitude on this row**, for precisely the reason §2.1b already gives about axis A.

**The answer, then:** the count fails on all three of the things a label modifier has to do. It has
no single spelling (operands, comparisons, literal-comparisons read 13/0/0 at `@90` and 5/0/0 at
`@186`); it cannot be read off the row's own span (`:79`, `@194`); and the prescription attached to
it — "how many times it reddens" — is a **consequence**, which only a perturbation measures, not a
reading. If the number is wanted, it belongs where `drive1` put its number: a per-leg perturbation
with a matched control, recorded. Not a modifier on a label.

## Defects and limits of this unit, kept as recordings

1. **My hand read's ordering is weaker than the one I have claimed before, and the TSV header says
   so rather than describing it as the stronger one.** `grade-cell.mjs` existed in my worktree,
   uncommitted and never driven, when I counted by hand. In previous units the hand read was filed
   before the grader's source existed at all. What the join still buys is that the grader cannot
   silently agree with me — every departure prints, and the count is 0 of 5.
2. **`measure.mjs:79`'s span model is blind in exactly the way the unit then measures.** The span is
   a syntactic window from the registered line to its paren close; it cannot see an operand derived
   above that line. I declared that blindness in the pre-registration, and `:79` and `@194` are both
   instances of it. The blindness is the finding, not an escape from one.
3. **The literal-comparison regex had to be fixed before it was driven.** Written as `''|""`, it
   reads **0** on `=== '1→2'`, because `stripSource` blanks string bodies while *preserving length*
   — the literal arrives as `=== '    '`. Corrected to `'[^']*'` before drive2; a source regex that
   fails by returning a smaller number would have read `litCmps 0` at `@194` and been quotable.
4. **The slicer wrapper exists only because this fire's shell refuses an inline `PIN=… node …` env
   prefix.** `slice-at-my-pin.mjs` is four lines that set the two variables his slicer reads and
   import it. The slicing is his code at my pin, not a third hand-rolled slicer.

## The P2 census is now controlled in both directions (drives 3–4, same fire)

The cripple this file first listed as not reached **was reached, later in the same fire.** A cripple
switch on the **KEY, not the subject** — the `SELECTOR` regex re-keyed onto `-2`, which no site in
the tree writes — driven by the presence of a `CRIPPLE-SELECTOR` file rather than an env var,
because this fire's shell refuses an inline `VAR=… node …` prefix. `drive3` is the **matched
no-cripple baseline, run against byte-identical grader source**; `drive4` is the cripple arm. The
delta is recorded in `drive4.delta-vs-drive3.txt`:

```
                     drive3 (intact)     drive4 (crippled)
SELECTOR reader      keyed on -1         keyed on -2
sites                25 in 15 files      0 in 0 files
rejected as FIXED    22                  0
GCENSUSKP            ok                  RED
P2                   LANDS               REFUTED
summary              GREEN at 9 legs     RED at 9 legs
```

**Exactly one leg moved and exactly one verdict moved.** P1 LANDS, P4 LANDS, P5 REFUTED and P6
LANDS read identically in both arms, so the cripple reached the census and nothing else. The
`CRIPPLE-SELECTOR` file was removed after `drive4`, so the switch is inert in the committed tree.

"25 sites" now has a control in both directions: a known positive it must find, 22 rejections
printed with their reasons, and a blinded arm in which the figure collapses to zero.

## Named and not reached — no deadline, no blocker

* **`delta × immovable`** — the one empty cell whose emptiness is *not* arithmetically forced. I have
  not looked at whether it is impossible, and I am not going to guess from a cross-tab what I just
  spent a unit showing a cross-tab cannot tell you.

— Theseus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
