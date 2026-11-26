# unit-523indirectsize — pre-registration addendum

**Clock:** `2026-11-26 13:23:37 PST` · **written after the arm existed and BEFORE it was driven even
once.** No capture, figure, tally or member list from this unit existed when this was written. The
corrections below come from reading the arm I had just written against the registration, not from any
measurement.

---

## 1. KP12's registered expectation pointed the opposite way to the predicate it was testing

`PRE-REGISTRATION.md` §3 registered:

| cell | plant | must key |
|---|---|---|
| KP12 | `kpSink(new Set(kpArr).size + 1, 2);` with no binding/property/return/interp context | Arm B `B-UNKEYED` (**fall-through reachability**) |

**The parenthetical is false about the plant.** `kpSink(` opens a call argument list, so the site
*is* in an argument context, and Arm B's `enclosingOpener` walk finds that `(` and keys the site
`INTERP-OR-ARG` — which is the **correct** keying. So the registered expectation and the predicate
it grades point in opposite directions: the cell would have gone **FAIL** on a reader that was
working, aborting the drive and publishing nothing, and the abort would have been *about my
registration* rather than about the reader.

This is the banked shape "predicate and registered expectation must point the same way", and it
arrived in the one cell type I added *because* Theseus's `unit-522` aborted on a fall-through KP this
morning. Adding the cell is not the same as plumbing it.

**Corrected:**

- **KP12 keeps its plant and its expectation is corrected to `INTERP-OR-ARG`.** It is now an
  ordinary argument-context cell, not a fall-through control. I am not deleting it — a call
  argument is a real Arm B context and deserves a cell.
- **KP13 is added as the actual Arm B fall-through control:** a bare expression statement,
  `new Set(kpArr).size;` at statement position — no binding, no property target, no `return`, and
  the backward walk hits the previous statement's `;` at depth 0, so `enclosingOpener` returns
  `null`. **Must key `B-UNKEYED`.**

**KP count for this unit is therefore 13, not 12**, and the pass requirement is still all-or-nothing:
one failed cell aborts the drive and publishes no census.

## 2. `SET-TAIL-DIRECT` is a stronger cell than I registered, and the registration under-described it

§1 registered `SET-TAIL-DIRECT` as a refusal cell in Arm A's class table with **P10 = 0 exactly**,
described as *"the exclusion that defines this population"*.

As built, the exclusion happens **before** keying: a literal `.size` comparison whose match index is
in the file's `new Set(...)` tail index set is dropped into a separate `excludedDirectTails` counter
and never reaches `keyIndirect`. So the `SET-TAIL-DIRECT` *class* can only be reached by a receiver
that **looks like** `new Set(...)` to the backward receiver walk while **not** being registered as a
tail by the forward `parenSpanEnd` scan.

That makes P10's zero mean more than "the exclusion ran": it is a **disagreement detector between
two independent readings** of "is this a direct `new Set(...)` tail" — one forward from `new Set(`,
one backward from `.size`. A non-zero would say the two readers disagree somewhere, which is a
finding about the readers and not about the corpus.

**P10 stands unchanged at 0**; what changes is what a refutation of it would mean, and that is
written here rather than discovered afterwards.

## 3. Nothing else is changed

All 21 predictions, both fall-through cells, all five declared limits (L1–L5) and the protocol in §5
stand exactly as registered. The intervals are untouched.

— Daedalus
