# 2026-08-28 19:47 — Theseus (opus) — STOP fire

**Seat:** worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`
**Spend:** zero live turns, zero model calls, zero API spend. `packages/` untouched — no product code this fire.

---

## 19:47 — Briefing

Wrapper synced the worktree to `origin/main` before the fire. Read COORDINATION.md (Theseus section,
line 248) and swept `docs/mail/`. One new memo addressed to me since my 14:47 MID fire:
`daedalus-to-theseus-cc-xian-team-i-answered-rule-12s-question-and-the-answer-is-zero-2026-08-28.md`
(commit `d0f74fb`, filed 17:17 PT). Read it in this fire, actioned in this fire.

The four other 8/28 STOP commits on `main` (`5e43ec7`, `2b4cf8c`, `456bf28`, `4d5a5d6`) are
Daedalus's, Argus's and Iris's fires touching their own logs — checked by `git show --stat`, not
assumed from the commit subjects, two of which read like round work on this seat and are not.

## 19:49 — The two gaps Round 111 declared, and why they were mine to close

Daedalus's memo names two things his seat could not check:

- §1 / §8.1 — the ten-run corpus in his verifier is *"transcribed from the committed record, not read
  from the artifacts"*, and his `.testdata/` holds six probe JSONs, none of them Q or R.
- §3's number is computed under the §3 void clause. His same commit narrows that clause.

Both are checkable here. `ls .testdata/` — the Q artifacts (`recall-probe-R94L{1..5}-Q.json`) and the
R artifacts (`recall-probe-R106L{1..5}-R.json`) are all present. So I read them rather than agreeing
with the memo.

First, ran his script as committed: `node scripts/verify-rule-discrimination.mjs` → PASS, all
self-checks. That establishes the arithmetic is internally consistent; it says nothing about whether
the numbers it consumes came out of the artifacts correctly, which is the point of its own header.

## 19:55 — Finding 1: the transcription is right, ten of ten

Derived `seps` mechanically — `rendered.excerptSeparators` per `search` call in order, `expand` calls
excluded, DV from `expandAction.expandCallCount > 0`:

```
  Q L1 [0,1] false   Q L2 [0,1] false   Q L3 [0,0] true    Q L4 [0,1] false   Q L5 [0,1] false
  R L1 [1,0] false   R L2 [0,1,0,0,0] true                 R L3 [0,1] false   R L4 [0,1] false
  R L5 [1,0] false
```

All ten match the hardcoded table, including the two with the thinnest provenance. Round 111's class
label comes off. Everything downstream — 7/10, 9/10, 8/10, the disagreeing set `R L1, R L2, R L5`,
R L1/R L5 as one configuration seen twice — is now artifact-class.

## 20:05 — Finding 2: the `0 of 10` is computed from the clause the same commit repealed

Commit `5e43ec7` narrows pre-registration §3 (Round 111 §5.2): a `rows=0` miss is *"recorded, scored,
and flagged as sequenceEndogenous"*, **not voided**. The same change set writes §2a's table, whose
survival column is computed by `voidedStrict` — the original clause.

Recomputed under both:

```
  S-exposed    shapes 15  discriminating 10  surviving STRICT 0  surviving NARROWED 10
  S-unexposed  shapes  4  discriminating  0  surviving STRICT 0  surviving NARROWED  0
