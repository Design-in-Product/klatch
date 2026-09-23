# Round 259 — the extraction moved nothing, and the contract it broke was one nobody had implemented

**Daedalus, 2026-09-23 (WORK fire).** Probe:
`scripts/probe-round259-the-extraction-moved-nothing-and-closed-the-hole-in-the-file-it-moved-into.mts`
— **17 regression, 2 measurements, 0 skips, exit 0.**

---

## 0 — What this round took, and from whom

Round 257 (mine) left three implementations of *"which bytes of this source are code?"* in the tree
and **declined to extract**, naming it as a decision rather than drift: the interpolation repair had
to land green before a 213-check verifier was re-pointed at a moved module.

Round 258 (Theseus) took that open question and returned the part I could not have guessed — the
**direction**:

1. The obvious target was **wrong**. `maskComments()` was already in `scripts/lib`, so it looked
   like the module to route the others into. His arm C2 shows it is **fooled by the same input**
   that fools his own scanner — `/\bhere(?:'s)\b/i`, a shape live in `verify-filler-constraints.mjs`
   today. Routing into it would have turned three implementations into two with the surviving shared
   one still wrong on the input that motivated the work.
2. `stripSource` — private to `verify-tsx-guard.mjs` — is the only one of the three not fooled.
3. Length-preservation is **load-bearing** and only one of the three had it (his arm A2).

So: `stripSource` moves to `scripts/lib/strip-source.mjs` with its whole Round 129–258 decision log,
`verify-tsx-guard.mjs` imports it, and `maskComments` becomes a two-line delegation.

That part went exactly as his memo said it would. The rest of this document is what the census found
**after** the move, which is the part neither of us predicted.

---

## 1 — The extraction itself: moved, and measured as having moved nothing

An extraction is the refactor with the most convincing kind of green. Every consumer keeps passing —
but they were passing before the move too, so their green is evidence of almost nothing. A branch
quietly changed in transit is only visible to a population that happens to contain it.

So the control is **the pre-move reader itself**, restored from `git show HEAD:` and evaluated from a
`data:` URL:

| | measured |
|---|---|
| **A1** — pre-move vs. lib module, every module under `scripts/`, both readings | **139 modules × 2 = 278 comparisons, 0 differ** |
| **A2** — can that comparison come out *unequal*? | a one-line mutant of the pre-move text **is** caught |
| **F2** — `verify-tsx-guard.mjs` after the move | **PASS, all 213** — same 213, not a smaller number |

A2 exists because a "compared old and new" arm that can only ever come out equal is the commonest
vacuous instrument there is. The slice extent is asserted too (**A0**) — my Round 257 drive had an
extractor anchored on line numbers that my own repair then moved, and a short slice still parses and
still runs.

**The hole is closed, driven in both directions:**

| | pre-move `maskComments` | post-move |
|---|---|---|
| **B1 / B2** — regex body with an apostrophe, then a line comment | **fooled** | **not fooled** |
| **B3** — same fixture, regex line deleted | agrees | agrees |

B1 is the row that matters as much as B2: an arm that only checks the repair cannot tell a fixed
defect from one that was never there.

---

## 2 — The finding: a sentence that was true, above code that never implemented it

**Arm D went red on its first run, at two shipped product files**, and the cause was not in the
extraction at all.

`declarationSite` in `probe-source-constants.mts` carried this comment, written in Round 255:

> *The initialiser text is taken from the ORIGINAL source at the same offset — masking exists to
> decide **where** the declaration is, never to change what it says.*

and, immediately below it, this:

```js
const initStart = m.index + m[0].length - m[1].length;   // the TAIL of the masked match
```

That arithmetic is faithful **only while the masker blanks nothing that has extent**. Round 255's
masker blanked comments only, and a comment cannot sit inside `const X = …` ahead of the `;` — so
the sentence and the code agreed, by luck, for two rounds.

The shared reader blanks **regex-literal bodies**. `INITIALISER` is
`const <name>\s*=\s*([^;\n]+)`, `\s*` is greedy, and against

```js
const FILENAME_PATTERN = /[\w./-]+\.\w{1,10}/;
```

the masked line is `const FILENAME_PATTERN = ` followed by 21 blanks and a `;`. The capture
backtracks to take the **last** blank, so `initStart` lands on the **closing `/`**, and
`readNumericConstant` reported a live product file as saying:

```
read FILENAME_PATTERN as "/", which is not a numeric literal this reader recognises.
```

Two files: `packages/client/src/utils/extractFilename.ts` and
`packages/server/src/db/entity-backfill.ts`.

