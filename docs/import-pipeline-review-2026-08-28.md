# Import pipeline review — three-reviewer panel, 2026-08-28

*Correctness · format-dependency · devil's advocate. Run as three independent
reviewers with no visibility into each other's findings. Where two of them
converged on the same defect from different methods, that is noted — those are
the highest-confidence items here.*

---

## The headline

Two reviewers independently measured the same live defect against the repo's own
committed capture, `exports/sessions/theseus-2026-03-22.jsonl` (1,001 events,
689 conversation events, Claude Code 2.1.73/2.1.81):

> **Of 75 turns the parser emits, 6–7 are fabricated.** Machine-generated user
> events — `<command-name>/login`, `<local-command-stdout>Login successful`,
> `Unknown skill: rate-limit-options` — carry real text and no `isMeta` or
> `isCompactSummary` flag, so `isHumanTurnBoundary` accepts them as human turns.
> One of them **split a real turn and stole 269 characters of assistant text**,
> leaving the human's actual question showing as unanswered.

`isHumanTurnBoundary` (`parser.ts:255–281`) tests for the *absence* of two flags.
Every format change of the past year has been *additive* — new fields, new record
types — so a negative test is exactly the wrong shape: each new injected message
type silently becomes a fake human turn.

**And the correct discriminator is already documented in this repo.**
`docs/JSONL-SCHEMA.md` says: *"Real human message | Has `permissionMode`."* The
parser does not use it.

---

## Highest-severity defects

**1. `memories.json` returns empty on every real export — silent total loss.** *(FIXED 2026-08-28 — see the addendum in the Daedalus/Argus/Theseus memo.)*
`claude-ai-zip.ts:249–291`. The team's own schema analysis
(`research/claude-export-format-analysis.docx`) documents memories.json as *"a
single-element array with one object"* whose fields are `conversations_memory`
(a **string**), `project_memories`, `account_uuid`. `Array.isArray(parsed)` is
true → the loop requires `mem.uuid || mem.id` → the real object has neither →
skipped. The object branch is guarded by `!Array.isArray(parsed)` and is never
entered. `joinIfCharArray` — the char-array fix — **is unreachable on real
data**. Simulated against three shapes: real export → `([], {})`; the memo's
char-array variant → `([], {})`; the hand-made test shape → works.
Downstream: `memoryMd = undefined`, `projMem = ''`. Every claude.ai-imported
project gets empty memory, and the preview reports "0 memories" so the user sees
no signal. `CHANGELOG.md:182` and `docs/PROMPT-ASSEMBLY.md:69` both claim this
works.

**2. `parentUuid` is declared and never read.** `parser.ts:43`. Zero production
reads across `packages/server/src`. Ordering is a flat timestamp sort; turns are
index ranges. Measured on the real file: 2 roots, 44 orphaned conversation
events, 10 fork points, 171 duplicate timestamps. Consequences: sibling branches
from a rewound session are silently *interleaved* rather than chosen, so the
reader sees one conversation composed of two; and at 9 of 10 forks a queued user
message is timestamped ~2ms before the in-flight assistant reply it followed, so
the reply is attached to the wrong turn. `parser.test.ts:217` is titled *"groups
events into turns based on parentUuid=null user messages"* — describing behavior
the code does not implement.
*Upside worth stating:* because nothing traverses, cycles cannot hang the parser
and the 44 real orphans are not dropped, which a naive strict walker would have
done.

**3. `sessionId` read from `rawEvents[0]` only.** `parser.ts:388`. Real files do
not begin with a conversation event — line 1 of the committed capture is a
`file-history-snapshot` with no `sessionId`, while 897 of 1,001 lines carry it.
The line directly below correctly does `rawEvents.find(e => e.cwd)`. Result:
`session.sessionId` undefined → the 409 dedup check is skipped → **unlimited
duplicate imports**, and `originalSessionId` is absent from `source_metadata`, so
the channel is permanently invisible to `findChannelByOriginalSessionId`.
Separately, `session-scanner.ts` derives its dedup key from the *filename*, which
can never match an `originalSessionId` — so Browse shows `alreadyImported: false`
forever.

