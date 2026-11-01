---
agent: Daedalus (architecture & implementation)
date: 2026-10-31
model: claude-opus-5
worktree: /Users/xian/Development/klatch-worktrees/daedalus
---

# 2026-10-31 — Daedalus session log

## 09:17 — START fire opens

Briefing done in order: pulled state verified (`HEAD` = `origin/main` = `90cfdb8d` at open),
`docs/COORDINATION.md` read, `docs/mail/` listed, `docs/briefs/cross-pollination/current.md`
present and dated 10/31.

Checkpoint = my own last commit `f3c7f64b` (10/30 17:35 STOP fire), committed
`2026-10-30T17:35:20-07:00`. 13 commits since, **author-checked, none mine**: Argus's and Iris's
and Calliope's 10/30 STOP and 10/31 START coord+logs, Pard's fire-depth report, the automated
cross-pollination bump, and Theseus's `unit-464nomoved` chain plus his mail to me.
`git diff --stat f3c7f64b..HEAD -- packages/ scripts/` **empty**.

**Mail.** One new memo addressed to this seat: Theseus → Daedalus/xian cc Janus/Argus/Calliope/Iris,
*"your one routed item is cured and the cure costs no other figure"*. Read in full. It routes
**nothing** to me — §7 says *"Yours, routed back from here: nothing"* — and its §4 declines to let
his cured map close my open item, correctly: a cured map shows §3.4b is removable, not writable.
Thread left in `docs/mail/` because its one open item is xian's.

So: nothing routed, and two unblocked items in my own bucket. Took both.

## 09:20 — the unit

`docs/research/unit-464authored-2026-10-31/`. Plan: one new map discharges both items if it is
authored to carry prose cross-references — §3.4b conformance makes it `GTYPEDDEF`'s authored green
cell, and cross-references between declared rows give `GSUBJ` leg A a non-zero denominator.

Subject: arm **`t2-dir-only`**, which no filed map covers (`V21-MAP.md` covers `t8-unpinned`,
`MAP-B` covers three others; `t2-dir-only` and `t9-insensitive-leg` were unmapped). Chose it over
`t9-insensitive-leg` for reach width — a map of it has cross-references to make.

Read the arm's reach set off the **real instrument** via a rowless probe map (`probe0`) rather than
hand-rolling a census: duplicating `membersOf`/`tokensOf`/`movedBetween` would have been a second
implementation of the key I was about to be graded under. Declared as prior knowledge in the
pre-registration, which is larger than `V21-MAP.md`'s — membership *and* token values were both
read before authoring.

**`probe0` produced a finding before the map existed:** a map with no rows at all scores
`GTYPEDDEF ok  0 typed tokens`. The gate has no `VACUOUS` branch, where `GSUBJ` — added the same
fire — prints its empty denominator. Recorded in the pre-registration as already-measured and
explicitly **not** a prediction.

Pre-registration `fcb2eb30` committed and **pushed to `main` before `V22-MAP.md` existed**.

## 09:27 — drives

5 drives, every `.err` 0 bytes with the child's `stdio` pinned, `drive5` byte-identical to `drive1`.

| drive | arm | result |
|---|---|---|
| `drive1` | honest | `MAPVERDICT/0 ok gates=16 red=[]`, exit 0 |
| `drive2` | `subject-blind` | `red=[GTYPEDDEF,GSUBJ]` — `GSUBJ A/bite RED opportunities=1 … withheld 0` |
| `drive3` | `subject-rows-only` | `GSUBJ B/non-collapse RED 3 of 10 … [G1,T9,W1]` |
| `drive4` | `typed-ungated` | `GTYPEDDEF ok  OK (figure not read); would have flagged 0` |
| `drive5` | honest, repeat | byte-identical to `drive1` |

`drive1` completeness: `underReportedArmCaused=[]`, raw `underReported=[G1,W1]` (token axis only,
the two drift members whose tokens I deliberately did not quote), `fullyNamed=8 · fullyCaptured=8`
of 10 rows, `refDropped=1`, `linesSubjected=7`.

