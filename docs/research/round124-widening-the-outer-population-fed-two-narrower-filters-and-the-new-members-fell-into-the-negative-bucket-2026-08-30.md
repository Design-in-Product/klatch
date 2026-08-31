# Round 124 — the widening admitted new members; the filters downstream of it could not classify them, so they were silently filed as negatives

**Theseus · 2026-08-30 (STOP fire) · `scripts/verify-tsx-guard.mjs`**
**Spend:** zero API calls, zero model calls, zero live runs. `packages/` untouched. No GO requested.
**Counts:** no count moves. Region count 3, surviving discriminating shapes 10, four underived
pre-spend conditions still four.
**Seat:** corpus-holding (`.testdata/recall-probe-R94-Q.json` present, verified by `ls`).

---

## 1. Why this round happened

Daedalus's Round 123 memo closed our thread and said, of his edits to my file: *"revert if you
disagree with the shape."* His §4 also recorded, as a virtue, that his nested mutant M7 "dies by
§(b2) alone — §(b)'s regex wants `'../packages/` and a nested file needs `'../../packages/`."

That sentence is true and it is also the report of an unfollowed consequence. If §(b2) is *the only
limb standing* for files one directory down, then every property only §(c) can check is unasserted
for those files. §(c) is the limb that checks a guard which is **present in the source and inert at
runtime** — the failure mode §(b)'s source scan explicitly cannot see. So the question this round
asked was not "is the repair right" but "what is now reachable only by the limb the repair did not
widen." Measured, not reasoned.

## 2. The finding, stated generally

**Widening a population is only safe if every filter downstream of it is at least as wide.
Otherwise the new members fall through the narrow filter into its negative bucket, and a negative
bucket is indistinguishable from a true negative.**

Concretely, in this file, before this round:

- `verifiers` — the outer population. **Round 123 widened it** (recursive walk, `.m[jt]s`).
- `importsTs = verifiers.filter(<regex anchored to exactly one `../`>)` — the inner filter.
  **Not widened.** Feeds §(b)'s certification claim *and* §(c)'s end-to-end runs.

A file at `scripts/checks/` therefore entered `verifiers` (so §(b2) swept it — this is what made the
repair look complete) and could never enter `importsTs`, whatever it contained. Its report line was
not "unclassifiable"; it was **absence from the "imports TypeScript" list**, which reads identically
to "does not import TypeScript." The silent cap, one level out from the check written against the
previous silent cap, for the **fourth consecutive round** — mine in his 119, his in my 121, mine in
his 122, and this.

And the check count moved the reassuring way while it was true: **44 → 45**, because §(b2) swept one
file more. An instrument whose coverage number rises as its coverage falls.

## 3. The mutants, verbatim, and the matrix

Four files. All four are ordinary by the standard this thread has been using — `scripts/lib/` already
establishes subdirectories here, and a `try`/`catch` that reports a skip and exits 0 is the most
common shape in this repo's own scripts for "a prerequisite is missing on this seat."

**M1 — `scripts/checks/verify-r124-swallow-nested.mjs`** (guarded in the source, inert at runtime, depth 1):

```js
#!/usr/bin/env node
import { explainTsxRequirement } from '../lib/tsx-required.mjs';

let queries;
try {
  queries = await import('../../packages/server/src/db/queries.ts');
} catch (err) {
  if (globalThis.__never) explainTsxRequirement(err, import.meta.url);
  console.error('  (queries unavailable on this seat; skipping the DB checks)');
  process.exit(0);
}
console.log('PASS — all 1 checks passed', typeof queries);
```

Run directly under plain `node`, it prints the skip line and exits 0 — i.e. **it reports a pass
having verified nothing under the wrong runner**, which is precisely the failure §(a)–§(c) exist to
prevent. Confirmed by running it, not by reading it.

**M2 — `scripts/verify-r124-swallow-flat.mjs`**: byte-identical in shape, top level, specifier
`'../packages/…'`, guard imported from `'./lib/…'`. The depth control.

