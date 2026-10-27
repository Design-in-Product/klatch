# Daedalus session log — 2026-10-27 (START fire, Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`,
synced to `origin/main` by the wrapper before the fire.

---

## 09:17 PT — open, briefing

`date` → `Tue Oct 27 09:17:12 PDT 2026`. Worktree clean, `HEAD` == `origin/main` ==
`69028159`.

**Authorship of the 5 head commits read with `%an` before assuming any was mine:**

```
69028159 Argus (Klatch)      | coord+log+mail: 10/27 START fire — declined both asks …
f5c1142b Pard (Mediajunkie)  | mail(Pard): janus-to-daedalus-…-round249-has-failed-on-github…
29f4e3f8 Calliope (Klatch)   | coord+log+mail: 10/27 START fire — CI-failure memo verified …
9d08b596 Iris (Klatch)       | coord+log: 10/27 START fire — no-op …
9456918b Pard (Mediajunkie)  | briefs: fire-depth report 2026-10-27
```

None mine. Two carry "10/27 START fire" subjects that read like my own.

`docs/COORDINATION.md` read (my section). `docs/mail/` read on arrival, not batched —
**two memos new to this seat, both routing the same item here:**

1. `calliope-to-daedalus-cc-janus-argus-xian-ci-failure-is-not-a-recent-commit-routing-round249-to-you-2026-10-27.md`
2. `janus-to-daedalus-cc-calliope-argus-xian-correction-round249-has-failed-on-github-since-it-was-added-2026-10-27.md`

Janus's correction, read in full: every CI run on `main` since `eaf0c023` (09-22) has failed,
24 runs; last green `581db125`; `eaf0c023` is the commit that **added**
`round249-the-ownership-guard-drives-its-own-matrix.test.ts`. From `bc1fdfea` (09-25) on, the
same 2 tests fail with the same assertions:

- "reproduces all cells, and every bind column still has a miss" — `expected [ false, false, false ] to deeply equal [ true, false, false ]`
- "a ::1-only occupant is not a clear port" — `expected false to be true`

This fire IS that routed item. Acted on in the same fire it was read.

## 09:18 — what I could not verify, recorded before anything else

`gh run list --workflow=ci.yml --branch=main` → **"This command requires approval"**. `docker info`
→ same. So from this seat I can neither re-read the run logs nor take a Linux measurement.

**Janus's figures are therefore his measurement, not mine**, and are attributed to him by name in
the commit message, the module comment and the reply memo. I did not launder them into a flat
assertion anywhere.

## 09:19 — local behaviour, measured

```
npx vitest run packages/server/src/__tests__/round249-…test.ts --root packages/server
→ 1 passed (1) · 15 passed (15) · 7.36s
```

Green on darwin. So this is not a test that is broken everywhere; it is a test that is right
about one platform.

## 09:19 — the cause

`scripts/lib/probe-server-ownership.mts`'s **own first paragraph** already names it:

> Node sets `SO_REUSEADDR`, and BSD/macOS permits a specific-address bind alongside a wildcard one

Linux does not. With `net.ipv6.bindv6only=0` (the Linux default) a `::` listener claims the IPv4
space too, so `bind 127.0.0.1` **collides** with a `::` occupant rather than succeeding beside it.
That is exactly `[false, false, false]` against the asserted `[true, false, false]` — on Linux all
three columns collide with a `::` occupant; on darwin the first one does not.

The test took a correct measurement on one machine and asserted it as a fact about TCP. Round 249's
own §1 rule, one axis up: the matrix *was* re-taken every run, and the **platform** was the thing
held constant. The enumeration of platforms was one row long.

Also recorded as **not asserted**: I could not tell from Janus's summary which of the two boolean
legs in the `::1` test produced `expected false to be true`. Both `portAcceptsAConnection` and
`aWildcardBindWouldSucceed` are candidates. The fix prints both so the next run names it.

## 09:20 — census of the mechanism, not just the reported instance

```
grep -rln -e aWildcardBindWouldSucceed -e aBindWouldSucceed -e SO_REUSEADDR -e bindv6only packages scripts
→ 6 files
  packages/server/src/__tests__/round277-a-cleanup-that-can-hang-withholds-the-answer.test.ts
  packages/server/src/__tests__/round249-the-ownership-guard-drives-its-own-matrix.test.ts
  scripts/probe-round276-…mts · scripts/probe-round221-…mts · scripts/probe-round374b-…mts
  scripts/lib/probe-server-ownership.mts
```

Only 2 are tests (`scripts/probe-*` are not run by CI). Round 277's bind assertions are
wildcard-vs-wildcard, which collides on **every** platform — read, not assumed. So round249 is the
sole carrier among tests, which agrees with Janus's "the same 2 tests".

