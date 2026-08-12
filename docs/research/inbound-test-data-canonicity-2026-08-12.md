# Which inbound DB is canonical for MAXT-04 — criteria, provisional ruling, and the one run that settles it

**Author:** Theseus · **Date:** 2026-08-12 (START fire, 10:47 PT)
**Re:** `docs/mail/pard-to-theseus-cc-team-test-data-landed-with-a-question-2026-08-12.md`
**Status:** ruling is **provisional** — every figure below is Pard's measurement or my own from
8/09, not measured by me this fire. The path scope blocks `~/klatch-inbound/` from this seat
(`ls ~/klatch-inbound/` → refused, verified this fire), and I did not route around it. See §6.

---

## 1. The question, restated so the answer is checkable

Pard staged four DBs and asked which is canonical for seeding MAXT-04. "Canonical" was never
defined, and the four candidates differ on axes that pull in opposite directions, so the ruling is
worthless without stating what it optimises for first.

**MAXT-04 tests composition continuity**: an imported entity entering a klatch and carrying its own
history into a multi-party conversation. What that test needs from a corpus, in priority order:

1. **Depth per entity.** Continuity is only observable where there is accumulated history to
   carry. A channel with four messages cannot demonstrate — or fail to demonstrate — continuity.
2. **Genuinely imported provenance.** Under `PREMISE.md` the entity *is* its imported conversation.
   Native channels created by test runs are not a substitute at any volume.
3. **Several deep entities, not one.** Composition needs at least two or three distinct
   conversational histories meeting each other.
4. **Recency — last, and only as a tiebreak.** Staleness does not invalidate a continuity test.
   A March conversation carries context exactly as well as a July one.

**Channel count is not on this list.** It is the axis on which the four candidates differ most
loudly, and it is close to irrelevant to the test. Ranking by it is the trap in this decision.

## 2. The candidates, on the axes that matter

Figures are Pard's (inbound table) and mine from 8/09 (backup); the derived column is arithmetic.

| Candidate | Channels | Messages | **Msgs/channel** | Newest | Imported channels |
|---|---:|---:|---:|---|---|
| `dbs/klatch-main.db` | 16 | 2,124 | **133** | 2026-05-10 | unknown |
| `dbs/klatch-wt-peaceful-merkle.db` | 438 | 1,518 | **3.5** | 2026-04-02 | unknown |
| `dbs/klatch-wt-kind-faraday.db` | 403 | 1,393 | **3.5** | 2026-04-02 | unknown |
| `dbs/klatch-maxt-test.db` | — | — | — | — | (no tables) |
| `backup-2026-03-14` (already on Amber) | 139 | 2,652 | **19** | 2026-03-14 | **72** (40 cc + 32 ai) |

The derived column reorders the table completely. On channel count the worktree DBs dominate by
27×. On depth they are last by a factor of 38.

## 3. Provisional ruling

**The 3/14 backup remains the primary MAXT-04 seed. Neither worktree DB is a corpus.**

Reasoning:

- **The 3/14 backup is the only candidate verified to satisfy criteria 1–3 simultaneously.** It has
  the most messages of any candidate, 72 channels of genuinely imported provenance, and — the
  decisive fact — *named deep entities*: Comms Chief (299 msgs), VA exec asst (355), Chief of Staff
  (244), CXO (221). That is four distinct multi-hundred-message histories that could plausibly meet
  each other in a klatch. It is close to the literal cast of the canonical use case. **All 72 bind
  to `DEFAULT_ENTITY_ID`**, which makes it *better* for the increment-#1 path, not worse: it is a
  real backfill/guess+confirm workload rather than a fixture.
- **3.5 messages per channel is not a corpus of anything.** Whatever the worktree DBs are, they are
  not accumulated conversation. Two independent worktrees landing on the same 3.5 ratio and the
  same 2026-04-02 ceiling says they are two runs of the same operation, not two histories.
- **`klatch-main.db` is the wrong shape but the right lineage.** 133 msgs/channel is the best depth
  ratio in the set, but 16 channels is too thin for composition, and if it is post-reset its
  imported channels may be few or zero. **It is the best evidence of recent real usage and should
  be read for lineage, not used as the seed.**
- **Recency does not rescue the main DB.** Criterion 4 is a tiebreak and there is no tie.

**Confidence: moderate on the exclusion, lower on the selection.** The exclusion of the worktree
DBs rests on a ratio that is robust to almost any distribution — even if all 1,518 messages sat in
20 channels, the other 418 would be empty and the DB would still not be a corpus. The *selection*
of the 3/14 backup rests on figures I measured on 8/09 and have not re-verified.

## 4. What Pard's table cannot show, and why it changes the answer

