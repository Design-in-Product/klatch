# unit-465leadcure — results and grading

**Seat:** Theseus · **Fire:** 2026-11-11 WORK (opened 14:47 PST)
**Pre-registration:** `PREREGISTRATION.md`, written **14:50:49 PST**, committed and pushed to
`origin/main` as `9adfc343` **before the first recording existed** (`HEAD == origin/main` verified
after the push, not inferred from a piped `git push`).
**Baselines recorded:** 14:52:15 PST · **first cured recordings:** 14:53:23 PST.

**Subject pins** (`git ls-tree HEAD`, `-C`-pinned, pre-cure):

| file | blob |
|---|---|
| `scripts/geometry-marking-before-seed.mjs` | `19cc7c9ed56cf094e03d38ecfde9d02385853e08` |
| `scripts/geometry-distance-arm.mjs` | `5087888b4b1086dec934c8191f2bd00b2099a473` |

`19cc7c9e` is **the same blob** `unit-465leadbound` (11/10) and `unit-465blanket` (11/11) measured,
so the baseline arm here is a third re-measurement of an unchanged subject — which is why P1 was
declared weak in advance.

## Recordings

| arm | rc | stdout |
|---|---|---|
| `B0-marking-baseline` (pre-cure) | 0 | 8562 utf8Bytes / 8406 chars |
| `C0-marking-cured` | 0 | 8562 utf8Bytes / 8406 chars |
| `B1-distance-baseline` (pre-cure) | 0 | 1179 utf8Bytes / 1157 chars |
| `C1-distance-cured` | 0 | 1383 utf8Bytes / 1361 chars |

**`B0` reproduces Daedalus's independent `A0` exactly — 8562 / 8406, both numbers, from a different
seat and a different harness.**

**The near-trap, hit as predicted and recorded in advance by 11/10's unit:** `C0` prints **the same
8562 bytes as its own baseline** while two lines differ. A size comparison alone reads this cure as
having no effect. The coincidence is that both changed denominators stay three digits
(`208→273`, `288→378`). The diff, not the size, is the instrument.

## Grading

| # | prediction | verdict |
|---|---|---|
| P1 | cured marking script exits 0, differs in exactly two lines, both denominators | **TRUE** (declared weak in advance — a control, and it held) |
| P2 | self-check block byte-identical | **TRUE** |
| P3 | distance-arm diff confined to the edited sentence; no table row moves | **TRUE** |
| P4 | distance arm never reads `FILLER_LEAD` programmatically | **TRUE** |
| P5 | no surviving literal in either file claims `FILLER_LEAD`'s length | **FALSE on the first draft of the cure — see below** |
| P6 | the `:136` error is an inversion, not a staleness; parametric half still true | **TRUE** |

Four of six TRUE, one TRUE-as-a-declared-control, **one FALSE and the FALSE is the finding.**

## P5 failed against my own cure, and that is the result worth keeping

The cure's explanatory comment, as first written, contained:

```
// (the live list holds 20)
```

**That is a frozen, unguarded corpus count — the exact defect class the cure removes — written
inside the comment that explains why frozen unguarded corpus counts are the defect.** Nothing in
the file asserts it; it would drift the moment the corpus grows again, exactly as `FILLER_LEAD: 15`
did for 78 days.

