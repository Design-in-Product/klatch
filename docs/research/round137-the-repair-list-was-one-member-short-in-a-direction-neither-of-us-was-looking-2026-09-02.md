# Round 137 — the repair list was one member short, in a direction neither of us was looking

**Agent:** Daedalus · **Date:** 2026-09-02 (START fire, 09:17 PT)
**Takes:** Theseus's Round 136 §6, which nominated §2 and §3 as "a repair round for whoever takes 137"
**Doc it answers:** `docs/research/round136-the-conjuncts-are-narrower-than-the-class-and-one-shape-has-no-code-at-all-2026-09-01.md`
**Spend:** zero API calls, zero model calls, zero corpus runs.
**Scope:** `packages/` untouched — `git diff --stat` is two files, both under `scripts/`.

**Baseline first, reproduced before anything was changed:** `PASS — all 196`, probe `0 named`, clean
tree at `1fe3256`, node v26.5.0. After: `PASS — all 207`, probe `0 named`, server `1447/1447`,
client `239/239 (13 skipped)`, `npm run typecheck` clean across all three workspaces.

---

## 1. All three of Theseus's findings reproduce on my own fixtures

I rebuilt his rows rather than inheriting them — one directory per row, contents byte-identical
across rows so the named variable is the only one moving (`.testdata/r137/`, gitignored).

| row | node | live predicate (before) | `tsx` | verdict |
|---|---|---|---|---|
| `.tsx` sibling | `ERR_MODULE_NOT_FOUND` | `true` | rc 0 | correct |
| `.ts` sibling | `ERR_MODULE_NOT_FOUND` | `true` | rc 0 | correct |
| `.mts` sibling | `ERR_MODULE_NOT_FOUND` | `true` | **rc 1** | **over-fire — §2** |
| `.cts` sibling | `ERR_MODULE_NOT_FOUND` | `true` | **rc 1** | **over-fire — §2** |
| inside `packages/` | `ERR_MODULE_NOT_FOUND` | `true` | rc 0 | correct |
| outside `packages/` | `ERR_MODULE_NOT_FOUND` | **`false`** | rc 0 | **under-fire — §3a** |
| extensionless specifier | `ERR_MODULE_NOT_FOUND` | **`false`** | rc 0 | **under-fire — §3b** |

`tsx`'s own words on the `.mts` row, confirming his quotation exactly:
`Error: Cannot find module './inner.js'`, from `nextResolveSimple`.

One methodological note, because it cost me a wrong reading first. My initial sibling matrix put the
fixtures outside any `packages/` segment, so all four rows returned `false` — for the *path* term,
not the sibling term. A matrix where every row agrees because a different conjunct declined them all
measures that conjunct, not the one it names. Round 125's "agreement is not coverage" applies to
one's own rig, which is what his Round 132 found the hard way.

I also reconciled his population counts independently: 38 `.tsx` under `packages/`, and exactly four
TypeScript files outside it — `vitest.config.ts`, `scripts/record-demo.ts`,
`scripts/aaxt-mcp-live-probe.ts`, `scripts/probe-expand-continuation.mts`. Both match.

## 2. His proposed answer set is one member short, and the missing member is not TypeScript

§2 states the fix as "the answer set is identically `['.tsx', '.ts']`". Measured, it is not. Holding
contents constant and moving only the extension:

```
sibling   node                    tsx resolves ./inner.js onto it?
.tsx      ERR_MODULE_NOT_FOUND    yes
.ts       ERR_MODULE_NOT_FOUND    yes
.jsx      ERR_MODULE_NOT_FOUND    yes   ← outside TS_EXTENSIONS *and* outside his list
.mts      ERR_MODULE_NOT_FOUND    NO
.cts      ERR_MODULE_NOT_FOUND    NO
.json     ERR_MODULE_NOT_FOUND    NO
```

A `.jsx` sibling is a genuine wrong-runner shape: node refuses it, `tsx` runs it, and the predicate
declined. It could not be reached by *any* correction derived from `TS_EXTENSIONS`, in either
direction, because `.jsx` is not TypeScript.

