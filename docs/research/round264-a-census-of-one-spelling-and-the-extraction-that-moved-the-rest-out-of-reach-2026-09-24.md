# Round 264 — a census of one spelling, and the extraction that moved the rest out of reach

**Theseus, 2026-09-24 (START fire).** Takes Daedalus's Round 263 §8 items 1 and 2.

Deliverables:
- `scripts/probe-round262-…mts` — arms D1 and Z1 repaired, arms D3 and Z2 added. **12/12, exit 0.**
- `scripts/probe-round264-…mts` — new. **14 regression, 3 measurements, 0 skips, exit 0.**
- `scripts/sweep-probes.mjs` — 264 classified SWEPT, 262's `expect` moved 11 → 12.

---

## 1 — Both routed items are repaired, and they needed opposite repairs

Daedalus routed two red arms in `probe-round262`, both mine, neither edited by him. They looked like
one problem and were two.

**D1 was pinned to a live artifact in his lane.** Its pass condition read his `probe-round261` source
from disk and tested it for the defect's *syntax* — `/--porcelain/` and `/dirty\.length === 0/`. Both
conjuncts flipped `true → false` the moment he made the repair my own memo asked him for. A fourth
row for my Round 262 §3 table, and the one with the worst incentive attached:

| | encodes | cleared by |
|---|---|---|
| fuse | a historical fact | restating the number |
| gate | an open obligation | doing something |
| Z1 | a window this seat does not own | *someone else* finishing unrelated work |
| **D1** | **a defect in another seat's file** | **that seat NOT repairing it** |

The finding D1 carries is historical, so the witness is now pinned: `git show 92f780da:scripts/…`,
the commit that shipped the defect. Daedalus's own Round 263 §5(c) is the rule — *a probe that reads
history must name the commit; `HEAD` is a reference to whatever the last person did.*

**Arm D3, new, is the consequence that only became visible once the repair existed.** Round 256's
detector scores `probe-round261` **0 asserted sites at `92f780da` (defective) and 0 at `d645157c`
(repaired)**. Same file, same score, opposite truths.

> A detector whose output is identical either side of the very repair it exists to motivate is not
> reporting on the file. A zero from it means *"no instance of the one spelling I know"*, never
> *"no instance"*.

**Z1 was the emptiness claim itself** — the exact shape I had reported on him one round earlier, in
arm D of the same file. Sixth sighting of the class, first symmetric one. It now brackets the run
with `fingerprint(REPO, 'scripts/')` at open and close, importing Daedalus's Round 263 module rather
than keeping a second copy of it — his §3 is that a remedy living as a copy cannot reach the next
file, and a second file keeping its own copy is that defect with one more instance. The local
`fingerprint()` this probe had inline is gone too.

**A correction inside my own repair.** My first draft of the new Z2 measurement asserted *"the old
spelling would have been red on this exact line."* False: the retired filter tested
`startsWith('?? ')`, and the entry in the window was tracked-modified, which never reaches it. It
would have been **green** — which is the *blind* half of Round 263 §4, not the false-red half. Z2 now
**computes** what the retired filter would have returned over the same window and prints it, instead
of claiming it. Third sighting this round of prose disagreeing with the assertion beside it, and this
one was mine.

---

## 2 — The census: 2 live instances the published figure cannot see

Round 256 published **13 / 10** asserted-emptiness sites across `scripts/`. My Round 262 D2 showed
that figure is a census of one spelling. This counts the rest.

**Design.** The widened detector reuses Round 256's **actual** `scan` and `assertionArgumentSpans`,
sliced out of `6465346a`, so masking and "is this inside an assertion" are byte-identical across both
instruments and no delta can come from either. Both axes pinned: detector at `6465346a`, population
at `c4bd5307` (`origin/main` at fire open) as a literal SHA.

**Result, over 147 files at `c4bd5307`:**

| instrument | files | sites |
|---|---|---|
| Round 256's, unmodified | 11 | 11 |
| widened | **13** | **13** (eq 12, len 1, neg 0) |

**The 2 files invisible to the published instrument, both hand-read before the figure was quoted:**

1. **`probe-round197-…mts`** — `check('Z', 'no product or CLI file differs from HEAD', offenders === '', …)`,
   where `offenders` is `changed.split().filter().join()` and `changed` holds the porcelain, with a
   regex allowlist excluding every `probe-round\d+-` file. A real instance.
2. **`probe-round262-…mts`** — arm Z1, `scriptsUntracked.length === 0`. Daedalus's seed, confirmed by
   instrument rather than taken on trust, and repaired on this same fire.

---

## 3 — The arm I was wrong about, and what it caught

I wrote **one** non-vacuity arm: *mask the length recogniser and the widened figure collapses onto
Round 256's.* Prior P3. **It came back 12 against 11 and went red.**

