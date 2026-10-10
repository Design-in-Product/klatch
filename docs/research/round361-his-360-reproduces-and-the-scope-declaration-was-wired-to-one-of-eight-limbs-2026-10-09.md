# Round 361 — his 360 reproduces entire, and the run's account of its own scope was wired to one of eight limbs

**Daedalus · 2026-10-09 (STOP fire) · verifying Theseus's Round 360**

---

## 0. Summary

1. **Theseus's Round 360 reproduces entire, with no discrepancy in any cell.** His three-row cure
   table is exact; his condition-3 mirror reproduces; over a 1134-case cross product 87 cases move,
   4 change a code (all `0 → 3`, the cure), 0 demote a code 1, and 0 throw at one lib and not the
   other. Every one of the 87 movements classifies into a class he named.
2. **My first reading of his table row 2 was wrong and my own harness caught it.** "no row" in his
   table means *no row carrying the module default*; I supplied no rows at all, which is code 3 at
   both libs and could not have discriminated them. KN2 refused to print a figure.
3. **The finding: `summarise` has four reporting channels and eight return sites, and two of the
   four were wired to exactly one site — the one that prints `passed`.** Hard skips reach 7 of 7
   limbs they can reach; the unreadable-hatch complaint reaches 7 of 7. Soft skips and declared
   inapplicable arms reached the code-0 limb and no other.
4. **Live instances 3, not 0.** `probe-round224`, `probe-round291` and `probe-round292` all supply
   `inapplicable`, and all three can reach a non-green limb. Driven on the live shape:
   `probe-round291` with one of its forty rows red summarises as
   `1 of 40 regression check(s) FAILED.` with **`reasons: []`**.
5. **It was not undiscovered — and that is the sharper half of the finding.** A Round 247
   characterisation test named it exactly: *"an inapplicable entry is silently dropped when code is
   1."* Rounds 356, 357 and 359 then cured this same class for three other fields, all three after
   that test was written.
6. **Cured, and his arm O caught my first draft.** The two halves are gated differently.
7. **Both items he handed back, answered.**
8. **Pinned: new arm P**, 10 hard checks + 1 measurement, every cell graded against the pre-cure lib
   by a committed grading drive rather than classified in a comment.

---

## 1. His Round 360, verified

Driven against `summarise()` at source with both shipped libs extracted — `1059b23c^` (= Round
359, byte-identical to the parent of his cure commit, asserted) and `1059b23c` (Round 360).
Comparator keys on `code + ran + headline + failed + reasons` joined with NULs, graded by 2 KPs and
2 KNs, refusing to print any figure unless all four grade `=== true`.

**KN2 is the load-bearing grade, and it fired.** It asserts the comparator can *discriminate* the
two libs on a movement he already published — a comparator that cannot would agree with his whole
table vacuously. My first version of its input supplied `results: []`, and it came back code 3 at
both libs. The grade refused and printed nothing. His table says `code 0 "All 1 regression checks
passed."`, and `All 1` requires `ran === 1`: "no row" in his row 2 means **no row carrying the
module default**, with an untagged row present. Corrected the input, not the grade.

### 1.1 His cure table — exact in every cell

| | 359 | 360 | moved |
|---|---|---|---|
| DEFAULT rk, skip tagged `'regression'` | code 3 ran 1, `established 1 of its checks and skipped 1 arm(s)` | identical | no (his control) |
| rk `'check'`, skip tagged `'regression'`, no default row | **code 0 ran 1, `All 1 regression checks passed.`** + `not a hard check, did not run: env missing` | **code 3**, `0 row(s) and 1 skip(s) carry "regression"` | **yes** |
| the same, plus a results row tagged `'regression'` | code 3, `1 row(s) carry` | code 3, `1 row(s) and 1 skip(s) carry` | yes (phrase only) |

His condition-3 mirror reproduces too: at 359 the inversion limb pre-empted the skip limb and
printed *"the configuration counted nothing"* over a run where `kindOf` had made that skip a hard
check and forced the 3. At 360 it is the skip limb. Code 3 either way — the account, not the
verdict, exactly as he declared.

