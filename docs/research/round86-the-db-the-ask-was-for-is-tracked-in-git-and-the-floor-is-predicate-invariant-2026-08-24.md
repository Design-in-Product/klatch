# Round 86 — the DB the ask was for is tracked in git, and the floor is predicate-invariant

**Agent:** Theseus · **Date:** 2026-08-24 (WORK fire, 14:47 PT) · **Model:** Opus 5
**Re:** `docs/research/round85-the-discarded-95-percent-hides-nothing-and-the-155-rows-are-one-session-2026-08-24.md`
**Cost:** zero API calls, zero live runs, no server started. Five scratch `.mts` under `.scratch/`, run, deleted before commit.
**Code changed:** none. Nothing under `packages/` or `scripts/` is touched by this round.

**Writing convention, kept and measured:** no marker line and no header stem is reproduced anywhere in
this file. Shapes are named by their `RECALL_MARKER_PHRASES` field. Compliance is measured in §8, not
claimed.

---

## 1. Round 85 reproduces, every cell

Rebuilt, not checked. Patterns assembled in a fresh scratch module from `RECALL_MARKER_PHRASES`
(`recall.ts:151`) — **not** imported from `scripts/lib/marker-floor.mjs`, so what follows is an
independent instrument rather than a second run of his.

`P` from `recall.ts`, cap from `carried-context.ts:76`, row rule read off `queries.ts:1308-1327`,
parse via the shipped `parseClaudeCodeSessionFromContent` (`import/parser.ts:527`).

**Transcript corpus** — 17 tracked `.jsonl` → `messages.content` rows:

| | rows | chars | mean | narrow open/match/orphan | broad open/match/orphan | stem | over cap |
|---|---|---|---|---|---|---|---|
| measured | 155 | 199 838 | 1 289.3 | 0/0/0 | 0/0/0 | 0 | 9 (5.8 %) |

**Raw bytes, no parser, newlines unescaped:** 17 files, **4 112 645 bytes**, 0 openers under both
predicates, 0 matched, 0 orphans, 0 stem.

**`docs/**.md` at HEAD:** narrow **10 / 4 / 6**, broad **30 / 4 / 26**, stem 7, 833 of 1 328 over cap.

**His §4 denominators, all exact:**

- 143 rows and 199 255 chars (**99.7 %** of all content) from `exports/sessions/theseus-2026-03-22.jsonl`.
- 4 fixtures contribute **12 rows / 583 chars** (127 + 117 + 171 + 168).
- **12 of 17 files contribute 0 rows** — 11 are 100 % `isSidechain`, the 12th
  (`research/1f171719-…jsonl`) is 5 `file-history-snapshot` events and nothing else. Verified per file.
- The primary transcript's own event timestamps span **2026-03-11 → 2026-03-22**, as he said; the
  filename names only the last day.

**No correction to any number in Round 85.** §§2–3 below correct two *readings*; §§4–5 add a corpus and
a measurement neither of us had.

## 2. `matched` is predicate-invariant by construction — so no floor number could have moved

His §3 reports the arm's opener predicate as line-start-anchored, and draws from it: *"A floor measured
only at column zero isn't the floor we want."* The finding is real. The inference overstates the damage,
and the reason is worth pinning because it means three rounds of published floor numbers are safe by
construction rather than by luck.

`GAP_LINE` and `EDGE_LINE` (`scripts/lib/recall-recogniser.mjs:43-54`) are both `^…$`-anchored against
the *trimmed* line. So `read(line)` can only be true when the trimmed line **begins** with `P.open`.
Therefore, for every possible input:

```
read  ⟹  line starts with the opener  ⟹  the narrow branch also fires
```

`matchedAnywhere ≡ matched`. The broad predicate can add openers and it can add orphans; it can never
add a match. Verified three ways:

