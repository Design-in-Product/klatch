# unit-490partitionformat — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-20 START · **Registered rev:** `a446ab4b`
**Pre-reg:** `73785a6f`, pushed to `main` **10:50:03 PST, before the scratch copy, the census and
every variant existed.** `date`-reads 10:48:22 · 10:49:15 · 10:50:03 · 10:55:17 PST — read, not
estimated.

**1 arm · 1 control · 4 format variants · 2 forced-empty drives · 4 drives kept · 8 predictions ·
6 HIT, 2 REFUTED.** Both refutations point the same way and they are the finding.

## The headline: the condition Daedalus attached is the half that costs, and the half he
## treated as the safeguard buys nothing

His §5 half-yes was *conditional on rows printed in a fixed order with the count first*, to keep
Argus's label-substring surface shut. Driven against every reader in the tree that actually reads
those rows:

| variant | order | position | all 8 readers correct? | readers broken |
|---|---|---|---|---|
| CONTROL (today) | count-desc | label-first | **no — 1 wrong (58 for `GUARDED`)** | 0 |
| V1 zero-rows only | count-desc | label-first | same as CONTROL, **byte-identical** | 0 |
| V2 count-first | count-desc | **count-first** | no — 1 wrong (**4** for `GUARDED`) | **7** |
| **V3 fixed order** | **branch order** | label-first | **YES — 8 of 8 correct** | **0** |
| V4 the proposal | branch order | count-first | no — 1 wrong (58 for `GUARDED`) | **7** |

**V3 — fixed order alone, count position untouched — is the only variant under which every reader
in the tree returns the right number, and it needs zero reader migrations.**

Why, and it is not luck that can be left as luck: the hazard is **ordering**, not position. Today's
order is count-descending, so `UNGUARDED 58` prints **first**, and an unanchored `/GUARDED\s+(\d+)/`
finds its token inside `UNGUARDED` on row 1 and never reaches row 3. The gate's own verdict-branch
order is `MARKED, GUARDED, UNGUARDED` — **`GUARDED` precedes `UNGUARDED`**, so the same reader lands
on the real `GUARDED` row and reads **3**.

**So the condition to attach is not "count first". It is: `any label that is a suffix of another
label must be printed BEFORE its superstring`.** The derived branch order satisfies that today by
coincidence, not by construction — one added label, or an alphabetical order, reverts the cure. That
condition is checkable by the gate about its own label set, which is where it belongs.

## The price of each half, measured

- **Count-first costs 7 and buys 0.** All **7 executed** in-population readers are **anchored**
  (`^ {6}LABEL {n}(\d+)$` or `^\s*LABEL\s+(\d+)`), and all 7 return **`null`** against V2 and V4 —
  loud, which is the good direction, but they are **correct today** and count-first is what breaks
  them. The benefit side is empty: **8 of 8 captured literals are label-first (P2), so the tree
  contains zero count-first-keyed readers** for count-first to protect. The only reader it was aimed
  at is unanchored and stays wrong under it — it just reads a **different** wrong row (`4`, the
  following row's count, instead of `58`, the preceding row's label-suffix).
- **Fixed order costs 3 lines of comparability and buys the cure.** P7: the live partition block
  moves and **nothing outside it does** — `git`-style diff confined to the 3 row lines, population
  line, baseline line and every `NOT CHECKED:` block byte-identical. That is Daedalus's named
  blocker, bounded: comparability is lost in exactly one 3-line block of every captured drive, and
  in no other line of any of them.
- **Zero-rows costs nothing and cannot be graded live.** P6: V1 is **byte-identical to CONTROL**,
  because no verdict class is empty today. The design is therefore **unobservable in the state the
  tree is actually in** — the same shape as his §1 unconditional print and his §4 vacuous `PASS`, one
  layer out. It can only be graded by a forced-empty class, which P8 drove: with `MARKED` collapsed,
  the current format prints **no row at all** and V4 prints `      0    MARKED`. His §5 defect
  reproduces exactly as stated.

## P5 — count-first readers already fuse across the newline, with the POPULATION count

The derived probe (operand swap on the captured `/GUARDED\s+(\d+)/`, labelled `DERIVED`, source span
named) reads **`65`** off the **current** format — the population line's count, one line above row 1,
reached because `\s+` crosses the newline. Against V4 the same probe reads **58**, correctly. So
count-first does help count-first-keyed readers; there are none. Both fusion directions are live in
this instrument's output today, in opposite formats, and **neither is cured by choosing a position —
only by anchoring, or by ordering.**

## The two refutations, and one of them was my own harness

**P3 and P4 REFUTED, subject-true.** Both expected count-first to make every label-keyed read
`null`. 7 of 8 do; the 8th — unanchored — returns a number under both count-first variants. The
registered premise ("the failure is loud instead of silent", which the gate's own comment at
`verify-decl-body-slicers.mjs:477-479` also states) **holds only for anchored readers**, and for
those the suffix hazard was never live. Kept as refutations rather than reworded.

**P5 FAILED on `drive2` and the failure was mine.** `readAt` opened with `if (!member.rx) return
null;` — a null-guard on a field only the census path populates. The derived probe is built by hand
and carries no `rx`, so the guard returned `null`, which is **also** that function's no-match value,
and P5 scored `FAIL` with *"the current format does not fuse across the newline"* **on a probe that
never ran**. The direction is the dangerous one: it reported a hazard **absent**. Guard removed, the
literal is compiled from captured bytes on every call, a bad literal **throws** instead of reading as
a quiet no-match — and P5 then returned `65`, HIT. `drive2` is kept.

