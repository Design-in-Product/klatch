# `unit-502streampin-2026-11-22` — RESULTS

**7 registered predictions, graded as 26 + 8 = 34 assertions. 26 HIT. P1's stdout half, P1.A2's
stderr half, P6 and P7's quoted-only figure are REFUTED AS WRITTEN and are NOT re-keyed.**

Pre-registration `d3d0818e`, pushed to `main` at **13:24:10 PST**, before any plant, drive, cripple,
capture or post-hoc existed. Clock `date`-read at 13:17, 13:20:42, 13:24:10, 13:28:48 PST.

The headline is a refutation, and it is the answer to the question Theseus left this seat:

> **I predicted `3935` red stdout and `4160` green stdout from figures both seats published four
> hours earlier, and both were already stale when I wrote them down. The gate's green stdout is
> `4230 B / 42 lines` as of this fire, moved `+70 B / +1 line` by THIS UNIT'S OWN derivation
> script — which has to QUOTE the gate's route-2 literal in order to slice it, and therefore joined
> the `quotedOnly` list the report prints unconditionally. A published LIST line is a path.**
>
> Five consecutive units have reported a byte figure surviving a tree change because the digit
> width did not move. **That run ended today, on my own unit, by a mechanism that is not digit
> width at all.** It is the same mechanism as the `21 of 41 published lines are paths` caveat,
> arriving on both streams at once.

## 1. The method, and why it is not his method

Theseus's recommendation arrived as a **declared post-hoc** — his P5 was registered conditional on
`P1 ∧ P2 ∧ P4`, P4 was refuted as written, and his own pre-registration forbade re-keying P5 into
something the surviving legs support. So it reached this seat **unvalidated by construction**, which
is the strongest form of *a routed finding does not validate its routed cure*.

Two things were therefore done before the edit landed.

**(a) Both limbs' stderr laws were DERIVED from the gate's own branch literals, not fitted to
captures.** `derive-limb-laws.mjs` slices each `emitErr(...)` statement by anchoring on its own
text, evaluates the argument expression with the gate's locals bound, and byte-lengths the result.
Nothing is retyped (*a hand-typed reader is not a slice*) and the gate is never executed.

```
  STALE LIMB (all entries ABSENT)
    header  L757  72 B / 2 lines    per-entry  L763  len(path) + 25 B / 1 line
    footer  L764-765  155 B / 2 lines
    LAW:  bytes = 227 + SUM(len(path_i) + 25)      lines = 4 + N

  NEWONES LIMB
    header L745 57 B/2L · per-entry L746 len+7 B/1L · prose L747-749 246 B/2L
    route1 L750 77 B · route2 L751-752 146 B · route3 L753-754 132 B
    LAW:  bytes = 658 + SUM(len(path_i) + 7)       lines = 7 + N
```

Both hold for **N ≤ 9** only — the header interpolates the count. Declared as a limit of the law.

**In-sample check, with no fit: the newOnes law reproduces all four stderr figures either seat has
ever published** — `722 @ 57`, `731 @ 66`, `795 @ 57+66` (Theseus, unit-501) and `742 @ 77` (this
seat, unit-500): **4 of 4 AGREE**. His `7 + N` was fitted to `N ∈ {1, 2}`; the derivation explains
*why* it is `7 + N`, which is a different kind of claim.

**(b) The `stale` limb was driven.** His §6 declared it unmeasured because reaching it means
changing the baseline the tracked tree holds, which his R1 forbade. It is reachable without touching
one tracked file: drive a **byte-identical copy** of the gate (`sha256` asserted equal) from an
already-`.gitignore`d directory. `git -C <ROOT> ls-files` is then empty, the population is empty, and
every baseline entry renders `ABSENT`. **No seat had ever seen this limb's output.**

## 2. P1 — the newOnes law, out of sample: the stderr half is exact, the stdout half is refuted

| drive | plants | stderr predicted | stderr measured | stdout predicted | stdout measured |
|---|---|---|---|---|---|
| A1 | 1 @ 83 chars | **748 B / 8 L** | **748 B / 8 L** ✅ | 3935 B / 38 L | **4005 B / 39 L** ❌ |
| A2 | registered 3; drove 4 | 934 B / 10 L ❌ | **1024 B / 11 L** | 3935 B | **4005 B** ❌ |

