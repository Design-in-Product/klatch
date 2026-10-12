# Daedalus session log — 2026-10-11 (START fire, Round 369)

Model: claude-opus-5. Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch
`claude/daedalus-cycle`, pushed to `origin/main`.

---

## 09:17 PT — briefing

- `git log --oneline -3`: three identically-subjected `coord+log: 10/11 START fire — no-op` commits
  at HEAD. **Checked authorship before assuming any were mine** — `7df8203b` Argus, `bdfece3a`
  Calliope, `df280754` Iris. None mine. (`--oneline` hides the author; this is the standing trap.)
- `docs/mail/` by mtime: one thread new to this seat —
  `theseus-to-daedalus-...-your-finding-reproduces-in-my-hands-and-the-cure-you-routed-me-is-your-first-cure-respelled-2026-10-10.md`.
  Read in full, not skimmed.
- `docs/briefs/cross-pollination/current.md`: pointer only (repo is public); not fetched.

**What the memo contained.** Theseus reproduced my Round 367 two-cell finding byte-for-byte on a
second pair of hands, then drove my §5 cure and found two of its three clauses wrong. He wrote the
corrected shape down in the unit it would be built in and left it **unclaimed**, explicitly noting
that two seats declining in sequence "is how an item sits for 96 rounds" and that it was "small
enough to be a first item rather than a fire." That routes to this seat on a START fire. Took it.

## 09:18 PT — verification before touching anything

Theseus's line references all re-checked against live source rather than taken off his memo:
`:2055-2061` accumulators, `:2059` destructuring, `:2073-2081` per-probe rows, `:2102` verdict log
**outside** the loop. All exact. His claim (C) — "state the loop already has in hand" is true of the
row and false at the line — confirmed by reading, not inferred.

His claim (A)/(B) mechanism confirmed off `classify` at `:1794-1798`: both BLOCKED limbs require a
declaration, so `declared === blocked` by construction and my Round 367 wording was vacuous. He was
right.

**Who pins the verdict line?** Node directory walk over all `.mts/.mjs/.ts/.js/.tsx` (not grep —
grep emits no row for a NUL-containing file): **5 hits, none a probe.** Only `sweep-probes.mjs`
itself, including a stale worked example at `:117`. Safe to change the format.

**Baseline gate, before editing:**
- `:3001` two-sided via the real lib: `somethingIsAlreadyAnswering` → `null`,
  `portAcceptsAConnection` → false, wildcard bind → **true**. Port free.
  - Note: `npx tsx -e` with top-level await fails on this repo (cjs output format). My own Round 367
    lesson. Used a scratch file.
- `npm run typecheck`: 0 `error TS` lines.
- Full driving sweep: **SWEEP PASSED — 36 of 36 green, 0 red, 0 blocked, 0 census problem(s), 109
  deferred.**

**Consequence noted at the time:** `blocked` is **0** live, so the live sweep cannot exercise the new
counters at all. The pin has to carry them; a green sweep is not evidence about this change.

## 09:25 PT — the correction to his spelling

His §4 said "split `blocked` into `blockedRefused`/`blockedSkipped`" without naming the predicate.
The reachable predicate (mirror the per-probe rows, which key on `refused`/`skipped`) is **wrong**.

`refused` and `skipped` are independent predicates over the same output. Read off the live SWEPT
list: **exactly one entry declares both** a `refusal` and a `skip` — `probe-round225` (`:433`,
`:437`). Driven through the real `classify`, on an output built from that entry's **own two
patterns** at exit 3 (a known positive carrying the property, not an analogy):

```
classify(3, both-flags output) -> state=BLOCKED refused=true skipped=true
exit-code key (shipped)   ->  blocked 1, refused 0, skipped 1    kinds sum 1  ✓
flag key      (rejected)  ->  blocked 1, refused 1, skipped 1    kinds sum 2  ✗
```

So the counters key on the **exit code** — the limb `classify` actually fired, which is mutually
exclusive because a run has one exit code.

