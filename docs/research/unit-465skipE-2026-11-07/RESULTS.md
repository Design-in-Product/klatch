# unit-465skipE — RESULTS

**Theseus, 2026-11-07 WORK fire.** Pre-registration: `PRE-REGISTRATION.md`, pushed as the only file
in this directory before any instrument in it existed (`git ls-tree -r origin/main` over the
directory, one path returned — run, not asserted).

**9 predictions: 9 held.** 1 unregistered finding from a drive nobody designed for it. **2 defects of
my own, both in my own instrument, both caught by the drives** and both recorded in the instrument
rather than quietly fixed. Gate `GATE ok exit=0` on all four stages and the aggregate.

## 1. The cure, and what it changed

Arm E's not-built path records a **hard skip** through `lib/probe-outcome.mts` instead of running
three checks. The first of those three — `'the race state is built'` — was a **precondition**, not a
claim about the product, and it is an evidence line now: a row emitted only on the branch that makes
it true is green by construction.

So the arm publishes **two** claims instead of three, and the green conclusion reads **13**.

| state | before | after |
|---|---|---|
| race built, healthy product | exit 0, `All 14 … passed` | exit 0, `All 13 … passed` |
| race built, size test gone | exit 1, `2 of 14 FAILED` | exit 1, `2 of 13 FAILED` |
| race **lost**, healthy product | exit 1, `3 of 14 FAILED`, **two of three E lines a FAIL whose reason text says the claim held** | exit **3**, `did not run: the race state could not be built`, **0 E rows emitted** |

## 2. The drives

Five arms, each a **real `npx tsx` run of the real probe** — not a fixture. `classify` is **imported**
from `sweep-probes.mjs`, never re-spelled: a grader at this call site could only grade its own copy
of the thing it is grading. Recordings: `drive0`–`drive4` `.out`/`.err`, grading in
`grading-all.txt`.

```
drive0  control              exit 0  2558 ms  All 13 regression checks passed.          PASS
drive1  X1, race lost        exit 3  3416 ms  INCONCLUSIVE — established 11, skipped 1  BLOCKED
drive2  C1, size removed     exit 1  2692 ms  2 of 13 regression check(s) FAILED.       RED
drive3  X1 + C1              exit 3  3575 ms  INCONCLUSIVE — established 11, skipped 1  BLOCKED
drive4  control, repeat      exit 0  2539 ms  All 13 regression checks passed.          PASS
```

**P1 held.** `drive0` / `drive4`: exit 0, `All 13 regression checks passed.`, arm E 2 rows.

**P2 held.** `drive1`: exit **3**, and the output carries the structural line
`did not run: the race state could not be built`. The state line above it reads
`[E] state NOT BUILT — commit made its own -wal (ino 93823032 != 93823023) — cleanup had already
run — 3 attempt(s)` — all three attempts consumed, the two inodes printed, so the reason the arm
refused is readable without re-driving it.

**P3 held.** `arm E check row(s): 0` in `drive1` and `drive3`. The two lines whose reason text used to
contradict their own verdict are **not emitted** in that state, rather than emitted-and-green or
suppressed.

**P4 held, and the declaration is load-bearing in both directions.** Same real `(code, out)` through
the real classifier, the declaration as the only variable:

```
drive1  classify [declared + on the line]        -> BLOCKED  (matched=false skipped=true  code=3)
drive1  classify [no declaration at all]         -> RED      (matched=false skipped=false code=3)
drive1  classify [declared label not on the line] -> RED      (matched=false skipped=false code=3)
```

The second and third rows are what keep the first from being bought by the exit code alone.
Daedalus measured this pair against a fixture in `unit-465promote` §4; *a foil must run at the
granularity of its claim*, so it is re-measured here against the probe that will actually be
promoted.

**P5 held — the cure did not blind the arm.** `drive2`, size test removed and the race won: exit 1,
and the two E rows read

```
  [E] FAIL a -wal written inside the window keeps every byte — -wal:8272B committed -> -wal:absent
  [E] FAIL another process can still read the database it is writing — unreadable (disk I/O error)
```

The defect block already read correctly before the cure, and still does. The 8,272 bytes and the
`disk I/O error` are `unit-465sizeguard`'s figures reproducing.

**P9 held.** The §1 platform line is comment-only; `drive0`/`drive4` are the before-and-after of a
run it cannot reach.

## 3. The state builder is live, and the clean re-drive is NOT evidence on its own

X1 and C1 are both **declared gate variables**, and *a declared cripple no hook reads runs clean* —
so the five green drives after removal are bookkeeping, not evidence:

```
clean-drive0..4   both gate variables set in 3 of 5 arms, no hook reads either   5/5 exit 0, All 13
                  2502–2865 ms
```

The reach evidence is `drive1`/`drive3` (X1 set, race lost, 3 attempts consumed, two different
inodes printed) and `drive2` (C1 set, 8,272 bytes destroyed). Recordings under the `clean-` prefix,
because a re-drive writing to the same filenames leaves a single-file artefact holding only the last
arm driven.

## 4. P6 and P7 — the census, and a prose figure that had drifted five sites

**P6 held to every digit.** The new `skipped` caller is a safe shape, and `probe-round224` arm Q3 —
the gate, not my own reader — says so in its own words:

```
PASS [Q] no live caller can supply a non-array `skipped` or a nullish element: 55 argument site(s)
         in 32 file(s) … all 52 element(s) arrive by a literal-shaped push … — 0 reachable:
         24 literal arrays, 29 locals, 2 declared fixture param(s), 29 declaration(s) all
         array-initialised with 0 re-assignments
All 192 regression checks passed.
```

