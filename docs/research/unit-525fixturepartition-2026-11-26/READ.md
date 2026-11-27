# unit-525 — the fixture/live partition over `unit-523`'s indirect 4 and ceiling 6

**Seat:** Daedalus · **Fire:** 2026-11-26 STOP · **Opened** 17:20:47 PST at `defda67c`.

## 0. What this record is, and what it is not

**This is a SOURCE READ, not a drive.** There is no pre-registration, no arm, no known positive, no
captures directory, and **no predictions are graded**. It answers a question Theseus boarded to this
seat in his `unit-524` §5 by reading committed artefacts and live tracked files. Every figure below
is either (a) quoted from a committed capture, with the path and line given, or (b) read off a live
tracked file in this fire, with the path and line given.

It is filed as `READ.md` rather than `RESULTS.md` deliberately: a `RESULTS.md` in this track means a
pre-registered arm was driven once, and nothing was driven here. **Nothing in this file should be
cited as a measured census.** The one classification step it performs is a **declared judgement
applied to ten named members**, and §4 states why no reader can perform it instead.

**The question, verbatim from `unit-524` §5:** *"the fixture/non-fixture partition over the indirect
4 and the ceiling 6 (§3's residual). I have not taken it and it is not blocked on me."* Theseus named
its blocker as "it needs your receiver-resolution reader driven over a fixture/non-fixture partition
that does not exist yet." **That blocker is dissolved rather than cleared:** the receiver-resolution
reader has *already* been driven over these ten, and its capture already prints every member's whole
line and origin lines. Nothing needed re-driving to answer the question — only reading.

## 1. First: Theseus's closure of my `6 of 60`, verified at the member level, not adopted

His `unit-524` says the six new sites all live in `unit-521`'s own `posthoc-two-mechanisms.mjs`, and
that five of them are `INVARIANCE`. **Both halves reproduce under my own read, and I did not re-drive
either reader to get there.**

The file holds **ten** occurrences of `new Set(` —
`grep -on 'new Set(' docs/research/unit-521setsizefalsegreen-2026-11-26/posthoc-two-mechanisms.mjs`
in this fire returns lines `37, 39, 47, 47, 48, 48, 49, 49, 54, 119`. Six of the ten are size-keyed
and four are not, and **the mechanism that removes the four is `stripSource`'s second argument**:

- `arm-setsizefalsegreen.mjs:72` reads `const code = stripSource(raw, true);` — `true` blanks
  **string bodies as well as comments** (`scripts/lib/decl-body.mjs:34` documents that second
  argument; `scripts/lib/characterisation-markers.mjs:84` passes `false` and does not).
- So the second occurrence on `47` and on `48` — each the *string key* `'new Set([]).size === 1'`
  and `'new Set([]).size < 2'`, which a raw-text scanner would key as size-comparisons because the
  comparison is **inside the quotes** — is blanked before the needle search, as is `54`'s
  `const NEEDLE = 'new Set('`.
- `119`'s `new Set(rows.map((r) => r.path))` is real code with no `.size` tail: `NOT-SIZE-KEYED`.

The remaining six, keyed by `unit-521`'s own frozen table at `arm-setsizefalsegreen.mjs:56-58`
(`INVARIANCE = [['===',1],['==',1],['<=',1],['<',2]]`):

| line | comparison | class under the frozen table |
|---|---|---|
| 37 | `.size === 1` | INVARIANCE |
| 39 | `.size === 2` | OTHER-N |
| 47 | `.size === 1` | INVARIANCE |
| 48 | `.size < 2` | INVARIANCE |
| 49 (first) | `.size === 1` | INVARIANCE |
| 49 (second) | `.size < 2` | INVARIANCE |

**5 INVARIANCE + 1 OTHER-N**, which is exactly the `+5` and `+1` his §3 reports. So
**`INVARIANCE 11 → 16` and `OTHER-N 16 → 17` are confirmed at the member level**, by reading the six
lines against the classifier's own literals, rather than by re-driving the reader or by taking his
figure. My published `11 + 4 = 15` stands, and his caution about *why* it stands is correct.

**One correction to my own boarding text, which was wrong and should be struck:** I boarded this as
*"one of the two readings is wrong by 6 and `unit-521`'s is the one the floor-of-11 rests on."*
**Neither reading is wrong by anything.** The premise came from a `PH5` self-inclusion leg that
enumerated the wrong units, and I asserted a disagreement where the measured quantity was population
growth. The task-list entry is ticked with that correction, not with a win.

## 2. The ten members, and where they are quoted from

All ten are already enumerated with whole lines in committed captures of `unit-523`, driven once at
`f247b428`:

- **the narrowed hazard, 4** — `docs/research/unit-523indirectsize-2026-11-26/captures/ARM.out:45-55`
- **the ceiling, 6** — `docs/research/unit-523indirectsize-2026-11-26/captures/POSTHOC.out:53-81`

## 3. The partition: 10 LIVE, 0 FIXTURE

**The criterion, declared before the members were classified and applied uniformly to all ten:**

> A site is a **FIXTURE** if the values its `Set` receives are written as literals *in the same file*
> for the purpose of exhibiting the behaviour of the `.size` comparison itself — the comparison is
> the subject. It is **LIVE** if those values are derived from a subject outside the comparison
> (parsed source, the filesystem, recorded rows, a product call, or a computation over them) and the
> comparison **decides something else**.

This is the criterion Theseus's six satisfy: `new Set(EMPTY).size === 1` versus `< 2` on a literal
`EMPTY` exists to *show* the `=== 1`/`< 2` divergence, and nothing downstream depends on its value.

| # | site | receiver and where its values come from | verdict |
|---|---|---|---|
| 1 | `unit-464kind-2026-11-05/kind-resolve.mjs:186` | `kinds` ← `:181`, `q.counts.filter(...).map(kindOf)` — counts from `quantify(ps)` over parsed source | LIVE |
| 2 | `unit-464kind-2026-11-05/kind-resolve.mjs:260` | same `kinds` binding at `:181`; printed as `CONSTANT`/`NOT CONSTANT` | LIVE |
| 3 | `unit-464order-2026-11-02/grade-order.mjs:281` | `keyedLists` ← `:264`, `allCells` ← `:263` `ORDERS.map((o) => cellsFor(o))`; the literal in play is `CRIT`, the **parameter space** (`ORDERS = perms(CRIT)`, `:256`, 24 orderings), while the compared values are cell member lists derived from the subject. The comparison **is prediction P4's verdict** (`verdict('P4', …)` spans `:278-281`) | LIVE |
| 4 | `scripts/verify-appetite-readings.mjs:174` | `widths` ← `:150`, filled at `:161` with `g.trailWidth` from `geometry(p.cfg)` over the six recorded points; the comparison decides the printed **confounding** conclusion at `:175-176` | LIVE |
| 5 | `unit-464cure3-2026-11-01/grade-the-steal-cures.mjs:292` | `wPost` ← `:290`, `wordsIn('POST')`; the comparison is part of `p4Threshold` | LIVE |
| 6 | `unit-464cure3-2026-11-01/grade-the-steal-cures.mjs:306` | same `wPost` binding at `:290`; `const p4Threshold = …` | LIVE |
| 7 | `unit-503stalelabelwidth-2026-11-22/derive-stale-entry-cost.mjs:75` | `s` ← `:71-72`, a per-label `Set` filled from `rows`; the comparison collapses a one-value set into a scalar in `constants` | LIVE |
| 8 | `scripts/probe-round207-…-not-unique.mts:410` | `picks` ← `:406`, filled at `:408` with `resolveImportEntity(...).entityId` — **a product call**; the comparison is `check('E1', …)` | LIVE |
| 9 | `scripts/probe-round244-…-outside-it.mts:188` | `seen` ← `:185` default parameter, filled at `:187` during a filesystem walk | LIVE |
| 10 | `scripts/probe-round244-…-outside-it.mts:188` (second site, same line) | same | LIVE |

**Answer to Theseus's residual: none of the four hazard sites and none of the six ceiling members is
a fixture.** The fixture contamination he found is, on the present evidence, confined to the
**direct** form at the later SHA — 5 of 16 — and `unit-523`'s indirect figures (`hazard 4`,
`ceiling 10`) are unaffected by the census-purpose choice.

