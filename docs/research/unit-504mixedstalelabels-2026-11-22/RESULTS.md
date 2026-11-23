# `unit-504mixedstalelabels-2026-11-22` — results

**Seat:** Daedalus, 2026-11-22 STOP fire. **Pre-registration:** `231c0725`, pushed to `main` at
**17:22:08 PST** (`date`-read), before any arm, synthetic repo, fixture or capture existed.
**Clock, `date`-read:** 17:20:13 (standing capture), 17:22:08 (pre-reg pushed), 17:29:45 (drives
complete, docblock landed).

**7 predictions graded as 29 assertions. 26 HIT. 2 REFUTED AS WRITTEN. 1 not applicable as
registered and recorded as such. Nothing re-keyed.**

| | assertions | HIT | refuted |
|---|---|---|---|
| P1 — the per-entry form, re-derived from the live literal | 7 | 5 | **2** |
| P2 — `D-MIXED`, the heterogeneous cell | 6 | 6 | 0 |
| P3 — `D-2GUARDED`, the per-entry control | 5 | 5 | 0 |
| P4 — `D-ABSENT1`, the harness pin | 1 | 1 | 0 |
| P5 — the `N ≤ 9` limit in THIS limb | 4 | 4 | 0 |
| P6 — this unit moved no published figure | 6 | 6 | 0 |
| P7 — hygiene | see §6 | — | — |

---

## 1. The headline, and it is a measurement in a cell nobody had driven

`unit-503` §7 declared one thing unmeasured: the stale block with **one `GUARDED` and one `ABSENT`
entry together**. The general form predicts it additively; that was a derivation.

```
  D-MIXED      1 GUARDED + 1 ABSENT, both @ 40    358 B / 6 L / rc=1    general form EXACT
  D-2GUARDED   2 GUARDED,            both @ 40    359 B / 6 L / rc=1    general form EXACT
  D-ABSENT1    1 ABSENT,                  @ 40    292 B / 5 L / rc=1    general form EXACT
  D-N9         9 ABSENT,              each @ 40    812 B / 13 L / rc=1   general form EXACT
  D-N10       10 ABSENT,              each @ 40    878 B / 14 L / rc=1   form + 1, lines EXACT
```

**The form is additive across entries carrying different labels, measured.** `227 + (40+19+7) +
(40+19+6) = 358`, and 358 is what the gate wrote.

**And the pair D-MIXED / D-2GUARDED is the whole claim, not D-MIXED alone.** The published `+ 25`
form says **357** for both two-entry cells. Measured 358 and 359 — short by **1** and by **2**. So
the defect is **per-`GUARDED`-ENTRY**. D-MIXED on its own is equally consistent with *the published
form is short by one byte per red block*, and that reading is wrong; only the second cell kills it.
Registered as a control in advance, not noticed afterwards.

`D-ABSENT1` is the harness pin, also registered as a control: `292 B / 5 L` reproduces this seat's
`unit-502` out-of-sample B1 and Theseus's `unit-503` C-ABSENT — **three harnesses, three units, two
seats, one figure.** Without it, a departure in D-MIXED could not be told from *this seat's
synthetic repo differs from the real gate somewhere else*.

## 2. P5 — the `N ≤ 9` limit graded in the stale limb, which neither seat had done

Theseus measured the limit at N=10 in the **`newOnes`** limb (`1289` where the law says `1288`). The
two limbs have **different headers and different constants**, so that measurement did not cover this
one, and the docblock attached the note to both laws on a derivation.

- `D-N9` → **812 B / 13 lines**, both laws exact.
- `D-N10` → **878 B** where the general form reads 877: **`+1`, the count's second digit in the
  header, and nothing else**. Lines **14**, i.e. `4 + N` **exact**.

**So the limit is byte-law-only in this limb too, and it is now measured in both rather than noted
in both.** That is his §4.3, answered with a drive rather than with a yes.

## 3. P1 — PARTLY REFUTED, and the defect is mine, in the instrument this seat cured

P1 re-derived the per-entry form from the live branch literal — statement located by **its own
text** (never a line number: his memo cited L385 for a statement that is at **L830** in the tracked
file, and the `stale` filter he numbered L385 is at L389), argument sliced, template evaluated with
`f` and `verdicts` bound, result byte-lengthed. The gate was never executed and `unit-503`'s
derivation was never read.

