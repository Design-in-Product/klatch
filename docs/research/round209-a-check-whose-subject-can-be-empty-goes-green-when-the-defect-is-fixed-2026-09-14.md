# Round 209 — a check whose subject can be empty goes green when the defect is fixed

**Theseus, 2026-09-14 WORK fire.** Follows Argus's 9/14 probe-hygiene flag ("worth Theseus
knowing before he retires or re-aims this probe per Daedalus's §5") and Daedalus's Round 208
§5.

**Headline:** the stale-WAL corruption Argus hit is real, reproduced here with a control, and
fixed. But looking for it turned up something worse in the same file: **two checks in
`probe-round205` that turn GREEN at the exact moment the defect they pin is fixed**, because
their subject defaults to `''` and an empty string satisfies a negative assertion. Both were
reporting "the defect is still present" about behaviour Round 206 had corrected. One of them
was pinning a fix made in direct response to my own Round 205.

---

## 1 — The corruption: reproduced, with a control

Argus's 09:02 fire hit `SqliteError: database disk image is malformed` inside
`planEntityBackfill` on a cold run of `probe-round205`, and attributed it to a stale
`f-reach.db-wal` left by a previous run. I did not take that from the memo. Two reconstructions
failed to reproduce it before the third did, and the failures are informative:

| Attempt | Producer of the stale WAL | Result |
|---|---|---|
| 1 | hand-built WAL from the same corpus bytes | **no corruption** — WAL is valid against an identical file, replays cleanly |
| 2 | the real backfill CLI with `--apply` | **no corruption** — the CLI checkpoints on close; sidecars land on the `.backup-backfill-*` file, and `f-reach.db-wal` is 0 bytes |
| 3 | `planOf()` — the probe's own child mode | **reproduced: `SqliteError: database disk image is malformed`** |

The producer is the probe's plan child (`:54-69`). It sets `KLATCH_DB`, imports
`entity-backfill.js` — which opens the database read-write in WAL mode — and then
`process.exit(0)`s **without checkpointing**. That leaves a **4,276,592-byte** `f-reach.db-wal`,
matching the "4.2 MB" figure in Argus's log to the byte.

The consumer is arms D/E/F, which copied the main file only:

```js
fs.copyFileSync(CORPUS, F);   // :308 / :369 / :393 — sidecars left behind
```

The next run's fresh pages then get the previous run's WAL replayed on top of them.

**Control, same script, same sequence, only the unlink added:**

```
COLD planOf:                    exit 1 -> SqliteError: database disk image is malformed
CONTROL planOf (after unlink):  exit 0 -> {"rows":72,"summary":{...}}
```

One detail worth keeping: **read-only opens survive it** (`READONLY: {"n":68}`). Arm D opens
`readonly: true` and would have sailed through; it is the plan child that dies. That is why the
failure surfaced in "an unrelated arm" rather than at the copy.

## 2 — Fixed, three ways

`probe-round207` already carried the correct idiom — and, checking the file rather than my
memory of it, already carried this exact diagnosis at `:115-131`, including the same
4,276,592 B figure. I had written it and not carried it back. Back-ported:

1. **`WORK` is cleared, not merely created** (`rmSync` + `mkdirSync`). The root fix.
2. **`copyCorpus(src, dest)`** removes `dest`, `dest-wal` and `dest-shm` before copying — the
   same rule `buildCorpus` already applied at `:138`, now applied to the corpus copies too.
3. **Arm C no longer aborts the probe.** `JSON.parse(readFileSync(path.join(WORK, recs[0])))`
   threw when `recs` was empty, so **arms D, E, F and Z never ran** — every corpus measurement
   in this probe has been unreachable since Round 206 landed. C2–C5 now degrade to OPEN and the
   probe runs to completion.

Point 3 is the larger of the three. A probe that aborts on its first finding stops being a
probe.

## 3 — The thing I did not go looking for

With the probe running end to end again, arm E failed three checks and passed one. The sheet's
note now reads:

```
↳ note: 4 agents named "chief of staff" already exist (fc4a59b6, d064dae8, 45691e94, 1e18ec34).
  A role-title guess does not reuse them — this mints another.
```

That is **Round 206 fixing the exact defect Round 205 reported** —
`backfill-entity-bindings.mts:1197-1200` cites "Theseus, Round 205 §4" in its comment. The note
went from singular and one id to plural and all four.

E1's regex was `/already exists/`. The verb is now `exist`. So `notes` came back **empty**, and:

```js
check('E4', !/\b4\b|four|others|and \d+ more/.test(notes[0] ?? ''), …)
//                                              ^^^^^^^^^^^^^^^^
//   notes[0] is undefined → '' → .test('') is false → !false → PASS
```

**E4 reported PASS.** Its stated claim: *"the note gives the operator no sign that three more
carry the name."* The note names all four ids. The check asserted the defect was still there,
in green, at the moment it was fixed — and it did so *because* the fix was thorough enough to
change the wording E1 was matching on.

**Sweeping the file for the same shape found a second instance.** Arm B:

```js
const matchLine = sheetB.split('\n').find((l) => /MATCHED-BY-NAME/.test(l)) ?? '';
check('B2', !matchLine.includes(OLD.slice(0,8)) && !matchLine.includes(NEW.slice(0,8)), …)
```

Round 206 made the backfill refuse an ambiguous name, so no `MATCHED-BY-NAME` row is emitted at
all. `matchLine` is `''`, both `includes` are false, and **B2 went green** asserting "the
divergence is not visible from the sheet" — when there is no longer a divergence to see.

### The generalisation

**A check whose subject can default to empty, asserting a negative, flips to green exactly when
the thing it inspects disappears.** Not when the defect persists — when it is *fixed*. Both
instances here point the same way, and both are silent: nothing in the output distinguishes
"inspected the note and found no mention of the other three" from "there was no note."

This is the same family as Daedalus's Round 208 correction, one layer over. His test *assumed
the tie it needed instead of establishing it*; these checks *assume the subject they need
instead of establishing it*. His fix was to force the condition. The fix here is the same
shape: make the subject's existence part of the assertion.

## 4 — What I changed, and what I deliberately did not

**Arm E re-aimed** at the behaviour that now exists: one note (matching `/already exist/`, both
verbs), the count stated, all four ids named, and "does not reuse them". **4/4 green against
the real sheet.**

**B2 guarded** with `matchLine !== ''` so it fails honestly. It now fails.

**Arms A, B and C left pinning pre-Round-206 expectations, deliberately.** Eight checks fail
(A1, A2, A4, A5, B1, B2, B3, C1) and every one of them encodes the *old* non-refusing
behaviour. I did not re-aim them, because retiring them is a call about Round 206's deliberate
behaviour change and belongs to whoever owns that change, not to me unilaterally. My
recommendation: **retire arms A–C** in favour of Round 206's own tests, which cover refusal
directly. Flagged for Daedalus in the memo. C1 in particular is not a probe defect — it is his
reported finding that a refused group writes no undo record.

**Also corrected:** the child-mode projection at `:65` asked for `r.sameNameEntityId`, which
Round 206 replaced with the plural `sameNameEntityIds`. It had been returning `null` for every
row. **No check read it**, so nothing scored wrong — but it would have scored wrong the moment
one did, and `tsc --strict` catches it now.

## 5 — Numbers, verified this fire

- **Probe: 23 checks · 8 failed · 5 open · 2 measurements.** Two consecutive runs diffed
  **IDENTICAL**. `tsc --strict --module nodenext` clean. Zero model calls.
  - Before this fire: aborted at arm C, D/E/F/Z unreachable.
  - Mid-fire, after hygiene only: 10 failed (with E4 and B2 vacuously green).
- **Suite, run myself, not taken from either memo: server 1777 / 111 files, client 311 / 13
  skipped.** This matches **Daedalus's corrected** figure (`0eb571a1`), not the 1776 both his
  earlier memos stated. His correction holds.
- **No product code touched.** `git status --porcelain` shows one modified file, the probe. Arm
  Z passes: corpus byte-identical at `c2295121bbdfdbbb`, `packages/` clean.

## 6 — Still open, not closed by this round

- **The picker (my Round 207 item 1)** remains unbuilt. Daedalus's Round 208 made the server
  complete for it (`sameNameEntityIds` on the import response); it is client work on the
  confirm step, and Iris's surface. Round 207's D1 still fails for this reason.
- **xian's corpus question** — whether the March 14 backup (mtime `2026-07-23`) is the live
  corpus or five months stale — is now **eight rounds open**. Every corpus number in this
  document, including the four Chief of Staff entities, inherits that caveat.
- **Round 208's `sameNameEntityIds` contract has not been driven live by me.** Argus verified
  it at source and the suite covers it; I did not exercise it through the real HTTP endpoint
  this fire. Named here so nobody reads this round as having done it.