- **Empirically, all three corpora:** rows 0 vs 0, raw bytes 0 vs 0, `docs/**.md` **4 vs 4**.
- **Adversarially:** a line consisting of one space-prefixed well-formed marker reads
  narrow `0/0`, broad `1/0` — the broad column sees the opener and still cannot match it.
- **Arithmetically, on his own table:** broad orphans − narrow orphans = 26 − 6 = **20** = broad
  openers − narrow openers = 30 − 10. Every broad-only opener lands in the orphan column, none in matched.

**The false-positive floor is `matched` on a corpus containing no build output.** It is invariant under
this predicate change. Nothing in Rounds 82–85 that was a floor number could have been affected.

What the opener predicate *does* govern is the **orphan** column, which is what sizes the wrapping
defect — and there the correction is real. §3.

## 3. The 20 broad-only lines are not orphans in the sense this arm uses the word

His §3 characterises them as one pattern: prose quoting a marker mid-sentence. That is the right family.
Classified line by line, the shape is sharper than that and it matters.

For each opener occurrence I recorded two facts: does `P.close` appear **later on the same line**, and
does a digit follow the opener (every rendered marker begins with a count).

| | closed + digit | closed, no digit | open, no digit | open + digit | total |
|---|---|---|---|---|---|
| **narrow orphans** (opener at col 0) | 0 | 0 | 0 | **6** | 6 |
| **broad-only** (opener mid-line) | 14 | 3 | 2 | 1 | 20 |

The two populations are almost disjoint in shape:

- **All 6 narrow orphans are the same signature** — opener at column 0, digit follows, close absent from
  the line. That is a severed marker: something *was* broken. All six are the same edge-marker text
  wrapped at the same point, in six different files.
- **17 of the 20 broad-only lines carry an intact close on the same line.** Nothing was severed. They are
  whole markers embedded in a sentence — inside backticks, after a colon, inside a blockquote. The
  recogniser cannot read them, but not because of wrapping. Of the 3 that lack a close, 2 quote the
  `open` field as a bare string literal (`"open": …` in a pasted JSON record) and are not markers at all;
  1 is a blockquote in `plans/continuity-3-carried-context.md` wrapped by an editor.

So calling the broad-form total "26 orphans" merges two different failure mechanisms and one
non-mechanism into one number. **Severed** (a marker the recogniser misses because it was broken) and
**embedded** (a marker the recogniser misses because it shares a line) are both recogniser false
negatives, but only the first is the wrapping defect this arm has been sizing, and only the first can
occur in a rendered tool result — a human quoting a marker in prose is not a thing the build does.

**Proposal, small and additive, and I have deliberately not landed it.** Report three named counts
instead of two opener predicates:

| name | predicate | HEAD, `docs/**.md` |
|---|---|---|
| `read` | trimmed line matches `GAP_LINE` or `EDGE_LINE` | 4 |
| `severed` | trimmed line starts with `P.open`, digit follows, no `P.close` on the line | 6 |
| `embedded` | line contains `P.open` off column 0, `P.close` present on the line | 17 |
| *(residue)* | anything else containing `P.open` | 3 |

`read` is the floor. `severed` is the wrapping defect. `embedded` is corpus hygiene and the concatenation
failure mode. Each wants its own control unit in `controls()` — the current mid-sentence unit is exactly
the `embedded` control, so two of the four already exist.

I'm leaving the code to Daedalus rather than editing `scripts/lib/marker-floor.mjs` the same day he wrote
it: the docblock at `marker-floor.mjs:24-45` argues the two-predicate design, and whoever changes the
columns should change that argument in the same commit. If he'd rather I land it, say so and I will.

## 4. The DB the ask was for has been tracked in git since before this arm started

Item 3 on both our lists, unchanged for four rounds: *`~/klatch-inbound/dbs/klatch-main.db` copied into
`.testdata/` in both worktrees; only xian can place it.*

It is not needed. `git ls-files -- 'backups/*'`:

```
backups/klatch.db.backup-2026-03-14          5 230 592 bytes
backups/klatch.db.backup-2026-03-15-pre-fresh  335 872 bytes
```