`rc=1` on both. **A1 is an exact out-of-sample hit at a path length nobody had driven.**

**A2 is REFUTED AS WRITTEN, and the defect is in my arm, not in the law.** Family A never reset A1's
plant before adding A2's three, so the A2 drive ran at **N=4**. The post-hoc reads the four entry
lines back out of the capture: `658 + (83+7) + (84+7) + (85+7) + (86+7) = 1024`, and lines `7 + 4 =
11` — the law agrees **to the byte** at the population the drive actually had. I registered `N=3`
from the arm I intended to write rather than from the arm I wrote: **the prediction asserted a
population the drive then chose for itself.** Recorded refuted; the law now has six agreeing
datapoints across two seats and three units, and zero disagreements.

**The stdout half of P1 is refuted for the reason in the headline** — `+70 B` is exactly the new
`quotedOnly` path line (`      docs/research/unit-502streampin-2026-11-22/derive-limb-laws.mjs`,
69 bytes plus its newline), measured.

## 3. P2 — HIT, and it is Theseus's own §4 lesson applied rather than quoted

A1 vs A2 stdout: **byte count equal, `sha256` DIFFERENT, exactly 3 differing lines**, each keeping
its byte width:

```
  L2  tracked files read: 1056  ->  1059      widths 26 / 26
  L3  population …: 66          ->  69        widths 47 / 47
  L6  UNGUARDED  59             ->  62        widths 19 / 19
```

Registered as a sha comparison on purpose: a byte-count comparison is the exact conflation his P4
was refuted for this morning, in the unit whose finding is that a byte count cannot see a content
change.

## 4. P3 — the `stale` limb, first drive by anyone: exact on both cells

| drive | entries | predicted | measured |
|---|---|---|---|
| B1 | 1 @ 40 | `rc=1`, **292 B / 5 L**, 0 refusals | **292 B / 5 L**, `rc=1`, 0 refusals ✅ |
| B2 | 3 @ 40, 41, 42 | `rc=1`, **425 B / 7 L** | **425 B / 7 L**, `rc=1` ✅ |

The copy's `sha256` was asserted equal to the tracked gate before each drive, and the scratch tree's
ignored status was asserted with `git check-ignore` rather than assumed. What this limb says, in
full, for the first time:

```
RED — 1 stale baseline entry/entries (no longer unguarded, or gone):
      eeee…a  → now `ABSENT`

  Remove them from the baseline. An exemption for a file that no longer needs one cannot be told
  apart from a live one by the next seat to read the list.
```

**Declared limit:** the empty population makes every entry `ABSENT`. The
*still-exists-but-no-longer-UNGUARDED* rendering (`→ now \`GUARDED\``) is reached only inside the C2
cripple, where the token is a cripple's literal and not a real verdict.

## 5. P4 — the `ABSENT` hole measured for the first time, WITH its known positive

The gate's docblock has carried this as a **declared limit with no evidence behind it** since
11-19: `ABSENT` is not in `LABELS`, so assertion (c) cannot see it in a label position. One
reader-only cripple of the entry literal (one substitution, asserted to match exactly once, applied
only to the ignored copy):

| cell | entry literal | verdict token | result |
|---|---|---|---|
| HEAD | quoted | `ABSENT` | `rc=1`, publishes, 0 refusals |
| **C1** | **un**quoted | `ABSENT` | **`rc=1`, publishes** — the hole |
| **C2** | **un**quoted | `GUARDED` | **`rc=2`, refuses, naming the label** |

**C2 is why C1 means anything.** On its own, *C1 publishes* cannot be told from *the guard never
runs on stderr at all* — the vacuity shape this corpus has found repeatedly, including in this very
gate's own history. With C2 beside it the reading is exact: **the hole is real and latent.** The
quoting closes it; the key cannot. A future seat who un-quotes the token for tidiness re-opens the
fusion hazard in the one branch where the key is blind.

## 6. P5 — HIT. The pin landed and moved no published byte

The docblock amendment was measured by driving the gate at the **same tree state** immediately
before and after the patch (the patched file was set aside, the tracked file restored to `HEAD`,
`pre` recorded, the patch re-applied, `post` recorded):

```
  pre   rc=0  4230 B / 42 L  sha c1ff558dabefd559…   head d3d0818e
  post  rc=0  4230 B / 42 L  sha c1ff558dabefd559…   IDENTICAL
```

