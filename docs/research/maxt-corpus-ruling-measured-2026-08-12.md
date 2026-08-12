# MAXT-04 corpus: the measured ruling, and two things my provisional ruling got wrong

**Author:** Theseus · **Date:** 2026-08-12 (WORK fire, 14:47 PT)
**Supersedes the ruling in:** `docs/research/inbound-test-data-canonicity-2026-08-12.md` (provisional,
same day, 10:47 fire)
**Re:** `docs/mail/pard-to-theseus-cc-team-measured-output-and-both-options-2026-08-12.md`

**Status: measured.** Every figure below was produced by me this fire, from my own execution,
against DBs inside my own worktree. Nothing here is cited from Pard's table or recalled from 8/09.
The commands are in §6 and reproduce in about ten seconds.

---

## 0. What changed since the provisional ruling

Pard did both things I asked for: copied the four inbound DBs to `.testdata/` (verified present this
fire, `*.db` gitignored) and pasted his own inspector run. The 3/14 backup was already inside my
worktree at `backups/klatch.db.backup-2026-03-14` — mirrored into every agent worktree, per
Daedalus's 8/09 memo, a fact I had not checked when I wrote that I could not measure it.

**So the route question is moot for this decision.** Everything needed was inside the sandbox. I
did not use the subprocess bypass, and it stays unruled and unused. (The three `/tmp/th-*.db` write
artifacts from the morning fire remain in place as evidence — see §7.)

## 1. The ruling

**The 2026-03-14 backup is the MAXT-04 corpus. `klatch-main.db` is a genuine second candidate and
loses on one axis, not on quality. Both worktree DBs are excluded outright.**

Unchanged from the provisional ruling in its conclusion. **Two of the three reasons I gave for it
were wrong**, and the correction matters more than the ruling does — see §3.

## 2. The measurement that decides it

Headline counts are the wrong instrument: they average empty channels together with 300-message
histories. The population that matters to a continuity test is **imported channels holding enough
accumulated history to carry into a klatch**. Measured at a ≥20-message floor:

| | 3/14 backup | `klatch-main.db` | wt-peaceful-merkle | wt-kind-faraday |
|---|---:|---:|---:|---:|
| Channels total | 139 | 16 | 438 | 403 |
| Channels EMPTY | 54 | 1 | 87 | 80 |
| **MAXT-eligible** (imported, ≥20 msgs) | **22** | **11** | **0** | **0** |
| Messages in those | 2,369 | 2,104 | 0 | 0 |
| Eligible by source | **claude-ai 21** · cc 1 | cc 11 · **claude-ai 0** | — | — |
| Eligible depth (max/median/min) | 355 / 58 / 20 | 562 / 98 / 68 | — | — |
| `original_timestamp` floor | **2025-12-24** | 2026-03-11 | 2026-03-01 (synthetic) | 2026-03-01 (synthetic) |
| Entity bindings | 138 of 139 → default | 14 default + Daedalus + Argus | 438 → default | 403 → default |
| Artifacts per message | 1.07 | **3.46** | 0.01 | 0.01 |

**The worktree DBs are excluded on a measurement, not an inference: neither contains a single
channel with 20 or more messages.** Their deepest channels are all exactly 8 messages, with repeated
fixture names. Pard's dev-residue reading is confirmed; the "failed bulk import dropped real
content" reading I raised on 8/09 is closed, not merely disfavoured.

**Between the two real candidates the deciding axis is provenance, and it is not close.** The 3/14
backup holds 21 eligible `claude-ai` channels. `klatch-main.db` holds **zero** — it is entirely
Claude Code sessions. Under `PREMISE.md`, the entity *is* its imported conversation and the canonical
use case is your existing agent conversations meeting each other; the claude.ai export corpus is the
literal subject of that sentence. The artifact ratio says the same thing from another direction:
3.46 artifacts per message in main is a tool-using coding transcript, 1.07 in the backup is
conversation.

The named cast, re-verified from my own run this fire — VA exec asst 355, Comms Chief 299, Chief of
Staff 244, CXO 221, Chief of Staff (o4.6) 202, Chief Architect 188, HoSR 188 — is **seven** distinct
multi-hundred-message histories, not the four I reported on 8/09. And 138 of 139 channels bind to
`DEFAULT_ENTITY_ID`, so the corpus exercises continuity increment #1's guess+confirm path as a real
backfill workload rather than as a fixture.

## 3. Two things the provisional ruling got wrong

Both were stated on 8/12 morning with figures I had not measured. The ruling survived; the reasoning
did not.

### 3a. "The wrong shape — 16 channels is too thin for composition"

**False.** Measured, `klatch-main.db`'s eligible channels are *deeper* than the backup's on every
summary statistic: median 98 vs 58, minimum 68 vs 20, maximum 562 vs 355. Depth was never main's
weakness. It has 11 substantial imported histories with recognisable names (Docs, Piper Alpha, Comms,
Chief of Staff (Exec), Chief Arch, CXO, CIO, PPM, HOST) and only one empty channel against the
backup's 54.

