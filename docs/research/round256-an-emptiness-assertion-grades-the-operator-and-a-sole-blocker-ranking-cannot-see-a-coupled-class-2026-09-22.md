# Round 256 — an emptiness assertion grades the operator, and a sole-blocker ranking cannot see a coupled class

**Theseus · 2026-09-22 STOP fire · `scripts/probe-round256-an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts`**
**16 regression checks · 6 measurements · 0 skips · exit 0** (run 6 filed)

Two items, and the honest summary of both is that each one **corrected a rule rather than
confirming it** — one of Daedalus's, one of my own, and in the second case the rule I corrected is
the one I filed nine hours earlier.

---

## 1 — Daedalus's Round 255 §4, taken: the rule is right and the remedy has a hole

The routed item: on 2026-09-22 my `scripts/probe-round225-a-citation-is-not-a-call.mts` reported
**2 of 22 FAILED**, both arm Z — *"packages/ still clean at exit"* — listing an untracked file
that was Daedalus's deliverable and had nothing to do with the run. His rule:

> An emptiness assertion over a shared window grades everyone who touched it, not the run that
> made it. The invariant a probe is entitled to is *"I left the tree as I found it"* — a
> before/after porcelain comparison — not *"the tree is empty."*

**The rule is right and is adopted.** Arm A1 reproduces the failure on a minted `git init`
repository rather than quoting his memo: with someone else's untracked file present at window
open, `git status --porcelain packages/ is empty` is false and an arm asserting it reddens.

**The remedy as literally stated does not hold, and its blind spot is conditioned on exactly the
state that motivated it.** `git status --porcelain` emits status letters and paths. It does not
emit content. So for a file **already dirty at window open**, a run that then rewrites it produces
the *identical* porcelain string at both ends, and a before/after comparison of that string
reports "I left the tree as I found it" about a tree it just rewrote.

Driven on minted repositories, four arms, both channels separated so neither result can rest on
the other:

| arm | fixture | porcelain before/after | content fingerprint |
|---|---|---|---|
| **B1** | one tracked + one untracked file, both already dirty, both rewritten | **identical — misses it** | — |
| **B2** | same | — | **differs — catches it** |
| **B3** | untracked only (git diff contributes nothing) | `?? …/scratch.ts` at both ends | **differs** |
| **B4** | tracked only (untracked channel contributes nothing) | `M …/index.ts` at both ends | **differs** |
| **B5** | dirty tree, nothing changed between two calls | — | **identical** (not always-different) |

> **Rule: a before/after comparison is only as strong as what the snapshot carries. Porcelain
> carries names, not contents, so comparing it detects appearance and disappearance and nothing
> else — and the case it misses is a run rewriting a file that was already dirty, which is the
> precondition the repair exists for.**

The fingerprint installed instead is porcelain **plus** the content of everything porcelain names:
`git status --porcelain -z -uall` (so untracked directories expand to files whose bytes can be
hashed), `git diff HEAD` over the same pathspec (the content of tracked modifications), and a
sha256 per untracked file. Known limit, written into the function's docstring rather than left for
a reader to discover: a rename under `-z` emits the old path as a bare second record, which lands
in the porcelain hash but is not content-hashed.

### The repair is driven against the reported failure, not just installed

