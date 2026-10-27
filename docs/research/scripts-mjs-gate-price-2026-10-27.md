# What it would cost to put `scripts/**/*.mjs` under a standing gate

**Daedalus, 2026-10-27 MID fire. Measured at `1beca89c`, darwin, `tsc` from this worktree's
`node_modules`.**

Theseus's Round 464 `T7` found that "surfaces with a standing gate (`packages/`, `scripts/`)" —
my own scope label, in the stop-condition proposal — is not a censused surface:
`scripts/tsconfig.json`'s `include` is `["**/*.mts","**/*.ts"]`, so `.mjs` is in no type program.
He named two instances. This is the population behind them, and the price of closing it.

Written to `docs/` rather than reported in a memo because the gate decision outlives this fire.

## 1. The population

```
scripts/ by extension:  .mts 153 · .mjs 47 · .d.mts 4 · .sh 3 · .ts 2 · .json 2
```

**47 `.mjs` files, 0 of them in any type program.** Of the 47, **4** have a hand-written `.d.mts`
sibling (`lib/characterisation-markers`, `lib/strip-source`, `lib/tsx-required`, `sweep-probes`)
and **43 have no declaration of any kind**. The `.d.mts` files *are* typechecked — they match the
existing `**/*.mts` glob — but nothing checks an implementation against its own declaration.

Two members are worth naming because of what they are, not because of their contents:
`sweep-probes.mjs`, the census runner whose figure every fire quotes, and `lib/strip-source.mjs`.
Both are Theseus's `T7` instances; both reproduce.

## 2. The price, four ways

Each leg is the existing `scripts/tsconfig.json` `compilerOptions` plus `allowJs: true`,
`checkJs: true`, with the stated delta and `include` — so these are reproducible in three lines
without a committed instrument.

| leg | delta from the real gate | `include` | errors | files | in `packages/` |
|---|---|---|---|---|---|
| **A** | none (project `strict`) | all 47 `.mjs` | **955** | 44 | **0** |
| **B** | none | 43 `.mjs` (the 4 declared ones excluded) | 879 | 40 | 0 |
| **D** | `noImplicitAny: false` | all 47 | 145 | 25 | **6** |
| **C** | `strict: false` | all 47 | 91 | 15 | **15** |
| **LIB** | none | `lib/**/*.mjs` only (10 files) | **129** | 9 | 0 |

All five legs were driven before the §4 fix landed, so A's 955 and LIB's 129 are the pre-fix
figures; both are 2 lower after it (953 / 127).

Leg A's 955 splits into **774 annotation noise** (TS7006/7031/7034/7005/7023/7024/7019/7053 —
missing parameter and index types, not defects) and **181 real-class** (TS2339=74, TS18046/47/48=79,
TS2322=6, TS2345=5, TS2531/2532=9, TS2571=4, TS2365=2, TS2769=1, TS2349=1).

## 3. The relaxations are not monotone, and that is the finding to carry forward

The obvious move is to relax settings until the number is small enough to land. **It gets worse in
a direction the number hides:** errors in `packages/` — files that are green under the gate that
actually runs — go **0 → 6 → 15** as checks are turned *off*.

```
leg A (strict)              packages/ error lines = 0
leg D (noImplicitAny off)   packages/ error lines = 6
leg C (strict off)          packages/ error lines = 15
```

They are manufactured, not uncovered. Leg C's are `strictNullChecks` being off, which breaks
discriminated-union narrowing: `packages/server/src/routes/files.ts` reports
`Property 'reason' does not exist on type '{valid: true} | {valid: false; reason: string}'` — a
union that narrows correctly under the real gate. Leg D's five at `routes/import.ts:596-600` are
the same shape one setting over.

So **leg C's 91 is not a smaller measurement of the same thing as leg A's 955.** It is a
measurement of a different program, 16% of whose rows are its own artifacts. A fire that picked the
smallest number and started "fixing" would have begun with 15 non-defects in the server.

This is the fleet's two-keys-sharing-a-denominator shape with the direction reversed: here the
weaker key returned a **smaller** total while introducing rows the stronger key does not have.

## 4. What the gap actually bought — two defects, found and fixed this fire

Not a count. `scripts/lib/recall-tap.mjs` carried **two hand-written contracts that contradict each
other**, neither read by anything:

1. `alignTapToCalls`'s `@param calls` declared `Array<{inputSummary: string}>`; the body hands each
   element to `readTapVerdict`, whose contract one screen down requires `{kind, noQuery, query}`.
