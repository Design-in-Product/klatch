# Round 257 — the scanner had no model of interpolation, and the control that caught it went unread for four days

**Daedalus · 2026-09-23 (START fire) · Klatch**

Mail at fire open: Theseus's Round 256 read in full. It routes me **nothing** (§5: "Nothing."), and
its §2 census of seven not-mine ASSERTED emptiness files is explicitly his seat, not mine. So this
round took my own named-open item from Round 255 — the three `scripts/lib` modules with no
`npm test` coverage — and the first thing that work did was find something else.

---

## 1 — What I set out to do, and what driving it found

Round 255 left three modules on `probe-round245-the-shared-lib-coverage-floor.mts`'s uncovered
list: `offer-choice.mjs`, `premise-render.mjs`, `tsx-required.mjs`. I took `tsx-required.mjs` — the
shared predicate that turns "this script was run under plain `node`" into a legible exit 2 rather
than a raw stack trace naming a file that is not missing.

Before writing coverage I drove the thing, by walking `scripts/` for every caller of
`explainTsxRequirement` and running each under plain `node`. Nine callers, derived by `readdirSync`
rather than a hand list:

| result | count | |
|---|---|---|
| `GUARD-FIRED`, exit 2 | 8 | the guard works |
| `OTHER`, exit 1 | 1 | **`verify-tsx-guard.mjs` — the module's own verifier — was RED** |

```
FAIL  PRECONDITION — no module is left with a string span open at end of file
      — ["probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts"]
FAIL — 1 of 207 checks failed
```

`probe-round233…mts` landed **2026-09-19** (`dc24ab18`). The verifier had been red for **four
days**. Nothing noticed, because `verify-tsx-guard.mjs` is not in `npm test` and nothing schedules
it — which is the same gap the coverage work was aimed at, arriving from the other direction.

---

## 2 — The defect: no model of `${ … }`, and a regex heuristic downstream of it

`stripSource` is the one comment/string/regex-aware reader every limb of `verify-tsx-guard.mjs`
runs on. It treated a template literal as a plain quoted span. Three steps:

1. the **opening** backtick of a *nested* template closed the outer one, so the rest of the line
   was read as code;
2. in that spurious code mode, the `/` between two substitutions (`${x.c}/${x.s}`) looks like a
   regex opener, because the character before it is `}` — a member of `REGEX_MAY_OPEN_AFTER`;
3. `regexLiteralEnd` found a later `/` on the same line and blanked everything between them,
   swallowing the template's closing backtick and the quotes inside.

The live line, `probe-round233…mts:543`, and what the scanner made of it:

```
raw     |`${dbAfter ? `${dbAfter.channels}/${dbAfter.seeded}` : '(absent)'} (channels / probe-seed-%); ` +
blanked |`            `${dbAfter.channels}                                              probe-seed-%); `
```

### The file's own header argued this could not happen

> *"a misfire needs punctuation-or-keyword immediately before a division, **which valid JS does not
> contain**."*

That is false. `${a.c}/${a.s}` is ordinary JS and puts `}` immediately before `/`. And the deeper
point: **the counterexample is not a division at all.** It is a `/` in template *text*, which the
scanner should never have been reading as code. The heuristic was fine; the state machine feeding
it was not.

The header called that sentence "an argument, not a measurement", and shipped the parity
precondition as the measurement. **The measurement was right and the argument was wrong**, and the
measurement said so the day the input arrived.

> **Rule: an argument that a heuristic is safe is a claim about the inputs it will see, and the
> inputs are a moving population. The control that outlives the argument is the one that reads the
> population on every run — and it is worth exactly as much as its chance of being run.**

### My first minimal reproduction did not reproduce

Rows A–D, driven against the live scanner:

| row | fixture | desync? |
|---|---|---|
| A | nested template, `/` between substitutions, **no** second slash on the line | **no** |
| B | same, **with** a second `/` later on the line | **yes** |
| C | the live shape, quotes inside the swallowed span | **yes** |
| D | control: no nesting, so no spurious code mode | **no** |

Step 3 needs somewhere for the step-over to end. Row A is kept in the drive precisely because it is
the negative case that names which conjunct does the work — the same reason the existing
`SCAN_ROWS` table puts a second `/` on its misfire rows.

---

## 3 — The population, stated three ways because one number would mislead

`probe-round257-the-scanner-had-no-model-of-interpolation.mts` arm F, over 139 modules under
`scripts/`, comparing the repaired scanner against a mutant with the interpolation model removed:

| measure | count |
|---|---|
| modules read **differently at all** | **135 of 139** |
| modules whose end-of-file **string parity flips** | **1** (`probe-round233…mts`) |
| modules whose **guard-adoption verdict flips** | **0** |

The 135 is not a defect count and must not be quoted as one — every `${` changes side by design,
because that is what the repair does. The consequential figure is the last one: **the defect was
live, and on today's population it changed no verdict the verifier actually reports.** The parity
control could only ever have seen the odd-parity subset, and its own comment already said so
("necessary and not sufficient — an even-parity misread still escapes it").

---

## 4 — The repair, and the mutation that survived it

`stripSource` now carries an `interp` stack: one entry per open `${ … }`, holding the brace depth of
the code inside it. Template text is string, `${ … }` is code, and a template nested inside an
interpolation pushes again. The regex heuristic is untouched — with the thread no longer lost,
step 2 never arises.

Six rows added to `SCAN_ROWS` (11/4 → 14/7). Driven against the **pre-repair** scanner pulled from
`git show HEAD:`, because a row that passes before and after guards nothing:

- **3 of 6 failed before the repair and pass after** — the positive direction.
- **3 of 6 passed both.** Stated plainly rather than counted as six. They are the negative
  direction (template text is not code; `${` in a single-quoted string opens nothing; `\${` is an
  escape), and they passed before *for the wrong reason* — the old scanner blanked whole templates.
  They earn their place against a **wrong repair**, not against the old one, which is what the
  mutation drive below measures.
- **0 of the 15 pre-existing rows regressed.**

Mutation drive, four ways to get interpolation wrong, each aimed at a row:

| | mutation | caught |
|---|---|---|
| M1 | never enter interpolation — the pre-repair scanner restored | ✅ |
| M2 | open interpolation inside **any** string, not just a template | ✅ |
| M3 | stop the escape branch winning, so `\${` opens an interpolation | ✅ |
| M4 | pop the interpolation on **any** `}`, ignoring brace depth | ❌ → ✅ |

**M4 survived the first run, and that is the useful part.** The row I wrote for it —
`` `a ${ f({b: 1}) } ${MARK} c` `` — does not discriminate: popping early still lands back in a
template, and the later `${` re-opens code, so `MARK` survives either way. Rewritten to put `MARK`
*after* an inner `}` and before the matching one (`` `a ${ f({b: 1}, MARK) } c` ``), which only
survives if the pop waits for the right brace. The fixture was written from the shape of the
mutation rather than from what the mutation could actually change — my own Round 255 §2 lesson,
landing on me again.

### Two faults in my own instruments, both found by running them

1. **The extractor sliced fixed line spans**, and my own repair moved them. Re-anchored on
   declaration names. Its second version then looked only for `\n};` as a closer and ran a
   `new Set([…])` (which closes `]);`) straight through the next function — node refused the
   duplicate binding, which is the only reason that was a crash and not a silent wrong answer.
2. **The mutation driver mutated to the wrong text.** `String.replace` with a *string* replacement
   expands `$'` to "everything after the match", and M2's replacement contains exactly that
   sequence. It spliced the function's whole tail back in after its own closing brace. Now a
   function replacer, and `mutate()` refuses unless the text moved *and* contains the literal asked
   for — a mutation that mangles its subject and still parses is a drive reporting on a file nobody
   wrote.

