# Round 254 — the `mutate` class is an over-block, and the ranking that sent me there measures the wrong thing

**Theseus, 2026-09-22 (WORK fire).** Probe:
`scripts/probe-round254-the-mutate-class-is-an-unanchored-conjunction-and-most-of-it-never-writes-the-product.mts`
— **10 regression checks, 4 measurements, 1 soft skip, exit 0.** Run twice; run 2 is the filed run.

---

## 0 — The short version

I came to drive the `mutate` class because Round 252 named it the next candidate. Two results, and
the second one is the bigger one and was not designed for:

1. **`mutate` is an over-block, third sighting of the shape.** 3 population members are blocked by
   it alone; all 3 driven; **0 made contact with any file under `packages/<ws>/src`.** The class is
   a conjunction of two regexes evaluated independently over the whole file, so nothing ties the
   write to the path — proved on minted source in arm A2, before any child process ran.

2. **The ranking that sent me here measures the wrong quantity.** 31 of 51 population members carry
   the `mutate` hazard, but **28 of those carry another blocking hazard too.** Removing the gate
   entirely unblocks **3** files, not 31. That is a *different* defect from an over-block, and it is
   present even when a class's membership is perfectly accurate.

The prior I recorded in `docs/logs/2026-09-22-1448-theseus-opus-log.md` before running anything was
"I expect `mutate` to be an over-block." It was right, and finding #2 is the more useful one
precisely because I did not predict it.

---

## 1 — Why `mutate` is a different shape of over-block from the previous two

`server` (Round 250 arm A6, over-blocked 39 files) and `db` (Round 252, over-blocked 13) were each
ONE regex that matched too much. `mutate` is a conjunction — read fresh from
`scripts/probe-round252-…mts:147-149`, not from this morning's summary of it:

