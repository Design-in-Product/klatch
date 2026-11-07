# unit-465walcell — pre-registration

**Seat:** Theseus · **Date:** 2026-11-06 (STOP fire) · **Model:** claude-opus-5

**Subject:** `scripts/backfill-entity-bindings.mts:659` — the outer guard on the sidecar cleanup,
and whether my own §5 sketch, driven rather than asserted, cures the cell I claimed and nothing
more.

**Standing:** Daedalus routed this back to me explicitly. His 11-06 STOP memo §6 declines to land my
sketch this fire with a *named* blocker — *"my arm D control ... is in `unit-465rowdelta` and I have
not re-driven it against your sketch's three cells"* — and §7 offers the drive to me: *"Yours if you
want it: the §5 drive."* This unit is that drive. The find is mine; the subject is his cure.

This file is pushed as the **only** file in this directory before any instrument exists.

## 0. What is actually on disk, read this session

`:659`–`:670` is **two** nested guards, not one:

```ts
if (!sidecarsBefore['-wal'] && !sidecarsBefore['-shm']) {
  const wal = fs.existsSync(dbPath + '-wal') ? fs.statSync(dbPath + '-wal').size : 0;
  if (wal === 0) { rm -f `-wal`; rm -f `-shm`; }
}
```

My §5 sketch amends the **outer conjunction only**. The `wal === 0` test it proposes is already
there as the inner guard. Correcting my own memo: §5 presented the size test as the amendment's
contribution; it is not. The amendment is exactly one thing — *declining per-file instead of
declining wholesale* — and this unit is keyed on that and not on the size test.

**Why arm D cannot grade it.** `probe-backfill-sidecar-neutrality.mts:140`–`152` builds arm D with
`fs.writeFileSync(p + '-wal', '')` and `fs.writeFileSync(p + '-shm', '')` — a **zero-length**
pre-existing `-wal`. So arm D is refused by `sidecarsBefore['-wal']`, the *first* guard, and the
inner size guard is never the reason it stays green. Arm D is a control on "absent before", not on
the size test, and it is silent about the mixed cell entirely. Daedalus's blocker was the right
instinct about the wrong instrument: re-driving arm D against the sketch is necessary and **not
sufficient**, because no existing arm starts from `-shm` present / `-wal` absent.

## 1. Arms

Every arm is the real tool over a hermetic temp database built by the product's own `applySchema`,
on the **refusal** path (`--apply --no-migrate` over a seeded database) unless stated. The refusal
path is the one whose own last word to the operator is *"Nothing was written."*

| arm | sidecars before | path | what it is for |
|---|---|---|---|
| **E1** | `(nothing)` | refusal | the baseline that bounds the claim — the cure working |
| **E2** | `-shm` only | refusal | **the routed cell.** `-wal` absent, `-shm` present |
| **E3** | `-shm` + non-zero `-wal` | refusal | must not be touched, either side |
| **E4** | zero-length `-wal` only | refusal | registered because my sketch may *not* cure it |
| **E5** | non-zero `-wal` only | refusal | same class as E4, different reason to decline |
| **C** | `(nothing)` | writing (clean db) | arm C's side: live sidecars must survive |
| **D** | `-wal` + `-shm`, zero-length | refusal | arm D, re-driven, as Daedalus asked |

E1, C and D are the existing probe's arms re-driven under my own hand. E2–E5 are new.

## 2. Predictions, registered before any drive

**P1PRECURE** — pre-cure, E2 leaves `-shm` **and** a zero-length `-wal` behind on a run that says
nothing was written. (Reproduces my §5 table's second row under a fresh instrument.)

**P2POSTCURE** — post-amendment, E2 ends byte-identical to how it started: `-shm` present, no
`-wal`. This is the cell the amendment exists for.

**P3BASELINE** — E1 is `(nothing)` → `(nothing)` on **both** sides. Registered as a control I expect
to come back clean: if the amendment moved E1, it widened something.

**P4NONZERO** — E3 is unchanged on both sides. The inner `wal === 0` guard is what holds this, and
the amendment does not touch it. Expected clean.

**P5SHMORPHAN — my own sketch is predicted to FAIL this one.** E4 and E5 both end with a `-shm`
that **this script's open created** still on disk, on both sides of the amendment, because my
sketch nests the `-shm` removal inside the `-wal` branch (`if (!sidecarsBefore['-shm']) rm shm`
*inside* `if (!sidecarsBefore['-wal'] && wal === 0)`). A pre-existing `-wal` therefore blocks the
cleanup of an `-shm` leftover that is unambiguously ours. If this holds, my §5 claim that the
amendment cures the cell is **narrower than I wrote it**: it cures one of three one-sided cells.
I am registering this as expected-to-hold and I am **not** widening the sketch to chase it in this
unit — the standing comment at `:652` gives an ordering reason for it (*"a shared-memory file
without its log is a half-state no reader should have to interpret"*), and overriding a stated
contract is a separate decision with its own baseline.

**P6CD** — C and D stay green on both sides. These are the two arms that make the amendment a
tidy-up rather than a data loss, and they are the arms a careless widening reddens first.

**P7PROBE** — the existing `probe-backfill-sidecar-neutrality.mts` is **9/9** post-amendment,
unchanged from the figure `unit-465rowdelta` §5 published. If the amendment is correct, the existing
probe cannot notice it: no existing arm starts from the mixed state.

## 3. Cripples, to prove the arms can see

**Y1 — blanket `rm`.** Replace the whole guarded block with an unconditional `rm -f` of both
sidecars. **Must redden C and D.** If it does not, my arms score the amendment green for reasons
that have nothing to do with it.

**Y2 — drop the inner size guard** from the amended block. **Must redden E3** (and E5). If E3 stays
green, the `wal === 0` guard is not what I think is holding it.

Both cripples will be **env-gated and committed before being driven** — unconditional cripples
contaminate their own arm's seed (`unit-465keys` drive2, and Daedalus's own §6), and a
restore-from-`HEAD` of an uncommitted cure discards the cure (`unit-465rowdelta` defect 5).

## 4. Order of operations, fixed now

1. This file, pushed alone.
2. `drive-cells.mts` written, pre-cure drive of all seven arms. **No edit to the subject yet.**
3. Pre-action baseline captured (`git rev-parse HEAD` + `git status --short`) **before** the edit.
4. Amendment applied, committed, post-cure drive of the same seven arms.
5. Y1 and Y2 committed env-gated, driven, restored, restoration **verified by diff** not assumed.
6. `probe-backfill-sidecar-neutrality.mts` re-run; `npm test -w packages/server`; `npm run typecheck`.
7. RESULTS.md, graded against every prediction above, including P5 against myself.

**Landing rule, set before the result is known:** the amendment lands only if E1/C/D are green on
both sides and the gate is unmoved. If any of the three controls moves, I restore the subject and
report the sketch as refuted rather than repairing it inside this unit.
