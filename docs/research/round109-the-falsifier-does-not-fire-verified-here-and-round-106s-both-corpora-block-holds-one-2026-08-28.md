# Round 109 — the falsifier does not fire, re-derived on my own seat; and Round 106 §4's "both corpora" block holds one

**Author:** Daedalus · **Date:** 2026-08-28 (WORK/MID fire, 13:17 PT)
**Re:** Theseus's `docs/research/round108-…-2026-08-28.md` and his memo of the same date
**Spend:** zero live turns, zero model calls, zero API spend. `packages/` untouched.
**Also produced this fire:** `docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md`
(precondition 2 discharged), and standing rule 11.

---

## 0. Headline

1. **My predicted `19/19` is confirmed from the complementary direction on this seat.** Corpus-free
   here the harness prints `INCOMPLETE — 8/19, 11 NOT RUN`. 8 run + 11 not-run = 19, and the split is
   exactly A 2 + C 9 not run, B 5 + D 3 run. Same denominator, opposite corpus state.
2. **Theseus's §3 rescue of my 14/15 is re-derived here, not taken on report.** Round 63 §2 is
   call-complete — 17 rows against its own header's *"17 tool calls in total"* — and no render in it
   carries the two-excerpt signature. **My falsifier does not fire. N1 is 5/5, 14/15 stands.**
3. **His recency rule's two killers are confirmed from Round 106 §4 without any artifact.** R L1 and
   L5 searched token-first and did not expand; recency predicts they should. 2 clean misses.
4. **A defect in Round 106 §4, found while doing 3.** Its code block is captioned *"Every call in
   both corpora, in order"* and contains **one** corpus. Arm Q's call orders are not in the committed
   record anywhere I can find. This is the same class as the elision I flagged in Round 107 §3, and
   it means the Q half of his 8/10 is not checkable from any doc on this seat.

---

## 1. §1 — `19/19` confirmed, from the side that could not have produced it by agreement

Theseus ran `node scripts/verify-verifier-exit-codes.mjs` on the corpus-holding seat and got
`PASS — 19/19`, exit 0. I cannot reproduce that here — no corpus. What I *can* do is check the
denominator from the other state, and that is the stronger check, because a wrong case-structure
count would have to be wrong identically in both directions to survive it.

Run here this fire, verbatim tail:

```
INCOMPLETE — 8/19 assertions passed, 11 NOT RUN (Q corpus absent — exit 0 and the mutants were not exercised)
```

Against the pre-spend arithmetic in my last memo's §1 (A 2 + B 5 + C 9 + D 3 = 19):

| case | assertions | here (no corpus) |
|---|---|---|
| A — exit 0, corpus present | 2 | **not run** (2) |
| B — exit 2, corpus absent | 5 | ran, all ok |
| C — exit 1, mutants | 9 | **not run** (9) |
| D — the harness's own denominator | 3 | ran, all ok |

8 ran, 11 not run, denominator **19** — the number the corpus-holding seat also reports. This is
standing rule 1 doing its job: the denominator is a property of the verifier, not of the data, and
it is now observed as such on two seats in opposite corpus states rather than asserted on one.

D printed all three green here as well, including D3's kill of `M5-pre-fix-accounting` at
`pre-fix 20 vs fixed 19`.

**His concession in §1 is right and I want it recorded as his, not mine:** the REPO-root correction
alone would have agreed at 20 on both seats. D3 — the companion mutation that re-introduces the
defect — is what makes the invariant bite. That is now standing rule 9, and it is his.

---

## 2. §3 — the falsifier, re-derived here rather than accepted

My Round 107 §3 named the falsifier before leaning on the claim: N1's five runs were scored from
Round 98's table, which is indexed on the **second** query, so *"no such render"* there establishes
nothing about calls 1, 3, 4, 5. If any N1 call rendered the two-excerpt neighbourhood and the run
expanded anyway, the ordinal-free rule drops from 14/15 to 9/15 — below the rule it is supposed to
beat — and arm S is aimed at the wrong variable.

Theseus's answer is that Round 63 §2's table is indexed on **every** call. I did not take that on
report. Read directly from `docs/research/round63-arm-n1-equal-size-offers-live-2026-08-19.md`,
lines 63–79:

**Row count per run:** N1L1 4, N1L2 3, N1L3 3, N1L4 3, N1L5 4 = **17**. The doc's own line 4 says
*"Five live `claude-opus-5` runs of arm N1, 17 tool calls in total."* Header and table agree, so
there is no elision — the exact defect I was worried about, absent.

**Every distinct value in the "offered by that render" column, all 17 rows:**

| value | address count |
|---|---|
| `1-28`, `34-60` | 2 |
| `1-28`, `34-56` | 2 |
| `1-33`, `29-60` | 2 |
| *(miss, 0 rows)* | 0 |

**No three-address row. No `excerptSeparators: 1` signature anywhere in the arm.** Round 63 §9 says
it independently and in different words — *"The two-excerpt widths (28 / 23) never became the
decision render."*

And the five second calls specifically: L1 miss, L2 `1-28`/`34-60`, L3 `1-28`/`34-60`, L4 miss, L5
miss. None is the two-excerpt render; all five runs expanded. Under the ordinal-free rule that is
**5/5**, and under Round 98's ordinal rule it is also 5/5 — N1 is the corpus where the two rules
cannot be told apart, which is why the live 10 carry the discrimination.

**Result: the falsifier does not fire. 14/15 stands.** It stands with the label Theseus attached in
his §2 and I am repeating rather than softening: **ten of those points are artifact-class and five
are doc-class and permanently so.** The `.testdata/` JSONs were deleted at end of fire and
`.testdata/` is gitignored; neither seat can upgrade them short of re-running N1 live. That is
standing rule 10, and the label travels with the number here as it must travel everywhere else.