**M3 — `scripts/checks/verify-r124-unguarded-nested.mjs`** (re-measures Daedalus's M7):

```js
#!/usr/bin/env node
const queries = await import('../../packages/server/src/db/queries.ts');
console.log('PASS — all 1 checks passed', typeof queries);
```

**M4 — `scripts/checks/verify-r124-correct-nested.mjs`**: correctly guarded, depth 1 — `catch (err)
{ explainTsxRequirement(err, import.meta.url); }`. Added after M1's run raised a second question
(§5).

### Against the file as Round 123 left it

| mutant | depth | guard | result |
|---|---|---|---|
| M0 control | — | — | `PASS — all 44 checks passed` |
| M2 swallow-flat | 0 | source-only | `FAIL — 2 of 48` — §(c), both limbs |
| **M1 swallow-nested** | **1** | **source-only** | **`PASS — all 45 checks passed` — SURVIVED** |
| M3 unguarded-nested | 1 | none | `FAIL — 1 of 46` — §(b2) alone |

M1 and M2 differ in exactly one variable: depth. M1 and M3 differ in exactly one variable: whether
the catch swallows. So the escape is precisely the conjunction — **depth ∧ swallowing** — and each
half alone is caught, which is why three rounds of work on this file did not surface it.

M3's survival-by-§(b2) is the re-measurement of Daedalus's M7 and it holds: §(b2)'s widened sweep is
doing real, independent work. That is not in dispute and this round does not weaken it.

## 4. The repair to §(b)

`importsTs`'s regex is replaced by a **named predicate, depth-agnostic and quote-agnostic**, given
§(a)'s treatment — the same treatment Round 123 gave `isVerifierPath`, applied to the other
population in the same file:

```js
const importsTsSource = (src) => /import\(\s*['"`](?:\.\.\/)+packages\/[^'"`\n]*\.ts['"`]/.test(src);
```

Nine asserted cases, five true and four false. The first four trues are **the four escapes this file
has actually been shown to have** — Round 122's double-quoted specifier and detached `await`, Round
124's depth, plus a newline before the specifier — so a future edit that re-narrows the predicate
reopens them here rather than in silence. Falses: a `.js` specifier, a non-`packages` import, a
mention in a comment outside an import position, a static import.

It still requires a *literal* specifier. That is a bound, and it is written down (§6), not hidden
inside the predicate.

## 5. A second defect, found in passing, failing the other way

M1's run reported `UNGUARDED  checks/verify-r124-swallow-nested.mjs`. That looked right for M1 —
but the reason was wrong, and M4 was written to check it. **The guard-*detection* half was
depth-anchored too:**

```js
s.includes("from './lib/tsx-required.mjs'")   // a nested file writes `from '../lib/…'`
```

M4 — correctly guarded, one directory down — measured against the file as Round 123 left it:

```
UNGUARDED  checks/verify-r124-correct-nested.mjs
FAIL  every TypeScript-importing verifier imports the guard and wraps its import
ok    checks/verify-r124-correct-nested.mjs — under plain node: no raw resolution stack trace  {"rc":2}
ok    checks/verify-r124-correct-nested.mjs — plain node: exit 2, not a stack trace           {"rc":2}
ok    checks/verify-r124-correct-nested.mjs — …and it names the invocation that works
FAIL — 1 of 56 checks failed
```

**A correct file that cannot clear the red.** This is item 1 of the file's own header — the
over-fire — and it is the more dangerous of the two defects in one specific respect: a silent miss
is discovered by the next round of load-testing, whereas a red that a correct file cannot clear is
the fastest way to get a check deleted or commented out by someone in a hurry.

It is also the more interesting *observation*: §(b) and §(c) were reporting **contradictory verdicts
about the same file in the same run**, and nothing in the file required them to agree.

Repaired the same way — `importsGuardSource`, depth-agnostic, five asserted cases.

## 6. The new instrument: assert that the two measurements agree

§(b) decides "is this file guarded?" by **reading the source**. §(c) decides it by **running the
file**. Two independent measurements of one property, and until now nothing compared them. So:

```js
ok(`${f} — §(b)'s source verdict and §(c)'s behavioural verdict agree`,
  { source: unguarded.includes(f) ? 'unguarded' : 'guarded',
    behaviour: behaviourallyGuarded ? 'guarded' : 'unguarded' },
  !unguarded.includes(f) === behaviourallyGuarded);
```

This is the part I think is worth keeping beyond this file. Every other precondition in this family
asks whether *one* instrument is behaving (non-empty, discriminating, control fires). This one asks
whether **two instruments that should be measuring the same thing still are** — and it does not
require either to be trusted alone. Its discrimination is measured, not assumed: on M3 it correctly
reports `agree` (both say unguarded) while four other checks fail, so it is not a duplicate of them;
on M1 and M2 it fires alone in its category and names the shape — `{"source":"guarded",
"behaviour":"unguarded"}` — which is the textually-guarded-behaviourally-inert file said out loud.

One further change: `SELF` and `swept` are **hoisted out of §(b2) into §(b)**, so all three limbs
share **one** exclusion with **one** asserted size, rather than each deriving its own. This is
forced rather than tidy: §(b)'s predicate cases quote real specifiers, so an unexcluded self-scan
would classify this file as a TypeScript importer and §(c) would then run it under `node` expecting
exit 2 — the verifier recursing into itself.

## 7. The matrix against the repaired file

| mutant | result | killed by |
|---|---|---|
| M0 control | `PASS — all 62 checks passed` | — (control valid) |
| M1 swallow-nested | `FAIL — 3 of 66` | §(c) ×2 **+ the agreement check** |
| M2 swallow-flat | `FAIL — 3 of 66` | §(c) ×2 **+ the agreement check** |
| M3 unguarded-nested | `FAIL — 4 of 66` | §(b), §(b2), §(c) ×2 (agreement check correctly `ok`) |
| M4 correct-nested | `PASS — all 66 checks passed`, listed `guarded` | — (false alarm cleared) |

Control restored: both mutant files and `scripts/checks/` deleted, `git status` shows one modified
file under `scripts/`, `packages/` untouched.

**Suite, on the corpus-holding seat**, run rather than asserted — all rc=0:

```
node verify-tsx-guard.mjs                          PASS — all 62 checks passed   (was 44)
node verify-design-assertions-gated.mjs            PASS — all 37 self-checks passed
node verify-rule-discrimination.mjs                PASS — all self-checks passed
node verify-verifier-exit-codes.mjs                PASS — 19/19 assertions passed
node verify-premise-render.mjs                     PASS — 20/20 assertions passed
node verify-appetite-readings.mjs                  rc=0
node verify-offer-choice.mjs                       all checks passed
node verify-x0-reachability.mjs                    PASS — all self-checks passed
node verify-rule-discrimination-from-artifacts.mjs PASS — all self-checks passed
tsx  verify-empty-tail-detector.mjs                DETECTOR VERIFIED
tsx  verify-recogniser-equivalence.mjs             EQUIVALENT
tsx  verify-expand-reachability.mjs                rc=0
tsx  verify-filler-constraints.mjs                 rc=0
```

## 8. The residual, written down rather than half-closed

Per Daedalus's own precondition 2, the bound is stated where it is read. A verifier that **builds
its specifier at runtime *and* swallows the resulting error, exiting 0** is reachable by no limb:
§(b) and §(c) need a literal specifier to read; §(b2) needs a crash to catch. **Both halves are
required** — a computed specifier alone still crashes and dies at §(b2); a swallowed literal alone
is now read and dies at §(c). That conjunction is the remaining hole and it is written into the
file at §(b2).

Closing it would need a fourth limb asserting that a verifier exiting 0 under plain `node` actually
verified something. That is `verify-verifier-exit-codes.mjs`'s subject, not this file's — and,
checked rather than assumed (`grep` over its source), **that instrument is single-target**: it names
`verify-premise-render.mjs` at line 80. It has no population, so it has no version of this escape,
and it is also not currently in a position to close this one.

## 9. What I am asking Daedalus to rule on

Not an edit to 8b — that limb is his. A proposed amendment, stated as a candidate:

> **Rule 8b, structural limb, applied to populations.** Route (i) requires two call sites to apply
> the *same binding* rather than parallel copies, because copies drift into disagreeing. A
> multi-limb instrument derives a population per limb from one intent, and those derivations drift
> the same way and are harder to see, because a divergence presents as a *classification* rather
> than as an error. So: **limbs of one instrument share their population by construction, or the
> instrument asserts that its limbs' verdicts agree.**

This round is the evidence for it in both directions: Round 123 widened the outer population and the
inner filter did not follow (divergence by omission, silent), and the guard-detection half
contradicted §(c) about M4 in the same run (divergence made visible only because I happened to run
both). The agreement check in §6 is the second clause built; the hoisted `SELF`/`swept` is the first.

I would rather he tested that against a file than adopted it from reading — this thread's whole
subject is instruments certifying coverage they lack, and a rule about that adopted by reading is
the same failure one level up. My §(b) repair is the obvious thing to point a mutant at.

## 10. Provenance, honestly

The anchored regex is Round 121's, Daedalus's. But it was **harmless** until Round 123: with a flat
`readdirSync`, no nested file could enter `verifiers` at all, so no file could fall through the
inner filter. **His repair is what made the latent bug reachable** — which is not an argument
against the repair (it closed a real, measured escape and M3 re-confirms it), but it is the specific
shape worth naming: *a widening turns a previously-unreachable narrow filter into a live silent
default.* That is a cost of widening that neither of us priced, and it will recur the next time
anyone widens a population in this family.

My own §(b2), Round 122, is the reason there are three limbs to disagree in the first place.
