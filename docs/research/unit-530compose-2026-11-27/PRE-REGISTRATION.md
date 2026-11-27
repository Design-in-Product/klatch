# `unit-530compose` — pre-registration

- **Seat:** Theseus (manual testing & exploration), 2026-11-27 WORK fire
- **Clock:** `2026-11-27 14:49:54 PST`, read by `TZ=America/Los_Angeles date` in the **same command**
  that created this directory and read the SHA
- **Population SHA:** `0d81d567a79e` (`origin/main`, worktree in sync, 0-commit delta)
- **No-op on product:** `git diff --stat HEAD -- packages/ scripts/` printed **nothing** at
  `14:49:54 PST`, in that same command. Re-asserted inside the arm before any measurement.
- **This file is committed and pushed to `origin/main` BEFORE `arm-compose.mjs` exists.**

## §0 The subject, and why this unit exists

Daedalus's `unit-529defaultparam-2026-11-27` §2(c) names a keeper and asks for it to be broken:

> **THE KEEPER — the two cures do not compose additively.** […] *Two cures priced separately cannot
> be added, because the cheaper one routes the same members to a class the other one re-routes — so a
> roadmap of independently priced cures over-counts their union.* **This is the one I would most like
> either of you to try to break.**

The subject of this unit is **that sentence and the cell that licenses it**, not the cure. His
measured cell is `arm-defaultparam.mjs:425–434`:

```js
additive[k] = p + ((CLS.DEF[k] || 0) - p) + ((CLS.GEN[k] || 0) - p);   // = DEF[k] + GEN[k] - PUB[k]
const additivityBreaks = CLASSES.filter((k) => additive[k] !== (CLS.BOTH[k] || 0))
```

It iterates `CLASSES` and nothing else.

## §1 What I had and had NOT read when these predictions were written

**HAD read** (so no prediction below may claim blindness to it):

- His memo in full.
- `arm-defaultparam.mjs` lines 1–70 and 415–445, plus grep hits for
  `P9|additive|SET-BOUND|OTHER-BOUND|NARROWED|hazard|SUBJECT|TEXT\.|readFileSync`.
- `captures/ARM.out` lines **185–200** (the `NARROWED HAZARD` block: `PUB 4 · DEF 4 · GEN 5 ·
  BOTH 7`, all `BLIND`) and lines **221–243** (the whole `P9` table **including the off-by column**:
  `SET-BOUND +2`, `OTHER-BOUND −2`, eight zeros, `classes where addition FAILS: 2`).
- `arm-defaultparam.mjs:306` — the hazard is a **derived predicate** over the class key:
  `(cls === 'SET-BOUND' || cls === 'SET-EXPR') && dir === 'INVARIANCE'`.

**Had NOT read** — and the predictions are pointed here:

- His `PRE-REGISTRATION.md`, his `RESULTS.md`, `posthoc-key-collision.mjs`, and every capture other
  than the two line ranges above.
- The **full class table** under all four instantiations. The `PUB/DEF/GEN/BOTH` class numbers I am
  reasoning from came from **his memo**, not from a capture — a doc, not a source.
- The **frozen subject** `unit-523indirectsize-2026-11-26/arm-indirectsize.mjs` — I have opened
  **none** of it, in particular not its `SET-BOUND` branch.
- The **donor region** in `unit-527setgeneric-2026-11-27/arm-setgeneric.mjs` — I have not read
  `GENERIC_SRC` or any of the four `SUBS`.
- Whether `126` is the population, whether the ten `CLASSES` **partition** it, and where the
  `excludedDirectTails 60` sit relative to it.

Because I had already read the off-by column, **"the off-by column sums to zero" is not a prediction
of mine — it is arithmetic I had read.** What is at risk below is whether that zero is **forced**,
what it does to his *count* of failures, and what happens at granularities his cell never visited.

## §2 Predictions

**P1 — Partition.** In my own fresh drive at this pin, the ten `CLASSES` partition the population:
every site lands in **exactly one**, and each of the four columns sums to the **same** total.
Registered expectation: **column total 126 in all four**, `excludedDirectTails` **outside** it.

**P2 — The zero is forced, so his failure count is not two independent facts.** Because the four
instantiations partition one fixed population, `Σ_k (BOTH[k] − additive[k]) = 0` **identically** — it
cannot be otherwise at constant population. Therefore the number of classes at which addition fails
is **never 1**: a non-zero failure comes in **mirrored pairs or larger**. Registered expectation: the
identity holds in my drive, and **`classes where addition FAILS: 2` is one movement of 2 members
reported twice, not two findings**. I predict his report contains **no cell asserting this
conservation**, so the `2` was never qualified.

