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

**(b) The apply pass — ~~not built~~ BUILT 2026-09-09 (Round 175).** See §7 below for what
shipped, what it refuses to do, and the two things still open. *Original scoping, left standing
because the build followed it:* a transaction per channel: re-point the `channel_entities` row,
`UPDATE messages SET entity_id = ? WHERE channel_id = ? AND role = 'assistant'` (covering both P2
and P3 in one statement), minting or matching via `resolveImportEntity`. Mechanically small — the
hard parts are all in (a) and (c). Needs: a dry-run/apply flag pair, a backup of the DB taken
before it runs, and a reversal record (which channels moved from what to what) so a bad batch is
undoable without restoring the whole file.

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
- ~~No apply pass. Nothing in this session writes to any database.~~ **Superseded by §7 (2026-09-09).**
- Whether P3 is non-empty on the real corpus. Predicted from the schema history, demonstrated on a
  fixture, unmeasured in production. **Still true on 2026-09-09** — the apply pass handles P3, and
  nobody has yet counted it anywhere but a fixture.

---

## 7. The apply pass, built — Round 175, 2026-09-09 (Daedalus)

§4(b) is built. `packages/server/src/db/entity-backfill.ts` (logic) +
`scripts/backfill-entity-bindings.mts` (CLI) + `round175-entity-backfill.test.ts` (17 tests,
in-memory DB).

**Three functions, and the split is deliberate.** `planEntityBackfill` reads and mints nothing;
`applyEntityBackfill` writes only what a plan already enumerated; `undoEntityBackfill` reverses a
run from its record. Planning cannot mint, so a review pass cannot half-perform the operation it
is reviewing.

**What it moves, per channel, in one transaction:** the `channel_entities` row off
`default-entity` and onto the resolved agent (P1), **and** every assistant row in that channel
that was stamped `default-entity` (P2) or left NULL (P3). Both or neither. §2's trap — a
re-point that looks repaired in the UI and leaves the agent's answers pooled on the placeholder —
is what the round is guarding against, so the load-bearing test is not on the binding: it asserts
`getEntityTranscript(newAgent)` contains the user turn, the P2 reply **and** the P3 reply, and
that `getEntityTranscript(DEFAULT_ENTITY_ID)` is empty afterwards.

**Four reasons it refuses to move a channel**, each reported by name rather than folded into a
count:

| reason | why |
|---|---|
| `no-guess` | `guessEntityName` found nothing. A human has to name it. |
| `basis-excluded` | The guess's basis is outside the run's filter. Default filter is `identity-claim` only — §4(c)'s middle path, now a flag (`--bases=`) rather than a decision baked in. |
| `multi-bound` | The channel already carries a second, non-default entity. Which agent the assistant rows belong to is then a per-message judgement, not a re-point. |
| `resolves-to-default` | **The one I did not anticipate when scoping.** The seeded default agent is named "Claude" (`db/index.ts:351`), so a session opening *"You are Claude"* matches it by name and "moving" it is a no-op. Applying it anyway would report a success for a channel that did not move — the Round 171/173 shape one layer over: a placeholder the caller cannot tell from an answer. |

**Scope is stated, not implied.** Only `source IN ('claude-code','claude-ai')` — the predicate the
"72" was measured with (`composition-continuity-gap-2026-07-19.md:140`). `native` and `klatch`
channels bound to the default are **counted and printed** as out-of-scope rather than silently
dropped, because "we left N channels alone" should be a number the operator sees.

**A dry run cannot write to the database it reports on.** `getDb()` runs schema init and
migrations on whatever it opens — additive and idempotent, but still a write, and a review pass
that mutates the thing under review is the wrong shape. So every invocation takes a `db.backup()`
snapshot from a **read-only** handle first; the dry run plans against the snapshot and deletes it,
and `--apply` keeps that same snapshot beside the DB as the backup. Verified on a file-backed
fixture: after a dry run the fixture's entity table and channel count are unchanged.

**Two ways back from an apply, both exercised end to end on that fixture:** restore the snapshot,
or `--undo=<record>`. The record stores **message ids, not a predicate**, because after a run P2
and P3 rows are indistinguishable — both carry the new entity id, and only the record remembers
which were NULL. Undo restores P2 to `default-entity`, P3 to NULL, re-points the binding, and
deletes a minted agent **only if nothing references it** — an agent minted by the backfill and
then used by a later import is not this run's to delete. Row-level comparison after the round
trip: `messages`, `channel_entities` and `entities` all identical to the pre-apply backup.

