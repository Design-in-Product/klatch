# unit-523indirectsize — pre-registration

**Agent:** Daedalus · **Fire:** 2026-11-26 WORK (bounded)
**Clock, read in the same command that created this directory:** `2026-11-26 13:19:02 PST`
**Population SHA:** `7bd926a0cc71` · **instrument corpus at that SHA: 854 files**
(`git ls-files`, extensions `.mjs|.mts|.js|.ts|.cjs`, paths under `scripts/` or `docs/research/`)

Registered **before any arm, reader, cell, KP or capture for this unit existed.**

---

## 0. Subject — the two residuals `unit-521` published and declined to narrow

`unit-521setsizefalsegreen-2026-11-26` (pre-reg `148ebe57c8f8`, results `09e5e02d97f6`) censused
`new Set(<expr>).size <op> <n>` written as **one expression** and found 11 `INVARIANCE` sites, 11 of
11 `BLIND`, 9 false-green-capable. It published two figures it explicitly did **not** narrow, and
boarded both as successors on `docs/operations/duty-cycle/daedalus-tasks.md`:

- **`NO-COMPARISON` 95** — a `new Set(...).size` read with no immediate literal comparison.
- **`INDIRECT` upper bound 123** — every literal `.size <op> <n>` in the corpus that is **not** the
  tail of a balanced `new Set(...)`. It **refuted** `unit-521`'s own P12 interval of `[1, 40]`. It
  over-counts **by construction**: it holds every `Map` and other-collection `.size` too.

`unit-521` §7's own words for what that leaves: *"the published `INVARIANCE 11` is a **floor on one
syntactic form**, not a census of the claim."* This unit's whole purpose is to turn the two residual
bounds into **keyed** counts, so that the floor can be stated with a ceiling next to it.

**Both residual figures were measured at `unit-521`'s SHA over an 850-file corpus. This fire's
corpus is 854.** Four instrument files landed in between (Theseus's `unit-522lengthasbytes`). So the
figures to beat are **not** 123 and 95 — they are whatever those keys read **here**, and the delta is
itself a prediction below. A population figure re-registered at a later SHA with no interval is a
claim about a clock; this seat has that banked (`unit-520` P10, refuted by a drift of exactly 7).

## 1. What the arm does

### Arm A — narrow the `INDIRECT` bound by resolving the receiver

For every literal `.size <op> <n>` match in the stripped reading of each corpus file that is **not**
at an index registered as the tail of a balanced `new Set(...)` span (`unit-521`'s own exclusion,
re-implemented from its published source, not imported from it — the arm is standalone):

1. **Walk the receiver backwards** from the `.` of `.size`:
   - a `)` → back-walk to its matching `(`, then keep walking back over any identifier/`.`/`]`
     immediately before it; the receiver span is a **call or parenthesised expression**;
   - a `]` → back-walk to its matching `[`, then continue; **bracket/index** receiver;
   - otherwise consume `[A-Za-z0-9_$.]`, giving an identifier or a dotted member chain.
2. **Key the receiver**, in this order (first match wins, order published here so the precedence
   claim is readable off the registration and not off the arm):
   - `SET-TAIL-DIRECT` — refusal cell. The span *is* a `new Set(...)` tail. **Must be 0**; it is the
     exclusion that defines this population, and KP6 proves the refusal rather than assuming it.
   - `SET-EXPR` — receiver span **contains** `new Set(` but is not a direct tail (a chained or
     parenthesised form).
   - `MAP-EXPR` — receiver span contains `new Map(`.
   - `SET-BOUND` — receiver is a **bare identifier** whose first file-local binding line
     (`(const|let|var)\s+NAME\s*=`) has `new Set(` in its right-hand side.
   - `MAP-BOUND` — same, with `new Map(`.
   - `OTHER-BOUND` — same, right-hand side has neither.
   - `UNRESOLVED` — bare identifier, **no** file-local binding line (a parameter, an import, a
     destructured name, a loop variable).
   - `PROPERTY` — dotted member chain (`a.b.size`).
   - `CALL` — call or parenthesised receiver with no `new Set(`/`new Map(` inside.
   - `RECEIVER-UNKEYED` — **named fall-through**, reachability proved by KP11. A bracket/index
     receiver (`rows[0].size`) lands here deliberately: it is a shape this unit does not resolve.
3. **Key the direction** with `unit-521`'s operator tables verbatim (`INVARIANCE` / `CHANGE` /
   `EMPTY` / `OTHER-N`), so the two units' direction cells are comparable.
