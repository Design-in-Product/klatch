# Theseus session log — 2026-08-26 (opus)

## 10:47 PT — START fire

Session-start protocol: worktree synced by wrapper to `ce27cde`, branch `claude/theseus-cycle`,
`git status` clean. Read `docs/COORDINATION.md` (Theseus section) and `ls docs/mail/`.

**Mail:** one new memo addressed to me —
`daedalus-to-theseus-cc-xian-team-run-it-and-one-token-in-the-restate-line-decides-whether-it-measures-anything-2026-08-26.md`
(Daedalus, 09:19 PT). Read in full. Answers my Round 94 §7 GO-request for the decoy arm: yes,
build it, with one hard constraint (`restateUser` must keep the literal `ochre-marlin-44`), and one
item sequenced **ahead** of the arm — §4, transcribe Round 94's reply texts into the doc before
`.testdata/` disappears, because he can't see my worktree's copies from his sandbox.

Acted on it in this fire. Everything below is the same fire.

---

### The clocked item: R94 artifacts survive, transcription done

`ls -la .testdata/` → all five `recall-probe-R94L{1..5}-Q.json` present, written 2026-08-25
19:48–19:50, plus `recall-probe-R94N1-N1.json`. Daedalus's clock did not fire.

Transcribed via a script reading `toolCalls[]`, `reply`, `expandAction`, `precondition`,
`structural`, `tap`. Went beyond the replies to the **full rendered tool output** — §6.3 of the
round doc — which is what surfaced both findings below.

### Finding 1 — the decoy is in every prompt, and the run that had it expanded anyway

`precondition.promptHoldsToken: true` on all five runs; `layer6` identical at 3785 chars, 20
messages. `CARRIED_CONTEXT_MAX_MESSAGES = 20` over an 80-row transcript carries rows **61-80**,
which includes the restate pair at 79-80. Arm Q's own comment at `:956` says exactly that and both
Daedalus and I read past it, because we were looking at the marking.

So all five runs had the naming instruction in front of them before the first tool call. **R94L3
had it and expanded anyway, and held the restriction.** Round 94 §4's "the decoy suppresses" has to
be restated as **retrieval framing, not presence** — what separates 4 from 1 is whether the decoy
came back as the ▸-marked hit for the model's own targeted query.

**Near-miss worth recording.** Before checking `promptHoldsToken` I had traced L3's reply
(reproducing the "Tuesday revert" naming instruction) against its three tool calls — call 1
neighbourhood 39-43, call 2 zero matches, call 3 rendered 44-73 with rows 79-80 behind an untaken
`from: 74` continuation — and concluded it was a fabrication. Wrote most of a finding to that
effect. It was wrong: the rows were in the carried window. This is the verify-before-asserting rule
paying for itself on a claim I was about to make *from artifacts I was reading to be careful*.

### Finding 2 — the second excerpt is flush-terminal

`structural.predictedFlushEdges: 1`, `predictedEdges[1].trailing: null`. The 77-80 excerpt runs to
the last row, so no "later message(s)" edge line follows it — nothing signals more to read. And
`restateUser` opens *"Last thing before the kickoff."* The neighbourhood reads as end-of-conversation
structurally and lexically, and all four no-expand runs called it *"one related note from the same
thread."*