## 09:21 — the fix

`packages/server/src/__tests__/round249-…test.ts` + a correction to the module comment.

- `RECORDED_BIND_MATRICES`, keyed by `process.platform`. Only `darwin` recorded, because that is
  the only platform this fleet has measured. The cell-level test is `it.runIf(recorded !== undefined)`
  — it **skips** where no table exists. Unmeasured, said out loud, rather than laundered into a pass.
- The measurement **prints on every run** (`R249-MATRIX`), and the `::1` decision test prints
  `R249-COLON1`. The CI log is the instrument that can record the linux row.
- Unconditional, on every platform: `portAcceptsAConnection` reaches all four occupants, and the
  module's wildcard helper agrees with a local reimplementation of the same bind. Those are the only
  claims here that are about the module rather than the kernel. **The port guard is not wrong on
  Linux** — the connect-based decider is sound on both; only the *characterisation* of why a bind
  test cannot replace it is BSD-specific.
- The `aWildcardBindWouldSucceed` leg inside the `::1` test was a matrix cell and moved behind the
  gate with the rest. The `somethingIsAlreadyAnswering` leg — the actual Round 273 regression guard
  — stays unconditional.
- A non-vacuity test asserts `darwin` is a key of the table, so a typo in the key reddens on our own
  machines instead of silently skipping the whole table check.

## 09:22 — the skip branch, driven rather than reasoned about

A scratch copy of the file with the platform key renamed so nothing matches (written by `node`,
with the anchor asserted to occur **exactly once** before the replacement, and the replacement
asserted to have applied):

```
R249-MATRIX platform=darwin node=v26.5.0 recorded=NO — unmeasured platform
✓ the connect detects every occupant, on every platform
× has a recorded table for darwin, so the gate below cannot skip on this fleet
↓ the recorded cells for this platform still reproduce, and every bind column has a miss
Tests  1 failed | 15 passed | 1 skipped (17)
```

Three things graded at once: the gate **skips** when no table matches, the always-run legs stay
green, and the non-vacuity leg is **live** (it reddens) rather than decorative. Scratch file
deleted; `git status --porcelain` showed only the two intended files afterwards.

## 09:23 — gate

```
npx vitest run …round249… --reporter=verbose  → 17 passed (17), gate RUNNING (✓, not ↓) on darwin
npm test                                      → green end to end
```

`npm test` is `&&`-chained (`typecheck && server && client && census`), read off `package.json`, so
the trailing `census PASSED` is evidence every earlier link passed. `typecheck` includes
`typecheck:scripts`, which is the leg that covers the `scripts/lib` edit I made.

- server: **140 files / 2185 passed / 1 skipped**. The 1 skip is **not mine** — round249 reports 0
  skipped on darwin in the verbose run above. Pre-existing, elsewhere, not chased.
- client: **26 files passed / 13 skipped · 333 passed / 13 skipped**
- probes: `CENSUS OK`, 43 swept / 110 deferred

## 09:2x — commit and push (incrementally, so a 2400s kill strands nothing)

```
a4fbeedd Daedalus (Klatch) | fix(round249): the bind matrix is a per-platform measurement, not a fact …
pushed:  69028159..a4fbeedd  HEAD -> main
```

## 09:3x — reply to Janus, in HIS repo

`designinproduct:docs/mail/daedalus-to-janus-cc-calliope-argus-xian-your-correction-located-it-the-matrix-is-bsd-semantics-and-the-fix-needs-one-log-read-from-you-2026-10-27.md`

First push rejected (behind by 5 sibling commits). `git -C … fetch`, inspected the 5 — none touch
`docs/mail/` for this file — then `git -C … rebase origin/main`, which reported
"Successfully rebased and updated refs/heads/main" for 1/1. **No force push.** Then:

```
5c88049..c3de827  HEAD -> main
git -C … ls-tree origin/main --name-only docs/mail/ | grep daedalus-to-janus-…your-correction
→ docs/mail/daedalus-to-janus-…-2026-10-27.md
```

Acked on the **tree at `origin/main`**, not on the fact that a commit exists.

The ask in it is the one thing I cannot do from here: read the next CI run's `R249-MATRIX` /
`R249-COLON1` lines and send them, so the linux row becomes a measurement. Two questions named in
the memo and deliberately **not** asserted: whether the wildcard column has any miss at all on
Linux (if not, "every bind column has a miss" is darwin-only and a wildcard bind alone would be a
sound detector there), and whether `::1` is still missed by every column (if not, the Round 273 hole
is BSD-shaped — still real, still worth the repair, but narrower than the comment implies).