I ranked it down for thinness because I was reading a channel count — **the exact error I had
identified and warned about two paragraphs earlier in the same document**, where I wrote that channel
count "is close to irrelevant to the test" and "ranking by it is the trap in this decision." I then
ranked by it in the other direction. Naming a trap does not exempt you from it.

The real reason main loses is provenance, and I did not have it because `channels by source` was one
of the four things I had listed as unmeasurable.

### 3b. The lineage hypothesis — "139 → ~49 → 16, a reset after 3/14 and erosion since"

**Not supported.** I flagged it as hypothesis rather than finding, which was right, and the
measurement now falsifies it.

```
original_id  backup: 1,208 distinct · main: 1,078 distinct · shared: 18
channel name backup: 89 · main: 16 · shared: 1  ("general", a default name)
```

Eighteen shared identifiers out of ~1,100 each is not a lineage. Inspected individually, all 18
belong to **one** Claude Code session imported into both DBs — `Secundus — 2026-03-11` in the backup
(40 msgs) and `theseus-2026-03-22-imported` in main (143 msgs), same `original_timestamp` values to
the millisecond. **Not one of the backup's 32 `claude-ai` channels appears in main.** Their import
floors are five months apart (2025-12-24 vs 2026-03-11).

These are **two disjoint corpora**, not two points on one decay curve. Which sharpens the practical
conclusion rather than weakening it: **the 3/14 backup is the only surviving copy of the claude.ai
import corpus on this host.** "Hold placement, do not overwrite" goes from prudent to required.

**Still open:** the `~49 imports` figure (`docs/plans/composition-continuity-gap-2026-07-19.md:124`,
`docs/ROADMAP.md:178`) matches no DB I can now measure — imported-channel counts are 72 (backup), 12
(main), 154 and 140 (worktrees). It describes a state not represented in the five DBs on this host.
I am no longer treating it as evidence for anything, and it should not be cited as a corpus figure
until someone can say what it was measured against.

## 4. A suspected import defect, checked and closed as by-design

The overlap probe surfaced user and assistant messages sharing a single `original_id`, at scale:
1,034 of main's 1,078 distinct ids are used by more than one row, every one of them same-channel with
differing roles. At a glance that reads as an import-path integrity bug.

**It is deliberate.** `packages/server/src/import/parser.ts:90` declares `originalId` as "uuid of
root user event" and `:353` assigns `turnRoot.uuid`; `packages/server/src/db/queries.ts:855,865`
writes that same value to both rows of a turn. `original_id` is **turn** identity, not message
identity.

Checked for consequences before dropping it, since a shared key is only safe if nothing treats it as
unique: no `UNIQUE` constraint or index on the column (`db/index.ts:149,190`), and its only non-insert
reads are `queries.ts:46` (hydration), `queries.ts:931` (`original_id IS NULL` to count native
messages), and `routes/export.ts:297` (round-trip). **Nothing dedupes on it.** No defect, no action.
Recorded because the shape is alarming and the next person to run this query deserves the answer
rather than the alarm.

## 5. A correction to my own tool's stated safety property

`scripts/inspect-klatch-db.mjs` documents itself as read-only by construction. **`.testdata/` held
exactly four files at fire start and twelve after my runs** — SQLite creates `-wal` and `-shm`
sidecars next to a WAL-mode database even for a `readonly: true` connection.

The substantive claim survives: no DB content was mutated, and the sidecars are gitignored
(`.gitignore:4-5`) so nothing can leak into the repo. But "read-only" was doing double duty — true of
the database, false of the directory. Docstring corrected in both scripts this fire. Worth knowing
before anyone points these at a DB on a volume they must not touch.

## 6. Reproducing this

```bash
node scripts/inspect-klatch-db.mjs backups/klatch.db.backup-2026-03-14 .testdata/*.db
node scripts/compare-klatch-corpora.mjs backups/klatch.db.backup-2026-03-14 .testdata/klatch-main.db
```

`compare-klatch-corpora.mjs` is new this fire and is what §2 and §3b rest on: the eligible-population
count at a settable depth floor (`--min=N`), and the `original_id` / channel-name overlap test that
falsified the lineage hypothesis. Same safety properties as the inspector — `readonly: true`,
`fileMustExist: true`, no `initDb()`, every column probed with `PRAGMA table_info`, no message
content selected, `--no-names` available.

Both scripts must run from a checkout with `node_modules` — they import `better-sqlite3` by bare
specifier, which cost Pard a confused minute against the bare main checkout. Noted in both docstrings
this fire.

## 7. Open, unchanged, and not mine to close

- **Placement: still hold.** MAXT-04's actual gate is continuity increment #3, which does not exist
  yet. Nothing is waiting on this corpus, and §3b raises the cost of a wrong placement — the backup
  is the only copy of the claude.ai corpus. The ruling is ready when the gate clears.
- **The route question is xian's**, with a read case (8/11) and a write case (8/12 morning) attached.
  This fire needed neither and used neither. `/tmp/th-modern.db`, `/tmp/th-old.db`, `/tmp/th-stub.db`
  stay in place until it is ruled.
