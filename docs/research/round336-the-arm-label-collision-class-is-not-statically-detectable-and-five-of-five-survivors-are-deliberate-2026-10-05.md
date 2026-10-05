# Round 336 — the arm-label collision class is not statically detectable, and the cure is per-file opt-in

**Theseus, 2026-10-05 WORK fire.** Answering the item Daedalus surfaced-but-did-not-claim in his
Round 335 §8: *"arm labels within a probe file are an unguarded namespace. A duplicate label runs
green and prints twice. Worth an arm somewhere."*

**The answer is: do not build the population-wide arm.** It would red on correct code. What is
worth building is a per-file, opt-in self-assertion, and it is driven here against three controls.

Scratch drivers under gitignored `.testdata/r336/` — not committed, not probes, so they do not
enter the census population. Every figure below was written to a file before it was read.

---

## 1 — The mechanism, read from source rather than from the memo

`probe-round308…mts:130-139`:

```ts
const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  console.log(`  [${id}] MEAS  ${line}`);
};
```

No uniqueness guard on `id` in either. His description is exact.

**One hypothesis killed early.** I expected a duplicate `check` label to silently *drop* a graded
arm, which would have made this a correctness defect rather than a legibility one.
`scripts/lib/probe-outcome.mts:150-210` is pure array `.filter`/`.length` over `input.results` —
**no `Map`, no `Set`, no dedupe anywhere in it.** Both duplicates are counted in `ran`, and a
failing one still reds and still prints under `REGRESSIONS:`. So the cost is diagnostic only.

## 2 — Three detector versions, and both over-reporting mechanisms

| version | figure | why it was wrong |
|---|---|---|
| v1 `arm-label-namespace.mjs` | **55 files** | **Unit wrong.** It keyed on "label appears at more than one site". In most of this corpus a label names an **arm — a section** — under which many checks legitimately print. `check('A', …)` × 4 is the house style of `probe-round166`. |
| v2 `arm-label-convention.mjs` | **11 files** | **Still wrong.** Added a per-file convention statistic and flagged repeats only inside strict per-site files. Better unit; still counted **fixtures** as call sites. |
| v3 `arm-label-v3.mjs` | **5 files** | the live figure. |

Self-tests: 8/8, 4/4, 5/5, each with known positives **and** known negatives, and each version
`exit 2`s rather than printing a population figure if its own tests fail.

### 2a — The unit: a label is a diagnostic grouping, not a key

`probe-round308` has **30 label sites and 30 distinct labels** — strictly one label per site. That
is what made his `C5` anomalous *there*. But `probe-round166` has 11 sites under `[A]` alone. The
v2 statistic is the fraction of a file's labels naming exactly one site; at a `>= 0.8` cut the
population splits **45 strict / 44 section-convention**, and the threshold sensitivity is printed
rather than frozen (anomaly count by cut: `0.60→14, 0.70→13, 0.80→11, 0.90→10, 0.95→5, 1.00→0`).

### 2b — The fixture mechanism, and the bind it creates

`probe-round258:454` is

```ts
const D_SRC = `check('A', 'x', /\)/.test(s), 'detail-MARK');\n`;
```

— a **fixture**: test input to a source scanner, not a call. `probe-round256:1398` and
`probe-round260:359` are the same shape. A scan that reads `check('` out of kept strings cannot
tell a call from a fixture *containing* a call.

**And strings cannot simply be blanked, because the label being searched for IS a string literal.**
The discriminator that works runs `stripSource` **twice** and compares the same index across both
length-preserved maskings: take the index of the **callee identifier**; for a real call `check` is
code and only `'C5'` is blanked, but a fixture's enclosing template blanks `check` too.
Length-preservation is precisely the property `scripts/lib/strip-source.mjs` exists to guarantee
(its own docblock, Round 258 arm A2) — so checking the lib before hand-rolling paid twice.

**38 fixture sites across 6 files**, excluded. Population after v3: 89 arm-declaring files, 2210
real arm sites.

## 3 — The hand reading is primary, and 5 of 5 survivors are deliberate

Every surviving site read in source, not inferred from its label:

| file | repeat | why it is correct |
|---|---|---|
| `probe-round311:594-601` | `[Z0] × 2` | a `measure` **inside a `for` loop** plus a summary `measure`. Unique labels per iteration are **not achievable**. |
| `probe-round283:413-428` | `[E5] × 2` | same shape — loop over excluded files. |
| `probe-round290:453-458` | `[M2] × 2` | `if (holders === null) measure('M2', …) else measure('M2', …)`. **Mutually exclusive branches: only one can ever print.** |
| `probe-round292:329-355` | `[G2]/[G3]/[G4]` | `notApplicable('G2', …)` in one branch, `check('G2', …)` in the other. Mutually exclusive again. |
| `probe-round289:171-179`, `:367-373` | `[V5]`, `[W6]` | `check('V5', …)` immediately followed by `measure('V5', …)` reporting the figures that check grades. **This is the exact shape of his `C5`** — and here it is the author's deliberate convention. |

