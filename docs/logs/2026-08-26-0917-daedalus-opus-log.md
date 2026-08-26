# Daedalus session log — 2026-08-26

**Agent:** Daedalus (architecture & implementation) · **Model:** claude-opus-5
**Worktree:** `/Users/xian/Development/klatch-worktrees/daedalus` · **Branch:** `claude/daedalus-cycle`

---

## 09:17 PT — START fire. Round 95: answered Theseus's Round 94 §7 open ask.

**Spend: zero.** No live model turns, no API calls. **No product code changed.**
`scripts/probe-recall-tool.mjs` **read, not edited** — the arm is Theseus's and Round 92's
pre-registration is in git ahead of the data.

### Briefing

- `git log --oneline -5`: three 8/26 START no-ops ahead of me (`f3ef4cb` Argus, `a3413fa` Calliope,
  `1a88d07` Iris), then `64d1d28` the automated cross-pollination brief, then Calliope's 8/25 v72
  rollup. Worktree clean, `claude/daedalus-cycle` level with `origin/main`.
- Mail: two items to me, both new since my last fire.
  - `memo-janus-to-daedalus-theseus-cc-calliope-xian-distance-arm-go-2026-08-25.md` — xian's GO on
    the distance arm (already executed by Theseus), plus his threat-model framing. **Read; folded
    into §6 of my reply rather than acked separately.** No open action.
  - `theseus-to-daedalus-cc-xian-team-the-arm-ran-and-your-number-landed-through-a-mechanism-neither-of-us-registered-2026-08-25.md`
    — one open ask (§7): *is the decoy arm worth five more turns?* **Answered this fire.**

### Findings, all verified this session

1. **The strongest case for the decoy arm is one Theseus didn't make.** It's simultaneously the
   retry of Q's primary DV — geometry held fixed means the restriction stays at `+15`, so if
   removing the decoy restores expansion, the appetite question Q failed to measure gets answered
   on Q's own geometry. Both branches inform; Q had a branch that didn't. **Answer: run it.**

2. **A design trap that would have reproduced Q's failure exactly.** `restateUser` at
   `probe-recall-tool.mjs:1017-1020` **contains `ochre-marlin-44`** — that is *why* seq 79 is a
   second occurrence (arm comment `:955`: *"rows 79-80 restatement + ack — carries the token, so a
   second occurrence"*). The 9-row neighbourhood the four no-expand runs received exists only
   because that token matches twice. **Strip the codeword along with the naming instruction and the
   second search drops 2 matches → 1** — geometry and wording move together, and Theseus's own §4
   predictor ("expanded iff the second search missed") makes the geometry change *sufficient* on
   its own. Constraint handed over: keep the literal token, remove only the naming instruction.
   Also flagged that `restateAck` echoes the instruction in the assistant's own voice and is
   plausibly the stronger half of the decoy — strip both or the manipulation is partial.

3. **A refuted pre-registration Round 94 doesn't report as refuted.**
   `probe-recall-tool.mjs:978` — *"**Expand rate: unchanged from N1.** Nothing in the design
   predicts a rate change. Saying so first is what stops a null being read as a finding."* N1 5/5,
   Q 1/5. **Refuted.** Grepped `round92-*.md` for `expand`: three hits, all about the 30-row cap, a
   citation fix, and the tap — none about rate. `round94` prints both figures adjacently and reads
   them only as "the DV is unmeasured." This *strengthens* Theseus's §2 rule ("pre-register
   mechanisms, not numbers") rather than qualifying it: a mechanism was pre-registered, in the
   sharpest possible form, and still went unscored because the round doc scored against the most
   recent memo instead of everything on record. Corollary proposed: score **every** pre-registration
   for the arm, harness comments included, each `held` / `refuted` / `untested`.

4. **Theseus's §7.1 instrument rule is under-scoped for the hypothesis that produced it.** His fix
   is "every query string of every call goes in the doc"; Round 94 complies. But §4's decoy
   hypothesis rests on **reply text** (the "one related note from the same thread" paraphrase), and
   §8 records the transcription source as `toolCalls[]` and `expandAction`. The replies live only in
   `.testdata/recall-probe-R94L{1..5}-Q.json`. **So §7.2's defect is live in Round 94 itself, one
   section below where he named it, for the exact hypothesis the next five turns would test.**
   Flagged as possibly time-sensitive and sequenced ahead of the arm.

5. **Calibration caveat.** `grep -A2 "restateUser:" scripts/probe-recall-tool.mjs | grep -v … |
   sort -u` returns **exactly one string** — the decoy is byte-identical across every arm. So the
   `+6…+10` appetite band was calibrated *with* the decoy present and a decoy-free arm's depths
   aren't comparable to it. Not fatal (the operative DV, "does the read reach `+15`," needs no
   calibration transfer) but a depth-*shift* claim would be confounded.

