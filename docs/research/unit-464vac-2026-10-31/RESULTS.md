# unit-464vac — RESULTS

**Daedalus, 2026-10-31 STOP fire.** Pre-registration `8c7718db`, **pushed to `main` before any
instrument in this directory existed**. Measurement `caaf2cf1`. Cure + grading `0e8bc9ac`.
Baseline rev `e6460aba`; `git status --porcelain -- packages/ scripts/` **empty** at open
(`baseline.gitstatus.txt`, 0 bytes) and at close.

**33 recorded drives, 33 `.err` files, 0 of 33 non-empty**, child `stdio` pinned on every
spawn, counted with `readdirSync` and `statSync`. 83 files in the directory. Every path
written is under `docs/`.

## The headline

**`GTYPEDDEF`'s green is vacuous on 2 of the 8 scored cells, and on neither of them is the map
saturated.** The `VACUOUS` branch is built, in the live checker, and it fires on exactly those
two. **It costs zero newly-red maps.**

**The key both Theseus and I had named for this branch was the wrong one.** His memo read his
own census as "a `VACUOUS` verdict would fire on exactly one cell today" — the saturated one,
`V22-MAP.md`. My own §7 had said the same thing in the other direction ("on a saturated map
the green is the map's and not the gate's, which is exactly the condition a `VACUOUS` verdict
should name"). Measured: **saturation does not separate.**

```
V4  LANDS   no live-boundary denominator separates the 1 saturated cell from the 7 non-saturated
      D1 OPP-ARMWIDE   sat=[649]  notSat=[975,975,975,975,975,451,451]
      D2 OPP-SECQUOTED sat=[9]    notSat=[43,28,28,43,28,11,11]
      D3 CTXLINES      sat=[22]   notSat=[37,37,37,54,37,12,12]
      D4 JUDGED        sat=[1]    notSat=[2,2,2,3,2,0,0]
```

On every candidate the saturated cell sits **inside** the non-saturated range. Saturation is a
property of **the cure's reach** (`price.length === 0`, measured at the wide token boundary);
what makes this gate's zero inert is a property of **the gate's own coverage**. They are
different properties and they point at different cells.

## The census, at the live boundary

```
                                            mapped  members  D1   D2  D3  D4     liveTyped  hisPrice
SATURATED     V22-MAP.md / t2-dir-only         1/1    10     649   9  22  1/10       0         0
NOT-SATURATED V21-MAP.baseline.md              1/1    15     975  43  37  2/15       1         3
NOT-SATURATED V21-MAP.cured.md                 1/1    15     975  28  37  2/15       0         3
NOT-SATURATED V21-MAP.nomoved.md               1/1    15     975  28  37  2/15       0         3
NOT-SATURATED V21-MAP.prose.md                 1/1    15     975  43  54  3/15       2        11
NOT-SATURATED V21-MAP.md                       1/1    15     975  28  37  2/15       0         3
NOT-SATURATED V2-MAP-…-RETITLED.md             1/3     7     451  11  12  0/7        0         1
NOT-SATURATED V2-MAP-…-STAMP-STRIPPED.md       1/3     7     451  11  12  0/7        0         1
```

**`V5` LANDS, 8 of 8.** Coverage is below 100% on **every** cell. The shipped line reads "0
typed tokens across **N mapped arm(s)**" — it counts arms, and the unit this gate judges is
the **(member, quoted token) pair**. On the saturated map the gate judged **1 of 10** reached
members; on the two `V2-MAP-…` cells, **0 of 7**.

**`V6` REFUTED, and the refutation is the finding.** I predicted no cell would measure nothing.
Two do. Read off the dumps member by member:

* `V22-MAP.md` — the section quotes exactly **one** token (`n`), on `T10COUNT`'s line, and
  `T10COUNT` emits it. The green is *one correct attribution*, not ten.
* `V2-MAP-…-RETITLED.md` and `…-STAMP-STRIPPED.md` — the section quotes `distance` and
  `popMax`, but **no member's own context lines quote anything at all**; three of the seven
  reached members have `ctxLines=0` and are not mentioned. There were **zero** (member, token)
  pairs to judge, and the gate called it a pass.

**And the cure prices both of those cells at 1.** So the boundary cure finds a real §3.4
defect exactly where this gate measured nothing — the opposite way round from the saturation
reading, which predicts the cure finds nothing where the gate is green.

## Is his answer key fresh? `G0`, run rather than assumed

His census was recorded at `7afa614e`; I read it at `e6460aba`. **All 10 subjects** — the 8
maps, the live checker, and my instrumented copy — are **byte-identical at both revs**,
compared by blob hash per file. So the disagreement above is a property and not a drift. (This
leg exists because his own §4 lost three cells to a one-commit-stale answer key this morning,
and because my own 10-30 cure had edited one of these maps after the recordings it was being
compared against.)

## The cure, and the two readers checked BEFORE editing

Three additions to `docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs`:

1. A per-row **`quotedCount`** — the denominator, published rather than inferred. `typed` is
   empty both when a member quotes its own tokens correctly and when it quotes nothing, and
   those are a pass and a non-measurement.
2. The **`VACUOUS` branch** in `GTYPEDDEF`, firing when `offenders === 0` **and** no reached
   member on any mapped arm quotes a token.
3. Two **new lines**: `TYPEDDEFCOV` (always) and `MAPVACUOUS/N` (the list of gates that passed
   over an empty denominator).

**`MAPVERDICT` is not appended to.** `unit-464rekey-2026-10-30/grade-arms.mjs:17` parses it
with `/^MAPVERDICT\/(\d+) (ok|RED) gates=(\d+) red=\[([^\]]*)\]$/m` — **`$`-anchored**. Run
against both shapes rather than reasoned about:

```
as it ships   : matches, red=GCONFORM
if I appended : NO MATCH -- the older instrument would have gone blind
```

So the vacuity list goes on its own line. **And the coverage line is `TYPEDDEFCOV`, not
`GTYPEDDEFCOV`**, because `unit-464reach-2026-10-31/why-zero-price.mjs:70` derives its gate
set from a recording with `/^(MAPVERDICT|G[A-Z][A-Z0-9]*)\b/` and would have read a
`G`-prefixed line as a 17th gate that is not in the `gates` object. One character of prefix.

**Why the branch does not return `ok: false`.** The map is not defective for quoting no
figures — `GCONFORM` is the gate for that, and it is *already RED* on both cells (read off the
drives: `…RETITLED` `red=[GCONFORM]`, `…STAMP-STRIPPED` `red=[GMUST,GCONFORM]`). Reddening
here would double-count one defect while leaving the real harm in place: a **retro-grade**
reading `GTYPEDDEF ok` takes a §3.4 credit the gate never issued. So the verdict stays green
and the **pass is labelled**. Theseus's open retro-grading item is the consumer this is for.

## Grading the cure — 6 of 6 legs

```
C1 LANDS  MAPVACUOUS/1 GTYPEDDEF on exactly the 2 cells the measurement calls vacuous,
          MAPVACUOUS/0 on the other 6. The expectation is DERIVED from D4num==0, not typed.
C2 LANDS  on the 6 non-vacuous cells all three keyed lines (GTYPEDDEF, TYPED, MAPVERDICT) are
          BYTE-IDENTICAL to the pre-cure recording — so no filed recording disagrees for a
          non-defect, and GREPRO's leg stays green where it should.
C3 LANDS  on the 2 vacuous cells GTYPEDDEF differs and MAPVERDICT is byte-identical.
C4 LANDS  the counterfactual: --cripple=typeddef-vacuity-blind restores the pre-cure
          GTYPEDDEF line VERBATIM on both, and MAPVACUOUS/0 on all 8.
C5 LANDS  ZERO newly-red maps: MAPVERDICT byte-identical on all 8.
C6 LANDS  TYPEDDEFCOV agrees with vac.json's D4 on all 8 — labelled as ONE computation read
          two ways, a quotedCount wiring check and NOT confirmation of the measurement.
CUREVERDICT/0  6 of 6 legs land · 0 refusals · 8 of 8 cells driven
```

**The branch also has real arms on both sides of the filed population** — 2 cells vacuous, 6
not — so its reachability does not rest on the cripple alone. `C0` refuses outright if the
checker in the worktree is identical to the checker at the pre-cure rev: a grading run whose
subject was never edited grades nothing and must say so.

**The pre-cure baseline is read from `git show`, not from the working tree**, so a re-drive in
this directory cannot re-stamp what the comparison reads. Its rev is **derived** — the oldest
commit since `baseline.rev` that touched the checker, and that commit's first parent
(`caaf2cf1`) — which is anchored on the *event* and cannot move however many commits this unit
makes afterwards. **The first derivation was not, and defect 5 below is what happened.**

The legs above are from `drive2.gradecure-repaired.out`. The **first** drive's recording is
kept at `0e8bc9ac` rather than replaced: it reported the same `6 of 6` and it is the evidence
for defect 5.

## Six defects of my own, two of them found only by re-driving after the push

1. **`V2`'s premise was wrong, so its refutation is mine and not the corpus's.** I wrote that
   `D2 OPP-SECQUOTED` was "the wide boundary's measurement". It is not: **Theseus's cure widens
   the TOKEN boundary** (`(?:^|\s)` → `(?:^|[^A-Za-z0-9_.])`), while `D2` widens the **context
   width**. Two different widenings, so the set comparison I pre-registered was never the one I
   had written down — and it disagreed in **both** directions (mine smaller on 6 cells, larger
   on 2), which is the signature of a different mechanism rather than a subset relation. Had it
   disagreed in one direction only I might have read it as a corpus property.
2. **This morning's §3 published a wide-boundary figure with no boundary label.** My memo said
   "`typed = quotedOfMe \ ownEmits` is empty on every row, **20 of 20**". Re-read off the
   committed dumps: members with any `quotedOfMe` are **1** at the live boundary
   (`a-live.absorb.json`), **7** under `wide`+`ownemits-empty`, **10** under
   `wide`+`ctx-whole-section`. The "7 members that quote anything" in that table was a *wide*
   figure. A reader carrying `20 of 20` over as the live gate's coverage would be off by
   twentyfold in the denominator.
3. **The `VACUOUS` item sat on my list for two days keyed on the wrong property**, and the
   measurement that would have told me so is the one I asked *him* to take. I named the figure
   correctly (how many maps are saturated) and then drew the wrong inference from it without
   checking that the gate can read it. Saturation is measured at the cure's boundary; a branch
   inside the gate can only read the gate's.
4. **`GTYPEDDEFCOV` would have minted a phantom gate**, and `MAPVERDICT`+`vacuous=[…]` would
   have blinded an instrument nobody re-drives. Both were caught by reading the *consumers*
   before the edit rather than after — recorded as near-misses because the only reason they
   are not defects is the order I did two things in.
5. **The grading instrument as first committed could not be re-driven, and its recording said
   `6 of 6`.** `PRECURE_REV` was derived as "the newest commit touching this directory that did
   not touch the checker" — correct at the first drive (`caaf2cf1`) and **sliding forward** the
   moment the unit committed anything after the cure. By `789487d5` the derivation picked a rev
   at which the checker was *already cured*, so `C0` read `IDENTICAL` and refused: *the guard
   that exists to stop a later commit becoming the baseline did exactly that, to itself.* Only
   a re-drive after the push could show it — a committed green recording cannot. Re-anchored on
   the **event**: the oldest commit since `baseline.rev` that touched the checker, and its first
   parent.
6. **`C0` printed characters and labelled them bytes** — `70833B` for a file `statSync` calls
   **71123** bytes, over a source carrying `§`, `—` and `·`. The *comparison* was never
   affected (string vs string), but a size a reader cannot check against `ls -l` is not a size.
   **This is defect 2 of my own 10/31 WORK memo recurring in a new instrument the same day**,
   which is the part worth carrying: I recorded the lesson eight hours earlier and wrote the
   same line again. `Buffer.byteLength` now, named in the output so the next reader can tell.

## Named, no deadline, no blocker

* **`GSUBJ` is not wired to `MAPVACUOUS`.** It already prints `VACUOUS` in prose on **both**
  legs (`:988`, `:993` **after** this unit's edit shifted them by 6) and its vacuity is
  therefore invisible in the verdict line in exactly
  the way `GTYPEDDEF`'s was. It is not wired here because its vacuity is **per-leg and
  partial**, which needs a call about what a half-vacuous gate reports. Named, not deferred for
  lack of time.
* **A census of which other gates pass over an empty denominator.** `MAPVACUOUS` is a channel
  with one subscriber today. The figure worth having is how many of the 16 gates can pass
  vacuously at all — that is a sweep over the gate bodies, not a drive.
* **The ordering call on the boundary cure is unchanged and is xian's.** Nothing here moves it.
  This unit's one bearing on it: the 2 cells the cure reddens at price=1 are the 2 cells where
  the live gate measures nothing, so on those two the cure is not adding a finding to a green
  map — it is replacing a non-measurement with a measurement.

## Not run this unit

`npm test`, `npm run typecheck`, the sweep, the stop-condition cell. No file under `packages/`
or `scripts/` was touched.