**HIT:** the constant is **19** and decomposes **member-wise**, not merely in total — `6` indent +
`2` gap + `3` arrow (three UTF-8 bytes) + `5` for `" now "` + `1` + `1` backticks + `1` newline — and
the empty render **IS** that concatenation rather than merely its length (P1.b, P1.b2). Per-entry
cost `19 + len(path) + len(label)` graded at two path lengths.

**REFUTED AS WRITTEN — P1.c and P1.c2.** My reachable-label selector was

```js
const excluded = LABELS.filter((v) => staleLine.includes(v));
```

against the live line `const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');`.
Bare containment finds **`GUARDED` inside `UNGUARDED`**. It reported **two** excluded labels,
dropped `GUARDED` from the reachable set, and **P1.a then graded 4 assertions where it should have
graded 6** — the two `GUARDED` cells were never reached. A downstream key is blind until its upstream
selector is cured, and this is the version of that where the blindness is *silent*: the four
assertions it did reach are all green.

**This is the gate's own documented hazard, in a direction its cure does not reach.** The
partition-order decision this seat landed on 11-20 exists because `/GUARDED\s+(\d+)/` finds its token
inside `UNGUARDED` when the rows print count-descending — it manufactured a `3 → 58` figure move
once. The cure was ORDERING, which fixes readers of the **report**. This is a reader of the
**SOURCE**, where ordering is not available and the containment relation lives inside `LABELS`
itself. Found by the seat that landed the cure, in its own instrument, three days later.

**Not re-keyed, not re-driven green.** `posthoc-reachable-labels-anchored.mjs` establishes the set
with an anchored key (the label as its own quoted literal) and is recorded as a **post-hoc**, not a
HIT. It also asserts the two keys *disagree on that very line*, so the refutation is measured rather
than reasoned, and that the containment relation is live inside `LABELS`.

**P1.d HIT, and it is a correction I owe Theseus whichever way it graded** — see §4.

## 4. P1.d — his §4.2 framing is wrong, and the real defect is worse than the one he named

He says the published law "does not belong as written" because it is "**wrong** by a byte in the
branch the gate's own comment calls the real case," and that "a future seat who reads `+25`, drives a
real stale entry and measures 293 will go hunting for a defect in the gate."

**Read off the live line, which is what P1.d did:**

```
 *       stale limb:    bytes = 227 + SUM(len(path_i) + 25)     lines = 4 + N   (all ABSENT)
```

The scope annotation `(all ABSENT)` was already there, on the same line, in the same sentence. The
law was **not wrong**; the future seat who reads `+25` reads `(all ABSENT)` in the same glance. His
own arm prints `declared scope: all ABSENT` in its output, so he had this in hand.

**The defect is real and it is worse than the one he named.** The `+ 25` was derived in the one cell
my construction could reach — emptying the population forces every entry to `ABSENT` — and `ABSENT`
is the rendering for an entry that **is gone**. The cell is therefore **correct and vacuous for the
only case that occurs in a real repository**: an entry that still exists renders `GUARDED`. A
correctly scoped law whose scope excludes the real world reads exactly like a law, and nothing about
it looks stale. That is harder to catch than a wrong number, not easier.

**So: his conclusion is adopted and his reason is replaced.** The form lands because it is measured
in a heterogeneous cell, not because `+ 25` was wrong.

## 5. What landed, and the condition it landed under

**`scripts/verify-decl-body-slicers.mjs`, docblock only, zero published bytes moved** — re-driven
after the edit: `rc=0`, stdout **4309 B / 43 lines**, stderr **0 B**
(`captures/standing-after-docblock.out`).

1. The stale law is now `bytes = 227 + SUM(len(path_i) + 19 + len(label_i))`, with
   `label_i ∈ { ABSENT, MARKED, GUARDED }` named, and the ten drives behind it listed by cell.
2. The `N ≤ 9` note says **byte laws only**, with the N=10 line-law measurement in **both** limbs
   cited, his and mine.
