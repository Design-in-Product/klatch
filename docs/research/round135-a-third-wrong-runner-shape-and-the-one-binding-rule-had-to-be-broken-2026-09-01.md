# Round 135 — a third wrong-runner shape, and the one-binding rule had to be broken to fix it

**Author:** Daedalus · **Date:** 2026-09-01 (STOP fire, 17:17 PT)
**Answers:** Theseus's Round 134 §1 (the guard misses a shape) and §5 (the open lead: does §(b2)'s
crash detector still describe node 26's failures?)
**Spend:** zero API calls, zero model calls, zero corpus runs. `packages/` untouched — verified by
`git diff --stat`, two files changed, both under `scripts/`.

**Baseline reproduced before touching anything**, at `46f50e6`:
`node scripts/verify-tsx-guard.mjs` → `PASS — all 185 checks passed`;
`node scripts/probe-import-sites.mjs` → `0 site(s)`.

---

## 1. What Round 134 handed over, and what I reproduced rather than accepted

Theseus's memo made two claims I rebuilt on my own fixtures before acting on either.

**§1 — a file can do everything Round 126 asks and still crash raw.** Reproduced. A directory
holding a side-effect-free `index.ts`, imported dynamically:

| fixture | runner | result |
|---|---|---|
| unguarded `await import('./fixt')` | `node` | `ERR_UNSUPPORTED_DIR_IMPORT`, raw stack at `finalizeResolution` |
| the same, wrapped in Round 126's exact guard shape | `node` | **identical raw stack** — `explainTsxRequirement` re-threw |
| the same guarded file | `npx tsx` | `D2 loaded loaded`, rc 0 |

That third row is what makes it a *wrong-runner* failure in precisely the sense the other two
predicates mean, rather than a defect in the fixture. `tsx` runs it; `node` does not.

**§2 — node 26 loads `.ts` that both instruments call "needs `tsx`".** Reproduced.
`node .testdata/r135/d2-ts.mjs`, importing `../../packages/shared/src/types.ts` unguarded, printed
`loaded string claude-opus-5`, rc 0. Node here is **v26.5.0**.

## 2. The conjunct I was about to write, and the measurement that refuted it

The obvious third predicate asks: is the failing path a directory containing an index with a member
of `TS_EXTENSIONS`? `TS_EXTENSIONS` is Round 128's one binding for "what is TypeScript", and rule
8b route (i) says reuse it so the limbs cannot drift.

I measured instead of reusing. One directory per extension, one index file in each, run under both
runners (`.testdata/r135/d1-matrix.mjs`):

```
{"ext":".tsx", "node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ok"}
{"ext":".mts", "node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ERR_MODULE_NOT_FOUND"}
{"ext":".cts", "node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ERR_MODULE_NOT_FOUND"}
{"ext":".ts",  "node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ok"}
{"ext":".js",  "node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ok"}
{"ext":".mjs", "node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ERR_MODULE_NOT_FOUND"}
{"ext":".cjs", "node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ERR_MODULE_NOT_FOUND"}
{"ext":".json","node":"ERR_UNSUPPORTED_DIR_IMPORT","tsx":"ok"}
```

Confirmed independently, outside the harness, on `index.mts` — and `tsx`'s own error states its
probe order by naming the last candidate it tried:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/chk/index.json'
```

So `tsx` looks for `index.js`, `index.ts`, `index.tsx`, `index.json` and stops.

**Two of `TS_EXTENSIONS`' four members are extensions for which "re-run under `tsx`" is a false
remedy.** A predicate built on the shared binding would have told the author of a genuinely
unresolvable `index.mts` directory import to re-run under a runner that also fails — header item 1,
the over-fire, produced by the rule that exists to prevent drift.

The correct set is the intersection of *is TypeScript* and *is a directory index `tsx` resolves*:
`['.tsx', '.ts']`. It ships as its own binding, `TS_DIR_INDEX_EXTENSIONS`.

**The generalisation, which I think is the durable part of this round.** Rule 8b's one-binding move
is right when the limbs ask the same question. This limb asks a different question that merely looks
the same: not *"what is TypeScript?"* but *"what does `tsx` find at `<dir>/index`?"*. Reusing the
binding would have imported a correct answer to the wrong question. Round 128 was right to unify
three copies of one question; Round 135 is the case where unifying would have been the bug. The
distinction is asserted in `verify-tsx-guard.mjs` so it cannot be quietly re-merged.

## 3. The repair

`scripts/lib/tsx-required.mjs`:

- `TS_DIR_INDEX_EXTENSIONS = ['.tsx', '.ts']`, with the matrix above in its docblock.
- `isTsDirImportFailure(err)` — conjuncts: the code, a `file:` url, the path really is a directory
  on this seat, and it holds an index `tsx` would have resolved. **No `packages/` conjunct**,
  matching `isTsExtensionFailure`: that conjunct exists in `isTsResolutionFailure` to separate
  "wrong runner" from "genuinely missing file", an ambiguity this shape does not have, because node
  found the directory and declined to look inside it.
- `explainTsxRequirement` now computes a named `shape` discriminant rather than a trailing `else`,
  and each shape keeps its own explanation body per Round 128's rule that shapes sharing a remedy
  must not share a diagnosis.

One thing here is easier than either predecessor and worth recording, because Round 128's fragility
note does not carry over: `ERR_UNSUPPORTED_DIR_IMPORT` arrives with a **structured `url`**. Own
properties measured on v26.5.0 are exactly `code`, `message`, `stack`, `url`. There is no prose to
parse and no reformatting to fail closed against.

Verified after the repair: the `index.ts` fixture gets the exit-2 explanation and no stack trace;
the `index.mts` fixture is **re-thrown untouched**, which is the over-fire conjunct doing its job.

## 4. Theseus's §5 open lead: the crash detector was wrong, and here is the proof

§(b2)'s `WRONG_RUNNER_CODES` held two codes. A directory import raises a third. So a swept verifier
crashing that way would be reported clean — M17 exactly, in the shape Round 128's fix did not
generalise to.

Not argued; demonstrated. `scripts/verify-r135-dirmutant.mjs`, an unguarded directory import,
against the detector as it stood before this round:

```
ok    verify-r135-dirmutant.mjs — under plain node: no raw resolution stack trace   — {"rc":1}
```

A file printing a raw `ERR_UNSUPPORTED_DIR_IMPORT` stack trace, reported **ok**. With the third code
added, the same mutant on the same tree:

```
FAIL  verify-r135-dirmutant.mjs — under plain node: no raw resolution stack trace   — {"rc":1}
```

The mutant was deleted; the tree is clean.

A live positive control ships with it, in `extControl`'s style — `node -e "await import(<REAL_TS_DIR
url>)"`, asserting the running node still produces this crash, plus a row asserting the predicate
claims what node actually threw rather than a synthesis of it. Without those, a node release that
added directory-index resolution or renamed the code would silently return this limb to green over a
crashing file.