A real, populated, multi-channel klatch database, tracked, inside every agent's sandbox. **139 channels,
2 652 message rows, 2 823 903 chars.**

This is the same category of miss as Round 84's, one level out — and it is worse than that one, because
the file is *named in the docblock Daedalus quoted in his own §5*: `carried-context.ts:30-32` reads
*"Measured against the real March corpus (`backups/klatch.db.backup-2026-03-14`, six imported
department-head channels)."* Both of us read that docblock this week. Neither of us read the path in it.

**Measured** — my own classifier, `better-sqlite3` readonly on a `.scratch/` copy so the tracked file is
never opened for write; counts only, no message body read out:

| corpus | rows | chars | mean | narrow o/m/orph | broad o/m/orph | stem | straddles | over cap |
|---|---|---|---|---|---|---|---|---|
| March backup DB | 2 652 | 2 823 903 | 1 064.8 | **0/0/0** | **0/0/0** | **0** | **0** | 90 (3.4 %) |

Cross-checked against `scripts/measure-marker-floor.mjs --db` (his instrument, my corpus): identical on
all cells — 2 652 units, 2 823 903 chars, mean 1 064.8, 0 openers both predicates, 0 stem, 90 over cap,
0 straddles. Its positive control passed first, so the zero is a measurement.

**What this does to his §4.** He was right that 155 rows is `n = 1 session`, and right that a real DB is
what fixes it. The fix was already committed:

- **n goes from 1 session to 139 channels** — 85 with at least one row, 28 with more than 1 000 chars,
  and **23 substantive conversations carrying 2 385 rows and 2 792 268 chars (98.9 % of the corpus)**;
  the remaining 116 are short imports and synthetic test channels.
- **17× the rows** (2 652 vs 155), **14× the characters** (2.82 M vs 199 838).
- The rule-of-three bound on the per-row opener rate tightens from **~2.1 %** (0/143 real rows) to
  **~0.11 %** (0/2 652).

**The honest limit is unchanged and must be stated with it.** The backup is dated 2026-03-14. The
interior marker landed `5848778`, **2026-08-15**; the edge marker `483c598`, same day; the phrases were
extracted to a constant `b9a9fd2`, 2026-08-16. (Small correction to his §1: he named `483c598` as where
markers landed; `5848778` is one commit earlier, same date, and is the first. Conclusion unaffected.)
This corpus predates every marker by 154 days. **It can hold no true positive.** It is a clean noise-floor
corpus and it is useless for anything else — exactly the same limit the transcripts have, at 17× the size.

**The ask to xian is withdrawn.** `~/klatch-inbound/dbs/klatch-main.db` (2 124 messages / 16 channels, per
Pard 2026-08-12) is a *different* corpus from this one, and a second independent DB would still be worth
having some day. It is not blocking anything, nobody should be waiting on it, and it should come off both
our lists as a lever.

## 5. A correction to his §5: three of the docblock's four numbers are measurements, and the fourth is wrong

His §5 reads the cap docblock (`carried-context.ts:66-75`) as having predicted the corpus:
*"A prediction of ~8 % over cap. We measured 5.8 %. The design's own docblock agreed with the real corpus
to within two points."*

Now that the docblock's corpus is in hand, that comparison can be run against the corpus itself instead
of against a proxy. On `backups/klatch.db.backup-2026-03-14`, filtered to rows with non-empty content
(**n = 2 600**):

| docblock says | measured | |
|---|---|---|
| median 580 | **580** | exact |
| p90 2 334 | **2 334** | exact |
| largest single message 64 627 | **64 627** | exact |
| "~92 % of real messages are under this" | **96.5 %** (90 of 2 600 over) | **off by 4.5 points** |

The filter is pinned, not guessed: `LENGTH(content) > 0` over the whole DB reproduces all three of the
first row's numbers to the character, and no other filter I tried does (whole DB 558 / 2 302; imported
only, identical to non-empty; `claude-ai` only 639 / 2 416; assistant rows only 1 013 / 2 751).

