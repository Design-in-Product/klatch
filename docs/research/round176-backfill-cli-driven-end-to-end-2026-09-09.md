# Round 176 — the backfill CLI, driven end to end: it does what it says, and the approve-by-id workflow does not work

**Theseus · 2026-09-09 (START fire)**
**Instrument:** `scripts/probe-round176-backfill-cli-end-to-end.mts`
**Under test:** `scripts/backfill-entity-bindings.mts`, `packages/server/src/db/entity-backfill.ts` (Daedalus, Round 175, `02270ee`)
**Result:** **52 regression checks · 0 failed · 6 open · 2 measurements.** Two full runs, same shape both times. Zero model calls, zero API spend. `klatch.db` never opened; the fixture lives in `.testdata/r176/` (gitignored). `git status` shows only the new probe — no `packages/` file touched.

---

## Why this fire went here

Daedalus's 9/9 memo disclaimed exactly one layer, by name:

> "The CLI path — snapshot, apply, undo record round trip — is exercised on that fixture and by hand, not by an automated test; the module underneath it is unit-tested, the wiring above it is not."

That layer is this seat, and it matters more than usual right now, because the next thing that happens to this tool is **xian running one command against the only `klatch.db` anyone cares about.** Everything below runs the real script as a real subprocess — real `argv`, real `process.env.KLATCH_DB` resolution, real `db.backup()` — against a real file-backed database built by the real `importSession`.

Verification is deliberately *not* done through the code under test. After each subprocess the probe opens the database with its own read-only `better-sqlite3` handle and asserts in raw SQL. The single exception is arm D, which has to call the real `getEntityTranscript`, because "the agent can see its own answers" is a claim about that function; it runs in its own subprocess.

**The fixture:** 8 in-scope candidate channels bound to `default-entity` (`claude-code` / `claude-ai`), plus one `klatch`-source channel and the schema's own seeded `native` `#general`, both of which must be left alone. Seeded to reach every branch: two channels naming the same new agent, one naming a pre-existing agent, one naming "Claude", one with no identity line, one with a project name only, one double-bound. P3 rows (assistant `entity_id IS NULL`) are made by hand after import, because nothing in the app writes them today — they are the population the schema predicts and the corpus may or may not contain.

## The headline: the sheet's ids are not the flag's ids

Daedalus offered xian a confirm round trip, and it is the right shape for a 72-row decision:

> "`--channels=<ids>` exists so the honest version is available: read the sheet, hand back the ids you approve, apply only those."

So the ids a user hands back are the ids the sheet printed. The sheet prints an 8-hex prefix:

```js
`  ${r.channelId.slice(0, 8).padEnd(10)}...`      // backfill-entity-bindings.mts:155
```

and `--channels` matches full uuids by exact membership:

```js
if (options.channelIds && !options.channelIds.includes(ch.id)) continue;   // entity-backfill.ts:219
```

**Measured (G5):** two ids copied straight off the sheet, handed back to `--channels`, produce `Candidates: 0 — 0 would move, 0 skipped` and **exit 0**. Composed with G2 below, the documented approve-by-id workflow silently moves nothing and reports success. This is not a hypothetical: it is the *only* documented way to do the thing xian said he wanted, and it fails on its first use.

Two ways to close it, both small — print the full id in the per-channel sheet, or match `--channels` entries as prefixes. I'd take the second and keep the sheet readable, with the prefix required to be unambiguous.

## The three silent-zero findings, which share one shape

Each of these takes an operator mistake and returns a clean exit 0 with a report that reads exactly like "your corpus has nothing to fix."

| | Input | What happens | Where |
|---|---|---|---|
| **G5** | ids copied off the sheet | `Candidates: 0`, exit 0 | `:155` vs `entity-backfill.ts:219` |
| **G2** | an id that doesn't exist / is mistyped | `Candidates: 0`, exit 0, id never echoed | `entity-backfill.ts:219` |
| **G1** | `--bases=identity_claim` (underscore, not hyphen) | every row falls to `basis-excluded`, `0 would move`, exit 0 | `:115`, `split(',') as any[]` — never validated against `GuessBasis` |

The shape is the one Daedalus himself named in this very build, one layer over: **a placeholder the caller cannot tell from an answer.** `resolves-to-default` exists because "moved 1 channel" would have been a success reported for a channel that did not move. `Candidates: 0` is the same lie in the other direction — a *nothing to do* reported for a corpus full of things to do. The fix is symmetrical with the one he already made: name what you didn't find. Echo unmatched `--channels` ids, reject unknown `--bases` values, and say "0 of 72 candidates matched your filter" rather than "Candidates: 0".

For xian's actual first run — `npx tsx scripts/backfill-entity-bindings.mts /path/to/klatch.db` with no flags — **none of these three can fire.** They are all flag paths. The no-flag review sheet is sound (arms A and B, below), which is the run he was asked for.

## What holds, and was worth checking

**Arm A — a dry run writes nothing.** Verified at four levels on the real file: sha256 of `klatch.db` identical, mtime identical, a full row dump of `messages` + `channel_entities` + `entities` identical, entity count unchanged. No backup left beside the DB; the tmp snapshot deleted. The design Daedalus described — snapshot from a read-only handle, plan against the snapshot — does what he said it does.

