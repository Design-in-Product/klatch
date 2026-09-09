# Round 179 — the backfill CLI's new edges: flag spellings, the prefix matcher, undo's error paths

**Theseus · 2026-09-09 (WORK fire) · instrument `scripts/probe-round179-backfill-flag-spellings-and-undo-errors.mts`**

**34 checks · 0 failed · 7 open · 3 measurements. Two runs, same shape. Zero model calls, zero
API spend. `klatch.db` never opened** — fixture in `.testdata/r179/` (gitignored), built by Round
176's own builder plus four hand-made channels with ids chosen to collide.

Round 176's probe, rerun this fire with its two stale lines repaired: **51 checks · 0 failed ·
1 open** (the one open is arm A, the WAL sidecars, known and documented in the CLI header).

---

## The short version for xian

**The dry run is still safe and the plain `--apply` is still what it was.** Nothing found this
round can fire on either of the two commands you were actually handed.

**One thing to know before you type an approve-by-id run:** the flag needs an `=`.

```bash
# moves ONLY the channel you approved
... --apply --channels=295571c2

# moves EVERY movable channel in your corpus, and says "Applied: 7 channel(s)"
... --apply --channels 295571c2
```

A space instead of an equals sign silently turns the approval list off. Measured on the fixture:
**7 of 11 channels moved instead of the 1 approved, exit 0**, and nothing in the output
distinguishes it from the run you wanted. The undo record covers it, so this is recoverable — but
only if you notice.

Yesterday's advice ("don't use `--channels` yet") is **withdrawn**: it works, as Daedalus fixed it.
Use it with an `=`.

---

## Why this round

Round 178 closed all four of Round 176's operator-error defects. Round 176's probe is the
regression instrument for that and it is green. But Round 176 could only pin behaviour that
existed when it was written, and the fixes introduced four pieces of genuinely new code — a
prefix matcher, a `--bases` validator, a refuse-the-whole-run rule, and a snapshot on the `--undo`
path. None had been driven by anything except its own author's tests and a probe that predates it.

The organising question is the one Round 178 answered for three flags and not for the fourth:
**can an operator mistake still come back as an answer?**

---

## Findings, most serious first

### 1. `--channels` with a space instead of `=` silently plans and applies the *whole corpus* (H1, I1)

`flagValue` (`backfill-entity-bindings.mts:64-69`) returns `''` for a flag with no `=`. At `:146`
that `''` is falsy, so `channelIds` becomes `undefined` — which does not mean "an empty approval
list", it means **no filter at all**. The id the operator typed lands in `positional[1]` and is
never read, never echoed.

Measured, dry run:

```
$ ... --channels 5c4140a5-524a-44fa-b5c3-60331caff3e7
Candidates: 11 — 7 would move, 4 skipped.        # exit 0
```

Note the wording: the *unfiltered* line. A filtered run prints `Candidates: 2 of 11 in scope
matched your --channels filter`, so the output is not identical — but the difference is one
clause in a header the operator has already read once, and the id they typed appears **0 times**
in stdout.

Measured, with `--apply` (arm I, on a restored fixture):

```
Applied: 7 channel(s) re-pointed, 4 agent(s) minted.     # exit 0
```

Seven channels moved. One was approved. The approved one did move, so every signal the operator
has says the run succeeded.

**The sibling flag is protected against the identical slip.** `--bases none` (space) hits the same
`''` and is refused: `--bases was given with no values`, exit 1. Round 178 added that check to one
of the two comma-list flags. This is the other one.

This is the mirror of the shape Round 176 named and Round 178 fixed — an operator error read as an
answer — except the answer here is *bigger* than what was asked for rather than smaller, which is
the worse direction for a tool whose flag exists to narrow what it touches.

**Suggested close, one place, matching the rule `--bases` already follows:**

```ts
const channelsArg = flagValue('channels');
if (channelsArg !== undefined && !channelsArg.split(',').filter(Boolean).length) {
  // …discard snapshot, print "--channels was given with no values", exit 1
}
const channelIds =
  channelsArg !== undefined ? channelsArg.split(',').filter(Boolean) : undefined;
```

That closes findings 1, 2 and 3 together.

### 2. `--channels=` with an empty value does the same thing (H3)

Same falsy-`''` path, reached by typing the flag and deleting its value, or by a shell that
expands a variable to nothing (`--channels=$APPROVED` with `APPROVED` unset). `Candidates: 11 — 7
would move`, exit 0. `--bases=` on the same command line is refused.

### 3. A comma-only list reports zero candidates and exits 0 (H4)

`--channels=,,` survives `.filter(Boolean)` as an empty array, which *is* truthy, so a filter is
applied and matches nothing: `Candidates: 0 of 11 in scope matched your --channels filter`, exit
0, nothing echoed as unresolved. Milder than the two above — the `of 11 in scope` wording does
tell the reader a filter ran — but the empty list itself is never named.

### 4. The ambiguity refusal prints both matches identically, so it cannot be acted on (J1)

The refusal is correct and the message names the problem. But it truncates each match to 12
characters (`:172`, `m.slice(0, 12)`), and ids ambiguous on 8 characters usually agree on 12:

```
  --channels c0111111: ambiguous prefix, matches 2 channels (c0111111-111, c0111111-111)
```

