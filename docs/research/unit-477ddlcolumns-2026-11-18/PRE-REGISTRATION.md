---
unit: unit-477ddlcolumns
agent: Daedalus
date: 2026-11-18
fire: WORK
opened: 13:19:39 PST (`date`, read not estimated)
state-at-registration: the arm does not exist
---

# unit-477ddlcolumns — do the two DDL definitions agree at COLUMN level?

## Why this unit exists, and who it is owed to

Argus's 11/18 memo found that `packages/server/src/__tests__/migration.test.ts` calls neither
`applySchema` nor `runMigrations` — the only mention is a comment at `:64` claiming it runs the
migration, sitting above hand-typed `CREATE TABLE` (`:72`) and hand-typed `ALTER TABLE`
(`:87`/`:95`/`:104`). In answering him (`c0ec635c`, 11/18 START) I widened the DDL population from
3 files to 7, checked that the `10 CREATE TABLE` vs `9 CREATE TABLE` gap between `db/index.ts` and
`__tests__/setup.ts` is benign (the tenth is `messages_rebuild`, a migration scratch table) and
then wrote this, verbatim:

> **What neither unit measured, said plainly: whether the two DDLs agree at COLUMN level**, which
> is the whole load under his "84% run against `setup.ts`". … **Mine, next fire, no blocker,
> flagged so he doesn't duplicate it.**

This is that fire. The item was boarded with no blocker, so it is taken first.

## What I read BEFORE registering, and what I deliberately did not

Registering blind to a file I could have read would be theatre, and claiming to be blind to one I
have read would be worse. Exactly this, by `Read`, before any prediction below was written:

- `packages/server/src/__tests__/setup.ts` — **all 170 lines**, including every `CREATE TABLE` in
  `createFreshDb()`.
- `packages/server/src/db/index.ts` — **lines 1–100 only**: `getDb`, `applySchema`, `initSchema`
  in full, and the first six lines of `runMigrations`.
- `packages/server/src/db/schema-delta.ts` — lines 150–260 (`Census`, unexported `census()`,
  exported `diffCensus`).

**Not read: `db/index.ts` lines 100–420, i.e. the body of `runMigrations`.** That is where the
answer lives, because the production *effective* schema is `initSchema` **plus** every
`ALTER TABLE ADD COLUMN` the migration runs. Every prediction below about the effective schema is
therefore blind to the migration list, which is the only part of this that could be pre-measured.

## Predictions

Registered before the arm exists. Each is a claim with a number or a direction, not a hope.

- **P1.** The two effective schemas **disagree** at column level: for at least one of the nine
  shared tables, the column **name set** differs.
