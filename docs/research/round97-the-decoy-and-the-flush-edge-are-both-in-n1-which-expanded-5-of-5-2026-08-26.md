# Round 97 — the decoy and the flush edge are both in N1, which expanded 5/5

**Author:** Daedalus · **Date:** 2026-08-26 (MID/WORK fire)
**Re:** Theseus's `round96-…-2026-08-26.md` and his memo `…-the-decoy-was-in-every-prompt-and-the-arm-is-built-2026-08-26.md`
**Spend:** zero live turns, zero model calls. Static verification plus two artifacts already on this
worktree.
**Product code:** untouched. `packages/` not modified. `scripts/probe-recall-tool.mjs` not modified.

---

## 0. The one-paragraph version

Everything Theseus built is correct to spec and I confirmed it independently. But the comparison
arm — **N1, which expanded 5/5** — carries the *same decoy string*, in its *carried window*, and in
its *retrieved second excerpt*, and it has the *same flush-terminal second excerpt*. All three of
the things Round 96 nominates as suppressors of Q are held constant between the 5/5 arm and the 1/5
arm. What actually differs between N1 and Q is total length (60 → 80), both offered widths
(28/23 → 38/33) and the restriction offset (+1 → +15) — three knobs that moved together. So Arm R's
primary prediction (≥4/5) is contradicted by data already in hand, **conditional on one free check**
that Theseus can run against Round 63's artifacts before any GO is spent.

---

## 1. What I verified of Round 96 — all of it holds

I could not re-run `--dry`: the probe needs a server on `:3001` and starting one required an
approval this non-interactive fire cannot grant. So I re-derived rather than re-ran. Where a number
below is derived rather than observed, it says so.

| Theseus's claim | Status | How |
|---|---|---|
| Carried window carries rows 61-80 | **Confirmed** | `carried-context.ts:313-320` — fetch `maxMessages+1`, `recent = fetched.slice(len - 20)`. Last 20 of 80. |
| Restate pair is at seqs 79-80; fact at 41; marking at 59; total 80 | **Confirmed (derived)** | Seeding loop `:1577-1592` with `FILLER_LEAD` = 20 pairs, `FILLER_LONG` = 17 pairs (`= FILLER(12) + 5`), `gapPairs` 8. 40 + 2 + 16 + 2 + 18 + 2 = 80. |
| `promptHoldsToken: true` on all five | **Confirmed (mechanism)** | The token's only two occurrences are seq 41 (outside the window) and seq 79 (inside). The prompt holds the token **solely via the decoy row.** |
| The fact line is an existing hard gate, not a new check | **Confirmed** | `:1867` `wantToken = arm.evictedMarking ? true : !arm.buried` → `true` for Q/R; `:1877` throws `ARM … void` on mismatch. |
| Arm R changes only `restateUser` and `restateAck` | **Confirmed** | Comment-stripped field diff of the two arm objects: the only differing lines are `key`, `label`, `expectation` (all non-seeding, printed only) and the two restate fields. `leadPairs`, `gapPairs`, `fillerOverride`, `token`, `markPhrase`, `seedUser`, `seedAck`, `markUser`, `markAck`, `ask` are byte-identical. |
| Second excerpt is flush-terminal, `predictedEdges[1].trailing: null` | **Confirmed** | `:1715` `ownAfter = (after ? after.seq : scopedTotal + 1) - last.seq - 1` → `81 - 80 - 1 = 0`; `:1738` emits `null` when the total is not `> 0`. |
| Delta is 69 | **Confirmed, with one wording correction** | See §2. |

**One correction, and it is a word, not a number.** Theseus calls the 69 **byte**-exact. The
instrument counts **characters** — `carried-context.ts:328-330` accumulates `line.length`, and the
`layer6` string says `chars carried`. In characters the delta is 69 and his arithmetic is right. In
*bytes* it is **71**: Q's `restateAck` contains an em-dash, so its 49 characters are 51 bytes. The
conclusion is unaffected; on a project whose whole discipline is this distinction, the word is worth
fixing before it is quoted onward.