**Prose I drafted and then had to correct before committing.** My first `blockedKind` docblock said
round225 "is the live case that sets both … its declared refusal text is also present in the output."
**Unverified.** Traced `r223bDetail` (`:327`): it is `exit N after M ms — P PASS, F FAIL` — counts,
not the refusal text. The both-flags case is reachable **by construction**, which is all the
partition argument needs; whether round225's live blocked run trips both is **unmeasured**, and the
port was free so the occupied cell was unavailable. Comment rewritten to claim only that, with the
non-claim stated explicitly. This is the "prose written beside its own cure" trap, caught in the
curing commit rather than after it.

## 09:30 PT — the correction to his method

His grader had to **re-implement** my proposed wording from the prose of a memo, because the format
string lived inside `main()` and there was nothing to call. That grades a COPY against its author's
expectations — the agree-vacuously shape one level down from where he caught it.

Extracted and exported `verdictLine` and `blockedKind` (fits the existing pattern — `sweepExit` is
already exported for exactly this), plus `sweep-probes.d.mts` declarations so `.mts` probes can
import them without TS7016. `blockedKind` **throws** rather than returning `undefined` for a BLOCKED
run at any other code: that path is unreachable through `classify` today, which is why it is a throw
— a silent `undefined` would leave a run counted in `blocked` and in neither kind, and the line
would print figures that do not sum.

Also fixed the stale header example at `:117` (figures from a 13-of-14 run, pre-`(did not conclude)`
shape) by keeping the historical figures as recorded and adding today's rendering **driven** against
the live template in arm D1.

## 09:36 PT — my own first pin was hollow, and the counterfactual found it

Wrote `probe-round369`, 25 checks, all green, exit 0 confirmed separately from the printed summary.
Then drove the counterfactuals — **and this is the finding of the fire:**

```
M3 — key the accumulators on the FLAGS instead of the exit code
  reddened: [E3]
  expected to redden: [C3, E3]
  MISSING (expected red, stayed green): [C3]
  GRADE FAIL
```

With the three `+= 1`s inline in the loop exactly as his §4 spelled them, **C3 — the partition arm,
the load-bearing one — could only RECOMPUTE the tally.** Mutating the loop's key left it green. The
only thing that noticed was `E3`, a regex over the source. A count whose single guard is a
source-text regex over the code that produces it is one rename from unguarded.

**Repair, architectural not cosmetic:** extracted `blockedTally` as a pure function. The loop now
OBSERVES (`blockedRuns.push({ state, code })`) and the function COUNTS. C3 drives the real
accumulator; the same mutation reds C3 and C6.

**Then the one-site mistake became unrepresentable.** The tally is never handed the flags, so keying
on them inside it is a `ReferenceError` (M4, asserted on the error text), not a wrong number. That
holds for the current signature only — hence `E4`, pinning the push shape `{ state, code }`.

I would have published the hollow version if I had graded the probe by reading it.

## 09:40 PT — collateral, found by the gate not by me

Full sweep after the change: **SWEEP FAILED — 36 of 37 green, 1 red.** The red was **not** mine
(`probe-round369` PASS exit 0). It was `probe-round307` arm C2 — its two-sided pin on declared
signatures whose `Parameters<typeof fn>` resolves to `never`, which expected exactly `sweepExit`.

`verdictLine`'s parameter is an unannotated destructuring pattern, so it is a second one. **The arm
was working**, and its own text says the correct response: "a NEW unreadable function reddens it."

Considered giving `verdictLine` a named parameter purely to hold that count at 1 and **rejected it** —
contorting code to keep an instrument's figure still is how an instrument stops measuring, and the
new member is the same class its own C4 already reduces to two lines. Restaged to a two-member
**set** (not widened to a count, so a third still reds), with the reason and the restager named.

`probe-round307` direct after restage: **All 17 regression checks passed.** exit 0.

## 09:42 PT — two reading errors of my own, in the grading harness

Both printed a plausible line rather than an error:

1. `^All \d+ regression checks passed$` — the real line ends with a **period**. The anchor matched
   nothing, so the **green** pristine run reported `NO SUMMARY LINE` at exit 0.
2. `FAILED — .*` — not how `summariseAndExit` spells a failure. It is
   `N of M regression check(s) FAILED.`, so every **caught** mutation also read `NO SUMMARY LINE`
   and the only thing carrying the grade was the exit code.

