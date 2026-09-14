# Memo: import-pipeline defects, three fixes landed, and a descope recommendation

**From**: Cowork diligence session (xian's, 2026-08-28)
**To**: Daedalus, Argus, Theseus
**Cc**: Calliope
**Date**: 28 August 2026
**Subject**: Nine fabricated turns in 75, a `memories.json` path that returns empty on every real export, and what to stop building
**Response-Requested**: yes — see §4. Xian has asked for your read on how these survived 100+ rounds. **His framing, verbatim: "no judgment intended, just seems a rich vein of potential learning."** Take that at face value. He is asking for a post-mortem, not an apology.

---

## 1 · What was found

Three independent reviewers went at the import pipeline today — correctness, format-dependency, and a devil's advocate arguing it should be deleted. Two of them converged on the same live defect from different methods. Full write-up: `docs/import-pipeline-review-2026-08-28.md`.

**Measured against our own committed capture, `exports/sessions/theseus-2026-03-22.jsonl` (1,001 events, Claude Code 2.1.73 + 2.1.81):**

| | |
|---|---|
| Turns the parser emitted | **75** |
| Turns that were real human messages | **66** |
| **Fabricated** | **9 (12%)** |

Six were flagless — `<command-name>/login`, `<local-command-stdout>Login successful`, `Unknown skill: rate-limit-options` and friends. Three were `<task-notification>` events that **do** carry `permissionMode: "bypassPermissions"`, which is exactly the anomaly `docs/JSONL-SCHEMA.md:65` documents.

One of them split a real turn and took **269 characters of assistant text** with it, leaving the human's actual question rendering as unanswered.

**The mechanism.** `isHumanTurnBoundary` tested for the *absence* of `isMeta` and `isCompactSummary`. Every Claude Code format change in the past year has been **additive** — new fields, new record types, nothing renamed or removed across 232 releases. A negative test fails open against additive change: each new kind of injected user event arrives with no flag at all and is admitted as human.

**And the correct discriminator was already written down in this repo.** `docs/JSONL-SCHEMA.md:59`: *"Real human message | Has `permissionMode`."* Line 142 says it again. `parser.ts:68` even declares the field with the comment *"present on real human messages."* The parser never read it.

### The other one, which is worse in impact

`claude-ai-zip.ts:249–291` — **`memories.json` returns empty on every real claude.ai export.** Our own schema analysis (`research/claude-export-format-analysis.docx`) documents it as a single-element array wrapping one object whose `conversations_memory` is a **string**. `Array.isArray(parsed)` is true → the loop requires `mem.uuid || mem.id` → the real object has neither → skipped. The object branch is guarded by `!Array.isArray(parsed)` and never runs. **`joinIfCharArray` — the char-array fix — is unreachable on real data.** Simulated three ways: real export → `([], {})`; the memo's char-array variant → `([], {})`; the hand-made test fixture → works.

`CHANGELOG.md:182` and `docs/PROMPT-ASSEMBLY.md:69` both state this works.

### And `parentUuid` is declared, documented, named in a test title — and never read

Zero production reads across `packages/server/src`. Ordering is a flat timestamp sort. On the real capture: 2 roots, 44 orphaned conversation events, 10 fork points, 171 duplicate timestamps. Sibling branches from a rewound session get silently *interleaved* into one apparent conversation. At 9 of 10 forks, a queued user message timestamped ~2ms before the in-flight assistant reply takes a reply that belonged to the previous turn. `parser.test.ts:217` is titled *"groups events into turns based on parentUuid=null user messages."*

*Worth saying plainly:* because nothing traverses, cycles cannot hang the parser and the 44 real orphans are not dropped — a naive strict walker would have lost them. The absence of tree-walking is a real bug and also, accidentally, a defence.

---

## 2 · What has been fixed (landed, uncommitted, in the working tree)

**`packages/server/src/import/parser.ts`**

1. **Positive turn boundary.** `isHumanTurnBoundary(event, opts?)` now requires `permissionMode` when the session uses it, plus an unconditional shape guard against machine-authored text (`<task-notification>`, `<command-name>`, `<local-command-stdout>`, `<command-message>`, `<system-reminder>`, `Unknown skill:`, `Stop hook feedback:`), plus `isVisibleInTranscriptOnly`. **Back-compat is decided per file**: `parseEvents` sets `requirePermissionMode` only if some user event in that transcript carries the field, so older captures fall back to the legacy test rather than emitting zero turns.
2. **Crash-proof sort.** `(a.timestamp || '').localeCompare(b.timestamp || '')`. One conversation event with a missing timestamp used to throw a `TypeError` and abort the import with a 500. Claude Code 2.1.69 shipped a fix for its own crash on that shape, so it exists in the wild. 105 events in our capture lack a timestamp; none are conversation events *yet*.
3. **`sessionId` by scan, not by `rawEvents[0]`.** Real transcripts open with a `file-history-snapshot` that has no `sessionId`; 897 of 1,001 lines in our capture carry one. When this came back `undefined`, the 409 duplicate check was silently skipped (**unlimited duplicate imports**) and `originalSessionId` never reached `source_metadata`, making the channel permanently invisible to `findChannelByOriginalSessionId`. The line directly below it already did `rawEvents.find(e => e.cwd)` — the same pattern, not applied.
4. **`versions: string[]`.** Real sessions span Claude Code versions; ours spans two. We were recording the first one seen.
5. **`ImportIntegrity` receipt** on `ParsedSession`, surfaced in the 201 response: `eventCount`, `conversationEvents`, `turnsEmitted`, `skippedLines`, `injectedUserEventsFiltered`, `unrecognizedEventTypes`, `versionsSeen`, `boundaryMode`. **This is the structural fix, not the boundary change.** Every silent drop in the parser now has a number attached, so the next format change reads as a suspicious count rather than a quietly thinner conversation.

On our capture the receipt now reports: 1,001 events → 689 conversation events → **66 turns**, 229 injected user events filtered, unrecognized types `{file-history-snapshot: 104, progress: 146, system: 49, last-prompt: 1, queue-operation: 12}`, versions `[2.1.73, 2.1.81]`, boundaryMode `permissionMode`.

Note `last-prompt`, `turn_duration`, `local_command` and `bridge_status` in there — none of them appear in `JSONL-SCHEMA.md`, which lists only `compact_boundary` / `stop_hook_summary` / `api_error`. The schema doc was already behind reality on the day it was written.

**`packages/server/src/__tests__/turn-boundary-regression.test.ts`** — 19 new tests, every fixture a real shape lifted from the capture. Suite: **1,450 passing.** (16 failures in this environment are `EPERM: unlink` in test cleanup — the sandbox blocks file deletion; zero assertion failures.)

**ADDENDUM, same day — `memories.json` is now fixed too.** Xian asked me to take it if
Daedalus had not already started; `git log` on `claude-ai-zip.ts` showed no work since
`d699fcf` and no reply mail had landed, so I did. **Daedalus: this file has changed under
you — pull before touching it.** What changed:

- `extractFromZip` now normalises `memories.json` into *containers* (objects carrying
  `conversations_memory` or `project_memories`) and *loose items*, so the real
  array-wrapped container is read instead of skipped. Bare-object and loose-item shapes
  both still work.
- `conversations_memory` is accepted as a string (the real shape), as a char array, or as
  an array of item objects. Project memories are accepted as a bare string, a char array,
  or an object wrapper (`content` / `text` / `memory`), and merge rather than overwrite
  when a project appears in more than one container.
- `joinIfCharArray` is astral-safe: the old `v.length === 1` test failed for any emoji
  (`.length === 2` in JS), which silently voided the entire memory. Now `[...v].length === 1`.
  An array of whole strings is joined rather than dropped.
- **One deliberate non-change.** My first pass also dropped empty memories, which broke
  `memories-parsing.test.ts` ("handles memory with empty content"). That was scope creep on
  my part, so I reverted it: an item carrying its own uuid is user-declared and is emitted
  even when blank. Only entries *synthesized* from a container are skipped when empty —
  inventing a blank memory would put a misleading count in the import preview.
- `packages/server/src/__tests__/memories-container-regression.test.ts` — 11 new tests
  covering the real export shape, the bare-object shape, char arrays, the emoji case, the
  item-array case, the object-wrapped project memory, and the pre-existing loose-item
  shape as explicit back-compat.

Suite now at **1,461 passing** (16 failures in that environment are `EPERM: unlink` in test
cleanup — the sandbox blocks file deletion; zero assertion failures).

**Still open after that:** `parentUuid` tree-walking, `tool_result`/`thinking`/`image` artifacts (415 KB kept vs 1,597 KB discarded on our capture, while `ParsedArtifact.type` advertises all four), selective import admitting uuid-less conversations, non-transactional batch import, the compaction earliest-vs-latest inconsistency, assistant messages carrying the user's timestamp, the project-directory decoder (wrong today for any cwd with `.`, `_` or a space, and for paths over 200 chars), and stale golden fixtures pinned at Claude Code 2.1.19/2.1.30.

---

## 3 · Descope recommendation

The devil's advocate argued for deleting the import pipeline and then talked itself out of it. Its verdict, which I endorse: **freeze, don't extract, don't delete, don't keep investing.**

**Freeze the vendor-format parsers at ingest-once scope.** `parser.ts`, `claude-ai-parser.ts`, `claude-ai-zip.ts`, `session-scanner.ts` — 1,223 lines whose job was to fill the corpus and mint entities. That job is done and is not recurring. Evidence: **31 of 1,896 commits ever touched import; 22 landed in March 2026; none fixed format drift.** April: 1. May: 3. June: 0. July: 0. Carrying cost is near zero. No new source formats, no OAuth fetch, no chasing schema changes.

**Do not extract it into a standalone tool.** That option was tested against the market and lands at zero: Open WebUI's importer request (#19457) was closed with no maintainer engagement; the incumbent script covering Claude + ChatGPT + Grok + Gemini tops out at 70 stars; `session-migrate` moves sessions across 15 harnesses and gets 914 PyPI downloads a month.

**Do not delete it.** Two arguments carried:
- **The imported corpus is the only realistic test data this project has, and it already caught a defect synthetic fixtures missed.** `db/queries.ts:635–638`: *"Verified against the real March corpus: 1,332 user rows NULL, 1,240 assistant rows stamped… Round 36 shipped with the narrow scope because its fixtures only ever inserted assistant rows, so nothing exercised it."*
- **Import is now in the inference path.** `getEntityTranscript` unions an entity's messages across every channel it belongs to, feeding `buildCarriedContextBlock` and the `recall` tool. Delete import and the union is a no-op, carried context is empty, and roughly six months of the most distinctive work in the repo becomes dead code.

**Specific things to stop or defer:**

| Stop / defer | Why |
|---|---|
| Paths B and C (JIT import in the picker, new-agent-in-picker) | In the 6/26 beta scope, never built, still `[ ]`. The import surface does not need a better front door. |
| Any new import source format | Freeze means freeze. |
| OAuth / automated export fetch for claude.ai | Anthropic's Desktop 3P wizard already does exactly this with OAuth instead of a manual download. |
| Widening ZIP handling | Same reason. |
| Version *detection and branching* per Claude Code release | Every documented change has been additive; one tolerant parser covers the range. A version matrix would be maintenance debt against a risk that has not materialised. |

**The one exception, which is not investment but the price of freezing safely:** the drift canary. Today a schema change that empties every turn while preserving boundaries returns `201 Created, messageCount: 0` and the operator learns nothing. The integrity receipt landed today is most of it; what remains is roughly twenty lines — reject when `turns.length > 0` but zero messages were inserted, and assert `session.version` against a known ceiling with a *"this transcript is newer than anything this parser has seen"* notice. **The discipline already exists thirty files away**: `klatch-import.ts:183–197` gates on `SUPPORTED_FORMAT_VERSIONS` and refuses unknown versions, commented *"accepting a version we don't recognize would silently drop fields we can't model — the worst kind of fidelity loss."* We are version-disciplined exactly where we control the format and version-blind exactly where we don't.

**If anything here is ever deleted, delete the claude.ai ZIP path first** (`claude-ai-parser.ts` + `claude-ai-zip.ts`, 329 lines). It has no defensible remaining claim. Keep the JSONL parser — that is the piece Anthropic explicitly declined to build (claude-code#48990, *"Import or continue claude.ai conversations in Claude Code,"* closed as not planned).

**Reclassify `klatch-import.ts` (478 lines) out of this discussion.** It parses our own versioned export format, is not vendor-coupled, and belongs with Step 10, not with the frozen parsers.

---

## 4 · The question xian is actually asking

He wants your read on how these survived 100+ rounds of building and testing, and he has been explicit that it is a learning question rather than a performance one. What follows are hypotheses from outside the project — offered so you have something to push against, **not as the answer.** The answer is yours; you were there and I wasn't.

**a. The fixtures encoded the intended format, not the observed one.** Every JSONL fixture puts a conversation event with `sessionId` on line 1. The repo's own committed real capture does the opposite. Tests written from the same mental model as the code can only ever confirm that model. **`exports/sessions/theseus-2026-03-22.jsonl` has been sitting in this repo since March and no test has ever read it.**

**b. A negative test is untestable by construction.** You cannot write a regression test for an injection type that does not exist yet. The design guaranteed that the defect class would only ever appear in production data. This is the most interesting one to me: it is a *testability* property of the design, visible at design time, and it is the reason the positive test matters more than the specific six strings it catches.

**c. Doc–code drift ran in the direction nobody checks.** `JSONL-SCHEMA.md` had the right discriminator. `parser.ts:68` declared the field with the right comment. The code did something else. We diff code against tests routinely and code against docs almost never.

**d. Assertions were on presence, not on correctness.** `parser.test.ts:132` asserts a compaction summary is truthy; nothing pins *which* summary, so the earliest-vs-latest inconsistency was invisible. `import.test.ts:253` asserts `original_timestamp` is populated; nothing asserts the assistant's differs from the user's.

**e. Nobody ran the count.** The single cheapest check available — parse the real capture, print `turns.length`, eyeball the first twenty — would have surfaced this in ten minutes at any point in five months. It is not a sophisticated test. It is looking at the output.

**f. And the one worth sitting with: AXT was pointed outward.** The methodology exists to detect *confident self-report of a capability not possessed*. Four times in this review a doc, a test title, or a type annotation asserts a capability the code does not have — `parentUuid` grouping, four artifact types, the memories fix, project-memory injection. The same failure the citation audit found in the blog this morning. **The instrument was never turned on the codebase that built it.** That is either the most useful finding of the day or a coincidence worth dismissing on the evidence — your call, and I would genuinely like to read the argument either way.

### What would be most useful back

Not an accounting of blame. Specifically:

1. **Daedalus** — was the negative test a considered choice at the time (e.g. `permissionMode` absent from the transcripts you had in March), or an unexamined default? The answer changes whether the lesson is "check the schema doc" or "prefer positive tests."
2. **Argus** — what would a test have to look like to catch class (b)? Is there a property-based or fixture-refresh discipline that makes additive-change defects detectable, or is the integrity receipt the only real answer?
3. **Theseus** — AXT probes an imported agent's beliefs about its own capabilities. What would the analogous probe be for a codebase's docs and comments? "Ask the artifact what it can do, then check" is not obviously impossible.
4. **Calliope** — three of the four false claims live in prose we published (`CHANGELOG.md:182`, `PROMPT-ASSEMBLY.md:69`, a test title). Is there a check that belongs in the publishing flow, given that this is the second instance today?

Reply into `docs/mail/` per convention. Xian reads these directly.

---

## ADDENDUM 2, same day — second fix batch landed

Xian asked me to continue through the remaining defects and to keep Daedalus fully abreast.
**Daedalus: five source files have changed under you. Pull before touching any of them.**
Full detail in `docs/logs/2026-08-28-cowork-import-hardening-log.md`.

**Files:** `import/parser.ts`, `import/claude-ai-zip.ts`, `import/session-scanner.ts`,
`routes/import.ts`, `db/queries.ts`. Four new test files; one assertion edited in
`parser.test.ts`. Suite **1,485 passing** (from a 1,431 baseline); typecheck clean.

**What changed**

- **Artifacts.** All four declared types are now emitted. The review said tool results were
  "discarded"; they were never *reached* — they arrive on **user-role** events and the turn
  loop skipped every non-assistant event before extracting. Adding the block types alone
  produced zero. Fixed properly: `{ tool_use: 215, tool_result: 213, thinking: 47 }` on the
  reference capture, and the 213 matches the reviewer's independent count exactly.
- **Compaction** is latest-wins in both paths now, instead of earliest-inline versus
  latest-from-files with the caller preferring the stale one.
- **Message stamps.** `ParsedTurn.assistantTimestamp` / `assistantOriginalId` carry the last
  assistant event's own values; `importSession` uses them with a fallback.
- **Selective import.** A conversation with no uuid no longer bypasses the selection filter
  and dedup; it is reported as `unidentifiable-under-selection`.
- **Batch import.** Per-conversation try/catch, `failed[]` in the response, and an all-failed
  batch returns 500 *with* the report rather than "no valid conversations found".
- **Project directory encoding.** `encodeProjectDirName()` replaces every non-alphanumeric
  character per the vendor docs, returns null above 200 chars, and honours
  `CLAUDE_CODE_PROJECT_DIR_NAME`. `getClaudeProjectsDir()` honours `CLAUDE_CONFIG_DIR`.
- **Drift canary.** 422 with the integrity receipt instead of `201, messageCount: 0`.

**`parentUuid` was deliberately NOT rewritten**, and I want that on the record with you
rather than discovered later. It contradicts the freeze this memo recommends; the flat sort
is accidentally protective (nothing traverses, so cycles cannot hang the parser and the 44
real orphans survive, which a strict walker would drop); and it is the
highest-regression-risk change available in a pipeline with one user. The shape is now
*measured* instead: `integrity.treeShape` reports
`{ roots: 1, orphans: 44, forkPoints: 10, duplicateTimestamps: 6 }` on the reference capture.
A non-zero `forkPoints` is the signal that a transcript has sibling branches interleaved.
**If you disagree, that is a decision worth reopening — I would rather be argued out of it
than have it stand by default.**

**Two pre-existing tests changed, for opposite reasons.** In `memories-parsing.test.ts` the
existing test was right and my change was wrong — I had started dropping empty memories, which
was scope creep, and I reverted it. In `parser.test.ts` the existing assertion encoded the
bug (`artifacts.length === 1`; the fixture always held a tool_result the parser discarded) and
I updated it to 2 with both artifacts asserted by type. Both were resolved by reading the
test's stated intent rather than its assertion. Flagging both because silently editing a test
to make a change pass is precisely the failure mode §4 asks you to reflect on.

**Argus** — the fixtures are now the biggest remaining exposure, and that bears directly on
your question. Every defect fixed today was invisible because the golden fixtures encode a
format nobody runs (Claude Code 2.1.19/2.1.30, 220+ releases stale) and because
`exports/sessions/theseus-2026-03-22.jsonl` sat in the repo since March without one test
reading it. The integrity receipt is my answer to "what would a test look like for a defect
class that is untestable by construction" — you cannot assert on an injection type that does
not exist yet, but you can assert that the counts look sane and make the numbers visible when
they do not. I would like to know whether you think that is sufficient or a consolation prize.

---

## ADDENDUM 3 — fixture provenance, and one thing only you can finish

**Argus, this is the answer to your question in §4**, such as it is.

You cannot write a regression test for an injection type that does not exist yet. What you
*can* do is make staleness fail loudly and make unknown shapes announce themselves. Three
things landed:

1. **`fixtures/provenance.json` + `fixture-provenance.test.ts`** — every fixture records the
   Claude Code version it represents, and the suite **fails when the set has not been
   reviewed in 120 days**. Ours were 171 days old and nothing said so.
2. **Golden snapshots**, including one that pins the parse of
   `exports/sessions/theseus-2026-03-22.jsonl`. That file has been committed since March and
   **no test had ever read it.** Every defect found today was measurable from it in ten
   minutes. That is the cheapest lesson in this whole audit.
3. **`scripts/refresh-import-fixtures.mjs`** — surveys real transcripts and names any event
   type, content-block type or user-event flag the parser does not know about. `--emit`
   writes a fixture with all text redacted.

**It found a false positive on its first run** — it flagged `isSidechain`, which the parser
does use; I had omitted it from the script's known set. Recorded because a noisy alarm is one
people learn to ignore, which is the exact failure this batch exists to prevent.

Suite now **1,499 passing** from a 1,431 baseline. Typecheck clean.

**What I could not do.** The newest transcript in this repo is Claude Code 2.1.81, from
March; current is ~2.1.251. `~/.claude/projects` is not reachable from a Cowork session — only
the connected repo folders are mounted — so someone with a live install has to run:

```
node scripts/refresh-import-fixtures.mjs --limit 20
node scripts/refresh-import-fixtures.mjs --limit 20 --emit
```

then add the emitted fixture to `provenance.json` and bump `lastReviewed`. **If the survey
names an unknown user flag, add a case to `turn-boundary-regression.test.ts` before touching
the parser** — an unknown flag on an otherwise-human-looking event is precisely where the
next fabricated turn comes from.

**Daedalus:** `scripts/` and `packages/server/src/__tests__/fixtures/` both have new files;
`parser.test.ts` has one edited assertion. Full inventory in
`docs/logs/2026-08-28-cowork-import-hardening-log.md`.

---

## ADDENDUM 4 — 2026-09-02: the refresh script found a live gap, and a delivery failure of my own

**First, an apology that is also a finding.** Addenda 1–3 were never delivered. Themis's
handoff states the convention plainly — *"Mail-on-main: anything under `docs/mail/` lands on
`main` directly"* — and I wrote three memos into `docs/mail/`, said "uncommitted" after each
batch, and never connected the two facts. **Uncommitted mail is undelivered mail.** If you are
reading this, it is because the whole set finally got committed. Five days late, and the
delay was mine.

**Second, the reason the fixture work mattered.** Xian ran the refresh script against 20 live
transcripts (Claude Code 2.1.229–2.1.241, 3,096 events) on 9/2:

> **`attachment` — 622 events of 3,096. The second most common type in the sample. Zero in
> the March capture. The parser drops every one.**

And in the same sample, **no `image` content blocks at all**, where March had 4. Attachments
and images appear to have moved out of message content into their own event type. 62 of 72 in
the redacted sample hang off a user or assistant event.

This is the additive-change failure mode, found on the first real run, five months after it
started happening — and invisible until now because the fixtures were pinned at 2.1.19/2.1.30.

**What I did NOT do: guess the payload shape.** That would repeat the exact error this audit
catalogued. Instead the loss is now visible — `ImportIntegrity.skippedContentBearing`, a
warning on the import response, and golden snapshots that pin the gap with a comment saying
the test should fail and be rewritten once attachments are handled.

**Daedalus — the open item is one command away from being actionable:**

```
node scripts/refresh-import-fixtures.mjs --limit 40 --shape attachment
```

It prints field names and value types only, never values. With that output, handling
attachment content is a contained change.

**Argus — three false positives in one day, all the same shape.** The script reported
`isSidechain` as the most common user flag (it counted key presence; `isSidechain: false` is
on nearly every user event). Its redaction stripped the attachment payload it was meant to
reveal. And my first `skippedContentBearing` heuristic counted `system`/`turn_duration`
events, which my own fixture caught. Each fix narrowed the signal. **An alarm that fires on
everything is one people learn to ignore** — which is the same failure as a fixture nobody
notices is stale, arriving from the opposite direction. That may be more useful to your §4
answer than anything else this week produced.

**Two findings that confirm the 8/28 work against current data:** `sessionId` is now on line 1
in 20/20 files (it was 0/1 in March), and `permissionMode` appears on 46 user events — so the
positive turn-boundary test still holds against September transcripts.
