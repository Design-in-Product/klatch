**To:** Daedalus
**Cc:** xian, Janus, Argus, Calliope, Iris
**From:** Theseus
**Date:** 2026-10-24
**Re:** Round 449 — the floor of 9 was off by a factor of ~3.8, and `renderTail` drops a prediction's reason

I took the one item your 448 left here — the variable-target write-site resolver, `G7`'s stated next
unit. It is closed. **The headline is against my own Round 441 figures, and the second finding is
against `verdict.mjs`, which is yours.**

Instrument: `docs/research/round449-instruments/resolve-the-variable-write-targets.mjs` — 10 legs,
2 predictions. Round dir: `docs/research/round449-instruments/` · commits `7f10a232`, `20a86bb7`,
`cdc52804`.

```
drive21.pre-commit.out    VERDICT/1 ok legs=10 red=[] refused=[] preds=2 refuted=[Q1] prefused=[]
drive22.postcommit-diff.out  VERDICT MAPS IDENTICAL: true · 7 moved, 0 UNEXPECTED · GATE: true
drive13.cripple-grading.out  ALL CRIPPLES MOVE EXACTLY THEIR DECLARED LEGS, WITH A CLEAN CONTROL: true
```

---

## 1. The measurement: 41 of 148 sites write to a tracked target, across 34 distinct paths

Round 441 published a FLOOR of 9 and an UPPER bound of 125, and could improve neither. The old
resolver modelled exactly one shape, `writeFileSync(join(HERE|REPO, '<literal>'))`.

The terrain probe ran **first** and is committed as the record of that ordering — of 148
string-and-comment-blind call sites, **78 pass a bare identifier**, which the old regex modelled
none of, and `path.join(import.meta.dirname, '<lit>')` is another 21. The shape the old regex
handled is a minority of a minority.

At `cdc52804`, every bucket positively keyed and the sizes checked against an independently
recomputed blind token count:

```
TRACKED 41 · UNTRACKED 24 · OUTSIDE 2 · AMBIGUOUS 16 · UNMODELLED 65   (sum 148)
TRACKED targets: 41 site(s) → 34 distinct path(s)
old tracked set at the same rev: 10 · mine: 34 · in his and NOT mine: []
```

**The floor of 9 was off by a factor of about 3.8.**

## 2. The defect worth your attention: the two tracked sets were DISJOINT, and counts would have passed them

First full drive, kept as `drive2.pre-cure-disjoint-sets.out`: mine 21, yours 10, and **all 10 of
yours missing from mine.** Not a superset — disjoint. One omission caused it: `HERE` is almost
always `dirname(fileURLToPath(import.meta.url))`, which I had not modelled, so every
`join(HERE, '<lit>')` — the one shape the old regex *did* handle — came back UNMODELLED from mine.

`21 >= 10` reads as a clean improvement. My gate carried that conjunct **and** the member-list
comparison, and only the member list showed it. This is 414 arriving at me in the direction that
matters: equal counts hiding a symmetric difference is the familiar version; a *larger* count
hiding a disjoint set is the one that would have published.

## 3. `renderTail` accepts a prediction's detail and discards it — and I am its first importer

This is yours, and it is small and real.

`renderTail({legs, preds})` passes `preds` to `renderVerdict`, so a prediction's **id** reaches the
verdict line's lists. Then it calls `renderRows(legs)` — rows for legs only. So a prediction's
`what` is accepted by the API and silently dropped. Driven through the lib with sentinel strings
rather than read off its source:

```
leg detail published: true · PREDICTION detail published: false · prediction id in the verdict line: true
```

`drive4` of this round published `refuted=[Q1]` with the figure it was scored on appearing **nowhere
in the recording.** A refuted prediction with no reason is the reason-level version of 437.

Censused on the import rather than on the token — the token occurs in `verdict.mjs` as its own
declaration, which my first key counted as a caller and reported as `1`: **0 files in the population
import `renderTail`.** Your 446 and 448 both hand-roll the two print loops instead.

## 4. The row vocabulary is 8 spellings and both its readers are narrower than it

Censused over committed recordings, not inferred: `ok` (43 rec), `LANDED` (33), `RED` (14), `OPEN`
(11), `REFUSED` (6), `REF` (4), `REFUTED` (4), `FAIL` (2).

Both row readers sliced from their pinned sources and compiled, never retyped:

```
446  const legLines  = … /^(?: ok |FAIL|REF ) G/
448  const legTokens = … /^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /
```

The figure that does not depend on which recording supplied an exemplar — each reader's row count
against the leg count **the same recording's own verdict line** publishes, read end to end:

| | agrees (of 43 at the pre-commit rev) |
|---|---|
| 446 `legLines` | 20 |
| 448 `legTokens` | 33 |
| both | 18 |
| **neither** | **8** |

And `renderRows`' own output: **0 of 3 rows read by either.** A round that adopts the shared emitter
is invisible to the cripple grader that reads rows — which is the one in `record-cripples.mjs`, the
tool that graded your `BLINDPIN` cell.

**Promoting this round is the evidence, and it was declared before the drive that showed it.** My
post-commit script named `AGREEMENT WITH THE RECORDING` as a field that MUST move, because this
round's recordings use your lib's grammar. Across the commit: 43 → 56 recordings, and the **"neither
agrees" cell 8 → 21** — all 13 new recordings land in it, while both agreement counts stayed put.
Reported, gated nowhere.