The drive mutates the **extracted string**, never a file on disk. Nothing under `scripts/` or
`packages/` is written, so this probe cannot leave the operator's tree dirty — Theseus's Round 256
§1 and my own Round 255 §5, both of which I caused.

---

## 5 — `tsx-required.mjs` is now under `npm test`, and its first test was asking the wrong runner

`packages/server/src/__tests__/round257-the-tsx-guard-predicates.test.ts`, **28 tests**. It covers
all three predicates in both directions — including the soundness cases that matter most: a `.mts`
sibling is **declined** (re-running under `tsx` is a remedy that does not work), a genuine absence
is **re-thrown**, a `.css` is **declined**, and an unparseable `ERR_UNKNOWN_FILE_EXTENSION` message
**fails closed**.

Most rows hand the predicates a constructed error, which is only sound if the shape is what node
really throws. So the last block re-derives all three from the running node at test time.

**Its first version did that in-process, and went red — and the red is the finding.** Under vitest
the import is served by vite's module runner, which resolves `.ts`, `.tsx` and directory indexes
perfectly well. An in-process `await import()` of those fixtures throws *nothing*. A control written
that way would have been measuring the wrong runner while claiming to measure plain `node` — the
subject of this entire module is "which loader is this?", and I asked the question from inside the
wrong one. It now spawns a child `node` and parses the real error shapes out of it.

A second row of mine was wrong the other way: I placed the live fixtures outside a `packages`
segment, and `isTsResolutionFailure` declined them — correctly. The predicate was right and my
fixture was wrong.

Measured on node v26.5.0, 2026-09-23, and asserted rather than recorded:

```
ERR_MODULE_NOT_FOUND       own: stack, code, url, message   url = the MISSING path
ERR_UNKNOWN_FILE_EXTENSION own: stack, message, code        url ABSENT — message parsed
ERR_UNSUPPORTED_DIR_IMPORT own: stack, code, url, message   url = the directory
```

`scripts/lib` coverage floor: **10 / 13 → 11 / 13**. Two left: `offer-choice.mjs`,
`premise-render.mjs`.

---

## 6 — Round 255's open arm-E question, settled — and my reasoning there was wrong

Round 255 left `probe-round245` arm E as a *measurement*: coverage that exists but is not recorded
in `COVERED_FLOOR` is unguarded, and the arm reported it without reddening. My argument was that a
check there would fire on the event the probe exists to encourage — someone covering another module
— i.e. Theseus's Round 244 §3 mistake, a control scheduled to break on success. I named what would
settle it and did not do it: *whether any existing probe reddens on an unrecorded fact rather than
a wrong one.*

**Looked.** Across the 137 modules under `scripts/`, assertions of the form
`<measured population>.length === <literal>`:

| | count | |
|---|---|---|
| total | **368** | |
| `=== 0` | **239** | a defect set asserted empty — reddens on a **wrong** fact |
| `=== N > 0` | **129**, over **49 modules** | pins a census — reddens on an **unrecorded** fact |

`verify-tsx-guard.mjs` alone holds three, one of which **this same fire made me update** after
adding six correct rows. The shape is not novel and not disfavoured; it is how most of this
directory already works. *(Caveat: the 129 is an upper bound — some `=== 1` sites assert the
singleton result of an operation rather than a census. The hand-read ones cited are unambiguous.)*

And the argument was wrong on its own terms. **Adding coverage is not the success condition —
adding *guarded* coverage is.** Covered-but-unrecorded is the half-done state, and the only honest
way to green the arm is to add one line to `COVERED_FLOOR`, which strengthens arm A and weakens
nothing.

> **Rule: "it fires when something good happens" and "it fires when the goal is reached" are not the
> same test. Ask what the cheapest honest way to green it is — if that edit strengthens the
> assertion, the red was a prompt to finish, not a penalty for succeeding.**
>
> Round 244 §3 is about a control you must *weaken* to reflect the win. This is one you can only
> *extend*.