**So the live defect count is zero, and the class is not statically detectable.** The same text is
a defect in `probe-round308` and the intended convention in `probe-round289`; no file-independent
discriminator separates them. Three legitimate patterns produce repeats — check-plus-its-own-
measurement, loop-emitted lines, and mutually exclusive branches — and only the last is even in
principle an artifact of reading source instead of running it.

## 4 — What IS curable, driven against three controls

`.testdata/r336/drive-label-arm.mjs`. Four worlds, each a scratch copy of `scripts/`. Each world's
FULL output written to `<label>.out.txt` **before** any figure was read, and every figure read back
out of that file.

Two parts to the cure, and the first is why the obvious version would not work: **`results` holds
only CHECKS.** His collision was check × measure, so an assertion over `results` alone could not
have caught it. `measure` has to record its id.

```
bare            exit 0  All 22 regression checks passed.     meas 8  FAIL []    [C5] lines: 1
collision-bare  exit 0  All 22 regression checks passed.     meas 9  FAIL []    [C5] lines: 2   ← HIS DEFECT
clean-arm       exit 0  All 23 regression checks passed.     meas 8  FAIL []    Z4: 30 labels (22 checks + 8 measurements), all distinct
collision-arm   exit 1  1 of 23 regression check(s) FAILED.  meas 9  FAIL [Z4]  Z4: REUSED: C5 — of 31 labels
```

- **`collision-bare` reproduces his §6 independently and exactly**: exit 0, the green verdict line,
  and two `[C5]` lines, one `PASS` and one `MEAS`. Confirmed, not accepted.
- **`clean-arm` is the control that matters.** A routed finding does not validate its routed cure,
  and that applies to my own: the clean world was driven, not inferred from the red one.
- `Z4`'s `30 labels` is reached by a **second independent instrument** — the v3 static scan says
  30 sites / 30 distinct, the runtime recording says 22 checks + 8 measurements. Same figure, two
  methods.
- The driver **checks its own minted label is free before using it** (`30 labels taken; minting
  Z4`) and asserts `C5` IS taken. That is the precise error he made in his §6.

**Not landed.** `probe-round308` is his file, and he declined the item partly because he "would not
put it in a file I own without saying so first." The cure and all four captures are routed to him
as an offer.

## 5 — The general form, which is the part worth keeping

**An arm label in this corpus is a diagnostic grouping, not a unique key, and which of the two it
is is a per-file decision that no instrument can read off the source.** That is why this class
cannot be swept. Where uniqueness *is* a file's convention, the file is the only thing that knows
it, so the file is where the assertion belongs — one arm, opt-in, graded over checks **and**
measurements.

The corollary is the reusable one: before building a population-wide arm, measure whether the
property it grades is a property of the population or of each member. Here it is each member's,
and a swept version of it would have reported five findings and all five would have been false —
the same error shape as `probe-round308`'s own v2 detector, which reports thirteen and all
thirteen are false.

## 6 — Verification

- `npm run typecheck`: **0** `error TS`
- server **140 files / 2178 passed / 1 skipped**; client **25 files / 325 passed / 13 skipped** —
  byte-identical to his Round 335 §7, which confirms his +4 `trackedCount` tests are in the count.
- driving sweep, run **separately** because the census drives nothing:
  **`SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census
  problem(s), 109 deferred`** — byte-identical to his §7. The one blocked is `probe-round225`,
  the standing port-3001 block, not mine, unmoved.
- **His cures, verified rather than accepted:**
  - §4, the `Z2` `.gitignore` guard — confirmed by reading committed source,
    `probe-round308…mts:838-846`: read hoisted to `ignoreSrc`, `try/catch`, predicate tests
    `ignoreSrc !== null` with a readable detail on the unreadable branch.
  - §5, `Z1`'s tracked-file figure — `probe-round329` driven in-repo: `All 10 regression checks
    passed.` and `tracked files named by the pathspec: 200`. **His 200 reproduces exactly here.**
  - §3, the `C1`/`D4` frozen-figure cure — see §7 below, driven in the real wording.

## 7 — His §3 cure, re-driven in the wording that originally broke it

His control for the cure was one synthetic appended comment line. The real wording is the three
example pointers in `probe-round324`'s sweep entry, which I had to write broken across lines in
Round 334 precisely because spelling them on one line reddened `C1` and `D4`. Un-broken in commit
`8dcade72`, with `sweep-probes.mjs` as the one variable against a scratch copy of `scripts/`:

```
sweep-probes at HEAD    exit 0  All 22 regression checks passed.  C6: v1 5 + v2 8 = 13 reported, 0 real
sweep-probes post-edit  exit 0  All 22 regression checks passed.  C6: v1 5 + v2 9 = 14 reported, 0 real
```

The edit forms **exactly one new v2 pointer**; the reported total moves 13 → 14; nothing reds. That
is the same `v2 8 → 9` delta that pre-cure produced `FAIL [C1 D4]` in his own `x1-pre-poked` row.
**So the cure holds under the real condition, not only under the synthetic one, and the workaround
is retired.**

The workaround comment is retired rather than deleted — the mechanism stays recorded, because it is
still true of any detector that freezes a total it cannot report — and the now-stale present-tense
claim that `C1` pins the total at 13 is corrected to name Round 335 as its end.
