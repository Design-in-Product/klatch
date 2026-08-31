# Theseus session log — 2026-08-31 (Opus)

## 10:47 PT — START fire

Synced by wrapper at `892ae59`. Read `docs/COORDINATION.md` (Theseus section) and `ls docs/mail/`.
One memo addressed to me: Daedalus's Round 125,
`daedalus-to-theseus-cc-xian-team-the-or-is-struck-agreement-cannot-see-absence-2026-08-31.md`,
ruling on my Round 124 §6 amendment and inviting a mutant at his clause 3 (§6: *"Residual shape 2 is
the obvious thing to aim at"*). Actioned in this fire, in the fire that received it.

**Round 126.** Zero live turns, zero model calls, zero API spend, zero corpus runs. `packages/`
untouched — verified by `git status --porcelain` before commit (four modified files, all under
`scripts/`).

### What I did

1. **Reproduced the baseline first** rather than accepting his count: `node scripts/verify-tsx-guard.mjs`
   → `PASS — all 88 checks passed` on this seat.
2. **Measured residual shape 2** (his named target) with two controls one variable away, guard-call
   string identical across all three so §(b)'s source verdict wasn't doing the separating:
   - M11 variable-bound specifier + swallow → **`PASS — all 89` — SURVIVED**. Count moved 88 → 89,
     third consecutive round of the reassuring-direction tell.
   - M12 inline specifier + swallow → `FAIL 3/92` at §(c), agreement check included.
   - M13 variable-bound, no catch → `FAIL 1/89` at §(b2).
   Shape 2 confirmed as he wrote it. Clause 3 held up to everything I pointed at it.
3. **Found the thing that wasn't in the mutants.** §(b2)'s docblock bounds the population because
   *"the property is only assertable on files it is safe to run"* — a reason about **running**. §(b)
   reads source and executes nothing, so it never had that constraint; it inherited the bound when
   Round 123 fused the populations. Measured across every module under `scripts/`: three tracked
   files (`measure-marker-floor.mjs`, `probe-recall-tool.mjs`, `serve-scratch.mjs`) dynamically
   import `../packages/**.ts`, none imported the guard, all three in **neither** population.
   `node scripts/measure-marker-floor.mjs` on the clean tree printed the raw `ERR_MODULE_NOT_FOUND`
   naming `queries.js` as missing — the exact message Round 121 set out to abolish and the exact
   misattribution Round 120 §5 misread as a missing build artifact. Ran it only after checking lines
   1–89 are pure local imports, so the crash lands before any side effect. Did **not** run
   `probe-recall-tool.mjs` or `serve-scratch.mjs` blind — checked first that nothing opens a DB,
   starts a listener or spends before their import lines.
4. **Repaired by separating the populations, not widening either.** `readable` (every `.m[jt]s` under
   `scripts/`) carries §(b) + the unclassified bucket; `swept` unchanged, still carries §(b2)/§(c),
   which execute. Added: `isModuleSource` predicate with true/false cases, a strict-nesting assertion
   (`swept ⊆ readable`), an assertion that the widening is doing work, and containment
   (`narrow ⊆ broad`) on the **live files** — Round 125 asserted it on eleven synthetic rows and on
   none of the files the bucket runs over.
5. **Cleared the red honestly.** Widened instrument against the unrepaired tree: `FAIL — 1 of 105`,
   naming all three. Added the guard to each in canonical form. **Verified behaviourally by hand,
   because §(c) does not reach them** — all three exit 2 with the message naming `npx tsx`, and
   `measure-marker-floor.mjs` runs to completion under `tsx`, so the wrapper is inert on the working
   path.
6. **Recorded the cost of my own repair** rather than leaving it to be found: the unclassified bucket
   over-fires on prose, and I tripled its blast radius (12 → 37 files). M14 — a correct verifier with
   one comment mentioning a specifier near the word `import` — `FAIL 1/89`; M0 control with the
   sentence reworded, `PASS 89`. Not live today (measured: zero current broad-reading matches under
   `scripts/` fall inside a comment). Deliberately **not** fixed — the fix wants a comment stripper,
   which is another regex with another escape, and stripping too much biases the bucket toward the
   silent direction. Rounds 122 and 125 both ruled this predicate is whack-a-mole; not opening a
   fourth round of it unilaterally.

### Verification

- `node scripts/verify-tsx-guard.mjs` → **`PASS — all 105 checks passed`** (was 88).
- `npm test` → **239 passed, 13 skipped**, 18 files passed / 13 skipped.
- `npx tsx scripts/verify-filler-constraints.mjs` → OK (this one parses `probe-recall-tool.mjs`'s
  *source*, which I edited — checked deliberately).
- `npx tsx scripts/verify-recogniser-equivalence.mjs` → `EQUIVALENT`.
- `npx tsx scripts/verify-empty-tail-detector.mjs` → `DETECTOR VERIFIED`.
- `npx tsx scripts/probe-recall-tool.mjs R126DRY --dry` → reached an HTTP call to `:3001`
  (`ECONNREFUSED`), i.e. executed well past the guarded import. **Not a full `--dry` run** — that
  needs a dev server this fire did not start. Recorded as partial, not as a pass.
- All mutants deleted; `git status --porcelain` shows only the four intended modified files.

### Deliverables

- `docs/research/round126-the-bound-belonged-to-one-limb-and-three-live-files-were-outside-it-2026-08-31.md`
- `docs/mail/theseus-to-daedalus-cc-xian-team-the-bound-belonged-to-one-limb-2026-08-31.md`
- `scripts/verify-tsx-guard.mjs` (header item 7 + the population split)
- Guard added: `scripts/measure-marker-floor.mjs`, `scripts/probe-recall-tool.mjs`,
  `scripts/serve-scratch.mjs`
- Daedalus's Round 125 memo moved to `docs/mail/read/` (actioned, nothing left on my side).

### Open

- The §5 over-fire is unrepaired, with the reason stated in the doc and the memo.
- Residual shapes 1 and 3 taken on Daedalus's report, **not measured by me** — should not be called
  measured by anyone reading this.
- `isModuleSource` is the outermost membership test now, and exactly one mutant has been pointed at
  it, by its author. Same weakest-evidence caveat Daedalus flagged for his clause 3.
- Amendment proposed to standing rule 8b (a constraint on a shared population must be re-derived for
  each limb that inherits it) — awaiting Daedalus's ruling, requested by mutant rather than reading.

### Wrap verification

Per CLAUDE.md Session Wrap Protocol — run below, output pasted, before any "done" claim.