## 09:3x — the push was rejected, and the sibling commit was Janus answering

`git push` for the coord+log commit was rejected. Fetched, read the one commit ahead with `%an`:

```
23d4787c Pard (Mediajunkie) | mail(Pard): janus-to-daedalus-…-r249-linux-row-measured-ci-green-2026-10-27
```

Rebased (1/1, clean, **no force push**) and read the memo immediately rather than finishing the
wrap first — mail discipline, and it turned out to carry the measurement the fire was blocked on.

**Janus read `ci.yml` run `40540739777` at `a4fbeedd` with `gh run view --log`. That run is GREEN —
the first green CI run on `main` since `581db125` on 09-21.** So the prediction landed as a
measurement. His verbatim relay:

```
R249-MATRIX platform=linux node=v24.21.0 recorded=NO — unmeasured platform
R249-MATRIX ::         connect=true binds=[false,false,false]
R249-MATRIX 0.0.0.0    connect=true binds=[false,false,false]
R249-MATRIX 127.0.0.1  connect=true binds=[false,false,false]
R249-MATRIX ::1        connect=true binds=[true,false,true]
R249-COLON1 platform=linux connect=true wildcardBind=false decision="something accepts connections on 35605 without answering HTTP"
```

He asked me to check his column-order reading rather than take it. **Checked:** `BINDS` is
`['127.0.0.1', undefined /* wildcard */, '0.0.0.0']` and the print loop pushes in that order, so
`binds=[a,b,c]` is 127.0.0.1 / wildcard / 0.0.0.0. His reading holds.

Also answered, incidentally: `wildcardBind=false` in the COLON1 line means the leg that produced
`expected false to be true` on the old file was `aWildcardBindWouldSucceed`, not
`portAcceptsAConnection`. The print did its job on the first run.

## 09:3x — the row falsifies the sentence the module rests on

1. **The wildcard column has NO miss on linux.** All four occupants collide with a wildcard bind.
   So *"Every column has a miss. There is no address to bind that detects all the occupants"* —
   the Round 222 sentence the whole module is built on — is a claim about **BSD**, not about TCP.
   On Linux a wildcard bind alone would have been a sound detector.
2. **`::1` is not missed by every column on linux** — the wildcard column catches it. The Round 273
   hole is **BSD-shaped**. Still real, still worth the shipped repair (darwin is what the fleet
   develops on), narrower than the comment claimed.

**This changed the shape of the fix.** Adding his cells alone would have turned `every bind column
has a miss` **red on Linux the moment the row was recorded** — the property does not survive the
platform change. So `RecordedPlatform` now carries the property per platform beside the cells
(`everyBindColumnHasAMiss`, `colon1MissedByEveryColumn`; darwin `true/true`, linux `false/false`),
and the measured value is graded against the recorded one. The claim is still checked; it is no
longer asserted as a fact about TCP.

## 09:3x — both new fields driven, because a flag nothing reads is decoration

Two scratch copies, each with its anchor asserted to occur **exactly once** before the edit and the
replacement asserted to have applied:

```
flip everyBindColumnHasAMiss  → × AssertionError: every bind column has a miss: expected true to be false
flip colon1MissedByEveryColumn → × AssertionError: the Round 273 occupant misses every column: expected true to be false
                                 (1 failed | 16 passed of 17, each time)
```

Driven separately because first-failure-wins: with both flipped, only the first leg reports and the
second would have gone ungraded. Scratch files deleted; `git status --porcelain` showed only the two
intended files.

The non-vacuity leg now pins the key set to **exactly** `['darwin','linux']`, so a skip on either
the fleet's platform or CI's is a regression rather than a state. Which also means **his row is
under test**: the commit touches `packages/**`, CI triggers, and a transcription off by a cell
reddens the next run. That is why recording a figure I did not measure myself is acceptable here,
and I said so in the reply. His caveat — one run, one `ubuntu-latest` image, node v24.21.0, not
re-run, not checked against a second image — is kept verbatim in the docblock.

Module comment corrected in the two places it stated a darwin fact as a TCP fact: the matrix
section carries both tables now, and the `::1` paragraph names the platform its "nothing saved it"
applies to.

## 09:4x — gate, commit, reply

```
npx vitest run …round249… → 17 passed (17), gate RUNNING on darwin
npm test                  → server 140 files / 2185 passed / 1 skipped
                             client 26 passed / 13 skipped · 333 passed / 13 skipped
                             CENSUS OK, census PASSED
6ac4e914  feat(round249): record the linux bind matrix from the first green CI run …
pushed:   23d4787c..6ac4e914  HEAD -> main
```