Predicted before driving: 55 sites, 32 files, 24 literal arrays, 31 identifiers (29 locals + 2
params), 29 declarations all array-initialised with 0 re-assignments, 52 pushes all literal. **All
seven figures.**

**P7 held — and this is the finding.** `probe-outcome.mts`'s `skipped` docblock froze the population:
*"50 `skipped` argument sites in 29 files: 21 array literals and 29 bare identifiers (27 …
locals …). All 50 elements arrive by a literal-shaped `.push()`."* Measured **before** this unit
touched anything: **54 sites in 31 files, 24 literal arrays, 30 identifiers (28 locals + 2 params),
51 pushes**. Four sites and two files past the sentence, before I added the 55th.

Nothing went wrong with the *gate*. Q3's predicate is `reachable === 0` and every count in its label
and its `got` string is computed each run, so it could not drift. What drifted is the **paragraph**,
silently, because a count in prose beside a live reading has nothing holding it. The paragraph's own
last sentence says *"prose beside a decision is not the record — the arm is"* — and it was the
counter-example to itself.

Cured by removing the frozen counts rather than refreshing them, with the old sentence quoted and
dated so the drift is legible, and a pointer to Q3's own output for the live numbers. Refreshing
them would have re-armed the same drift at a later date.

## 5. Unregistered finding: a BLOCKED row is "we do not know", never "the guard is intact"

`drive3` — X1 **and** C1, a lost race against a **crippled** product — reads **BLOCKED**, exit 3,
the same as `drive1`. That is correct: nothing was measured, so nothing may be concluded. But it is
worth saying out loud in front of whoever reads a BLOCKED sweep row, because the cure's own success
creates the hazard. Arm E's power is **conditional on winning the race**. Before the cure, that
state was a red that looked like a product defect; after it, it is a blocker that must not be read
as a pass. The declaration buys an honest "we do not know" and nothing more.

This is the mirror of the thing the cure fixes, and both of them live in the same place: the arm
cannot report on a claim it did not reach, and whichever way it reports, the report must not read
like a verdict on the claim.

## 6. Against myself, twice — both in my own instrument

**(1) My P3 detector was an undifferentiated containment match.** First version:
`out.includes('keeps every byte')`. It reported **EMITTED** in the skip state. Arm **D**'s row is
`a pre-existing -wal keeps every byte`, so the detector fused two arms' claims and could not see
that arm E's row was gone. The substance of P3 was fine from the first drive; the reader could not
say so. Caught by its own red, re-keyed on arm E's own `[E]`-prefixed rows, re-driven. Verbatim, the
line it printed:

```
  claim "keeps every byte": EMITTED          ← drive1, pre-fix, the contaminated reading
```

**(2) My conclusion reader copied the sweep's `CONCLUSION` list and printed `(none)` for the red
drive.** `sweep-probes.mjs:2124` is `[/^INCONCLUSIVE — /, /^FAILED — /, /^All \d+ regression checks
passed/]`, and `probe-outcome`'s own failure headline is `N of M regression check(s) FAILED.` —
matching none of the three. I went looking for a dead pattern in the sweep and **did not find one**:
`/^FAILED — /` is live for the hand-rolled probes that do not summarise through `probe-outcome`
(`probe-round298`, `-299`, `-305`, `verify-expand-reachability.mjs`, `probe-scratch-server.mjs`,
censused with `grep -rn`), and the sweep reaches `probe-outcome`'s headline through its
`NOT_A_CONCLUSION`-filtered fallback. So: a defect in **my** reader, no defect in the sweep, and the
suspicion is recorded as refuted rather than dropped.

Neither of these moved a verdict. Both are written into the driver beside the code that was wrong,
because the next person to copy that list will copy it for the same reason I did.

## 7. Restoration, verified against a pre-action baseline

* `grep -rln 'U465SKIPE' scripts/ packages/` → **no files**. (The driver under `docs/research/`
  still *sets* both variables, which is what a driver is for.)
* `git diff --stat a7a91c12 -- scripts/ packages/` — `a7a91c12` is the tip **before** the cripple
  commit, captured before the cripples existed rather than reconstructed afterwards — returns
  `scripts/probe-backfill-sidecar-neutrality.mts | 75 insertions(+), 16 deletions(-)` and **nothing
  else**. `scripts/backfill-entity-bindings.mts` is byte-identical to the pre-cripple tree, so the
  product carries no residue, and the only change is the cure.

## 8. Gate

```
GATE ok exit=0 census
GATE ok exit=0 typecheck
GATE ok exit=0 server    files 143 passed (143) · tests 2221 passed | 1 skipped (2222)
GATE ok exit=0 client    files 26 passed | 13 skipped (39) · tests 333 passed | 13 skipped (346)
GATE ok exit=0 gate(census+typecheck+server+client)
```

**P8 held.** Daedalus's and my own figures from earlier today, to the byte. This unit adds no vitest
test, so the gate moving would have been the finding.

## 9. What this does not decide

* **Promotion.** Cleared on the axis Daedalus declined it over, not decided. The entry is Argus's
  list and the instrument is Daedalus's; the `skip:` regex they need is in the probe's own `skipped`
  docblock and in the `DEFERRED` note, so the decision costs them no drive.
* **E4/E5** — unchanged, still open, and this unit adds nothing to it.
* **`npm test` still never runs this probe**, before or after promotion (`package.json:15`,
  `gate.mts:24`, `sweep-probes.mjs:2531`). Daedalus's §5, repeated here because it changes what the
  promotion is worth and it is the kind of thing a reader infers the other way.
