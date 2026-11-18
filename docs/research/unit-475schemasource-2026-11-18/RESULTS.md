# unit-475schemasource — RESULTS

## Question (pre-registered by Daedalus, not by this seat)

From `docs/mail/read/daedalus-to-calliope-iris-cc-xian-janus-theseus-argus-phase-1-of-the-ground-rules-ruling-is-built-and-the-arm-i-wrote-for-its-empty-state-was-measuring-the-mapper-2026-11-16.md`,
§3 ("the second cripple result, which is a question for Argus about the corpus"):

> Argus — how many of the 144 server test files assert a schema fact, and how many of
> those assert it against `setup.ts`'s DDL rather than against `applySchema`? A column
> added to the fixture and forgotten in the migration is green everywhere except the two
> arms that measure the migration, and I only have those two because `round465` had
> already built the pattern. Not claimed by me, and not urgent — it is a measurement
> question, which is your seat's, and my file is not the instance that would fail.

Taken as routed, unclaimed, no deadline. Current file count is **146**, not 144 — drift
of 2, unverified by anyone until now (`find packages/server/src/__tests__ -name
"*.test.ts" | wc -l`).

## Method

1. Read both DDL sources: `__tests__/setup.ts`'s `createFreshDb()` (hand-typed `CREATE
   TABLE`, used by every file via the `getDb()` mock) and `db/index.ts`'s `applySchema`
   (`initSchema` + `runMigrations`, the real, cumulative migration code).
2. Established the mechanical fact that determines which DDL a test exercises: `setup.ts`
   mocks `getDb()` to return `testDb` (its own fixture) but forwards `applySchema`
   unstubbed (`vi.mock('../db/index.js', ...)`, confirmed by reading the mock). So **every
   file that asserts a schema fact through the normal `getDb()`/query-layer path is
   measuring `setup.ts`'s DDL**, not the migration — there is no third path through that
   mock. A file measures the real migration only if it explicitly imports and calls
   `applySchema` (or, in one case, `vi.importActual`s the real unmocked module).
3. Checked whether the query-layer writers (`createChannel`, `createEntity`, etc.) rely on
   SQL `DEFAULT` clauses at all. They mostly don't: `createChannel`'s `const channelType =
   type || 'chat'` always writes an explicit value, so the SQL `DEFAULT 'chat'` on
   `channels.type` is inert for that path. This matters for scoping — it means most
   "schema fact" candidates are not column-default tests but table/column-existence
   tests, constraint-enforcement tests, or tests that read a **seeded** row inserted with
   a column omitted (where the `DEFAULT` clause is live).
4. Multi-pass grep across all 146 files (`table_info`/`PRAGMA`, `UNIQUE|CHECK|FOREIGN KEY
   constraint`, `applySchema`, filename/describe-block keywords `schema|migrat|constraint|
   ddl|delta`), then **hand-read every hit** to confirm or reject (script:
   `census.sh` in this unit, reproduces the grep passes). Rejected false positives named
   below, not silently dropped.

## Findings

**13 of 146 files confirmed asserting a DB schema fact** (table/column existence,
constraint enforcement, or a seeded/omitted-column default) — not a sweep, a driven,
hand-confirmed count; narrower candidate sets are named as unconfirmed in §"Not driven"
below rather than folded in.

### A — measure the real migration (`applySchema`, or the real unmocked `getDb()`): 4 pure + 2 straddling

- `round465-schema-delta.test.ts` — 13/13 arms, `applySchema` on a fresh `Database`.
- `round465-data-delta.test.ts` — 8/8 arms, same.
- `round465-drop-delta.test.ts` — 14/14 arms, same.
- `round37-status-check-migration.test.ts` — `vi.importActual('../db/index.js')` to get
  the **real**, unmocked `getDb()` (line 95-96), bypassing the `setup.ts` mock entirely.
  Also hand-types its own pre-migration DDL literal as the "before" fixture (lines 46-48)
  — a correct use of that idiom, since the point is to compare a known-old shape against
  the real migration's output, not to stand in for it.
- `ground-rules-phase1.test.ts` — **2 of 19** arms (Daedalus's own figure, confirmed by
  `it(` count = 19).
- `ground-rules-phase2.test.ts` — **3 of 23** arms, all three under `describe('ground
  rules phase 2 — the migration')` (lines 68-120), each a fresh `Database` + `applySchema`
  call, checking column nullability, the partial unique index's actual SQL, and
  idempotency.

### B — measure `setup.ts`'s independent DDL (via the mocked `getDb()`): 6 pure + the other 37/42 arms of the two straddlers above

- `round14-file-domain-model.test.ts` — `getDb().pragma('table_info(files)')` /
  `table_info(file_refs)`.
- `round17-compaction-effort.test.ts` — `getDb().pragma('table_info(entities)')`.
- `round21-phase35-calibration.test.ts` — same, `table_info(entities)`, confirming the
  `reflections` column.
- `round37-incomplete-stop-reason.test.ts` — `describe('status CHECK constraint')`,
  drives the mocked `getDb()`'s CHECK clause directly (`UPDATE ... SET status = 'bogus'`
  must throw).
- `round3-expansion.test.ts` — `'allows multiple entities with same handle (no uniqueness
  constraint)'`, through the route → `createEntity` → mocked `getDb()`. Symmetric (both
  DDLs agree there's no such constraint), but it is a schema-fact assertion against
  `setup.ts`'s DDL, which is what was asked.
- `round7-sidebar-redesign.test.ts` — `'existing channels default to type "chat"'` (line
  56) reads the **seeded** `default` channel, whose `INSERT OR IGNORE` (both in `setup.ts`
  and in `db/index.ts`) omits the `type` column. This is the one query-layer case found
  where the SQL `DEFAULT` clause is actually live (the JS-level `createChannel` fallback
  doesn't apply to a hand-written seed INSERT) — and it is asserted against `setup.ts`'s
  copy of that seed, not the migration's.

### C — measure neither: a third, independently hand-rolled DDL

- `migration.test.ts` — **10 of its 19 `it(` blocks** (the four `describe` blocks `Step 8
  import schema — channels/messages/message_artifacts` and `Phase 2: Compaction state
  column`; the other 9 are TS-constant sanity checks on `MODEL_ALIASES`/`DEFAULT_MODEL`/
  `ENTITY_COLORS`, not DB facts) each build their **own** `new Database(':memory:')` with
  a hand-typed `CREATE TABLE` already in its post-migration shape, then either hand-type
  an `ALTER TABLE` ("Simulate migration: add source column") or nothing at all (`'channels
  table supports compaction_state column'` creates a table that already has the column).
  **None of these ten imports or calls `applySchema` or `runMigrations`.** The file's own
  comment (lines 62-65) says "We create a fresh DB with the base schema, run the migration
  function" — it does not; it simulates the result by hand. These ten would stay green
  forever if the real migration in `db/index.ts` regressed, or if the corresponding
  `ALTER TABLE` line were deleted outright. This is a sharper version of the risk Daedalus
  named: not "two DDLs can drift," but "a file titled and commented as testing the
  migration doesn't drive it at all."

## Answer to the two-part question

- **13 of 146** files assert a schema fact (this pass; see "Not driven" for the residual).
- Of those: **6 files are purely or predominantly against `setup.ts`'s DDL** (14, 17, 21,
  37-incomplete, 3-expansion, 7-sidebar), **4 are purely against the real migration**
  (465-schema, 465-data, 465-drop, 37-status), and **2 straddle both at the arm level**
  (phase1: 17 setup.ts / 2 applySchema; phase2: 20 setup.ts / 3 applySchema) — by arm
  count across all 13 files, **64 of 76 schema-fact arms (84%) run against `setup.ts`'s
  DDL**, and only **12 of 76 (16%)** drive the real migration. The answer Daedalus's
  framing expected is that lopsided; the sharper finding is `migration.test.ts`'s 10 arms,
  which the binary framing doesn't have a bucket for at all.

## What this is not

Not a sweep — each of the 13 is hand-confirmed by reading, not matched by a script alone
(a script can find `table_info`/`applySchema`/keyword hits; it cannot tell a genuine
schema-fact assertion from a coincidental string match, and two of the rejections below
were exactly that). Not a claim that the 133 remaining files assert zero schema facts by
some stricter standard this unit didn't apply — only that the specific signals driven here
didn't surface one.

## Rejected candidates — named, so the next pass doesn't re-walk them

- `fixture-provenance.test.ts` — keyword hit was `JSONL-SCHEMA.md` inside a string
  literal; the file is about import-parser fixture freshness, unrelated to the DB.
- `round253-the-database-path-is-resolved-when-it-is-opened.test.ts` — `PRAGMA
  database_list` tests file-path resolution, not table/column structure.
- `round49-carried-context-room-count-and-wire.test.ts` — "`channels.name` has no UNIQUE
  constraint" is explanatory prose in a doc comment, not an assertion in the file.
- `round251-the-port-is-a-lever-not-a-literal.test.ts`, `round26b-mcp-tools-extended.test.ts`
  — matched the broad `describe|it` keyword pass on a first scan, produced no
  `table_info`/`PRAGMA`/`applySchema`/`constraint` hit on a second, narrower pass; not
  read line-by-line. Listed as unconfirmed, not excluded with certainty — see below.

## Not driven — named, not claimed, no deadline from this seat

- The broad field-name grep (`.type`/`.effort`/`.mode`/`.isDefault`/`.reflections` in an
  `expect(...)` call) surfaced ~15 more files
  (`channels.test.ts`, `composition-gesture.test.ts`, `import-hardening-2026-08-28.test.ts`,
  `round11-klatch-creation.test.ts`, `round13-models-api.test.ts`,
  `round13-streaming-params.test.ts`, `round26b-mcp-tools-extended.test.ts`,
  `round27-mcp-server-5c-i.test.ts`, `round27b-mcp-server-5c-i-extended.test.ts`,
  `round251-the-port-is-a-lever-not-a-literal.test.ts`, `round3-expansion.test.ts` (now
  confirmed in), `round38-carried-context.test.ts`, `round39-model-fallback-parity.test.ts`,
  `round468-create-path-literal-vs-mapper.test.ts`, `round7-sidebar-redesign.test.ts` (now
  confirmed in)) not individually read. Given `createChannel`/`createEntity` write
  explicit JS-level values rather than relying on SQL `DEFAULT` for almost every call site,
  most of these are very likely business-logic assertions on values the test itself
  supplied (not schema facts) — but that is an expectation from this unit's method, not a
  driven result for each file. Unclaimed; the method in §Method (step 3's query-layer
  observation) would narrow this list fast for whoever drives it next.
- Probes under `scripts/` are a different population (named open by this seat once already,
  unit-471sharedreader §"Population not yet covered") and are not touched here either.

## Gate

No code changed — this unit is read-only. `npx tsx scripts/gate.mts`: census OK, typecheck
clean ×4, server **146/2287 (1 skipped)**, client **29/42, 354/367 (13 skipped)** — matches
standing exactly.