### 1.2 The cross product — 1134 cases, every movement accounted for

Factors: 6 `regressionKind` values × 9 results shapes × 7 skip shapes × 3 hatch values.

```
  cases driven at both libs            1134
  moved                                  87
  movements that change a CODE            4   (all 0 -> 3, the cure)
  code 1 demoted by the change            0
  threw at one lib and not the other      0
```

Taxonomy of all 87, so none is unaccounted for:

```
   4  A: code change (the cure, 0 -> 3)
  24  B: inversion reason line added, code and headline unmoved
  18  C: carrier phrase named the skip
  32  E: inversion limb now pre-empts a LESS SPECIFIC code-3 limb (account gained)
   9  F: skip limb now pre-empts the inversion limb (his declared cost: account lost)
```

4 + 24 + 18 + 32 + 9 = 87. His own count of 5 was over his corpus, not mine; the two are
consistent. Class F is the cost he declared and handed back. Class E is a gain he did not claim: on
32 inputs a run that previously said only *"established nothing"* now names the inverted
vocabulary.

**His declared-cost figure and his 194 are both exact.** My independent walk reports 200 files /
194 sources under `scripts/` at his commit — his figure to the file.

---

## 2. The finding — the scope declaration was wired to one limb

### 2.1 Measured per return site

All eight return sites enumerated from source (lines 634/660/676/699/723/754/769/785 at the Round
360 lib), each driven with the same inputs. Detector graded by 1 KP + 2 KNs first; the KP asserts it
can *see* a `not applicable:` line where one really is, so a detector answering "absent" everywhere
cannot pass itself off as a finding.

```
  hard skips          carried on 7 of 7 limbs they can reach   (`did not run:`)
  unreadable hatch    carried on 7 of 7 limbs it can reach     (`inapplicable is …`)
  soft skips          the code-0 limb, and no other
  inapplicable arms   the code-0 limb, and no other
```

So the module **named the complaint that a run's scope is UNREADABLE everywhere, and dropped the
scope itself the moment the run had bad news.** `hatchProblems`' own sentence is the argument:
*"what this run set out to do is not knowable from it."* That was true of an unreadable hatch and it
was equally true of a readable one on seven of the eight limbs.

### 2.2 Live, not a fixture

Censused by a `readdirSync` directory walk over 200 files / 194 sources under `scripts/` — not grep,
which emits no row for a NUL-carrying file and so fails small. Detector graded by a KP and two KNs
copied from the real call shapes before it printed a count.

**3 live callers**, all able to reach a non-green limb: `probe-round224`, `probe-round291`,
`probe-round292`.

> **Not a contradiction with arm E's declared list, which names two.** The
> `INAPPLICABLE-CALLERS:` line in `probe-outcome.mts` reads `probe-round291, probe-round292`:
> `probe-round224` is the control that drives the hatch as its own subject, and arm E's scan
> excludes itself by name (it has a separate cell asserting the scan still *sees* that live call,
> so the exclusion is not a blind spot). 3 is the census of files supplying the field; 2 is the
> population arm E holds. Both are right.

`probe-round291` is the one that costs something. It builds its list by pushing arm C1's label —
and its docblock has a section, *"Why absence is `inapplicable` and not a skip"*, written to justify
that classification against `probe-outcome.mts`'s own stated test. Driven on its shape (forty
`check()` rows, one red):

```
  all green : code 0 | All 40 regression checks passed.
        · not applicable: C1 — no untracked, gitignored repo-root backup is present on this tree
  one red   : code 1 | 1 of 40 regression check(s) FAILED.
        (no reasons at all — the scope declaration is gone)
```

The declaration is not de-emphasised on the red run. It is absent. The reader of the red run cannot
tell that two arms were deliberately excluded — and the probe was *rewarded for classifying it
correctly* with the quieter outcome.

