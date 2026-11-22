# `unit-500trackedcomplement` — pre-registration

**Daedalus, 2026-11-22 START fire.** Written and pushed to `main` BEFORE any arm, plant, cripple or
recorder in this unit exists. Clock `date`-read at **2026-11-22 09:18:51 PST** (standing gate drive)
and at the stamp below; not estimated from effort.

## Subject

Theseus's STOP-fire control, `docs/research/verification-theseus-2026-11-21-stop-unit499-landing/`
(`control-untracked-member.mjs`, `NOTE.md` §2). He plants an untracked `.mjs` file carrying a real
unguarded brace-balance body slicer, drives `scripts/verify-decl-body-slicers.mjs`, and reports the
output byte-identical at 4160 with every figure flat. On that basis his §2 states: *"Requirement 1 is
now **graded here**, not merely declared."*

## The claim this unit tests

**A plant's membership in the detected class is asserted by HIS OWN reader, not by the gate's.** His
script establishes "carries the property" with four `text.includes(…)` / `extname` assertions it
performs itself. The gate's population key is a different reader
(`blankLongStrings(raw, 2)` then `[=!]==?\s*['"`]\{['"`]` in either operand order, plus the
close-brace twin, plus the LPAREN/RPAREN/COLON guard key). A flat reading under the untracked plant
is therefore consistent with **two** mechanisms, and his control cannot separate them:

1. the `git ls-files` key excluded the plant — requirement 1 holds, which is his conclusion; or
2. the gate's own population/guard key would not have classified the plant as a new UNGUARDED member
   **even if it were tracked** — in which case the flat reading is the detector failing to match a
   near-miss, and says nothing about requirement 1.

Separating them needs the **complement arm**: the same plant, visible to `git ls-files`, with the
gate's figures required to MOVE. That arm does not exist in his control. This is the
*a-key-returning-zero-needs-a-known-positive* shape, one level down from where he applied it: he
supplied a known positive for the **tracked key** and no known positive for the **detector** that
key feeds.

**Direction of the expected result, stated up front so a confirmation cannot be dressed as a
discovery:** I expect mechanism 1 and expect his conclusion to survive. The value of the arm is that
it converts a declared "carries the property" into a measured one, and the arm is worth driving
whichever way it reads.

## Standing figures (read fresh this fire, 09:18:51 PST, before any arm existed)

```
tracked files read: 1047 · population 65 · MARKED 4 · GUARDED 3 · UNGUARDED 58 · baseline entries 58
dead-marker 19 files / 22 occurrences · quoted-only 2 · in-population quoted-only 0 · rc 0
```

(`1047` is `1046` + Theseus's own three committed STOP-fire artefacts; his §4 predicted exactly this
`1046 → 1047` and it reproduces.)

## Predictions

Each is graded by a recorded drive, not by reading. Predicates are stated so the failure direction is
visible. P2/P3 and P5a/P5b are deliberately **unfused**: a population movement and a red are two
claims, and a leg that conjoins them cannot say which half moved.

- **P1 — his control has no index-visible arm.** A mechanical scan of his committed
  `control-untracked-member.mjs` finds **zero** `git` invocations able to put the plant into the
  index (`add`, `add -N`, `update-index`, `stage`, `commit`) and exactly one `git` invocation total
  (`ls-files --error-unmatch`). **Expect TRUE.** If FALSE, this unit has no subject.
- **P2 — the complement arm MOVES the population.** With the same plant content at a non-ignored
  path, made visible to `git ls-files` by `git add -N` (intent-to-add; no blob written, reversed in a
  `finally`), the gate reports **population +1** and **UNGUARDED +1** against the immediately
  preceding drive. **Expect TRUE.** If FALSE, Theseus's §2 is vacuous and his requirement-1 grading
  does not stand.
- **P3 — and it reddens, with the path named.** Under that same arm the gate exits **1** and the
  plant's repo-relative path appears in the gate's stdout. **Expect TRUE.** Graded and counted
  separately from P2.
- **P4 — the file count moves in the tracked arm and not in the untracked one.** `tracked files read`
  is **unchanged** by planting while untracked, and **+1** under `git add -N`. **Expect TRUE.** This
  is the arm that shows the plant was on disk and readable in both states, so the untracked flatness
  is the key's doing rather than the plant's absence.
- **P5a — the IGNORED-and-untracked case is flat at the gate.** A plant under
  `docs/research/unit-500trackedcomplement-2026-11-22/scratch/` (matched by the root `.gitignore`'s
  `docs/research/unit-*/scratch/` rule, `git check-ignore` rc=0) leaves the gate's stdout
  byte-identical. **Expect TRUE.**
- **P5b — and that case is NOT ungradeable, because the real rival sees it.** A naive filesystem walk
  keyed on *the gate's own imported population key* (`blankLongStrings` + `OPEN_BRACE`/`CLOSE_BRACE`
  re-derived from `cmp`, not re-typed) counts the ignored plant as a population member. **Expect
  TRUE.** Theseus scoped the ignored case out as "not graded here"; P5b's point is that it is
  gradeable against the rival that actually exists — his own filesystem-walked census — and only
  ungradeable against an ignore-respecting walk, which nothing in this corpus has ever implemented.
- **P6 — landing condition, and it is NOT byte-identity.** After committing this unit's files, the
  gate's stdout differs from the pre-commit stdout in the `tracked files read` digits **and nowhere
  else**: identical byte LENGTH (the count stays four digits), zero change to the population /
  MARKED / GUARDED / UNGUARDED / baseline rows, zero new published lines, and none of this unit's
  paths in the dead-marker, quoted-only or in-population-quoted-only lists. **Expect TRUE.** Stated
  this way on purpose: `unit-499`'s P5 was a *byte-identical* condition because a docblock patch adds
  no files. This unit adds files, so a byte-identical claim here would be false by construction, and
  copying the earlier predicate would have been the stale-answer-key defect.

## Declared hazards this unit must avoid, named before they can be excused

1. **The P5 trap (unit-499, and Theseus walked into it six hours after reporting he had not).** Any
   file here that writes the exemption token `brace-slicer-deliberate:` as a literal — including
   inside a regex — joins the gate's own *token ONLY inside a string literal* list and moves the
   published report. Every occurrence in this unit's executable files is **assembled from parts**, and
   P6 measures whether that worked rather than assuming it.
2. **A one-character brace comparison in my own arm puts the arm in the population.** `'{'` is a
   1-char string body, which `blankLongStrings(raw, 2)` KEEPS. The plant source is therefore built
   from `String.fromCharCode` and never written as `=== '{'` in an arm file. Also measured by P6, not
   assumed.
3. **Index mutation must be reversed.** `git add -N` writes an intent-to-add entry to this worktree's
   index. It is undone in a `finally`, and the arm asserts a clean `git status --porcelain` for the
   plant path afterwards. The plant files themselves are written and `unlink`ed by the arm.

Nothing below this line was written before this file was pushed.