Two things in that table are worth more than the verdict:

- **#4 is in `scripts/`** — standing tooling, not a research instrument. It is a `BLIND` `Set`-size
  invariance claim in the tooling the fleet actually runs, and it is the only one of the ten that is.
- **#8's compared values come from a product call.** `picks` is filled from `resolveImportEntity`, so
  this is the one member of the ten whose `.size === 1` is a claim about **product** behaviour.

Neither observation is a false-green finding and neither is priced here. **Whether #4 or #8 can
actually reach the blank-receiver state is a runtime question the source cannot answer** — the same
blocker `unit-523`'s own ceiling item carries, and it is not dissolved by this read.

## 4. The finding that matters for xian's item 10, and it is a negative one

Calliope boarded the `15`-vs-`0` census-purpose choice as attention-rollup item 10. This read
produces one thing that decision needs:

**No syntactic reader can make the fixture/live split.** The criterion in §3 turns on *what the
comparison is for*, and the two cases are syntactically indistinguishable:

```
new Set(EMPTY).size === 1                      // FIXTURE — the comparison is the subject
new Set(q.counts.filter(…).map(kindOf)).size === 1   // LIVE  — the comparison decides a kind
```

Both are `new Set(<expr>).size === 1`. The receiver-population heuristic I used above narrows the
field but **does not decide it** — member #3 is populated from a literal parameter space and is still
live, and a fixture could trivially be written over a `.map()` of derived values. Any reader keyed on
"is the receiver a literal" would have put #3 in the wrong bucket, which is why §3 quotes the
evidence per member instead of reporting a count from a key.

