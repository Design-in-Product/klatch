# unit-479braceslicekeys — the two brace-slicer population keys, member-for-member, over one tree

**Seat:** Theseus · **Fire:** 2026-11-18 WORK (14:47 PT) · **Pushed before the arm exists.**

## The two boarded items this takes, both unblocked

From `docs/operations/duty-cycle/theseus-tasks.md`, boarded 2026-11-18 START by this seat:

1. *"`unit-469braceslice`'s population moved 62 → 69 in one day and the unit has no mechanism that
   would notice."* The board says: **diff the two member lists, not the two counts.**
2. *"Reconcile the two brace-slicer population keys, member-for-member."* The board says: the work is
   **the member diff, run in one fire against one tree**, and explicitly records that the START fire
   refused to publish a reconciliation because the two readings available were *"from two keys on two
   dates, and a difference computed across both attributes to neither."*

Both are the same subject and both are driven here, in one fire, against one tree.

## The two instruments

| | `unit-469braceslice`'s arm | `scripts/verify-decl-body-slicers.mjs` |
|---|---|---|
| population source | **filesystem walk**, 4 roots (`scripts`, `docs/research`, `docs/operations`, `packages`), skips `node_modules`/`.git`/`dist`, **includes untracked** | **`git ls-files`** over the whole tracked tree |
| extensions | `.ts .mts .js .mjs .cts .cjs` | same **plus `.tsx`** |
| text read | **raw source** | `stripSource(raw, false)` — **comments blanked**, strings kept |
| in population | `OPEN_CMP` only → \|P\|; `OPEN_CMP && CLOSE_CMP` → SLICER | `OPEN_BRACE && CLOSE_BRACE` (one class) |
| guard key | paren comparisons **within 400 chars before** the first open-brace match; three-way with an AMBIGUOUS/WITHDRAWN class | `LPAREN && RPAREN && **COLON**` anywhere in the file; `MARKED` class for a declared marker |
| self-exclusion | its own arm path | `scripts/verify-decl-body-slicers.mjs`, `scripts/decl-body-slicers.baseline` |
| teeth | none (published figures) | **gates every commit** |

`verify-decl-body-slicers.mjs:71-72` carries a claim about this pair, in its own words:

> Character comparisons, either operand order — **the same shape as unit-469's census key, so the
> two instruments are keyed on one question and cannot disagree about who is in the population.**

That sentence is the subject of P6. It is a claim about **populations**, and it has never been
tested member-for-member. Nothing in it is about verdicts, so P7 tests something it does not claim.

## Published figures this unit treats as the baseline (captured, not typed — see R2)

`docs/research/unit-469braceslice-2026-11-17/drive3.arma.out`, the reading `RESULTS.md` published:
files walked **931**, \|P\| **66**, SLICER **62**, GUARDED 6, AMBIGUOUS 4, UNGUARDED **52**,
`RATE: 52/62 = 83.9%`, `LIVE: 45/52`.

The incidental re-reading that raised item 1 (`unit-476phantomdenom` drive 3, 11/18 START):
**57/69 unguarded, LIVE 49/57**.

## Predictions (registered before the arm exists)

- **P1 — reproduction.** The published arm, asserted byte-identical to its publishing rev
  `9f00b765` by hash, run at HEAD in this worktree, reports SLICER **≥ 69** and UNGUARDED **≥ 57**.
  *Expect HIT.* (The tree has only grown since the START fire; `unit-477ddlcolumns` landed between.)
- **P2 — the 62 → 69 movement is additions, not reclassification.** Every slicer member present
  today and absent from the published member list is a path whose `git log --diff-filter=A` first
  commit is **newer than `9f00b765`**. *Expect HIT.* Refuted if any today-only member existed at
  that rev — which would mean a file **gained** a brace comparison and the movement is partly
  behavioural.
- **P3 — no departures.** Published slicer members absent today: **0**. *Expect HIT.*
- **P4 — gate-only direction is non-empty and fully explained.** Members in the gate's population
  and not in the 469 SLICER set: **≥ 1**, and **every one** is explained by exactly one of two
  declared causes — outside the four walk roots, or extension `.tsx`. *Expect HIT.* A gate-only
  member explained by neither is a finding and refutes the second half.
- **P5 — 469-only direction is ALSO non-empty, and the mechanism is comment-blanking.** Members in
  the 469 SLICER set and not in the gate's population: **≥ 1**, and at least one of them is a file
  whose brace comparisons survive in raw text but **not** in `stripSource(raw, false)` — i.e. the
  comparison is quoted inside a comment. *Expect HIT.* (Untracked files are the other possible
  cause and are expected to contribute **0** today, worktree clean; see R1.)
- **P6 — the gate's own population claim is refuted.** Given P4 and P5, the two instruments **do**
  disagree about who is in the population, in **both** directions. *Registered expectation:
  the quoted sentence is FALSE as written.* Refuted if either difference is empty.
- **P7 — the verdicts disagree too, which neither instrument claims.** Over members **both**
  populations contain, `|gate-UNGUARDED ∩ 469-GUARDED| + |gate-GUARDED ∩ 469-UNGUARDED| ≥ 1`.
  *Expect HIT.* The keys differ in kind (400-char proximity window vs file-level presence + a COLON
  conjunct the 469 arm does not have), so agreement would be the surprise.
- **P8 — a number, so this is refutable rather than directional.** gate-only count **≤ 5**.
  *Expect HIT.*

## Registered refusals

- **R1 — an untracked file under the four roots makes the 469-only direction measure my own
  scratch.** The drive prints `git status --porcelain` and the untracked code-file list at drive
  time. If that list is non-empty, the 469-only direction is reported **split** into untracked and
  tracked causes and the P5 mechanism claim is **withdrawn** rather than credited.
- **R2 — the published member list is captured out of the artefact, never typed.** `drive3.arma.out`
  prints aligned, padded `UNGUARDED <path>` rows; the parse captures the path token. If the parse
  yields a member count that does not equal the artefact's own printed counts (62 / 6 / 4 / 52), the
  drive exits **`CAPTURE-FAILED`** rather than proceeding on a hand-typed list.
- **R3 — the gate's figures come from running the tracked gate in this fire**, not from a
  pre-commit log line in a session log or a memo.
- **R4 — liveness is out of scope and declared unmeasured.** This unit grades population membership
  and guard classification. The published `LIVE 45/52` → `49/57` movement is **not** explained here.
- **R5 — nothing is edited.** No change to `scripts/verify-decl-body-slicers.mjs`, to
  `scripts/decl-body-slicers.baseline`, or to the 469 arm. If the reconciliation implies a cure, it
  is **boarded, not landed**: editing a gate in the same fire that measures it is the shape this
  corpus has already filed twice.
- **R6 — no arithmetic reconciliation.** Every figure in RESULTS comes from one tree in one process.
  The START fire's refusal stands as the rule: a difference computed across two keys **and** two
  dates attributes to neither.
