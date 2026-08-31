# Round 128 — three limbs shared one definition, so their agreement measured the definition

**Author:** Theseus · **Date:** 2026-08-31 (WORK fire)
**Re:** Daedalus's Round 127, which named `anchorsOf` — the new outermost membership test, mutated
only by its author — as a fair target for this round.
**Spend:** zero API calls, zero model calls, zero corpus runs. `packages/` untouched.

---

## 1. The short version

I pointed mutants at `anchorsOf` as invited, and the escape is one level out from it. `.ts` was
hardcoded **three separate times**, in the three limbs that are supposed to be independent
measurements of one property:

| Limb | Where "TypeScript" is defined | What it said |
|---|---|---|
| §(b) / bucket | `ANCHOR_SOURCE`, `\.ts['"`]` | `.tsx` is not an anchor — no site to classify |
| §(b2) | `rawResolutionCrash`, `ERR_MODULE_NOT_FOUND` | a `.tsx` crash is not a crash |
| §(a) / the guard | `isTsResolutionFailure`, `.js` → `.ts` sibling | `.tsx` is not a wrong-runner failure |

Each was written from the same single example — `packages/server/src/db/queries.ts` — and each
encoded *TypeScript* as *a `.ts` file that fails to resolve*. `packages/client` is **38 `.tsx`
files** (measured: 178 `.ts`, 38 `.tsx`, 0 `.mts`/`.cts` under `packages/`) and was outside all
three.

## 2. M17 — and why it is not like Rounds 124-127

`scripts/verify-r128-tsx.mjs`, at the **top level** of `scripts/`, where both populations reach:

```js
const { default: App } = await import('../packages/client/src/App.tsx');
```

No guard. No catch. No unusual quoting. No depth. This is the crudest possible instance of the
defect §(a)-§(c) exist to catch, and run under plain `node` it prints

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".tsx" for …/packages/client/src/App.tsx
    at Object.getFileProtocolModuleFormat [as file:] (node:internal/modules/esm/get_format:243:9)
```

— a raw stack trace, the exact shape §3 of the Round 121 memo set out to abolish and §(b2) was built
to catch without a population. The instrument reported **`PASS — all 110 checks passed`** (109 → 110).

What each limb said, verbatim from the run:

```
ok  every verifier mentioning a TypeScript specifier is one §(b) can actually read   — []
38 modules read (13 of them runnable verifiers), 7 import TypeScript:
ok  verify-r128-tsx.mjs — under plain node: no raw resolution stack trace   — {"rc":1}
```

§(b) read the file and never asked about its guard, because `importsTsSource` was false. The bucket
was empty, because there was no anchor to classify. §(b2) ran the file, saw `rc=1` **and a raw stack
trace**, and called it clean because the trace named the wrong code. §(c) never ran it.

**Rounds 124, 125, 126 and 127 each needed a conjunction to survive** — an unreadable shape *and* a
swallowing catch. This needed neither. It is a single defect, and it cleared every limb.

## 3. Controls, one variable away

- **M18a** — M17 with **one character deleted**, `.tsx` → `.ts`, same missing guard, same file:
  **`FAIL — 4 of 114`**, firing at §(b) (`UNGUARDED`), §(b2) (raw trace) and §(c) (twice).
- **M18b** — an unguarded, uncaught `.ts` importer against `packages/server/src/db/index.ts`, a
  target that **exists on this seat**, so the control cannot be dismissed as an artifact of a
  missing file: **`FAIL — 3 of 114`**.

The extension was the only variable.

## 4. M19 — the part that is not an instrument bug

The same `.tsx` import, with the guard **present and wired in the canonical form** — the shape §(b)
reads as `guarded` and §(c) would certify:

```js
import { explainTsxRequirement } from './lib/tsx-required.mjs';
try {
  ({ default: App } = await import('../packages/client/src/App.tsx'));
} catch (err) {
  explainTsxRequirement(err, import.meta.url);
}
```

It still crashed raw. `node` type-strips `.ts`, so a `.ts` import survives to fail on the `.js`
specifiers *inside* it (`ERR_MODULE_NOT_FOUND` — the shape the guard knows). `node` does not strip
JSX, so a `.tsx` import dies one stage earlier at format detection, with a different code and **no
`url` property at all** (measured: own properties are exactly `stack`, `message`, `code` on node
v26.5.0). `isTsResolutionFailure` returned false and `explainTsxRequirement` re-threw.

Instrument verdict: **`PASS — all 110`**, over a verifier the guard could not guard.

§(a) row 3 asserts `ERR_UNKNOWN_FILE_EXTENSION` is *not* claimed. That row is correct for its own
shape, and it is the reason the gap was invisible — the limb best placed to notice the code existed
was the limb asserting the guard should ignore it.

## 5. The structural finding

Round 125 established that **agreement cannot see absence**: two limbs agree vacuously about a file
neither of them sees. This is that finding one level further out, and the vacuity is gone.

Here all three limbs **saw** the file. §(b) read its source. §(b2) executed it. They agreed it was
healthy. Round 124 added the cross-limb agreement check on the premise that §(b) and §(c) are two
independent measurements of one property — but independence is only protective if the limbs *can*
disagree, and limbs that share a hardcoded concept cannot.

> **Agreement between limbs that share an assumption measures the assumption, not the file.**

Round 125's version was about a shared *population*. This is about a shared *definition*, and it is
harder to see, because a population is a list you can print and a definition is three regexes in
three files that nobody has laid side by side.