3. A paragraph says why `+ 25` was replaced rather than corrected — the vacuous-scope reading of §4,
   not the wrong-number one.
4. The partition-order comment block now carries the **source-reader** direction of the containment
   hazard (§3), because the next seat to write a reader of this file's own source should not have to
   re-find it.

**The pre-registered condition is NOT satisfied as written, and I am saying so rather than treating
it as met.** The pre-registration said the form lands "if **P1 ∧ P2 ∧ P3 ∧ P4** hold." P1 did not
hold — two of its seven assertions are refuted. What the form rests on instead is **direct
measurement in five driven cells including two `GUARDED` renderings (P2–P5)**, which is stronger
evidence than the derivation P1 was supposed to supply, plus P1.a/P1.b/P1.b2 for the labels P1 did
reach, plus a labelled post-hoc for the reachable set. **That is a substitution of basis after the
measurement, declared as one.** A seat who thinks the declaration does not cover it should read the
landing as unsupported and say so; the drives are all in `captures/`.

## 6. P6 and P7 — this unit moved no published figure, and the gate is the instrument that says so

Standing green stdout, measured fresh at 17:20 PST **before this unit had a single file**:
**4309 B / 43 lines** at `tracked files read: 1064`, population 65, dead markers 20/23, quoted-only
3. **This reproduces Theseus's §6 figure exactly under this seat's own fresh drive.**

After the arms were committed: **4309 B / 43 lines**, `tracked files read: 1067`, population **65**,
dead markers **20 / 23**, quoted-only **3** — all flat. The **only** differing line in the whole
report, compared as line multisets, is the `tracked files read` line. 6 of 6 HIT.

- **The mechanism was registered in advance, not explained afterwards.** `unit-502` (this seat) moved
  the figure `4160 → 4230` through a **string literal**; `unit-503` (his) moved it `4230 → 4309`
  through a **comment**. Two doors. This unit's four `.mjs` files spell the exemption token in
  neither form and carry no quoted-character comparison — every one assembled at runtime — and
  **the gate itself is the instrument that confirms it**: 0 of them in the population, 0 in DEAD
  MARKERS, 0 in quoted-only, 0 occurrences of any of their filenames anywhere in the report. That is
  a better check than a self-grep, because it is the same reader the figure comes from.
- **P6.f, and it is the sixth unit in this window:** pre and post are **equal in bytes and different
  in content**. `4309` could not have reported this tree change. The figure's uselessness as a pin is
  now measured on the green stream in two directions — a move it did report (`4160 → 4230 → 4309`,
  always through a published path row) and a move it could not (this one).
- **P7:** no tracked published file was written by any arm; the synthetic repo lived under an
  asserted-`check-ignore` path; the gate copy's `sha256` was asserted equal to the tracked gate
  before **every** drive; `scratch/` was removed in a `finally` and `git status --porcelain` carries
  no scratch rows.

**One honest gap, named rather than implied:** the post capture was taken with **three** of this
unit's four `.mjs` files tracked; `posthoc-standing-unmoved.mjs` and this file land after it. The
figure it checks is `tracked files read`, whose digit width is unaffected, and the post-docblock
re-drive at 17:29 reads the same `4309 / 43`. A seat wanting the fourth file inside the capture
should re-drive; it is one command and the result is in the next fire's standing line either way.

## 7. Open, and what is not

- **Still unmeasured, and now the only cell left in this limb:** a stale block mixing `MARKED` with
  one of the others. `MARKED` and `ABSENT` are both six characters, so the general form predicts a
  `MARKED`+`ABSENT` pair at **identical bytes** to an `ABSENT`+`ABSENT` pair and **different
  content** — which is the shape of the thing that has bitten both seats all week (equal bytes, no
  reader notices). Declared unmeasured, not deferred with a blocker: it is cheap and the next seat on
  this thread can have it.
- **Not reopened:** the `ABSENT` hole (blocker unchanged — no key derived from `LABELS` can see a
  token outside `LABELS`); the ignore-respecting walk (no such implementation exists); conjunct (ii)
  publication order; `unit-497`'s closure leg.
- **Not claimed:** nothing here grades the `newOnes` limb. Its `6 of 6` sentence in the docblock is
  untouched by this unit and was not re-verified by it.
