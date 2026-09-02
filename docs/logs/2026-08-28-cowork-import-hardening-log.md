# Session log — Cowork, 2026-08-28: import pipeline hardening

**Agent:** Cowork diligence session (xian's)
**Scope:** import pipeline defects found by the three-reviewer panel, plus the descope call
**Companion docs:** `docs/import-pipeline-review-2026-08-28.md` (findings),
`docs/mail/cowork-to-daedalus-argus-theseus-cc-calliope-import-defects-and-descope-2026-08-28.md` (memo)
**State:** all changes uncommitted in the working tree.

---

## Test suite

| | Tests passing | Delta |
|---|---|---|
| Baseline, before any change | 1,431 | — |
| After batch 1 (turn boundary, crash, sessionId, receipt) | 1,450 | +19 |
| After the `memories.json` fix | 1,461 | +11 |
| After batch 2 (this log) | **1,485** | +24 |

16 failures throughout, all `EPERM: operation not permitted, unlink` in test *cleanup* —
this environment's sandbox blocks file deletion inside mounted folders. Zero assertion
failures. `npm run typecheck` clean across shared/server/client.

---

## Batch 1 — earlier today

1. **Positive turn boundary.** `isHumanTurnBoundary(event, opts?)` requires `permissionMode`
   when the session uses it, plus an unconditional shape guard for machine-authored text,
   plus `isVisibleInTranscriptOnly`. Back-compat decided per file.
   **Measured on `exports/sessions/theseus-2026-03-22.jsonl`: 75 turns → 66. Nine were
   fabricated (12%)** — six flagless, three `<task-notification>` events that carry
   `permissionMode: bypassPermissions` (the anomaly `JSONL-SCHEMA.md:65` documents).
2. **Crash-proof timestamp sort** — `(a.timestamp || '')`.
3. **`sessionId` by scan**, not `rawEvents[0]`. It was `undefined` on the real capture,
   which silently disabled the 409 dedup check.
4. **`versions: string[]`** — the real capture spans 2.1.73 and 2.1.81.
5. **`ImportIntegrity` receipt**, surfaced in the 201 response.
6. **`memories.json` container unwrap** + astral-safe `joinIfCharArray`.

## Batch 2 — this log

### Artifacts: the three declared types that were never emitted

`ParsedArtifact.type` advertised `tool_use | tool_result | thinking | image`; only
`tool_use` was produced. Now all four are, with images kept as a descriptor rather than an
inline base64 payload.

**And the root cause was not what the review said.** The review recorded that tool results
were "discarded". They were never *reached*: tool results arrive as **user-role** events,
and the turn loop skipped every non-assistant event before extracting artifacts. Adding the
three block types alone produced **zero** tool_results on the real capture. The fix is to
collect artifacts from non-boundary user events too — while never taking their text, since
a tool result is not something the human said.

Verified on the real capture: `{ tool_use: 215, tool_result: 213, thinking: 47 }`.
The 213 matches the reviewer's independent count exactly.

### Compaction attribution

`extractCompactionFromEvents` returned the **first** `<summary>` in file order, so a session
compacted three times carried its stalest summary — while `findCompactionSummary`, reading
the same thing from subagent files thirty lines away, deliberately iterated latest-first.
Two paths, opposite rules, and the caller preferred the stale one. Now latest-wins in both,
with `integrity.compactionSummariesFound` reporting how many were seen.

### Message timestamps and identity

Both messages of a turn were stamped with the **user's** timestamp and uuid. In a session
spanning days an answer written hours later displayed the question's clock time, and
`original_id` identified neither row. `ParsedTurn` now carries `assistantTimestamp` and
`assistantOriginalId` from the last assistant event in the turn; `importSession` uses them
with a fallback for older callers and fixtures.

### Selective import

`if (selectionSet && conv.uuid && !selectionSet.has(conv.uuid))` — `conv.uuid &&`
short-circuited, so a conversation with no uuid passed the filter and was imported even
when the user had selected two of five hundred, then skipped dedup as well. Now a
conversation that cannot be identified cannot be in the selection; it is recorded in
`skipped` with reason `unidentifiable-under-selection`.

### Batch import partial state

The batch loop is not transactional — each `importSession` is its own transaction. A throw
partway through fell to the outer catch and returned a bare 500 while the already-committed
channels stayed in the database, named in no response. Now each conversation is caught
individually, failures collect in `failed[]`, the batch finishes, and the response carries
`failed` / `totalFailed`. An all-failed batch returns 500 *with* the report rather than
presenting as "no valid conversations found".

### Project directory encoding

Claude Code replaces **every** non-alphanumeric character with `-`, not just `/`
(`code.claude.com/docs/en/sessions`). The old `cwd.replace(/\//g, '-')` was wrong for any
path containing `.`, `_` or a space, so the `MEMORY.md` lookup built on it silently found
nothing. New `encodeProjectDirName()` matches documented behaviour, returns `null` for
paths over 200 characters (Claude Code truncates and hashes those — not reconstructible),
and honours `CLAUDE_CODE_PROJECT_DIR_NAME` (2.1.234+). `getClaudeProjectsDir()` now honours
`CLAUDE_CONFIG_DIR`.

### Drift canary

An import that parses turns but writes no messages returns **422 with the integrity
receipt**, not `201 Created, messageCount: 0`. Not reachable through a real transcript today
— boundary detection and content extraction agree about what a text block is — so it is a
guard against the case where a future format change makes them disagree. Tested by forcing
`importSession` to report zero, since an untested guard against silent failure would be its
own instance of the problem this pipeline was just audited for.

### `parentUuid`: deliberately NOT fixed

The review found that `parentUuid` is declared, documented, named in a test title, and never
read. Turn grouping is a flat timestamp sort. Rewriting it was rejected for three reasons:

1. It contradicts the freeze recommendation this session endorsed hours earlier.
2. The flat sort is accidentally protective — nothing traverses, so cycles cannot hang the
   parser and the **44 genuinely orphaned events** in the reference capture are not dropped,
   which a strict walker would do.
3. It is the highest-regression-risk change available in a pipeline with one user.

Instead the shape is now **measured and reported** in `integrity.treeShape`. On the real
capture: `{ roots: 1, orphans: 44, forkPoints: 10, duplicateTimestamps: 6 }` — matching the
reviewers' independent counts. What the flat sort cannot do is choose between sibling
branches after a rewind: both are emitted, interleaved, and read as one conversation. A
non-zero `forkPoints` is now the signal that a transcript is affected.

---

## Two pre-existing tests changed, both deliberately

Recorded here because silently editing a test to make a change pass is the failure mode this
whole audit was about.

1. **`memories-parsing.test.ts` — "handles memory with empty content".** My first pass
   dropped empty memories, which broke it. That was scope creep, so I **reverted my change**:
   an item carrying its own uuid is user-declared and is emitted even when blank. Only
   entries *synthesized* from a container are skipped when empty.
2. **`parser.test.ts` — "handles assistant with only tool_use blocks".** Asserted
   `artifacts.length === 1`, which encoded the defect: the fixture always contained a
   `tool_result` and the parser threw it away. **Updated to 2**, with both artifacts asserted
   by type. The test's stated intent — `assistantText` is empty when there is no text block —
   is unchanged.

The difference matters: in (1) the existing test was right and my change was wrong; in (2)
the existing test encoded the bug. Both were resolved by reading the test's stated intent
rather than its assertion.

---

## Still open

`parentUuid` tree-walking (deliberately deferred, now instrumented); compaction summary
never reaching `channels.compaction_state`, so re-export drops it; a wrong entity guess
leaving `messages.entity_id` mis-stamped after the entity is removed; `validateImportPath`
accepting any absolute path; and — the largest — **golden fixtures pinned at Claude Code
2.1.19/2.1.30**, seven months and 220+ releases stale, containing none of the shapes that
actually break the parser.

Every defect fixed today was invisible because the fixtures encode a format nobody runs, and
`exports/sessions/theseus-2026-03-22.jsonl` had been in the repo since March without a single
test reading it. Refreshing the fixtures is the highest-value remaining item.

---

## Batch 3 — fixture provenance

Suite: **1,499 passing** (+14). The remaining gap needs a machine with live Claude Code
transcripts; `~/.claude/projects` is not reachable from this session (only the `klatch` and
`designinproduct` folders are mounted).

### What landed

- **`fixtures/provenance.json` + `PROVENANCE.md`.** Every `.jsonl` fixture now records the
  Claude Code version it represents, its origin, and when it was captured.
- **`fixture-provenance.test.ts`** — 15 tests. Fails when a fixture has no manifest entry,
  when the manifest names a file that no longer exists, and — the one that matters — **when
  the set has not been reviewed within `reviewIntervalDays` (120)**. The fixtures were 171
  days old and nothing said so. That is now a failing test with a date on it.
  Runtime scratch files (`temp-*`, `*-temp.jsonl`) are excluded so a leftover from a crashed
  run does not present as an undocumented fixture.
- **`fixtures/real-shapes-2.1.81.jsonl`** — a structural fixture at current-era shape.
  Synthetic text on purpose: it exercises the shapes that break the parser without
  duplicating conversation content already committed elsewhere. Covers no-conversation-event
  on line 1, sessionId absent from event 0, flagless command injections, a task-notification
  carrying `permissionMode`, tool_result on a user event, thinking and image blocks, a fork,
  an orphan under a system event, duplicate timestamps, a conversation event with no
  timestamp, two versions in one file, and event types absent from `JSONL-SCHEMA.md`.
- **Golden snapshots.** One pins the parse of the structural fixture; the other pins the
  parse of `exports/sessions/theseus-2026-03-22.jsonl` — 1,001 events, 689 conversation
  events, 66 turns, `{thinking: 47, tool_use: 215, tool_result: 213}`,
  `treeShape {roots: 1, orphans: 44, forkPoints: 10, duplicateTimestamps: 6}`.
  **That file had been in the repo since March and no test had ever read it.** Every defect
  fixed today was measurable from it in under ten minutes.
- **`scripts/refresh-import-fixtures.mjs`** — surveys `~/.claude/projects` (or one file via
  `--input`), tabulates versions, event types, system subtypes, content-block types and
  user-event flags, and **names anything the parser does not know about**. `--emit` writes a
  fixture with all message text redacted, so the output is safe to commit. It never writes
  to `~/.claude`.

### The script found something on its first run

Against the committed capture it reported `isSidechain` as an unknown user flag. That was a
false positive — the parser does use it, I had left it out of the script's known-flag set —
and it is recorded here because a noisy alarm is an alarm people learn to ignore, which is
the failure mode this whole batch exists to prevent. Fixed; the run is now clean.

Two true findings from the same run, both confirming defects fixed earlier today:
`sessionId present on line 1: 0/1 files`, and `permissionMode` on exactly 69 user events —
the count the boundary gate produces before the machine-text guard removes the three
`<task-notification>` events to reach 66.

### What still needs a machine with live transcripts

The newest transcript anywhere in this repo is Claude Code **2.1.81** (March). Current is
~2.1.251. To close that:

```
node scripts/refresh-import-fixtures.mjs --limit 20        # survey — read the warnings
node scripts/refresh-import-fixtures.mjs --limit 20 --emit # write a redacted fixture
```

Then add the emitted file to `provenance.json`, set `lastReviewed`, and run the suite.
If the survey names an unknown user flag, add a case to `turn-boundary-regression.test.ts`
**before** changing the parser — an unknown flag on an otherwise-human-looking event is
exactly where the next fabricated turn comes from.

## Batch 4 — 2026-09-02, the attachment gap

Xian ran `scripts/refresh-import-fixtures.mjs` against 20 live transcripts (Claude Code
2.1.229–2.1.241, 3,096 events). It found what it was built to find.

### The finding

**`attachment` — 622 of 3,096 events, the second most common type in the sample, and the
parser drops every one.** Zero existed in the March capture. In the same sample there were
**no `image` content blocks at all** (March had 4), which points at attachments and images
having moved out of message content into their own event type. 62 of 72 in the redacted
sample hang off a user or assistant event, so they are conversationally attached rather than
floating session state.

Five other new types — `bridge-session`, `custom-title`, `ai-title`, `atis-latch`, `mode` —
carry no message and no conversation parent, and look like session bookkeeping. Unconfirmed
but low-risk.

Two smaller findings, both confirming earlier work: `sessionId` is now on line 1 in **20/20**
files (0/1 in March — the bug fixed on 8/28 no longer triggers on current transcripts, though
the fix still defends the old shape), and `permissionMode` appears on 46 user events, which
means **the positive turn-boundary test still holds against September data.** That validation
is exactly what the stale fixtures could not provide.

### What landed

Not attachment *handling* — the payload shape is unknown and guessing it would be the same
error as every defect in this audit. Instead, the loss is now **visible**:

- **`ImportIntegrity.skippedContentBearing`** — `{ total, byType }`, counting events the
  parser skipped that carry a `message` or hang off a conversation event. Narrowed to
  *unclassified* types: `system`, `progress`, `file-history-snapshot`, `queue-operation` and
  `last-prompt` are excluded, because they attach to turns routinely and counting them would
  make the number fire on every transcript and mean nothing.
- **A warning on the import response** when that total is non-zero: *"Skipped 62 event(s)
  that may carry content: attachment (62). These event types are not yet handled."*
- **Golden snapshots pin the gap.** `real-shapes-2.1.81.jsonl` → 0.
  `real-shapes-2.1.241.jsonl` → 62 attachment. The 2.1.241 test asserts the total is
  non-zero and says in a comment that it should FAIL and be rewritten once attachments are
  actually handled.
- **`--shape <type>`** added to the refresh script: prints field paths and value *types* for
  one event type, never values, so the output is safe to paste.

### Two script flaws the real run exposed

1. **Presence-counted flags.** `isSidechain` was reported as the most common user flag (568)
   because the script counted key presence and `isSidechain: false` sits on nearly every user
   event. Now reported as `present N / true N` — on the redacted sample, `present 69 / true 0`.
2. **Over-aggressive redaction.** `--emit` dropped every object-valued field, which stripped
   the `attachment` payload — precisely the thing worth seeing. Redaction now keeps key names
   and value types with values removed.

Also narrowed on the same principle: the first `skippedContentBearing` heuristic counted a
`system`/`turn_duration` event hanging off a turn, and my own 2.1.81 fixture caught it. Three
separate false positives in one day, all of the same shape — **an alarm that fires on
everything is one people learn to ignore, which is the failure this whole batch exists to
prevent.**

### Open, and blocked on one command

Handling attachment content needs the payload shape:

```
node scripts/refresh-import-fixtures.mjs --limit 40 --shape attachment
```

Field names and types only. Recorded in `fixtures/provenance.json` under `openFindings`.

Suite: **1,505 passing.**

## Files touched

**Source:** `packages/server/src/import/parser.ts`, `import/claude-ai-zip.ts`,
`import/session-scanner.ts`, `routes/import.ts`, `db/queries.ts`
**Tests (new):** `turn-boundary-regression.test.ts`, `memories-container-regression.test.ts`,
`import-hardening-2026-08-28.test.ts`, `drift-canary.test.ts`
**Tests (edited):** `parser.test.ts` (one assertion, documented above)
**Docs:** `import-pipeline-review-2026-08-28.md`, `LICENSING-MEMO.md`,
`openwebui-parity-test.md`, this log, and the memo in `docs/mail/`

`package-lock.json` also moved — `npm install` was needed to run the suite in this
environment. Revert it if that is noise.

Test temp fixtures regenerated by each run are parked in `_to_delete/test-temp-fixtures/`;
this sandbox cannot delete files.