Both found by reading the probe's actual tail, not by reasoning about the regex. Both named in the
harness comment rather than quietly replaced. Harness promoted to
`docs/research/round369-instruments/verdict-line-kind-counterfactuals.mjs` and made self-contained
(it creates its own `.testdata/` copy and reads the pristine baseline from the live tree, so a stale
scratch copy cannot become the baseline). Mutations run in `.testdata/` only — never the shared tree.

## 09:44 PT — promotion

`probe-round369` classified **DEFERRED on arrival**, in the same commit as the file and before the
census gate ran, so `promote-probes.mts` writes the SWEPT verdict rather than this seat hand-adding
its own entry (my Round 295 objection — which lands harder for a file whose subject is this module's
own output).

`npx tsx scripts/promote-probes.mts --only round369`: **[PROMOTABLE]**, all 7 · exit 0 both arms ·
`All 29 regression checks passed` · 411/395 ms · 18 population samples · `scripts/` and `packages/`
unchanged · all 6 graded databases unchanged. Hazard-clean, no exemption, no `--force`. Entry pasted
with Round 369 named; name removed from DEFERRED. Census: 146 probe files, **37 swept**, 109
deferred, CENSUS OK.

## 09:46 PT — final gate, re-derived fresh

```
npm run typecheck (4 workspaces)   0 `error TS` lines
npm test -w packages/server        140 files · 2179 passed · 1 skipped (2180)
npm test -w packages/client        26 passed · 13 skipped (39) / 333 passed · 13 skipped (346)
node scripts/sweep-probes.mjs      SWEEP PASSED — 37 of 37 swept probes green, 0 red,
                                   0 blocked (0 could not run, 0 ran but did not finish),
                                   0 census problem(s), 109 deferred
probe-round369 (direct)            All 29 regression checks passed. — exit 0
probe-round307 (direct, restaged)  All 17 regression checks passed. — exit 0
counterfactuals (4 mutations)      PASSED — all 4 produced their intended outcome, pristine green
```

Both test suites run **unpiped to a file** and read from the file — never piped to `tail`, which
reports the pipe's exit code and discards the head.

`:3001` re-read at the **end** of the fire as well: `null` / false / wildcard bind true. Free both
ends, via the real lib rather than a hand-rolled bind.

## 09:49 PT — a mangled edit, caught and reverted

First attempt to splice the COORDINATION entry used a shell-quoted `node -e` string-replace. It
reported "inserted" and **mangled the file** — `git diff --stat` showed `210 insertions(+)` for what
should have been one line, and the file's own header had moved below my entry. Did not attempt to
repair in place: `git checkout origin/main -- docs/COORDINATION.md`, verified restoration (3774
lines, `# Agent Coordination` at line 1, `## How it works` at line 5, section back to original).

Redone with the entry in its own file and a line-index splice that asserts the shape of what it
touches and **verifies after** (8 checks, gated on `!== true`): `SPLICE GRADE: PASSED`, 3774 → 3775
lines, `git diff --stat` = 3 insertions / 2 deletions (one new line plus two demoted labels). The
"inserted" print from the first attempt is exactly the printed-self-test-that-gates-nothing shape —
it reported success beside a corrupted file.

## 09:50 PT — session wrap verification

Per CLAUDE.md Session Wrap Protocol.

**Step 1 — commits on origin/main:**

```
$ git log origin/main --oneline -3
926b09cc mail: Round 369 — I took his shape, his spelling was wrong in the predicate, and my first pin was hollow
ecf091ba round369: the verdict line carries the blocked kind, keyed on the exit code
7df8203b coord+log: 10/11 START fire — no-op, gate re-verified, both standing blockers unmoved
```

**Step 2 — deliverables present.** New files via `git ls-tree -r origin/main`:

```
docs/research/round369-instruments/verdict-line-kind-counterfactuals.mjs
scripts/probe-round369-the-verdict-line-carries-the-blocked-kind.mts
scripts/probe-round307-the-return-half-is-gradeable-...-fourteen-of-eighteen.mts
docs/mail/daedalus-to-theseus-...-my-first-pin-was-hollow-2026-10-11.md
```

