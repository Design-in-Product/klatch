# Round 194 — step 4 checks itself, and the corruption arm is one write wide

**Author:** Daedalus · **Date:** 2026-09-12 (START fire)
**Input:** Theseus's Round 193 —
`docs/research/round193-one-message-is-enough-and-the-printed-steps-run-as-written-2026-09-11.md`
**Probe:** `scripts/probe-round194-step-4-quotes-a-line-the-operators-own-command-can-produce.mts`
**Code:** `packages/server/src/db/entity-backfill.ts`, `scripts/backfill-entity-bindings.mts`

---

## What this round closes

Round 192 printed four restore steps wherever the CLI names a backup. Theseus ran them as a
procedure — pasted through `/bin/sh`, on a path carrying a space *and* an apostrophe — and they
work. He then named two things, and this round takes both.

**1. Step 4 asked for a comparison the operator could only lose.** It read: *re-run this script with
no flags: the `Candidates:` line should read as it did before the run.* The operator is being asked
to compare a string against one printed a hundred lines earlier, or remembered, at the moment they
are recovering from something that already went wrong. The apply *knows* that string. Step 4 now
quotes it, and the comparison becomes a string match.

**2. The prose understated the condition, in the direction that makes step 1 look optional.** It
said "after further use". Theseus measured the width after Round 192's checkpoint landed and it is
**one write**.

## Why H is one message wide, and why that is Round 192's doing

This is worth stating precisely because it reads like a correction and is actually a consequence.

Round 191 needed 1,500 messages. Pre-192, the apply's own frames stayed in `klatch.db-wal` (the dev
server's connection meant the CLI's exit was not the last close), so the only way to get *other*
frames on top of a main file that already held the run was to cross SQLite's autocheckpoint at
1,000 pages. Hence 1,500.

`checkpointAfterWrite()` put the run in the main file at the apply's exit. That removed the silent
branch — which was the point — and in the same motion removed the 1,500. The **first** frame
anything else writes now sits on top of a main file that already holds the run, which is exactly the
mismatch `cp` turns into a malformed database.

| arm | app use after the apply | `-wal` at the copy | result of `cp` |
|---|---|---|---|
| K1 | none | 0 | the backup — correct |
| **B1** | **one message** | **32,992 B** | **malformed** |
| B20 | twenty | 346,112 B | malformed |
| H1 (R191) | 1,500 | 4,132,392 B | malformed |

Byte counts identical across Theseus's two runs and mine. So the condition is *anything written
since the run*, and step 1 is never a precaution. Corrected in `restoreInstructions()`, in the CLI
header, and in `docs/plans/entity-backfill-scoping-2026-09-02.md`.

## The part that was not a one-liner

Step 4 says **re-run this script with no flags**. So the line it quotes has to be the line a
*no-flag* run produces — **not** the line this run printed. Those are different strings whenever the
run carried `--channels` (filtered form) or `--bases` (different verdicts). Quoting this run's own
line would hand the operator a string their correct restore can never produce: a restore that
worked, reported as failed, at the moment they are least able to judge it. That is the Round 171/173
shape again — a wrong answer that cannot be told from a right one — pointed at the recovery path.

Three states, three different correct answers, all measured on Round 176's fixture:

| run | the run's own `Candidates:` line | what step 4 must quote |
|---|---|---|
| unflagged apply | `8 — 4 would move, 4 skipped.` | the same |
| `--channels=<one that moves>` | `1 of 8 in scope matched your --channels filter — 1 would move, 0 skipped.` | `8 — 4 would move, 4 skipped.` |
| `--bases=identity-claim,project-name` | `8 — 5 would move, 3 skipped.` | `8 — 4 would move, 4 skipped.` |
| `--undo=<record>` | (none — undo prints no sheet) | `4 — 0 would move, 4 skipped.` |

The undo row is its own case: an undo's backup is the **post-apply** state, not the pre-apply one,
so its expectation is a third line again — and it has to be computed *before* `undoEntityBackfill`
writes, because after a part-way undo the database no longer holds what the backup holds. Computed
once at the top of the undo path and reused in the catch.

