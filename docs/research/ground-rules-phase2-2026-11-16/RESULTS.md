# Results — ground rules phase 2, server half

**Author:** Daedalus · **Date:** 2026-11-16 (STOP fire) · Pre-registration:
`PRE-REG.md` in this directory, pushed as `592d1309` **before** any of the code or tests below
existed.

## What landed

| commit | what |
|---|---|
| `592d1309` | pre-registration (four cripples, declared storage divergence) |
| `0ae38749` | schema + queries + shared type + route + mount |
| `996775be` | 23 arms |
| `97b710a8` | two count pins the new router moved |

- `ground_rules_presets` (id, name NULL, body NOT NULL, is_default, created_at) + a **partial
  unique index** `WHERE is_default = 1`, in `runMigrations` and in `__tests__/setup.ts`'s
  hand-typed fixture.
- `createGroundRulesPreset` / `listGroundRulesPresets` / `getDefaultGroundRulesPreset` /
  `getGroundRulesPreset` / `deleteGroundRulesPreset`.
- `GET|POST /api/ground-rules/presets`, `DELETE /api/ground-rules/presets/:id`.
- `GroundRulesPreset` in `@klatch/shared`.

**Zero callers.** The submit-time prompt (phase 2's UX) and the creation-time picker (phase 3) are
client work and stay Iris's; this is the surface they code against, landed first so neither waits
on a server. Same posture as `GET /entities/:id/delete-preview` this morning.

## The four cripples, graded against what was written down first

Cure committed (`996775be`) **before** any cripple existed, so no restore could discard an
uncommitted fix. Tree verified clean and `CRIPPLED`-marker-free after the last restore.

| cripple | predicted | measured | verdict |
|---|---|---|---|
| **C1** index dropped | exactly 1 red (the raw-INSERT arm); all behavioural arms green | **2 red**: the raw-INSERT arm **and** the migration's index-presence arm. 21 green. | **REFUTED on count, landed on substance** |
| **C2** default-clear removed from the create transaction | ≥ 2 red; the arm fails as a *constraint error*, not an assertion | **1 red**, the move-the-default arm, failing exactly as `SqliteError: UNIQUE constraint failed: ground_rules_presets.is_default` | **REFUTED on count, landed on mechanism** |
| **C3** blank-body 400 removed | exactly 1 red, the blank-refusal arm | **1 red**, that arm | **LANDED** |
| **C4** `rowToPreset` returns the raw column | the mapped-field arms redden, the raw-column arms do not | **3 red**, all three mapped-`isDefault` arms; every raw-column arm green | **LANDED** |

### C1's refutation is my own blind spot, named

I predicted "exactly one" while holding, in the same file, an arm that reads
`sqlite_master` for the index. **A cripple on a schema object reddens both the behavioural arm
that depends on it and the arm that asserts it exists** — and when I wrote the prediction I was
thinking only about the behavioural half. The substance held: every *behavioural* arm stayed
green, which is what the raw-INSERT framing was for. The count did not, and the count is the part
I would have published.

### C2 is the sharper of the two refutations

My "≥ 2" rested on an assumption that some other arm saves two defaults in sequence. None does —
the delete-the-default arm saves, deletes, then saves, and with the first row gone the clear is
not needed. So the write path's clear is load-bearing in **exactly one** arm, and the index is
what makes that arm fail loudly rather than quietly: without the clear, the second insert throws
instead of returning a row with a silently-wrong flag. The two guards are not redundant —
**the index converts a wrong value into an error**, which is the behaviour I would want and had
not articulated before driving it.

### A finding from C4 that was not the prediction

C4 reddened three arms. It did **not** redden `POST /ground-rules/presets with makeDefault`,
which asserts `created.isDefault === true` on the route's response. The reason:
`createGroundRulesPreset` returns a **hand-built object literal**, not a re-read of the row
through `rowToGroundRulesPreset`. So the create path publishes a second spelling of the row that
the mapper never touches, and **a mapper defect is invisible on the create response and visible
only on reads.** Today the two agree by inspection. That is a real seam, named rather than
quietly fixed: re-reading the row after insert would cost one query and remove the second
spelling, and `createChannel` has the identical shape (it too returns a literal), so this is a
house pattern rather than a slip in this file. Not changed in this fire — it is a change to an
existing idiom across more than one function, and it deserves its own unit.

## Gate, re-driven against this change

- `npm run typecheck` → **0 `error TS`**, ×4 workspaces.
- Server: **145 files / 2272 passed / 1 skipped (2273)**. Standing before this fire was 144 /
  2249 / 1 (2250): **+1 file, +23 tests, mine, and nothing else moved** (2249 + 23 = 2272).
- Client: **28 files / 344 passed / 13 skipped (357)** — unchanged; no client file touched.
- `sweep-probes --census` → CENSUS OK, 155 files, 45 swept / 110 deferred (also run by the
  pre-commit hook on every push this fire).
- Full driving sweep: figure in `docs/logs/2026-11-16-daedalus-log.md`, read off the output file
  after the process exited.

## Two count pins this change moved, and why that is the pin working

Both reddened on the *new router existing*, not on anything weakening:

- `round214-json-body-guard.test.ts` — `callSites` 15 → **16** (the preset POST reads its body
  through `readJsonBody`). Its sibling arm, "no route reads a request body with a bare
  `c.req.json()`", stayed green, which is the claim that matters; this pin is the drift detector
  that says the replacement happened rather than the call being deleted.
- `round218-one-mount-list…test.ts` — exported routers 9 → **10**, and the comment's export-style
  split 6/3 → 6/**4**.

Both figures were **re-counted off the live directory** in this fire
(`grep -rc 'await readJsonBody<' routes/*.ts` → 2+4+1+1+2+4+2 = 16; `grep -rl` on each export
style → 6 and 4), not incremented from the old number.

## Not built, named rather than left to be inferred

- Re-designating an existing preset as the default after the fact. The ruling asks for
  save-as-default on submit and offer-on-next-klatch; a manager is a third thing.
- Dedup. Saving the same body twice makes two rows.
- Everything user-visible: the submit prompt and the creation-time picker (Iris).
- The create-path-returns-a-literal seam above.

## `CLAUDE.md`'s table count is stale, routed not edited

`CLAUDE.md` says the schema has six tables and to add Drizzle at 8+. The live schema had **eight**
before this fire and **nine** after it (`grep -n 'CREATE TABLE IF NOT EXISTS'
packages/server/src/db/index.ts` — channels, messages, entities, channel_entities,
message_artifacts, projects, files, file_refs, and now ground_rules_presets). The stated threshold
is therefore crossed, which is a decision for xian and not a thing to slip into a doc edit on the
way past. Routed to Calliope with the count; the ORM question raised, not answered.

— Daedalus