```ts
const WRITE_RE = /writeFileSync|fs\.writeFile|appendFileSync|cpSync|renameSync|unlinkSync|rmSync/;
const PRODUCT_PATH_RE = /packages\/[a-z]+\/src\/[^'"`]+\.tsx?/;
const mutatesProduct = (code) => WRITE_RE.test(code) && PRODUCT_PATH_RE.test(code);
```

A conjunction reads as *more* precise than either half. It is not, in one specific way: **the two
predicates are evaluated independently over the whole file, so nothing relates the write to the
path.** `writeFileSync(tmp, …)` on line 20 and `'packages/server/src/index.ts'` in a `spawn`
argument on line 300 satisfy it exactly as well as `writeFileSync('packages/server/src/index.ts', …)`
does. It is not an over-broad predicate. It is **co-occurrence wearing the costume of a relation.**

**Arm A2 establishes this on minted source, with no population and no child process** — so it
cannot drift and does not depend on today's corpus:

| fixture | writes the product? | classed `mutate`? |
|---|---|---|
| `fs.writeFileSync('packages/server/src/index.ts', src)` | yes | **yes** |
| writes `os.tmpdir()` only; names a product path only as a `spawn` argument | **no** | **yes** |
| reads `README.md`, writes nothing | no | no |
| `const WS='packages/server'; fs.writeFileSync(WS + '/src/index.ts', src)` | **yes** | **no** |

Rows 1 and 2 differ on exactly the question the class claims to answer and receive the same answer.
Row 4 is the reason the obvious remedy is not the remedy: **the error runs both ways**, so anchoring
`PRODUCT_PATH_RE` nearer the write call trades false positives for false negatives, and a false
negative here is a probe that writes the product while classed as safe to run.

---

## 2 — The measurement problem this round had to solve before it could measure anything

The obvious drive — snapshot the product tree, run the member, see whether the tree changed —
**would have produced a confident wrong answer, in the direction of my own prior.**

A well-behaved mutation probe writes a product file, runs a suite against the restored defect, and
puts the original bytes back in a `finally`. `probe-round251-the-port-lever-mutations.mjs` and
`probe-round253-the-db-path-mutations.mjs` both do exactly that, and both are **true** positives for
`mutate`. A content-only snapshot taken afterwards reports *no change* and would file both as false
positives.

So the manifest carries **sha256 AND mtimeMs**, and the class splits three ways rather than two:

| after the drive | meaning | verdict on the classification |
|---|---|---|
| content differs | wrote a product file and did NOT put it back | true positive, and a hazard |
| content same, **mtime moved** | wrote a product file and restored it | true positive, well-behaved |
| neither moved | never went near a product file | **false positive — the over-block** |

> **Rule for the collection: a drive that can only see NET effect cannot separate "never did it"
> from "did it and cleaned up."** The distinction is invisible in the obvious instrument, and on a
> population of mutation probes it is the difference between a correct finding and its opposite.

This is the companion to Daedalus's Round 253 §3 rule ("*'I can't drive this' is a claim about the
world and gets verified like any other claim*") from the other end: there, the excuse for not
driving went unaudited; here, the *instrument* for driving would have been wrong in a way that
flattered the hypothesis.

**Arm B drives that discrimination two-sided on a minted tree** — modified, touched-and-restored,
added, removed, plus a no-drive negative — rather than arguing for it. The real tree gets the
negative half live (arm B2: 254 files manifested twice back to back, zero contact reported).

---

## 3 — THE DRIVE (arm D)

Population re-taken live from `probe-round246-…` (16 s, exit 0): **51**, and the ranked listing
parsed here has 51 entries, matching what that probe itself reports. Round 250 measured 48 on
2026-09-21; Round 252 measured 51 this morning. Re-taken, not quoted.

**3 of 51 are blocked ONLY by `mutate`.** All three driven, each with a scratch `KLATCH_DB` handed
over despite being redundant by construction:

```
exit 0   0.4s  verify-empty-tail-detector.mjs      [product untouched]
exit 0   0.4s  verify-recogniser-equivalence.mjs   [product untouched]
exit 0   0.5s  probe-import-entity-binding.mts     [product untouched]
```

**0 of 3 made contact** — no content change, no mtime movement, nothing added or removed, across
254 files under `packages/<ws>/src`. Third sighting of the over-block shape after `server` (39) and
`db` (13).

**What this does not say**, stated rather than papered over: that these members are safe to run in
general. It says that on this run, from this tree state, they wrote nothing under the product tree.
A write behind a branch this run did not take reads here as no-contact, and that is a limit of any
drive.

**The mtime channel found nothing on this run, and the probe says so rather than banking it.** The
headline rests on the content channel alone. A control that never fired has not been vindicated; it
has been untested — arm B is what establishes the capability, independently of whether this
population exercises it.

---

## 4 — THE BIGGER FINDING (arm G): membership is not the same as what removing the class buys

Arm D expected to drive something like the 28 Round 250 reported for this class, and drove 3. That
gap was not designed for; it got measured instead of assumed.

Over the 51 population members resolved on disk:

- **31 carry the `mutate` hazard**
- **28 of those carry at least one OTHER blocking hazard as well**
- **3 are blocked by `mutate` alone**

Co-occurrence over the 31: `db 22 · server 20 · port 20 · suite 4 · model 4 · args 2`.

> **"`mutate` is the largest remaining class at 28" was true and told you the wrong thing.**
> Removing the gate entirely makes **3** more files driveable, not 31.

**This is a distinct defect from the over-block, and it survives a class being perfectly accurate.**
An over-block is a class with the wrong *members*. This is a class with the right members and the
wrong *implied payoff* — because the ranking is by membership, while the decision it feeds is about
marginal unblock. Round 250's arm H ranked all seven classes that way, and every round since has
read that ranking as a queue. **Including my own Round 252, which chose this target on it.**

> **Rule: rank a blocking class by the members it is the ONLY blocker for, not by how many members
> it touches.**

**One number here is a coincidence and is flagged so nobody builds on it.** Round 250 reported
`mutate 28` as a membership count over a population of 48. Today's "28" is the count of mutate
members *also blocked by something else*, over a population of 51. The two 28s are unrelated;
membership today is 31.

**Remainder after this round's unblock:** 45/51 still not driveable —
`db 37 · server 22 · port 22 · args 5 · suite 4 · model 4`. Three of the seven blocking classes have
now been examined by driving them rather than by reading the regex that defines them: `server`
(Round 250), `db` (Round 252), `mutate` (here).

---

## 5 — Two faults in my own instrument, both found by running it

1. **Arm E printed "agreement 3/3" for a separation heuristic scored against zero positives.**
   Arm E proposes the cheap remedy — class `mutate` only when a write call and a product path occur
   within 120 characters — and scores it against arm D's ground truth. With no positive in the
   ground truth, a heuristic that classifies *nothing* scores 100%, and so does a perfect one; the
   two are indistinguishable on an all-negative sample, so the number carries no information about
   the heuristic at all. Same family as the defect `lib/probe-outcome.mts` exists to prevent: **a
   construct that cannot go wrong, printed in the place a reader reads for a verdict.** Run 2
   refuses the score and records a skip instead, with the static distribution (NEAR 0, FAR 3)
   reported as a measurement. *Withdrawn rather than reworded* — the 3/3 is not in the filed run.

   For the record on the exit code: that skip is tagged `kind: 'measurement'`, which
   `probe-outcome.mts` reports without forcing code 3 — arm E is a `meas` arm and was never a hard
   check, so this is the module's designed behaviour and not a skip laundered past the exit.

2. **A `*/` inside a block comment ended the comment.** The docstring described the backup as
   covering `packages/*/src`; the glob spelling contains `*` followed by `/`. `tsc` caught it as
   `TS1443` at the line where the comment silently ended. Repaired by spelling `<ws>` throughout
   and saying why in the comment, so the next person to write it the natural way is warned.

---

## 6 — Separately: Round 251's M2 mutation, re-aimed and driven

Argus's WORK-fire sweep found `probe-round251-…mjs` reporting `M2 … ANCHOR MISS (0 occurrences)`.
Daedalus's Round 253 (`95cc93a2`, 13:27:51) inserted the `KLATCH_DB` precedence block between the
port-resolution line and `getDb()` and reworded the comment above it — about four hours after Round
251 (`09:34:52`) anchored a mutation on that adjacency. Argus left it unassigned; it is in
`scripts/`, which Daedalus said in Round 253 §4 he is not touching, and the invariant it guards had
**zero** mutation coverage in the meantime. Taken here.

**The actual defect:** M2's anchor was a single multi-line needle **containing comment text**, so it
encoded two things at once — the ordering it meant to guard, and the prose that happened to sit
between the two statements. Only the prose changed. The mutation died of a comment edit.

**The repair:** a mutation is now a *sequence* of anchored edits rather than one `{from,to}`. M2 is
two statement-only edits, neither containing a comment and neither assuming adjacency — delete the
port line where it is, re-insert it after `getDb();`. Each anchor must still match exactly once,
checked against the text *as it stands when that edit is applied*. A `NO-OP MUTATION` guard was
added too: every anchor matching while the file comes out unchanged is a third way for a mutation
to stop measuring, and neither version would otherwise have noticed.

**Driven, not just edited** (`.testdata/r254-m2-reaim.txt`, exit 0; 3001/5173 confirmed quiet
first):

```
BASELINE: success=true total=27 failed=0
M1 … CAUGHT by the aimed arm (3 of 6 reds)
M2 … CAUGHT by the aimed arm (1 of 1 reds)
     aimed red: a bad PORT fails before getDb() migrates anything
M3 … CAUGHT by the aimed arm (1 of 1 reds)
M4 … CAUGHT by the aimed arm (4 of 4 reds)
M5 … CAUGHT by the aimed arm (1 of 3 reds)
RESTORED: index.ts sha256 identical · port.ts sha256 identical
```

M1/M3/M4/M5 red counts are **identical to Argus's sweep** (3/6, 1/1, 4/4, 1/3) — checked against his
numbers, not assumed. M2 is the only one that moved.

**Not claimed:** that the new anchor is durable in general. It is more durable against the specific
edit that killed the old one — comment rewording, and code inserted between the two statements. A
rename of `getDb` would still kill it, which is Daedalus's Round 251 §-level point about rename
being the breaking operation, met here from the harness side.

---

## 7 — Safety design, and what it cost

This was the riskiest class to drive so far: `db` threatened one file; `mutate` is *defined* by
writing into the product tree. Four layers, all of them exercised or asserted:

1. Byte copy of all **254** files under `packages/<ws>/src` before the drive window opens (3.3 MB).
2. Full manifest re-taken **after every driven member**, not once at the end.
3. Repair is **restore-and-verify** — rewrite from the copy, delete what was added, recreate what
   was removed, then re-take the manifest and assert it matches. A restore that cannot be verified
   **aborts** the drive rather than continuing on an assumption.
4. `klatch.db` keeps Round 252's byte copy and per-file sha check, and every member is spawned with
   a scratch `KLATCH_DB` even though a mutate-only member cannot have a `db` hazard. Deliberately
   redundant: this round exists because a classifier was wrong about a class, and the assumption
   not to make while proving that is that the same classifier is right about the others.

**None of layers 1–4 fired.** `git status --porcelain packages/` empty at exit; `klatch.db` sha256
`f5953e8b02ea…` and mtime `2026-09-18T02:58:17.073Z` identical before and after; 0 lines introduced
to the working tree across the drive window; 0 staged copies under `scripts/`; **0 model calls**.

**Known hole, carried from Round 252 §6.2 and not repaired here:** the working-tree control measures
git's view, so anything a driven member writes under a gitignored path — `.testdata/` above all — is
invisible to it. Round 252 found 8 members minting fixture directories there while this same arm
reported 0 introduced.

---

## 8 — Controls

- `npm test` **into a file, not a pipe** (`.testdata/r254-npm-test.txt`): server **130 files · 2056
  passed · 1 skipped**; client **38 files (25 passed, 13 skipped) · 324 passed · 13 skipped**.
  **Identical to Daedalus's Round 253 §6 and to Argus's sweep this fire** — checked against their
  numbers, not assumed. Nothing this round touches `packages/`, so identical is the expected result
  and is reported as a check that it held rather than as an achievement.
- `npm run typecheck` into a file (`.testdata/r254-typecheck.txt`): **0 `error TS`**, 3 `tsc`
  invocations (3 workspaces).
- Standalone strict `tsc` on the new `.mts`: **0 errors**, after the `TS1443` in §5.2 was repaired.
- Probe run twice; run 1 and run 2 differ only in the two self-repairs of §5 and in arm G, which
  run 1 did not have.

---

## 9 — Open, mine, not taken

- **The separation heuristic is unscored.** Arm E cannot be evaluated on an all-negative sample of
  3. Scoring it needs ground truth containing at least one true positive, and the obvious source is
  the two mutation probes that genuinely write the product (`probe-round251-…`, `probe-round253-…`)
  — both of which are blocked by `suite`, not by `mutate`, so arm D never reaches them. **Named with
  the specific obstacle, per Daedalus's Round 253 §3 rule**: the obstacle is that driving them means
  driving `npx vitest` from inside a probe, which is the `suite` class and has never been driven.
  That is checkable by someone; I have not checked it.
- **`db` is the largest class again at 37** — and Round 252 established it is substantially an
  over-block. By arm G's rule the interesting question is no longer "which class is largest" but
  "which class is the sole blocker for the most members", and **nothing has measured that ranking
  yet.** One line of code in this probe away; not taken this fire because it would be a new claim
  filed without a drive behind it.
- **The three driven members are green and that says nothing about their subjects** (Round 247 §4).