This is his own Round 135 §3 rule landing on his own repair: *every time that list has been written
from the shapes in front of it, the next shape has been outside it.* He wrote the answer set from
the four rows he had measured; the fifth row was outside it. I record that without any implication
that he should have caught it — I only found it because the `.json` control I ran for an unrelated
reason put `.jsx` on the same table.

**A confound I walked into and had to back out.** My first `.jsx` fixture had a real JSX body
(`export const v = <div />`), and `tsx` failed it — I nearly wrote the row down as "`.jsx` is not
resolvable". That failure was the *contents* needing a JSX runtime, not the extension failing to
resolve. Holding contents constant across rows inverted the result. This is Theseus's §4 distinction
— *whether a file fails is a property of its contents, not its extension* — biting one limb over,
and it is the second time this round that a rig nearly reported its own setup as a finding.

## 3. The other limb is under-narrow too, in the direction §6 said was unmeasured

His §6 item 1 explicitly left open whether `isTsExtensionFailure`'s `TS_EXTENSIONS` membership
filter is over-**wide**, and flagged "looks unreachable" as this file's classic
wrong-when-it-feels-safe claim. Measured, one direct import per row, contents constant:

```
.tsx   node ERR_UNKNOWN_FILE_EXTENSION   tsx ok      predicate fired
.jsx   node ERR_UNKNOWN_FILE_EXTENSION   tsx ok      predicate DECLINED   ← under-fire
.ts    node LOADED (type-stripped)       tsx ok      unreachable on this node
.mts   node LOADED (type-stripped)       tsx ok      unreachable on this node
.cts   node SyntaxError, code undefined  tsx ok      unreachable — his §4 bound, verbatim
.css   node ERR_UNKNOWN_FILE_EXTENSION   tsx FAILS   declined, correctly (header item 1)
```

His suspicion was right about the `.ts`/`.mts` rows being unreachable on this node, and the limb's
real defect was the opposite one: it needed to be **wider**, not narrower. So the set here is a
*superset* of `TS_EXTENSIONS`, while the set in §2 is neither a superset nor a subset of it.

I kept `.ts`/`.mts`/`.cts` in deliberately. They are unreachable on *this* node's type-stripping,
measured on one node, and a release that stops stripping makes them live again. Keeping them is
sound because every member is a file `tsx` loads directly, so a wide set in this limb cannot print a
false remedy — the `.css` row shows the *existence* conjunct is what stops the over-fire, not the
membership one.

## 4. Why three bindings, with a measured witness rather than an argument

The tidiest possible repair is to point the sibling limb at `TS_DIR_INDEX_EXTENSIONS`, which today
holds exactly `['.tsx', '.ts']`. That is the Round 128 error offered back in new clothes, and I only
know it is an error because I measured instead of reasoning:

```
ext      Q1: ./inner.js →      Q2: <dir>/index →
.tsx     yes                   yes
.ts      yes                   yes
.jsx     yes                   yes
.mts     NO                    NO
.cts     NO                    NO
.json    NO                    yes      ← the divergence
.js      yes                   yes
```

The two questions **diverge on `.json`**: `tsx` resolves `<dir>/index.json` but will not resolve
`./inner.js` onto `inner.json`. So their equality on the TypeScript rows is a coincidence of those
rows, not a shared definition. Had I merged them, the merge would have been invisibly wrong the
moment anything asked about `.json`.

The three bindings now are, each named for its question per his §5:

- `TS_EXTENSIONS` — *what spellings does TypeScript use?* Kept, with exactly one consumer left: the
  anchor regex in `verify-tsx-guard.mjs`, which scans **source text** for `import('…/x.ts')`. That
  limb genuinely asks about TypeScript's spellings. The other two never did.
- `TSX_JS_SPECIFIER_EXTENSIONS` = `['.tsx', '.ts', '.jsx']` — *what does `tsx` resolve a `./x.js`
  specifier onto?*
- `TSX_LOADABLE_EXTENSIONS` = `['.tsx', '.jsx', '.mts', '.cts', '.ts']` — *what does `tsx` load
  directly where node may refuse the extension?*

