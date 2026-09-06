# Theseus — 2026-09-05 session log (opus)

Duty-cycle fires. Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`. Entries appended as work happens, not reconstructed at the end.

---

## 10:47 PT — START fire (Round 155). Briefing.

Wrapper synced the worktree to `origin/main` immediately before the fire; `git log --oneline -3`
confirms head at `9c98403` (Daedalus's 9/5 START fire commit). Branch `claude/theseus-cycle`.

**Mail read this fire:**
`docs/mail/daedalus-to-theseus-cc-janus-iris-calliope-argus-xian-the-9x-decomposed-and-the-obvious-fix-is-a-no-op-2026-09-05.md`
(Daedalus, Round 154). He decomposed the 9× accepted-multipart cost into four ~2× stages
(`formData` 3.43×, `arrayBuffer` +2.02×, route `toString` +1.02×, parse +2.13× → 8.60× in-process,
reconciling with the 9.25–9.38× through a live server), reported the obvious `file.size` +
`file.text()` one-liner as a **measured no-op** (sign flips between runs — `Buffer.from(arrayBuffer)`
is a view, not a copy), and shipped a real fix on the *fall-through* path: `rejectOversizeFile`
now runs one line ahead of `arrayBuffer()` at all four multipart sites, saving 90.4 MB spent to
reject. He acked my Round 153 cold-figure close and is not re-deriving it.

**He explicitly left two items as mine, and they match my own Round 153 "not done, deliberately"
list:** the `~/.claude-pm/projects` cap delta, and Round 146's arm-S transform re-pin.

**This fire takes the `~/.claude-pm/projects` cap delta.** It is the one continuity #3 actually
depends on — PM's eleven department heads live under that root, and Round 153 measured the cap
ruling's cold-browse cost only against `~/.claude/projects`. The PM corpus has a very different
shape, so the shipped figure does not transfer.

### Inventory first, because it decides what the arms should be

Ran a standalone read-only inventory over both roots (streamed line counts, the same unit
`FINGERPRINT_LINE_CAP` is expressed in; scanner's own filters: `*.jsonl` directly under a project
dir, ≥ 100 bytes):

```
shipped: /Users/xian/.claude/projects
  files=521  bytes=546.8MB  maxLines=15371
  over1500=11  over50000=0   totalLines=181680
  top10=15371, 14061, 12043, 10597, 10419, 9473, 7091, 4598, 2941, 1898

pm:      /Users/xian/.claude-pm/projects
  files=76   bytes=462.7MB  maxLines=41168
  over1500=11  over50000=0   totalLines=258223
  top10=41168, 29923, 26847, 23399, 23174, 22435, 22001, 20841, 17660, 16626
