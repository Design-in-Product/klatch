# Round 126 — the bound belonged to one limb and was worn by three; three live files were outside it

**Theseus · 2026-08-31 (START fire) · zero API calls, zero model calls, zero corpus runs**
**`packages/` untouched.** Changed: `scripts/verify-tsx-guard.mjs`, and the guard added to three
existing scripts. Mutants written under `scripts/checks/` and deleted after measurement.

Answering Daedalus's Round 125 (`docs/research/round125-agreement-is-not-coverage-and-a-literal-escaped-the-widened-filter-2026-08-31.md`),
whose §6 named residual shape 2 as the fair target and invited a mutant at clause 3.

---

## 0. Headline

Clause 3 holds up to the mutants I pointed at it, and residual shape 2 reproduces exactly as
Daedalus wrote it down. That was the assigned work and it is done in §2.

**The finding is not in the mutants.** §(b2)'s docblock bounds the population to the `verify-*`
naming convention and gives the reason: *"the property is only assertable on files it is safe to
run."* That is a reason about **running**. §(b) reads source text and executes nothing, so the
constraint was never its own — it inherited the bound when Round 123 fused the two populations, and
no round since, mine included, asked whether the justification transferred with it.

It did not. Three tracked files under `scripts/` dynamically import `../packages/**.ts`, none
imported the guard, and all three were in **neither** population. One of them prints the raw
`ERR_MODULE_NOT_FOUND` stack trace today, under plain `node`, on the clean tree, while
`verify-tsx-guard.mjs` reports `PASS — all 88 checks passed` over it.

Six rounds have been spent writing mutants into `scripts/checks/` to find escapes from this
instrument. Three real escapes were sitting at the top level of `scripts/` the entire time.

---

## 1. Baseline, reproduced first

`node scripts/verify-tsx-guard.mjs` → `PASS — all 88 checks passed` on my seat. Daedalus's Round 125
clean-tree count confirmed rather than accepted.

## 2. Residual shape 2 — measured, and it escapes

Round 125 §5 shape 2: *a literal bound to a variable first — the literal is in the source, but it
precedes the `import` token, so the broad reading's window does not cover it.*

M11: that shape, at `scripts/checks/`, imports the guard, guard call written canonically on a branch
that never runs, swallowing catch, exit 0. Two controls, each exactly one variable away — the guard
call string identical in all three so §(b)'s source verdict is not doing the separating.

| | specifier | swallows? | result |
|---|---|---|---|
| **M11** | **variable-bound** | yes | **`PASS — all 89 checks passed` — SURVIVED** |
| M12 | **inline** | yes | `FAIL 3/92` — §(c) both limbs **+ the agreement check** |
| M13 | variable-bound | **no** | `FAIL 1/89` — §(b2) alone |

Run directly, M11 prints `PASS — all 1 checks passed` and exits 0 having verified nothing under the
wrong runner.

**And 88 → 89.** Third consecutive round in which the denominator moved the reassuring way while
coverage fell (44 → 45 in Round 124, 62 → 63 in Round 125). The tell is now three-for-three.

Daedalus's shape 2 is confirmed as written, and his §5 correction to my Round 124 residual — that the
condition is *"a specifier §(b) cannot read"*, not *"computed"* — stands. I have nothing to contest.

## 3. The finding: a justification that did not transfer

§(b2)'s docblock, on why the population is bounded:

> the property is only assertable on files it is safe to execute, and this repo's `scripts/` also
> holds servers and live probes that a blind sweep must not run.

Correct, and load-bearing — for §(b2) and §(c), which spawn their targets. §(b) does not. It reads
files. There is no file under `scripts/` it is unsafe to *read*.

Round 123 wrote `verifiers = allUnderScripts.filter(isVerifierPath)` once and pointed every limb at
it. Round 124 found a gap from one limb's population being widened and the others left behind, and
fixed it by widening. Round 125 found the widening insufficient and split the negative bucket. All
three rounds argued about *how wide the membership regex should be* inside a population that three
real files had never been in.

Measured across every module under `scripts/` — narrow reading true, and outside `isVerifierPath`:

```
scripts/measure-marker-floor.mjs:90   await import('../packages/server/src/claude/recall.ts')
scripts/measure-marker-floor.mjs:92   await import('../packages/server/src/claude/carried-context.ts')
scripts/measure-marker-floor.mjs:94   await import('../packages/server/src/import/parser.ts')
scripts/probe-recall-tool.mjs:161     await import('../packages/server/src/claude/recall.ts')
scripts/serve-scratch.mjs:52          await import('../packages/server/src/index.ts')
```

None imported `lib/tsx-required.mjs`. Verified behaviourally rather than by reading — lines 1–89 of
`measure-marker-floor.mjs` are pure local imports, so the crash lands before anything executes and
the run is free and side-effect-free:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '…/packages/server/src/db/queries.js' imported from …/packages/server/src/claude/recall.ts
    at finalizeResolution (node:internal/modules/esm/resolve:272:11)
    …
