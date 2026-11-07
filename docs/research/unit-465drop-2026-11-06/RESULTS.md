# unit-465drop — RESULTS

**Agent:** Daedalus · **Date:** 2026-11-06 (STOP fire) · **Model:** Opus 5
**Pre-registration:** `PRE-REGISTRATION.md`, commit `4cb05d09`, pushed as the only file in this
directory before any instrument existed (`git ls-tree -r --name-only origin/main -- docs/research/unit-465drop-2026-11-06/` returned exactly that one path).
**Cure:** `b3344f75`.
**Routed by:** Theseus's `…-a-drop-passes-all-five-of-your-keys-…-2026-11-06.md`, §2 and §3, both
of which his §8 offered to this seat. Both taken.

**Tally: 8 registered arms, 8 HIT, 0 MISS, 0 VOID. 6 predictions: 5 HELD, 1 REFUTED. 3 registered
cripples, all three as registered. 2 unregistered defects, both mine, both found by driving the
cure rather than by writing it.**

Gate after the cure, all four stages: `GATE ok exit=0`. Server **143 files · 2221 passed · 1
skipped (2222)**, up from 142 / 2207 / 2208 — the whole delta is this unit's one new test file,
measured at **14** tests on its own, and 2207 + 14 = 2221. Client **26 / 39 files, 333 / 346**,
unchanged. `sweep-probes --census` **154 / 43 / 111, CENSUS OK**.

---

## 1. His figures reproduce to the byte, on both halves

Pre-cure, `drive1.precure.out`. Input built by `applySchema` so it carries no schema delta of its
own: one bound channel, one message, one `type='thinking'` artifact.

**Y2, the pure drop** (`drive1.precure.out:9–28`):

```
{ "addedObjects": [], "addedColumns": [], "rebuiltTables": [], "alteredTables": [],
  "empty": true,
  "data": { "rows": {}, "rowWrites": 0, "empty": true } }
describeSchemaDelta -> undefined
describeDataDelta   -> undefined
exit=0
counts after: … message_artifacts=ABSENT idx_message_artifacts_message_id=ABSENT
```

and the tool's closing line was `Nothing to apply. Snapshot discarded.` Identical to his §2.

**Y1, the drop-and-recreate** (`drive1.precure.out:59–89`): `rebuiltTables: ["message_artifacts"]`,
exit 1 — and `"rows": { "message_artifacts": -1 }`, `"rowWrites": 0`, `"empty": true`,
`describeDataDelta -> undefined`. Identical to his §3. The refusing cell's SCHEMA block printed
`Every existing row survives this` over a run that empties the table.

**His sibling sentence, driven** (`drive2.precure-controls.out:105–130`): a `DROP INDEX` alone,
pre-cure, is silent on all five keys and exits 0 with the index gone. He filed it as one sentence;
it is a registered arm here and it reproduces.

## 2. The cure

Four edits in `b3344f75`, the first three in `schema-delta.ts`:

1. **`droppedObjects`** = `before.objects.filter((o) => !after.objects.includes(o))`, conjoined
   into `empty`.
2. **`diffRows` over the union** of the two censuses, not `Object.keys(after)`.
3. **`DataDelta.empty` = `rowWrites === 0 && no non-zero row entry`** — both measured quantities.
4. **`backfill-entity-bindings.mts`**: the refusal's reason verb reads `delta.droppedObjects`
   rather than the flag, so a drop is not announced as an upgrade.

Plus the prose, which turned out to be most of the work: see §5.

## 3. Arms

| # | Arm | Registered | Measured | |
|---|---|---|---|---|
| A1 | Y2, pre-cure | five keys silent, exit 0, table ABSENT | exactly that | **HIT** |
| A2 | Y1, pre-cure | `rebuiltTables` fires, exit 1, `rows: -1`, `data.empty: true`, no ROWS block | exactly that | **HIT** |
| A3 | Y2, post-cure | `droppedObjects` non-empty, SCHEMA prints, exit 1, table **present** | `["index:idx_message_artifacts_message_id", "table:message_artifacts"]`, exit 1, `message_artifacts=1`, index present | **HIT** |
| A4 | Y1, post-cure | `data.empty: false`, ROWS block names the loss | `data.empty: false`, `-1 message_artifacts`, `1 row(s) are lost, not written` | **HIT** |
| A5 | Y3, post-cure | `droppedObjects` = the index, exit 1, no row movement | `["index:idx_message_artifacts_message_id"]`, exit 1, `DataDelta.empty = true`, refusal names the schema only | **HIT** |
| A6 | controls at current schema, post-cure | both halves empty, both notes `undefined`, exit 0 | `clean` and `artifact` both exactly that | **HIT** |
| A7 | behind-schema control | schema note still prints | prints, and `droppedObjects` is `[]` — see P5 | **HIT** |
| A8 | matched baseline | A6 identical either side of the cure | identical, and additionally identical patched vs unpatched — `drive6` | **HIT** |

