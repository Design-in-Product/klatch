# unit-465census-v2 — RESULTS

**Seat:** Daedalus · **Fire:** 2026-11-10 START · `date`-reads **09:17** (fire open), **09:23**
(this file; clock read, not estimated from effort) · **Model:** claude-opus-5
**Pre-registration:** `e457803d`, committed before the v2 extractor existed and before any new count
was read.

Instrument: `census-anchors-v2.mjs` (this directory — not `scripts/`, so it adds no probe and no
registry row). Capture: `census-v2-run-1.txt`, exit **0** (captured from `execFileSync`, not
inferred from the output). v1 unedited (R3): `docs/research/unit-465anchor-census-2026-11-09/`.

## Headline, read off the capture rather than summarised

> `copiers: 2 · anchors: 14 (11 hand-typed, 3 derived, 0 UNREAD) · files: 6`
> `cells counted: 66 — 12 at >1 (COLLISION), 29 at exactly 1, 25 at 0`
> `W1 reached 2 anchor(s) v1 printed UNREAD · W2 added 1 subject file(s) · W3 divergences: 0`

v1, for comparison, read off **its** committed capture (`census-run-1.txt`, `5ab2f758`):

> `copiers: 2 · anchors: 13 (9 hand-typed, 3 derived, 1 UNREAD) · files: 5`
> `cells counted: 45 — 12 at >1 (COLLISION), 23 at exactly 1, 10 at 0`

**Seven predictions, six true, one refuted — and the refuted one says the published safety argument
for v1's second gap was the right verdict reached by the wrong reason.**

| # | claim | verdict |
|---|---|---|
| P1 | v2's copier population is the same **member list** as v1's | **TRUE** — byte-identical rows, same throw lines (`:91`, `:88`), same `files scanned: 182` |
| P2 | W1 resolves `sandboxDecl` to exactly 2 values, both hand-typed; `1 UNREAD → 0`, `9 → 11` hand-typed | **TRUE** |
| P3 | W2 admits exactly one file: `sweep-probes.mjs`; `files: 5 → 6` | **TRUE** |
| P4 | on the new `sweep-probes.mjs` column, every hand-typed anchor reads **0** | **REFUTED** — two read **1** (`C_HERE`, `A_HERE`) |
| P5 | `SB374`/`SB375` each read exactly **1** in `probe-round377`, so §3's "nine of nine" becomes **9 of 11** | **TRUE** |
| P6 | v2 is a strict superset: all 12 of v1's COLLISION cells reappear, matched by `(anchor, file)` pair | **TRUE** — same 12 pairs, no shared column lost a cell |
| P7 | W3 (column-0 → trimmed match) changes nothing; no anchor const is indented | **TRUE** — `W3 divergences: 0` |

## 1. W1 — the parameter-bound anchor is reachable, and the chain is the evidence

v1 reported `sandboxDecl` as `UNREAD` with its reason (its R2 held). v2 resolves it from
`copyProbe`'s **own call sites**, and prints the chain so the resolution is checkable rather than
asserted:

```
probe-round377-the… sandboxDecl←SB374 @690 [hand-typed] "const SANDBOX = join(REPO, '.testdata', 'round374');"
      via W1: once(…, sandboxDecl, …) :685 → copyProbe(…) :811 arg1=SB374
probe-round377-the… sandboxDecl←SB375 @691 [hand-typed] "const SANDBOX = join(REPO, '.testdata', 'round375');"
      via W1: once(…, sandboxDecl, …) :685 → copyProbe(…) :819 arg1=SB375
```

This **confirms Theseus's §4 hand reading by measurement** — he read `SB374`/`SB375` at `:690-691`
by hand and labelled it a hand reading; the instrument now produces the same two values without a
seat typing them, so his floor is no longer a floor. The hand-typed population of
`probe-round377` is **seven**, and all seven are now counted rather than five counted and two named.

