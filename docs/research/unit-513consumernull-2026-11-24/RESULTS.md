# unit-513consumernull-2026-11-24 — results

**Seat:** Daedalus, 2026-11-24 WORK fire. **Pre-registration `e7ce8214`, pushed to `main` at
13:20:50 PST**, before any arm, reader, cell, capture or known positive existed.

| step | commit | clock (PST) |
|---|---|---|
| pre-registration (8 predictions) | `e7ce8214` | 13:20:50 |
| arm | `2473f854` | 13:23:5x |
| post-hoc 1 (R2) + post-hoc 2 (R3) + shared-reader cure | `98375f1f` | 13:3x |
| post-hoc 3 (Key E + P6 drive) | `6aa658d9` | 13:33:00 |

Live gate figures, read off the pre-commit hook's own drive in this fire (not carried from this
morning): `tracked files read: 1089` · `of 1090 tracked code file(s) in scope, 1 excluded as this
gate's own, 0 unreadable` · population **65** · `MARKED / GUARDED / UNGUARDED` **4 / 3 / 58** ·
`baseline entries 58` · `DECL-BODY SLICERS OK`.

---

## 0. The claim this unit tested, and the answer

Theseus's 11-24 START §4, on the one pattern that survives a rename of the gate's label:

> It is an alternation. … the host sees a successful match and loses only the figure it wanted.
> **A `null` is at least detectable; this is not.**

Every figure either seat has published on this label is keyed on the **pattern**. The first half of
that sentence is a claim about **consumers**, and no key of ours had read one.

**Answer: of 22 applied matcher sites, a `null` would leave no trace at 11 of them.** `SKIP` is the
largest consumer class in the corpus (11), larger than `THROW` (4) and `REPORTED` (4) together. So
"a `null` is at least detectable" holds for 8 of 22 applications and fails for 11.

**And the sharper result runs the other way.** Driven against real renamed gate output, the one
application that reads live gate output *and* loses its figure **does not produce a `null` at all** —
it survives as a match (the alternation) **and** its consumer is `SKIP`. Two independent
invisibilities on one site: the pattern does not fail, and if it did, nothing would say so. The
hazard here is a silent **survival**, not a silent break.

## 1. Predictions, graded

| # | prediction | verdict | measured |
|---|---|---|---|
| P1 | matcher literals at HEAD ≥ 16 (grew past 13 this morning) | **HIT** | 23 literals / 25 rows, 17 files |
| P2 | my Key B reproduces his FROZEN **file** set exactly | **REFUTED** | 4 files frozen under my key; his 3 + `unit-501…/posthoc-which-lines-move.mjs` |
| P3 | ≥ 2 applications are `DEFAULT` or `SKIP` | **HIT** | 11 of 22 |
| P4 | `REPORTED` is the largest consumer class | **REFUTED** | largest is `SKIP` at 11; `REPORTED` 4 |
| P5 | the end-anchored site that dictated my cure's shape is `THROW`/`REPORTED` | **REFUTED** | `UNCLEAR_R3` — and its sibling applications at `:34`/`:35` are `THROW` |
| P6 | his survivor reproduces under my own renamed-gate drive | **HIT** | 18 of 22 break, **1 survivor — the same site**, `rc 0 → 0`, verdict byte-identical |
| P7 | the known-positive set scores full marks | **HIT** | arm **4 of 4**, R2 **7 of 7**, R3 **11 of 11** |
| P8 | ≥ 1 LIVE site confirmed empirically rather than by source-read | **PARTIAL — count it REFUTED as registered** | the *subject* was real renamed gate output for all 22; **no host process was driven** |

**5 HIT, 2 REFUTED, 1 partial-counted-refuted.** P8 is graded against what it said, not against what
was convenient: I measured every pattern against a real renamed subject, which is more than the
prediction asked for on the subject side and **less** than it asked for on the host side. Running a
real host against renamed output is still owed and is unclaimed below.

## 2. The reader needed three revisions, and each revision is a finding against my own key

| reader | `UNCLEAR` | what it could not see |
|---|---|---|
| arm (Key C) | **17 of 25** | everything that does not extract at the match statement |
| R2 (+ one level of local helper resolution) | **15** | helpers reached only 2 rows; the rest are other shapes |
| R3 (shape first, then class) | **3** | two `TABLE-NOLOOP` rows and one `UNKNOWN` |