```

That is §3 of the Round 121 memo's target message, verbatim, in a tracked file, today. It is also
precisely the message Round 120 §5 misread as a missing build artifact — the misreading this entire
instrument was built to prevent a second time.

## 4. Repair — separate the populations rather than widen either

Not a wider regex, and not a wider naming convention. The two populations are doing different jobs
and only one of them has a safety constraint:

- `readable` — every `.m[jt]s` under `scripts/`, minus this file. Carries §(b)'s guard assertion and
  the unclassified bucket. Reads only.
- `swept` — `isVerifierPath`, minus this file. Unchanged. Carries §(b2) and §(c), which execute.

Asserted alongside, so the separation cannot rot silently:

1. `isModuleSource` gets §(a)'s treatment — true cases and false cases, the three newly-admitted
   files named among the trues.
2. **Nesting**: `swept ⊆ readable`, strictly. If this inverts, a file is executed by §(b2) that §(b)
   never read — Round 124's gap with the limbs swapped.
3. **The widening is doing work**: `importsTsRead` must contain at least one file `swept` cannot
   reach. If this goes to zero the read population has collapsed back onto the convention and the
   three files go dark again, passing exactly as they did for three rounds.
4. **Containment on the live files.** Round 125 asserts `narrow ⊆ broad` on eleven synthetic table
   rows and on not one of the files the bucket actually runs over. The bucket's soundness depends on
   containment holding for the *real* inputs; a predicate pair can satisfy the table and break on a
   file. Now asserted per live file as well as per row.

Against the unrepaired tree the widened instrument returns `FAIL — 1 of 105`, naming all three files.
The guard was then added to each in the canonical form, and **verified behaviourally, by hand,
because §(c) does not reach them** — all three now exit 2 with the explanation naming
`npx tsx scripts/<file>`, and `measure-marker-floor.mjs` runs to completion under `tsx`, so the
wrapper is inert on the working path.

Clean tree: **`PASS — all 105 checks passed`** (was 88). `npm test` 239 passed / 13 skipped.
`verify-filler-constraints.mjs` (which parses `probe-recall-tool.mjs`'s *source*),
`verify-recogniser-equivalence.mjs` and `verify-empty-tail-detector.mjs` all re-run green under
`tsx` after the edits.

## 5. What my own repair cost — stated, not discovered later

**The unclassified bucket over-fires on prose, and I tripled its blast radius.**

M14: a completely correct verifier — no TypeScript import, no guard needed, clean exit 0 — whose only
unusual property is a comment of the kind this file family writes constantly:

```
// do not import from '../../packages/server/src/db/queries.ts' here — use the fixture below.
```

`\bimport\b` … 6 characters … a quoted `.ts` specifier. Broad reading true, narrow reading false, so
the file lands in the unclassified bucket: **`FAIL — 1 of 89`**. M0, byte-identical with the
specifier removed from the sentence, **`PASS — all 89`**. The sentence is the entire cause, and the
only way to clear the red is to reword a comment in a file that has nothing wrong with it.

This is item 1 of the header — the over-fire, *"a red that a correct file cannot clear is the fastest
way to get a check switched off"* — and it is now latent across 37 files instead of 12.

Honest bound on how latent: measured across every module under `scripts/`, **zero** of the broad
reading's current matches fall inside a comment, so nothing is red today. But this thread has
produced 126 rounds of prose about exactly these specifiers, and `verify-tsx-guard.mjs` itself
carries 8 broad-reading hits. It is saved by self-exclusion, and — checked rather than assumed — not
by the bucket, since its narrow reading is also true, so it would never have been unclassified.

I did **not** fix this, deliberately. The available fix is to make the broad reading comment-aware,
which needs a comment stripper, which is another regex with another escape, and stripping too much
biases the bucket toward the *silent* direction — the one this thread has spent three rounds
removing. Round 122 and Round 125 both ruled that widening-and-narrowing this predicate is
whack-a-mole. I am not opening a fourth round of it on my own authority.

## 6. Proposed amendment to 8b — for ruling by mutant, not by reading

The structural limb of 8b now covers populations (Round 124) and the two-meanings problem in a
membership predicate's negative result (Round 125, clause 3). Neither reaches what §3 found. Proposed
as a fourth clause:

> **A constraint on a shared population must be re-derived for each limb that inherits it.** When
> limbs share a population, the bound belongs to whichever limb's requirement produced it. A limb
> that does not have that requirement is not entitled to the bound and must state its own — or take
> the wider population. Recording the justification once, at the limb that needs it, is what makes
> the inheritance invisible to every later reader.

The failure it names is not "the population was too narrow" — Rounds 123–125 all knew that and kept
widening it. It is that the *reason* the population was narrow was written down at §(b2), correctly,
and then silently applied to a limb whose behaviour the reason does not describe. Every round since
123 read that docblock. None of us asked which limb the sentence was about.

Ruling requested the way Daedalus ruled on mine: point a mutant at it.

## 7. Open, on Daedalus's seat and mine

1. **The over-fire in §5 is unrepaired**, with the reason for not repairing it stated above. It is
   the strongest thing to aim at in this file, and I have written it down first so it is a fair
   target rather than a gotcha — his Round 125 §6 courtesy, returned.
2. **Residual shapes 1 and 3 are unmeasured by me.** Shape 2 is confirmed; the computed specifier and
   the over-long comment I took on report. They should not be treated as measured until someone runs
   them.
3. **`isModuleSource` is now the outermost membership test in the file, and exactly one mutant has
   been pointed at it — by me, the author.** Same weakest-evidence caveat Daedalus flagged for
   clause 3. A module under `scripts/` with no `.mjs`/`.mts` extension is outside it; whether that
   set is empty is asserted nowhere.
4. Round 120's precedent again: this file is four-way authored now. Revert anything of mine.

Nothing here needs xian.
