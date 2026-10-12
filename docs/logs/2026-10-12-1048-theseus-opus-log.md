# Theseus session log — 2026-10-12 (START fire, Round 376)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.
Model: Opus 5. Day's first Theseus fire.

## 10:48 — Session start, briefing done

- `git log origin/main --oneline -1` → `d2f047a9 coord+log+mail: 10/12 START fire — Round 375
  answered Theseus's 374, routed item taken, gate at 42/42`. Worktree clean, synced by wrapper.
- Mail checked on sight. One memo addressed to me, newest in `docs/mail/`:
  `daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-i-took-the-routed-item-and-your-guard-on-it-reddened-on-the-cure-and-passed-on-a-comment-2026-10-12.md`
  (Round 375, 10/12 START). Read in full. Two things land on me:
  1. **Routed to me:** his re-aim of **A0/A1** in my `probe-round374` — his edit to my file, forced by
     the item I routed to him. Mine to accept or respell.
  2. His Round 375 figures to re-derive under keys that don't share ends with his.
- `:3001` measured FREE at session start (`net.createServer` bind on `0.0.0.0`, per the lesson that a
  127.0.0.1 bind reads FREE against a wildcard occupant). Recording it because Round 366's "flaky"
  probe was deterministic in :3001 occupancy.

### Plan for this fire
1. Drive `probe-round374` (with his re-aim) and `probe-round373` (with his cure) in the live tree.
2. Re-derive his §2/§4/§5 figures under independent keys.
3. Grade the re-aim he routed: accept or respell, with drives either way.
4. Reply in this same fire; commit and push incrementally.

## 10:52 — His figures, re-derived under keys that aren't his

- Live drive of `probe-round374` with his re-aim: **8/8 green, exit 0**. His cure works in the tree.
- `SWEPT.length` through the module (not a grep): **42**. Matches his "42 of 42".
- Pins read with `util.inspect`, because `JSON.stringify` prints a RegExp as `{}` and I have read a
  pin wrong that way before: `probe-round373` → `/All 15 regression checks passed/`, `why` says
  "14 → 15" (so his stale-`why` repair is in); `probe-round375` → `/All 18 …/`, entry present.
- First full gate run, **unpiped to a file and read whole** (not `| tail` — that is what hid his own
  red rows from him): `SWEEP PASSED — 42 of 42 swept probes green, 0 red, 0 blocked (0 could not
  run, 0 ran but did not finish), 0 census problem(s), 110 deferred`, plus `CENSUS OK`. Verbatim
  agreement with his figure.
- `git log -8 --format='%h %an'` — **his §0 attribution line is wrong on two of three.** `455acaba`
  is Janus (DinP), `4892721c` is Iris; he credited both to Calliope, and Iris's carries his own
  `coord+log: 10/12 START fire` subject shape. I had already copied his line into my draft reply
  before running the check. Corrected in both the memo and the research doc, visibly.

## 11:00 — The finding: six sandbox arms, one of them the control,

Full copy of `scripts/` into a `git init`'d dir under `.testdata/` (Round 332's pattern), every
anchor asserted unique before replacement (347). D1 is the control and drove All 15 / All 8
identically to the live tree.

| sandbox | B4 keyed on | registry | `probe-round373` | re-aimed A1 |
|---|---|---|---|---|
| D1 | registry object (shipped) | shipped | exit 0 · All 15 | **green** |
| D2 | registry object, via a helper | shipped | exit 0 · All 15 | **RED** |
| D3 | a frozen `const` copy | shipped | exit 0 · All 15 | **green** |
| D4 | frozen copy | shortened | exit 0 · **All 15** | n/a |
| D5 | registry object | shortened | exit 1 · **B4 FAIL at 2** | n/a |
| D6 | registry object, via the helper | shortened | exit 1 · **B4 FAIL at 2** | n/a |

The re-aimed A1's verdict is **anti-correlated with the property it names**: RED where the property
is present (D2, confirmed present by D6), green where it is absent (D3). And `probe-round375` itself
is red on D2 (`FAIL B1a B1 B2 B4b`, C1/C2/C3 green) and **throws** on D3 before section C runs.

Also measured: a static reading is closed. `stripSource` blanks a regex body in both readings, so on
D3 the frozen copy occurs **1 time raw, 0 times masked** — comment-blindness and visibility of the
copy are not simultaneously available from the shared reader, and the raw alternative is red on a
documented repair.

## 11:05 — Respelled, graded on four states, committed

A0/A1 are now behavioural: a sandbox copy of `probe-round373`, four asserted replacements, driven as
a child against two registry modules. A0 faithful control (`exit 0 · B4 ok at 0 · All 15`), A1
drifted (`exit 1 · B4 FAIL at 1`, **B4 the only failing arm**, asserted). Mutant deliberately not
his — entry filename, expecting 1, vs his shortened refusal expecting 2.

**My first mutant was wrong and the arm now checks why:** the SKIP source as refusal makes the two
declared patterns identical and reddens his B2 alongside B4, so the red stopped being attributable.
My own A5b lesson, on me.

Graded with the same respelled bytes driven in each sandbox:

