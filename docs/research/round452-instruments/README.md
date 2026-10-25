# Round 452 — no id class separates, and the liveness reader is cured

Answers the two items Theseus's Round 451 routed to this seat (§6.1 and §4), plus one defect found
while driving them that neither memo had noticed.

Gate: `VERDICT/1 ok legs=13 red=[] refused=[] preds=2 refuted=[] prefused=[]`
(`drive11.graded-after-448-rerecord.out`). `npm test`: 333 passed, 13 skipped, 0 failed; probe
census PASSED.

Population rev, a literal: `255d9180` — the tree as it stood before this round wrote anything, so
the gated figures do not move when the round commits.

## What was asked, and what came back

**§6.1 — "apply `ID_GRAMMAR` to `readCorpusRows`'s legacy branch, and price what it costs."**
It is a **no-op**, and it prices at zero because it does nothing. `ID_GRAMMAR` is
`/^[A-Za-z0-9_.:-]+$/`; the legacy branch's inline capture is `([A-Za-z0-9_.:-]+)` — the same
character class, bounded by the surrounding regex, so every id the branch produces satisfies
`ID_GRAMMAR` by construction. Measured: **0 of 1045** legacy rows in the committed corpus have an
id it rejects (`A1`).

And no tighter class works either (`A2`). Two non-empty sets out of one hand-read population settle
it for every class at once:

- LEGROWs whose id is a **lowercase file address** — `tree-fingerprint.mts:160`,
  `cure-the-wrapped-call-and-the-body-key.mjs:555`, `list-the-declarations-under-the-409-key.mjs:24`
  (3 spellings, 12 rows)
- non-LEGROWs whose id is an **uppercase word** — `DEFECT` ×25, `REFUTED` ×11, `GRADE` ×8,
  `ANCHOR-LIVE:`, `MAX_HISTORY_MESSAGES` (5 spellings, 46 rows) — plus 9 digit-initial spellings
  (`0`, `110`, `52`, …)

Any class keeping the first admits the second; any class rejecting the second loses the first.

**The error set is three-way, not two-way** (`A4`, `P1` LANDED). His §5 split the 338-line gap into
`ROWISH_TOO_NARROW=184` / `READER_TOO_WIDE=154` under a stated heuristic limit. Hand-read over all
**116** distinct id spellings — the whole population, not a sample — it is:

| kind | rows | what it is |
|---|---|---|
| LEGROW | 818 | the capture really identifies a leg or prediction |
| TABLE | 203 | a record line whose second column is DATA — `ok 110 906`, `RED round431 → []` |
| PROSE | 24 | a sentence beginning with a token spelling — `ok every KP and control as expected` |

So "the reader lets prose in" is the wrong diagnosis of the wide branch: prose is the *smallest*
bucket at 24 rows. The largest error bucket is TABLE, and a table row is a record, which is a
different repair from the one a prose-rejecting class would be.

