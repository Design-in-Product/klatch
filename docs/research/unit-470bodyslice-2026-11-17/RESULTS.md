# unit-470bodyslice — RESULTS

**Seat:** Daedalus (Klatch) · **Fire:** 2026-11-17 WORK · 1 arm, 8 drives, 11 legs, 2 cripples.
Pre-registration pushed **before the helper or the arm existed**: `bc88f5c0`. Helper: `c8b8fd73`
(committed **before** the first cripple, so no restore could discard it). Arm + drives 1–3:
`4f510585`.

**Headline, drive 8 (restored tree, matched baseline):**
`FAIL legs=2 red=[A1a | A1c]` — **both reds are refuted predictions, not defects**: the two figures
I registered for P2/P1 were wrong, and the legs that say so are the ledger. Every leg grading the
subject is green. `drive8.restored-clean.err` **0 bytes** by `wc -c`.

**What landed:** `scripts/lib/decl-body.mjs` + `.d.mts` — the shared body slicer Theseus's
`unit-469braceslice` §2 routed to this seat, with **two cures, not one**, and a fourth mechanism
neither incident had found.

---

## §0 THE SHAPE OF THE ROUTED ITEM, AND WHY A SENTENCE COULD NOT HAVE WORKED

Theseus's census: **62 brace-balance slicers in the tracked tree, 6 guarded, 52 not, 45 of the 52
live.** His §2 refuted the premise of my own 11/17 routing — I had addressed a *general form* to
"whichever of us writes the next source scanner", and `|GUARDED| = 6` with four of the six written
**before** the two incidents, two of those four **mine**, one of them in the same directory on the
same day as an unguarded sibling. A cure already in your own prior work that does not reach your
next instrument is a **default**, not a knowledge gap. So: a module, not a sentence.

## §1 P1 REFUTED — his figure does not reproduce in my worktree, and neither number is the repo's

Driving **his unmodified arm** from my worktree (`drive1`, `.err` 0 bytes, `legs=0 red=[]`):

| | his drive 3 | my drive 1 |
|---|---|---|
| files walked | 931 | **1007** |
| slicers | 62 | **66** |
| unguarded | 52 | **56** |
| live | 45 | 45 |
| UNKNOWN | 4 | **8** |

**The cause is that the census walks the FILESYSTEM, not the index.** Six of my 56 unguarded members
are **untracked in git** (`git ls-files`, `drive2`): two `*.sliced.mjs` artefacts under
`round413-/round414-instruments/`, two `.scratch/apparatus-sliced.mts`, two
`unit-465widen/scratch/composed-slices*.mjs`. A1c predicted the delta would be *exactly* those
untracked files (4) and it is **not** — 6 untracked in mine against a delta of 4, which means **his
52 contains 2 untracked members of his own worktree**. Neither 52 nor 56 is the repository's figure.

**The repo-level number, tracked only: 50 unguarded.** This is the finding that matters for the
detector in §6: a detector keyed on a filesystem walk gives every seat a different number and lets
an untracked scratch file redden or green a shared gate. It must key on `git ls-files`.

## §2 P2 REFUTED, narrowly, and the decision it was registered to make still stands

Registered: ≤ 4 under `scripts/`, ≥ 44 under `docs/research/`. Measured: **5 under `scripts/`,
51 under `docs/research/`.** A1b lands, A1a is red by one.

The decision P2 was registered to make is unchanged: **91% of the exposure is in frozen one-off
research arms whose figures are already published**, so a migration pass over the 56 buys nothing.
The value is the helper for the next instrument plus a detector for the next hand-rolled slicer.
But "≤4" was my number and it was wrong, and the 5 in `scripts/` are the imported/probe surface —
named, not generalised, in `drive8.restored-clean.out`.

## §3 P3 LANDS — naive wrong on 3 of 3, helper right on 3 of 3, on REAL declarations

No fixture I typed: three live corpus declarations, one per known mechanism (`drive8` A2).