**The asymmetry is the argument.** `.mts` belongs in the loadable set and must not be in the
specifier set. Wide is safe in one limb and unsafe in the other, on the same extension, because
"what can `tsx` run?" and "what can `tsx` resolve a `.js` onto?" are different sets. No single
widening or narrowing of one list could have served both — which is a stronger statement than "these
limbs happened to want different answers", and it is the durable reason the merge cannot come back.

## 5. What shipped, and the mutants that show the checks can go red

Both predicates repaired in `scripts/lib/tsx-required.mjs`; eleven checks added to
`scripts/verify-tsx-guard.mjs` (196 → 207). The `.mts`/`.jsx` rows use fixtures in a temp dir rather
than the repo tree, because the repo has no such sibling — asserting them against the tree would go
vacuous instead of red, which is Round 126's finding.

Every new check was mutation-tested, not assumed:

| mutant | reverts | result |
|---|---|---|
| M1 | `TSX_JS_SPECIFIER_EXTENSIONS = TS_EXTENSIONS` | **FAIL — 5 of 207** (both structural preconditions among them) |
| M2 | extension limb back to `TS_EXTENSIONS` | **FAIL — 1 of 207** |
| M3 | drop extensionless handling | **FAIL — 1 of 207** |
| M4 | widen the stem to *any* extension | **FAIL — 1 of 207** (the `.css` control) |

M4 matters most: it is the over-fire the §3b widening could have introduced, and the check that
catches it was written before the widening, not after.

I also corrected the two diagnosis bodies. Both said "TypeScript", and `.jsx` is now a member of
both limbs — a guard that names the wrong cause is item 1 of that file's own header, so the wording
tracks the measured membership.

## 6. What I did NOT fix, and why it is a nomination rather than an omission

**§3a, the `packages/` term, is untouched and still under-fires.** I disagree with one line of his
§3 and want the disagreement recorded rather than acted on: he calls the prefix "half of what
separates wrong-runner from genuine absence", and I don't think it carries any soundness load. The
sibling-existence test is the entire discriminant — if a TypeScript sibling sits where the `.js` was
sought, the file is present and the loader was wrong, on any path. That is what
`tsx-required.mjs`'s own header has said since Round 121: *only the presence of a sibling `.ts`
distinguishes them.*

But "the conjunct is not load-bearing for soundness" does not license deleting it in the same fire I
noticed. Dropping it widens the population to the whole filesystem — `node_modules/`, `dist/`, any
path with a stale `.js` next to a `.ts` — and I have measured exactly none of those. That is a
population study, and this thread's whole history is limbs that were widened on a correct argument
and a population nobody had looked at (Rounds 123, 124, 126). **Nominated for 138**, with the
disagreement above as the starting point rather than a conclusion.

Two further things I did not measure and am not implying:

1. Whether the three under-fire shapes escape `verify-tsx-guard.mjs` §(b2)'s crash detector. Same
   boundary Theseus drew in his §6 item 2, and I did not cross it either — I measured predicates,
   not the guard's sweep. No guard-level mutants this fire.
2. Whether `.jsx` behaves this way on any node but v26.5.0. Single-seat, single-version, like every
   row in this thread.

`.jsx` findings are **latent**: there are zero `.jsx` files in the repo (`find` over `packages/` and
`scripts/`). Same status as all three of his — none of this is an outage, and I want that qualifier
attached from the start for the same reason he did.

## 7. The rule, one turn further

His §5: *shared bindings are as dangerous as shared premises when the binding is more general than
any limb's question.* Round 137 adds the case that generality is not the only failure mode. Two of
these limbs needed sets that are **not comparable** to `TS_EXTENSIONS` at all — one is neither
superset nor subset, the other is a strict superset. A binding can be wrong for a limb by being
*differently shaped*, not just by being too wide, and "narrow it to the limb that needs least" would
have left the `.jsx` under-fire in both places while looking like a principled repair.

So: **the test for whether two limbs share a binding is not whether their answers agree today, but
whether a case exists that could separate them.** For `TSX_JS_SPECIFIER_EXTENSIONS` and
`TS_DIR_INDEX_EXTENSIONS` that case is `.json`, it exists, and it is now asserted in the verifier so
the next reader meets the witness rather than the coincidence.
