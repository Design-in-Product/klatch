# unit-491partitionbuild — RESULTS

- **Seat:** Daedalus · **Fire:** 2026-11-20 WORK
- **Pre-reg:** `1bbfd429`, pushed to `main` **13:20:09 PST**, before `drive0`, before the cure and
  before the cripple existed. Cure + instruments + drives `566cdb7d`.
- **`date`-reads:** 13:17 · 13:19:13 · 13:22:48 · 13:23:34 · 13:32:16 PST — read, not estimated.
- **Drives kept:** 12 (`drive0` … `drive11`). **1 cure (3 edits, 1 tracked file) · 1 control ·
  5 cripple arms · 9 predictions: 8 HIT, 1 REFUTED.**

## The headline

**The two-seat partition-format decision is CLOSED and BUILT, on Theseus's spelling and not on
mine.** `unit-490partitionformat` measured this seat's `count-first` condition and it cost **7
correct readers** and protected **nobody**; it is withdrawn. The build is **fixed order (branch
order) + zero rows + label-first, count position untouched**, plus the part that was his and is the
only part that makes the property survive a fifth label: **the gate now asserts the ordering
condition about its own label set.**

**The refutation is the interesting result, and it is against my own variant.** P8 predicted the
count-first fusion direction would stay live and keep reading **65**. It stays live and now reads
**3**: the reorder moved *where* a count-first-keyed reader goes wrong, from the population line to
an adjacent verdict row. **That is the exact mechanism I used to argue against count-first — "a
format change that relocates an error is not a cure for it" — showing up inside the variant I
argued for.** The honest statement of what shipped is therefore narrower than "the rows are safe":
**order cures the label direction for every reader that exists; the count direction is cured only by
anchoring, which is the reader's property and not the format's.**

## 1. The reader census reproduces his 8 of 8 independently, by slicing

`drive0` — **8 literals sliced from source, 0 hand-typed**, each at an anchor asserted present
exactly once (absent → `rc=2`, twice → `rc=3`). **7 ANCHORED, 1 UNANCHORED**, which is his figure
reached without reading his list: 3 in `unit-479braceslicekeys/arm-braceslicekeys-a.mjs`
(lines 213–215), 4 in `unit-487markerreport/cripple-dead-marker-key.mjs` (96, 97, 98, 157), and the
unanchored one at `unit-487markerreport/posthoc-label-substring.mjs:13` — a **quotation in a
docblock**, the file that documents the hazard in prose.

The anchors carry the **call name** (`MARKED: one(` vs. `MARKED: lg(`) and not the literal, because
`/^\s*MARKED\s+(\d+)/m` appears **twice** in that file and a pin on the literal would have refused
`rc=3`. Two DERIVED probes, by **operand swap on a sliced literal** with the source span printed.

| reader | before (`drive2`) | after (`drive5`) |
|---|---|---|
| `a479.UNGUARDED` · `MARKED` · `GUARDED` (anchored, space-exact) | 58 · 4 · 3 | **58 · 4 · 3** |
| `c487.one.UNGUARDED` · `MARKED` · `GUARDED` · `c487.lg.MARKED` (anchored) | 58 · 4 · 3 · 4 | **58 · 4 · 3 · 4** |
| `p487.quoted.UNANCHORED` `/GUARDED\s+(\d+)/` | **58 — WRONG** | **3 — CORRECT** |
| `DERIVED.countfirst.UNGUARDED` `/(\d+)\s+UNGUARDED/` | **65** (population line) | **3** (preceding row) |
| `DERIVED.countfirst.GUARDED` `/(\d+)\s+GUARDED/` | **4** (adjacent row) | **4** (adjacent row) |

**P1 HIT** (58), **P2 HIT** (3), **P4 HIT** — all 7 anchored readers byte-identical across the cure,
**0 migrations**, measured rather than assumed. **P8 REFUTED** on its figure and HIT on its verdict.

## 2. The comparability price, which was my named blocker, is now a number

`unit-489markedrekey` §4 deferred this change with one blocker: *reformatting a published partition
moves every captured drive's comparability across this unit series.* Measured, not estimated:
**28 tracked artefacts in 10 units** carry a verdict-row block (`git grep -l '^      UNGUARDED
 [0-9]' -- docs/research`), spanning `unit-470bodyslice` through this unit.

**And the price is smaller than the blocker implied, for a reason the diff shows.** `drive4`:

```
-      UNGUARDED  58
       MARKED     4
       GUARDED    3
+      UNGUARDED  58
```

**One line moved. All three row lines are byte-identical as strings; only their order changed**, and
stdout is **3888 bytes before and after**. **P3 HIT, tighter than registered** — the registered
claim was "confined to the 3 row lines"; the measurement is one relocated line, with the
`tracked files read`, `population`, `baseline entries`, every `NOT CHECKED:` block, the
in-population quoted-only block and the OK block all byte-identical. So those 28 artefacts differ
from a fresh drive in **line order inside one block and in no figure**, which is why the 7 anchored
readers did not move.

## 3. The zero-row half is unobservable live, so it shipped with a cripple — and the before-state is driven, not asserted

**P5 HIT:** no verdict class is empty today, so edit 2 changes **not one byte** of the live
rendering (`drive4` contains no `0` row). Theseus's V1 was byte-identical to CONTROL for the same
reason. *A branch whose only observable state requires a cripple has no other grader.*

`drive7`/`drive10` — **5 arms, 21 PASS · 0 FAIL · 0 REFUSED**, on a relocated `.gitignore`d
`.scratch` copy; **the tracked gate was never edited for a cripple.**

- **CONTROL** (uncrippled copy) reproduces the tracked gate's rc, population and **rows including
  their order**, and fires neither assertion. **CONTROL gates the evidence** — the import rewrite is
  an edit, so without it the cripple grades the relocation. His `unit-490` §5 lesson applied rather
  than quoted: the copy is a direct child of `ROOT` **and** carries its sibling closure (baseline
  copied beside it, `./lib/strip-source.mjs` rewritten to the tracked module's absolute path).
  Correct depth is **necessary and not sufficient**.
- **(a)** cured gate, `declared` forced to 0 → `MARKED` **prints a row reading 0**, the other two
  print, the three rows **account for the population (65)**, and the order survives a collapsed
  class.
- **(a′)** the *same substitution* against the gate **at the pre-reg rev `1bbfd429`** → `MARKED`
  prints **NO ROW**, population unchanged at 65. **P6 HIT.** (a) alone could not have carried this:
  *a row reading 0 cannot be told apart from a row that never printed* — `unit-489` §3, which is how
  this defect was found in the first place. The before-state is pinned to the **registered rev** and
  not to `HEAD`, because `HEAD` moves when the cure commits and an arm keyed on `HEAD` would grade
  the cure against itself.
- **(b)** `LABELS` reordered so `UNGUARDED` precedes `GUARDED` → **refuses `rc=2`**, names the pair
  `GUARDED<UNGUARDED`, prints **no partition at all**.
- **(b2), unregistered and the strongest single cell:** `LABELS` set to the **count-descending order
  this gate actually published until today** → **refuses `rc=2`** on the same pair. **The assertion
  rejects the format that shipped**, which is what makes it an assertion about the label set rather
  than a restatement of the order I happened to choose.
- **(c)** a fourth verdict class produced by a branch and absent from `LABELS` → **refuses `rc=2`**,
  names `SUSPECT`, prints no partition, and does **not** misreport itself as an ordering violation.
  **P7 HIT on all three sides plus (b2).**

## 4. The hazard my own cure introduces, registered as part of the design rather than found afterwards

The old loop iterated `Object.entries(counts)` — whatever the branches produced. **A fixed list
buys a readable order and sells the automatic disclosure of a new verdict class:** a class added to
the branches and not to `LABELS` would have been **silently absent from the published partition**.
That is a loud defect traded for a quiet one, this corpus's most-repeated shape, and it is why
assertion (b) has a sibling. **(c) is the only arm in this unit that grades a defect the cure
created**, and it is the reason the cure is three edits rather than two.

## 5. The finding against my own harness, and it is the third instance of one mechanism in three fires

**`drive6`: 19 PASS · 0 FAIL · 2 REFUSED.** Both refusals printed `got=null want=null`.

`check()` treats `null` on **either** side as "unmeasurable". The two checks whose **correct
expectation is the absence sentinel** — *(b) and (c) print no partition at all* — therefore
**could never pass**: agreement was reported as a measurement that did not happen. **A sentinel
meaning "I could not measure this" cannot also be a legitimate expected value.**

Same mechanism as Theseus's `unit-490` §6 (`if (!member.rx) return null;` — a guard sharing its
return value with its function's legitimate no-match, which reported a hazard **ABSENT** on a probe
that never ran) and as this seat's `unit-489` §3. Cured the way that generalises — **a reader whose
domain excludes the sentinel** (`hasPartition(out) → boolean`), never a special case inside
`check()`. `drive6` kept as the evidence; `drive7` is the re-drive at **21 PASS · 0 FAIL · 0
REFUSED**. `drive10` re-drove it after the §6 edit below and is **byte-identical to `drive7`**.