4. For `SET-BOUND` and `SET-EXPR` sites only: key `BLIND` / `GUARDED` on whether a presence
   predicate from `unit-521`'s `GUARD_PREDS` list sits inside **the set's own argument span** (for
   `SET-BOUND`, the argument span on the binding line).

### Arm B — key the `NO-COMPARISON` 95 by what the `.size` flows into

For every `new Set(<expr>).size` site whose tail carries no literal comparison:

- `BOUND` — the site sits to the right of a `(const|let|var)\s+NAME\s*=` on the same line, so the
  size is bound to `NAME`. Sub-keyed by whether `NAME` is later compared to a **literal** anywhere in
  the same file: `BOUND-COMPARED` / `BOUND-UNCOMPARED`, and for `BOUND-COMPARED` the comparison's own
  direction under the same operator tables.
- `PROPERTY-ASSIGN` — to the right of `<member chain> =`.
- `INTERP-OR-ARG` — inside a `${ … }` interpolation or a call argument list (`stripSource` preserves
  interpolation code, so these are real code sites, not prose).
- `RETURN` — to the right of `return`.
- `B-UNKEYED` — **named fall-through**, reachability proved by KP12.

## 2. Predictions

Re-derivations of `unit-521`'s own two residuals at **this** SHA:

- **P1** `INDIRECT` bound re-derived here is in **`[123, 140]`** — monotone up from 123, because the
  four new files are instruments of the same kind. A value **below** 123 refutes it.
- **P2** `NO-COMPARISON` re-derived here is in **`[95, 112]`**, same reasoning.

Arm A receiver classes (they must sum to the P1 figure; the sum is asserted in the arm):

- **P3** `SET-BOUND` ∈ `[20, 70]`
- **P4** `MAP-BOUND` ∈ `[5, 45]`
- **P5** `OTHER-BOUND` ∈ `[0, 20]`
- **P6** `UNRESOLVED` ∈ `[10, 60]`
- **P7** `PROPERTY` ∈ `[1, 30]`
- **P8** `CALL` ∈ `[0, 10]`
- **P9** `SET-EXPR` + `MAP-EXPR` ∈ `[0, 12]`
- **P10** `SET-TAIL-DIRECT` = **0** exactly. This is the exclusion that defines the population.
- **P11** `RECEIVER-UNKEYED` ∈ `[0, 15]` — and whatever it is, **KP11 proves the cell reachable**, so
  a 0 here is a measured 0 rather than a dead arm.

The deliverable figure — what the narrowing actually buys:

- **P12** The **narrowed hazard**, `(SET-BOUND ∨ SET-EXPR) ∧ direction INVARIANCE`, is **> 0** and in
  **`[2, 25]`**. This is the count of `Set`-size invariance claims that `unit-521`'s one-expression
  key could not see, and therefore the amount by which its published floor of 11 rises.
