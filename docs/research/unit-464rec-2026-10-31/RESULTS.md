# unit-464rec — results

**Seat:** Theseus · **Fire:** 2026-10-31 STOP · **Model:** Opus 5
**Population rev:** `bf48ab2af18361dca29066831a3f7567b7623593`
**Pre-registration:** `PRE-REGISTRATION.md`, committed and pushed at `0e9cebb5` **before any
instrument in this directory existed**.

## Headline

**In the 64 `.mjs` of the unit directories Daedalus named, there is exactly ONE recency-keyed
rev span — and it is mine, filed this afternoon.** It is also the only span in the whole
308-file surface that feeds an **answer-key freshness decision**. It is cured.

**The defect was latent, and the reason it was latent expires.** 0 of the 110 recordings it
ranges over have been re-stamped, so the cure moves no published figure — but 31 of the 788
`.out` files in this tree *have* been, and the only thing keeping `grade-filed-maps`'
recordings out of that set is that they are two days old.

**Three repair rounds took the figure 12 → 8 → 6 spans. Every one was found by hand-reading
and none by the detector** — which is the whole argument for `GHAND` being primary rather than
confirmatory.

## Scoreline

| gate | verdict | reading |
|---|---|---|
| `GKP` | **ok** | KP → `RECENCY`, CONTROL → not `RECENCY` and reaches `PARENT` |
| `GREACH` | **ok** | 308 of 308 parsed, **0 refused**, no silent drops |
| `GSELF` | **ok, but VACUOUS — see below** | printed `0 excluded` |
| `GCRIPPLE` | **ok at the KP, vacuous at the population** | KP `RECENCY → OTHER`, CONTROL unmoved |
| `GHAND` | **ok** | all 6 surviving spans hand-read; 3 detector errors found this way |

**Predictions: 1 landed, 2 refuted, 1 refuted-as-registered-but-unfalsifiable. Three of the
four refutations are mine.**

## Population

```
surface   files    RECENCY    EVENT   PARENT   PINNED HEADONLY    OTHER
S1 (unit-*)  64          1        5        3        0       13       24
S2 (round*,
    lib, scripts) 244     5        7        1        6       93       40
```

`drive10.census-labelled.out`. `EVENT` is a declared post-hoc label — see §"The deviation".

## The one that matters: `unit-464sat-2026-10-31/grepro.mjs:96`, mine

