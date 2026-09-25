# Round 269 — the exit code was spent one level down, and the gate on `main` was red

**Daedalus, 2026-09-25 (START fire).** Answers Theseus's Round 268 §3 (the sweep collapses
"could not run" into "failed") and Daedalus's own Round 267 §5 (the `why` field is unenforced prose),
in one pass because he asked for them in one pass. Two findings arrived that were not in either item.

Deliverables: `scripts/sweep-probes.mjs` (modified), `scripts/probe-round269-blocked-is-a-third-outcome-and-the-exit-code-that-carries-it-dies-one-level-down.mts` (new, **43/43 exit 0, 3 measurements**), and an unplanned repair to two test files on `main`.

---

## 1 — The routed item, and the half it did not have

Theseus routed this: `probe-round223b` distinguishes **exit 2** ("could not run") from **exit 1**
("failed a check"); `sweep-probes.mjs` collapsed both into RED; so a red cleared by the operator
quitting his own dev server is indistinguishable from a regression. He named it a third kind of pin
after Round 261's fuses and gates — **cleared by someone stopping something legitimate.**

3001 was still held when this fire opened (`npm run dev` in the main checkout, `tsx watch src/index.ts`),
so the condition was live and drivable rather than reconstructed. Driven:

```
FAIL [B] the repaired round223b runs green against the tree it now describes
         — exit 2 after 368 ms — 3 PASS, 0 FAIL
1 of 21 regression check(s) FAILED.
probe-round225 exit = 1
```

**`probe-round225` exits 1, not 2.** Its arm B drives `probe-round223b`, decides on
`r223bExit === 0`, and maps exit 2 and exit 1 onto the same FAIL. The child's exit 2 appears in arm
B's own failure *detail* — it is printed, read by a human, and then thrown away.

> **A conversion from "could not run" to "failed" is lossless nowhere and invisible everywhere.**
> The exit code is the only channel that carries the distinction, and a driving arm that grades a
> child's refusal as a boolean spends that channel before anything downstream can read it.

So no amount of reporting in `sweep-probes.mjs` recovers tonight's red. The information is destroyed
one level below the file the item was routed to. **Arm B is Theseus's**; measured here, routed to him,
not changed here. Arm G3 asserts the `r223bExit === 0` conjunction is still present, so it goes red
when he repairs it — which is the signal to widen arm G1.

## 2 — BLOCKED is built, declared rather than sniffed, and priced honestly

`classify(code, out, expect, refusal)` returns `PASS | RED | BLOCKED`, with two limbs on the new
state for the same reason `verdict` has two:

```
BLOCKED  ⟺  exit code 2  AND  the entry's own declared `refusal` pattern appears in the output
```

**Why not a fleet-wide refusal regex.** Measured: the `exit(2)` sites spell the same intent as
"Stop it and re-run", "Refusing to start", "REFUSING:", "Cannot run [resolution-degenerate]",
"usage:", "No database at", "MISMATCH — …". Matching prose across that is this file's founding error
— *what a probe RUNS is not recoverable from what a probe SAYS* — aimed at a new target. Arm A6 is
the limb a plausible version of this would omit: an entry with **no** `refusal` declared gets no
benefit of the doubt, and its exit 2 stays RED.

**BLOCKED is not green, and the exit code says which.** `sweepExit` returns 0 clean, 1 on any red or
census problem, 2 when nothing failed but something could not run — the convention of its own subjects
propagated up one level rather than re-invented. Arm C7 asserts it can never be 0: collapsing a
blockage into a pass would reproduce the finding of `probe-round224`, which is *in* the swept set.

**And the honest price, arm G1: 0 of the 14 swept probes contains an `exit(2)` site, so BLOCKED
cannot fire on today's swept set.** 13 of 109 fleet probes do refuse with exit 2 and every one of
them is in DEFERRED. The state is built and driven — arm H spawns three minted scripts that really
exit 0, 1 and 2 — and it is waiting for a swept probe that propagates one. Stated in the file's
header rather than left for a reader to discover that the new column is always empty.

What the sweep *can* do on its own is annotate: a RED whose declared `refusal` text is present prints
a **HINT (not a verdict)**, moving no count and no exit code. Live output this fire:

```
RED     exit   1  probe-round225-a-citation-is-not-a-call.mts
        exit 1, summary line NOT FOUND — probe-round223b: something already holds 3001…
        HINT (not a verdict): the declared refusal text is present at a non-2 exit, so a
        driven subject may have refused and this probe graded that as a failed check.
```

## 3 — `verdict` became a wrapper, not a sibling

`probe-round261` arm D drives `verdict()` on four corners and arm E2 asserts it returns both values.
`verdict` was **not** copied into a three-valued twin; it is a wrapper over `classify`, so the two
cannot disagree. This is Round 263's rule turned on my own file — *a remedy that lives as a copy in
one file is not available to the next file, only to the next reader of that file* — and arm B here
re-drives Round 261's four corners through the new implementation rather than trusting the claim.

## 4 — The entry schema, and the sixth sighting of a drift I named myself

`entryProblems` closes the mechanically checkable half of Round 267 §5: every self-equal `N/N` and
every `N regression` in `why` must equal the count pinned in `expect`; at least one such claim must
be present; `expect` may not contain `\d`. Arm D6 keeps a non-self-equal ratio like `covered 12/14`
out of scope, so the rule creates no pressure to delete true prose.

**The vacuity check earned its keep immediately.** `probe-round259`'s entry stated no figure at all,
so the agreement rule passed it by making no claim. A rule an entry satisfies by saying nothing is not
a rule; `17/17` was added in the same commit as the rule.

The `N measurements` half can only be checked against the run. `measurementCheck` counts both live
fleet spellings (`MEAS [F] …` and `  [C] MEAS  …`), grades the claim when the run emits something
countable, and reports it as unenforceable prose when it does not — **unverified is not false.**

**First live run, two drifts, one of them mine:**

| entry | `why` claimed | run emitted | ids |
|---|---|---|---|
| `probe-round260` | 6 measurements | **7** | A3, C1, C5, C7, E1, E2, Z0 |
| `probe-round263` | 3 measurements | **5** | A0, C5, D3, E3, Z2 |

Both counted off fresh runs independently of the checker that flagged them, because a new checker's
first two findings are exactly the ones not to take on trust. `probe-round263` is **my** entry,
written in Round 263 — the round in which I first named this drift class. Sixth sighting. That is the
argument for a mechanism rather than another careful reading, made against its author.

**A correction to my own header prose in the same file.** The paragraph above first said that *most*
swept probes print no measurement line while their entries claim a count. That was a guess written
before the run. All 6 entries claiming a count emit countable lines; all 6 are enforced; none is
merely noted. Corrected in the file.

## 5 — Unplanned: the gate on `main` was red, and `npm test` could not reach a suite

`npm run typecheck` returned **9 `error TS`** at fire open. Not from this fire's work — the only
working-tree changes were under `scripts/`, and `packages/server/tsconfig.json` has `include: ["src"]`.
Provenance checked: `8ee4b919`, Argus, 2026-09-25, the three round13 test files from the audit branch.

- `round13-kit-briefing-updates.test.ts` — `Channel.type` is required, and a `Partial<Channel>` spread
  cannot supply it, so the fixture typed as `ChannelType | undefined` (TS2322 ×1). The sibling
  `kit-briefing.test.ts`, which this file is otherwise a near-copy of, has `type: 'chat'`. Added.
- `round13-streaming-params.test.ts` — an `Entity` literal inline at **8 byte-identical** call sites,
  each missing the required `effort` and `createdAt` (TS2345 ×8). Hoisted to one annotated `const
  ENTITY: Entity`, so the next required field on `Entity` breaks one line instead of eight.

**Why this mattered beyond 9 lines:** `npm test` runs typecheck first, so it exited 2 without running
a single suite. The test-count control every fire on this arc quotes was unavailable to **every seat**
for as long as that commit stood. Argus's own memo reports `vitest run round13` — 4 files, 35 tests,
green — and that is true and was never the check that would have caught this: `vitest run <pattern>`
does not pass through the typecheck stage that `npm test` does.

> **A green subset run is not a green gate, and the difference is a stage, not a sample.** Choosing
> the narrower command to go faster also chose a different pipeline.

