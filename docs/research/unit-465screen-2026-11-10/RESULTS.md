# unit-465screen — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-10 START · `date`-reads **10:47** (fire open), **10:51**
(pre-registration), **11:05** (this file; clock reads, not estimated from effort) ·
**Model:** claude-opus-5
**Pre-registration:** `caaae95c`, committed before `screen-declaring-file.mjs` existed and before any
screen verdict was read.

Instrument: `screen-declaring-file.mjs` (this directory — not `scripts/`, so it adds no probe and no
registry row). Captures: `screen-run-1.txt` (legs 1–5), `screen-run-2.txt` (legs 1–6). Exit **0**
both times. v1 and v2 unedited; both remain matched source/capture pairs at `5ab2f758` and
`66bae6ff`.

## Headline

**Seven predictions: six true, one refuted — and the refuted one inverts the conclusion in
Daedalus's favour.** The screen he routed is sound, but its **subject** is the declaration being
*added*, not the population of anchors that already exist. Keyed the way his §6 words it — a verdict
column over the existing 11 — it reads a **constant 2** before, during and after the one crash we
have, and it is blind to **6 of the 12** collision cells it is derived from. Keyed on the anchor whose
declaration does the harm, it **would** have caught `e501d6af` at the moment of declaration.

And a post-hoc leg, not pre-registered: **the copier population key both censuses stand on reports 2
of 5.** It is a scan for one message spelling, and three files assert the same anchor-uniqueness
property in two other wordings.

| # | claim | verdict |
|---|---|---|
| P1 | v2 re-runs unedited here, exit 0, differing from its committed capture on exactly one line — line 1, the tree-local path | **TRUE** |
| P2 | Screen S FLAGS exactly 6 of 11 hand-typed, member list as named | **TRUE** — `A_OUTCOME, A_R225_READ, A_SWEEP_READ, C_HERE, C_IMPORT_OUTCOME, C_IMPORT_SWEEP` |
| P3 | Daedalus's *"three of them sit beside their own real line"* is true of `probe-round377`'s seven | **TRUE** — 3 of 7: `A_OUTCOME`, `A_R225_READ`, `A_SWEEP_READ` |
| P4 | S is strictly narrower than the census: 6 of 12 COLLISION cells visible, 6 invisible, member list as named | **TRUE** — exact member list |
| P5 | my v1 §3 *"the 12 cells above 1 are that one fact"* is false; ≥1 cell has no census-anchor declaration among its occurrences; named instance the three `× probe-round374` cells | **TRUE**, named instance exact — **but see §5: the reason is not the one I pre-registered** |
| P6 | at `e501d6af`, S does not name `probe-round375` as the site | **TRUE, and stronger than predicted** — S's reading is *constant* across the crash |
| P7 | at `e501d6af`, `occ(375, C_SWEEP) <= 1` | **REFUTED** — it is **2**, and that is the finding |

## 1. P1 — v2 reproduces in this tree, and its capture has one tree-local line

```
exit code (from spawnSync, not inferred from the output): 0
lines: fresh 187, committed 187 · differing line numbers: 1
  L1 committed: scripts/ resolved to: /Users/xian/Development/klatch-worktrees/daedalus/scripts
  L1 fresh    : scripts/ resolved to: /Users/xian/Development/klatch-worktrees/theseus/scripts
```

186 of 187 lines byte-identical. Worth naming because it is the *only* thing in either capture that
is not reproducible from another worktree: **line 1 is an address in the tree that wrote it.** Any
future leg that pins v2 by hashing its whole capture will redden for every seat but Daedalus. Not a
defect in v2 — the guard it comes from is the right guard — but a pin on that file has to exclude
line 1 or key on the headline instead.

## 2. R7 — the calibration, which is what licenses everything below

The screen needs anchor *values*, and v2 prints them through `a.rhs.slice(0, 96)`. A truncated needle
inflates every count derived from it, so no value is parsed out of v2's stdout: v2 supplies the
declaration **line numbers**, and the values are read off the declaring file's own source at those
lines. The recovered values are then required to reproduce v2's cells:

```
cells compared: 66 · divergences: 0
CALIBRATED — this reader's occ and its recovered values reproduce v2's cells exactly.
```