```js
const recCommit = (git('log', '-1', '--format=%H', '--', r.from) ?? '').trim();
const blobThen  = (git('rev-parse', `${recCommit}:${c.map}`) ?? '').trim();
if (blobThen !== mapBlobNow) why.push(`map blob … at the recording's commit vs …`);
```

The surrounding comment says *"at the recording's commit"*. `git log -1 -- <file>` answers
**"the newest commit touching this file"**, which is the producing commit only while nothing
has touched it since. `r.from` is a committed `.out` recording.

**The harm direction is the inverting one, not the weakening one.** A re-stamp moves the
derived commit *forward*, so the map blob is read at a *later* tree, so it is **more** likely
to equal the baseline blob — a **stale answer key admitted as fresh**. That is the exact
failure `GREPRO` was built to prevent, so the defect turns the gate against its own purpose
rather than merely blunting it.

**Cured** at `b567b714`: re-keyed on `--diff-filter=A`, the add event. Same correction
Daedalus applied to `PRECURE_REV`, and the same shape three `round4xx` instruments already
use.

### Live or latent — measured, not argued

`drive12.islive.out`: of the **110** recordings `grepro` ranges over, **0** have been touched
by a commit later than the one that added them. So the cure **moves no published figure**, and
my 10/31 WORK `GREPRO` scoreline (6 of 8, 2 declared `UNAVAILABLE`) stands.

That is stated as an **entailment of the probe plus the source** — `recCommit` is used nowhere
but the `blobThen` derivation — and **not** as a re-drive. Re-driving `grepro` in
`unit-464sat` would re-stamp the recordings that instrument exists to read, which is the
defect class, not a check on it.

### The green is not vacuous, and the latency is not structural

A `0 of 110` from a leg that has never fired anywhere is not a measurement. So:

* `drive13.canitfire.out` — over **all 788** committed `.out` files, the two selectors
  disagree on **31**. Neither selector returned empty on any file. **The leg fires**, at a
  base rate of ~3.9%.
* `drive14.structure.out` — of those 31, **0** are `grade-filed-maps` recordings. And the
  date ranges **do not intersect**: all 126 `grade-filed-maps` recordings were added
  **2026-10-30 → 10-31**; all 31 re-stamped files were added **2026-10-15 → 10-28**.

**So `grepro`'s zero holds because `grade-filed-maps` is two days old, not because its
recordings are protected.** The latency is temporal and it expires on the first re-stamp of
any one of them — and, per Daedalus's own §7, nothing in a committed recording would say so
when it does.

## Three detector repairs, all found by hand-reading

The detector's first figure was **12 spans in 10 files** (`drive4.census.out`). Hand-reading
the 12 — which `GHAND` exists to force — found three defects **in my own instrument**:

1. **An enclosing call absorbed its inner call's argv.** `console.log('lock last touched:',
   execFileSync('git', [… 'log', '-1' …]).trim())` produced **two** `RECENCY` spans for **one**
   git call: `console.log` inherited `log` and `-1`. The over-count is silent and grows with
   how deeply an instrument wraps its git calls. Fixed by skipping nested *call* expressions
   while keeping nested array and object literals, which are the argv.
2. **`--diff-filter=<kind>` is an event selector and the registered rule called four correct
   authors defective.** `git(['log','--diff-filter=A','--format=%H','-1','--',p])` selects the
   commit that *added* `p` — normally a set of one, so the `-1` is a tie-break. `round463`
   (×2) and `round406` had it right; `round394` uses `--diff-filter=D`, the delete event, and
   **my first fix keyed on `=A` alone, which graded one spelling of the same correct
   practice.**
3. **`-1` over a hoisted pinned const.** `round387` writes `const MY_387_COMMIT = 'beb1ab78'`
   and then `git(['log','-1','--format=%B', MY_387_COMMIT])`. A classifier reading only the
   string literals *inside the span* never sees the rev, judges the selector unpinned, and
   reports the author defective. Fixed with a same-file `const NAME = '<literal>'` resolution.

**None of the three was found by the detector, by a gate, or by the cripple.** All three were
found by reading six lines of output against the source they name.

## Two more of mine, in the output rather than in the data

4. **The cripple arm printed a population figure of `0` that is an identity, not a
   measurement.** `recency-blind` deletes the rule that produces the label, so `RECENCY 0`
   under that arm is true by construction. The guard existed and the figure printed beside it
   anyway. Now labelled in the output itself, so the `0` cannot be lifted later:
   `GCRIPPLE`'s evidence is the **KP delta** (`RECENCY → OTHER`) with the **CONTROL unmoved** —
   the cripple perturbs the **key**, not the subject.
5. **A line labelled `AS-REGISTERED` was recomputing an old cell with cured code.** After the
   span and pinned repairs, `AS-REGISTERED` reported **10**, a hybrid — the pre-registration's
   rule produced **12**. The true old cell has to be read off the **recording**
   (`drive4.census.out`), never recomputed by the instrument that cured it. Relabelled.

There is a sixth, smaller one: the line explaining the `RECENCY`/as-registered difference said
*"the difference is `--diff-filter=A`"*, and it survived two repairs that changed what the
difference **was**. It is now keyed on the cause rather than on one cause's spelling.

## `GSELF` is vacuous, and says so

The leg printed **`0 of this unit's own .mjs files excluded`**. That is not a working filter
reporting nothing to do — the population is read at `baseline.rev`, which **predates every
file in this directory**, so the exclusion had nothing to exclude. What makes the census safe
from its own source is **the rev**, not the filter. The filter is untested and will stay
untested until this unit is promoted into the population, which is exactly when a reader would
start trusting it.

## Predictions

* **P1 — LANDS.** At least one `RECENCY` span in a Theseus-authored unit directory: exactly
  one, `unit-464sat-2026-10-31/grepro.mjs`. His "the population is your directories as much as
  mine" is right about my half — and **narrower and sharper than he put it**: one span, and it
  is the only one in 308 files with a live answer-key consumer.
* **P2 — LANDS.** KP → `RECENCY`, CONTROL → `PARENT,PARENT`, and the cripple moves the KP
  while leaving the CONTROL where it was.
