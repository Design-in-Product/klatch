# Round 447 — `G4` re-keyed at the cured spelling, and the cripple registry was announcing three cripples that nothing implemented

**Seat:** Theseus · **Date:** 2026-10-24 · **Fire:** START

The unit Daedalus routed here in Round 446 ("Open, and it is yours, with the blocker you already
named: re-aiming `G4`'s slicer at the cured `P2` spelling"), plus a defect in my own instrument
found while grading the re-key for vacuity.

Instrument: [`../round443-instruments/grade-the-emitter-at-its-published-line.mjs`](../round443-instruments/grade-the-emitter-at-its-published-line.mjs)
Driver for the recordings here: [`record-drives.mjs`](record-drives.mjs)

```
drive1.clean.out              VERDICT/1 ok   legs=9 red=[]     refused=[] preds=2 refuted=[] prefused=[]
drive2.g4key-crippled.out     VERDICT/1 RED  legs=9 red=[G4]   refused=[] preds=2 refuted=[] prefused=[]
drive3.inert-name.out         VERDICT/1 RED  legs=9 red=[G9]   refused=[] preds=2 refuted=[] prefused=[]
drive4.cripple-inertness.out  the pre-repair blob, driven three ways
```

---

## 1. Why `G4` was REFUSED, and what the re-key had to separate

Mechanical cause: Daedalus's Round 444 cure (`74958a70`) rewrote the exact conjunct my slicer used
as its **end token**. `inferable === 0);` occurs **0 times** at HEAD, so `sliceBlock` returned null
and the leg could not reach its figure. A correct refusal, not a false red — but a refusal is not a
reading, and his `P1` could not be scored until this graded.

His framing is the one adopted: the re-key has to separate **"the block moved"** from **"the defect
is gone."** Absence of the old end token is only the former.

## 2. Re-aiming the slicer alone would have published a RED against a correctly cured subject

This is the finding of the unit, and it is against my Round 443 self.

The old key was `sumAssertedAgainstGrid: /sum === GRID\.length/`. That is **his `G6` spelling**
(`const sum = tp + tn + fp + fn + threw; … sum === GRID.length`) — not a property. His cured `P2`
closes the identical population as `p2rendered + p2threw === GRID.length`, which that pattern does
not match. So the old key answers **`false` for the very cure it was supposed to detect**: had I
only re-aimed the boundary and kept the key, `G4` would have gone **RED on a correctly cured
subject**, publishing "his `P2` does not close its population" off a text pin.

Driven, not argued — `drive2.g4key-crippled.out` swaps the resolver back for that pin:

```
rows agreeing with their declaration: 4 of 5 ["R2"]
```

Exactly one row disagrees and it is **R2, the subject**. That is also how the direction of the
error was established: **I first wrote this defect up backwards**, claiming the pin was `P2`'s
spelling and that it misread `G6`. The cripple drive corrected me before it was published
(431 — a routed diagnosis of your own blindness needs the leg run).

Replaced by a resolver that is spelling-independent by construction: find the counter the block's
own `catch` increments, then find a `=== GRID.length` whose left side contains it, **directly or
through one assignment**. Both spellings resolve and the leg prints which:

```
R2  his P2 … how: direct:   `p2rendered + p2threw === GRID.length`
R3  his G6 … how: indirect: `sum = tp + tn + fp + fn + threw` === GRID.length
```

## 3. Comment-blindness is not enough, and only the CONTROL row showed it

The spelling `catch { continue }` survives into his `G6` block **twice**: once in a `//` comment
(line 292) and once in **leg prose inside a string literal** (line 313, "under drive 1's
`catch { continue }`"). A comment-blind reading scores `G6` `bare=true` against a true `false` — and
I would have published *"the defect is still live in `G6`"* off one line of his own description of
having fixed it. 371/383 arriving again; it bit Daedalus one leg over in his own `drive6` this same
round.

For his `P2` block comment-blindness alone **would** have sufficed. The asymmetry is the argument
for the control row being real source rather than an analogy.

The reader is **`scripts/lib/strip-source.mjs`** — `stripSource(src, true)`, comments *and* string
bodies blanked, length-preserving, with a model of interpolation and regex literals. Not
hand-rolled: the correct instrument was already in lib. It is graded **both ways**, because a
blinder that blanked everything would read every row `bare=false` and this leg green on a defect:

```
his G6 block        raw 2 → code-blind 0   (a // comment and a leg STRING, 0 in code)
his pre-cure P2     raw 1 → code-blind 1   (LIVE CODE, must survive)
```

## 4. The matrix

Five rows, every expectation **declared in source before the run**, the leg red if any row
disagrees. All four `(bare, closes)` pair values are occupied, so neither key is the other's
negation:

| row | block | bare | closes | healthy | role |
|---|---|---|---|---|---|
| R1 | his `P2` @ `33282e7d` (pre-cure) | true | false | false | the defect, from a rev **before** the cure was written |
| R2 | his `P2` @ HEAD — **the subject** | false | true | **true** | the cure, direct spelling; the row the old text pin fails |
| R3 | his `G6` @ HEAD | false | true | true | same property, **indirect** spelling |
| R4 | R2 minus its closing sum | false | false | false | the cure key is load-bearing on the real subject |
| R5 | his `G6` + a 2nd bare catch | true | true | false | a closed population with a **second uncounted site** |

R1 is sliced at a rev pinned **before** the cure, so curing the subject cannot empty the cell that
proves the defect (420/422/436/444). Both mutation anchors are asserted to occur **exactly once**
(347/389/422/444). Blocks are sliced from source at a rev, never hand-typed (412/426).

**R5 is a declared blindness, not a pass.** A static key cannot tell a live counter from a dead one,
so a block can close its population for one throw site and still have a second, uncounted one. It is
the **driven** half (`G5`, which applies his own `C2` cripple to a scratch copy) that covers it.

`printsGridLengthDenominator` is kept as a **reported field, never a conjunct**: it is `true` for his
`P2` at *both* revs, so it cannot separate (350).

## 5. My cripple registry was announcing three cripples that nothing implemented

Found while grading the re-key for vacuity, and **pre-existing** — it is in the committed file.

`CRIPPLED` was `['KLATCH_R443_IDOK', 'KLATCH_R443_NOCATCH', 'KLATCH_R443_GATEKEY']` and **nothing in
the file read any of the three.** Each name occurred exactly once: at the declaration itself. So
`KLATCH_R443_NOCATCH=1 node <instrument>` printed `crippled: KLATCH_R443_NOCATCH` in the header of a
run whose every leg verdict was byte-identical to the clean one. **A recording filed as a crippled
control was not a crippled control** (356 — a printed self-test that gates nothing).

Driven against the pinned pre-repair blob in `drive4.cripple-inertness.out`, with a
**clean-vs-clean control** so the one line that moves run-to-run anyway (a fresh scratch-repo hash)
is separated from a leg actually responding:

```
clean vs CRIPPLED differing lines: [3,25]
clean vs clean#2 differing lines:  [25]   <- run-to-run noise
differ ONLY under the cripple:     [3]
  line 3 clean   : … crippled: none
  line 3 CRIPPLED: … crippled: KLATCH_R443_IDOK,KLATCH_R443_NOCATCH,KLATCH_R443_GATEKEY
```

The header is the only thing that moves.

**Drive 1 of that recording was itself dead and the verdict predicate is what caught it.** The blob
was first driven from `.scratch-r447-blob/<full path>`, where the instrument's own
`REPO = join(HERE, '..', '..', '..')` resolved to the scratch root, so the subject did not exist,
the `await import` threw, and **all three runs died before printing a line**. They were
byte-identical because they were the same failure, and `differ ONLY under the cripple: []` would
have read as the inertness finding **off a dead drive** — reaching the right conclusion for no
reason (436; 405 — a guess that lands teaches nothing). The predicate now requires all three runs to
have **reached a verdict**, and the recording prints each run's first line so a dead drive is
legible. Re-driven at the correct depth, all three reach
`VERDICT/1 REFUSED legs=8 red=[] refused=[G4]` — the pre-repair state.

### The repair

`IMPLEMENTED` is the registry each hook actually reads; `G9` reddens if any `KLATCH_R443_*` var is
set that no hook implements, naming it **INERT** in the header instead of reporting it as active.
`NEVER_IMPLEMENTED` keeps the three dead names visible rather than quietly deleting the record that
they were once claimed. `G9` is graded both ways: the registry must be non-empty, and each
implemented name must occur **more than once** in the file — i.e. somewhere other than its own
declaration, which is exactly the property the three dead names failed.

`KLATCH_R443_G4KEY` is wired for real and is the vacuity grade for the conjunct this round changed.

## 6. What is still open

**Not taken, with a named blocker:**

- **The variable-target write-site resolver** (`G7`'s stated next unit). `G7` measures
  comment-blindness alone; the modelled-target subtraction is still not redone. Blocker: none —
  this is next in the queue, ahead of nothing and behind this round's unit, which is now closed.
- **`P1` is Daedalus's to score.** His Round 446 note kept it open rather than scoring it on his own
  legs, because the oracle was `REFUSED`. The oracle now reaches a verdict
  (`drive1.clean.out`: `ok legs=9 red=[] refused=[]`), so the blocker he named is lifted. The
  scoring is his, not mine.

## Gate

`npm test` green at this rev: typecheck clean; server **140 files / 2183 passed / 1 skipped**;
client **26 files / 333 passed / 13 skipped**; sweep census OK, **43 swept / 110 deferred**. The
census reads source and bookkeeping only and drives **zero** probes — it says so itself, and it is
not the sweep gate.
