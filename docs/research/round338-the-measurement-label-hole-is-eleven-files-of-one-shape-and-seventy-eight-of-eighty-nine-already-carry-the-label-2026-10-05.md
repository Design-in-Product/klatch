# Round 338 — the measurement-label hole is 11 files of one shape, and 78 of 89 already carry the label

**Date:** 2026-10-05 (STOP fire)
**Seat:** Theseus
**Tree:** `origin/main` at `111555c6`, worktree clean, HEAD == `origin/main`
**Subject:** the lib-level measurement channel Daedalus routed to this seat in his Round 337 §7

## The question

Round 336 (mine) surfaced an item and deliberately did not claim it:

> `measure` records nothing — not its id, not its text. So no instrument anywhere can grade a
> measurement's labelling.

Round 337 (Daedalus) closed the file-local half inside `probe-round308` and routed the lib half
here, restating the premise as *"every other probe in the tree still has the hole I just closed in
one file."*

**Both statements are false.** This note is the measurement that retracts them and the reason the
lib change should not be built.

## What the lib actually contains

`scripts/lib/probe-outcome.mts` has **no measurement channel and never had one.** `SummariseInput`
(`:115-144`) is `probeName` / `results` / `skipped` / `inapplicable` / `regressionKind`;
`summarise` (`:150-210`) filters `input.results` by `kind`. Measurements reach the lib only if a
probe pushes them into `results` itself.

`measure` is therefore **not a lib export**. It is a per-file helper — 33 separate definitions of
it — which is why the population question has an answer at all.

Corollary, verified: `f089c671` (Round 337) touches exactly two files, and
`scripts/lib/probe-outcome.mts` is not one of them. "File-local" is exact.

## Census — all 194 files under `scripts/`, walked with `readdirSync`

| | shape | files |
|---|---|---|
| gradeable | `check(arm, what, pass, detail, kind)` with **no `measure` helper at all** | **55** |
| gradeable | `const measure = …` → `results.push({ arm, check, pass: true, kind: 'measurement' })` | 16 |
| gradeable | `const measure = …` → separate ids array | 6 |
| gradeable | label embedded in a template string (`probe-round240:63`) | 1 |
| **hole** | `const measure = (id, line) => { meas += 1; console.log(…) }` — counter-only | **11** |
| — | no measurement concept | 105 |

**89 record measurements · 78 carry the label · 11 do not.** (`probe-round261` uses both helper
shapes and is counted once, in the 16.)

### The 11

`probe-round203`, `204`, `205`, `300`, `301`, `303`, `304`, `307`, `309`, `310`, `311`.

### The five shapes, with a site for each

| shape | site |
|---|---|
| kind-param `check`, no `measure` | `probe-browse-endpoint-vs-channel-count.mts:106` — records; `:706` reads it back |
| `results.push` from a `measure` helper | `probe-round289.mts:84-85` |
| separate ids array | `probe-round308.mts:149-151` (Round 337), and `probe-round269`, `298`, `299`, `305`, `322` before it |
| label inside a template string | `probe-round240.mts:60-63` — `measurements.push(\`${arm}: ${what}\`)` |
| counter-only | `probe-round300.mts:92` — `meas += 1` and a `console.log`, nothing retained |

**Five of the six ids-array files predate Round 337.** The shape Daedalus reached for independently
was already the house's second-most-common answer.

## How the number was arrived at: 9 → 13 → 11

The final figure is only trustworthy as the output of the disagreement between keys.

- **v1 → 9.** Keyed the hole on a `measure` helper with no `.push` in its body, but let a
  **file-wide** `results.push({…kind…})` vouch for the file. Wrong for files whose `check` pushes a
  kind while their `measure` only counts: `probe-round310` and `probe-round311` are in the hole and
  v1 called them gradeable. **A detector must key on the measurement path, not on the file
  containing a kind field somewhere.**
- **v2 → 13.** Vouching scoped to the `measure` helper body alone. The four new rows were the
  signal, not the answer: two real (310, 311), two my own bug.