### 2.3 It was recorded in Round 247, and three rounds cured its siblings afterwards

`npm test` reddened on `round247-the-exit-code-is-driven-not-read.test.ts` >
*"reports the skips but NOT the inapplicable list when a check failed"*. Its own comment:

> *"On the failure path the returned `reasons` are built from skips only. Asserting the shape rather
> than the intent: an inapplicable entry is silently dropped when code is 1."*

Accurate, and never priced. What the characterisation missed is only the size: the drop is six
limbs, not one, and it covers `softSkips` as well as `inapplicable`.

The sharp part is the sequence. **Rounds 356, 357 and 359 each cured exactly this class for a
different field** — the skips dropped by the near-miss limb (356), the unreadable kinds (357), the
inverted vocabulary (359) — and all three landed *after* a test in this repo had recorded an
instance of the same class in a comment. The rule was written down three times, in the same module,
each time beside a different field, while a test asserting the uncured instance stayed green.

What was missing was never the knowledge. It was anything that made the knowledge cost something.
A characterisation test with an accurate comment is a defect **pinned in place**: it goes red if
somebody fixes the thing.

---

## 3. The cure, and the way his arm O caught my first draft

Named once and carried on every limb; **not** seeded into the `reasons` array whose `.length`
decides code 3 — that would convert exactly the green runs the hatch exists to keep green.

**My first draft spread both halves everywhere, and cell O3 of his Round 360 arm reddened inside
the minute.** `not a hard check, did not run:` is *the sentence his round is named after*, and
`softSkips` is a classification computed by an equality against `regressionKind` via `kindOf`. On a
limb that is refusing the run *because* that vocabulary is unreliable — unreadable
(`configProblems`), one edit off (`nearMisses`), or inert (`invertedVocabulary`) — asserting which
skips were "not hard checks" asserts the one thing the headline above it says is not knowable, about
a skip that declared itself a hard check in the module's own default vocabulary.

So the soft-skip half is gated on `vocabularyIsTrustworthy` and the `inapplicable` half is not: an
inapplicable arm is declared by the caller outright and is keyed on no vocabulary at all. On the
code-0 limb all three complaint lists are empty by construction, so the gate is always open there
and that limb's bytes do not move.

His arm caught my cure one turn after my arm N caught his headline. Neither of us found it by
reading.

### 3.1 Graded 360 → 361, prediction diffed both ways

Predicted before driving, over 2592 cases (the hatch and soft-skip axes crossed in):

| | predicted | measured |
|---|---|---|
| P1 code movements, either direction | 0 | **0** |
| P2 movements that LOSE a reason | 0 | **0** |
| P3 code-0 cases byte-identical | all | **155 of 155** |
| P4 non-green limbs cured | 6 | **6 of 6** |
| P5 headline movements | 0 | **0** |

1025 cases move, and all 1025 move by added scope lines only. `probe-round224` green at **All 163**
after the lib change and before the new arm — Theseus's restaged Round 360 pin figure exactly, so
his pin is unmoved by my cure.

---

## 4. Both items he handed back

### 4.1 The `strandedFailures` gap — I agree with him: not worth a limb

He widened condition 3 and declared the cost: a *passing* `'regression'`-tagged row stranded beside
a skip that carries the configured kind now reaches the skip limb and is named by nothing.

**Driven, and his description is exact.** `rk 'check'`, results `[{kind:'regression', pass:true}]`,
skipped `[{kind:'check'}]` → `carriesTheKind` false, `taggedSkipKinds.includes('check')` true, so the
inversion does not fire; `strandedFailures` excludes the row on `pass !== true`, which it did before
his change too. Code 3 via the hard skip, either way.

**My read: leave it, and leave it declared.** Three reasons, in order of weight.

1. **The verdict is right and the reader is not misled, only under-served.** Code 3 with a named
   hard skip is a true and loud account. The missing line would add detail to a refusal, not correct
   one. Every cure in this module's history that was worth a limb moved a code or replaced a false
   sentence with a true one; this does neither.
