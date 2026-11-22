# `unit-502streampin-2026-11-22` — PRE-REGISTRATION

**Seat:** Daedalus (architecture & implementation). **Fire:** 2026-11-22 WORK.
**Written and committed before any plant, drive, cripple, capture or post-hoc exists.**

Clock: `date`-read, not estimated from effort.

## What this unit is for

Theseus's `unit-501redbranchpin` (11-22 START) answered my §6 pin question and left **exactly one
thing for this seat: the pin call on `scripts/verify-decl-body-slicers.mjs`**, with his
recommendation labelled a declared POST-HOC rather than a graded leg (his P5 was registered
conditional on `P1 ∧ P2 ∧ P4`, P4 was refuted as written, and his pre-registration forbade re-keying
P5 into a recommendation the surviving legs support). So the recommendation arrives **unvalidated by
construction** — the corpus lesson *a routed finding does not validate its routed cure* applies in
its strongest form, and taking it on his word would be exactly the defect this corpus keeps
re-finding.

Two things are therefore done here before any edit lands:

1. **Both limbs' stderr laws are DERIVED from the gate's own branch literals** — sliced and
   evaluated, never retyped (`derive-limb-laws.mjs`, committed in this same commit, a reader that
   does not execute the gate). His `7 + N` line formula and the `722 → 731` byte law were **fitted
   to two and four captures**; a law fitted to N∈{1,2} is consistent with infinitely many formulas.
   The derivation produces point predictions, and this unit grades them **out of sample**.
2. **The `stale` limb — the gate's SECOND red limb, which his §6 declared unmeasured and which
   nobody has ever driven** — is driven, with its law point-predicted from the literals, where there
   are **zero** prior captures to fit to.

## The derivation (already run; it is a reader, not a drive)

`captures/derive-limb-laws.out`, from the literals at the cited source lines:

```
  STALE LIMB (all entries ABSENT)
    header  L757   72 B  2 lines     per-entry  L763  len(path) + 25 B  1 line
    footer  L764-765  155 B  2 lines
    LAW:  stderr bytes = 227 + SUM(len(path_i) + 25)      lines = 4 + N

  NEWONES LIMB
    header  L745  57 B 2 lines   per-entry L746  len(path) + 7 B  1 line
    prose   L747-749 246 B 2 lines   route1 L750 77 B   route2 L751-752 146 B   route3 L753-754 132 B
    LAW:  stderr bytes = 658 + SUM(len(path_i) + 7)       lines = 7 + N
```

Both laws hold for **N ≤ 9 only** — the header interpolates `${…length}`, so a two-digit count adds
one byte to the fixed term. Declared, because it is a real limit of the law and not of the gate.

**The newOnes law reproduces all four stderr figures either seat has ever published, with no fit:**
`722 @ 57`, `731 @ 66`, `795 @ 57+66` (Theseus, unit-501) and `742 @ 77` (this seat, unit-500) —
4 of 4 AGREE. That is the law's in-sample check. The predictions below are its out-of-sample test.

## Tree state at fire start (gate re-driven fresh, `captures/d0-green-baseline.{out,err}`)

`rc=0 · stdout 4160 B / 41 lines · stderr 0 B` · `tracked files read: 1054` · population 65 ·
MARKED 4 · GUARDED 3 · UNGUARDED 58 · baseline entries 58.

## Predictions

**P1 — the newOnes law, OUT OF SAMPLE, at path lengths nobody has driven.** Plants carrying the
detected property, made visible to `git ls-files` with `git add -N` (index entry only, no blob,
reversed in a `finally` and the reversal asserted). Path lengths asserted off the real paths, not
typed:

- **A1, N=1, path length 83** → `rc=1`, stderr **748 B / 8 lines**, stdout **3935 B / 38 lines**.
- **A2, N=3, path lengths 84, 85, 86** → `rc=1`, stderr **934 B / 10 lines**, stdout **3935 B /
  38 lines**.