```

Three things worth stating before any latency is measured:

1. **Same count over the old cap (11 each), wildly different magnitude.** The shipped corpus's 11
   over-1500 files top out at 15,371 lines; PM's top out at 41,168. The cap delta is a function of
   *lines above the cap*, not files above it, so the two corpora cannot share a number.
2. **PM holds 258,223 lines in 76 files vs 181,680 in 521** — 6.1 MB average file vs 1.05 MB.
3. **`over50000 = 0` on both.** The shipped 50 000 guard still does not bite, which is what
   `session-scanner.ts:255-263` says should be true and asks to be monitored. But PM's largest
   file is at **82% of the guard** (41,168 / 50,000). That headroom number has not been written
   down anywhere and is the early-warning signal the comment asks for.

Next: build the Round 155 probe and measure the delta at the endpoint. Method note — the server
can be pointed at the PM root **alone** via `CLAUDE_CONFIG_DIR` (replace semantics,
`session-scanner.ts:128`), rather than `KLATCH_EXTRA_SESSION_ROOTS` (additive), so the delta is
isolated to this corpus instead of measured through a union.

---

## 11:05 PT — Round 155 measured. `scripts/probe-pm-corpus-cap-delta.mts`, 39 checks, 0 failed.

**Two independent full runs of the whole probe. The delta agrees to 0.2% (1778 ms, then 1781 ms).**
Canonical figures below are the second run — the one the committed probe produces, since arm H was
added between them.

| arm | cap | cold browse | steady state |
|---|---|---|---|
| B | 50 000 (shipped) | **1945 ms** | 5 ms |
| C | 1 500 (pre-ruling) | **174 ms** | 4 ms |
| D | 50 000, control | **1966 ms** | 4 ms |

- **Cap delta: 1781 ms** (mean of shipped-cap arms − arm C); 1771 taking B−C. Arm B is not drift:
  B and D are 1% apart on separate fresh servers.
- **vs the shipped root's 723 ms (Round 153): 2.46×.**
- **Relative: shipped +48%, PM +1021%** (174 → 1956 ms). The old cap read 17 355 of 258 315
  lines — 6.7% of the corpus. It wasn't trimming PM's tail; it was declining to read it.
- **Turn signal: 138 → 1121. The old cap hid 87.7% of PM's turns**, against 59.4% on shipped.
  Department heads would have rendered at ~2 turns each against a real top of 370.
- **Steady state 4–5 ms at either cap** — cache absorbs it 425–490×, paid once per server start.
- **Guard headroom (arm G): PM's largest is 41 168 lines = 82% of the 50 000 guard.** Shipped's
  largest is 15 371 (31%). PM leads by 2.7× and crosses first.

### What I got wrong going in, and what caught it

I predicted in Round 153 that the PM delta would be "a different and larger number." It is — but
the reason is not the one I'd have given. **Both corpora have exactly 11 files over the old cap.**
Eleven and eleven. Had I reasoned from the file count instead of measuring, I'd have concluded the
deltas were comparable and been wrong by 2.5×. The delta is paid per *line* above the cap —
73 536 above-cap lines on shipped (40% of that corpus) vs 240 992 on PM (93%).

Arm A computes above-cap **lines**, not just the file count, specifically so the next reader can't
make the inference I nearly made.

### Method decisions worth recording

- **Root isolation via `CLAUDE_CONFIG_DIR`** (replace, `session-scanner.ts:124-130`) rather than
  `KLATCH_EXTRA_SESSION_ROOTS` (additive) — the figure is PM, not a union to be un-mixed by
  subtraction. `KLATCH_EXTRA_SESSION_ROOTS` is also explicitly blanked in the child env, so an
  ambient value can't silently restore the union.
- **The replace is proved by session-ID set equality against disk basenames** (`sessionId` is the
  file basename, `session-scanner.ts:528`), not by count — a union fails on the extra IDs, not just
  on a total that someone might rationalise.
- **`sourceRoot` could not serve as the proof** and I caught this before running, not after: it is
  deliberately *omitted* under a single root (`session-scanner.ts:47-62`), so my first draft's
  "sessions carry the PM root" check would have failed on a correct build. Rewritten to assert its
  **absence** — a `sourceRoot` appearing here would itself mean two roots got scanned.
- **Arm H is placed last on purpose.** It reads the shipped corpus (547 MB), which would warm page
  cache the timed arms hold constant. Nothing is timed after it.
- **Arm E's stale-arm hazard, handled in-line.** "Shipped cap does not bite" is true today and is
  exactly what the scanner comment asks to be monitored. The probe says in its own output that a
  red there *is the finding, not a broken probe* — Daedalus's Round 154 point about static arms
  that pin today's code as correct-by-definition, applied to my own.

### Arm H — the one I'm least confident in, written up as such

| normalisation | PM | shipped | spread |
|---|---|---|---|
| ms per 1k lines above cap | 7.4 | 9.8 | 25% apart, PM **cheaper** |
| ms per MB above cap | 4.1 | 3.3 | 26% apart, PM **dearer** |

The two normalisations **bracket rather than agree**, by a similar margin in opposite directions
(PM's lines average 1.84 KB vs shipped's 3.08 KB). I did not pick a unit on two data points; the doc
says "estimate 7–10 ms per 1k above-cap lines and treat the range as the precision." It is also a
cross-run comparison — the 723 ms is Round 153's, measured yesterday on a different machine state —
and both the probe and the doc label it that way. Flagged to Daedalus for a second opinion, with an
explicit offer to cut it back to the PM figure alone.

### Deliberately not done

- **The union cold browse.** xian's real Browse walks both roots. Adding the two single-root figures
  gives ~4.2 s, and **that is arithmetic across two runs, not a measurement** — it assumes the roots
  don't interact through page cache, the walk, or the response build. Named as the obvious next arm;
  not quoted as a figure anywhere.
- **Round 146's arm-S transform re-pin** — the second item Daedalus left me. Still scoped-not-built.
- **Whether ~1.9 s/server-start on PM is acceptable** — xian's call, and the ruling is already his.

Deliverables written: `docs/pm-corpus-cap-delta-2026-09-05.md`,
`scripts/probe-pm-corpus-cap-delta.mts`, memo to Daedalus cc Janus/Iris/Calliope/Argus/xian.
Two ad-hoc inventory scripts under `.testdata/` were deleted after their work moved into arms A
and H, so the numbers live in the committed instrument rather than in scratch.

---

## 11:10 PT — Wrap verification (START fire, Round 155)

Per CLAUDE.md Session Wrap Protocol. Run before any "done" claim.

**Suite and typecheck, run by me this fire, not quoted:**

```
server: Test Files 95 passed (95)   Tests 1518 passed (1518)
client: Test Files 18 passed | 13 skipped (31)   Tests 249 passed | 13 skipped (262)
npm run typecheck: clean across @klatch/shared, @klatch/server, @klatch/client
```

Both totals are unchanged from Daedalus's Round 154 figures, which is what should happen — I
touched no `packages/` code.

**`packages/` untouched, verified not assumed:**

```
$ git diff --stat -- packages/
(empty)
```

The probe's one-generation rewrite of `FINGERPRINT_LINE_CAP` was restored and sha256-verified
inside both runs (`PASS [*] scanner byte-identical to how it was found — sha256 2ae9ecd1c431`).

**Step 1 — commits on `origin/main`** (after `git fetch origin`):

```
$ git log origin/main --oneline -5
3db1489 round155: price the cap ruling on ~/.claude-pm/projects -- 1781 ms, 2.46x the shipped root
74aec9c mail: Theseus -> Daedalus, cc team (PM cap delta is 2.46x; ...)
9c98403 log+coordination: Daedalus 9/5 START fire — Round 154 accepted-multipart allocation decomposed
fee2f35 round154: check the import cap on file.size, ahead of the copy
3c29aaa mail: Daedalus -> Theseus, cc team (the 9x decomposed; ...)
```

Both of this fire's commits are present on `origin/main`. Mail was committed separately and pushed
to `main` first (`74aec9c`), per the worktree mail rule, before the work commit (`3db1489`).

**Step 2 — deliverable files present:**

```
scripts/probe-pm-corpus-cap-delta.mts                                    32468 bytes
docs/pm-corpus-cap-delta-2026-09-05.md                                    7862 bytes
docs/mail/theseus-to-daedalus-...-pm-cap-delta-is-2-46x-...-2026-09-05.md  6648 bytes
docs/logs/2026-09-05-1047-theseus-opus-log.md                             (this file)
```

Also modified and committed with this log: `docs/COORDINATION.md` (status → Round 155; the oldest
full prior, Round 144, trimmed to a pointer to hold my section at four priors — its detail survives
in `docs/browse-latency-end-to-end-2026-09-03.md`, the 9/3 log, and git history).

**Step 3 — this log is committed and pushed last**, after Steps 1–2 were verified.

No claim in this entry is made about work I did not verify present. The four deliberate omissions
(the union cold browse; whether ~1.9 s/server-start on PM is acceptable; Round 146's arm-S
transform re-pin; the lines-vs-bytes unit question in arm H, which needs a third corpus) are
recorded as not done, not as done. Every latency figure for `~/.claude-pm/projects` was measured
this fire, twice; every figure quoted for `~/.claude/projects` is either measured this fire (disk)
or explicitly attributed to Round 153 and labelled cross-run (latency).

---

## 14:47 PT — WORK/MID fire (Round 157). Briefing.

Wrapper synced the worktree to `origin/main` before the fire; head at `d7320fa` (Daedalus's 9/5
WORK/MID log commit). Branch `claude/theseus-cycle`.

**Mail read this fire:**
`docs/mail/daedalus-to-theseus-cc-janus-iris-calliope-argus-xian-my-own-9x-was-27-percent-low-and-your-bracket-is-a-broken-model-2026-09-05.md`
(Daedalus, Round 156). Three things in it. He corrected his own Round 154 headline **upward by 27%**
(8.60× → 11.06× for a real accepted multipart import) because his synthetic payload was pure ASCII
and 519 of 523 real sessions contain a character above U+00FF, which doubles V8's string storage —
three bytes changed, 35.5 MB. He decomposed the parse 2.13× to ~85% `JSON.parse` object graph with
no copy to remove. And he **answered my arm-H question the opposite way to how I asked it**: I
offered to cut the bracket back to the PM figure alone, and he said don't — it is worth *more* than
the point estimate inside it, as evidence the model is wrong. On his path the identical bracketing
signature resolved to **falsification**: at byte-matched payloads his isolated per-line slope came
out **negative** (−3.6 to −4.2 ms/1k, four runs). He was careful to say he could not tell me my
coefficient was negative — different path — and pointed out I already held the input for my own
version of the control.

**This fire runs that control on the scan path.** It is the one open action on the thread, it is
mine, and it is cheap.

### Finding the control, and it is better than the one he could build

Inventoried both roots for line *and* byte counts per file, then searched for byte-matched,
line-divergent pairs. Because the scan path reads whole session files, such pairs exist among **real
sessions** — no synthesis, and therefore none of the ASCII confound that ate his own Round 154
figure:

```
7.10x line ratio at 0.51% byte diff   2,941L / 32.9MB (11.47 KB/L)  vs  20,877L / 33.1MB (1.62 KB/L)
3.25x                    0.49%        2,941L / 32.9MB               vs   9,570L / 32.8MB
2.18x                    1.00%        9,570L / 32.8MB               vs  20,877L / 33.1MB
2.00x                    1.53%       10,452L / 33.6MB               vs  20,877L / 33.1MB
```

7.10× against the 2.36× Daedalus could construct. Selection is criteria (≥5 MB, ≤2% bytes, ≥1.8×
ratio), not hand-picking, so it re-selects on a changed corpus.

---

## 15:00 PT — Round 157 measured. `scripts/probe-scan-cost-model-control.mts`, 36 checks, 0 failed.

**Three independent full runs.** No source mutation at all this fire — `extractSessionFingerprint`
already takes `lineCap` as a parameter (`session-scanner.ts:293`), so unlike Round 155 nothing
needed patching.

**The answer came out the opposite way from Daedalus's, and then took my own number down anyway.**

1. **Not falsified.** Isolated per-line slope **positive on all four pairs in all three runs —
   12/12 measurements**, +1.3 to +4.2 ms per 1k lines. The scan path is not his broken model.
2. **But ~3.0 ms/1k sits BELOW both published figures (7.4 and 9.8), not between them** — 2.9×
   below their mean. 7.4 and 9.8 were never two estimates of one coefficient.
3. **Because a term was missing.** Each was a single-term summary of a two-term cost, so each
   absorbed the byte share of its own corpus. The corpora differ in bytes-per-line (1.83 vs 3.09
   KB), and *that* produced the bracket.

**Held-out scoring, because of his warning about the fit he nearly sent me** — fitted on 11 files,
scored on 11 the fit never saw:

| model | held-out error |
|---|---|
| lines only (my published form) | 25–26% |
| bytes only | 12–13% |
| **two-term (3.0 ms/1k lines + 2.5 ms/MB)** | **9–10%** |

Both coefficients non-negative every run. The cross-check I care about most: **fitted (2.9–3.0) and
fit-free pair isolation (2.7–3.2) agree to 2–7%** — two independent routes, one with no fitting.

### Two things that fell out

**Round 155's headline is now confirmed by a second instrument.** Per-file function-level sum gives
**1748 / 1765 / 1763 ms** against the **1781 ms** I measured through a live server — **1–2% apart**.
I verified two things **in the source this fire rather than recalling them**, and both are what make
it like-for-like: the endpoint's scan is a **strictly serial** `for` loop
(`session-scanner.ts:524-549`, no `Promise.all`), and Round 155's "cache-cold" meant
*fingerprint*-cache-cold — that probe warms the page cache on purpose
(`probe-pm-corpus-cap-delta.mts:275-281`). **So the residual isn't disk: the cap delta is ~99% CPU.**
Browse first-load is optimised by parsing less, not reading less.

**The longest line in either corpus is 2,312,071 characters — 687× its own file's mean**, and 2.4×
worse than the 946k line Daedalus flagged. Per-line cost varies 3.5× across the corpus (11.7 to 22.7
ms/1k above-cap lines), concentrated in the extreme-structure files. That is what the remaining ~9%
residual is, and it is invisible to both terms.

### What I got wrong, and what caught it

**Round 155's arm H called the bracket "the honest precision". It was not imprecision.** Two
single-term summaries of a two-term cost will *always* bracket when the corpora differ in the ratio
of the terms, and the true coefficient sits **outside**. My published range excluded the right
answer — worse than being imprecise about it.

What caught it was not care. Round 155 was careful and said out loud that two corpora were not
enough to choose the unit. What caught it was **someone on a neighbouring path running the control
and reporting that the signature was diagnostic**, plus the corpus happening to contain real pairs.
Both were luck. The transferable part: **when two normalisations of one measurement disagree in
opposite directions, suspect a missing term before reporting a range.**

**I did not adopt the relabel Daedalus proposed.** He suggested bracketing the rule by mean line size
(1.84–3.08 KB). That preserves a number this fire shows is 2.9× too high as a coefficient and encodes
the wrong reason for the bracket. His diagnosis of the *signature* is what sent me to measure; the
resolution on this path is different.

### Guard headroom moved in four hours

PM's largest session: **41,168 lines (10:47) → 41,466 (14:47)**, 82.9% of the 50,000 guard.
`over50000 = 0` on both roots still. I reported 82% this morning as though it were a property of the
corpus; it is a moving number and the doc now says so.

### Deliberately not done

- **The per-line structure residual is not decomposed.** Escape density, nesting depth, the 2.3M-char
  line — candidates, none tested. Would need a corpus varied in structure at matched lines *and*
  bytes, which this machine may not contain.
- **The union cold browse** — unchanged from Round 155, still arithmetic-not-a-measurement if added.
- **Round 146's arm-S transform re-pin** — **third round carrying this**. It is not getting done
  incidentally. Said so explicitly in the memo rather than listing it a fourth time; it should be
  scheduled or dropped.
- **Whether the two-term form should be pushed back onto the parse path** — handed back to Daedalus
  as explicitly optional. His negative slope falsified the two-term model *solved on two aggregates*;
  a held-out score is the analogous test and might separate "model wrong" from "model fitted wrong".

---

## 15:05 PT — Wrap verification (WORK/MID fire, Round 157)

Per CLAUDE.md Session Wrap Protocol. Run before any "done" claim.

**Suite and typecheck, run by me this fire, not quoted:**

```
server: Test Files 95 passed (95)   Tests 1518 passed (1518)
client: Test Files 18 passed | 13 skipped (31)   Tests 249 passed | 13 skipped (262)
npm run typecheck: clean across @klatch/shared, @klatch/server, @klatch/client
```

Unchanged from this morning's Round 155 figures, which is what should happen — no `packages/` code
was touched.

**`packages/` untouched, verified not assumed:**

```
$ git diff --stat -- packages/
(empty)
```

The probe patches nothing this fire; `session-scanner.ts` sha256 `2ae9ecd1c431` is checked identical
at probe exit anyway, so the claim is verified rather than argued from intent.

**Step 1 — commits on `origin/main`** (after `git fetch origin`):

```
$ git log origin/main --oneline -5
f0eec27 log+coordination: Theseus 9/5 WORK/MID fire — Round 157 ran the byte-matched control on the scan path
517ad49 round157: run the byte-matched control on the scan path -- per-line coefficient survives at ~3.0 ms/1k, and the published 7-10 range excluded it
bdf70ec mail: Theseus -> Daedalus, cc team (ran his byte-matched control on the scan path; ...); close the 9/5 thread
d7320fa log: Daedalus 9/5 WORK/MID — amend wrap block with the merge with Argus and the verified push
4ef72c2 Merge remote-tracking branch 'origin/main' into claude/daedalus-cycle
```

All three of this fire's commits are on `origin/main`. Mail was committed separately and pushed to
`main` first (`bdf70ec`), before the work commit, per the worktree mail rule.

**Step 2 — deliverable files present:**

```
scripts/probe-scan-cost-model-control.mts                             35492 bytes
docs/scan-cost-model-control-2026-09-05.md                            12033 bytes
docs/pm-corpus-cap-delta-2026-09-05.md                                 9625 bytes  (amended: arm H superseded in place)
docs/mail/theseus-to-daedalus-...-came-out-the-other-way-...md          8841 bytes
docs/logs/2026-09-05-1047-theseus-opus-log.md                         (this file)
```

Also committed: `docs/COORDINATION.md` (status → Round 157, Round 155 demoted to prior). Thread
closed per close-discipline: Daedalus's two 9/5 memos and my 9/5 START reply `git mv`'d to
`docs/mail/read/`, since the only item I hand back is explicitly optional. Working tree clean; the
two scratch scripts used for pair-search and the coordination edit were deleted after use, so
nothing lives outside the committed instrument.

**Step 3 — this log is committed and pushed last**, after Steps 1–2 were verified.

Every figure in this entry was measured this fire, three times, except those explicitly attributed:
the 1781 ms and the 7.4 / 9.8 are Round 155's and are labelled as the thing being checked and
corrected; Daedalus's −3.6 to −4.2 parse-path slope and his 11.06× are his, cited not re-derived.
The four deliberate omissions above are recorded as not done, not as done — and the arm-S re-pin is
called out as being in its third round rather than listed a fourth time.

---

## 19:47 PT — STOP fire, Round 159: built the arm-S transform re-pin

**Not a no-op.** Session-start protocol run: pulled (worktree synced by wrapper, HEAD `7d8d12f`),
read `docs/COORDINATION.md`, `ls docs/mail/`. One new memo addressed to this seat since the 14:47
fire: Daedalus's Round 158 reply, `daedalus-to-theseus-cc-janus-iris-calliope-argus-xian-i-took-your-optional-question-and-it-overturned-my-falsification-2026-09-05.md`.
Read in full this fire.

**It contained exactly one open action and it was mine:** Round 146's arm-S transform re-pin, which
I have carried scoped-not-built for three rounds and explicitly asked to have scheduled or dropped.
Daedalus declined to take it unilaterally and offered to take it in a WORK fire if I said so.

**I took the third option and built it.** Round 159.

### What was actually wrong, verified not recalled

`git log afe0889..HEAD -- packages/server/src/import/session-scanner.ts` returns **four** commits:
`4602561` (multi-root), `e1ee197` (headroom correction), `18d4631` (cap ruling), `dba7699`
(fingerprint cache). Arm S restored `afe0889^` wholesale, so a naive `HOIST_COMMIT`→HEAD re-pin
would have A/B'd all five changes and labelled the total "the hoist" — no error, plausible number,
and `dba7699` alone is ~200× the effect under test.

### The mechanism

Arm S now applies the **inverse of the hoist** to today's bytes: 3 edits / 5 textual sites, each
with an asserted occurrence count, plus four post-conditions. Any count mismatch is a refusal, not
a partial patch. `const findChannel = createChannelBySessionIdResolver();` appears **twice
identically** (lines 484 and 616 on disk), so that site is a counted global replace rather than a
unique-string one — checked before writing the transform, not assumed.

**New arm V, which runs before anything is patched:** apply the same transform to `afe0889` and
require byte-identity with `afe0889^`.

```
PASS [V] transform applied to afe0889 reproduces afe0889^ byte-for-byte
         (12,763 bytes, sha256 d31e0352dc26)      — all four runs
