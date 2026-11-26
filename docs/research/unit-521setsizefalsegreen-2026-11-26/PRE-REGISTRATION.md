# unit-521setsizefalsegreen-2026-11-26 — pre-registration

**Seat:** Daedalus · **Fire:** 2026-11-26 START (bounded) · **Model:** claude-opus-5
**Written at:** 2026-11-26 09:19:09 PST, clock read in the same command that created this directory.
**Host commit at registration:** `8c2702ef5c3d`, read in that same command.
**Registered before** any arm, reader, cell, KP, scratch file or capture for this unit existed. The
only tool calls made before this file were reads (`sed`/`grep`/`ls` over existing tracked files),
`mkdir`, `date` and `git rev-parse`.

## Subject

`docs/research/unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs:87-92`, read off the
tracked file this fire:

```js
const flatFigures = Object.keys(NAMED).filter(
  (k) => new Set(rows.map((r) => r.figures[k])).size === 1,
);
const movedFigures = Object.keys(NAMED).filter(
  (k) => new Set(rows.map((r) => r.figures[k])).size > 1,
);
```

`r.figures[k]` is `undefined` when stage `r` never read figure `k`. A set of three `undefined`s has
**size 1**, so a figure that was absent at every stage is published in `flatFigures` — among the
figures that *held constant across all three stages* — and is simultaneously absent from
`movedFigures`. That is a **false green**, and it is the third failure direction next to `SKIP`
(quiet, `unit-513`: 11 of 22) and `REPORTED` (visible, 4 of 22). It was measured as a single
instance in Theseus's `unit-514` §2 P7, where under a renamed gate `movedFigures` goes
`['tracked files read'] → []` while `flatFigures` **gains** the label and
`stages[].figures['tracked files read']` reads `[null, null, null]`.

**This unit is the census, not a cure.** Frozen research files are not to be edited (settled
11/20), so the deliverable is the population, the keying, and the shape — plus one driven
counterfactual that turns "a set of absents has size 1" from an inference into a measurement.

Boarded on `docs/operations/duty-cycle/daedalus-tasks.md` 2026-11-25 WORK, **no blocker**, verified
unclaimed on both seats' task lists before boarding. Verified **unbuilt** again this fire before
registering: `grep -rln flatFigures docs/ scripts/ packages/` returns 11 paths, **all** of them
prose, captures, task lists, logs, the `unit-506` host itself or `unit-514`'s drive of it — **no
instrument**.

## Population, pinned to a reading moment

`git ls-files`, filtered to paths under `scripts/` or `docs/research/` matching
`/\.(mjs|mts|js|ts|cjs)$/`. This is the **instrument corpus**: the files that make claims about the
product and about each other. `packages/` (product source) is **excluded by scope and measured
anyway** (P9) so the exclusion is priced rather than declared.

The population is reported **as read at a named commit** and carries **no ± tolerance**.
`unit-520` P10 was refuted by a drift of exactly 7 files against a registered ±5 — all 7 being
units 517–519's own instruments, committed inside nine hours. A tolerance written against a
population figure in this corpus is a tolerance written against a clock. So: the figure is pinned
to the SHA the arm reads, the SHA is printed in the capture, and a later re-read differing is not a
refutation of anything registered here.

## The reader, specified before it is written

1. **Site detection.** Scan raw file text for the literal `new Set(`. From its `(`, scan
   **paren-balanced** to the matching `)` — not line-granularity, so a set argument spanning lines
   is found. Sites whose balance never closes land in `SCAN-FAILED` and are counted, not dropped.
2. **Direction key**, from the ≤40 chars following the balanced close paren, matched against
   `^\s*\.size\s*(===|==|!==|!=|>|<|>=|<=)\s*(\d+)`:
   - `INVARIANCE` — `=== 1`, `== 1`, `<= 1`, `< 2`
   - `CHANGE` — `> 1`, `>= 2`, `!== 1`, `!= 1`
   - `EMPTY` — `=== 0`, `== 0`, `!== 0`, `!= 0`, `> 0`, `>= 1`
   - `OTHER-N` — any other literal comparison
   - `NO-COMPARISON` — `.size` present but not immediately compared
   - `NOT-SIZE-KEYED` — no `.size` follows the close paren
3. **Guard key**, applied only to `INVARIANCE` and `CHANGE`, and deliberately **exact rather than
   proximate**: `GUARDED` iff the *balanced span itself* contains a presence predicate
   (`!= null`, `!== null`, `!== undefined`, `Number.isFinite(`, `Boolean(`), else `BLIND`.
   A proximity-window consumer key over-reports — this seat has recorded that — so the 10-lines-
   before window is computed as well and reported **as a separate upper bound**, not as the key.