> **Rule: length-preserving is not structure-preserving.** An offset computed by subtracting a
> masked match's length from the end of the match is relying on the second, and only the first was
> ever promised. Theseus's arm A2 established length-preservation as the load-bearing property of a
> shared masker — this is the *next* property along, and it is the one the arithmetic actually
> needed.

**The direction matters, and I want to be exact about it.** Nothing returned a wrong *number* —
both readers throw "not a numeric", so no caller was misled about a value. What regressed is the
**error message**, which told the reader the source says something it does not say. That is Round
255's own rule about this module, turned on the module: *an error message is part of the interface,
and one that quotes the source is asserting something about what the source says.*

**Repair.** The match is now the **head** only — `const <name> =` — so the offset comes from where
the match *ends* rather than from subtracting a capture's length off it; a head has no backtracking
freedom. Both the offset and the extent of the initialiser are then read off the original.

Driven: **G1** reconstructs the defect (the old arithmetic over the new masked text yields `"/"`),
**G2** confirms the repair quotes the literal the source spells, **G3** confirms the ordinary cases
and a multi-line initialiser still read. **M9** in the mutation drive restores the tail-derived
offset and is caught by its aimed arm.

**After the repair, arm D1 reads 0 flips over 68 product files and 69 constant reads** — so the C2
hole was *latent* in `packages/`, not firing. What it fires on is `scripts/`.

---

## 3 — My own instrument was asserting its conclusion

The first version of arm D2 — the arm whose entire job is to say what the number *means* — contained
this as literal prose:

> *"The honest headline is D1, and this round's is ZERO"*

It was written before the run. **The run it was written for read TWO.** It would have printed the
word ZERO underneath a red D1.

The sentence is now computed from `readFlips` and says something different when the number is
different. This is the same shape as Theseus's Round 258 §3 (a control whose fixture is minted as a
string and passed *as* the source) and my own Round 257 §6 — and it landed in the arm specifically
built to prevent a number being quoted out of context.

> **Rule: a measurement's prose is part of the measurement.** If the sentence explaining a number
> would read the same at a different number, it is not reporting the number — it is reporting what
> you expected the number to be.

A second instrument fault, same fire, same class: arm **G2** first compared against a hand-escaped
expected string and went **red against a correct repair**, because the refusal quotes with
`JSON.stringify` and I counted backslashes wrong. It now JSON-*parses* the quoted run. The
corresponding vitest row derives its expectation from the literal instead of restating it. An
assertion about quoting should not itself be a quoting exercise.

---

## 4 — Blast radius: two probes died loudly, and one was asserting the defect it routed

The extraction broke three things. All three failed in the **loud** direction, which is the only
reason this section is short.

**(a) Two probes slice the scanner out of its old home by declaration name.**
`probe-round257` and `probe-round258` both do `declText(VTG_SRC, 'REGEX_MAY_OPEN_AFTER')`. After the
move both **threw** — `no declaration: const REGEX_MAY_OPEN_AFTER` — rather than measuring something
else. Repointed at `lib/strip-source.mjs`; 257's extractor also needed to admit `export const` and to
strip the `export ` keyword before re-exporting (node refused the duplicate binding outright, again
loud). **257: 9/9. 258: 20/20.**

**(b) Round 258's arm C2 was asserting the defect it routed to me.** As filed it read
`check('C2', "…has the SAME hole", maskFooled, …)` and its detail line ended *"Routed to Daedalus."*
I took the route in the same fire, so the arm reddened **on the repair it asked for**. Leaving it is a
permanent false red; re-baselining the number would erase what it found. The direction is flipped and
the finding kept in full — C1 still asserts his scanner *is* fooled, C3 still asserts `stripSource`
is not, and C2 now says the shared module adopted `stripSource` rather than the reverse.

**(c) Round 258's arm G4 is a pin on a *historical* census, and I lit its fuse.** It compares a live
count against Round 256's published 13 / 10. Adding `probe-round259-…mts` to `scripts/` made it read
**14 / 10**. Nothing about Round 256's figure changed; a file arrived. This is exactly the class my
Round 257 arm E measured — **129 sites across 49 modules that pin a census and redden on an
unrecorded one** — landing on an arm where the fuse is lit by *any later round* rather than by a
defect. The arm's sentence says "over the population Round 256 could see", so the population is now
restricted to that, by round number off the filename convention. It reproduces **13 / 10** exactly.

Both 258 edits are Theseus's to revert; they are flagged in the memo and marked in the file.

---

## 5 — Coverage, and why the module and its test are in one commit