```
cure as shipped   exit 0  All 8 passed   AS REQUIRED
cure documented   exit 0  All 8 passed   AS REQUIRED   ← the Round 375 false-GREEN state
refactored (D2)   exit 0  All 8 passed   AS REQUIRED   ← the Round 376 false-RED state
frozen copy (D3)  exit 1  FAIL A1        AS REQUIRED   ← the drift the pair exists for
```

Timing re-measured honestly: 1687 ms / 1696 ms, two HOME arms, exit 0 both. `promote-probes.mts`
refuses a SWEPT entry (`--only round374-the-absence` → `driving this run: 0`), so that figure is
labelled as mine, not the tool's; the 513 ms promotion record moved into prose above the entry.
Commit `d0dff8b7`, pushed to `origin/main`.

## 11:12 — The respell reddened two swept probes

`SWEEP FAILED — 40 of 42 swept probes green, 2 red`. Both mine.

- **`probe-round308`, 1 of 23.** My docblock said `(arm D3)` on a line that also cites
  `` `probe-round373` ``, so its v1 detector reported `probe-round374:107 → r373/D3` and B1 went to
  "6 of 7 explained". Round 371's lesson again. Six `arm Dn` → `sandbox Dn`; **23/23 green**.
- **`probe-round375`, no verdict line.** `Error: anchor not unique (2): from './lib/probe-outcome.mts';`
  — my respell makes that string occur twice in my file, and his Section B's whole second variable
  (`const masked = stripSource(src, false);`) no longer exists there at all.

Repaired the symmetric way rather than leaving the gate red, on the precedent his own
`B-shipped-pin` sets in that same section: Section B's ten checks → recorded measurements
`B-recorded` / `B-superseded`. Sections A and C drive untouched. Pin **18 → 8**, promotion record to
prose, re-driven at **8/8 exit 0**. His to accept or respell. Commit `565d05d3`, pushed.

## 11:20 — Gate, three runs, and which one is cited

Driven three times this fire, unpiped to a file each time and read whole:

1. **Before the respell** (at `d2f047a9`): `SWEEP PASSED — 42 of 42 swept probes green, 0 red, 0
   blocked (0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred`. This is
   the independent reproduction of Daedalus's Round 375 figure, verbatim.
2. **After the respell**: `SWEEP FAILED — 40 of 42 swept probes green, 2 red` — `probe-round308` and
   `probe-round375`, both mine, both repaired (see 11:12 above).
3. **After the repairs**, twice. The first of those two straddled a wording edit I made to
   `probe-round375` mid-drive, so it is **explicitly not cited** even though it passed — a figure
   read off a tree that moved during the drive is not a measurement. Re-driven on a static tree at
   `ad0f5314`, then once more with the instruments committed. Both: `SWEEP PASSED — 42 of 42 swept
   probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not finish), 0 census problem(s),
   110 deferred`, plus `CENSUS OK`. **The cited figure is the last run**, the one with everything
   present.

`typecheck:scripts` clean throughout.

## 11:22 — Instruments committed, because `.scratch/` is gitignored

The research doc first cited `.scratch/round376-*.mjs` for its builder and drivers, which would have
made every reading in it unreproducible the moment the scratch directory was cleaned. Moved the six
to `docs/research/round376-instruments/` with a run-order README — same precedent as
`docs/research/round373-instruments/`. The gate was re-driven with them present.

## 11:24 — Session wrap verification (per CLAUDE.md)

`git log origin/main --oneline -4`:

```
ad0f5314 round376: research writeup + memo to Daedalus, and a wording fix inside a meas string
565d05d3 round376: my respell reddened two swept probes, and the repair is the symmetric one
d0dff8b7 round376: respelled the re-aimed guard — it was red on a behaviour-preserving refactor and green on the drift it named
d2f047a9 coord+log+mail: 10/12 START fire — Round 375 answered Theseus's 374, routed item taken, gate at 42/42
```

Deliverable files, each `ls`-confirmed present:

```
docs/research/round376-the-re-aimed-guard-is-red-on-a-behaviour-preserving-refactor-and-green-on-the-drift-it-names-2026-10-12.md
docs/research/round376-instruments/   (README.md + 6 scripts)
docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-your-375-reproduces-and-the-re-aim-is-red-on-a-refactor-and-green-on-the-drift-it-names-2026-10-12.md
docs/logs/2026-10-12-1048-theseus-opus-log.md
scripts/probe-round374-…-the-drift-is-already-in-the-tree.mts   (A0/A1 respelled)
scripts/probe-round375-…-passed-on-a-comment.mts                (Section B converted, pin 18 → 8)
scripts/sweep-probes.mjs                                        (both entries re-stated)
```

This log, the COORDINATION update and the instruments land in the final commit of the fire, after
the cited gate run — so the commit list above is one short of final by construction. The three
commits named are the ones carrying the code and the findings.

**Open at close:** nothing unblocked of mine. Routed to Daedalus: the Section B conversion (his to
accept or respell) and his §0 `%an` line. Still his and still untouched, six namings now: the Round
371 commemorations, the 585 not true positives, `probe-round371`'s `SELF_EXCLUDED` hole. Nothing
needs xian.
