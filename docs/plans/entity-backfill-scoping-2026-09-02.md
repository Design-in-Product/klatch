# Entity backfill — scoping and sizing

**Daedalus, 2026-09-02 (STOP fire).** Answers Ask 1 of
`docs/mail/calliope-to-daedalus-cc-team-xian-decided-backfill-2026-09-02.md`
("scope and size it"), and the follow-up question in
`docs/mail/calliope-to-daedalus-cc-team-xian-correction-paths-bc-already-decided-2026-09-02.md`
("if there's a reason Path B hasn't started that isn't 'nobody re-flagged it'").

**Everything below marked *verified* came from reading the code or running it in this
session. The channel count itself is not verified — see §0.**

---

## 0. What I could not verify, stated first

**The "72" is not checked.** The live `klatch.db` lives outside this worktree
(`packages/server/src/db/index.ts:24-26`: `KLATCH_DB` env, else `<project root>/klatch.db`);
there is no `klatch.db` in `/Users/xian/Development/klatch-worktrees/daedalus/`, and the duty-cycle
sandbox does not reach the main checkout. So every figure in this document that depends on the
real corpus is a *shape*, not a *count*.

That is what `scripts/probe-backfill-entity-sizing.mts` is for. It is read-only, needs no server,
and prints all of it:

```
npx tsx scripts/probe-backfill-entity-sizing.mts /path/to/klatch.db
```

Run it once and this document acquires its numbers. Until then, treat "72" as a figure inherited
from `docs/operations/attention-rollup.md`, not one I measured. In-repo the same population is
described as "~49" in a code comment (`queries.ts:1259`) — two different numbers for the same set,
which is its own reason to run the probe rather than pick one.

---

## 1. Can the existing logic run retroactively? Partly — and the split is the whole answer

Calliope's question was whether `entity-guess.ts` / `entity-resolve.ts` can be pointed at the
already-imported channels, or whether backfill needs its own pass. Both halves are true, and they
are different halves:

**The *guess and resolve* half runs retroactively, unchanged.** Verified by reading both modules:

- `guessEntityName(firstUserMessage, projectName)` (`entity-guess.ts:78`) is a pure function of two
  strings. Both are reconstructable from the DB after the fact — the opener is
  `SELECT content FROM messages WHERE channel_id=? AND role='user' ORDER BY rowid ASC LIMIT 1`,
  and the project name joins through `channels.project_id`. No filesystem, no source JSONL, no
  network. I ran it against a synthetic DB in this session and it proposes names fine.
- `resolveImportEntity` (`entity-resolve.ts:66`) is likewise pure w.r.t. the DB — its
  reuse-by-name rule is exactly what a backfill wants, because it is what turns five channels that
  all say "Daedalus" into one Daedalus rather than five.

**The *write* half does not exist and is not `importSession`.** This is the part that needs its
own pass, and it is bigger than it looks, because the binding is stored in two places.

## 2. The binding lives in two places, and the rows split into three populations

From `queries.ts: importSession` (the write) and `queries.ts: entityTranscriptWhere` (the read),
verified by reading both:

| | population | where it lives | who reads it |
|---|---|---|---|
| **P1** | channels bound to `default-entity` | `channel_entities` row | the UI, and the *user*-message half of the entity transcript (the `EXISTS` clause) |
| **P2** | assistant rows stamped `entity_id = 'default-entity'` | `messages.entity_id` | the *assistant* half of the entity transcript (first disjunct) |
| **P3** | assistant rows with `entity_id IS NULL` | `messages.entity_id` | **nobody** |

`importSession` stamps `boundEntityId` onto every assistant row it writes
(`queries.ts`, the `insertMsg.run(assistantMsgId, ..., boundEntityId, ...)` call), so a
pre-confirm import puts `default-entity` in **both** places. **A backfill that re-points
`channel_entities` and stops looks completely repaired in the UI and leaves the agent's own
answers pooled on the default entity.** That is the trap, and it is the one that would produce
exactly the reported symptom — wiring correct, content wrong.

### P3 is the finding I did not expect, and it is measured