`scripts/lib/strip-source.mjs` is new to `scripts/lib`, and **a new lib module with no test is
invisible to both limbs of the coverage floor**: arm A only fires when a *recorded* module loses
coverage, arm E only fires on coverage that exists and is unrecorded. An uncovered arrival passes
every check while making the ratio worse. The denominator is the one number there that nothing
guards.

So `round259-the-shared-source-reader.test.ts` (**10 tests**) lands in the same commit and
`strip-source.mjs` goes into `COVERED_FLOOR` in the same commit. **`scripts/lib` floor 11 / 13 →
12 / 14.** Two left: `offer-choice.mjs`, `premise-render.mjs`.

The test deliberately does not re-do what the verifier already does (it runs this reader over every
module under `scripts/` on every invocation). It pins the properties *consumers* depend on and that
an edit could break while leaving the verifier green: length and line preservation in both readings;
that the two readings differ **only** inside string bodies and never about where a span ends; and
the three defects the module's history is actually made of — a regex body carrying a quote, a
template nested inside `${…}`, `//` inside a string — plus both error directions of the regex
heuristic.

**Mutation drive re-aimed and re-run: 9 mutations, 9 CAUGHT by their aimed arm.** Four (M1, M4, M5,
M8) had anchored into the scanner that moved and now aim at `strip-source.mjs`; M9 is new and
restores the Round 259 offset defect. Both subjects restored **sha256-identical**, working tree
identical to before the drive. Re-aiming was not housekeeping: an anchor that no longer matches
reports `ANCHOR MISS` and **stops measuring**.

---

## 6 — Typing note, and the alternative that was declined

`strip-source.mjs` stays `.mjs` because `verify-tsx-guard.mjs` must be importable under **plain
node** — a `.mts` could not be. Under `strict`, a `.mts`/`.ts` importing it is TS7016, handled with
the house one-line `@ts-expect-error` pattern (precedent: Round 257's `tsx-required.mjs` import).

A sibling `strip-source.d.mts` was the alternative and was **declined**: `probe-round245`'s census
counts every file under `scripts/lib` as a module, so the declaration would arrive as a *fifteenth*
module needing coverage it cannot have.

---

## 7 — Controls

| control | result |
|---|---|
| `npm test` **into a file, not a pipe** | server **133 files · 2111 passed · 1 skipped**; client **38 · 324 · 13** |
| typecheck (runs first in the chain) | **0 `error TS`**, whole chain exit 0 |
| `verify-tsx-guard.mjs` | **PASS, all 213** |
| `probe-round259` | **17 regression · 2 measurements · 0 skips · exit 0** |
| `probe-round258` (repointed) | **20 / 20** |
| `probe-round257` (repointed) | **9 / 9** |
| `probe-round256` | **16 / 16** |
| `probe-round255` mutations (re-aimed, +M9) | **9 of 9 CAUGHT by aimed arm**, both subjects sha256-identical |
| `probe-round245` coverage floor | **4 / 4**, covered **12 / 14** |
| `probe-round224` / `probe-round225` | **64 / 64**, **21 / 21** |

Server was **132 · 2100 · 1** at Round 257 and at Theseus's Round 258 §7 — **+1 file, +11 tests**,
which is exactly the 10 new rows in `round259-…` plus the 1 added to `round255-…`. Checked against
his figure rather than assumed.

**0 model calls, no server, no port, no database, no corpus.** The probe is read-only: pre-move
readers are evaluated from a `data:` URL and a `.testdata/` copy that it removes, so it cannot dirty
the operator's tree. `packages/` content fingerprint identical across the run.

---

## 8 — Open, and what is routed

**Routed to Theseus:** his Round 256 detector repair is **unblocked** — `scripts/lib/strip-source.mjs`
is importable, which is the dependency his §6 named as the reason he would not take it. Also: two
edits to his Round 258 probe (§4b, §4c above), both marked in the file and his to revert.

**Open, mine:**

- `verify-tsx-guard.mjs` is **still not in `npm test`** and nothing schedules it. Round 257 found a
  control of its own that had been red four days for exactly this reason. This round re-pointed it
  at a moved module and its 213 checks are the only thing that would have caught a bad move —
  unchanged in status, and now carrying more weight than it did.
- Two `scripts/lib` modules still uncovered: `offer-choice.mjs`, `premise-render.mjs`.
- The census-pin class (§4c) is now three instances deep — my 257 arm E measured 129 sites over 49
  modules, and this round lit one by adding a file. Nothing in the fleet distinguishes "pins a
  census that should be stable" from "pins a census any later round will move."
- `index.ts` still hand-captures two variables above `dotenv.config()` — still two, still waiting for
  a third.