**Where the resolution landed is worth recording, because it is luck again.** `copyProbe` is called
both through `drive()` (`:694`, which passes its *own* parameter `sbDecl`) and **directly** at
`:800-819` with the literal consts. v2's recursion is built for the two-hop chain, but the direct
call sites alone would have answered — so the one-hop case and the two-hop case both resolve here,
and **R6 stands: one real parameter-bound site in this population grades a resolver on one
instance.** The two-hop limb is written and exercised by `drive()`'s presence in the call-site walk,
but nothing in this population forces it to be the only route to an answer.

## 2. P5 is true, and it breaks "nine of nine" into a property of file PAIRS

Theseus's §3 states the mechanism as a property of hand-typing:

> A hand-typed anchor puts a second copy of a foreign source line into the file that declares it.
> That is not a risk of the pattern; it is the pattern. **Nine of nine** hand-typed anchors do it, by
> construction.

The two anchors his reader could not see are **counter-examples**:

| anchor | `probe-round374` | `probe-round375` | `probe-round377` (its own declaring file) |
|---|---|---|---|
| `sandboxDecl←SB374` | **1** | 0 | **1** |
| `sandboxDecl←SB375` | 0 | **1** | **1** |

Both read **1** in their declaring file, not 2 — because `probe-round377`'s own sandbox is
`.testdata/round377`, so the literal it carries for `round374`/`round375` has no real twin beside
it. **So the mechanism is 9 of 11, and its precondition is not hand-typing — it is that the
declaring file also happens to contain the real line.** That is a property of the *pair* (which file
declares the literal, which file the literal describes), not of the declaration style. The
reformulation matters for a cure: deriving an anchor is always *sufficient*, but "is it hand-typed?"
is **not** the right screen for which anchors are hazardous. `occ(declaring file, anchor)` is.

Each of these two cells is also a **correct** reading for the applied pairs: `copyProbe(R374, SB374,
…)` needs `occ(probe-round374, SB374) === 1`, and it is 1. No collision, live or latent, from either.

## 3. P4 REFUTED — v1's second gap concealed two non-zero cells, and the published reason for their
harmlessness is not the operative one

v1's RESULTS §4 closed its second declared gap like this:

> The candidate file set is keyed on `const X = 'probe-*.mts'`, so `sweep-probes.mjs` … **is not in
> it**. Both of those anchors are **derived**, so no hand-typed cell was lost. That is luck, not
> coverage.

The verdict ("no hazard was lost") survives. The reason does not. I predicted the widened column
would be all zeros — that is what "no hand-typed cell was lost" implies if you read it as a claim
about the cells. It is not:

```
== 5c. the W2 column on its own — what a non-`probe-` subject actually costs ==
   0  C_IMPORT_OUTCOME × sweep-probes.mjs
   0  C_IMPORT_SWEEP × sweep-probes.mjs
   1  C_HERE × sweep-probes.mjs
   0  C_SANDBOX × sweep-probes.mjs
   0  A_OUTCOME × sweep-probes.mjs
   0  A_SWEPT × sweep-probes.mjs
   1  A_HERE × sweep-probes.mjs
   0  sandboxDecl←SB374 × sweep-probes.mjs
   0  sandboxDecl←SB375 × sweep-probes.mjs
   0  A_R225_READ × sweep-probes.mjs
   0  A_SWEEP_READ × sweep-probes.mjs
```

**Two of eleven hand-typed anchors occur in the registry.** `C_HERE`
(`'const HERE = dirname(fileURLToPath(import.meta.url));'`) and `A_HERE` (the same line plus
`const REPO = join(HERE, '..');`) each read **1** there — the registry carries that bootstrap pair
verbatim.

Two safety arguments, and they are not the same one:

- **His** — the anchors *aimed at* `sweep-probes.mjs` (`DECL` at `375:265`, `DECL_ANCHOR` at
  `377:665`) are derived, so widening the subject set cannot surface a hand-typed anchor **whose
  subject is the registry**. True, and v2 confirms it: both are still classified `derived`.
- **The one the cells actually support** — two hand-typed anchors *aimed elsewhere* nonetheless
  **occur** in the registry, and they are harmless because the registry currently holds **exactly
  one** copy of that bootstrap pair. That is a fact about the registry's bytes, and the registry is
  the most-edited file in this family.

