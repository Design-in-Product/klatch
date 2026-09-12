# Daedalus session log — 2026-09-12

Agent: Daedalus (architecture & implementation) · Model: Opus 5
Worktree: `/Users/xian/Development/klatch-worktrees/daedalus` · Branch: `claude/daedalus-cycle`

---

## 09:17 PT — START fire

**Briefing.** Worktree synced by the wrapper; `git log` at `1cdb2b22` (Argus's 9/12 START), status
clean. Read `docs/COORDINATION.md` (my section) and `ls docs/mail/`.

**Mail.** One new memo addressed to me:
`theseus-to-daedalus-cc-xian-argus-calliope-192-reproduces-and-the-steps-run-as-written-but-h-is-one-message-wide-not-1500-2026-09-11.md`.
Theseus reproduces my Round 192 from his seat, confirms shape 1 runs as a procedure (steps pasted
through `/bin/sh` on a path with a space **and** an apostrophe), and raises three things:

1. **A wording correction I owe him.** My commit said "H1 is unchanged." True, and it understates
   what H now covers. Round 191 needed 1,500 messages because pre-192 that was the only way to get
   frames into the WAL on top of a main file that already held the run. My `checkpointAfterWrite()`
   removed that requirement: **1 message → 32,992-byte `-wal` → malformed**, same as 20, same as
   1,500. So "after further use" in my prose reads as a bigger condition than it is, and makes
   step 1 look like a long-session precaution.
2. **Step 4 could check itself** — it asks the operator to compare a `Candidates:` line by eye
   against one the apply printed. The apply knows that line.
3. Shape 3 (`--restore=<backup>`) reads better after this round. Not built, not asked for, still
   mine or xian's to call.

**Reproduced before touching anything.** Theseus's R193 probe, unmodified, on `1cdb2b22`:
**14 · 0 failed · 2 open · 4 measurements** — his table exactly, and Argus's sweep number exactly.
B11 open at 32,992 bytes, B201 at 346,112.

**Round 194 — built (1) and (2).**

- `restoreInstructions(dbPath, backupPath, expectedCandidates?)`. Step 4 now quotes the line a
  correct restore will produce, when the caller knows it; the prose names **one message**, not
  "further use".
- `candidatesLine(plan)` exported from `entity-backfill.ts` — one source for the line the CLI
  prints and the line step 4 quotes. Two format strings that agree today is the Round 169 drift
  shape: they don't diverge loudly, they diverge into an instruction that reports a correct
  restore as a failure.
- **The trap, and the reason this wasn't a one-liner.** Step 4 says *re-run with no flags*, so the
  quoted line has to be the line a **no-flag** run produces — not the line this run printed. Those
  differ whenever the run carried `--channels` or `--bases`. The CLI reuses this run's plan only
  when it *is* the unflagged plan (`plan.filter === undefined && bases === DEFAULT_APPLY_BASES`,
  reference equality against the exported default), and otherwise plans again, read-only, before
  any write.
- Undo path: computed once **before** `undoEntityBackfill` and reused in the catch, because after a
  part-way undo the database no longer holds what the backup holds. Wrapped so a plan that throws —
  the malformed-database arm, where these steps matter most — falls back to the older wording
  rather than taking the run down with it.
- Stale "long session" wording corrected in the CLI header and in
  `docs/plans/entity-backfill-scoping-2026-09-02.md` (amendment note, Round 192's correction left
  in place above it).

**Measured, not assumed.**

- Theseus's R193 probe re-run against the change: **13 pass · 2 open**, Z failing by design (this
  round changes product code; Z asserts it doesn't). **Q4 still passes** — the echoed line is
  indented past the numbered-step prefix, so the anchored `^Candidates:` matchers every reader of
  this output uses still find exactly one thing. That was the risk in the change and it is the one
  I checked at the endpoint rather than in a unit test.
- New probe `scripts/probe-round194-step-4-quotes-a-line-the-operators-own-command-can-produce.mts`
  drives the CLI end to end. Results below.
- Server **1615 → 1621** (+6). Client **311 passed, 13 skipped**, unchanged. `npm run typecheck`
  clean across all three workspaces; `tsc --strict --module nodenext` on the CLI clean.

**One probe bug found and fixed in my own work, recorded because it read like a product failure.**
Arm F's first version picked the first id off the review sheet, which was a **SKIP** row. The run
then had nothing to apply, so it discarded its snapshot and printed no backup path — correct
behaviour — and the probe crashed in `copyFileSync('')`. Fixed by selecting a row that moves
(`MINTED|MATCHED-BY-NAME`) and by making `restoreByHand` report an absent backup instead of
throwing.

### Round 194 probe — measured

```
Arm S — an unflagged apply
  [PASS] S0 · setup: dry run then apply, both exit 0
  [PASS] S1 · step 4 quotes the line the pre-apply dry run printed — "Candidates: 8 — 4 would move, 4 skipped."
  [PASS] S2 · exactly one column-0 Candidates line in the apply's output — the quote is indented
  [PASS] S3 · step 4 executed: after the printed steps, a no-flag dry run prints exactly the quoted line

Arm F — an apply carrying --channels (the arm the design exists for)
  [PASS] F0 · a one-id filtered apply on a row that moves exits 0 and names a backup — --channels=38ed5524
  [PASS] F1 · this run's own line is the filtered form and is NOT what step 4 quotes
  [PASS] F2 · step 4 quotes the unfiltered line the pre-apply dry run printed
  [PASS] F3 · the no-flag dry run after the restore matches the quote, and NOT this run's own line
  [MEAS] F: quoting this run's own line would have told the operator to expect
          "Candidates: 1 of 8 in scope matched your --channels filter — 1 would move, 0 skipped."
          from a command that prints "Candidates: 8 — 4 would move, 4 skipped."

Arm B — an apply carrying --bases
  [PASS] B0 · a widened-bases apply exits 0
  [PASS] B1 · step 4 quotes the default-bases line ("8 — 4 would move"), not the widened one
  [PASS] B2 · the widened run's own line does differ ("8 — 5 would move, 3 skipped"), so B1 discriminates
```

```
Arm U — --undo: the quote is the POST-apply line, computed before the undo writes
  [PASS] U0 · apply then undo, both exit 0
  [PASS] U1 · the undo quotes "Candidates: 4 — 0 would move, 4 skipped." — the post-apply line,
              what ITS backup holds — not the pre-apply "Candidates: 8 — 4 would move, 4 skipped."
  [PASS] U2 · step 4 executed on the undo's backup: the no-flag dry run matches the quote

14 checks · 0 failed · 0 open
```

Three states, three different correct answers (unflagged / filtered / post-apply), all four printed
lines distinct. That is why this wasn't a one-line change.

### Negative controls — 5, each failing the test or arm predicted, and nothing else

| # | the break | predicted | result |
|---|---|---|---|
| 1 | apply path quotes **this run's** line | probe F1, F2, F3, B1, B2 | ✅ all five failed |
| 2 | print the quote at **column 0** | unit *"indents the quote…"* | ✅ that test alone (1 of 60) |
| 3 | compute the undo expectation **after** `undoEntityBackfill` | probe U1 | ✅ U1 **and** U2 failed |
| 4 | restore "after further use" to the prose | unit *"names one message…"* | ✅ that test alone (1 of 60) |
| 5 | a second copy of the format, **one full stop** apart | probe S1, S3 | ✅ S1, S3 **and** U1, U2 |

Control 1's failure line is the round in one sentence: the operator is told to expect
`Candidates: 1 of 8 in scope matched your --channels filter — 1 would move, 0 skipped.` from a
command that prints `Candidates: 8 — 4 would move, 4 skipped.`

Control 3's is the undo version of the same: computed after the write, it quotes `8 — 4 would move`
(the reverted state) to an operator whose correct restore prints `4 — 0 would move`.

Control 5 is the Round 169 argument made visible — one missing full stop, four arms red.

**All five reverted; `grep -n "NEGATIVE CONTROL"` across the three touched files returns nothing,
and the R194 probe re-run clean at 14 · 0 · 0 afterwards.**

**Not claimed.** No real corpus; every arm is Round 176's fixture. The B arm is weaker than the F
arm (`--bases` changes the counts on this fixture but not the sheet's shape). Shape 3
(`--restore=<backup>`) is **not built** — Theseus's case for it got stronger this round, but it is a
new flag on a tool that has not had its first real dry run, and that ordering is xian's call. The
dry run xian owes the backfill is still the one item on that seat and this round does not touch it.

### Deliverables (verified present — Step 2 of the wrap protocol)

```
docs/research/round194-step-4-checks-itself-and-the-corruption-arm-is-one-write-wide-2026-09-12.md
docs/mail/daedalus-to-theseus-cc-xian-argus-calliope-step-4-checks-itself-and-you-were-right-that-h-is-the-headline-2026-09-12.md
scripts/probe-round194-step-4-quotes-a-line-the-operators-own-command-can-produce.mts
packages/server/src/db/entity-backfill.ts
packages/server/src/__tests__/round175-entity-backfill.test.ts
scripts/backfill-entity-bindings.mts
docs/plans/entity-backfill-scoping-2026-09-02.md
```

### Mail thread hygiene

Theseus's Round 193 memo stays in `docs/mail/` until he verifies Round 194 — same rule I've applied
each round. My reply above is filed beside it. The Round 191/192 pair he moved to `read/` on his
last fire is correctly closed.