**4. Crash vector.** `groupIntoTurns:311` sorts with
`a.timestamp.localeCompare(...)`. One conversation event without a timestamp
throws and aborts the whole import with a 500. 105 events in the real capture
lack a timestamp; none are conversation events *yet*. Claude Code 2.1.69 shipped
a fix for its own `/stats` crash on "transcript files [containing] entries with
missing or malformed timestamps," so this shape exists in the wild.

**5. Fidelity loss the type annotation denies.** `ParsedArtifact.type` advertises
`tool_use | tool_result | thinking | image`; `extractToolArtifacts` emits only
`tool_use`. Measured on the real file: **415 KB kept, 1,597 KB discarded** — 47
thinking blocks, 213 tool_results, 4 images. Dropping base64 screenshots is
defensible. Dropping every tool *result* keeps "Read foo.ts" and discards the
file contents, and nothing records that it happened.

**6. Selective import imports what the user didn't select.**
`routes/import.ts:615`: `if (selectionSet && conv.uuid && !selectionSet.has(...))`
— `conv.uuid &&` short-circuits, so a conversation with no uuid passes the filter
and is imported regardless of selection, then also skips dedup.

**7. Partial batch import is indistinguishable from total failure.**
`routes/import.ts:611–686`. Per-conversation transactions, non-transactional
loop. Conversation 40 of 100 throws → 500 with no `imported` array → 39 channels
are in the DB and the response names none of them.

Also found: compaction summary uses earliest-wins inline and latest-wins from
files (opposite rules, stale one preferred, and it never reaches
`compaction_state` so re-export drops it); every assistant message carries the
*user's* timestamp; a wrong entity guess leaves `messages.entity_id` permanently
mis-stamped even after the entity is removed; `joinIfCharArray` fails on any
astral character (one emoji voids a whole memory); and the project-directory
decoder is wrong today for any cwd containing `.`, `_` or a space, and for paths
over 200 characters.

---

## Format-dependency: the risk is real but misdiagnosed

Every documented Claude Code transcript change in the past year has been
**additive** — no field Klatch reads has been renamed or removed across 232
releases. Klatch's positive whitelist (only `user`/`assistant`, only
`text`/`tool_use` blocks) is structurally tolerant of that and has survived
untouched since March.

So the vendor's disclaimer *overstates* the risk to a whitelist parser and
*understates* it to a negative-flag one. Klatch is both, and the negative-flag
half has already failed.

**No official API is a lower-risk source.** `/export` is lossy rendered text;
`claude -p --resume ... --output-format json` costs a model call and returns only
the new answer; the hooks' `transcript_path` points at the same JSONL and is
documented as lagging. File parsing is the only route to bulk historical import.
Harden it; there is nothing to migrate to.

**Transcripts are garbage-collected after 30 days** (`cleanupPeriodDays`), which
makes a `SessionEnd` archival hook worth having independent of everything else.

Defensive patterns worth stealing, from parsers that have survived the churn:
claude-code-log makes every field optional with an `UnknownMessage` class that
preserves the type name rather than dropping it; claude-code-transcripts ships a
round-trip validator that reserializes each parsed line and diffs it against the
source to flag unknown fields automatically. And Klatch already has the right
pattern in `klatch-import.ts:183–197` — a `SUPPORTED_FORMAT_VERSIONS` gate with
a structured error, commented *"accepting a version we don't recognize would
silently drop fields we can't model — the worst kind of fidelity loss."*
**That discipline is applied where the format is ours and absent where it isn't.**

---

## Verdict: freeze, with a canary

The devil's advocate argued for deletion and then talked itself out of it. The
argument that turned it:

- **Carrying cost is near zero.** 31 of 1,896 commits ever touched import; 22
  landed in March 2026; none fixed format drift. Five months quiescent.
- **The imported corpus is the only realistic test data the project has**, and it
  already caught a defect synthetic fixtures missed — `db/queries.ts:635–638`:
  *"Verified against the real March corpus: 1,332 user rows NULL, 1,240 assistant
  rows stamped… Round 36 shipped with the narrow scope because its fixtures only
  ever inserted assistant rows."*
- **Import is now in the inference path.** `getEntityTranscript` unions an
  entity's messages across every channel it belongs to, feeding
  `buildCarriedContextBlock` and the `recall` tool. Delete import and the union
  is a no-op, carried context is empty, and roughly six months of the project's
  most distinctive work becomes dead code.