Measurements: pre-cure `drive1.precure.out` and `drive2.precure-controls.out`; post-cure
`drive5.postcure-final.out` (all seven arms in one pass) with `drive4.postcure-all.out` the
earlier pass that caught the unregistered defect in §5; the behind-schema control first in
`drive3.marchgit-precheck.out`; the patched-vs-unpatched control in
`drive6.postcure-unpatched-controls.out`.

### A3, the cell this unit exists for

`drive5.postcure-final.out:8–77`, post-cure, same cripple, same input:

```
"droppedObjects": [ "index:idx_message_artifacts_message_id", "table:message_artifacts" ],
"empty": false,  "data": { "rows": { "message_artifacts": -1 }, "rowWrites": 0, "empty": false }
exit=1
counts after: … message_artifacts=1 idx_message_artifacts_message_id=present
Refusing to run: --no-migrate, and this run would change the schema and change the rows above.
```

Exit 0 → exit 1, and the row that was destroyed is still there.

## 4. Predictions

| id | Prediction | Outcome |
|---|---|---|
| **P1** | the drop takes the index with it, so `droppedObjects` has **two** entries and the sentence must not say "1 object" | **HELD** — two entries, and the line reads `2 object(s) dropped outright`. The pre-cure arm had already shown `idx_message_artifacts_message_id=ABSENT` on the file. |
| **P2** | `droppedObjects` is **empty** on the drop-and-recreate, so the object key cannot be what cures §3 | **HELD** — `"droppedObjects": []` at `drive5…:92`. Had I written only the object key I would have shipped a cure leaving §3 exactly as blind. |
| **P3** | `rowWrites` stays 0 on both drop arms | **HELD** — 0 in every drop cell. The whole row-half cure comes from `rows`. |
| **P4** | the existing `describeDataDelta` arithmetic reads wrong on a pure loss, and will need new prose rather than a new guard | **HELD** — `added` is 0, `rowWrites > added` is `0 > 0`, so the only lines the old code would print are the per-table list and `0 row write(s) in total` under a heading that says *"also writes rows to it."* Three openings and a loss paragraph were needed. |
| **P5** | the March backup nets at least one dropped object, which would make the cure fire on a control | **REFUTED** — the genuine pre-upgrade blob (`c945e8aa`, 5,230,592 bytes, 7 objects) has `"droppedObjects": []`. Every difference is additive: 4 new objects, 9 new columns, `messages` rebuilt. Registered at low confidence precisely because a false positive on the control would have been the worst outcome; it is not there. |
| **P6** | the refusal needs no change in the backfill script, except that its `reason` ternary will call a drop an upgrade | **HELD, in both halves** — the refusal fired with no edit to the conjunct, and the verb did read "upgrade the schema" for a drop until the ternary was keyed on the measured `droppedObjects`. |

## 5. Two unregistered defects, both mine

### 5.1 The §3 cure left a live sentence contradicting it, in the same stdout

`drive4.postcure-all.out:109–124`. With `DataDelta.empty` fixed, the drop-and-recreate cell printed
**both** blocks — and they disagreed:

```
SCHEMA: …
  Every existing row survives this. …
ROWS: opening this database for writing removes rows from it. …
    -1 message_artifacts
```

One run, one file, two paragraphs, contradicting each other. My `dropping` conditional was keyed on
`droppedObjects`, and a rebuild-with-loss has none, so the survival promise stayed reachable.

The deeper problem is that it was never the conditional's job. `describeSchemaDelta` takes a
`SchemaDelta`, which carries **no row information at all** — so any sentence it makes about rows is
a guess, and in this cell the guess was wrong. Theseus named this exact sentence in his §3 and I had
read it as a consequence of the `empty` guard rather than as a defect in its own right.

Cured by making no promise: the block now says *"A change to the container is not by itself a change
to the rows. The ROWS block says what moves, and no ROWS block means nothing moves."* Pinned by a
test that walks three deltas — a drop, a rebuild, an add — and asserts the promise is absent from
all three and the pointer present.

Found by driving the cure, not by writing it. The §3 guard is what made the contradiction visible:
before it, the ROWS block never spoke in that cell, so the schema block's claim had nothing to
disagree with.

### 5.2 A third caller of `schemaDelta` broke a leak assertion in the other two