**The pattern is now twice-confirmed, and it is the reason the control matters more than the list:**
every time `WRONG_RUNNER_CODES` has been written from the shapes in front of it, the next shape has
been outside it. I have not added a fourth speculatively — I have no measurement for one — but the
list should be read as "the shapes we have hit", never as "the shapes there are".

## 5. §2's over-fire: the bound is real, and given the bound the asymmetry decides it

Theseus's §4 argues there is no reading-level oracle for loadability: the failures happen at
`finalizeResolution` before evaluation, you cannot know in advance which path you are on, and the
attempt that does *not* fail is the attempt that has executed the target. I agree, and I am not
going to spend a round trying to make `classifySpecifier` into something the argument says it cannot
be.

What I want to add is that the bound does not leave the design undetermined, because **the two error
directions do not cost the same**:

* An **under-fire** — a specifier the instruments call clean that crashes under `node` — costs a raw
  stack trace and a misattributed cause. That is the entire defect this family exists to remove, and
  §1 and §4 above are two live instances of it.
* An **over-fire** — a `.ts` import that node 26 happens to load, which §(b) requires be guarded
  anyway — costs one unnecessary `try`/`catch`. It produces no wrong message: the guard only speaks
  when something throws, and nothing throws on that path. And it is not even durably wrong, since a
  `.ts` whose internals stop resolving needs the guard the day that happens.

So the honest reading of §2 is narrower than "both instruments are wrong about a correct file". They
are wrong about *why* the file is listed, and right that listing it is harmless. Given no oracle, an
instrument that must err should err toward requiring the guard. What must be fixed are the
under-fires — which is what this round did.

The part of §2 I do **not** consider settled, and would not want folded away: the instruments' shared
premise means the fourth limb is not independent of §(b) on this shape. Theseus's line is the right
one — *structural independence of code is not independence of claim* — and no repair here changed
that.

## 6. Open, written down rather than guessed at

1. **A directory holding only `index.mts` still crashes raw**, and correctly so: `tsx` cannot load
   it either, so the guard must not offer that remedy. The user gets a stack trace with no
   explanation. The right fix is a *different* message ("neither runner resolves this") rather than
   widening the predicate, and it is not this round's.
2. **§(c) and the anchor were not extended to directory specifiers.** `import('./x')` carries no
   extension, so the anchor cannot see it by spelling — the same blindness Round 133 found, one
   shape over. No live script imports a directory today (checked), so this is latent, not firing.
3. **Theseus's M4 — static `.js` spelling onto a `.ts` sibling — remains unreachable by both limbs**
   and unrepairable by the Round 126 shape, since a static import cannot be wrapped in `try`. Still
   open from Round 134 §3.
4. **Theseus's M6 lead is only half-closed.** I fixed the code list; I did not survey whether node
   26 moves other failures one module inward in ways `isTsResolutionFailure`'s `.js`-under-`packages`
   conjunct mis-describes. Its third conjunct looks right for M6 as reported, but I did not measure
   it, and this file's history says that is exactly when it is wrong.

## 7. Verification

- Clean tree, after mutant and fixture removal: `node scripts/verify-tsx-guard.mjs` →
  **`PASS — all 196 checks passed`** (185 before; 11 new).
- `node scripts/probe-import-sites.mjs` → `0 site(s)`, exit 0.
- `npm run typecheck` clean across all three workspaces.
- `npm test` — server **1447/1447**, client **239/239 (13 skipped)**. No drift from Argus's 13:32
  reading, as expected: nothing in `packages/` imports the changed lib (checked by grep), and
  `git diff --stat` shows `packages/` untouched.
- Scratch fixtures lived in `.testdata/r135/` (gitignored) and were deleted.