| mechanism | site | naive | helper |
|---|---|---|---|
| JSDoc `@type` braces | `scripts/lib/strip-source.mjs` → `stripSource` | **9 ch**, token absent | 4902 ch, token present |
| object default / inline options type | `packages/server/src/db/queries.ts` → `createGroundRulesPreset` | **40 ch**, `INSERT INTO` absent | 786 ch, present |
| brace-bearing return type | `packages/server/src/claude/client.ts` → `assembleSystemPrompt` | **2 ch**, token absent | 5558 ch, present |

A 2-character "body" is what the 56 unguarded slicers see when they census
`assembleSystemPrompt`. The naive reader in the arm is the defect written out deliberately as the
comparison arm, not a strawman: it is `indexOf('{')` from the head plus a raw brace balance, which
is what all 56 do.

## §4 THE FOURTH MECHANISM — a brace-bearing RETURN TYPE, and it defeats the cure as routed

Found by this module's own first measurement, not by either incident. `assembleSystemPrompt` is

```ts
export function assembleSystemPrompt(entity: Entity, …, options: PromptAssemblyOptions = {}): { prompt: string; floorApplied: boolean } {
```

A slicer that paren-matches the parameter list — the cure both bitten seats arrived at, and the
thing Theseus's census calls GUARDED — then takes the first `{` and lands on **the return type**.
**All six GUARDED files are exposed to this.** (A6b, proxy: 0 of the 6 compares against a `:` at
all. Declared as a proxy; it can support the exposure claim, never refute it.)

**Live sites in `packages/`, counted by the helper itself: 16** — including `createMessagePair`,
`getChannelsEmptiedByEntityDelete`, `searchClauses`, `entityTranscriptWhere`,
`findEntityTranscriptChannelsByName` in `queries.ts`, the file `unit-468createlit` censused
yesterday. Named in `drive8.restored-clean.out` A6.

**Refused, explicitly:** I did **not** re-measure the 56 against this mechanism. A6a establishes
that the exposure exists and its size in `packages/`; it does not say how many of the 56 slicers
read a file containing one. The refusal is printed in the arm's own verdict line, not only here.

## §5 THE TWO CRIPPLES — and the finding that one cripple could not grade two cures

**C1** (`drive5`): the routed cure removed — the brace search starts at the head again
(`indexOf('{', parenOpen)`). Predicted 3 differential sites red, control green.
**Measured: 2 of 3 red, control green.** The **JSDoc site survived**, because its braces live in a
*comment*, and every depth walk in this module runs over `stripSource(src, true)`. So the three
mechanisms are cured by **two different lines**, and the JSDoc one is cured by the composition, not
by the paren guard. P4 refuted in the informative direction.

**C2** (`drive6`): the composition removed (`codeOf` returns `src` raw), paren guard intact.
**Measured: nothing reddened — A2b stayed 3 of 3.** But the returned body for `stripSource` was
**1545 ch against the cured reader's 4902 ch**: a span that stops early on a brace inside a string
or comment *in the body*, and still contains the token the leg looks for.

**A containment predicate cannot tell a correct span from a wrong one that holds the needle.** The
second cure had no leg able to grade it, and the arm came back green on a crippled subject. Leg
**A2c** was added at `drive7` — *the body must be brace-balanced under the stripped reading*, an
invariant rather than a hand-typed answer key — and it reddens exactly one site under C2
(`UNBALANCED stripSource: open=4 close=3 len=1545`) and is green 3/3 on the restored tree
(`drive8`). The general form for the next instrument:

> **A cure whose damage is a wrong SPAN cannot be graded by a predicate keyed on the span's
> CONTENTS.** Containment is satisfied by any span large enough to hold the needle, so a cripple
> that shortens a span by 3357 characters reads green. Grade the span by an invariant it must
> satisfy (balance, non-overlap, boundary characters), not by what it contains.

## §6 THE DETECTOR — **BUILT**, after this section was written saying it would not be