*A correction to my own first run:* it reported `FILE CHANGED`, and the CLI was innocent. I had held a second writable handle open across the run to simulate a live server, and closing the last writable connection to a WAL database checkpoints it — my own probe wrote the bytes I was accusing the tool of writing. Separated into arm A2, which now checks only what it can: the run exits 0, produces a byte-identical sheet, and hits no `SQLITE_BUSY` with another process holding the database writable. **So xian can run this with `npm run dev` up.**

*And a second one, from the same run:* my `fs.copyFileSync` of the fixture produced a database with **no tables** — the content was still in the `-wal`. That is the exact trap the CLI avoids by using `db.backup()`, and the one my own 8/12 note on `inspect-klatch-db.mjs` recorded. I reached for the unsafe copy anyway. The probe now snapshots through the backup API everywhere.

**Arm B — the review sheet says what the database says.** `Candidates: 8 — 4 would move, 4 skipped` matches raw SQL. All four skip reasons are reachable and reported by name (`{"no-guess":1,"multi-bound":1,"basis-excluded":1,"resolves-to-default":1}`) — including `resolves-to-default`, the one he did not anticipate when scoping. `new agents (2): Tarn, Wren` counts a name once across two channels while both rows read as moving; `reused agents (1): Sable`. Out-of-scope bindings are named rather than dropped: `untouched: {"klatch":1,"native":1}`. P2 and P3 are counted separately (`8 P2 ... 4 P3`), which is the number xian is actually being asked about.

**Arm C — apply, on the real file.** 4 channels re-pointed, 2 agents minted. Every moved channel is off the default; all 4 skipped channels and the out-of-scope `klatch` channel are bound exactly as found. The binding *and* the messages both move: on the Wren channel, 3/3 assistant rows carry Wren and 0 remain NULL, and 0 rows in any moved channel are still stamped `default-entity`. The backup written beside the database is row-for-row the pre-apply state. The undo record stores message ids, not a predicate, and remembers 4 P3 ids.

Two invariants worth stating because they are what stops this tool destroying something: **a pre-existing agent is never recorded as `mintedHere`** (Sable, created before the run, comes back `false` — this is what keeps undo from deleting an agent the user made), and **two channels naming the same agent converge on one entity id with exactly one of them flagged as having minted it**, so undo deletes it once. Which of the two mints is not fixed — `planEntityBackfill` orders by channel id, which is a uuid — and my first version of this check asserted the wrong half of that pair. The invariant, not the order, is what's pinned now.

**Arm D — the agent can see its own answers, at the real function.** `getEntityTranscript(Wren)` returns 3/3 of that channel's assistant rows, the formerly-NULL P3 row among them. Before this run that row was invisible to *every* entity including the default. This is the product claim underneath the whole ruling, and it holds at a level above the unit tests.

**Arm E — undo.** `Reverted 4 channel(s). Agents removed: 2`. `messages` and `entities` come back row-for-row identical to pre-apply, and a second `--undo` against the same record is a no-op rather than a corruption.

## Two open items on undo

**E1 — the round trip does not restore `channel_entities.added_at`.** Apply DELETEs the default binding and undo re-INSERTs it, so the restored row's `added_at` is the undo's clock (4 rows here). That column is not decorative: it is the roster ordering key at `queries.ts:486` (`ORDER BY ce.added_at ASC, ce.rowid ASC`). It is invisible on the single-bound channels a backfill touches — multi-bound channels are skipped by design — and becomes visible only if a channel gained a second entity between apply and undo, where the restored default would then sort last instead of first. Carrying the original `added_at` in `BackfillUndoChannel` closes it; the record already stores per-channel state.

To be precise about the claim rather than scoring a point: "row-for-row identical" is **true** of `messages`, `entities`, and the `channel_entities` keys. One timestamp column is the whole of the difference, and I would not have found it without a full column dump.

**E2 — `--undo` is the one mode that takes no snapshot.** `backfill-entity-bindings.mts:84` guards the `db.backup()` with `if (!undoPath)`. The apply's backup still covers the round trip, so "two independent ways back" is accurate *from an apply*. But an undo run has one way back, and it is a file the operator has to still have — and the reason to reach for `--undo` at all is usually that something already went wrong. A snapshot before an undo costs one `db.backup()`.

## One open item that was already known

**A3 — a dry run leaves `-wal` / `-shm` sidecars beside the real database.** Documented in the CLI header, inherited from my own 8/12 note, gitignored. Recording it as measured rather than assumed: it still happens. It is a file creation next to a database the tool otherwise promises not to write to, and the promise is worth stating with that exception attached when xian reads the header.

## What xian's run is exposed to, in one line

The no-flag review sheet — the command he was actually handed — is sound, and none of the six open items can fire on it. The flag paths are where the silent zeros live, and `--channels` in particular does not work with the ids the sheet gives you.

## Not claiming

The 72-channel figure is still Daedalus's, from `composition-continuity-gap-2026-07-19.md:140`, and unverified this session — my fixture is 8 channels I seeded. Whether **P3 is non-empty on the real corpus** remains predicted-from-schema and fixture-demonstrated only; I made those rows by hand because nothing in the app writes them. Only xian's dry run answers that. And delivery is not claimed: commits are local as of writing; the wrapper owns that.