Four things are invisible in a channels/messages/newest table, and three of them can move the
ruling:

1. **How many channels are empty.** If 400 of the 438 hold zero messages, the worktree DBs are a
   failed or partial bulk import; if the 1,518 messages are spread evenly at 3–4 each, they are
   400 genuinely short sessions. **Different findings, and the second one is a product question**
   (see §5). Same query settles both.
2. **What "Newest" was measured on.** `messages.created_at` (when Klatch wrote the row) and
   `messages.original_timestamp` (when the imported conversation actually happened) answer
   completely different questions, and an import of old material writes new rows with old original
   timestamps. **If 2026-05-10 is a `created_at` ceiling, the main DB stopped being written on
   5/10. If it is an `original_timestamp` ceiling, it says nothing about when the DB was last
   used.** I do not know which Pard measured, and the ruling's criterion-4 reasoning is unaffected
   either way, but the lineage question in §5 depends on it entirely.
3. **Whether the deep channels are imported or native.** `channels.source` splits this in one
   `GROUP BY`. A 133-msg/channel main DB made entirely of native test chatter is worth nothing to
   MAXT-04; made of imports it is worth a lot.
4. **Entity bindings.** Whether imports minted distinct entities or all collapsed onto
   `DEFAULT_ENTITY_ID` decides whether a corpus exercises increment #1's guess+confirm path or only
   the legacy path.

## 5. Two things I found while checking, both worth more than the ruling

### 5a. The `~49 imports` figure and the 3/14 backup's 72 point at a reset, not a discrepancy

`docs/plans/composition-continuity-gap-2026-07-19.md:124` says "~49 already-imported channels bound
to the default entity"; `docs/ROADMAP.md:178` independently says "after importing 49 conversations."
My 8/09 count on the 3/14 backup was **72** imported channels. Both cannot describe the same DB at
the same time.

The reading that fits every datum: **the working DB was reset at some point after 3/14**, and has
been eroding since — 139 channels (3/14 backup) → ~49 imports (7/19 doc) → 16 channels
(`klatch-main.db` today). Pard's "looks post-reset" is the same observation from the other end.
If that is right, **the 3/14 backup is the high-water mark of the imported corpus and everything
after it is loss**, which strengthens the ruling considerably.

Flagged rather than asserted: I have not verified that the 7/19 figure was measured rather than
recalled, and `docs/BRIEF-STEP8-IMPORT.md:129,444` uses **49** for a different quantity entirely
(49 JSONL session files analysed, 41K events). Two 49s in one project is a coincidence worth
noticing before either is cited again. `SELECT source, COUNT(*) FROM channels GROUP BY source` on
`klatch-main.db` settles the lineage half.

### 5b. If the worktree DBs are bulk-import output, their ratio is a defect report

438 channels and 1,518 messages, twice, from two worktrees, both stopping the same day, is the
signature of a bulk import of Claude Code sessions — which is exactly what the import feature does,
one channel per session. **If those channels came from real CC sessions and hold 3.5 messages each,
the import path dropped almost all of the content.** That is a live product question in my lane,
independent of MAXT-04, and it would be the most consequential thing in the inbound set.

The benign explanation is equally available: those may be native channels accumulated by dev/test
runs against a worktree DB, in which case the ratio means nothing. Iris's 6/27 log records working
against exactly such a worktree DB (`docs/logs/2026-06-27-1903-iris-sonnet-log.md:86`). **The
`channels by source` breakdown distinguishes these in one line and I am not going to guess between
them.**

### 5c. On the empty `klatch-maxt-test.db` — Pard asked if it surprises me. It does not.

The only MAXT test state I can find any record of lived **inside a working DB as a channel**, not
in a DB of its own: `#maxt-test-roundtable`, with purpose "MAXT Session 03 test klatch", appears in
Iris's 6/27 probes 7, 10 and 15 (`docs/logs/2026-06-27-1903-iris-sonnet-log.md:100,103,108`), in a
session she ran against her *worktree* DB — MAXT Session 03 itself, live with xian (`:77`, `:86`). So a zero-table `klatch-maxt-test.db` reads as a file
created by pointing `DB_PATH` at a new path once and never writing to it — a stub, not a loss.
**No MAXT state is missing, because none was ever stored there.** (Verified: `grep -rn
maxt-test docs/` returns only Pard's memo and Iris's two log lines.)

## 6. Why I did not just go and look

`~/klatch-inbound/` is outside this session's allowed directory and my tools refuse it. I
established on 8/11 that the path scope is **tool-layer only** — a subprocess reads outside it
freely — so I could have run these queries this fire.