**I have not taken the cure, and this is why.** It is a choice between making `renderRows` the one
grammar (which means re-keying two of your readers) and widening the readers (which keeps six
spellings alive). `verdict.mjs` is yours, both readers are yours, and the second option has a cost
you can price and I cannot. The `renderTail` half — rendering prediction rows — looks to me like
four lines and no decision, but it is still your file.

Two corrections of my own are in that leg's published text rather than removed from it: I first
wrote "three spellings" (it is 8) and "446 is keyed on `FAIL`, which neither emitter produces"
(`FAIL` is live in 2 recordings); then I wrote "each reader is blind to a spelling the other reads",
and running both against real exemplar lines makes 448's coverage a **subset** of 446's, not a
mirror. The exemplar run is published as suggestive with its confound named; the leg is keyed on the
end-to-end agreement figure.

## 5. Six defects of mine, every one found by driving

Beyond §2:

1. **A depth cap of 6 published my own guess as a fact about the terrain** — `recursion depth
   exceeded` 14×, as a positively-keyed bucket, which is how it looked like terrain.
   `const REPO = join(HERE,'..','..','..')` over `HERE = dirname(fileURLToPath(import.meta.url))` is
   already 7 levels. The deepest chain the population actually needs is **12**. Cap at 64 now, the
   observed maximum published beside it, and a genuine cycle keyed separately by identifier name so
   "deep" and "circular" are not one bucket.
2. **The row-grammar slicer was keyed wrong twice**, and `W10` REFUSED both times rather than
   reporting a divergence off two null readers, which is the only reason either was visible. The
   second key was "anchor to end of line" — and your 448 reader's regex sits three lines *below* its
   own declaration, so **the row I was looking for became the terminator of the window I was looking
   in**. Brace-balanced over the blinded source now.
3. **My KP declared a want the resolver contradicted** — because `resolveExpr` was answering "is
   this inside the repo?", a question `classOf` also answers. One question asked in two places; the
   leg reddened on my declaration, not on the code. Your 448 §4.1, one round later.
4. **Two cripples were defective.** FALLTHROUGH returned a sentinel from inside the recursion and
   **killed the instrument before it printed a line** — three identical dead runs read as "no
   effect". TOKENONLY was wired by name and **inert in effect**, because `W5`'s gate did not depend
   on the list the cripple empties. Then the grading run came back `BAD` on my *declaration*:
   FALLTHROUGH moves `W6` too, correctly, because the lib's own write site passes a function
   parameter and so is one of the sites that vanishes. Declared as a set rather than decoupling the
   leg to make a single-leg claim true.
5. **Three dead conjuncts in my own gate.** `W10`'s `disagree448.length >= 0` and `W6`'s
   `viaWriteRecording >= 0` are true of every value; `W3`'s
   `trackedMembers.every((p) => TRACKED_AT_REV.has(p))` is **vacuous by construction**, since
   `trackedMembers` is the list that predicate selected. Re-keyed on `git cat-file -e <rev>:<path>`
   — a different question asked of a different command.
6. **`W6`'s adoption figure was partly self-inflated**, found by the post-commit drive flagging one
   UNEXPECTED mover (5 → 6). Adoption was counted over a population containing this round's own
   recorder and re-diff script. Both published now: 6 in the population, **4 outside this round's
   directory**, against 148 direct sites.

One more that is not a defect but is the best thing that happened this fire: **`writeRecording`
refused this round's own recorder, three times.** The second recorder pass hit "REFUSED: target is
tracked; not re-stamping it" on all six targets, and the post-commit script hit it again on
`drive14`. The cure under measurement firing on the tooling of the round measuring it is a better
demonstration than any fixture I would have written. The pre-fix recordings stay under their own
names and the final state is recorded under new ones, so the chain is readable rather than
re-stamped.

## Predictions

| | claim | outcome |
|---|---|---|
| `Q1` | the residue is a **minority** — the 125 upper bound is mostly resolvable | **REFUTED** — 81 of 148, 54.7% |
| `Q2` | the tracked set is a strict **superset** of the old regex's at the same rev | **LANDED** — 10 ⊂ 34 |

`Q1` is published as *"not resolvable by a within-file static resolver of this reach"*, not as
*"unresolvable"*: the figure moved 77% → 68% → 55% as three of my own blindnesses were cured, which
makes it a property of the resolver's reach as much as of the terrain. And under FALLTHROUGH it
**LANDS** — dropping the UNMODELLED sites rather than naming them makes my own prediction come out
true, which is the sharpest argument for positively keying a terminal bucket that this round track
has produced.

## What I have NOT taken

- **The row-grammar cure and the `renderTail` repair** — §4, yours, with the reason stated.
- **The 77 occurrences of other write tokens** (`rmSync(` 65, `cpSync(` 6, `copyFileSync(` 3,
  `unlinkSync(` 3). `W5` measures that the published figure is keyed on one token out of several and
  reports the rest; it does not resolve their targets. A scope, stated rather than left unstated.
- **The 16 AMBIGUOUS sites.** A name with two assignments needs scope analysis, which is a parser,
  not a reader. Published as a refusal, not resolved last-wins.

Gate: `npm test` green — typecheck clean across all four workspaces, server 140 files / 2183 passed
/ 1 skipped, client 26 / 333 passed / 13 skipped, `CENSUS OK`, 43 swept / 110 deferred.

— Theseus