Repaired rather than parked, because a red gate on `main` blocks controls fleet-wide and the fix was
mechanical. Argus's files; memo sent naming exactly what changed so he can object.

After the repair: typecheck **0 `error TS`**; server **137 files · 2148 passed · 1 skipped**; client
**38 · 324 passed · 13 skipped**. The server delta from Round 268's 134/2124 is **+3 files, +24
tests** — exactly Argus's three round13 files (8 + 9 + 7), which is the arithmetic that confirms his
commit is now fully landed rather than merely no longer breaking.

## 6 — A citation inside a string is not a call either

Arm G1's first version read `stripSource(src, false)` — comments stripped, strings kept — and went
**red naming this probe**. Arm H mints its blocked fixture from a string literal containing
`process.exit(2)`, so a probe that *stages* a refusal scored identical to a probe that *performs* one.
Round 225's title, on its author, one level in from where it was first found.

Measured over the fleet:

| reading | probe files with an `exit(2)` |
|---|---|
| strings **kept** | 15 |
| strings **blanked** | **13** |

The two over-reported are this probe and **`probe-round250`**, which nobody had noticed. The figure
`15` had already been written into `sweep-probes.mjs`'s header as the measured fleet count before arm
G4 produced the correction; it now reads 13, with the correction kept in the header rather than
silently swapped. Arm G5 drives the mask difference two-sided on a minted pair of files that differ
only in whether the same eighteen characters sit inside quotes — without it, G1 and G4 would both be
asserting a mask behaviour neither demonstrates.

This is a third member of Theseus's Round 268 §2 family (`emptinessSites`' initialiser capture
`[^\n;]*` cannot cross a line break) and my own Round 264 C2/C3 list: **a detector's mask is part of
its population definition, and a detector that reads the wrong mask reports a different census than
the one its prose claims.**

## 7 — Controls

`npm test` into a file, not a pipe (the rule that cost this seat a suite once):

- `probe-round269` **43/43 exit 0**, 3 measurements, 0 skips.
- `node scripts/sweep-probes.mjs` — **13 of 14 swept probes green, 1 red, 0 blocked, 0 census
  problems, 95 deferred.** The red is `probe-round225` and it is xian's dev server on 3001, annotated
  by the HINT added this fire. Exit 1, correctly: nothing here can make that a 2 (see §1).
- `node scripts/sweep-probes.mjs --census` — **census PASSED**, 14 swept / 95 deferred / 109 files,
  every entry agreeing with its own pin.
- `npm run typecheck` **0 `error TS`**; server **137 · 2148 · 1 skipped**; client **38 · 324 · 13**.
- `probe-round261` green (17/17) through the rewritten `verdict`, so Round 261's arms still hold.
- **0 model calls, no server, no port, no database, no corpus.** Every write under gitignored
  `.testdata/r269/`. Arm Z1 green — a before/after content fingerprint over `scripts/` and
  `packages/`, not an emptiness claim (Round 263).

## 8 — Routed

1. **To Theseus:** arm B of `probe-round225`. `r223bExit === 0` maps exit 2 and exit 1 to one FAIL;
   propagating the 2 is what makes the sweep's BLOCKED reachable, and arm G3 here goes red when you
   do it. His file, his arm, not urgent. Everything downstream is built and waiting.
2. **To Argus:** the two test-file repairs above, for objection. And the narrower point worth more
   than the fix: the subset command that went green does not traverse the stage that was red.
3. **To xian, unchanged and now fourth-flagged:** `docs/COORDINATION.md` is 3475 lines / ~202 KB and
   this seat's section has been read by `grep` for four fires. Updated this fire rather than skipped
   again, but it wants a decision about splitting the file, not another entry appended to it.
4. **Open, carried:** Round 264 C2/C3 (the census figure stays a lower bound) now with the mask-choice
   member from §6; the `HEAD:`-vs-pinned-hash class; 10 not-mine files carrying an asserted emptiness
   check; `verify-tsx-guard.mjs` in no schedule; 13 `verify-*` scripts swept by nothing; 95 deferred
   probes unexamined; `offer-choice.mjs` and `premise-render.mjs` uncovered; `index.ts` hand-captures
   two variables above `dotenv.config()`.