`messages.entity_id` was added by `ALTER TABLE messages ADD COLUMN entity_id TEXT`
(`db/index.ts:103`) with no default. Anything imported before that migration has `NULL` there.

Now read the entity-transcript predicate (`queries.ts: entityTranscriptWhere`, verbatim):

```sql
(m.entity_id = ?
  OR (m.role = 'user' AND m.entity_id IS NULL AND EXISTS (
        SELECT 1 FROM channel_entities ce
        WHERE ce.channel_id = m.channel_id AND ce.entity_id = ?)))
```

An **assistant** row with `entity_id IS NULL` satisfies neither disjunct. The first fails (`NULL = 'x'`
is not true); the second requires `role = 'user'`.

**I did not stop at reading it.** I built a fixture DB with a channel whose assistant rows are NULL,
ran that exact clause against it, and counted:

```
channel c-c1 has 2 assistant rows in the table
entity transcript for 'default-entity' → includes c-c1's user row only
entity transcript for 'e-argus'        → includes nothing from c-c1
```

Both assistant rows are invisible to every entity, the default included. **Re-pointing
`channel_entities` does not reach them, and neither would re-importing** — the rows are already
written. This is a second, independent reason carried context could measure short, and it is
orthogonal to which entity a channel is bound to.

Whether P3 is non-empty *on xian's DB* is the one thing the probe must answer before this
paragraph means anything operationally. I searched `docs/` for a prior record of it
(`entity_id IS NULL`, `NULL assistant`) and found only the *user*-row case, which is the
deliberate one Argus closed on 8/13. If it is already known somewhere I did not look, this is a
rediscovery, not a discovery.

## 3. The 80-char ceiling — backfill is strictly better than re-import

`session-scanner.ts:106`: `FINGERPRINT_MAX_CHARS = 80`. The live import path hands
`guessEntityName` **the first 80 characters** of the opening human turn and nothing more.

A backfill reading from the DB has the whole opener. So there is a class of channel where the
backfill can find an identity claim that the live import path structurally cannot see — a session
that opens "Pull from origin and read docs/COORDINATION.md before doing anything. You are
Daedalus, …" guesses `Daedalus` from the DB and falls back to the project name live. Demonstrated
in the fixture; the probe counts the class on real data and prints each instance.

This matters for the framing: **backfill is not a catch-up operation to something the live path
already does better. On this axis it does strictly more.** "Just re-import everything" was never
equivalent, and now there is a reason beyond convenience.

## 4. What the work actually is

Three pieces, in dependency order.

**(a) The review sheet — built, this session.** `scripts/probe-backfill-entity-sizing.mts`.
Read-only, `readonly: true`, no migrations, selects exactly one message body per channel (the
opener, which *is* the guess input) and has a `--no-openers` flag for even that. Prints P1/P2/P3
counts, the proposed name and basis per channel, which names reuse an existing entity vs. mint a
new one, and every 80-char-ceiling case. **This is the artifact xian needs to make the call**,
because backfill is a guess-and-confirm operation and the sheet is the confirm.

**(b) The apply pass — not built.** A transaction per channel: re-point the `channel_entities`
row, `UPDATE messages SET entity_id = ? WHERE channel_id = ? AND role = 'assistant'` (covering
both P2 and P3 in one statement), minting or matching via `resolveImportEntity`. Mechanically
small — the hard parts are all in (a) and (c). Needs: a dry-run/apply flag pair, a backup of the
DB taken before it runs, and a reversal record (which channels moved from what to what) so a bad
batch is undoable without restoring the whole file.

**(c) The confirm — a decision, not code.** `entity-guess.ts:9-12` says it outright: a confirmation
the user cannot evaluate is a rubber stamp. 72 guesses is too many to confirm one at a time and too
many to wave through in one click. The middle path that fits the existing design is: apply only the
`identity-claim` guesses (the strong basis, and the one the module was built to trust), leave
`project-name` and `none` for a human. The probe prints that split, so the size of each bucket is a
measurement, not a guess.

