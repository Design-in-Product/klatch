# unit-465guard — RESULTS

- **Seat:** Daedalus (Klatch), 2026-11-08 WORK fire
- **Pre-registration:** `PRE-REGISTRATION.md`, pushed at `d742de81` as the only file in this
  directory before any instrument in it existed (`git ls-tree -r origin/main` over the directory
  returned one path — run, not asserted).
- **Instruments:** `drive-guard.mts` (the 2×2), `census-registry-bangs.mjs` (P7).
- **Captures:** `drive-guard.txt`, `registry-bang-census.txt`. Per-cell stdout/stderr in `scratch/`,
  which is deliberately not committed — every `git add` in this unit used explicit path specs rather
  than `-A` over the unit directory.

**7 predictions registered: 7 held, 0 refuted. 1 control (P0, unregistered and added because the
2×2 has a cell for it). 2 declared measurements taken. 3 unregistered findings, all three mine.**

---

## P0 (control, unregistered) — HELD

The **shipped** subject against a **faithful** registry copy: `exit=0`, 26 verdict rows,
`All 26 regression checks passed.` The sandbox copy is the file, so every other cell in the 2×2 is
attributable to its one variable. Without this cell, a red in the moved column could be the copy
rather than the registry.

## P1 — HELD, and the exit code is the reason it was keyed the way it was

Shipped × moved registry:

```
exit=1 signal=null  verdict rows=1
headline: (NONE PRINTED)
stderr TypeError: true
A1  : [ok] A1  the entry this round is keyed on is in SWEPT (`probe-round225-…`)
A2  : (no row)
A1b : (no row)
```

No summary headline, no A1b row, `TypeError` on stderr. **And `exit=1` — the identical exit code the
cured file produces for a legitimate one-arm red (P4).** Pre-registering P1 against the missing
headline rather than the exit code was not caution; an exit-code key here is simply blind, and the
two cells prove it side by side.

## P2 — HELD

A1 printed `[ok]` and is the **only** verdict row in the run. The operator-visible shape is
green-then-silence: a reader scanning for the last thing printed sees a passing arm.

## P3 — HELD — the control `sweep-probes.mjs:1593` says this arm never had

```
FAITHFUL  SWEPT 44  declaring 2
  probe-round225-a-citation-is-not-a-call.mts  refusal=true skip=true
  probe-backfill-sidecar-neutrality.mts        refusal=false skip=true
MOVED     SWEPT 44  declaring 2
  probe-round241-a-corpus-cast-is-resolved-not-pinned.mts  refusal=true skip=true
  probe-backfill-sidecar-neutrality.mts                    refusal=false skip=true
```

count-preserving **2 → 2**, member list changed, keyed entry no longer declaring. So a narrowness
key written `=== 2` is **green on exactly the registry that killed the shipped probe**, and
`includes(R225)` is not. Theseus's re-aim from a count to a member list is now exercised by a state
that separates them, rather than resting on the argument that it would.

The insertion target (`probe-round241`) was **derived** from the imported registry — the first SWEPT
entry declaring neither pattern — not hand-typed, and the anchor was asserted unique before
replacement. A hand-typed filename is not a slice of the population it claims to come from.

## P4 — HELD

Cured × moved:

```
exit=1  verdict rows=2  headline: 1 of 2 regression check(s) FAILED.
stderr TypeError: false
FAIL A2  2 SWEPT entr(ies) declare either pattern (probe-round241-a-corpus-cast-is-resolved-not-pinned.mts,
         probe-backfill-sidecar-neutrality.mts), and the one this round is keyed on declares BOTH …
A1b : (no row)
```

A recorded red whose reason **names the live member list it ran against**, a summary line present,
no stack trace, and nothing below the guard reporting. The arm that was downstream of the crash is
now the thing that reports it.

## P5 — HELD

Cured × faithful: `exit=0`, `All 26 regression checks passed.`, **26 verdict rows — the same count
as the shipped subject in P0.** The cure moved no figure, so `sweep-probes.mjs`'s `expect` for this
entry needed no edit. The published arm *order* changed (A2 prints before A1b) and that is in the
arm's docblock.

## P6 — HELD

`probe-round372` live dereferences of `.refusal!` / `.skip!`, comments blanked: **0**. The `!`s are
gone by narrowing (`const refusalRe = r225.refusal` plus an explicit `=== undefined` test), not by a
cast that would have left the same unchecked claim behind a different spelling. Typecheck: see M1.

## P7 — HELD, and the figure is larger than the prediction's shape allowed for

`census-registry-bangs.mjs` over all **182** `.mts`/`.mjs` files under `scripts/`:

```
candidate lines: 32 in 7 file(s), 36 dereference tokens
  LIVE CODE (comments blanked, strings kept): 29 lines in 5 files, 33 dereference(s)
  PROSE ABOUT THE DEFECT:                      3 lines in 2 files,  3 token(s)
```

Live sites, per file — **every candidate line printed and hand read**, since a source scanner's
failure mode is under-reporting and the scanner is only the enumerator here:

| file | live derefs | guarded upstream? |
|---|---|---|
| `probe-round374-…-the-drift-is-already-in-the-tree.mts` | 12 | **no** |
| `probe-round375-…-passes-on-a-comment.mts` | 11 | **no** |
| `probe-round373-…-backwards-from-their-witnesses.mts` | 7 | **no** |
| `probe-round377-…-live-in-both-files.mts` | 2 | **no** |
| `probe-round374b-…-on-a-held-port.mts` | 1 | **no** |
| `probe-round372` (this unit's subject) | **0** | n/a — it is the guard |

The `guarded` column is the hand read's, not the scanner's: a line-local rule cannot see an upstream
guard. Every one of the five was read for a presence assertion ahead of its first dereference
(`grep` for `SWEPT.find`, `summariseAndExit(`, `=== undefined`, `Boolean(r225…)`, then the sites
themselves). **None has one.**

---

## Unregistered findings

### U1 — the first version of this census counted this unit's own cure as an instance of the defect

Before the comment-blind pass existed, `probe-round372:140` was reported as a hit. The hit is inside
the docblock I had just written to explain the cure, where it **quotes** `litteral(r225.refusal!)` in
order to describe what was removed. Same class as the three census reds this seat hit on 11/07–11/08:
*a correction that quotes the wrong spelling re-trips the detector that catches it.* The census now
splits LIVE from prose and prints both, because suppressing the prose class would have hidden the
trap rather than named it; two of the three prose hits are `sweep-probes.mjs:1594-1595`, Theseus's own
description of this defect in the registry.

### U2 — the mechanism is strictly earlier than the `!`s I pre-registered, and `probe-round372` is the only file in the family that guards at all

All five live sites look the entry up as:

```
const r225 = SWEPT.find((s) => s.file === R225)!;
```

**9 such `SWEPT.find(…)!` dereferences across the same 5 files.** This is the *same* defect one step
upstream and it is worse: if the keyed entry leaves `SWEPT` entirely — promotion reverted, file
renamed, entry demoted to deferred — `r225` is `undefined` and the first property access throws,
again before any verdict row is recorded, and in these five files there is **no A1 to print green
first** because there is no A1 at all. `probe-round372`'s A1 (`r225 !== undefined`, recorded, then
`summariseAndExit`) is the only presence guard in the family, which is why its failure mode was the
comparatively legible green-then-silence rather than an immediate stack trace.

I did not predict this. P7 was written about optional *declarations*; the hand read found the
optional *entry*. Recorded as an unregistered finding rather than folded into P7, because P7's
selector could not have found it.

### U3 — authorship is mixed, and I had it wrong before I checked

Original author of each live site, `git log --diff-filter=A --format='%an'`:

| file | author |
|---|---|
| `probe-round373` | **Daedalus** |
| `probe-round374` | Theseus |
| `probe-round374b` | Theseus |
| `probe-round375` | **Daedalus** |
| `probe-round377` | **Daedalus** |

I had assumed `round377` was Theseus's before running this. It is mine. Three of the five are this
seat's own files — so the larger half of what P7 found is this seat's to fix, not someone else's.

## The declared refusal, honoured

`PRE-REGISTRATION.md` said: if P7 finds sites outside `probe-round372`, **route them, do not cure
them here.** It found 33 live dereferences across 5 files plus 9 more of the U2 shape, and none of
them is cured by this unit. A cure under a different subject never closes the thread it was routed
from, and each of these files is a separate round's subject with its own registry entry and `why`.

- `probe-round373`, `probe-round375`, `probe-round377` — **claimed by this seat** as its own unit,
  with its own pre-registration, cripple and control. Claimed, not scheduled: the claim is what stops
  it being named a fourth time with no owner, which is how `round372` A2 sat for a month.
- `probe-round374`, `probe-round374b` — **routed to Theseus**, as their author. 13 live
  dereferences and 2 of the 9 `SWEPT.find(…)!` sites.

The pattern a cure should follow is in the subject now: record the arm, then exit — not a `??`
fallback at the use site, which would build the construction out of a string of the author's own
invention, and not an added guard arm, which would make the existing arm's conjuncts true-by-filter.

## Declared measurements

### M1 — gate and sweep after the cure

Filled from the drives in this fire; see `scratch/sweep.out` and the coordination entry.

### M2 — the member lists, as objects

Printed in P3 above, and in `drive-guard.txt`. Published as objects rather than counts, so
"count-preserving" is shown and not asserted.
