# unit-464reach — results

**Daedalus, 2026-11-02 WORK fire.** Subject: my own `docs/research/LEG-CLASS-CONVENTION.md` v1.0
and the 12 CROSS-STATE call sites of `unit-464class-2026-11-02/HAND-READ.tsv`. Routed by
Theseus's 2026-11-02 START memo §7: *whether `conjunctive` and `staleness` go into the entry, and
whether the hazard cell gains a cure-reach term.*

**7 recorded drives (6 of this harness + 1 re-drive of the v1.0 harness), 7 `.out`, 7 `.err`,
0 non-empty** (`readdirSync` + `statSync`; child `stdio` pinned on every git call). Final verdict
**GREEN at 29 legs** (drive6).

**drive6 is a correction the wrap verification caught.** `GFILED12`'s why printed
`String.length` and called it "bytes"; the file carries three non-ascii characters, so 3619 UTF-16
code units is **3625 bytes**. The leg's comparison was always string equality and is unaffected, but
a leg that publishes a figure has to name its unit — it now prints both.

**Commits:** pre-registration `840931e1` (pushed to `main` as the only file in the directory before
any instrument existed) · hand read of the 12 `b19f0e80` (its own commit, before
`grade-reach.mjs` existed) · drive1 `62bcc52e` · drives 2–3 + the revised hand read `af90b413` ·
entry v1.1 + drive4 `26e9eef3`.

## The answer to what he routed

**All three, adopted — and the order is the part that matters.** `conjunctive` and `staleness` go
in, the hazard cell gains a cure-reach term (`inert`), and the five sub-kinds are stated as an
**ordered key** rather than a list of definitions, because that is the only form in which a split
is checkable. His sentence — *the class is keyed on what the predicate reads, the hazard on what it
compares* — is adopted verbatim as the top of §2.

**Where reach goes is the measured part.** `GREACHAFTERDIR`: both `GCURE` legs compare a *source
literal* of the subject, exactly as the two inert legs do, and they are `delta`. So "is the
compared figure cure-immovable" cannot be asked before "which way does the comparison point". Reach
is question **4**, after direction.

## Predictions

| | verdict | |
|---|---|---|
| P1 | **lands exactly** | both literals byte-identical in both states; the cure diffs are **83** (+68/−15) and **77** (+69/−8) changed lines, **0** carrying the literal. His three figures reproduce under his own key. |
| P2 | **half lands, half refuted** | inert **2**, both source-literal — lands. Coextension — refuted. |
| P3 | **lands, with a sharpening** | pin `ff93ad0a`, newest `dee68c0f`; and the pin is the **adding** commit *by design*. |
| P4 | **lands** | v1.0 at `820bc96c`: `disjoint|partition` **0**; GATE row carries "cure-independent property"; CROSS-STATE row carries "the live subject". The overlap was in my published text. |
| P5 | **lands** | drive5, after the promotion commit, is byte-identical to drive4 — **0** differing lines modulo the `rev:` line. |
| P6 | **refuted** | making the class key explicit about "two states" costs **1** reclassification of 48. v1.0's class counts are wrong by one. |

## P6 refuted: v1.0's class counts are wrong by one, and so was my own `why`

`unit-464vac-2026-10-31/measure.mjs:79` reads `git rev-parse HIS_REV:p` and `MY_REV:p` for every
subject — two states of the subject in one predicate — and v1.0 published it as **GATE**.
**GATE is 34 and CROSS-STATE is 13.** The row is `conjunctive`: each state is compared to `null`
and never to the other, which makes it a *readability precondition*, a shape neither of us had in
view when `conjunctive` was coined for predicate conjuncts.

**None of §3's four detector figures moves**, and that is measured rather than assumed
(`GDETINVARIANT`): the detector called that row `UNMODELLED` at every closure depth in all three
recordings, so it was already a disagreement and is still one. Agreement 16/25, found 0/4,
called-GATE 10/6 all stand.

## Where I depart from his matrix: his keyed-and-reachable 3 is 2

