# Theseus session log — 2026-08-28 (WORK/MID fire, 14:47 PT)

**Model:** claude-opus-5 · **Worktree:** `/Users/xian/Development/klatch-worktrees/theseus` · **Branch:** `claude/theseus-cycle`
**Spend:** zero live turns, zero model calls, zero API spend. No product code; `packages/` untouched.

---

## 14:47 — Session start: briefing

HEAD verified at `83798a0` (Argus's 8/28 MID no-op log), `git status` clean, branch tracking
`origin/main`. Read `docs/COORDINATION.md` (my section: *available*, Round 108 the last unit) and my
own 10:47 START log. Swept `docs/mail/` — one memo addressed to me, new since my last fire:

- `daedalus-to-theseus-cc-xian-team-your-rescue-checks-out-here-and-round-106s-both-corpora-block-holds-one-2026-08-28.md` (13:17 PT)

Also noted, and *not* mine to action: Round 109 and the arm-S pre-registration were written by
Daedalus at MID (commit `9d0d4d9`, touching his log, not mine). No GO exists for arm S; nothing in
this fire asks for one.

The memo's actionable item is §5 — a completeness defect in **my own** Round 106 §4.

## 14:49 — §5: the defect is real, and the remedy was more available than his memo assumed

Round 106 §4's code block is captioned *"Every call in both corpora, in order"* and contains only R.
Confirmed by reading the block. Daedalus's consequence: 8 of the 10 runs behind my recency-rule 8/10
were uncheckable from the committed record.

Rather than accept the consequence, checked the premise. `ls .testdata/` → **the live Q artifacts are
on this seat**: `recall-probe-R94L{1..5}-Q.json`, all five carrying `toolCalls`. They were in the same
enumeration where I found the N1 files absent last fire; I read past them. **The Q half was never
doc-class.** His "8 of 10 uncheckable" is now 10 of 10 checkable.

## 14:51 — Correction against myself: 25 files, not 27

Re-ran the enumeration mechanically before using it:

```
FILES:            25          (Round 108 §2 and my COORDINATION entry both say 27)
ENTRIES (total):  98
N1-armed entries:  7   — of which live or carrying toolCalls: 0
Entries carrying toolCalls: 10  — R94L{1..5}-Q, R106L{1..5}-R
```

`.testdata/` is gitignored; newest mtime is 8/27 19:55 and no probe has run today, so there is no
history to diff and I cannot reconstruct where 27 came from. **Not guessing.** The number was wrong.

**The finding it was attached to is unaffected — and I re-derived it rather than assuming that:** all
7 N1-armed entries are `dryRun: true` with zero `toolCalls`; exactly 10 entries in the directory carry
`toolCalls`. Daedalus's §2 conclusion stands; only my denominator didn't. This is my own standing
rule 9 landing on me. Rule 10's provenance line corrected in place.

## 14:53 — The Q half, printed

Read from `toolCalls[]` of the five live Q artifacts. All five open with
`"Larkspur rollback codeword"` (rows=1, nb=5, `sep=0`); four then issue `"ochre-marlin-44"`
(rows=2, nb=9, `sep=1`, three addresses) and stop. L3 instead issues a miss
(`"codeword rollback string exact"`, 0 rows) and then **expands `{from:44, to:80}`**.

Counts stated so completeness is checkable: **2+2+3+2+2 = 11 calls in Q**; with R's
2+6+2+2+2 = 14, the ten live runs are **25 calls, all now printed**.

Also discharged Daedalus's §8 first bullet from the artifact: `R106L2` call 6 is
`expand {from: 44, to: 76}` — **call 2's** trailing address, not call 5's `44-80`. He carried it as
mine and wanted it true; it is artifact-class now.

## 14:55 — The result I did not go looking for

With both halves scorable, ran all three rivals across all ten live runs. Ground truth: 2 of 10
expanded (Q L3, R L2).

- ordinal (Round 98): **7/10** — new number
- ordinal-free (Daedalus, now pre-registered): **9/10** — reproduces Round 108
- recency (mine, dead): **8/10** — reproduces Round 108, killed by R L1 and R L5 as recorded

The reproduction of the two known scores is the check that this is the same scoring. Then:

**All three rules score Q 5/5.** Daedalus's Round 109 §3 named N1 as the corpus that cannot separate
the ordinal and ordinal-free rules and concluded *"the whole discrimination lives in the live ten."*
It does not — **Q is a third non-discriminating corpus** (four of five runs are the same two calls in
the same order, so there is no order variation for an ordinal rule to be wrong about), and R L3/R L4
agree with everything too.

**The separation between 9/10, 8/10 and 7/10 rests on three runs: R L1, R L2, R L5.**

And the sharp end: **R L2 is the sole run where the pre-registered rule fails** — and it is the run
elided from Round 106 §3, declined for scoring in Round 107, un-elided only in Round 108 §3. Not an
argument that the rule is wrong; an argument that the record's elisions have twice sat exactly where
the information is.

## 14:57 — The 10/10 retrofit, declined in writing

R L2 is also the only run with a search-exhaustion episode (calls 3 and 4 both 0 rows, then a
re-search). *"Exposure suppresses expansion unless the run exhausts search"* scores **10/10** —
fitted on n=1, unfalsifiable against this corpus by construction, and the same move my recency rule
made and lost with. Filed as a **dated candidate, not a finding** (Round 110 §3b).

Related and recorded so no later seat double-counts: Round 108 §4a's decay residual and this
exhaustion residual are **both carried by R L2**. One run wearing two hats, not two pieces of evidence.

## 14:58 — Deliverables written

- `docs/research/round110-the-q-half-is-recoverable-and-the-rules-disagree-on-three-runs-not-ten-2026-08-28.md`
- Round 106 §4 **amended** — caption corrected, correction block added pointing at Round 110 §2; the
  block's own rows unchanged (the record is amended, not rewritten).
- `docs/research/recall-arm-standing-rules-2026-08-28.md` — **rule 12 appended** (report the runs on
  which rivals *disagree*, next to the score; a non-discriminating corpus is not confirmation; the
  number is usually knowable before the spend — rule 11 asks whether a design can confirm, 12 asks
  whether it can distinguish) and **rule 10's provenance corrected** from 27 to 25 files / 98 entries.
- `docs/mail/theseus-to-daedalus-…-separated-by-three-runs-2026-08-28.md` — reply, committed
  separately and pushed to `main` per the worktree mail discipline.

**No GO requested for arm S, none implied.** Daedalus's precondition 3 remains undischargeable (no
authorisation exists to carry); nothing here changes that.

## 15:00 — Session wrap verification

**Step 1 — commits on `origin/main`** (`git fetch origin`, then `git log origin/main --oneline -3`):

```
(filled in below after the work commit lands — see the block appended at close)
```

**Step 2 — deliverable files confirmed present:** see the `ls` block appended at close.
