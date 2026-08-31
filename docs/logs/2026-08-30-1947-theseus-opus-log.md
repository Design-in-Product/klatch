# Theseus — 2026-08-30 (STOP fire, 19:47 PT)

Model: Opus 5 · Worktree: `/Users/xian/Development/klatch-worktrees/theseus` · Branch: `claude/theseus-cycle`

---

## 19:47 — Briefing

Wrapper synced the worktree to `origin/main` before the fire; `git status --short` clean at `2bf78bc`
(Iris's 19:19 mail-hygiene sweep). Read `docs/COORDINATION.md` (my section) and swept `docs/mail/`.

**Mail since my 15:02 WORK fire — four commits landed, three of them other agents' cycle logs.**

1. **`daedalus-to-theseus-cc-xian-team-amendment-ruled-in-with-its-last-clause-struck-…-2026-08-30.md`**
   — already filed to `docs/mail/read/` by Daedalus, who closed the thread himself. Read in full
   rather than skipped on the strength of its being closed. He **ruled my Round 122 §5 amendment in**
   (sentences 1–2 verbatim into 8b), **struck my sentence 3** — *"prefer that, it has no membership
   test to be wrong"* — because he tested it against `verify-tsx-guard.mjs` and it was false there,
   and attached two preconditions. He also **edited my file** (Round 123: recursive walk,
   `isVerifierPath` with seven asserted cases, self-exclusion keyed to the relative path) on my own
   Round 120 precedent that defects found in a verifier are fixed by the finder, and explicitly
   invited reversion if I disagreed with the shape. Nothing was left open on my seat; his three open
   items (`fixedBy` mis-attribution, route (ii)'s preconditions, the `check-foo.mjs` residual) are
   his and live in his round doc and COORDINATION, not in the thread.

2. **`iris-to-xian-cc-team-import-confirm-step-scope-doc-21-days-idle-2026-08-30.md`** — open in
   `docs/mail/`, correctly. Read this fire. It is an escalation asking xian for one of three calls
   on `docs/ux/import-confirm-step-scope-2026-08-09.md` (read it / say build-as-scoped / say it's
   not next). **No action on my seat** and nothing for me to pre-empt — the decision is his. Left in
   place, not swept.

No memo anywhere asks anything of me. The work unit for this fire is therefore the standing one:
load-test the fix rather than admire it, which Daedalus asked for by name.

## 19:52 — What I chose to test, and why

His §4 recorded, as a virtue, that his nested mutant M7 *"dies by §(b2) alone — §(b)'s regex wants
`'../packages/` and a nested file needs `'../../packages/`."* True, and an unfollowed consequence:
**if §(b2) is the only limb standing for nested files, then every property only §(c) can check is
unasserted for them** — and §(c) is the limb for a guard that is present in the source and inert at
runtime, the failure mode §(b)'s source scan explicitly cannot see.

So the question was not "is the repair right" but "what is now reachable only by the limb the repair
did not widen."

**Baseline, run not assumed:** `node scripts/verify-tsx-guard.mjs` → `PASS — all 44 checks passed`.
Node v26.5.0. Corpus present (`ls .testdata/` → `recall-probe-R94-Q.json`), so this is the
corpus-holding seat.

## 20:05 — The finding

**Widening a population is only safe if every filter downstream of it is at least as wide.**
`verifiers` was widened by Round 123; `importsTs = verifiers.filter(<regex anchored to one `../`>)`
was not, and it feeds §(b)'s certification claim *and* §(c)'s runs. New members entered the outer
population, could not be classified by the inner filter, and landed in its **negative bucket** —
indistinguishable from a true negative.

Four mutants, real files, M0 control, against the file as Round 123 left it:

```
M0 control                            PASS — all 44 checks passed
M2  swallow, top level                FAIL — 2 of 48        §(c), both limbs
M1  swallow, one directory down       PASS — all 45 checks passed        SURVIVED
M3  unguarded, one directory down     FAIL — 1 of 46        §(b2) alone   (his M7, re-measured)
```

M1 is a verifier that imports TypeScript one level down, imports the guard, writes the guard call on
a branch that never runs, catches, prints a skip line and **exits 0** — it reports a pass having
verified nothing under the wrong runner, which is the failure §(a)–§(c) exist to prevent. Confirmed
by running it directly, not by reading it.

M1 vs M2 differ in exactly one variable (depth); M1 vs M3 in exactly one (whether the catch
swallows). **The escape is the conjunction — depth ∧ swallowing** — and each half alone is caught,
which is why four rounds on this file did not surface it.

**And the count moved the reassuring way while it was true: 44 → 45**, because §(b2) swept one file
more. An instrument whose coverage number rises as its coverage falls.

## 20:14 — The second defect, found by asking why M1 printed UNGUARDED

M1 was reported `UNGUARDED`, which looked right but for the wrong reason. Wrote M4 — a **correctly**
guarded verifier one directory down — to check. The guard-*detection* half was depth-anchored too
(`s.includes("from './lib/tsx-required.mjs'")`; a nested file writes `from '../lib/…'`):

```
UNGUARDED  checks/verify-r124-correct-nested.mjs
FAIL  every TypeScript-importing verifier imports the guard and wraps its import
ok    …under plain node: no raw resolution stack trace   {"rc":2}
ok    …plain node: exit 2, not a stack trace             {"rc":2}
ok    …and it names the invocation that works
FAIL — 1 of 56 checks failed
```

A correct file that cannot clear the red — item 1 of the file's own header, the over-fire. Ranked
above the silent miss on one axis: a silent miss gets found by the next round of load-testing; a red
a correct file cannot clear is the fastest way to get a check commented out by someone in a hurry.

The better observation underneath it: **§(b) and §(c) returned contradictory verdicts about the same
file in the same run, and nothing required them to agree.**

## 20:26 — What I built

- `importsTsSource` — depth- and quote-agnostic, no adjacent `await` required. **Nine asserted
  cases**, five true / four false; the first four trues are the four escapes this file has actually
  been *shown* to have (R122 double quote, R122 detached await, R124 depth, newline-before-specifier),
  so re-narrowing it reopens them here rather than in silence. §(a)'s treatment, his precondition 1.
- `importsGuardSource` — same treatment, five cases.
- **The agreement check.** Every other precondition in this family asks whether *one* instrument is
  behaving. This asks whether **two instruments that should be measuring the same thing still are**,
  and trusts neither alone. Discrimination measured: on M3 it correctly reports `agree` while four
  other checks fail (not their duplicate); on M1/M2 it fires alone in its category and names the
  shape — `{"source":"guarded","behaviour":"unguarded"}`.
- `SELF`/`swept` **hoisted out of §(b2) into §(b)** — one exclusion, one asserted size, three limbs.
  Forced rather than tidy: the new predicate cases quote real specifiers, so an unexcluded self-scan
  classifies this file as a TypeScript importer and §(c) then runs it expecting exit 2 — the
  verifier recursing into itself. Hit that on the way and fixed it structurally.

**Matrix against the repaired file:**

```
M0 control            PASS — all 62 checks passed        (was 44)
M1 swallow-nested     FAIL — 3 of 66    §(c) ×2 + the agreement check
M2 swallow-flat       FAIL — 3 of 66    §(c) ×2 + the agreement check
M3 unguarded-nested   FAIL — 4 of 66    §(b), §(b2), §(c) ×2 (agreement check correctly `ok`)
M4 correct-nested     PASS — all 66 checks passed, listed `guarded`   (false alarm cleared)
```

**Residual written into the file, not half-closed:** a verifier that *computes* its specifier **and**
swallows the error, exiting 0, is reachable by no limb — §(b)/§(c) need a literal to read, §(b2)
needs a crash to catch, and **both halves are required**. Closing it needs a fourth limb that is
`verify-verifier-exit-codes.mjs`'s subject; checked by `grep` rather than assumed, **that instrument
is single-target** (it names `verify-premise-render.mjs` at its line 80), so it has no population and
no version of this escape.

## 20:34 — Suite, on the corpus-holding seat

Run rather than asserted. Thirteen targets, **all rc=0**:

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

## 20:38 — Deliverables

- `scripts/verify-tsx-guard.mjs` — both predicates named and asserted, `SELF`/`swept` hoisted, the
  agreement check added, header item 5 and the §(b2) residual written. **44 → 62 checks.**
- `docs/research/round124-widening-the-outer-population-fed-two-narrower-filters-and-the-new-members-fell-into-the-negative-bucket-2026-08-30.md`
- `docs/mail/theseus-to-daedalus-cc-xian-team-your-widening-made-a-latent-narrow-filter-reachable-and-a-correct-file-could-not-clear-the-red-2026-08-30.md`
  — **fresh thread**, per his close instruction, not a revival. Stays in `docs/mail/` because the
  proposed amendment is open on his seat. Rules document **not** edited; 8b is his ruling.
- `docs/COORDINATION.md` — my section.

**No count moves.** Region count 3, surviving discriminating shapes 10, four underived pre-spend
conditions still four. Zero API calls, zero model calls, zero live runs, no GO requested. Four mutant
files and `scripts/checks/` deleted; one scratch rig (`.r124-suite.mjs`) deleted. `git status` before
commit showed one modified file under `scripts/`; **`packages/` untouched.**

**Provenance stated in both the doc and the memo rather than left implied:** the anchored regex is
Daedalus's Round 121, but it was harmless until Round 123 — with a flat `readdirSync` no nested file
could enter `verifiers` at all. His repair is what made a latent bug reachable. That is not an
argument against the repair, and my own Round 122 §(b2) is why there were three limbs to disagree in
the first place.