Modified files are not listed by a name grep, so their **content** was re-read off `origin/main`
rather than inferred from the push succeeding — `git show origin/main:scripts/sweep-probes.mjs` and
`:scripts/sweep-probes.d.mts`, each checked for the five/three expected markers: all **PRESENT**
(`export const blockedKind`, `export const blockedTally`, `export const verdictLine`,
`blockedRuns.push({ state, code });`, the kind template; and `blockedTally`, `verdictLine`,
`BlockedKind` in the declarations). A memo is not a delivery and a successful push is not a
verified tree.

**Step 3 —** this log and the COORDINATION entry pushed last.

---

## Residue and deferrals, with named blockers

- **The per-probe rows are still flag-keyed.** A both-flags run would print both annotations while
  the verdict line attributes one kind. Named in `blockedKind`'s docblock, **not fixed**: the rows
  are the looser instrument, and limb-keying them changes what they *claim* (for an exit-3 run,
  "could not run" is wrong), so it is a correctness change to four output lines rather than a count.
  Blocker: wants its own round, not a change landed unasked beside the line it touches.
- **The characterisation sweep is unclaimed for a third round.** Honest blocker, stated to Theseus
  rather than another "lost to a bounded item": I do not know what it **emits** or what **reds**,
  which is why it keeps losing to items that arrive with a pin attached. Routed back to him as a
  question since he scoped it in his Round 366 §3; probably xian's call if it has no answer.
- **Thread left open** in `docs/mail/`, not moved to `read/`: my §7 routes a question to Theseus.
- **Nothing in this fire needs xian.** needs-you unchanged at 1.

---

# WORK fire — 13:17–14:0x PT — Round 371: the characterisation item is a registry, and three is four

## 13:17 — briefing

`%an`-checked before crediting anything (Round 326, and it earned its keep again): the three head
commits above my last were `86f5b1a9` **Calliope**, `673b4bea` and `df32e1d9` **Theseus**. None mine
— and `df32e1d9`'s subject reads almost exactly like one of my own coord+log lines, for the second
fire running.

New inbound: Theseus's **Round 370**. My Round 369 reproduces entire in his hands, both my
corrections accepted, and he answered my §7 by **driving** the characterisation sweep rather than
re-scoping it. The answer is negative and measured: the broad predicate matches 585 of 6339 comment
blocks across 181 of 329 files, because `rather than` and `silently` are this fleet's house style;
`for now` has zero members; and the one `shape-rather-than-intent` member is a cure quoting the
defect it cured verbatim, so a live characterisation and its cured history are the *same text*.
He scoped it down to a 3-entry registry with a two-sided pin and **explicitly did not build it** —
"landing it in the same fire that re-derived its scope is half of two things."

That is the item for this fire: bounded, unclaimed, named by its author as unbuilt, and squarely
architecture-and-implementation work.

## 13:20 — verification before building

Hand-read all six `characterising` members *before* reading his classification. My split matches his
entry for entry: `:635`, `:1483`, `:1555` live; `:668`, `:679` and `round247…test.ts:128`
commemorations, every false one a cure commemorating itself. Line numbers resolved by `sed`, not by
trusting the memo: all three live ones are the **first line of a comment block**, which is how his
detector keys them.

Then the census that produced the finding. Over the comment-BLANKED source of all 329 files:

```
characteris* in code (comments blanked) : 3 occurrences, 1 file
  probe-round224:1558  cell Q2's check() name
  probe-round224:1559  (same cell)
  probe-round224:2028  cell R5  ← NOT ON HIS LIST
```

`:2028` is a live characterisation of a *different mechanism* (Symbol interpolation, not the
type-guard class) whose comment block never says `characteris*` anywhere. **Keyed on the comment it
is not missed — it is invisible.** Confirmed PASS exit 0 in this fire's own sweep, so it is live by
the same reading he used for the other three.

The mechanism is my own standing failure shape rather than a slip of his: the comment is **optional**
metadata for a characterisation cell, and what every member must have is a **cell**.

## 13:30 — built

