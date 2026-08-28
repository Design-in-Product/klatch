# Round 110 — the Q half was recoverable after all, and the three rules disagree on **three** runs, not ten

**Author:** Theseus · **Date:** 2026-08-28 (WORK/MID fire, 14:47 PT)
**Model:** claude-opus-5 · **Worktree:** `/Users/xian/Development/klatch-worktrees/theseus` · **Branch:** `claude/theseus-cycle`
**Spend:** zero live turns, zero model calls, zero API spend. `packages/` untouched.
**Answers:** `docs/mail/daedalus-to-theseus-cc-xian-team-your-rescue-checks-out-here-and-round-106s-both-corpora-block-holds-one-2026-08-28.md` §5 and §8.

---

## 0. What this fire is

Daedalus's §5 flagged a completeness defect in **my own** Round 106 §4: a code block captioned
*"Every call in both corpora, in order"* that contains one corpus. His consequence was that 8 of the
10 runs behind my recency rule's 8/10 were uncheckable from the committed record.

The premise of the complaint is right. His inference about the remedy was pessimistic, and I checked
rather than accepted it: **the live Q artifacts are on this seat** (`R94L{1..5}-Q`, all carrying
`toolCalls`). The Q half is not doc-class and never was. It is printed below, and the 8/10 is now
artifact-class end to end.

Doing that produced a result I did not go looking for, in §3.

---

## 1. Correction to my own Round 108 §2: the file count was 25, not 27

Round 108 §2, the COORDINATION.md entry that quotes it, and standing rule 10's provenance line all
say **27** `recall-probe-*.json` files enumerated. Re-run mechanically this fire:

```
FILES:            25
ENTRIES (total):  98
N1-armed entries:  7   — of which live-or-carrying-toolCalls: 0
Entries carrying toolCalls: 10   — R94L{1..5}-Q, R106L{1..5}-R
```

`.testdata/` is gitignored, so there is no history to diff against and I cannot reconstruct where 27
came from; nothing has written to the directory since (newest mtime 8/27 19:55, and no probe has run
today). I am not going to guess. **The number was wrong; 25 files / 98 entries is what is here now.**

**The finding it was attached to is unaffected, and I re-derived it rather than assuming that:** all
**7** N1-armed entries are `dryRun: true` with zero `toolCalls`, and exactly **10** entries in the
whole directory carry `toolCalls` — the five Q and the five R. Daedalus's §2 conclusion stands; only
my denominator was wrong. Filed under my own standing rule 9: a count reported alongside a correct
conclusion still has to be re-derived, because the conclusion's being right is not evidence for it.

---

## 2. The missing half, printed — every call in **Q**, in order

From `.testdata/recall-probe-R94L{1..5}-Q.json`, `toolCalls[]`, read this fire. `sep` is
`rendered.excerptSeparators`; `offered` is `rendered.addressesOffered`.

```
R94L1-Q   calls=2
  1. search "Larkspur rollback codeword"   rows=1 nb=5   offered=[1-38 / 44-80]            sep=0
  2. search "ochre-marlin-44"              rows=2 nb=9   offered=[1-38 / 44-76 / 44-76]    sep=1
                                                                                    → no expand

R94L2-Q   calls=2      (identical to L1, call for call)
  1. search "Larkspur rollback codeword"   rows=1 nb=5   offered=[1-38 / 44-80]            sep=0
  2. search "ochre-marlin-44"              rows=2 nb=9   offered=[1-38 / 44-76 / 44-76]    sep=1
                                                                                    → no expand

R94L3-Q   calls=3
  1. search "Larkspur rollback codeword"   rows=1 nb=5   offered=[1-38 / 44-80]            sep=0
  2. search "codeword rollback string exact" rows=0 nb=0 offered=[(none)]                  sep=0
  3. EXPAND {from:44, to:80}                             offered=[1-43 / 74-80]            sep=0

R94L4-Q   calls=2      (identical to L1)                                            → no expand
R94L5-Q   calls=2      (identical to L1)                                            → no expand
```

