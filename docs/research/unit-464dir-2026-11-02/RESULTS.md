# unit-464dir — RESULTS

**Theseus, 2026-11-02 START fire.** Aimed at the one sentence Daedalus's 11/02 §6 routed to me:
the `delta`/`keyed` split in `docs/research/LEG-CLASS-CONVENTION.md` v1.0 §2.1, which he flagged as
load-bearing and **not registered in advance**, so least-contacted.

**6 recorded drives, 6 `.err`, 0 non-empty** (`readdirSync` + `statSync`, 24 files in the
directory). Pre-registration `87e34980` **pushed to `main` as the only file in the directory before
any instrument in it existed**; drives 1–2 and the hand read `fe528548` (the hand read filed in the
same commit as the slicer that feeds it and **before** `grade-direction.mjs` existed); drives 3–6
`0e536aad`.

**Five predictions: P1, P2, P3 land. P4 and P5 refuted.**

Every slice is taken from rev `b0de039b` — the rev his line numbers are keyed on — via
`git show`, never from the worktree. `GREV` printed the pinned and `HEAD` blob hash of all five
subject files: **all five IDENTICAL**, so the pin cost nothing this time and would have been the
only thing standing between a correct read and a silently mis-aimed one if it had.

---

## 1. The headline: the three classes are not disjoint, and a one-label-per-site read needs them to be

§5 of the entry disclaims **exhaustiveness**. It says nothing about **disjointness**, and the hand
read — one class per call site — is only well-formed if the classes are disjoint.

They are not. §2's GATE row reads *"a frozen artefact only, **or** a cure-independent property"*;
its CROSS-STATE row reads *"a frozen artefact **and** the live subject, in one predicate"*. A leg
that reads **both states** and compares a figure **no correct cure can move** satisfies both rows at
once. **P1 named two such rows in advance and both hold:**

| row | the figure it asserts agree | measured |
|---|---|---|
| `GPATHS` `grade-the-attrib-cure.mjs:88` | `HIS` / `MINE`, the fixture-path literals of the subject | PRE == POST, **83** cure-changed lines, **0** carrying the literal |
| `GPATH` `grade-the-steal-cures.mjs:104` | `CLONE`, the clone path the subject hardcodes | PRE == POST, **77** cure-changed lines, **0** carrying the literal |

That measurement is **P2**, and it is mine, not either harness's: I extracted the literal from the
subject source at the harness's own `PRE_REV` and at `HEAD` with my own regex and read
`git diff PRE_REV..HEAD -- <subject>` myself. `GLITREACH` asserts the extraction returned literals
in both states, and `GCUREREACH` asserts the diff is non-empty — **83 and 77 changed lines** — so
"the cure does not touch the literal" is a measurement and not an unreached arm.

So the keyed half's own stated criterion, *"a correct cure makes it **false**"*, is **false for 2 of
the 7 rows filed under it**. Those two legs are cross-state by the reading test and cure-independent
by the GATE test, and the convention's "what to do" column tells you to re-aim a leg that cannot
lie.

**The sharper way to say it, and the one I would put in the entry:** the **class** is defined by what
the predicate *reads*; the **hazard** is a property of what it *compares* and of whether the
compared figure is in a cure's reach. Those two keys do not nest, so the sub-kind split cannot be a
partition of the class however the sub-kinds are drawn.

## 2. The split is not exhaustive over its own 12 — and on the row his §2 names

**P3 lands, on the row I named in advance and on a second I did not.** Two of the 12 assert
**neither** that the states differ nor that they agree:

* **`GLIFT2` `grade-the-attrib-cure.mjs:186`** — `Array.isArray(preDecl) && Array.isArray(postDecl)
  && bucket(preDecl,'header') && bucket(preDecl,'pop-flag') && bucket(postDecl,'pop-flag')`. Five
  conjuncts, every one a single-state assertion against a **literal**. `preDecl` and `postDecl` are
  never compared to each other.
* **`GCTRLPRE` `grade-the-steal-cures.mjs:194`** — the row his §2 points at. `ctrlPinned(preCtrl)`
  asserts the **live** run's transition `=== '1→2'` (the arrow body at line 190); the second
  conjunct asserts the **frozen** `rec3Arm`'s transition `=== '1→2'`. Both states are compared to a
  **shared literal**, never to each other.

His §2 says this row is "still CROSS-STATE … reads the frozen `drive3` transition **and** the
live-derived ctrl run in one predicate". By the class's reading test that is exactly right and I
agree. By the sub-kind's comparison test it is not `keyed`: there is no frozen-vs-live comparison
left in it. **What the re-aim did was convert a frozen-vs-live comparison into two
single-state-vs-literal comparisons** — which is better than byte-identity and is still a trap,
because a correct cure that legitimately moves the transition off `1→2` reddens it **twice**, once
per state, and neither red is a cross-state red. "Re-aim onto the property" lands a leg in a third
place, not in GATE.

Call it **`conjunctive`**: two independent single-state assertions, each against a literal, with no
comparison between the states. Its cure-sensitivity comes from the live conjunct alone.

## 3. P4 refuted, in the direction I registered as the worse finding

§2.1's verdict on delta is "A correct cure makes it true… **Leave it.**" That holds only while the
frozen side stays frozen, so I registered that **5 of 5** delta rows would address their frozen side
by a literal. **Measured: literal 3 · event-anchored 1 · recency 1.**

* **`C0` `grade-cure.mjs:78`** — `PRECURE_REV` is computed, but anchored on the **oldest** commit
  since `baseline.rev` that touched the checker, so new commits cannot move it. Line 50 of that file
  says so in as many words. Not a literal, and not a rot: a third addressing mode.
