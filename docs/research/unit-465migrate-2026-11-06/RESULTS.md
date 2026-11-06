# unit-465migrate — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-06 START · **Registration:** `69f732d1`, pushed to `main` as
the only file in this directory before any instrument or cure in it existed (`git ls-tree -r
origin/main` run, not asserted).

**15 cells registered and driven. 14 HIT, 1 PARTIAL. 5 predictions, 5 HELD. 2 unregistered defects,
both mine, both found by this unit's own tests before the cure shipped — and the second one is a
known positive that would have passed vacuously.**

Gate on the final tree, quoted verbatim from `npx tsx scripts/gate.mts`:

```
GATE ok exit=0 census · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 typecheck · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 server · files: 141 passed (141) · tests: 2199 passed | 1 skipped (2200) · errors: 0
GATE ok exit=0 client · files: 26 passed | 13 skipped (39) · tests: 333 passed | 13 skipped (346) · errors: 0
GATE ok exit=0 gate(census+typecheck+server+client) · files: (no Test Files line) · tests: (no Tests line) · errors: 0
```

## 1. The hazard, re-derived from the pristine blob

Theseus's §3 figures reproduce **exactly**, from `git show
c945e8aa:backups/klatch.db.backup-2026-03-14` rather than from the already-applied file on `main`:

| | registered | measured (M1) |
|---|---|---|
| bytes | 5,230,592 → 9,449,472 | **5,230,592 → 9,449,472** |
| `page_count` | 1277 → 2307 | **1277 → 2307** |
| `freelist_count` | → 1016 | **→ 1016** |
| `sqlite_master`, excluding `sqlite_autoindex_*` | 7 → 11 | **7 → 11** |
| the four new objects | `files`, `file_refs`, `idx_file_refs_file`, `idx_file_refs_scope` | **the same four** |

**His `pre objects: 7` is computed excluding `sqlite_autoindex_*`** — the full `sqlite_master` count
is 13 → 19. Both are correct; the key is named here so the two counts cannot later read as a
disagreement. **P2SIZE HELD. P3FREE HELD:** 1016 × 4096 = **4,161,536** of the 4,218,880-byte
growth, **98.6%** — the growth is slack left by the rebuild, not data.

**P1SCHEMA HELD.** The column delta is **9**, a strict superset of the four his §3 names, by exactly
the five predicted: `projects.memory`, `message_artifacts.file_name`,
`message_artifacts.file_mime_type`, `message_artifacts.file_size_bytes`,
`message_artifacts.file_storage_key`. His three-table list was not wrong about the tables it named;
it was two tables short.

## 2. The cells

PRE for M1/M2 is `69f732d1` driven live (`drive1`). PRE for the four argv arms is the frozen script
at that rev, extracted with `git show 69f732d1:scripts/backfill-entity-bindings.mts >
scripts/u465-frozen-precure.mts` and driven with `--tool=` (`drive3`); it has to sit in `scripts/`
because the script's imports are relative to its own directory, and that costs nothing here because
all four refuse at the **parse boundary**, before the first dynamic import — the absence of a
`SCHEMA:` block in those four cells is the evidence, and the copy was deleted after the drive.
POST of record is **`drive7`**, re-driven whole on the final tree after both of §4's key changes, so
no published cell is sourced from an intermediate version. (`drive2` and `drive5` are kept as the
earlier post-cure drives; every figure quoted below is `drive7`'s.)

| arm | PRE (registered → measured) | POST (registered → measured) | |
|---|---|---|---|
| **M1** apply, his two bases | silent upgrade, no disclosure → **same** | upgrade + disclosure first → **`SCHEMA:` at line 25, `Applied:` at line 157** | HIT |
| **M2** dry run | target intact → **sha256 unchanged** | intact + disclosure → **both** | HIT |
| **A1** current schema, dry | — | **no** disclosure → **none printed** | HIT |
| **A2** `--apply --no-migrate`, behind | unknown flag, exit 1 → **`--no-migrate: not a flag this script knows`** | refuse on schema, exit 1, target intact, no snapshot → **all four** | HIT |
| **A3** `--apply --no-migrate`, current | unknown flag, exit 1 → **same** | "applies, exit 0" → **exit 0, nothing refused, but `TARGET INTACT`** | **PARTIAL** |
| **A3b** *(declared post-hoc)* | — | — → **exit 0, `TARGET WRITTEN`, `Applied: 9 channel(s) re-pointed, 9 agent(s) minted`** | HIT |
| **A4** `--no-migrat` typo | unknown flag, **no** suggestion → **no suggestion** | suggestion → **`— did you mean --no-migrate?`** | HIT |
| **A5** dry run + `--no-migrate` | unknown flag, exit 1 → **same** | exit 0, disclose, name that an apply would refuse → **all three** | HIT |
| **A6** current schema minus one column | — | **exactly** `projects.memory` → **`1 new column(s): projects.memory`**, no other line | HIT |

**A3 is the PARTIAL, and it is a defect in my own registration, not in the cure.** The cell read
"applies, exit 0". Exit 0 and no refusal both landed, but with the *default* bases the plan moves 0
of 72 channels, so the half of the cell asserting a **write proceeds** was never demonstrated: the
arm would have passed identically against a cure that silently swallowed the apply. **A3b** is that
arm with his own `--bases=identity-claim,role-title` on the line — `TARGET WRITTEN`, 9 re-pointed —
declared post-hoc and labelled rather than folded into A3's cell.

**P5INTACT HELD.** Every non-writing cell (M2, A1, A2, A4, A5, A6) comes back sha256-identical.

**P4COST HELD, and not by the arm timings.** Those cannot grade it — `npx tsx` startup dominates,
and the post-cure M1 came back *faster* than the pre-cure one (546 ms vs 933 ms), which would have
been a nonsense reading of a cure that adds work. Measured directly instead
(`drive6.cost-probe.out`): **23.9–29.5 ms** over four runs on the 5 MB corpus, **0** temp copies left
in `os.tmpdir()`, subject unchanged at 5,230,592 bytes.

## 3. The cure as it landed

* `packages/server/src/db/index.ts` — `initSchema`/`runMigrations` take the handle as a parameter;
  **`applySchema(db)` exported**. `getDb()` is unchanged in behaviour.
* `packages/server/src/db/schema-delta.ts` — new. `schemaDelta(path)` copies, migrates the copy with
  the **real** migration code, diffs, deletes the copy in a `finally`.
  `describeSchemaDelta(delta, path)` returns the operator-facing lines or `undefined`.
* `scripts/backfill-entity-bindings.mts` — discloses above the `--undo` branch, so all three paths
  (dry, apply, undo) are covered by one site; `--no-migrate` refuses a **writing** run whose delta is
  non-empty, discards the snapshot, and prints three ways on. Header rewritten to say what the tool
  does to the schema of the file it is given, which it had never said.
* `packages/server/src/__tests__/round465-schema-delta.test.ts` — 13 cells.
* `packages/server/src/__tests__/setup.ts` — the global `vi.mock('../db/index.js')` now forwards
  `applySchema` to the real implementation via `importOriginal`. Without that the module-level mock
  would have handed `schemaDelta` an `undefined` `applySchema`, and a test passing against a stubbed
  migration would have looked like evidence about the schema.

## 4. Two defects of my own, and the tests caught both before the cure shipped

### 4a. The rebuild key was blind to a mid-list insert

The first `rebuiltTables` key compared **the relative order of the surviving columns**. That is
weaker than it looks: `[id, b] → [id, c, b]` preserves it, and a mid-list insert is only reachable by
a rebuild, so the check went **green on a rebuild**. It caught the March case at all only because
`created_at` happened to move past three other columns — an accident of that one schema, which is
exactly the shape of key that reads as correct for as long as the one example it was written beside
stays in the sample.

The honest key is the one `ALTER TABLE ADD COLUMN` dictates: that statement can only **append**, so
`after === before ++ new` is the one shape that is not a rebuild. Now
`was.every((c, i) => cols[i] === c)`. Three cells were added for the three ways the old key went
green — mid-list insert, a survivor moved to the end, a dropped column.

### 4b. §6 named a blind spot, so §6's claim is gone and the hole is closed instead

The first version of this RESULTS said, as a limitation: *"a widened `CHECK` constraint with no
column movement is **invisible** to this delta, and the `messages` rebuild is only visible because it
moves `created_at`."* Both halves were true, and the second half is the damning one — the key worked
on the one example it was written beside. The migration that widened `messages`' status `CHECK` to
admit `'incomplete'` **is** a full table rebuild that adds no column: on a database whose columns
were already current it would move every message row and the delta would have said *nothing at all*,
and `--no-migrate` would have let it through.

Closed rather than documented. The census now also carries each table's `CREATE TABLE` text, and
`alteredTables` reports a table whose text changed while its columns stayed identical and in order.
Disclosure gained a line for it.

**And the known positive for it passed vacuously on the first attempt.** Narrowing the CHECK on a
freshly-created database and asking for the delta gives `rebuiltTables: ['messages']` — green, and
nothing to do with the new key: `initSchema`'s column order is not the order the rebuild produces
(`created_at` ends up last), so that cell was still measuring a column move. The KP only carries the
property after a first narrow-and-`applySchema` cycle settles the table into the rebuild's own
order; the second narrow is then the one state where the columns say nothing and the constraint says
everything. Both the fix and the reason are in the test, beside the cell.

## 5. Unregistered observations, named rather than filed quietly

1. **Every run leaves `<db>-wal` and `<db>-shm` beside the target — including the ones that do not
   touch it.** Measured in all nine arms, including the two refusals. The database file itself is
   byte-identical, so the header's *"a dry run cannot touch the database it is reporting on"* holds
   as written; two new files appear next to it regardless, created by the read-only handle the
   snapshot is taken from on a WAL-mode database. For a frozen artefact in a directory someone
   diffs, that is worth a sentence somewhere. **Not cured this fire, and not boarded as someone
   else's: it is mine, it is small, and it is named here so it is not re-discovered.**
2. **An apply also leaves sidecars beside its own snapshot** (`…backup-backfill-<stamp>-wal` /
   `-shm`), from `quickCheck`. The restore steps already tell the operator to delete the sidecars
   before copying a backup back, so this is covered by instruction; it would be better covered by
   not creating them.
3. **The tracked artefact on `main` is not restored and must not be, by this seat.**
   `backups/klatch.db.backup-2026-03-14` is 9,449,472 bytes — the post-apply state, the output of a
   ruling xian gave. Rolling it back is his call with Calliope's, not a thing to tidy inside a
   research unit, and §4 of his memo (`backups/` ignored at `.gitignore:21` while two `.db` files
   inside it are tracked — reproduced here, `git check-ignore -v` run) is the same decision wearing
   a different hat. Both are in the mail, unresolved, with names on them.

## 6. What this unit does not claim

It does not re-litigate the apply's row moves; Theseus verified those two ways off the database and
they reproduce here as a side effect (`Candidates: 72 — 9 would move, 63 skipped`, `Applied: 9
channel(s) re-pointed, 9 agent(s) minted`), but they were never the question. It does not `VACUUM`
anything.

What it still does **not** cover, stated rather than discovered later: the delta is keyed on
`sqlite_master` object names, per-table column lists and per-table `CREATE TABLE` text. A migration
that changes none of those three and still moves data — a `CREATE INDEX` text change under an
unchanged index name, or a bulk `UPDATE` like the `MODEL_ALIASES` rewrite `runMigrations` performs —
is **invisible** here, and the second of those is a write to real rows that `--no-migrate` would not
stop.

Measured rather than left as a worry: on this corpus the alias rewrite moves **0** rows. All four
`MODEL_ALIASES` keys have 0 matches in both `channels.model` and `messages.model`; the March
distribution is `claude-opus-4-6` × 133, `claude-sonnet-4-6` × 4, `claude-haiku-3-5-20241022` × 2,
and the last of those is a dated id that is *not* in `MODEL_ALIASES`, so nothing rewrites it either.
So the hazard is structural and currently empty — which is exactly the kind of thing to write down
before it stops being empty. The flag's name is honest about its scope (it refuses a *migration of
the schema*), the disclosure claims no more than that, and a data-level disclosure is a different
instrument. Named, not boarded as someone else's.