66 of 66, member by member on `(anchor, file)`, not by totals. R6's parse check ran first against
**v2's own headline printed in the same run** — `anchors 14/14, hand-typed 11/11, derived 3/3, files
6/6, cells 66/66, collisions 12/12` — so the parse is graded against the subject's figure, not against
one typed here. Legs 1–5 are byte-identical between `screen-run-1.txt` and `screen-run-2.txt`.

## 3. P2 and P3 — the screen at HEAD, and his "three of seven" confirmed

```
 2  C_IMPORT_OUTCOME   declared in probe-round375…  FLAGGED
 2  C_IMPORT_SWEEP     declared in probe-round375…  FLAGGED
 2  C_HERE             declared in probe-round375…  FLAGGED
 1  C_SANDBOX          declared in probe-round375…  clear
 2  A_OUTCOME          declared in probe-round377…  FLAGGED
 1  A_SWEPT            declared in probe-round377…  clear
 1  A_HERE             declared in probe-round377…  clear
 1  sandboxDecl←SB374  declared in probe-round377…  clear
 1  sandboxDecl←SB375  declared in probe-round377…  clear
 2  A_R225_READ        declared in probe-round377…  FLAGGED
 2  A_SWEEP_READ       declared in probe-round377…  FLAGGED
```

**6 of 11.** By declaring file: `probe-round375` **3 of 4**, `probe-round377` **3 of 7** — so
Daedalus's §2 sentence is confirmed at the granularity he wrote it, and the three are the three this
seat had already named on 11/09 as reading 2 in `probe-round377` itself. The screen is **UNDEFINED**
on all 3 derived anchors, and says so rather than scoring them 0: a derived value is computed from the
subject at run time, so there is no literal in the declaring file to count. That is a real asymmetry
in the screen — *it cannot rank the cure it recommends.*

## 4. P4 — the screen cannot see half the collisions it was derived from

```
COLLISION cells: 12 · on the anchor's own declaring file (S can see): 6 · elsewhere: 6
-- INVISIBLE to S --
   C_IMPORT_OUTCOME × probe-round374 = 2    (declared in probe-round375)
   C_IMPORT_OUTCOME × probe-round377 = 2    (declared in probe-round375)
   C_IMPORT_SWEEP   × probe-round374 = 2    (declared in probe-round375)
   C_IMPORT_SWEEP   × probe-round377 = 2    (declared in probe-round375)
   C_HERE           × probe-round374 = 2    (declared in probe-round375)
   C_HERE           × probe-round377 = 2    (declared in probe-round375)
```

Not a threshold problem — a **key** problem. S is keyed on `(anchor, its own declaring file)`, one
cell per anchor; the census is keyed on `(anchor, every candidate file)`, six. Six of the twelve
collisions live in cells S has no row for at any threshold. So `occ(declaring file, anchor)` is not a
replacement for the census, and his §2's *"`occ(declaring file, anchor)` is"* the right screen is
right about the *variable* and wrong about the *domain*: it is one column of the matrix, not a verdict
over it.

## 5. P5 — my sentence is false, and the three cells are not the third mechanism I predicted

My v1 §3: *"the 12 cells above 1 are that one fact seen from different files."* All 24 occurrences
behind the 12 cells are now classified. Three cells have no census-anchor declaration among their
occurrences, and they are exactly the three I named:

```
C_IMPORT_OUTCOME × probe-round374 = 2
    :  55  other-line-containing   import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
    : 216  other-const-literal     const R373_IMPORT_OUTCOME = "from './lib/probe-outcome.mts';";
C_HERE × probe-round374 = 2
    :  58  exact-line              const HERE = dirname(fileURLToPath(import.meta.url));
    : 218  other-const-literal     const R373_HERE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
```

**The prediction is true and my reading of it was wrong.** I pre-registered these as a *distinct
mechanism* — a non-copier file carrying anchor-shaped constants of its own. They are not distinct.
`probe-round374:222-226` declares its **own** `once()` helper and applies `R373_IMPORT_OUTCOME`,
`R373_IMPORT_SWEEP`, `R373_HERE`, `R373_SANDBOX_DECL` at `:239-242`. It is a **copier**. So these three
cells are mechanism (a) exactly — a declaration sitting beside its own file's real line — and the only
reason the instrument could not label them as such is that **the census does not know
`probe-round374` is a copier.** Which is §7.

The honest count of mechanisms behind the 12, with the copier population corrected, is **two**:

- **6 cells** — the anchor's own declaration beside the real line in its declaring file (`C_HERE × 375`, `A_OUTCOME × 377`, …). Daedalus's reformulation.
- **6 cells** — a **sibling** copier's *longer* anchor declaration containing the shorter anchor as a substring (`C_IMPORT_OUTCOME` inside `A_OUTCOME`'s declaration at `377:624`; `C_IMPORT_SWEEP` inside `A_SWEPT`'s at `:625`; `C_HERE` inside `A_HERE`'s at `:626`) — plus the same shape against `probe-round374`'s `R373_*` block at `:216-218`.

`probe-round377:620-622` already says this in prose — *"the short forms occur twice in each file,
which is the `anchor not unique (2)` throw Round 376 hit"* — so the second mechanism was written down
by Daedalus months of rounds ago and neither census reports it as a class.

## 6. P6 and P7 — the screen carried back to the crash, where it is constant and where it is not

```
rev         occ(375, A_SWEEP_READ)   occ(377, A_SWEEP_READ)   C_SWEEP in 375
                 [the cell that threw]   [what S reads]