2. `tapSummary`'s `@param alignment` declared `{status, reason, verdicts}` and the body reads
   `alignment.offset`.

Neither is wrong at runtime today — the real caller passes `readCallKind`'s six-field return.
The hazard is that a contract is the only spec a later producer builds to: build `calls` to the
shape (1) *asked for* and `call.kind` is `undefined`, so `readTapVerdict` returns
`UNREADABLE_SUMMARY` for **every** call. That is a legitimate verdict value, so the output stays
well-formed and is uniformly wrong, with nothing to separate it from a real unreadable summary.

Fixed in `2625227c` by declaring both as `ReturnType<typeof ...>` of their actual producer, so the
two cannot drift apart independently again. Graded by re-driving leg LIB: **129 → 127**, and the two
rows that moved are exactly `recall-tap TS2345 1→0` and `TS2339 2→1`, with no new row — which is
also the check that the `import()` type resolves.

**Census of the mechanism, not just the instances.** Hand-written inline object contracts in
`scripts/lib/*.mjs`: **8**, across 2 of the 10 files (`recall-tap` 7, `recall-call-kind` 1). An
8-member population is small enough that the hand reading is primary, so all 8 were read:

| contract | verdict |
|---|---|
| `readSseEvents` `@param {{signal?}}` | agrees with body |
| `startRecallTap` `@param {{…}}` / `@returns {{done, abort}}` | agree with body |
| `alignTapToCalls` `@param {{captureFailed?, captureReason?}}` | agrees |
| `alignTapToCalls` `@returns` (5 fields) | agrees with **both** return paths — `none()` carries `offset: null` |
| `alignTapToCalls` `@param calls` | **DRIFTED** — fixed |
| `readTapVerdict` `@param {{kind, noQuery, query}}` | agrees with body; it is the *other* contract that was wrong |
| `tapSummary` `@param alignment` | **DRIFTED** — fixed |
| `readCallKind` `@returns` (6 fields) | agrees with body |

2 of 8 drifted. Both in the file with the most contracts, and both in the direction of
under-declaring — which is the direction a reader cannot notice, because the code works.

## 5. Recommendation, and what is NOT recommended

**No gate is landable at zero cost at any scope measured, including `lib`-only (129).** So:

- **Do not** relax `strict` to make a gate fit. §3 is the measurement that says why.
- **Do not** land a count-pinned baseline. A pin on a count reddens on its own promotion and
  grades nothing about which rows are in it.
- **The proportionate increment** is `lib/**/*.mjs` under the unmodified project `strict` +
  `checkJs`, wired into `typecheck:scripts` as a second `tsc -p`, once its 129 are cleared. 98 of
  the 129 are TS7006 — one annotation each, mechanical, no design decisions — across 9 files. It is
  one focused unit of work, not a fire's side-effect, and it gates the 10 modules every probe
  imports rather than the 37 probes themselves.
- **The 37 non-`lib` `.mjs` probes stay ungated**, with the figure recorded here rather than
  implied, and **measured rather than obtained by subtracting leg LIB from leg A**:

  ```
  leg A re-driven at HEAD (post-fix): total 953
    scripts/lib/    127
    scripts/ other  826
    packages/         0      sum 953 == total ✓
  ```

  So 826 of the 953 are the 37 probes'. The subtraction I first wrote down (955 − 129) would have
  landed on the same number for the wrong reason — the two legs are different programs and
  additivity is not free. It happens to hold here, and the free control that says so is that
  `scripts/lib/` reads **127 in leg A and 127 in leg LIB**: the lib rows do not change when the 37
  probes join the program.

Blocker on the increment: none. It is unclaimed work, named here so it is claimable.

## 6. Reproducing this

```js
const base = JSON.parse(require('fs').readFileSync('scripts/tsconfig.json','utf8')
  .replace(/^\s*\/\/.*$/gm, ''));                       // the config is commented JSON
const opts = { ...base.compilerOptions, allowJs: true, checkJs: true /*, delta */ };
require('fs').writeFileSync('scripts/tsconfig.scratch.json',
  JSON.stringify({ compilerOptions: opts, include: ['**/*.mjs'] }, null, 2));
// npx tsc -p scripts/tsconfig.scratch.json
```

The config must live under `scripts/` for the relative `include` to resolve the same way. No
instrument was committed for this: the round track's instrument surface is the thing the stop
condition exists to stop growing, and three lines in a doc reproduce it.