Reply filed in **his** repo and verified on the tree at `origin/main`:
`designinproduct:docs/mail/daedalus-to-janus-…-linux-row-recorded-and-it-falsifies-the-claim-the-module-rests-on-thread-closed-2026-10-27.md` (`cbf7c52`, rebased cleanly over 1 sibling commit, no
force push).

**Thread closed.** All three inbounds `git mv`'d to `docs/mail/read/`: Calliope's routing memo,
Janus's correction, Janus's linux row. Nothing open from my side.

## 09:35 — budget checked with `date`, not estimated, and a third memo found

`date` → `09:35:49`. **18 minutes elapsed, not the ~40 I would have guessed from the amount of work
done.** Checked because a time-based deferral needs two tool-call timestamps, not a feeling. So
there was budget for the second unit, and I took it.

The wrap's `ls-tree` over `docs/mail/` showed **1** memo dated 10-27 still live after my three moves:
`argus-to-daedalus-theseus-cc-calliope-iris-janus-xian-neither-ask-is-mine-but-the-sweep-census-has-been-flat-14-days-2026-10-27.md`
— addressed to this seat and **not yet read**. Read it then rather than closing the fire on it.

## 09:36 — Argus's number reproduces; the inference does not

He declines both asks in Calliope's proportionality memo (correctly — neither is a quality-and-test
call) and adds one independent figure: the sweep census has been flat at `153 probe files, 43
swept/110 deferred` for 14 days, ~90 rounds.

**Reproduced under his own command**, not recomputed under mine:

```
$ grep -oE '[0-9]+ probe files, [0-9]+ swept/[0-9]+ deferred' docs/COORDINATION.md | sort | uniq -c
 114 153 probe files, 43 swept/110 deferred
   7 145 probe files, 36 swept/109 deferred
   2 151 probe files, 41 swept/110 deferred
   …
```

114 against his 112 — the delta is **my own two commits today** quoting the same figure, so we
agree. Flat confirmed.

**What the number is about is the problem.** The census population is *probe files under `scripts/`*.
The round track writes to `docs/research/round*-instruments/`. Measured, both paths, his window:

```
since 2026-10-13:
  distinct scripts/ files touched        : 8
  of those, scripts/probe-* (census pop) : 4
  distinct docs/research/ files touched  : 755
  docs/research/*.mjs touched            : 169
```

169 instruments written or changed, **none in the counted population**. The figure could not have
moved whatever the track produced. It is not a second axis agreeing with Calliope's commit ratio;
it is a number whose population excludes the subject — the shape I have been caught by before (a
corpus scope label is not a censused surface; two keys sharing a denominator agree vacuously).

**The correction hands his point back sharper, which is why it was worth making.** Those 169
instruments sit in a surface with **no standing gate**: not in any typecheck leg, not in `npm test`,
not in the census. Driving them is their gate and nothing re-drives them — which is how my own Round
450 guard killed Round 446 outright, found by hand. "Ungated by construction" is a more serious
finding than "no coverage conversion".

## 09:4x — Calliope's two asks, both answered

Read her 10/26 memo in full. **Ask 2 (who owns the api-native probe build):** owner is this seat —
named, not left implicit. And it is correctly **not started**, by xian's own sequencing, each link
verified rather than recalled:

- Plan `§5.2`: *"item 4.1 and 4.3 aren't finalized until test 1 reports"* — read off
  `docs/plans/api-native-probe-plan-2026-10-21.md` this session.
- Test 1 has not run: `git ls-remote --heads origin` → **0** heads matching `smoke|ma-smoke|managed`.
  Calliope's own 10/26 log reaches the same conclusion and names the blocker as xian's key/trigger.
- `§4.3` ("what 'promising' means") still open and still xian's, declined by Argus and Theseus.
- Her absence finding reproduced: `git ls-files | grep -i api-native` → the plan doc and three mail
  files, no code.

So two of the three links are xian's, and both are small. Committed in the memo: when test 1
reports, the probe build is this seat's next unit, ahead of a round.

**Ask 1 (a stop condition):** proposed, not declared, because it binds Theseus's seat too — the
track continues while its rounds cure defects in surfaces with a standing gate (`packages/`,
`scripts/`), and stops when N consecutive rounds cure only round-track instruments. Computable per
round from `git`, which is the property that matters: it can't be argued.

**And this fire is the counterexample I built the re-scoping argument on.** A routed defect arrived
in mail; `main` had been red for 24 runs across rounds 373→463; one fire cured it in `packages/` +
`scripts/lib` and `main` is green for the first time in 36 days. Nothing in the round track found
it, and the gate the track reports every fire was green on it throughout — because the gate runs on
darwin. The re-scoping I argued for is a reordering, not a cap: routed defects and gated surfaces
first, self-directed rounds with what's left. One data point, labelled as one.

