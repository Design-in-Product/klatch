# unit-471sharedreader — RESULTS

## Question (pre-registered by Daedalus, not by this seat)

From `docs/mail/daedalus-to-argus-theseus-cc-xian-janus-calliope-iris-the-create-path-seam-is-cured-and-my-own-equality-arm-cannot-grade-the-mapper-it-was-written-for-2026-11-17.md`,
§3: round468's `readBack(table, id, mapper)` cure means every one of the 10 writers now
returns a value produced by the **same mapper** a later read uses. Daedalus found his own
new equality arm on `rowToFile` (`expect(created).toEqual(read)`) green-and-blind to a
cripple of the mapper it was written to grade, for exactly that reason, and asked: in the
test/probe corpus, how many comparison arms have both sides passing through the same
reader, and are therefore structurally blind to a defect inside it?

This seat took the question as routed ("yours if you want it"), scoped to the server test
suite (`packages/server/src/__tests__/`, 146 files). Probes under `scripts/` are a
different population and are named open below, not measured here.

## Method

1. Enumerated the 9 `rowTo*` mappers in `queries.ts` and, for each, the exported writer
   (now routed through `readBack`) and reader functions that call it
   (`docs/research/unit-471sharedreader-2026-11-17/census.mjs` — writer/reader
   co-occurrence by file, 10 pairs).
2. Co-occurrence over-collects (a file importing both a writer and a reader for setup is
   not evidence of a comparison arm — the same trap named in
   `feedback_an_import_is_not_a_call_site.md`). Narrowed to the literal idiom: grepped
   `toEqual(` / `toBe(` across the suite for direct `toEqual(get...)` calls, then a second,
   broader pass over every `toEqual(` excluding the common non-full-object shapes
   (`.map(`, array/string literals, `getChannelEntities`/`getMessages().length`/etc.) to
   also catch the "assign reader result to a variable, then compare" spelling.
3. For each surviving candidate, read the surrounding test by hand to confirm: (a) the LHS
   is a prior writer's return value, (b) the RHS is a reader call for the same row, (c)
   both pass through the same `rowTo*` function.
4. For confirmed candidates, drove a real cripple — one field's fallback value changed in
   the shared mapper — baseline vs. crippled, full server suite (`npm test --workspace=
   @klatch/server`), not just the candidate's own file. Reverted after each drive;
   `git diff --stat` on `queries.ts` confirmed clean before and after.

## Findings

**Two pre-existing (pre-round468) full-object round-trip arms confirmed live-blind.**
Both predate round468 by months and are untouched by its commits (`git log -p -L` on each
line; both trace to `3f577a59`, 2026-03-08, "Add Vitest test infrastructure").

### 1. `queries.test.ts:59` — channel

```js
const ch = createChannel('test-channel', 'Be concise.');
// ... literal checks on id/name/systemPrompt/model/createdAt only ...
const fetched = getChannel(ch.id);
expect(fetched).toEqual(ch);
```

`rowToChannel`'s `type` field (`(row.type as ChannelType) || 'chat'`) is asserted nowhere
in this test by literal. Cripple: default changed `'chat'` → `'klatch'`. Baseline and
crippled, full suite: **146/146 files, 2287/2287 tests passed, 1 skipped — identical.**
The channel-type default has no coverage anywhere in the corpus, not just in this arm.

### 2. `queries.test.ts:329` — entity

```js
const e = createEntity('TestBot', 'claude-sonnet-4-6', 'Be terse.', '#ff0000');
// ... literal checks on name/model/systemPrompt/color only ...
expect(getEntity(e.id)).toEqual(e);
```

`rowToEntity`'s `effort` field (`(row.effort as EffortLevel) || 'high'`) is asserted
nowhere in this test by literal. Cripple: default changed `'high'` → `'low'`. Baseline and
crippled, full suite: **146/146 files, 2287/2287 tests passed, 1 skipped — identical.**

### The structural point, confirmed not assumed

Before round468, `createEntity`/`createChannel` returned a hand-built literal — a
genuinely *independent* second code path from `rowToEntity`/`rowToChannel`. These two
`toEqual` arms could have caught a value divergence had one existed (per Daedalus's §2,
none did, for these two specific writers — `createEntity` and `createChannel` are not
among his four found-divergent writers). Landed **this same morning**, by the `readBack`
cure, both arms silently changed from "comparing two independent paths" to "comparing one
path against itself" — the exact mirror of Daedalus's own C5 finding on `rowToFile`, just
pre-existing rather than newly written. Nobody added a defect; the cure that fixed §1/§2
simultaneously retired two old arms' independence, in the same commit that made the route
response gradeable for the first time (his §4). Net effect is still positive — his own
`readBack` is the right cure — but the two round-trip arms it reuses are no longer doing
the job their assertion text implies.

## What this is not

Not a claim that `type` or `effort` are untested in every sense — `effort`'s own default
logic and `type`'s route-level behavior may be covered elsewhere by tests that don't use
this round-trip idiom. Not measured here; only the specific blindness (full-object
`toEqual` against a shared-mapper read) is in scope.

## Population not yet covered — named, not claimed

- **`scripts/` probes.** Daedalus's question named "the probe corpus" explicitly; this
  unit covers only the server test suite. A probe doing the same round-trip idiom against
  a live server is a different population (HTTP response vs. direct function call) and
  wants its own pass.
- **Candidates seen but not driven**, from the broader `toEqual(` grep, not confirmed
  either way: `entities.test.ts:296,339,351` (preview-JSON vs. delete-JSON — both likely
  route both through `getChannelsEmptiedByEntityDelete`, a route-level instance of the same
  mechanism, one level up); `round175-entity-backfill.test.ts:764` (`undoEntityBackfill(...)
  .channels` vs. a `preview` value); `round204-undo-over-a-role-apply.test.ts:120`. These
  compare a write-side result against a preview/undo result rather than a writer against a
  reader, which may or may not share a mapper — unexamined.
- **The 8 `queries.ts` writers `readBack` did not touch untouched by this question entirely**:
  this unit only drove the 2 that had a *pre-existing* full-object arm; the other 6 of
  Daedalus's own round468 arms are already named by him as known-blind-but-kept.

No deadline on either item above from this seat.

## Gate

Full server suite re-confirmed clean after both cripples reverted: `git diff --stat
packages/server/src/db/queries.ts` empty. `npm test --workspace=@klatch/server` —
**146/146 files, 2287 passed, 1 skipped (2288)** — matches standing exactly.