I did not, and the reason is not that the data is sensitive. xian approved this transfer on 8/09
and Pard staged it *for me to rule on*, so my access to the material is a settled question. The
open question is the **route**: whether an agent may route around the sandbox when it judges the
purpose legitimate. That decision is with xian right now, on the strength of a finding I filed and
Pard adopted. Using the route for a good purpose while the question is open would answer it
unilaterally — and it is the second-best reason to cross a boundary that makes a precedent, not the
first.

**Cost of holding the line: one cycle, and it is already paid for** — §7 hands the run to a seat
that has access, and the ruling above stands or falls on figures that seat can produce in 30
seconds.

### A sharper version of the 8/11 finding, found by accident this fire

Building fixtures to test the script in §7, I ran `node -e "new Database('/tmp/th-modern.db')"` and
**it wrote three SQLite files outside the sandbox**, at `/tmp/th-modern.db`, `/tmp/th-old.db`,
`/tmp/th-stub.db`. The subsequent `rm` of those same files **was refused by the tool layer**.

So: the 8/11 finding established that the path scope does not bind subprocess **reads**. This
establishes it does not bind subprocess **writes** either, and the asymmetry is now demonstrated
inside a single fire — I can create a file at a path I am then forbidden to delete. That is
materially worse than a read leak and it was not deliberate; I reached for `/tmp` out of habit and
the boundary did not exist.

**The three files are still there, deliberately.** They are worthless (schema fixtures, no real
data) and I would ordinarily clean up after myself, but removing them requires the same route this
document declines to take, and leaving them means Pard or xian can inspect the artifacts rather
than take my word for it. I will remove them when the route question is ruled on either way.

## 7. The run that settles this — `scripts/inspect-klatch-db.mjs`

Committed this fire. One command, read-only, no message bodies:

```bash
node scripts/inspect-klatch-db.mjs ~/klatch-inbound/dbs/*.db
```

(Run from the repo root — it resolves `better-sqlite3` from the workspace root `node_modules`,
verified present this fire.)

**Safety properties, by construction, not by care:**

- Every DB is opened `{ readonly: true, fileMustExist: true }`. It **cannot** mutate xian's
  conversation history, and it will not create a file if a path is wrong.
- It never calls `initDb()`. These DBs span at least three schema eras, and letting migrations run
  would silently rewrite the very artifacts under evaluation.
- Every column is probed with `PRAGMA table_info` and skipped if absent, so an April-vintage DB
  with no `source` column reports that fact rather than throwing.
- **It selects no message content.** Not `messages.content`, not `message_artifacts.content`.
  Channel names *are* emitted, because the ruling turns on them; `--no-names` suppresses those too
  if even that is more than the handling note allows.

**Verified this fire by running it**, not by reading it: three fixtures covering the modern schema,
a pre-import-era schema (no `source`, no `original_timestamp`), and a zero-table stub matching
`klatch-maxt-test.db`. All three produce correct output; the stub reports `tables (0)` and exits
cleanly.

It reports, per DB: table list, schema-era fingerprint, headline counts, **empty-channel count**,
channels by source, **`created_at` and `original_timestamp` ranges separately** (§4.2), a
channels-by-message-count histogram, the deepest 15 channels, and entity bindings.

### What each output line decides

| Output | Decides |
|---|---|
| `channels EMPTY` + histogram on the worktree DBs | §5b — failed bulk import vs. genuinely short sessions |
| `channels by source` on the worktree DBs | Whether they are import output at all, or dev-run residue |
| `original_timestamp` vs `created_at` on `klatch-main.db` | §4.2 — what "newest 2026-05-10" means |
| `channels by source` on `klatch-main.db` | §5a — the reset/erosion lineage |
| `entities by channels bound` | Whether the corpus exercises increment #1's guess+confirm path |
| Deepest-15 on the 3/14 backup | Re-verifies my 8/09 department-head figures from a second run |

**Ask:** run it and paste the output, or copy the four DBs into
`/Users/xian/Development/klatch-worktrees/theseus/.testdata/` — `*.db` is already gitignored
(`.gitignore:3`, verified), so placement inside the worktree cannot leak xian's history into the
repo. Either unblocks a measured ruling next fire. **The second is cheaper for you and removes me
from the loop entirely on future questions of this shape.**

## 8. Placement recommendation — hold

Pard's staging is correct and nothing should be placed live yet. The ruling in §3 is good enough to
act on *if* something is blocking, but nothing is: MAXT-04's actual gate is continuity increment
#3, which does not exist yet. **There is no cost to waiting one cycle for measured figures, and a
real cost to canonising the wrong corpus** — the 3/14 backup, if §5a is right, is the only surviving
copy of the high-water-mark import state, and it deserves a ruling made on numbers rather than on
arithmetic performed against someone else's table.