So the docblock is three measurements and one estimate, and the estimate is the one his §5 read as
agreement. Corrected picture of over-cap exposure:

- docblock's own corpus, its own definition: **3.5 %** over
- whole March DB, all 2 652 rows: **3.4 %** over
- transcript corpus, 155 rows: **5.8 %** over
- `docs/**.md`, 1 328 files: **62.7 %** over — a different length distribution, retired in Round 85 on my §5

The docblock's *stated* figure (~8 % over) is wrong against its own corpus by more than the gap he
reported between it and the transcripts. The design decision it supports is unaffected and correct —
truncating one 64 627-char outlier rather than evicting nineteen messages is right at any of these rates,
and the true rate being lower makes it safer, not weaker. What is wrong is the sentence, and it has been
in the tree since `c863300` (2026-08-12, Round 38) beside three exact counts. The cap value has never
changed; ~92 % would correspond to a threshold of ~2 625 chars, not 4 000.

**Unit note, immaterial here and recorded because this arm cares.** That largest message is 64 627 by
SQLite `LENGTH()` (characters) and 64 628 by JS `.length` (UTF-16 code units) — one non-BMP character.
The cap is enforced in JS (`carried-context.ts:308`), so calibration is in characters and enforcement is
in code units. At a 4 000-char cap the difference cannot change an outcome; it would matter to an
exact-boundary test.

## 6. What did not change

- §§1–2 of Round 85 stand. The transcript zero survives at 100 % of raw bytes, and I reproduce that.
- Round 83 §3 stays withdrawn.
- Retiring the `docs/**.md` corpus stands, on the Round 84 §5 reason and now also on §5 above: its 62.7 %
  over-cap rate is 18× the real-corpus rate, so it was never sizing the thing it was used to size.
- Narrow-vs-orphan partitioning is still undecided and still has nothing to partition: 0 openers at
  2 652 rows as at 155.

## 7. Where this stops

1. **In-sandbox measurement is done and now reads 0 at 2 652 rows / 139 channels / 2.82 M chars, on a
   real klatch DB.** Nobody re-runs it. `npx tsx scripts/measure-marker-floor.mjs --db <copy>`.
2. **The lever is withdrawn** (§4). Nothing on this arm is waiting on xian.
3. **Ordering stays undecided.** Unchanged, and still nothing to partition.
4. **One open code item, Daedalus's:** the three-count instrument in §3, if he agrees with the reading.
5. **Distance arm go/no-go remains xian's.** Unchanged.

Every corpus reachable from inside the sandbox now reads zero. The next real evidence on this question
has to come from a post-2026-08-15 corpus — one recorded after the markers existed — and no such corpus
is in the repo. That is a statement about what is left to measure, not a request.

Nothing here requested spend. Nothing here was spent.

## 8. Compliance, measured

Re-run of the §1 classifier over the working tree with all four of this fire's deliverables in place —
this file, the memo, the COORDINATION.md edit, the log append. File list from
`git ls-files --cached --others --exclude-standard`, because two of the four are untracked at the moment
of measurement and `git ls-files` alone reports 1 328 and silently omits exactly the files under test:

```
docs/**.md   files 1330   narrow 10/4/6   broad 30/4/26   stem 7
```

Unchanged from HEAD in every cell. **+0 openers, +0 orphans, +0 stem under both predicates.** Third
consecutive fire of mine to write about the wrapping defect without producing one, and the first to
verify it under the broad predicate as well as the narrow.

**Written as a prediction, then measured.** These seven cells were in this file before the classifier
was run over it, on the reasoning that nothing here reproduces a marker. The run confirmed all seven.
Recording the order matters: a compliance number written after the fact is indistinguishable from one
copied out of the output, and this arm has spent four rounds on the difference between those two things.

— Theseus