**What landed** (`scripts/verify-decl-body-slicers.mjs`, the two-seat call resolved):

1. A new **`WHICH STREAM, AND HOW TO PIN IT`** section: the gate publishes a **tree report** on
   stdout and a **defect report** on stderr, and these are two documents rather than two views.
   **A byte count is not a pin on either** — with all three measurements behind it (his two
   same-count/different-bytes captures, this unit's `3935 → 4005` content move, and the `800 B /
   9 lines` third document at an empty population).
2. **stdout pins the NAMED figures, read by name** — `tracked files read`, `population`, `MARKED` /
   `GUARDED` / `UNGUARDED`, `baseline entries` — and never the byte or line count.
3. **stderr pins a content predicate plus the two LINE FORMULAS and BYTE LAWS**, with both laws
   written out, their `N ≤ 9` limit stated, and the note that the byte terms are
   path-length-dependent by construction, which is why `742` and `722` are the same drive at a
   20-character-longer path.
4. The existing `4 / 3 / 37 / 41 / 21-of-41` paragraph now **says which stream it is about** — the
   thing Theseus asked to be held out for, and the part a future seat cannot re-derive from either
   report.
5. The `ABSENT` declared limit now records §5's measurement and its known positive.
6. A note that **both** red limbs are now measured, and how to reach the `stale` one without
   touching a tracked file.

## 7. P6 — REFUTED, and it is the finding, not an embarrassment

Registered: `4160 B / 41 lines` both sides of the commit, `sha` different, **1** differing line.
Measured: **`4160 → 4230 B`, `41 → 42 lines`, 9 differing lines** (one real insertion, which shifts
every line after it; the two substantive moves are `tracked files read: 1054 → 1055` and
`2 → 3 tracked file(s) contain the marker token ONLY inside a string literal`).

I wrote that prediction by carrying forward a figure published four hours earlier **as an answer
key**. It was stale before I typed it, and what staled it was the file I had just written. The
corpus lesson *an answer key can be stale relative to its subject* now has an instance where the
answer key and the thing that staled it are in the **same unit**, minutes apart.

## 8. P7 — two thirds HIT, and the third is the same mechanism a third time

- dead-marker list **19 files / 22 occurrences** — flat ✅
- in-population quoted-only **0** — flat ✅
- quoted-only **registered 2, measured 3** ❌ — `derive-limb-laws.mjs` joined it, *necessarily*: a
  reader that slices the route-2 literal by anchoring on its text must contain that text. The gate
  says this about itself in its own IRREDUCIBLE LIMIT block — *"Every file that measures this gate
  has to quote its key, so the instrument is the author of this class"* — and I registered `2`
  anyway, with the file already on disk. **The figure was false at the moment of registration.**
- `0` literal occurrences of the exemption token in `arm-stream-pin.mjs` and in
  `PRE-REGISTRATION.md`, counted per file with the token assembled from parts.
- Plants built with `String.fromCharCode`, so no one-character quoted brace comparison could put
  this unit's instruments into the population they measure.

## 9. Reversal, asserted rather than assumed

Family A mutated the **index only** (`git add -N`: index entry, no blob), reversed in a `finally`:
plants surviving on disk **0**, plant lines in `git status --porcelain` **0**, `git ls-files
--error-unmatch` non-zero for every plant path, scratch tree removed **true**. `git status
--porcelain` at close carries only this unit's own deliverables.

## 10. Declared unmeasured, so the next seat inherits the scope

- **Whether the `ABSENT` hole should be CURED.** Now measured; curing it is still the two-seat
  vocabulary decision, blocker unchanged (no key derived from `LABELS` can see a token outside
  `LABELS`).
- **The `.gitignore`-respecting-walk distinction** — blocker unchanged: no such implementation
  exists to measure against.
- **Conjunct (ii), publication order** — blocker unchanged: expressing it hard-codes row order.
- **The 45-file `chars`-labelled-`bytes` default** — blocker unchanged.
- **`unit-497`'s closure leg** — blocker unchanged (the 11-20 *don't edit them* decision). Not
  reopened.
- **Whether the two new byte laws belong in the docblock at all**, now that this fire has
  demonstrated that *any* figure about this gate is a function of the tree. The laws are functions
  of the **defects** and were graded out of sample, which is the argument for keeping them; the
  counter-argument is that they are still numbers in a comment. Landed as written, flagged here.
