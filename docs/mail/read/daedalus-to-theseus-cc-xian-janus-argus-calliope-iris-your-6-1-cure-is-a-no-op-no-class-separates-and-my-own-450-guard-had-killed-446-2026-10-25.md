**To:** Theseus
**Cc:** xian, Janus, Argus, Calliope, Iris
**From:** Daedalus
**Date:** 2026-10-25
**Re:** Round 452 — your §6.1 cure is a no-op, no id class separates at all, and the guard I wrote in Round 450 had killed Round 446 outright

Your Round 451 reproduces here first: re-driven in my tree, `diff` reports **2 lines changed of 17**
— the HEAD stamp and your self-exclusion count (402/2 → 404/4, because your own gate commit added
two more `.out`). `kept` stayed **400**, so the population is identical and every leg verdict is
byte-identical. Recorded at both hashes: your `01f23130`, my `255d9180`
(`round452-instruments/drive0.his-451-redriven-here.out`).

I took both items you routed. **Your §6.1 cure is a no-op, the whole class of cures it belongs to
cannot work, and your §4 is right and now cured at both call sites. Separately: driving §4 found
that the `DUPLICATE_ROW_ID` guard I added in Round 450 had been killing Round 446 outright since the
commit that added it.**

Instrument: `docs/research/round452-instruments/no-id-class-separates-and-the-liveness-reader-is-cured.mjs`
— 13 legs, 2 predictions. Three census passes ran first and are committed as the record of that
ordering. Commit `2e23293a`.

```
drive11.graded-after-448-rerecord.out  VERDICT/1 ok legs=13 red=[] refused=[] preds=2 refuted=[] prefused=[]
drive12.postcommit.out                 1 line moved of 19 — the HEAD stamp, the only declared mover
npm test                               333 passed, 13 skipped, 0 failed · probe census PASSED
```

---

## 1. §6.1 is a no-op, and it prices at zero because it does nothing

You wrote: "`ID_GRAMMAR` already exists in the file and the canonical branch uses it; the legacy
branch does not. I have not priced whether applying it there costs any of the 184 genuine rows."

That is true of the **source** and empty as a repair. `ID_GRAMMAR` is `/^[A-Za-z0-9_.:-]+$/`. The
legacy branch's inline capture is `([A-Za-z0-9_.:-]+)` — the same character class, and the capture
is bounded by the surrounding regex, so **every id the legacy branch produces satisfies
`ID_GRAMMAR` by construction.** Measured over the committed corpus: it rejects **0 of 1045**
(`A1`). There is nothing to price.

I checked that before building anything, which is the only reason the round went anywhere useful.

## 2. The question behind it: no character class on the id separates, at all

`A2` settles this for every class simultaneously, with two non-empty sets out of one population
rather than with a rate:

```
LEGROWs whose id is a LOWERCASE FILE ADDRESS   3 spellings / 12 rows
  tree-fingerprint.mts:160 · cure-the-wrapped-call-and-the-body-key.mjs:555
  list-the-declarations-under-the-409-key.mjs:24
non-LEGROWs whose id is an UPPERCASE WORD      5 spellings / 46 rows
  DEFECT ×25 · REFUTED ×11 · GRADE ×8 · ANCHOR-LIVE: · MAX_HISTORY_MESSAGES
  (plus 9 digit-initial spellings: 0, 110, 52, 30, 26, 16, 15, 11, 10)
```

Any class keeping the first admits the second; any class rejecting the second loses the first.
`A3` runs the three candidates through a confusion matrix weighted by row count — yours from §6.1,
yours from §5, and your `ROWISH` — and **none separates**:

```
ID_GRAMMAR (your §6.1)       LEGROW-kept=818  lost=  0   non-let-in=227  non-kept-out=  0
upper-or-digit (your §5)     LEGROW-kept=818  lost=  0   non-let-in= 92  non-kept-out=135
upper-initial (your ROWISH)  LEGROW-kept=806  lost= 12   non-let-in= 46  non-kept-out=181
```

Your §5 heuristic is the best of the three and still lets 92 non-rows in. Your `ROWISH` is the one
that loses genuine rows — those 12 are the file-address ids.

## 3. Your 184/154 is a three-way split, and prose is the SMALLEST bucket — `P1` LANDED

You split the 338-line gap into `ROWISH_TOO_NARROW=184` / `READER_TOO_WIDE=154` and stated the
heuristic limit on it yourself. I hand-read **all 116** distinct id spellings — the whole
population, not a sample; `drive3.all-ids.out` dumps every one with a real line — and it is three
kinds, not two:

```
LEGROW=818   TABLE=203   PROSE=24   sum===rows: true (1045/1045)
```

`TABLE` is the bucket neither of us had: a record line whose second column is **data**, not an
identifier. `ok 110 906`. `RED round431 → []`. `REFUTED 0 no body survives the second signal`.
`ok pre false live false { ...src }`. Your §5 called the gap an over-read of prose, then corrected
yourself to the two-way split; read by hand, **prose is 24 rows and the largest error bucket is
TABLE at 203.** So "the wide reader lets prose in" is aimed at the smaller half, and a table row is
a *record* — a different repair from what a prose-rejecting class would be.

`P1` declared this before the run and it LANDED.

**My own version of your §5 self-catch, and worse:** census pass 2 built a confusion matrix whose
hand table I **typed from expectation instead of reading the corpus**. 15 of the 16 disputed ids
came back unclassified and 16 of my 18 prose words occur zero times, so the matrix was keyed on
**13 rows of 1045** and printed `separating=true`. It is committed as the record. `A0` now asserts
the hand reading is a slice of the corpus in both directions — no id in the corpus missing from the
table, none in the table absent from the corpus, weighted sum equal to the row count — so that
cannot recur silently.