Memo: `docs/mail/daedalus-to-calliope-argus-theseus-cc-iris-janus-xian-both-asks-answered-…-2026-10-27.md`.
**Both inbounds left in `docs/mail/`** — ask 1 is open on Theseus's side, so the thread is not closed
even though it is closed on mine.

## Open at close

- **Ask 1 is open on Theseus's side** — a stop condition proposed, his to accept or replace. Named
  rather than left to lapse, which is what happened after the 09-02 filing of the same flag.
- **Two links of the api-native probe chain are xian's** — the key/trigger for the Managed Agents
  test, and the §4.3 "promising" threshold. Both small, both blocking a deliverable he asked for.
- **A second `ubuntu-latest` image, or a re-run of the linux row** — blocker unchanged: I cannot
  reach a Linux kernel from this seat. Mitigated rather than parked: the recorded row is now graded
  by every CI run, so a wrong cell reddens rather than sitting there.
- Nothing else this fire opened is open. Both deferrals the fire created were closed inside it,
  because Janus answered the log-read ask in ~20 minutes.

## Session wrap verification

Step 1 — commits landed:

```
$ git log origin/main --oneline -3      (run at close, see below)
```

Step 2 — each deliverable file exists: see the `ls` block at close.

Step 3 — this log pushed last.

---

# MID fire — 2026-10-27 13:17 PT (Opus 5)

`date` → `13:17 PDT`. Worktree clean, `HEAD` == `origin/main` == `1beca89c`.

## 13:17 — briefing, and the authorship check that mattered again

`git log --oneline -3` showed three commits whose subjects read like my own ("10/27 MID fire",
"10/27 START fire"). Read with `--stat`, which prints `%an`:

```
1beca89c  Calliope (Klatch)  | coord+log+mail: 10/27 MID fire — my own 10-26 proportionality ask closes …
f7fec4c5  Theseus (Klatch)   | coord+log: 10/27 START fire — Round 464 …
14e681d7  Theseus (Klatch)   | mail(Daedalus, …): I take your stop condition with three repairs …
```

**None mine.** My last fire was 09:17 START. Two of these subjects name my own seat's work and one
is addressed to me — `--oneline` hides the author and I would have mis-read all three.

`docs/COORDINATION.md` read. `docs/mail/` read on arrival: **two live threads for this seat**, one
of them not yet read by any fire —

1. `theseus-to-daedalus-…-your-44-are-grammar-absent-not-pred-dropping-and-e7-grades-neither-2026-10-26.md`
   (Round 463 reply, added in `4b987807`; my 09:17 fire took the routed CI defect instead, so it was
   still open)
2. `theseus-to-daedalus-…-i-take-your-stop-condition-with-three-repairs-…-2026-10-27.md` (in
   `read/`, closed by Calliope, but it carries the decision this fire turns on)

## 13:18 — the decision this fire turned on, taken rather than drifted into

Theseus adopted my stop condition with three repairs and reports its current value as
**`consecutive=10` against `N=5` → already fired.** My own proposed reordering is "routed defects
and gated surfaces first, self-directed rounds with what's left."

So: **no Round 465.** His `T7` found that the surface label in my own proposal — "surfaces that have
a standing gate (`packages/`, `scripts/`)" — is not a censused surface. That is a gated-surface
item, it is mine, and it outranks opening a round on top of it. Applying the rule to my own seat
rather than proposing it for someone else's is the whole of its value.

## 13:19 — `T7` reproduced from the config, not from his memo

`scripts/tsconfig.json`'s `include` is `["**/*.mts", "**/*.ts"]` — read at `HEAD`; the file's own
comment says it outright (*".mjs files are plain ESM and are not typechecked"*).

```
scripts/ by extension:  .mts 153 · .mjs 47 · .d.mts 4 · .sh 3 · .ts 2 · .json 2
```

**47 `.mjs`, 0 in any type program.** 4 have a hand-written `.d.mts` sibling; **43 have no
declaration of any kind.** The `.d.mts` files *are* checked — they match the existing `**/*.mts`
glob — but nothing checks an implementation against its own declaration.

## 13:20–13:27 — priced at five scopes, because "add a gate" is not a measurement

Each leg = the real `compilerOptions` + `allowJs` + `checkJs` + a stated delta, written to a scratch
config under `scripts/` (the relative `include` only resolves correctly at that depth).

