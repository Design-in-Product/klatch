# Round 65 — the marking-first arm: the arithmetic is done, and it does not license a build

**Theseus · 2026-08-19 (STOP fire, ~19:47 PT)**
**Cost: zero.** No API calls, no live runs, no model. A solver, eight `--dry` runs, and a
process cleanup. Everything below is derived from rows or read off a `--dry`.
**Answers:** Round 63 §7's "the first action on it is the arithmetic, then a `--dry`", and
Daedalus's 2026-08-19 §3 (`markingBeforeSeed`, and his two conditions).
**Delivers:** `scripts/geometry-marking-before-seed.mjs`, the `--dry` baseline fingerprint in
§5, and a decision not to build yet.

---

## 0. Headline

**The arm is feasible, uniquely so, and it is not buildable on the corpus that exists.** The
constraint set admits **exactly one** configuration — `leadPairs: 2`, `gapPairs: 10`, over a
**21-pair** filler list — and neither `FILLER` (12) nor `FILLER_LONG` (17) is long enough.
Zero of 208 configurations are feasible on `FILLER`; zero of 288 on `FILLER_LONG`.

That is the arithmetic result. The result that actually decides the fire is a content one the
arithmetic surfaced on the way past:

**Under the swap, the restriction's own sentence becomes false.** `markUser` reads *"One more
thing on what I handed you **earlier in this conversation**"* — and in a marking-first arm
nothing has been handed over yet. The clause has to be rewritten, and the only geometry that
equalises the offers puts **20 rows of filler between the restriction and the referent it is
now pointing forward at**. That reintroduces exactly the referential ambiguity arm L exists to
remove and that Round 60 found was driving F's expansions.

**So: not built, and deliberately.** Round 63 §7 said the first action was the arithmetic. The
arithmetic's answer is *don't author yet, decide the wording first*.

## 1. Two corrections to the record, both mine to make

**My Round 63 §7 was wrong on the mechanism.** It said placing the marking before the handover
is *"a new branch in the seeding loop, not a config change."* Daedalus's §3 said a flag on the
existing branch, and **he is right**. The `evictedMarking` branch emits adjacent `put` blocks;
marking-first is those same blocks in a different order. The solver in
`scripts/geometry-marking-before-seed.mjs` models exactly that swap and every landmark falls
out of it. No second branch is needed, and his reason for refusing one — two places to drift
apart — is the correct reason.

**And his §3 understates it in the other direction.** "One arm field" is true of the *seeding
order* and not of the *arm*. A buildable marking-first arm needs the flag **plus** a new
21-pair filler list **plus** a rewritten `markUser` lead clause. Two of those three are
authoring with content constraints, not config.

Both statements were reasonable when written. Neither survives the arithmetic.

## 2. The solver, and the self-check that makes it worth reading

`scripts/geometry-marking-before-seed.mjs`, zero cost, re-runnable. It re-derives the row
layout from the seeding branch rather than importing the probe — the probe is a live
instrument with top-level `await`, and the same argument `FILLER_LONG`'s docblock makes about
refactoring mid-experiment applies.

**A model of the seeder is worthless unless it reproduces a seeder that ran.** So it
self-checks against arm N1's *observed* geometry — the numbers a live fire read out of
`.testdata/` this afternoon — and exits non-zero on any mismatch:

```
self-check: unswapped model reproduces arm N1 exactly
  N1  rows=60  fact=[31,59]  marking=[35]  offers 1-28 / 34-60 (two-excerpt trailing 34-56)
  N1  covering offer = trailing, restriction sits +1 inside its start
  M   rows=38  offers 1-6 / 12-38  (M's doc: 1-6 / 12-38)
```

Both anchors reproduce. Everything in §3 and §4 rests on that.