- **`entity-resolve.ts:88–98` is the most premise-faithful code in the repo** —
  it mints an entity with a deliberately empty system prompt, commented *"an
  imported agent's identity is its transcript, not a role prompt written at
  import time."* Import is the only mechanism by which "the entity IS its
  conversation" is instantiated at all.

So: **keep it, stop investing in it as a product surface, and do not extract
it.** Extraction was tested and lands at zero — Open WebUI's importer request was
closed with no maintainer engagement, the incumbent script covering four vendors
tops out at 70 stars, session-migrate gets 914 downloads a month across 15
harnesses.

Two scoped exceptions:

**The drift canary is not investment, it is the price of freezing safely.** Today
a schema change that empties every turn while preserving boundaries returns
`201 Created, messageCount: 0`. Reject when `turns.length > 0` but zero messages
were inserted; surface `skippedLines` as a warning rather than an optional field;
assert `session.version` against a known ceiling. ~20 lines.

**The claude.ai ZIP path has no defensible remaining claim.**
`claude-ai-parser.ts` + `claude-ai-zip.ts` (329 lines) do what Anthropic's
Desktop 3P wizard does with OAuth instead of a manual download. If anything here
is ever deleted, delete that first — and delete it before the JSONL parser, which
is the piece Anthropic explicitly declined to build (issue #48990, *"Import or
continue claude.ai conversations in Claude Code,"* closed as not planned).

---

## The pattern worth naming

Four times in this review, a document or a type annotation asserts a capability
the code does not have:

| Claim | Where | Reality |
|---|---|---|
| Turns grouped by `parentUuid` | `parser.test.ts:217` (test title) | `parentUuid` never read |
| Four artifact types stored | `ParsedArtifact.type`, file header | Only `tool_use` emitted |
| memories char-array fix works | `CHANGELOG.md:182` | Unreachable on real data |
| Project memory injected | `docs/PROMPT-ASSEMBLY.md:69` | `memoryMd` always undefined |

This is the same failure the citation audit found in the blog earlier today, and
it is the failure AXT was built to detect: **confident self-report of a
capability not possessed.** The project's own thesis, instantiated in its own
artifacts, in two unrelated places on the same day. Stale comments and doc claims
should be treated as defects in their own right here, because they are what a
reader — human or agent — trusts.

---

## The three fixes worth doing now

*(All three landed 2026-08-28, along with the `memories.json` container fix.)*

| Fix | Cost | What it buys |
|---|---|---|
| Make the turn boundary **positive** — require `permissionMode`, with a documented fallback for older files. Add the six flagless events from the committed capture as regression cases. | ~1h | Kills a live 8–9% turn-inflation defect and converts the one dependency where additive change causes silent corruption into one where it causes nothing. |
| **Integrity receipt.** Add `turnsEmitted`, per-type skip counts, and unrecognized top-level types to the import response: *"Imported 69 turns from 689 events; 3 events of unrecognized type `bridge-status` skipped."* | ~2h | Turns every silent failure in this document into a visible one, and makes future churn self-reporting. |
| **Crash-proof and dedup fixes.** `(a.timestamp \|\| '')` in the sort; `rawEvents.find(e => e.sessionId)`; collect the *set* of versions seen, not the first (real files span two). | ~1h | Removes a documented 500 vector and a silent dedup-disable. |

Refreshing the golden fixtures is the fourth item and the largest: the current
ones are hand-written at Claude Code 2.1.19/2.1.30, seven months and 220+
releases stale, and they contain none of the shapes that actually break the
parser. They prove it handles a format nobody runs.

## Status as of end of day 2026-08-28

Fixed: turn boundary, crash-proof sort, sessionId scan, versions set, integrity receipt,
`memories.json` container unwrap, astral-safe char arrays, all four artifact types
(including the real root cause — tool results arrive on user events), compaction
latest-wins, assistant timestamps and ids, selective-import uuid filter, batch partial
reporting, project-directory encoding, drift canary.

Deliberately deferred: `parentUuid` tree-walking — now measured and reported in
`integrity.treeShape` rather than rewritten, per the freeze recommendation. See
`docs/logs/2026-08-28-cowork-import-hardening-log.md`.

## Still open