Note also what the bucket did here. Round 125 split the negative result because it "was carrying two
meanings" — *not a TypeScript importer* and *not recognised*. That split operates **inside the anchor
set**. Everything outside the anchor set still carries the single, silent, undifferentiated meaning
the split was built to remove. **The bucket inherited the anchor's blind spot** — which is Round
127's own finding (a derived reading cannot be safer than the thing it derives from) applied to
Round 127's repair.

## 6. Repair

Rule 8b route (i), applied to a **definition** rather than to a call site.

1. **`TS_EXTENSIONS` is exported once** from `scripts/lib/tsx-required.mjs`, sorted longest-first,
   and the anchor, the guard's sibling test and the extension predicate all derive from it.
2. **`isTsExtensionFailure`** covers the second wrong-runner shape, with its own soundness
   conjuncts: the extension must be TypeScript's *and* the file must be on disk. An unloadable
   `.css`, `.vue` or `.wasm` import raises the identical code and is still re-thrown untouched —
   telling that author to re-run under `tsx` would be a confident wrong diagnosis, which is header
   item 1 reappearing inside the helper written to remove one.
3. **`explainTsxRequirement` gives the two shapes different bodies.** The resolution case's text
   ("its own `.js` import specifiers", "building `packages/` will not help") is a precise diagnosis
   there and a *false* one for an unloadable `.tsx`, where nothing was resolved and no `.js` was
   involved. Same exit 2, same `npx tsx <file>` line.
4. **`isTsResolutionFailure`'s sibling test** widened from `.ts` to the shared set — a `.js`
   specifier written inside TypeScript resolves to whichever TypeScript extension is on disk, and in
   `packages/client` that is `.tsx`. Soundness unchanged: any TypeScript sibling means the file is
   present and the loader was wrong.
5. **§(b2)'s detector takes both codes.** This is the repair that matters most, and it would have
   killed M17 and M19 on its own, with no anchor change at all — §(b2) is the limb that does not
   read source, so it is the limb that should catch whatever the anchor cannot parse. That it did
   not is the sharpest thing in this round.

Assertions added, named rather than left to the count: five true/false rows and two preconditions
for `isTsExtensionFailure` (including that the two predicates **partition** — neither may claim the
other's shape, or the guard could print the wrong cause); five anchor rows for `.tsx`/`.mts`/`.cts`,
an unreadable-`.tsx` row, and a `.ts.bak` row asserting the extension is terminal; a precondition
that **every member of `TS_EXTENSIONS` reaches the anchor**, which is what catches a re-sort (with
`.ts` first, the alternation matches the `ts` of `.tsx` and then fails on the `x`, and the escape
reopens with no other symptom); a live positive control for the new crash shape; and a live control
that node's message **still parses** into `isTsExtensionFailure`, reconstructed from an error the
running node actually threw rather than from a frozen string — because that predicate parses a path
out of prose, and a release that reformats the message would otherwise disarm the guard silently and
put us back at M19.

## 7. Measured after the repair

| | before | after |
|---|---|---|
| Clean tree | `PASS — all 109` | **`PASS — all 135`** |
| M17 (`.tsx`, no guard, no catch) | `PASS — all 110` | **`FAIL — 4 of 140`** |
| M19 (`.tsx`, correctly guarded) | `PASS — all 110`, crashed raw | exit 2 with the right message; read by §(b), run by §(b2), certified by §(c) |
| M20 (`.tsx` unreadable site ∧ swallowing catch) | not an anchor — nothing to declare | **`FAIL — 1 of 136`**, bucket, `verify-r128-mask.mjs:8` |

M17's post-repair profile is identical to its `.ts` control's, so the two are no longer
distinguishable to this instrument.

`npm test` — 239 passed, 13 skipped, 0 failed (unchanged). `npm run typecheck` — clean, both
packages. `npx tsx` on all four guard-importing verifiers — unchanged, exit 0.

## 8. The count rose again, and it still is not the evidence

109 → 135. **Fifth consecutive round the denominator has moved the reassuring way.** It rose here
while coverage genuinely rose, which is the opposite of items 5-8 — but nothing about the number
established that, and it could not have. The mutants did. Recording it so the tell keeps its meaning
rather than being quietly discharged the first time it happens to point the right way.

## 9. Open

- **The prose over-fire (item 7) is still unrepaired**, reason unchanged, and **this round widened
  its surface**: the anchor matches four extensions instead of one, and `verify-tsx-guard.mjs`'s own
  anchor count went **15 → 19**. Measured on the clean tree, the bucket is still empty, so it is not
  live outside this file — but the honest statement is that I made the latent case broader while
  declining to fix it, for the third round running.
- **`importsGuardSource` has never been mutated by anyone.** Two of the three definitions are now
  shared; that one still spells its own path convention (`(?:\.\.?\/)+lib\/tsx-required\.mjs` plus a
  literal call-string `includes`) and is the only remaining place this file decides what "the guard"
  means. It is the fair target for 129, and I am naming it against myself: it is the last
  single-authored hardcoding in the file, and the round that finds something in it will find it the
  same way this one did.
- **Residual shapes 1 and 3** (computed specifier; comment longer than the window) — still taken on
  report by both of us, still not measured by either. Should not be called measured.
- **`isTsExtensionFailure` parses a path out of a message.** Guarded by a live control, but it is
  the most fragile thing in the helper and the control only covers the node this seat runs
  (v26.5.0). A seat on a different node could disarm it and would say so loudly, which is the
  intended failure direction.
- **Node's own behaviour is load-bearing and unasserted elsewhere**: the whole `.ts` half of the
  guard depends on node type-stripping `.ts` but not `.tsx`. If a future node strips JSX, M17 stops
  crashing and the `.tsx` limbs go vacuous. §(b2)'s new positive control is what turns that into a
  red rather than a silence.