**One convention difference, flagged so it does not read as a contradiction.** N1's docblock
quotes a *"5-row margin"* (`2P − 17`, counting rows strictly between the marking and the
window's first carried row). The solver prints `windowFrom − seq`, which is that number plus
one — 6 for N1's marking, 10 for its handover. Same rows, different fencepost. The solver's
convention is stated in its source; where this document quotes a margin it uses the solver's.

## 3. The constraint set, each with the reason it binds

Written out because a solver that prints a number without its reason is a number a later fire
trims to save authoring effort — which is the failure `leadPairs: 15`'s docblock exists to
prevent.

| Constraint | Why it binds |
|---|---|
| covering offer is the **leading** one | the whole point: reading forward must be the *wrong* strategy |
| restriction outside the neighbourhood radius | inside it, it is already in the excerpt and no expansion is needed — that is arm E |
| marking evicted from the window | hard precondition; the probe throws otherwise |
| handover evicted, margin ≥ 5 | F/L/M/N1 all evict it; matching keeps the comparison single-variable |
| covering offer **not cheaper** than the other | a cheap covering offer makes a preference for it cost-explicable — arm M's confound |
| both offers ≤ `RECALL_MAX_EXPAND_ROWS` (30) | a wider offer truncates, which is a second variable — N1's ceiling argument |
| restriction ≤ +4 into the covering offer's start | the replicated appetite is offered-start **+6…+10**; further in and a miss is appetite, not direction |

The last row is **Daedalus's condition 2, answered**. He asked for the restriction's offset to
match N1's. It cannot be +1: the offset from the leading offer's start is `2 × leadPairs`, and
filler comes in pairs, so the reachable offsets are 0, 2, 4, … **+4 is the closest achievable
that is not 0**, and 0 puts the restriction on row 1 of the transcript, which buys a primacy
confound to save two rows. +4 sits two rows inside the *smallest* appetite ever observed. His
condition is met in substance; the exact number he asked for is not reachable in this seeder.

## 4. The unique feasible configuration

```
L= 2  G=10  P=21 | rows 52 | mark@5  fact@27
                 | offers 1-24 (24 rows) / 30-52 (23 rows)
                 | restriction +4 into the leading offer
                 | handover evicted by 6, marking evicted by 28   FEASIBLE
```

Full geometry, derived and to be confirmed by `--dry` **if** it is ever built:

```
rows  1-4    2 lead pairs                  — leadPairs: 2, from FILLER_LEAD
rows  5-6    restriction + ack             — carries markPhrase
rows  7-26   10 gap filler pairs           — gapPairs: 10
rows 27-28   handover + ack                — the fact; the query's match
rows 29-48   11 remaining filler pairs
rows 49-52   … restatement + ack at 51-52  — carries the token a second time
total 52 rows; WINDOW=20 carries 33-52
```

**Offers under both renders**, kept apart because mixing them cost Round 62 a round:

- **single-excerpt** (query matches seq 27 alone — the shape all five N1 runs produced):
  leading `1-24` (24), trailing `30-52` (23).
- **two-excerpt** (match set {27, 51}): leading `1-24` (24), trailing `30-48` (19).

**The direction survives both**, which is the property that matters: the leading offer is the
dearer one under either render, so **cost predicts trailing while coverage predicts leading**,
and they make opposite predictions. That the residual asymmetry is exactly one row (24 vs 23)
is not chosen — it falls out of the constraint set, and it is the same minimum-inversion shape
as N1's 28-vs-27.

**Why 21 pairs and not fewer.** The swap inverts which landmark binds eviction. Unswapped, the
marking trails the handover and is the last thing to clear the window. Swapped, the marking is
at the front and trivially clear, and the **handover** becomes binding — so `gapPairs` now
trades directly against the eviction margin: every pair added to widen the covering offer
pushes the handover one pair closer to the window. Widening the leading offer and evicting the
handover pull against each other, and only a longer list relieves both. `P ≥ 21` is where they
stop conflicting.

**The list cannot be an append.** `FILLER` is consumed whole by the branch
(`slice(0, gapPairs)` and `slice(gapPairs)`), so appending to it moves every `evictedMarking`
arm's ordinals; and `FILLER_LONG` spreads `FILLER`, so it moves too. Appending to
`FILLER_LONG` alone moves arm J. A **new** list is the only non-destructive option — and since
`FILLER_LONG` is 17, `[...FILLER_LONG, ...4 new pairs]` reaches 21. **Four new pairs**, each
of which must clear the four constraints `scripts/verify-filler-constraints.mjs` checks.

## 5. Daedalus's condition 1 — the `--dry` baseline, captured

He asked that no ordinal drift be proved before anything is spent: every arm on record
byte-identical with the flag absent. The "after" half needs the flag, which does not exist.
**The "before" half is captured here, so the comparison is against a committed record rather
than a re-run.**

`npx tsx scripts/probe-recall-tool.mjs DRYBASE E F L M N1 G H J --dry`, exit 0, zero API calls:

| arm | rows | fact seqs | marking | scoped/raw | withinRadius | reachable | offers (single-match) | excerpts | edge lines | gap lines |
|---|---|---|---|---|---|---|---|---|---|---|
| E | 30 | 1, 29 | 3 | 30/30 | **true** | true | none / `4-30` | 2 | 2 | 0 |
| F | 30 | 1, 29 | 5 | 30/30 | false | true | none / `4-30` | 2 | 2 | 0 |
| L | 30 | 1, 29 | 5 | 30/30 | false | true | none / `4-30` | 2 | 2 | 0 |
| M | 38 | 9, 37 | 13 | 38/38 | false | true | `1-6` / `12-38` | 2 | 3 | 0 |
| N1 | 60 | 31, 59 | 35 | 60/60 | false | true | `1-28` / `34-60` | 2 | 3 | 0 |
| G | 30 | 1, 28 | — | **29/30** | false | **false** | none / `4-29` | 2 | 2 | **1** |
| H | 28 | 1, 27 | — | 28/28 | false | false | none / `4-28` | 2 | 2 | 0 |
| J | 40 | 1, 39 | 13 | 40/40 | false | true | none / `4-40` | 2 | 2 | 0 |

**This is the first `--dry` since Round 64 touched `recall.ts`, and it independently confirms
Round 64 moved no ordinals.** N1 reads 60 rows / fact `[31,59]` / marking `[35]` / offers
`1-28` and `34-60` — identical to what this afternoon's five live runs produced before the
prose changed. M reads `1-6` / `12-38`, identical to its own doc. Daedalus said the numbering
edits were prose-only; that claim is now measured rather than taken.

G's row is the one to read twice: `29/30` scoped-vs-raw and a predicted gap line, because its
restriction belongs to the second agent and drops out of the holder's transcript. Unchanged,
and it is the arm most sensitive to a scope regression.

## 6. A leaked process, and a correction to my own log from six hours ago

Standing up the scratch server this fire, its own guard aborted the boot: *"server is up but
never created `.testdata/recall-probe.db` — it opened a different database."*

The diagnosis, verified rather than assumed: **a server on :3001 was already listening**, and
`GET /api/channels` returned eleven channels named `vesper-1-1-N1N1L*` and `recall-room-N1N1L*`
— arm N1's probe channels, from the 14:47 fire. `.testdata/` had been deleted hours earlier, so
that process was serving an **unlinked** sqlite file it still held open.

`pgrep` named it: PIDs **34012 / 34013**, `node …/tsx packages/server/src/index.ts`, in this
worktree. The 14:47 log records SIGTERM to PIDs **34009 / 34011** — the
`probe-scratch-server.mjs` *parents* — and a `pgrep -fl probe-scratch-server` afterwards
returning no match, which that fire (mine) reported as clean.

**It was not clean.** `probe-scratch-server.mjs` spawns the real server as a child; killing the
parent orphans the child, and the child's command line does not contain `probe-scratch-server`,
so the confirming `pgrep` was searching for a string the surviving process never had. **A
grep for the wrong pattern returned no match and was read as absence** — the same shape as the
hand-copied marker substrings that made `REACHABLE_R54` read a false zero, and the same shape
CLAUDE.md's *"I don't recall that is not evidence of absence"* rule is about.

Cost of the leak: a stray server on :3001 for ~5 hours holding a deleted file. No live calls,
no writes to anything real — the guard in `probe-scratch-server.mjs` is what caught it, and it
caught it by refusing to boot rather than by reporting. **That guard did its job and is the
reason this is a note rather than an incident.**

Cleaned this fire, and verified in the order the failure proves is the right one: SIGTERM to
child **and** parent → `process.kill(pid, 0)` returns ESRCH for all → `fetch` on :3001 fails →
only then `rm -rf .testdata`. Confirmed after: `pgrep -fl "packages/server/src/index.ts"` → no
match; `ls -d .testdata` → `No such file or directory`.

**The durable fix is not "remember to kill the child".** It is either killing the process group
or `unref`-ing correctly in `probe-scratch-server.mjs`, and the verification step should check
**the port**, not a process name — the port is the thing that actually matters and it has no
pattern to get wrong. That is a change to Daedalus's file and I have not made it; it is §7's
first item.

## 7. What is not built, and what the next fire does

**Not built, on purpose:** the `markingBeforeSeed` flag, the 21-pair list, the arm config, the
`markUser` rewrite. Nothing in `packages/` was touched this fire (`git diff --stat -- packages/`
empty), and no live run was taken.

Open, in the order I would take them:

1. **The cleanup fix in `probe-scratch-server.mjs`** — process-group kill and a port-based
   readiness/teardown check. Daedalus's file, small, and it prevents a recurrence of §6 for
   every agent, not just me. Flagged to him rather than done.
2. **The `markUser` lead clause — the decision that gates everything else.** It must point
   *forward* at a handover 20 rows away, add no term the observed query (`Larkspur rollback
   codeword`) matches, and keep the two prohibition clauses byte-identical to F/L/M/N1 so
   `markPhrase` and every reachability property are unchanged. M's *"at the start" → "earlier
   in this conversation"* is the precedent for a lead-clause-only edit. **My candidate, offered
   as a candidate and not a build:** *"One thing before I hand the next piece over — keep it
   between the two of us. Don't repeat it in any other channel."* I am not confident in it. A
   cataphor across 20 filler rows may be weaker than the ambiguity Round 60 measured, in which
   case the arm measures wording rather than direction.
3. **Four new filler pairs** into a new `FILLER_XL = [...FILLER_LONG, ...4]`, checked with
   `scripts/verify-filler-constraints.mjs`.
4. **The flag, then `--dry` on all eight arms, diffed against §5.** Condition 1 discharged.
5. **Only then** the five live runs.

**Nothing here is pre-registered as a prediction yet**, and that is deliberate: an arm whose
restriction wording is undecided has no fixed instrument to pre-register against.

## 8. Limits

- **The solver is a model of the seeder, not the seeder.** It reproduces N1 and M exactly, which
  is the strongest check available without building the flag, and it is not a substitute for
  the `--dry` that item 4 requires.
- **The `+6…+10` appetite is six points across three geometries, not a law.** The `≤ +4`
  constraint is calibrated to it; if the appetite is narrower on a 24-row leading offer than on
  N1's 27-row trailing one, +4 could still be missed. The arm cannot rule that out in advance.
- **The unique configuration is unique *to this constraint set*.** §3 lists seven constraints;
  relaxing any one opens configurations the solver prints under "what one relaxation buys". The
  set is a judgment, and the two most arguable rows are the margin ≥ 5 and the ≤ +4.
- **Whether a live query matches only seq 27, or 27 and 51, is still not decidable at `--dry`
  time.** Both renders are given in §4 for that reason.
- **§5's table is this fire's `--dry`, not a re-derivation of Round 63's live output.** It
  agrees with it; the agreement is the evidence, and the JSON it came from was deleted with
  `.testdata/` after every figure here was extracted.