PASS [V] disk 2ae9ecd1c431 → transformed c7a5044c5497; 27,373 → 26,784 bytes (−589)
```

The commit pair became a **test fixture for the transform** rather than the source of the patched
bytes. That is the transferable part and it is what I want to remember from this round: when a
controlled A/B's baseline has drifted out from under you, don't re-pin the baseline — derive it, and
use the stale pin to prove the derivation exact.

### Measured — four independent full runs

| seeded channels | pre-hoist warm | hoisted warm | saving | % of warm browse |
|---|---|---|---|---|
| 0 | 19 / 19 / 21 / 20 ms | 7 / 8 / 7 / 7 ms | 12 / 10 / 13 / 13 ms | 56–66% |
| 500 | 69 / 68 / 69 / 68 ms | 8 ms | ~61 ms | 88.2–89.0% |
| 2000 | 222 / 218 / 218 / 220 ms | 9 ms | 212 / 210 / 208 / 211 ms | **95.8–96.0%** |

Warm slope per 1000 channels: pre-hoist **+99 to +101 ms**, hoisted **+0 to +1 ms**.
Cold column at 2000 channels: **8.5–9.4%** of a ~2.25 s browse. Reported as a separate row, not
blended, because "% of browse" is now ambiguous about which browse.

**The framing I corrected in myself while writing it up.** My 9/4 prediction was "under the cache
the dedup scan is nearly all of browse." It measured out at 96%, so the prediction was right — but
the sentence is wrong. The saving is 208–212 ms against Round 146's 224 ms: **the same quantity**.
Round 146's 13.7% and today's 96.0% are both correct on their day. **The cache did not make the
hoist more valuable; it made the hoist's value visible.** A percentage-of-total is a claim about the
*other* work in the total and goes stale when that work is optimised — a different failure mode from
a wrong measurement, and it doesn't announce itself.

### The non-reproduction, reported open

Round 146 isolated **27 ms** of its 224 as a zero-channel floor (one lookup per session *file*).
Re-measured: **12 / 10 / 13 / 13 ms — 0.37–0.48× — on MORE files (528 now vs 508 then).** Wrong
direction for a per-file cost.

The floor is real (positive in all four runs, and 56–66% of the entire warm browse at 0 channels).
Its Round 146 magnitude is **not confirmed**. Best guess is the same visibility effect turned on my
own earlier number — 27 ms was 1.7% of a 1634 ms disk-bound browse and inside that run's variance.
**Not tested**, and "the floor genuinely shrank" is not excluded. Written into the doc as an open
non-reproduction rather than explained away.

Round 146's arm-T annotation on that quantity read *"expect ~0"*. It was never ~0. Corrected in the
probe, not just noted in the doc.

### Checks, suite, source integrity

```
21 checks (9 regression, 12 measurement), 0 failed, 0 skipped
arm U: 528 sessions identical on (sessionId, alreadyImported, existingChannelId), hoisted vs
       pre-hoist; 50 seeded to genuinely match real ids, 50 came back already-imported in both
       — so the identity check is not trivially true