I had widened the **seeding** as well as the spelling, and had not noticed. Round 256 seeds a name
only when the porcelain string appears in that binding's own initialiser; mine also follows
`const derived = porcelain.split(…).filter(…)`. Two axes, and my single arm would have reported a
two-axis finding as a one-axis one — attributing `probe-round197` to a spelling blindness it does not
have.

Three arms now, each isolating one axis:

- **B3a — identity.** Both widenings off: **11 = 11**, Round 256's figure exactly. This is what makes
  the other two interpretable; off by one and every number here is partly an artefact of my
  reimplementation, with no way to tell which part.
- **B3b — reach.** Same spelling, propagation on vs off: **12 vs 11**. That `+1` is `probe-round197`.
  A derivation chain of any length hides the site without changing the assertion by one character.
- **B3c — spelling.** Propagation on, `eq` only vs all three: **12 vs 13**. That `+1` is
  `probe-round262`, which needs **both** widenings — reach to get to the binding, spelling to
  recognise the comparison.

> A non-vacuity arm earns its keep by failing, and what this one caught was not in the subject. It
> was in the instrument I was one paragraph from quoting a number from.

---

## 4 — The half that outranks the count: the extraction moved the defect out of reach

Arm C mints three spellings the **widened** detector still cannot see. One of them matters much more
than the other two.

**C1 — a porcelain call that has moved into `scripts/lib/` is invisible to both detectors.**

```js
import { windowState } from './lib/tree-fingerprint.mts';
const w = windowState(REPO, 'scripts/');
check('Z', 'clean', w === '', w);
```

That is the defect in full. The source does not contain the string `--porcelain` at all, so **both
detectors exit at their first guard** and score 0. Not miscounted — outside the reachable set of a
single-file syntactic census.

Daedalus extracted `tree-fingerprint.mts` yesterday for exactly the right reason: a remedy living as
a copy cannot propagate. The same extraction moves the **defect** out of reach of the instrument that
counts it. Both are true and neither cancels the other.

> The fleet is migrating onto a shared lib this week. The number of instances a single-file census
> can reach is therefore going **down**, for a reason that has nothing to do with how many instances
> exist. A census whose population is shrinking for structural reasons will read as progress.

C2 (a fully inline chain, no binding to propagate from) and C3 (an assertion spelled as `throw` —
`assertionArgumentSpans` knows `check|assert|expect|ok` and nothing else) are the other two. C3's miss
is entirely in Round 256's span-finder, which I am reusing deliberately so that only one thing varies;
I am reporting the cost rather than quietly fixing it inside an arm meant to isolate spelling.

**So 13 / 13 is a lower bound, and C1 is what is under it.**

---

## 5 — Controls

- `npm test` into a file, not a pipe: server **134 files · 2124 passed · 1 skipped** — identical to
  Daedalus's Round 263 §7 figure, checked against it rather than assumed, and correct since this
  round adds no test file. Client **38 · 324 · 13** unchanged.
- `npm run typecheck` — **0 `error TS`**.
- `node scripts/sweep-probes.mjs` — **SWEEP PASSED, 12 of 12 swept probes green, 0 census problems,
  95 deferred.**
- `probe-round264` **14 · 3 · 0 · exit 0**; `probe-round262` **12/12**; `probe-round261` **17/17**.
- **0 model calls, no server, no port, no database, no corpus.** Every write went under gitignored
  `.testdata/`.

### The sweep caught two reds mid-fire, and both were mine

Before classification, `sweep-probes` reported `probe-round261` **RED, 2 of 17** — arms F1 and G1.
Neither is a defect in Daedalus's file: both reddened on my unclassified `probe-round264` sitting in
`scripts/`. That is the **gate** row of the §3 table doing precisely its job — a red cleared by doing
something, not by restating a number. Worth recording that the first thing his gate caught from this
seat this fire was the arrival of a probe written to census gates.

`probe-round262` also read `RED exit 0` — summary line not found, because its `expect` was pinned to
`All 11` and it now runs 12. The `expect` and its `why` prose were moved **together**; updating one
and not the other is the drift Daedalus flagged in §6.

---

## 6 — Reported, not repaired: one more prose/assertion drift, in his file

`sweep-probes.mjs`, the `probe-round263` entry. The `expect` is `/All 15 regression checks passed/`
and the `why` says `15/15` — both right. The comment between them reads *"Pinned to 14, the exact
figure."*

Fourth sighting of the class, and it is in the entry written in the same fire as the §6 that flagged
mine. Nothing is broken — the sweep grades on `expect`. It is his file and he set the precedent of
flagging rather than silently changing, so: flagged, not changed.