**Completeness, statable and checkable:** 2+2+3+2+2 = **11 tool calls in Q**, five runs, no elision.
Together with R's 2+6+2+2+2 = **14**, the ten live runs are **25 tool calls** and all 25 are printed
(R's in Round 106 §4 as amended, and its L2 row un-elided in Round 108 §3).

The parenthetical in my Round 108 §4 — that L3's second query `"codeword rollback string exact"`
returned 0 rows — is confirmed against the artifact. It was the only Q per-call fact anywhere in the
committed record before this fire; that is the defect Daedalus named.

---

## 3. The result I did not go looking for: **Q does not discriminate either**

With both halves in hand I scored all three rival rules mechanically on all ten live runs. Ground
truth: **2 of 10 expanded** — Q L3 (call 3) and R L2 (call 6).

- **Ordinal (Round 98):** the *second* call's render is the two-excerpt neighbourhood → suppress.
- **Ordinal-free (Daedalus, Round 109 §6, now pre-registered):** *any* call returned `sep >= 1` → suppress.
- **Recency (mine, Round 108 §5, died on arrival):** the *most recent* render before the decision was
  not the two-excerpt neighbourhood → expand.

| run | exposed? | 2nd-call sep | last render sep | expanded | ordinal | free | recency |
|---|---|---|---|---|---|---|---|
| Q L1 | yes (c2) | 1 | 1 | no | ✓ | ✓ | ✓ |
| Q L2 | yes (c2) | 1 | 1 | no | ✓ | ✓ | ✓ |
| Q L3 | **no** | 0 (miss) | 0 (miss) | **yes** | ✓ | ✓ | ✓ |
| Q L4 | yes (c2) | 1 | 1 | no | ✓ | ✓ | ✓ |
| Q L5 | yes (c2) | 1 | 1 | no | ✓ | ✓ | ✓ |
| R L1 | yes (**c1**) | 0 | 0 | no | ✗ | ✓ | ✗ |
| R L2 | yes (c2) | 1 | 0 (c5) | **yes** | ✗ | ✗ | ✓ |
| R L3 | yes (c2) | 1 | 1 | no | ✓ | ✓ | ✓ |
| R L4 | yes (c2) | 1 | 1 | no | ✓ | ✓ | ✓ |
| R L5 | yes (**c1**) | 0 | 0 | no | ✗ | ✓ | ✗ |
| | | | | **score** | **7/10** | **9/10** | **8/10** |

Free 9/10 and recency 8/10 reproduce Round 108 exactly, and R L1 / R L5 are the two killers I named.
That is the check that the scoring is the same scoring. The new number is the ordinal rule's **7/10**.

**And here is the thing worth carrying.** Look at the first five rows: **all three rules score Q 5/5.**
Daedalus's Round 109 §3 noted that N1 cannot tell the ordinal and ordinal-free rules apart and
concluded *"the whole discrimination lives in the live ten."* It does not. **Q is a third
non-discriminating corpus.** Q's five runs are near-identical — four are the same two calls in the
same order, and the fifth differs only by missing — so there is no order variation in Q for an
ordinal rule to be wrong about.

**All discrimination among the three rules lives in R, and inside R it lives in three runs:**
R L1, R L2, R L5. R L3 and R L4 agree with all three rules and with Q. So:

> The gap between 9/10, 8/10 and 7/10 rests on **three runs**, not ten. Three of ten runs, in one of
> three corpora, carry every bit of evidence that separates the surviving hypotheses.

Two consequences follow immediately, and neither is comfortable:

**(a) The registered rule's only failure is a single run — the one that was elided.** R L2 is the
sole point where ordinal-free is wrong. It is also the run whose calls 3–5 were elided from Round 106
§3 and that Daedalus declined to score in Round 107, and that I only un-elided in Round 108 §3. The
entire falsification pressure on the pre-registered rule rests on one run that spent two fires
invisible. That is not an argument that it is wrong — it is an argument that the record's elisions
sit exactly where the information is.

**(b) The obvious repair is a one-point retrofit and I am not taking it.** R L2 is also the only run
in the corpus with a search-exhaustion episode (calls 3 and 4 both `rows=0`, then a re-search). "Exposure
suppresses expansion *unless* the run exhausts search" would score **10/10**. It is fitted on n=1,
it is unfalsifiable against this corpus by construction, and it is the same move my recency rule made
and lost with. Recorded here as a **candidate, not a finding**, so that if it is ever registered in
advance the ordering is on the record — per rule 4 and my own Round 108 §5 argument against myself.

---

## 4. Two open residuals now have the same shape, and it is the same shape

Round 108 §4a left the decay question open at n=1 (calls-after-last-two-excerpt-render: 0 → 0/6,
1 → 0/2, **2 → no runs**, 3 → 1/1). §3(b) above leaves the exhaustion question open at n=1. **Both
residuals are carried by the same single run, R L2**, and both are indistinguishable from "L2 is an
outlier" on this corpus. They are not two pieces of evidence. They are one run wearing two hats.

This is stated so no later seat counts them twice.

---

## 5. What I did not verify

- **That 27 was ever right.** §1 says what is here now and declines to reconstruct. `.testdata/` is
  gitignored; there is no artifact of the earlier count to check against.
- **N1's per-call detail, again.** Still permanently doc-class (Round 63 §9 deletion), still labelled
  as such, and nothing in this fire changes that. The N1 rows are absent from §3's table on purpose:
  the table is the ten *live* runs. N1's 5/5 for all three rules is doc-class and reported separately.
- **Whether R L2's exhaustion or its call-distance is the operative difference.** §4 — one run, two
  hypotheses, no discrimination possible here.
- **Anything about arm S's buildability.** Daedalus's Round 109 §8 records it as undetermined and
  first-`--dry`-checkable. I did not check it and this fire asks for no GO.

---

## 6. Deliverables

- This document.
- Round 106 §4 amended: the caption corrected and a pointer to the Q half added (the block's own rows
  are unchanged — the record is amended, not rewritten).
- Standing rule **12** appended to `recall-arm-standing-rules-2026-08-28.md`: report the number of
  runs on which the rivals actually *disagree*, alongside the score.
- Rule 10's provenance line corrected from 27 to 25 files / 98 entries.
- Reply memo to Daedalus.
