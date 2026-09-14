# Theseus session log — 2026-09-14

Seat: Theseus Prime (manual testing & exploration — CLI side), worktree
`/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.

---

## 10:47 PT — START fire opens. Round 207.

Session-start protocol run: worktree clean at `1ffe72a4`, `docs/COORDINATION.md` read
(my section at :795, Round 205 is my last), `docs/mail/` listed, `docs/briefs/cross-pollination/current.md`
read (today's brief leads with my own Round 205 plan/apply divergence as insight #1).

**Mail addressed to me, read this fire:**
`daedalus-to-theseus-cc-xian-janus-argus-calliope-refuse-is-the-answer-and-the-apply-no-longer-re-resolves-2026-09-14.md`
— Round 206. He took my §6.1 third option (refuse an ambiguous name), built my §6.2
(`sameNameEntityIds`, plural), made `getAllEntities` deterministic per §6.3 while explicitly
declining to call that a fix, and left two things open (§7.1 the import path's own duplicate
pick; §7.2 E3).

## 10:47 PT — Reproduction, unmodified, before anything else.

- **Server suite: 1692 passed / 105 files.** Daedalus's number exactly.
- **`probe-round205` (mine) unmodified — and the first run did NOT match his §5 prediction.**
  It crashed at **arm F line 398**, `SqliteError: database disk image is malformed`, not at
  arm C line 276. Cause found and it is my instrument, not his fix: see below.
- **After `rm -rf .testdata/r205-probe`, it reproduces his prediction exactly:** A1 `skipped`,
  A2 `undefined`, A4/A5 `default-`, B1/B3 fail, then **`C1 · the apply wrote one undo record — 0`**
  and the crash at line 276. His §5 is right in every particular.

### Two defects in my own probe, found by the divergence between those two runs

`probe-round205` creates `WORK = .testdata/r205-probe` with `mkdirSync({recursive:true})`
(:96) and **never clears it**. Both defects follow from that.

1. **Stale `-wal` sidecar → malformed database on the second run.** Last night's run left
   `f-reach.db-wal` at **4,276,592 B (mtime Sep 13 19:56)**. Arm F's `copyFileSync(CORPUS, F)`
   (:393) replaces the main file only; opening it replays the old WAL into the new pages and
   SQLite reports `SQLITE_CORRUPT`. This is **Round 191's finding, and the same one Daedalus
   hit from the other side in his §6** — now in my instrument.
2. **Worse: arm C PASSED on a leftover undo record.** `recs = readdirSync(WORK).filter(startsWith(A + '.backfill'))`
   (:274) then `recs[0]`. On the contaminated workdir that found **last night's**
   `a-two-agents-one-name.db.backfill-2026-09-14T02-56-44-365Z.json`, so C1–C5 reported
   `1 undo record`, `aaaaaaaa`, `exits 0`, `binding goes back` — five green checks describing
   a run that did not happen today. On the clean workdir C1 reads **0**, which is the truth.

The second is the one that matters. A probe that reads its own previous run's output is a
probe that can report a fix still broken, or a defect already fixed, without either being so.
It is the same failure class I have spent six rounds reporting in the CLI, twice over now
(Round 201's hardcoded E1 detail line was the first).

## 10:50 PT — Round 206's fixes verified at source, not from the memo.

`entity-backfill.ts:541` (`else if (mayReuse && nameMatches.length > 1) skipReason = 'ambiguous-name'`),
`:545` (`sameNameEntityIds` when matches exist and no target pinned), `:727-728` (apply passes
`entityId: row.targetEntityId`), `import/entity-resolve.ts:83-88` (explicit id → `bound-existing`,
throws if absent), `db/queries.ts:370` (`ORDER BY e.created_at ASC, e.id ASC`). All exactly as
his memo describes.

## 10:52 PT — §7.1 taken up. `guessEntityName` has no basis filter.

Tracing the import path for his open item: entity resolution exists **only** on the claude-code
route (`import.ts:189-390`); the claude-ai endpoints at `:429`/`:545` have no entity fields at
all — still Round 139's gap. The confirm field is pre-filled at `:140` by
`guessEntityName(firstUserMessage, projectName)` — **which takes no basis argument.** The
backfill's `--bases` gate is applied by the backfill, downstream. So the import runs every basis,
always.

I expected the opposite and wrote the arm to assert it. Round 205 measured 0 `matched-by-name`
rows on the March corpus under the backfill's default basis, and I assumed the import inherited
that. **The check failed.** Measured directly: of 139 channel openers, 9 produce a name guess
through the import's own two-arg call, **all 9 `role-title`**, and one — `"chief of staff"` from
channel `"VA exec asst"` — normalizes onto a group of **4** entities.

So Round 206 hardened the path that reaches 0 rows on this corpus, and the path Daedalus left
open is the one with the hit. Recorded as a correction to my own expectation, not to his build
order — he named §7.1 himself.

## 10:55 PT — the live corpus, and it answers §7.1 the other way.

Drove `GET /import/claude-code/sessions` — the real endpoint that fills the import dialog —
against the live Claude Code install on this machine:

```
16 projects · 548 sessions
bases: identity-claim 536 · project-name 11 · role-title 1
20 distinct proposed names · 10 proposed for more than one session
Calliope×121  Theseus×92  Argus×91  Daedalus×91  Iris×61  Janus×44  Terminus×31
```

This decides the question. **Reuse-by-name is the feature on this path, not a convenience** —
121 Calliope sessions should land on one Calliope, which is what `PREMISE.md` wants and what
the comment at `import.ts:346-348` says. A refused backfill row costs nothing; **a refused
import costs the operator the import**, and one stray duplicate would turn 121 imports into
121 refusals. Today it instead silently captures all 121 for an arbitrary id.

**My answer: a picker in the confirm step, not a refusal.** The server plumbing already exists
(`import.ts:206` — `entityId` wins over `entityName`; `entity-resolve.ts:83-88` binds loudly),
so it is client-side work. Four shapes ranked in the memo, none built.

Second finding, true even with no duplicate anywhere: `ImportDialog.tsx:411` sends
`entityName: confirmedName` and `:632-633` prints `→ added to {conv.entityName}` — the line
reads back **the user's typed string**, not the bound record. Driven: typing `DAEDALUS` binds an
entity stored as `"Daedalus"` and still prints `DAEDALUS`.

## 10:57 PT — Round 207 built and verified.

- **Probe** `scripts/probe-round207-the-import-confirms-a-name-and-the-name-is-not-unique.mts`
  — **30 checks · 0 failed · 3 open**, two runs identical, `tsc --strict --module nodenext`
  clean, zero model calls. Arms A–E synthetic (reproduce with no corpus); F/G degrade to one
  line where the March backup or a live Claude Code install is absent. **Clears its work
  directory on entry**, which is the fix for §2 above.
- **Writeup** `docs/research/round207-the-import-confirms-a-name-and-the-name-is-not-unique-2026-09-14.md`.
- **Memo** `theseus-to-daedalus-cc-xian-janus-argus-calliope-206-holds-and-the-import-is-the-path-with-the-live-hit-2026-09-14.md`.
- **Server suite 1692 / 105 files after**, unchanged — no product code touched this round, arm Z
  confirms `packages/` clean.
- **Corpus untouched:** `c2295121bbdfdbbb` identical before and after, mtime still
  `2026-07-23T17:27:38.145Z`, 5,230,592 B (read via `fs.statSync`). Nothing written outside
  `.testdata/`; `~/.claude/projects` was read by the browse endpoint and not written.

## 11:0x PT — wrap.

Mail committed separately (`d829bf1c`) and **pushed to `main` ahead of the round commit**, per
the worktree mail discipline in CLAUDE.md. Round commit `d9b3578d`. Verification below.

**Step 1 — commits landed (`git log --oneline -4`):**

```
d9b3578d Round 207: the import confirms a name, and the name is not unique
d829bf1c mail: Theseus -> Daedalus, Round 206 holds and the import path is where the live hit is
1ffe72a4 log: Daedalus 9/14 START fire -- Round 206 wrap verification
7b00c713 Round 206: refuse an ambiguous name, and stop re-resolving at apply time
```

`d829bf1c` was pushed to `origin/main` during the fire (`1ffe72a4..d829bf1c  HEAD -> main`).
`d9b3578d` and this log are committed locally; **the wrapper owns delivery** and I am not
claiming them as delivered.

**Step 2 — each deliverable exists:**

```
scripts/probe-round207-the-import-confirms-a-name-and-the-name-is-not-unique.mts   25917 B
docs/research/round207-the-import-confirms-a-name-and-the-name-is-not-unique-2026-09-14.md   10293 B
docs/mail/theseus-to-daedalus-...-206-holds-and-the-import-is-the-path-with-the-live-hit-2026-09-14.md   7871 B
docs/logs/2026-09-14-1047-theseus-opus-log.md   (this file)
```

`docs/COORDINATION.md` updated (Theseus Prime section, Round 207 promoted to Status, Round 205
demoted to Previous).

**Mail state at close:** Daedalus's 9/14 memo and my reply both **left in `docs/mail/`** — the
thread has an open action (my §7.1 answer proposes client-side work nobody has taken) and carries
xian's corpus question, now seven rounds open. Not moved to `read/`.



---

# WORK fire — 2026-09-14 ~14:50–15:0x PT (Round 209)

## 14:50 PT — briefing.

`git log` current at `c94c2988`. Two new memos addressed to me, both Daedalus, both read in
full this fire: the picker-is-server-complete memo and the coin-flip correction. Argus's 9/14
WORK log flags a probe-hygiene gap and names it mine ("worth Theseus knowing before he retires
or re-aims this probe"). Took that as the assignment.

**Deliberately did not re-do Argus's work.** He had already verified Round 208 at source
(`entity-resolve.ts:88,147`, `queries.ts:370`, `fixture-provenance.test.ts:180`, `grep MUTATION`
→ 0) and matched the numbers. Duplicating a static source read is waste; my seat is driving
things.

## 14:52 PT — suite, run myself.

Server **1777 / 111 files**, client **311 / 13 skipped**. That is Daedalus's *corrected* figure
(`0eb571a1`), not the 1776 in both his earlier memos. Correction holds. First attempt piped
through `tail -25` and lost the server half — re-ran the server workspace alone rather than
infer it.

## 14:55–15:00 PT — the corruption, reproduced only on the third try.

Did not take the mechanism from Argus's memo. Two faithful-looking reconstructions **failed**:

1. hand-built WAL from the same corpus bytes → no corruption (a WAL is valid against an
   identical file and replays cleanly);
2. the real CLI with `--apply` → no corruption (checkpoints on close; sidecars land on the
   `.backup-backfill-*` file, `f-reach.db-wal` is 0 bytes).
3. **`planOf()`, the probe's own child mode → reproduced.** 4,276,592 B `f-reach.db-wal` —
   Argus's "4.2 MB" to the byte. `COLD planOf: exit 1 -> SqliteError: database disk image is
   malformed`; `CONTROL planOf (after unlink): exit 0`.

Detail that explains the symptom's location: **read-only opens survive a stale WAL**
(`READONLY: {"n":68}`). Arm D opens `readonly: true`; only the plan child dies.

Scratch reproductions written under `.testdata/` (gitignored) — `r209-repro{,2,3}.mjs`,
`r209-plan-child.mjs`. Not committed.

## 15:0x PT — fixes, and the thing I was not looking for.

Back-ported `probe-round207`'s hygiene. On opening 207 to copy the idiom, found it **already
carried this exact diagnosis at `:115-131`, including the same 4,276,592 B figure** — I had
written it and not carried it back. Recorded as my own gap, not a new discovery.

Three fixes: `WORK` cleared not merely created; `copyCorpus()` takes sidecars with the file;
**arm C no longer throws out of the probe** on a missing undo record (C2–C5 degrade to OPEN).
That third one meant **arms D/E/F/Z had been unreachable since Round 206** — every corpus
measurement silently not running.

`tsc --strict` then caught a stale projection: `:65` asked for `r.sameNameEntityId`, which
Round 206 replaced with the plural. Returning `null` for every row. **No check read it**, so
nothing scored wrong — corrected anyway.

**Then the headline.** With D/E/F reachable, arm E failed 3 and passed 1. The sheet's note now
reads `4 agents named "chief of staff" already exist (fc4a59b6, d064dae8, 45691e94, 1e18ec34)`
— Round 206 fixing my own Round 205 §4, cited by name at `backfill-entity-bindings.mts:1197`.
E1 matched `/already exists/`; verb is now `exist`; `notes` empty; **E4 tested `notes[0] ?? ''`
and PASSED**, asserting the operator gets no sign three more carry the name — while the note
names all four. Swept the file for the shape, found **B2**, same thing: no `MATCHED-BY-NAME`
row post-206 → `matchLine === ''` → both `!includes` true → **green**.

Generalisation: a check whose subject can default to empty, asserting a negative, goes green
exactly when the defect is *fixed*. Same family as Daedalus's Round 208 correction one layer
over — his test assumed the tie it needed; these assume the subject they need.

Arm E re-aimed (4/4 green against the real sheet); B2 guarded, now fails honestly. **Arms A/B/C
left pinning pre-206 expectations deliberately** — retiring them is a call about Daedalus's
behaviour change, recommended in the memo, not taken unilaterally.

**Probe: 23 checks · 8 failed · 5 open · 2 measurements**, two runs diffed IDENTICAL,
`tsc --strict` clean, zero model calls. Progression this fire: aborted-at-C → 10 failed (with
E4/B2 vacuously green) → 8 failed (honest).

## Wrap verification.

**Step 1 — commits landed:**

```
85b523ab mail: Theseus -> Daedalus/Argus, two checks went green when the defect was fixed
c94c2988 coordination+log: Argus 9/14 WORK fire -- Rounds 206-208 and Cowork merge swept, one probe-hygiene gap flagged
cd8d98a9 coordination+log: Daedalus 9/14 WORK -- in-fire correction, 1777/111 not 1776/111
```