**This section's heading read "specified and priced, NOT built in this fire" when it was written,
with "a scope choice" as the deferral.** The deferral rested on an elapsed-time estimate made *from
effort expended* rather than from `date`: at the point of writing I believed ~45 minutes had gone,
against **14** actual (`date` 13:17:07 → 13:31:47). The blocker was my own arithmetic, so the item
was unblocked and is now done. `scripts/verify-decl-body-slicers.mjs` +
`scripts/decl-body-slicers.baseline`, commit `6b98355b`, **wired into `scripts/hooks/pre-commit` as
a second leg** beside the census self-enrolment check and exercised by the commit that landed it.

**Green state (`drive19`):** population **62 tracked slicers — 59 UNGUARDED (baselined),
2 GUARDED, 1 MARKED**; 968 tracked files read. `DECL-BODY SLICERS OK`.

**Known positives, both directions, because a detector that reports zero has not been shown able to
report one:**

| drive | state | result |
|---|---|---|
| 16 | a new unguarded slicer staged, unmarked | **RED**, 1 new slicer, names the path |
| 17 | the same file with the site marker | **GREEN**, `MARKED 2` |
| 18 | baseline entries pointing at a now-GUARDED file and an absent one | **RED ×2, with the reason per entry** (`→ now GUARDED`, `→ now ABSENT`) |

### §6a The detector's first drive called the cure itself a new defect

`drive13`: **0 GUARDED across a population of 62**, with `scripts/lib/decl-body.mjs` — the module
this unit exists to add — reported as a new hand-rolled slicer that must be baselined.

The guard key was read from `stripSource(raw, true)`, the **strings-blanked** reading, where
`=== '('` has become `===  `. **Every one of this detector's keys is a comparison against a quoted
character, so the guard conjunct was unsatisfiable** while the population key (read from the raw
text) matched fine. The repair is `stripSource(raw, false)` — comments blanked, strings kept, which
is the reading `strip-source.mjs`'s own header names for a caller looking for a quoted literal — and
it is now used for the population key as well, so a brace comparison quoted inside a comment no
longer puts a file in the population at all.

**The tell was the saturated verdict.** A three-way classification returning zero in one class is
evidence about reachability before it is evidence about the tree. I had the lesson filed
(`feedback_a_selectors_two_conjuncts_can_be_mutually_unsatisfiable`) and still wrote it.

### §6b The ADOPTED class was dropped, because it credited this unit's own arm

`drive13` classified files importing `lib/decl-body.mjs` as ADOPTED, and the one member of that
class was **`arm-bodyslice-a.mjs` — which imports the shared reader *and* hand-rolls a naive slicer
beside it, deliberately, as §3's comparison arm.** An import is a **file-level** fact and this defect
is **site-level**, so an adoption key over-credits exactly the files most likely to carry both.
There is now no ADOPTED class: a file that genuinely delegates has no brace comparison of its own and
is out of the population by the key itself, and a deliberate reproduction carries
`brace-slicer-deliberate: <reason>` **at the site** — which travels with the code, unlike the path
allowlist §9 warned against.

### §6c What the detector does not claim

- It grades **the reader each file uses, not the figures any file has published**. Printed in its own
  green output, not only here.
- Its GUARDED key is the three-conjunct one (paren ×2 + colon), so **the six files `unit-469braceslice`
  called GUARDED are in the baseline as unguarded**, deliberately: they paren-match the parameter
  list and do not handle the return type (§4). The baseline header says so.
- The marker is honour-system: nothing checks that a marked file's reproduction is really
  deliberate. A marker census is a cheaper second unit and is not built.

## §6-OLD THE DETECTOR AS SPECIFIED BEFORE IT WAS BUILT (kept, because §6a is a finding against it)

Named with its blocker, not a date. What it must be, from §1 and §4:

1. **Keyed on `git ls-files`, not a filesystem walk** (§1 — otherwise every seat gets a different
   number and an untracked scratch file moves a shared gate).
2. **Baselined by path** against the 50 tracked unguarded members, so it reddens on a **new**
   hand-rolled slicer and not on the frozen 50. A baseline entry that stops matching must also
   redden — a pin whose red is cleared by editing the list is a gate, which is this corpus's
   established shape (`probe-round261`).
3. **It must exclude its own file and its own fixtures**, or it reddens in every cell — this seat
   has shipped exactly that defect before.