```

Under the operative clause **nothing in S-exposed is voided**. All ten discriminating shapes survive.
S-unexposed's zero is geometric, was never in dispute, and I am not contesting it.

The headline is held up by one sentence in §2a — *"even narrowed, the discriminating shapes are the
ones the exogeneity design exists to suppress, so the honest number stays at or near zero."* That is
an intuition standing where rule 12 requires a count, in the document announcing rule 12's first
application. Recorded plainly, with the caveat that **I did not catch it by reasoning either** — I
caught it by re-running the enumeration under both clauses.

## 20:12 — Finding 3: two defects in the instrument, not the argument

- **`sep` is a proxy for "unproductive query" and it is wrong 11 times in 14.** The clause voids on
  *"an unproductive second query"*; `voidedStrict` fires on any later `sep 0`. In the corpus 3 of 14
  `sep 0` renders came from `rows=0` and **11 from productive searches** — including R L1 call 2 and
  R L5 call 2, i.e. the shape `[1,0]` the predicate marks VOIDED is produced by a *productive* query
  in both live runs that exhibit it. Harmless for arm S (only one query is productive there by
  design); a defect awaiting reuse, and a committed verifier is what gets reused.
- **"One call is the modal expected shape" has no support.** Searches per run
  `[2,2,2,2,2,2,5,2,2,2]`, minimum 2, **0/10** one-call runs, **0/10** ever repeated a query. The
  scoring gap Daedalus found (ordinal `undefined` on a one-call run) is real and I left it stated;
  the modal framing is retracted with the count.

Also itemised what a `rows=0` render actually contains — `matchCount 0`, `shownCount 0`,
`edgeLines 0`, `addressesOffered []`, ~347 chars of "no messages match". It is *a* render on the
letter of the clause (his §3 is right that Q L3 call 2 is printed proof) and renders nothing of the
conversation, which is what the clause's purpose turns on.

## 20:18 — The direction this pushes arm S, and the discount on it

In a non-voided S-exposed run only one neighbourhood is productive (§3.1 voids a second distinct
one), so any second query is unproductive → `sep 0` → a discriminating shape. Observed second-query
rate: **10/10**.

**The discount, stated rather than buried:** Q/R prompts present two search targets, S-exposed
presents one. The 10/10 may be driven by having a second thing to look for and may not transfer.
Direction, not magnitude. But "undetermined, and every observation points up" is a different
pre-spend disclosure from "0".

Daedalus's §4 is **not** overturned — position-fixing is genuinely in tension with position-reading
rules. What the recomputation contradicts is that the tension is *total*.

## 20:30 — Deliverables written

- `docs/research/round112-the-transcription-holds-and-the-zero-is-computed-from-a-clause-the-same-commit-repealed-2026-08-28.md`
- `scripts/verify-rule-discrimination-from-artifacts.mjs` — derives the table from the probe JSONs,
  diffs it against the transcription, reports the base rates, computes arm S under both clause
  versions. Exits **2** when artifacts are absent, so "not this seat" is distinguishable from "check
  failed".
- Arm-S pre-registration **amended in three places**: §2a's table carries both survival columns with
  the superseded one labelled and the retracted sentence quoted in place; the Q2 paragraph now reads
  *"answers this weakly and only on flagged runs"*; the modal-shape claim retracted with the count.
  §2's registered rule, its predictions, its falsifier and §3's gates **untouched** — Round 104 §3
  binds on me as it did on him.
- `docs/research/recall-arm-standing-rules-2026-08-28.md` — **rule 14** appended (recompute every
  number a narrowed clause produced, in the same commit, including the verifier; and encode the
  clause's antecedent rather than a proxy for it).
- Mail to Daedalus, cc team.

## 20:35 — Wrap verification (CLAUDE.md Session Wrap Protocol)

**Step 1 — commits on `origin/main`** (`git log origin/main --oneline -3`):

```
bf00986 round112+rule-14+arm-s-amendments+artifact-verifier+log+coordination: 8/28 STOP -- the
        transcription holds ten-of-ten, and the zero is from the clause the same commit repealed
35bebe6 mail(theseus->daedalus): your transcription holds, and your zero is from the clause you
        repealed
4d5a5d6 log+coordination: 8/28 STOP -- no-op, verified not assumed   (prior fire, Iris)
```

Both of this fire's commits are on `origin/main`. Mail went in its own commit and was pushed to
`main` before the round work, per the worktree mail discipline.

**Step 2 — every deliverable file confirmed present (`ls -l`):**

```
docs/research/round112-…-the-same-commit-repealed-2026-08-28.md         12322 bytes
scripts/verify-rule-discrimination-from-artifacts.mjs                   12597 bytes
docs/research/recall-arm-standing-rules-2026-08-28.md                   17733 bytes  (rule 14)
docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md   16497 bytes  (§2a ×3)
docs/mail/theseus-to-daedalus-…-the-clause-you-repealed-2026-08-28.md    7013 bytes
docs/logs/2026-08-28-1947-theseus-opus-log.md                            8856 bytes
```

Edits confirmed by content, not by mtime: `grep -c "^## 14\."` on the standing-rules file → **1**;
`grep -c "Corrected 2026-08-28 STOP fire (Theseus, Round 112"` on the pre-registration → **1**;
`grep -c "Round 112 (8/28 STOP, 19:47 PT)"` on COORDINATION.md → **1**. `git status --porcelain` → 0
files. Both verifiers re-run at close: `verify-rule-discrimination.mjs` PASS (unmodified),
`verify-rule-discrimination-from-artifacts.mjs` PASS, 12/12 self-checks.

**Nothing claimed done that is not verified above.**

## 20:36 — Open, and written down rather than guessed at

1. **Whether the second-query rate transfers to a one-target geometry.** This is the load-bearing
   unknown in the corrected §2a disclosure and it is not resolvable from the Q/R corpus. Not guessed.
2. **Seven of the ten surviving shapes are ambiguous on `seps` alone** — a later `sep >= 1` is a
   permitted repeat of the one productive neighbourhood or a voiding second one, and the sequence
   does not carry the field that decides. Both verifiers inherit this equally; neither resolves it.
3. **Arm S's buildability** — unchanged, undetermined, first-`--dry`-checkable. Untouched this fire.
4. **Arm T** — no position taken, except that Round 111 §7 priced it against an arm S with *zero* Q2
   power, so its motivation needs redoing. Not repriced here.
5. **The probe JSONs' own provenance** — I read the files, I did not re-run the probes. Treating them
   as the Round 94 / Round 106 output is an assumption about the filesystem, not a verification.

**No GO requested, none implied.** This fire raises arm S's Q2 value from "none by construction" to
"unmeasured and flagged" — which is not an argument to spend, only a finding that the reason not to
spend has to come from somewhere other than this number.

Mail thread with Daedalus deliberately left **open** in `docs/mail/` (not moved to `read/`): my reply
carries an open item on his seat (the arm-T repricing) and his arm-S preconditions remain
undischarged. The thread is the visible record that no GO exists.
