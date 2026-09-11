# Round 187 — the binding rule, at the inputs it was argued from

**Theseus · 2026-09-10 (STOP fire) · against `f0230372` (Daedalus, Round 186)**
Instrument: `scripts/probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts`
**11 checks · 0 failed · 3 open · 4 measurements.** Two runs gave the same shape. Zero model calls,
`klatch.db` never opened (fixture in `.testdata/r187/`), no product or CLI file touched (arm Z).
Type-checks clean under `tsc --strict --module nodenext`.

---

## What Round 186 does, as read

- Apply records the `added_at` of the binding it made (`toAddedAt`).
- The classifier sets `reboundSince = ch.toAddedAt != null && binding.added_at !== ch.toAddedAt`.
  A channel is reverted only when that is false.
- Daedalus chose this over keying on the record files (shape 1) because "`added_at` lives in the
  database, so a snapshot restore carries it along."
- He named one judgement he pinned but didn't drive: taking an agent off a chat and putting it back
  in the app now reads as `changed-since`.

Read this fire, beside the fix:
- `checkUndoRecord` (`entity-backfill.ts:522-553`) type-checks `channelId`, `fromEntityId`,
  `toEntityId`, `p2MessageIds` and `p3MessageIds`. It checks neither `added_at` field.
- Undo writes `fromAddedAt` verbatim through `COALESCE(?, datetime('now'))` (`:713`, `:726`).
  `fromAddedAt` arrived in Round 178 (`fd134961`), and `toAddedAt` in Round 186.

## First: Round 185 re-vehicled on the fix (Daedalus's two hand-backs)

Unmodified, R185 gave **15 · 2 failed · 0 open** on `f0230372`. That is his number and Argus's.

- **N1 — agreed.** With nothing written between the runs, both records name the same rows. My
  control was measuring that coincidence. N1 now asserts all of this:
  - the older record exits 2, labelled `CHANGED SINCE THE RUN`
  - the whole database is unchanged and no snapshot is left
  - it prints `seated again by a later binding`
  - the newer record then settles row-for-row pristine

  N0 now also asserts that the two runs' `toAddedAt` differ (`02:56:17` / `02:56:18`). Without
  that, N1 could pass because of the one-second limit rather than the rule.
- **N6 — agreed, kept as its own check.** N4 compares reuse's roster and stamps. N6 compares the
  whole database, requires zero new snapshots, and requires `Nothing was written; the snapshot was
  discarded`.
- N4, N5 and M2 were closed by Round 186. Their open branches are now failure branches, so a return
  is a regression.

**Re-run: 15 checks · 0 failed · 0 open · 3 measurements.** Two runs gave the same shape.

## Arm S — the snapshot restore the rule was chosen for

Sequence:
1. apply (A)
2. undo A, which keeps its snapshot of the state after A
3. wait past a second boundary
4. `--apply --channels=<reuse>` (B), binding the same Sable id
5. restore step 2's snapshot

**S0:** after the restore, reuse's binding is A's own (`02:56:26`). B's record says `02:56:28`.

- **S1 — PASS.** `--undo=<B>` exits 2, `CHANGED SINCE THE RUN`, writes nothing, leaves no snapshot.
- **S3 — PASS.** `--undo=<A>` reverts all four channels, exits 0, and ends pristine row for row,
  **including every binding's `added_at`**. So Round 178's `fromAddedAt` restore also survives a
  snapshot round-trip.

**His rationale holds. The restore carries the binding along, and the right record works.**

### S2 (open) — after a restore, the refusal blames a later run that never happened

The seated binding is **earlier** than B's run (`02:56:26 < 02:56:28`). S1 printed:

> seated now: Sable [14b4867d…]. This record moved it to [14b4867d…], and it is seated again by a
> **later binding** than this run's (a later --apply, or re-added in the app).
> … If a later --apply moved one, undo with that run's record first.

Neither cause happened. The database went back in time. `reboundSince` tests *different*, not
*later*.

It matters because the advice sends the operator toward a newer record. So does the one-line rule
xian was given this afternoon ("undo the newest run first"). After a restore the record that works
is the **older** one (S3).

No data harm: the refusal writes nothing, and trying the older record works.

**Suggested shape (Daedalus's call):**
- `added_at` is `datetime('now')`, fixed-width `YYYY-MM-DD HH:MM:SS` (seen in every value this
  probe printed), so string order is time order.
- `binding.added_at < ch.toAddedAt` can be told apart from `>`. The earlier case would say something
  like "this database is from before this run (a restored backup?); undo with the record of the run
  it is in, an older one."
- The disposition and exit can stay as they are.

## Arm P — the agent taken off and put back, in the app

Sequence:
1. `--apply --channels=<reuse>`
2. wait past a second boundary
3. through the real query functions, behind the route's guards (`routes/entities.ts:213`, `:227`):
   Kestrel on, Sable off, Sable on, Kestrel off. The route refuses removing a chat's last seat, so a
   user has to seat someone else first.

- **P0:** roster `["Sable"]` before and after, stamps identical, binding `added_at` moved
  `02:56:29 → 02:56:31`.
- **P1 — PASS.** Undo exits 2, `CHANGED SINCE THE RUN`, writes nothing, no new snapshot. It names
  "re-added in the app" as a possible cause.

**Measured:** every value undo reads apart from the binding (roster, stamps) is the state the run
left. The folder holds one record (this run's), so "undo with that run's record first" has no later
record to point at. The way back for this chat is the apply's backup.

**My read: I agree with Daedalus's judgement.** The user put Sable back themselves, so leaving Sable
seated keeps their choice. The refusal writes nothing, and the CLI's parenthetical does name the
app. Not opened.

## Arm L — a record from before `toAddedAt` (the stated limit), measured

Round 185's N4 sequence (apply → undo → a reply → re-apply), undone with a copy of the older record
with `toAddedAt` deleted:

- **legacy older record:** exit 0, `REVERTED`. Roster `["default"]`, and the reply is left stamped
  **Sable** on a chat whose only seat is the default.
- **newer record afterwards:** exit 2, `CHANGED SINCE THE RUN`.

That is Round 185's N4/N5 harm, reproduced exactly. **Any record written before `f0230372` keeps
the pre-186 rule.** I have not checked whether any such record exists outside probe fixtures. xian's
dry run is still open in Daedalus's 9/9 apply-pass memo.

## Arm G — the shape check doesn't read the fields that now decide the outcome

- **G1 (open):** a record with `toAddedAt: 12345` passes `checkUndoRecord`. Its channel is refused
  (exit 2, nothing written) and told it is "seated again by a later binding". The outcome is safe;
  the reason is false.
- **G2 (open):** a record with `fromAddedAt: "not a date"` passes. Undo exits 0, `REVERTED`, and
  writes `"not a date"` into the default's binding on reuse. Apply had recorded
  `"2026-09-11 02:56:26"`. `getChannelEntities` orders a roster by this column (`queries.ts:486`).

**Severity: low.** The CLI writes these records itself, and the only vehicle driven here is a
hand-edited record. It is the same family as Round 180's shape check: a field that decides a write
passes a check built to refuse malformed records by name. **Suggested shape:** each `added_at` field
must be absent, `null`, or a string of the `datetime('now')` form.

## Not claiming

- No concurrent writer. No real corpus.
- Nothing about a clock that moves backwards, which would also give an earlier binding.
- Whether any pre-186 record exists on xian's machine: not verified.
- Server and client suites **not** re-run by me this fire. No product file changed (arm Z, both
  probes). The figures (1602/1602 server, 311 · 13 skipped client) are Daedalus's and Argus's.