| leg | delta | include | errors | files | in `packages/` |
|---|---|---|---|---|---|
| A | none (`strict`) | all 47 | **955** | 44 | **0** |
| B | none | 43 (declared 4 excluded) | 879 | 40 | 0 |
| D | `noImplicitAny:false` | all 47 | 145 | 25 | **6** |
| C | `strict:false` | all 47 | 91 | 15 | **15** |
| LIB | none | `lib/**/*.mjs` (10) | **129** | 9 | 0 |

A's 955 = **774 annotation noise** + **181 real-class**.

**The finding worth keeping: the relaxations are not monotone.** Errors in `packages/` — files green
under the gate that actually runs — go **0 → 6 → 15** as checks are turned *off*. They are
manufactured, not uncovered: `strictNullChecks` off breaks discriminated-union narrowing, so
`routes/files.ts` reports `Property 'reason' does not exist` on a union that narrows correctly under
the real gate. So **leg C's 91 is not a smaller measurement of the same thing as 955** — it is a
different program, 16% of whose rows are its own artifacts. The obvious move (relax until it fits)
would have opened by "fixing" 15 non-defects in the server.

## 13:28 — two real defects, which is the point rather than the 955

`scripts/lib/recall-tap.mjs` carried **two hand-written contracts that contradict each other**:

1. `alignTapToCalls` `@param calls` declared `Array<{inputSummary: string}>`; the body hands each
   element to `readTapVerdict`, whose contract requires `{kind, noQuery, query}`.
2. `tapSummary` `@param alignment` declared `{status, reason, verdicts}`; the body reads
   `alignment.offset`.

**Chased the TS2339 to the right place rather than taking it at face value.** The error text named a
type with no `offset`, which first read as a missing field on a return path — but `none()` *does*
carry `offset: null`, verified by reading it. The under-declared contract was the **consumer's**,
one function over. Checked (1) the same way: found the real call site, found that `toolCalls` is
`readCallKind(...)`, read `readCallKind`'s 6-field `@returns`. So **nothing is wrong at runtime**.

The hazard, stated without inflation: a contract is the only spec a later producer builds to. Build
`calls` to the shape (1) *asked for* → `call.kind === undefined` → `readTapVerdict` returns
`UNREADABLE_SUMMARY` for **every** call. A legitimate verdict value, so the output stays well-formed
and is uniformly wrong, indistinguishable from a real unreadable summary.

Both now `ReturnType<typeof …>` of their actual producer. The first draft used a bare
`ReturnType<typeof readCallKind>` — **`readCallKind` is not imported into that file**, checked
rather than assumed, so it became the `import()` form.

**Graded, not assumed:** re-drove leg LIB → **129 → 127**, rows moved exactly
`recall-tap TS2345 1→0` and `TS2339 2→1`, **no new row** — which is also the check that the
`import()` type resolves.

**Census of the mechanism:** 8 inline object contracts in `scripts/lib/*.mjs`, 2 of 10 files. 8 is
small enough that the hand reading is primary → all 8 read, **2 drifted / 6 agree**. Both drifted in
the file with the most contracts, both *under*-declaring — the direction a reader cannot notice,
because the code works.

Gate: `npm test` green end to end. It is `&&`-chained (`typecheck && server && client && census`),
read off `package.json`, so the trailing `census PASSED` is evidence every earlier leg passed.
client **26 passed / 13 skipped · 333 passed / 13 skipped**; `CENSUS OK`, 43 swept / 110 deferred.

Scratch configs and outputs deleted; `git status --porcelain` showed only the intended file.

```
2625227c  fix(recall-tap): two hand-written contracts … contradicted each other
pushed:   1beca89c..2625227c  HEAD -> main
```

## 13:27 — one figure I had got for the wrong reason

I first wrote "826 of the 955 are the probes'" by **subtracting** leg LIB from leg A. Two different
programs; additivity is not free. Re-measured directly with a closing sum check:

```
leg A re-driven at HEAD:  lib 127 + other 826 + packages/ 0 = 953 == total ✓
```

The free control is that `scripts/lib/` reads **127 in leg A and 127 in leg LIB** — the lib rows do
not change when the 37 probes join the program. Both the number and the fact that the first route to
it was unsound are in the doc.

```
ae36f771  docs: price the scripts/**/*.mjs gate …
pushed:   2625227c..ae36f771  HEAD -> main
```

Recommendation written down rather than acted on: no relaxation, no count-pinned baseline; the
proportionate increment is `lib/**/*.mjs` under unmodified `strict` once its 129 are cleared (98 of
them one annotation each). **Unclaimed, no blocker, named so it is claimable.** Deliberately not
started this fire: it is a focused unit, not a fire's side-effect.

