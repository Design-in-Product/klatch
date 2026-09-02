# Round 136 — the conjuncts are narrower than the class, and one shape has no `code` at all

**Author:** Theseus · **Date:** 2026-09-01 (STOP fire, 19:47 PT)
**Assignment:** Daedalus's Round 135 §5.4 — *"I fixed the code list; I did **not** survey whether node 26
moves other failures one module inward in ways `isTsResolutionFailure`'s `.js`-under-`packages`
conjunct mis-describes. … Available to whoever takes 136; I'd rather it be measured than inherited."*
**Subject:** `scripts/lib/tsx-required.mjs` — `isTsResolutionFailure`, `isTsExtensionFailure`,
`isTsDirImportFailure`, `TS_EXTENSIONS`.
**Spend:** zero API calls, zero model calls, zero corpus runs. `packages/` untouched. No repo file
changed — all fixtures built under gitignored `.testdata/r136/` and deleted.
**Seat:** node v26.5.0, tsx v4.21.0.
**Baseline first, at `92d620d`:** `node scripts/verify-tsx-guard.mjs` → `PASS — all 196`;
`node scripts/probe-import-sites.mjs` → `0 site(s) a fourth limb would name`;
`git status --porcelain` empty.

---

## 0. The short answer to the question as asked

**The conjunct is not wrong about M6, and node 26's inward move does not break it.** Measured: when
the failure moves one module inward, the error's `url` names *the module that actually failed*, not
the outer file, and for the live shape that module is a `.js` under `packages/`. Two modules inward
behaves the same way. So the specific worry in §5.4 does not reproduce.

**But the doubt was correctly placed, for a different reason.** Both of that conjunct's terms —
`endsWith('.js')` and `includes('/packages/')` — admit a measured counterexample, and the *sibling*
set it hands off to over-fires on two of its four members. The conjuncts were written from one
example and they describe that example, not the class. That is the fourth time this file has been
found in that condition (Rounds 124, 125, 128, and now this), and it is the same finding Daedalus
reached in Round 135 §2 — reached one predicate over, in code I widened myself in Round 128.

**None of the four shapes below fires on the live population today.** All are latent. I say so
explicitly because the value of the round is the class, not an outage.

---

## 1. Method

Nine fixture trees under `.testdata/r136/fx/`, one per case, each built on disk and imported by the
running node with **no guard**; the thrown error was passed to all three shipped predicates, and the
same outer file was then run under `npx tsx` in a child process. That last step is the one that turns
a predicate verdict into a *finding*: it establishes whether "re-run under `tsx`" is a true remedy,
which is what distinguishes an under-fire from a correct re-throw and an over-fire from a correct
claim. Case shapes are reproduced in §6 so this does not depend on a deleted harness.

Two follow-on matrices ran one row per member of `TS_EXTENSIONS`: one for the `.js`-specifier-onto-
sibling question, one for direct import of each extension.

## 2. What is correct, and stays correct

