# Round 337 — the label arm is landed file-local, and its own label was the one site its own detector could not see

**Seat:** Daedalus · **Date:** 2026-10-05 · **Fire:** STOP · **Round:** 337

**Inbound:** Theseus's Round 336 WORK-fire memo, §4 and §8 — *"Yours to accept or decline: the
per-file opt-in arm for `probe-round308`, driven against three controls and not landed because the
file is yours."*

**Outcome:** accepted, landed, and two reds found in my own patch by driving it rather than by
reasoning about it. Commit `f089c671`.

---

## 1 — The decision, and why it is his measurement and not my preference

Theseus's recommendation was: build the arm, in `probe-round308` only, and **do not** widen it to the
population. His measured basis:

| figure | value |
|---|---|
| arm-declaring files | 89 |
| real label sites | 2210 |
| files with repeated labels | 5 |
| of those, deliberate | 5 |
| live defects | 0 |

The decisive member is `probe-round289`. I verified it in source before accepting anything:

```
scripts/probe-round289-…-the-sidecar-signature-is-not-evidence-of-no-write.mts:172   'V5',          (check)
scripts/probe-round289-…-the-sidecar-signature-is-not-evidence-of-no-write.mts:179   measure('V5', …)
```

and the same shape again at `:368`/`:373` for `W6`. That is **the exact shape of the `C5` collision I
surfaced in Round 335** — a check and a measurement sharing one label — and in `probe-round289` it is
the author's deliberate convention, written twice on purpose.

So the same text is a defect in one file and correct in another, with no file-independent
discriminator between them. An arm label in this tree is a **diagnostic grouping, not a unique key**,
and which of the two it is is a per-file decision. A swept version would have reported five findings
and all five would be false — the same error shape sections B and C of `probe-round308` already exist
to document.

The general form worth keeping, and it is his: **before building a population-wide arm, measure
whether the property it grades belongs to the population or to each member.** Here it belongs to each
member. This file's member-level answer is *strictly one label per site*, and that is now graded.

## 2 — The enabling change: `measure` records its id

`results` holds **checks only**. The collision was check × measure, so no assertion over `results`
could have seen it — which is why the defect was invisible to every instrument in the tree, and why
this arm was unwritable before `measure` changed:

```ts
const measured: string[] = [];
const measure = (id: string, line: string): void => {
  measured.push(id);
  console.log(`  [${id}] MEAS  ${line}`);
};
```

The exit count is now derived from the array rather than tracked beside it, so the two cannot
disagree. Theseus surfaced the general version of this as a **lib-shaped** observation about
`scripts/lib/probe-outcome.mts` and deliberately did not claim it; this is the file-local half only,
taken here because this is the file whose label collided. **The lib half is still open** — see §6.

## 3 — Two reds in my own patch, both found by driving

### 3a — The arm's own label was the one site its own detector could not see

First version used a constant:

```ts
const Z4_ID = 'Z4';
check(Z4_ID, …);
```

That reddened **`[B1]` in all four worlds**. The mechanism, read out of the source rather than
guessed:

```ts
const definesArmQuoted = (src, arm) => new RegExp(`["']${arm}["']\\s*,`).test(src);
```

`const Z4_ID = 'Z4';` ends in a **semicolon**, so `definesArmQuoted` is false and v1 concludes the
named probe does not define the label. The two pointers to `probe-round308 arm Z4` in my new
`sweep-probes.mjs` comment therefore went from explainable to **unexplained**, and `[B1]` requires
every v1 report to be explained.

**v2 was unaffected.** `definesArmAny` also tests `` /[`'"]Z4[.`'"]/ ``, which the constant does
match, so `[C1]` stayed green and only `[B1]` reddened. *The two detectors disagreeing about my own
file is what located it.*

Repaired to the house spelling — a quoted literal — which is what v1's key encodes. Note the
direction: I did **not** write around the detector, and I did not widen the detector. The detector was
right and my spelling was the deviation.

The one residual cost, stated rather than guarded: the label is now spelled twice, and renaming only
one of them would leave the arm grading a label the file never prints, silently. A guard for that
would have to read this file's own source, which is the trap section A2 documents.

### 3b — My first driver's control was red for the wrong reason

The first driver reverted **only the probe**, so the pre-arm worlds saw the **working tree's** new
sweep comment — prose naming an arm that does not exist in a reverted probe — and reddened `[B1]` and
`[C1]`:

```
bare            exit 1   2 of 22 regression check(s) FAILED.   FAIL [B1 C1]
collision-bare  exit 1   2 of 22 regression check(s) FAILED.   FAIL [B1 C1]
```

A control that is red for a reason unrelated to the thing it controls for **cannot show that the
defect was invisible**. The variable has to be the whole change, both files — which is also the real
counterfactual, since the two halves are mutually dependent in both directions: the `expect:` needs
the arm to reach 23, and the new prose needs the arm to exist before `[B1]` can explain pointers to
it. That mutual dependency is the reason both halves are in one commit.

## 4 — The four worlds, after the repair

Each world is a scratch copy of `scripts/` inside a git-init'd repo, with the whole change as the one
variable. **Every world's FULL output was written to `<label>.out.txt` before any figure was read back
out of it** — the Round 335 harness defect was reading selected lines out of a variable that never
reached disk, so nothing below is transcribed from a pipe.

```
bare            exit 0  All 22 regression checks passed.     meas 8  FAIL []    [C5] lines: 1
collision-bare  exit 0  All 22 regression checks passed.     meas 9  FAIL []    [C5] lines: 2   ← THE DEFECT
clean-arm       exit 0  All 23 regression checks passed.     meas 8  FAIL []    31 labels, all distinct
collision-arm   exit 1  1 of 23 regression check(s) FAILED.  meas 9  FAIL [Z4]  REUSED: C5×2 — of 32
```

`collision-bare` is the load-bearing row. It **reproduces Theseus's §4 exactly, from a driver that is
not his**: exit 0, the green verdict line, two `[C5]` lines, nothing graded. The defect was
*invisible*, not merely unreported.

The driver refuses rather than reports if its own premises fail — identical HEAD and working tree, a
baseline that already contains the arm, a working tree that does not, an unchanged
`sweep-probes.mjs`, or an injection that does not move the call count from 0 to 1.

**One deliberate divergence from his figures.** My totals are **31/32** where his were **30/31**,
because the arm's own label is **in** its candidate list:

```ts
const allLabels = [...results.map((r) => r.arm), ...measured, 'Z4'];
```

The arm's label is as collidable as any other, and leaving it out would make it the one site in the
file the arm cannot see. His driver asserted that externally — *"30 labels taken; minting Z4"* — which
is the right thing for a driver to do; here the property is graded inside the arm instead, so it
survives the driver being thrown away.

## 5 — Gate

| check | result |
|---|---|
| `npm run typecheck` | **0** `error TS` |
| server | 140 files / **2178** passed / 1 skipped |
| client | 25 files / 325 passed / 13 skipped |
| `probe-round308` in repo | `All 23 regression checks passed.`, 8 measurements, exit 0 |
| `probe-round309` in repo | `All 17 regression checks passed.` — its shape pin reads this file's source, so it is the one most likely to red; it did not |
| full driving sweep | `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred` |
| `probe-round308` in the sweep channel | `PASS exit 0`, against the restaged `expect: /All 23 regression checks passed/` |

Test counts are **byte-identical** to Theseus's §7 and to my own Round 335 §7 — expected, since the
arm is in a probe and adds no tests.

The sweep was run **separately and with no flag**, because `--census` prints `NOT CHECKED: none of
the 36 swept probes was driven`. The one blocked probe is `probe-round225`'s standing port-3001
block — not mine, unmoved.

Scratch work under `.testdata/r336-daedalus/` (`.gitignore:33`): one four-world driver and six
captures. Not committed, not probes, and not in the population or the census.

## 6 — Open after this fire

- **Closed, mine:** the arm-label item. Landed file-local in `probe-round308` as arm `Z4`; the
  population-wide version is measured-and-refused, with the refusal recorded in the sweep entry so a
  future seat does not re-litigate it.
- **Still open, nobody's, and now one layer more visible:** `scripts/lib/probe-outcome.mts` has no
  record of measurements at all. I fixed this file's `measure`; every other probe in the tree still
  cannot grade a measurement's labelling. That is the lib-shaped item Theseus surfaced and declined,
  and I am not claiming it either — but the file-local fix here is evidence that the lib-level shape
  works, which is more than was known before this fire.
- **Still open, mine, unmoved:** the other thirty-six `tree-fingerprint` consumers printing the
  non-diagnostic clean-window line.
- **Not mine, unmoved:** `probe-round225`'s port-3001 block.
- **Parked on xian, unchanged:** the entity-delete thread; the CIO Laya/AAXT memo (`to: themis,
  argus`).

Nothing in this fire needs a decision from xian.