It was caught **only** because P5 was pre-registered over the *mechanism* ("any surviving literal
claiming `FILLER_LEAD`'s length") rather than over the two instances I set out to fix. A census
keyed on the two known sites would have passed, green, with the defect re-seeded one line away.

Repaired to a **dated reading with its instrument named** — "read it with
`npx tsx scripts/verify-filler-constraints.mjs` … (it read 20 on 2026-11-11)" — which is a
historical measurement, not a live claim, and cannot silently go false.

**It then happened a second time, in the same comment block.** The repair's own first draft wrote
"the comment you are reading shifted the self-check down by **25**". Measured: the anchor moves
`123 → 154`, a shift of **31**. A wrong frozen number, inside the sentence warning about wrong
frozen numbers. Cured by **deleting the number** rather than correcting it, and by re-citing the
self-check **by searchable anchor instead of line number** — this file's own docblock already
records a line citation that went stale by 22 lines, and my insert had invalidated the `:125` I
wrote two minutes earlier.

Both self-inflicted instances share one shape: **prose written to explain a cure is not covered by
the cure.** The subject got the discipline; the sentence about the subject did not, until a
mechanism-keyed census was run over it.

## The design call, and why it was mis-posed

The deferred question was **"remove the number vs. parse it."** The census of all eleven
`LIST_LENGTHS` uses says it was keyed on the wrong unit — three members, three roles, three answers:

| member | role | printed? | asserted? | live | disposition |
|---|---|---|---|---|---|
| `FILLER: 12` | geometry input (`P:` in both self-check anchors; sweep start/subject) | no | **yes**, by the self-check | 12 | **kept as is** — a real input, really guarded |
| `FILLER_LONG: 17` | sweep `P` value; arithmetic inside a **printed sentence** | **yes** | **no** | 17 | **flagged, not cured** |
| `FILLER_LEAD: 15` | **loop bound only**, 4 sites | no | no | 20 | **claim removed** → `L_SWEEP_MAX = 20` |

`FILLER_LEAD` was never a fact this file needed — it was a sweep extent wearing a corpus name. So
neither "refresh" nor "parse" was right: **refresh** restores an unguarded claim that already
drifted once, and **parse** adds a cross-file source-scanner to keep honest a number that provably
cannot change a conclusion (inert over `0..50`, `unit-465leadbound`), against a file whose docblock
premise is "zero API calls, zero server, zero DB — this is arithmetic." The cure removes the claim
and records the inertness so no future reader re-derives the question.

## FILLER_LONG is the next FILLER_LEAD

This is the finding the unit was not looking for, and it generalises Daedalus's §4 point
(*a figure is only guarded where something asserts it*) from the figure that **drifted** to the
figures that **agree**.

My own 11/11 §4 census reported "6 of 7 constants agree with live source" and stopped there.
**Agreement is not guardedness.** Of the two corpus figures left in `LIST_LENGTHS`:

- `FILLER: 12` is guarded. If it were wrong the self-check's derived N1 geometry would move and the
  file exits 1. It is correct **by construction**.
- `FILLER_LONG: 17` is **not** guarded by anything. No self-check reads it; it feeds two sweeps and
  is printed as arithmetic in a sentence. It is correct **only by inspection, today.** It sits in
  precisely the position `FILLER_LEAD: 15` sat in on 2026-08-19, and the first `FILLER_LONG` pair
  added to the corpus makes a printed sentence false with nothing going red.

Deliberately **not** cured here: fixing it inside a unit scoped to `FILLER_LEAD` would be a cure
under a different subject, and it is not wrong yet. Recorded as the named successor hazard.

## P6 — the inversion, with both halves checked at their own granularity

The sentence at `geometry-distance-arm.mjs:136` read:

```
FILLER_LEAD holds 15, so that is 5 new pairs, and both offers then exceed the 30-row expand cap
```

**It was a correct reading of a real guard when written, and the work it bills has since been
done.** `probe-recall-tool.mjs:1873` throws when `needLead > FILLER_LEAD.length`, and its message
demands exactly `needLead - length` new pairs. At length 15 the proposed `leadPairs: 20` arm was
**corpus-blocked** and owed **5** pairs — the sentence's own number, traceable to the guard's own
message. At the live length 20, `20 > 20` is false: the arm is **available and the corpus cost is
zero.**

So the error is not that a number aged. **The sentence still bills a cost that was discharged
elsewhere, and so argues against a build that is now free on that axis** — an argument that
inverted while reading as current.

The parametric half survives, and was checked **at the cell the sentence is about** (the `F=17`
bullet, i.e. `L=20, P=17`) rather than at a convenient one, using the subject's own `layout()`
extracted up to its own anchor rather than retyped:

```
L=20 P=17  leading=38 (2L-2=38)  trailing=37 (2P+3=37)  bothOverCap=true
L=20 P=12  leading=38            trailing=27            bothOverCap=false   ← wrong cell
L=16 P=12  leading=30 (= MAX_EXPAND)
L=17 P=12  leading=32
```

`bothOverCap` is **true at `F=17` and false at `F=12`**, so a check run at the wrong `P` would have
refuted a true sentence. The `L=16 → 30` / `L=17 → 32` ceiling readings reproduce my 11/11 A3.

Cured by **removing the corpus count and naming the two instruments that measure it**
(`probe-recall-tool.mjs`'s hard fail, `verify-filler-constraints.mjs`'s printed count) rather than
writing `20` where `15` was.

## A blanket substitution would have corrupted three correct statements

Censused before editing: `geometry-distance-arm.mjs` contains five `15`s, and **only one is the
defect.** `:83` (`leadPairs: 15`) and `:121` (`L = 15, which is arm N1`) are arm N1's actual
historical configuration, and `:135`'s `+15` is a **markOffset**, a different unit entirely. The
defect is identified by *what the number counts*, never by the token — which is the same reason
the blanket `15→20` arm reddens at exit 1 in `unit-465blanket`.

## Refusals held, checked rather than asserted

- `:125`'s `L: 15` literal and the `want` fixture are **untouched** — `git diff` confirms the
  self-check block is not in the diff, and `C0`'s self-check lines are byte-identical to `B0`'s.
  Daedalus's A2 measured that refreshing that fixture yields `rc=0` publishing a **false** N1 line
  that `no-truncation-leak` structurally cannot catch; the operative instruction is *on A1's red,
  revert the change — do not refresh the fixture.*
- `FILLER_LONG: 17` not bumped, parsed, or re-roled.
- `packages/` **byte-untouched**: `git diff --stat -- packages/` empty.

## Gate

`scripts/` was touched, so the sweep leg is owed and was run — reported by its summary line, not
inferred from an exit code:

```
SWEEP PASSED — 45 of 45 swept probes green, 0 red, 0 blocked (0 could not run,
0 ran but did not finish), 0 census problem(s), 110 deferred
```

Pre-commit census on the pre-registration commit: `155 files, 45 swept / 110 deferred, CENSUS OK`
— consistent with Argus's reading after he promoted `probe-once-anchor-duplication.mts` this
morning (154/44 → 155/45).

## What this leaves open

- **`FILLER_LONG: 17`'s unguarded position** — named above, uncured, not yet wrong. The fix that
  matches this unit's thesis is to make the self-check assert it, not to watch it.
- **`no-truncation-leak`'s structural blindness** to the disarmed-fixture state (Daedalus's A2) —
  his finding, his file, not reassigned here.
