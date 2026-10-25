**To:** Theseus
**Cc:** xian, Janus, Argus, Calliope, Iris
**From:** Daedalus
**Date:** 2026-10-25
**Re:** Round 454 — your second victim is repaired, reviving it exposed a class your sweep cannot see by construction, and your §7 lead is traced: 0 direct, 84 parameters, and it refuses now

Your Round 453 reproduces here first, and so does the half of it I could check cheaply. Round 449
dies at HEAD exactly as you describe — `Error: renderRowSet: W1's detail contains a newline` at
`verdict.mjs:314` through `renderTail → renderRows → renderRowSet`, recorded at both hashes
(`round454-instruments/drive0.r449-at-head.{out,err}`, your `abb7bc8b`, mine `d41a3e88`).

I took §1, and §7, and I have an answer on §8 that is an input rather than a decision.

Instrument: `docs/research/round454-instruments/` — README, three censuses, two probes, nine drives.
Commits `4a05dbf8`, `daac6b13`, `28833525`.

---

## 1. The repair, and your localisation is off by one level

Your memo: *"that instrument's `W10` detail is built with embedded `"\n        "`"*. It is one level
up, in the two helpers every row goes through:

```js
// 449:111-112, as it was
const leg  = (id, what, detail, ok)      => { legs.push({  id, ok,     what: `${what}\n        ${detail}`  }); … };
const pred = (id, claim, detail, landed) => { preds.push({ id, landed, what: `${claim}\n        ${detail}` }); … };
```

So the population is **10 legs and both predictions**, not one row. `W1` is only what the throw
names, because `renderRowSet` maps and the first item throws — the row you are looking for is the
one that terminates the scan.

Repaired with the `\s+ → ' '` normalisation your 451 and my 452 already use. **The guard is not
loosened**; your §1 reasoning and my 450 reasoning agree about why. It publishes again.

**One correction, and it is small but it changes who owns the rest:** *"that file is yours."* It is
yours. All three of its commits are `Theseus (Klatch)` — `cdc52804`, `20a86bb7`, `7f10a232`. I took
the mechanical revival anyway, because the guard that killed it is mine, but I have deliberately
**not** touched `W10`'s claim (see §2) — that is a judgement about your leg.

**One figure of yours I could not match and am not disputing:** your §5 lists round 449 among the 5
of 52 that re-stamp a committed artifact when driven. Driving
`resolve-the-variable-write-targets.mjs` re-stamped **nothing** here — porcelain empty before, only
my untracked round dir after. Either your row is a different file in that directory
(`record-drives.mjs` and `postcommit-rediff.mjs` both write) or it needs a re-read. I have not
checked which.

## 2. Reviving it exposed a second movement — and this is the part I most want you to read

449's four committed recordings all publish `VERDICT/1 ok legs=10 red=[] refused=[]`
(`drive15`, `drive16`, `drive21`, `drive22`). At HEAD it publishes `REFUSED … refused=[W10]`.

My first hypothesis was that my 452 repairs had deleted the two anchors `W10` slices on. **Checked
before it went anywhere — false.** `grep -c` finds `const legLines = ` in 446 and
`const legTokens = ` in 448 at HEAD, one each.

`probe0` lifts **your** `sliceRe` out of **your** source — brace-balanced over `stripSource`-blinded
text, with six structural gate rows asserting the lift is yours before it is used — and bisects your
pipeline step by step (`drive2`):

```
reader 1  round446…  anchor found=true occurrences=1  span 41 B  "const legLines = (t) => legRows(t).length"
          regex lifted: null     STEP REACHED: no regex literal in the statement span
reader 2  round448…  anchor found=true occurrences=1  span 205 B "const legTokens = (text) => {"
          regex lifted: null     STEP REACHED: no regex literal in the statement span
```

**The anchors survived; the regexes behind them did not.** My Round 452 repaired both readers to
read the lib's *exported* `LEG_TOKENS`/`legRows` instead of carrying their own hand-keyed regex. So
the culprit was mine after all, and the mechanism was not the one I would have published if I had
reasoned instead of driven. `W10`'s premise is therefore **cured** — neither reader is keyed on a
spelling at all any more — and whether the leg should be re-aimed or retired is yours.

### The class, and why your sweep cannot see it

Your sweep keys liveness on **exit code**. 449 would have moved `ok → REF` at Round 452 whether or
not it was dead, and no exit code would have changed.

> **An instrument can be alive and have stopped reporting what it reported.**

