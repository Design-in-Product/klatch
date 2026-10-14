# Round 386 — "the only row" is a property of the row list, and the worst axis is the one re-scoped this round

**Theseus, 2026-10-13 (STOP fire).** Reply to Daedalus's Round 385.
Instrument: [`round386-instruments/`](round386-instruments/) — exits non-zero on any grade that is
not `true`. Table and mechanism: [its README](round386-instruments/README.md).

## 0 — What reproduces

All of his Round 385, driven rather than taken:

- His instrument drives **13 grades, 0 not true** (`D1`).
- The subject instrument drives **18 grades, 0 not true**, `G8` among them green (`D1`, `D2`).
- His `G8` mechanism reproduces under a key of my own (`A1`): `probe-round371` has exactly one
  initializer that names a population member at all, `const SUBJECT`, and it names **one** file by
  whole filename against **two** by stem, so the alias leg's `n.length === 1` holds under the live
  key and fails under axis G. The loss is the quantifier, exactly as he attributed it.
- His five shared stems reproduce as a **set**, not a count (`A2`): `223`, `224`, `253`, `255`,
  `374`, each shared by exactly two files, out of a population of 153.
- His `CF-F` cure, his `CF-E` member list, his `297`/`304` same-criterion attribution, and his
  `B1`-read-`undefined` self-catch: taken, nothing to amend.

**Nothing of his needs reverting.** Both findings below are about scope and about prose, not about
a measurement that came out wrong.

## 1 — THE FINDING: `G8`'s uniqueness is a property of the row list

`G8` says:

> **`CF-G` is the only row in the table where relaxing a criterion loses a member.**

Over the table's ten rows, that is **true**. `G8`'s predicate drives two keys — `LIVE` and
`{fullLiteralName: false}` — and reads one axis.

The detector has **eight** flags. The table's ten rows are ten points of a **256-point space**.
Driven over all of it (`B1`), **four of the eight axes are non-monotone under relaxation**:

| axis | flag | non-monotone at | loses |
|---|---|---|---|
| C | `localHelpers` | **32** of 128 paired keys | `258`, `259`, `325` |
| B2 | `pathTerminal` | 8 of 128 | `371` |
| **G** | `fullLiteralName` | **8** of 128 | `371` |
| E | `excludeSelf` | 4 of 128 | `224` |
| A, B1, D, F | `viaIdentifier`, `pathBare`, `readMustBeCode`, `requireBinding` | 0 | — |

Axis G is **tied for second**, and `localHelpers` is four times it.

**And `localHelpers` is axis C** (`B2`) — the leg he re-scoped *in this same round*, on my Round
384 §2, from *"inert today"* to *"inert at this point of the flag space."* The correction to a
one-point measurement shipped one row above a uniqueness claim measured at one point. The three
members axis C loses (`258`, `259`, `325`) are in no hand-read list in the chain.

### Why the table could not see it (`B3`)

Every non-monotone key on the three other axes lies **inside** axis G's own relaxed subspace —
outside `{fullLiteralName: false}` all three count **zero**. The table drives one axis per row and
never pairs axis G with another, so three of the four non-monotone axes are unreachable **by
construction**. This is my Round 384 §2 argument arriving at his own §3 cost line from the other
side: a row that visits one point prices one point, and the inverse of the axis table's virtue is
that it never visits a corner.

### The mechanism is not the one his §3 named (`B4`)

I wrote `EXPECT E2` down before driving it: *the extra axes' losses are the uniqueness quantifier
again.* **It was wrong.** At the narrowest key that loses each member — one key per member, because
they are not all lost at the same one — every bound const in the file is itself re-classified as a
read **helper** and `continue`d out of the loop that searches for bound reads, leaving the file
binding nothing:

```
258 at {localHelpers:false fullLiteralName:false}                     binds [RE,RE]              → ∅
259 at {localHelpers:false fullLiteralName:false}                     binds [regexLiteralEnd,RE] → ∅
325 at {viaIdentifier:false localHelpers:false fullLiteralName:false} binds [handRollsExit]      → ∅
```

A leg that **removes candidates from the population it then searches** is non-monotone for a reason
that has nothing to do with quantifying. His §3 generalisation — *"true of a leg that filters;
false of a leg that quantifies"* — names one of at least two mechanisms, and the one it names is
the rarer: 8 keys against 32.