**So the gap was costing something: two of 66 cells were unmeasurable under v1's key, and the thing
that keeps them at 1 is editable by anyone.** The hazard is conditional and I will not inflate it —
**no copier applies `C_HERE` or `A_HERE` to the registry today** (`copy373` applies `C_HERE` to
`r373Src`; `copyProbe` applies `A_HERE` to `R374`/`R375`), so a second bootstrap block in
`sweep-probes.mjs` would redden nothing that exists. It is the same latency Theseus named for his own
seven — *"the day a Round 378 copier does"* — one file further out, and now it is at least
**visible** rather than outside the instrument.

## 4. P6 — the superset check, by member list and not by recount

Both captures report `12 at >1`. A matching count is not a matching set, so the 12 are compared as
`(anchor, file)` pairs. v2 prints them as a member list (`== 5b`) for exactly this reason:

`C_IMPORT_OUTCOME × {374, 375, 377}` · `C_IMPORT_SWEEP × {374, 375, 377}` ·
`C_HERE × {374, 375, 377}` · `A_OUTCOME × 377` · `A_R225_READ × 377` · `A_SWEEP_READ × 377`

Identical in both. The widening added 21 cells (45 → 66 = 11 × 6) and removed none, and
`23 → 29` ones plus `10 → 25` zeros accounts for every added cell without a reclassification.

## 5. Refusals, checked rather than asserted

- **R1** — `git diff --stat -- scripts/ packages/` run this fire: **empty**. No cure, no arm, no
  registry row. This unit measures; it does not repair.
- **R2** — no anchor value typed into v2. Every value is extracted from a copier's own source, and
  the W1 chain prints the call site and argument that produced each one. `0 UNREAD` here is
  *resolution*, not suppression — the UNREAD limbs are still in the code and would print if a chain
  failed.
- **R3** — v1 is unedited; `census-anchors.mjs` and `census-run-1.txt` remain a matched pair at
  `5ab2f758`. v2 names v1's path and that rev in its docblock.
- **R4** — the v1 baseline above is quoted from the **committed capture**, not from a re-run of v1.
  Licensed by `git diff --stat 5ab2f758..HEAD -- scripts/ packages/` → **empty**, verified at fire
  open, so the frozen capture and the live tree share a subject. The run reported here is v2's only.
- **R5** — this unit **does not** derive `probe-round377`'s seven hand-typed anchors and **does not**
  promote the census into the gate. Both remain Theseus's, with his blockers.
- **R6** — W1 is graded on **one** parameter-bound site. Reported as such in §1; not claimed as a
  general capability.

## 6. Not done, blockers named, no deadline from me

- **The screen implied by P5 — `occ(declaring file, anchor)` rather than "is it hand-typed?"** v2
  *measures* it (every cell on the declaring-file column is in the capture) but does not **report it
  as a verdict**, so the instrument still ranks by declaration style. **Blocker: none named — this is
  a reporting change to v2 and it is the first thing a follow-up should do.** I did not do it in this
  fire because adding a verdict column to the same run that first produced the cells would leave no
  honest reading of the version that produced them — the exact blocker shape I just discharged from
  Theseus, and it discharges the same way next fire.
- **Retiring v1 in favour of v2.** Not done, and not obviously right: v1's capture is the baseline
  P6 is checked against. **Blocker: a retirement needs the superset property to be *gated*, not
  observed once** — which is the census-in-the-gate item, and that is Theseus's with his own blocker
  (no planted-duplicate red state built). Flagged, not taken.
- **The two registry cells (`C_HERE`, `A_HERE` × `sweep-probes.mjs`).** Nothing built. **Blocker:
  there is no copier that applies either anchor to the registry, so a guard would have no red to
  show** — the same reason Theseus gave for not promoting the census, and it applies to me here.
- **Not mine and not taken this fire:** `373` 15→16 + the `:108` fixture (still unclaimed by either
  seat), `377` 13→14, `probe-round374b` (Theseus's, blocker unchanged), the **shared guarded
  registry reader** (unowned — and §3 above is arguably a *fourth* reason it should exist: it would
  own the bootstrap-pair question too).

Gate/census status and the full sweep are reported in the session log, not here.

Delivery is the wrapper's to log, not mine to assert.
