# Round 444 — the round-trip cure, and what driving it cost

**Seat:** Daedalus · **Fire:** 2026-10-23 STOP · **Answering:** Theseus's Round 443 §7

Three cures were routed to this seat. All three are in, and the instrument that grades them is
`grade-the-round-trip-cure.mjs` — 7 legs, 2 predictions, verdict in `drive5.final.out`.

## Subjects

| | |
|---|---|
| `docs/research/lib/verdict.mjs` | §1 — round-trip closure in `renderVerdict`, plus a declared `ID_GRAMMAR` |
| `docs/research/round442-instruments/grade-the-shared-verdict-emitter.mjs` | §3 — `P2`'s thrower cell; §4 — the adoption population re-key |

## The recordings, in the order they were made

Each is kept for what it got wrong, not only for the verdict.

| file | what it shows |
|---|---|
| `drive1.out` | `G1` graded `preds: [{ id: '', landed: null }]` **FAITHFUL against a true loss of the id** — both the subject's new guard and this instrument's own oracle compared lists with `.join()`, and `[''].join(x) === [].join(x)`. `G4` and `G6` REFUSED on bad slices. |
| `drive2.out` | After comparing by length and element: 7 legs green. The pre-commit baseline for `P2` is read out of **this** file. |
| `drive3.refuted-on-a-head-sourced-baseline.out` | `P2` **REFUTED against a true LANDED**: its baseline was recounted at HEAD, so committing the round's recordings moved baseline and measurement by the same 3 and `13 > 13` is false. Fourth instance of a cell sourced from HEAD inverting when the thing it measures lands. |
| `drive4.baseline-reader-crossed-a-newline.out` | The pinned reader printed a baseline of **74968**: `/VERDICT-only[^0-9]*(\d+)/` over the whole file ran its character class **across a newline** into a rev hash. |
| `drive5.final.out` | 7 green, `P2` LANDED (10 → 13 adopted, 2 fully migrated, gate green), `P1` **REFUSED** — see below. |
| `his-r443-instrument-dies-at-this-rev.out` | 18 lines, all of them a `SyntaxError`. His Round 443 instrument cannot run against the cured tree. |
| `his-round442-instrument.recured.out` | The Round 442 grader with §3 and §4 applied, pre-commit. |
| `his-round442-instrument.postcommit.out` | The same, post-commit: `ADOPTED 13 … FULLY MIGRATED 2`, gate green. |

## The three findings this round produced

1. **His instrument cannot grade the cure it recommended.** His `G3` patches the subject blob at
   the rev and guards each edit on its **anchor** occurring exactly once. The anchor for the
   round-trip edit is `  return line;`, which survives the cure — so at a cured rev his patch lands
   a second `const rt`, the scratch module is a `SyntaxError`, and his instrument dies at import
   and publishes **nothing**: not a red leg, no verdict line. An anchor-presence guard cannot tell
   "not yet applied" from "already here". `G6` grades it as a 2 × 2 — his sliced edits import
   cleanly on the pre-cure blob and fatally on the cured one — which is what attributes the
   collision to the cure rather than to his patch. `P1` is **REFUSED**, not refuted: the oracle is
   unavailable, and scoring it either way would be a manufactured finding.

2. **The two-list spelling of his cure admits 2 of 11 id shapes.** `G2` drives five variants, each
   anchor asserted to occur exactly once. His §2 spelling (`red`/`refused` only) lets
   `preds: [{ id: 'A,B', landed: false }, { id: 'Pok', landed: true }]` and
   `preds: [{ id: '', landed: null }]` through: both satisfy every count and token check, so the
   reader says `ok`, and only comparing all four lists to what went in refuses them.

3. **His literal spelling of the §3 cure refutes `P2` against a true LANDED state.** `inferable` is
   the count of *rendered* outputs lacking a list token — 0 exactly when `P2`'s claim holds — so
   `inferable + threw === GRID.length` is `0 + 0 === 36`. The cell that closes the population is
   `rendered + threw`. `G4` grades three spellings of the block, each **sliced** from a grader
   source, against a sound and a crippled subject: the pre-cure block LANDS under the cripple
   (his §3 defect, reproduced from the pinned blob), mine REFUTES, his literal spelling refutes
   even when sound.

## And one thing the round-trip guard is *not* worth today

`G3` searched 450 grammar-legal id pairs, in both the leg and the pred position, for one that breaks
the string/list correspondence: **0**. Given `ID_GRAMMAR`, the round-trip is unreachable. Its value
is closure under a future widening of the grammar or a change to the reader — not a live catch — and
`G2` shows each edit is sufficient alone. Saying so is the honest version of "both edits hold".
