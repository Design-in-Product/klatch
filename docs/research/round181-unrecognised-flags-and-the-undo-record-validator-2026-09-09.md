# Round 181 — the flag the parser never recognises, and the validator that replaced the crash

**Theseus · 2026-09-09 (STOP fire) · manual testing & exploration**
Instruments: `scripts/probe-round181-unrecognised-flags-and-undo-record-validation.mts` (new),
`scripts/probe-round179-backfill-flag-spellings-and-undo-errors.mts` (re-vehicled)
Code under test: `scripts/backfill-entity-bindings.mts`, `packages/server/src/db/entity-backfill.ts`
(Round 180, Daedalus)

---

## For xian, before you run anything

Daedalus's fix is real and I drove it: `--channels <id>` with a space now refuses, exit 1, nothing
written. You no longer have to remember the equals sign.

You *do* still have to remember the letter **s**. `--channel=<id>` — singular, the spelling that
comes naturally when you are approving one channel — is not a flag this script knows, so it is
**silently ignored**, the approval list switches off entirely, and the run plans (and with
`--apply`, performs) the **whole corpus**, exit 0. Measured: 4 of 8 in-scope channels moved where 1
was approved. Same for `--chanels=`, `--Channels=`, `-channels=`.

**The receipt that costs you nothing.** When your approval filter is working, the dry run prints:

```
Candidates: 1 of 8 in scope matched your --channels filter — 1 would move, 0 skipped.
```

When it is not, it prints:

```
Candidates: 8 — 4 would move, 4 skipped.
```

**Look for the words `matched your --channels filter` before you add `--apply`.** If that phrase is
absent, your `--channels` flag did not take, whatever you typed. This is a check you can do with
your eyes and it catches every case in this report.

---

## Part 1 — the five hand-backs, re-vehicled

Daedalus's Round 180 memo returned five arms of Round 179's probe to me: the fixes landed, and my
predicates could recognise *honoured* but not *refused*, so a correct refusal read as the defect
still standing. I reproduced his number before touching anything — **33 checks · 1 failed · 4
open** against the fixed code, the same shape he reported.

He was right about all five, and about the category: this is Round 176's G4 and arm E again — the
invariant holds, the input stopped being an example of it. Re-vehicled in place, none weakened:

| Arm | Was | Now |
|---|---|---|
| H1 | `FILTERED.test(out)` — "honoured or refused" | exit 1 + `--channels was given with no values` on stderr; no `Candidates:` line at all; **the id left in argv is echoed in full** (the inverse of Round 179's "appears 0 times", because naming it is now the remedy) |
| H3 | same predicate on `--channels=` | same refusal |
| H4 | asserted the `0 of 11` denominator, which my own note called the *mild* acceptable outcome | asserts the strict one: a comma-only list refuses |
| H1/H3/H4 | — | **new**: the space form and the empty form give *different* remedies ("Use an equals sign" vs "not the same request as no list"). An arm checking only the shared first line would pass if the two crossed over |
| I1 | `movedCount <= 1` | too weak now — a refusal and a correct one-channel move both satisfy it. Asserts the refusal: exit 1, 0 moved, approved channel still on the default, 0 backups, 0 records |
| J1 (3rd) | parsed `(a, b)` parens off the header line | the matches are indented lines below it; asserts both **full** ids, one per line, with `kite-one`/`kite-two` beside them — **and pastes an echoed id straight back**, which is the invariant "distinguishable" was standing in for |
| L2 | `/not a backfill record/i` | `/not a backfill( undo)? record: /`, no `TypeError`, **plus** the specific problem line (`version is undefined, expected 1`) |
| L1/L2 | — | **new**: neither refusal leaves a snapshot. Round 179 measured both refusing *after* `db.backup()`; the read and parse now happen before it |

**Round 179's probe, re-run: 40 checks · 0 failed · 0 open.** It is now a green regression suite
over Round 180's fixes rather than a report of them.

## Part 2 — Round 181: what Round 180's rule cannot see

Round 180 closed the family under one rule: *a value-taking flag with an empty value refuses.* It
fires when `flagValue` returns a defined-but-empty string. It cannot fire when `flagValue` returns
`undefined` — and `undefined` is what it returns for a flag it does not recognise, because
unrecognised flags are silently dropped:

```ts
const flags = argv.filter((a) => a.startsWith('--'));          // :77
function flagValue(name: string): string | undefined {
  const hit = flags.find((f) => f === `--${name}` || f.startsWith(`--${name}=`));
  if (!hit) return undefined;                                   // :83
  ...
}
```

Nothing anywhere validates that every `--flag` in argv is one the script knows. So the organising
question of this round: **does misspelling an approval flag still come back as an answer?**

**Instrument.** Same discipline as Rounds 176 and 179 — the real script as a real subprocess (real
argv, real `KLATCH_DB` resolution, real `db.backup()`) against a real file-backed database built by
the real `importSession`, verified through the probe's own read-only handle in raw SQL rather than
through the code under test. **32 checks · 0 failed · 7 open · 2 measurements. Two runs, same
shape. Zero model calls, zero API spend.** `klatch.db` never opened; fixture in `.testdata/r181/`
(gitignored).

### Open items, ranked

**1 · `--channel=<id>` (singular) is ignored, and the run applies to the whole corpus. Exit 0.**
Four spellings measured, all identical: `--channel=`, `--chanels=`, `--Channels=`, `-channels=`.
Each produces `Candidates: 8 — 4 would move` against a control of `1 of 8`. With `--apply`:

```
$ ... --apply --channel=364d8be5-…
Applied: 4 channel(s) re-pointed, 2 agent(s) minted.        exit 0
```

**4 of 8 in-scope channels moved where 1 was approved.** Neither the token as typed nor the id
inside it appears anywhere in stdout or stderr. This is Round 179's finding 1 exactly — an
approval list silently switching off, the answer bigger than the question — reached by a slip that
Round 180's rule is structurally unable to see, because the flag name itself is what is wrong.

Aggravating: the dry-run footer then prints ``--channels=<ids> to move only the ones you approve
off this sheet``. To an operator who believes they just did that, it reads as generic advice rather
than as a correction. (I scored that line as an echo on my first pass of this arm and had to
correct it — it matches the substring `--channel` while telling the operator nothing about what
they typed.)

**2 · `--apply --und=<record>` re-applies the backfill it was meant to reverse. Exit 0.**
The worst member of the family, and the same *consequence* Daedalus found for the space form and
closed in Round 180 — reachable again by misspelling rather than by spacing. `undoArg` is
`undefined`, `undoRequested` is false, the undo branch is skipped, and `--apply` on the same line
runs the backfill forward:

```
$ ... --apply --und=<record.json>
Applied: 4 channel(s) re-pointed, 2 agent(s) minted.        exit 0
```

Measured against the control in the same arm: the correctly spelled `--undo=<record>` reverted all
4 and returned 8 of 8 to the default. Every other misspelling in this report *widens* a run; this
one silently **inverts the operator's intent** and reports success.

**3 · `--base=<v>` (singular) is ignored and the run silently uses the default bases.**
`--bases=none` applies no basis and moves nothing. `--base=none` prints `Bases applied:
identity-claim` and plans 4 moves, exit 0. The flag whose job is to *narrow* what moves fails open,
toward the wider run. Milder than 1 and 2 — the `Bases applied:` line does state what it used, so
the output contains the contradiction — but it is the same root.

### What holds (25 checks)

- **Round 180's own refusals, as regressions.** `--undo <record> --apply` (a space) refuses,
  exit 1, names the path left in argv; `--undo=` refuses under the same rule; neither writes to the
  DB or leaves a snapshot.
- **`checkUndoRecord` holds at everything I aimed at it.** A JSON array, a `null`, a bare string, a
  `version: 2` record, a `version: 1` record with no `channels`, and a channel entry missing
  `toEntityId` — all six refuse with `not a backfill undo record: <path>`, exit 1, no `TypeError`,
  and each names its own specific problem (`not a JSON object`, `version is 2, expected 1`,
  `` no `channels` array ``, `channels[0].toEntityId is not a string`). The problem line is what
  makes the refusal actionable, so it is asserted per-input, not once.
- **A truncated record is named as invalid JSON, not as a wrong shape** — which is the correct
  distinction, and half-written files are exactly what you get from the interrupted copy that made
  you reach for undo.
- **A directory is refused in the tool's voice** (`cannot read undo record:`, EISDIR, no stack) —
  the everyday mis-aim of tab-completing the folder the records live in.
- **Nine refused undo runs: sha256 unchanged, channel counts unchanged, 0 new backup files.** The
  litter Round 179 found is gone across every path, not only the two it named.
- **The validator did not become so strict that the real thing fails** — the record the apply in
  the same arm had just written passes and reverses, 4 reverted, 2 agents removed.

### Not claiming

No run against any real corpus. The 72 is still unverified — xian's dry run remains the only thing
that answers it, unchanged by this round. I did not modify `packages/` or the CLI; the three open
items above are reported, not fixed.

### Suggested shape of a fix (Daedalus's call, not mine)

The rule that would close all three at once is the one this script does not have: **reject any
`--flag` in argv that is not in the known set.** It is a whitelist of five (`--apply`, `--bases`,
`--channels`, `--undo`, and whatever else the usage string lists) checked once after parsing, and
it fails closed in the direction every other refusal in this file already fails. A "did you mean
`--channels`?" on the nearest match would be a bonus, not the fix. This is the same chokepoint
argument as Round 180's own: one rule at the parse boundary, rather than one guard per flag.

---

## Verification

- Round 179 probe re-run after re-vehicling: **40 checks · 0 failed · 0 open**.
- Round 181 probe: **32 checks · 0 failed · 7 open · 2 measurements**, run twice, same shape.
- Every CLI output quoted in this document is pasted from a run driven in this session against
  `.testdata/r181/`, not reconstructed.
- `klatch.db` was never opened. Zero model calls; zero API spend.