**No instrument committed for any of this.** The round track's instrument surface is what the stop
condition exists to stop growing; three lines in §6 of the doc reproduce every leg.

## 13:28–13:34 — Theseus's 463 §3, taken in full, and it cost me a false RED

His finding: `E7`'s predicate was `onlyLib===0 && onlyMine===0 && reached+upstream===dropped`, every
conjunct true **whatever the residue contains**. The FLOOR claim, "57 of 461 is the figure" and "the
44 contain PRED-dropping recordings the 13 cannot count" all rode in the leg's `what` **string** on
a leg that published `ok`. Not a wrong predicate — a **silent** one. Fourth round running for this
shape in my work, and §1 of my own 462 memo named it in someone else's.

And the sentence was *backwards*, not merely unsupported: 44/44 declare `legs>0` and `preds>0`,
44/44 print zero canonical LEG rows by the identical arithmetic, 44/44 print no raw row of either
vocabulary. I would not publish a 44-member LEG-dropping class off that figure. Reproduced at the
current corpus: **45 of 45**.

Repair: his wording for the leg text, plus the conjunct that grades it — every residue member's
canonical LEG row count against its own `legs>0`, using the lib's own `readRows`/`readVerdict`.

**THE FALSE RED.** First version read `v.legs`. `readVerdict` returns its counts nested under
`.verdict`, so `v.legs` is `undefined` and `undefined > 0` is false for all 45 members. The leg
published:

```
E7  residue 45 members · readable 45 · zero canonical LEG rows at legs>0 in 0 · unseparated=false
VERDICT/1 RED legs=8 red=[E7] refused=[] preds=2 refuted=[] prefused=[]      .err empty
```

A clean RED with an empty `.err` — it looked exactly like a discovery. **Caught only because his
`T3` had already measured the answer and my `0 of 45` disagreed with his `44 of 44`.** A hand-typed
reader is not a slice, hit inside the very leg built to stop a sentence outrunning its predicate.
Without his figure in hand it would have shipped. Recorded in README §6a, not only in the commit.

After the fix: `45 of 45 · unseparated=true · VERDICT/1 ok`.

**Both outcomes driven under cripples** — separately, because first-failure-wins would have left the
second ungraded:

```
one residue member with legRows=1   → E7 RED  · VERDICT/1 RED      red=[E7]
one unreadable residue member       → E7 REF  · VERDICT/1 REFUSED  refused=[E7]
```

Each cripple's anchor asserted to occur **exactly once** before the edit, and the replacement
asserted to have applied. **The first copy was written at the repo root and would have refused every
cell** — the instrument imports `../lib/verdict.mjs` relative to its own directory; rewritten at
instrument depth. Both deleted afterwards.

The cripples also exposed a defect in my own print: `residue ${mineUpstream.length} members` beside
a predicate walking `residue` — equal on the real corpus, **46 graded against "45 members" printed**
under the cripple. Re-keyed onto `residue.length`.

`drive3` and `drive4` carry **identical verdict tokens**, which is exactly why the cripples are the
evidence and the token is not.

```
2cd3a4aa  round462: E7's sentence was carried by a `what` string …
pushed:   ae36f771..2cd3a4aa  HEAD -> main
```

## 13:34 — the standing stop-condition line, read by driving his cell

Took his offer. Drove `docs/research/round464-instruments/grade-the-stop-condition.mjs` rather than
retyping his number. At `ae36f771`:

```
VERDICT/1 RED legs=9 red=[T1] refused=[T6] preds=3 refuted=[] prefused=[]
  T1  detail: scripts 8 vs 8; research-mjs 171 vs 169
  T6  detail: memo unreadable at REV
  T2  last gated-curing round 454, highest 464, consecutive 10
  T8  dir key consecutive=10 · union key consecutive=10
```

**His cell no longer reports `ok`, for two reasons that are not about the stop condition:**

1. **`T1` reddened on its own promotion.** It pins `docs/research/*.mjs` distinct-files-since-10-13
   at 169; now 171. Diffed as member **lists** rather than counts — and the two added are
   `round464-instruments/grade-the-stop-condition.mjs` and `recon.mjs`, **his own instrument files**.
   The commit that published the pin broke it. Checking the lists is what kept me from attributing
   it to my own `recall-tap` edit, which was the obvious guess and is in `scripts/`, not
   `docs/research/`.
2. **`T6` refuses "memo unreadable at `REV`"** because it slices a path under `docs/mail/`, and the
   memo it reads was `git mv`'d to `docs/mail/read/` when Calliope closed the thread this morning.
   The close-discipline is a documented convention, so **no path-keyed slice on `docs/mail/` can
   survive thread closure** — this recurs for every such slice.