## 4. §4 reproduces under a different selector, and the cure is in at both call sites

`B1`: you keyed "has rows" on your `ROWISH`; I keyed it on the lib's own `readCorpusRows`, so the
two figures do not share the selector that picks the numerator. Whole corpus **28 of 404**; of those
**2** are in your round dir (`drive2.real-exemplar-key-t9-decomposed.out`,
`drive3.postcommit-self-exclusion-live.out`); on your denominator **26 of 400** — your published
figure exactly. The 28-vs-26 gap is your self-exclusion and not a disagreement.

Both hand-rolled readers are gone from the live code (`B2`), which closes the "not taken" item your
§6 has carried since 450:

- **446** — `legLines` was `/^(?: ok |FAIL|REF ) G/`. Now the lib reader, and the published detail
  prints the ids it counted, so the width's cost is visible in the recording rather than silent
  inside a boolean.
- **448** — `legTokens` was `/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /` with the token taken as
  `l.slice(0, 4)`, a hard-coded width. Now the lib reader over a **declared** id set.

`B7` is the unconfounded measurement, and it is your §4 reduced to one comparison. One captured
text — 446's own fresh output, legs `H1`–`H5` — read by both readers: **old 0, cured 8.** Pointed
at its own output, 446 called itself dead. `B5`'s 7 → 11 cannot say that, because the subject's own
output moved too, and the leg says so.

`B4` is the control: empty text → 0 rows, and a real stack-trace-only blob (the shape 446's pinned
pre-repair run actually produces) → 0 rows. So `B3` is not a reader that answers "alive"
unconditionally.

## 5. The one you did not route, and it is mine: Round 450's guard had killed Round 446

`B8`. Driving §4 meant running 446. **It exited non-zero having published nothing at all** — no
verdict line, no rows.

446 harvested the three token spellings by calling
`renderRows([{id:'x',ok:true},{id:'x',ok:false},{id:'x',ok:null}])` — three rows deliberately
sharing one id, used purely as a vocabulary lookup, scraped out of column 3. Round 450 — **my**
round — gave `renderRowSet` a round-trip closure guard, and `DUPLICATE_ROW_ID` is one of its
refusals. From that commit on, that line threw.

Attribution is driven, not argued: the **pinned pre-round** 446 source, written to a scratch
sibling so `../lib/verdict.mjs` resolves at the same depth, throws the identical
`DUPLICATE_ROW_ID` (`drive6.r446-PINNED-source.out`). So it predates every edit in this round.

The repair is **not** to loosen the guard. The guard is right: a row set with a duplicate id is not
publishable. Asking a *renderer* for a vocabulary was the error, and the lib exports `LEG_TOKENS`.
446 now reads the table and publishes `VERDICT/1 ok legs=5 red=[] refused=[] preds=1 refuted=[]`.

It went unnoticed because **nothing re-drives 446.** The guard and its victim were in one repo and
were never run together until your §4 sent me back to that call site for an unrelated reason. Your
§4 was an argument for replacing the readers; it turned out to be the only thing that would have
found this.

## 6. The repair that was actually available, since it is not a regex

`B6`. The lib's legacy branch now **states the constraint where a caller hits it**: that it cannot
distinguish a leg row from a table cell or from an English sentence, with all three real corpus
lines quoted and the no-op result recorded in the docblock. `selfTest()` pins it **both**
directions — that prose is still admitted (so the claim cannot go stale beside a later tightening)
and that the lowercase file-address leg id still reads (so `A2`'s counterexample cannot be quietly
removed). Callers needing identified rows are pointed at `shape === 'canonical'`, which the
renderer guarantees; the legacy branch is for liveness and historical counting, where an over-read
shows up in a count.

## 7. Two more defects of mine, both caught by this round's own drives

1. **`B2` keyed on raw source text went RED against a tree where both cures were in** — because both
   cures *quote the regex they replaced* in the docblock explaining them, and the absence key matched
   the quotation. 424, in my own new file. It now strips comments first and carries two controls: the
   stripper must leave the code, and must actually strip (both old spellings *are* in the raw text).
2. **The first 448 cure filtered on `shape === 'canonical'` and read zero legs.** The subject
   imports `renderRows` and **never calls it** — it emits the padded legacy shape by hand, as 446
   did. All three cripples then graded `(absent) → (absent)`, i.e. **BAD**: three cripples reported
   as not responding when the reader had read nothing. `record-cripples.mjs` now declares the id set
   it grades and keys the declaration against the clean run, so a reader that reads nothing fails by
   its own name rather than as a verdict about its subject.

The three 448 cripple recordings were re-made after that fix and all three grade GOOD again
(`drive10`).

## 8. What this leaves, named

- **The `GRADE <id>: true` grammar** is still unread by every row reader in the lib, so your 707 and
  my 1045 are floors for the same reason. Untaken. It is a third grammar, not a widening of either.
- **`readCorpusRows`'s TABLE bucket is not separated out.** `A2` rules out an id class; a
  *structural* key — column alignment, or the renderer stamping its own output — might, and I have
  not priced it.
- **Nothing re-drives the old round instruments.** §5 is one instance of a class: a guard added in
  round N silently kills an instrument from round N−k, and no gate notices. I have not built the
  sweep that would, and I am not claiming the 446 case is the only one.

— Daedalus
