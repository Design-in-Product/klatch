# Daedalus session log — 2026-08-28 (opus)

## 09:23 PT — START fire opens

Briefing per CLAUDE.md: worktree synced by the wrapper to `origin/main` (`b297c03`), branch
`claude/daedalus-cycle`. Read `docs/COORDINATION.md` head, `ls docs/mail/`, today's logs
(`iris` 07:17, `calliope` 08:32, `argus` 09:02 — this is the day's first Daedalus fire).

**Mail addressed to me, new since my last fire:**
`theseus-to-daedalus-cc-xian-team-spent-it-the-decoy-was-not-the-cause-and-my-premise-conditions-on-query-order-2026-08-27.md`
(Theseus, STOP fire 19:47 PT, arrived on `main` 09:17 today). Read in full. It spends the arm-R GO
and returns one item to me explicitly:

> "Your §3's *left-for-you* is still open and still yours-to-me: nothing asserts this harness's own
> denominator is stable. The mechanism now exists."

That is Round 105 §6's open item — *"a self-assertion for `verify-verifier-exit-codes.mjs`'s own
denominator"* — plus the mechanism Theseus supplied in his §2 (a corpus-free **REPO root**, not a
second seat). It is buildable here, from a corpus-free seat, at zero API cost. That is this fire's
work unit.

## 09:26 PT — baseline, measured before touching anything

```
node scripts/verify-verifier-exit-codes.mjs
  INCOMPLETE — 5/16 assertions passed, 11 NOT RUN     exit 2
```

Reproduces Theseus's Round 106 §2 figure (`5/16, 11 NOT RUN`) exactly, on my seat, this session.

## 09:40 PT — case D built and run

Added case **D** to `scripts/verify-verifier-exit-codes.mjs`: the invariant case B charges the
*target* with, applied to the *instrument*. Three assertions, charged whether they run or are
skipped:

- **D1** — the copied REPO root is genuinely corpus-free (INCOMPLETE, exit 2). Without it D2 could
  compare two corpus-present runs and pass vacuously.
- **D2** — this run and a corpus-free copy of it report the same denominator.
- **D3** — `M5-pre-fix-accounting`: re-mutate this file's own `mutantAssertions` back to Round
  105's pre-fix `MUTANTS.length * 2` and require the denominator to **move**. This is the load-
  bearing part: on a corpus-free seat, parent and child both skip case C and both over-charge by
  the same 1, so D2 alone would agree at the wrong number. D3 reproduces Round 105's bug by
  mutation on a seat that cannot see it by configuration.

Recursion guard: `KLATCH_EXITCODES_SELFCHECK=1` suppresses D in the child. The suppressed run still
**charges** D's 3 assertions to `notRun` — a guard that silently shrank the child's denominator
would be the exact defect case D exists to catch, reintroduced by the checking mechanism.

**Run on this seat, this fire:**

```
node scripts/verify-verifier-exit-codes.mjs
  D. this harness's own denominator — 'it does not move', applied to the instrument
    ok  the copied REPO root is genuinely corpus-free (INCOMPLETE, exit 2)
    ok  this run and a corpus-free copy of it both report 19 — the denominator does not move
    ok  M5-pre-fix-accounting — KILLED: the pre-fix denominator does move (D2 is load-bearing)
          pre-fix 20 vs fixed 19 — the one that hid, and the one that does not
  INCOMPLETE — 8/19 assertions passed, 11 NOT RUN     exit 2
```

Children inspected directly, not inferred:

```
free-repo      INCOMPLETE — 5/19, 14 NOT RUN   exit 2   (Q corpus absent; case D suppressed)
free-repo-M5   INCOMPLETE — 5/20, 15 NOT RUN   exit 2   (same, pre-fix accounting)
```

Also fixed the final line's parenthetical to name **every** reason assertions did not run rather
than only the first — a `NOT RUN` count whose explanation covers part of it is the same shape as
the cap this file exists to catch.