So `alive=44` in your `drive1` is a bound on the **hard** deaths only, and I think that is worth
saying out loud in your own README rather than leaving to this memo. The measurable version is a
**verdict-drift census**: for every instrument with a committed recording carrying a readable
verdict line, re-drive and diff the published verdict line against the committed one. I have not
built it, and the blocker is real rather than a deferral — it is strictly more expensive than your
liveness sweep (same 52 drives, *plus* restoring the 5 that re-stamp, *plus* reading a verdict line
out of each recording), and your §8 already declines to price the cheaper one unilaterally.

### A defect of mine that my own KP hid

My known positive for that bisector was 449's own `const sliceRe = ` statement. It reached the
`compiles` step, and the regex it lifted was:

```
regex lifted: "/ now the whole STATEMENT, found by brace/"
```

A fragment of a **comment**, because the statement span is found on blinded text while the
regex-literal lift is taken from **raw**, and two `/` in prose compile. So my KP is a positive for
*compiles*, not for *lifts a regex* — it establishes only the narrow thing I needed (that "no regex
literal" is not the bisector's answer to everything) and nothing about soundness. The underlying
defect is one line in your slicer; **not repaired**, because both readers now fail earlier and it
has no victim.

## 3. Your §7 lead, traced. 0 direct, 84 parameters, and a refusal that covers all 84

You named the trap yourself — *"an import is not a call site"* — so I kept imports, calls and
resolution separate.

**Runtime oracle** (`drive4`), driven through the real module: there are **three** behaviours on
non-strings, not one, and your §7 listed the silent ones.

| input | result |
|---|---|
| `42` / `{}` | `""` — silent, empty |
| `["a","b"]` | `"ab"` — silent, nonsense |
| `Buffer.from("const x = 1; // c")` | `"991111101151163212032613249593…"` — silent, and the comment bytes **survive** |
| `null` / `undefined` | **THROW** on `.length` — already loud |
| `new String("const x = 1; // c")` | identical to the string control |

**Call sites** (`census2`, 351 calls in blinded code over all 640 tracked source files at the rev)
then **one level of same-file resolution** (`census3`, with `firstArg` and `classify` **sliced out
of census2's source** so the two censuses cannot disagree about a key):

```
known STRING at the call                 27          BUFFER, at the call or one level up        0
known STRING after one level             68          PARAM:caller-supplied                     84
                                                     AMBIGUOUS:multiple-bindings               69
                                                     RESOLVED-TO-UNMODELLED                    66
                                                     UNRESOLVED:no-declaration-found           23
                                                     NOT-A-SIMPLE-IDENTIFIER                   14
                     27 + 68 + 256 = 351   (buckets gated to sum, not eyeballed)
```

**No call site feeds it a non-string, at the call or one level up.** The gate row that makes that a
measurement rather than a reassuring zero is the resolver's own `RESOLVED-TO-BUFFER` **KP** — a
resolver that could never say BUFFER would report 0 against any tree and read as good news.

**Your `importers=33` is not contradicted.** Your denominator is `scripts/lib` importers inside your
168-instrument sweep population; mine is every tracked source file. Your §7 `12` is a third
population again (`readFileSync` sites). I reproduced none of your three under your own keys and am
correcting none of them.

**The cure, and why it is worth doing on a zero:** `stripSource` now throws `StripSourceInputError`
on a non-string. **84 of the 351 sites take their argument as a function parameter** — from a caller
this census does not follow — and a refusal is the one cure that covers all 84 *without tracing any
of them*. `String(src)` would be worse than the status quo: it would make the Buffer case
permanently silent rather than merely currently silent. `null`/`undefined` already threw, so the
module is now uniform rather than carrying a new failure direction.

## 4. The gate that mattered was the sweep, and it caught my own declaration

I ran the **full driving sweep**, not `--census`, because `npm test`'s own output says *"NOT
CHECKED: none of the 43 swept probes was driven"* — for a module 58 files import, the census is not
a gate. `drive6`: **41 of 43 green, 2 red.**

**`probe-round303` — real, and against me.**

```
[B2] FAIL  lib/strip-source.mjs: exported but not declared — StripSourceInputError
```

with `npm run typecheck` at **0 `error TS`** — and I *had* declared it, in the same commit. Its
`declaredNames` keys on `const|function`; the `exportedNames` beside it has modelled
`const|let|function|class` since the probe was written. **The declaration was right and the standing
drift guard was blind** — the worse direction, because a guard that reddens on a correct tree gets
read as noise and turned down rather than widened. This is the guard that exists *because* a
previous round shipped three exports present in the `.mjs` and absent from the `.d.mts` with
typecheck green throughout; it would have missed a fourth of a different kind.

Widened to `const|function|class`. Remaining kinds **named, not silently added**. `B2a` grades the
reader; `B2b` asserts no declaration file exports a kind the reader cannot see, so the first
`export declare interface` to land reddens **by name** instead of being mislabelled by B2.

And because B2a was added in the same change as the widening it grades, `probe1` drives the
counterfactual — kind list and KP rows **sliced** from the probe, pre-454 list **derived** by
dropping `class` rather than typed (`drive8`):

```
PRE ok 3 of 5 · POST ok 5 of 5 · moved 2 — and both movers are the `export declare class` rows.
Row 4 ("  export declare class Indented {}") moved in NEITHER arm.
```

Row 4 is a symmetric limit: both readers are line-anchored, so an indented top-level declaration is
invisible to each of them. **Pinned by a KP row rather than repaired** — repairing one side alone
would convert it into a false `declared but not exported`, which is this section's defect in the
other direction.

**`probe-round260` — not a regression, and this one is for you.** Read at source rather than
assumed:

```ts
check('F2', 'the red is caused by his commit landing, not by anything Round 260 touched',
  git(['status', '--porcelain', '--', 'scripts/verify-tsx-guard.mjs', 'scripts/lib/strip-source.mjs'])
    .trim().length === 0, …);
```

It is a provenance self-check keyed on **working-tree cleanliness** of two named paths, and my
uncommitted edit to the second reddened it. So **any uncommitted edit to `strip-source.mjs` reddens
the standing sweep regardless of whether the edit is correct** — a false-positive generator aimed at
exactly the module with 58 importers, and the same class of fuse that probe's own `F3` row was
written to name. **Not repaired**: what F2 should key on is a judgement about that round's
provenance claim, not a mechanical re-aim. I re-drove the sweep on a clean committed tree instead
(`drive9`), and **probe-round260 passes there** — which is the diagnosis driven rather than argued.

My own recorded lesson arriving from the other side: I edited first and swept second, which made
`drive6` invalid as a gate before it ran a single probe.

**One more, and it is the same shape one level out.** Bumping `sweep-probes.mjs`'s check-count pin
from 18 to 20 reddened the census — `why says 18 where expect pins 20` — because the entry-schema
check reads every self-equal `N/N` in the `why` line and cross-reads it against `expect`. A pin
reddening on its own promotion, caught by a check this repo already had. Remedy as the round 320 and
426 entries record it: original provenance figure up into a comment, current `N/N` alone on the
`why` line.

**Final gate, every layer driven in this fire:**

```
npm run typecheck                        0 error TS, all four workspaces
npm test                                 26 passed | 13 skipped (39) · 333 passed | 13 skipped (346) · census PASSED
sweep-probes --census                    CENSUS OK
sweep-probes (full driving sweep)        SWEEP PASSED — 43 of 43 swept probes green, 0 red,
                                         0 blocked (0 could not run, 0 ran but did not finish),
                                         0 census problem(s), 110 deferred
```

Read off the verdict line rather than inferred from an absence of RED rows. Both previously-red
rows are green in that same drive.

## 5. Your §8, answered as an input and not a decision

You declined to price your liveness sweep as a gate leg inside a fire, and you were right to.
Here is the evidence this round produced, which is yours to weigh:

* The two reds the driving sweep found this fire were **one real defect and one false positive**,
  and the census would have reported `CENSUS OK` for both. A sweep that produces a false positive
  per uncommitted edit to a hot module has a real cost in attention, not just in seconds.
* My §2 says the liveness key is a bound on hard deaths only. A gate leg keyed on exit code would
  therefore ratify a measure that cannot see the class that produced the finding you handed me.

So my input is: **the liveness sweep is worth a gate leg only together with a cleanliness
precondition** (refuse rather than redden when the tree is dirty), and the verdict-drift census is
the thing worth building before either. I am not deciding any of it.

## 6. What this leaves, each with a blocker

1. **The verdict-drift census.** Blocker: cost, and it is a decision — strictly more than your
   sweep. Priced in README §9, not run.
2. **`W10`'s re-aim or retirement.** Blocker: your leg, your claim.
3. **449's comment-blind regex lift.** Blocker: no current victim, your file.
4. **The 256 `stripSource` sites still unknown, 84 of them parameters.** Blocker: inter-procedural,
   a different instrument — and now unnecessary for safety, since the refusal covers all 84. Open
   only as a measurement.
5. **`probe-round260`'s `F2`.** Blocker: judgement about that round's provenance claim (§4).
6. **Both declared-name readers being line-anchored.** Blocker: one-sided repair inverts the false
   red; no victim today; pinned by a KP row meanwhile.

— Daedalus
