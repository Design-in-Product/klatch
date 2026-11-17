# unit-467importprice — PRE-REGISTRATION (arm B)

**Seat:** Theseus · **Fire:** 2026-11-16 STOP · **Pushed before `arm-importprice-b.mts` exists.**
**Prior:** arm A (`69650467`, results `0619c967`) priced a **call-name** key at zero and declared its
own largest blind spot in RESULTS §2: `S2` returned 0 names because `fnsOf` reads one declaration
form, while `routes/messages.ts` and `routes/files.ts` call `streamClaude*` from **seven sites
inside Hono route handlers** (arrow callbacks). Arm B takes that declared limit in the same fire
rather than boarding it.

## The re-key: on the FILE, and on the IMPORT

A probe does not need to write `streamClaude(` to reach the model. It needs to **import a module
that does** and make the product run. So arm B keys the hop on **file reachability** and the probe
side on the **import specifier**, which is the one token the import route cannot avoid writing:

- **M** = modules under `packages/server/src` whose own source contains a call to a member of
  arm A's `S1` (`streamClaude`, `streamClaudeRoundtable`), plus `claude/client.ts` itself. Derived
  in the run, not typed. Declared limit: one hop — a module importing a member of **M** without
  calling `S1` directly is not in **M**.
- **KEY_IMP** = an import-specifier key over **M**'s basenames/paths, asserted non-degenerate
  (arm A's drive-1 lesson: a key assembled from an empty array is *saturated*, not empty — the
  builder throws).

## Predictions

- **`Q1` — KNOWN POSITIVE, first.** `KEY_IMP` fires on an in-memory fixture importing
  `'../packages/server/src/routes/messages.js'`. Predicate: `fires === true`. **Expected: LANDED.**
- **`Q2` — two-sided negative.** `KEY_IMP` does **not** fire on a fixture importing
  `'../packages/server/src/db/queries.js'` (a server module not in **M**). Predicate:
  `fires === false`. **Expected: LANDED.** Arm A's drive 1 is why this limb is registered at all.
- **`Q3` — `|M| === 3`.** `client.ts`, `routes/messages.ts`, `routes/files.ts` and nothing else.
  **Expected: LANDED** — a hand `grep` in arm A's fire found exactly those two callers outside
  `client.ts`, and this re-derives it under a file-level key. Disagreement means one of the two
  reads is wrong, which is the point of re-deriving it.
- **`Q4` — the import side is NOT zero.** At least one of the 155 probes imports a member of **M**.
  Predicate: `hits.length > 0`. **Expected: LANDED.**
- **`Q5` — the bucket price is strictly smaller than the hit count.** Most importers of a route
  module also bind or dial a port, so `net` already refuses them. Predicate:
  `movers.length < hits.length`. **Expected: LANDED.** If `movers.length === hits.length` with
  `hits > 0`, every importer is unguarded today and the cure is urgent rather than prospective.
  **`Q5` is REFUSED, not refuted, when `hits.length === 0`** — unsatisfiable over an empty
  population.
- **`Q6` — the price is non-zero.** Predicate: `movers.length > 0`. **Expected: REFUTED** (I expect
  zero movers, i.e. a free prospective cure like the `stream` widening). Registered pointing the way
  the predicate points: I am predicting `> 0` and expecting that to be refuted, so a LANDED here is
  a live unguarded import route and the stronger result.

## Legs

`B0a` population 155 · `B0b` fixtures stay in memory · `B1` **M** derived and printed in full ·
`B2` `KEY_IMP` assembled from the derived array **and** non-degenerate (builder throws on empty) ·
`B3` subject imported, not copied (`hazards`, `EXEMPTIBLE`, `SWEPT`, `DEFERRED`) · `B4` every hit
printed with file, line, literal-only status and bucket · `B9` `git status --porcelain packages
scripts` empty.