- **P13** Of those, **≥ 80% are `BLIND`** (no presence predicate in the set's own argument span) —
  because `unit-521` measured `GUARDED 0` of 11 off a key arm KP2 proved reachable, and there is no
  reason the bound form would be guarded more often than the direct form.
- **P14** `MAP-BOUND ∧ INVARIANCE` has **≥ 1 member.** A `Map` whose `.size === 1` is a real
  invariance claim and is **not** the `Set`-absence hazard — so the bound's over-count is structural,
  not merely directional, and this is the evidence for saying so.

Arm B classes (they must sum to the P2 figure; asserted in the arm):

- **P15** `BOUND` ∈ `[20, 70]`
- **P16** `BOUND-COMPARED` ∈ `[5, 50]`
- **P17** `INTERP-OR-ARG` ∈ `[10, 60]`
- **P18** `PROPERTY-ASSIGN` ∈ `[0, 25]`
- **P19** `RETURN` ∈ `[0, 15]`
- **P20** **The claim one binding away**: `BOUND-COMPARED` whose later comparison keys `INVARIANCE`
  is **> 0** and in **`[1, 20]`**. These are invariance claims on a `Set` size that are invisible to
  **both** `unit-521`'s key (no immediate comparison) **and** Arm A's key (the compared receiver is a
  number, not a collection) — a hazard reachable only by the two arms together.
- **P21** `B-UNKEYED` ∈ `[0, 15]`, cell reachability proved by KP12.

## 3. Known-positive cells (planted, in a scratch file outside the corpus)

Each KP carries **the property its cell is keyed on**, not an analogy to it. The planted file is
written to `os.tmpdir()`, **never** into `scripts/`, `packages/` or `docs/research/`, so it cannot
enter this unit's own population — a scratch copy inside the corpus is a measured contaminant, and a
scratch copy at the wrong depth refuses every cell. Both are banked here.

| cell | plant | must key |
|---|---|---|
| KP1 | `const kpSet = new Set([1, 1]);` … `kpSet.size === 1` | `SET-BOUND`, `INVARIANCE`, `BLIND` |
| KP2 | `const kpMap = new Map();` … `kpMap.size === 1` | `MAP-BOUND`, `INVARIANCE` |
| KP3 | `kpParam.size === 1` with no binding line | `UNRESOLVED` |
| KP4 | `kpObj.inner.size === 0` | `PROPERTY`, `EMPTY` |
| KP5 | `kpFn(1).size > 1` | `CALL`, `CHANGE` |
| KP6 | `new Set(kpArr).size === 1` — a **direct tail** | **refused**: absent from Arm A entirely |
| KP7 | `const kpGuarded = new Set(kpArr.filter((x) => x != null));` … `kpGuarded.size === 1` | `SET-BOUND`, `GUARDED` |
| KP8 | `const kpN = new Set(kpArr).size;` … `kpN === 1` | Arm B `BOUND-COMPARED`, `INVARIANCE` |
| KP9 | `` `${new Set(kpArr).size}` `` | Arm B `INTERP-OR-ARG` |
| KP10 | `kpOut.n = new Set(kpArr).size;` | Arm B `PROPERTY-ASSIGN` |
| KP11 | `kpRows[0].size === 1` — bracket receiver | Arm A `RECEIVER-UNKEYED` (**fall-through reachability**) |
| KP12 | `kpSink(new Set(kpArr).size + 1, 2);` with no binding/property/return/interp context | Arm B `B-UNKEYED` (**fall-through reachability**) |

**KP11 and KP12 exist because of Theseus's 11-26 keeper, registered here as the reason:** his
`unit-522` drive **aborted** at exactly this cell — `=>` read as the comparison operator `>` routed
his planted fall-through control into `OTHER-CMP`, a neighbour, producing **no zero anywhere** and
nothing else in the unit able to see it. A fall-through cell needs its own KP *especially* when you
expect it to be large, because the failure it catches is mis-routing, not emptiness.

**The arm exits non-zero and publishes no census if any KP cell fails.** A capture from a failed
drive is committed unedited.

## 4. Declared limits — named, not cured

- **L1 — cross-file bindings are `UNRESOLVED`.** The binding reader is **file-local**. An imported
  `Set` is unresolvable by this key and lands in `UNRESOLVED`, inflating it.
- **L2 — first binding wins.** `let s = new Set(); … s = new Map()` keys `SET-BOUND` off the first
  binding line. Reassignment and shadowing are **blind**, declared here.
- **L3 — `a.size !== b.size` is outside every key**, in both arms. The operator tables take a
  **literal** right-hand side only. A size-to-size comparison is a real invariance claim and this
  unit cannot count it. `unit-521` had the same hole under the name `LENGTH-TO-LENGTH`.
- **L4 — Arm B's "later compared" search is file-local and lexical**: the identifier's own name
  matched against `NAME <op> <literal>` anywhere in the stripped file. A name reused for two
  purposes in one file over-reports; a comparison in another file under-reports. Reported as a
  **bound on the claim-one-binding-away count, with its direction of error named**, not as a count.
- **L5 — `.size` on a non-collection** (a `FormData`, a DOM-ish object, a test double) keys by
  receiver shape like any other. No type information is available to a character scan.

## 5. Protocol

- `git diff --stat HEAD -- packages/ scripts/` asserted **EMPTY inside the arm** before any
  measurement, so no figure here can be attributable to an uncommitted product edit.
- `stripSource(raw, true)` (shared, length-preserving) and `parenSpanEnd` (shared) are
  **dependencies from `scripts/lib/`**, not hand-rolled. Checked before writing: `declHeads` /
  `bodyOf` do **not** cover an identifier's binding line when the right-hand side is `new Set(`
  (`DECL_HEAD_SOURCE`'s second alternative requires a `(` immediately after `=`), so the binding
  reader is this unit's own and is declared as such.
- Member lines are printed **WHOLE, with no display field and no truncation.** This seat registered a
  refuted prediction off its own instrument's 150-character display field nine hours ago; an arm with
  no display field cannot be wrong about its display.
- The arm is driven **once**. `captures/ARM.out` and `captures/ARM.err` committed unedited.

— Daedalus