npm test  server 95 files / 1518 passed;  client 18 passed | 13 skipped / 249 passed | 13 skipped
npm run typecheck  clean across @klatch/shared, @klatch/server, @klatch/client
git diff --stat -- packages/   (empty)
session-scanner.ts sha256 2ae9ecd1c431 — identical before and after all four runs
```

The suite run matters more than usual this fire: arm S writes a patched scanner to disk and restores
it in a `finally`. The sha256 check already proves byte-identity; the suite is the independent
confirmation that nothing was left patched.

### Deliberately not done

- **Why the zero-channel floor is half Round 146's** — variance-in-the-denominator vs a real
  reduction. Re-running Round 146's probe at its own commit would settle it, and is cheap. Named,
  not run.
- **The floor on the second corpus** — it is per-*file*; PM has 76 files vs our 528, so the
  prediction is ~7× smaller and falsifiable. Unrun.
- **The union cold browse** — unchanged from Rounds 155/157; still arithmetic-not-a-measurement.
- **Whether ~1.9 s/server-start on PM is acceptable** — xian's, already ruled.

**The arm-S re-pin is off my open list after three rounds of carrying it, and off Daedalus's.**

Deliverables: `docs/hoist-inverse-transform-repin-2026-09-05.md`,
`scripts/probe-browse-endpoint-vs-channel-count.mts` (re-pinned), memo to Daedalus cc
Janus/Iris/Calliope/Argus/xian. Mail committed separately and pushed to `main` first per the
worktree rule.

## 20:0x PT — Wrap verification (STOP fire, Round 159)

Per CLAUDE.md Session Wrap Protocol. Run before any "done" claim.

**Suite and typecheck, run by me this fire, not quoted:**

```
server:  Test Files 95 passed (95)                Tests 1518 passed (1518)
client:  Test Files 18 passed | 13 skipped (31)   Tests 249 passed | 13 skipped (262)
npm run typecheck: clean across @klatch/shared, @klatch/server, @klatch/client
```

Unchanged from this morning's Round 155 and this afternoon's Round 157 figures, which is what should
happen — no `packages/` code was touched. This fire the suite carries extra weight: arm S writes a
patched `session-scanner.ts` to disk and restores it in a `finally`, so a green suite is independent
confirmation on top of the sha256 byte-identity check.

**`packages/` untouched, verified not assumed:**

```
$ git diff --stat -- packages/
(empty)
```

`session-scanner.ts` sha256 `2ae9ecd1c431` checked identical at probe exit on all four runs — the
probe asserts it itself and prints `verified unmodified` before its summary.

**Step 1 — commits on `origin/main`** (after `git fetch origin`):

```
$ git log origin/main --oneline -3
a16da7e round159: build the arm-S transform re-pin -- the hoist is 96% of warm browse, not 13.7%, and the cache is why
7ffbf5a mail: Theseus -> Daedalus, cc team (arm-S re-pin built; the cache made the hoist visible, not valuable)
7d8d12f log+coordination: Iris 9/5 STOP fire — no-op, verified not assumed
```

Both of this fire's work commits are on `origin/main`. Mail was committed separately and pushed to
`main` first (`7ffbf5a`), before the work commit (`a16da7e`), per the worktree mail rule.

**Step 2 — deliverable files present:**

```
scripts/probe-browse-endpoint-vs-channel-count.mts                    36022 bytes  (re-pinned)
docs/hoist-inverse-transform-repin-2026-09-05.md                       9241 bytes
docs/mail/theseus-to-daedalus-...-visible-not-valuable-2026-09-05.md   8091 bytes
docs/COORDINATION.md                                                (status → Round 159, 157 demoted)
docs/logs/2026-09-05-1047-theseus-opus-log.md                       (this file)
```

**Step 3 — this log is committed and pushed last**, after Steps 1–2 were verified.

**Thread state:** left in `docs/mail/` rather than moved to `read/`. Daedalus's Round 158 memo and my
reply both stay visible, because my reply hands back a live loose end — the 27 ms floor
non-reproduction is against one of *his* team's recorded numbers and he may want it. The single open
action that reopened the thread (the arm-S re-pin) is closed by having been built.

**Provenance discipline for this entry:** every figure is from this fire's four runs of the
instrument, except Round 146's 1634 / 1409 / −224 ms / 13.7% / 27 ms / 508 files, quoted from
`docs/dedup-hoist-at-the-endpoint-2026-09-03.md` and labelled as the thing under test, and
Daedalus's 198.5 → 4.1 ms unit claim (`afe0889`), cited not re-derived. The two
Round-146-comparison checks were added after run 3 and appear in run 4 only — but they are computed
from `savedAtK` / `savedAtZero`, which were recorded in all four runs, and all four values are
listed. The four items under "Deliberately not done" are recorded as not done, not as done.

---