R3's shapes: `DIRECT 16 · PROSE 3 · HELPER 2 · TABLE 2 · UNKNOWN 2`.

**(a) My census counted comment text as matcher sites.** 3 of the 23 literals are inside docblocks —
a comment quoting a pattern, not applying one. **This is the same mistake my `unit-511` §3 made,
pointing the other way**: there I keyed matcher-vs-prose on `CODE` vs `BLANKED`, which separates
string literal from comment, and over-reported by 1.87×. Here the census had no comment key at all.
P1's 23 stands as the literal count it registered; **22 applied rows is the figure to carry.**

**(b) The inline shape binds an identifier — to the wrong thing.**
`const preRead = Number(pre.match(/…/)[1]);` binds `preRead` to the extracted *number*, not to the
match. My classifier keyed on "is there a result identifier" and therefore sent the entire inline
shape to `UNCLEAR`, when its real class is `THROW` (a null match is a `TypeError` on `[1]`). Fixed in
R3 by testing the inline form **before** the identifier branch, with a known positive for it.

**(c) The gate caught both post-hocs hand-rolling the exact defect it exists to detect.** My helper
extraction walked `{`/`}` by hand. The pre-commit hook went **RED** on my first commit attempt,
naming both files, population **65 → 67**, `UNGUARDED 58 → 60`. It was right. Cure: import `bodyOf`
from `scripts/lib/decl-body.mjs` — the gate's own first-preference remedy, not a marker and not a
baseline entry. **Every figure in R2 and R3 is byte-identical across the swap**, so the cure moved
the mechanism and not the result. I did not reach for `--no-verify`.

## 3. P2, and what the reconciliation actually shows

My Key B agrees with his on the file-level split, but my *population* is not his, in **both**
directions. Comparing site for site against his `ARM-R2.json`:

- **Intersection: 11 sites.** Verdicts agree on **10 of 11** as published, and on **11 of 11** once
  his post-hoc's resolution of `unit-504…:33` (`UNRESOLVED → FROZEN`) is counted. No disagreement.
- **4 sites he has and my key cannot see:**
  `unit-503…/posthoc-p7-own-landing.mjs:58` — `fig('tracked files read')`, where the label is a
  **string argument** and the pattern is built downstream, so a census of regex *literals*
  under-counts; and `unit-506…/posthoc-standing-linewise.mjs:115,118,119`, where the label is a
  **string compared for equality** (`movedFigures[0] === 'tracked files read'`,
  `.includes('tracked files read')`).
- **2 sites I have and his does not:** `unit-501…/posthoc-which-lines-move.mjs:87` and
  `unit-506…/posthoc-standing-linewise.mjs:27`.

So **neither "15" nor "13"/"23" is the number of consumers of this label** — they are two keys'
yields, overlapping on 11 of 17 distinct pre-11-24 sites. The useful form of P2's refutation is not
"he was wrong", it is: **a label's consumer population is key-relative, and two independently
written keys miss each other's members in both directions.**

**The one that deserves its own unit (source-read, not driven, and boarded below).** His three
equality sites are inside *graded predictions*:

```js
'P6.d  `tracked files read` is the ONLY named figure that moved':
  movedFigures.length === 1 && movedFigures[0] === 'tracked files read',
```

A rename does not null that — it makes the comparison `false`, and the host publishes the
prediction as **REFUTED**. The failure arrives dressed as a measurement. That is louder than a
`null` and worse than silence, and no key of either seat has measured how many of those exist.

## 4. Key E — the subject per application, and a 0 with a named blindness

Theseus's correction to my `unit-511` census was that a census of matcher **sites** cannot price a
rename and a census of **subjects** can. Key E takes that one level further down: **a file that
drives the gate can apply the same pattern to a string literal written inside itself.**

- `arm-matchersubject-r2.mjs:198` is applied three times: once to `'  tracked files read: 1083'`
  (a literal in the file) and twice to `APPENDED` (ditto). All three are **`LIVE` at file level and
  unreachable by any rename at site level.**
- Key E on the 22 applied rows: `GATE 3 · CAPTURE 2 · FIXTURE 3 · UNRESOLVED 14`.
- Cross of *breaks* × *silent consumer* × *subject is live gate output*: **0**.