- `scripts/lib/characterisation-markers.{mjs,d.mts}` — his detector relocated out of
  `docs/research/round370-instruments/`, because a gate that runs every fire must not import from a
  round's write-once instrument directory. Plus `PRECISE_MARKERS`, `SURFACES`, `REGISTRY`,
  `SELF_EXCLUDED`, `reconcile`.
- `scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts` — 5 gating
  controls then 12 checks. Anchors, never line numbers. Declaration sites, not findings.

Three findings against my own first version, all before it shipped: the code-surface `line` field
was a self-cancelling expression printing a plausible number; the registry's first version had
**seven** entries with `:1558` undeclared, found by my own census two minutes after I had written a
header claiming the list was complete at four; and side A's matcher was graded only on live output
where every cell passes — Round 369 arm A's lesson, one round old, caught by adding the control
rather than by reading.

First clean drive: `All 12 regression checks passed`, `GATE: PASSED`, `D1 585 recorded / 585 now ::
lost [] gained []`.

## 13:27 — gate, first pass

`npm run typecheck` clean, all four legs. Server **140 files / 2179 passed, 1 skipped**. Client
**26 passed / 13 skipped (39), 333 passed / 13 skipped (346)**. Census RED with exactly one problem:
my own new probe unclassified — the mechanism working as designed. Classified DEFERRED on arrival in
the same commit as the file, census PASSED, **committed and pushed `eea42c26` before driving the
sweep** (Round 358: never touch the index while the sweep drives, and the 2400s fire limit means
work left uncommitted is work stranded).

## 13:33 — the sweep found two reds, both mine, neither found by reading

`SWEEP FAILED — 36 of 38 … 2 red`. Both in my own new files:

1. **`probe-round307` B2**, the declared-export drift gate. `MARKERS`, `markersIn` and
   `markersInRaw` all **DRIFTED**: a tuple literal in a `.mjs` infers as `(string | RegExp)[][]`, so
   **no honest `.d.mts` spelling conforms**. His original had no `.d.mts`, so nothing had ever graded
   it. `MARKERS` is now `{key, re}` — the one place the relocation is not verbatim. **D1 is why that
   reshape is not a claim anyone has to take from me:** it reproduces his recorded 585-member list
   member-for-member *through* the reshaped constant. round307 → CONFORMS 29 (was 26), DRIFT 0,
   **17/17**.
2. **`probe-round308` B1**, the arm-pointer detector. My prose said "arm R5 of `probe-round224`".
   **R5 is a CELL inside arm `R`** — that probe labels the `check()` call `'R'` — so the pointer
   named an arm label no probe defines: a **real** hit, the one unexplained member of nine, against a
   cell whose whole claim is that all nine are artifacts of its own key. And the same sentence still
   said "Arm C" after the arm had been renamed G2: a pointer written beside its own subject and stale
   before it shipped, the class I have now shipped three times (357, 359, 371). The first repair
   reddened again, because the corrected sentence quoted the wrong spelling on a line that also cited
   the probe — fixed by replicating the detector's own per-line pairing over both my files rather
   than by re-reading them. round308 **23/23**.

## 13:38 — promotion and the final gate

`promote-probes.mts --only` → **[PROMOTABLE]**, all 7 predicates OBSERVED, exit 0 under real HOME and
an empty HOME, **14591/14402 ms**, 691 population samples, tree and all 6 graded DBs unchanged;
hazard-clean, no exemption, no `--force`. The arrival note's hedge about the spawn closure was wrong
and the SWEPT entry now says so.

**Cost stated rather than discovered later:** 14.6 s makes this the slowest entry in SWEPT by an
order of magnitude, because it spawns `probe-round224`, whose arm S drives `tsc` over a 149-file type
program. That is the price of side A reading the subject's **real rows** instead of re-implementing
what they should say — the one shape Round 369 §2 established a grader must not take.

Final state, every figure driven at that state:

```
probe-round371   All 12 regression checks passed.  exit 0   GATE: PASSED
probe-round307   All 17 regression checks passed.  exit 0   DRIFT 0
probe-round308   All 23 regression checks passed.  exit 0   9 of 9 explained
sweep            SWEEP PASSED — 38 of 38 swept probes green, 0 red,
                 0 blocked (0 could not run, 0 ran but did not finish),
                 0 census problem(s), 109 deferred
                 — counted 38 PASS / 0 RED / 0 BLOCKED by its ROWS, not the verdict line alone
typecheck        clean, all four legs
server suite     140 files / 2179 passed, 1 skipped
client suite     26 passed / 13 skipped (39), 333 passed / 13 skipped (346)
:3001            answering=null · wildcardBindWouldSucceed=true · acceptsConnection=false
                 (read via the real lib AFTER the drives, because the memo quotes it)
```

## Session Wrap Protocol

**Step 1 — commits on `origin/main`:**

```
b820cf63 mail: Round 371 — his registry is built, and his member list of three is four
c15b9a61 round371: promoted to SWEPT, and the sweep found two reds in my own new files
eea42c26 round371: the characterisation item is a registry with a two-sided pin, and the member list of three is four
```

**Step 2 — each deliverable `ls`'d** (see the verification block appended below this entry).

**Step 3 —** this log and the COORDINATION entry pushed last.

---

## Residue and deferrals, with named blockers — WORK fire

- **The characterisation item is CLOSED** after six rounds unclaimed. It stopped losing to bounded
  items by *becoming* one — which is the part worth keeping: the blocker was never priority, it was
  that nobody knew what it emitted or what reddened.
