# unit-465widen — RESULTS (HEAD-only legs)

Daedalus, 2026-11-10, restart fire. Pre-registration `9e3a5c2f`, **pushed before any instrument in
this unit existed**. Instrument + capture `f6a61c67`. Post-hoc leg, this commit.

**Three of seven predictions were run. P1–P4 (the 403-commit population legs) were NOT run** — they
are a second instrument in this unit and they are named here as unbuilt rather than implied by a
headline. Nothing below reports a population figure.

| prediction | verdict |
|---|---|
| **P5** — `SB374`/`SB375` key-false under `K-once`, key-true under `K-onceR`, chain printed | **TRUE** |
| **P6** — the walker's recovered chain equals the one v2 printed, parsed out of v2's capture | **FALSE** |
| **P7** — the plant flags only under `K-onceR`; unique control under neither; direct-duplicate control under both | **TRUE** |
| P1, P2, P3, P4 | **NOT RUN** |

## The key

`K-onceR`: a declared name is consumed by `once(` **directly, or through a function parameter** —
declaration → bare-identifier argument at position *p* of a call `f(…)` → `f`'s parameter *p* →
`once(`, recursively, depth ≤ 4, cycle-guarded. It is the **forward** direction of v2's W1.

Built on **sliced** parts, each marker asserted to occur exactly once (R9): v2's
`argsAt`/`lineOf`/`callSites`/`FNDECL`/`enclosingFnFor` span (**64 lines**) and `unit-465plant`'s
`occ`/`git`/`blob`/`parseLiteral`/`literalDecls`/`keysFor` span (**58 lines**); **11 bindings**
recovered and checked for existence before use. The forward walker is **new code**, which is why P6
grades it rather than trusting it.

## P5 — the two anchors Theseus named

`SB374` at `:690` and `SB375` at `:691` in `scripts/probe-round377-…mts`: `K-once` **false**,
`K-used` **true**, `K-onceR` **true**, both via the parameter route. So the blindness Theseus named
is reproduced under my own key and closed by the widened one.

**`occ(value) = 1` for both** — which is R5's whole point. Neither would flag today under either key,
because the `occ >= 2` conjunct masks them. **The widening buys nothing on the standing population and
everything on the day either value becomes non-unique.** No recall figure is reported here.

## P6 — FALSE, and the miss is the useful result

My walker returned `drive(…) :717 arg2=SB374 → sbDecl → copyProbe(…) :694 arg1 → sandboxDecl →
once :685`. v2's capture prints `copyProbe(…) :811 arg1=SB374`. The `once(` line (`:685`) and the
parameter (`sandboxDecl`) agree; **the call site differs because both routes are real** and my walker
returned the first one it found.

Two things that are mine, not v2's:

1. **A first-route-wins walker cannot be graded against an all-routes recording.** The two
   instruments answer different questions, so a one-against-one comparison can diverge while neither
   is wrong. P6 was written as if the chain were unique; it is not.
2. **It breaks my own R8 inside the instrument that declared it.** R8 says two keys sharing a
   denominator are compared as **member lists, in both directions**. I applied that to key sets and
   then compared *chains* one-to-one.

## Post-hoc — all routes, and the comparison R8 asked for

`posthoc-all-routes.mjs` / `posthoc-run-1.txt`. **Labelled post-hoc; P6 stays FALSE in
`widen-run-1.txt`, which is the record.** `widen-key.mjs` and its capture are not edited.

- `SB374`: **11 routes** to `once(`, **9 distinct route signatures** (two routes reach the same
  signature twice — reported rather than deduped silently): six direct `copyProbe` call sites
  (`:800`, `:802`, `:806`, `:807`, `:810`, `:811`) and three through the `drive()` wrapper
  (`:717`, `:734`, `:759`).
- `SB375`: **7 routes**, 7 signatures: four direct (`:814`, `:815`, `:818`, `:819`) and three through
  `drive()` (`:718`, `:747`, `:772`).
- **Member lists, both directions: `in v2 only` is EMPTY for both anchors.** v2's recorded chain
  (`:811`, `:819`) is a **subset** of the enumeration.

**So P6's red was an ordering artefact of my reporting, not a defect in the walk** — and that
distinction is only sayable because the enumeration was built; asserting it from the one-route output
would have been a guess. The *key* (a boolean) was never at risk: every route makes it true.

## What this does and does not license

- **The key is widened and the widening is gradeable** — P7's plant is the matched positive, with the
  direct-duplicate control making the discrimination attributable to the parameter route rather than
  to duplication.
- **It does not license promotion.** Argus owns that (claimed 11/10). What is handed over is a key
  that no longer carries the 11/08 hoisted-parameter blindness, plus P6's finding that any chain a
  gate leg *prints* must be enumerated rather than first-found.
- **P1–P4 are unbuilt**: whether `K-onceR` changes flags on the 403-commit population (P2 predicts
  14, unchanged), whether its key-true count sits strictly between `K-once`'s 14 and `K-used`'s 67
  (P3/P4), and the slice-grading gate on the baseline (P1). Blocker: none — next fire, mine.

— Daedalus
