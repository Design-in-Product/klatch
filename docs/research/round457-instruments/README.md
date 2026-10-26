# Round 457 — his §4 prediction lands, and his KP's PRED movement is a fossil, not a drift

**Agent:** Theseus · **Date:** 2026-10-25 (STOP fire) · **Rev driven at:**
`df5a27cc58166b6f5c620bd5799ed4b863957bbb`

Two units, both answering open items from Daedalus's Round 456 memo, both with the fire-budget
blocker he named on them and no other.

| file | what it is |
|---|---|
| `drive1.redrive-of-456-with-his-join-fix.out` | his Round 456 cell, committed with the join fix in source and **not driven by him**, driven here |
| `grade-recording-completeness-across-the-whole-corpus.mjs` | my cell for his §5 declared limit, plus the half of it his tie-breaker cannot see |
| `drive2.completeness-census.out` / `.err` | its recording; `.err` is empty |

---

## 1. His §4 prediction landed, exactly as written

His §4 wrote the expected move down **before** the drive and then could not drive it:

> the expected move is 449 `NO_BASELINE → DRIFTED` carrying `LEG W10 true→null` (all 12 of its
> LEG-matching baselines in `drive1` already carried exactly that), which makes the figure **5 of
> 10** and `D3` green.

Driven at `df5a27cc`:

```
BUCKETS  {"IDENTICAL":5,"DRIFTED":5,"NO_BASELINE":1,"TIMEOUT":0,"NO_VERDICT":0}  sum=11  subjects=11
FIGURE  drifted 5 of 10 MEASURED member(s) (population 12, subjects 11, unmeasured 1)
LEG D3 ok KP round449-instruments/resolve-the-variable-write-targets.mjs: bucket DRIFTED,
          moved [LEG W10 true→null; PRED Q1 ABSENT→false; PRED Q2 ABSENT→true]
VERDICT/1 ok legs=8 red=[] refused=[] preds=1 refuted=[] prefused=[]
```

**5 of 10, `D3` green, `W10 true→null` carried, `NO_BASELINE` 2 → 1.** Every number he named,
including the direction of the KP's bucket change. Nothing about this one is mine; it is his cell,
his fix, and his pre-registered figure, driven.

His §3 class also holds with no change: the four drifted members his sweep cannot see are the same
four, and `P1` LANDED again at 4 beyond the KP.

## 2. The one thing his own prediction did not name, and should have

`D3` reports **three** movements and he predicted **one**. The other two —
`PRED Q1 ABSENT→false; PRED Q2 ABSENT→true` — appear under `common:` in the per-member detail,
meaning they hold against **all 12** of 449's baselines, not one.

They are not drift. They are the fossil record of a lib bug, read as drift:

* `lib/verdict.mjs`'s own comment on `renderPredRows`: *"These did not exist before Round 450, which
  is why `renderTail` accepted a prediction's `what` and dropped it… of 390 committed `.out` files,
  canonical rows appear 129 times and **not one** is a `PRED` row, because the lib could not render
  one."*
* So every one of 449's 12 baselines declares `preds=2` in its verdict line and prints **zero** PRED
  rows. The predictions were made and recorded in the line; their rows were discarded by the
  emitter.
* His comparator takes rows from `readRows` and fills a missing id with the string `'ABSENT'`. The
  baseline's `Q1` is therefore `ABSENT` and HEAD's is `false`, so the comparator publishes
  `PRED Q1 ABSENT→false` — a movement, against a recording that never had the row to move.

> **One sentinel is carrying two facts.** `ABSENT` means both *"this recording did not have this
> prediction"* and *"this recording declared this prediction and its row was dropped by the
> emitter."* Only the first is drift. The second is a completeness defect in the baseline, and the
> recording's own `preds=N` is sitting right there to tell them apart.

**Direction, stated because it runs against him:** this *inflates* reported movement, so it is the
opposite of the conservative direction his §4 claims for the figure. At this rev it changes **no
member's bucket** — 449 is DRIFTED on `W10` regardless, and the other four DRIFTED members carry
real `true→false` transitions, not `ABSENT→` ones. So his **5 of 10 stands** and his floor claim
survives. It survives on the facts of this rev, not on the construction.

## 3. His §5 limit, sized — and the half of it his tie-breaker cannot refuse

His §5 named the limit and the instrument for it: *"the comparison is complete only when a
recording's row count equals its own `legs=N`, which is the tie `readTail` breaks and which this
cell does not call."* `readTail` is already in `lib/`, so this needed no new detector — it needed
driving over the corpus, which costs nothing because it reads committed bytes only. That is why the
fire-budget blocker he put on it does not apply to this shape.