**P3 — Positional member census, no key.** His own §2(d) found `keyOf = path:line:receiver` hiding 4
population members behind 4 colliding keys, so I use **no key**: the four runs are aligned
**positionally** at all indices and compared as 4-tuples
`(cls_PUB, cls_DEF, cls_GEN, cls_BOTH)`. Registered expectation: **exactly 6 sites** are
non-constant across the tuple, in **exactly 2** distinct non-constant patterns —
**4** × `(OTHER-BOUND, OTHER-BOUND, SET-BOUND, SET-BOUND)` and
**2** × `(UNRESOLVED, OTHER-BOUND, UNRESOLVED, SET-BOUND)`.

**P4 — Additivity has no member-level referent.** Additivity is defined on counts; a member has no
"additive prediction". Registered expectation: the 2 members his `off by ±2` is attributed to are
identifiable **only** through the tuple census of P3, and **no** site in the population satisfies
"this site is the one addition got wrong" under any per-site predicate derivable from his cell.
Stated to be falsifiable: if a per-site additive predicate exists, P4 is REFUTED.

**P5 — His cell never ran at the granularity his keeper is about.** Registered expectation: searching
the whole of `arm-defaultparam.mjs`, there is **no** cell, assertion or printed comparison of an
**additive hazard prediction** against the **measured `BOTH` hazard**. The hazard is computed
(`NARROW.*`), published (4/4/5/7) and **never passed through the additivity test**.

**P6 — Run there, and it fails in the UNDER-counting direction.** Registered expectation:
additive hazard `= DEF + GEN − PUB = 4 + 5 − 4 = 5`; measured `BOTH = 7`; **off by +2**. A **third**
non-additive figure, which his "exactly two classes" does not cover because the hazard is not a class.

**P7 — The direction word in the keeper describes the minority.** Registered expectation: tallying
every non-additive figure in his unit, the additive model **UNDER-counts 2** (`SET-BOUND`, hazard) and
**OVER-counts 1** (`OTHER-BOUND`) — and the over-count is the **vacated** class, which no roadmap
prices. So *"over-counts their union"* is **wrong-signed for every figure a roadmap would price.**

**P8 — The cures are in SERIES, not two independent factors.** Registered expectation: in the frozen
subject, the `SET-BOUND` branch tests the rhs against a **non-generic literal**, and one of the four
`GSUBS` **widens that very test**; cure `D` **supplies** the bound rhs that the widened test
**consumes**. So the interaction is a **producer/consumer composition**, and the 2×2's interaction
term was **structurally guaranteed before any drive** — not a discovery. I have read neither file.

**P9 — A series pair cannot cancel.** Registered expectation: **no** site has
`cls_BOTH == cls_PUB` while `cls_DEF != cls_PUB` or `cls_GEN != cls_PUB` — adding the second cure
never returns a member to where it started. Hence the only negative off-by is at a **vacated** class,
and this is why P7's sign holds rather than being a coincidence of this corpus.

**P10 — Control: his arm, driven UNCHANGED at my pin.** Registered expectation: `arm-defaultparam.mjs`
driven as a child process with **no edit**, exit **0**, reproducing its published `off-by +2 / −2`,
`classes where addition FAILS: 2`, and hazard `4/4/5/7`. A unit that cannot re-drive the arm it
audits has graded a document, not a measurement.

**P11 — Corpus drift is expected and must not be laundered.** He recorded `858 → 861` across the 14
commits before his fire. Registered expectation: at my pin the corpus is **≥ 861**, and if it has
moved, the class figures still reproduce, because the entering files contribute **0** sites. If a
figure moves, I report the drift rather than the figure.

**P12 — My own detectors get a KP/KN gate before any figure they produce is reported.** The tuple
census and the series-detector are **hand-written by me in this arm** and will be scored against
planted positives and negatives. Registered expectation: **KP/KN 100%** — and if any cell fails, the
repair and both drives are kept, drive 1's capture **not** overwritten.

## §3 What would make me wrong

- If his arm **does** grade hazard additivity somewhere I have not read, **P5 and P6 collapse** and
  the headline of this unit is gone.
- If the ten classes do **not** partition the population, **P2's conservation identity does not
  hold**, and his `2` may be two independent facts after all.
- If a site is returned to its `PUB` class by adding the second cure, **P9 is REFUTED** and P7's sign
  is a coincidence rather than a consequence.
- If the `SET-BOUND` branch is already generic-tolerant in the frozen subject, **P8 is REFUTED** and
  the producer/consumer account of the interaction is wrong.

## §4 Scope — what this unit does NOT claim

It does **not** dispute that the two cures fail to compose additively. **That finding is Daedalus's
and I expect it to stand.** The attack is on the **count** (`2`), the **direction** (`over-counts`),
the **granularity** (classes, not the priced figure), and the **status** (discovered vs. structurally
forced). It also does not touch item 10, which is xian's call and only his.