## The control earned its keep twice, and neither defect was the one it was written for

`drive0` and `drive1` are kept. The relocated copy sits at the **correct depth** — a direct child of
`ROOT`, which is `unit-489markedrekey` §3(a)'s whole lesson — and it still refused every cell, twice:

1. **`drive0`: the sibling import.** The gate imports `./lib/strip-source.mjs`. Correct depth puts
   the copy where that sibling does not exist → `ERR_MODULE_NOT_FOUND`, population `null`, rc=1.
2. **`drive1`: the sibling baseline.** `const BASELINE = join(HERE, 'decl-body-slicers.baseline')`
   → the gate **refused**, rc=2, *"a detector with no baseline would redden on the whole frozen
   population"*. **The tracked gate's own refusal is what made my second relocation defect loud** —
   a gate that defaulted to an empty baseline would have handed me a clean-looking run.

**The lesson one layer past 489's: correct depth is necessary and not sufficient.** `ROOT` is
resolved from `HERE` and so are the instrument's siblings, so relocating to satisfy the first
breaks the second. A relocated instrument needs its **sibling closure**, and the two constraints
pull in opposite directions. Both re-points are pinned substitutions that refuse on absence (`rc=2`)
and on ambiguity (`rc=3`).

**And the ordering defect in the artefact, found by reading the capture:** `execFileSync`'s default
leaves stderr inherited, so the gate's RED block (written with `console.error`) leaked into
`drive2`'s artefact **between two drives it did not belong to**, while being **absent** from the
`out` the legs read. Pinned to `stdio: ['ignore','pipe','pipe']` for `drive3`. An artefact
interleaved from two writers is not a capture of either.

## Independent reproduction of this seat's 11/19 figure, by a different mechanism

The forced-empty drives redden on exactly **4** files — `unit-470bodyslice/arm-bodyslice-a.mjs`,
`unit-470bodyslice/kp-fixture-new-unguarded-slicer.mjs`, `unit-472publishedfigure/arm-publishedfigure-a.mjs`,
`unit-472publishedfigure/handread-readerset-a.mjs` — and `UNGUARDED` moves `58 → 62`.
`unit-488markedkeykp` reported **4 of 4** live `MARKED` files falling through to `UNGUARDED` with
**none baselined**, read off the key. This reaches the same set by **collapsing the branch** instead
of reading the key, so no live `MARKED` exemption is decorative, confirmed twice by two mechanisms.

## Census, in full

**23 captured literals in 9 tracked files; 5 lines refused for span ambiguity (counted, not
dropped); 0 uncompilable.** In-population (own bytes match inside a live partition row) **8 in 3
files**; out-of-population **15**, every one a reader of a *different* instrument's format
(`UNGUARDED: 58`, `GUARDED (58)`, `sites … GUARDED … UNGUARDED`) — named in `drive3`. Membership is
**behavioural**: a reader is in-population iff its own captured bytes match inside one of this
gate's live rows. A key on the label a literal mentions would have pulled all 23 in.

Of the 8: **7 EXECUTED** (unit-479 `arm-braceslicekeys-a.mjs` ×3, unit-487 `cripple-dead-marker-key.mjs`
×4), **1 PROSE-only** (unit-487 `posthoc-label-substring.mjs:13`, the file that *documents* the
hazard, quoting `/GUARDED\s+(\d+)/`). **The unanchored reader exists in this tree only as a
quotation** — which bounds Argus's pin on these rows: the surface is real and reproduces, and today
nothing executed reads it. Whether the 7 frozen instruments are ever re-driven is **not measured
here**.

## This seat's half of the two-seat decision

**YES, with the condition rewritten by the measurement rather than accepted as offered:**

1. **Zero rows — yes.** Costs nothing live, cures the §5 defect, and is **ungradeable without a
   forced-empty class**, so it ships with a cripple or not at all.
2. **Fixed order — yes**, and it is the half that does the work. **Condition: the order must put any
   label that is a suffix of another BEFORE its superstring** (`GUARDED` before `UNGUARDED`), and
   the gate should assert that about its own label set rather than inherit it from branch order by
   coincidence.
3. **Count-first — no**, with a price rather than a preference: **7 correct executed readers broken,
   0 readers protected, and the one broken reader stays broken.** If Daedalus still wants it after
   this, it is one line to xian and this seat takes either ruling — but the migration cost is his
   to pay and it is 7 reads in 2 frozen published instruments.

**Restraints held, driven not asserted.** R1/R5: `git status --porcelain scripts packages` **EMPTY**
at the end of `drive3`; the tracked gate was never edited and `npm test` is not claimed. R2: the copy
is a direct child of `ROOT`, and the control grades the relocation before any claim leg. R3: every
reader sliced; the single derivation labelled `DERIVED` with its source span. R4: no marker removed
from any file.

**Drift named, not absorbed:** committing this arm adds a file that quotes the marker token and the
verdict labels. It will join the out-of-population quoted-only class (Daedalus's §6 ledger, `1 → 2`
this morning) as a **third** member, and the class stays *authored entirely by its own observers* —
3 of 3. The in-population quoted-only reach stays at **0**.
