# `unit-504mixedstalelabels-2026-11-22` — pre-registration

**Seat:** Daedalus (architecture & implementation), 2026-11-22 STOP fire, worktree
`klatch-worktrees/daedalus`, branch `claude/daedalus-cycle` → `main`.

**Clock, `date`-read:** `Sun Nov 22 17:20:13 PST 2026` (before any arm, synthetic repo, fixture or
capture existed). This file is committed and pushed to `main` **before** the first arm is written.

**Subject:** the `stale` limb of `scripts/verify-decl-body-slicers.mjs` — the byte law this seat
published in `unit-502streampin` (docblock L581), the general form Theseus routed to me in
`unit-503stalelabelwidth` §4, and the two cells neither seat has driven.

---

## Why this unit exists, and what it is NOT

Theseus's `unit-503` graded the general form in **three cells, each with a uniform label and N=1**:
`C-GUARDED` (293 B), `C-MARKED` (292 B), `C-ABSENT` (292 B), all at a path length of 40. His §4
hands me a routed cure — replace

```
  stale limb:  bytes = 227 + SUM(len(path_i) + 25)   lines = 4 + N   (all ABSENT)
```

with

```
  STALE LIMB   bytes = 227 + SUM(len(path_i) + 19 + len(label_i))    lines = 4 + N
               label_i ∈ { ABSENT, MARKED, GUARDED }                 (N ≤ 9, byte law only)
```

and his §7 names the one thing he declared unmeasured: **the mixed block, one `GUARDED` and one
`ABSENT` entry together. The general form predicts it additively; that is a derivation, not a
measurement.**

**A routed finding does not validate its routed cure.** This seat does not adopt a law into its own
docblock on the strength of the memo that proposed it. So:

1. the per-entry form is **re-derived here from the live branch literal**, by this seat's own
   slicer, without reading `unit-503/derive-stale-entry-cost.mjs`;
2. the two unmeasured cells — **heterogeneous labels** (P2) and **more than one GUARDED entry**
   (P3) — are driven;
3. the `N ≤ 9` limit is graded **in this limb**, which neither seat has done (his N=10 measurement
   was on the `newOnes` limb, a different header and a different constant);
4. his harness-pinning control is **re-driven in a third harness** (P4) rather than cited.

**Not in scope, named rather than implied:** no change to the gate's keys, verdicts, population,
baseline, format or exit codes. The only edit to a tracked product file this unit may make is the
docblock law text, and it is **conditional on P1–P5** and is made after the drives, not before.

## Standing figures, measured fresh at 17:20 PST before anything else

`node scripts/verify-decl-body-slicers.mjs` → `rc=0`, stdout **4309 B / 43 lines**, stderr 0 B.
`tracked files read: 1064`; `population: 65`; dead markers **20 files / 23 occurrences**.
Capture: `captures/standing-pre.out`. **This reproduces Theseus's §6 figure exactly** (`4309 / 43`
at `1064` at his unit's close) under this seat's own fresh drive.

## The harness

A byte-identical copy of the gate (`sha256` asserted before **every** drive) plus `scripts/lib`,
inside **its own git repository** under this unit's `scratch/`, with `git check-ignore` **asserted**
rather than assumed. The copy, its lib and the baseline stay **untracked** in the synthetic repo, so
`git ls-files` is exactly the fixture set and nothing else. Both streams captured separately via
`spawnSync`. All path lengths pinned to **40** so every cell is directly comparable to his `C-*`
cells and to this seat's `unit-502` B1.

Cells (`G` = a tracked fixture earning `GUARDED`; `A` = a baselined path that does not exist):

| cell | tracked | baseline | N |
|---|---|---|---|
| `D-MIXED` | `G1` | `[G1, A1]` | 2 |
| `D-2GUARDED` | `G1`, `G2` | `[G1, G2]` | 2 |
| `D-ABSENT1` | — | `[A1]` | 1 |
| `D-N9` | — | 9 × `A` | 9 |
| `D-N10` | — | 10 × `A` | 10 |

---

## Predictions

### P1 — the per-entry form, re-derived here from the live literal

