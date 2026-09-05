# Daedalus session log — 2026-09-05

Model: Opus 5 · Worktree: `/Users/xian/Development/klatch-worktrees/daedalus` · Branch: `claude/daedalus-cycle`

---

## 09:17 PT — START fire. Round 154: the 9× decomposed, one no-op refused, one real copy removed.

**Briefing.** Pulled clean at `6f373bd` (Argus's 9/5 START). Read `docs/COORDINATION.md`,
`docs/briefs/cross-pollination/current.md`, and `docs/mail/`. **One new memo since my last fire**
(mtime 09:17 today), addressed to me: Theseus's Round 153 cold-figure-gap close. Read and answered
in this fire. No other mail newer than 9/4; the 9/4 items were answered in my 9/4 WORK and STOP
fires.

**Cross-pollination note taken, not just read.** Today's brief carries my own Round 147/151 work
back to me via Theseus, and names the discipline: *verify a patch took effect by an observable
outcome, not by the file having changed*. Arm F below applies it — `file.size` is compared against
an actual `arrayBuffer().byteLength` on a real multipart File rather than taken from the spec.

**Work unit chosen.** The single item I listed as open-and-mine at the end of Round 151, and which
Theseus re-flagged as still mine in the memo that arrived this fire: *the 9× accepted-multipart
cost*. Round 151 recorded "an accepted 45.3 MB upload peaks at 419.2 MB (9.25× the file)" with no
attribution attached.

### What I did

Built `scripts/probe-accepted-multipart-allocation.mts` — each stage of the route's multipart branch
run to a different stopping point **in a fresh child process**, because the V8-heap-sizing confound
(Theseus Round 150; me, from the other side, Round 151) makes shared-process decomposition
meaningless. Two method upgrades over Round 151: `process.resourceUsage().maxRSS` instead of 25 ms
RSS sampling (exact high-water mark, no "lower bound" hedge needed), and an arm Z that **calibrates
the maxRSS unit against a known 200 MB allocation** before any figure is believed — it is kilobytes
on this machine, and assuming bytes would have scaled everything by 1024.

**Decomposition, 45.3 MB payload:**

```
readFileSync (floor)                     46.2 MB   1.02x
+ req.formData()                        155.3 MB   3.43x   +2.41x
+ file.arrayBuffer()                    248.0 MB   5.47x   +2.02x
+ Buffer.from(ab).toString() — route    292.9 MB   6.47x   +1.02x
+ parseClaudeCodeSessionFromContent     389.7 MB   8.60x   +2.13x
```

8.60× in-process reconciles with Round 151's 9.25× and today's live re-run at 9.38× (the server
figure adds request handling and the DB write). **No single stage owns the multiple** — four stages
of roughly 2× each.

**The obvious fix is worth nothing, and that is a deliverable.** `file.size` + `await file.text()`
in place of `arrayBuffer()` + `byteLength` + `Buffer.from().toString()` measured at **−0%, +1%, −0%**
across three runs; the sign flips, so it is noise. `file.text()` does the same arrayBuffer and the
same decode internally, and `Buffer.from(arrayBuffer)` is a *view*, not a copy — there was never a
copy there to remove. Filed as a negative result rather than deleted, because it is exactly the
change a future fire would ship in ten minutes and label "reduced allocation."

**What is genuinely available, with the detail that decides how to read it.** Streaming the File
after `formData()` reached 5.41× vs the route's 8.60× — 37% of the peak. But the arm counts chunks
and reports **`1 chunks`**: `File.stream()` hands over all 45.3 MB at once. It is a copy wearing a
stream's interface, so the 37% is the string and parse allocations, not the buffer copy. 5.41× sits
2.02× above `formData()`'s own 3.40× — exactly the arrayBuffer marginal. **No File-level rewrite
gets below 3.40×.** Not started; it needs a request-level change.

### Shipped

`rejectOversizeFile(c, file)` at all four multipart sites. Round 151's `rejectOversizeBeforeRead`
deliberately falls through when `Content-Length` is absent or malformed; on that path every site
spent a full second copy on `await file.arrayBuffer()` to learn a byte count `file.size` already
had, and then refused. Arm F: **249.0 MB refusing after the copy vs 158.6 MB refusing before it —
90.4 MB, more than two full copies of the file, spent to reject it.**

Nothing about what size is allowed changed. Same threshold, same message, same status.

**A slip I caught in-fire rather than shipping.** My first arm-F check formatted the equality result
as `size=… byteLength=… equal=…`, which the child's 40-char sink truncation cut off mid-word — the
check read `equal=` and failed against numbers that were in fact identical. A green-looking
truncation would have been worse than the red one I got. Shortened the field and raised the cap to
120.

### On the tests, stated so nobody over-reads them

6 new tests in `round154-cap-checks-file-size-not-the-copy.test.ts`. They pin the **decision**, not
the improvement: an over-cap file with no Content-Length is still refused, still 400, still with the
file-measured message rather than Round 151's envelope-measured "MB uploaded". **They would also
pass against the old code.** The memory saving is arm F's to own — it is not assertable in vitest and
I am not implying it is. Said the same thing in the memo and in the test's header comment.

### Both probes failed on their own success

Round 151's arm A asserted *"every multipart site buffers before it checks"* — the defect it existed
to expose — and went red the moment the fix landed. My own Round 154 arm A did the same an hour
later, asserting the route reads `byteLength`. Both now recognise either shape and **report which
build they are measuring**, while still failing if they find neither (the case that means the cap
check has gone missing). A static arm that pins today's code as correct-by-definition turns into a
tripwire against its own recommendations.

### Measured, not asserted

- `npm test`: **1518/1518, 95 files** — from 1512/94, my 6 tests, no regressions
- `npm run typecheck`: clean across shared, server, client
- `scripts/probe-accepted-multipart-allocation.mts`: **28 checks, 0 failed, 0 skipped**
- `scripts/probe-import-multipart-cap.mts` (Round 151, live server, re-run after the change):
  **22 checks, 0 failed, 0 skipped** — over-cap still refused at 0.0 MB; accepted upload unchanged
  at 9.38×
- `klatch.db` never opened by either probe; both byte-compare `routes/import.ts` before and after

### Open, and explicitly not guessed at

- `formData()`'s own 3.40× — needs a request-level change. Not scoped, not costed, not claimed easy.
- The 2.13× inside `parseClaudeCodeSessionFromContent` — measured as a total, not decomposed.
- **Synthetic-payload caveat:** every figure here is a function of byte count *except* the parse
  arm, whose 2.13× is for 42,411 single-line events. A corpus heavy with tool artifacts could parse
  to a different multiple. Not measured.
- Whether ~420 MB peak at the 50 MB cap matters in practice. Nobody has said it does; I priced it so
  the decision can be made on numbers, and I am not asserting it needs reducing.
- Not mine, from Theseus's list, untouched: the transform-based arm S re-pin, and the
  `~/.claude-pm/projects` cap delta.

### Wrap verification

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -3
fee2f35 round154: check the import cap on file.size, ahead of the copy
3c29aaa mail: Daedalus -> Theseus, cc team (the 9x decomposed; the obvious fix is a no-op; ...)
6f373bd log+coordination: Argus 9/5 START fire — Round 152 turnCount swap verified
```

**Step 2 — deliverables (`ls`, this session):** verification block committed with this log.

**Step 3 —** mail committed separately (`3c29aaa`) and pushed to `main` *before* the code commit,
per worktree mail discipline. Theseus's inbound moved to `docs/mail/read/` in the same commit — the
cold-figure-gap thread is closed and acked on my side.

**Delivery:** not claimed beyond what the pushes show. The wrapper owns delivery.

---

## 13:17 PT — WORK/MID fire. Round 156: the parse stage decomposed, and my own Round 154 headline corrected 27% upward.

**Briefing.** Worktree synced by the wrapper to `ade796e` (Calliope's 9/5 MID). Read
`docs/COORDINATION.md` and `docs/mail/`. **One new memo addressed to me** since my 09:17 fire:
Theseus's Round 155 PM-corpus cap delta (mtime 13:17 today). Read and answered in this fire.

**Work unit chosen.** Both items I listed as open-and-mine at the end of Round 154 — the undecomposed
2.13× inside `parseClaudeCodeSessionFromContent`, and the synthetic-payload caveat I filed against my
own figure. They are one question asked twice (is parse cost per line, per byte, or per something
else), so I took them together. Theseus's arm-H question is the same question on a neighbouring path,
which is why the answer to him falls out of the same instrument.

### What I built

`scripts/probe-parse-stage-allocation.mts` — 54 checks, 13 regression / 41 measurement, 1 failed
**by design**, 0 skipped. Method inherited from Round 154 and not re-litigated: one stage per fresh
child process, `maxRSS` calibrated by arm Z against a known 200 MB (kilobytes here).

**The control Round 154 didn't have:** two payloads at *identical byte count* (37,117,377 B) and very
different line shape — the largest real session under the cap (14,049 lines, 2,642 B/line, longest
line **945,942 chars**) and Round 154's synthetic truncated to match it byte for byte (33,140 lines,
1,120 B/line). Plus a third payload for arm G: the synthetic with **three ASCII bytes overwritten by
the three UTF-8 bytes of `…`** — same size, same JSONL, one character different.

### Findings

**1. My Round 154 headline was 27% low for real inputs.** Arm R re-drives Round 154's *own child
stages, unmodified*, at both payloads — a measurement, not arms added across rounds. Route pipeline:
real **11.06×** vs byte-matched synthetic **8.73×**. The synthetic reproduces Round 154's published
8.60× to 1.5% at a different payload size, so the decomposition wasn't wrong — it was
unrepresentative, exactly as the caveat said. Parse marginal: real **3.48×** vs synthetic **2.16×**
(against Round 154's published 2.13×), **61% apart**.

**2. The cause is one character.** The corpora are identical through `formData()` (3.66/3.61×) and
`arrayBuffer()` (5.66/5.67×) — those handle bytes — and diverge at the first stage that makes a JS
string (`bufferToString`, 7.58 vs 6.57×, **+1.01×**). V8 stores a string one byte per char only if
every char is Latin-1. Arm G: the three-byte `…` edit moves the content floor 135.5 → 171.0 MB,
**+35.5 MB on a 35.4 MB payload, 1.00×**, accounting for 100% of the floor gap.

**3. It's the common case.** Scanned `~/.claude/projects` this fire: **519 of 523 sessions (99.2%),
100.0% of corpus bytes** contain a char above U+00FF. My pure-ASCII synthetic was the unusual input.

**4. The 2.13× is object graph, and there's no copy in it.** `split('\n')` adds **31–56 B/line** —
references, not a character copy (which would be 35.4 MB). `.trim()` on already-trimmed lines is
free. **~85% of the stage is `JSON.parse`'s object graph, ~15% is `parseEvents`.** Same conclusion as
Round 154's `file.text()` no-op reached from the other end: there was never a buffer copy here.

**5. Theseus's arm H — answered, and not the way he asked.** His two corpora varied in lines and bytes
together; mine are equal in bytes, so the per-byte term cancels and `dMs/dLines` *is* the per-line
coefficient. It comes out **negative, −3.6 to −4.2 ms per 1k lines across four runs** — at equal bytes
the corpus with *fewer* lines is *slower*. A cost coefficient cannot be negative, so lines+bytes is
**falsified, not imprecise**. Told him to keep arm H and relabel the usable form with the line-size
bracket it was validated in, rather than cut it back.

**I built the wrong answer first and threw it away.** I fitted a two-term model to his two corpora:
it solves to ~4.0 ms/1k lines + ~1.9 ms/MB, reproduces both his figures exactly, and explains the
opposite-direction bracketing. Two equations, two unknowns — **zero residual by construction, no
predictive content.** I was going to send it as the answer. The controlled experiment then gave the
wrong sign. Recorded in the memo because a confident pair of coefficients would have been worse than
his honest range.

### The candidate, measured and deliberately not shipped

`parseJsonlContent` via `indexOf`/`slice` instead of a materialised split array: **18% faster on the
real corpus, 3 runs each, ranges fully separated** (134/135/135 → 108/111/112 ms), reproduced across
two independent repeat batches. **Memory ~1%, and I am not quoting the 5% the mean implies** — two of
three runs sit 1.2% under, the third is a 12% outlier I can't explain and didn't reproduce.

Not shipped: 18% of a 205 ms parse stage is ~37 ms on a multi-second import, ~1%, which doesn't
justify touching a correctness-critical parser. I verified event-count and skipped-line equality on
both payloads; **structural deep-equality I did not check**, and it would need to be first.

**Repeats earned their keep.** My first *unrepeated* memory sample was −12.3%, the next −0.9%. That is
the Round 154 no-op trap exactly, and the arm now takes repeats and reports the spread.

### Two method slips I caught in-fire rather than publishing

- **Absolute peaks instead of deltas.** The first run reported raw `maxRSS`, putting the content floor
  at **6.97×** — caught only because a floor cannot exceed ~2×. ~140 MB of tsx baseline was sitting
  inside every stage. Every figure is now `peak − baseline`, which is also Round 154's convention, so
  the rounds are comparable.
- **An unattributed dynamic-import confound.** Stages that `import` the parser carried a compile cost
  stages without it did not. Now sized by two arms rather than assumed away: empty stage 0.5–0.6 MB,
  import a further ~1.0 MB — ~0.4% of the smallest figure here.

### Arm A, and the probe that fails on purpose

Arm A **reports** which line-iteration shape is in the tree and fails only if it recognises neither —
because `scanNoSplit` is a candidate to replace the very line it inspects, and Round 154 watched both
its own arm A and Round 151's go red the moment their recommendations shipped.

**The probe exits 1 while arm D's check fails, and that is the finding.** Written as a failing check
so a future reader can't skim past it, with an explicit note on the exit code. If a later corpus makes
that slope positive, the check going green is itself the news.

### Measured, not asserted

- `npm test`: server **1518/1518, 95 files**; client **249/249, 13 skipped** — both unchanged from
  Round 154, as expected: `packages/` untouched
- `npm run typecheck`: clean across shared, server, client
- `scripts/probe-parse-stage-allocation.mts`: **54 checks, 1 failed by design, 0 skipped**
- `git diff --stat ade796e..HEAD -- packages/` — **empty**; full diff is 3 files, `docs/` + `scripts/`
- `klatch.db` never opened; `parser.ts` full-content-compared byte-identical before and after

### Open, and explicitly not guessed at

- **`formData()`'s own 3.6×** — unchanged from Round 154, still needs a request-level change. Not
  scoped, not costed, not claimed easy.
- **Why `scanNoSplit` is 18% faster on real and ~0% on synthetic** — measured, not explained. The
  946k-char line is the obvious suspect; untested.
- **Structural deep-equality for `scanNoSplit`** — required before it could ship. Not done.
- **The ~65 MB constant in the `readFileSync` content floor** — identical on both payloads, cancels in
  every comparison, not decomposed. Probe-local; arm R is the route's.
- **Whether a two-byte content string is avoidable at all** — the route needs a JS string to split on.
  Decoding per line off the `Buffer` would keep most of the payload one-byte, but that is the same
  request-level rewrite as `formData()`. Not measured.
- **Whether ~390 MB for a real 35 MB import matters.** Priced, not judged — xian's call. The 50 MB
  cap's implied ~550 MB is a **linear extrapolation**, and the largest real session on this machine is
  35.4 MB, so 50 MB is above anything actually present in 549 MB of corpus.
- Not mine, from Theseus's list, untouched: **Round 146's arm-S transform re-pin**.

### Wrap verification

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -3
c156512 mail: Daedalus -> Theseus, cc team (my own 9x was 27% low for real corpora; ...)
ade796e rollup+coordination+log: Calliope 9/5 MID fire -- v103, Round 154/155 ...
b26cc8e log+coordination: Theseus 9/5 START fire — Round 155 PM-corpus cap delta measured
```

Mail pushed to `main` first, per worktree mail discipline (`c156512`). The Round 156 probe + doc
commit (`d734c5b`) and this log/coordination commit are local at the time of writing; **the wrapper
owns delivery and I am not claiming they landed.**

**Step 2 — deliverables (`ls`, this session):**

```
$ ls scripts/probe-parse-stage-allocation.mts docs/parse-stage-allocation-2026-09-05.md \
     docs/mail/daedalus-to-theseus-cc-janus-iris-calliope-argus-xian-my-own-9x-*.md
scripts/probe-parse-stage-allocation.mts
docs/parse-stage-allocation-2026-09-05.md
docs/mail/daedalus-to-theseus-cc-janus-iris-calliope-argus-xian-my-own-9x-was-27-percent-low-and-your-bracket-is-a-broken-model-2026-09-05.md
```

**Step 3 —** Theseus's inbound and my reply **left in `docs/mail/`, not moved to `read/`**: my ask
from his memo is discharged, but my reply puts a decision back on him (the arm-H relabel), so the
thread has an open action and shouldn't drop off the active list. His to close.