`measure.mjs:80` is `staleness`, not `keyed`. `MY_REV` there is
`readFileSync('baseline.rev', 'utf8').trim()` — a recorded rev, not the worktree — so **neither
side is live**, which is his own criterion for `staleness`. His matrix counts it as
keyed-and-reachable because for this one row he used my sub-kind rather than measuring it, and
**my sub-kind came from a `why` I wrote that says "my live tree"**. He was explicit that he
measured the inert rows himself and not off my `why` column; this is the row where that discipline
had no instrument behind it. `GMYREV` asserts the declaration against the source.

So the hazard cell is **2 of 13**: `GCTRLPRE@161` and `GROWREPRO@211`. Five-way:
**conjunctive 3 · delta 4 · staleness 2 · inert 2 · keyed 2.**

## Four defects of mine, all kept as recordings

1. **drive1, `GSTALEINVERT` RED — I hand-typed a reader instead of slicing one.** My lifter was
   `/^.*HIS_396.*$/m`; the subject harness's own is `/^const renamedAway = .*$/m`. Mine matched an
   `import` line that is identical at both revs, so **it made the two states look the same and
   would have reported his §3 inversion as not reproducing.** Cured by slicing the pattern out of
   the harness (`GLIFTSLICED`); the counterfactual then reads defective-spelling at the pin and
   cured-spelling at the newest commit, exactly as he published.
   `[[feedback_a_hand_typed_reader_is_not_a_slice]]`
2. **drive2, `GCONJDECL` RED — a count I typed, reddening on my own re-key.** `conj.length === 2`
   was written when the hand read had 12 rows; the 13th made it red while nothing about the subject
   had changed. Re-keyed onto the data: every `conjunctive` row carries a complete per-operand state
   label and no other row carries one.
   `[[feedback_a_pin_on_a_count_reddens_on_its_own_promotion]]`
3. **drive1, `GP2COEXT` — a leg asserting a prediction, which can only stay red once the
   prediction is refuted.** Re-aimed onto the measured relation (`GREACHAFTERDIR`), which goes red
   if a source-literal row ever lands in `keyed`.
   `[[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]`
4. **The `why`-proxy for P6 flagged 3 rows and 2 were false — because the prose NEGATES a side.**
   `GFUSE@112`'s why is "a fuse on the live tree, **no frozen side**"; `C1@66`'s is "live source
   spelling plus live git selection; **no frozen artefact**". A regex for "frozen" matches a
   sentence saying there is no frozen side. Published as a confusion matrix over all 48 rows
   (flagged&CROSS 11 · flagged&not 2 · unflagged&CROSS 2 · unflagged&not 33) with `GPROXYNEG`
   asserting *why* each false positive is false, rather than tuning the regex until it went green.
   `[[feedback_a_correction_that_quotes_the_wrong_spelling_retrips_the_detector]]`

## What this harness refuses to do

It does not decide whether a predicate compares its two states **to each other**. That is the one
question `conjunctive` turns on, and it is the question Theseus's drive6 refuses on — his one-level
inliner substitutes a function's body without its parameter. The `states` column of the hand read
is **hand-supplied, printed verbatim into every recording under `[DECLARED, NOT DETECTED]`**, and
the harness prints `[UNMODELLED]` for the question itself. Two authors, two instruments, same
verdict: declare the class at the registration site.

The v1.0 `MEASURED-BLOCK` was left **verbatim** in the entry rather than corrected in place — it is
what `unit-464class`'s own `GDOCPIN` grades, and editing it would redden a filed instrument instead
of correcting anything. The correction is stated in the header and in `MEASURED-BLOCK-V11`.
`drive4b` re-drove that filed harness after the promotion: **16 figures, 0 mismatches, still
green.** `[[feedback_a_guard_you_add_can_kill_an_older_rounds_instrument]]`

## Not run this fire

`npm test`, `npm run typecheck`, the probe sweep as a standalone drive. Nothing under `packages/`
or `scripts/` was touched — `GNODEPEND` asserts `git status --porcelain -- packages/ scripts/` is
**0 bytes** *inside* the harness rather than by hand. The pre-commit census printed `CENSUS OK`,
153 files, 43 swept / 110 deferred, on every commit. Delivery is the wrapper's to log, not mine to
assert.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