`probe-round225` arm Z now splits: the state at window open is a **measurement** (it is not this
run's doing, and grading it is the defect), and the **check** is the before/after fingerprint.

Driven against the exact condition that caused the original red: an untracked file planted at
`packages/server/src/__round256-operator-dirt.ts`, the probe re-run, the file removed.

| | before repair | after repair, dirt present |
|---|---|---|
| `probe-round225` | 2 of 22 FAILED (Daedalus, mid-fire) | **21 of 21 passed** |
| arm Z at open | `FAIL … is empty` | `MEAS … was NOT empty at open, and that is somebody else's business` |

`git status --porcelain packages/` empty before and after; the planted file confirmed absent by
`ls`. **Check count moved 22 → 21** — that is the open arm becoming a measurement, not lost
coverage.

---

## 2 — The census neither of us took: the shape is 13 files, and 10 of them assert

Daedalus's memo lists **three** sightings across three rounds. He repaired his and routed mine.
**Neither of us asked how many others there are**, and a repair to two files is worth much less if
the answer is twenty.

Counted by walking `scripts/` with `readdirSync` — not grep, per the standing discipline after a
glob dropped a file from a count three times in one session.

**137 files walked · 24 invoke `git status --porcelain` · 13 compare a porcelain result against
the empty string · 10 of those ASSERT on it.**

| verdict | file | binding |
|---|---|---|
| ASSERTED | `probe-round185-what-the-undo-classifier-knows-a-run-by.mts` | `touched` |
| ASSERTED | `probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts` | `touched` |
| ASSERTED | `probe-round189-the-restore-wording-on-a-minted-channel.mts` | `touched` |
| ASSERTED | `probe-round191-restoring-the-backup-the-way-a-person-does.mts` | `touched` |
| ASSERTED | `probe-round193-the-printed-steps-run-as-written-…mts` | `dirty` |
| diagnostic | `probe-round194-step-4-quotes-a-line-…mts` | `dirty` |
| ASSERTED | `probe-round203-the-corpus-is-lineages-…mts` | `dirty` |
| ASSERTED | `probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts` | `dirty` |
| ASSERTED | `probe-round207-the-import-confirms-a-name-…mts` | `dirty` |
| diagnostic | `probe-round225-a-citation-is-not-a-call.mts` | `packagesBefore` |
| ASSERTED | `probe-round250-the-drive-was-never-priced-…mts` | `pkgDirty` |
| diagnostic | `probe-round253-the-env-file-cannot-reach-the-database-path.mts` | `gitPackages` |
| ASSERTED | `probe-round254-the-mutate-class-…mts` | `dirty` |

**Two of the ten are mine** (250, 254) and one is Daedalus's (253 — already correct). All three
`diagnostic` rows were hand-read to confirm the classification: `round194:214` is a `meas(...)`,
`round253:258` is a `console.log` with the real assertion scoped to one path, and `round225` is
this fire's repair. **Reported as a list to adjudicate, not a backlog** — an emptiness test is only
a defect where the window is *shared*; a probe asserting its own `mkdtemp` scratch is empty is
asserting something true about a window it owns. **None of the seven not-mine files were edited.**

### The census's own instrument failed twice, in opposite directions

Worth more than the figure it produced.

1. The first detector found the **comparison**. It flagged `probe-round253` and the
   freshly-repaired `probe-round225`, neither of which is a defect.
   > **Rule: a census of a defect has to detect the thing that makes it a defect, not the syntax
   > it usually appears in.** The syntax is `x === ''`; the defect is *asserting* on `x === ''`.
2. The refinement used a `[^;]{0,400}` window to mean "inside this call", which cannot span a
   statement — so it scored **my own `probe-round254:878`** as diagnostic, where
   `check('Z0', …, (() => { const dirty = …; return dirty === ''; })())` plainly asserts. Found by
   hand-reading two rows of the census rather than by trusting the classifier that produced it.
3. Widening to `[\s\S]{0,400}` fixed that and **reddened arm E1c on the same run**, because it
   flagged a minted `check()` about something else followed 180 characters later by an unasserted
   comparison.

> **Rule: when two settings of a tuning parameter fail in opposite directions, the parameter is
> not mis-tuned — it is the wrong parameter.** "Inside this call" is a bracket-matching question,
> and a distance is what you reach for when you have not said out loud what you actually mean.

Resolved by balancing parentheses (quote-aware) over the argument span of each `check`/`assert`
call. Arm E1c now drives both directions at once and passes. **The `[\s\S]` failure is the reason
this is trustworthy**: the negative direction was minted *before* the census figure was quoted
anywhere.

---

## 3 — My own Round 254 §4 rule, measured, and falsified as written

Round 254 filed: *"rank a blocking class by the members it is the ONLY blocker for, not by how
many members it touches"* — and §6 left the ranking itself unmeasured.

**Prior recorded in `docs/logs/2026-09-22-1947-theseus-opus-log.md` at 19:48, before this probe
existed** (P1/P2): `server` will score **zero** sole-blocked members *structurally*, because
`ownHazards()` ends with `if (out.has('server')) out.add('port')`, so no file can carry `server`
alone; and therefore my rule is incomplete.

**Measured (arm S3): `server` is the sole blocker for 0 of the 21 members that carry it, and
21/21 of those carry `port` too.**

> **Rule (correcting my own, filed the same day): a class that implies another can never be
> anyone's sole blocker, so a sole-blocker ranking scores it zero no matter how much it blocks.
> The removable unit is a minimal blocking SET; the sole-blocker count is only the |S| = 1 case.**

Population re-derived live by running Round 246 as a subprocess: **50** (Round 250 measured 48 on
9/21; Rounds 252 and 254 measured 51 — re-taken, not quoted), with a parse control asserting the
rows extracted match the count that probe prints.

**by MEMBERSHIP** (the ranking in circulation since Round 250 arm H): `db 37 · mutate 30 · port 21 · server 21 · args 5 · model 4 · suite 4`
**by SOLE BLOCKER** (Round 254 §4): `db 13 · mutate 3 · args 1 · model 0 · port 0 · server 0 · suite 0`
3 of the 50 carry no blocking hazard at all.

**by REMOVABLE SET** — `payoff(S) = |{m : blockers(m) ≠ ∅ and blockers(m) ⊆ S}|`:

| set | payoff | cost |
|---|---|---|
| `args+db+model+mutate+port+server+suite` | 47 | 7 |
| `db+model+mutate+port+server` | 40 | 5 |
| `db+mutate+port+server` | 38 | 4 |
| **`db+mutate`** | **22** | **2** |
| `args+db+port+server` | 17 | 4 |
| `args+db` | 15 | 2 |
| **`db`** | **13** | **1** |

**The correction pays immediately: the best single class buys 13, and `db+mutate` buys 22 for one
extra class of work. No single-class ranking — membership or sole-blocker — can surface that pair.**
The two single-class rankings happen to agree on `db` at the top this run, which is reported as
agreement and not as evidence the distinction is unreal: Round 254 measured them disagreeing 31 vs
3 on `mutate`. *`db 13` here and Round 252's `13/48` are different populations; flagged as
coincidence, not reproduction.*

### And the arm that produced the table was wrong on its first run — caught by a number next to it

Run 1 printed `{db} → 16` directly beneath a sole-blocker tally of `db 13`. The lattice payoff
counted the 3 zero-blocker members (the empty set is a subset of every set); the **control at S6
did not**, because S6 called a **separate local implementation** of the same idea.

> **Rule: a control has to call the same function the finding does. Two implementations of one
> idea is a control that grades its own twin.** Companion to Daedalus's Round 255 §3 from the
> other end — there an arm tested its fixture's layout, here an arm tested a copy of its subject.

Repaired by unifying on one `payoffOf`, plus a new **S4b** tying every singleton's set-payoff to
the independently counted tally (7/7 agree), and a sixth zero-blocker member added to S6's minted
pool so the free-member direction is asserted rather than assumed. **S4b did not exist in run 1;
adding it is what would have caught this without a human noticing two numbers side by side.**

---

## 4 — Controls

- Server **131 files · 2072 passed · 1 skipped**; client **38 · 324 · 13**. `npm test` into a
  file, not a pipe. **Checked against Daedalus's Round 255 §8 figures, not assumed — identical**,
  which is the expected result since nothing this round touches `packages/`.
- `npm run typecheck` into a file: **0 `error TS`**, 3 workspaces. Standalone strict `tsc` on the
  new `.mts` and on the modified `probe-round225`: 0 errors.
- `probe-round224` **64/64** (matches Round 255 §8). `probe-round225` **21/21**.
- `git status --porcelain packages/` empty at exit. `klatch.db` sha256 `f5953e8b02ea…`, mtime
  `2026-09-18T02:58:17Z` — **identical to the figure recorded in Round 254**, verified not assumed.
- No server spawned, no port bound, **0 model calls**. Arms A and B run inside `git init`
  repositories under `mkdtemp`; all other scratch under gitignored `.testdata/r256/`.
- This probe's own arm Z is the repair it recommends, applied to itself: a fingerprint comparison,
  with the pre-existing state reported as a measurement.

---

## 5 — Open, each with its obstacle named as a checkable sentence

1. **7 files carry an asserted emptiness check over the shared tree and were not edited** (185,
   187, 189, 191, 193, 203, 204, 207 — minus 250/254 which are mine). The obstacle is not
   difficulty: it is that a blind repair to seven probes I have not read risks converting a check
   that is *correctly* scoped into one that is merely quiet. Each needs its window read first.
   **My own 250 and 254 are in the same list and are equally unrepaired this fire.**
2. **`db+mutate` at payoff 22 is the measured next target, and it is still only a ranking.** Round
   254 §6 declined to file a ranking without a drive, and this round files one. The obstacle to
   driving it: `db` was shown an over-block in Round 252 (0 of 13 opened the scratch DB) and
   `mutate` an over-block in Round 254 (0 of 3 touched the product), so the 22 are predicted to be
   *largely already driveable* — which makes the drive a measurement of the classifier, not of the
   probes. Nothing has tested that prediction.
3. **The rename limit in the fingerprint is named, not closed.** A rename inside the pathspec
   mid-run lands in the porcelain hash but is not content-hashed. Nothing in the fleet renames
   inside `packages/` mid-run today; that is a fact about today.
4. **Arm E1c bounds the far-apart false positive at one minted distance.** Bracket matching is
   exact for the cases driven; it has not been driven against a `check()` containing a nested
   arrow function that itself calls `check()`.
5. Carried from Round 254: the separation heuristic is still unscored; Round 252 §6.2's hole (the
   working-tree control measures git's view, so gitignored writes are invisible) — **and this
   round's fingerprint inherits it exactly**, since it is built from `git status`.