4. Its population key must cover the **return-type** mechanism as well as the parameter list, or it
   will certify the six GUARDED files as cured when §4 says they are not.

**Price, as estimated before building:** ~120 lines plus a baseline list and two known-positive
fixtures, "a second unit, not a tail on this one." **Measured: 150 lines, a 59-entry generated
baseline, one fixture driven twice and one baseline cripple — inside the same fire.** The estimate
was not far wrong on size; what was wrong was the elapsed-time belief that made it unaffordable.

All four requirements above survived contact, and requirement 4 is the one that changed the output:
under the three-conjunct guard key the six files `unit-469braceslice` called GUARDED are baselined as
unguarded, which is the whole point of §4 and would have been invisible under a paren-only key.

## §7 P6 LANDS, with a figure

The helper over **72 tracked files** of `scripts/lib` + `packages/server/src` + `packages/shared/src`
(tests excluded): **488 heads matched — 401 block bodies, 28 concise, 59 refused.** The refusals are
`no-body-brace-after-the-parameter-list` ×33 (TS overload signatures, interface members and ambient
declarations the head key reaches but which have no body),
`return-type-annotation-on-an-arrow-declaration` ×25, `no-body-brace-after-the-return-type` ×1.
**Single-identifier arrows the head key does not match: 0** in this surface — so that declared limit
is real but currently unexercised here.

Every refusal carries a named reason and **stays in the population** (A5b). That is deliberate: a
member no key can grade must remain visible to the census that walked it, which is the opposite of
the defect that started this chain, where two members fell out of a population with no error.

## §8 PREDICTION LEDGER

**6 registered; 3 land, 3 refuted.**

| | prediction | outcome |
|---|---|---|
| P1 | his figures reproduce exactly | **refuted** — 66/56/8 vs 62/52/4; the population is worktree-dependent and neither figure is the repo's (50) |
| P2 | ≤4 in `scripts/`, ≥44 in `docs/research/` | **refuted** (5 / 51); the decision it was for is unchanged |
| P3 | naive wrong 3/3, helper right 3/3 | **lands** |
| P4 | C1 reddens 3 differential legs, control green | **refuted** — 2 of 3; the JSDoc site is cured by the other line |
| P5 | the helper classifies GUARDED under his arm | **lands** — see §9 |
| P6 | at least one real form outside the matched set | **lands** — 59 refusals, 3 reasons |

## §9 P5 — the cure does not enter the population it drains

`drive1` was taken **before** `scripts/lib/decl-body.mjs` existed. Re-running his unmodified arm
against the tree that now contains it (`drive11`, `legs=0 red=[]`) classifies it **GUARDED**: the
module paren-matches the parameter list before any brace scan, by construction. A hygiene instrument
that lands in its own population reddens in every cell, and this seat has shipped that defect; this
is the first live test of the lesson.

**And the population moved by two, not one — the second one matters for §6.** `66 → 68` slicers,
`56 → 57` unguarded. The two new members are `scripts/lib/decl-body.mjs` (**GUARDED**) and
**`docs/research/unit-470bodyslice-2026-11-17/arm-bodyslice-a.mjs` (UNGUARDED, and correctly so)** —
the arm carries a naive first-`{` brace walk *deliberately*, as the comparison arm that makes §3's
differential possible, and his liveness test names it live at `4/5 resolved subjects`.

So the act of curing this defect **raised** the census's unguarded count by one, and the detector in
§6 would redden on an honest arm whose whole job is to reproduce the defect. A detector over this
population needs a way to mark a deliberate reproduction — a declared marker at the site, not a
path allowlist, since the next such arm will live at a path nobody has written down yet.

## §10 GATE, DRIVEN FRESH

Recorded in `drive9.typecheck.out`, `drive10.server-suite.out`, `drive12.client-suite.out`, and the
pre-push census output in this fire's log. **Cripples restored** by
`git checkout HEAD -- scripts/lib/decl-body.mjs` after C1 and after C2, each verified by
`grep -c CRIPPLE` → **0** and `git status --short -- scripts/` → empty before the gate ran.
