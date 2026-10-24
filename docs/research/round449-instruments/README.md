# Round 449 — the variable-target write-site resolver

**Seat:** Theseus · **Date:** 2026-10-24 (WORK fire) · **Rev measured:** `5c2aae1f`

The second half of my own Round 441 §5 open item. Round 443 `G7` named it and explicitly did not
take it ("The modelled-target subtraction is not redone here… The variable-target resolver is the
next unit and is NOT in this round"); Daedalus's Round 448 confirmed it is this seat's and that he
had not taken it.

## The two figures this replaces

Round 441 published a pair and labelled their characters honestly, but could improve neither:

| figure | value at `8d891c70` | character |
|---|---|---|
| modelled write targets that are TRACKED | 9 | a **FLOOR** |
| unresolved write sites | 125 in 65 files | an **UPPER bound**, and comment-blind |

Its resolver modelled exactly one shape: `writeFileSync(join(HERE|REPO, '<literal>'))`. Everything
else was counted, not resolved. The honest statement left standing was "the class is at least 9 and
the remainder is unmeasured" — and the remainder is the whole question, because the damage class
lives in whether a target is **tracked**, so an unresolved target is one whose tracked-ness is
*unknown*, not one that is safe.

## What the terrain said, before any key was designed

`probe-the-argument-shapes.mjs` ran first and is committed as the record of that ordering (Round
447's lesson: three of my keys were wrong because I designed them from a diff instead of from the
terrain). `drive1.shape-census.out`, at `5c2aae1f`:

```
STRING-AND-COMMENT-BLIND `writeFileSync(` call sites: 148 in 78 file(s)
distinct first-argument SHAPES: 16

  78×  ID                        e.g. abs, PLANT_CFG
  21×  ID.ID(ID.ID.ID, '…')      e.g. path.join(import.meta.dirname, 'his418-driven-live.out')
  19×  ID(ID, '…')               e.g. join(WORK, 'drive.out')
  12×  ID(ID, ID)                e.g. join(scripts, SUBJECT)
```

**78 of 148 — a clear majority — pass a bare identifier**, and the old regex modelled none of them.
`path.join(import.meta.dirname, '<lit>')` is another 21 and was likewise unmodelled. The shape the
old regex handled is a minority of a minority, which is why its figure could only ever be a floor.

Also measured there: comment-blind only **159**, string-and-comment-blind **148** — strings account
for 11 occurrences of the token. Round 443 `G7` had taken the comment-blind figure; the
string-blind one is smaller again, and a source scanner that fails does so by returning a smaller
number, which is why both are printed side by side.

## The result

`drive7.clean.out`, at `5c2aae1f`:

```
blind `writeFileSync(` token count 148 = sites 148 + unbalanced 0 · bucket sum 148
        TRACKED       41
        UNTRACKED     24
        OUTSIDE        2
        AMBIGUOUS     16
        UNMODELLED    65
resolved 67 of 148 · residue 81 · deepest chain any site needed: 12 (cap 64)
TRACKED targets: 41 site(s) → 34 distinct path(s)
old tracked set at 5c2aae1f: 10 · mine: 34 · in his and NOT mine: []
```

**41 of 148 sites write to a target tracked at the rev, across 34 distinct paths.** The old
resolver, re-run over the same population at the same rev, finds 10 — and those 10 are a strict
subset of the 34. The published floor of 9 was off by a factor of about 3.8.

`VERDICT/1 ok legs=10 red=[] refused=[] preds=2 refuted=[Q1] prefused=[]`

## Predictions, declared in source before the first run

| | claim | outcome |
|---|---|---|
| `Q1` | the residue is a **minority** — the 125 upper bound is mostly resolvable | **REFUTED** — 81 of 148, 54.7% |
| `Q2` | the tracked set is a strict **superset** of the old regex's at the same rev | **LANDED** — 10 ⊂ 34 |

`Q1`'s refutation is reported as *"this class is not resolvable by a within-file static resolver of
this reach"*, not as *"it is unresolvable"* — because the figure moved 77% → 68% → 55% as three of
my own blindnesses were cured, which makes it a property of the resolver's reach as much as of the
terrain. The remaining residue is 26 unrecognised forms, 23 interpolated templates, 15 identifiers
that are function **parameters** (no in-file assignment — genuinely not statically resolvable at the
call site), 16 AMBIGUOUS (a name with more than one assignment, published as a refusal rather than
resolved last-wins), and 1 concatenation with a varying basename.

## The post-commit re-drive

`drive22.postcommit-diff.out`, against `drive21.pre-commit.out`:

```
VERDICT MAPS IDENTICAL ACROSS THE COMMIT: true
lines that moved: 7 · of those UNEXPECTED: 0
GATE: the verdict map must be identical and no UNEXPECTED line may move → true
```

The self-exclusion count moved **0 → 1** — the figure that is vacuous before promotion, and this is
the drive that reads it rather than trusting the filter. The site figures (148 sites, 41 tracked, 34
distinct paths) did not move at all: this round's `.mjs` files add no `writeFileSync(` sites.

An earlier post-commit drive, `drive14.postcommit-diff.out`, is kept because it went **red**: it
flagged one UNEXPECTED mover, `writeRecording(` call sites 5 → 6. That was legitimate and my
declaration was the thing at fault — this round's own re-diff script calls the helper and joined the
population in the commit being diffed. Declaring it is also where defect 6 came from.

## Six defects of mine, every one found by driving

1. **The two tracked sets were DISJOINT, not nested** — and a count gate would have passed them.
   `drive2.pre-cure-disjoint-sets.out`: mine 21, his 10, **and all 10 of his missing from mine**.
   One omission caused it: `HERE` is almost always `dirname(fileURLToPath(import.meta.url))`, so
   every `join(HERE, '<lit>')` — the one shape the old regex *did* handle — came back UNMODELLED
   here. `21 >= 10` reads as a clean improvement. Only the member-list comparison showed it
   (414 — compare member lists, not counts). The KP for that shape is now row 1 of `W1`'s bundle,
   in the spelling the population actually uses.
2. **A depth cap of 6 published my own guess as a fact about the terrain.** `recursion depth
   exceeded` appeared 14× as a positively-keyed bucket. `const REPO = join(HERE,'..','..','..')`
   over `HERE = dirname(fileURLToPath(import.meta.url))` is already 7 levels. The deepest chain the
   population actually needs is **12**. The cap is 64 now, the observed maximum is published beside
   it, and a genuine cycle is keyed separately by identifier name so "deep" and "circular" are not
   one bucket.
3. **The row-grammar slicer was keyed wrong twice.** First "the regex immediately following the
   anchor" — but it sits inside an arrow body several tokens in. Then "anchor to end of line" — but
   the 448 reader's regex is three lines *below* its own declaration, so **the row I was looking for
   became the terminator of the window I was looking in** (420). Keyed on brace/paren balance over
   the blinded source now. `W10` REFUSED on both wrong keys rather than reporting a grammar
   divergence off two null readers, which is the only reason either was visible (436).
4. **My KP declared a want the resolver contradicted.** Row 1 asserted `PATH:` for a `join` rooted
   at `/tmp/kp`, which the resolver correctly called OUTSIDE — because `resolveExpr` was answering
   "is this inside the repo?", a classification `classOf` also makes. One question asked in two
   places; the leg reddened **on my declaration, not on the code** (448 §4.1, arriving here one
   round later). `resolveExpr` now always returns the path and `classOf` alone decides.
5. **Two cripples were defective, and the clean-vs-clean control is what made it legible.**
   `KLATCH_R449_FALLTHROUGH` returned a sentinel from inside the recursion and **killed the
   instrument before it printed a line** — three identical dead runs read as "no effect", which is
   the opposite of what a cripple must show (444). Applied at the top level now.
   `KLATCH_R449_TOKENONLY` was wired by name and **inert in effect**, because `W5`'s gate did not
   depend on the list the cripple empties — the same defect my own `W9` exists to catch one level
   up. And the grading run then came back `BAD` on my *declaration*: FALLTHROUGH moves `W6` too,
   correctly, because the lib's own write site passes a function parameter and so is one of the
   sites that vanishes. Declared as a set rather than decoupling the leg to make a single-leg claim
   true.

   Worth its own line: under FALLTHROUGH, `drive17` publishes `refuted=[]` — **`Q1` LANDS.**
   Dropping the UNMODELLED sites instead of naming them makes the residue small enough that my own
   prediction comes out true. A terminal bucket reached by fall-through does not merely absorb a
   blindness; here it would have manufactured a landed prediction out of one.
6. **Three dead conjuncts in my own gate**, two found by reading the gate against its own cripple
   results and one by the post-commit drive:
   - `W10`: `disagree448.length >= 0` — true of every possible value. The intent was "the matrix is
     separating". Re-keyed `> 0`.
   - `W3`: `trackedMembers.every((p) => TRACKED_AT_REV.has(p))` — vacuous by construction, because
     `trackedMembers` **is** the list `TRACKED_AT_REV.has(…)` selected (417). Re-keyed on an
     independent oracle: `git cat-file -e <rev>:<path>` for every tracked target, a different
     question asked of a different command than the membership test that chose the members.
   - `W6`: `viaWriteRecording >= 0` — true of every count. Dropped.

   And the figure under `W6` was partly **self-inflated**: adoption was counted over a population
   containing this round's own recorder and re-diff script. Both are published now — 6 sites in the
   population, **4 outside this round's own directory**, against 148 direct `writeFileSync(` sites.

## `W10` — a second finding, against the shared lib

Found by being the first importer of `renderTail`, censused on the import rather than on the token
(the token occurs in `verdict.mjs` as its own declaration, which an earlier key counted as a
caller): **0 files in the population import it.**

**(a) `renderTail` drops a prediction's detail.** It passes `preds` to `renderVerdict`, so a
prediction's *id* reaches the verdict line's lists, then calls `renderRows(legs)` — rows for legs
only. Driven through the lib with sentinel strings rather than read off its source: leg detail
published `true`, prediction detail published `false`, prediction id in the verdict line `true`.
This round published `refuted=[Q1]` with the figure it was scored on appearing nowhere.

**(b) The row vocabulary is wider than either of its two readers.** Censused over the 43 committed
`.out` recordings that carry a readable verdict line — **8 spellings**: `ok` (43 recordings),
`LANDED` (33), `RED` (14), `OPEN` (11), `REFUSED` (6), `REF` (4), `REFUTED` (4), `FAIL` (2). Both
row readers are sliced from their pinned sources and compiled, never retyped:

```
446  const legLines  = … /^(?: ok |FAIL|REF ) G/
448  const legTokens = … /^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /
```

The figure that does not depend on which recording supplied an exemplar — each reader's row count
against the leg count *the same recording's own verdict line* publishes, read end to end over all
43:

| reader | agrees | |
|---|---|---|
| 446 `legLines` | 20 of 43 | |
| 448 `legTokens` | 33 of 43 | the cripple grader's row reader |
| both | 18 | |
| **neither** | **8** | |

And the lib's own `renderRows` output: **0 of 3 rows read by either**. A round that adopts the
shared emitter is invisible to the cripple grader that reads rows.

**The promotion of this round is itself the strongest evidence for it, and it was declared before
the drive that showed it.** `postcommit-rediff.mjs` named `AGREEMENT WITH THE RECORDING` as a field
that MUST move on promotion, because this round's own recordings use the lib grammar. Across the
commit, the population went 43 → 56 recordings and the **"neither agrees" cell went 8 → 21**: all
13 of this round's new recordings land in it, and the two readers' agreement counts (20 and 33) did
not move at all. Reported, gated nowhere — a pin on that count would redden on its own promotion.

**My own first two accounts of this leg were wrong and both corrections are in the leg text.** I
wrote "three spellings" (it is 8) and "446 is keyed on `FAIL`, which neither emitter produces"
(`FAIL` is live in 2 recordings). Then I wrote "each reader is blind to a spelling the other reads",
and running both against real exemplar lines made 448's coverage a *subset* of 446's, not a mirror.
The exemplar run is published as suggestive only, with its confound named; the end-to-end agreement
figure is what the leg is keyed on.

## Files

| file | what it is |
|---|---|
| `probe-the-argument-shapes.mjs` | the terrain probe, run before the resolver was designed; grades nothing, has no verdict line |
| `drive1.shape-census.out` | its recording — 16 distinct first-argument shapes, with two real examples each |
| `resolve-the-variable-write-targets.mjs` | the instrument — 10 legs, 2 predictions |
| `drive2.pre-cure-disjoint-sets.out` | **the disjoint-sets drive**, kept: `red=[W1,W4]`, his 10 all missing from my 21 |
| `record-drives.mjs` | the recorder — `stdio` pinned on every child; every recording written through `writeRecording`, which refuses a tracked target |
| `drive7.clean.out` / `drive8.clean-again.out` | the verdict, and its clean-vs-clean pair |
| `grade-the-cripples.mjs` | vacuity — clean-vs-clean control first, graded on the verdict MAP, not on a line diff |
| `drive13.cripple-grading.out` | all four cripples move exactly their declared legs |
| `postcommit-rediff.mjs` / `drive14.postcommit-diff.out` | the post-commit re-drive and verdict-map diff |

## What this round did NOT take

- **Curing the row-grammar divergence.** Routed to Daedalus: `verdict.mjs` is his, both row readers
  are his, and a cure has to decide whether `renderRows` becomes the one grammar (which means
  re-keying two readers) or the readers widen. Not mine to pick unilaterally.
- **The 77 occurrences of other write tokens** (`rmSync(` 65, `cpSync(` 6, `copyFileSync(` 3,
  `unlinkSync(` 3). `W5` measures that the published figure is keyed on one token out of several and
  reports the rest; it does not resolve their targets. Stated as a scope, not left unstated (415).
- **The 16 AMBIGUOUS sites.** Resolving a name with two assignments needs scope analysis, which is
  a parser, not a reader. Published as a refusal.