Cannot be removed without moving geometry (the flush edge exists because seq 79 is a match, which
Daedalus's constraint requires). So arm R holds it constant — fine for the contrast, but it means
the **registered null must name two survivors**, not one: Q's 80-row length *and* the flush-terminal
excerpt. Round 95 §5 names only the length. Registered both.

### Correction to my own draft — the prompt-fact gate already exists

Round 95 §5 and my draft both treated "assert `promptHoldsToken: true`" as a check to add. It is
already a hard gate (`:1714`, `:1718`, `:1724`, `:1727`, read this session; `throw` on mismatch).
Q passed it. The defect is in the **doc**: Round 94 §6 transcribed the marking line and dropped the
fact line — the one line that would have made Finding 1 visible five days ago.

### Arm R built and dry-verified

Added `R` to `scripts/probe-recall-tool.mjs` between arms Q and G (~140 lines, mostly
pre-registration docblock). Changed bytes against Q: `restateUser` and `restateAck` only. Token
kept (Daedalus's §2). `restateAck` stripped as well as `restateUser` (his last paragraph). *"Last
thing before the kickoff"* deliberately retained so Finding 2's lexical signal is held constant.

```
node --check scripts/probe-recall-tool.mjs                       → SYNTAX OK
node scripts/probe-scratch-server.mjs --seconds=600              → READY on :3001, scratch DB
npx tsx scripts/probe-recall-tool.mjs R96DRY Q R --dry           → exit 0, 0 model calls
```

Q and R print identical structural blocks: fact `[41,79]`, marking `[59]`, min distance 18
(radius 2), `a neighbourhood CAN carry it: false`, neighbourhood `[39,40,41,42,43,77,78,79,80]`,
totals `80/80`, 2 excerpts, excerpt 1 `39-43` leading `1-38` (38) / trailing `44-76` (33), excerpt 2
`77-80` leading `44-76` / **trailing none (flush)**, 3 edge lines / 1 flush / 104 reachable / 0
unreachable, single-match hypothetical leading `1-38` trailing `44-80`. Restriction at trailing
**+15** in both.

Both gates on both arms: `prompt contains the fact: true (want true)`,
`prompt contains the marking: false (want false)`, `prompt names the recall tool: true`.

Only differing number: carried context **3815 (Q) → 3746 (R)**. Q's restate pair is 149 + 49 = 198
chars, R's 123 + 6 = 129, difference **69**; observed difference **69**. Byte-exact — nothing else
in the assembled prompt moved.

(Both from the same run, same-length holder names. Not comparable to R94's 3785, which used a
one-char-shorter tag: 3815 − 3785 = 30, and the tag appears 30 times in a 20-message window — 20
conversation labels + 10 assistant speaker names.)

**Arm R has no GO and is not queued.** Round 94's spend was authorized for the *distance* arm; I
don't think that carries. Ask is in the memo §5.

### Housekeeping

Two files I committed on 8/25 ended with literal `</content>` / `</invoke>` lines — leaked
tool-call artifacts. Confirmed with `od -c` on the tail, removed from both:
`docs/research/round94-…-2026-08-25.md` and
`docs/mail/theseus-to-daedalus-…-the-arm-ran-…-2026-08-25.md`.
`grep -rln "^</invoke>" docs/` → those two were the only hits repo-wide, both mine, same fire.

---

### Wrap verification

```
$ git status --short          (before commit)
 M docs/mail/theseus-to-daedalus-cc-xian-team-the-arm-ran-…-2026-08-25.md
 M docs/research/round94-the-arm-hit-its-predicted-number-through-the-wrong-mechanism-2026-08-25.md
 M scripts/probe-recall-tool.mjs
?? docs/research/round96-the-decoy-was-in-every-prompt-and-the-run-that-had-it-expanded-anyway-2026-08-26.md
```

**No product code.** `packages/` untouched this fire.

**Step 1 — commit on origin/main.** `git push origin HEAD:main` →
`ce27cde..0ea04b6  HEAD -> main`. Then `git fetch origin && git log origin/main --oneline -3`:

```
0ea04b6 round96+armR+mail+log+coordination: 8/26 START -- the decoy was in every prompt, and the run that had it expanded anyway
ce27cde log: 8/26 START -- wrap verification for round95 (commit on origin/main, files in tree)
b5d9a52 round95+mail+log+coordination: 8/26 START -- run the decoy arm, and one token in the restate line decides whether it measures anything
```

**Step 2 — each deliverable exists.** `ls` on all five returns:

```
docs/COORDINATION.md
docs/logs/2026-08-26-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-xian-team-the-decoy-was-in-every-prompt-and-the-arm-is-built-2026-08-26.md
docs/research/round96-the-decoy-was-in-every-prompt-and-the-run-that-had-it-expanded-anyway-2026-08-26.md
scripts/probe-recall-tool.mjs
```

**Step 3 — this log.** Committed after Steps 1 and 2, in a follow-up commit.

### Open, carried to the next fire

- **Arm R needs xian's GO** for 5 live opus runs. Ask is in the memo §5. Nothing else blocks it —
  built, gated, pre-registered in git ahead of any data.
- **One thing I'd want argued before the spend:** whether Daedalus agrees the flush-terminal
  excerpt belongs in the registered null. If he doesn't, better to hear it before five turns land
  on it than after. Flagged as such in the memo §7.
- **N1 is still Round 63's**, now six days old, unverified against today's model.

---

## 14:47 PT — WORK fire

Session-start protocol: worktree synced by wrapper to `63f3b32`, branch `claude/theseus-cycle`,
`git status` clean. `docs/COORDINATION.md` Theseus section and `ls docs/mail/` both read. Since the
START fire, ten commits landed from Daedalus/Argus/Calliope; none touch `scripts/` or `packages/`.

**Mail:** one new memo addressed to me —
`daedalus-to-theseus-cc-xian-team-no-to-the-flush-edge-because-n1-has-it-too-and-n1-expanded-5-of-5-2026-08-26.md`
(13:29 PT). Read in full. It answers my Round 96 §7 ask with a **no** on the flush-terminal
survivor, and — more usefully — names one **free artifact check it says should happen before xian
rules on GO** (§3): *did N1's live runs actually retrieve the second excerpt `57-60`?* Acted on it
in this fire. Everything below is the same fire. Zero live turns, zero model calls.

### The clocked item: §3 answered — no

Round 63's own doc, §3 and §Limits, read this session:

- §3, live call-1 render, all five runs identically: **leading `1-28` (28), trailing `34-60` (27)**
  — one excerpt.
- §Limits: *"All five runs produced the **single-excerpt render** … The two-excerpt widths (28/23)
  **never became the decision render**."*
- §2's per-call table, call 2: N1L2/L3 repeated the single-excerpt render, N1L1/L4/L5 came back
  **(miss, 0 rows)**.

**No N1 run on any call received a two-excerpt render.** Daedalus's conditional was *"if they
didn't, R's premise is intact and R should run exactly as built."* Answered R-favourable.

(Labelled: this is the Round 63 **doc**, not artifacts — those JSONs were deleted at end of that
fire per its own §Limits. Nothing here can re-check it.)

### Then Q's artifacts, and the thing that was actually there

All five `.testdata/recall-probe-R94L{1..5}-Q.json` still present. Read via
`toolCalls[].rendered` rather than console summaries.

**Call 1, identical in all five:** `matchCount: 1`, `excerptSeparators: 0`, `edgeLines: 2`, offers
`[1-38, 44-80]`. **Q's call 1 was single-excerpt too.** Seq 79 was not a hit for the opening query.

**Call 2 is the 4/1 split, and the splitter is the query string:**

| run | call-2 query | render | expanded |
|---|---|---|---|
| L1, L2, L4, L5 | `ochre-marlin-44` | 2 excerpts, `▸`41 + `▸`79, **3 edge lines** (flush) | **no**, 0/4 |
| L3 | `codeword rollback string exact` | **0 matches** | **yes** — `expand 44-80`, held the marking |

Combined with N1's six: **two-excerpt render → 0/4 expand; no such render → 6/6 expand. Ten runs,
no exception.** This was in `toolCalls[].query` the whole time; no round doc had tabulated it.

**L3 is stronger than co-occurrence.** Its expand returned `shownCount: 30 / matchCount: 37` with
`1-43` and `74-80` offered as continuations — rows 74-80 **truncated out and not taken**. L3 was
never *shown* 79-80 by a tool call, yet its reply reproduces "the Tuesday revert" verbatim. Carried
context. So: a run that had the decoy, **acted on it**, and expanded anyway.

### Two corrections, one of them to my own registration

1. **Daedalus's §2 refutation fails.** It needs N1's flush-terminal second excerpt to have been
   present; `predictedFlushEdges: 1` is a `--dry` field and N1 rendered **no flush edge live**. A
   structural prediction read as an observation — third time in four days on this line, and I made
   the same error in the registration he was refuting.
2. **My Round 96 §Finding 2 null was wrong in both survivors.** "80-row length" is struck — nothing
   renders `scopedTotal`, confirmed in the render text, so it was never an observable. The flush
   edge stays but as **confounded, not surviving**: it and the `▸`-marked decoy arrive in the same
   render, and **R does not separate them**.

### Free improvement to Daedalus's arm S

His closed form is right about the two-excerpt geometry, which nobody saw. Live single-excerpt:
`leading = fact-3`, `trailing = total-fact-2` → N1 **28/27/+1**, Q **38/37/+15** (not 23 and 33).
S (total 70, fact 31) would render **leading 28, trailing 37, offset +1** — **trailing 37 identical
to Q's live 37**, so S vs Q varies only leading width and offset instead of three things. Not built;
arithmetic only; conditional on opening-query behaviour, which Round 63 flagged as undecidable at
`--dry` time and Q's own call 2 proves can vary within an arm.

### Registered ahead of any R data (Round 98 §5a)

R only measures anything on runs reaching the two-excerpt render. So: conditional denominator;
**both denominators always reported** (Round 63 §6's discipline); underpowered and say so if <3/5
reach it; **call-2 query string recorded verbatim per run**.

---

### Wrap verification

```
$ git status --short          (before commit)
 M docs/COORDINATION.md
 M docs/logs/2026-08-26-1047-theseus-opus-log.md
?? docs/mail/theseus-to-daedalus-cc-xian-team-your-check-came-back-and-neither-arm-ever-rendered-the-thing-we-argued-about-2026-08-26.md
?? docs/research/round98-the-four-one-split-is-the-second-query-and-neither-arm-ever-rendered-what-we-argued-about-2026-08-26.md
```

**No product code, no harness change.** `packages/` and `scripts/` untouched this fire — arm R is
unchanged from the START fire's build.

**Step 1 — commit on origin/main.** `git push origin HEAD:main` → `63f3b32..f3b92e0  HEAD -> main`.
Then `git fetch origin && git log origin/main --oneline -3`:

```
f3b92e0 round98+mail+log+coordination: 8/26 WORK -- the 4/1 split is the second query, and neither arm ever rendered what we argued about
63f3b32 log+coordination: 8/26 WORK -- no-op, verified not assumed
8ca0a75 log: 8/26 MID -- wrap verification for round97 (commit on origin/main, both new files in tree)
```

**Step 2 — each deliverable exists.** `ls` on all four returns:

```
docs/COORDINATION.md
docs/logs/2026-08-26-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-xian-team-your-check-came-back-and-neither-arm-ever-rendered-the-thing-we-argued-about-2026-08-26.md
docs/research/round98-the-four-one-split-is-the-second-query-and-neither-arm-ever-rendered-what-we-argued-about-2026-08-26.md
```

**Step 3 — this log.** Committed after Steps 1 and 2, in a follow-up commit.

### Open, carried to the next fire

- **Arm R still needs xian's GO** for 5 live opus runs. The free check Daedalus wanted ahead of the
  ruling is done and came back in favour of running it. Ask restated in the reply memo §6/§7.
- **R vs S** — I argue for R (memo §6); Daedalus preferred S. Not a strong disagreement, and §2 did
  most of S's audit for free. If he still prefers S after reading §2, I'd defer.
- **Undecidable with the current corpus:** whether call 2's query is *caused by* call 1's render or
  is independent variation. Ten runs can't tell, and it changes how the §0 association reads.

---

## 19:47 PT — STOP fire

**Round 100.** Zero live turns, zero model calls. Two free `--dry` runs of arm R. No product
code; `packages/` untouched. Harness edited — **comment lines only**, proved two ways.

### Session start

`git log --oneline -3` → `c05bfa4` (Iris, STOP no-op), `c8c6655` (Argus, STOP no-op), `ddabd94`
(Daedalus, round99 wrap). Branch `claude/theseus-cycle` tracking `origin/main`, clean.
`ls docs/mail/` → one new inbound addressed to me:
`daedalus-to-theseus-cc-xian-team-conceded-and-the-harness-warned-us-four-times-in-files-we-both-read-2026-08-26.md`
(his commit `83c15aa`). Read in full, acted on in this fire.

### Verified before asserting

Every claim of his that I repeat, checked against the file this session:

| His claim | Where | Result |
|---|---|---|
| N1 block pre-registers 28/27 as "the arm's premise" | `probe-recall-tool.mjs:803` | confirmed verbatim |
| Q block pre-registers 38/37 as premise + "do not mix the two sets of widths" | `:970`, `:974` | confirmed verbatim |
| `singleMatchOffer` comment names the trap and Round 57 | `:1756-1774` | confirmed |
| Render text "is not persisted … *reconstructed*, not captured" | `:2116-2130` | confirmed verbatim |
| Round 63 limits: 5/5 single-excerpt, two-excerpt widths never the decision render | `round63-…:240-250` | confirmed |
| Rule 5's four fields exist | `:2450`, `:2143`, `recall-recogniser.mjs:154`/`:170` | all four exist |
| Rule 5 fields survive to the artifact (he didn't check this) | `call.rendered` inside serialized `toolCalls` (`:2445`) | **yes** — gate is assertable post-hoc |
| `laterQueryDiffered` at `:2470` | computed `:2327-2329`, written `:2468` | **four lines off** |
| `premiseRender` does not exist | `grep -rn premiseRender scripts/` | **nothing**; only his round doc/memo/log + COORDINATION |
| Nothing renders `scopedTotal` (my own Round 98 claim, re-checked) | `recall.ts:898`, `:903` | only used to compute a trailing `to:` address |

### What the fire found

1. **The retracted claim was still in arm R's docblock.** Fact 2 of "Two facts measured off Q's
   artifacts" cited `structural.predictedFlushEdges: 1` — a `--dry` field — as an observation. I
   wrote it at this morning's START fire; Round 98 §3 and Round 99 §1 both retracted it in prose;
   neither of us went back to the file. Re-provenanced to the live call-2 renders (0/4 expanded),
   with the caveat that call 1 never rendered a flush edge in any of the ten runs.
2. **The registered null named a survivor that was never observable.** "Q's 80-row length"
   struck. One confounded pair remains (flush edge + `▸` on seq 79), which R holds constant
   together.
3. **The power calculation used the denominator R's own rule excludes.** DV conditioned on the
   two-excerpt render; null quoted p ≈ 0.2 = Q's *unconditioned* 1/5; the one expansion is L3,
   the run the condition voids. **Q's baseline on R's denominator is 0/4.** Registered both
   consequences against interest.
4. **§6 decision:** `premiseRender` wanted, argument stronger than he made it (`grep -n "arm's
   premise"` → two hits; **R declares none**), **not built tonight** — per-arm metadata, eleven
   arms, end of a day-part, file about to be paid against. Build at next START, gated on the same
   `--dry` proof; **GO wins if it lands first.**

### Inertness proof

```
$ git diff --stat scripts/probe-recall-tool.mjs
 scripts/probe-recall-tool.mjs | 74 ++++++++++++++++++++++++++++++--------
 1 file changed, 61 insertions(+), 13 deletions(-)

$ git diff -U0 scripts/probe-recall-tool.mjs | grep -E '^[+-]' | grep -v '^[+-][+-]' | grep -vE '^[+-]\s*//'
(no output)
```

`node scripts/probe-scratch-server.mjs` → READY, `lsof`-verified holding
`.testdata/recall-probe.db`. `npx tsx scripts/probe-recall-tool.mjs RD100A R --dry` before the
edit, `RD100B` after. Key-by-key comparison: **SAME** `arm, label, expectation, dryRun, model,
messagesInOneToOne, window, holdingChannelType, markingSpeaker, structural`; **DIFF** only `tag`
(`RD100A`/`RD100B`) and the entity name inside `precondition.layer6` (`Vesper-RRD100A`/`…B`).
`structural` byte-identical. Every pre-registered ordinal exact — transcribed into the round doc
before `.testdata/` deletion. Teardown: `TaskStop`, then `lsof -ti tcp:3001` → free, no orphaned
grandchild.

### Note for whoever runs `--dry` next

Plain `node scripts/probe-recall-tool.mjs` fails with `ERR_MODULE_NOT_FOUND` on
`packages/server/src/db/queries.js` — it needs the TS loader. **`npx tsx scripts/probe-recall-tool.mjs`
works.** And `--dry` still requires the scratch server on :3001 (it seeds through the API), so
`node scripts/probe-scratch-server.mjs` first. Neither is written down anywhere I could find.

### Wrap verification

```
$ git status --short          (before commit)
 M docs/COORDINATION.md
 M docs/logs/2026-08-26-1047-theseus-opus-log.md
 M scripts/probe-recall-tool.mjs
?? docs/mail/theseus-to-daedalus-cc-xian-team-your-corrections-hold-and-the-retracted-claim-was-still-in-the-arm-2026-08-26.md
?? docs/research/round100-the-retracted-claim-was-still-in-the-arm-and-the-null-was-registered-against-the-wrong-denominator-2026-08-26.md
```

Steps 1-3 appended below after the commit lands.

### Open, carried to the next fire

- **Arm R still needs xian's GO** for 5 live opus runs. Both seats now agree on the arm (Daedalus
  withdrew S in Round 99 §7). Ask unchanged in size.
- **`premiseRender` build** — decided, scheduled for the next START fire, subordinate to GO.
- **The pair the null cannot separate** (flush edge / `▸` on seq 79) needs an arm that breaks them
  apart, and that arm moves the geometry. Not cheap, not next.
- **Undecidable, unchanged:** whether call 2's query is caused by call 1's render.

### Wrap verification — run, 19:47 fire

**Step 1 — commit on origin/main.** `git push origin HEAD:main` → `c05bfa4..868fe73 HEAD -> main`.
Then `git fetch origin && git log origin/main --oneline -3`:

```
868fe73 round100+mail+log+coordination: 8/26 STOP -- the retracted claim was still in the arm, and the null was registered against the wrong denominator
c05bfa4 log+coordination: 8/26 STOP -- no-op, verified not assumed
c8c6655 log+coordination: 8/26 STOP -- no-op, verified not assumed
```

**Step 2 — each deliverable present in the pushed tree.** `git ls-tree --name-only origin/main --`
on all five returns all five:

```
docs/COORDINATION.md
docs/logs/2026-08-26-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-xian-team-your-corrections-hold-and-the-retracted-claim-was-still-in-the-arm-2026-08-26.md
docs/research/round100-the-retracted-claim-was-still-in-the-arm-and-the-null-was-registered-against-the-wrong-denominator-2026-08-26.md
scripts/probe-recall-tool.mjs
```

**No product code:** `git diff --stat a54c018 origin/main -- packages/` → empty. `git status`
clean, `.testdata/` scratch artifacts deleted.

**Step 3 — this log.** Committed after Steps 1 and 2, in a follow-up commit.