* **P3 — REFUTED as registered, and the registered test could not settle it.** I predicted
  fewer than half of `RECENCY` spans would have a baseline consumer; measured **3 of 5 files**,
  at-or-over half. But hand-reading the three flagged `CONSUMER` shows the leg over-reports at
  the span level exactly as declared: in `round397/grade-the-anchor-that-is-not-guarded.mjs`,
  `theFixCommit` is used **only** in prose and a `.length > 8` check and **never** reaches a
  `git show <rev>:<path>`. So the *substance* of P3 — that the raw count overstates the
  harmful class — survives at the span level while the *figure* refutes it. **A file-scoped
  leg cannot decide a span-scoped claim.**
* **P4 — REFUTED as registered, by my own foil's granularity.** I registered "adjacency
  reaches the KP = no" and implemented the foil as `.test(src)` over the whole file. It
  returns **true**, because the KP's file *defines* its `git()` helper with
  `execFileSync('git', …)` twenty lines above the call. **File-containment is not span-reach,
  and a file-scoped foil cannot answer the question in either direction.** At span granularity
  — `P4b`, published beside it — a spawn-callee key reaches **0 of 1** of the KP's `RECENCY`
  spans and **3 of 6** across the population: **3 of the 6 are wrapped calls an adjacency key
  cannot identify.** The claim was right; the test I registered for it was not a test of it.

**P3 and P4 failed the same way: each was keyed at a granularity that could not settle the
claim it was registered to settle.** That is one lesson, not two.

## The deviation, named rather than absorbed

The pre-registration fixed a **five-label** set "before any code existed". `EVENT` is a
**sixth, post-hoc** label. I added it because the registered rule mis-keyed a real and correct
shape (`--diff-filter=<kind>`) as the defect, and re-aiming is the right response to that
rather than loosening a threshold. **Both figures are published**: the as-recorded
pre-registration figure (12 spans / 10 files, `drive4.census.out`) and the refined one (6 spans
/ 5 files, `drive10.census-labelled.out`).

## Hand map — all 6 surviving `RECENCY` spans

| # | span | hand verdict |
|---|---|---|
| 1 | `unit-464sat-2026-10-31/grepro.mjs:96` (**S1, mine**) | **GENUINE**, and the only one with a live baseline consumer. **Cured.** |
| 2 | `round378-instruments/grade-b3-known-positive.mjs:43` | **GENUINE** — `log -1 --grep='the 375/376 cure landed'`: newest commit matching a message. A second commit with that subject steals it. |
| 3 | `round378-instruments/…:46` | **FALSE POSITIVE** — a tie-break on the rev derived at :43. The harm is at :43, not here. |
| 4 | `round397-instruments/grade-the-anchor-that-is-not-guarded.mjs:251` | **GENUINE shape, display only.** `theFixCommit` reaches no baseline read. |
| 5 | `round397-instruments/probe-the-anchor-that-is-not-guarded.mjs:40` | **GENUINE shape** — named `HIS_396_PIN` but derived by recency. A pin that isn't pinned. |
| 6 | `round418-instruments/installed-sdk-and-sec4-by-shape.mjs:86` | **BENIGN BY INTENT** — prints "lock last touched"; current state is the point. |

**6 detector hits → 4 genuine shapes, 1 false positive, 1 benign-by-intent, and exactly 1 with
a live baseline consumer.** Only #1 is cured; #2, #4 and #5 are **named and not touched**, in
other seats' round directories, with no deadline attached.

## Not run, and not claimed

`npm test`, `npm run typecheck`, the sweep: **not run.** The pre-commit census printed
`CENSUS OK` on each commit, which is a different thing and is not offered as a gate figure.
The live checker was **not edited**. The standing cell was **not driven and not edited**. No
instrument in any other unit directory was driven or re-stamped. **`T2b`'s countdown is not
re-read this fire and is therefore not restated.** Nothing here moves xian's stop/re-scope
call.

`git status --porcelain -- packages/ scripts/`: **0 bytes** at open (`baseline.pkgscripts.txt`),
re-checked at close.

## Hygiene

Counted with `readdirSync` at close rather than recalled: **14 `.err` files, 0 non-empty**,
beside 14 `.out` recordings. Child `stdio` is pinned on every spawn in both instruments, which
is why no child's stderr leaked into a recording.

**This figure can move after this sentence is written** — it did in `unit-464sat`, where
`RESULTS.md` said 18 and three more `.err` files appeared from later drives. If a drive follows
this line, the session log's count is the later one and both stand.

— Theseus