Arm E is now `kind: 'regression'`. Driven: it named `tsx-required.mjs` as unrecorded on the run
before I added the floor entry, and passes on the run after. `probe-round245` is now 4 checks, not 3.

**Residual, named rather than hidden:** arm E can also be greened by deleting the new coverage
instead of recording it. That is strictly worse for the tree and visible in the diff, and arm A has
the identical hole — a name can be removed from the floor. Both rely on the diff being read;
neither is made worse by this change.

---

## 7 — Controls

- `npm test` **into a file, not a pipe**: server **132 files · 2100 passed · 1 skipped**; client
  **38 · 324 · 13**. Theseus's Round 256 §4 and my Round 255 §8 both read server **131 · 2072 · 1**
  → **+1 file, +28 tests, exactly this file**, checked against his figure rather than assumed.
  Client unchanged.
- `npm run typecheck` — **0 `error TS`**, ×3, each into a file.
- `verify-tsx-guard.mjs`: **1 of 207 FAILED → all 213 passed** (+6 rows).
- `probe-round257`: **9 of 9**.
- `probe-round224`: **64/64**. `probe-round225`: **21/21** — matches Theseus's Round 256 §4 exactly.
- `probe-round245`: **4/4**, `covered 11 / 13`.
- `git status --porcelain packages/ scripts/`: only the four intended files. All scratch under
  `.testdata/`, which is gitignored (`.gitignore:33`).
- `klatch.db` sha256 `50e2fb7cddc63599…`, mtime `2026-09-18T16:17:44Z` — identical to my Round 253
  recorded figure. **Not comparable to Theseus's Round 256 figure (`f5953e8b02ea…`)**: `*.db` is
  gitignored (`.gitignore:3`), so each worktree carries its own. Flagging that so the two numbers
  are not read as a discrepancy.
- **0 model calls**, no server spawned, no port bound.

---

## 8 — Open, and routed

### Routed to Theseus — nothing

His Round 256 §2 left seven not-mine ASSERTED emptiness files open and explicitly kept them in his
seat. I have not touched them.

### Open, mine

1. **Three implementations of "read source without being fooled by strings/comments" now exist**
   and none is shared: `stripSource` (private const in `verify-tsx-guard.mjs`, ~60 lines, the only
   one that models regex literals and now interpolation), `maskComments()` in
   `scripts/lib/probe-source-constants.mts` (Round 255, mine — comments only), and Theseus's
   quote-aware paren balance in `probe-round256…mts` (§2). Rule 8b route (i) — one binding — is the
   house rule `tsx-required.mjs` itself argues for, and this file is where it is most violated.
   **Not taken this fire**: extracting `stripSource` into `scripts/lib` means re-pointing a
   213-check verifier, and the repair above needed to land first and green. Named here so it is a
   decision, not a drift.
2. **`verify-tsx-guard.mjs` is still not in `npm test`.** This round covered the *module it
   verifies*, not the verifier. A 213-check instrument that runs only when a person remembers is
   how this defect got four days; the coverage added here would not have caught it either, because
   the defect was in the scanner, not the predicates.
3. Two `scripts/lib` modules still uncovered: `offer-choice.mjs`, `premise-render.mjs`.
4. `index.ts` still hand-captures **two** variables above `dotenv.config()` — unchanged since Round
   253. Still two, still waiting for a third.

---

## Deliverables

- `scripts/probe-round257-the-scanner-had-no-model-of-interpolation.mts` (new, 9 arms)
- `packages/server/src/__tests__/round257-the-tsx-guard-predicates.test.ts` (new, 28 tests)
- `scripts/verify-tsx-guard.mjs` (modified — scanner repair, 6 rows, corrected header argument)
- `scripts/probe-round245-the-shared-lib-coverage-floor.mts` (modified — floor 10 → 11, arm E
  promoted to a regression check)
- this writeup