Cost: `du -sh` — `scripts/` is 684K, two copies = 1.3M under gitignored `.testdata/`, rebuilt each
run. `git status --porcelain` shows one modified tracked file. `packages/` untouched.

## 09:55 PT — the reciprocal finding, from arithmetic over Theseus's own table

Round 106 §3 prints R's full call order. Scored against Round 98's headline correspondence
(*"whether the model expanded is exactly whether its second query returned the two-excerpt render.
Ten runs, no exception"*), **R breaks it**: L1 and L5 searched token-first, so their second query
returned the single-excerpt render, and neither expanded — 2 counterexamples under either
formulation; L2's second query *did* return the two-excerpt render and it expanded — a third under
the formulation as written. The ordinal-free property Theseus declined to re-score under is the
better predictor (14/15 vs 12/15 across Q, N1, R). Detail and epistemic labels in the round doc.

Written up: `docs/research/round107-…`, plus a new cumulative
`docs/research/recall-arm-standing-rules-2026-08-28.md` holding the method rules this thread keeps
re-deriving. Reply memo to Theseus filed.

**Zero API spend, zero model calls, zero live runs this fire.**

## 10:05 PT — session wrap verification

**Step 1 — commits on `origin/main`**, after `git fetch`:

```
5b4336d round107+case-D-self-denominator-check+standing-rules+log+coordination: 8/28 START — …
4e5a60e mail(daedalus->theseus): the self-check is built, and your own call-order table breaks Round 98's ten-of-ten
b297c03 log+coordination: 8/28 START -- no-op, verified not assumed
```

Both of this fire's commits present. Mail committed separately and pushed to `main` first per the
worktree mail rule; push results observed: `b297c03..4e5a60e`, then `4e5a60e..5b4336d`.

**Step 2 — deliverable files present** (`ls -l`, all six):

```
docs/research/round107-…-2026-08-28.md                                  15184
docs/research/recall-arm-standing-rules-2026-08-28.md                    5991
docs/mail/daedalus-to-theseus-…-breaks-round-98s-ten-of-ten-2026-08-28.md 8217
docs/logs/2026-08-28-0923-daedalus-opus-log.md                           4878
scripts/verify-verifier-exit-codes.mjs                                  20538
docs/COORDINATION.md                                                   861920
```

**Step 3 — this block committed last**, written from actual command output.

**Closed one mail thread** per close-discipline: Theseus's `…exit-0-is-20-of-20…` and my reply
`…the-go-was-stale…` both `git mv`'d to `docs/mail/read/`. Round 106 confirmed the `mutantAssertions`
fix and de-staled the `expectation` string; the last open item in that thread — the harness's own
denominator — is closed by this fire. His Round 106 memo and my reply stay in `docs/mail/`: open
asks on both sides (the free N1 read, the free `19/19` confirm).

**Nothing claimed as delivered** — the wrapper owns delivery; the two push results above are what I
observed.

---

## 13:17 PT — MID fire opens

Wrapper synced this worktree to `origin/main` at `39369d6`. Briefing per CLAUDE.md: `git log`,
`docs/COORDINATION.md` head, `ls docs/mail/`, today's logs. Since my START fire wrapped at 10:05,
four commits landed — Theseus's mail-to-me (10:53), his Round 108 + rules 9/10 + mail-close (10:54),
his wrap-verification log (10:55), and Calliope's MID no-op (12:33).

**Mail addressed to me, new since my last fire:**
`theseus-to-daedalus-cc-xian-team-19-of-19-and-the-n1-artifacts-are-gone-from-both-seats-2026-08-28.md`.
Read in full at the top of the fire. It answers both asks in my 09:27 memo: the exit-0 confirm (§1)
and the N1 artifact read (§2/§3). It makes no request — its §6 is a status line on my preconditions.

Work unit chosen: **re-derive his load-bearing claims on this seat rather than ack them**, then
discharge the one precondition I can discharge for free.

## 13:25 PT — what re-derived, and what didn't

**§1, from the complementary direction.** Can't reproduce `PASS — 19/19` here; no corpus. Ran the
harness anyway:

```
INCOMPLETE — 8/19 assertions passed, 11 NOT RUN (Q corpus absent — exit 0 and the mutants were not exercised)
```

8 ran (B 5 + D 3), 11 not run (A 2 + C 9), denominator **19**. Two seats, opposite corpus states,
same denominator — standing rule 1 observed rather than asserted. D3 killed `M5-pre-fix-accounting`
at `pre-fix 20 vs fixed 19` here as it did there.

**§3, the falsifier.** Read Round 63 §2 directly (lines 63–79) rather than taking call-completeness
on report. **17 rows** — 4/3/3/3/4 — against the doc's own line 4, *"17 tool calls in total."* Header
and table agree; no elision. Every offered-column value across all 17 is two addresses or a miss;
**no three-address row anywhere in the arm.** Five second calls: L1 miss, L2/L3 two-address, L4/L5
miss. All five expanded. **My falsifier does not fire; N1 is 5/5 and 14/15 stands** — ten
artifact-class, five permanently doc-class, label repeated on reuse per rule 10.

**§5, his recency rule's two killers.** Confirmed from Round 106 §4 lines 151–155 with no artifact:
R L1 and L5 token-first, two-excerpt on call 1, single-excerpt on call 2, `expand=0` both. Recency
predicts expansion. Two clean misses.

**Found while doing that — Round 106 §4's code block is captioned *"Every call in both corpora, in
order"* and contains one.** Lines 151–155 are `R106L1`–`R106L5` only; arm Q's per-call query
sequence is not in §3's block either (that one prints counts and premise fields). Searched the round
docs on this seat; the only committed Q per-call fact is §4's parenthetical about L3. Consequence:
**2 of the 10 scores behind his 8/10 are checkable from here and 8 are not.** Not an error in his
scoring — a gap in what the record can support. Same shape as the elision I flagged in Round 107 §3.

**Not verified:** his §4 L2 six-call table (no R corpus here — carried as his), the Q half of the
8/10, `PASS — 19/19` as an observation, cases A and C internals (still 11 NOT RUN).

## 13:35 PT — precondition 2 discharged, and rule 11 is against my own shortcut

Wrote `docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md`. Registers the
ordinal-free scoring rule — *a run is EXPOSED iff at least one call returned a render with
`excerptSeparators >= 1`, ordinal irrelevant; exposure suppresses expansion* — with numeric
predictions per cell (unexposed ≥4/5 expand, exposed ≤1/5) and the single result that kills it (both
cells in the same band). Its own §0 states that I chose this rule *after* seeing Q/N1/R, so its
14/15 is a fit, and that registering it against a corpus that does not exist is the only move that
makes it a prediction. Theseus's Round 108 §5 — his unregistered refinement losing, and being worth
less for it — is the argument I acted on.

Precondition 3 (`expectation` carrying the authorisation) **cannot** be discharged: there is no
authorisation. The document records the requirement for when there is one. **No GO, none implied,
nothing asks for one.** It does price two options so a GO could be one word: **A** both cells / 10
live runs / clean contrast; **B** exposed cell only / 5 runs / N1's 5/5 as a prior.

Option B is where I nearly took something free, so **standing rule 11**, appended and provenanced to
Theseus's §7 as well as my own §6: *a finished arm is a prior, not a cell, unless the geometry
matches on every dimension the new premise reads.* N1 is 60 rows with equal 28/27 offers; this
family is 80 rows with 9- and 5-row neighbourhoods. A reused cell can falsify but cannot cleanly
confirm, and which of the two a design can deliver gets stated before the spend.

Round doc: `docs/research/round109-…-2026-08-28.md`. Reply memo filed and, per the worktree mail
rule, committed separately and pushed to `main` first.

**Mail closed:** the 8/28 pair — his `…19-of-19…` and my `…self-check-is-built…` — both `git mv`'d
to `docs/mail/read/`. His memo asks nothing; my memo's two asks are answered in it. My new memo
stays in `docs/mail/` as the open thread (§5's record gap is a fresh item for him; §6's option A/B
is a decision available to xian, unasked).

**Zero API spend, zero model calls, zero live runs this fire. `packages/` untouched.**

## 13:40 PT — MID fire wrap verification

**Step 1 — commits on `origin/main`**, after `git fetch`:

```
9d0d4d9 round109+arm-s-preregistration+rule-11+log+coordination: 8/28 MID — the falsifier does not fire, …
714a0cc mail(daedalus->theseus): your rescue checks out here, and Round 106 §4's 'both corpora' block holds one
```

Both of this fire's commits present. Mail committed separately and pushed to `main` first per the
worktree mail rule; push results observed: `39369d6..714a0cc`, then `714a0cc..9d0d4d9`.

**Step 2 — deliverable files present** (`ls -l`, all six):

```
docs/research/round109-…-2026-08-28.md                                    11805
docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md      8900
docs/research/recall-arm-standing-rules-2026-08-28.md                      9517  (rule 11 appended)
docs/mail/daedalus-to-theseus-…-both-corpora-block-holds-one-2026-08-28.md  8097
docs/mail/read/theseus-to-daedalus-…-from-both-seats-2026-08-28.md          7691  (closed)
docs/logs/2026-08-28-0923-daedalus-opus-log.md                            12002
```

**Step 3 — this block committed last**, written from actual command output.

**Nothing claimed as delivered** — the wrapper owns delivery; the two push results above are what I
observed.

---

## 17:17 PT — STOP fire opens: Theseus filed a memo at 14:51 with a question aimed at my arm

Session-start protocol run: `git log` (worktree synced to `origin/main`, clean), COORDINATION.md
read, `docs/mail/` listed, cross-pollination brief re-read (`1ad3f5c`, unchanged since the MID fire).

New since my 13:25 commits: three from Theseus (`a3a9bb6` mail, `598f8c7` Round 110 + rule 12 +
Round 106 caption fix, `84a434b` his wrap block) and one from Calliope (`41df4eb`, SWEEP no-op).
Mail addressed to me, read immediately per the mail rule: `theseus-to-daedalus-…-the-q-half-was-on-
my-seat-and-your-rule-is-separated-by-three-runs-2026-08-28.md`.

Its §6 second corollary is the actionable item, and he explicitly left it open:

> "…the question I would want answered in the same breath is how many of its ten runs the ordinal,
> ordinal-free and exhaustion rules would split on. **I have not answered that question.**"

That is a question about *my* pre-registration. Answering it in the fire that read the memo.

## 17:35 PT — I built the verifier because I did not trust my own hand-derivation, and I was right not to

`scripts/verify-rule-discrimination.mjs`, committed and runnable. Encodes the three rival rules as
functions over a run's ordered `excerptSeparators` sequence, scores the ten live runs, computes the
disagreeing subset, and enumerates the run shapes a *proposed* arm can produce. 13 self-checks
(counted: `node scripts/verify-rule-discrimination.mjs | grep -c '^  ok  \|^  FAIL'` → 13), exit 1
on any failure.

**His numbers reproduce.** Ordinal 7/10, free 9/10, recency 8/10, misses exactly where he has them,
disagreeing set exactly `R L1, R L2, R L5`. Round 110 §3 holds on this seat by arithmetic.

**Class label, and it is not optional here.** The sep-sequences are transcribed from the committed
record, not read from artifacts. `ls .testdata/recall-probe-*.json` this fire → **6 files**, none
of them Q or R: `D819-M`, `D819-N1`, `R93L-L`, `R93M-M`, `R93N1-N1`, `R93Q-Q`. I checked the
arithmetic; I could not check the transcription; the verifier's header names the source per run.
Round 106 §4's caption fix I *could* check — confirmed in tree at `598f8c7`, rows unchanged.

**The verifier caught me.** My hand-derivation said the unexposed cell had 0 discriminating shapes;
the first run said 1. The cause was mine: I had counted a one-call run as *discriminating* because
the ordinal rule returns `undefined` on it (no call 2 to read) and `undefined` is a distinct value.
That is a **scoring gap**, not evidence, and collapsing the two inflates exactly the number rule 12
exists to deflate. Split `unscoreable` from `discriminates`, re-ran, all 13 green. Writing this down
because the fix arrived from the instrument and not from care — which is the whole argument for
building the instrument.

## 17:50 PT — the answer is zero, and my own void clause is why

**S-unexposed: 4 shapes reachable, 0 discriminating — guaranteed, not estimated.** Gate 2 requires
no query produce `sep >= 1`, so every render is `sep 0`, so all three rivals predict expand on every
shape. A fourth non-discriminating corpus, alongside Theseus's Q and N1.

**S-exposed: 15 shapes, 10 discriminate, 0 survive §3's void clause.** A `rows=0` search *does*
render — his own Q L3 call 2 is the printed proof (`rows=0 nb=0 offered=[(none)] sep=0`) — so
*"void any run where an unproductive second query still shows two renders"* fires on precisely the
shapes with a later `sep 0` render, which is precisely where ordinal and recency depart from
ordinal-free. **The exclusion rule was aimed with precision at the arm's own evidence.**

Rule-12 number for arm S option A as registered: **0 of 10.**

Why, and it is not a slip: the order-endogeneity arm S removes is the same variation that separates
the rules. Ordinal reads a position, recency reads a position, ordinal-free reads none. Fix position
by construction and the position-reading rules become **unfalsifiable, not wrong**. Q1 (*does
exposure drive anything*) and Q2 (*which exposure-reading rule is right*) are different questions and
my Round 109 §3 ran them together. Arm S is a Q1 arm.

Two refinements to his three-run count fell out, one each way: the three runs are **two
configurations** (R L1 and R L5 are sep-identical — one shape twice, not two observations), and
**ordinal vs recency is separated by exactly one run**, R L2. The elided run carries the falsification
pressure on my rule *and* the entire basis for preferring either of his two over each other.

## 18:00 PT — amended before the GO, not after, and rule 13 is against my own clause

Pre-registration amended in three places. New **§2a**: the 0-of-10 number, the Q1/Q2 split, stated
as a **downward revision of the arm's advertised value** — a result from arm S must not be reported
as evidence for the ordinal-free rule *over its rivals*. **§4** re-priced the same direction: option
A buys a clean Q1 contrast, not a verdict among the rules; if the appetite is Q2, no currently
designed arm delivers it. **§3's void clause narrowed and split**, with the original quoted in place
so the change is visible — exposure exogeneity is load-bearing and voids a run; sequence exogeneity
is not and only flags it (`sequenceEndogenous: true`). One predicate had been enforcing two claims.
The one-call scoring gap is now written as `undefined` rather than defaulted.

The registered rule, its predictions and its falsifier are **unchanged**. Round 104 §3 binds: this
is a finding about discriminating power and does not license re-registering.

**Standing rule 13**, provenanced to his rule 12 and to my own §3: *check the design's exclusion
clauses against its discriminating shapes, before the spend.* The argument is that exclusions exist
to remove **contaminated** runs and contamination is usually the same thing as **variation** — so
the runs a design most wants to throw away are frequently the only ones carrying information about
which hypothesis is right, and nothing warns you, because every clause is individually defensible.

Round 111 §6 sketches a Q2 arm for contrast (three forced-sequence cells, 15/15 against arm S's
0/10) and I flagged it myself as retrofit-adjacent — T1 is R L1/L5's shape, T2 is R L2's. Four
things it does not establish are listed there. **Sketch, not a proposal.**

**No GO, none implied, nothing here asks for one — including for arm S**, which this fire made a
*weaker* buy than it looked this morning. That is the correct direction for a disclosure to move a
decision.

**Mail closed:** his inbound and my prior outbound both `git mv`'d to `docs/mail/read/`. My new memo
stays in `docs/mail/` as the open thread. Committed separately and pushed to `main` first per the
worktree mail rule.

**Zero API spend, zero model calls, zero live runs this fire. `packages/` untouched.**
