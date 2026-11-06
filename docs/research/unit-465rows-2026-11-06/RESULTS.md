# unit-465rows — RESULTS

**Agent:** Theseus · **Date:** 2026-11-06 (START fire, ~10:5x–11:0x PT)
**Subject pin:** `origin/main` at `6db293bf`; drives ran at local HEAD `9e012fce` (that rev plus this
unit's own pre-registration, which touches no product code — `git diff 6db293bf..9e012fce --
packages/ scripts/` is empty).
**Instrument:** `drive-arms.mjs` in this directory, five arms. All scratch in `os.tmpdir()`; the one
scratch file that had to live inside the repo (the frozen control) is explained below.

**Headline, in one line:** the `--no-migrate` opt-out Daedalus shipped this morning does what it
says — it refuses a run that would change the *schema* — and **a writing run whose schema delta is
empty still writes three rows into the operator's file, says nothing about them, and prints
"Nothing to apply."**

**Registered cells: 14. 12 HIT, 1 MISS, 1 VOID.** Predictions: **5 of 6 HELD, 1 REFUTED** — the
refuted one is mine and it was wrong in my own favour. 8 further cells declared post-hoc below and
labelled as such.

**Label collision, stated rather than quietly resolved:** the drive's output prints `CELL D3` for a
post-hoc predicate-level cell. The *registered* D3 is a reachability prediction. In this file the
output's `CELL D3` is called **D-PRED**. The two are not the same cell and the recording cannot be
read correctly without that sentence.

---

## A — census of the mechanism (2 cells, 2 HIT)

| cell | registered | measured | verdict |
|---|---|---|---|
| A1 | `runMigrations` has exactly 4 row-writing sites | 4, hand-read from `packages/server/src/db/index.ts` at `6db293bf` | **HIT** |
| A2 | 3 of the 4 are unnamed in Daedalus's 11/06 §7.2 | 3 unnamed | **HIT** |

The four, with line numbers at the pinned rev:

1. **`index.ts:118–121`** — the `MODEL_ALIASES` `UPDATE channels/messages SET model = ?` loop.
   *This is the one his §7.2 names.*
2. **`index.ts:319–350`** — the `files` + `file_refs` backfill: every `message_artifacts` row with
   `type='file'` and a `file_storage_key` not already in `files` becomes one `INSERT` into `files`
   and one into `file_refs`, **with `randomUUID()` ids**.
3. **`index.ts:353–358`** — `INSERT INTO entities` when `DEFAULT_ENTITY_ID` is absent.
4. **`index.ts:361–371`** — `INSERT INTO channel_entities (channel_id, 'default-entity')` for
   **every channel with no entity row at all**.

Site 4 is the one that matters most here, because `channel_entities` is the table
`scripts/backfill-entity-bindings.mts` exists to re-point. A tool whose whole job is moving
bindings off `default-entity` creates bindings *to* `default-entity` as a side effect of opening the
file.

## B — reachability on the real corpus (3 cells, 3 HIT)

Read-only handles; this arm must not be the thing that migrates the corpus.
`drive1.corpus.out`.

| cell | `klatch.db` | `backups/klatch.db.backup-2026-03-14` | predicted | verdict |
|---|---|---|---|---|
| B1 channels with no entity row | **0** (of 2) | **0** (of 139) | 0 both | **HIT** |
| B2 file artifacts not yet in `files` | **0** (of 0 `type='file'`, 0 artifacts) | **0** (of 0 `type='file'`, 2826 artifacts) | 0 both | **HIT** |
| B3 `MODEL_ALIASES` row matches | **0** | **0** | 0 both | **HIT** |

B3 reproduces Daedalus's §7.2 figure under my own read rather than quoting it, and extends it to the
other three sites. The alias keys were read out of `packages/shared/src/types.ts` by the drive, not
typed into it.

**So the correct verdict on the corpus is his, widened: the mechanism is live and the corpus is
currently empty of it.** Four sites, not one. That is a weaker claim than "a live hazard today" and
it is the one the measurement supports.

## C — the opt-out does not opt out (6 cells, 6 HIT)

A database built by the real `applySchema` on an empty file — so it is at the current schema and the
delta is empty, which is exactly the state in which `--no-migrate` says yes — then seeded with one
channel carrying no `channel_entities` row and one `type='file'` artifact not in `files`.
`drive2.optout.out`.

| cell | registered | measured | verdict |
|---|---|---|---|
| C1 | `delta.empty` true, `describeSchemaDelta` undefined | `empty = true`, note `undefined` | **HIT** |
| C2 | `--apply --no-migrate` not refused | `exit=0`, no `Refusing to run` | **HIT** |
| C3 | the unbound channel gains a `default-entity` row | `["default-entity"]`, unbound 1 → 0 | **HIT** |
| C4 | `files` and `file_refs` gain 1 row each | `files 0 → 1`, `file_refs 0 → 1` | **HIT** |
| C4b | the ids differ between two independent runs | `c9571f03…` vs `a954d9ea…` | **HIT** |
| C5 | the run's output mentions neither write | no match for `files`/`file_refs`/`channel_entities`/`SCHEMA:` | **HIT** |

And the sentence the operator actually reads, in full, from a run that wrote three rows:

```
  Candidates: 0 — 0 would move, 0 skipped.
  ...
Nothing to apply. Snapshot discarded.
```

**"Nothing to apply" is true about the plan and false about the file.** That phrasing is not a
defect Daedalus introduced — it predates the cure and it is accurate about the backfill's own work.
It becomes load-bearing the moment `--no-migrate` is on the line, because that flag's whole promise
is *this run will not change your artefact*, and the run that answers "nothing to apply" has
changed it.

C4b is worth one more sentence: the write is not idempotent in its ids. Run the same apply twice
against two copies of the same file and the `files.id` / `file_refs.id` values differ, so two
operators who both "did nothing" end up with artefacts that do not compare equal.

## D — the sibling blindness in the cured key (3 registered: 1 MISS, 1 VOID, 1 HIT)

`drive3.rebuild.out`.

| cell | registered | measured | verdict |
|---|---|---|---|
| D1 | a `messages` holding the rebuild's order minus trailing `created_at` reports as `addedColumns` only | **`applySchema` throws**: `SqliteError: no such column: created_at` | **MISS — refuted** |
| D2 | the disclosure for D1 omits the rebuild sentences | no disclosure exists to inspect; D1's subject never migrates | **VOID** |
| D3 | D1 is not reachable from a shipped schema version | not reachable **at all** through this migration | **HIT**, and more strongly than registered |

**Why D1 is refuted, which is a better answer than the one I predicted.** The rebuild's
`INSERT INTO messages_rebuild (…) SELECT id, channel_id, …, created_at FROM messages`
(`index.ts:200–204`) names every column explicitly. So for the one rebuild that exists in this
codebase, a source `messages` either holds all eleven columns — in which case before and after have
the same column set and the table lands in Daedalus's new `alteredTables`, caught — or it is missing
one, in which case the migration dies rather than producing a silent rebuild. **The blind cell is
unreachable through `messages`.** My pre-registered claim that it was reachable there was wrong, and
wrong in the direction that would have made my finding bigger.

**D-PRED (post-hoc, predicate level).** The blind cell is nonetheless real in `diffCensus`, which
is exported and will be used by whatever rebuild comes next. Two hand-built censuses — one column
appended *and* a widened `CHECK` — return:

```
{"addedObjects":[],"addedColumns":["t.b"],"rebuiltTables":[],"alteredTables":[],"empty":false}
```

`appendOnly` is true and `cols.length === was.length` is false, so neither `rebuiltTables` nor
`alteredTables` fires and the table reports as a plain `ALTER TABLE ADD COLUMN`. The operator is
told "1 new column" for an operation that rewrites every row. **Not reachable today; reachable by
the next migration that widens a constraint and adds a column in the same rebuild**, which is the
ordinary shape of such a migration.

### Post-hoc cells in the D arm, declared as post-hoc

| cell | measured |
|---|---|
| D1e | `--apply --no-migrate` against the throwing database: `exit=1`, and the refusal is Daedalus's `schemaUnknown` arm — *"whether this run would upgrade the schema could not be determined"*. That arm now has a known positive that throws **inside** `schemaDelta`, which is not the same shape as the unreadable file it was written against. |
| D1f | `--apply` *without* `--no-migrate` against it: `exit=1`, `no such column` surfaced to the operator rather than swallowed. |
| D1g | `messages` columns on the subject after that failed apply: unchanged. The transaction rolled the rebuild back and nothing earlier in `runMigrations` had an `ALTER` to do on this table. |
| D4a | Daedalus's §6b vacuity, reproduced by a hand that did not write it: a `messages` in `initSchema`'s own column order with the narrow `CHECK` returns `rebuilt=["messages"] altered=[]` — green, and about a column move, not about the constraint. |
| D4b | The same table in **the rebuild's own** column order returns `rebuilt=[] altered=["messages"] addedColumns=[]`, and the rendered note carries *"1 table(s) with a changed constraint and no changed column: messages"*. **His cure works and his diagnosis of his own known positive was right.** |

## E — control (1 cell, 1 HIT)

| cell | registered | measured | verdict |
|---|---|---|---|
| E1 | the frozen pre-cure script refuses `--no-migrate` as unknown | `exit=1`, *"--no-migrate: not a flag this script knows"* | **HIT** |

Without E1, C2's `exit=0` would be a sentence about the tool rather than about the cure. The frozen
copy had to live **inside the repo** to run at all: the first attempt put it in `os.tmpdir()`, where
it cannot resolve `better-sqlite3` and refused the cell with `ERR_MODULE_NOT_FOUND` — a refusal that
has nothing to do with the flag under test. It is placed in `docs/`, at `scripts/`'s own depth and
deliberately **not** under `scripts/`, which is the probe census's own population; `git status` after
the arm is clean of it.

## F — post-hoc: does a *dry* run write them too?

The script's header says *"a dry run cannot touch the database it is reporting on."* The C arm's
data states are the sharpest test of that sentence available, so it would be careless not to run it.
`drive5.dryrun.out`.

| cell | measured |
|---|---|
| F1 | Dry run against the same seeded database: `exit=0`, unbound stays **1**, `files`/`file_refs` stay **0**, `channel_entities` for the seeded channel stays `[]`. **The header's claim holds.** |
| F2 | File bytes `81920 → 81920`, unchanged. |
| F3 | `-wal` and `-shm` left beside the target by a non-writing run — **Daedalus's §7.1, confirmed independently.** |

F1 is what bounds this finding correctly: the three writes belong to the **writing** path. That is
not a mitigation, because `--no-migrate` exists only for writing runs — but it means a review sheet
is still safe to point at an artefact, which is the thing the header promised and the thing an
operator is most likely to do first.

**Not measured:** the `--undo` path. `willWrite = apply || Boolean(undoPath)` puts `--undo` through
the same gate and the same `getDb()`, so the same three writes should land there; I did not drive it
and am not asserting it.

---

## Routed to Daedalus

**One item, with a cure sketch, because the cure is in his file.**

The disclosure and the `--no-migrate` gate are both keyed on `schemaDelta`, and `schemaDelta` is
schema-only by construction — `census()` reads `sqlite_master` and `PRAGMA table_info`, nothing
else. But `applySchema` is **not** schema-only, at four sites. The gate therefore passes exactly the
runs its name promises to stop, whenever the file's columns happen to be current.

The cure is cheap and it is already most-built: `schemaDelta` copies the snapshot and applies the
real migration code to the copy. Count rows per table on that same copy, before and after, and the
measurement is free — same copy, same `applySchema` call, one extra query each side:

* `dataDelta: Record<string, number>` — `+1 channel_entities`, `+1 files`, `+1 file_refs`.
* `describeSchemaDelta` gains a `ROWS:` paragraph when it is non-empty, with the same *this is what
  opening it for writing does to your file* framing the `SCHEMA:` one has.
* The `--no-migrate` refusal keys on `schemaNote || dataNote` rather than `schemaNote` alone.
* Row **counts** are reliable even though two of the sites mint `randomUUID()` ids, so the copy's
  answer transfers to the subject. The ids do not transfer, which is C4b, and is a reason to say
  "+1 row" rather than to print the ids.

The one thing I would not do is rename the flag. `--no-migrate` is the right name: these writes are
`runMigrations`' own, and an operator who asked not to be migrated has asked about them too.

## Standing, unchanged

My §7 list from 11-05 is unchanged. The `backups/` tracked-vs-ignored half and the question of
restoring a March-schema March backup from `c945e8aa` are still open on xian, where Daedalus
correctly left them.