So the choice in item 10 cannot be implemented as a reader. It has two implementable forms, and they
are different asks:

1. **By declaration** — fixtures carry a marker (a comment pragma, a naming convention, a declared
   fixture block) and censuses honour it. Costs a convention and a pass over existing instruments;
   gives every future census the split for free.
2. **By corpus boundary** — censuses exclude `docs/research/` entirely and run on `scripts/` +
   `packages/` only. Cheap and mechanical, but it also discards every **live** claim in the ten above
   that happens to sit in a unit directory — **6 of the 10**, including both of `unit-464cure3`'s
   grading predicates.

**This is xian's choice and this read does not make it.** What it adds is that option 2 is not the
cheap version of option 1: on these ten members it would throw away six live claims to remove zero
fixtures.

## 5. Against me, and the limits of this record

- **The classification step is a judgement, not a measurement.** I wrote the criterion down before
  classifying and quoted each member's evidence so the judgement is checkable, but a second reader
  could disagree on #3 and #4 and I would not be able to settle it by driving anything.
- **No predictions were registered, so nothing here could have refuted me.** A read cannot be
  wrong in the way a pre-registered arm can be wrong; it can only be wrong quietly. That is the
  cost of answering this inside a bounded STOP fire rather than opening a drive, and it is why §0
  forbids citing this as a census.
- **The 11 → 16 confirmation in §1 is a member-level check of six lines, not a re-drive of
  `unit-521`'s reader over 855 files.** If a *seventh* size-keyed site entered the corpus between
  `148ebe57` and `f247b428` in some file neither Theseus's set-difference nor this read enumerated,
  this check would not see it. His arm took the set difference of the two file lists and read every
  member, which is the stronger instrument; §1 is a confirmation of his result, not an independent
  derivation of it.
- **Still open and NOT taken, with its blocker:** `new Set<T>(` and the default-parameter form in
  `unit-523`'s binding reader — members #8, #9 and #10 above are exactly the three sites that
  blindness accounts for. Blocker: it needs a fresh registration with its own pinned population,
  because changing the reader after `unit-523`'s drive republishes `unit-523`'s census, and frozen
  research files are not to be edited (settled 11/20). **A bounded fire that is also closing the day
  is not where that drive belongs.** It stays on the task list, unblocked, as the next unit.
