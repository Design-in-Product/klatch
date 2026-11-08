# unit-465adopt — RESULTS

**Seat:** Daedalus · **Date:** 2026-11-07 (STOP fire) · **Model:** claude-opus-5
**Pre-registration:** `PRE-REGISTRATION.md`, committed as the only file in this directory
(`6e5207dd`) before any instrument in it existed.

**Verdict: promotion taken, driven, and REVERTED.** The probe is back in `DEFERRED` with a
**second** named blocker, on a different axis from the first — and the blocker is on the
**registry**, not on the probe. 11 predictions, **10 held, 1 refuted**, and the refuted one is
P10, the cell this unit added for exactly this hazard. 1 declared measurement; **3 unregistered
findings**; **1 defect of my own in my own instrument**.

Theseus's axis is genuinely clear and nothing here walks that back: every cell he cleared, I
reproduced under my own cripples. The thing that stopped it is what a promotion does to the
registry's *own* population of declarations, which neither of us had registered as an axis at all.

## The cells

Driven against the **real probe** via `npx tsx`, with `classify`, `entryProblems` and
`measurementCheck` **imported** from `scripts/sweep-probes.mjs`. Recordings: `crippled-*.out`,
`m1-*.out`, grading in `crippled-grading.txt` and `m1-grading.txt`.

| # | Prediction | Result | Reading |
|---|---|---|---|
| P1 | control: exit 0, pin matched, PASS | **HELD** | `exit 0  2661 ms  All 13 regression checks passed.` → `PASS (matched=true skipped=false)` |
| P2 | X1: exit 3, same-line `did not run:` + label, BLOCKED | **HELD** | `exit 3  3379 ms` · line `"did not run: the race state could not be built"` → `BLOCKED (skipped=true)` |
| P3 | same output, no declaration → RED | **HELD** | `no skip: -> RED (skipped=false)` |
| P4 | same output, label off the line → RED | **HELD** | `off-line: -> RED (skipped=false)` with `/the race state was not built/` |
| P5 | C1 (size test removed): exit 1, pin unmatched, RED | **HELD** | `exit 1  2540 ms  2 of 13 regression check(s) FAILED.` → `RED (matched=false)` |
| P6 | X1+C1: exit 3, BLOCKED | **HELD** | `exit 3  3343 ms` → `BLOCKED (skipped=true)` |
| P7 | `entryProblems(entry)` → `[]` | **HELD** | `[]` on the draft **and** on the published object (`entry:live`) |
| P8 | `measurementCheck(entry, controlOut)` → `{}` | **HELD** | `{}` on both |
| P9 | census 154 unchanged, 43→44 swept, 111→110 deferred, CENSUS OK | **HELD** | `154 probe files · swept: 44 · deferred: 110 · CENSUS OK`, exit 0 |
| P10 | no verdict change on the frozen 25 | **REFUTED** | **5 of 25** went green → red; all 5 back to green on the revert |
| P11 | gate figures byte-identical; probe not in vitest | **HELD** | see §P11 below |

**P2–P4 are the join this unit existed for.** The same *recorded* output — one run, three readings —
is BLOCKED declared, RED undeclared, RED declared-but-off-the-line. The declaration is load-bearing
in both directions, so the entry's `skip:` is not decoration, and the conjunction is asserted on a
**line** (`out.split('\n').find(l => l.includes('did not run:') && l.search(re) >= 0)`) rather than
on the whole output, because a whole-output check would be satisfied by two unrelated lines and
would pass for the wrong reason on exactly the tree where the entry is wrong.

**P5 was the dispositive one** and it is the half a promotion can quietly cost: a promoted cell
that cannot report its own defect is worse than no cell, because a green sweep row then reads as
evidence for a claim the probe is not making. With the product's size test removed the probe exits
1 at `2 of 13 regression check(s) FAILED` — `-wal:absent` and `unreadable (disk I/O error)`, which
is `unit-465sizeguard` reproducing.

## M1 — the spontaneous race-loss rate, measured with no threshold declared in advance

**10 of 10 uncrippled runs exited 0**, every one at `[E] state BUILT — commit landed in the tool's
own -wal — 1 attempt(s)`, and the probe retries up to `ATTEMPTS = 3`. So the single-attempt loss
rate is low enough that this measurement cannot see it, and the published loss rate is bounded by
its cube. Non-zero would not have blocked promotion; it would have changed the entry's `why`. It is
in the `why` anyway, as the property of the cell a reader of a BLOCKED row needs.

**What M1 cannot say:** it is ten runs on one machine, idle, in one fire. A loaded machine changes
the window the race is run in, and nothing here measures that. The entry said "at a rate that
measurement can see" rather than "never".

## P10 — refuted, and it is the finding

The population was **frozen at the `pre` phase** and written to `population.json`; the `post` phase
read that file and never recomputed. That mattered: the promoted probe's own source mentions the
registry, so a recomputed selector would have gained a member *because of the treatment*, and **a
join key must not widen with the property**. Member lists identical across the pair, asserted:
`true`.

| probe | pre | post | after revert |
|---|---|---|---|
| `probe-round372` | 0 · All 26 passed | 1 · 1 of 26 FAILED | **0 · All 26 passed** |
| `probe-round373` | 0 · All 15 passed | 1 · 1 of 15 FAILED | **0 · All 15 passed** |
| `probe-round374` | 0 · All 8 passed | 1 · 3 of 8 FAILED | **0 · All 8 passed** |
| `probe-round375` | 0 · All 8 passed | 1 · 2 of 8 FAILED | **0 · All 8 passed** |
| `probe-round377` | 0 · All 13 passed | 1 · 5 of 13 FAILED | **0 · All 13 passed** |

