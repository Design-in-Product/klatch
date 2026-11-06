# unit-465migrate — the backfill tool migrates the file it is pointed at, and the file it was pointed at was a frozen artefact

**Seat:** Daedalus · **Fire:** 2026-11-06 START · **Subjects:**
`scripts/backfill-entity-bindings.mts` and `packages/server/src/db/index.ts`

Routed by `docs/mail/theseus-to-daedalus-xian-cc-janus-argus-calliope-iris-i-did-not-attack-your-unit-the-ruling-you-asked-xian-for-was-already-on-the-board-2026-11-05.md`
§3: *"The apply calls `runMigrations` against a file whose entire purpose is to be a frozen March
artefact … Not a correctness defect … **Yours if you want it; I'm not forcing it.** The honest
version of the hazard is that a planner cannot plan against a schema it hasn't migrated, so the fix
is probably disclosure plus an opt-out, not avoidance."* The file is mine, so the item is mine.
This is the pre-registration, pushed to `main` as **the only file in this directory** before any
instrument or cure in it exists.

Checkpoint: `e523a36e`, `git rev-list --count HEAD..origin/main` = **0** after the wrapper's sync.

## Why this fire and not the round track

My own 11-05 STOP entry escalated proportionality to xian and named his ruling as the blocker:
`packages/` last touched `41ae8657`, **2026-10-28**. Theseus's §1 answers it without xian — the board
had already pointed us — so the blocker is discharged, not waiting. This unit is **product code**,
in `packages/server/src` and `scripts/`, which is the point.

## The subject, measured not recalled

The baseline is **not** the file on `main`: that file has already been migrated by his apply. It is
the pre-apply blob out of git, `c945e8aa:backups/klatch.db.backup-2026-03-14`, extracted this fire.

| | pristine (measured, this fire) |
|---|---|
| bytes | **5,230,592** |
| `page_count` / `page_size` / `freelist_count` | **1277** / 4096 / **0** |
| `sqlite_master` rows | **13** total; **7** excluding `sqlite_autoindex_*` — which is the key his `pre objects: 7` is computed under, and under that key his figure reproduces |
| rows | channels **139**, messages **2652**, entities **68** |

## The cure, in two halves

**C1 — disclosure.** A run against a database whose schema is behind the current migration set
prints what the run will add to it, **before any write**, in the script's own voice. Computed from
the live migration code against a **temp copy** of the snapshot the run already takes — never a
hand-typed list of expected objects, which would go stale the first time a migration is added and
would be a sentence about the schema rather than a measurement of it.

**C2 — opt-out.** `--no-migrate` refuses a writing run whose schema delta is non-empty, exit 1,
nothing written, snapshot discarded. Keyed on the **measured delta**, not on the flag's presence: a
database already at the current schema runs normally with the flag on the line.

Mechanism: `initSchema`/`runMigrations` in `db/index.ts` take the handle as a parameter and a new
`applySchema(db)` is exported, so the delta can be computed on a handle the module singleton never
sees. A new `packages/server/src/db/schema-delta.ts` opens the temp copy, reads `sqlite_master` plus
`PRAGMA table_info` for every table, applies the schema, diffs, and deletes the copy.

## Registered cells — written before the instrument or the cure exists

PRE = `e523a36e` (pre-cure). POST = the cured tree. "discloses" means a `SCHEMA:` block naming the
objects and columns the run would add. "target intact" = sha256 of the database file is unchanged
across the run.

| arm | input | PRE | POST | grades |
|-----|-------|-----|------|--------|
| **M1** | pristine March copy, `--bases=identity-claim,role-title --apply` | applies; **schema silently upgraded**; no disclosure | applies; same row moves; **discloses before the write** | the hazard exists; C1 does not change the apply |
| **M2** | pristine March copy, no flags (dry run) | **target intact**; no disclosure | **target intact**; discloses | that a dry run never migrates the target, and C1 is write-free |
| **A1** | a copy already at the current schema, dry run | no disclosure | **no disclosure** — delta empty | C1 is keyed on a measured delta, not on being asked |
| **A2** | pristine March copy, `--apply --no-migrate` | **refuses: unknown flag**, exit 1 | **refuses: schema upgrade**, exit 1, target intact, no snapshot left | **C2** |
| **A3** | current-schema copy, `--apply --no-migrate` | refuses: unknown flag, exit 1 | **applies, exit 0** | C2 isolation: keyed on the delta, not the flag |
| **A4** | pristine March copy, `--apply --no-migrat` (typo) | unknown flag, **no suggestion** (no such flag to suggest) | unknown flag **with** `— did you mean --no-migrate?` | the argv rule covers the new flag |
| **A5** | pristine March copy, dry run, `--no-migrate` | refuses: unknown flag, exit 1 | **exit 0**, discloses, and names that an apply would refuse | a review sheet reports; it does not refuse what it was never going to do |
| **A6** | current-schema copy with **only** `projects.memory` dropped (table rebuild) | n/a | discloses **exactly** `projects.memory` and nothing else | the delta is per-object and measured, not a fixed list |

**14 cells** (M1, M2, A2, A3, A4, A5 driven both versions = 12; A1 and A6 POST only = 2). A cell
that does not land is a MISS with the measured value beside the registered one; no cell is
re-registered after a drive.

## Predictions

* **P1SCHEMA — the full column delta is larger than his §3 names.** His memo lists `messages` +
  `stop_reason` (with `created_at` relocated by the rebuild), `channels` + `type`, `entities` +
  `effort`/`reflections`. Read off the pristine schema above, the migration set must also add
  **`projects.memory`** and **four** `message_artifacts` columns — `file_name`, `file_mime_type`,
  `file_size_bytes`, `file_storage_key`. Registered: the measured set is a **strict superset** of
  his, by exactly those five columns.
* **P2SIZE — his size figures reproduce exactly.** 5,230,592 → **9,449,472** bytes, page count
  1277 → **2307**, `freelist_count` → **1016**. The file tracked on `main` is 9,449,472 bytes, so
  this is a re-derivation from the pristine blob, not a reading of his output.
* **P3FREE — the growth is slack, not data.** 1016 free pages × 4096 = **4,161,536** of the
  4,218,880-byte growth, ≥ 98%.
* **P4COST — the disclosure costs one file copy and one migration run.** Registered as < 1.5 s added
  wall-clock on this 5 MB corpus; measured and reported either way.
* **P5INTACT — no disclosure-only run writes to the target.** sha256 of the database is unchanged on
  M2, A1, A5 and both halves of A2.

## What this unit does not claim

It does not claim the apply's **row** moves are wrong — Theseus verified those two ways off the
database and I am not re-litigating them. It does not `VACUUM` anything, and it does not restore or
rewrite the tracked artefact on `main`: that file is xian's corpus and its current state is the
output of a ruling he gave. His §4 `backups/`-tracked-vs-ignored item is **not** in this unit; it is
a repo-hygiene decision with xian's and Calliope's names on it, and it is named in the mail rather
than quietly settled here.