## 6. I wrote the defect the subject's own report names, in the fire in which I read the paragraph naming it

Both new instruments opened with a `brace-slicer-deliberate:` declaration, written by reflex because
`drive.mjs` scans source character by character. **Neither file is in the population:** the gate's
exemption is for a declaration body sliced by **brace balance**, and `drive.mjs` scans for
regex-literal termination (slashes, character classes) while never comparing against `{` or `}`;
`cripple-partitionbuild.mjs` slices nothing at all.

So each marker would have exempted nothing and both files would have joined the gate's own
disclosure list as fresh members of the class that report calls *"markers that were never
load-bearing, written defensively by an author whose sibling file had just reddened."* **Removed
before the commit.** Measured at `drive11`, after the commit: dead markers **16 / 18 occurrences,
flat**, quoted-only **2, flat**, population **65, flat**, tracked files read **1018 → 1020**.

**R1 is not being gamed by this, and the restraint's own mechanism is what says so:** removing a
marker from a file that was never committed produces no `-` line, so
`git diff 1bbfd429^..HEAD | grep -c '^-.*brace-slicer-deliberate:'` reads **0** and still means what
it was written to mean — *not one marker removed from a file that had one.*

## 7. Predictions, graded

| # | claim | verdict |
|---|---|---|
| P1 | unanchored reads **58** at HEAD | **HIT** |
| P2 | unanchored reads **3** after the cure | **HIT** |
| P3 | diff confined to the 3 row lines | **HIT** (tighter: 1 line moved, 3888 B both) |
| P4 | every anchored reader unchanged | **HIT** (7 of 7, 0 migrations) |
| P5 | zero-row half unobservable live | **HIT** |
| P6 | cripple: row at 0 after, **no row** before | **HIT** (both sides) |
| P7 | both assertions fire, both two-sided | **HIT** (+ unregistered (b2)) |
| P8 | count-first fusion stays live, reads **65** | **REFUTED** — live, but **3** |
| P9 | gate `rc=0`, `SWEEP PASSED — 45 of 45` | **HIT** (`drive8`, `drive9`) |

## 8. Restraints, verified mechanically

- **R1** — `git diff 1bbfd429^..HEAD | grep -c '^-.*brace-slicer-deliberate:'` → **0**.
- **R2** — `git diff --stat 1bbfd429..HEAD -- scripts/ packages/` → **1 file changed** (the gate),
  63 insertions, 3 deletions. The cripple ran on `.scratch/`; the tracked gate was never edited for
  it.
- **R3** — every reader literal **sliced**; both count-first probes labelled `DERIVED` with the
  source span and the donor body printed.
- **R4** — every substituted line pinned with an `rc=2` absence refusal **and** an `rc=3` ambiguity
  refusal, in both the cured gate and the pre-reg-rev source; plus an `rc=3` refusal if the two
  DERIVED probes ever collapse to one spelling.
- **R5** — relocated copy at the correct depth **with its sibling closure**; CONTROL gates every
  other arm.
- **R6** — `git status --porcelain scripts packages` showed only the gate; `packages/` untouched, so
  **`npm test` is not claimed.**

## 9. Open, with blockers named

- **The frozen-instrument question is unchanged and still open** (his §8): whether the 7 anchored
  readers in 2 frozen published instruments are ever re-driven is **not measured**, here or there.
- **The count-first fusion surface is live and uncured**, now reading 3 instead of 65. **Not fixed
  by any format**, per P8's refutation. If Argus wants the label-substring pin's reach widened, this
  is the direction, and the cure is **anchoring the reader**, not moving the count.
- **28 artefacts in 10 units** carry a stale row ORDER (no stale figure). Nobody's obligation; no
  migration performed, because a migration under a format change is how a silent move gets laundered
  into a clean diff.
- **The 16-file disclosure list stays an UPPER BOUND.** Nothing here narrows it; §6 kept it from
  growing by 2 false members.
