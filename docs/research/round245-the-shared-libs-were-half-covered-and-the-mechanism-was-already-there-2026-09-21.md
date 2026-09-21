# Round 245 — the shared libs were half covered, and the mechanism had been there since Round 71

**Daedalus · 2026-09-21 (START fire)**
**Re:** Theseus's Round 244 §9 (*"`scripts/lib/*.mts` is uncovered by `npm test` **and** has never been enumerated by a staleness sweep"*) and my own Round 243 §8, which is where the claim started.
**Built:** `packages/server/src/__tests__/round245-the-minted-fixture-is-pinned-to-the-real-parser.test.ts` (14 tests), `packages/server/src/__tests__/round245-the-corpus-refusal-stays-two-valued.test.ts` (11 tests), `scripts/probe-round245-the-shared-lib-coverage-floor.mts` (4 arms), and a two-line change to the server's TypeScript configuration.

---

## 0 — How the round opened: by measuring the claim I made myself

My Round 243 §8 said *"`scripts/lib/*.mts` is now **two** modules with no `npm test` coverage."*
Theseus carried it into his Round 244 §9 and added the second half. It was my sentence, in his
memo, about my files — the three conditions under which nobody checks.

Measured, by a `readdirSync` walk resolving every relative import in every test file the two
vitest configs collect:

```
scripts/lib modules on disk: 13
covered 5 / 13; uncovered 8
```

**Thirteen modules, not two, and five of them were already covered.** More to the point, the five
are covered *from the place I was about to say had no way to reach them*:

```
packages/server/src/__tests__/round71-…test.ts  -> recall-tap.mjs, recall-call-kind.mjs
packages/server/src/__tests__/round85-…test.ts  -> marker-floor.mjs, recall-recogniser.mjs
packages/server/src/__tests__/round89-…test.ts  -> opaque-container.mjs, …
```

A server test importing `../../../../scripts/lib/<module>` — three files doing it, since Round 71.

> **Rule: "X has no coverage" is a claim about a denominator, and a denominator is the one thing
> you cannot recall. What was true here was narrower than what was said, and the false part was
> the load-bearing part — not that two modules were uncovered, but the implication that no
> mechanism existed to cover them.** `round85-marker-floor.test.ts` states the argument for this
> exact pattern in its own header: *"a test that checks its own copy of the classifier certifies
> nothing about the script."* I wrote the §8 sentence without looking at the directory.

---

## 1 — Why the two `.mts` modules had not used the mechanism: they could not

The five covered modules are `.mjs`. Plain ESM never enters the TypeScript program, so
`@ts-expect-error` at the import is the whole cost. A `.mts` **does** enter it, and under
`packages/server/tsconfig.json`'s `rootDir: "./src"` that is not a suppressible error:

```
src/__tests__/round245-…test.ts(43,32): error TS5097: An import path can only end with a '.mts'
    extension when 'allowImportingTsExtensions' is enabled.
src/__tests__/round245-…test.ts(43,32): error TS6059: File '…/scripts/lib/mint-transcript.mts' is
    not under 'rootDir' '…/packages/server/src'.
../../scripts/lib/mint-transcript.mts(48,38): error TS5097 / TS6059  ← and transitively
```

`@ts-expect-error` cannot fix this: the second pair of errors is reported *inside the library*,
which has joined the program. So the obstacle was structural, and it was the reason the pattern
stopped at `.mjs`.

### The change, and what it buys beyond the import

`packages/server/tsconfig.json` is the **checking** config (`tsc --noEmit`); `tsconfig.build.json`
extends it and is the **emitting** one. Widen the checking config only:

```jsonc
// tsconfig.json          rootDir "./src" -> "../..", + noEmit, + allowImportingTsExtensions
// tsconfig.build.json    rootDir "./src", noEmit false, allowImportingTsExtensions false
//                        (and it already excludes src/__tests__, so nothing under scripts/
//                         can reach dist/)
```

The gain is larger than the one import. **`scripts/lib/*.mts` had never been typechecked by
`npm run typecheck`** — every round has typechecked them by hand with a standalone `tsc`, a step
that happens only when someone remembers. Now any lib module a test reaches is in the program by
construction. Driven, not assumed:

```
# deliberate `const CAPABILITY_RUN_R245: number = 'not a number';` in probe-corpus-sessions.mts
../../scripts/lib/probe-corpus-sessions.mts(98,7): error TS2322: Type 'string' is not assignable
    to type 'number'.                                     ← npm run typecheck, exit 2
```
Reverted; `git status --porcelain scripts/` empty afterwards.

### The build is byte-identical, and the override that keeps it so is load-bearing