**2026-09-10, Round 184 — undo as first built wrote every record channel without reading it.**
Theseus's Round 183 (`docs/research/round183-the-undo-record-against-the-database-it-is-aimed-at-2026-09-10.md`)
aimed records at databases that had moved past them. An older record undone after a re-apply
half-reverted the newer run. A record from another database was reported as "failed part-way".
And a correct undo, those two, and an undo after a backup restore all printed the same success
line. Undo now classifies each channel inside the transaction that writes it (`revert`,
`already-reverted`, `changed-since`, `not-in-database`) and writes only `revert`. A changed channel
is named, with who is seated now, and left: undo does not guess between the run's writes and later
ones. Counts come from `.changes`. `planEntityUndo` exposes the same classification without
writing. **Not done:** `--undo` still writes without `--apply`.

**2026-09-10, Round 186 — undo knew a run by its agent id, and a name-matched agent has one id for
every run.** Theseus's Round 185 (`docs/research/round185-what-the-undo-classifier-knows-a-run-by-2026-09-10.md`):
when both runs matched an existing agent by name, an older record undone after a re-apply passed the
`revert` test and wrote the channel. A reply the newer run had moved stayed stamped to an agent no
longer seated there, exit 0 (N4). The newer record was then refused (N5). The stamps can't settle it:
a reply the app wrote while the agent sat there and a reply a later run moved carry the same stamp.
So apply now records the binding's own `added_at` (`toAddedAt`), and `revert` requires it to match.
Records without the field keep the old rule. Second resolution is a stated limit: two applies of one
channel inside one second look like one run. **Consequence, by design:** the older record is refused
even when nothing was written between the runs (his N1 control), because from the database alone
that case looks exactly like N4. The advice is now always true: undo the newest run first. Also
(M2): any channel left as changed exits 2, whether or not others were written beside it.

**2026-09-11, Round 188 — which way the binding moved, and the fields that decide it are checked.**
Theseus's Round 187 (`docs/research/round187-the-binding-rule-at-the-inputs-it-was-argued-from-2026-09-10.md`)
drove the rule at the snapshot restore it was chosen for, and it held: the newer record is refused and
writes nothing, and the older record settles the database pristine, bindings' `added_at` included. Two
things were open.
- **S2:** the refusal tested *different*, so after a restore it blamed "a later binding" when the binding
  it read was earlier, and its advice sent the operator to a newer record.
  - Now `boundBeforeRun` (earlier) and `reboundSince` (later) are separate. Only `datetime('now')`
    writes `added_at`, and the check below holds records to the same fixed-width form, so string
    order is time order.
  - An earlier binding is named as a database from before the run, and the advice points to the older
    run's record.
  - Disposition and exit are unchanged.
  - **So "undo the newest run first" holds unless the database was restored from a backup.** In that
    case, use the record of the run the backup is from.
- **G1/G2:** `checkUndoRecord` read neither `added_at` field, though `toAddedAt` decides a refusal and
  `fromAddedAt` is written into the roster ordering column. Each must now be absent, `null`, or the
  `YYYY-MM-DD HH:MM:SS` form. Absent and `null` stay legitimate, because they are records from before
  each field existed.

A clock that runs backwards also gives an earlier binding, and it would be named as a restore. Not
engineered around.

**Verification.** 17 tests. Negative controls, each applied to the working tree and reverted:
drop the P3 half of the stamp → 2 fail; remove the `resolves-to-default` guard → 1 fails; remove
the `unbind` so the default binding stays alongside the new one → 3 fail. Suite: server
**1561 → 1578** across **101** files, client 311/311 + 13 skipped unchanged (no client file
touched), `npm run typecheck` clean ×3.

### Still open, and both are xian's

1. **The sizing still needs one run against the real `klatch.db`.** Unchanged from §0 — no agent's
   worktree reaches it. The dry run *is* the review sheet now, so the same single command answers
   "how big is this" and "what would it do":
   `npx tsx scripts/backfill-entity-bindings.mts /path/to/klatch.db`. It writes nothing.
2. **The confirm (§4(c)) is still a decision, not code.** The build's default — apply
   `identity-claim` only — is the middle path §4(c) proposed, not a ruling. `--channels=<ids>`
   exists so the honest version is available too: review the sheet, hand back the ids you approve,
   apply only those.

   **2026-09-09, Round 178 — that round trip did not work when it was written, and now does.**
   Theseus drove the CLI as a subprocess (Round 176,
   `docs/research/round176-backfill-cli-driven-end-to-end-2026-09-09.md`) and found the sheet
   printing 8-character ids while `--channels` matched full uuids: ids copied straight off the
   sheet returned `Candidates: 0` and **exit 0**, indistinguishable from a corpus with nothing to
   fix. `--channels` now matches unambiguous prefixes, so the ids you can see are the ids it
   takes, and an entry that resolves to nothing — or to more than one channel — is echoed by name
   and refuses the run rather than applying the subset that did resolve. §4(c) is a live option
   again, not a documented one.

### Not claimed

No run against any real corpus. Every number in this section is from unit tests or the gitignored
`.testdata/r175` fixture. The apply pass has never been pointed at a database that anyone cares
about, and the first time it is, it should be with `--apply` omitted.
