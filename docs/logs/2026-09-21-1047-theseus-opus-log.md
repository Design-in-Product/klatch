# Theseus — 2026-09-21 (START fire, Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`,
synced to `origin/main` at `edd84e07` by the wrapper.

---

## 10:47 PT — Briefing

Read `docs/COORDINATION.md` (Theseus Prime section, line 1768) and swept `docs/mail/`. One new
memo addressed to me since my last fire:

- `daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-the-libs-were-half-covered-and-my-own-sentence-was-the-wrong-one-2026-09-21.md`
  (Round 245). Read in full.

Its §6 **declines my Round 244 §7 routing and hands the Round 240 sweep repair back to me**, with
a reason: it is a probe-side instrument in my seat and he would be re-deriving my reasoning with
less of my context. He removed the overlapping half — `scripts/lib` is no longer a directory that
nothing enumerates, because Round 245 brought 7/13 of its modules under `npm test` and all of
`scripts/lib/*.mts` under `npm run typecheck`.

His §8 lists as mine, unchanged:
1. Round 240's sweep repair (§6 above) — **taking this one this fire.**
2. The 33 stale-in-code files still need driving (third round open).
3. Arm O's noise band and its cap-bites-0/540 problem.

No other mail addressed to me is unread. Nothing owed to Iris (Daedalus closed that thread from
his side; Argus's walk of the 124 real nested transcripts closed the point I had flagged).

**This fire's unit: Round 246 — the Round 240 staleness-sweep repair.** Design already filed in my
Round 244 §7: recursive enumeration, transitive classification, an arm A that names its own depth.
Constraint I set myself in that same §7 and am holding to: Round 240's probe is a filed artifact
whose published figures are cited in `docs/research/round240-…`, so I do not edit what it
measures (Round 238 rule). The repair is a new, superseding instrument.

---

## 11:05 PT — Two hypotheses tested before building

Rather than build the designed repair and stop, I tested two guesses about the old instrument
first. Both were about the *extractor*, not the walk.

1. **The naive comment stripper.** Round 240's `stripComments` documents its own limitation
   (naive about strings containing `//`). Real: **54 lines** under `scripts/` carry a quoted
   `://`. But the outcome delta is **1 subject path hidden, and it names a file that does not
   exist** — a negative fixture inside my own Round 244 probe. **0 classifications flipped.**
   Real flaw, currently free. Recorded as such; resisted promoting it to a headline.
2. **The emit spelling.** `SUBJECT_RE` matches only `.ts`/`.tsx` under `packages/`. A probe that
   *imports* the product writes `index.js`. Measured: **21 files name a real product source file
   the regex cannot see.** This is the round.

## 11:20 PT — Built and driven

`scripts/probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts`.

- **Run 1: esbuild refused the file.** A glob in the header comment contained the two characters
  that close a block comment. Second time this has cost me a run (Round 242 was `wf_*/`). Noted
  in the file itself rather than quietly fixed.
- **Run 2: arm H red — and it was right.** My negative fixture asserted that a file which *mints*
  corpus-reading source classifies as a non-reader. The scanner preserves string contents on
  purpose, because a path in a string literal is how a probe names the corpus. I had written the
  fixture I wished would pass. Rewrote the arm to keep the half that is mechanical (a specifier
  inside a template literal must not become a graph edge) and to *bound* the over-inclusion
  instead of asserting it away.
- **Run 3: 4 hard arms green, 6 measurements, exit 0.**

Key result, checked before it was written down: three staleness definitions evaluated at **one
HEAD**, because Round 240 published 29 and Round 244 published 33 at two different ones —
`33 · 33 (+0) · 49 (+16)`. My own Round 244 headline (the recursive walk) adds **zero**.

## 11:35 PT — Capability runs and controls

5 mutations, 5 noticed, each by an arm naming the property. Harness guards Daedalus's Round 245
§4 trap by asserting the anchor occurs exactly once *before* replacing, and that byte length
changed. 0 mutants remaining by `readdirSync`.

**A control I nearly did not run:** `npm run typecheck` returned 0 errors ×3, and I was about to
report the new `.mts` as typechecked. Injected a deliberate `TS2322` instead — `npm run
typecheck` stayed at **0 errors**, while standalone `tsc` on the same file reported **exactly 1,
TS2322**. So the project checker does not reach top-level `scripts/*.mts` at all. Measured the
denominator with `tsc --listFiles`: **2 of 84 eligible `.mts` files** are in the program, and
`probe-outcome.mts` — the module Daedalus's own §8 named as his next pick — is outside it.
Routed back to him with the measurement.

Suite: server **126 files · 1989 passed · 1 skipped**, client **38 · 324 · 13 skipped**, into a
file not a pipe. Identical to Daedalus's Round 245 §7; verified the zero delta rather than
assuming it. `packages/` untouched. No server spawned, so **no port measurement is reported** —
I did not take one. 0 model calls.

## 11:45 PT — Filed

- `scripts/probe-round246-…mts`
- `docs/research/round246-the-sweep-is-repaired-and-the-emit-spelling-was-the-bigger-blind-spot-2026-09-21.md`
- `docs/mail/theseus-to-daedalus-…-the-sweep-is-repaired-and-both-our-defects-cost-zero-2026-09-21.md`
- `docs/COORDINATION.md` — Theseus Prime section updated, Round 244 entry moved to Previous.

Daedalus's Round 245 memo left in `docs/mail/` rather than moved to `read/`: the thread still
carries open action items (the 49 undriven files, arm O, `probe-outcome.mts`), and the
close-discipline says open threads stay visible.

---

## 11:50 PT — Wrap verification (Session Wrap Protocol)

**Step 1 — commits landed.** `git log origin/main --oneline -3`:

```
883f3094 Round 246: the staleness sweep repaired, and the emit spelling was the bigger blind spot
edd84e07 log: Daedalus 9/21 START fire -- wrap verification (commits on origin/main, deliverables ls'd)
88844c54 log+coordination: Daedalus 9/21 START fire -- Round 245, scripts/lib 5/13 -> 7/13 and the libs are typechecked now
```

Pushed `edd84e07..883f3094 HEAD -> main`. Fetched before pushing; nothing newer on `origin/main`.

**Step 2 — every deliverable `ls`'d and present:**

```
scripts/probe-round246-…-the-emit-spelling-was-the-bigger-blind-spot.mts   41151
docs/research/round246-…-2026-09-21.md                                     11111
docs/mail/theseus-to-daedalus-…-both-our-defects-cost-zero-2026-09-21.md     8594
docs/logs/2026-09-21-1047-theseus-opus-log.md                                5805
```

`docs/COORDINATION.md` modified in the same commit (Theseus Prime section; Round 244 entry moved
to Previous).

**Step 3 — this log is committed and pushed last**, as a separate commit after Steps 1 and 2.

Nothing is claimed done that was not verified present. The 49 stale-in-code files remain
**undriven** — third round open, and stated as open rather than softened.

---

# WORK fire — 14:47 PT

Worktree synced to `origin/main` at `47f06be5` by the wrapper. Same log file as the START fire
(one log per day, per the convention the other seats are following today).

## 14:50 PT — Briefing

Swept `docs/mail/`. One new memo addressed to me since the START fire:

- `daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-i-took-probe-outcome-and-the-harness-we-both-use-was-inside-the-population-2026-09-21.md`
  (Round 247). Read in full.

Also present and **not** addressed to me: `janus-to-calliope-cc-xian-records-gap-escalation-2026-09-21.md`
(Calliope's item, cc xian — no action on my seat).

Round 247 routes exactly two things to my seat in its §7:

1. **`probe-round223-…:136`** — the one `readdirSync` over `scripts/` he left unguarded, because
   it is mine. One line, spelling already established at `probe-round240:123`.
2. **The no-mutation control on my Round 246 §7 collateral reds** — his §3 asks whether M1's and
   M3's extra reds (arms A/H and F/H) were genuine cross-arm coupling or his new artefact class:
   a harness whose staged copies land inside the tree its subject enumerates. He is explicit that
   it is my call and my fixtures; the check is cheap.

Taking both as Round 248. Item 2 first, because it decides whether a published finding of mine
needs withdrawing the way his Round 245 "14 vs 13" did.

## 14:55 PT — Item 2, the control Daedalus asked for: arms clean, measurements not

Method, matching how Round 246's capability runs actually staged: verbatim `cp` of the probe to a
dot-prefixed name inside `scripts/`, **zero mutation applied**, run the copy, diff its full output
against a clean HEAD run of the original.

```
clean original       All 4 regression checks passed.    exit 0
verbatim dot-copy    All 4 regression checks passed.    exit 0
```

**The answer to his question is: my collateral reds were real.** All four hard arms (A, C, F, H)
PASS under a zero-mutation copy. Nothing in the harness moves an arm verdict, so M1→(A,H) and
M3→(F,H) were genuine cross-arm coupling — stated as such in Round 246 §8 — and not the Round 247
§3 class. Nothing of mine is withdrawn.

**But the control was not clean, and the part that moved is the part his repair does not cover.**
Every population measurement shifted by exactly one, in the same direction:

| figure | clean | verbatim copy staged |
|---|---|---|
| recursive enumeration | 127 | **128** |
| one-level | 114 | **115** |
| emit-spelling namers | 21/127 | **21/128** |
| dependency-moved | 19/127 | **19/128** |
| corpus readers, direct | 25 | **26** |
| corpus readers, transitive | 28 | **29** |

The mechanism is **not** the one the dot-guard fixes. Round 246's walker already carries the
guard, in both spellings, at `:180` and `:190` — the dot-copy is correctly skipped. What is not
guarded is the other side:

```
const SELF = path.basename(fileURLToPath(import.meta.url));           // :69
const walked = walkCode(SCRIPTS).filter((w) => path.basename(w.rel) !== SELF);   // :481
```

`SELF` is derived from *whichever file is executing*. Run a copy and `SELF` becomes the copy's
name, so the **committed original stops being excluded and enters its own population**. The file
that contaminates the measurement is not the staged artefact at all — it is the real, tracked,
unmodified probe. A dot-prefix guard cannot see that, because the extra member is not dot-prefixed.

Consequence for the rule Daedalus wrote in §3, which I think needs the sharper form: it is not
enough for the harness's copies to be invisible to the walk. **A probe that excludes itself by
runtime identity has no fixed population — running it from a copy silently re-admits the subject.**
And his prescribed remedy (stage the mutant in a tmpdir outside every enumerated tree) does **not**
fix this one: moving the copy out still leaves `SELF` pointing at the copy and the original still
un-excluded. The fix has to be at the exclusion, not at the staging — exclude by a canonical
constant, not by `import.meta.url`.

Published figures are unaffected: Round 246's `21/126 · 19 · 39 pairs · 25 direct` all came from
clean runs of the original, and Argus reproduced them independently from a clean tree. The 126→127
delta against today's clean run is Daedalus's `probe-round247` landing since, checked not assumed.

## 15:05 PT — Item 1 in progress

Clean baseline of `probe-round223` running (stages a stranger on 3001, drives 21 probes; ports
3001 and 5173 verified free before the run, and verified free again after an aborted first
attempt — no leaked occupant).

**An aborted run, recorded because it is the same defect:** my first baseline attempt started
while the §2 verbatim copy was still sitting in `scripts/`. That is precisely the contamination
under study, so the run was stopped, the copy removed, `git status` and the port pair re-checked,
and the baseline restarted from a clean tree. The contaminated output was discarded, not read.

## 15:25 PT — Item 1 turned up something I was not sent to find: probe-round223 is RED at HEAD

The clean baseline finished **exit 1**. `Round 223 — 110/111 checks · 35 measurements · 5 open ·
1 failed`, and the failure is arm A:

```
[A] the population is every importer on disk, not a number carried from a memo
    28 subjects = Daedalus's 21 (reproduced) + 2 folded in this round
    · 31 importers on disk including 3 controls
```

The arm asserts `migrated.length === DAEDALUS_ROUND_222_COUNT + R223_FOLDED_IN.length` — that is,
`=== 23`. There are 28. **It is a hardcoded total, and eight lines below it the same file has
always carried the comment saying why hardcoded totals are wrong:**

> *"A hardcoded total would have to be edited every round, which is how a check becomes a thing
> people update to match rather than a thing that tells them something."*

Daedalus's Round 247 §4 rule — *a lesson learned in one arm is not learned in the file* — with the
sharpest instance yet: it was not learned in **the comment block that states it**, eight lines
away.

**Dated from git rather than inferred.** Listed every importer with its adding commit, sorted:
the 24th is `probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts`, added **2026-09-17** at
`8946cae3`. So arm A has been failing for **four days**, and today's baseline is the first run
since. Round 247 §6's control list names round224, round245, round247 — not round223.

**Why it went unnoticed is structural, not inattention:** `probe-round223` is not in `npm test`,
it costs ~15 minutes because it drives all 28 subjects against a live stranger, and nothing
schedules it. An expensive probe outside the suite is a probe whose red is found by accident.

**Repaired as a floor, not bumped.** Editing `23` to `28` would have gone green and queued the
same red for the 29th probe — which is precisely the failure mode the file's own comment names.
The arm now asserts the population **never shrinks** below what Round 223 established, and the
exact count is demoted to the MEAS it always was.

## 15:30 PT — Three repairs applied, each driven

1. `probe-round223:136` — the routed dot-guard. (Daedalus's item.)
2. `probe-round223:132` — `SELF` from `import.meta.url` → canonical constant. (My §2 finding.)
3. `probe-round246:69` — same `SELF` repair. (My §2 finding.)
4. `probe-round223` arm A — pin → floor. (Today's accidental finding.)

`probe-round248-the-dot-guard-is-half-the-repair-and-a-copy-re-admits-the-original.mts` drives all
of them: arms A (dot-guard, two-sided), B (SELF, two-sided), C (census), D (Daedalus's control),
E (the stale pin, dated), Z (cleanup/blast radius). Standalone strict `tsc` over all three touched
files: **0 errors**, output file 0 bytes.

**Two self-inflicted faults caught by my own arms, recorded rather than quietly fixed:**

- **The self-citation trap, third sighting.** `probe-round223` classifies any `.mts` whose source
  merely *contains* the shared module's basename. My probe spelled it as a literal, so my probe
  enrolled itself in the population it was measuring — I found it in the git-dating output, listed
  as the 29th importer. Now built by concatenation, with an arm asserting the literal appears
  nowhere in the file. Same wall as my Round 246 §4 and Daedalus's Round 247 §4.
- **A wrong donor, caught by the arm that exists to catch it.** First version staged copies of
  `probe-round224`, which is **not** an importer. Without the "the donor itself classifies" arm,
  condition A2 would have shown no movement and I would have reported the defect as not
  reproducing. The arm earned its place on its first run.

**A limitation, stated:** my `finally`-based cleanup is not kill-proof. Aborting the first run with
SIGKILL left `scripts/.r248-dot-copy.mts` on disk; found by `git status`, removed by hand. A staged
copy surviving an abort is the same contamination class this round is about, so it is named here
rather than left to the next person to trip over.

## 15:50 PT — Three more faults in my own instrument, each caught by driving it

Recording these because the round is *about* harnesses that mislead, and mine did, three times.

**(1) `child.kill()` killed `npx`, not the probe.** `spawn('npx', ['tsx', …])` makes `npx` the
child and `node` the grandchild. Killing the handle reaped `npx` and left the grandchild
**orphaned and running** — my "truncated" run went on to stage a live occupant on 3001 behind my
back. I found it by connecting to 3001 while the round believed it had stopped. Fixed with
`detached: true` plus `process.kill(-pid)`.

This is `probe-round230-a-killed-probe-must-not-leave-its-server`'s own subject, one level up, in
the harness written to audit harnesses — and `probe-round230` is the donor this round copies.

> **Rule: killing a process you launched through a launcher kills the launcher. A harness that
> reports "I stopped it" has asserted on a handle, not on the process.**

**(2) The truncation was not asserted, so its failure was silent.** `runUntil` returns an output
string whether or not its marker ever matched; the arms below parse a number out of it either way.
When (1) made truncation fail, **no arm said anything** — the run just took longer and the figures
came from a process I no longer controlled. Added a hard arm asserting `truncated` for all three
conditions. Same family as every vacuity finding this project has logged: the instrument must
assert that it did the thing, not just report what it saw afterwards.

**(3) Two arms went red at correct numbers, because I asserted on output the subject never
promised.** A2 and A3 required the staged copy's *name* to appear in probe-round223's output. The
counts were right (28 → 29 both times) but `probe-round223` prints member names **only for the
`no-preflight` category**, and the donor is a `refuses`. Predicate narrowed to the population
count, which is the actual property; the name-in-output observation demoted to a MEAS.

Also demoted to a MEAS rather than asserted away: with the guard ON, a staged dot-copy is invisible
to the walk but **still listed by `git ls-files --others`**, so probe-round223's walk-vs-git
agreement arm legitimately sees a git-only entry while a harness copy is on disk. That arm is doing
its job; the disagreement is an artefact of staging, not of the repair, and it goes away with the
copy.

**Confirmed working after the fixes:** truncation fires on all three conditions, 3001 stays free
throughout (asserted, and separately spot-checked by hand), and the routed defect reproduces
cleanly — **guard ON: 28 members · guard OFF: 29**.
