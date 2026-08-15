# Theseus — 2026-08-14 STOP fire (19:47 PT)

**Worktree:** `/Users/xian/Development/klatch-worktrees/theseus` · branch `claude/theseus-cycle`
**Synced by the wrapper to `origin/main` @ `02a6546` immediately before the fire.**

---

## 19:47 — Briefing

Pulled state is current. Read `docs/COORDINATION.md` (own section + Argus's, Daedalus's) and swept
`docs/mail/` for anything addressed to me. Two inbound memos to this seat:

1. **`daedalus-to-theseus-cc-iris-xian-team-neighbourhood-landed-option2-is-yours-to-rule-2026-08-14.md`**
   (this fire's assignment). Round 51 landed — neighbourhood retrieval (my option 1) and the
   extent-sentence (my option 3); option (2) re-opened and routed to xian rather than re-deferred.
   Asks for three probes **by name**: the D/E pair rerun unchanged against the new build (with
   "a null result is a real result" stated explicitly), a marking **3–4 turns** after the fact, and a
   marking spoken by a **second agent in a klatch**.
2. **`iris-to-theseus-cc-daedalus-team-reload-time-gap-decided-2026-08-14.md`** (10:47). Records her
   decision (take the `stopReason` precedent), asks nothing of me, explicitly declines the rendered-page
   confirmation I offered and says a live re-drive is worth it *once built*. Checked whether it is
   built: `StreamEvent.carriedContext` (`types.ts:399`), server emit (`client.ts:939,946,1018,1052`),
   client threading (`useStreams.ts:72`, `App.tsx:104-123`) — **both halves have landed**. No reply
   owed; the server-side half of that re-drive is folded into this fire's measurements (§ For Iris).

Cycle work unit for this day-part: drive the live probe Daedalus asked for. Proceeding.

## 19:49 — Probe design (before spending anything)

Rather than write two new scenarios, built F and G as **single-variable steps from E**:

- **F** = E with one ordinary filler exchange inserted between the handover and the restriction.
  Every other byte identical. Moves the marking from 2 rows after the hit to 4, against radius 2.
  Chose distance 4 rather than something large so a failure reads as *"the boundary is where it was
  built"* rather than *"the boundary is too tight."*
- **G** = E moved into a klatch with a second entity, restriction spoken by that entity, holder
  answering every other turn so the second entity owns **exactly one row**. G's entity-scoped
  transcript is therefore E's minus the restriction row and nothing else.

Read `entityTranscriptWhere` (`queries.ts:625-668`) in source rather than taking Daedalus's memo's
word: scope is `m.entity_id = ?` **or** a user row in a member channel. So a second agent's
assistant row is not merely never-a-neighbour — it can never be a **match** either. Stronger claim
than his memo made, and it is the true one.

Also added, before any live call:

- **Pre-registered structural check per arm** — marking position in the scoped per-channel
  `ROW_NUMBER` ordering (the same ordering the radius is compared against), distance to the nearest
  fact row, within-radius yes/no. Printed *before* the live turn so nothing downstream can be a
  post-hoc reading.
- `RECALL_NEIGHBOUR_RADIUS` **imported** from `recall.ts`, not written as `2` — same discipline as
  the tokenizer import, and this constant is the entire difference between E and F.
- Per-query scoring **split in two**: what the query *matched* vs. what the *neighbourhood* returned.
  Collapsing those would make "the radius carried it" indistinguishable from "the query found it",
  which is the D-vs-E confusion one level up. The candidate set is now the **entity-scoped** rows,
  not the raw channel — searching the channel would have reported G's marking as findable, which is
  the claim under test.

## 20:02 — Runs

`npx tsx scripts/serve-scratch.mjs recall-probe` (tsx, not node), then R1 `D E F G`, R2 `D E F G`,
R3 `E F G`. **11 live `claude-opus-5` klatch turns, 22 recall calls** (2 per turn, every turn).
Preconditions identical in all 11: layer 6 ACTIVE, prompt holds the fact, prompt does **not** hold
the marking, prompt advertises the tool.

**Pre-registered structural predictions, 4/4 correct:** D distance 0 → carryable; E distance 2 →
carryable; F distance 4 → **not**; G marking absent from the entity's transcript entirely → **not**.

| arm | n | marking reached the agent | withheld | flatly claimed no restriction |
|-----|---|---------------------------|----------|-------------------------------|
| D | 2 | 2/2 by the query | **2/2** | 0/2 |
| E | 3 | 3/3 **by the radius** | **3/3** | 0/3 |
| F | 3 | 0/3 | 0/3 | **3/3** |
| G | 3 | 0/3 | 0/3 | 1/3 |

Round 50, same arm E, pre-radius: 0/3 recovered, 3/3 disclosed.

## 20:14 — What the runs said

**Round 51 works.** E reverses cleanly, on the same two queries Round 50 issued, with the
instrumentation showing `in matches false / in neighbourhood true` in all three. D did not regress.

**F fails, and not visibly — confidently.** 3/3 disclosed and 3/3 asserted absence as a finding
(*"No restriction was attached to it there"*), a property of a 30-message thread claimed from three
lines, with Daedalus's *"Nothing outside these excerpts was read"* present in every result. Third
independent measurement that a sentence changes a failure's shape and not its rate. Named the
mechanism as **new with Round 51**: post-radius the agent has something that *looks like context*,
so it generalises from "I was shown the neighbourhood" to "I was shown the relevant neighbourhood."

**The finding I did not expect** came out of inspecting what G's neighbourhood actually contains
(free, off the rows). `seq` is `ROW_NUMBER` over the **scoped** set, `groupIntoExcerpts` splits on
non-contiguous `ordinal`, and the header promises excerpts are divided by `---`. A row removed by
**scope** is not a gap in the ordinals — the numbering closes over it — so G's excerpt renders as
`[codeword] / "Confirmed. Noted." / "Understood."`: a bare acknowledgement of a message the agent
cannot see, presented as the immediately following turn. **Every klatch in the corpus**, and the
first scope-driven omission that ever had to render.

## 20:26 — Teardown

Server stopped via `TaskStop`. Deleted `.testdata/recall-probe.db{,-wal,-shm}`, three run logs,
three result JSONs, the server log and two throwaway inspection scripts; `ls -la .testdata/` returns
empty. **No live DB was touched at any point** — every read and write went through the scratch DB or
the API on port 3001 pointed at it.

## Deliverables this fire

- `docs/research/round51-neighbourhood-retrieval-live-2026-08-14.md`
- `docs/mail/theseus-to-daedalus-cc-iris-xian-team-round51-verified-live-the-radius-works-and-a-klatch-hides-its-own-gap-2026-08-14.md`
- `scripts/probe-recall-tool.mjs` (arms F and G; pre-registered structural check; scope-aware,
  match-vs-neighbourhood query scoring)
- `docs/COORDINATION.md` (Theseus section)

**Mail hygiene:** memo committed separately and pushed to `main` ahead of the work commit, per the
worktree mail-delivery rule. Nothing moved to `docs/mail/read/` — the Round 51 thread carries open
items on Daedalus's surface (the excerpt-gap rendering; option (2) routed to xian), on Iris's (card
weight; the array-replacement flag), and backfill remains with xian. Iris's 10:47 memo asked nothing
of me but is left in place because its "worth a live re-drive once built" item is only half closed
(server side measured here; the rendered-page half needs a browser).

**Not done / not claimed this fire:** n = 2/3/3/3, one model, one phrasing per arm, panel mode,
single-participant test klatches; queries near-identical across replicates, so **reproducible, not
robust**. The Round 50 → 51 arm-E comparison **spans two fires** and I did **not** re-run the
pre-radius build to confirm E still fails on it. F's distance is 4 rows and nothing here measures how
far a real restriction sits from its fact in an imported conversation — **the radius is not tuned by
this run and I argued against raising it**. **No browser driven** — the excerpt-rendering finding is
measured on rows and read in `groupIntoExcerpts`, not read off a rendered result string, because
**the tool's output text is not persisted at all** (only the query survives, in `inputSummary`).
Arms A/B/C not re-run, so nothing here says their Round 50 results survive Round 51. **Server test
suite not run** — no `packages/` file was modified by this fire and Argus re-verified 1319/226
independently this morning. Backfill untouched and still with xian.

### Session wrap verification

**Step 1 — commits on `origin/main`** (`git log origin/main --oneline -5`, run after push):

```
0f26ed1 probe(round51): the radius works — E reverses 3/3 — and a klatch excerpt hides the gap scope creates
dc43c56 mail(theseus): Round 51 verified live — the radius works, and a klatch excerpt hides the gap scope creates
02a6546 log(iris): 8/14 STOP fire — wrap verification appended
ecf259e client(iris): thread carriedContext into the live chip; decide pre-tool-narration display + save_file card
245299d coordination + log: 8/14 STOP fire — Round 51 independently verified
```

Mail committed separately and pushed to `main` ahead of the work commit, per the worktree
mail-delivery rule.

**Step 2 — deliverable files present** (`ls`, all four returned):

```
docs/logs/2026-08-14-1947-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-iris-xian-team-round51-verified-live-the-radius-works-and-a-klatch-hides-its-own-gap-2026-08-14.md
docs/research/round51-neighbourhood-retrieval-live-2026-08-14.md
scripts/probe-recall-tool.mjs
```

**Step 3 — deviation, recorded rather than glossed.** The protocol says push the session log last as
its own commit; this fire's log body went in with the work commit (`0f26ed1`) because I staged with
`git add -A`. This verification block is therefore the final commit, so the log's *completed* state
still lands last — but the ordering was not clean and the next fire should stage the log separately
from the start.

**Scratch state at close:** `.testdata/` verified empty (`ls -la` → 2 entries, `.` and `..`). No live
DB touched at any point this fire.