**10 of 10 predictions land.** Ten of ten is not a good sign by itself and the results file says so:
membership and values were read first, so `R6`–`R8` and `R10` are closer to arithmetic than
forecasts. The genuinely open four were `R1`/`R2` (is §3.4b writable, does obeying it cost a
captured token) and `R4`/`R5` (do the two legs have a counterfactual off Theseus's map).

**Unpredicted, and it goes the rule's way:** `drive2` reddens `GTYPEDDEF` too, on `n` out of
`` `sensitive=[T2,T2c,T2b] n=3;` `` — an unmoved figure quoted on the row of the member that emits
it. §3.4a's re-key is a **precondition** for §3.4b, not a neighbour: a conforming map is defective
under the pre-fix key.

## 09:33 — the finding, which is against my own gate

`quoted-denominator.mjs` reads the denominator `GTYPEDDEF` never publishes. Reader copied verbatim
from `grade-filed-maps.mjs:226-237` and therefore **gated** on the same real slice `GKP` uses,
asserting the checker's own published `11 tokens` and `selector=max(pins first)`; exits 2 and
publishes no number if the copy drifts. `KPGATE ok` in the recording.

```
V22-MAP.md           (authored, conforming) : checker sees  1 of 20 distinct names
V21-MAP.md           (Theseus's, cured)     : checker sees  2 of 30
V21-MAP.baseline.md  (his, pre-cure)        : checker sees  3 of 31
PROBE-MAP-rowless.md (no rows)              : checker sees  0 — and scored GREEN
```

Cause: `tokensOf`'s left boundary `(?:^|\s)` is right on the **recording** side and cannot reach a
name preceded by a backtick, which on the **map** side is every name. Only second-and-later tokens
inside a multi-token span are visible — which is why `` `T9 moved=0` `` reddened and `` `moved=0` ``
alone would not have. **The red §3.4b was adopted on was one of three names the detector could see
on a section quoting 31.**

`R2` is how this surfaced rather than being argued: it predicted the authored green would be
non-vacuous, the denominator came back **1**, so it lands by its letter and the number says the
opposite of what it was written to establish.

Not cured this fire, deliberately: a unit that cures its own subject needs its baseline from git,
and the `WIDE` reading prices the cure at 28 further exposed names on `V21-MAP.md` including
`reachedArmCaused` on an unsubjected summary line. Honest expectation: a backtick-aware boundary
reddens `GTYPEDDEF` on every filed map, this one included. Routed as a named item, no blocker, no
deadline.

## 09:38 — convention pinned, not rewritten

§3.4b's caveat is **left exactly as written** (it was a measurement) with a dated **PIN** under it
carrying a three-column table: sentence one false twice over, sentence two false in the worse
direction. §4's `GTYPEDDEF` bullet carries the reach figure too, because that bullet is what a map
author reads. Standing instruction in the pin: *§3.4b is writable from the start; do not cite the
gate as evidence that anyone obeys it until the map-side boundary is cured.*

## 09:44 — the coordination insert was mis-anchored on the first run, and that is recorded

`insert-coord-entry.mjs` v1 keyed on *"the last `STOP-CONDITION VALUE` standing line in the
Daedalus section"* and landed the entry at `COORDINATION.md:486` — eleven standing lines down, in
the middle of October. **In a newest-first list, "last in file order" is "oldest
chronologically"**, so a `last`-keyed anchor is wrong by construction. Restored the file with
`git checkout --` (nothing else of mine was uncommitted in it; the convention pin was already
committed) and re-keyed the anchor **positively** on the first dated fire entry
(`/^- \*\*\d\d\/\d\d [A-Z]+ fire/`), inserting immediately before it. v2 printed
`ANCHOR COORDINATION.md:463` and the insert verified in place at 463-470 with the 10/30 entry
intact at 471.

## 09:47 — cross-repo mail, drained

`find -newermt` against the `2026-10-30T17:35:20` checkpoint:

| mailbox | new | klatch/daedalus hits |
|---|---|---|
| `designinproduct/docs/mail` | 0 | — |
| `mediajunkie/docs/mail` | 1 (exec thanks-the-crew) | 0, content-grepped |
| `dispatch/mail` | 4 (daily sync, inbox-check-clean, date-now relay) | 0, content-grepped |
| `piper-morgan-product/mailboxes` | 864 | 6, all `MANIFEST.md` index lines tracing to the stale 2026-04/05 cluster already on record |

**Nothing owed from any.**

## 09:50 — not run this fire, stated so silence stays diagnostic

`npm test`, `npm run typecheck` and `node scripts/sweep-probes.mjs` were **not** run. The pre-commit
hook's census printed `CENSUS OK — 153 probe files, 43 swept/110 deferred` on each commit; that is a
source-and-bookkeeping read, it drives no probe, and it is **not** offered as a gate figure. The
cell was not edited and not driven, so the stop-condition value is **not re-read** this fire and is
not restated as current. `git status --porcelain -- packages/ scripts/` **empty** at open
(`baseline.gitstatus.txt`, 0 bytes) and at close.

## Drain

* **Drained and done:** both unblocked items in my own bucket (`GTYPEDDEF`'s authored green cell;
  `GSUBJ` leg A's counterfactual off Theseus's map) — taken and closed. Theseus's memo read and
  answered in the same fire. Convention pinned. Coordination and log written. All four cross-repo
  mailboxes checked.
* **Deferred with named blockers:** the population cell's inline reader into the lib; the SDK
  `0.122 → 1.3.0` bump; the 8 non-zero exits and 2 `spawn`-hazard instruments from Round 453 —
  all three unchanged and each still waiting on the dependency recorded against it.
* **Open with no blocker and no deadline, named so they stay claimable:** the map-side token
  boundary in `tokensOf`; a `VACUOUS` branch for `GTYPEDDEF` keyed on the quoted-span denominator;
  whether §3.4b is writable on a *hard* map whose rows must quote another member's moved figure.

Klatch's fires are a recorded exception to the fleet duty-cycle drain baseline: bounded. Day-part
checklist done, what it surfaced acted on, state written down, stop.

---

## 09:53 — Session resumed (wrap verification, appended after the commits it cites)

**Step 1 — commits landed.** `git log origin/main --oneline -6`:

```
9ceb1af4 coord+log: 10/31 START fire — both my open items closed on one authored map, 10 of 10 predictions land, and GTYPEDDEF reads 1 of 20
70724a40 mail(Daedalus -> Theseus, xian; cc Janus/Argus/Calliope/Iris): both my open items are closed on one authored map, and the gate that closed one of them reads 1 of 20
82961845 unit-464authored: results, and a dated PIN on the 3.4b caveat both of whose sentences are now false
5d82f1fb unit-464authored: the v2.2-authored map, 10 of 10 predictions land, and GTYPEDDEF reads 1 of 20 quoted names
fcb2eb30 unit-464authored: pre-registration, before the v2.2-authored map exists
90cfdb8d coord+log: 10/31 START fire — census-only no-op, 8 commits read none mine, gate byte-identical
```

All five of this fire's commits are on `origin/main`. `fcb2eb30` was pushed on its own, before
`V22-MAP.md` existed, which is the property the pre-registration rests on; the mail commit
`70724a40` was pushed to `main` separately as the mail convention requires.

**Step 2 — deliverables present.** `ls` confirms, with sizes:

* `docs/research/unit-464authored-2026-10-31/` — 23 files: `PRE-REGISTRATION.md` (6289 B),
  `V22-MAP.md` (7976 B), `RESULTS.md` (9740 B), `PROBE-MAP-rowless.md`, `drive.mjs`,
  `quoted-denominator.mjs`, `insert-coord-entry.mjs`, `baseline.rev`, `baseline.gitstatus.txt`
  (**0 B**), and 6 recordings × (`.out` + `.err`) with **every `.err` 0 bytes**.
* `docs/mail/daedalus-to-theseus-…-reads-1-of-20-2026-10-31.md` (9613 B).
* `docs/logs/2026-10-31-daedalus-log.md` (this file).
* `docs/COORDINATION.md` — this fire's 8 bullets verified in place at lines 463-470, with the
  10/30 STOP entry intact at 471.
* `docs/research/CRIPPLE-MAP-CONVENTION.md` — §3.4b PIN and the §4 `GTYPEDDEF` reach clause.

**Step 3 — tree state.** `git status --porcelain` **empty** (0 lines). `git status --porcelain --
packages/ scripts/` **empty**, and `git diff --stat 90cfdb8d..HEAD -- packages/ scripts/`
**empty** — no product file was touched this fire.

Nothing was left unfinished and nothing is claimed that is not in the list above. Delivery is the
wrapper's to log, not mine to assert.

---

## 13:17 — Session resumed (WORK fire, claude-opus-5)

Briefing in order. `date` at open **2026-10-31T13:19:33-0700**. Worktree synced by the wrapper:
`HEAD` = `origin/main` = `636853f9` at open, `git log HEAD..origin/main` empty, tree clean.
`git status --porcelain -- packages/ scripts/` **empty**, stamped to
`docs/research/unit-464absorb-2026-10-31/baseline.gitstatus.txt` (**0 bytes**).

**Commit authorship checked before reading anything as mine.** The five commits above my own
`4df06a01` are **Theseus's and Calliope's**, not mine — `636853f9` Calliope, `cb159ebc`/
`1d314150`/`023b6292`/`a70ebe33` Theseus. The initial `git status` block lists them under
"Recent commits" with no author, which is exactly the shape that has read as mine before.

**Mail read at open.** `ls docs/mail/` mtimes are all `Oct 31 13:17` — the wrapper's sync touch,
not arrival times, so the mtime ordering is noise. Keyed on **commit date** instead
(`git log --name-only -- docs/mail/`): one new inbound since my 09:30 memo —
`theseus-to-daedalus-…-your-cure-is-a-no-op-on-your-own-green-cell-…-2026-10-31.md`, landed
`10-31 11:03` in `023b6292`. Read in full. It routes me **one** item and explicitly declines to
take it: the downstream absorption.

(Also noted: a bare-date `--since` gave zero rows for today's commits, so the window was taken
with `-25` instead. That is the drive-clock keying I have been bitten by before.)

### The work: `docs/research/unit-464absorb-2026-10-31/`

Pre-registration written and **pushed to `main` at `74801759` before any instrument in the
directory existed** — four candidate absorption routes named (R-REC, R-OWN, R-CTX, R-EMIT), six
predictions with figures and directions, six arms each to be graded as a delta against a matched
same-boundary drive.

**15 drives, 15 of 15 `.err` files 0 bytes** (counted with `readdirSync`, not `grep`), 15 JSON
sidecars. The live checker was not edited; the instrumented copy is derived from it with 7 gated
anchors. The cell was not driven and not edited.

Findings, in the order they came out:

1. **CUREPRICE, not the delta table.** All three cripples move the output at both boundaries, so
   that table answers nothing. Pricing the cure INSIDE each route: as-shipped **0**, `R-OWN`
   **11**, `R-CTX` **14**, `R-EMIT` **3**. All load-bearing — a conjunction, not an
   over-determination. **And not over the same figure:** `R-OWN`/`R-CTX` move `GTYPEDDEF`
   (`ok n=0` → `RED n=20`), the gated one; `R-EMIT` moves only `typedRecordingKey`, which the
   checker prints and no gate reads.
2. **The map is SATURATED.** `quotedOfMe` == `ownEmits` exactly on all seven members that quote
   anything; the other three quote nothing. 20 of 20 absorbed. The zero price measures the map's
   attribution, not the checker's blindness.
3. **`P5` refuted exactly backwards** — predicted `CTX-UNREACHED ≥ 10`/`OWNEMITS-CANCEL ≤ 9`,
   measured **0 / 19**. I had inferred where the names live from Theseus's `TOKCENSUS
   withBacktick=17` rather than reading the per-member sets, which were one dump away.
4. **The KP, minted after an addendum pre-registration pushed at `a7770db3`** and saying in its
   own first line that it was written mid-unit. Identical sliced span on two destinations, pair
   asserted to differ at exactly 2 lines: base **0**, ALIGNED control **0**, MISATTRIBUTED **6**
   — green at LIVE, `RED n=1 [t2-dir-only:pinDistance]` at WIDE. `KPVERDICT/0 ok 4 of 4`.
   `K1` is the cost of not curing; `K3` is what makes `K2` a measurement and not an edit.
5. **`P2` refuted at 2** — the cure reads the tail of a hyphenated identifier as a name
   (`--since=` → `since`, `subject-only=` → `only`). Harmless on the recording side, a
   **false-positive mode** on the map side. A cost of the cure the zero price hid.

**Four defects of my own**, all four written up in `RESULTS.md` §6 and in the memo §6: the dump
was dead code after `process.exit(code)` and an **absent** file is what caught it (an
empty-but-present one would have had the classifier report a clean zero); `P1a` printed
`statSync().size` against `String.length` on one line; `DEPTH ok` was a printed claim that gated
nothing and was false when it printed; and a dead fallback plus an unasserted arm count in the KP
grader's reader.

### Wrap verification — run AFTER the commits it cites

**Step 1 — commits on `origin/main`:**

```
$ git -C . log origin/main --oneline -7
<filled in below, after the final push>
```

**Step 2 — deliverables present**, by `ls`, after the final push. **Step 3 — this log pushed
last.** Both appended below rather than above, so the verification cannot predate what it cites.

### 13:5x — Wrap verification, run AFTER the six commits it cites

**Step 1 — commits on `origin/main`** (`git log origin/main --oneline -7`, run after the final
push of everything except this verification block):

```
541de317 coord+log: 10/31 WORK fire — the routed item is answered at the level of the map
6fd6f0dd unit-464absorb: results, and mail to Theseus/xian cc Janus/Argus/Calliope/Iris
14d9bbe4 unit-464absorb: the KP lands 4 of 4 — the zero price measures the MAP, not the cure
a7770db3 unit-464absorb: pre-registration addendum, before the four KP arms are driven
21e109db unit-464absorb: all three routes load-bearing, and P5 is refuted exactly backwards
74801759 unit-464absorb: pre-registration, before any instrument in the directory exists
636853f9 coord+log: 10/31 MID fire — … (Calliope's, the rev this fire opened at)
```

All six of this fire's commits are on `origin/main`, checked on `origin/main` and not in the
worktree. `git log HEAD..origin/main` after a fresh `git fetch`: **0 lines**.

**Step 2 — deliverables present**, by `ls`/`statSync`, with sizes:

* `docs/research/unit-464absorb-2026-10-31/` — **58 files**: `PRE-REGISTRATION.md` (8160 B),
  `PRE-REGISTRATION-2.md` (4638 B), `RESULTS.md` (11102 B), `make-scratch.mjs` (7906 B),
  `drive.mjs` (7734 B), `attribute.mjs` (8342 B), `mint-kp.mjs` (4450 B), `drive-kp.mjs`
  (8448 B), `KP-MISATTRIBUTED-MAP.md` and `KP-ALIGNED-MAP.md` (**8035 B each** — equal size is
  expected and is itself a check, since the inserted text is byte-identical and only its
  destination row differs), `grade-filed-maps.INSTRUMENTED.mjs`, `baseline.rev` (41 B),
  `baseline.gitstatus.txt` (**0 B**), and 15 drives × (`.out` + `.err` + `.absorb.json`) with
  **15 of 15 `.err` at 0 bytes**.
* `docs/mail/daedalus-to-theseus-…-the-zero-price-measures-my-map-not-your-cure-2026-10-31.md`
  (12550 B), pushed to `main` in `6fd6f0dd` as the mail convention requires.
* `docs/COORDINATION.md` — this fire's two bullets verified **by section index, not by string
  proximity**: the Daedalus section spans lines 458–2582 and the new entry is at line 465,
  inside it. (A shared-file insert of mine has landed in Argus's section before.)
* `docs/logs/2026-10-31-daedalus-log.md` (this file, 16685 B before this block).

**Step 3 — tree state.** `git status --porcelain -- packages/ scripts/` **empty** (0 lines) at
close, matching the 0-byte `baseline.gitstatus.txt` taken at open. No product file was touched.

**Drain.** Mail re-checked at close: `git log 636853f9..origin/main -- docs/mail/` returns one
commit, **my own**. Cross-repo boxes checked with `find -newermt` against the 13:19:33 open
stamp — `designinproduct` 3 new, `mediajunkie` 1, `dispatch` 4, `piper-morgan-product/mailboxes`
442; the three small boxes were **content**-grepped (not just filename-grepped) and gave **one**
hit: Pard → Janus on `mail-deliver.sh` stamping, which names "Klatch" only in a list of DinP-side
seats for Janus to relay to, says "No reply needed", and is addressed to Janus — Klatch's POC for
relayed conventions is Calliope, not this seat. Nothing owed from any box. Needs-you unchanged
at 3. Two consecutive checks found nothing further unblocked; fire closed bounded, per Klatch's
recorded exception to the platform drain baseline.

**Deferred with named blockers — none newly.** The one figure this unit opened and did not take
(how many of the 8 scored maps are saturated) is **named without a deadline and without a
blocker**, and it sits better on Theseus's §1 table than here; it is not claimed as blocked.

Nothing is claimed that is not in the list above. Delivery is the wrapper's to log, not mine to
assert.

**Addendum — this log's own commit was rebased, and the record should say so.** The first push
of the verification block above was **rejected non-fast-forward**: Argus's `741b1519` (10/31
WORK, census-only no-op) landed on `origin/main` between my `git fetch` and my `git push`, so
the "0 lines" figure in the Drain paragraph was true when taken and stale by the time it was
pushed. Checked before touching anything that the two commits are **disjoint by file** —
mine `docs/logs/2026-10-31-daedalus-log.md` only, his `docs/COORDINATION.md` +
`docs/logs/2026-10-31-argus-log.md` — then `git rebase origin/main`, which reported
`Successfully rebased` with no conflict. Verified after the recovery, as the git-safety rule
requires: all **seven** of this fire's commits present and authored `Daedalus (Klatch)`
(`74801759`, `21e109db`, `a7770db3`, `14d9bbe4`, `6fd6f0dd`, `541de317`, and this log commit,
rebased from `07f0d7c6` to `ab3e5db8`); `git status --porcelain` **0 lines**; `HEAD` and
`origin/main` divergent by **0 in both directions**. No force push was used and none was needed.

---

## 17:17 — Session resumed (STOP fire, claude-opus-5)

Session-start protocol: worktree synced by the wrapper (`e6460aba`), `git status` clean,
`COORDINATION.md` read, `docs/mail/` listed. **`HEAD` at open is `e6460aba`, which is
Calliope's SWEEP-fire coord+log, NOT mine** — checked the author rather than assuming the tip
commit was my own last fire. My last fire was the 13:37 WORK one.

**One new inbound memo, and it postdates my last fire:** Theseus → Daedalus/xian cc
Janus/Argus/Calliope/Iris, `0a719bfb` at **15:02**, "one of the 8 is saturated and it is
yours". Read in full at open. It routes no defect to this seat; it supplies the figure my
10/31 WORK §7 named and left claimable (`SATCOUNT 1 saturated · 7 NOT saturated`) and reads it
as closing my open `VACUOUS` item. Took that item and nothing else.

## 17:21 — the unit, and why its first question is not the one either of us asked

`docs/research/unit-464vac-2026-10-31/`. Pre-registration written and pushed **before any
instrument in the directory existed** (`8c7718db`), baseline `e6460aba`,
`baseline.gitstatus.txt` 0 bytes.

The thing that stopped me taking his reading on trust: **his saturation predicate is
`price.length === 0`, the CURE's price at the wide token boundary** (`sat-census.mjs:351`),
and `GTYPEDDEF` runs at the LIVE boundary. A branch inside the gate can only read figures the
gate has. So the pre-registered first question was not "should VACUOUS fire" but *is there any
live-boundary denominator that separates the 1 saturated cell from the other 7* — with `V4`
saying explicitly that if the answer is no, the item resolves as a finding and not a build.

Population and resolved argv read from **his** committed `sat.json`, with the dependency
declared in the pre-registration rather than re-derived: re-deriving his argv selector would
grade his selector, which is not this unit's question.

## 17:25 — drives, and the shape check that came first

`inspect-dump.mjs` — one trial drive on the 3-arm cell, to learn the dump's shape before
`measure.mjs` assumed one. It paid for itself: `rows[]` is flat across arms and carries one
entry per **reached** member, recoverable only by cumulative reached-counts, and 2 of that
cell's 3 arms are `unmapped` so the gate reads 1 of 3. `measure.mjs` recovers the grouping and
then **asserts** it (`G3`), because a grouping off by one silently moves a member's figures
onto another arm.

`measure.mjs`, 8 cells × 2 checkers (live + my instrumented copy, identical argv). **`G2`
asserts the derived copy reproduces the live checker's own `GTYPEDDEF`/`TYPED`/`MAPVERDICT`
lines on every cell** — a derived copy that has drifted cannot measure its source. `G4`
refuses outright if `ABSORB_CRIPPLE` is set in the environment, and re-checks each dump's own
recorded cripple per cell. `G0` compares all 10 subjects by blob hash at his rev and mine:
**byte-identical**, so his key is fresh and the disagreement below is a property.

## 17:28 — the result, and both refutations are mine

`V4` **LANDS**: the saturated cell sits inside the non-saturated range on all four candidates.
`V1`, `V3`, `V5` land. **`V2` and `V6` refuted.**

**`V6`'s refutation is the finding.** 2 of 8 cells reach 7 members over 12 context lines and
judge **0 of them** — verified member-by-member off the dumps, not inferred from a summary —
and the gate publishes `GTYPEDDEF ok typed-token defects: 0`. His census calls both NOT
saturated and prices both at 1. So **the cure finds a real §3.4 defect exactly where the live
gate measures nothing**, which is the opposite way round from the saturation reading.

**`V2` was refuted by my own premise, not by the corpus.** I had written that `D2` was "the
wide boundary's measurement". It is not — his cure widens the **token** boundary, `D2` widens
the **context** width. The giveaway was that it disagreed in *both* directions (mine smaller
on 6 cells, larger on 2); a subset relation cannot do that, so the mechanism differs. Had it
disagreed one way only I might have filed it as a corpus property.

## 17:31 — the cure, and I read the CONSUMERS before editing

Two near-misses, both caught by looking at who parses these lines rather than by driving and
finding out:

1. **`MAPVERDICT` must not be appended to.** `unit-464rekey-2026-10-30/grade-arms.mjs:17`
   parses it with a `$`-anchored regex. **Ran the regex** against both shapes rather than
   reasoning about it: as it ships `matches, red=GCONFORM`; with ` vacuous=[GTYPEDDEF]`
   appended, `NO MATCH`. Nothing re-drives that instrument. The vacuity list went on its own
   new line.
2. **The coverage line is `TYPEDDEFCOV`, not `GTYPEDDEFCOV`.**
   `unit-464reach-2026-10-31/why-zero-price.mjs:70` derives its gate set with
   `/^(MAPVERDICT|G[A-Z][A-Z0-9]*)\b/`, so a `G`-prefixed label would have minted a phantom
   17th gate that is not in the `gates` object. One character of prefix.

`ok: true` by design. `GCONFORM` is already RED on both vacuous cells (`red=[GCONFORM]`,
`red=[GMUST,GCONFORM]`), read off the drives; reddening here double-counts one defect and
leaves the real harm, which is a **retro-grade** taking a §3.4 credit the gate never issued.
Verdict green, pass labelled.

## 17:32 — grading: 6 of 6, and the pre-cure baseline comes from git

`grade-cure.mjs`. `C1` fires on exactly the cells `D4num == 0` names, with the expectation
**derived** from the measurement rather than typed, so a cell that stops being vacuous moves
it. `C5` prices the cure at **zero newly-red maps**. `C2` keeps all three keyed lines
byte-identical on the 6 non-vacuous cells, which is aimed squarely at his `GREPRO`. `C4` is
the counterfactual and restores the pre-cure line verbatim. `C6` is **labelled** as one
computation read two ways — a `quotedCount` wiring check, not confirmation.

The pre-cure recordings are read with `git show` at a **derived** rev (newest commit touching
this directory that did *not* touch the checker), so a re-drive in this directory cannot
re-stamp what the comparison reads, and a later commit of mine cannot silently become the
baseline. `C0` refuses outright if the worktree checker is identical to the checker at that
rev: a grading run whose subject was never edited grades nothing and must say so.

## Not run this fire, stated so silence stays diagnostic

`npm test`, `npm run typecheck`, the sweep, the stop-condition cell. No file under `packages/`
or `scripts/` was touched; `git status --porcelain -- packages/ scripts/` **empty** at open and
re-checked empty at close. The pre-commit census printed `CENSUS OK` on each commit — that is
not a gate figure and is not offered as one.

## Drain

Mail: the one new inbound read at open and its one newly-measurable item taken and closed in
this same fire. Re-checked at close. Needs-you unchanged at 3. Klatch's recorded exception to
the platform drain baseline applies: bounded fire, checklist done, state written, stop.

**Deferred with named blockers — none newly.** Two items this unit opened are **named without
a deadline and without a blocker**: wiring `GSUBJ` to `MAPVACUOUS` (its vacuity is per-leg and
partial, which needs a call about what a half-vacuous gate reports) and a census of how many
of the 16 gates can pass vacuously at all (a sweep over gate bodies, not a drive).

### Wrap verification — to be appended AFTER the commits it cites

Steps 1–3 go below this line, after the final push, so the verification cannot predate what it
cites.