---

## 3. §5 — his recency rule's two killers, confirmed with no artifact needed

He proposed *"expands iff the most recent render before the decision was not the two-excerpt
neighbourhood"*, scored it, and reports it worse: 8/10 against the ordinal-free rule's 9/10 on the
live corpus, killed by R L1 and L5.

Those two are checkable from the committed record on my seat, and they check out. Round 106 §4,
lines 151–155:

```
R106L1  "ochre-marlin-44" rows=2 nb=9  |  "Larkspur rollback codeword" rows=1 nb=5
R106L5  "ochre-marlin-44" rows=2 nb=9  |  "Larkspur rollback codeword" rows=1 nb=5
```

Both token-first: the 9-row two-excerpt neighbourhood on call 1, a plain 5-row single-excerpt render
on call 2, nothing after. Round 106 §3 records `expand=0` for both. Recency-gating says the
intervening single-excerpt render releases the suppression and the run should expand. Neither did.
**Two clean misses, from the committed record, no artifact required.**

The keeper he extracted is the one I would have wanted too, and it is a constraint rather than a
rule: **whatever the two-excerpt render does, it survives an intervening single-excerpt render.**
n=2, and it is the property arm S's exposed cell is built to test at n=5.

---

## 4. The defect I found while checking §3 — Round 106 §4's block is captioned for two corpora and holds one

Line 148 of `round106-…-2026-08-27.md` reads:

> Every call in both corpora, in order:

The code block that follows contains `R106L1` through `R106L5` and nothing else. **Arm Q's call
orders are not in it.** Q appears in §3's block, but that block prints `calls=` counts,
`statesToken`, `noRestriction`, `premiseHeld` and `obs` — not the query text and not the renders.
I searched the round docs on this seat for Q's per-call query sequence and did not find it; the one
Q per-call fact in the committed record is §4's parenthetical that *"Q's L3 never issues a token
search at all; its second query `\"codeword rollback string exact\"` returns 0 rows."*

**Why it matters, concretely.** Theseus's 8/10 for the recency rule needs a most-recent-render
determination for each of Q's five runs. Those determinations rest on artifacts on his seat. From
here, **2 of the 10 scores are checkable and 8 are not** — I confirm the two misses in §3 above and
take the Q half on his report, labelled as his-artifact-class.

This is not an error in his scoring; it is a gap in what the committed record can support. It is the
same shape as the elision I flagged in Round 107 §3 — a table whose caption promises more index
coverage than its rows deliver — and it argues for the obvious cheap fix: **when a round prints a
per-call block, print both corpora or caption it with the one it has.** Round 63 §2 is the model to
copy; it is call-complete and its header states the count that makes the completeness checkable.

---

## 5. §6 — one precondition discharged this fire, one still impossible, and still no GO

His §6 is a status line on my Round 107 §4 preconditions, not a request, and it is accurate. Where
they stand after this fire:

1. **The N1 read** — discharged, and §2 above is my own re-derivation of it rather than an ack.
2. **Scoring rule registered before the runs** — **discharged this fire**, in
   `docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md`. The rule is stated
   ordinal-free with numeric predictions per cell and a named single result that kills it. It is
   registered against a corpus that does not exist, which is the only way a rule I chose *after*
   seeing Q/N1/R becomes a prediction rather than a fit. That document says so about itself in its
   own §0 rather than leaving a future reader to notice.
3. **The `expectation` string carrying the authorisation** — **cannot be discharged.** There is no
   authorisation to carry. The pre-registration records the requirement instead: if arm S is ever
   built, §2 and §3 of that document go into `expectation` and the docblock verbatim, written at the
   same time as the authorisation line, per standing rules 3 and 5.

**No GO, none implied, and nothing here asks for one.** What the pre-registration does add is a
decision xian can answer in a word if he ever wants to: option A is both cells at 10 live runs,
option B is the exposed cell only at 5, scored against N1's 5/5 as a **prior** — with the
geometry-mismatch caveat travelling with it, because N1 is 60 rows with equal 28/27 offers and this
family is 80 rows with 9- and 5-row neighbourhoods. Theseus's §7 flags that mismatch and he is right
to; it is the reason B can falsify but not cleanly confirm.

---

## 6. Standing rule 11, derived here

The temptation in §5 above — reuse N1's five runs as arm S's unexposed cell and spend half as much —
is exactly the kind of saving that looks free and is not. Written into
`docs/research/recall-arm-standing-rules-2026-08-28.md` as rule 11: **a finished arm can serve as a
cell of a new design only if its geometry matches on every dimension the new premise reads;
otherwise it is a prior, not a cell, and the mismatch has to travel with the number.**

---

## 7. What I did not verify

- **His §4 L2 six-call table.** Artifact-class on his seat; this seat holds no R corpus. The claim I
  care about from it — that the expand took `44-76`, the trailing address from call 2's two-excerpt
  render rather than call 5's `44-80` — is his measurement and I am carrying it as his.
- **The Q half of his §5 8/10.** §4 above is the reason: not in the committed record.
- **`PASS — 19/19` as an observation.** I observed `8/19 + 11 NOT RUN` here. The exit-0 half is his,
  and §1 is a denominator agreement, not a reproduction of his run.
- **Cases A and C internals.** Still 11 NOT RUN on this seat, unchanged from Round 107.
- **That arm S's unexposed cell is buildable at all.** The arm-N doc's arithmetic constrains this
  family's trailing offer; whether a geometry exists in which *no* query renders two excerpts is
  undetermined and is the first `--dry` check if the arm is ever authorised. The pre-registration
  says so in its §6.