6b569a40            1                       2                 derived/not-a-literal
e501d6af            2  ** COLLISION **      2                 hand-typed literal @431, occ(375, C_SWEEP) = 2
3489290f            1                       2                 derived/not-a-literal
HEAD                1                       2                 derived/not-a-literal
```

**P6 is true and stronger than I predicted.** I predicted S would not *name the site*. It does worse:
`occ(377, A_SWEEP_READ)` is **2 at every one of the four revisions** — identical before the cure, at
the crash, after the repair, and now. As a verdict column over existing anchors, S is **constant
across the only crash in evidence**: it cannot distinguish the rev that broke the gate from the three
that did not. A reading that does not move when the subject moves is not a screen.

**P7 is REFUTED, and the refutation is the useful half.** I predicted `occ(375, C_SWEEP) <= 1` at
`e501d6af`. It is **2** — because `C_SWEEP`'s hand-typed literal at that rev was
`"const SWEEP = join(HERE, 'sweep-probes.mjs');"`, **byte-identical to `A_SWEEP_READ`'s value**. So
Screen S applied to `C_SWEEP`, in `C_SWEEP`'s **own** declaring file, goes
`UNDEFINED → FLAGGED → UNDEFINED` across the three revs: it fires on exactly the rev that crashed, and
only there.

That gives the mechanism of `e501d6af` in one sentence neither my §3 nor his §2 contains: **two files
declared the same source line as an anchor, and one of them was the other's subject.**

**So the screen's subject is the declaration being added, not the population that exists.** As a
pre-commit question — *"does the literal you are about to type already occur in the file you are
typing it into?"* — `occ(declaring file, anchor) >= 2` fires on the real crash, at the moment it
could still be withdrawn, and the fix is in the hand of the seat holding the keyboard. As a report
ranking the standing 11, it is constant across that same crash and blind to half the cells. Same
arithmetic, two different instruments; his §6 asked for the second one.

## 7. LEG 6 — POST-HOC, not pre-registered: the population key reports 2 of 5

Found while classifying §5's occurrences, and labelled as post-hoc because it was not predicted. v1's
copier population — **this seat's key, inherited unchanged by v2** — is a source scan for one message
spelling, `` /throw new Error(`anchor not unique/ ``. Five keys over the same 182 files:

| key | files |
|---|---|
| **K1** v1/v2 as built: the one message spelling | **2** — `375`, `377` |
| K2 the phrase `expected exactly 1` (phrase key, over-reports) | 5 — adds `247`, `248`, `284`, `309`, `374` |
| K3 declares a helper literally named `once` (name key) | 3 — `374`, `375`, `377` |
| K4 calls `once()` (consumer key, over-reports by construction) | 3 — `374`, `375`, `377` |
| **K5** mechanism: a throw naming an `anchor` + a count, in **any** wording | **5** — `247`, `248`, `374`, `375`, `377` |

Three wordings of one property:

- `` `anchor not unique (${n})` `` — `probe-round375:91`, `probe-round377:88` *(the only wording K1 sees)*
- `` `anchor occurs ${n} time(s), expected exactly 1` `` — `probe-round374:224`, `probe-round247:99`
- `` `anchor occurs ${occurrences}× in ${file}, expected exactly 1` `` — `probe-round248:138`

K3 and K4 are not rescues either: `probe-round247`'s helper is `mutate` (`:97`) and
`probe-round248`'s is not named `once` — a key on the helper's **name** misses them exactly as a key
on the **message** does. K2 catches `284:402` and `309:656`, which are `expected exactly 1`
assertions about *probe files* and *marker lines*, not anchors — so the phrase key over-reports and
K5 is the defensible one.

**What it costs.** `probe-round374`'s four anchors resolve fully, and **three of the four are FLAGGED
by Screen S in their own file**:

```
R373_IMPORT_OUTCOME  @216  occ(own file) = 2  FLAGGED
R373_IMPORT_SWEEP    @217  occ(own file) = 2  FLAGGED
R373_HERE            @218  occ(own file) = 2  FLAGGED
R373_SANDBOX_DECL    @219  occ(own file) = 1  clear
```

So the hand-typed population is at least **15, not 11**, the copier population at least **5, not 2**,
and **both censuses' headlines are floors for a reason neither declared.** `probe-round247` and
`probe-round248` are reported **UNREAD, not cleared**: their helper names are derived from the nearest
enclosing declaration above the throw — which need not be the substitution helper — and no single-line
`<helper>(<src>, <ID>, …)` call site parsed, so this reader has no anchor list for either. Three
copiers, four more anchors measured, two copiers' anchor sets unmeasured.

This is the third blindness in a reader this seat built, and the first one that is in the
**population** rather than in the extraction: W1, W2 and W3 all widened what v1 could *see about the
files it had chosen.* None of them questioned the choosing.

## 8. Refusals, checked rather than asserted

- **R1** — `git diff --stat -- scripts/ packages/` run at wrap: **empty**. No cure, no arm, no
  registry row. This unit measures and reports only.
- **R2** — no anchor value, line number or cell count typed into the instrument. Values come from the
  declaring file's own source at v2's reported lines; cells, ids, kinds and line numbers from a fresh
  v2 run; and R7's calibration grades the recovery against v2's own 66 cells.
- **R3** — v1 and v2 unedited; `git log` shows `census-anchors.mjs`/`census-run-1.txt` last touched
  `5ab2f758` and `census-anchors-v2.mjs`/`census-v2-run-1.txt` last touched `66bae6ff`.
- **R4** — held: `probe-round377`'s seven anchors are **not** derived here, and the census is **not**
  promoted into the gate. Both blockers unchanged (§9).
- **R5** — held: this is a report. No gate leg, no sweep row, no promotion. A verdict with no red
  state of its own is not a gate, and §6 is now a second reason to say so — the verdict S computes is
  constant across the crash a gate leg would have to redden on.
- **R6** — the parse-completeness check ran and passed against v2's own headline (§2). Its refusal
  limb is live, not decorative: the first run of this instrument **did** refuse, on
  `files 0/6, cells 0/66, collisions 0/12`, and reported no matrix.
- **R7** — calibration ran before the historical leg and passed 66/66 (§2).
- **R8** — no scratch under `.testdata/`, no probe driven as part of any measurement.
  `git status --short` clean of `.testdata/`.

## 9. Not done, blockers named, no deadline from me on any

- **The population cure — widening the copier key to K5 and censusing `247`/`248`'s anchors.** Not
  done. **Blocker: `247` and `248` are UNREAD here, not cleared** — their substitution helpers are not
  named `once` and their call sites did not parse single-line, so widening the key without an
  extractor that resolves their anchors would report a population of 5 with 2 members' anchor sets
  blank, which reads as "measured and empty". The extractor is the unit, not the key.
- **Deriving `probe-round377`'s seven hand-typed anchors.** Not done. **Blocker unchanged:** `377`'s
  pin is cross-pinned by siblings (`C5` asserts `A1 A2 A4 C2` on a driven copy of `375`), so seven
  derivations plus a cripple per derivation is a unit, not a tail.
- **Promoting any of this into the gate.** Not done. **Blocker unchanged:** no planted-duplicate red
  state is built, and §6 adds a second requirement — the gate leg has to key on the *declaration being
  added*, so its red state is a two-rev delta, not a single tree.
- **The screen as a pre-commit check (§6's conclusion).** Not built. **Blocker: it needs the
  planted-duplicate red state too** — a check that fires on a new declaration must be graded by
  planting one, and that is the same missing state as the item above. One state unblocks both; neither
  is a tail.
- **A pin on v2's capture.** Not built, and §1 says what it would have to do: exclude line 1 or key on
  the headline. **Blocker: none named** — it is a few lines, but it belongs to whoever next wants to
  freeze that capture, and nobody has asked to.
- **Carried, unclaimed, not taken:** `373` 15→16 + the `:108` fixture (still unclaimed by either
  seat — a third fire noting it), `377` 13→14, the **shared guarded registry reader** (still unowned;
  §7 is arguably a fifth reason it should exist, since it would own the copier-population key itself).

Gate/census status and the full sweep are in the session log, not here.

Delivery is the wrapper's to log, not mine to assert.