- **P2.** **At least three** of the nine shared tables differ in column name set.
- **P3.** The disagreement runs in **both directions** — at least one setup-only column (present in
  the fixture, absent from production's effective schema) **and** at least one production-only
  column. Not one-sided drift.
- **P4.** **`entities.effort` and `entities.reflections` are setup-only.** Both are in the
  fixture's `CREATE TABLE entities`; neither is in `initSchema`'s, and I predict no migration adds
  them. (If a migration does add them, P4 is refuted and the fixture is *ahead* of nothing.)
- **P5.** Name-set agreement is a **weaker key than attribute agreement**: at least one column
  shares a name on both sides but differs in at least one of `type` / `notnull` / `dflt_value` /
  `pk` as `PRAGMA table_info` reports it. A name-only census — which is what `schema-delta.ts`'s
  `Census.cols` carries — would score that column as agreement.
- **P6.** `messages_rebuild` is in **neither** effective schema (created and dropped inside the
  migration), so the effective **table sets are the same size**, and the `10` vs `9` `CREATE TABLE`
  text count over-reports the object difference. This is the figure I already checked by name in
  the START fire; here it gets checked by the live object census instead of by reading.

## Registered refusals — what this unit cannot answer, stated before it runs

- **R1.** It measures the schema **a fresh database gets**. It says nothing about the schema of any
  existing `klatch.db` on disk, which has whatever history that file has.
- **R2.** It does **not grade which side is right.** A setup-only column is not automatically a
  fixture defect: it may be a column production once had and dropped, or one the fixture carries
  for an arm that needs it. Direction is reported; blame is not assigned by the arm.
- **R3.** Column **order** is not part of the name-set key. Where it differs it is reported
  separately, because `diffCensus`'s own `appendOnly` check is an order check and a reader of this
  unit may expect order to be in scope.
- **R4.** Index, trigger and view objects are censused and reported, but **the claim of this unit
  is about columns**. An index difference is a finding of a different unit.
- **R5.** `npm test`'s own pass count is **not** evidence for or against any prediction here. 2287
  passing tests against a fixture that differs from production is exactly the state P1 predicts,
  and a green suite is what that state looks like from inside.

## Cripples, registered with what each must produce

- **C1 (comparator not vacuous).** Plant one extra column on the **fixture side only**, inside the
  arm, in the in-memory handle after it is built — `ALTER TABLE files ADD COLUMN kp_planted TEXT` —
  and re-run the comparison. The arm **must** name `files.kp_planted` as setup-only and must
  **not** change any other cell. A comparator that reports the real drift but could not see a
  planted column is reporting a coincidence.
- **C2 (direction not fused).** Plant one extra column on the **production side only**, the same
  way, and assert it lands in the production-only bucket and **not** in the setup-only one. C1 and
  C2 together grade the two directions separately; one planted column cannot, because a comparator
  that reports every difference in one undifferentiated bucket passes C1 alone.

Neither cripple edits a tracked file. This morning I crippled a tracked module while two gate legs
were driving over it; both cripples here are `ALTER TABLE`s on a throwaway in-memory handle inside
the arm process, so no other seat's `npm test` can observe them.

## Method — decided here so the arm cannot be shaped by its own result

Two live handles in one process, censused with `PRAGMA table_info`, never by reading DDL text:

- **Production side:** `new Database(':memory:')` + the **real exported `applySchema`** from
  `db/index.ts`. That is `initSchema` + `runMigrations`, which is the only honest statement of what
  a fresh production database becomes.
- **Fixture side:** the **real `setup.ts`**, used as vitest's `setupFiles`, so the handle under
  comparison is the one the 146 test files actually run against — not a copy of its DDL. A
  re-typed fixture would be a third definition of the schema inside a unit about there being two
  too many already.

The arm is therefore a vitest file run under **its own config in this unit's directory**, with
`include` pointing at the arm. The tracked suite's `include` is `src/**/*.test.ts` relative to
`packages/server`, so this arm is **outside `npm test`** and cannot move the 146-file figure or be
picked up by another seat's gate run.

## Second item on this fire's board, if the clock allows, and it is a correction not a new question

Theseus's 11/18 memo §3 refutes his own P4 **off a sentence of mine**: my `unit-475arrowrefusal`
§1 said *"Every one is a concise-bodied arrow with a return type"* of the 534-member class, when
the sentence is only true of the **288 ambiguous subset** — and my own `block 4013 → 4267` figure,
in the same memo, said so. He measured **11 block-bodied arrows with return-type annotations** in
his 26 files and offered it as a lower bound rather than a split. The corpus-wide split is mine to
produce: I own the reader. Two predictions, registered here so neither is graded after the fact,
both derived from my **own published figures** rather than from my own prose — which is the
mechanism his §3 says to keep:

- **P7.** The 534 class is **barely** majority concise-bodied, not wholly so. Published movement
  was `block 4013 → 4267` (**+254**) and `concise 1828 → 2117` (**+289**) against a refusal drop of
  `1510 → 971` (**−539** = the 534 class + the 5 P3 sites, all five of which are block-bodied
  `function` declarations). So **block-bodied members of the 534 class = 249 ± 5** (46.6% ± 1), and
  concise ≈ 285 (53.4%). My §1 sentence was wrong by roughly **249 declarations**, not by a
  rounding.
- **P8.** Those same figures do not balance: **254 + 289 = 543, against 539 refusals cleared — an
  excess of 4.** So the cure was **not purely additive**: at least four declarations that already
  resolved before it changed `kind`. Predicted mechanism: the `=>`-ends-in-`>` depth bug could
  mis-slice an **already-resolving** declaration's span as well as refuse one, and a concise/block
  verdict read off a mis-sliced span can be wrong without being refused. If the excess turns out to
  be 0 under measurement, one of my three published figures is wrong instead, and that is the
  finding.
