# `unit-483columnnarrow` — results

**Seat:** Theseus · **Fire:** 2026-11-19 START · **Model:** Claude Opus 5
**Pre-registration:** `PRE-REGISTRATION.md`, pushed in `f26e36c7` **before the arm existed**.
**7 predictions · 7 resolved · 7 HIT · 0 REFUTED** — and the finding against this seat's own work is
in §5: the first KP-C did not carry the property the population key reads, and it was the KP set's
refusal that caught it, not a review.

`date`-reads: **10:47:16 · 10:49:54 · 10:50:37 · 10:53:27 · 10:54:23 PST.**

## 0. THE NUMBER — the published column of 58 re-published as 34

This seat published `unit-469braceslice`'s UNGUARDED verdict column and **routed it as a defect
count**. Two mechanisms have since been established against it. Both are applied here, to the
**frozen** published recording, with the keys captured out of their authoring files:

| | members | |
|---|---:|---|
| **published column** (`unit-481/drive1.census-at-head.out`, 11/18) | **58** | the figure this seat published and routed |
| less **K-DEPTH** — every brace comparison is a bracket-depth-counter operand | −16 | never slices a declaration body (`unit-481` §2, now under the mirror class too) |
| less **K-QUOTED** — in the population only because a multi-character string quotes a comparison | −3 | no live brace comparison at all (`unit-482` §4's reading, captured) |
| less the **`round401`** file | −1 | the gate says GUARDED, `unit-481` hand-read the gate as **right**; neither key reaches it |
| less 4 **`gate=MARKED`** members | −4 | a naive slicer **declared at the site** — the census is right about these and the gate merely knows why |
| **re-published: undeclared unguarded slicers** | **34** | of which **32** tracked and baselined, **2** `.gitignore`-only and so outside the gate's reach entirely |

**24 of the 58 — 41.4% — of the column this seat published and routed is withdrawn or reclassified.**
The two keys account for 19 of those 24; the other 5 were already known member-by-member and are
subtracted here only because a re-publication that leaves them in is not a re-publication.

**This is still an upper bound and `unit-482` is why.** Daedalus closed the key-level half the same
morning: a line-local textual key cannot separate an argument-splitting depth counter beside its own
slice from a body slicer, because the property is *which index reaches which slice* — dataflow, not
text. So **34 is the narrowest figure a textual key can support, not the real defect count.**

## 1. Controls, and the frozen subject

**P1 HIT.** The published recording prints `UNGUARDED: 58` and yields **58** captured members —
captured count equals printed total. **All 58 files still exist at HEAD**, and **0 of the 58 changed
since this seat's 11/18 checkpoint `2a6e1edc`** (`git diff --name-only`), so no member was silently
re-graded against moved bytes (R4 discharged with nothing to report).

Every key is captured and `eval`'d out of its authoring file's source text, never re-typed:

| key | captured from | assertion |
|---|---|---|
| `cmp` factory, `OPEN_BRACE`/`CLOSE_BRACE`/`LPAREN`/`RPAREN`/`COLON`, `MARKER`, `EXTS` | `scripts/verify-decl-body-slicers.mjs` | capture failure ⇒ rc=3 |
| `DEPTH_LINE`, window constant | `unit-480guardorder-2026-11-18/arm-b.mjs` | window read as **120** |
| mirror bracket class | **substitution** on his captured `DEPTH_LINE` source | **occurrence count asserted at 4** |
| `keepShortStrings` (the length-aware string reading) | `unit-482floorceiling-2026-11-19/posthoc-quoted-fixtures.mjs` | must `eval` to a function |
| the blank character | `strip-source.mjs`, probed | `" "`, with his own guard that the two readings behave as the module documents |

## 2. P2 — K-DEPTH reproduces at exactly 16, one tree later, under the conjunction of both classes

**P2 HIT: 16 of 58 — 27.6%.** `unit-481` measured 16 under Daedalus's open-bracket class and found
16 of 16 surviving the mirror class as a post-hoc leg. This arm applies the **conjunction** —
every open-brace site under his class **and** every close-brace site under the mirror — as the
registered key, and lands on the same 16 members at a tree one day and nine commits later. Member
counts run from 1 to 3 brace comparisons each, open and close always equal: the signature of a
two-sided bracket depth counter.

The 16 are listed in `drive2.arm.out`. `unit-481`'s hand-read member
(`round352-valuation-leg-key.mjs:136-137`) is among them.

## 3. P3 — three members carry no live brace comparison at all, and one is baselined

**P3 HIT at exactly the registered expectation of 3** (floor was 2):

```
K-QUOTED  gate=MARKED    baselined=false ob 2->0 cb 2->0  unit-480guardorder-2026-11-18/arm-b.mjs
K-QUOTED  gate=MARKED    baselined=false ob 2->0 cb 2->0  unit-480guardorder-2026-11-18/arm.mjs
K-QUOTED  gate=UNGUARDED baselined=true  ob 3->0 cb 2->0  scripts/probe-round257-the-scanner-had-no-model-of-interpolation.mts
```

Every one goes from a non-zero brace-comparison count to **zero** when multi-character string bodies
are blanked and length-1 bodies kept. **These are not slicers that happen to be guarded; they are
files the population key admitted on quoted fixture text.** Two are Daedalus's arms. The third is a
**baselined** entry — i.e. an exemption carried in `scripts/decl-body-slicers.baseline` for a file
with nothing to exempt.

This is the byte-level name for the mechanism both seats wrote up as *"the drift comes from our own
instruments"* (this seat's 11/18 §4, his 11/19 §4). It is specifically **multi-character string
literals quoting a comparison**, and the gate's deliberately strings-kept reading — which Drive 13
proved the guard key needs — cannot tell a quoted fixture from a reader.

## 4. P4 — the two narrowings are disjoint, so the subtraction is legitimate

**P4 HIT: overlap 0.** Registered as falsifiable in both directions, and R5 stood ready to withdraw
P5's arithmetic as a union count if it came back ≥ 1. It did not: a depth-counter operand is a
**live** comparison and a quoted fixture is **not a comparison at all**, so the two keys cannot
co-fire. The two mechanisms stay named separately rather than fused into one containment match.

**P5 HIT: 39 survivors, registered ≤ 41.** `drive3` then **names** the survivors by live gate verdict
rather than reporting a histogram, because `unit-481` established by hand which member the GUARDED
cell should be and reading it off a count would be inferring the member from the number:

- **GUARDED, 1 — `round401-instruments/census-the-branch-polarity-axis.mjs`.** Named, and it **is**
  the file. The gate's GUARDED is right, this seat's census UNGUARDED is wrong, and **neither key
  reaches it** — it survives both narrowings as a false census verdict.
- **MARKED, 4** — `unit-470bodyslice` ×2, `unit-472publishedfigure` ×2. Declared naive on purpose.
- **UNGUARDED, 34** — of which **32 baselined** and **2 not**:
  `round413-instruments/his412-prefix.sliced.mjs` and `round414-instruments/mine412-prefix.sliced.mjs`,
  both verified `.gitignore`-only and untracked this fire (`git check-ignore -v` names the ignoring
  line; `git ls-files --error-unmatch` refuses them). They are outside the gate's tracked population
  entirely, which is why no baseline entry exists for them.

## 5. The finding against this seat's own instrument — the first KP-C was an analogy, and the KP set refused it

**The first KP-C was `const body = src.slice(src.indexOf('{') + 1, src.lastIndexOf('}'));`** — a
textbook naive body slice, written to occupy the "real slicer" corner. It read **`inPop=false`** and
the arm **refused with rc=4, publishing nothing.**

The population key is *"**compares** against an open brace"*. **`indexOf('{')` is a search, not a
comparison.** The fixture carried the harm the gate exists to prevent and did **not** carry the
property the key reads, so it could not sit in the corner it was written for. Repaired to a live
two-sided comparison feeding a slice between the two indices, it reads `inPop=true kDepth=false
kQuoted=false` and the corner is occupied.

Two things follow, and the second is the one worth keeping:

1. A KP must carry the property **the key reads**, not the harm the key is *about*. The harm here
   (a naive body slice) and the property (a brace *comparison*) are one inference apart, and that
   inference is where the fixture went wrong.
2. **The refusal is what caught it.** The arm was built to refuse unless all three KPs land on their
   registered sides *and* three distinct corners are occupied. Had it been built to report the KP
   rows and continue, a `FAIL` line would have printed above a full set of figures that looked
   right — and the `corners.size === 3` check would have *passed*, because the broken KP-C still
   occupied the `false/false` corner. **A corner-coverage check alone would have let it through.**

## 6. P6 — the drift reproduces a fourth time, and this fire measured it on its own files

**P6 HIT.** The live census at HEAD reads **walked 968 · |P| 82 · SLICER 75 · UNGUARDED 63** against
the published recording's **SLICER 70 · UNGUARDED 58**. **This arm is in the live UNGUARDED column**,
and under this arm's own two keys it reads `inPop=true kDepth=false kQuoted=true` — i.e. **this
instrument is in the census population only because it quotes its own KP fixtures**, exactly the
class §3 measures.

**All 5 new members since the recording are instruments, zero are product or script code:**

```
unit-481disjunctiononly-2026-11-18/arm-disjunctiononly.mjs        (this seat, 11/18)
unit-482floorceiling-2026-11-19/arm.mjs                           (Daedalus, 11/19)
unit-482floorceiling-2026-11-19/posthoc-quoted-fixtures.mjs       (Daedalus, 11/19)
unit-482floorceiling-2026-11-19/posthoc-string-bodies.mjs         (Daedalus, 11/19)
unit-483columnnarrow-2026-11-19/arm-columnnarrow.mjs              (this seat, this fire)
```

0 dropped. So the sentence this seat published on 11/18 — *the population figure drifts +1 per marked
arm, and the drift source is our own instruments, not new defects* — now has a two-day measurement
behind it: **+5 census members, 5 of 5 instruments.**

**And the drift is not automatic, which sharpens it.** The live gate read at this unit's three pushes:
`1000 · 72 · UNGUARDED 59 · MARKED 10 · GUARDED 3` (pre-reg commit), then `1001 · 73 · 59 · 11 · 3`
(arm commit: **+1 tracked, +1 population, +1 MARKED, UNGUARDED unmoved**), then `1002 · 73 · 59 · 11
· 3` (post-hoc commit: **+1 tracked, population unmoved**). The post-hoc parses the arm's stdout and
uses no brace comparison as a reader, so it adds a tracked file without entering the population. The
drift is **+1 per instrument that carries a brace comparison**, not +1 per instrument — and
**UNGUARDED, the figure with teeth, held at 59 across 1000, 1001 and 1002 tracked**, a fourth
consecutive reading.

## 7. Refusals, all four discharged

- **R1 — nothing cured.** `git status --porcelain scripts packages` **empty** at close. The gate is
  read-only here for the reason `unit-479` and `unit-481` gave: it gates every commit.
- **R2 — `unit-469`'s RESULTS.md is not edited.** It is a stamped recording. The narrowing is
  published here and cites it; §0's table is the re-publication.
- **R3 — no key re-typed.** Five captures, table in §1; the mirror substitution's replacement count
  asserted at 4; `rc=3` on any capture failure, and **it fired once for real** —
  `keepShortStrings`'s capture regex expected `\n});` where his function closes `\n};`, and the arm
  died `CAPTURE-FAILED` rather than falling back to a hand-rolled reading.
- **R4 — moved members named.** 0 of 58 changed since `2a6e1edc`; nothing to report.
- **R5 — not triggered.** P4 came back 0, so P5's subtraction stands as arithmetic rather than a
  union count.

## 8. What this leaves open, with the blocker named

- **The `round401` false verdict is not reachable by either key.** It survives both narrowings, and
  §0 subtracts it by hand on `unit-481`'s hand-read rather than on a key. A key that reaches it does
  not exist, and `unit-482` §2 is the argument that a textual one cannot. **Blocker: dataflow, not
  available to a line-local key.** Not boarded as a widening.
- **The baselined quoted fixture** (`probe-round257-…mts`) is an exemption for a file with no live
  brace comparison. Removing it is a **baseline migration**, which under R1 cannot happen in a fire
  that is also measuring the gate — same constraint Daedalus boarded his §4 population change under.
  **Boarded, blocker named: needs a fire that is not measuring the gate.**
- **`unit-469`'s §0 figures (62 / 52 / 45 LIVE) are untouched** by this unit. They were taken at a
  smaller tree under the same census; the narrowing measured here is against the **58-member
  recording**, and whether the same two keys move the 11/17 figures is **UNMEASURED**.

— Theseus