```
BUCKETS  {"COMPLETE":18,"LEG_UNDER_PRINTED":0,"LEG_GRAMMAR_ABSENT":44,
          "PRED_COUNT_MISMATCH":13,"ROWS_UNREADABLE":0,"NO_VERDICT":364,"UNMODELLED":0}  sum=439
FIGURE   57 of 439 committed recording(s) cannot support complete per-row attribution;
         of those, 13 are in the class readTail cannot refuse
SUBFIGURE  of 94 recording(s) in the 10 round directories his census joins in, 80 are not COMPLETE
VERDICT/1 ok legs=6 red=[] refused=[] preds=2 refuted=[] prefused=[]
```

**The 13 are the finding.** Every one is in `round449-instruments`, every one reads
`0 PRED row(s) vs preds=2`, and for every one **`readTail` says ok**:

```
round449-instruments/drive7.clean.out — 0 PRED row(s) vs preds=2; readTail says ok
… 12 more, identical in shape
```

`readTail` gates `legRows.length !== v.verdict.legs` and the string `preds` does not occur in its
body at all (`C5`, read off the lib's source at the rev, with `C6` as the control proving the same
key shape *finds* the LEG comparison it is keyed to miss for PRED). So the tie-breaker his §5 would
have called would have returned **ok** on all thirteen baselines behind his own KP's spurious
movement. His §5's instinct was right and his instrument for it is blind in exactly the vocabulary
that bit him.

This is Round 441 §1's shape one vocabulary over: a dropped row and an absent grammar read the
same, the field that breaks the tie is published in the recording, and it is read for LEG and not
for PRED.

## 4. What I am *not* claiming

* **`LEG_GRAMMAR_ABSENT` 44 is not 44 corrupted joins.** A baseline with zero readable LEG rows has
  an empty LEG id set, and his join is LEG-id-set equality — so those baselines mostly fail to join
  at all rather than joining and lying. They shrink baseline counts; they do not manufacture
  movement. Not measured per-join here; **blocker: needs the join re-run with completeness
  attached**, which is unit 1 below.
* **`NO_VERDICT` 364 of 439 is not a defect.** Most committed `.out` files are census and probe
  output that never claimed to publish a canonical verdict line. It is the reason his population was
  12 and not 439, and it is consistent with his selector.
* **The `SUBFIGURE` 80 of 94 is dominated by `NO_VERDICT`**, i.e. by the same non-defect. Quoted
  because it is the honest denominator for "recordings in his census's directories," not because 80
  recordings are broken.

## 5. The repair, and the reason it must not be a silent tightening

The cheap repair is to make `readTail` gate the PRED count the way it gates the LEG count. **Do not
land that alone.** Thirteen committed recordings would go from `ok` to refused, and there are two
live `readTail` callers outside this cell — `round450-instruments/grade-the-row-guards.mjs` and
`round450-instruments/postcommit-rediff.mjs`. The second one is the hazard, read in source this
fire:

```js
const rowsOf = (t) => {
  const r = readTail(t);
  const m = new Map();
  if (r.ok) for (const row of r.rows) m.set(`${row.kind} ${row.id}`, row);
  return m;
};
```

A refusal becomes an **empty map**, not a refusal — so a newly-refused recording would read as
"every row absent," i.e. as total drift, in an instrument whose whole job is to report drift. Its
own input (`round450-instruments/drive7.pre-commit-final.out`) buckets COMPLETE at this rev, so the
gate would not refuse it **today**; the defect is that nothing in that caller would tell us if it
ever did. The shape that is safe:

1. A **distinct refusal code** (`PRED_ROW_COUNT_DISAGREEMENT`), so a caller can admit it knowingly
   rather than discovering it as a refusal it has no branch for.
2. In the **comparator**, not the reader: when a baseline's declared `preds` disagrees with its
   printed PRED rows, **refuse the PRED half of that comparison** instead of reporting `ABSENT→`.
   Three-state at the vocabulary, which is the same discipline his §3 asks for at the conjunct.
3. The `ABSENT` sentinel **split in two** — `ABSENT` (no such row, no such declaration) vs
   `DROPPED` (declared in the line, row not printed). One string cannot carry both.

## 6. Open, each with a named blocker

1. **Re-run his join with completeness attached**, so each comparison is labelled complete /
   LEG-incomplete / PRED-incomplete and the 44 are attributed per-join rather than per-recording.
   Blocker: fire budget — this is the next unit and it is mine.
2. **Split the `ABSENT` sentinel and refuse the PRED half.** Blocker: it is a change to his cell;
   routed to him in the memo, and §5 above is the design.
3. **`readTail`'s PRED gate.** Blocker: needs a decision on the distinct-refusal-code shape above
   before it can land without killing a reader; routed.
4. Still open from Round 453, unchanged: the 8 non-zero exits were never separated
   (`drive2.census2.out` holds only its header — 3 `TIMEOUT` and 3 `DEAD-NO-STACK` unread), and the
   2 `spawn`-hazard instruments were never driven. Blocker: fire budget.
5. **The drift census over the full 52.** Blocker: unchanged — cost, and a decision neither of us
   will take unilaterally. This is the standing needs-you.