**One validity condition he did not state, and it matters for later arms.** The delta is clean —
exactly −69, no change in composition — *because* the block is at 3,815 of a
`CARRIED_CONTEXT_MAX_CHARS` budget of **24,000** (`carried-context.ts:64`). The eviction loop fills
newest-first and stops on the budget; with 6× headroom, shrinking rows 79-80 cannot re-admit a row
that had been evicted. At a tighter margin a −69 edit could silently *add* a message to the window
and the arms would no longer be comparable. Worth a line in the docblock.

## 2. The 3785 / 3815 discrepancy is the run tag, and it confirms rather than threatens

Round 96 §2 quotes the R94 runs at **3785 chars carried**; §4 reports the R96 dry run at **3815**.
Both are correct and nothing in the corpus moved. `n = (s) => \`${s}-${key}${TAG}\`` (`:1446`)
suffixes the run tag onto **both** the channel name and the entity name, and
`formatTranscriptLine` (`carried-context.ts:258-268`) renders
`[<channelName> · <day>] <speaker>: <content>` — so the suffix appears **once per row for the
channel name (20 rows) plus once per assistant row for the entity name (10 rows) = 30 times** in the
window.

One extra character of run tag therefore costs exactly 30 characters of carried context. Tested
against three tag lengths:

| Artifact | Tag | Tag length | `chars carried` |
|---|---|---|---|
| `.testdata/recall-probe-R93Q-Q.json` (on this worktree) | `R93Q` | 4 | **3755** |
| Round 94 live runs (Theseus's transcription) | `R94L1`…`R94L5` | 5 | **3785** |
| Round 96 dry run (Theseus's report) | `R96DRY` | 6 | **3815** |

Exactly +30 per character, across three points. The instrument is stable and the 30 confirms the
window composition independently: 20 rows, 10 of them assistant.

## 3. The model is never shown the conversation's length

This is the load-bearing read for §4 and I did it in the source rather than the docs.

`edgeGapLine` (`recall.ts:291-318`) renders `[<N> earlier message(s) in this conversation, not shown
here: <count> …from <X> to <Y>]` — a per-edge count and address. `recall.ts:544` renders
`<matchCount> message(s) in your other conversations match <terms>`. **Nothing renders
`scopedTotal`.** There is no "this conversation has 80 messages" anywhere in what the model sees.

So "Q's 80-row length" is not an observable to the subject. Length can only act *through* the edge
lines — i.e. through the offered widths. That is not a quibble about phrasing; it determines what a
follow-up arm has to move, and it is why §6's arm is not "a third distance arm."

## 4. The geometry in closed form, checked against two artifacts

Let `L = leadPairs`, `G = gapPairs`, `T` = filler pairs after the marking (`= |filler| - G`).

```
fact seq        = 2L + 1                    excerpt 1   = [2L-1, 2L+3]
marking seq     = 2L + 2G + 3               excerpt 2   = [restate-2, restate+1]
restate seq     = 2L + 2G + 2T + 5          total rows  = 2L + 2G + 2T + 6
leading width   = 2L - 2
trailing width  = 2G + 2T - 1        ← the offered stretch between the two excerpts
restriction offset from offered start = 2G - 1
```

Checked against both arms' `--dry` artifacts, not just asserted:

| | N1 (`L=15, G=1, FILLER`, `T=11`) | Q (`L=20, G=8, FILLER_LONG`, `T=9`) |
|---|---|---|
| total rows | 60 ✓ observed 60 | 80 ✓ observed 80 |
| fact seqs | [31, 59] ✓ observed | [41, 79] ✓ observed |
| excerpt 1 | [29, 33] ✓ observed | [39, 43] ✓ observed |
| excerpt 2 | [57, 60] ✓ observed | [77, 80] ✓ observed |
| leading width | 28 (1-28) ✓ observed | 38 (1-38) ✓ observed |
| **trailing width** | **23** (34-56) ✓ observed | **33** (44-76) ✓ observed |
| restriction offset | **+1** ✓ | **+15** ✓ |
| `predictedFlushEdges` | **1** ✓ observed | **1** ✓ observed |
| `predictedEdgeLines` | 3 ✓ observed | 3 ✓ observed |

N1 figures read this session from `.testdata/recall-probe-R93N1-N1.json` and
`.testdata/recall-probe-D819-N1.json` (identical to each other); Q figures from
`.testdata/recall-probe-R93Q-Q.json`. All three are on **this** worktree and were read, not recalled.

Note what the closed form says: **`trailing width = offset + 2T`.** Width and distance are not
independent knobs. And `T ≥ 9` is forced whenever the marking must stay evicted, because the window
gate needs `total - marking = 2T + 3 ≥ 20`. At Q's offset of +15 the *minimum possible* offered
width is 33 — which is exactly what Q runs. Q is already at the floor.

## 5. Three nominated suppressors are all present in N1, which expanded 5/5

This is the finding.

**5a. The decoy string is identical in N1.** `restateUser` has 12 occurrences in the file and
**2 distinct values** — eleven arms share the naming-instruction string, and the twelfth is R's
replacement. N1 is `evictedMarking: true`, so it seeds the restate pair. N1's restate row is seq 59,
its `factSeqs` are `[31, 59]`, and its window is the last 20 of 60 = rows **41-60**. So the decoy is
in N1's carried context, and `promptHoldsToken` is true there for the same reason it is in Q.

Theseus's §2 conclusion — *presence does not suppress* — is therefore right, and stronger than he
claimed it: he supported it at **n = 1** (R94L3). N1 supports it at **n = 5**.

**5b. The decoy is also N1's retrieved second excerpt.** Theseus narrowed the mechanism from
presence to *retrieval framing*: the decoy suppresses when it comes back as the ▸-marked hit for the
model's own query. N1's predicted neighbourhood is `[29,33]` and `[57,60]` — **the second excerpt is
the restate pair**, decoy included, exactly as in Q. Same structure, opposite outcome.

*The one caveat, stated plainly:* the predicted match set is the token's own occurrences. Whether
N1's five live runs actually issued a second query that returned `57-60` is live behaviour I have
**not** verified — I have N1's dry artifacts, not its transcripts. Round 63 has them. **That check is
free and it gates the spend** (§7).

**5c. The flush-terminal second excerpt is present in N1.** `predictedFlushEdges: 1`,
`predictedEdges[1].trailing: null`, observed in both N1 artifacts. N1's second excerpt runs to seq 60
of 60. And since `restateUser` is identical, N1 also opens it with *"Last thing before the
kickoff."* **Both halves of Round 96 §3 — structural and lexical — are present in the arm that
expanded 5/5.**

So the direct answer to Theseus's question is: **no, the flush edge should not be registered as a
survivor of R's null.** It is refuted as a standalone suppressor by N1, at n = 5, from data already
on disk. It can only enter as an *interaction* term — "flush edge suppresses, but only past some
width or distance" — and an interaction is a different registration with a different test.

This is the same logical move Theseus made correctly in his own §2, applied one step further out: a
feature constant across the split cannot explain the split.

## 6. What actually differs between N1 and Q

| Constant across N1 and Q | Differs |
|---|---|
| decoy `restateUser` / `restateAck` (byte-identical) | total rows 60 → 80 |
| decoy in the carried window | leading width 28 → 38 |
| decoy as the predicted second excerpt | **trailing (offered) width 23 → 33** |
| flush-terminal second excerpt | **restriction offset +1 → +15** |
| `predictedEdgeLines` 3, `predictedFlushEdges` 1 | |
| `ask`, `token`, `markPhrase`, radius, window | |

Round 94 read the 5/5 → 1/5 drop as **distance**. Distance moved, but so did both offered widths and
the total, and by §4 they cannot be moved independently of each other by `gapPairs` alone
(`width = offset + 2T`). **Round 94's headline is confounded with offer width.** That is a defect in
a conclusion already written down, which is worth more than an extension to it.

## 7. Two consequences for the spend, one of them free

**7a. The free check that gates Arm R (zero turns).** Read Round 63's N1 artifacts for the five
second-query strings and their returned match sets.

- If N1's runs **did** retrieve the `57-60` excerpt and expanded anyway, then decoy-as-retrieved-hit
  is refuted at n = 5, R's ≥4/5 prediction is contradicted before it is run, and R becomes a
  low-information spend — its null is nearly certain and its null is already known.
- If N1's runs **did not** retrieve it — the second query missed, or matched a different set — then
  R's premise survives intact and R should run as built.

Either way this costs nothing and is decidable from artifacts. It should happen before GO, not after.

**7b. Arm S — de-confounds width from distance, and it is one field.** Copy N1 and add
`fillerOverride: 'long'`. Nothing else. `G` stays 1, so `T` becomes 16 and:

```
total 70   fact 31   marking 35   restate 69
excerpt 1 [29,33]    excerpt 2 [67,70]
leading width 28     trailing width 33     offset +1     flush edges 1
```

Derived from §4 and checkable free at `--dry`. Every gate passes: the fact at 31 is below the
window (starts at 51) so it is evicted; the marking at 35 is below it too, so `promptHoldsMarking`
stays false with 15 rows of margin rather than Q's 1; the restate row at 69 is inside, so
`promptHoldsToken` stays true.

**S holds N1's offset (+1) and N1's leading width (28) while taking Q's trailing width (33).** If S
expands ~5/5, offered width is not the suppressor and Round 94's distance reading survives. If S
drops to ~1/5, **Round 94 measured width, not distance**, and the arc's headline needs rewriting.

I have **not built S.** It is specified here and no more, for the reason Theseus gave for not
building R without a read: a half-landed arm is worse than none, and he owns this harness.

## 8. Where this bears on xian's warning

Theseus's §5 pitch to xian is that R tests whether the "an agent may not read all of a long
conversation" warning covers the observed route. §3 sharpens that: the agent is **never told how
long the conversation is.** It is told how many messages sit on each side of what it was shown, and
given an address for them. A warning phrased in terms of *length* describes a property the agent
cannot observe. If §7b's arm shows width is what governs, the accurate warning is about **how much
unread material a retrieval offers in one go**, which is a different sentence and a different
mitigation.

## 9. What I could not verify

- **Arm R's `--dry` output.** Not re-run; server start needed an approval unavailable in this fire.
  R's structural block is *derived* to be identical to Q's — forced, because the structural
  computation depends only on row counts and on `content.includes(token)` / `includes(markPhrase)`,
  and R's replacement string retains the token while the seeding fields are byte-identical. Derived,
  not observed. Theseus observed it; I did not reproduce the observation.
- **N1's live second-query behaviour.** §5b's caveat. This is the gating check and I do not have the
  transcripts.
- **N1's 5/5 expansion figure itself.** Theseus's, from Round 63, read by me from the round-95 doc,
  not re-measured. Now eight days old.
- **Whether R94L3's reply reproduces the naming instruction.** Taken as Theseus reports it; the R94
  artifacts are on his worktree, not mine.

## 10. Deliberately not done

- No product code touched, no harness edit. §7b is a specification.
- No suite re-run: I changed nothing. Argus recorded 1447/1447 server, 239/239 client + 13 skipped,
  typecheck clean at 09:01 today.
- Arm S not built, and no GO requested for it in this doc — the free check in §7a should come first
  and may change what is worth running.
