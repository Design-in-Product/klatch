# unit-468createlit — RESULTS

**Seat:** Daedalus. **Driven:** 2026-11-17, START fire. `date`-reads: **09:20**, **09:25:42**,
**09:30:29 PST** — read, not estimated. Written after each process exited; no slot was drafted while
a measurement was running.

Pre-registrations: `PRE-REGISTRATION.md` (P1–P6, before any arm existed),
`PRE-REGISTRATION-B.md` (legs E/F by arm name, after legs A–D, before E/F).

## 1. The census (arm A) — and the drive that dropped the member the unit is about

Arm A's population key, registered in advance: an **exported function in
`packages/server/src/db/queries.ts` whose body contains an `INSERT INTO`**. Deliberately not keyed
on the name `create*`, which misses `insertMessage` and admits
`createChannelBySessionIdResolver`.

**Drive 1 (`drive1.arma.out`) was wrong, and the way it was wrong is the first finding.** It
reported `population=11 literal=10 mapper=0`. Missing: **`createGroundRulesPreset` and
`createProject`** — the first of which is the instance this whole unit exists to fix. Cause: the arm
began counting braces at the first `{` after the function head, so a brace in the **parameter list**
(`opts?: { name?: string; makeDefault?: boolean }`, `sourceMetadata: Record<string, unknown> = {}`)
opened and closed the "body" on the signature's own line. The body slice then held no `INSERT INTO`
and the member **fell out of the population with no error**. Absence is the one result an instrument
does not error on; nothing in drive 1 looked wrong.

Fix: find the end of the parameter list first (paren depth back to 0), only then count braces.

**Drive 2 (`drive2.arma.out`), the measurement of record:**

```
CONCLUSION population=13 literal=12 mapper=0 other=1 undelimited=0
CONCLUSION literal-with-a-sibling-mapper=10 -> createChannel,createGroundRulesPreset,
  insertMessage,createEntity,createProject,createFileArtifact,createCarriedContextArtifact,
  createToolUseArtifact,createFile,createFileRef
```

- **P1 (population = 10): REFUTED.** 13.
- **P2 (8 literal / 2 mapper): REFUTED, and more sharply than "wrong by two."** **12 literal,
  0 mapper.** Not one writer in this file published a row through the mapper that reads it. The idiom
  was universal, not predominant — there was no in-house counter-example to point at.
- The 13th and 12th members: `reassignChannelEntity` (returns `txn()`, a third shape) and
  `importSession` / `createFileWithMessageRef` (literals whose return types have no sibling mapper).
  Out of the cure's scope, in the census, visible.

## 2. The divergence measurement (arm B, pre-cure) — `drive3.armb-precure.out`

Ten arms, one per member, each comparing the writer's return against a read of the row it just
wrote. Pre-cure: **4 red, 6 green.**

| member | field(s) | writer published | a read published |
|---|---|---|---|
| `insertMessage` | `model`, `entityId` | `''` | `undefined` |
| `createToolUseArtifact` | `inputSummary` | `''` | `undefined` |
| `createFile` | `createdBy` | `''` | `undefined` |
| `createFileRef` | `addedBy` | `''` | `undefined` |

- **P3 (at least 3 divergent, named: those four): LANDS.** All four named members diverged and **no
  unnamed member did**.
- **P4 (two sub-mechanisms): LANDS.** `insertMessage`/`createFile`/`createFileRef` are **(a)** — the
  INSERT collapses via `|| null` and the literal does not. `createToolUseArtifact` is **(b)** — the
  INSERT stores `''` as `''` and the *mapper's* `|| undefined` is the whole normalisation. Verified
  on the raw column, not inferred: `expect(raw.input_summary).toBe('')` is an arm in the file. A cure
  applied only at the INSERT side would have reported success with (b) still standing.

## 3. The cure

`readBack(table, id, mapper)` — one helper, caller passes its own mapper so no type's shape is
decided inside it. All **10** members return through it. **Price named:** one extra primary-key
SELECT per write, in a single-user local SQLite app whose writes already cost a transaction.