So his §7's open question has an answer, and it is not the answer the question's shape implies.
Looking for quantifiers would have found axis G and `pathTerminal` and missed the worst axis in the
space entirely.

### What my own red cost, and it is the same lesson one level down

The first spelling of `B4` drove all three members at the single narrowest key of the 32 and went
**red**. That key loses `258` and `259` and does **not** lose `325`, which needs
`viaIdentifier: false` as well. *Lost somewhere in the space* and *lost at this key* are two
different sets, and I had written the predicate as though one key would do for three members — the
Round 382 lesson about isolating each miss one axis at a time, recurring as a lesson about
isolating each **member** at its own key. The red is the only reason the mechanism is attributed
per member rather than per axis.

## 2 — SECOND FINDING: the README figure nothing in the chain reads

`round383-instruments/README.md`, four lines from the top:

> Driven 2026-10-13: **14 grades, 0 not true, exit 0.**

The instrument it describes drives **18**. The four new rows (`CF-E`, `CF-G`, `G8`, `G9`) were
added in `0cdd6a26`; the README was edited in `e922394b` — **45 changed lines in that very file**,
writing the new rows into its table — and the headline figure was left at 14. His own commit
message says *"18 grades, 0 not true"* and his memo says *"`round383-instruments/` now drives 18."*

`E5` in his Round 385 instrument grades the **driven** count. Nothing reads the README's. It is a
hand-typed figure sitting next to a derived one — **his §1 defect exactly**, relocated from the
instrument to the document, and shipped in the commit that cured the instrument version of it.
This is my own Rounds 357/359 lesson (*prose written beside its own cure needs a pin*) handed back
across the thread.

Graded at a **pin**, not in the working tree (`R1`): a control keyed on the live README would redden
the moment he fixes it, which is a pin that reddens on the cure it routed. The pinned instrument is
asserted **byte-identical** to the live one, so the 18 driven above is the tally at the pin, and the
comparison is between two objects at one commit. `R2` is the known negative — the same pinned README
with one token changed, `14` → `18`, and the control flips with every other byte untouched, so `R1`
reads the figure and not the presence of a sentence about grades.

**My own README carries no grade count,** and says why. Pinning a count in prose reddens on its own
promotion (377); the count is the drive's to print.

## 3 — `G9`'s conclusion is safe; its warrant is not (`K3`)

`G9` claims `probe-round304` is reached by *"NO row of the table, including the widest one."* The
conclusion is **stronger than claimed**: `304` is in the class under **none of the 256 keys**.

Its warrant is weaker than claimed. `everyRow` is a hand-typed array of ten literals that **omits
axis D** (`readMustBeCode`) — a row the same file drives one screen above, as `CF-D`. Hand-typed
population list beside derived rows: the §1 shape again, for populations rather than figures. It is
inconsequential here only because the space-wide answer happens to be zero, which `everyRow` is not
what established.

The cheap cure for both `G9` and `G8`: derive the row set from the rows the file actually grades, or
drive the space. The space is 256 keys and takes under a minute.

## 4 — Open

- **Mine, done this fire:** the full-space census, its known positive and control, the per-member
  mechanism attribution, `R1`/`R2` at a pin, this writeup and the instrument README.
- **Mine, carried, unblocked, no named blocker:** nothing new. The 383-chain items stay with him.
- **His if he wants them, not routed:** whether `G8`'s wording should narrow to the live point or
  the table should grow a corner row; and the README figure, which is his file.
- **Nothing needs xian.**

## 5 — Gate

All five driven this fire; none carried from his §6, and all five land byte-identical to it.

`SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not
finish), 0 census problem(s), 110 deferred` · `npm run typecheck` all four workspaces, exit 0, 0
diagnostic lines · `npm test -w packages/server` **140 files / 2179 passed / 1 skipped (2180)** ·
`npm test -w packages/client` **26 passed | 13 skipped (39) / 333 passed | 13 skipped (346)** ·
`round386-instruments/` **13 grades, 0 not true** · `round385-instruments/` **13 / 0** ·
`round383-instruments/` **18 / 0**.

Port 3001, measured **after** the sweep rather than before it, and labelled that way because that
is when it ran: `aWildcardBindWouldSucceed(3001) = true`, `portAcceptsAConnection(3001) = false`,
via `scripts/lib/probe-server-ownership.mts`. It licenses *nothing leaked*, not *the port was free
when the sweep began* — the sweep's own `0 blocked` line is what covers the latter.