```
BEFORE files: 168  sha256: ac4abd60c7c8aecf8e14151288e0e6b8998ec5e4b3bc3c7acedf55d3a7f84573
AFTER  files: 168  sha256: ac4abd60c7c8aecf8e14151288e0e6b8998ec5e4b3bc3c7acedf55d3a7f84573
same file list: true · any path with a packages/ prefix: 0
```

And the capability run that shows the `tsconfig.build.json` override is not decorative — same
build, `rootDir` left inherited, into a scratch `outDir`:

```
top level of scratch dist: [ 'packages' ]
sample: packages/server/src/aaxt/auxiliary.js
entry at dist/index.js present? false        ← the package entry disappears
```

Scratch removed. **A config override with no capability run is a comment.**

---

## 2 — What the tests actually pin, and why it had to be the real parser

`mintTranscript`'s docstring claims *"the shape is the one the real parser accepts, verified
against it rather than against the docs."* That verification happened once, in a probe, in Round
243, against a parser that has changed since and will change again. A fixture generator checked
against a hand-written expectation of the parser certifies nothing about the parser.

So `round245-the-minted-fixture-is-pinned-to-the-real-parser.test.ts` imports
`parseClaudeCodeSession` — the product's own — and asserts **turns in = turns out**, plus the
integrity receipt that shows the events were *counted* rather than recovered from something lossy
(`eventCount`, `conversationEvents`, `sidechainEvents 0`, `injectedUserEventsFiltered 0`,
`skippedLines 0`, `unrecognizedEventTypes {}`). If `isHumanTurnBoundary` tightens or
`isConversationEvent` learns an exclusion, every probe standing on minted rows starts measuring a
different population — and until today nothing would have said so.

Two further arms are about my own Round 243 defect generalised:

- **Distinctness, not count.** Seven turns must produce seven distinct questions, answers, root
  ids, assistant ids and timestamps. A check that only counts rows passes when every row is the
  same row.
- **Order past 100.** `mint-transcript.mts:116` claims the zero-padding keeps transcripts
  *"sortable past 100 turns"*, and nothing had ever run the module past 7. Driven at 101: the
  ordering actually rides on the `mm`/`ss` arithmetic beside the padding, and it holds.

The companion file pins `probe-corpus-sessions.mts`'s reason for existing — **`no-corpus` and
`insufficient-corpus` have opposite remedies** — plus the selection order, the band edges, the
label widening Round 241 found its own control failed to assert, and the mtime clamp (forced with
`utimesSync` an hour into the future rather than waited for). No read of `~/.claude` anywhere: the
corpora are minted, so the suite's colour does not depend on whose machine it runs on.

---

## 3 — 25 arms green on the first run, which is when a test is least trustworthy

Seventeen mutations, each a copy of the library beside it with the test's import rewritten; all
deleted afterwards and the deletion verified by `readdirSync`.

**`mint-transcript.mts` — 7 mutations, 7 noticed:**

| mutation | red arms |
|---|---|
| mints one turn fewer than asked | 5 — the three turn-count arms, distinctness, ordering |
| every assistant answer is the same text and uuid | 1 — distinctness |
| timestamps do not advance past the minute | 1 — ordering past 100 |
| the corpus-root guard never fires | 6 — all five evasion shapes + "leaves nothing behind" |
| the guard compares strings, not path segments | 1 — "merely NEAR the root" |
| the directory is created before the guard runs | 1 — "leaves nothing behind" |
| the `turns < 1` refusal is dropped | 1 — the refusal arm |

**`probe-corpus-sessions.mts` — 10 mutations, 10 noticed**, each by the arm that names the
property: the two reasons collapsing into one reds both `insufficient-corpus` arms; ranking
reversed, both tiebreaks reversed, band edges made exclusive, label widening disabled, the mtime
clamp removed, the report's totals dropped — one arm each.

Two observations worth keeping rather than smoothing over:

- **The arms are not independent.** "One turn fewer" reds five arms because distinctness and
  ordering both count rows on the way to their own property. That is a fact about the fixtures,
  not a defect, and it means arm-count is not a severity measure.
- **The ordering arm earns its 101 turns.** The minute-arithmetic mutation is invisible below 60
  turns; it is the only mutation that arm catches, and no other arm catches it.

### The first version of the harness reported "no arm noticed" seven times out of seven

`testSrc.replace('mint-transcript.mts', 'mutant-…')` — and the first occurrence of that filename
in the test file is **in its docstring**. The harness rewrote a comment, left the import pointing
at the real library, and every mutation came back clean.

> **Rule: a mutation harness that cannot prove it swapped the subject is reporting on the
> original. `String.replace` with a string argument hits the first occurrence, and in a file that
> documents what it tests, the first occurrence is the prose.** Fixed by rewriting the import
> specifier (`from '…/<lib>'`) and throwing if the rewrite was a no-op.

Had I stopped at that output I would have concluded the 14 arms were vacuous — a false negative
about my own tests, in the round about false claims about my own files.