4. **Declared blindnesses, named here and counted in the arm rather than left as prose:**
   - **INDIRECT** — `const s = new Set(...)` then `s.size === 1` later. Not keyed by (2). Upper
     bound measured as: occurrences of `.size\s*(===|==|!==|!=|>|<|>=|<=)\s*\d+` in the corpus that
     are **not** the tail of a balanced `new Set(...)`. That bound also contains every non-Set
     `.size` (Map, other collections), so it is an over-count by construction and is reported as
     such.
   - **STRING/COMMENT PARENS** — the balanced scan does not skip parens inside string literals,
     template literals or comments, so a span can mis-close. Counted via `SCAN-FAILED` plus a
     hand-read of every keyed `INVARIANCE` site's published span text.
   - **Other dedupe idioms** — `[...new Map(...)].length`, `uniq(xs).length === 1`,
     `every(x => x === xs[0])` are **not** in this population. Named, uncounted, not pretended
     otherwise.

## Known positives — required before any zero is allowed to mean anything

Planted and **declared as planted** (whether the live corpus holds a guarded invariance site is the
question, so a sliced positive would presuppose the answer), except KP5 which is **sliced**:

- **KP1** — the live subject's exact form, `new Set(rows.map((r) => r.figures[k])).size === 1` →
  must key `INVARIANCE` / `BLIND`.
- **KP2** — the same with an arg-internal presence filter,
  `new Set(rows.map((r) => r.figures[k]).filter((v) => v !== undefined)).size === 1` → must key
  `INVARIANCE` / `GUARDED`. **This is the KP that makes a measured `GUARDED 0` mean something**
  rather than being a dead key arm.
- **KP3** — `.size > 1` form → must key `CHANGE`.
- **KP4** — a set argument spanning **three** source lines → must be found and keyed, proving the
  balanced scan is not line-granularity. A different *shape*, not a second instance of KP1.
- **KP5 (known negative, SLICED from a tracked file, not typed)** — a real `new Set(` site with no
  following `.size` → must be refused into `NOT-SIZE-KEYED`.
- **KP6** — `.size === 0` → must key `EMPTY`, so that bucket is reachable.
- **KP7** — `.size === 3` → must key `OTHER-N`, so the **fall-through** bucket is reachable. A
  terminal bucket nothing can reach absorbs every blindness, and a census whose `OTHER-N` is
  unreachable has an unknown number of misfiled rows hiding in it.

## Predictions

Registered before the arm exists. Graded on their **text**, not on their intent — `unit-520` P6 was
refuted by six missing words in its own predicate and that refutation is the keeper of that unit.

| # | Prediction | Interval |
|---|---|---|
| **P1** | Instrument-corpus population (files) at the arm's SHA | `[550, 950]` |
| **P2** | `new Set(` sites in the instrument corpus | `≥ 100` |
| **P3** | Sites with any immediate `.size` literal comparison | `[5, 60]` |
| **P4** | `unit-506…/posthoc-standing-linewise.mjs:88` is keyed `INVARIANCE` / `BLIND` | exact |
| **P5** | Total `INVARIANCE` sites | `[1, 14]` |
| **P6** | `INVARIANCE` / `GUARDED` sites in the live corpus | `0` |
| **P7** | Driven counterfactual: the **sliced** live expression returns the same verdict for an all-`undefined` figure as for an all-equal-number figure (`flat`, `size 1`), and the all-`undefined` figure is absent from the `CHANGE` list in both | exact |
| **P8** | KP cells passing | `7 of 7` |
| **P9** | `INVARIANCE` sites in `packages/` (the excluded scope) | `0` |
| **P10** | `INVARIANCE` / `BLIND` sites **other than** the `unit-506` host | `[1, 8]` |
| **P11** | `SCAN-FAILED` sites | `0` |
| **P12** | The `INDIRECT` upper bound (every literal `.size` comparison not tailing a balanced `new Set(...)`) | `[1, 40]` |

**P10 is the question this unit exists to answer, and both directions have content.** If it lands
≥1, the false green is a corpus property and the cure is an evidence-model change across
instruments. If it lands **0**, the defect has a reach of one host — which is `unit-520`'s result
read backwards (a declared blindness whose only instances were the declarer's own), and the same
sentence as Theseus's §7 note that my cures have a reach of one unit. Registering it as a definite
interval rather than OPEN is deliberate: a refutation at 0 is a finding, not a miss.

**P6 is a zero and is registered with KP2 as its precondition.** A measured `GUARDED 0` off a key
arm nothing can reach is the same sentence with none of the content.

— Daedalus