## What was built

- **`candidatesLine(plan)`**, exported from `entity-backfill.ts`. One source for the line the CLI
  prints and the line step 4 quotes. Two format strings that agree today is precisely the drift
  Round 169 ruled on: they do not diverge loudly, they diverge into an instruction that reports a
  correct restore as a failure.
- **`restoreInstructions(dbPath, backupPath, expectedCandidates?)`.** With the third argument, step
  4 reads *re-run this script with no flags. Its `Candidates:` line should read, word for word:*
  followed by the line, indented. Without it, the older comparison wording — a caller that cannot
  compute the line gets prose, never a guessed number.
- **The quote is indented past the numbered-step prefix, deliberately.** Every reader of this tool's
  output that wants the run's own verdict anchors on a `Candidates:` at column 0 — the unit tests
  here, and `probe-round193`'s `candidatesLine`. A quote at column 0 would be a second one of those,
  and the probes that match it *unanchored* (Round 176, 179, 183) would start reading whichever came
  first. Verified at the endpoint, not asserted: the apply's output contains exactly one column-0
  `Candidates:` line, and Round 193's Q4 — the arm that compares the pre-apply and post-restore
  lines — still passes unchanged.
- **Never fatal.** `unflaggedCandidates()` catches: a plan that throws on a malformed database — the
  arm where these steps matter most — falls back to the older wording rather than taking the run
  down with it.

## Measured

**Theseus's Round 193 probe, unmodified, reproduced before touching anything** (`1cdb2b22`):
**14 · 0 failed · 2 open · 4 measurements**. His table exactly, Argus's sweep number exactly.
B11 at 32,992 bytes, B201 at 346,112.

**Round 193 probe re-run against this change:** 13 pass · 2 open, with **Z failing by design** — Z
asserts no product or CLI file differs from HEAD, and this round changes three. Every substantive
arm (Q0–Q4, B1\*, B20\*, W1/W2) unchanged.

**Round 194 probe:** **14 checks · 0 failed · 0 open.**

**Suites:** server **1615 → 1621** (+6). Client **311 passed, 13 skipped** — unchanged.
`npm run typecheck` clean across all three workspaces; `tsc --noEmit --strict --module nodenext` on
the CLI clean.

## Negative controls — 5, each failing the test it was predicted to

| # | the break | predicted to fail | did |
|---|---|---|---|
| 1 | quote this run's own line on the apply path | probe F1, F2, F3, B1, B2 | ✅ all five |
| 2 | print the quote at column 0 | unit *"indents the quote so it is not a second column-0 Candidates line"* | ✅ that test, alone |
| 3 | compute the undo's expectation *after* `undoEntityBackfill` | probe U1 | see below |
| 4 | restore "after further use" to the prose | unit *"names one message, not a long session"* | ✅ that test, alone |
| 5 | a second copy of the `Candidates:` format, one word apart | probe S1, S3 | see below |

Control 1's failure line is the round in one sentence: *the operator is told to expect
`Candidates: 1 of 8 in scope matched your --channels filter — 1 would move, 0 skipped.` from a
command that prints `Candidates: 8 — 4 would move, 4 skipped.`*

## Not claimed

- **No real corpus.** Every arm is Round 176's fixture. The dry run against xian's actual
  `klatch.db` is still the one open item on that seat and this round does not touch it.
- **The B arm is weaker than the F arm.** `--bases` changes the verdict counts on this fixture but
  not the sheet's shape; F is the arm that discriminates the filtered form.
- **Shape 3 (`--restore=<backup>`) is still not built.** Theseus's second suggestion. His case for it
  got stronger this round — what it replaces is a four-step hand procedure whose step 1 nothing can
  verify — but it is a new flag on a tool that has not yet had its first real dry run, and Gall's law
  says that ordering matters. Left for xian or a later round, named here so it is not lost.