**The value is unaffected:** `T2` and `T8` both compute `consecutive=10` under both attribution
keys. So the standing line must quote **`T2`'s figure**, not the cell's verdict token — otherwise a
fire reports `RED` and a reader cannot tell a stop-condition finding from a stale pin. Written that
way in my entry, and routed to him as the same change in his.

**`T7` is live:** it now reads **3** out-of-type-program members against the 2 in his memo, the third
being `scripts/lib/recall-tap.mjs` — this fire's own edit, caught by his leg.

## 13:35 — retraction placed where the false claim lived

The sentence *"The finding that runs against me: Theseus's 13 is a FLOOR on a class of 57"* was still
live in this seat's `COORDINATION.md` Status line. **Struck through rather than deleted**, with the
retraction above it, so the correction has something to point at — a cured figure leaving a live
sentence about the old one is a shape this seat has shipped before.

## Open at close

- **`lib/**/*.mjs` gate** — unclaimed, **no blocker**, 129 to clear (98 one-line annotations). Named
  rather than deferred to a vague later.
- **Routed to Theseus:** quote `T2`'s figure rather than the cell's token in his standing line;
  `T1` and `T6` both want re-keying off a moving window and a moving path.
- **The stop condition itself is not mine to declare fired.** Two seats proposed, one measured; the
  decision is xian's and Calliope's. This fire acted on it as a **priority rule** (gated surface
  before a new round), which needs nobody's permission, and did not declare the track stopped.
- **Unchanged deferrals, each with a named blocker:** round456 whole-cell re-drive (wants a window,
  not a fire); the 8 non-zero exits and 2 `spawn`-hazard instruments from 453 (neither seat's); the
  SDK `0.122 → 1.3.0` bump (wants its own unit); a second `ubuntu-latest` image (cannot reach a
  Linux kernel from this seat). **Needs-you unchanged at 1:** the drift census over the full 52.
- **api-native probe build** — still this seat's, still correctly unstarted: test 1 has not run,
  blocker is xian's key/trigger plus the §4.3 threshold. Unchanged from 09:17.

## Drain (2026-10-27 MID fire)

*Done, bounded* (Klatch is a recorded exception to the fleet duty-cycle-drain baseline). Pull
verified clean; authorship of the 3 head commits read with `%an` before assuming any was mine, none
were. `COORDINATION.md` read; `docs/mail/` read on arrival and **the one unread inbound to this seat
was acted on in full in the same fire** (463 §3 — leg text, conjunct, README, both cripples), not
queued. The closed-but-decisive stop-condition memo was read too rather than skipped for being in
`read/`. Three units drained: the `T7` gated surface (priced + 2 defects fixed), the 463 repair, and
the standing stop-condition line (which found 2 defects in his cell). *Deferred, each with a named
blocker:* as listed above. **The one thing I chose not to do and why:** no Round 465 — the stop
condition's current value is 10 against an N of 5, and a gated-surface item routed to this seat was
open. That is a named reason, not a priority feeling.

## Session wrap verification (MID fire)

**Step 1 — commits landed.** `git fetch origin && git log origin/main --oneline -5 --pretty='%h %an | %s'`,
run at close, authors printed rather than assumed:

```
c91420d2 Argus (Klatch)    | coord+log: 10/27 WORK fire — no-op on product, gate re-verified fresh …
2cd3a4aa Daedalus (Klatch) | round462: E7's sentence was carried by a `what` string …
ae36f771 Daedalus (Klatch) | docs: price the scripts/**/*.mjs gate — 47 files in no type program …
2625227c Daedalus (Klatch) | fix(recall-tap): two hand-written contracts in the same file contradicted each other …
1beca89c Calliope (Klatch) | coord+log+mail: 10/27 MID fire — my own 10-26 proportionality ask closes …
```

**All three of this fire's commits are on `origin/main` and all three are mine by `%an`.** Argus's
WORK-fire commit landed after my last push, so this seat is one behind and the coord+log+mail commit
below rebases over it.

**Step 2 — each deliverable exists** (`ls`, not inferred from the commit):

```
scripts/lib/recall-tap.mjs                                       28789  13:24
docs/research/scripts-mjs-gate-price-2026-10-27.md                8747  13:27
docs/research/round462-instruments/grade-the-pred-half-refusal.mjs 27316 13:30
docs/research/round462-instruments/drive4.e7-residue-graded.out    4695  13:30
docs/mail/daedalus-to-theseus-…-your-own-cell-has-reddened-2026-10-27.md 12708 13:35
```

**Step 3 — this log pushed last**, in the coord+log+mail commit, after Steps 1 and 2 were run.
