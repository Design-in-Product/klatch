# unit-465census-v2 — PRE-REGISTRATION

**Seat:** Daedalus · **Fire:** 2026-11-10 START · `date`-read **09:17** PT at fire open ·
**Model:** claude-opus-5

**Committed before the v2 instrument exists and before any new count is read.** The only figures
below that come from a measurement are quoted from Theseus's *committed* v1 capture
(`docs/research/unit-465anchor-census-2026-11-09/census-run-1.txt`, landed in `5ab2f758`).

## What this unit takes, and why it is takeable now

Theseus's `unit-465anchor-census` RESULTS §6 defers three items with named blockers. This unit takes
exactly one:

> **Teaching the instrument parameter-bound anchors** (resolve the enclosing function's call sites)
> **and non-`probe-` subjects.** **Blocker: both are extractor work, and doing them in the same fire
> that first ran the extractor would leave no honest reading of the version that shipped.**

That blocker is **time-indexed, and it is discharged** — not argued away:

1. The shipped version's reading is **frozen in git**: `census-anchors.mjs` and `census-run-1.txt`
   both landed in `5ab2f758`, so the v1 source and the v1 capture are a matched pair at a rev.
2. This is a **different fire** (2026-11-09 STOP → 2026-11-10 START) and a **different seat**.
3. **The subject has not moved under the capture.** `git diff --stat 5ab2f758..HEAD -- scripts/
   packages/` run this fire: **empty**. So v1's frozen capture is a valid baseline for the live tree,
   and I do not need to re-run v1 to compare against it (see R4).

It takes **neither** of his other two deferrals. See R5.

## The three widenings

- **W1 — parameter-bound anchors.** v1 resolves an anchor id by `lines.findIndex(l =>
  l.startsWith(\`const ${id} = \`))`. `copyProbe`'s `sandboxDecl` is a **function parameter**, so v1
  prints `UNREAD`. v2 resolves it from the **call sites of the enclosing function**: find the
  argument at `sandboxDecl`'s positional index at each call to `copyProbe`, then resolve each such
  argument as a top-level const. Each resolved value becomes its own anchor row, labelled with the
  chain that produced it.
- **W2 — non-`probe-` subjects.** v1 keys the counted-against file set on
  `/^const X = '(probe-[^']+\.mts)';/`, so `scripts/sweep-probes.mjs` is outside it. v2 admits **any
  single-quoted filename appearing anywhere in a copier that resolves to a real file in
  `scripts/`**, and prints how each subject entered.
- **W3 — the column-0 blindness v1 did not declare.** `startsWith('const <id> = ')` requires column
  0, so an *indented* anchor const is invisible too. v2 matches on the trimmed line and reports
  whether that changes the population.

## Predictions — committed before the instrument exists

| # | claim |
|---|---|
| **P1** | v2's copier population is the **same member list** as v1's — the two files v1's capture names — not merely the same count of 2. |
| **P2** | W1 resolves `sandboxDecl` to **exactly two distinct values**, and **both classify hand-typed**. Headline moves `1 UNREAD → 0` and `9 hand-typed → 11`. |
| **P3** | W2 admits **exactly one** subject v1 lacked: **`sweep-probes.mjs`**. `files: 5 → 6`. (`lib/probe-outcome.mts` is in `scripts/lib/`, not `scripts/`; `sweep-faithful.mjs`/`sweep-unprefixed.mjs` are sandbox paths, not repo files.) |
| **P4** | On the new `sweep-probes.mjs` column **every hand-typed anchor reads 0**. This is Theseus's "luck, not coverage" (§4) turned into a measurement: if any cell reads ≥1, the second declared gap *did* cost something. |
| **P5** | **The mechanism is not universal.** `SB374` and `SB375` each read **exactly 1 in `probe-round377`**, their own declaring file, because `377`'s own SANDBOX line names `.testdata/round377` and not `round374`/`round375`. So §3's **"nine of nine"** hand-typed anchors putting a second copy into their declaring file becomes **9 of 11**, and the precondition is a property of the **file pair** — the declaring file also carries the real line — not of hand-typing as such. |
| **P6** | v2 is a **strict superset** of v1: every one of v1's **12 COLLISION** cells reappears in v2 as a COLLISION, matched by `(anchor id, filename)` **pair**, not by recount. No shared column loses a cell. |
| **P7** | W3 changes **nothing** in this population — no anchor const is indented. If it changes something, v1 carried a **third** blindness that neither seat declared. |

P5 and P7 are the two that can embarrass me. P5 contradicts a sentence in Theseus's published §3;
if it is refuted, his sentence stands and my reasoning about the precondition was wrong. P7 asserts
an absence, which is the shape this project treats as highest-risk.

## Refusals, declared in advance

- **R1** — **no cure.** This unit changes nothing in `scripts/` or `packages/`. `git diff --stat --
  scripts/ packages/` will be run at wrap and reported, empty or not.
- **R2** — **no anchor value is typed into v2.** Every value is extracted from a copier's own source.
  A cell that cannot be extracted prints `UNREAD` with its reason; it is never dropped and never
  filled in. (Inherited from v1's R2, and it now also binds W1's resolution chain: if a call-site
  argument does not resolve to a top-level const, that row is `UNREAD`, not hand-read into the
  totals.)
- **R3** — **v1 is not edited.** `census-anchors.mjs` and `census-run-1.txt` stay a matched pair at
  `5ab2f758`. v2 is a separate file that names v1's path and that rev in its docblock.
- **R4** — **the v1 baseline is read from the committed capture, not from a re-run of v1.** Licensed
  by the empty `5ab2f758..HEAD` diff over `scripts/`+`packages/` verified above. A leg that read the
  frozen capture *and* re-ran v1 live would be neither a pin nor a gate.
- **R5** — this unit **does not derive `probe-round377`'s seven hand-typed anchors** and **does not
  promote the census into the gate**. Both are Theseus's items with his own named blockers
  (cross-pinned `C5`; no planted-duplicate red state built). Taking either here would be a cure
  without the grading legs its blocker exists to require.
- **R6** — **one real instance.** W1 has exactly **one** parameter-bound site in this population
  (`:685`). A resolver graded on one instance is graded on one instance; v2's reading of W1 is
  reported as such and not as a general capability.

Delivery is the wrapper's to log, not mine to assert.
