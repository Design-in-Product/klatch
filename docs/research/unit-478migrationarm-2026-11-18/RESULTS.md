# unit-478migrationarm — RESULTS

**Seat:** Argus (Klatch) · **Fire:** 2026-11-18 WORK · 1 arm, 1 drive, 12 legs, 6 predictions, 6 hit.
Pre-registration pushed **before the instrument existed**: `fa3b2ff7`.

**Headline verdict, drive 1 (clean):** 12 legs, 1 red by design — `[orig 3 / P1]`, the leg P1
predicted would refute, failing exactly as predicted. `drive1.out` shows **11 passed, 1 failed**,
with the failure's diff being `expected 'native' to be null` / `received: "native"`.

---

## §0 All six predictions hit

| # | Prediction | Result |
|---|---|---|
| P1 | Arm 3 refutes: real migration backfills `'native'`, not `NULL` | **HIT** — `[orig 3]` failed exactly that way; `[P1, other direction]` confirms `'native'` |
| P2 | The `message_artifacts` block's legacy base (no `system_prompt`) throws | **HIT** — `expect(() => applySchema(db)).toThrow(/system_prompt/)` passed |
| P3 | The other 8 arms pass once the legacy base is widened | **HIT** — all 8 passed unchanged |
| P4 | CASCADE delete still fires after the `foreign_keys` OFF/ON toggle in the rebuild | **HIT** — `foreign_keys` read `1` before the delete, cascade fired |
| P5 | `message_artifacts` column check passes despite 4 extra real columns | **HIT** — `toContain` subset check, unaffected |
| P6 | No second default/constraint mismatch beyond P1 | **HIT** — no other leg needed a changed assertion |

Full drive output: `drive1.out` (12 legs, 1 designed failure, 0 unexpected).

## §1 The one real defect this surfaced: a wrong assertion, not a missing one

`migration.test.ts`'s own comment (`:62-65`) claimed the file "run[s] the migration function." It
never did — each of the ten Step 8/Phase 2 arms hand-built a `:memory:` DB already carrying the
post-migration shape, then either hand-typed one `ALTER TABLE` matching only the column name (no
`DEFAULT`, no `NOT NULL`, no `CHECK`) or nothing at all. For nine of the ten, that shortcut
happened to assert something the real migration also produces. For the tenth — "source column
defaults to NULL for existing channels" — it didn't: the real `ALTER TABLE channels ADD COLUMN
source TEXT DEFAULT 'native'` (`db/index.ts:142`) backfills every pre-existing row with `'native'`,
and the test asserted `NULL` because its own hand-typed `ALTER TABLE channels ADD COLUMN source
TEXT` carried no default at all. **A green test was asserting a behavior production does not have**,
undetectable from the outside because nothing else in the suite reads `channels.source` on a
pre-migration row.

No downstream code was found reading `channels.source IS NULL` as a signal (`grep` for that shape
across `packages/server/src` returned the one `entity-backfill.ts:485` hit, which reads
`c.source IS NULL OR c.source NOT IN (...)` as an inclusive membership test, not a "freshly migrated"
check) — so this was a test-truth defect, not a live behavioral one. Still a real one: anyone
reading this test to learn what Klatch does to an old database on upgrade would have learned the
wrong thing.

## §2 Why the ninth arm (`message_artifacts`) needed its base widened, not just re-pointed

Driving the real `applySchema` against that block's original base — `channels(id, name,
created_at)`, no `system_prompt` — throws:

```
SqliteError: table channels has no column named system_prompt
```

from `initSchema`'s unconditional seed, `INSERT OR IGNORE INTO channels (id, name, system_prompt)
VALUES ('default', 'general', ...)`. `system_prompt` has been part of `channels` since the oldest
schema `initSchema` has ever shipped — no real pre-migration database lacks it. The original base
was never a faithful "before Step 8" snapshot; it was a minimal fixture that happened to not need
the column for its own hand-typed assertions. Widening it to include `system_prompt` (present, but
untested by any assertion in that block) is the fix, not a workaround — every other describe block's
base already carried it.

## §3 What this does and does not change about the 13-of-146 / 84% figures

`unit-475schemasource`'s headline — 13 of 146 files assert a schema fact, 64 of 76 arms (84%) run
against `setup.ts` rather than `applySchema` — is **unchanged**. This unit does not move
`migration.test.ts` into the `setup.ts` bucket or the `applySchema` bucket wholesale: it was its own
third bucket (**C — measure neither**) precisely because it drove neither. After this fire's cure it
drives the real `applySchema` directly, on its own freshly-built legacy handles — a fourth pattern,
not a merge into either existing one. The 76-arm denominator and the 64/12 split are untouched;
`migration.test.ts`'s ten arms were never counted in either side of that split (they were named
separately, as the file with no live coverage behind it).

## §4 What is still open, and whose it is

- **Daedalus's architecture question** — whether `setup.ts` itself should stop carrying its own
  hand-typed DDL and call `applySchema` instead — is untouched by this unit (R1, registered). That
  is the bigger of the two items his `c0ec635c` memo flagged, explicitly undecided between us, and
  stays open.
- This unit's arm (`docs/research/unit-478migrationarm-2026-11-18/arm-migrationpoint.test.ts`) is
  scratch, outside `npm test`'s `include`, kept for the record rather than promoted — the cure
  itself landed directly in the tracked `migration.test.ts`, which is the file this unit was about.

## §5 Gate, driven fresh after the cure

`npx tsx scripts/gate.mts`: census OK, typecheck clean ×4; server **146/2287 (1 skipped, 2288)** —
**identical to standing** (the ten arms were rewritten, not added to or removed from; the tracked
file's own test count, 19, is unchanged). Full driving sweep re-confirmed separately, logged in
`docs/logs/2026-11-18-argus-log.md`.
