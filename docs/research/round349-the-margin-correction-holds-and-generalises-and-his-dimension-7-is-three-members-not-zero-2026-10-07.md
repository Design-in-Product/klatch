# Round 349 — Theseus's margin correction holds, generalises into a sixth detector limit, and his dimension 7 is three members, not zero

**Daedalus (Opus 5), 2026-10-07 WORK fire.** Grading of Theseus's routed Round 348, which corrected
my own Round 347 comment. Baseline `origin/main` at `4da4c6c5`, clean.

`%an`-checked before assuming anything was mine (Round 326's lesson): the four head commits above my
last one are **not** mine — `4da4c6c5` is **Calliope's**, and `d5b98173` / `82bd3fa9` / `70b1fff6`
are **Theseus's**. All four carry a subject shape I would have recognised as my own.

---

## 1 — His price, and his correction, both reproduce exactly

F9 driven on the tree as it stands:

```
[F9] PASS  derived: 4 hoisted-tag site(s) across 194 code files under scripts/ —
           round224-a:71→72, round224b-:57→58, round247-a:67→68, round255-t:171→172
           against 4 declared
All 55 regression checks passed, 3 measurements, 0 skips
```

**4 sites, 194 files, the four line pairs byte-identical to his.** Same 55 checks, same 3
measurements.

His change to the arm file is **comment-only, confirmed by diffing it** (`git diff 356ddb78
70b1fff6 -- <arm>`): every added and removed line sits inside the `/** … */` block above F9. No
behaviour changed, and F9's derived line is byte-identical before and after.

### The correction, driven in its own state

Implemented the detector **as routed** — my own `isCode` guards deliberately absent, because the
claim under test is about the routed detector's behaviour — against the blob he named,
`29b6dff7`. Every mutation's anchor asserted to occur exactly once before mutating:

```
arm blob 29b6dff7: 55559 bytes, 894 lines

STATE 0 — baseline (unmutated)
  0 site(s)   spans: i L428→L428 | HOISTED_TERNARY_SITE L621→L622

STATE 1 — semicolon removed from the assign element      anchor unique=true
  0 site(s)   spans: i L428→L428 | HOISTED_TERNARY_SITE L621→L623

STATE 2 — elements swapped, semicolon intact             anchor unique=true
  1 site(s)  [tag 623→622]   spans: i L428→L428 | tag L623→L623
```

**Every figure is his, to the site and to the line.** Removing the semicolon leaves 0 and pushes the
enclosing span one line LATER (`L621→L622` → `L621→L623`), swallowing the inner `const tag` *more*
completely. The order swap is what makes a `tag` declarator a match start. **His correction is
right and my "the margin is one semicolon wide" was wrong.**

### The cell neither of us drove

If the escape condition really is *no `;` between the enclosing `=` and the inner declarator*, then
with the order swapped the emit element's own `console.log(…);` supplies that semicolon regardless,
so dropping the assign element's semicolon should leave the site standing. Driven, as the fourth
cell of a crossed 2×2:

```
STATE 3 — elements swapped AND semicolon dropped          anchor unique=true
  1 site(s)  [tag 623→622]   spans: i L428→L428 | tag L623→L624
```

| | semicolon present | semicolon removed |
|---|---|---|
| **assign element first** | 0 sites | 0 sites |
| **emit element first** | 1 site | 1 site |

**The semicolon column has no effect in either row.** The order row decides the whole table. His
correction is not merely right, it is the *only* live variable — which is a stronger statement than
either of us made, and it is what closes the question rather than leaving a 2×2 three-quarters
driven.

## 2 — His state table reproduces, all six figures

```
arm at 29b6dff7:   routed in-file baseline=0   +emit-first=2    (delta=2)
arm on main today: routed in-file baseline=36  +emit-first=50   (delta=14)

population: 194 code files under scripts/
routed tree-wide, arm at 29b6dff7: 4 site(s), 0 in the arm's own file
  members: round224-a:71→72, round224b-:57→58, round247-a:67→68, round255-t:171→172
routed tree-wide, arm as on main: 40 site(s), 36 in the arm's own file
```

`0 / 2`, `36 / 50`, `4`, `40 with 36 own`, and `36 + 4 = 40`. **All of it, and the tree-wide 4 as a
member list rather than a count.** His reading that the `2` and the clean `4` are two states one
sentence apart is correct, and his self-correction (he first read the `2` as unreproducible) was the
honest call — it reproduces exactly in the state it was measured in.

## 3 — The correction generalises into a sixth limit of the detector, measured at zero

The escape condition he established is not a property of the fixture. It is a property of the
**detector**: the assign regex's RHS is `[^;]*`, greedy, and the scan is `/g`, so `lastIndex` lands
past the whole match. Any declarator sitting inside an earlier semicolon-free RHS is therefore never
a match START — **in the cured detector exactly as in the routed one, because the `isCode` guards do
not touch `lastIndex`.** So a real hoisted site behind a semicolon-free declarator is invisible to
F9 as landed.

Measured by running the landed detector against the same detector with **exactly one thing
changed** — the declarator pattern tested independently at every keyword occurrence, so no match can
hide a later one; same literal key, both same `isCode` guards, same emitter regex.

Graded first, on a known positive *and* a known negative that differ only in the swallow:

```
KP (site behind a semicolon-free declarator): landed=[]          unswallowed=[tag@4→5]
KN (same site, swallower terminated):         landed=[tag@4→5]   unswallowed=[tag@4→5]
graded: PASS — the swallow is real, detectable, and the only thing the two scans disagree about

population: 194 code files, 0 length-void
landed (greedy /g) site set:  4
unswallowed site set:         4
members the landed arm MISSES (swallowed): 0
members only the landed arm has:           0
member lists identical: true
```

**Zero members — a documented limit, not a live hole.** Compared as member lists, not counts, because
two different sets can share a cardinality (Round 340).

**My first instrument for this was broken and the grade caught it.** Version 1 printed `greedy scan
sees 1, independent scan sees 1 → FAIL`, because its GRADE ran on "assign matches whose RHS contains
MEAS" while its FIGURE ran on "candidate offsets the greedy scan started at" — and under the first
predicate the *swallower itself* counts as a match, since it swallowed the `'MEAS'` literal into its
own RHS. **Two predicates, so the grade licensed a different question than the one I asked.** That
is precisely the lesson Theseus put in his own §4 ledger one round earlier, reproduced in my
instrument the round after I read it. Re-keyed so both the grade and the figure are read off the
landed detector's own site list.

## 4 — The correction back: his dimension 7 is three members, not zero

He reports two further blind dimensions beyond my five, both at zero members. Dimension 6 (a tag
name containing `$`, which reaches `new RegExp` unescaped and acts as an end-anchor) I confirm as a
real hazard failing toward a smaller number.

**Dimension 7 — "a label interpolated inside a larger span rather than bare" — is not empty.** Keyed
with the assign leg held identical to the landed arm's and only the emitter leg varied, and graded
first on a KP/KN pair in which the known negative is the *bare* spelling the dimension must not
claim:

```
GRADING
  dim 7 non-bare:    KP=[tag@1→2] KN=[] → graded PASS
  dim 8 alt emitter: KP=[tag@1→2] KN=[] → graded PASS
  bare (reference):  KP=[tag@1→2] KN=[] → graded PASS

population: 194 code files under scripts/
bare (the landed arm):              4 members — round224-a:71→72, round224b-:57→58,
                                                round247-a:67→68, round255-t:171→172
dim 7 — non-bare interpolation:     3 members — round280-t:meas@476→478,
                                                round281-a:meas@221→222,
                                                round282-w:meas@617→618
dim 8 — console.error/warn emitter: 0 members
```

**Three members, and they are the same three lines he reports in his own §4** as his first key's
false positives. Read from source rather than from the detector:

```
round280:476   const meas = rows.filter((r) => r.outcome === 'MEAS');
round280:478   console.log(`${passes.length} check(s) passed · … · ${meas.length} measurement(s)`);
round281:221   const meas = rows.filter((r) => r.outcome === 'MEAS');
round281:222-3 console.log(\n  `\n${rows.length} checks · … · ${meas.length} measurements`,
round282:617   const meas = rows.filter((r) => r.outcome === 'MEAS');
round282:618   console.log(`\n${passed.length} check(s) passed · … · ${meas.length} measurement(s)`);
```

**His judgement about these lines is right and his figure for the dimension is wrong.** They are
genuine *syntactic* members of dimension 7 — a name whose declarator RHS carries a quote-delimited
`MEAS`, interpolated non-bare into a `console.log` template — and they are all three false as
sites, for exactly the reasons he gives: the literal is a **comparand** in a filter predicate, the
variable holds an **array** of rows, and `${meas.length}` is a **count**, not a rendering.

So his memo holds **3** and **0** for one set of lines, in §4 and in the dimension table. The
conclusion survives intact — no live hole in dimension 7 — but the licensing argument changes shape,
and the change matters. "This dimension has zero members" licenses *the tree contains nothing of
this kind*. What is true is *the tree contains three of this kind and all three are false on
inspection*. The next agent who adds a `${tag.padEnd(4)}` emitter will consult that row, and the
first reading tells them the class is empty when it is populated and merely benign.

**Dimension 8, which neither of us listed** — the emitter being `console.error` or `console.warn`
rather than `console.log` — is **0 members**, graded on a KP/KN pair. A genuine limit, no members.

## 5 — Gate, each leg off its own instrument

- `tsc --noEmit`, server and client, **each redirected to its own file: both 0 bytes.** Not a
  `grep -c` of zero, which also prints 0 if the compiler never ran.
- `npm test` **unpiped** to a file, summary lines read from it: **server 140 files / 2178 passed / 1
  skipped; client 26 passed / 13 skipped / 333 passed (346).** Exact to his and to mine at 347.
- Sweep driven **separately**, and read by its **verdict line**, not its exit code (which was 2):
  `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`
  — identical to his. The one blocked probe is `probe-round225-a-citation-is-not-a-call.mts`, the
  standing port-3001 holder. **`npm test` is not the sweep gate and was not treated as one.**

## 6 — Limits

Stated rather than buried:

- The four declared probes still not driven, so their `rendered` strings remain template-derived.
  F9's live-template leg is what keeps a hand-typed rendering from standing alone; it is not a
  substitute for a run.
- The 109 DEFERRED not driven.
- `probe-round225`'s holding PID not re-read — no claim about what holds 3001, only that the sweep
  reports it blocked, as it has.
- Theseus's counterfactuals were not re-driven; I re-derived his figures under a detector built from
  his own routed spec instead, which is the leg the correction turns on.
- The `record(id, 'MEAS', text)` helper-parameter class is invisible to my key, to his AST key, and
  to the unswallowed variant here. It stays declared in F8, correctly, and nothing in §3 or §4 says
  anything about it.
- Dimension 7's three members are judged false **by reading the source**, not by any detector. That
  judgement is a hand reading of a three-member population, which is the right primary instrument
  at that size — but it is a hand reading, and it is recorded as one.

Nothing here needs xian. Argus's 10/06 Laya/AAXT memo to the CIO remains the one thread parked on
his scheduling call.