6. **Power, stated so n=5 stops being relitigated.** Under the null (p ≈ 0.2, Q's observed rate),
   ≥4/5 expanding has probability ≈ 0.0067. Five is adequate *because the predicted effect is
   enormous* (0.2 → ≥0.8), not because five is generally enough. **3/5 has no reading** and should
   be reported as such rather than split.

7. **Where xian's framing bears on it.** Janus relayed xian's *"we can warn users about the limits
   or risks of allowing agents to communicate."* A warning drawn from Rounds 56–63 reads roughly
   "an agent may not read all of a long transcript." **That does not cover the decoy route at all**
   — there the agent never opens the offer. A user told "it might not read everything" would
   reasonably infer a *short* transcript is safe, and on §4's account length isn't what governs. So
   the arm is load-bearing on whether xian's preferred mitigation can be written accurately.

### What I could not verify, explicitly

- **Whether the R94 reply-text artifacts survive.** `.testdata/` is per-worktree and this session is
  sandboxed to my own; `ls .testdata/` here shows `R93*` and `D819*` probe JSONs, no `R94`. Reading
  Theseus's worktree was blocked by the sandbox. §4's hypothesis is taken as he reports it,
  unverified by me, and my pre-registration is written to survive either way.
- **N1's figures** (5/5 expand, `+10,+7,+7,+6` depths) are Theseus's from Round 63, read from the
  doc this session, not independently re-measured. Six days old.

### Deliverables

- `docs/research/round95-the-decoy-arm-is-worth-it-because-it-is-also-the-measurement-q-missed-2026-08-26.md`
- `docs/mail/daedalus-to-theseus-cc-xian-team-run-it-and-one-token-in-the-restate-line-decides-whether-it-measures-anything-2026-08-26.md`

### Not done, deliberately

- Harness untouched. §2's replacement wording is a **specification, not an edit**.
- Decoy arm not built — Theseus asked for a read before a spend; a half-landed arm is worse than
  none.
- Suite not re-run: I changed no code, and Argus's 09:01 fire this morning recorded server
  1447/1447, client 239/239 + 13 skipped, typecheck clean. Not duplicating a green run I didn't
  perturb.

### Wrap verification (CLAUDE.md Session Wrap Protocol)

**Step 1 — commits landed.** `git fetch origin main -q && git log origin/main --oneline -3`:

```
b5d9a52 round95+mail+log+coordination: 8/26 START -- run the decoy arm, and one token in the restate line decides whether it measures anything
f3ef4cb log+coordination: 8/26 START -- no-op, verified not assumed
a3413fa log+coordination: 8/26 START -- no-op, verified not assumed
```

`b5d9a52` is mine and is on `origin/main`. Push output: `f3ef4cb..b5d9a52  HEAD -> main`
(fast-forward, no force).

**Step 2 — deliverable files exist.** `ls` returned all four:

```
docs/logs/2026-08-26-0917-daedalus-opus-log.md
docs/mail/daedalus-to-theseus-cc-xian-team-run-it-and-one-token-in-the-restate-line-decides-whether-it-measures-anything-2026-08-26.md
docs/mail/read/memo-janus-to-daedalus-theseus-cc-calliope-xian-distance-arm-go-2026-08-25.md
docs/research/round95-the-decoy-arm-is-worth-it-because-it-is-also-the-measurement-q-missed-2026-08-26.md
```

`git ls-tree -r origin/main --name-only | grep -cE 'round95-the-decoy|run-it-and-one-token|2026-08-26-0917-daedalus'` → **3**. The three new
files are in the pushed tree; the fourth is the `git mv` of the Janus memo into `read/`, recorded
as a rename in the same commit.

**Step 3 — this log is committed last**, in a follow-up commit carrying the verification above.

**Note on delivery:** the wrapper owns delivery. What is verified here is that the commit is on
`origin/main` and the files are in its tree — nothing beyond that is claimed.

---

## 13:17 PT — MID/WORK fire — Round 97

**Spend:** zero live turns, zero model calls. **No product code changed; Theseus's harness read, not
edited.** Session-start briefing done: pulled state (worktree synced by wrapper), read
`docs/COORDINATION.md`, swept `docs/mail/`.

### Mail

One new inbound addressed to me:
`theseus-to-daedalus-cc-xian-team-the-decoy-was-in-every-prompt-and-the-arm-is-built-2026-08-26.md`
(arrived with commit `0ea04b6`). Read and answered in this same fire, per the mail discipline. It
carried one explicit ask — *"If you disagree that §3's flush edge belongs in the registered null, say
so before the spend rather than after"* — which is answered in §2 of the reply.

Thread left **open** in `docs/mail/`: it has a live action item (xian's GO on Arm R, plus the free
check I hand back in §3 of the reply). Not moved to `read/`.

### What I did

Verified Theseus's Round 96 build independently rather than taking it on report. Could **not** re-run
`--dry`: the probe needs a server on `:3001` and launching one required an approval a
non-interactive fire can't grant. So I re-derived from source and cross-checked against artifacts
already on this worktree — which turned out to be the more productive route.

**Confirmed:** window is last-20 (`carried-context.ts:313-320`) → rows 61-80, restate pair inside;
row arithmetic (`FILLER_LEAD` 20 pairs, `FILLER_LONG` = `FILLER` 12 + 5 = 17, `gapPairs` 8 → 41 / 59
/ 79-80 / total 80); the fact line is an existing hard gate (`:1867` `wantToken`, `:1877` throw), not
a new check; `predictedEdges[1].trailing: null` is forced by `:1715` when the last excerpt ends at
`scopedTotal`; and a comment-stripped field diff of arms Q and R shows the only *seeded* difference
is `restateUser` + `restateAck`. R is built to my §2 spec exactly.

**Three margin corrections.** (1) The 69 is **chars**, not bytes — the instrument accumulates
`line.length`; in bytes it's 71 (em-dash in Q's ack). Conclusion unaffected. (2) The 3785/3815 gap is
the **run tag**: `n()` (`:1446`) suffixes it onto 20 channel names + 10 entity names = 30
occurrences, so +1 tag char = +30 chars. Tested at three tag lengths — `R93Q` (4) → **3755** from my
own `.testdata`, `R94L1` (5) → 3785, `R96DRY` (6) → 3815. Exactly +30 per char; nothing moved.
(3) The −69 is clean only because of 6× headroom (3,815 against `CARRIED_CONTEXT_MAX_CHARS` 24,000);
at a tighter margin a shrink could silently re-admit an evicted row.

