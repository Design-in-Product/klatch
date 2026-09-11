# Theseus — 2026-09-10 (START fire, Opus 5)

Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.

---

## 10:5x — briefing

Pulled state is `f242692c` (Daedalus's 9/10 START entry). Read `docs/COORDINATION.md` (my section:
status **available**; carried item Round 170's frequency probe, still blocked on a path to the real
`klatch.db` from xian), swept `docs/mail/`, read `docs/briefs/cross-pollination/current.md`
(today: validating known flags is not rejecting unknown ones — our Round 181 — and Piper Morgan's
AST-derived registry test).

One memo addressed to me was new: **`daedalus-to-theseus-xian-...-every-argv-token-is-read-and-your-n2-now-fails-on-purpose-2026-09-10.md`**
(9/10 START, Round 182). It closes all three Round 181 open items under one rule, reports four more
silently-ignored inputs he found driving them, and hands back one arm of my probe: N2 now fails
because its record came from N1, which is now refused. Actioned in the same turn as the read.

## 10:5x — reproduced both of his numbers before touching anything

- `probe-round181-…` unmodified against the fixed CLI: **31 checks · 1 failed · 0 open** —
  `N2 · control … — exit undefined · 8 of 8`. His number, his mechanism: `nRecord` empty,
  `nUndoOk` null, N3's `if (nRecord)` silently skipped, one check fewer.
- `probe-round182-…` (his): **39 checks · 0 failed**.
- Arithmetic check on his "did you mean": the four known flags are pairwise **≥ 5** edits apart
  (`apply/bases 5, apply/channels 6, apply/undo 5, bases/channels 5, bases/undo 5, channels/undo 7`),
  so by the triangle inequality no token can sit within 2 of two flags — the `find` returning the
  first hit can never pick the wrong one of two. Verified, not assumed.

## 11:0x — N2/N3 re-vehicled

Record now comes from a correctly spelled, unfiltered `--apply` (the same four-channel record N1
used to leave, so numbers stay comparable). Two strengthenings: a missing record is now a **FAIL**,
not a silent `if` skip — the silent skip is exactly how the count fell 32 → 31 without a word — and
N3 now asserts the parse-boundary refusal itself (no snapshot, still one record) plus the pasteable
`did you mean --undo=<path>?`. **Re-run: 35 checks · 0 failed · 0 open.**

## 11:1x — Round 183: does undo notice when the record no longer describes the database?

Read `undoEntityBackfill` (`entity-backfill.ts:554`) before building: it reads no current state —
re-binds `fromEntityId` with INSERT OR IGNORE, unbinds `toEntityId`, re-stamps recorded ids. And
`resolveImportEntity` matches by name, so a re-apply after an undo **re-mints** (new uuid). Records
list oldest-first. Round 176 arm E already covers "undo twice" at the state level; not duplicated.

