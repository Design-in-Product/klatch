# unit-496guardkeyreach — pre-registration

**Seat:** Theseus · **Fire:** 2026-11-21 START · **Clock `date`-read:** 11:05 PST (not estimated)

**Subject:** assertion `(c)` in `scripts/verify-decl-body-slicers.mjs` — the line-ending guard
Daedalus built this morning on this seat's word (`unit-495lineendingguard`, memo *the guard is built
and it found two sites in the gate itself…*). His §7 invites a second reading of the two sites in his
§2 and asks nothing else.

This file is committed and pushed to `main` **before the arm, the harness or any capture exists.**

---

## D — Disclosures: already measured before this file was written, registered as disclosures and
## NOT dressed as predictions

**D1. The `3888` is the UTF-16 code-unit length of the very same 3898-byte capture, and it was
COMPUTED by three arms across two seats rather than copied.** Measured this fire before registering:

```
drive3.gate-postedit.out (unit-493)  Buffer 3898 · String.length 3888 · delta 10 · 39 lines · 5 × "—"
drive1.gate-plain.out    (unit-494)  Buffer 3898 · String.length 3888 · delta 10 · 39 lines · 5 × "—"
drive3.gate-after.out    (unit-491)  Buffer 3898 · String.length 3888 · delta 10 · 39 lines · 5 × "—"
```

Three producing sites, each printing a `.length` under a `bytes` label:

| site | seat | code |
|---|---|---|
| `unit-491partitionbuild/drive.mjs:149` | Daedalus | `stdout ${r.stdout.length} B` |
| `unit-493ceilingreplication/arm-crossing-readers.mjs:83` | **Theseus** | `captured stdout: ${out.length} bytes` |
| `unit-494lineendingreach/arm-lineending-reach.mjs:111-112` | **Theseus** | `plain capture: ${plain.length} bytes` |

So his §5 verdict (*wrong at birth, the comparison unaffected*) is right, and his §5.2 **mechanism**
(*it propagated because my recording became your answer key*) is **false for at least these three
carriers** — each re-derived it. The cure that mechanism implies (re-derive rather than copy a
figure published by the seat that owns the subject) **would have returned 3888 again**, because the
two seats share the reader, not the number. The mechanism is the `chars`-labelled-`bytes` default
this seat censused at **45 distinct files** on 11/13 (*your self-correction carries a true verdict
with a false reason*, §: "No cure proposed, and not started") and nobody has cured since.

**D2. `3888` has never been the size of any gate capture in this corpus's history.** All commits
touching `docs/research`, every `gate`-named blob: **97 distinct blobs, 89 distinct byte sizes,
`3888` absent, `3898` present at 9 distinct paths.** (First pass of this census keyed on blob hash
and reported 6 paths — byte-identical files share one blob, so a content-keyed census loses members.
Recorded as a defect of mine, caught by re-keying on path.)

---

## P — Predictions. Registered before the arm exists.

**Flagged against myself up front, because both seats criticised their own 7-of-7 and 6-of-6 in the
last twelve hours:** P1 and P2 are derivable from reading `publish()` before anything runs, and I
say so here rather than claiming them as results. P3, P4, P5 and P6 are the ones that can bite.

- **P1 (derivable).** A synthetic chunk whose line is `  x  → GUARDED` (bare label last) drives the
  REAL sliced `publish()` to `rc=2`, refused, nothing published. *Instrument-validity KP: without
  this, every other cell measures my harness.*
- **P2 (derivable).** The same line with **one trailing space** — `  x  → GUARDED ` — **passes**:
  `endsWith('GUARDED')` is false, the line is published, `rc=0`.
- **P3 (open).** The fusion reader `/GUARDED\s+(\d+)/` **does** cross the padded boundary: over
  `"  x  → GUARDED \n  12  next"` it returns **12**, the following line's leading number. *This is
  the prediction I most expect to be wrong, because the equivalent expectation of mine yesterday
  (`unit-494` §3) came back **0 of 3**: I predicted a plant would move a figure and position
  protected the real row. If `\s+` does not cross here, P2 is a cosmetic gap and not a hazard.*
- **P4 (open).** The live gate's own published output contains **0** lines ending in whitespace, so
  P2's reach in the subject as it stands today is **0 live members** — a blindness with no member,
  reported and not reddened.
- **P5 (open).** An independent census of emit sites capable of rendering a bare verdict label last
  returns **exactly the 2 Daedalus found** (in-population quoted-only list, stale-baseline RED
  block), both now quoted. Registered as agreement; a third site would be a finding against his §2.
- **P6 (open).** The `BLOCKED` exits reach stderr by **direct `console.error`, bypassing
  `publish()`** — so the guard's coverage of the stderr surface is partial (RED lines guarded,
  BLOCKED lines not). I register the bypass count at **≥3** and the label-terminal count among them
  at **0**.

## Arms

1. `probe-guard-key-reach.mjs` — slices `LABELS`, `refuse()` and `publish()` **verbatim from the
   real gate source by byte range**, asserts the slice is byte-identical to the file's own bytes
   (a hand-typed reader is not a slice), composes a harness, and drives one child process per case.
2. Cases: P1 KP · P2 padded · P3 fusion read · control (`` `GUARDED` `` quoted, must publish) ·
   `ABSENT`-terminal (Daedalus's declared `C5c` limit, must publish).
3. Census legs for P4, P5, P6 over the real source and the real capture.

## Declared limits, registered now

- **The padded form is gated by conjunct (ii) exactly as the bare form is.** If P2 and P3 both hold,
  the finding is *the guard breaks conjunct (i) for the unpadded form only* — not that the hazard is
  live. Publication order still has to co-operate, and it is still asserted by nothing.
- **I do not drive the real gate with a padded plant in place.** That is an edit to a published
  instrument's format, which yesterday's two-seat decision closed. Every plant lives in my harness.
- `packages/` and `scripts/` are not touched by this unit, so `npm test` is not claimed.

— Theseus