Also found: the token's only occurrences are seq 41 (outside the window) and seq 79 (inside), so the
prompt holds it **solely via the decoy row** — stripping it would flip `promptHoldsToken` and throw
the arm void, not merely move the geometry.

### The finding

Read N1's dry artifacts on this worktree (`recall-probe-R93N1-N1.json`, `recall-probe-D819-N1.json`,
identical): `messagesInOneToOne: 60`, `factSeqs [31,59]`, ex1 `[29,33]` lead 1-28 / trail 34-56,
ex2 `[57,60]` **trailing null**, `predictedFlushEdges: 1`.

**N1 — the 5/5 arm — has the flush-terminal second excerpt, has the identical decoy string
(`restateUser`: 12 occurrences, 2 distinct; eleven arms share it, R is the twelfth), has the decoy in
its carried window (last 20 of 60 = rows 41-60), and its predicted second excerpt *is* the restate
pair.** All three nominated suppressors are constant across the 5/5 ↔ 1/5 split.

So: **no**, the flush edge doesn't belong flat in R's registered null — refuted as a standalone
suppressor at n=5 — only as an interaction term. And Theseus's own §2 ("presence doesn't suppress")
is stronger than he claimed it: n=5 from N1, not n=1 from L3.

**Handed back as the gating free check:** whether N1's *live* runs actually retrieved `[57,60]` is
behaviour I don't have — Round 63 does. If they did, retrieval-framing is refuted before R runs and
those five turns land on a settled question. If they didn't, R's premise is intact. Zero turns,
decidable from artifacts, should precede GO.

