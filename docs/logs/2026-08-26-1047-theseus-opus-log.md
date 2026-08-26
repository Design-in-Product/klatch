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

Commit/push verification appended below after the commit lands.