The same string, twice, for two different channels. The operator is told to choose and shown
nothing to choose between; the remedy the message implies — paste a longer id — is the one thing
the output does not enable. Printing enough characters to make the matches unique, or the channel
names beside them, closes it.

### 5. `--undo`'s error paths crash with a raw stack trace, after taking a snapshot (L1, L2)

Two operator slips, both reaching Node rather than the tool's voice:

| input | result |
|---|---|
| `--undo=<missing file>` | `Error: ENOENT: no such file or directory` + stack, exit 1 |
| `--undo=<well-formed JSON that is not a record>` | `TypeError: record.channels is not iterable` from `entity-backfill.ts:505`, exit 1 |

The same script says `no such database: <path>` for a bad positional argument (`:80`). The record
argument gets no such courtesy — `fs.readFileSync` then `JSON.parse` then straight into
`undoEntityBackfill` (`:114-115`), unvalidated.

Both run **after** the snapshot Round 178 added at `:96`, so each failed attempt leaves a
full-size copy of the database beside it with nothing to clean it up (measured: 1 new
`klatch.db.backup-backfill-*` per failed run). The snapshot itself is the right call — Round 176
argued for it — but the two paths that dispose of a snapshot on refusal (`:133-134`, `:233-234`)
have no counterpart on this one.

**No data harm:** verified that two failed undo runs left the database bit-for-bit unchanged.

---

## What holds — 27 passing checks

The four Round 178 fixes were driven at inputs their author did not use, and they stand up.

**The prefix matcher (arm J).** Tested on ids built to collide rather than on uuids that might:

- an ambiguous 8-char prefix matches **neither** channel, is reported by name, exit 2 (J1)
- a full id that prefixes nothing else resolves outright (J2)
- a prefix shared with an **out-of-scope** channel resolves to the in-scope one rather than
  refusing as ambiguous — scope is applied before ambiguity, which is the correct order (J3)
- a space after a comma (`--channels=<id>, <id>`) — the likeliest paste error there is — is
  echoed by name in the "did not resolve" block, exit 2 (J4)
- an upper-cased id is reported unmatched, not silently zero (J5)
- an over-long id is reported unmatched (J6)

**Refuse-the-whole-run (J7).** `--apply --channels=<good>,not-a-real-id` exits 2 with `Refusing to
apply`, the database sha256 is unchanged, **0** backups and **0** undo records are left beside it,
and the good half of the list was *not* applied. An all-or-nothing approval list behaves that way.

**`--bases` validation (arm K).** A mixed list names only the bad value; the refusal prints the
valid list with the hyphen note; an upper-cased basis is refused rather than silently excluding
every row; three refusals in a row leave **0** snapshot files beside the database.

**Undo (arm L).**

- a record with `fromAddedAt` stripped — which is what a record written by the previous build is —
  still replays: exit 0, `Reverted 7 channel(s)`, all 11 in-scope channels back on the default,
  and the replayed row carries a real timestamp rather than violating `NOT NULL`. Daedalus's
  `COALESCE` claim, driven rather than read (L3)
- undo's new snapshot **holds the pre-undo state**: opened read-only, it shows the 4-channel
  applied state undo was about to reverse, not the 11-channel state that exists after (L4). This
  is the content check, not the file-exists check — a backup of the wrong moment is not a backup

---

## Two corrections to my own work

**Round 176's probe had two lines that could not close themselves**, both flagged by Daedalus and
both actioned this fire:

1. **Arm E's `open_` for "undo takes no snapshot" was unconditional** — a bare statement with no
   paired check, so it printed whether or not the defect existed, and it did print after the fix.
   Now paired, and paired on evidence rather than on the line the CLI emits: the announced backup
   path must exist *and* open as a readable database with rows in it.
2. **G4's vehicle became an operator error.** G4 asserts "`--apply` with nothing to move discards
   the snapshot and exits 0"; its input was `--channels=not-a-real-id`, which after Round 178 is
   exactly the case that must refuse. The invariant was fine; the input was no longer an example
   of it. Vehicle swapped to `--apply --bases=none` — a run where every candidate legitimately
   skips and no operator has made a mistake. Daedalus's read was right and his separation of the
   two cases is the right one: *"you made a mistake"* and *"there is nothing to do"* must not
   print each other's answer.

**And one correction to this round, mid-round.** J5 (the upper-cased id) passed on its first run
and failed on its second. The cause was my instrument, not the CLI: the arm upper-cased the
`wren` channel's 8-character prefix, and that build's prefix happened to be eight digits, so
upper-casing changed nothing and the arm passed for a reason unrelated to case. The next build
drew a prefix with a letter in it and the arm went red. Fixed by using one of the hand-made ids
(`d0222222`), which contains a letter by construction. **An arm whose input depends on the
build's luck is not an arm** — this is the same family as Round 176's "I asserted which of two
same-named channels would mint", and I made it again three days later.

---

## Not claiming

- **No run against any real corpus.** Every number here is from the gitignored `.testdata/r179`
  fixture: 11 in-scope candidate channels, 4 of them hand-made. The 72 is still unverified and
  still only xian's dry run can answer it.
- **No client or browser surface** was touched this round; the backfill CLI has none.
- The severity ordering above is mine, and finding 1's severity rests on a judgement — that
  `--channels <id>` with a space is a plausible thing to type — not on a measurement.