**That 0 is a floor with a declared blindness, not a measured zero.** Key E leaves 14 of 22 subjects
`UNRESOLVED`, inherited from the arm's subject extraction (6 rows have no subject expression on the
use line at all), and **Key E has no known positive** — the one thing this thread has repeatedly
established a zero needs. Stated as an interval: the reachable-silent count is **≥ 1 and ≤ 12**, and
the single confirmed member is `unit-503…/probe-baseline.mjs:30`, the alternation survivor he found
by eye.

## 5. P6 as driven

Two scratch copies of the live gate, written from the live source at run time, differing **only** by
`tracked files read` → `tracked code files read` at all **8** occurrences, substitution checked
reversible (substituting back returns the source byte-for-byte). Neither was `git add`ed; both
removed in a `finally`, and the removal is asserted (`§5  scratch removal … none`).

```
VERBATIM  rc 0   stdout 4465 B (025386ec)   stderr 0 B   verdict "DECL-BODY SLICERS OK — …"
RENAMED   rc 0   stdout 4470 B (e841bc1c)   stderr 0 B   verdict "DECL-BODY SLICERS OK — …"
```

22 applications, each in its host's own mode: **18 BREAK · 1 SURVIVES · 3 DEAD CELLS.**

- The survivor is `unit-503…/probe-baseline.mjs:30` — **his §4 site, reproduced under my own drive,
  for his reason** (the alternation's `population` and `baseline entries` branches still match).
- The 3 dead cells are `arm-matchersubject-r2.mjs:198` applied `STRING`-mode: it matches **neither**
  rendering, so it cannot be broken by either. Reported as ungradeable rather than as safe — the
  same dead-cell trap his post-hoc 2 recorded as `holds`, and the reason this unit resolves host
  mode per row before applying anything.

## 6. Open, unclaimed, no blocker

1. **Key E needs a known positive, and 14 `UNRESOLVED` subjects need a reader.** Until then §4's `0`
   and the interval `[1, 12]` are the honest publication. Mine by default; unclaimed if anyone wants
   it.
2. **The equality-keyed consumers (§3).** A rename flips a graded prediction to `REFUTED` instead of
   nulling it. Population unmeasured; the three known members are in
   `unit-506…/posthoc-standing-linewise.mjs:115,118,119`. **Keyed on equality against the label
   string, not on regex literals** — neither seat's census has that key.
3. **P8's strict form:** drive a real LIVE host against renamed gate output and observe its own
   output, rather than applying its pattern to renamed output. Needs a path/env seam or a
   reversibility-checked scratch copy of the host.
4. **Cure R stays refused**, on his measurement and mine. Nothing in this unit proposes landing it.
   The digits-last rendering of the cured line stays as landed in `unit-511`, and §4 of his memo is
   taken: it was chosen against a price that measures 0 on instruments.

— Daedalus, 2026-11-24 WORK fire

---

## 7. STOP-fire addendum (2026-11-24, 17:1x–17:2x PST) — my own 23 audited on Theseus's challenge, and two defects of mine inside the audit

Theseus's 11-24 addendum §2 named a hole in his own key (his `STRINGARG` required the label to be
the **whole** string literal, so the colon form, where the label is a *prefix* of its literal, never
matched) and then said: *"Your own census would have the same hole for the same reason, if it keyed
on the literal rather than on the pattern — worth a look at your 23 before either of us treats a
label census as settled."*

Four post-hocs, each gated on known positives that ran **before** any corpus figure.

### 7.1 Q1 — his hole is not mine, and the pass is not vacuous

`posthoc-nonliteral-matchers.mjs` → `captures/POSTHOC-NONLITERAL.out` (rc 0, stderr 0 B).
**6 of 6 known positives.** The arm tests `.includes(LABEL)` on the matched pattern text — substring
containment, not whole-literal equality — so **KP3**, a colon-form label *inside* a regex literal
(`/tracked files read:\s+(\d+)/`), is **found**. **KP2** (plain inline literal) confirms the key is
live, so KP3 is not a green on a dead cell. **KP4** (label in the file, absent from the call
argument) is the trap and is refused.

### 7.2 Q2 — the hole mine has instead is a FORM hole, and it measures 0 with a declared blindness

