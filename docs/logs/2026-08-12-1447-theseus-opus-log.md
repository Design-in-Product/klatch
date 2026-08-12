# Theseus session log — 2026-08-12 (WORK fire, 14:47 PT, Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.
Synced to `origin/main` by the wrapper at fire time; `HEAD` on arrival `94dcd83`.

Second Theseus fire of the day — the 10:47 START fire's log is
`docs/logs/2026-08-12-1047-theseus-opus-log.md`.

---

## 14:47 — Session start protocol

- `git log` / `git status`: clean, `94dcd83` (Argus's 8/12 WORK log).
- Read `docs/COORDINATION.md` (own section) and this morning's log.
- `ls docs/mail/`: one new item addressed to this seat since the 10:47 fire —
  `pard-to-theseus-cc-team-measured-output-and-both-options-2026-08-12.md` (11:11). **Actionable and
  unblocking**, worked this fire in full.
- Pard did **both** things I asked for in the morning fire: ran `inspect-klatch-db.mjs` and pasted
  the output, *and* copied the four inbound DBs to `.testdata/`. Verified present this fire
  (`ls .testdata/` → 4 `.db` files, 11:11 timestamps; `*.db` gitignored, `.gitignore:3`).

## 15:00 — The thing I should have checked yesterday morning

Hunting for the 3/14 backup to compare against, I found it **already inside my own worktree**:

```
backups/klatch.db.backup-2026-03-14            5,230,592
backups/klatch.db.backup-2026-03-15-pre-fresh    335,872
```

Daedalus's 8/09 memo says so in as many words — "also mirrored in every agent worktree's own
`backups/`" (`daedalus-to-team-real-test-data-found-on-amber-2026-08-09.md:12`). I wrote a document
that morning explaining why I could not measure the backup, and the file was one `ls` away.

The four inbound DBs genuinely weren't reachable and Pard's copy was genuinely needed. The backup
half of my ask was me not checking my own directory. Recorded because "I can't reach it" is the same
class of unverified assertion as "we don't have X" — I asserted an absence from recollection, in a
document whose entire premise was refusing to assert without measurement.

**Consequence for the open route question: none, and that's the point.** Everything this fire needed
was inside the sandbox. The subprocess bypass stays unruled and unused; the three `/tmp/th-*.db`
write artifacts from the morning stay in place as evidence.

## 15:05 — §1 Measured the corpus question end to end

Ran my own instrument against all six DBs on this host. **Every one of Pard's figures reproduced
exactly** — main 16/2124/3 entities, peaceful-merkle 438/1518/87 empty, kind-faraday 403/1393/80
empty, maxt-test 0 tables.

The morning ruling used msgs/channel, which averages 54 empty channels together with a 355-message
history. Replaced it with the population that actually matters to a continuity test — **imported
channels holding ≥20 messages** — via a new `scripts/compare-klatch-corpora.mjs`:

| | 3/14 backup | klatch-main | wt-peaceful-merkle | wt-kind-faraday |
|---|---:|---:|---:|---:|
| Channels / EMPTY | 139 / 54 | 16 / 1 | 438 / 87 | 403 / 80 |
| **MAXT-eligible** | **22** | **11** | **0** | **0** |
| by source | claude-ai 21 · cc 1 | cc 11 · **claude-ai 0** | — | — |
| depth max/median/min | 355 / 58 / 20 | 562 / **98** / **68** | — | — |
| artifacts per message | 1.07 | **3.46** | 0.01 | 0.01 |

**Ruling (measured): the 2026-03-14 backup is the MAXT-04 corpus.** Same conclusion as the morning,
arrived at properly.

- **Worktree DBs excluded on a measurement, not an inference.** Neither holds a single channel at
  ≥20 messages; deepest are all exactly 8 with repeated fixture names. Pard's dev-residue reading
  **confirmed**; my 8/09 "failed bulk import dropped real content" reading **closed**.
- **Provenance decides between the two real candidates.** Main has **zero** `claude-ai` channels;
  the backup has 21 eligible ones. Under `PREMISE.md` the claude.ai export corpus is the literal
  subject of the canonical use case. Artifact ratio says it independently: 3.46/message is a
  tool-using coding transcript, 1.07 is conversation.
- Named cast re-verified from my own run: **seven** multi-hundred histories, not the four I reported
  on 8/09 (VA exec asst 355, Comms Chief 299, CoS 244, CXO 221, CoS o4.6 202, Chief Architect 188,
  HoSR 188). 138 of 139 channels bind `DEFAULT_ENTITY_ID` → exercises increment #1's guess+confirm.

## 15:20 — §2 Two corrections against my own morning ruling

**The ruling survived; two of its three reasons did not.**

1. **"16 channels is too thin for composition" — false.** Main's imported channels are *deeper* than
   the backup's on every statistic: median 98 vs 58, min 68 vs 20. I ranked it down on channel
   count — **the exact trap I had named and warned against two paragraphs earlier in the same
   document**, where I wrote that channel count "is close to irrelevant" and "ranking by it is the
   trap in this decision." Naming a trap does not exempt you from it.

2. **The reset/erosion lineage hypothesis is falsified.** Pard asked for a variant accounting for
   2,112 imported messages arriving after 4/26; there isn't one, the premise is wrong.

   ```
   original_id  backup 1,208 distinct · main 1,078 distinct · shared 18
   channel name backup 89 · main 16 · shared 1  ("general", a default name)
   ```

   Inspected all 18 individually: every one belongs to **one** Claude Code session imported into both
   (`Secundus — 2026-03-11`, 40 msgs ↔ `theseus-2026-03-22-imported`, 143 msgs; `original_timestamp`
   identical to the millisecond). **No `claude-ai` channel of the backup's 32 appears in main.**
   Import floors five months apart. **Two disjoint corpora, not two points on a decay curve.**

   This *sharpens* the placement call: **the 3/14 backup is the only surviving copy of the claude.ai
   import corpus on this host.** Hold goes from prudent to required.

   **Still open, now explicitly:** the `~49 imports` figure matches **no** DB I can measure (72 / 12 /
   154 / 140). It describes a state not present on this host. Flagged for Daedalus and Calliope —
   it sits in `composition-continuity-gap-2026-07-19.md:124` and `ROADMAP.md:178`.

## 15:30 — §3 A suspected import defect, checked and closed as by-design

The overlap probe surfaced user+assistant rows sharing one `original_id` at scale — **1,034 of
main's 1,078 distinct ids**, every one same-channel with differing roles. Reads as an import-path
integrity bug.

**It is deliberate, verified by reading code rather than inferring:** `import/parser.ts:90` declares
`originalId` as "uuid of root user event", `:353` assigns `turnRoot.uuid`, and `db/queries.ts:855,865`
writes that same value to both rows of a turn. It is **turn** identity, not message identity.

Checked for consequences before dropping it, since a shared key is only safe if nothing treats it as
unique: no `UNIQUE` constraint or index (`db/index.ts:149,190`); only non-insert reads are hydration
(`queries.ts:46`), an `original_id IS NULL` native-message count (`:931`), and export round-trip
(`routes/export.ts:297`). **Nothing dedupes on it. No defect, no action.** Recorded because the query
is alarming and the next person to run it deserves the answer rather than the alarm.

## 15:35 — §4 A correction to my own tool's stated safety property

`.testdata/` held **4 files at fire start and 12 after my runs**. SQLite creates `-wal` and `-shm`
sidecars beside a WAL-mode database **even on a `readonly: true` connection**.

`inspect-klatch-db.mjs` documented itself as "read-only by construction." The substantive claim
survives — no DB content mutated, sidecars gitignored (`.gitignore:4-5`) so nothing leaks into the
repo — but "read-only" was doing double duty: true of the database, false of the directory.
Docstring corrected in both scripts, together with Pard's finding that they resolve `better-sqlite3`
by bare specifier and so must run from a checkout with `node_modules`.

Three ad-hoc probe scripts written under `.testdata/` during this fire were deleted after use;
`git status` confirmed the only untracked artifact left was the intended new script.

## Deliverables this fire

- `docs/research/maxt-corpus-ruling-measured-2026-08-12.md` (supersedes the morning's provisional)
- `scripts/compare-klatch-corpora.mjs`
- `docs/mail/theseus-to-pard-cc-team-measured-ruling-and-two-corrections-to-myself-2026-08-12.md`
- `scripts/inspect-klatch-db.mjs` — docstring correction (§4)
- `docs/research/inbound-test-data-canonicity-2026-08-12.md` — superseded banner
- `docs/COORDINATION.md` — Theseus section

## Open, carried forward

- **xian:** the route decision (subprocess bypass), read case 8/11 + write case 8/12. **Not needed
  this fire and not used.** Three `/tmp/th-*.db` files still waiting on it.
- **xian:** a standing AAXT spend ceiling — *N rounds per fire without asking*. Still 1/fire.
- **xian:** inbound staging cleanup approval (Pard's 08:23 memo holds it open).
- **Daedalus/Calliope:** the `~49 imports` figure matches no measurable DB — see §2.
- **Placement: hold**, now with a stronger reason (§2). MAXT-04's gate is still increment #3.
- **Unchanged:** 10 of 12 AAXT rounds unverified in the passing direction. `OPENAI_API_KEY` absent ⇒
  judge and target share a vendor.

## Mail disposition

**No threads moved to `docs/mail/read/` this fire.** The canonicity *question* is closed, but both
Pard memos carry live items that are not mine to close: the 08:23 memo holds inbound staging until
xian approves cleanup, and the 11:11 memo carries the route/write-case ask to xian. Close-discipline
says open threads stay visible.

## Session wrap verification

Run for real and pasted, per `CLAUDE.md` §Session Wrap Protocol. Push succeeded on the first
attempt — no rebase needed, nothing force-pushed.

### Step 1 — commits landed on `origin/main`

```
$ git log origin/main --oneline -4
ce86a42 theseus(8/12 WORK): measured MAXT-04 corpus ruling; corpus comparator; two self-corrections
e9f455d mail: Theseus 8/12 WORK — measured corpus ruling + two corrections to my own provisional reasoning
94dcd83 log(argus): 8/12 WORK fire — verification block appended per session wrap protocol
c0d0731 aaxt(client): fix R42's stale effort-restriction probe (C6a), verified live
```

### Step 2 — each deliverable present in the pushed tree

```
$ git ls-tree --name-only -r origin/main -- <deliverables>
docs/COORDINATION.md
docs/logs/2026-08-12-1447-theseus-opus-log.md
docs/mail/theseus-to-pard-cc-team-measured-ruling-and-two-corrections-to-myself-2026-08-12.md
docs/research/inbound-test-data-canonicity-2026-08-12.md
docs/research/maxt-corpus-ruling-measured-2026-08-12.md
scripts/compare-klatch-corpora.mjs
scripts/inspect-klatch-db.mjs
```

Checked against the pushed tree, not local disk — `ls` alone would pass for a file that never left
this worktree.

### Step 3 — no test data leaked into the repo

```
$ git status --short   (after staging, before commit)
M  docs/COORDINATION.md
A  docs/logs/2026-08-12-1447-theseus-opus-log.md
A  docs/mail/theseus-to-pard-cc-team-measured-ruling-and-two-corrections-to-myself-2026-08-12.md
M  docs/research/inbound-test-data-canonicity-2026-08-12.md
A  docs/research/maxt-corpus-ruling-measured-2026-08-12.md
A  scripts/compare-klatch-corpora.mjs
M  scripts/inspect-klatch-db.mjs
```

`git add -A` staged **nothing** from `.testdata/` — the four DBs and their twelve `-wal`/`-shm`
sidecars are all covered by `.gitignore:3-5`, and the three ad-hoc probe scripts were deleted before
staging. xian's conversation history did not enter the repo.

### Explicitly NOT verified this fire

- **No AAXT round was run.** Last live run remains R42 (8/12 START). No conveyance figure on this
  entry and none should be inferred from it.
- **`npm test` / `npm run build` were not run.** This fire touched no product code — only `scripts/`
  and `docs/`. No suite figure on this entry.
- **`klatch.db.backup-2026-03-15-pre-fresh`** was censused (59 channels / 219 msgs / 27 empty; 2
  channels at 48 msgs, everything else ≤8) but not run through the eligible-population comparison.
  It is obviously not a corpus and I did not spend a run confirming it formally.
- **Message content was read in exactly one place and deliberately narrow:** the overlap probe
  selected `LENGTH(content)`, never content itself, to confirm the 18 shared ids were the same
  material rather than an id collision.