- **v3 → 11.** Both v2 misclassifications hand-read, because at a population of 13 the hand reading
  is primary:
  - **`probe-round284` — not a hole.** Pushes at `:103` with
    `kind: outcome === 'MEAS' ? 'measurement' : 'regression',` at `:107`, and reads it back at
    `:474`. My key was `` /\bkind[,}\s]/ `` — **a char class with no colon in it** — so `kind:` did
    not match, and a file that both records *and* grades its own measurement labels classified as
    the exact opposite. Fourth instance in six weeks of a source-scanning regex failing by
    returning a smaller number.
  - **`probe-round240` — not a hole, and a fifth shape.** The label is recorded inside a formatted
    string, recoverable by splitting on `': '`. No structured key can see it.

**Two independent keys converge on the same 11.** The narrow pass (classify only the 33 files
defining `const measure =`, by helper body) and the wide pass over all 194 files return an identical
member list. Two keys that fail in opposite directions agreeing on membership is the strongest
evidence available here.

### Validation set

Every detector version was graded against known positives copied from the real call shapes, not
reasoned about:

| file | expected | v3 |
|---|---|---|
| `probe-round289` | gradeable (`results.push`) | gradeable ✓ |
| `probe-round308` | gradeable (ids array) | gradeable ✓ |
| `probe-round323` | gradeable (both) | gradeable ✓ |
| `probe-browse-endpoint-vs-channel-count` | gradeable (kind-param `check`) | gradeable ✓ |
| `probe-round284` | gradeable (kind with colon) | gradeable ✓ |
| `probe-round240` | gradeable (string-embedded) | gradeable ✓ |
| `probe-round300` | hole (counter-only) | hole ✓ |
| `probe-round310` | hole (counter-only, kind-bearing `check`) | hole ✓ |

v1 failed rows 8 and `probe-round311`; v2 failed rows 5 and 6.

## Verdict — do not add a measurement channel to `probe-outcome.mts`

1. **The lib cannot grade what it would carry.** Round 336 measured the grading rule as *per-file*:
   five of five collision survivors deliberate, with `probe-round289`'s `[V5]` (check and
   measurement sharing one label on purpose, twice) the counter-example that makes a population-wide
   grade *wrong* rather than merely noisy. A `measurements?: MeasureRecord[]` field could only
   transport labels; the decision stays in the file.
2. **78 of 89 would not adopt it.** 55 have no `measure` helper to change; 22 already push into
   `results`. `sweep-probes.mjs:137-138` already documents the cost of two spellings coexisting
   (`measurementCheck` must count both `MEAS [F] …` and `  [C] MEAS  …`); a third would be ours.
3. **The gap in the 11 is latent, not live.** None of the 11 has a label arm to starve. The repair,
   when one wants one, is the two lines Round 337 wrote: a `string[]` and a `.push(id)`.

**Disposition:** the 11 adopt the ids array when a seat next opens one of them for its own reasons.
No population-wide pass, no lib change, no new arm. Same shape of answer as Round 336, one layer
down.

## The general form worth keeping

Round 336 produced: *before building a population-wide arm, measure whether the property it grades
belongs to the population or to each member.* Round 338 adds the prior step:

> **Before building a capability for a population, measure how much of the population already has
> it.** The motivating file not having a capability is not evidence that the tree lacks it. My §8
> generalised from one file — Daedalus's — to "anywhere", and the tree had the capability in 78
> places, 55 of them in a shape my key never looked at.

## Verification driven this fire

From captured files under `.testdata/r338-theseus/` (`.gitignore:33`), never from a pipe:

```
probe-round308   exit 0   All 23 regression checks passed.   8 measurements, 0 skips
                          31 labels (22 checks + 8 measurements + this arm), all distinct.
probe-round309   exit 0   All 17 regression checks passed.   5 measurements, 0 skips
```

Both byte-identical to Round 337 §6. No `npm test` and no full sweep this fire, and neither is
cited: the tree is unchanged from the one Round 337's gate graded (`git status --porcelain` empty,
HEAD == `origin/main` == `111555c6`), and an unrun gate reported as green is worse than one not
claimed.

Also verified in source: `probe-round289:172`/`:179` are `check('V5', …)` / `measure('V5', …)`;
`Z4_ID` survives in `probe-round308` only at `:891`, inside the prose explaining its retirement,
with the live label at `:909` a quoted literal.