### Secondary finding — Round 94's headline is confounded

Closed form, checked against all three artifacts rather than trusted:
`leading = 2L-2`, `trailing (offered) = 2G+2T-1`, `offset = 2G-1` → **`trailing = offset + 2T`**.
`T ≥ 9` is forced by the marking-eviction gate (`total - marking = 2T+3 ≥ 20`), so **Q already runs
the minimum offered width possible at +15.**

N1 → Q moved four things together: total 60→80, leading 28→38, trailing 23→33, offset +1→+15.
**The distance reading is confounded with offer width.**

And read in the source: `edgeGapLine` (`recall.ts:291-318`) renders per-edge counts and addresses,
`:544` renders the match count — **nothing renders `scopedTotal`.** The model is never told how long
the conversation is, so length can only act *through* the offered widths. This bears directly on
xian's preferred warning, which as phrased names a property the agent cannot observe.

**Arm S specified, not built:** N1 + `fillerOverride: 'long'` (one field) → total 70, fact 31,
marking 35, restate 69, leading 28, **trailing 33**, offset **+1**, flush 1. Holds N1's distance and
takes Q's width. All gates pass with 15 rows of margin where Q has 1. Given one GO I'd take S over R
— stated in the memo as a preference, not a finding.

### Deliverables

- `docs/research/round97-the-decoy-and-the-flush-edge-are-both-in-n1-which-expanded-5-of-5-2026-08-26.md`
- `docs/mail/daedalus-to-theseus-cc-xian-team-no-to-the-flush-edge-because-n1-has-it-too-and-n1-expanded-5-of-5-2026-08-26.md`
- `docs/COORDINATION.md` (Daedalus section)

### Not done, deliberately

- **Arm S not built.** Theseus's harness, and the §3 check may change what's worth running. A
  half-landed arm is worse than none — his rule, and it applies to me.
- **Harness untouched.** Every line number above came from reading it.
- **Suite not re-run:** nothing changed. Argus's 09:01 fire recorded server 1447/1447, client
  239/239 + 13 skipped, typecheck clean. Not duplicating a green run I didn't perturb.

### Could not verify, explicitly

- **R's `--dry` output.** Not reproduced — server start needed an approval unavailable here. R's
  structural identity to Q is **derived** (the computation depends only on row counts and on
  `content.includes(token)`/`includes(markPhrase)`, and R retains the token while every seeding field
  is byte-identical), not observed. Theseus observed it; I did not reproduce the observation.
- **N1's live second-query behaviour** — the gating check in §3; transcripts are Round 63's.
- **N1's 5/5 expansion figure** — Theseus's, Round 63, read from the round-95 doc, eight days old.
- **R94L3's reply reproducing the naming instruction** — taken as he reports it; those artifacts are
  on his worktree, not mine. My `.testdata/` holds `R93*` and `D819*` only.

### Wrap verification (CLAUDE.md Session Wrap Protocol)

Recorded in the commit that carries this entry; see the follow-up block below.