**Sizing, held to what I can defend.** (a) is done. (b) is small — call it one focused session,
most of it on the undo record rather than the UPDATE. (c) is xian's, and its cost depends entirely
on the basis histogram (a) prints. **I am not giving a number for the whole thing before the probe
has run**, because the honest estimate branches on whether P3 is empty and on how the 72 split
across bases. Give me that output and the estimate is real rather than performed.

---

## 5. Path B — there IS a reason it hasn't started, and it isn't inattention

Calliope's correction memo is right that Paths B/C were resolved 8/10 in
`docs/ux/spec-composition-gesture.md` §11a, and right that continuity #2/#3 shipping cleared the
stated sequencing condition. But §11a clears Path B's blocker on a premise that is **false in the
shipped client**, and that is the reason not to start.

§11a:239, verbatim: *"Its blocker is gone: before increment #1 … an inline import would have bound
the agent to the shared default entity … Imports now mint a real entity via guess-and-confirm."*

Verified this session, by reading the client:
`packages/client/src/api/client.ts:621-634` — `importClaudeCodeSession` POSTs `sessionPath`,
`channelName`, `forceImport`. **No `entityId`. No `entityName`.** The server half is correct
(`routes/import.ts:275` calls `resolveImportEntity` properly), but with no name in the body
`resolveImportEntity` returns `disposition: 'default'` (`entity-resolve.ts:77-80`) and
`importSession` falls through to `DEFAULT_ENTITY_ID`.

So an inline JIT import built today would do precisely the thing §11a describes as "the exact
broken thing," and would add to the backfill population rather than avoiding it. This matches
Theseus's independent measurement the same day
(`docs/research/friday-import-entity-binding-2026-09-02.md`) — reached from the client source
rather than from his probe, so it is two roads to the same place.

**Path B's real blocker is Iris's import confirm step** (`docs/ux/import-confirm-step-scope-2026-08-09.md`,
flagged 21 days idle in `iris-to-xian-cc-team-import-confirm-step-scope-doc-21-days-idle-2026-08-30.md`).
Not continuity #2/#3. §11a named the wrong dependency — understandably, because on 8/10 the server
half had just shipped and the client gap is invisible unless you read the request body.

**Path C → "continue existing role"** does not depend on any of this. The picker already
enumerates entities; it binds an existing entity to a new channel and never goes through the import
path. That one is genuinely unblocked and genuinely small.

### Correction filed to `daedalus-tasks.md` item 8

Item 8 read as an open orphan needing an xian call. It is not; §11a decided it 8/10. Item 8 updated
in this session to match §11a **and** to record that §11a's blocker-clearance is stale — otherwise
the correction to Calliope's memo just installs a second wrong belief in place of the first.

---

## 6. Reproduce

```bash
# the review sheet, against the real DB (read-only)
npx tsx scripts/probe-backfill-entity-sizing.mts /path/to/klatch.db

# the synthetic exercise used to build and check it (gitignored fixture)
node .testdata/r140/make-fixture.mjs
npx tsx scripts/probe-backfill-entity-sizing.mts .testdata/r140/fixture.db
```

Fixture covers: identity claim inside 80 chars; identity claim past 80 chars (the ceiling case);
pre-migration NULL assistant rows (P3); no claim at all (project-name fallback); a channel already
carrying a second entity; and a control channel not bound to the default, which must not appear in
the sheet. All six discriminate correctly.

**Not done, written down rather than guessed at:**

- The probe reads the *DB's* first user message. The scanner read the *source JSONL's* first
  non-meta human event. Those filters are not identical (`session-scanner.ts` skips
  `isMeta`/`isCompactSummary`/`isSidechain`/tool-results; `parser.ts` has its own). I did not
  measure whether they ever disagree on real data — for backfill it does not matter, since the DB
  is what exists, but it means the probe's `live80` column is a *reconstruction* of what the
  scanner would have seen, not a recording of what it did see.
- No apply pass. Nothing in this session writes to any database.
- Whether P3 is non-empty on the real corpus. Predicted from the schema history, demonstrated on a
  fixture, unmeasured in production.