- **P5 (0 existing tests lost): LANDS.** Server **146 files / 2282 passed / 1 skipped (2283)**
  against the standing **145 / 2272 / 1 (2273)** — exactly this unit's 1 file and 10 arms, nothing
  else moved. Typecheck **0 `error TS`** ×4 workspaces. Client **29/42 files, 354/367**, untouched
  (matches Iris's 11/17 figure).

## 4. The cripple matrix — P6 refuted in both directions, for two different reasons

Cripple **C5**: `rowToFile`'s `createdBy: row.created_by || undefined` → `row.created_by`.
Whole server suite each leg, failing-test counts:

| leg | tree | cripple | failing | drive |
|---|---|---|---|---|
| A | cured | — | **0** | `drive4.suite-postcure.out` |
| B | cured | C5 | **0** | `drive5.legB-cured-crippled.out` |
| D | pre-cure | — | **4** | `drive6.legD-precure-clean.out` |
| C | pre-cure | C5 | **4** | `drive7.legC-precure-crippled.out` |

**P6 is refuted in both directions: B − A = 0 and C − D = 0.** The cripple reddened nothing, in
either tree, across 2283 tests. The two reasons are different and both matter:

- **Post-cure:** `expect(created).toEqual(read)` now compares **two readings that share the mapper**.
  A defect inside the mapper moves both sides equally and the difference is invariant. The arm grades
  *"a writer stopped using the mapper"* — a real regression guard for the idiom just removed, and
  **not** a mapper grader. The cure removed the disagreement and, with it, my own instrument's reach.
- **Pre-cure:** those four arms were **already red**. A saturated arm has no spare signal to carry a
  second defect, so the leg cannot attribute anything to the cripple.

## 5. The arms that can grade the mapper, and what the cure actually bought

Five arms added comparing the writer's return against the **raw column**, normalisation written out
as a literal, so a cripple on either side has somewhere to land. File: **15 arms, green**
(`drive8.armC-clean.out`).

Cripple **C6**: `rowToGroundRulesPreset`'s `isDefault: row.is_default === 1` → `row.is_default`.
This is 11/16's **C4 re-run**, the cripple that left `POST … makeDefault` green and started this unit.

| leg | tree | cripple | failing | C6-attributable | drive |
|---|---|---|---|---|---|
| A2 | cured | — | 0 | — | `drive11.legA2-cured-clean.out` |
| F | cured | C6 | 6 | **6** | `drive10.legF-C6.out` |
| H | pre-cure | — | 8 | — | `drive12.legH-precure-clean.out` |
| G | pre-cure | C6 | 12 | **4** | `drive13.legG-precure-C6.out` |

Both legs carry their **own matched clean baseline**, driven on the same tree with the same test
file, so the attributable figures are differences rather than absolutes.

**By name, not by count** — C6-attributable arms:

| arm | pre-cure (G−H) | cured (F−A2) |
|---|---|---|
| `makeDefault stores 1 in the column, not just true in the mapped object` | red | red |
| `isDefault is a boolean, not the raw number SQLite returns` | red | red |
| `GET returns every preset under one key, with the default first` | red | red |
| `round468 equality > createGroundRulesPreset: unnamed default, untrimmed body` | **red** | green |
| `round468 raw > createGroundRulesPreset: is_default stores 1, isDefault publishes true` | green | **red** |
| `POST creates an unnamed preset and returns 201 with it` | green | **red** |
| `POST with makeDefault stores the designation` | green | **red** |

- **Leg E prediction: LANDS exactly.** C5 on the cured tree reddened **1** arm and it was the one
  named in advance (`createFile: created_by stores NULL, createdBy publishes undefined`), with the
  equality arm staying green as predicted (`drive9.legE-C5.out`, 1 failed / 2286 passed / 2288).
- **Leg F prediction (4 reds, 1 new reach): REFUTED on count — 6 reds, +3 new reach and −1 lost.**
  The two I did not predict are the **route-level arms on the POST response**:
  `POST creates an unnamed preset and returns 201 with it` and `POST with makeDefault stores the
  designation`. They were green under C4 on 11/16 for exactly the reason this unit names, and the
  cure made the API's own create response gradeable by the mapper's correctness. That is a bigger
  win than the one arm I claimed, and I would not have found it by predicting a number.
- **The 11/16 figure of "C4 → 3 red" is confirmed, not taken on trust:** the three arms red in both
  legs are those three.
- **The −1 is honest cost, recorded:** the equality arm for presets *did* have C6 reach pre-cure
  (the literal said `true`, the mapped read said `1`) and lost it post-cure. The cure trades one
  shared-reader arm for three independent ones; without the raw-column block the trade would have
  been **−1 for +2** and nothing would have graded the mapper directly.

## 6. Prediction ledger

| id | prediction | verdict |
|---|---|---|
| P1 | population = 10 | **refuted** (13) |
| P2 | 8 literal / 2 mapper | **refuted** (12 / 0) |
| P3 | ≥3 divergent, four named | **landed** (exactly those four) |
| P4 | two sub-mechanisms, members named | **landed** |
| P5 | 0 existing tests lost | **landed** (2272 → 2272 standing + 10) |
| P6 | C5 reddens ≥1 cured, 0 pre-cure | **refuted both directions** (0 and 0) |
| leg E | 1 red, named | **landed** by name |
| leg F | 4 red, 1 new reach | **refuted** (6 red, +3 / −1) |

Eight registered predictions: **4 landed, 4 refuted.** The two refutations that taught the most are
P2 (no in-house counter-example existed — the idiom was total) and leg F (the cure bought three
times the reach I claimed, at the route level, where it is worth most).

## 7. Declared limits — what this unit does NOT say

- **Scope is `queries.ts`.** Writers in `routes/`, in the two importers, or in `db/index.ts` are
  **uncensused**. Nine tables exist; this unit does not claim to have covered every writer of all
  nine.
- **The arm inputs are hand-typed.** The *population* is derived mechanically (arm A); the per-member
  calling convention cannot be. Declared on the divergence arm, not on the census.
- **Three members are outside the cure:** `importSession`, `createFileWithMessageRef`,
  `reassignChannelEntity`. The first two return composite/unmapped types; the third returns `txn()`.
  `createFileWithMessageRef` inherits the cure through the two writers it calls, which is not the
  same thing as having been graded here.
- **The 6 green equality arms are weaker than they look.** Post-cure every one of the ten compares
  two readings through the same mapper. They guard the idiom, not the mapper. Read §4 before citing
  any of them as evidence about a mapper.

— Daedalus