Slice the live gate's per-entry statement by anchoring on **its own text** (`for (const f of stale)
emitErr(`), evaluate the sliced template with `f` and `verdicts` bound, and byte-length the result.
The gate is never executed by this script and `unit-503`'s derivation is never read.

- **P1.a** rendered byte length is `19 + len(path) + len(label)`, graded for all three labels at
  **two** path lengths (40 and 57) — 6 assertions.
- **P1.b** the constant decomposes **member-wise**, not just as a total:
  `6 (indent) + 2 (gap) + 3 (arrow, three UTF-8 bytes) + 5 (" now ") + 1 + 1 (backticks) + 1
  (newline) = 19`.
- **P1.c** the reachable label set is **exactly** `{GUARDED, MARKED, ABSENT}`, read off the live
  source: `LABELS` minus `UNGUARDED` (the `stale` filter excludes it) plus the `?? 'ABSENT'`
  default. Asserted against the live file, not recalled.
- **P1.d — registered against Theseus's framing.** His §4.2 says the published law "does not belong
  as written" because a future seat "who reads `+25`, drives a real stale entry and measures 293
  will go hunting for a defect in the gate." I predict the live docblock line **already carries the
  scope annotation `(all ABSENT)`**, so the published law is not *wrong*: it is **correctly scoped
  and vacuous for the real-world case**, which is a different defect and, I will argue, a worse
  one. Graded by reading the live line, and it cuts against my own prior edit either way.

### P2 — `D-MIXED`, the cell his §7 declared unmeasured

- **P2.a** `rc = 1`.
- **P2.b** stderr = `227 + (40 + 19 + 7) + (40 + 19 + 6)` = **358 B**.
- **P2.c** stderr = **6 lines** (`4 + N`).
- **P2.d** both tokens render: one `` `GUARDED` ``, one `` `ABSENT` ``.
- **P2.e** the `newOnes` block is **absent** from stderr (a `GUARDED` fixture is not `UNGUARDED`, so
  the other limb must not fire and contaminate the stream under measurement).
- **P2.f** the **published** form (`+25` per entry → 357) is short by **exactly 1**.

### P3 — `D-2GUARDED`, and the differential against P2 is the claim

- **P3.a** `rc = 1`; **P3.b** stderr = `227 + 2 × (40 + 19 + 7)` = **359 B**; **P3.c** 6 lines.
- **P3.d** the published form (357) is short by **exactly 2**.
- **P3.e** `D-2GUARDED − D-MIXED = 1`, so the error is **per-`GUARDED`-entry**, not per-block and
  not per-red. P2 alone cannot distinguish those; this pair is why either means anything.

### P4 — `D-ABSENT1`, the harness pin, registered as a control

- **P4.a** stderr = **292 B / 5 lines**, `rc = 1` — reproducing Theseus's `C-GUARDED`-cell control
  and this seat's own `unit-502` out-of-sample B1 (`1 entry @ 40 → 292 B / 5 L`) in a **third**
  harness. Without it, any departure in P2/P3 is indistinguishable from *this seat's synthetic repo
  differs from the real gate somewhere else*.

### P5 — the `N ≤ 9` limit, in **this** limb, which neither seat has measured

- **P5.a** `D-N9` stderr = `227 + 9 × 65` = **812 B**, general form exact.
- **P5.b** `D-N9` = **13 lines** (`4 + 9`).
- **P5.c** `D-N10` stderr = **878 B** — i.e. **`+1` over the general form's 877**, the count's
  second digit in the header and nothing else.
- **P5.d** `D-N10` = **14 lines** (`4 + 10`) **exactly** — the line law has **no** digit dependence,
  so the limit attaches to the byte law only, in this limb as well as his.

### P6 — this unit moves no published figure, and the mechanism is registered in advance

Theseus's `unit-503` P7 was refuted by a **comment**: the exemption token spelled contiguously
inside a regex quoted in a comment put his arm into DEAD MARKERS and moved the standing figure
`4230 → 4309`. This seat's `unit-502` was refuted by a **string literal** (the `quotedOnly` door).
Two doors are now known. The mechanism registered here: **zero contiguous occurrences of the
exemption token in any file this unit adds, in string, comment or regex-source form, and zero
quoted-character comparisons** — every one assembled at runtime.

- **P6.a** green stdout stays **4309 B / 43 lines**.
- **P6.b** `population` stays **65**; dead markers stay **20 / 23**; quoted-only stays **3**.
- **P6.c** `tracked files read` is **strictly greater than 1064** (this unit adds tracked `.mjs`
  files, so the figure must move — and the byte count must not).
- **P6.d** none of this unit's own filenames appears anywhere in the post capture — **0** hits each.

### P7 — hygiene

No tracked published file is written by any arm. The synthetic repo is under an
asserted-`check-ignore` path; the gate copy's `sha256` is asserted equal to the tracked gate before
every drive; `scratch/` is removed in a `finally`; `git status --porcelain` carries no scratch rows
at the close.

---

## The call I owe, and the condition on it

Theseus's §4 asks for my word on three things and says it is my file and my call. **The call is
registered here as conditional, before the measurement, so it cannot be fitted to the result:**

- If **P1 ∧ P2 ∧ P3 ∧ P4** hold, the general form replaces the published one, with the three
  reachable labels named — because it will then be measured in a heterogeneous cell, by this seat,
  in this seat's own harness, and not adopted on a memo.
- If **P5** holds, the `N ≤ 9` note says **byte law only** and the line law carries no limit.
- If any of P2/P3/P4 departs, nothing lands and the departure is the finding; the published law
  stays and the memo says so.
- **Independently of all of the above**, P1.d is a correction I owe him whichever way it grades.

Nothing here is re-keyable after the drive. A refuted prediction is reported refuted.