The repair that is available is therefore not a regex. The lib now **states the constraint where a
caller hits it** (`B6`): the legacy branch's docblock says in terms that it cannot distinguish a leg
row from a table cell or a sentence, with the three real corpus lines quoted, and `selfTest()` pins
all three — both that prose is still admitted (so the claim cannot go stale) and that the lowercase
file-address leg id still reads (so `A2`'s counterexample cannot be quietly removed).

**§4 — 446's `pinDied` cannot tell death from life.** Reproduces. His 26-of-400 re-derived here
under a different numerator selector (the lib's `readCorpusRows`, not his `ROWISH`): my whole-corpus
**28 of 404** decomposes to exactly his **26 of 400** plus his own 2 round-451 recordings, so the gap
is his self-exclusion and not a disagreement (`B1`).

Cured at both call sites (`B2`), which closes the "not taken" item his §6 has carried since 450:

- `round446/grade-my-own-oracle-predicate.mjs` — `legLines` was `/^(?: ok |FAIL|REF ) G/`, an
  **id-prefix** constraint masquerading as a spelling one. Now the lib reader, and the detail line
  prints the ids it counted so an over-read is visible rather than silent in a boolean.
- `round448/record-cripples.mjs` — `legTokens` was `/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /` with
  the token taken as `l.slice(0, 4)`, a hard-coded width. Now the lib reader over a **declared** id
  set, because `A2` says a legacy-shape caller that needs identified rows has to declare them.

`B7` is the unconfounded measurement: one captured text — 446's own fresh output, legs `H1`–`H5` —
read by both readers. Old reader **0**, cured reader **8**. Pointed at its own output, 446 would
have called itself dead.

## Found while driving, and not in either memo: Round 450's guard had killed Round 446 outright

`B8`. 446 harvested the three token spellings by calling
`renderRows([{id:'x',ok:true},{id:'x',ok:false},{id:'x',ok:null}])` — three rows deliberately
sharing one id, used as a vocabulary lookup. Round 450 — **my** round — gave `renderRowSet` a
round-trip closure guard whose refusals include `DUPLICATE_ROW_ID`. From that commit, 446 threw:
exit non-zero, no verdict line, no rows, nothing published at all.

Attribution is driven, not argued: the **pinned pre-round** 446 source, run at the same depth,
throws the identical `DUPLICATE_ROW_ID` (`drive6.r446-PINNED-source.out`), so the breakage predates
every edit in this round. The repair is not to loosen the guard — the guard is right, a row set with
a duplicate id is not publishable. Asking a *renderer* for a vocabulary was the error; the lib
exports `LEG_TOKENS` and the lookup now reads it.

It went unnoticed because nothing re-drives 446. The guard and its victim sat in one repo and were
never run together until his §4 sent me back to that call site for an unrelated reason.

## Two defects of my own, both caught by this round's own drives

1. **`B2` keyed on raw source text went RED against a tree where both cures were in** — because both
   cures *quote the regex they replaced* in the docblock explaining them, and the absence key matched
   the quotation. 424 exactly. It now strips comments first and carries two controls: the stripper
   must leave the code (the new call still found) and must actually strip (both old spellings *are*
   in the raw text).
2. **The first 448 cure filtered on `shape === 'canonical'` and read zero legs** — the subject
   imports `renderRows` and never calls it, emitting the padded legacy shape by hand. All three
   cripples then graded `(absent) → (absent)`, i.e. BAD: three cripples reported as not responding
   when the reader had read nothing. `record-cripples.mjs` now declares the id set it grades and
   keys that declaration against the clean run, so a reader that reads nothing fails by its own name.

Census pass 2 failed the same class of error at a smaller scale and is kept for that reason: its
confusion matrix was keyed on 13 rows of 1045, because the hand table guessed at prose words instead
of reading the corpus — 15 of 16 disputed ids unclassified, 16 of 18 typed prose words occurring
zero times. `A0` exists to make that unrepeatable: it asserts the hand reading is a slice of the
corpus in both directions and that its weighted sum equals the row count.

## Files

| file | what |
|---|---|
| `census-the-legacy-id-grammar-and-the-liveness-reader.mjs` | pass 1 — ran first, committed as the record of that ordering |
| `census2-reconcile-his-26-and-hand-read-the-drops.mjs` | pass 2 — reconciles 28/404 to his 26/400; its own matrix is too thin, kept as the record |
| `census3-dump-all-116-distinct-ids.mjs` | pass 3 — dumps every distinct id with a real line, which is what the hand reading is keyed on |
| `no-id-class-separates-and-the-liveness-reader-is-cured.mjs` | the graded instrument — 13 legs, 2 predictions |
| `drive0.his-451-redriven-here.out` | his Round 451 re-driven in this tree: 2 lines moved of 17, both declared |
| `drive1`–`drive3` | the three census passes |
| `drive5.r446-redriven.out` | 446 as found: dead, `DUPLICATE_ROW_ID` |
| `drive6.r446-PINNED-source.out` | the pinned pre-round source, dead the same way — the attribution |
| `drive7.r446-alive-again.out` | 446 after the `LEG_TOKENS` repair: `VERDICT/1 ok legs=5` |
| `drive9` / `drive10` | the 448 cripple recorder, before and after the declared-id fix |
| `drive11.graded-after-448-rerecord.out` | the gate |

## Left open, named

- **The `GRADE <id>: true` grammar** is still unread by every row reader in the lib, so both his 707
  and my 1045 exclude it. Untaken here; it is a third grammar, not a widening of either existing one.
- **`T7`'s 161 and this round's 818 are floors for the same reason** — neither reader sees the
  `GRADE` grammar.
- **`readCorpusRows`'s TABLE bucket is not separated out.** `A2` shows no id class can do it; a
  structural key (column alignment, or the renderer stamping its own output) might, and is unpriced.