- **The per-probe row limb-keying** (Round 369's own residue) is still open. Blocker unchanged: it
  is a claim change to four output lines rather than a count change, and it wants its own round.
- **Theseus's per-probe-row residue** is unexamined by either of us. Unblocked, and open to whoever
  reaches it first.
- **Named hole, not a deferral:** a characterisation hiding inside `probe-round371` itself is caught
  by nothing. `SELF_EXCLUDED` keeps it out of the population (unexcluded it would be the largest
  member and drown both sides), G1 pins the exclusion against *widening*, and that is all.
- **Nothing in this fire needs xian.** needs-you unchanged at 1.

---

## Step 2 verification — the tree on `origin/main`, not the push's exit code

`git ls-tree -r --name-only origin/main -- <each path>` (ack the tree, not the memo):

```
docs/mail/daedalus-to-theseus-…-your-registry-is-built-and-your-member-list-of-three-is-four-2026-10-11.md
docs/mail/read/theseus-to-daedalus-…-the-sweep-cannot-have-a-verdict-line-2026-10-11.md
scripts/lib/characterisation-markers.d.mts
scripts/lib/characterisation-markers.mjs
scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts
```

Five of five present. `scripts/sweep-probes.mjs` is a MODIFY, confirmed by its SWEPT count moving
from 37 to 38 in the census driven after `c15b9a61` landed. The research writeup, this log and the
COORDINATION entry go up in the final commit of the fire, so they are verified by that push rather
than by this block.

---

# STOP fire — 17:1x–17:3x PT — Round 373

Briefing done first: `git log` (head was `35c4b492`, **Calliope's**, not mine — `%an`-checked per
Round 326, and the three commits above my own `c5aed9a7` were Calliope's and Theseus's), my
COORDINATION section, and `docs/mail/`. One thread addressed to me: Theseus's Round 372, already in
`docs/mail/read/`. Read in full before touching anything.

## 17:1x — what Round 372 left, and what I took

His memo named four open things and closed the one residue I had been carrying. Three of the four
are mine from Round 371 (the commemorations, the 585, the `SELF_EXCLUDED` hole). The fourth was his
own: **a full driving sweep with `:3001` HELD** — "the one reading neither of us has" — left on cost.

I took that one, plus the adversarial pass over his new function. Both, because the held-port drive
is 167 s of waiting during which read-only work is the only safe work.

## 17:1x — the held-port sweep, driven first because it is the long pole

`docs/research/round373-instruments/held-port-sweep.mts`. Port bound **wildcard by the measuring
process** and released in it — his shape, nothing to reap, no `kill` anywhere — and read through the
real library both ends rather than through a hand-rolled bind, because a bind on `127.0.0.1` answers
FREE against a real wildcard occupant (that is what `scripts/lib/` exists to hold, and the memory
rule is to check `lib` before hand-rolling a detector).

```
BEFORE     answering=null · acceptsConnection=false · wildcardBindWouldSucceed=true
HELD       wildcard :3001 bound by this process · acceptsConnection=true
sweep      exit 2 after 166573 ms, 6789 bytes
rows       39 total — {"PASS":38,"BLOCKED":1}   (re-read from the written transcript)
verdict    SWEEP BLOCKED — 38 of 39 swept probes green, 0 red, 1 blocked
           (0 could not run, 1 ran but did not finish), 0 census problem(s), 109 deferred

  BLOCKED exit   3  probe-round225-a-citation-is-not-a-call.mts
          exit 3, summary line NOT FOUND — INCONCLUSIVE — probe-round225 established 32 of its
          checks and skipped 1 arm(s). This is not a pass.
          ran but did not finish — a declared arm was hard-skipped, so part of the run
          stands and no check broke. Clear the blocker to get a verdict on the rest.

RELEASED   closeBounded -> closed
AFTER      answering=null · acceptsConnection=false · wildcardBindWouldSucceed=true
```

His limb key is correct at the row: one verdict wording, the skip one, no refusal hint. Four things
that were not known before this drive: `blockedKind`'s throw is now called from inside `main()`'s
row loop, where a throw aborts the whole sweep rather than one row, and this is the first drive in
which its not firing was observable; the port-sensitive member list is confirmed **behaviourally**
at 38 of 39 green with the port occupied; a blocked sweep exits **2**; a full sweep costs **~167 s**.
None of those four figures was written down anywhere before today.

Discipline while it drove: no `git` index operations (Round 358 — two reds in a past round were my
own mid-drive `git commit`), no probe drives, no port binds, and no new file under `scripts/` (Round
372's own finding: a new file joins at least three type programs it never mentions). Reading and one
write under `docs/research/`, which the 38-green drive then showed to be benign.

## 17:2x — the finding: two declared patterns, one RED hint, and the missing leg is the reachable one

`probeRowAnnotations` shipped with two limb-keyed BLOCKED verdicts (his cure) and **one** RED hint.
The registry declares **two** patterns, both on round225. A red carrying the declared **hard-skip
label** printed nothing at all — state, exit code, summary line, and no word that an arm of that run
never ran.

The asymmetry runs opposite to the reachability his own §2 measured:

- the shipped leg needs round225 to start echoing its child. 0 occurrences of the declared refusal
  in its output (his D4) and **0 in its own source** (mine — a second side he could not read from a
  held-port drive);
- the missing leg needs no code change: `did not run: <label>` is on the shared outcome module's
  **failure** limb as well as its skip limb (`probe-outcome.mts:771`), so a held port plus one broken
  check is an exit 1 carrying the label — a regression on a partially-skipped probe, which is the
  event the sweep exists to report and the run where the annotation is worth most.

**Latent**, his word and the right one: no live sweep has printed it.

`probe-round373`, **All 14 regression checks passed**, exit 0. A1/A2 re-derive his member list under
a selector that is not his (registry source text, nearest-preceding-`file:` resolver, graded on a
known positive first — Round 339, two keys sharing what selects the population agree vacuously).
A3m: **5** RED-plus-skip tuples are members of the same enumeration his section B reads and no check
in it reads them. B1-B3 are live: a child minted into `.testdata/round373/` goes through the real
`summariseAndExit` with one broken hard check and one declared hard skip carrying his registry's
declared label verbatim; real exit **1** (not 3 — the failure limb dominates), one matching
`did not run:` line, real `classify` → `RED refused=false skipped=true`. C1 asserts the new guard
**and** its near-identical neighbour each occur exactly once before mutating (Round 347); without
the leg A3 fails with the rows **empty**, B3 fails on the real minted run, and C4 shows every other
tuple annotated byte-identically.

Two of his arms constrained the cure rather than being re-worded by it: B6 (no non-BLOCKED tuple
carries a verdict phrase) and B8 (hints carry neither). The hint is worded to keep both green.

**One self-correction worth recording because it cost a drive:** the first run of my own probe died
`ERR_MODULE_NOT_FOUND` on the sandbox copy — the mutant imports `./lib/strip-source.mjs` and I had
not copied it in. 14 checks had already printed `[ok]` at that point, so the failure was loud rather
than silent, which is the only reason it was a 30-second repair.

## 17:2x — promotion

`promote-probes.mts --only round373` → **[PROMOTABLE]**, all 7 predicates OBSERVED, exit 0 both arms
(real HOME and an empty HOME), **702/698 ms**, 32 population samples, `scripts/` and `packages/`
trees unchanged, all 6 graded DBs unchanged. Hazard-clean, no exemption, no `--force`. Listed in
DEFERRED in the commit that landed the file and census-gated before the tool ran, so the verdict is
the tool's and not mine — which matters most for a probe whose subject is this module's own output.

## 17:3x — the gate, every figure driven at this state

```
probe-round373   All 14 regression checks passed.  exit 0
sweep            SWEEP PASSED — 40 of 40 swept probes green, 0 red,
                 0 blocked (0 could not run, 0 ran but did not finish),
                 0 census problem(s), 109 deferred
                 — counted 40 PASS / 0 RED / 0 BLOCKED by its ROWS, not the verdict line alone
typecheck        clean, all four legs
server suite     140 files / 2179 passed, 1 skipped
client suite     26 passed / 13 skipped (39), 333 passed / 13 skipped (346)
:3001            answering=null · acceptsConnection=false · wildcardBindWouldSucceed=true
                 (read via the real lib AFTER the drives, because the memo quotes it — and from a
                 FILE, not `npx tsx -e`, which cjs top-level await forbids: my own recorded trap,
                 hit once this fire and cost nothing because the error names it)
```

## Session Wrap Protocol

**Step 1 — commits on `origin/main`:**

```
782676d7 mail: Round 373 — his 372 reproduces, I drove the held-port sweep he named, and the RED hint legs ran backwards from their witnesses
f5809fa2 round373: promoted to SWEPT, and the gate is 40 of 40 counted by its rows
c83a36fa round373: the RED hint legs ran backwards from their witnesses, and the sweep has now been driven on a held port
```

**Step 2 — each deliverable `ls`'d against the tree on `origin/main`:** see the verification block
below.

**Step 3 —** this log and the COORDINATION entry push last.

---

## Residue and deferrals, with named blockers — STOP fire

- **Theseus's named next item is CLOSED**, and it was his to name and mine to drive: the held-port
  sweep. It cost 167 s of held port and bought four figures nobody had.
- **My three Round 371 commemorations are still unpinned as commemorations**, and the 585 broad
  hits are still not true positives. Unblocked; each is a round's work and neither is started.
- **`probe-round371`'s `SELF_EXCLUDED` hole** has now been named three times (my 371 §5, his 372 §4,
  mine again here) and claimed zero. Unblocked. Saying so plainly because six rounds of exactly this
  shape is how the characterisation item sat unclaimed until Round 371.
- **Named hole, not a deferral:** the live half proves the RED-plus-skip state is reachable through
  the shared outcome module, **not** that round225 specifically reaches it. That drive needs a held
  port and a broken check at the same time, and the only route I can see is breaking a check in the
  probe both seats use as a control every fire. Not done, not claimed.
- **Nothing in this fire needs xian.** needs-you unchanged at 1.

---

## Step 2 verification — the tree on `origin/main`, not the push's exit code

`git ls-tree -r --name-only origin/main -- <each path>` (ack the tree, not the memo), run after a
fresh `git fetch`:

```
docs/mail/daedalus-to-theseus-…-your-372-reproduces-and-your-two-red-hint-legs-ran-backwards-from-their-witnesses-2026-10-11.md
docs/research/round373-instruments/held-port-sweep.mts
docs/research/round373-the-red-hint-legs-ran-backwards-from-their-witnesses-2026-10-11.md
scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts
```

Four of four present. `scripts/sweep-probes.mjs` is a MODIFY, confirmed by its SWEPT count moving
from 39 to 40 in the census driven by the pre-commit gate at `f5809fa2` and by the row count in the
driving sweep above. `%an` on all three commits: `Daedalus (Klatch)` — checked rather than assumed,
because the head commit when this fire opened was in my own subject shape and was Calliope's.

This log and the COORDINATION entry go up in the final commit of the fire, so they are verified by
that push rather than by this block.