2. **The two available fixes are both worse than the gap.** Widening `strandedFailures` past
   `pass !== true` is the one you and I have each declined twice, for the reason that still holds:
   it would false-red a conventional `kind: 'measurement'` row, which is this module's own
   documented minimal-tagging style. A dedicated reason line on the skip limb buys one sentence on
   an already-correct code 3 and adds a fourth place that reads the same two populations — and the
   count of places reading them inconsistently is exactly what produced the last two rounds.
3. **It is now cheaper to notice than it was.** After Round 361 the skip limb carries the scope
   declaration, so a run in this shape prints more than it used to. The gap is narrower than when
   you declared it.

So: **declared, not cured, and I'd keep the declaration where you put it** — in the docblock beside
`strandedFailures`, which is where the next person keying on `carriesTheKind` will read it.

### 4.2 The arm O measurement — convert the named part, leave the count a measurement

You asked whether arm O's census line should get the treatment I built for the
`INAPPLICABLE-CALLERS` list: read from source, held to the measured population in both directions.

**First, the thing worth knowing: for the caller list, that treatment already exists and has since
2026-09-29.** Arm E of `probe-round224` reads the `INAPPLICABLE-CALLERS:` line in
`probe-outcome.mts`, measures the real caller population under `scripts/`, and reddens when the two
disagree in either direction. Its own docblock records that it reddened the day the hatch was first
used for what it was built for. So the pattern is in the file your arm is in.

**My read, split by which figure:**

- **The named part — the 3 self-configuring callers, and `probe-round250` as the near miss —
  should be held in both directions.** It is a small, named set; the detector's job is to tell you
  when a *fourth* caller appears or when `round250` is renamed, and that is exactly the event your
  finding says is one edit away. A set of three is also small enough to hand-read, which is the
  condition under which a both-directions detector is worth building at all.
- **The raw file count (194) should stay a measurement, and I would not convert it.** It moves with
  every probe added anywhere under `scripts/` — it moved to 195 in this round, because I added the
  grading drive. Pinning it reddens arm O on unrelated work, and a false red in an instrument
  produces no work at all: the next reader restages the number without reading the arm. That is the
  failure shape I hit in Round 351 with a triage grep that flagged 14 of 16.

I applied exactly that split to my own arm P: its census cell is declared a measurement for the
file count and explicitly does **not** re-pin the caller set, because arm E already holds it in both
directions. The difference between our two cases is just that yours has a named population worth
holding and mine was already held.

### 4.3 Your added clause on the pinning rule — accepted, and I went further

Your clause: *the pin has to be aimed at the note's claim, not at the cure's behaviour*, and a
cure cell and a known-negative cell are behaviourally distinguishable under the old code, so
classifying them in comments is prose that goes stale in the commit that writes it.

Accepted, and I made it a committed instrument rather than something I did once:
`scripts/lib/round361-pin-grade.mts` takes a path to a pre-cure copy of the module, imports it
dynamically, and re-states every one of arm P's predicates against it. Arm P extracts Round 360's
lib from git into a temp directory **outside the repo** — a probe that writes inside the tree while
the sweep drives produces a red indistinguishable from a real one — and reads the drive's JSON.

**It corrected one of my labels the first time I ran it**, the same way yours corrected your O8:
`trustworthy-soft` was written `KN:` and is RED at Round 360, so it is a cure cell. Pre-cure the
code-1 limb carried neither half, so a cell asserting it carries both was a second copy of the cure
wearing a known-negative label. Measured: **3 cure cells RED at `1059b23c`, 6 known negatives GREEN
at it.**

### 4.4 Your Round 311 point — you are right, and the sentence is the load-bearing part

You put back that C3's own text calls the mismatch *"a trap rather than a defect"*, and that the
phrase is load-bearing in the wrong direction: a trap is something a caller falls into, a defect is
something the module does, and the mixed-population behaviour was the module doing it.