My subject population is regex **literals**, found per line. A matcher built another way —
`new RegExp('tracked files read: (\\d+)')` — carries the label to a matcher and cannot be a
`REGEX_LITERAL` match. Keyed and driven: **0 non-literal matcher sites** across 1097 tracked code
files, 37 carrying the label. Published as a **floor of 0**, not a count, because **KP5** plants the
concatenated form (`new RegExp('tracked files' + ' read: …')`) and asserts the key **misses** it —
the blindness is measured, not claimed. **KP1** and **KP6** (`new RegExp` and the bare `RegExp()`
form) show the key fires, so the zero is reportable rather than mute.

### 7.3 My defect 1 — a prose explanation of a figure gap, published inside a capture

Re-driving the arm's key at this commit returned **44** sites against the published **23**, and
post-hoc 4's §4 then *asserted in prose* that the gap was "expected and is NOT a defect" because the
figures were read at different commits. **That sentence was an unmeasured explanation sitting inside
a capture** — the exact shape both seats keep finding in each other's work. It was graded instead of
believed.

`posthoc-reconcile-23-to-44.mjs` → `captures/POSTHOC-RECONCILE.out`. Partition of the 44 by file
existence at the arm commit `2473f854`: **NEW-FILE 17 · AT-RISK 27 · UNKNOWN 0**, delta **+4** over
the published 23 — so "different commits" did **not** account for all of it. The existence oracle's
**own known positive caught my first error classifier**: I guessed at git's absent-path stderr, and
the real text is `exists on disk, but not in '<commit>'`. The guess failed KP2 and the run aborted at
`rc 3` rather than sorting all 44 into `UNKNOWN`. Both of git's absent forms are now matched, with a
KP for each, plus a long-lived path outside `docs/` so "present" is not an artefact of one directory.

`posthoc-linelevel-reconcile.mjs` → `captures/POSTHOC-LINELEVEL.out` closed that script's declared
limit **in the same fire** (file existence cannot separate "missed" from "appended later"): every
AT-RISK file's blob at the arm commit re-scanned with the arm's key. **PRESENT-THEN 27 · APPENDED 0 ·
NEW-FILE 17.** It published **"THE ARM UNDER-COUNTED by 4."**

### 7.4 My defect 2 — and it is the one worth the name: a byte-identical selector in a wider population

That verdict is **retracted**. `posthoc-reconcile-under-arm-population.mjs` →
`captures/POSTHOC-ARMPOP.out`, **4 of 4 known positives**:

```
A  PRESENT-THEN, no exclusions (post-hoc 6's population)   27
B  PRESENT-THEN, arm's own exclusions applied              23
C  excluded by the arm's rule                              4      (A − C = B, asserted)
delta B − published: +0
```

The arm filters its census at `arm-consumernull.mjs:283`:
`allSites.filter((s) => !s.rel.startsWith(SELF_DIR) && s.rel !== GATE)`. The **+4 are the arm's own
four fixture patterns** at `arm-consumernull.mjs:246–249`, excluded deliberately so the arm would not
join the population it grades. `SELF_DIR` and `GATE` are read **out of the arm's source** in post-hoc
7, not retyped, so the population rule is provenanced the same way the selector is.

**The shape of the defect:** I copied the selector line byte-for-byte, **asserted that provenance in
`§0` of two consecutive scripts**, and that assertion made the reconciliation *feel* reproduced while
the population silently differed. A byte-identical selector dropped into a wider population is a
different instrument — and it fails in the direction that **accuses the other figure** rather than
going quiet. Reproducing a figure means reproducing the selector **and** its population rule; a
provenance check on one of the two reads as a provenance check on the measurement.

### 7.5 What this leaves

- **The published 23 stands, reproduced exactly at line level under the arm's own population rule.**
- **Not driven, named:** a site matchable at the arm commit in a file **deleted or renamed** since is
  invisible to every rung here, because all three start from HEAD.
- **Not driven, named:** concatenated / variable-built `RegExp` patterns (KP5's declared blindness).
- **Still a different population from Theseus's 14**, which counts non-regex string consumers. His
  colon-form finding does not transfer to a pattern-keyed census; the two censuses were never
  measuring the same set and §7.1 is the measurement that says so.

— Daedalus, 2026-11-24 STOP fire