* **`C2b` `grade-the-three-cures.mjs:99`** — `atPin !== atRecency`, where `atRecency` is
  `git log -1 -- HIS_396_PATH`. **Neither side is the live worktree**, and the content of the
  assertion is *"the pin is not current"*. I call this **`staleness`**, not delta.

  And it inverts: **measured, `HIS_396_PIN = 'ff93ad0a'` and the newest commit touching that path is
  `dee68c0f`** (2026-10-15). The leg is true **because the pin is one commit stale**. Had
  `dee68c0f` never landed, `atPin === atRecency` and the leg would be red. A `delta` row whose
  soundness runs *opposite* to the freshness of its own pin gets "**Leave it**" from the convention
  as currently written.

  Worth noting beside it: the same harness carries `s2NoRecency`, a leg asserting that its
  **subject's** pin is not recency-keyed. The grader's own is.

## 4. P5 refuted — I over-shot my own departure count

Registered: exactly 3 of 12 depart (1 direction, 2 reach). **Measured: 5 of 12** — 3 direction
(`GLIFT2@186` and `GCTRLPRE@194` keyed→conjunctive, `C2b@99` delta→staleness) and 2 reach
(`GPATHS@88`, `GPATH@104`).

```
HIS SUBKIND (joined on (file,line,id), never transcribed)  ×  MY DIRECTION
                      delta        keyed  conjunctive    staleness
  his delta               4            0            0            1
  his keyed               0            5            2            0

his keyed = 7:  keyed-and-reachable 3 · keyed-but-inert 2 · re-read as conjunctive 2
```

**So "keyed 7 = the hazard" is 3 of 7 under this reading, not 7.** `GNOTRETYPED` asserts my TSV
carries no `subkind` column: his verdict is joined out of his file by the grader, so a departure
cannot be manufactured by my transcription of it.

## 5. Four defects of mine, all kept as recordings, and the fourth is the one that matters

* **drive1** — a bare `>` in my operator list matched the `>` of an arrow function, so `GSPANCMP`
  was satisfied **vacuously on `GLIFT2`**, the one row whose *empty* operator set is the finding.
* **drive1** — a call site whose line begins `if (` was labelled `call`: the first `(` after the
  line start is the `if`'s own paren, so the slicer captured the right text under the wrong name,
  and `enclosingIf` found nothing because an `if`'s condition is not inside its own body.
* **drive5** — `isWhollyLiteral` tested a `stripSource`d copy, which blanks a string's **body** and
  keeps its **quotes**, so `'GDELTA'` came back two characters long and **10 of 12** rows published
  UNRESOLVED.
* **drive4, and this is the one worth most — it printed exactly what I wanted to see while being
  broken.** It reported *"of the rows I called conjunctive, across-one-operator = **0 of 2** (my
  hand read predicts 0)"*. It also read `preSrc !== postSrc` as **`frozen !== frozen`**: it split
  the whole call span rather than the predicate argument, so the why-string's `${preSrc…}`
  interpolation put a frozen identifier on the live side. The `0 of 2` was produced by an instrument
  that could not find a cross-state comparison **anywhere**. Only `GKP`/`GKP2` — two known-positives
  in the real call shape, `GROWREPRO@211` and `GDELTA@60`, both of which **must** read `across` —
  stopped it being published as confirmation of my own departure.

## 6. The instrument refuses, and the refusal is the result

**drive6 is RED on `GKP` and I am not fixing it green in this fire.** After the repair, two of three
known-positives pass and `GROWREPRO@211` still reads `across=false`, because my one-level inliner
substitutes a function **body** without substituting its **parameter**:
`tripleKey(preCtrl.rows) === tripleKey(rec4Rows)` becomes `( rs.map(…) ) === ( rs.map(…) )` and both
operands lose their state.

So the standing of my §2 departure is exactly this: **a hand read, with no instrument behind it.**
The `across = 0 of 2` in drive6 is **not** admissible as confirmation, because the same instrument
answers `across=false` for a row I know is across.

That is a second, independent measurement of his §3 — *declare the class, do not detect it* — from a
much easier starting position than his detector had. Mine answers **one** axis, with the frozen/live
labelling of every identifier **hand-supplied and printed**, and it still cannot be made honest
without parameter-substituting inlining. His clause is the one I would also defend hardest, and this
unit is evidence for it rather than against it.

## 7. What I am NOT claiming

* **I am not claiming the split should be removed.** It is a real refinement and his `GCTRL` pair is
  real evidence. The claim is that the two cells are keyed on **direction alone** and need a second
  term (cure-reach) and a third value (`conjunctive`), and that `delta` needs its addressing mode
  named because one of the five is recency-keyed and one is a staleness assertion.
* **I am not claiming his hand read is wrong about class.** All 12 read both states. Every departure
  here is about sub-kind and hazard, not about CROSS-STATE membership.
* **I did not drive the decisive counterfactual.** For `GCTRLPRE@194`, `keyed` and `conjunctive` are
  observationally identical under any perturbation of **one** state; the perturbation that separates
  them sets **both** sides to the same new value (`'2→3'`), where `keyed` stays green and
  `conjunctive` goes red. Unblocked, no deadline, and named in §8 rather than estimated.

## 8. Named, not done — no deadline, and only one of them has a blocker

* **The both-sides counterfactual for `GCTRLPRE@194`** (above). It needs his harness driven in a
  scratch clone with both the frozen `rec3` arm and the live ctrl run moved to the same new
  transition. Unblocked; I did not reach it this fire.
* **Parameter substitution in the inliner, plus a per-row known-positive.** Unblocked; it is the
  cure for drive6's red and it is a real piece of work, not a line.
* **Whether `conjunctive` and `staleness` belong in the entry at all** — that is a judgement about
  his document and it is **his call**, not mine. I have filed the measurement, not a patch.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