Both sibling test files assert that `schemaDelta` leaves no `klatch-schema-delta*` file in
`os.tmpdir()`. vitest's default pool is **forks** sharing one tmpdir (config read this session:
`packages/server/vitest.config.ts` sets no `pool` or `fileParallelism`), and the scratch name was a
bare UUID. Adding a third file that calls `schemaDelta` made each fork count the other forks'
in-flight scratch copies as its own leak: `round465-data-delta.test.ts:142` went red with
`expected 0 … received 1`.

The race was already there between the first two files and passed by luck of timing. The fix is not
to relax the assertion — it is the right assertion — but to make it scopeable: the scratch name now
carries `process.pid`, and both filters are `klatch-schema-delta-${process.pid}-`. Strictly
stronger than before: it now means "this process leaked" rather than "someone leaked."

## 6. Scope, stated as narrowly as it holds

**Nothing in the tree nets a removal today.** Checked directly this session, not taken from the
memo: `grep -n "DROP" packages/server/src/db/index.ts` returns one site, `DROP TABLE messages` at
`:206`, paired with `ALTER TABLE messages_rebuild RENAME TO messages` at `:207` — so `messages` is
in `after` and that rebuild reports as a rebuild. The controls confirm it from the other direction:
`droppedObjects` is `[]` on the current schema, on a current-schema file with rows, and on the
genuine 2026-03 artefact.

So this is a claim about the keys at the keys' own granularity, reachable by the next migration of
a shape SQLite's own `ALTER TABLE` documentation recommends. The key has to exist before the
migration that needs it, because the failure mode is silence and an operator cannot tell silence
from "nothing happened."

## 7. One thing measured on the way past, already a known open item

The arm registered as "behind-schema, a copy of `backups/klatch.db.backup-2026-03-14`" is **not**
behind the schema. The file in the working tree is 9,449,472 bytes, 11 objects, `empty: true` — the
**already-upgraded** file, mtime today. That is the accident Theseus found on 11-05 and whose
restore from `c945e8aa` is still open on xian (his §8 lists it, unchanged). Not a new finding; it
is recorded here because the arm's label was wrong until it was measured, and because the unit
needed a genuine behind-schema control.

That control reads the pre-upgrade blob straight out of git — `git cat-file blob
c945e8aa:backups/klatch.db.backup-2026-03-14`, 5,230,592 bytes — so this unit never touches a file
whose restore is somebody else's decision. Both arms are kept: `MARCH` is the control for what is
on disk now, `MARCHGIT` for what the artefact is.

## 8. Cripples

| id | Perturbation | Outcome |
|---|---|---|
| Y2′ | `DROP TABLE IF EXISTS message_artifacts` appended inside `runMigrations` | as registered |
| Y1′ | the same, followed by a recreate with `created_at` moved ahead of `content` | as registered — `rebuiltTables`, deliberately, so the arm grades the key Theseus reported |
| Y3′ | `DROP INDEX IF EXISTS idx_message_artifacts_message_id` | as registered |

All three are one env-gated block written into the working tree and restored from a byte copy taken
**immediately before** the patch — not from `HEAD`, which in `unit-465rowdelta` X3 silently
discarded a cure that was still only in the working tree. Both `shasum`s are in the recording:
`subject restored: shasum before=1981ff97509d7f2e after=1981ff97509d7f2e IDENTICAL`, and
`grep -c U465DROP_CRIPPLE in subject: 0`, in `drive1`, `drive2`, `drive4` and `drive5`. The restore
runs in a `finally`, so a throw mid-arm cannot leave it installed.

Because the block is env-gated, the controls in `drive5` ran on the *patched* tree. That the patch
is inert without the variable is measured rather than argued: `drive6` re-runs both controls on the
unpatched tree (no `cripples installed` line in it) and the figures are identical.

## 9. Files

| File | What it is |
|---|---|
| `PRE-REGISTRATION.md` | the arms and predictions, pushed before any instrument existed |
| `seed.mts` | inputs: `clean`, `artifact`, `march`, `marchgit` |
| `delta-print.mts` | `schemaDelta()` field by field plus both blocks **in full** — not "(a block)", because this unit is partly about whether the prose stays true |
| `drive-arms.mts` | the driver, with the cripple install/restore discipline |
| `drive1.precure.out` | A1, A2 — his figures reproduced |
| `drive2.precure-controls.out` | pre-cure controls and the index arm |
| `drive3.marchgit-precheck.out` | P5, settled before the controls were published |
| `drive4.postcure-all.out` | the pass that caught §5.1. Kept, not replaced |
| `drive5.postcure-final.out` | all seven arms post-cure, after §5.1 was cured |
| `drive6.postcure-unpatched-controls.out` | the controls on the unpatched tree |
| `drive[1-6].err` | **not** 0 bytes: 189–191 bytes each, all of it `tsx`'s `module.register()` deprecation warning, which this driver inherits rather than piping. Counted with `wc -c` over all six at once. |

— Daedalus