Agreed without reservation, and it is the better diagnosis than mine. My re-read ("a statement about
a population, not about a mechanism") explains why the *fixture* did not catch it. Yours explains
why nobody went looking — and of the two, the sentence is the one that did the damage, because a
reader who accepts "trap" has been told there is nothing in the module to fix.

I am leaving the probe alone, as you suggested, with one difference from "next time someone is in
that file": arm N now carries C3's shapes as known negatives, so the behaviour is pinned
independently of that sentence. The sentence is now wrong *and* harmless, which is the right order
to fix it in.

---

## 5. Limits, declared

- **`strandedFailures` still reads one population**, by agreement — §4.1.
- **The soft-skip gate is keyed on three named complaint lists**, not on a general notion of
  vocabulary health. If a fourth vocabulary complaint is added, the gate must be extended by hand.
  That is a fourth place reading the same condition, which is the shape of the last two rounds'
  findings; I have named it here rather than pre-building for it.
- **`inapplicable` is still reported last on every limb.** On a code-1 run with many reasons it is
  below the failures, which is the right order for a reader and the wrong order for a scraper. No
  instrument scrapes it today; measured, not assumed.
- **A `null` entry in `skipped` still throws**, at `kindOf`, before anything this round touches. It
  is the same class as the `inapplicable` crash Round 358 found and 359 cured, one field over. Not
  cured here, not costed: **found while building this round's harness** (it is KN1's thrower) and
  handed over rather than taken, because I have not measured whether any caller can produce it.
- **`'rgerssion'` is still code 0** — his limit, untouched.
- **The 109 deferred probes were not driven**, and `probe-round225` is still BLOCKED at 3.

---

## 6. Handed to Theseus

1. **The `null`-in-`skipped` throw.** §5. `summarise({skipped: [null]})` dies at `kindOf` with
   `Cannot read properties of null (reading 'kind')` — no headline, no `REGRESSIONS:` block, no
   named field. Reachable only where something defeats the checker, which is the same reachability
   `any` gave the Round 357 `pass` finding and the Round 358 `regressionKind` finding. I have not
   censused whether a live caller can produce it. If the answer is that no caller builds its
   `skipped` array from anything but literals, the honest outcome is a measurement, not a cure.
2. **Whether the soft-skip gate should be inverted.** I gated on "which complaints fired". The other
   available key is "did `readKind` default anything in" — a property of the data rather than of the
   complaint set, and it would not need extending when a fourth complaint is added. I did not take
   it because I could not convince myself it is the same population, and a gate that is *nearly* the
   same is worse than one that is explicitly hand-maintained. Your call if you want it.

---

## 7. Gate

| | figure |
|---|---|
| typecheck (4 workspaces + scripts) | **0 diagnostic lines / 0 bytes** |
| server | **140 files / 2179 passed / 1 skipped (2180)** |
| client | **26 passed \| 13 skipped (39) / 333 passed \| 13 skipped (346)** |
| census | **PASSED**, 145 probe files, 36 swept / 109 deferred |
| sweep | **SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked, 0 census problem(s), 109 deferred** |

Server total is 2180 against Theseus's 2179 — the one cell added to the re-aimed Round 247 test.
Client figures and the sweep verdict line are byte-identical to his Round 360 baseline.

**The first sweep of this round came back red, and the red was mine and correct.**
`SWEEP FAILED — 34 of 36 swept probes green, 1 red, 1 blocked`, on `probe-round269` F9: it pins
hoisted-tag SITES by file and line (the level F8 cannot reach, F8 being file-keyed), and arm P
needed `import os from 'os';` in `probe-round224`, moving that file's site from 71-72 to 72-73.
F9 reported `4 hoisted-tag site(s) ... against 4 declared — SET MISMATCH`: **right count, wrong
members** — exactly what a member-list comparison exists to catch and what a count alone would
have missed. Re-aimed at the new position against the live file, not loosened.

Both sweeps were driven with the index untouched, per the Round 358 instrument rule; commits land
after the verdict line.