| case | shape | result |
|---|---|---|
| C1 | `.js` specifier inside `.ts`, all under `packages/` (the shape the predicate was written from) | `ERR_MODULE_NOT_FOUND`, `resolution=true`, tsx ok — **correct** |
| C5 | same, sibling is `.tsx` (Round 128's widening) | `resolution=true`, tsx ok — **correct** |
| C6 | the inward hop lands on a **directory** | `ERR_UNSUPPORTED_DIR_IMPORT`, `directory=true`, tsx ok — **correct; Round 135's new predicate generalises one module inward** |
| C7 | outer `.ts` → mid `.ts` → `.js` specifier | url names `…/mid.js`, `resolution=true`, tsx ok — **correct; the url names the module that failed** |
| C8 | `.js` specifier with **no** TypeScript sibling | `resolution=false`, tsx also fails — **correct re-throw; soundness intact** |

C8 is the one that matters for Daedalus's soundness argument in the `tsx-required.mjs` header: the
third conjunct still does the job it was added for. Nothing below asks for it to be removed.

## 3. Finding 1 — the over-fire, and it is the same two extensions Round 135 split out

`isTsResolutionFailure` asks *"is there a TypeScript sibling where this `.js` was sought?"* and
answers it with `TS_EXTENSIONS`. Measured, one directory per member, `.js` specifier onto a sibling
of that extension:

```
sibling  node code                  isTsResolutionFailure  tsx resolves ./inner.js?
.tsx     ERR_MODULE_NOT_FOUND       true                   yes
.mts     ERR_MODULE_NOT_FOUND       true                   NO
.cts     ERR_MODULE_NOT_FOUND       true                   NO
.ts      ERR_MODULE_NOT_FOUND       true                   yes
```

`tsx`'s own failure on the `.mts` row, verbatim: `Error: Cannot find module './inner.js'`, raised
from `nextResolveSimple` in `tsx/dist/register-*.cjs`.

So on an `.mts` or `.cts` sibling the guard claims the failure and prints `INCOMPLETE — … Re-run as:
npx tsx <file>` — **a remedy that does not work**. That is item 1 of `verify-tsx-guard.mjs`'s header,
which is the defect this whole family exists to prevent.

**This is Round 135 §2, one predicate over.** Daedalus split `TS_DIR_INDEX_EXTENSIONS = ['.tsx',
'.ts']` out of `TS_EXTENSIONS` because his limb asked *"what does `tsx` find at `<dir>/index`?"*
rather than *"what is TypeScript?"* — and measured exactly `.mts`/`.cts` as the false-remedy members.
`isTsResolutionFailure` asks a third question — *"what does `tsx` resolve `./x.js` onto?"* — and it
has **the same answer set**, `['.tsx', '.ts']`, for a related but distinct reason. His §2 stated the
generalisation correctly and then applied it only to the limb he was writing.

I want to be precise about whose error this is: the widening from `.ts` to `TS_EXTENSIONS` here is
**mine**, Round 128, and the docblock argues its soundness — *"any TypeScript sibling means the file
is present and the loader was wrong"*. That sentence is true and it is not the claim the guard makes.
The guard claims a *remedy*. Present-and-mis-loaded does not imply `tsx`-resolvable, and for two of
the four members it is not.

This is also the sharper form of Daedalus's §4. He argued an over-fire is cheap because it "produces
no wrong message, because the guard only speaks when something throws and nothing throws on that
path." On this shape something **does** throw, and the guard **does** speak, and what it says is
wrong. His cost asymmetry holds for the over-fire he was discussing; it does not extend to this one.

**Live?** No. `git ls-files -- '*.mts' '*.cts'` returns exactly one file, `scripts/probe-expand-
continuation.mts`, and there is no `.mts` or `.cts` anywhere under `packages/`. Latent.

## 4. Finding 2 — the `packages/` conjunct, measured one variable at a time

C1 and C2 differ in exactly one thing: whether the fixture tree contains a path segment named
`packages`. Same file contents, same specifier, same node.

```
C1  .../packages/fake/src/inner.js   ERR_MODULE_NOT_FOUND  resolution=true   tsx ok  → correct
C2  .../tools/src/inner.js           ERR_MODULE_NOT_FOUND  resolution=false  tsx ok  → UNDER-FIRE
C3  outer under packages/, specifier escapes to a TS sibling outside it
    .../tools3/inner.js              ERR_MODULE_NOT_FOUND  resolution=false  tsx ok  → UNDER-FIRE
```

Both re-throw raw — the stack trace and misattributed cause this family exists to remove.

The conjunct is doing real work (it is half of what separates wrong-runner from genuine absence in
C8), so this is not a "delete it" finding. It is a "the population is bigger than `packages/`"
finding: **four TypeScript files live outside `packages/` today** — `scripts/aaxt-mcp-live-probe.ts`,
`scripts/probe-expand-continuation.mts`, `scripts/record-demo.ts`, `vitest.config.ts`. The sibling
test in C8 already carries the soundness; the directory prefix is a second, narrower proxy for the
same thing, and it is the proxy that mis-describes.

**Live?** No. Every one of the 16 dynamic-import sites the probe finds targets `packages/server/**`
or `packages/shared/**`, and no non-test file under those trees imports outside `packages/`. Latent.

## 5. Finding 3 — an extensionless inner specifier, and Finding 4 — a shape with no `code`

**C4.** `import { v } from './inner'` written inside a `.ts`, with `inner.ts` on disk:
`ERR_MODULE_NOT_FOUND`, url `…/packages/fake4/src/inner` — **no extension at all**. The first half of
the conjunct (`missing.endsWith('.js')`) declines, all three predicates return false, the guard
re-throws raw. `tsx` runs the same file fine. Under-fire.

Not exotic: **`packages/client` is written this way throughout.** Eight non-`.tsx` files use
extensionless relative imports (`packages/client/src/hooks/useModels.ts` → `'../api/client'`, and
similar), and every `.tsx` component import in `App.tsx` is extensionless. It is latent only because
no verifier imports client source today — which is precisely the position `packages/client` was in
before Round 128, when it turned out to be outside all three predicates at once.

**C-direct.** Direct import of each extension, no inner hop:

```
ext     node code                  res    ext    dir    tsx loads it?
.tsx    ERR_UNKNOWN_FILE_EXTENSION false  true   false  yes
.mts    LOADED                     —      —      —      yes
.cts    (no code)                  false  false  false  yes
.ts     LOADED                     —      —      —      yes
```

The `.cts` row is a shape none of the three predicates can see, and I do **not** think it is a to-do.
Measured detail: node throws a bare `SyntaxError`, `code === undefined`, own properties exactly
`["stack","message"]`, no `url`, message `Unexpected token 'export'`. Every predicate in this file
keys on `err.code`; there is nothing to key on.

And a spelling-level fallback would be wrong, which is the part worth recording. Control, same
extension, contents the only variable:

```
ESM syntax in .cts   node: SyntaxError code=undefined — Unexpected token 'export'
CJS syntax in .cts   node: LOADED
```

**Whether a `.cts` fails under plain node depends on its contents, not its extension.** So no test
available at the call site — extension, existence, or path — decides it, and a real syntax error in a
real `.cts` is indistinguishable from this. This is Round 134 §4's bound in a new place: *there is no
reading-level oracle for loadability.* Daedalus accepted that bound in his §4 and it applies here
verbatim. I am recording it as a bound, not nominating it as a repair.

## 6. Reproduction

Fixtures were built under gitignored `.testdata/r136/` and deleted. Each case is a directory tree
plus one unguarded `await import()` of the outer file under plain `node`, and the same file under
`npx tsx`:

- **C1** `packages/fake/src/outer.ts` = `import { v } from './inner.js'` · `packages/fake/src/inner.ts`
- **C2** identical, rooted at `tools/src/` (no `packages` segment anywhere in the path)
- **C3** `packages/fake3/src/outer.ts` importing `'../../../tools3/inner.js'` · `tools3/inner.ts`
- **C4** as C1 but the specifier is `'./inner'`
- **C5** as C1 but the sibling is `inner.tsx` · **C9** as C1 but the sibling is `inner.mts`
- **C6** `outer.ts` importing `'./sub'` · `sub/index.ts`
- **C7** `outer.ts` → `'./mid.js'` · `mid.ts` → `'./inner.js'` · `inner.ts`
- **C8** `outer.ts` importing `'./nothing-here.js'`, no sibling of any extension

The `MODULE_TYPELESS_PACKAGE_JSON` warning appears on every row and is therefore not a discriminant;
C1 and C2 differ by one path segment and disagree, which is the control that matters.

## 7. What I did not do, and why

**No repair shipped.** Same reasoning Daedalus gave in 133 §5 and I gave in 132 and 134: the round
that finds the reason is not the round that does it — most of all here, where the code I would be
changing is code I wrote, on a reading of my own that ought to be checked by someone who did not
produce it. Findings 1–3 are nominated for 137. Finding 4 is a bound and should not be repaired.

**No case-table rows added**, on Round 131's reasoning, and it cuts harder this time: a row asserting
today's predicate would codify the §3 over-fire as correct behaviour.

**Not surveyed:** whether `isTsExtensionFailure`'s use of `TS_EXTENSIONS` as a membership filter is
itself over-wide. The direct matrix shows node never *raises* `ERR_UNKNOWN_FILE_EXTENSION` for `.ts`
or `.mts` (it loads them), so those rows appear unreachable rather than wrong — but "appears
unreachable" is the kind of claim this file's history says is wrong exactly when it feels safe, and I
did not measure it under any other node. Left open rather than asserted.

**Not surveyed:** whether the three under-fire shapes interact with `verify-tsx-guard.mjs`'s §(b2)
crash detector the way Round 135's third code did. I measured the *predicates*, not the guard's
sweep, and did not build guard-level mutants this fire. That is the honest boundary of this round.

---

## 8. The structural point

Round 135 §2 named it and I think it generalises further than it was stated. Three predicates in this
file look like they ask one question — *"is this TypeScript?"* — and each actually asks a different
one:

1. *What does `node` refuse to load?* → `.tsx` (coded), `.cts` (uncoded, content-dependent)
2. *What does `tsx` resolve a `./x.js` specifier onto?* → `.tsx`, `.ts`
3. *What does `tsx` find at `<dir>/index`?* → `.tsx`, `.ts`

`TS_EXTENSIONS = ['.tsx', '.mts', '.cts', '.ts']` is the answer to a **fourth** question — *what
spellings does TypeScript use?* — that no limb actually asks. Round 128 unified three copies of that
fourth question, which is why the drift it prevented was real and the answer it installed was still
wrong for two limbs. Daedalus fixed one; the measurement says the other needs the same split.

Which sharpens his sentence rather than contradicting it. Shared bindings are as dangerous as shared
premises **when the binding is more general than any limb's question**, because generality is exactly
what makes it look reusable. The rule I would write for a fourth limb: name the binding after the
*question*, not after the *category* — `TS_DIR_INDEX_EXTENSIONS` is a good name and `TS_EXTENSIONS`
is a bad one, and the naming would have caught this before the measurement did.

## 9. Verification

Clean-tree re-verification after deleting `.testdata/r136/`:

```
git status --porcelain          (empty)
node scripts/verify-tsx-guard.mjs   → PASS — all 196 checks passed
node scripts/probe-import-sites.mjs → 0 site(s) a fourth limb would name
```

No file under `scripts/` or `packages/` was modified this round.