First pass **19 · 0 failed · 5 open · 7 meas.** Three instrument errors of mine caught before
reporting anything:
- **Q1/Q2 (em/en dash) never reached the CLI** — the refusal text was `npm error arg Argument starts
  with non-ascii dash`, i.e. **npx** refused it. My Q2 measurement sentence ("the dash token was read
  as the database path") was false. Re-routing those two arms past npx to measure the script's rule,
  and keeping the npx result as its own measurement (it *is* what the documented command does).
- **C2's second quoted stderr line was tsx's DeprecationWarning**, not the CLI.
- **A1 said "were all WrenB"** without printing the before-stamps. Now printed.

## 11:5x — Round 183 results (after the fixes)

**19 checks · 0 failed · 5 open · 8 measurements. Two runs, same shape.** Probe and the re-vehicled
Round 181 probe both type-check clean under `tsc --strict --module nodenext`.

1. **A1:** apply (A) → undo A → `--apply --channels=<wren>` (B) → `--undo=A`. Output
   `Reverted 4 channel(s). Agents removed: 2`, exit 0. wren chat roster `["Wren"]` →
   `["default","Wren"]` (B's Wren), rows `WrenB ×3` → `NULL, default, default`. A3: `--undo=B` then
   restores pristine row for row.
2. **A2/D2:** the success line counts record entries, not changes (`entity-backfill.ts:577-578`,
   `:592-593`). The identical line printed for a correct undo, the A1 half-revert (0 deleted), and
   an undo after restoring the backup (D1: rows unchanged).
3. **C2:** a foreign record is stopped by the foreign key (C1: rows identical including `added_at`,
   0 orphan bindings) but told `undo failed part-way`, backup kept.
4. **Q3:** `--channel <id>` refuses, suggests `--channels` with no `=`, and doesn't echo the id.

Measured, not scored: B (re-seat through the real query functions, then undo →
`["default","Kestrel"]`, consistent with Round 178's pinned add case); npm refuses smart-dash tokens
under `npx tsx`; `--redo=` → `did you mean --undo=`; Q2/Q6 voices.

Writeup `docs/research/round183-the-undo-record-against-the-database-it-is-aimed-at-2026-09-10.md`;
memo `docs/mail/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-n2-is-green-and-undo-prints-one-line-for-three-outcomes-2026-09-10.md`.
Thread closed: Daedalus's 9/10 memo and my 9/9 Round 181 memo moved to `docs/mail/read/` (N2 done;
xian's dry run stays tracked in Daedalus's 9/9 apply-pass memo, left in `docs/mail/`).

## Carried, unchanged

**Round 170's frequency probe** still needs one path to the real `klatch.db` from xian.

## Wrap verification

Step 1 — commits on `origin/main` (after `git fetch`):

```
$ git log origin/main --oneline -4
9af53601 Round 183: N2/N3 re-vehicled green, and undo cannot tell which database it is aimed at
ff045eae mail: Round 183 report to Daedalus + xian -- N2 green, undo prints one line for three outcomes; R181/R182 thread to read/
f242692c log+coordination: Daedalus 9/10 START fire -- Round 182, every argv token is read or the run refuses
51d88637 Round 182: every argv token in the backfill CLI is read, or the run refuses
```

Both of this fire's work commits are on `origin/main`. The mail commit was pushed first and on its
own, per the worktree mail discipline. (The first mail `git add` failed with nothing committed,
because it re-named paths already staged as renames by `git mv`. Re-run with only the new file.)

Step 2 — deliverable files, each `ls`'d, all seven present:

```
docs/logs/2026-09-10-1051-theseus-opus-log.md
docs/mail/read/daedalus-to-theseus-xian-cc-iris-janus-calliope-argus-every-argv-token-is-read-and-your-n2-now-fails-on-purpose-2026-09-10.md
docs/mail/read/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-your-five-are-closed-and-the-family-has-a-sixth-member-2026-09-09.md
docs/mail/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-n2-is-green-and-undo-prints-one-line-for-three-outcomes-2026-09-10.md
docs/research/round183-the-undo-record-against-the-database-it-is-aimed-at-2026-09-10.md
scripts/probe-round181-unrecognised-flags-and-undo-record-validation.mts
scripts/probe-round183-undo-record-against-the-database-it-is-aimed-at.mts
```

`git diff --stat f242692c -- packages/ scripts/backfill-entity-bindings.mts` is empty. `npm test` was
**not** run this fire: no product or CLI file changed. Daedalus's 9/10 figures (server 1591/1591,
client 311 · 13 skipped) are his, not re-measured here.

Step 3 — this log and the COORDINATION update are committed last.

## What xian needs from this fire

One line, and nothing in it blocks the dry run: **if you ever undo, paste the `reverse with:` line the
apply printed rather than picking a record from the folder.** An older record, aimed at a database
that has moved on, undoes the wrong state and prints the same success line a correct undo prints.

---

# WORK fire (Opus 5), 2026-09-10 ~14:47 PT

## 14:47 — briefing

Worktree at `f3c549e7` (Argus's 9/10 MID entry), clean, even with `origin/main`. COORDINATION: my
section still says Round 183. Argus (MID) re-ran R182 **39 · 0**, R181 **35 · 0 · 0**, R183
**19 · 0 · 5 · 8**, all matching mine. New mail to me: **Daedalus's Round 184 memo** (`daedalus-to-theseus-xian-…-undo-reads-before-it-writes-and-your-b1-now-fails-on-purpose-2026-09-10.md`).
It reports four of my five closed, B1 failing by design, and asks for a ruling on B1 and a re-run.
Handling it in this fire.

`docs/operations/duty-cycle-klatch-v0.2.md:65` gives Theseus a daily heartbeat as a signal-receiver
and no WORK-specific unit list. I followed the shape of my 9/9 WORK fire (Round 179): take the
hand-back, reproduce, then drive the code the fix introduced at inputs its author didn't use.

## 14:5x — reproduced his number before touching anything

Read the full `d8bb1a78` diff (`entity-backfill.ts`, CLI). Then `probe-round183-…` unmodified on the
fix: **19 checks · 1 failed · 0 open · 8 measurements**. His number. The one failure is
`B1 · …and removes the backfill's Wren, now orphaned — Wren still present`. The B measurement line
is now stale: it still says "the placeholder re-bound, sorted first", but the roster printed is
`["Kestrel"]`.

Also re-ran the server suite myself: **101 files · 1598/1598**, matching his figure.

## 15:0x — B1: I agree with Daedalus. My arm's premise was wrong, not his code

Checked before ruling. `messages.entity_id` is added by `ALTER TABLE messages ADD COLUMN entity_id TEXT`
(`db/index.ts:103`) with **no** `REFERENCES`. Only `channel_entities.entity_id` has the foreign key
(`:75`). So nothing would have stopped undo deleting Wren. What it would have done is leave the chat's
assistant rows stamped to an agent that no longer exists. Those rows are Wren's conversation (PREMISE),
so Wren is not "orphaned". My arm named it that because it looked only at the roster.

Re-vehicled B1 to his suggested shape and made it stronger:
- roster **and** stamps unchanged, compared against a capture taken just before the undo
- Wren present, **and** its id appears in the `kept because` line
- `seated now: Kestrel [` printed
- exit ≠ 0

The stale measurement line was replaced with what the run now prints, plus the pre-184 outcome for
the record.

**R183 re-vehicled, re-run: 19 checks · 0 failed · 0 open · 8 measurements.** B1 prints
`roster+stamps unchanged · Wren present and reported kept · "seated now: Kestrel" printed · exit 2`.

## 15:1x — Round 185: what does the classifier know a run by?

Read the classifier before building anything. `revert` requires `bound(channel, record.toEntityId)`
and nothing about the rows. A1 is protected only because its second apply **re-minted** Wren, giving
it a new uuid. The `reuse` channel's agent (Sable) exists before any run, so both applies bind the
**same id** (`resolveImportEntity` matches by name, `entity-backfill.ts:442`). A reply written
between the runs is stamped to the seated default (`routes/messages.ts:103`). That puts it in the
newer record's P2 (`:450-454`, default-or-NULL rows) and not in the older one.

Prediction, written before running: the older record's undo classifies reuse as `revert` and exits 0,
and leaves the reply stamped Sable on a default-seated chat. The newer record's undo then finds
reuse bound to the default with one P2 row not on the default, so `changed-since`, exit 2. **The
right record gets locked out.**

Instrument `scripts/probe-round185-what-the-undo-classifier-knows-a-run-by.mts`, three arms:
- **N:** two controls first, so the finding is attributable. N1: no reply, older-then-newer ends
  pristine. N2: reply, newer record alone settles.
- **F:** a trigger aborts one real UPDATE on the third record channel. Then the rewritten catch's
  promise is tested: the same `--undo` again, then a third time.
- **M:** a mixed record, testing whether exit 0 holds when one channel is left.

## 15:2x — Round 185, first pass: 15 checks · 0 failed · 3 open · 3 measurements

The prediction held exactly.
- **N4 (open):** older record → reuse `REVERTED`, exit 0, stamps `Sable×4` → `NULL,default,default,Sable`.
- **N5 (open):** newer record → `CHANGED SINCE THE RUN`, exit 2.
- **N6:** the stale undo's snapshot, then the newer record, settles as N2.
- **F0–F3:** all pass. The catch's "run the same --undo again" promise holds, ending row-for-row
  pristine; the third run writes nothing.
- **M1:** passes.
- **M2 (open):** exit 0 with a channel left.

Probe and re-vehicled R183 both `tsc --strict --module nodenext` clean.

**Self-audit of the instrument, before reporting:**
- F3's "snapshots 3 → 3": 3 = apply + F1's kept snapshot + F2's (which wrote). Consistent.
- M2's claim "R183 B exits 2" was measured this fire: B1's detail line reads `exit 2`.
- N5's advice text was captured from the CLI, not retyped.
- The N4 open says "A1 exits 2 only because its second apply re-minted". That is the classifier as
  read, plus the N0 (same id) vs R183 A0 (re-minted id) contrast, not a separate arm. Worded as the
  mechanism.

I did not claim continuing re-imports append to an existing channel: not verified this session. The
writeup says only "one reply in the app is enough".

Writeup `docs/research/round185-what-the-undo-classifier-knows-a-run-by-2026-09-10.md`, memo
`docs/mail/theseus-to-daedalus-xian-cc-…-b1-agreed-and-a-name-matched-agent-gives-both-runs-one-id-2026-09-10.md`.
Second run started for the two-runs-same-shape check.

## 15:3x — second run, mail, commits

**Second run: 15 checks · 0 failed · 3 open · 3 measurements.** Same checks in the same states.

Mail:
- Daedalus's Round 184 memo and my Round 183 memo moved to `docs/mail/read/`. B1's ruling and my
  re-run were that thread's last open items.
- N4/N5/M2 are opened fresh in the new memo.
- Daedalus's 9/9 apply-pass memo (xian's dry run) is left in `docs/mail/`, still open.

No other memo to me was new this fire.

## Carried, unchanged

**Round 170's frequency probe** still needs one path to the real `klatch.db` from xian.

## Wrap verification (WORK fire)

Step 1 — commits on `origin/main` (after `git fetch`):

```
$ git log origin/main --oneline -4
580bf864 Round 185: B1 re-vehicled green, and undo's classifier knows a run by its agent id
fd3c5e28 mail: Round 185 reply to Daedalus + xian -- B1 agreed, a name-matched agent gives both runs one id; R183/R184 thread to read/
f3c549e7 log+coordination: Argus 9/10 MID fire -- Round 182 verified closing the argv gap, Round 183 verified finding undo doesn't check the database it targets
8b65166d log+coordination: Daedalus 9/10 WORK fire -- Round 184, undo reads each channel before it writes it
```

Both of this fire's work commits are on `origin/main`. Mail was pushed first, on its own.

Step 2 — deliverable files, each `ls`'d, all seven present:

```
docs/logs/2026-09-10-1051-theseus-opus-log.md
docs/mail/read/daedalus-to-theseus-xian-cc-iris-janus-calliope-argus-undo-reads-before-it-writes-and-your-b1-now-fails-on-purpose-2026-09-10.md
docs/mail/read/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-n2-is-green-and-undo-prints-one-line-for-three-outcomes-2026-09-10.md
docs/mail/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-b1-agreed-and-a-name-matched-agent-gives-both-runs-one-id-2026-09-10.md
docs/research/round185-what-the-undo-classifier-knows-a-run-by-2026-09-10.md
scripts/probe-round183-undo-record-against-the-database-it-is-aimed-at.mts
scripts/probe-round185-what-the-undo-classifier-knows-a-run-by.mts
```

`git diff --stat d8bb1a78 HEAD -- packages/ scripts/backfill-entity-bindings.mts` is empty.

What I measured this fire:
- server suite: 101 files · 1598/1598
- R183 probe: twice (before and after the re-vehicle)
- R185 probe: twice

**Not** re-run by me: R176/178/179/181/182, and the client suite. Those figures are Daedalus's and
Argus's.

Step 3 — this log and the COORDINATION update are committed last.

## What xian needs from this fire

One line, and nothing in it blocks the dry run: **if you ever undo after applying more than once,
undo the newest run first** (paste its `reverse with:` line). Everything else in this fire is
Daedalus's to rule on.

---

# STOP fire (Opus 5), 2026-09-10 ~19:47 PT

## 19:47 — briefing

Worktree at `e4c2402a` (Iris's 9/10 STOP entry), clean, even with `origin/main`.

New mail addressed to me:
- **Daedalus's Round 186 memo** (`daedalus-to-theseus-xian-…-undo-knows-a-run-by-its-binding-and-your-n1-now-fails-on-purpose-2026-09-10.md`).
  N4/N5/M2 are closed. N1 and N6 fail by design, and he asks me to rule on both.
- **Pard's duty-cycle standard proposal** (`pard-to-calliope-cc-team-…-2026-09-10.md`). It is
  addressed to Calliope. I'm cc'd, nothing in it is asked of me, and the adopt/opt-out call is
  hers. Left in `docs/mail/`.

Argus's STOP entry re-ran R185 unmodified (**15 · 2 · 0**), R183 (**19 · 0 · 0 · 8**), and the
server suite (**1602/1602**).

## 19:5x — reproduced his number before touching anything

Ran `probe-round185-…` unmodified on `f0230372`: **15 checks · 2 failed · 0 open · 3 measurements**.
- N1 fails: `older: exit 2, reuse CHANGED SINCE THE RUN · newer: exit 0, reuse REVERTED · row-for-row pristine`.
- N6 fails: `0 new snapshot(s)`.
- N4, N5, M2 and Z pass.

This matches his table and Argus's.

Read the full diff before ruling. What it does:
- `toAddedAt` is read right after `bind.run`.
- `reboundSince = ch.toAddedAt != null && binding.added_at !== ch.toAddedAt`.
- The M2 exit moved out of the nothing-written branch.
- `checkUndoRecord` is **unchanged**: it type-checks `channelId`/`fromEntityId`/`toEntityId` and
  the two arrays, and neither `added_at` field. Undo writes `fromAddedAt` verbatim through
  `COALESCE(?, datetime('now'))` (`entity-backfill.ts:713,726`).
- The route refuses removing a chat's last seat (`routes/entities.ts:227`).

## 20:0x — rulings, and what I built

**N1: agreed.** With nothing written between the runs, both records name the same rows. My old
control was measuring that coincidence, not the rule. Re-vehicled N1 to his shape and made it stronger:
- the older record exits 2, labelled `CHANGED SINCE THE RUN`
- whole-DB dump unchanged, and no snapshot left
- prints `seated again by a later binding`
- the newer record then settles pristine

N0 now also asserts the two runs' `toAddedAt` differ. Without that, N1 could be passing because of
the one-second limit rather than the rule.

**N6: agreed, but kept as its own check rather than folded into N4.** N4 compares reuse's roster
and stamps. N6 now asserts:
- the whole database is unchanged
- zero snapshots
- `Nothing was written; the snapshot was discarded` is printed

N4/N5/M2's open branches are now FAIL branches: they were closed, so their return is a regression.

**Round 187** (`scripts/probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts`)
drives his rule at the inputs he argued from and didn't drive:
- **S:** the snapshot restore his shape-2 rationale rests on.
- **P:** his flagged app re-add judgement, behind the route's guards.
- **L:** a legacy record, the stated limit, measured.
- **G:** the two `added_at` fields the shape check doesn't read.

Prediction, written before running: **S2 opens.** After a restore, the seated binding is *earlier*
than the newer record's run, but `!==` can't say which way. So the CLI will print "seated again by a
later binding … (a later --apply, or re-added in the app)" when neither happened.

## 20:0x — results

**R185 re-vehicled: 15 · 0 · 0 · 3.** N0 prints `toAddedAt 02:56:17 / 02:56:18`, so N1 passes on the
rule and not on the one-second limit.

**R187: 11 checks · 0 failed · 3 open · 4 measurements.**
- **S0/S1/S3 pass.** After the restore, B's undo is refused and writes nothing. A's undo ends
  pristine, including every binding's `added_at`. His rationale holds.
- **S2 open, as predicted.** The binding is `02:56:26`, the record's run `02:56:28`, and the CLI
  prints "seated again by a later binding … undo with that run's record first".
- **P0/P1 pass.** Roster and stamps are identical to the run's state, only the binding moved; undo
  exits 2, writes nothing, and names the app. **I agree with his judgement**, not opened.
- **L (measured):** a legacy older record exits 0 `REVERTED` and leaves the reply stamped Sable on a
  default-only chat. That is exactly R185's N4 harm.
- **G1 open:** `toAddedAt: 12345` passes the shape check and is refused as re-bound.
- **G2 open:** `fromAddedAt: "not a date"` passes, and undo writes it verbatim, exit 0. The field
  dates from Round 178 (`fd134961`, found with `git log -S`), not Round 186.

**Second run of both, same shape:** R185 15 · 0 · 0 · 3, R187 11 · 0 · 3 · 4. `tsc --strict --module
nodenext` on both probes: no output (clean).

**Self-audit before reporting:**
- **S2 is not a timing artefact.** S0 asserts the restored binding equals A's `toAddedAt` and differs
  from B's, and the `<` comparison is on the printed fixed-width values.
- **G0's `fromAddedAt` equals S's `02:56:26`.** That is the pristine fixture's default binding time
  (the fixture was built seconds before arm S), not a leak between arms: every arm starts from
  `restorePristine()`.
- **P's "no later record" is a folder count** (1 record), not an inference.
- **L is labelled a measurement.** It is his stated limit, not a finding.

Writeup `docs/research/round187-the-binding-rule-at-the-inputs-it-was-argued-from-2026-09-10.md`.
Memo `docs/mail/theseus-to-daedalus-xian-cc-…-n1-and-n6-agreed-and-after-a-restore-the-refusal-blames-a-later-run-2026-09-10.md`.
Thread closed: his Round 186 memo and my Round 185 memo `git mv`'d to `docs/mail/read/`. The 9/9
apply-pass memo (xian's dry run) stays. Pard's proposal stays for Calliope.

## Question-box check (STOP item 4)

Considered. Nothing this fire is curiosity-shaped: every question it raised is a work question, and
those are in the memo. A considered no.

Cycle log: the last `cycle-log-theseus-*` is 2026-06-26. This session log is the practice in use, so
no cycle log was written.

## Carried, unchanged

**Round 170's frequency probe** still needs one path to the real `klatch.db` from xian.

## Wrap verification (STOP fire)

Step 1 — commits on `origin/main` (after `git fetch`):

```
$ git log origin/main --oneline -4
7e69dbb9 Round 187: N1/N6 re-vehicled green, and after a restore the binding rule's refusal blames a later run
4fd6e999 mail: Round 187 reply to Daedalus + xian -- N1/N6 agreed, after a restore the refusal blames a later run; R185/R186 thread to read/
e4c2402a log+coordination: Iris 9/10 STOP fire -- no-op, backfill-CLI thread stays out of UX lane
c11d6592 mail(pard->calliope, cc team): duty-cycle standard v1.4 as a PROPOSAL — Klatch satisfies 4/5, recommending adopt-with-exception on continuity
```

Both of this fire's work commits are on `origin/main`. Mail was pushed first, on its own.

Step 2 — deliverable files, each `ls`'d, all seven present:

```
docs/logs/2026-09-10-1051-theseus-opus-log.md
docs/mail/read/daedalus-to-theseus-xian-cc-iris-janus-calliope-argus-undo-knows-a-run-by-its-binding-and-your-n1-now-fails-on-purpose-2026-09-10.md
docs/mail/read/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-b1-agreed-and-a-name-matched-agent-gives-both-runs-one-id-2026-09-10.md
docs/mail/theseus-to-daedalus-xian-cc-iris-janus-calliope-argus-n1-and-n6-agreed-and-after-a-restore-the-refusal-blames-a-later-run-2026-09-10.md
docs/research/round187-the-binding-rule-at-the-inputs-it-was-argued-from-2026-09-10.md
scripts/probe-round185-what-the-undo-classifier-knows-a-run-by.mts
scripts/probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts
```

`git diff --stat f0230372 HEAD -- packages/ scripts/backfill-entity-bindings.mts` is empty.

What I measured this fire:
- R185: three runs (unmodified, then re-vehicled twice)
- R187: twice
- `tsc --strict` on both probes

**Not** re-run by me: the server and client suites (no product file changed), and R176/178/179/181/182/183.
Those figures are Daedalus's and Argus's.

Step 3 — this log and the COORDINATION update are committed last.

## What xian needs from this fire

One line, and nothing in it blocks the dry run: **if you ever restore a backup and then undo, use the
record from the run the backup is in (the older one), not the newest.** The newest is refused safely,
but its message blames a later run. S2 and G1/G2 are Daedalus's to rule on.
