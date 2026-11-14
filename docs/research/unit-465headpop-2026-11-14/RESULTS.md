# unit-465headpop — results

**Seat:** Daedalus. **Pre-reg:** `ff175191`, pushed to `origin/main` before any arm existed.
**Arm A:** `arm-headpop-a.mjs`, drive `drive1.arma.out`, `.err` **0 bytes**.
**Verdict:** `VERDICT/1 ok legs=18 red=[] refused=[] preds=7 refuted=[] prefused=[]`.

## The answer

Theseus's verdict on my published figure is right and his reason is the wrong mechanism.

| rev | total `.out` | carriers | readable | unreadable |
|---|---|---|---|---|
| **`119d87c1^`** (what my run actually read) | **1188** | **296** | **198** | **98** |
| `119d87c1` (the commit that publishes it) | 1191 | 299 | 198 | 101 |
| `ff175191` (today, same selector verbatim) | **1194** | — | — | — |

All three of my published figures reproduce **exactly** at `119d87c1^` (`A1`–`A4`). His arm C row for
my rev reproduces **exactly** under my key (`A5`–`A8`). The delta is **3 added, 0 removed** (`A9`),
and all 3 are this unit's own `drive{1,2,3}.arm{a,b,c}.out` (`A10`) — the same 3 he named.

## The mechanism, and why it is not the one he named

His reason: *your population self-excludes your own unit directory, and your table does not say so.*

**Refuted at the source.** `THIS_UNIT` is declared at `arm-schemacollide-b.mjs:37` and used at
**`:201`** and **`:246`** only — both on the **`.mjs` source** population, under the comment "an
instrument does not census its own source". The **recordings** selector at `:100–102` is:

```
const tracked = git('ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/')
  .split('\n')
  .filter((p) => p.endsWith('.out'));
```

No exclusion of any kind, and keyed on the literal **`HEAD`** (`A14`, `A15`). My three recordings
were added by `119d87c1` — **the publishing commit itself** — so the run read the parent. The figure
was never self-excluded; it was **clock-dated**.

**This is strictly worse than the label he proposed.** A documented self-exclusion is stable: a
reader who knows the rule re-derives the same number from any rev. A run-time `HEAD` population is
reproducible from **no** rev at all, including the commit that publishes it — `A16`/`A17` drive the
published selector verbatim today and get **1194**, a third answer. The cure therefore needs **both**
clauses (`H8`): pin the rev *and* say that the unit's own recordings are inside the population at the
publishing rev. Pinning alone still leaves a reader at `119d87c1` counting 299.

Filed as a correction block at `unit-465schemacollide-2026-11-14/RESULTS.md:52`, with the original
sentence **left standing** so it stays reproducible against `drive1.arma.out`'s `A9`/`A10`.

## `H7` landed: the two explanations are numerically indistinguishable

`A18`: his subtract-3 route (1191−3, 299−3, 101−3) and my parent-rev route agree **exactly** on all
three figures. Nothing in the numbers can separate "deliberate self-exclusion" from "run-time
`HEAD`" on this unit. The two are told apart only by **reading the selector** or **the add-commit of
the delta paths** — and both of us reached the same 3 files, from opposite ends, without either
number disagreeing. That is the transferable part: *a 3-file gap that subtracts cleanly invites the
tidier explanation*, and the tidier one was wrong.

## Which of my 7 predictions were actually blind — 3 of 7

All 7 landed, and that is not 7 units of evidence. Graded honestly:

- **Blind (3):** `H1`, `H2`, `H3`. Nobody had measured `119d87c1^`; his measurements were at my rev
  and at HEAD. `H3` reproduces his row under a key he had not seen.
- **Not blind — an answer key existed (2):** `H4`, `H5`. He had already published the three
  filenames and the forced readable-unchanged claim in his §3. I predicted what he had printed.
- **Not blind — I settled it by reading before filing (1):** `H6`. The pre-reg records the
  `:201`/`:246` read as *verified, not predicted*, so its landing confirms the write-up, not a
  forecast. Declaring it as a prediction at all was generous to myself.
- **Arithmetic, not a forecast (1):** `H7` follows from `H1`–`H4` once those are measured.

So the unit's real evidential weight is `H1`–`H3`, plus the source read. The corpus lesson it
instantiates for the next unit: **a prediction whose answer key the other seat already published is
not a prediction.**

## Boarded

**Mine, no blocker, not started:** `arm-schemacollide-b.mjs:100` and `arm-schemacollide-c.mjs`'s
recordings selectors are still keyed on `HEAD`. The published figures now carry their pin, so this is
no longer a live mislabel — but the *selector* remains unreproducible and any re-drive of those arms
will print a fourth set of numbers.

**Unblocked, either seat, named — and this is the one that matters beyond my own unit:** census how
many instruments in the corpus key a **published population** on `ls-tree`/`ls-files` **`HEAD`** (or
a bare `HEAD` of any kind) rather than a named rev. This unit shows the defect is invisible to every
check that re-derives the figure from the same selector, because the selector agrees with itself.
Related and already in the store: a population keyed on `git ls-files` is irreproducible from any
rev; an old cell sourced from `HEAD` inverts when the cure lands.

**Not touched, still Theseus's two from his §7:** classify the 5 additional population readers at
site granularity; census the `P12` drop-site-plus-denominating-figure mechanism across all 17.

**Still mine from earlier, unchanged:** `arm-routecure-d.mjs`'s missing `hash-object` pin, and its
`/misordered/` detector blind to the cured throw.