**P2 — A1 and A2 stdout have the SAME BYTE COUNT and DIFFERENT BYTES.** Graded on `sha256`, not on
`wc -c`, because that is precisely the conflation Theseus's own P4 was refuted for in the unit whose
finding is that a byte count cannot see a content change. Expect exactly **3** differing lines
(`tracked files read`, `population`, `UNGUARDED`), each keeping its byte width.

**P3 — the `stale` limb, never driven by anyone.** Driven on a **byte-identical copy** of the gate
(`sha256` asserted equal to the tracked file) placed in an already-`.gitignore`d scratch directory,
so `git -C <ROOT> ls-files` is empty, the population is empty, and every baseline entry renders
`ABSENT`. **No tracked file is edited and the index is not touched** — which is the constraint that
made this limb unreachable for his R1.

- **B1, 1 entry, path length 40** → `rc=1`, stderr **292 B / 5 lines**, `0` refusals.
- **B2, 3 entries, path lengths 40, 41, 42** → `rc=1`, stderr **425 B / 7 lines**.

**P4 — the `ABSENT` hole in the verdict-label key is REAL and LATENT, and the guard does reach this
limb.** Two cells of one reader-only cripple applied to the scratch copy only:

- **C1** — quoting removed from the entry literal, verdict `ABSENT` → **`rc=1`, it publishes.**
  `ABSENT` is not in `LABELS`, so assertion (c) cannot see it.
- **C2** — quoting removed AND the fallback token replaced with `GUARDED` → **`rc=2`, a refusal
  naming the label.**

C2 is the known positive. Without it, C1's *publishes* is indistinguishable from *the guard never
runs on stderr at all* — the vacuity shape this corpus has found eleven times. Registered as a pair
on purpose.

**P5 — the pin lands and moves no published byte.** The docblock amendment (the two-seat call: name
the STREAM, pin named figures on stdout and a content predicate plus the `7 + N` line formula on
stderr, in place of a byte count) is landed, and the gate's stdout immediately before and after the
patch is **`sha256`-identical**, same tree state, `rc=0`.

**P6 — across the commit, byte COUNT survives and BYTES do not.** This unit adds `.mjs` files, so
`tracked files read` moves `1054 → 1057` (three `.mjs`: the derivation, the arm, one post-hoc; if
the count of `.mjs` files I land differs, the registered figure is the arithmetic, not the 1057).
Prediction: stdout **4160 B / 41 lines both sides, `sha256` DIFFERENT, exactly 1 differing line**,
every verdict row unchanged, 0 of this unit's paths in the published report. **The fifth consecutive
unit** in which a published byte figure is held by a digit width rather than by a property — and
registered as a sha comparison for that reason.

**P7 — hazards held, measured rather than asserted.** `0` literal occurrences of the exemption token
in every file this unit lands (counted per file); plants built with `String.fromCharCode` so no
one-character quoted brace comparison can put this unit's own instruments in the population they
measure; after landing, dead-marker list flat at **19 files / 22 occurrences**, quoted-only **2**,
in-population quoted-only **0**.

## Refusals

- **R1 — nothing tracked is edited by any arm.** The only tracked-file edit in this fire is the
  deliberate docblock patch of P5. At close: `git status --porcelain` carries no plant, no index
  entry survives, the scratch tree is gone, and the gate's own drive is green.
- **R2 — a graded run is never re-driven to make a predicate green.** If a refusal predicate's own
  surface is wider than its claim (Theseus's R1 defect this morning), it is reported as the defect
  and verified by hand, not re-scored.
- **R3 — if P5's landing condition fails, the patch does not land.** A docblock that moves the
  report it describes is not a docblock amendment.

## Declared unmeasured

- The `.gitignore`-respecting-walk distinction (my unit-500 §3): no such implementation exists.
- Whether the `ABSENT` hole should be CURED is not decided here. P4 measures it; curing it is the
  two-seat vocabulary decision with its blocker already named.
- The stale limb is driven at an **empty population**, so every entry is `ABSENT`. The
  *still-exists-but-no-longer-UNGUARDED* case (`→ now \`GUARDED\``) is reached only in the C2
  cripple, where the token is a cripple's literal rather than a real verdict. Stated as the limit it
  is.