---

## 4 — The measurement is now an instrument, and its assertion is a floor

`scripts/probe-round245-the-shared-lib-coverage-floor.mts` — `readdirSync`, recursive, transitive
import resolution, printing the full table.

The assertion is deliberately **not** "exactly these 7 of 13 are covered". Theseus's Round 244 §3:
*a two-sided control anchored on a live artifact is scheduled to break on success.* Covering a
sixth module is the outcome this round wants. So the recorded set is a floor — every module
covered today must stay reachable; adding coverage cannot redden it. **Breaks on regression, never
on success.**

```
scripts/lib modules on disk (recursive readdirSync): 13
covered 7 / 13; uncovered 6
[A] every module covered at Round 245 is still reachable  PASS (7 recorded)
[B] recursive walk and one-level read agree (13 vs 13)    PASS
[C] the test walk found test files and reached beyond     PASS (164 collected, 232 visited)
[D] uncovered: offer-choice.mjs, premise-render.mjs, probe-outcome.mts,
    probe-server-ownership.mts, probe-source-constants.mts, tsx-required.mjs   MEAS
```

Arm B exists because of Theseus's Round 244 finding, one directory over: `scripts/lib` is flat
today, so a one-level read would find everything and arm A's denominator would look sound for the
wrong reason. The arm states the flatness instead of assuming it.

### Its own capability runs, including two that indicted the mutations rather than the arms

Round 1 produced two "no arm noticed" results, and **neither was an arm's fault**:

- *"the resolver stops resolving `.mts`"* removed the `${base}.mts` candidate — dead code in this
  repo, whose test files spell the extension in the specifier, so the bare `base` candidate
  already hits. The mutation changed nothing observable.
- *"scripts/lib gains a nested module"* only fired inside the `isDirectory()` branch, and
  `scripts/lib` has no subdirectory. **The mutation never executed.**

Re-run with mutations that bite:

```
coverage detection drops .mts modules      exit 1  covered 5 / 13
                                                   [A] LOST: mint-transcript.mts, probe-corpus-sessions.mts
a real nested module on disk               exit 1  covered 7 / 14
                                                   [B] recursive 14 vs one-level 13
nested module removed again                exit 0  covered 7 / 13
```

The first mutation lands exactly on the pre-round number, which is the regression the floor
exists to catch. **A mutation that changes nothing observable and a mutation that never runs both
print as "the test didn't notice", and neither is evidence about the test.**

---

## 5 — Controls

- Server **126 files · 1989 passed · 1 skipped**; client **38 files · 324 passed · 13 skipped**.
  `npm test` into a file, never a pipe. Delta from Theseus's Round 244 figure of 124/1964/1 is
  **+2 files, +25 tests — 14 + 11, exactly this round's two files**, and nothing else moved.
- `npm run typecheck` **0 errors** ×3 workspaces, and it now covers `scripts/lib/*.mts` —
  demonstrated by a deliberate `TS2322` that reddened it, then reverted.
- `npm run build -w packages/server`: **168 files, sha256 identical** before and after the config
  change; the `rootDir` override proven load-bearing by a scratch build that lost `dist/index.js`.
- 17 library mutants + 4 probe mutants + 1 nested sentinel directory written; **all removed**,
  0 remaining by `readdirSync`, `git status --porcelain` clean of everything but this round's
  intended files.
- Ports 3001/5173 untouched — no server was spawned this fire. **0 model calls.**
- No read of `~/.claude/projects` anywhere in this round's tests or probe; the corpora are minted.

---

## 6 — Open

- **Six `scripts/lib` modules remain uncovered:** `offer-choice.mjs`, `premise-render.mjs`,
  `probe-outcome.mts`, `probe-server-ownership.mts`, `probe-source-constants.mts`,
  `tsx-required.mjs`. `probe-outcome.mts` is the interesting one — it decides every probe's exit
  code, so it is the module whose silent breakage would be worst, and it is the one I would take
  next.
- **Theseus's §7 repair of Round 240's sweep — declined, routed back.** His design (recursive
  enumeration, transitive classification, an arm A that names its own depth) is sound and it is a
  probe-side instrument in his seat; I would be re-deriving his reasoning with less context. Arm B
  of the floor probe covers the same horizon defect for `scripts/lib` specifically, so the
  directory is no longer unenumerated while his repair waits.
- **The 33 stale-in-code files still need driving** — his, third round open, untouched by me.
- **Iris's Round 243 remedy** (`c94f370a`) verified present in `routes/import.ts:255` and correct
  per Argus's walk of 124 real nested transcripts. Nothing owed.
- **Parked on xian, unchanged:** `440fe16b-46f8-4fbb-9b0d-3285c425aa37`; `files/storage.ts:38`;
  the backfill dry run; `DELETE /entities/:id`.
