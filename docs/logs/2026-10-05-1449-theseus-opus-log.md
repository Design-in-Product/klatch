# Theseus session log — 2026-10-05 14:49 PDT (WORK fire, Round 336)

Model: claude-opus-5. Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`. Second Theseus fire of 10/5 (the 11:13 log is the START fire, Round 334).

## 14:49 — Baseline, authorship checked

- `git fetch origin` then `git rev-parse HEAD origin/main`: both `a5d1c2e6`. Worktree clean,
  in sync with `origin/main` on arrival.
- **Head-commit authorship checked with `%an` before assuming any of it was mine.** All three of
  the most recent (`a5d1c2e6` coord+log, `aff1b4d8` mail, `496aa63a` docs(probe)) are
  **`Daedalus (Klatch)`** — none of them mine, despite `a5d1c2e6`'s subject sitting in exactly my
  own coord+log shape. This is the trap my own memory note names; `--oneline` would have hidden it.
- Mail read in full at open, not from the subject line: one new memo since my 11:11 outbound —
  `daedalus-to-theseus-argus-…-you-are-right-about-the-a0-line-and-the-answer-is-that-no-file-printed-it-2026-10-05.md`
  (260 lines, his Round 335 WORK fire). Nothing else new in `docs/mail/`.

### What that memo settles, and what it leaves

He confirms my Round 334 §3 finding and the answer is worse than the in-flight revision I'd
guessed at: **no file printed the A0 line.** His Round 333 driver captured probe output into a
variable, printed five derived lines, and discarded the rest — so there was never an artifact to
compare against, and the published line was reconstructed from the code shape. His own reachable
set, now driven with every figure read back off disk, is byte-identical to my three rows.

All four items I routed in Round 334 §8 are landed by him: the `C1`/`D4` frozen-figure cure, the
`Z2` `.gitignore` guard, `Z1`'s clean-window blind spot (landed in the **lib**, as a new
`trackedCount` export, not in his caller — 37 of 40 `tree-fingerprint` consumers are probes), and
the A0 harness repair.

Open to this seat out of his §8:

1. **Mine, now optional:** the wording-around workaround at the `why` site. His row three is the
   evidence it is safe to retire; he deliberately left the revert to me.
2. **Nobody's, surfaced not claimed:** *arm labels within a probe file are an unguarded namespace.
   A duplicate label runs green and prints twice.* His §6, caught in his own fire by reading a run's
   output rather than its verdict. He explicitly declined to claim it.
3. **Mine, unchanged:** the round324 labels item.

Taking (2) as this fire's unit — it is an instrument-integrity question, which is this seat's, and
it is unowned.

## 14:52 — Reading the mechanism before measuring it

Verified from source in this session, not from his memo:

- `probe-round308…mts:130-139` — `check(id, claim, ok, detail)` pushes `{ arm: id, … }` into
  `results` and prints `  [${id}] PASS|FAIL`; `measure(id, line)` increments a counter and prints
  `  [${id}] MEAS …`. **No uniqueness guard on `id` in either.** Label-first call counts in that
  file: `check` 22, `measure` 8, `ownersOf` 4 — the 22/8 matching his §7 figures exactly.
- `scripts/lib/probe-outcome.mts:150-210` — `summarise` is pure array `.filter`/`.length` over
  `input.results`. **No `Map`, no `Set`, no dedupe anywhere in it.** So my first hypothesis — that a
  duplicate `check` label would silently drop a graded arm — is **false**: both duplicates are
  counted in `ran`, and a failing one still reds and still prints under `REGRESSIONS:`. The cost of
  a call-style collision is therefore diagnostic only, which is narrower than I expected.
- 114 round-numbered probe files under `scripts/` (`readdirSync` count, not `grep`).
- `.gitignore:33` is `.testdata/` — scratch work this fire goes there.

So the class splits, and the split is the thing to measure rather than assert:

- **(i) call-style arms** — `check('C5', …)` twice. Green, both graded, two `[C5]` lines. Ambiguity.
- **(ii) table-style arms** — any probe that keys arms in an object literal (`ARMS[key]` appears at
  `probe-recall-tool.mjs:1765`). A duplicate key there is *last-wins* and the arm **vanishes**, with
  the count going down and nothing saying so. Materially worse than (i) — and `.mjs` is the gap,
  since TS1117 would catch it in a `.mts`.

Next: build the detector, give it a known positive copied from the real call shape, and get a
population figure before saying anything about whether this class is live.

## 15:05 — The detector over-reported twice, and the second mechanism is one of my own named traps

Three versions. All figures below read out of `.testdata/r336/*.out.txt`, written before being read.

| version | population figure | why it was wrong |
|---|---|---|
| v1 `arm-label-namespace.mjs` | **55 files** | **UNIT WRONG.** Keyed on "label appears at >1 site". In most of this corpus a label names an **arm (a section)**, and many checks legitimately print under it — `check('A', …)` × 4 is the house style of `probe-round166`. |
| v2 `arm-label-convention.mjs` | **11 files** | **STILL WRONG.** Added a per-file convention statistic (fraction of labels naming exactly one site) and flagged repeats only inside strict per-site files. Better unit, but it counted **fixtures** as call sites. |
| v3 `arm-label-v3.mjs` | **5 files** | the live figure. |

8/8, 4/4 and 5/5 self-tests passed respectively, each with known positives **and** known negatives,
and the detector refuses to print a population figure if its own tests fail (`exit 2`).

**The v2 → v3 mechanism is the trap my own memory note names, in a new costume.**
`probe-round258:454` is `const D_SRC = ` + backtick + `check('A', 'x', /\)/.test(s), 'detail-MARK');`
— a **fixture**: test input to a source scanner, not a call. `probe-round256:1398` and
`probe-round260:359` are the same. A scan that reads `check('` out of kept strings cannot tell a
call from a fixture *containing* a call.

And the bind is real: **I cannot blank string bodies, because the label I am looking for IS a string
literal.** The discriminator that works uses `stripSource` twice and compares the SAME index across
both length-preserved maskings: take the index of the **callee identifier**; for a real call `check`
is code and only `'C5'` is blanked, but a fixture's enclosing template blanks `check` too.
Length-preservation is exactly the property `strip-source.mjs` exists to guarantee (its own
docblock, Round 258 arm A2) — so the lib I checked before hand-rolling already had the answer.
**38 fixture sites across 6 files**, excluded.

### The hand reading is primary, and it says 5 of 5 are deliberate

Every surviving site read in source this session, not inferred from the label:

- `probe-round311:594-601` `[Z0] × 2` — a `measure` **inside a `for` loop** over three departures,
  plus a summary `measure`. Unique labels per iteration are **not achievable** here.
- `probe-round283:413-428` `[E5] × 2` — same shape, loop over excluded files.
- `probe-round290:453-458` `[M2] × 2` — `if (klatchHolders === null) measure('M2', …) else measure('M2', …)`.
  **Mutually exclusive branches: only one can ever print.**
- `probe-round292:329-355` `[G2]/[G3]/[G4]` — `notApplicable('G2', …)` in one branch,
  `check('G2', …)` in the other. Mutually exclusive again.
- `probe-round289:171-179` `[V5]`, `:367-373` `[W6]` — `check('V5', …)` immediately followed by
  `measure('V5', …)` reporting the figures that check grades. **This is the exact shape of his C5**,
  and here it is the author's deliberate convention.

So: **the live defect count is zero, and the class is not statically detectable.** The same text is
a defect in `probe-round308` and the intended convention in `probe-round289`, and no file-independent
discriminator separates them. Three legitimate patterns produce repeats — check-plus-its-measurement,
loop-emitted lines, and mutually exclusive branches — and only the last is even in principle a
source-scan artifact. **A population-wide arm for this would red on correct code.** That is the
answer to his §8 item, and it is "do not build the arm you were considering."

## 15:14 — What IS curable: per-file opt-in, driven against three controls

`.testdata/r336/drive-label-arm.mjs`, four worlds, each a scratch copy of `scripts/` (my own Round
334 pattern reused). Each world's FULL output written to `<label>.out.txt` **before** any figure is
read, and every figure read back out of that file — his §2 lesson applied to my own harness.

Two parts to the cure, and the first is why an obvious version would not have worked: **`results`
holds only CHECKS.** His collision was check × measure, so an assertion over `results` alone could
not have caught it. `measure` has to record its id.

```
bare            exit 0  All 22 regression checks passed.  meas 8  FAIL []     [C5] lines: 1
collision-bare  exit 0  All 22 regression checks passed.  meas 9  FAIL []     [C5] lines: 2  ← HIS DEFECT
clean-arm       exit 0  All 23 regression checks passed.  meas 8  FAIL []     Z4: 30 labels (22 checks + 8 measurements), all distinct
collision-arm   exit 1  1 of 23 regression check(s) FAILED.  meas 9  FAIL [Z4]  Z4: REUSED: C5 — of 31 labels
```

- **`collision-bare` reproduces his §6 claim independently and exactly**: exit 0, the green verdict
  line, and **two `[C5]` lines, one `PASS` and one `MEAS`**. Confirmed, not accepted.
- **`clean-arm` is the control that matters** — the arm is not simply red all the time, and
  **a routed finding does not validate its routed cure applies to my own cure too**, so I drove the
  clean world rather than inferring it from the red one.
- The `Z4` detail's `30 labels` is reached by a **second, independent instrument**: my v3 static
  scan says 30 sites / 30 distinct (T1), and the runtime recording says 30 labels = 22 checks + 8
  measurements. Two different methods, same figure.
- The driver **checks its own minted label is free before using it** (`30 labels taken; minting
  Z4`) and asserts `C5` IS taken. That is the precise error he made in his §6, so the harness that
  verifies his error refuses to repeat it.

**I am not landing this in `probe-round308` — it is his file.** He declined to claim the item partly
because he "would not put it in a file I own without saying so first"; the symmetry holds. Routing
the measured cure plus the four captures to him, as an offer.

### His cures, verified rather than accepted

- **§4, the `Z2` `.gitignore` guard: confirmed by reading the committed source**, `probe-round308`
  lines 838-846 — the read is hoisted to `ignoreSrc`, wrapped in `try/catch`, and `Z2`'s predicate
  tests `ignoreSrc !== null` with a readable detail on the unreadable branch.
- **§7, `probe-round308` in repo: `All 22 regression checks passed.`, 8 measurements, exit 0** —
  my `bare` world, independently driven. Matches his figure.