`registry-pre.json`, `registry-post.json`, `registry-restored.json`. **5 of 5 back at their
pre-action verdict**, so the causation is a counterfactual and not a coincidence of timing.

**The mechanism, read off the failing row rather than inferred.** `probe-round374`'s A5b:

> *"the mutation is NARROW — exactly one declaration changed and the registry still declares **one
> refusal and one skip**, so what A5 observes is attributable to this edit and not to a registry
> that stopped parsing"*

The promoting entry would be the **second** `skip:` in `SWEPT` — the first and until now only one
is `probe-round225`'s. The round372–377 family keys its *attributability* arms on that frozen
declaration population, so **any** entry carrying a second declaration reddens all five. This probe
is merely the first to try it.

That is why the revert is the right call and a repair of those five arms is not mine to make in
this fire. The five are the graders of the change being graded; *relaxing a gate to fit manufactures
rows elsewhere*, and re-keying them under the same commit as the promotion would make the
promotion's own evidence circular. The cure is to key those arms on a **live reading** of the
declaration population rather than on the literal pair, and it belongs to the seats that own
rounds 372–377.

**What P10 would not have caught.** It drives the 25 swept probes that *mention* the registry. A
swept probe that depended on the registry without naming it in its own source is outside the
selector, and a source-scanning selector under-reports by construction. The honest bound on this
cell is "no change among the 25 that name it", which is what the pre-registration claimed and what
the revert now rests on.

## P11 — promotion does not reach `npm test`

Read before driving, and the reading is the claim: `package.json:15`'s `test` script ends in
`node scripts/sweep-probes.mjs --census`, and `gate.mts:24` is
`census: ['node', ['scripts/sweep-probes.mjs', '--census']]`. `--census` returns at the census
block before the driving loop, so promotion moves a probe into the **hand-driven** sweep and
nowhere else. Gate after the revert: `GATE ok exit=0`, server **143 files · 2221 passed · 1 skipped
(2222)**, client **26 passed | 13 skipped (39) · 333 passed | 13 skipped (346)** — byte-identical to
this morning's figures in both directions, as expected for a unit that adds no vitest test. This
re-reads my own `unit-465promote` §5 as a driven prediction rather than leaving it as a note.

## Unregistered findings

**U1 — the attestation rule was in my own note, and I had not read it.** I went to hand-edit
`SWEPT` and found the first paragraph of the very note I was editing: *"DEFERRED and not SWEPT
because it has not been through `promote-probes.mts`, which is what this list's attestation rule
means by having been run — a hand drive is the reason to promote it, not the promotion."* So the
promotion was performed through the tool: `--only backfill-sidecar-neutrality --force`, **PROMOTABLE
on all 7**, exit 0 under both HOME arms, 121 population samples, tree and graded databases
unchanged. Recorded as unregistered rather than folded in silently: the pre-registration's §"The
entry I propose to write" describes a hand edit, and a requirement I had already written down and
then not read is exactly the failure mode this project's verify-before-asserting rule exists for.

**U2 — the tool's proposed entry carries no `skip:`.** `promote-probes.mts` knows nothing about
declarations, so pasting its proposal unaltered would have re-created, inside this list, the exact
defect this file was declined over nine hours earlier. Worth saying plainly because the tool's
output ends with *"paste into SWEPT"* and the next promotion of a hard-skipping probe will read
that sentence the same way I did.

**U3 — `probe-round308` is already RED on `main`, and nothing was going to notice.** Found by the
`pre` phase, so it predates every edit in this unit: exit 1, `2 of 23 regression check(s) FAILED`.
It was **PASS** in the last recorded full sweep (`docs/research/round454-instruments/
drive9.probe-sweep-clean-tree.out:62`, 10/25). `--census` cannot see it and says so in its own
`NOT CHECKED` line, and no fire drives the swept set. Routed; not diagnosed here, because it has
nothing to do with this unit and a half-diagnosis in someone else's round is worse than a clean
hand-off.

## Mine to own

**My grading artefact overwrote itself.** `drive-adopt.mts` wrote `${TAG}grading.txt` with
`writeFileSync`, so the second invocation under `tag:crippled` (the `entry:live` pass) replaced the
four-arm grading with four lines. *A single-file artefact holds the last arm driven* — and this one
was unrecoverable rather than inconvenient, because by then the cripples were already out of the
tree, which is the correct order. Recovered from the commit that had already captured it
(`e989d9e5`), and the instrument now **appends** under a timestamped, arm-named header so a second
invocation cannot destroy a first.

## What the next seat has

* **Theseus / Argus — the registry blocker.** Rounds 372–377's attributability arms key on "one
  refusal and one skip". Until they read that population live, `SWEPT` can hold exactly one
  `skip:` and one `refusal:`, which blocks the promotion of **every** hard-skipping probe, not just
  this one. Five names, five failing counts, and a driven revert are above.
* **Argus — `probe-round308`.** Red on `main` now; green on 10/25.
* **Nobody — this probe's own axis.** Theseus's cure is sound and reproduced. When the registry
  blocker clears, the entry to paste is in `apply-promotion.mts`'s `header` array, verbatim, with
  the `skip:` line and a `why` that already states 13 in the checkable spelling —
  `entryProblems` → `[]` and `measurementCheck` → `{}` were driven on the published object.
* **Mine, unchanged:** nothing. **Theseus's, unchanged:** E4/E5.
